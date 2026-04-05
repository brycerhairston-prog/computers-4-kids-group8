// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at BOTTOM.
// Matches court-layout.png: paint rectangle, 3-pt arc (ellipse) with straight corner sections,
// and two diagonal lines separating corner-3 from center-3.

// Ellipse parameters for the 3-point arc: center (200, 490), rx=181, ry=239
// Straight corner sections: x=20 (left) and x=380 (right) from y=500 to y=465
// Left diagonal: (0, 251) to (20, 465)
// Right diagonal: (400, 251) to (380, 465)

// Zone SVG paths (basket at bottom)
export const ZONE_PATHS: Record<number, string> = {
  // Zone 1 – Paint (rectangle at bottom-center)
  1: "M 133,296 L 266,296 L 266,500 L 133,500 Z",

  // Zone 2 – Left mid-range (inside 3pt line, left of center, excluding paint)
  2: "M 20,500 L 20,465 A 181,239 0 0 1 200,251 L 200,296 L 133,296 L 133,500 Z",

  // Zone 3 – Right mid-range (inside 3pt line, right of center, excluding paint)
  3: "M 380,500 L 380,465 A 181,239 0 0 0 200,251 L 200,296 L 266,296 L 266,500 Z",

  // Zone 4 – Left corner three (small corner outside 3pt line, left of diagonal)
  4: "M 0,251 L 20,465 L 20,500 L 0,500 Z",

  // Zone 5 – Center/top three (outside 3pt arc, between diagonals)
  5: "M 0,0 L 0,251 L 20,465 A 181,239 0 1 1 380,465 L 400,251 L 400,0 Z",

  // Zone 6 – Right corner three (small corner outside 3pt line, right of diagonal)
  6: "M 400,251 L 380,465 L 380,500 L 400,500 Z",
};

// Label positions for zone stats
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 400 },
  2: { x: 75, y: 390 },
  3: { x: 325, y: 390 },
  4: { x: 10, y: 440 },
  5: { x: 200, y: 100 },
  6: { x: 390, y: 440 },
};

// Court lines SVG elements as a reusable string
export const COURT_VIEWBOX = "0 0 400 500";

// Determine which zone a point (in percentage coords) falls into
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Zone 1: Paint rectangle
  if (x >= 133 && x <= 266 && y >= 296) return 1;

  // Check if inside the 3-point line
  // Ellipse: center (200, 490), rx=181, ry=239
  const dx = (x - 200) / 181;
  const dy = (490 - y) / 239;
  const insideEllipse = (dx * dx + dy * dy) <= 1;
  // Also count the straight-section rectangles as inside
  const inCornerRect = (x >= 20 && x <= 380 && y >= 465);
  const insideThreePt = insideEllipse || inCornerRect;

  if (insideThreePt) {
    // Inside 3pt but not paint → mid-range
    return x < 200 ? 2 : 3;
  }

  // Outside the 3-point line – determine zone 4, 5, or 6 using diagonal lines
  // Left diagonal: (0, 251) to (20, 465)
  // Right diagonal: (400, 251) to (380, 465)
  let leftDiagX: number;
  if (y < 251) {
    leftDiagX = 0;
  } else if (y > 465) {
    leftDiagX = 20;
  } else {
    leftDiagX = 20 * (y - 251) / (465 - 251);
  }

  let rightDiagX: number;
  if (y < 251) {
    rightDiagX = 400;
  } else if (y > 465) {
    rightDiagX = 380;
  } else {
    rightDiagX = 400 - 20 * (y - 251) / (465 - 251);
  }

  if (x < leftDiagX) return 4;
  if (x > rightDiagX) return 6;
  return 5;
}

// Court line color
export const courtLineColor = "hsl(var(--court-line))";
