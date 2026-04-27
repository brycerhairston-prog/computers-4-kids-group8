// Shared court SVG geometry (ViewBox: 0 0 400 500)
type Point = { x: number; y: number };

// Fixed Court Constants
const CANVAS = { w: 400, h: 500 };
const PAINT = { left: 135, right: 265, top: 0, bottom: 190 };
const ARC_CONFIG = { cx: 200, cy: 50, rx: 190, ry: 240 };

// Intersection angles for Zone 5 (Top of Key)
const Z5_LEFT_ANGLE = 1.95; // Radian for left boundary
const Z5_RIGHT_ANGLE = 1.19; // Radian for right boundary

/**
 * Generates points along the 3-point ellipse
 */
function getArcPoints(startAngle: number, endAngle: number, steps = 30): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = startAngle + (endAngle - startAngle) * (i / steps);
    points.push({
      x: ARC_CONFIG.cx + ARC_CONFIG.rx * Math.cos(theta),
      y: ARC_CONFIG.cy + ARC_CONFIG.ry * Math.sin(theta),
    });
  }
  return points;
}

const pathFromPoints = (pts: Point[]) => `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")} Z`;

// Zone Polygon Definitions
const ZONES: Record<number, Point[]> = {
  1: [
    // Paint
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  2: [
    // Left Mid-range
    { x: PAINT.left, y: 0 },
    { x: 10, y: 0 },
    ...getArcPoints(Math.PI, Math.PI / 2).reverse(),
    { x: 200, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  3: [
    // Right Mid-range
    { x: PAINT.right, y: 0 },
    { x: PAINT.right, y: PAINT.bottom },
    { x: 200, y: PAINT.bottom },
    ...getArcPoints(Math.PI / 2, 0),
    { x: 390, y: 0 },
  ],
  4: [
    // Left Corner/Wing 3
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    ...getArcPoints(Math.PI, Z5_LEFT_ANGLE),
    { x: 60, y: 500 },
    { x: 0, y: 500 },
  ],
  5: [
    // Top of Key 3
    { x: 60, y: 500 },
    ...getArcPoints(Z5_LEFT_ANGLE, Z5_RIGHT_ANGLE),
    { x: 340, y: 500 },
  ],
  6: [
    // Right Corner/Wing 3
    { x: 390, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    { x: 340, y: 500 },
    ...getArcPoints(Z5_RIGHT_ANGLE, 0).reverse(),
  ],
};

export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONES).map(([id, pts]) => [Number(id), pathFromPoints(pts)]),
);

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 100 },
  2: { x: 85, y: 120 },
  3: { x: 315, y: 120 },
  4: { x: 40, y: 350 },
  5: { x: 200, y: 420 },
  6: { x: 360, y: 350 },
};

export const COURT_VIEWBOX = "0 0 400 500";

/**
 * Precise point-in-polygon detection for shot placement
 */
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const px = (xPct / 100) * CANVAS.w;
  const py = (yPct / 100) * CANVAS.h;

  const isInside = (p: Point, poly: Point[]) => {
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

  // Check Paint first, then others
  if (isInside({ x: px, y: py }, ZONES[1])) return 1;
  for (let z = 2; z <= 6; z++) {
    if (isInside({ x: px, y: py }, ZONES[z])) return z;
  }
  return 5;
}
