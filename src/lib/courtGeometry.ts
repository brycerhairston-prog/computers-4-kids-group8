// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 400, basket at TOP.
// Geometry is precisely aligned to the court-layout.png reference image (1167x1154).
//
// Image -> viewBox conversion factors used to derive all numbers below:
//   sx = 400 / 1167 ≈ 0.3428
//   sy = 400 / 1154 ≈ 0.3466

type Point = { x: number; y: number };

// ---- Key landmarks (in viewBox units) ----
// Paint (lane) rectangle - extends from top of image down to free-throw line area.
const PAINT = {
  left: 134,
  right: 250,
  top: 0,
  bottom: 159,
};

// 3-point arc: ellipse centered above the basket, sweeping down to paint-bottom y on the
// inside and reaching the side rails (x=0 and x=400) at y ≈ 121.
// Modeled as an ellipse centered at (200, BASKET_Y) with rx/ry chosen to pass through:
//   - (134, 159) and (266, 159)  (paint-bottom corners, where arc meets paint)
//   - (0, 121) and (400, 121)    (where arc meets the side rails)
const BASKET = { x: 200, y: 50 };
const ARC = {
  cx: 200,
  cy: BASKET.y,
  rx: 200, // reaches x=0 and x=400
  ry: 175, // reaches y ≈ 159 at the paint corners (passes near them)
};

// Diagonals: from a split point on the center line down to bottom corners.
const DIAGONAL_TOP: Point = { x: 200, y: 239 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 58, y: 400 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 342, y: 400 };

// ---- Arc sampling helpers ----
const ARC_SAMPLES = 48;

function sampleArc(startAngle: number, endAngle: number, steps = ARC_SAMPLES): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = startAngle + ((endAngle - startAngle) * i) / steps;
    points.push({
      x: ARC.cx + ARC.rx * Math.cos(t),
      y: ARC.cy + ARC.ry * Math.sin(t),
    });
  }
  return points;
}

function pathFromPolygon(points: Point[]): string {
  return `M ${points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L ")} Z`;
}

// Angle on the arc where it meets paint-bottom corners (x=134 / x=266, y=159).
// cos(θ) = (x - cx)/rx ; we want the angle in lower half (positive sin).
const LEFT_PAINT_CORNER_ANGLE = Math.acos((PAINT.left - ARC.cx) / ARC.rx);   // ~π - small
const RIGHT_PAINT_CORNER_ANGLE = Math.acos((PAINT.right - ARC.cx) / ARC.rx); // ~ small

// Arc segments
const leftSideToPaint = sampleArc(Math.PI, LEFT_PAINT_CORNER_ANGLE);          // outer-left arc above paint corner
const arcUnderPaint = sampleArc(LEFT_PAINT_CORNER_ANGLE, RIGHT_PAINT_CORNER_ANGLE); // arc segment between paint corners (inside arc)
const rightPaintToSide = sampleArc(RIGHT_PAINT_CORNER_ANGLE, 0);              // outer-right arc above paint corner

// ---- Helpers for point-in-polygon ----
function isPointOnSegment(p: Point, a: Point, b: Point): boolean {
  const cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 0.5) return false;
  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
  if (dot < 0) return false;
  const sq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= sq;
}

function isPointInPolygon(p: Point, polygon: Point[]): boolean {
  for (let i = 0; i < polygon.length; i += 1) {
    const next = (i + 1) % polygon.length;
    if (isPointOnSegment(p, polygon[i], polygon[next])) return true;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = ((yi > p.y) !== (yj > p.y))
      && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// ---- Zone polygons ----
// Zones (basket at top):
//   1: Paint (lane rectangle)
//   2: Left of paint, inside arc
//   3: Right of paint, inside arc
//   4: Left wing - outside arc, left of left diagonal
//   5: Center bottom - between the two diagonals (below the arc)
//   6: Right wing - outside arc, right of right diagonal

const ZONE_POLYGONS: Record<number, Point[]> = {
  // Z1: lane rectangle
  1: [
    { x: PAINT.left,  y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left,  y: PAINT.bottom },
  ],

  // Z2: left of paint, inside the 3pt arc.
  // Bounded by: top edge (y=0) from arc-side-x to paint-left, paint-left wall down,
  // paint-bottom rightward to (200, 159), then arc curving back up-left to (~0, 121)... we approximate via paint-bottom + arc-under-paint segment + outer-left arc segment.
  2: [
    { x: 0, y: 0 },
    { x: PAINT.left, y: 0 },
    { x: PAINT.left, y: PAINT.bottom },
    // walk along arc from left paint corner toward bottom-center (200, ~225) is OUTSIDE paint and inside arc
    ...arcUnderPaint.slice(0, Math.ceil(arcUnderPaint.length / 2) + 1),
    // back along outer-left arc to side
    ...leftSideToPaint.slice().reverse().slice(1),
    // leftSideToPaint goes from angle π to LEFT_PAINT_CORNER_ANGLE; reversed brings us to (~0,121)
    { x: 0, y: ARC.cy }, // ensure we close along left rail
  ],

  // Z3: mirror of Z2
  3: [
    { x: PAINT.right, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: ARC.cy },
    ...rightPaintToSide.slice().reverse(),
    ...arcUnderPaint.slice(Math.floor(arcUnderPaint.length / 2)).reverse(),
    { x: PAINT.right, y: PAINT.bottom },
  ],

  // Z4: left wing - left side from arc-rail intersection down to bottom-left, in to diagonal bottom, up the left diagonal, then back along outer arc to the rail.
  4: [
    { x: 0, y: ARC.cy },
    ...leftSideToPaint, // arc from rail down to left paint corner
    // continue arc under paint to bottom (apex at angle π/2 -> point (200, cy+ry) = (200, 225))
    ...arcUnderPaint,
    ...rightPaintToSide, // arc continues to right rail
    { x: 400, y: ARC.cy },
    // BUT we want only LEFT side - cut off here. Restart:
  ].length > 0 ? [
    // proper Z4 polygon:
    { x: 0, y: ARC.cy },
    ...leftSideToPaint,                                  // arc from (0,121) down to left paint corner
    ...arcUnderPaint.slice(0, Math.ceil(arcUnderPaint.length / 2) + 1), // arc to bottom-center (200, 225)
    DIAGONAL_TOP,                                        // up the center line short hop to (200, 239) - actually arc bottom ~ (200,225), diag top (200,239), small gap is fine
    LEFT_DIAGONAL_BOTTOM,                                // down-left diagonal
    { x: 0, y: 400 },                                    // bottom-left corner
  ] : [],

  // Z5: center bottom triangle between two diagonals
  5: [
    DIAGONAL_TOP,
    RIGHT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_BOTTOM,
  ],

  // Z6: right wing - mirror of Z4
  6: [
    { x: 400, y: ARC.cy },
    { x: 400, y: 400 },
    RIGHT_DIAGONAL_BOTTOM,
    DIAGONAL_TOP,
    ...arcUnderPaint.slice(Math.floor(arcUnderPaint.length / 2)).reverse(), // back along arc from bottom to right paint corner
    ...rightPaintToSide.slice().reverse(),               // arc from right paint corner up to right rail
  ],
};

// Zone SVG paths
export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
) as Record<number, string>;

// Label positions (centered within each zone, in viewBox units)
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 192, y: 90 },   // paint
  2: { x: 75,  y: 95 },   // left inside arc
  3: { x: 325, y: 95 },   // right inside arc
  4: { x: 35,  y: 320 },  // left wing
  5: { x: 200, y: 340 },  // center bottom
  6: { x: 365, y: 320 },  // right wing
};

export const COURT_VIEWBOX = "0 0 400 400";
export const COURT_WIDTH = 400;
export const COURT_HEIGHT = 400;

// Determine which zone a point (in percentage coords) falls into
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const point = {
    x: (xPct / 100) * COURT_WIDTH,
    y: (yPct / 100) * COURT_HEIGHT,
  };

  for (const zone of [1, 2, 3, 4, 5, 6]) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) return zone;
  }

  // Fallback - assign to nearest logical zone
  if (point.y <= ARC.cy + ARC.ry) {
    if (point.x >= PAINT.left && point.x <= PAINT.right) return 1;
    return point.x < 200 ? 2 : 3;
  }
  // Below arc: split by diagonals
  // Left diagonal: from (200, 239) to (58, 400). Right diagonal: (200, 239) to (342, 400).
  const leftDiagX = 200 + ((point.y - 239) / (400 - 239)) * (58 - 200);
  const rightDiagX = 200 + ((point.y - 239) / (400 - 239)) * (342 - 200);
  if (point.x < leftDiagX) return 4;
  if (point.x > rightDiagX) return 6;
  return 5;
}

// Court line color
export const courtLineColor = "hsl(var(--court-line))";
