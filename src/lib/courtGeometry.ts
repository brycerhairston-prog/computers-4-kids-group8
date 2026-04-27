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

// Diagonal anchor points for zone 5 (the mid-court fan).
// Top points sit ON the 3-pt arc, near the bottom of the arc, so zone 5
// is "squeezed in" laterally and extended UP to follow the arc.
// Bottom points sit on the bottom edge, pulled inward.
//
// Solved against BIG_ARC: angle measured from positive x-axis.
//   left top: cos θ ≈ -0.309 → θ ≈ 1.885 rad → (140, 298)
//   right top: cos θ ≈  0.309 → θ ≈ 1.257 rad → (260, 298)
const LEFT_DIAGONAL_ANGLE = Math.acos((140 - BIG_ARC.cx) / BIG_ARC.rx);   // ~1.885
const RIGHT_DIAGONAL_ANGLE = Math.acos((260 - BIG_ARC.cx) / BIG_ARC.rx);  // ~1.257

const LEFT_DIAGONAL_TOP: Point = {
  x: BIG_ARC.cx + BIG_ARC.rx * Math.cos(LEFT_DIAGONAL_ANGLE),
  y: BIG_ARC.cy + BIG_ARC.ry * Math.sin(LEFT_DIAGONAL_ANGLE),
};
const RIGHT_DIAGONAL_TOP: Point = {
  x: BIG_ARC.cx + BIG_ARC.rx * Math.cos(RIGHT_DIAGONAL_ANGLE),
  y: BIG_ARC.cy + BIG_ARC.ry * Math.sin(RIGHT_DIAGONAL_ANGLE),
};
const LEFT_DIAGONAL_BOTTOM: Point = { x: 95, y: 500 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 305, y: 500 };

const LEFT_ARC_EXTREME: Point = { x: BIG_ARC.cx - BIG_ARC.rx, y: BIG_ARC.cy };
const RIGHT_ARC_EXTREME: Point = { x: BIG_ARC.cx + BIG_ARC.rx, y: BIG_ARC.cy };
const ARC_BOTTOM: Point = { x: BIG_ARC.cx, y: BIG_ARC.cy + BIG_ARC.ry };

const ARC_SAMPLES = 36;

function sampleEllipseArc(startAngle: number, endAngle: number, steps = ARC_SAMPLES): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = startAngle + ((endAngle - startAngle) * i) / steps;
    points.push({
      x: BIG_ARC.cx + BIG_ARC.rx * Math.cos(t),
      y: BIG_ARC.cy + BIG_ARC.ry * Math.sin(t),
    });
  }
  return points;
}

function pathFromPolygon(points: Point[]): string {
  return `M ${points.map((point) => `${point.x},${point.y}`).join(" L ")} Z`;
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

// Arc segments (angles measured from +x axis, going CCW with y-down means visually CW).
// Left half of arc, from left extreme (θ=π) down to bottom (θ=π/2).
const leftArcToBottom = sampleEllipseArc(Math.PI, Math.PI / 2);
// Bottom of arc to right extreme (θ=π/2 down to θ=0).
const bottomToRightArc = sampleEllipseArc(Math.PI / 2, 0);
// From left extreme along top of arc down to where the left diagonal hits the arc.
const leftOuterArc = sampleEllipseArc(Math.PI, LEFT_DIAGONAL_ANGLE);
// From right diagonal anchor along the arc up to right extreme.
const rightOuterArc = sampleEllipseArc(RIGHT_DIAGONAL_ANGLE, 0);
// The arc segment that forms the TOP boundary of zone 5: from left diagonal anchor to right diagonal anchor.
const zone5TopArc = sampleEllipseArc(LEFT_DIAGONAL_ANGLE, RIGHT_DIAGONAL_ANGLE);

// ---------- Zones ----------
//
// Zone 1: paint rectangle (unchanged).
// Zone 2: inside the 3-pt arc, left of paint center column, EXCLUDING the paint.
//         Bounded on the bottom by the arc itself, NOT by paint-bottom going out
//         past the paint sides — that area now belongs to zone 4.
// Zone 3: mirror of zone 2 on the right side.
// Zone 4: outside the 3-pt arc on the LEFT, plus everything to the left of the
//         left diagonal below the arc, all the way to the bottom-left corner.
// Zone 5: mid fan between the two diagonals, with TOP boundary following the
//         bottom of the 3-pt arc (so it extends up to meet the arc).
// Zone 6: mirror of zone 4.

const ZONE_POLYGONS: Record<number, Point[]> = {
  1: [
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  // Zone 2: top-left corner of the arc area, wrapping under the paint along the arc to center.
  // Path: paint-left top → down paint-left to paint-bottom → along paint-bottom toward center
  //       → down to arc bottom (center x) → follow arc up-left back to left-arc-extreme → top edge → back.
  2: [
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    { x: PAINT.left, y: 0 },
    { x: PAINT.left, y: PAINT.bottom },
    { x: ARC_BOTTOM.x, y: PAINT.bottom },
    ARC_BOTTOM,
    // Arc from bottom (θ=π/2) up to left extreme (θ=π), reversed so we walk CCW.
    ...leftArcToBottom.slice(0, -1).reverse(),
  ],
  // Zone 3: mirror of zone 2.
  3: [
    { x: PAINT.right, y: 0 },
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    RIGHT_ARC_EXTREME,
    // Arc from right extreme (θ=0) down to bottom (θ=π/2).
    ...bottomToRightArc.slice(1).reverse().reverse(), // keep order θ=0 → π/2
    { x: ARC_BOTTOM.x, y: PAINT.bottom },
    { x: PAINT.right, y: PAINT.bottom },
  ],
  // Zone 4: from top-left corner, down the left edge to bottom-left, across to the
  // left diagonal bottom, up the diagonal to where it meets the arc, then follow
  // the arc up-left back to the left extreme, then up to the top-left corner.
  4: [
    { x: 0, y: 0 },
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    LEFT_ARC_EXTREME,
    // Arc from left extreme down to the left diagonal anchor.
    ...leftOuterArc.slice(1),
    LEFT_DIAGONAL_BOTTOM,
    { x: 0, y: 500 },
  ],
  // Zone 5: between the diagonals; TOP boundary follows the bottom of the arc.
  // Path: bottom-left of left diagonal → up to its arc anchor → along arc to right
  //       anchor → down right diagonal to bottom → along bottom edge back.
  5: [
    LEFT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_TOP,
    ...zone5TopArc.slice(1),
    RIGHT_DIAGONAL_BOTTOM,
  ],
  // Zone 6: mirror of zone 4.
  6: [
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    RIGHT_DIAGONAL_BOTTOM,
    // Arc from right diagonal anchor up to right extreme.
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
  4: { x: 25, y: 360 },
  5: { x: 200, y: 410 },
  6: { x: 375, y: 360 },
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

  // Fallback: classify by position relative to the arc and diagonals.
  // Inside the arc → 2 or 3 (or 1 if inside paint).
  const insideArc =
    ((point.x - BIG_ARC.cx) ** 2) / (BIG_ARC.rx ** 2) +
      ((point.y - BIG_ARC.cy) ** 2) / (BIG_ARC.ry ** 2) <= 1;
  if (insideArc) {
    if (
      point.x >= PAINT.left && point.x <= PAINT.right &&
      point.y >= PAINT.top && point.y <= PAINT.bottom
    ) return 1;
    return point.x < BIG_ARC.cx ? 2 : 3;
  }

  // Outside the arc: split by diagonals.
  // Left diagonal line: from LEFT_DIAGONAL_TOP to LEFT_DIAGONAL_BOTTOM.
  // Right diagonal line: from RIGHT_DIAGONAL_TOP to RIGHT_DIAGONAL_BOTTOM.
  function sideOfLine(p: Point, a: Point, b: Point): number {
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  }
  const leftSide = sideOfLine(point, LEFT_DIAGONAL_TOP, LEFT_DIAGONAL_BOTTOM);
  const rightSide = sideOfLine(point, RIGHT_DIAGONAL_TOP, RIGHT_DIAGONAL_BOTTOM);
  if (leftSide < 0) return 4;
  if (rightSide > 0) return 6;
  return 5;
}

// Court line color
export const courtLineColor = "hsl(var(--court-line))";
