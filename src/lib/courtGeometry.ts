// courtGeometry.ts

// ------------------
// COURT DIMENSIONS
// ------------------
export const COURT_WIDTH = 500;
export const COURT_HEIGHT = 470;

export const HOOP_X = COURT_WIDTH / 2;
export const HOOP_Y = 80;

// 3PT ARC SETTINGS
export const ARC_RADIUS = 220;

// ------------------
// SAFE ARC FUNCTION
// ------------------
export function getArcY(x: number): number {
  const dx = x - HOOP_X;
  const inside = ARC_RADIUS * ARC_RADIUS - dx * dx;

  // Clamp to prevent NaN
  if (inside <= 0) return HOOP_Y + ARC_RADIUS;

  return HOOP_Y + Math.sqrt(inside);
}

// Clamp X so we never break the arc math
function clampX(x: number): number {
  const min = HOOP_X - ARC_RADIUS + 1;
  const max = HOOP_X + ARC_RADIUS - 1;
  return Math.max(min, Math.min(max, x));
}

// ------------------
// KEY BREAKPOINTS
// ------------------
const LEFT_MID_X = HOOP_X - 60;
const RIGHT_MID_X = HOOP_X + 60;

const LEFT_TOP_X = HOOP_X - 100;
const RIGHT_TOP_X = HOOP_X + 100;

// Clamp everything
const L_MID = clampX(LEFT_MID_X);
const R_MID = clampX(RIGHT_MID_X);
const L_TOP = clampX(LEFT_TOP_X);
const R_TOP = clampX(RIGHT_TOP_X);

// ------------------
// ZONE PATHS
// ------------------

/**
 * ZONE 1 — PAINT (UNCHANGED)
 */
export const zone1 = `
  M ${HOOP_X - 60} 0
  L ${HOOP_X + 60} 0
  L ${HOOP_X + 60} 180
  L ${HOOP_X - 60} 180
  Z
`;

/**
 * ZONE 2 — LEFT MID (FIXED)
 */
export const zone2 = `
  M 0 0
  L ${L_MID} 0
  L ${L_MID} ${getArcY(L_MID)}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 ${clampX(0)} ${getArcY(clampX(0))}
  L 0 0
  Z
`;

/**
 * ZONE 3 — RIGHT MID (FIXED)
 */
export const zone3 = `
  M ${R_MID} 0
  L ${COURT_WIDTH} 0
  L ${COURT_WIDTH} ${getArcY(clampX(COURT_WIDTH))}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${R_MID} ${getArcY(R_MID)}
  L ${R_MID} 0
  Z
`;

/**
 * ZONE 4 — LEFT CORNER 3 (FIXED)
 */
export const zone4 = `
  M 0 ${getArcY(clampX(0))}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${L_TOP} ${getArcY(L_TOP)}
  L ${HOOP_X - 140} ${COURT_HEIGHT}
  L 0 ${COURT_HEIGHT}
  Z
`;

/**
 * ZONE 6 — RIGHT CORNER 3 (FIXED)
 */
export const zone6 = `
  M ${COURT_WIDTH} ${getArcY(clampX(COURT_WIDTH))}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 ${R_TOP} ${getArcY(R_TOP)}
  L ${HOOP_X + 140} ${COURT_HEIGHT}
  L ${COURT_WIDTH} ${COURT_HEIGHT}
  Z
`;

/**
 * ZONE 5 — TOP (FIXED)
 */
export const zone5 = `
  M ${L_TOP} ${getArcY(L_TOP)}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${R_TOP} ${getArcY(R_TOP)}
  L ${HOOP_X + 140} ${COURT_HEIGHT}
  L ${HOOP_X - 140} ${COURT_HEIGHT}
  Z
`;

// ------------------
// EXPORT
// ------------------
export const zones = {
  1: zone1,
  2: zone2,
  3: zone3,
  4: zone4,
  5: zone5,
  6: zone6,
};
