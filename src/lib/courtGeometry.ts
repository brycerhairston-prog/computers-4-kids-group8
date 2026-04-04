// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at BOTTOM.

// Zone SVG paths (basket at bottom)
export const ZONE_PATHS: Record<number, string> = {
  // Zone 1 – Paint (rectangle at bottom-center)
  1: "M 140,300 L 260,300 L 260,500 L 140,500 Z",
  // Zone 2 – Left mid-range (inside arc, left of paint)
  2: "M 40,500 L 140,500 L 140,300 L 130,190 L 90,260 L 65,340 L 48,420 Z",
  // Zone 3 – Right mid-range (inside arc, right of paint)
  3: "M 260,500 L 360,500 L 352,420 L 335,340 L 310,260 L 270,190 L 260,300 Z",
  // Zone 4 – Left outside arc
  4: "M 0,500 L 40,500 L 48,420 L 65,340 L 90,260 L 130,190 L 120,0 L 0,0 Z",
  // Zone 5 – Top center outside arc
  5: "M 120,0 L 130,190 L 170,140 L 200,120 L 230,140 L 270,190 L 280,0 Z",
  // Zone 6 – Right outside arc
  6: "M 360,500 L 400,500 L 400,0 L 280,0 L 270,190 L 310,260 L 335,340 L 352,420 Z",
};

// Label positions for zone stats
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 390 },
  2: { x: 80, y: 380 },
  3: { x: 320, y: 380 },
  4: { x: 35, y: 150 },
  5: { x: 200, y: 70 },
  6: { x: 365, y: 150 },
};

// Court lines SVG elements as a reusable string
export const COURT_VIEWBOX = "0 0 400 500";

// Determine which zone a point (in percentage coords) falls into
export function getZoneFromPoint(xPct: number, yPct: number): number {
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Zone 1: Paint rectangle (bottom center)
  if (x >= 140 && x <= 260 && y >= 300) return 1;

  // Check if inside the 3-point arc using ellipse approximation
  // Arc center at (200, 500), roughly semi-ellipse rx=160, ry=380
  const dx = (x - 200) / 160;
  const dy = (500 - y) / 380;
  const insideArc = (dx * dx + dy * dy) <= 1;

  if (insideArc) {
    return x < 200 ? 2 : 3;
  }

  // Outside arc – determine zone 4, 5, or 6
  const leftSepX = 130 + ((310 - y) / (310 - 0)) * (120 - 130);
  const rightSepX = 270 + ((310 - y) / (310 - 0)) * (280 - 270);

  if (x < leftSepX) return 4;
  if (x > rightSepX) return 6;
  return 5;
}

// Court line color
export const courtLineColor = "hsl(var(--court-line))";
