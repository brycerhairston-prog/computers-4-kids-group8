// Shared court SVG geometry for consistent rendering across components.
// ViewBox: 0 0 400 500, basket at top.

// Arc approximation points (3-point line)
export const ARC_POINTS = [
  [40, 0], [48, 80], [65, 160], [90, 240], [130, 310], [170, 360],
  [200, 380],
  [230, 360], [270, 310], [310, 240], [335, 160], [352, 80], [360, 0],
] as const;

// Zone SVG paths
export const ZONE_PATHS: Record<number, string> = {
  // Zone 1 – Paint (rectangle at top-center)
  1: "M 140,0 L 260,0 L 260,200 L 140,200 Z",
  // Zone 2 – Left mid-range (inside arc, left of paint)
  2: "M 40,0 L 140,0 L 140,200 L 130,310 L 90,240 L 65,160 L 48,80 Z",
  // Zone 3 – Right mid-range (inside arc, right of paint)
  3: "M 260,0 L 360,0 L 352,80 L 335,160 L 310,240 L 270,310 L 260,200 Z",
  // Zone 4 – Left outside arc
  4: "M 0,0 L 40,0 L 48,80 L 65,160 L 90,240 L 130,310 L 120,500 L 0,500 Z",
  // Zone 5 – Bottom center outside arc
  5: "M 120,500 L 130,310 L 170,360 L 200,380 L 230,360 L 270,310 L 280,500 Z",
  // Zone 6 – Right outside arc
  6: "M 360,0 L 400,0 L 400,500 L 280,500 L 270,310 L 310,240 L 335,160 L 352,80 Z",
};

// Label positions for zone stats
export const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 110 },
  2: { x: 80, y: 120 },
  3: { x: 320, y: 120 },
  4: { x: 35, y: 350 },
  5: { x: 200, y: 430 },
  6: { x: 365, y: 350 },
};

// Court lines SVG elements as a reusable string
export const COURT_VIEWBOX = "0 0 400 500";

// Determine which zone a point (in percentage coords) falls into
export function getZoneFromPoint(xPct: number, yPct: number): number {
  // Convert to viewbox coords
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Zone 1: Paint rectangle
  if (x >= 140 && x <= 260 && y <= 200) return 1;

  // Check if inside the 3-point arc using ellipse approximation
  // Arc center at (200, 0), roughly semi-ellipse rx=160, ry=380
  const dx = (x - 200) / 160;
  const dy = y / 380;
  const insideArc = (dx * dx + dy * dy) <= 1;

  if (insideArc) {
    return x < 200 ? 2 : 3;
  }

  // Outside arc – determine zone 4, 5, or 6
  // Use the separator lines: left line from (130,310) to (120,500), right from (270,310) to (280,500)
  // Left separator slope
  const leftSepX = 130 + ((y - 310) / (500 - 310)) * (120 - 130); // interpolate x
  const rightSepX = 270 + ((y - 310) / (500 - 310)) * (280 - 270);

  if (x < leftSepX) return 4;
  if (x > rightSepX) return 6;
  return 5;
}

// Court lines component helper (returns JSX-compatible props)
export const courtLineColor = "hsl(var(--court-line))";
