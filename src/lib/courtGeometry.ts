// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at TOP.
// Geometry is aligned to the full uncropped court-layout image.

type Point = { x: number; y: number };

const BIG_ARC = {
  cx: 200,
  cy: 128,
  rx: 180,
  ry: 165,
};

const PAINT = {
  left: 133.5,
  right: 266.5,
  top: 0,
  bottom: 200,
};

const LEFT_DIAGONAL_TOP: Point = { x: 108, y: 278 };
const RIGHT_DIAGONAL_TOP: Point = { x: 292, y: 278 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 43, y: 500 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 357, y: 500 };

const LEFT_ARC_EXTREME: Point = { x: BIG_ARC.cx - BIG_ARC.rx, y: BIG_ARC.cy };
const RIGHT_ARC_EXTREME: Point = { x: BIG_ARC.cx + BIG_ARC.rx, y: BIG_ARC.cy };
const ARC_BOTTOM: Point = { x: BIG_ARC.cx, y: BIG_ARC.cy + BIG_ARC.ry };

const ARC_SAMPLES = 36;
const LEFT_DIAGONAL_ANGLE = Math.acos((LEFT_DIAGONAL_TOP.x - BIG_ARC.cx) / BIG_ARC.rx);
const RIGHT_DIAGONAL_ANGLE = Math.acos((RIGHT_DIAGONAL_TOP.x - BIG_ARC.cx) / BIG_ARC.rx);

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

const leftArcToBottom = sampleEllipseArc(Math.PI, Math.PI / 2);
const bottomToRightArc = sampleEllipseArc(Math.PI / 2, 0);
const leftOuterArc = sampleEllipseArc(Math.PI, LEFT_DIAGONAL_ANGLE);
const centerOuterArc = sampleEllipseArc(LEFT_DIAGONAL_ANGLE, RIGHT_DIAGONAL_ANGLE);
const rightOuterArc = sampleEllipseArc(RIGHT_DIAGONAL_ANGLE, 0);

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
    { x: ARC_BOTTOM.x, y: PAINT.bottom },
    ARC_BOTTOM,
    ...leftArcToBottom.slice(0, -1).reverse(),
  ],
  3: [
    { x: PAINT.right, y: 0 },
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    RIGHT_ARC_EXTREME,
    ...bottomToRightArc.slice(0, -1).reverse(),
    ARC_BOTTOM,
    { x: ARC_BOTTOM.x, y: PAINT.bottom },
    { x: PAINT.right, y: PAINT.bottom },
  ],
  4: [
    { x: 0, y: 0 },
    { x: LEFT_ARC_EXTREME.x, y: 0 },
    LEFT_ARC_EXTREME,
    ...leftOuterArc.slice(1),
    LEFT_DIAGONAL_BOTTOM,
    { x: 0, y: 500 },
  ],
  5: [
    LEFT_DIAGONAL_BOTTOM,
    LEFT_DIAGONAL_TOP,
    ...centerOuterArc.slice(1),
    RIGHT_DIAGONAL_BOTTOM,
  ],
  6: [
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    RIGHT_DIAGONAL_BOTTOM,
    ...rightOuterArc,
  ],
};

// Zone SVG paths
export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
) as Record<number, string>;

// Label positions for zone stats
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 110 },
  2: { x: 70, y: 100 },
  3: { x: 330, y: 100 },
  4: { x: 25, y: 300 },
  5: { x: 200, y: 360 },
  6: { x: 375, y: 300 },
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
