// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at TOP.

type Point = { x: number; y: number };

// 1. MASTER DIMENSIONS
const PAINT = { left: 132, right: 268, top: 0, bottom: 195 };
const ARC_PARAMS = { cx: 200, cy: 45, rx: 188, ry: 250 }; // Calibrated ellipse
const LEFT_DIAG = { bottom: { x: 55, y: 500 }, arc_angle: 1.85 }; // Squeezed in
const RIGHT_DIAG = { bottom: { x: 345, y: 500 }, arc_angle: 1.29 }; // Squeezed in

// 2. HELPER FUNCTIONS
function getArcPoint(theta: number): Point {
  return {
    x: ARC_PARAMS.cx + ARC_PARAMS.rx * Math.cos(theta),
    y: ARC_PARAMS.cy + ARC_PARAMS.ry * Math.sin(theta),
  };
}

function sampleArc(start: number, end: number, steps = 30): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (end - start) * (i / steps);
    points.push(getArcPoint(t));
  }
  return points;
}

function pathFromPoints(points: Point[]): string {
  return `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")} Z`;
}

// 3. GENERATE SHARED BOUNDARIES
// Angles: PI is left side, 0 is right side, PI/2 is bottom center.
const angleAtBaselineLeft = Math.PI - 0.2; // Adjusts where 3pt line hits baseline
const angleAtBaselineRight = 0.2;
const angleAtCenter = Math.PI / 2;

const masterArcPoints = {
  z2: sampleArc(angleAtBaselineLeft, angleAtCenter, 20),
  z3: sampleArc(angleAtCenter, angleAtBaselineRight, 20),
  z4: sampleArc(angleAtBaselineLeft, LEFT_DIAG.arc_angle, 15),
  z5: sampleArc(LEFT_DIAG.arc_angle, RIGHT_DIAG.arc_angle, 15),
  z6: sampleArc(RIGHT_DIAG.arc_angle, angleAtBaselineRight, 15),
};

// 4. DEFINE ZONE POLYGONS
const ZONE_POLYGONS: Record<number, Point[]> = {
  1: [
    // The Paint
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  2: [
    // Left Mid-Range
    { x: PAINT.left, y: 0 },
    getArcPoint(angleAtBaselineLeft),
    ...masterArcPoints.z2,
    { x: 200, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  3: [
    // Right Mid-Range
    { x: PAINT.right, y: 0 },
    { x: PAINT.right, y: PAINT.bottom },
    { x: 200, y: PAINT.bottom },
    ...masterArcPoints.z3,
    getArcPoint(angleAtBaselineRight),
  ],
  4: [
    // Left Corner 3
    { x: 0, y: 0 },
    getArcPoint(angleAtBaselineLeft),
    ...masterArcPoints.z4,
    LEFT_DIAG.bottom,
    { x: 0, y: 500 },
  ],
  5: [
    // Center 3 (Squeezed and aligned to Arc)
    LEFT_DIAG.bottom,
    ...masterArcPoints.z5.reverse(),
    RIGHT_DIAG.bottom,
  ],
  6: [
    // Right Corner 3
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    RIGHT_DIAG.bottom,
    ...masterArcPoints.z6.reverse(),
    getArcPoint(angleAtBaselineRight),
  ],
};

// 5. EXPORTS
export const COURT_VIEWBOX = "0 0 400 500";

export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([id, pts]) => [id, pathFromPoints(pts)]),
);

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 100 },
  2: { x: 80, y: 110 },
  3: { x: 320, y: 110 },
  4: { x: 40, y: 380 },
  5: { x: 200, y: 420 },
  6: { x: 360, y: 380 },
};

// Point-in-polygon check for clicks
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Simple checks for common zones first
  if (x >= PAINT.left && x <= PAINT.right && y <= PAINT.bottom) return 1;

  // Calculate distance from ellipse center to check if inside/outside 3pt line
  const dx = x - ARC_PARAMS.cx;
  const dy = y - ARC_PARAMS.cy;
  const dist = (dx * dx) / (ARC_PARAMS.rx * ARC_PARAMS.rx) + (dy * dy) / (ARC_PARAMS.ry * ARC_PARAMS.ry);

  const isInsideArc = dist < 1.0;

  if (isInsideArc) {
    return x < 200 ? 2 : 3;
  } else {
    // Outside arc: Determine 4, 5, or 6 based on X position / diagonals
    // Approximate diagonal checks
    if (x < 110) return 4;
    if (x > 290) return 6;
    return 5;
  }
}
