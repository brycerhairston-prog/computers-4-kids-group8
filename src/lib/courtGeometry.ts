// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at TOP.

type Point = { x: number; y: number };

// Adjusted to sit higher and be tighter to prevent bleeding into lower zones
const BIG_ARC = {
  cx: 200,
  cy: 140, // Raised from 150
  rx: 194,
  ry: 145, // Reduced from 156 to shallow the arc
};

const PAINT = {
  left: 135,
  right: 265,
  top: 0,
  bottom: 198,
};

// Squeezed Zone 5 from left/right and extended slightly upward
const LEFT_DIAGONAL_TOP: Point = { x: 120, y: 275 }; // Narrower and higher
const RIGHT_DIAGONAL_TOP: Point = { x: 280, y: 275 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 50, y: 500 }; // Squeezed in from 38
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 350, y: 500 }; // Squeezed in from 362

const LEFT_ARC_EXTREME: Point = { x: BIG_ARC.cx - BIG_ARC.rx, y: BIG_ARC.cy };
const RIGHT_ARC_EXTREME: Point = { x: BIG_ARC.cx + BIG_ARC.rx, y: BIG_ARC.cy };
const ARC_BOTTOM: Point = { x: BIG_ARC.cx, y: BIG_ARC.cy + BIG_ARC.ry };

const ARC_SAMPLES = 36;

// Helper to create smooth arc paths
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
  return `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;
}

// Polygon inclusion check for getZoneFromPoint
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

const leftArcToBottom = sampleEllipseArc(Math.PI, Math.PI / 2);
const rightArcToBottom = sampleEllipseArc(0, Math.PI / 2);

const ZONE_POLYGONS: Record<number, Point[]> = {
  1: [
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  2: [
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    { x: PAINT.left, y: 0 },
    { x: PAINT.left, y: PAINT.bottom },
    { x: 200, y: PAINT.bottom },
    { x: 200, y: BIG_ARC.cy + BIG_ARC.ry },
    ...leftArcToBottom.slice(0, -1).reverse(),
  ],
  3: [
    { x: PAINT.right, y: 0 },
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    RIGHT_ARC_EXTREME,
    ...rightArcToBottom.slice(1),
    { x: 200, y: BIG_ARC.cy + BIG_ARC.ry },
    { x: 200, y: PAINT.bottom },
    { x: PAINT.right, y: PAINT.bottom },
  ],
  4: [
    { x: 0, y: 0 },
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    LEFT_ARC_EXTREME,
    ...sampleEllipseArc(
      Math.PI,
      Math.atan2(LEFT_DIAGONAL_TOP.y - BIG_ARC.cy, (LEFT_DIAGONAL_TOP.x - BIG_ARC.cx) * (BIG_ARC.ry / BIG_ARC.rx)),
    ).slice(1),
    LEFT_DIAGONAL_TOP,
    LEFT_DIAGONAL_BOTTOM,
    { x: 0, y: 500 },
  ],
  5: [
    LEFT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_TOP,
    ...sampleEllipseArc(
      Math.atan2(LEFT_DIAGONAL_TOP.y - BIG_ARC.cy, (LEFT_DIAGONAL_TOP.x - BIG_ARC.cx) * (BIG_ARC.ry / BIG_ARC.rx)),
      Math.atan2(RIGHT_DIAGONAL_TOP.y - BIG_ARC.cy, (RIGHT_DIAGONAL_TOP.x - BIG_ARC.cx) * (BIG_ARC.ry / BIG_ARC.rx)),
    ).slice(1),
    RIGHT_DIAGONAL_TOP,
    RIGHT_DIAGONAL_BOTTOM,
  ],
  6: [
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    RIGHT_DIAGONAL_BOTTOM,
    RIGHT_DIAGONAL_TOP,
    ...sampleEllipseArc(
      Math.atan2(RIGHT_DIAGONAL_TOP.y - BIG_ARC.cy, (RIGHT_DIAGONAL_TOP.x - BIG_ARC.cx) * (BIG_ARC.ry / BIG_ARC.rx)),
      0,
    ).slice(1),
  ],
};

export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
);

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 100 },
  2: { x: 80, y: 110 },
  3: { x: 320, y: 110 },
  4: { x: 45, y: 350 },
  5: { x: 200, y: 400 },
  6: { x: 355, y: 350 },
};

export const COURT_VIEWBOX = "0 0 400 500";

export function getZoneFromPoint(xPct: number, yPct: number): number {
  const point = { x: (xPct / 100) * 400, y: (yPct / 100) * 500 };
  for (const zone of [1, 2, 3, 4, 5, 6]) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) return zone;
  }
  return 5; // Default fallback
}
