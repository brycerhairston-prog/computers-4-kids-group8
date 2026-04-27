// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at TOP.
// Geometry is aligned to the full uncropped court-layout image.

type Point = { x: number; y: number };

// ---------------------------------------------------------------------------
// Court constants — tuned to court-layout.png
// ---------------------------------------------------------------------------
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

const LEFT_DIAGONAL_TOP: Point = { x: 101, y: 285 };
const RIGHT_DIAGONAL_TOP: Point = { x: 299, y: 285 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 38, y: 500 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 362, y: 500 };

// ---------------------------------------------------------------------------
// Ellipse helpers
// ---------------------------------------------------------------------------
const ARC_SAMPLES = 48;

function sampleEllipseArc(startAngle: number, endAngle: number, steps = ARC_SAMPLES): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = startAngle + ((endAngle - startAngle) * i) / steps;
    points.push({
      x: BIG_ARC.cx + BIG_ARC.rx * Math.cos(t),
      y: BIG_ARC.cy + BIG_ARC.ry * Math.sin(t),
    });
  }
  return points;
}

function pathFromPolygon(points: Point[]): string {
  return `M ${points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L ")} Z`;
}

// ---------------------------------------------------------------------------
// Key derived points
// ---------------------------------------------------------------------------

const LEFT_ARC_EXTREME: Point = { x: BIG_ARC.cx - BIG_ARC.rx, y: BIG_ARC.cy };
const RIGHT_ARC_EXTREME: Point = { x: BIG_ARC.cx + BIG_ARC.rx, y: BIG_ARC.cy };

const ftSinVal = (PAINT.bottom - BIG_ARC.cy) / BIG_ARC.ry;
const ftAngle = Math.asin(ftSinVal);

const LEFT_ARC_AT_FT: Point = {
  x: BIG_ARC.cx + BIG_ARC.rx * Math.cos(Math.PI - ftAngle),
  y: PAINT.bottom,
};

const RIGHT_ARC_AT_FT: Point = {
  x: BIG_ARC.cx + BIG_ARC.rx * Math.cos(ftAngle),
  y: PAINT.bottom,
};

const LEFT_DIAG_ARC_ANGLE = Math.atan2(
  (LEFT_DIAGONAL_TOP.y - BIG_ARC.cy) / BIG_ARC.ry,
  (LEFT_DIAGONAL_TOP.x - BIG_ARC.cx) / BIG_ARC.rx,
);

const RIGHT_DIAG_ARC_ANGLE = Math.atan2(
  (RIGHT_DIAGONAL_TOP.y - BIG_ARC.cy) / BIG_ARC.ry,
  (RIGHT_DIAGONAL_TOP.x - BIG_ARC.cx) / BIG_ARC.rx,
);

// ---------------------------------------------------------------------------
// Pre-sampled arc segments
// ---------------------------------------------------------------------------

const arcLeftExtremeToLeftDiag = sampleEllipseArc(Math.PI, LEFT_DIAG_ARC_ANGLE);
const arcLeftDiagToFT = sampleEllipseArc(LEFT_DIAG_ARC_ANGLE, Math.PI - ftAngle);
const arcLeftDiagToRightDiag = sampleEllipseArc(LEFT_DIAG_ARC_ANGLE, RIGHT_DIAG_ARC_ANGLE);
const arcRightDiagToFT = sampleEllipseArc(RIGHT_DIAG_ARC_ANGLE, ftAngle);
const arcRightDiagToRightExtreme = sampleEllipseArc(RIGHT_DIAG_ARC_ANGLE, 0);

// ---------------------------------------------------------------------------
// Zone polygons
// ---------------------------------------------------------------------------
const ZONE_POLYGONS: Record<number, Point[]> = {
  // Z1 – Paint (key rectangle)
  1: [
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],

  // Z2 – Left Mid-Range
  2: [
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    { x: PAINT.left, y: 0 },
    { x: PAINT.left, y: PAINT.bottom },
    LEFT_ARC_AT_FT,
    ...arcLeftDiagToFT.slice(1).reverse(),
    LEFT_DIAGONAL_TOP,
    ...arcLeftExtremeToLeftDiag.slice(1).reverse(),
    LEFT_ARC_EXTREME,
  ],

  // Z3 – Right Mid-Range
  3: [
    { x: PAINT.right, y: 0 },
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    RIGHT_ARC_EXTREME,
    ...arcRightDiagToRightExtreme.slice(1).reverse(),
    RIGHT_DIAGONAL_TOP,
    ...arcRightDiagToFT.slice(1),
    RIGHT_ARC_AT_FT,
    { x: PAINT.right, y: PAINT.bottom },
  ],

  // Z4 – Left Corner Three
  4: [
    { x: 0, y: 0 },
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    LEFT_ARC_EXTREME,
    ...arcLeftExtremeToLeftDiag.slice(1),
    LEFT_DIAGONAL_TOP,
    LEFT_DIAGONAL_BOTTOM,
    { x: 0, y: 500 },
  ],

  // Z5 – Center Three
  5: [
    LEFT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_TOP,
    ...arcLeftDiagToRightDiag.slice(1),
    RIGHT_DIAGONAL_TOP,
    RIGHT_DIAGONAL_BOTTOM,
  ],

  // Z6 – Right Corner Three
  6: [
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    RIGHT_DIAGONAL_BOTTOM,
    RIGHT_DIAGONAL_TOP,
    ...arcRightDiagToRightExtreme.slice(1).reverse(),
    RIGHT_ARC_EXTREME,
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
) as Record<number, string>;

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 120 },
  2: { x: 75, y: 105 },
  3: { x: 325, y: 105 },
  4: { x: 25, y: 310 },
  5: { x: 200, y: 365 },
  6: { x: 375, y: 310 },
};

export const COURT_VIEWBOX = "0 0 400 500";

// ---------------------------------------------------------------------------
// Hit-test helpers
// ---------------------------------------------------------------------------

function isPointOnSegment(point: Point, a: Point, b: Point): boolean {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 0.5) return false;
  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
  if (dot < 0) return false;
  const squaredLength = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= squaredLength;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  for (let i = 0; i < polygon.length; i++) {
    if (isPointOnSegment(point, polygon[i], polygon[(i + 1) % polygon.length])) return true;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { x: xi, y: yi } = polygon[i];
    const { x: xj, y: yj } = polygon[j];
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function getZoneFromPoint(xPct: number, yPct: number): number {
  const point: Point = { x: (xPct / 100) * 400, y: (yPct / 100) * 500 };

  for (const zone of [1, 2, 3, 4, 5, 6]) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) return zone;
  }

  // Fallback for edge cases
  const inArc = ((point.x - BIG_ARC.cx) / BIG_ARC.rx) ** 2 + ((point.y - BIG_ARC.cy) / BIG_ARC.ry) ** 2 <= 1;

  if (inArc) return point.x < 200 ? 2 : 3;
  return point.x < 200 ? 4 : 6;
}

export const courtLineColor = "hsl(var(--court-line))";
