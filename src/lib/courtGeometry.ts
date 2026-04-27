```typescript
// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 500 470, basket at TOP.
//
// Real NBA half-court proportions (1ft = 10px):
//   Court: 500 x 470  (50ft x 47ft)
//   Basket: (250, 52)
//   Paint: x=170..330, y=0..190  (16ft wide, 19ft deep)
//   3pt arc: true circle r=237.5, center=(250,52)
//   Corner straights: x=30 and x=470, from y=0 down to y=142
//   Arc bottom: (250, 289.5)
//   Arc-diagonal intersects: (152,248) and (348,248)
//   Diagonals: (170,190)→(95,470) and (330,190)→(405,470)

type Point = { x: number; y: number };

const BASKET: Point = { x: 250, y: 52 };
const ARC_RADIUS    = 237.5;
const PAINT         = { left: 170, right: 330, top: 0, bottom: 190 };

const LEFT_CORNER_ARC: Point   = { x: 30,  y: 142 };
const RIGHT_CORNER_ARC: Point  = { x: 470, y: 142 };
const LEFT_ARC_DIAG: Point     = { x: 152, y: 248 };
const RIGHT_ARC_DIAG: Point    = { x: 348, y: 248 };
const LEFT_DIAG_TOP: Point     = { x: 170, y: 190 };
const LEFT_DIAG_BOTTOM: Point  = { x: 95,  y: 470 };
const RIGHT_DIAG_TOP: Point    = { x: 330, y: 190 };
const RIGHT_DIAG_BOTTOM: Point = { x: 405, y: 470 };

export const ZONE_PATHS: Record<number, string> = {

  // Z1 – Paint rectangle
  1: `M 170,0 L 330,0 L 330,190 L 170,190 Z`,

  // Z2 – Left mid-range
  // Baseline (30→170) → down paint left edge → across paint bottom to center
  // → down center line to arc bottom (250,289.5) → 3pt arc CCW to corner stub (30,142)
  2: `M 30,0 L 170,0 L 170,190 L 250,190 L 250,289.5 A 237.5,237.5 0 0,0 30,142 Z`,

  // Z3 – Right mid-range (mirror of Z2)
  3: `M 470,0 L 330,0 L 330,190 L 250,190 L 250,289.5 A 237.5,237.5 0 0,1 470,142 Z`,

  // Z4 – Left corner three
  4: `M 0,0 L 30,0 L 30,142 A 237.5,237.5 0 0,0 152,248 L 95,470 L 0,470 Z`,

  // Z5 – Center three (outside arc, between diagonals)
  5: `M 95,470 L 152,248 A 237.5,237.5 0 0,1 348,248 L 405,470 Z`,

  // Z6 – Right corner three (mirror of Z4)
  6: `M 500,0 L 470,0 L 470,142 A 237.5,237.5 0 0,1 348,248 L 405,470 L 500,470 Z`,
};

export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 250, y: 100 },
  2: { x: 80,  y: 120 },
  3: { x: 420, y: 120 },
  4: { x: 18,  y: 350 },
  5: { x: 250, y: 400 },
  6: { x: 482, y: 350 },
};

export const COURT_VIEWBOX = "0 0 500 470";

// ---------------------------------------------------------------------------
// Hit-test helpers
// ---------------------------------------------------------------------------

function isInsideArc(x: number, y: number): boolean {
  return (x - BASKET.x) ** 2 + (y - BASKET.y) ** 2 <= ARC_RADIUS ** 2;
}

function sideOfLine(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

export function getZoneFromPoint(xPct: number, yPct: number): number {
  const x = (xPct / 100) * 500;
  const y = (yPct / 100) * 470;

  // Z1 – Paint
  if (x >= PAINT.left && x <= PAINT.right && y >= PAINT.top && y <= PAINT.bottom) return 1;

  // Inside 3pt arc → mid-range
  if (isInsideArc(x, y)) return x <= 250 ? 2 : 3;

  // Above corner stub height, outside arc → corner strips
  if (y < LEFT_CORNER_ARC.y) return x <= 250 ? 4 : 6;

  // Outside arc below → split by diagonal lane lines
  const leftSide  = sideOfLine(x, y, LEFT_DIAG_TOP.x,  LEFT_DIAG_TOP.y,  LEFT_DIAG_BOTTOM.x,  LEFT_DIAG_BOTTOM.y);
  const rightSide = sideOfLine(x, y, RIGHT_DIAG_TOP.x, RIGHT_DIAG_TOP.y, RIGHT_DIAG_BOTTOM.x, RIGHT_DIAG_BOTTOM.y);

  if (leftSide  > 0) return 4;
  if (rightSide < 0) return 6;
  return 5;
}

export const courtLineColor = "hsl(var(--court-line))";
```