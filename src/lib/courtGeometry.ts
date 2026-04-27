// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at TOP.

type Point = { x: number; y: number };

const BIG_ARC = {
  cx: 200,
  cy: 145, // Anchored to match the top of the paint circle
  rx: 194,
  ry: 138, // Shallowed to keep Z2/Z3 from bleeding down
};

const PAINT = {
  left: 135,
  right: 265,
  top: 0,
  bottom: 198,
};

// Precise intersection points for the diagonal lines
const LEFT_DIAGONAL_TOP: Point = { x: 108, y: 280 };
const RIGHT_DIAGONAL_TOP: Point = { x: 292, y: 280 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 45, y: 500 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 355, y: 500 };

const ARC_SAMPLES = 45; // Higher resolution for smoother boundaries

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

// Calculate precise angles for the 3pt line intersections
const leftDiagAngle = Math.atan2(
  LEFT_DIAGONAL_TOP.y - BIG_ARC.cy,
  (LEFT_DIAGONAL_TOP.x - BIG_ARC.cx) * (BIG_ARC.ry / BIG_ARC.rx),
);
const rightDiagAngle = Math.atan2(
  RIGHT_DIAGONAL_TOP.y - BIG_ARC.cy,
  (RIGHT_DIAGONAL_TOP.x - BIG_ARC.cx) * (BIG_ARC.ry / BIG_ARC.rx),
);

const ZONE_POLYGONS: Record<number, Point[]> = {
  1: [
    { x: PAINT.left, y: PAINT.top },
    { x: PAINT.right, y: PAINT.top },
    { x: PAINT.right, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  2: [
    { x: PAINT.left, y: 0 },
    { x: 5, y: 0 }, // Left edge of court
    ...sampleEllipseArc(Math.PI, Math.PI / 2).reverse(),
    { x: 200, y: PAINT.bottom },
    { x: PAINT.left, y: PAINT.bottom },
  ],
  3: [
    { x: PAINT.right, y: 0 },
    { x: 395, y: 0 }, // Right edge of court
    ...sampleEllipseArc(0, Math.PI / 2),
    { x: 200, y: PAINT.bottom },
    { x: PAINT.right, y: PAINT.bottom },
  ],
  4: [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    ...sampleEllipseArc(Math.PI, leftDiagAngle),
    LEFT_DIAGONAL_TOP,
    LEFT_DIAGONAL_BOTTOM,
    { x: 0, y: 500 },
  ],
  5: [
    LEFT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_TOP,
    ...sampleEllipseArc(leftDiagAngle, rightDiagAngle),
    RIGHT_DIAGONAL_TOP,
    RIGHT_DIAGONAL_BOTTOM,
  ],
  6: [
    { x: 395, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    RIGHT_DIAGONAL_BOTTOM,
    RIGHT_DIAGONAL_TOP,
    ...sampleEllipseArc(rightDiagAngle, 0),
  ],
};

export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
);

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 100 },
  2: { x: 75, y: 110 },
  3: { x: 325, y: 110 },
  4: { x: 45, y: 380 },
  5: { x: 200, y: 410 },
  6: { x: 355, y: 380 },
};

export const COURT_VIEWBOX = "0 0 400 500";

export function getZoneFromPoint(xPct: number, yPct: number): number {
  const point = { x: (xPct / 100) * 400, y: (yPct / 100) * 500 };
  for (const zone of [1, 2, 3, 4, 5, 6]) {
    if (isPointInPolygon(point, ZONE_POLYGONS[zone])) return zone;
  }
  return 5;
}
