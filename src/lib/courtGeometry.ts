// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at TOP.
// Geometry is aligned to the full uncropped court-layout image.

type Point = { x: number; y: number };

const BIG_ARC = {
  cx: 200,
  cy: 150,
  rx: 194,
  ry: 156,
};

const PAINT = {
  left: 135,
  right: 265,
  top: 0,
  bottom: 198,
};

// Diagonal sideline anchors (where the corner-3 sidelines meet the arc and the baseline)
const LEFT_DIAGONAL_TOP: Point = { x: 101, y: 285 };
const RIGHT_DIAGONAL_TOP: Point = { x: 299, y: 285 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 38, y: 500 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 362, y: 500 };

const LEFT_ARC_EXTREME: Point = { x: BIG_ARC.cx - BIG_ARC.rx, y: BIG_ARC.cy };
const RIGHT_ARC_EXTREME: Point = { x: BIG_ARC.cx + BIG_ARC.rx, y: BIG_ARC.cy };
const ARC_BOTTOM: Point = { x: BIG_ARC.cx, y: BIG_ARC.cy + BIG_ARC.ry };

const ARC_SAMPLES = 48;

// Angles on the ellipse (parametric t):
//   t = π   → leftmost  (LEFT_ARC_EXTREME)
//   t = π/2 → bottom    (ARC_BOTTOM)
//   t = 0   → rightmost (RIGHT_ARC_EXTREME)
// Diagonal-top points sit ON the arc; derive their parametric angle for exact intersection.
const LEFT_DIAGONAL_ANGLE = Math.atan2(
  (LEFT_DIAGONAL_TOP.y - BIG_ARC.cy) / BIG_ARC.ry,
  (LEFT_DIAGONAL_TOP.x - BIG_ARC.cx) / BIG_ARC.rx,
);
const RIGHT_DIAGONAL_ANGLE = Math.atan2(
  (RIGHT_DIAGONAL_TOP.y - BIG_ARC.cy) / BIG_ARC.ry,
  (RIGHT_DIAGONAL_TOP.x - BIG_ARC.cx) / BIG_ARC.rx,
);

function ellipsePoint(t: number): Point {
  return {
    x: BIG_ARC.cx + BIG_ARC.rx * Math.cos(t),
    y: BIG_ARC.cy + BIG_ARC.ry * Math.sin(t),
  };
}

function sampleEllipseArc(startAngle: number, endAngle: number, steps = ARC_SAMPLES): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = startAngle + ((endAngle - startAngle) * i) / steps;
    points.push(ellipsePoint(t));
  }
  return points;
}

function pathFromPolygon(points: Point[]): string {
  return `M ${points.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`).join(" L ")} Z`;
}

function isPointOnSegment(point: Point, a: Point, b: Point): boolean {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 0.5) return false;

  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
  if (dot < 0) return false;

  const squaredLength = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= squaredLength;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  for (let i = 0; i < polygon.length; i += 1) {
    const next = (i + 1) % polygon.length;
    if (isPointOnSegment(point, polygon[i], polygon[next])) return true;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = ((yi > point.y) !== (yj > point.y))
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

// --- Arc segments (densely sampled — straight-line polygon math stays precise) ---
// INNER halves of the arc — used as the BOTTOM boundary of zones 2 & 3 so they stop EXACTLY at the arc.
const leftInnerArcDown  = sampleEllipseArc(Math.PI, Math.PI / 2); // LEFT_ARC_EXTREME → ARC_BOTTOM
const rightInnerArcDown = sampleEllipseArc(0, Math.PI / 2);        // RIGHT_ARC_EXTREME → ARC_BOTTOM

// OUTER segments of the arc — used as the TOP boundary of zones 4, 5, 6 (they hug the arc from outside).
const leftOuterArc   = sampleEllipseArc(Math.PI, LEFT_DIAGONAL_ANGLE);              // LEFT_ARC_EXTREME → LEFT_DIAGONAL_TOP
const centerOuterArc = sampleEllipseArc(LEFT_DIAGONAL_ANGLE, RIGHT_DIAGONAL_ANGLE); // LEFT_DIAGONAL_TOP → ARC_BOTTOM → RIGHT_DIAGONAL_TOP
const rightOuterArc  = sampleEllipseArc(RIGHT_DIAGONAL_ANGLE, 0);                   // RIGHT_DIAGONAL_TOP → RIGHT_ARC_EXTREME

const ZONE_POLYGONS: Record<number, Point[]> = {
  // Zone 1 — Paint (rectangle)
  1: [
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  // Zone 2 — Left mid-range. Strictly INSIDE the arc.
  //   top:    baseline (LEFT_ARC_EXTREME.x, 0) → (PAINT.left, 0)
  //   right:  paint left edge down to (PAINT.left, PAINT.bottom)
  //   bottom: arc curve from paint corner sweeping out and up to LEFT_ARC_EXTREME
  //           (no flat extension past the arc — the arc IS the bottom edge)
  2: [
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    { x: PAINT.left, y: 0 },
    { x: PAINT.left, y: PAINT.bottom },
    // Walk the arc from ARC_BOTTOM area back to LEFT_ARC_EXTREME (reversed inner-down).
    ...leftInnerArcDown.slice().reverse().slice(1),
  ],
  // Zone 3 — Right mid-range. Mirror of zone 2.
  3: [
    { x: PAINT.right, y: 0 },
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    ...rightInnerArcDown.slice(0, -1),
    { x: PAINT.right, y: PAINT.bottom },
  ],
  // Zone 4 — Left corner-3. Outside the arc on the left.
  //   left:  court wall (x=0)
  //   top:   baseline across to LEFT_ARC_EXTREME
  //   inner: arc segment LEFT_ARC_EXTREME → LEFT_DIAGONAL_TOP (hugs arc from outside)
  //   diag:  LEFT_DIAGONAL_TOP → LEFT_DIAGONAL_BOTTOM
  //   base:  court bottom-left
  4: [
    { x: 0, y: 0 },
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    ...leftOuterArc,
    LEFT_DIAGONAL_BOTTOM,
    { x: 0, y: 500 },
  ],
  // Zone 5 — Top center-3. Outside the arc, bounded by both diagonals.
  //   top:    arc curve LEFT_DIAGONAL_TOP → ARC_BOTTOM → RIGHT_DIAGONAL_TOP (follows curvature)
  //   right:  RIGHT_DIAGONAL_TOP → RIGHT_DIAGONAL_BOTTOM (angled inward, not vertical)
  //   bottom: baseline RIGHT_DIAGONAL_BOTTOM → LEFT_DIAGONAL_BOTTOM
  //   left:   LEFT_DIAGONAL_BOTTOM → LEFT_DIAGONAL_TOP (angled inward)
  5: [
    ...centerOuterArc,
    RIGHT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_BOTTOM,
  ],
  // Zone 6 — Right corner-3. Mirror of zone 4.
  6: [
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    RIGHT_DIAGONAL_BOTTOM,
    ...rightOuterArc.slice().reverse(),
  ],
};

// Zone SVG paths
export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
) as Record<number, string>;

// Label positions for zone stats
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 120 },
  2: { x: 75, y: 105 },
  3: { x: 325, y: 105 },
  4: { x: 25, y: 310 },
  5: { x: 200, y: 365 },
  6: { x: 375, y: 310 },
};

export const COURT_VIEWBOX = "0 0 400 500";

// Determine which zone a point (in percentage coords) falls into
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const point = {
    x: (xPct / 100) * 400,
    y: (yPct / 100) * 500,
  };

  for (const zone of [1, 2, 3, 4, 5, 6]) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) return zone;
  }

  if (point.y <= BIG_ARC.cy + BIG_ARC.ry) {
    return point.x < 200 ? 2 : 3;
  }

  if (point.x < 200) return 4;
  if (point.x > 200) return 6;
  return 5;
}

// Court line color
export const courtLineColor = "hsl(var(--court-line))";

// Debug palette — semi-transparent fills + bold outlines used by ZoneDebugOverlay.
// Toggle the overlay by setting localStorage.c4k_debug_zones = "1" and reloading.
export const ZONE_DEBUG_COLORS: Record<number, string> = {
  1: "rgba(239, 68, 68, 0.35)",   // red    — paint
  2: "rgba(59, 130, 246, 0.35)",  // blue   — left mid
  3: "rgba(34, 197, 94, 0.35)",   // green  — right mid
  4: "rgba(234, 179, 8, 0.35)",   // amber  — left corner-3
  5: "rgba(168, 85, 247, 0.35)",  // purple — center-3
  6: "rgba(236, 72, 153, 0.35)",  // pink   — right corner-3
};

export function isZoneDebugEnabled(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem("c4k_debug_zones") === "1";
  } catch {
    return false;
  }
}

