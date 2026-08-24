import { describe, it, expect } from 'vitest';
import {
  calculatePrincipalStresses2D,
  calculateVonMises2D,
  calculateVonMises,
  calculateTresca,
  calculateSafetyFactor,
  getMohrCircleData,
  calculateBuckling,
  calculateGoodman,
  calculateBeam,
  type StressState2D,
  type MaterialStrength
} from '@/lib/stressAnalysis';

describe('Stress Analysis Engine', () => {
  const steelMaterial: MaterialStrength = {
    name: 'Structural Steel S235',
    Sy: 235,
    Su: 360,
    E: 210,
    Se: 180,
    G: 81,
    v: 0.3
  };

  it('calculates 2D principal stresses correctly for pure tension & shear', () => {
    const state: StressState2D = { sigmaX: 100, sigmaY: 0, tauXY: 50 };
    const principal = calculatePrincipalStresses2D(state);

    // sigmaAvg = 50, R = sqrt(50^2 + 50^2) = 70.71
    // sigma1 = 120.71, sigma2 = -20.71
    expect(principal.sigma1).toBeCloseTo(120.71, 1);
    expect(principal.sigma2).toBeCloseTo(-20.71, 1);
    expect(principal.tauMax).toBeCloseTo(70.71, 1);
  });

  it('calculates Von Mises stress matching theoretical invariant equations', () => {
    const state: StressState2D = { sigmaX: 120, sigmaY: 60, tauXY: 30 };
    const vonMisesDirect = calculateVonMises2D(state);

    const principal = calculatePrincipalStresses2D(state);
    const vonMisesPrincipal = calculateVonMises(principal);

    expect(vonMisesDirect).toBeCloseTo(vonMisesPrincipal, 2);
    expect(vonMisesDirect).toBeGreaterThan(0);
  });

  it('calculates Factor of Safety (FoS) and status assessment', () => {
    const vonMises = 100; // MPa
    const result = calculateSafetyFactor(vonMises, steelMaterial, 'yield');
    expect(result.fos).toBeCloseTo(2.35, 2);
    expect(result.status).toBe('safe');

    const highStress = 250; // MPa > Sy
    const failResult = calculateSafetyFactor(highStress, steelMaterial, 'yield');
    expect(failResult.fos).toBeLessThan(1.0);
    expect(failResult.status).toBe('failure');
  });

  it('generates accurate Mohr Circle radius and center', () => {
    const state: StressState2D = { sigmaX: 80, sigmaY: 20, tauXY: 40 };
    const mohr = getMohrCircleData(state);

    expect(mohr.center.x).toBe(50);
    expect(mohr.radius).toBe(50); // sqrt(30^2 + 40^2) = 50
    expect(mohr.sigma1Point.x).toBe(100);
    expect(mohr.sigma2Point.x).toBe(0);
  });

  it('computes column critical buckling load Pcr', () => {
    // L = 1000 mm, I = 10000 mm4, A = 100 mm2
    const buckling = calculateBuckling(1000, 10000, 100, steelMaterial, 'pinned-pinned', 0);
    expect(buckling.Pcr).toBeGreaterThan(0);
    expect(buckling.mode).toBeDefined();
  });

  it('computes Goodman fatigue safety factor under cyclic loading', () => {
    const sigmaA = 50; // alternating stress (MPa)
    const sigmaM = 100; // mean stress (MPa)
    const result = calculateGoodman(sigmaA, sigmaM, steelMaterial);
    // 1 / FoS = sigmaA / Se + sigmaM / Su
    expect(result.safetyCycles).toBeGreaterThan(1.0);
    expect(result.criterion).toBe('Goodman');
  });

  it('calculates beam deflection and bending moment for cantilever and simply supported beams', () => {
    // Simply supported with center load: L = 1000mm, load = 1000N, E = 210 GPa, I = 10000 mm4, W = 1000 mm3
    const beam = calculateBeam('simply_supported', 'point_center', 1000, 1000, 210, 10000, 1000);
    expect(beam.maxDeflection).toBeGreaterThan(0);
    expect(beam.maxMoment).toBe(250000); // (1000 * 1000) / 4 = 250000 N*mm
    expect(beam.maxStress).toBe(250); // 250000 / 1000 = 250 MPa
  });
});
