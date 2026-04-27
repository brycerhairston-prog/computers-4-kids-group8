// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at TOP.

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

// Arc bottom — clamped so Z2/Z3 don't sag past the diagonal tops
// Ellipse bottom is at y=306 but that pulls the arc too low visually.
// Instead we close Z2/Z3 at the diagonal top y=285, meeting the arc there.
// Z2 closes: paint-bottom-center (200,198) → left-diag-top on arc (101,285)
// Z3 closes: paint-bottom-center (200,198) → right-diag-top on arc (299,285)
// Then each side follows the arc back up to the extreme.

export const ZONE_PATHS: Record<number, string> = {
  // Z1 – Paint rectangle
  1: `M 135,0 L 265,0 L 265,198 L 135,198 Z`,

  // Z2 – Left mid-range
  // Left arc extreme (6,150) → up to baseline → across to paint top-left (135,0)
  // → down paint left to (135,198) → across to center (200,198)
  // → arc CW (sweep=1) from (200,198) sweeping left down to left-diag-top (101,285)
  // → arc CW (sweep=1) continuing up to left extreme (6,150)
  // All one continuous arc: from (200,198) sweep=1 largeArc=0 to (6,150)
  // passes through (101,285) naturally since it's on the ellipse.
  2: `M 6,150 L 6,0 L 135,0 L 135,198 L 200,198 A 194 156 0 0 1 6,150 Z`,

  // Z3 – Right mid-range (mirror)
  3: `M 394,150 L 394,0 L 265,0 L 265,198 L 200,198 A 194 156 0 0 0 394,150 Z`,

  // Z4 – Left corner three (LEFT side)
  // Left sideline up to left arc extreme → arc sweeping DOWN to left-diag-top → diagonal to bottom
  4: `M 0,0 L 6,0 L 6,150 A 194 156 0 0 0 101,285 L 38,500 L 0,500 Z`,

  // Z5 – Center three
  // Up left diagonal to (101,285) → arc sweeping DOWN through bottom to (299,285)
  // → down right diagonal to bottom
  5: `M 38,500 L 101,285 A 194 156 0 0 1 299,285 L 362,500 Z`,

  // Z6 – Right corner three (RIGHT side, mirror of Z4)
  6: `M 400,0 L 394,0 L 394,150 A 194 156 0 0 1 299,285 L 362,500 L 400,500 Z`,
};

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 120 },
  2: { x: 65, y: 220 },
  3: { x: 335, y: 220 },
  4: { x: 28, y: 390 },
  5: { x: 200, y: 440 },
  6: { x: 374, y: 390 },
};

export const COURT_VIEWBOX = "0 0 400 500";

// ---------------------------------------------------------------------------
// Hit-test helpers
// ---------------------------------------------------------------------------

function isInsideEllipse(x: number, y: number): boolean {
  return ((x - BIG_ARC.cx) / BIG_ARC.rx) ** 2 + ((y - BIG_ARC.cy) / BIG_ARC.ry) ** 2 <= 1;
}

// Returns positive if point (px,py) is to the RIGHT of line a→b,
// negative if to the LEFT.
function sideOfLine(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

export function getZoneFromPoint(xPct: number, yPct: number): number {
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Z1 – Paint
  if (x >= PAINT.left && x <= PAINT.right && y >= PAINT.top && y <= PAINT.bottom) return 1;

  // Inside the 3pt arc → mid-range
  if (isInsideEllipse(x, y)) {
    return x <= 200 ? 2 : 3;
  }

  // Outside arc → 3pt territory.
  // Left diagonal runs from LEFT_DIAGONAL_TOP DOWN to LEFT_DIAGONAL_BOTTOM.
  // A point to the LEFT of this line (negative side) is in Z4.
  // Right diagonal runs from RIGHT_DIAGONAL_TOP DOWN to RIGHT_DIAGONAL_BOTTOM.
  // A point to the RIGHT of this line (positive side) is in Z6.

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

  // Left of the left diagonal → Z4 (left corner)
  if (leftSide > 0) return 4;
  // Right of the right diagonal → Z6 (right corner)
  if (rightSide < 0) return 6;
  // Between the diagonals, outside the arc → Z5 (center three)
  return 5;
}

export const courtLineColor = "hsl(var(--court-line))";
