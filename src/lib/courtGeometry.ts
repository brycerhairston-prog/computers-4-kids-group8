// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at BOTTOM.
// Based on court-layout.png lines: paint rectangle, 3-pt arc (ellipse), and two diagonal wing lines.

// Ellipse parameters for the 3-point arc: center (200, 500), rx=195, ry=255
const ARC_CX = 200;
const ARC_CY = 500;
const ARC_RX = 195;
const ARC_RY = 255;

// Key intersection points:
// Arc meets left sideline at ~(5, 465)
// Arc meets right sideline at ~(395, 465)
// Arc top at (200, 245)
// Left diagonal: (30, 0) → (80, 300) on arc
// Right diagonal: (370, 0) → (320, 300) on arc
// Paint: (133, 295) to (266, 500)

// Zone SVG paths (basket at bottom)
export const ZONE_PATHS: Record<number, string> = {
  // Zone 1 – Paint (rectangle at bottom-center)
  1: "M 133,295 L 266,295 L 266,500 L 133,500 Z",

  // Zone 2 – Left mid-range (inside arc, left of paint/center)
  2: "M 5,465 A 195,255 0 0 1 200,245 L 200,295 L 133,295 L 133,500 L 5,500 Z",

  // Zone 3 – Right mid-range (inside arc, right of paint/center)
  3: "M 395,465 A 195,255 0 0 0 200,245 L 200,295 L 266,295 L 266,500 L 395,500 Z",

  // Zone 4 – Left corner three (outside arc, left of left diagonal)
  4: "M 0,0 L 30,0 L 80,300 A 195,255 0 0 1 5,465 L 5,500 L 0,500 Z",

  // Zone 5 – Center/top three (outside arc, between diagonals)
  5: "M 30,0 L 370,0 L 320,300 A 195,255 0 0 0 80,300 Z",

  // Zone 6 – Right corner three (outside arc, right of right diagonal)
  6: "M 400,0 L 370,0 L 320,300 A 195,255 0 0 1 395,465 L 395,500 L 400,500 Z",
};

// Label positions for zone stats
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 400 },
  2: { x: 80, y: 380 },
  3: { x: 320, y: 380 },
  4: { x: 20, y: 250 },
  5: { x: 200, y: 120 },
  6: { x: 380, y: 250 },
};

// Court lines SVG elements as a reusable string
export const COURT_VIEWBOX = "0 0 400 500";

// Determine which zone a point (in percentage coords) falls into
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Zone 1: Paint rectangle
  if (x >= 133 && x <= 266 && y >= 295) return 1;

  // Check if inside the 3-point arc (ellipse: center 200,500, rx=195, ry=255)
  const dx = (x - ARC_CX) / ARC_RX;
  const dy = (ARC_CY - y) / ARC_RY;
  const insideArc = (dx * dx + dy * dy) <= 1;

  if (insideArc) {
    // Inside arc but not paint → mid-range left or right
    return x < 200 ? 2 : 3;
  }

  // Outside the arc – use diagonal lines to determine zone 4, 5, or 6
  // Left diagonal: from (30, 0) to (80, 300) → slope: (300-0)/(80-30) = 6
  // Line equation: y = 6*(x - 30) → x = y/6 + 30
  const leftDiagX = y / 6 + 30;
  // Right diagonal: from (370, 0) to (320, 300) → slope: (300-0)/(320-370) = -6
  // Line equation: y = -6*(x - 370) → x = 370 - y/6
  const rightDiagX = 370 - y / 6;

  if (x < leftDiagX) return 4;
  if (x > rightDiagX) return 6;
  return 5;
}

// Court line color
export const courtLineColor = "hsl(var(--court-line))";
