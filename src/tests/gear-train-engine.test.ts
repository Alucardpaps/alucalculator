import { describe, it, expect } from 'vitest';
import {
  solveGearTrain,
  computeGearManufacturingData,
  GearTrainNode,
  DEFAULT_COMPOUND_PRESET,
  THREE_STAGE_HEAVY_PRESET,
  BEVEL_HELICAL_PRESET,
  PLANETARY_TRAIN_PRESET,
  INTERNAL_HYBRID_PRESET,
  DUAL_PLANETARY_CASCADE_PRESET,
} from '../data/gearTrainEngine';

describe('Multi-Gear & Compound Gear Train Kinematics Engine', () => {
  it('solves simple 2-gear reduction mesh accurately', () => {
    const nodes: GearTrainNode[] = [
      { id: 'g1', name: 'Pinion (z1)', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 20, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '16MnCr5' },
      { id: 'g2', name: 'Wheel (z2)', shaftId: 2, isCoaxial: false, gearType: 'external', teeth: 60, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '16MnCr5' },
    ];

    const result = solveGearTrain(nodes, 1500, 4.0);

    expect(result.gears).toHaveLength(2);
    expect(result.totalRatio).toBe(3.0);
    expect(result.outputRpm).toBe(500);
    expect(result.gears[0].rotationDir).toBe('cw');
    expect(result.gears[1].rotationDir).toBe('ccw');
    expect(result.centerDistances[0].a).toBe(120); // (20 + 60) * 3 / 2 = 120 mm
  });

  it('solves 3-gear idler train with correct intermediate rotation', () => {
    const nodes: GearTrainNode[] = [
      { id: 'g1', name: 'Driver', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 20, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '16MnCr5' },
      { id: 'g2', name: 'Idler', shaftId: 2, isCoaxial: false, gearType: 'external', teeth: 40, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '16MnCr5' },
      { id: 'g3', name: 'Driven', shaftId: 3, isCoaxial: false, gearType: 'external', teeth: 60, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '16MnCr5' },
    ];

    const result = solveGearTrain(nodes, 1500, 4.0);

    expect(result.gears).toHaveLength(3);
    expect(result.totalRatio).toBe(3.0);
    expect(result.gears[0].rotationDir).toBe('cw');
    expect(result.gears[1].rotationDir).toBe('ccw');
    expect(result.gears[2].rotationDir).toBe('cw');
  });

  it('handles compound / coaxial gears on the same shaft with exact speed locking', () => {
    const result = solveGearTrain(DEFAULT_COMPOUND_PRESET, 1500, 4.0);

    expect(result.gears).toHaveLength(4);
    expect(result.gears[0].rpm).toBe(1500);
    expect(result.gears[1].rpm).toBe(600); // 1500 / (50/20) = 600
    expect(result.gears[2].rpm).toBe(600); // Coaxial gear on Shaft 2 has EXACT same speed!
    expect(result.gears[2].rotationDir).toBe(result.gears[1].rotationDir);
    expect(result.gears[3].rpm).toBe(200); // 600 / (54/18) = 200
    expect(result.totalRatio).toBe(7.5);   // 1500 / 200 = 7.5
  });

  it('solves 3-Stage Heavy Duty Industrial Reducer with high reduction ratio', () => {
    const result = solveGearTrain(THREE_STAGE_HEAVY_PRESET, 1500, 15.0);

    expect(result.gears).toHaveLength(6);
    expect(result.shafts).toHaveLength(4);
    expect(result.totalRatio).toBeGreaterThan(30);
    expect(result.outputTorqueNm).toBeGreaterThan(1000);
    expect(result.totalPowerLossKW).toBeGreaterThan(0);
    expect(result.heatDissipationReqKW).toBeGreaterThan(0);
    expect(result.lubrication).toContain('ISO VG');
  });

  it('solves 90-degree Bevel-Helical Stage Reducer', () => {
    const result = solveGearTrain(BEVEL_HELICAL_PRESET, 1450, 7.5);

    expect(result.gears).toHaveLength(4);
    expect(result.totalRatio).toBe(12); // (57/19) * (72/18) = 3 * 4 = 12
    expect(result.outputRpm).toBeCloseTo(120.8, 1);
  });

  it('solves Dual Planetary Cascade Reducer', () => {
    const result = solveGearTrain(DUAL_PLANETARY_CASCADE_PRESET, 1500, 11.0);

    expect(result.gears).toHaveLength(4);
    expect(result.shafts).toHaveLength(4);
    expect(result.totalRatio).toBeGreaterThan(15);
  });

  it('solves integrated Planetary Gearbox Stage with correct formula (i = 1 + zr/zs)', () => {
    const result = solveGearTrain(PLANETARY_TRAIN_PRESET, 1500, 4.0);

    expect(result.gears).toHaveLength(3);
    const planetGear = result.gears[1];
    expect(planetGear.gearType).toBe('planetary_stage');
    expect(planetGear.stageRatio).toBe(4.5); // 1 + 70/20 = 4.5
    expect(planetGear.rotationDir).toBe(result.gears[0].rotationDir); // Carrier same direction as Sun
  });

  it('solves internal ring gear mesh with matching rotation direction', () => {
    const result = solveGearTrain(INTERNAL_HYBRID_PRESET, 1500, 4.0);

    expect(result.gears).toHaveLength(4);
    const ringGear = result.gears[1];
    expect(ringGear.gearType).toBe('internal');
    expect(ringGear.rotationDir).toBe(result.gears[0].rotationDir); // Internal mesh preserves direction
  });

  it('computes detailed manufacturing, contact ratios & Wildhaber inspection values', () => {
    const mfg = computeGearManufacturingData(20, 3, 0, 20, 0, 30, '16MnCr5', 1500, 25, 'external');

    expect(mfg.d).toBe(60);
    expect(mfg.da).toBe(66);
    expect(mfg.df).toBe(52.5);
    expect(mfg.wildhaberK).toBeGreaterThanOrEqual(2);
    expect(mfg.wildhaberW).toBeGreaterThan(0);
    expect(mfg.dimensionOverPins).toBeGreaterThan(mfg.df);
    expect(mfg.transverseContactRatio).toBeGreaterThan(1.2);
    expect(mfg.isUndercut).toBe(false);
    expect(mfg.caseDepthCHD).toContain('mm');
  });
});
