// Shared court SVG geometry (ViewBox: 0 0 400 500)
type Point = { x: number; y: number };

const CANVAS = { w: 400, h: 500 };

// 1. DIMENSIONS SCALED FROM YOUR PNG
const PAINT = { left: 132, right: 268, top: 0, bottom: 196 };
// This arc is calibrated to start exactly at the sidelines
const ARC_CONFIG = { cx: 200, cy: 38, rx: 194, ry: 255 };

// 2. SHARED BOUNDARY POINTS (The "Seams")
// These angles determine where Zone 5 starts and ends on the arc
const Z5_START_ANGLE = 1.98; // Left boundary of Z5
const Z5_END_ANGLE = 1.16; // Right boundary of Z5

const getPointOnArc = (theta: number): Point => ({
  x: ARC_CONFIG.cx + ARC_CONFIG.rx * Math.cos(theta),
  y: ARC_CONFIG.cy + ARC_CONFIG.ry * Math.sin(theta),
});

const sampleArc = (start: number, end: number, steps = 30): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (end - start) * (i / steps);
    points.push(getPointOnArc(t));
  }
  return points;
};

const pathFromPoints = (pts: Point[]) => `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")} Z`;

// 3. ZONE DEFINITIONS
const ZONES: Record<number, Point[]> = {
  1: [
    // Paint
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  2: [
    // Left Mid-range (Inside arc)
    { x: PAINT.left, y: 0 },
    { x: 6, y: 0 },
    ...sampleArc(Math.PI, Math.PI / 2).reverse(),
    { x: 200, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  3: [
    // Right Mid-range (Inside arc)
    { x: PAINT.right, y: 0 },
    { x: PAINT.right, y: PAINT.bottom },
    { x: 200, y: PAINT.bottom },
    ...sampleArc(Math.PI / 2, 0),
    { x: 394, y: 0 },
  ],
  4: [
    // Left Corner 3 (Outside arc)
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    ...sampleArc(Math.PI, Z5_START_ANGLE),
    { x: 52, y: 500 },
    { x: 0, y: 500 },
  ],
  5: [
    // Top of Key 3 (Deep Center)
    { x: 52, y: 500 },
    ...sampleArc(Z5_START_ANGLE, Z5_END_ANGLE),
    { x: 348, y: 500 },
  ],
  6: [
    // Right Corner 3 (Outside arc)
    { x: 394, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    { x: 348, y: 500 },
    ...sampleArc(Z5_END_ANGLE, 0).reverse(),
  ],
};

export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONES).map(([id, pts]) => [Number(id), pathFromPoints(pts)]),
);

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 100 },
  2: { x: 80, y: 115 },
  3: { x: 320, y: 115 },
  4: { x: 35, y: 360 },
  5: { x: 200, y: 430 },
  6: { x: 365, y: 360 },
};

export const COURT_VIEWBOX = `0 0 ${CANVAS.w} ${CANVAS.h}`;

// 4. IMPROVED CLICK DETECTION
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const px = (xPct / 100) * CANVAS.w;
  const py = (yPct / 100) * CANVAS.h;

  const isInsidePoly = (poly: Point[]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x,
        yi = poly[i].y;
      const xj = poly[j].x,
        yj = poly[j].y;
      const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check in order of specificity
  if (isInsidePoly(ZONES[1])) return 1;
  if (isInsidePoly(ZONES[2])) return 2;
  if (isInsidePoly(ZONES[3])) return 3;
  if (isInsidePoly(ZONES[4])) return 4;
  if (isInsidePoly(ZONES[6])) return 6;
  return 5; // Default to Z5 if in outer area
}
