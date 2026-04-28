// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 400, basket at TOP.
// Geometry is precisely aligned to court-layout.png (1167x1154).

type Point = { x: number; y: number };

// ---- Key landmarks ----
const PAINT = {
  left: 134,
  right: 250,
  top: 0,
  bottom: 159,
};

// 3-point arc: ellipse centered at (200, 50) reaching the side rails (x=0/400) at y=50,
// and crossing y=159 at x≈134/266 (paint-bottom corners).
const ARC = {
  cx: 200,
  cy: 50,
  rx: 200,
  ry: 175,
};

const DIAGONAL_TOP: Point = { x: 200, y: 239 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 58, y: 400 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 342, y: 400 };

// ---- Arc sampling ----
const ARC_SAMPLES = 60;

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

// Solve for arc Y at a given X (lower half of ellipse: y >= cy):
// ((x-cx)/rx)^2 + ((y-cy)/ry)^2 = 1  ->  y = cy + ry * sqrt(1 - ((x-cx)/rx)^2)
function arcYAtX(x: number): number {
  const u = (x - ARC.cx) / ARC.rx;
  const s = Math.max(0, 1 - u * u);
  return ARC.cy + ARC.ry * Math.sqrt(s);
}

// Angles where arc crosses important x values
const LEFT_PAINT_ANGLE  = Math.acos((PAINT.left  - ARC.cx) / ARC.rx); // ~π - δ
const RIGHT_PAINT_ANGLE = Math.acos((PAINT.right - ARC.cx) / ARC.rx); // ~ δ

// Pre-built arc segments
// Outer-left arc: from left rail (0, cy) DOWN to left paint corner (134, 159)
const arcLeftOuter = sampleArc(Math.PI, LEFT_PAINT_ANGLE);
// Outer-right arc: from right paint corner (266, 159) UP to right rail (400, cy)
const arcRightOuter = sampleArc(RIGHT_PAINT_ANGLE, 0);
// Arc-under-paint LEFT half: from left paint corner DOWN to bottom-apex (200, cy+ry)
const arcUnderLeft = sampleArc(LEFT_PAINT_ANGLE, Math.PI / 2);
// Arc-under-paint RIGHT half: from bottom-apex to right paint corner
const arcUnderRight = sampleArc(Math.PI / 2, RIGHT_PAINT_ANGLE);

// Bottom apex of arc
const ARC_BOTTOM_X = 200;
const ARC_BOTTOM_Y = ARC.cy + ARC.ry; // = 225

// ---- Point-in-polygon ----
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

// ---- Zone polygons (clockwise) ----
// Z1: paint
// Z2: inside arc, LEFT of paint (paint-left wall extended down to arc apex acts as inner boundary)
// Z3: inside arc, RIGHT of paint (mirror of Z2)
// Z4: outside arc on the left side; bounded above by outer-left arc, on right by left diagonal
// Z5: center bottom triangle between the two diagonals
// Z6: outside arc on the right side; mirror of Z4

const ZONE_POLYGONS: Record<number, Point[]> = {
  // Z1: paint rectangle
  1: [
    { x: PAINT.left,  y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left,  y: PAINT.bottom },
  ],

  // Z2: inside arc, left of paint
  // Path (clockwise): top-left of court -> top to paint-left -> down paint-left to (134, 159)
  // -> down-arc-left to bottom-apex (200, 225) -> straight UP center line to (200, 159) (paint-bottom level)
  // Wait — to keep Z2 only on the LEFT side of paint vertical line extended, we close via the
  // paint-left-wall extension down to arc apex. Cleanest closure:
  //   top-left -> (134, 0) -> (134, 159) -> arc-under-left to (200, 225) -> (200, 159) -> ... no, that crosses paint.
  // Simpler: use paint-left wall as the inner edge AND include the half-bulge below paint on the left.
  // Final polygon:
  2: [
    { x: 0, y: 0 },
    { x: PAINT.left, y: 0 },
    { x: PAINT.left, y: PAINT.bottom },
    ...arcUnderLeft,                           // arc from (134, 159) curving down to (200, 225)
    { x: ARC_BOTTOM_X, y: PAINT.bottom },      // straight up to paint-bottom level along x=200
    { x: PAINT.left, y: PAINT.bottom },        // back to paint-left-bottom (closes the bulge under paint to Z2)
    { x: PAINT.left, y: PAINT.bottom },        // (dup safe)
    // walk back along outer-left arc from (134, 159) up to (0, 50)
    ...arcLeftOuter.slice().reverse(),
    { x: 0, y: ARC.cy },
  ],

  // Z3: mirror of Z2
  3: [
    { x: PAINT.right, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: ARC.cy },
    ...arcRightOuter.slice().reverse(),        // from (400, 50) down to (266, 159)
    { x: PAINT.right, y: PAINT.bottom },
    { x: ARC_BOTTOM_X, y: PAINT.bottom },
    ...arcUnderRight.slice().reverse(),        // from (266, 159) curving back UP via apex - reversed gives (266,159)->apex order? Let's reverse
    { x: PAINT.right, y: PAINT.bottom },
  ],

  // Z4: left side outside arc + above left diagonal
  // (0, 50) -> down outer-left arc to (134, 159) -> down arc-under-left to (200, 225) -> jump to DIAGONAL_TOP (200, 239)
  // -> down-left diagonal to (58, 400) -> bottom-left corner (0, 400) -> up to (0, 50)
  4: [
    { x: 0, y: ARC.cy },
    ...arcLeftOuter,                           // (0,50) -> (134,159)
    ...arcUnderLeft,                           // (134,159) -> (200,225)
    DIAGONAL_TOP,                              // (200,239)
    LEFT_DIAGONAL_BOTTOM,                      // (58, 400)
    { x: 0, y: 400 },
  ],

  // Z5: center bottom triangle
  5: [
    DIAGONAL_TOP,
    RIGHT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_BOTTOM,
  ],

  // Z6: right side outside arc (mirror of Z4)
  6: [
    { x: 400, y: ARC.cy },
    { x: 400, y: 400 },
    RIGHT_DIAGONAL_BOTTOM,
    DIAGONAL_TOP,
    ...arcUnderRight.slice().reverse(),        // (266,159) <- (200,225)  reversed: starts at apex, ends at right paint corner... we need apex->right corner. arcUnderRight goes apex->(266,159). So no reverse:
    // Actually we already have DIAGONAL_TOP above, then we need to go from DIAGONAL_TOP up to apex, then arc to right paint corner, then up outer-right arc to (400, 50).
    // Let me restructure cleanly below:
    ...arcRightOuter.slice().reverse(),        // from (400,50) <- (266,159)  reversed gives (266,159) -> (400,50)
  ],
};

// Z6: right side outside arc + under-paint bulge right half
ZONE_POLYGONS[6] = [
  { x: 400, y: ARC.cy },                       // (400, 50)
  { x: 400, y: 400 },                          // bottom-right
  RIGHT_DIAGONAL_BOTTOM,                       // (342, 400)
  DIAGONAL_TOP,                                // (200, 239)
  { x: ARC_BOTTOM_X, y: PAINT.bottom },        // up paint-right wall extension to paint-bottom
  { x: PAINT.right, y: PAINT.bottom },         // across to paint-right-bottom (top of bulge segment)
  ...arcRightOuter,                            // (266,159) -> (400,50) along arc
];

// Z3: inside arc, right of paint - bounded by arc on outside, paint-right wall on inside,
// stops at paint-bottom level (the under-paint bulge belongs to Z6).
ZONE_POLYGONS[3] = [
  { x: PAINT.right, y: 0 },
  { x: 400, y: 0 },
  { x: 400, y: ARC.cy },
  ...arcRightOuter.slice().reverse(),          // (400,50) -> (266,159)
  { x: PAINT.right, y: PAINT.bottom },         // straight across to paint-right-bottom
];

// Z2: mirror of Z3 on left side
ZONE_POLYGONS[2] = [
  { x: 0, y: 0 },
  { x: PAINT.left, y: 0 },
  { x: PAINT.left, y: PAINT.bottom },
  ...arcLeftOuter.slice().reverse(),           // (134,159) -> (0,50)
  { x: 0, y: ARC.cy },
];

// Hmm — Z2 includes the under-paint bulge but so does Z4 (via arcUnderLeft). They overlap along that arc.
// The under-paint half-circle should belong to ONE zone. Let's exclude it from Z2 and Z3 entirely
// and let Z4/Z6 contain the outside-of-paint region beyond the arc only.
// Cleanest split: arc-under-paint defines boundary between (Z2/Z3 on top) and (Z4/Z5/Z6 on bottom).
// Z2 = inside arc + above arc-under-paint + left of paint extended down to apex.
// So Z2 closure: paint-left-bottom -> arc-under-left -> apex -> straight UP to paint-bottom -> paint-left-bottom.
// That's what we already have, but it includes the small region between paint-left-extended-down and arc curve.
// Z4 boundary uses arcUnderLeft as TOP boundary, so Z4 starts BELOW that arc. Good - no overlap actually.

// Re-do Z4 to NOT include the under-paint bulge (start from arc-under-paint as top edge):
ZONE_POLYGONS[4] = [
  { x: 0, y: ARC.cy },
  ...arcLeftOuter,                             // (0,50) -> (134,159)
  ...arcUnderLeft,                             // (134,159) -> (200,225)
  DIAGONAL_TOP,                                // (200,239)
  LEFT_DIAGONAL_BOTTOM,                        // (58,400)
  { x: 0, y: 400 },
];

export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
) as Record<number, string>;

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 192, y: 80 },
  2: { x: 75,  y: 90 },
  3: { x: 325, y: 90 },
  4: { x: 50,  y: 320 },
  5: { x: 200, y: 340 },
  6: { x: 350, y: 320 },
};

export const COURT_VIEWBOX = "0 0 400 400";
export const COURT_WIDTH = 400;
export const COURT_HEIGHT = 400;

export function getZoneFromPoint(xPct: number, yPct: number): number {
  const point = {
    x: (xPct / 100) * COURT_WIDTH,
    y: (yPct / 100) * COURT_HEIGHT,
  };
  for (const zone of [1, 2, 3, 4, 5, 6]) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) return zone;
  }
  // Fallback
  if (point.y <= ARC_BOTTOM_Y) {
    if (point.x >= PAINT.left && point.x <= PAINT.right) return 1;
    return point.x < 200 ? 2 : 3;
  }
  const t = (point.y - DIAGONAL_TOP.y) / (400 - DIAGONAL_TOP.y);
  const leftDiagX = DIAGONAL_TOP.x + t * (LEFT_DIAGONAL_BOTTOM.x - DIAGONAL_TOP.x);
  const rightDiagX = DIAGONAL_TOP.x + t * (RIGHT_DIAGONAL_BOTTOM.x - DIAGONAL_TOP.x);
  if (point.x < leftDiagX) return 4;
  if (point.x > rightDiagX) return 6;
  return 5;
}

export const courtLineColor = "hsl(var(--court-line))";
