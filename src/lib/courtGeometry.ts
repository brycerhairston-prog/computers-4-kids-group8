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

const LEFT_ARC_EXTREME: Point = { x: 6, y: 150 };
const RIGHT_ARC_EXTREME: Point = { x: 394, y: 150 };
const ARC_BOTTOM: Point = { x: 200, y: 306 };

export const ZONE_PATHS: Record<number, string> = {
  // Z1 – Paint rectangle
  1: `M 135,0 L 265,0 L 265,198 L 135,198 Z`,

  // Z2 – Left mid-range
  // Left arc extreme → baseline → paint top-left → paint bottom-left →
  // paint bottom-center → arc bottom center → arc CCW back to left extreme
  2: `M 6,150 L 6,0 L 135,0 L 135,198 L 200,198 L 200,306 A 194 156 0 0 1 6,150 Z`,

  // Z3 – Right mid-range (mirror of Z2)
  3: `M 394,150 L 394,0 L 265,0 L 265,198 L 200,198 L 200,306 A 194 156 0 0 0 394,150 Z`,

  // Z4 – Left corner three
  // Sideline → left arc extreme → arc down to left diagonal top → diagonal to bottom → sideline
  4: `M 0,0 L 6,0 L 6,150 A 194 156 0 0 0 101,285 L 38,500 L 0,500 Z`,

  // Z5 – Center three
  // Bottom-left corner → up left diagonal → arc down through (200,306) to right diagonal top
  // → down right diagonal → bottom-right corner
  5: `M 38,500 L 101,285 A 194 156 0 0 1 299,285 L 362,500 Z`,

  // Z6 – Right corner three (mirror of Z4)
  6: `M 394,0 L 400,0 L 400,500 L 362,500 L 299,285 A 194 156 0 0 0 394,150 L 394,0 Z`,
};

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 120 },
  2: { x: 65, y: 240 },
  3: { x: 335, y: 240 },
  4: { x: 28, y: 370 },
  5: { x: 200, y: 430 },
  6: { x: 374, y: 370 },
};

export const COURT_VIEWBOX = "0 0 400 500";

// ---------------------------------------------------------------------------
// Hit-test
// ---------------------------------------------------------------------------

function isInsideEllipse(x: number, y: number): boolean {
  return ((x - BIG_ARC.cx) / BIG_ARC.rx) ** 2 + ((y - BIG_ARC.cy) / BIG_ARC.ry) ** 2 <= 1;
}

function sideOfLine(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

export function getZoneFromPoint(xPct: number, yPct: number): number {
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Z1 – Paint
  if (x >= PAINT.left && x <= PAINT.right && y >= PAINT.top && y <= PAINT.bottom) return 1;

  const inArc = isInsideEllipse(x, y);

  if (inArc) {
    if (x < 200) return 2;
    if (x > 200) return 3;
    return 1;
  }

  // Outside arc → three-point territory
  const leftSide = sideOfLine(
    x,
    y,
    LEFT_DIAGONAL_TOP.x,
    LEFT_DIAGONAL_TOP.y,
    LEFT_DIAGONAL_BOTTOM.x,
    LEFT_DIAGONAL_BOTTOM.y,
  );
  const rightSide = sideOfLine(
    x,
    y,
    RIGHT_DIAGONAL_TOP.x,
    RIGHT_DIAGONAL_TOP.y,
    RIGHT_DIAGONAL_BOTTOM.x,
    RIGHT_DIAGONAL_BOTTOM.y,
  );

  if (leftSide < 0) return 4;
  if (rightSide > 0) return 6;
  return 5;
}

export const courtLineColor = "hsl(var(--court-line))";
