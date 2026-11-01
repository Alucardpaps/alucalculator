/**
 * hook: useWillisEquation
 * 
 * Multi-Stage kinematic solver for Planetary Gearboxes.
 * Supporting per-stage modules (m) and gear counts (zs, zr).
 */

import { useMemo } from 'react';
import { ratePlanetaryStage, type PlanetaryRatingResult } from '@/lib/planetaryRating';

export type GearboxMode = 'SUN_FIXED' | 'RING_FIXED' | 'CARRIER_FIXED';

export interface StageConfig {
  id: string;
  zs: number; // Sun teeth
  zr: number; // Ring teeth
  m: number;  // Normal module mn
  mode: GearboxMode;
  planetCount: number;
  helixAngle?: number; // β deg; 0 = spur
  faceWidth?: number;  // b mm
}

interface MultiStageGearboxState {
  stages: StageConfig[];
  inputRPM: number;
  inputPowerKW: number;
}

export type StageResult = StageConfig & {
  helixAngle: number;
  faceWidth: number;
  mt: number;
  ratio: number;
  inputRPM: number;
  outputRPM: number;
  ds: number;
  dr: number;
  dp: number;
  zp: number;
  rating: PlanetaryRatingResult;
};

export const useWillisEquation = ({ stages, inputRPM, inputPowerKW }: MultiStageGearboxState) => {
  return useMemo(() => {
    let currentRPM = inputRPM;
    let currentPower = inputPowerKW;
    let totalRatio = 1;
    let inputTorque = inputRPM !== 0 ? (inputPowerKW * 9549.27) / inputRPM : 0;
    let etaTotal = 1;

    const stageResults: StageResult[] = stages.map((stage) => {
      const { zs, zr, m, mode } = stage;
      const betaDeg = stage.helixAngle ?? 0;
      const faceWidth = stage.faceWidth && stage.faceWidth > 0 ? stage.faceWidth : 10 * m;
      const zp = (zr - zs) / 2;

      const fixed: 'ring' | 'sun' | 'carrier' =
        mode === 'SUN_FIXED' ? 'sun' : mode === 'CARRIER_FIXED' ? 'carrier' : 'ring';

      const rating = ratePlanetaryStage({
        zs,
        zr,
        zp,
        planetCount: stage.planetCount,
        mn: m,
        betaDeg,
        faceWidth,
        mode: fixed,
        nInRpm: currentRPM,
        powerKW: currentPower,
        floatingSun: true,
      });

      const stageRatio = rating.i;
      const stageOutputRPM = currentRPM / stageRatio;

      const res: StageResult = {
        ...stage,
        helixAngle: betaDeg,
        faceWidth,
        mt: rating.mt,
        ratio: stageRatio,
        inputRPM: currentRPM,
        outputRPM: stageOutputRPM,
        ds: rating.ds,
        dr: rating.dr,
        dp: rating.dp,
        zp: rating.zp,
        rating,
      };

      currentRPM = stageOutputRPM;
      currentPower *= rating.etaStage;
      totalRatio *= stageRatio;
      etaTotal *= rating.etaStage;
      return res;
    });

    const outputRPM = currentRPM;
    const outputTorque = outputRPM !== 0 ? (inputPowerKW * etaTotal * 9549.27) / Math.abs(outputRPM) : 0;
    const mechanicalAdvantage = Math.abs(totalRatio);

    return {
      stageResults,
      outputRPM,
      outputTorque,
      totalRatio,
      mechanicalAdvantage,
      inputTorque,
      etaTotal,
      powerLossKW: inputPowerKW * (1 - etaTotal),
    };
  }, [stages, inputRPM, inputPowerKW]);
};
