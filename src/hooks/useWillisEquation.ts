/**
 * hook: useWillisEquation
 * 
 * Multi-Stage kinematic solver for Planetary Gearboxes.
 * Supporting per-stage modules (m) and gear counts (zs, zr).
 */

import { useMemo } from 'react';

export type GearboxMode = 'SUN_FIXED' | 'RING_FIXED' | 'CARRIER_FIXED';

export interface StageConfig {
  id: string;
  zs: number; // Sun teeth
  zr: number; // Ring teeth
  m: number;  // Module
  mode: GearboxMode;
  planetCount: number;
}

interface MultiStageGearboxState {
  stages: StageConfig[];
  inputRPM: number;
  inputPowerKW: number;
}

export const useWillisEquation = ({ stages, inputRPM, inputPowerKW }: MultiStageGearboxState) => {
  return useMemo(() => {
    let currentRPM = inputRPM;
    let totalRatio = 1;
    let inputTorque = inputRPM !== 0 ? (inputPowerKW * 9549.27) / inputRPM : 0;
    
    const stageResults = stages.map((stage) => {
      let stageRatio = 0;
      const { zs, zr, m, mode } = stage;

      // Kinematics Mode Logic
      switch (mode) {
        case 'SUN_FIXED':
          stageRatio = 1 + zs / zr;
          break;
        case 'RING_FIXED':
          stageRatio = 1 + zr / zs;
          break;
        case 'CARRIER_FIXED':
          stageRatio = -zr / zs;
          break;
      }

      const stageOutputRPM = currentRPM / stageRatio;
      
      // Geometry Logic
      const ds = m * zs; // Sun Diameter
      const dr = m * zr; // Ring Diameter
      const dp = (dr - ds) / 2; // Planet Diameter
      const zp = (zr - zs) / 2; // Planet Teeth (Ideal)

      const res = {
        ...stage,
        ratio: stageRatio,
        inputRPM: currentRPM,
        outputRPM: stageOutputRPM,
        ds, dr, dp, zp
      };

      currentRPM = stageOutputRPM;
      totalRatio *= stageRatio;
      return res;
    });

    const outputRPM = currentRPM;
    const outputTorque = outputRPM !== 0 ? (inputPowerKW * 9549.27) / Math.abs(outputRPM) : 0;
    const mechanicalAdvantage = Math.abs(totalRatio);

    return {
      stageResults,
      outputRPM,
      outputTorque,
      totalRatio,
      mechanicalAdvantage,
      inputTorque
    };
  }, [stages, inputRPM, inputPowerKW]);
};
