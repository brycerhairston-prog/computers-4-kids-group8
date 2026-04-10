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

const LEFT_DIAGONAL_TOP: Point = { x: 101, y: 285 };
const RIGHT_DIAGONAL_TOP: Point = { x: 299, y: 285 };
const LEFT_DIAGONAL_BOTTOM: Point = { x: 38, y: 500 };
const RIGHT_DIAGONAL_BOTTOM: Point = { x: 362, y: 500 };

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
const rightArcToBottom = sampleEllipseArc(0, Math.PI / 2);
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
    ...rightArcToBottom.slice(1),
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

// Zone SVG paths (original — used for click detection)
export const ZONE_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
) as Record<number, string>;

// --- Inset geometry for visual rendering (colors stay inside court lines) ---
const INSET = 2;

const INSET_BIG_ARC = {
  cx: BIG_ARC.cx,
  cy: BIG_ARC.cy,
  rx: BIG_ARC.rx - INSET,
  ry: BIG_ARC.ry - INSET,
};

const INSET_PAINT = {
  left: PAINT.left + INSET,
  right: PAINT.right - INSET,
  top: PAINT.top,
  bottom: PAINT.bottom - INSET,
};

const INSET_LEFT_ARC_EXTREME: Point = { x: INSET_BIG_ARC.cx - INSET_BIG_ARC.rx, y: INSET_BIG_ARC.cy };
const INSET_RIGHT_ARC_EXTREME: Point = { x: INSET_BIG_ARC.cx + INSET_BIG_ARC.rx, y: INSET_BIG_ARC.cy };
const INSET_ARC_BOTTOM: Point = { x: INSET_BIG_ARC.cx, y: INSET_BIG_ARC.cy + INSET_BIG_ARC.ry };

function sampleInsetEllipseArc(startAngle: number, endAngle: number, steps = ARC_SAMPLES): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = startAngle + ((endAngle - startAngle) * i) / steps;
    points.push({
      x: INSET_BIG_ARC.cx + INSET_BIG_ARC.rx * Math.cos(t),
      y: INSET_BIG_ARC.cy + INSET_BIG_ARC.ry * Math.sin(t),
    });
  }
  return points;
}

const INSET_LEFT_DIAGONAL_ANGLE = Math.acos((LEFT_DIAGONAL_TOP.x - INSET_BIG_ARC.cx) / INSET_BIG_ARC.rx);
const INSET_RIGHT_DIAGONAL_ANGLE = Math.acos((RIGHT_DIAGONAL_TOP.x - INSET_BIG_ARC.cx) / INSET_BIG_ARC.rx);

const insetLeftArcToBottom = sampleInsetEllipseArc(Math.PI, Math.PI / 2);
const insetRightArcToBottom = sampleInsetEllipseArc(0, Math.PI / 2);
const insetLeftOuterArc = sampleInsetEllipseArc(Math.PI, INSET_LEFT_DIAGONAL_ANGLE);
const insetCenterOuterArc = sampleInsetEllipseArc(INSET_LEFT_DIAGONAL_ANGLE, INSET_RIGHT_DIAGONAL_ANGLE);
const insetRightOuterArc = sampleInsetEllipseArc(INSET_RIGHT_DIAGONAL_ANGLE, 0);

// Perpendicular inset for the diagonal lines
const leftDx = LEFT_DIAGONAL_BOTTOM.x - LEFT_DIAGONAL_TOP.x;
const leftDy = LEFT_DIAGONAL_BOTTOM.y - LEFT_DIAGONAL_TOP.y;
const leftLen = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
const leftNx = leftDy / leftLen;   // normal x (pointing inward/right)
const leftNy = -leftDx / leftLen;  // normal y

const INSET_LEFT_DIAGONAL_TOP: Point = { x: LEFT_DIAGONAL_TOP.x + leftNx * INSET, y: LEFT_DIAGONAL_TOP.y + leftNy * INSET };
const INSET_LEFT_DIAGONAL_BOTTOM: Point = { x: LEFT_DIAGONAL_BOTTOM.x + leftNx * INSET, y: LEFT_DIAGONAL_BOTTOM.y + leftNy * INSET };

const rightDx = RIGHT_DIAGONAL_BOTTOM.x - RIGHT_DIAGONAL_TOP.x;
const rightDy = RIGHT_DIAGONAL_BOTTOM.y - RIGHT_DIAGONAL_TOP.y;
const rightLen = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
const rightNx = -rightDy / rightLen;  // normal x (pointing inward/left)
const rightNy = rightDx / rightLen;   // normal y

const INSET_RIGHT_DIAGONAL_TOP: Point = { x: RIGHT_DIAGONAL_TOP.x + rightNx * INSET, y: RIGHT_DIAGONAL_TOP.y + rightNy * INSET };
const INSET_RIGHT_DIAGONAL_BOTTOM: Point = { x: RIGHT_DIAGONAL_BOTTOM.x + rightNx * INSET, y: RIGHT_DIAGONAL_BOTTOM.y + rightNy * INSET };

const ZONE_FILL_POLYGONS: Record<number, Point[]> = {
  1: [
    { x: INSET_PAINT.left, y: INSET_PAINT.top },
    { x: INSET_PAINT.right, y: INSET_PAINT.top },
    { x: INSET_PAINT.right, y: INSET_PAINT.bottom },
    { x: INSET_PAINT.left, y: INSET_PAINT.bottom },
  ],
  2: [
    { x: INSET_LEFT_ARC_EXTREME.x, y: 0 },
    { x: INSET_PAINT.left, y: 0 },
    { x: INSET_PAINT.left, y: INSET_PAINT.bottom },
    { x: INSET_ARC_BOTTOM.x, y: INSET_PAINT.bottom },
    INSET_ARC_BOTTOM,
    ...insetLeftArcToBottom.slice(0, -1).reverse(),
  ],
  3: [
    { x: INSET_PAINT.right, y: 0 },
    { x: INSET_RIGHT_ARC_EXTREME.x, y: 0 },
    INSET_RIGHT_ARC_EXTREME,
    ...insetRightArcToBottom.slice(1),
    { x: INSET_ARC_BOTTOM.x, y: INSET_PAINT.bottom },
    { x: INSET_PAINT.right, y: INSET_PAINT.bottom },
  ],
  4: [
    { x: 0, y: 0 },
    { x: INSET_LEFT_ARC_EXTREME.x, y: 0 },
    INSET_LEFT_ARC_EXTREME,
    ...insetLeftOuterArc.slice(1),
    INSET_LEFT_DIAGONAL_TOP,
    INSET_LEFT_DIAGONAL_BOTTOM,
    { x: 0, y: 500 },
  ],
  5: [
    INSET_LEFT_DIAGONAL_BOTTOM,
    INSET_LEFT_DIAGONAL_TOP,
    ...insetCenterOuterArc.slice(1),
    INSET_RIGHT_DIAGONAL_TOP,
    INSET_RIGHT_DIAGONAL_BOTTOM,
  ],
  6: [
    { x: INSET_RIGHT_ARC_EXTREME.x, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 500 },
    INSET_RIGHT_DIAGONAL_BOTTOM,
    INSET_RIGHT_DIAGONAL_TOP,
    ...insetRightOuterArc,
  ],
};

// Zone fill paths (inset — used for visual rendering so colors stay inside lines)
export const ZONE_FILL_PATHS: Record<number, string> = Object.fromEntries(
  Object.entries(ZONE_FILL_POLYGONS).map(([zone, polygon]) => [Number(zone), pathFromPolygon(polygon)]),
) as Record<number, string>;

// Label positions for zone stats
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 120 },
  2: { x: 75, y: 105 },
  3: { x: 325, y: 105 },
  4: { x: 25, y: 310 },
  5: { x: 200, y: 365 },
  6: { x: 375, y: 310 },
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
