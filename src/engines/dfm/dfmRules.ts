/**
 * DFM Engineering Rules & Standard Thresholds
 *
 * Grounded in:
 * - VDI 2230: Systematic calculation of high duty bolted joints (edge distance & thread engagement)
 * - EN 12020: Extruded precision aluminum profiles (wall thickness & lip integrity)
 * - ISO 965: ISO general purpose metric screw threads (tolerances & blind hole chip clearance)
 * - ISO 2768-m: General geometrical tolerances
 */

export const DFM_THRESHOLDS = {
  // Absolute minimum wall thickness
  minWallCnc: 0.8, // mm (CNC milling)
  minWallExtrusion: 1.2, // mm (Al extrusion)

  // Hole-to-hole spacing
  holeHoleMinWallMultiplier: 0.5, // remaining wall = 0.5 * D

  // Hole-to-edge center distance
  edgeCenterAlMultiplier: 1.5, // 1.5 * D for Aluminum (VDI 2230)
  edgeCenterSteelMultiplier: 1.2, // 1.2 * D for Steel
  edgeRemainingWallCriticalMultiplier: 0.5, // Remaining wall < 0.5 * D is CRITICAL tearout risk

  // Tap thread engagement
  tapEngagementAlMultiplier: 1.5, // 1.5 * D for Aluminum 6061/6063
  tapEngagementAlCriticalMultiplier: 1.0, // < 1.0 * D strips threads under torque
  tapEngagementSteelMultiplier: 1.0, // 1.0 * D for Steel

  // Blind tap bottom chip clearance
  blindTapChipPitchMultiplier: 2.0, // 2 * P required beyond thread length
};

export interface MaterialDfmConfig {
  tapEngagementMultiplier: number;
  tapCriticalMultiplier: number;
  edgeCenterMultiplier: number;
  minWall: number;
}

export function getMaterialDfmConfig(materialId?: string): MaterialDfmConfig {
  const isSteel = materialId?.includes('steel') || materialId?.includes('fe');
  if (isSteel) {
    return {
      tapEngagementMultiplier: DFM_THRESHOLDS.tapEngagementSteelMultiplier,
      tapCriticalMultiplier: 0.8,
      edgeCenterMultiplier: DFM_THRESHOLDS.edgeCenterSteelMultiplier,
      minWall: 0.6,
    };
  }
  // Default Aluminum (6061-T6, 6063-T5, etc.)
  return {
    tapEngagementMultiplier: DFM_THRESHOLDS.tapEngagementAlMultiplier,
    tapCriticalMultiplier: DFM_THRESHOLDS.tapEngagementAlCriticalMultiplier,
    edgeCenterMultiplier: DFM_THRESHOLDS.edgeCenterAlMultiplier,
    minWall: DFM_THRESHOLDS.minWallCnc,
  };
}
