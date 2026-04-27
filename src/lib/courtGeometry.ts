// courtGeometry.ts
// Clean, no-overlap 6-zone geometry using shared arc math

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
// ARC MATH (SHARED)
// ------------------
export function getArcY(x: number): number {
  const dx = x - HOOP_X;
  const inside = ARC_RADIUS * ARC_RADIUS - dx * dx;

  // Prevent NaN from floating point issues
  return HOOP_Y + Math.sqrt(Math.max(0, inside));
}

// ------------------
// ZONE PATHS
// ------------------

/**
 * ZONE 1 — PAINT (KEEP SIMPLE / CENTERED)
 */
export const zone1 = `
  M ${HOOP_X - 60} 0
  L ${HOOP_X + 60} 0
  L ${HOOP_X + 60} 180
  L ${HOOP_X - 60} 180
  Z
`;

/**
 * ZONE 2 — LEFT MID (FIXED: ARC BOUNDARY)
 */
export const zone2 = `
  M 0 0
  L ${HOOP_X - 60} 0
  L ${HOOP_X - 60} ${getArcY(HOOP_X - 60)}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 0 ${getArcY(0)}
  Z
`;

/**
 * ZONE 3 — RIGHT MID (MIRROR)
 */
export const zone3 = `
  M ${HOOP_X + 60} 0
  L ${COURT_WIDTH} 0
  L ${COURT_WIDTH} ${getArcY(COURT_WIDTH)}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${HOOP_X + 60} ${getArcY(HOOP_X + 60)}
  Z
`;

/**
 * ZONE 4 — LEFT CORNER 3 (FIXED: MEETS ARC CLEANLY)
 */
export const zone4 = `
  M 0 ${getArcY(0)}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${HOOP_X - 100} ${getArcY(HOOP_X - 100)}
  L ${HOOP_X - 140} ${COURT_HEIGHT}
  L 0 ${COURT_HEIGHT}
  Z
`;

/**
 * ZONE 6 — RIGHT CORNER 3 (MIRROR)
 */
export const zone6 = `
  M ${COURT_WIDTH} ${getArcY(COURT_WIDTH)}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 ${HOOP_X + 100} ${getArcY(HOOP_X + 100)}
  L ${HOOP_X + 140} ${COURT_HEIGHT}
  L ${COURT_WIDTH} ${COURT_HEIGHT}
  Z
`;

/**
 * ZONE 5 — TOP 3 (FIXED: NARROW + CURVED TOP)
 */
export const zone5 = `
  M ${HOOP_X - 100} ${getArcY(HOOP_X - 100)}
  A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${HOOP_X + 100} ${getArcY(HOOP_X + 100)}
  L ${HOOP_X + 140} ${COURT_HEIGHT}
  L ${HOOP_X - 140} ${COURT_HEIGHT}
  Z
`;

// ------------------
// EXPORT ALL ZONES
// ------------------
export const zones = {
  1: zone1,
  2: zone2,
  3: zone3,
  4: zone4,
  5: zone5,
  6: zone6,
};
