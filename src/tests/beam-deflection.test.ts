import { describe, it, expect } from 'vitest';
import { formatEngineeringValue } from '../components/calculator-kit/precisionUtils';

describe('Beam Deflection Mechanics & Limit State Tests', () => {
  // Pure mechanics helper matching Euler-Bernoulli & Eurocode 3
  function computeBeamMechanics({
    lengthMm,
    loadKN,
    modulusGPa,
    inertia10e6Mm4,
    heightMm,
    yieldStrengthMPa,
    limitRatio = 300,
    type = 'simple',
  }: {
    lengthMm: number;
    loadKN: number;
    modulusGPa: number;
    inertia10e6Mm4: number;
    heightMm: number;
    yieldStrengthMPa: number;
    limitRatio?: number;
    type?: 'simple' | 'cantilever';
  }) {
    const L = lengthMm;
    const F = loadKN * 1000; // N
    const E = modulusGPa * 1000; // MPa = N/mm^2
    const I = inertia10e6Mm4 * 1000000; // mm^4

    // Deflection & Moment
    let delta = 0;
    let maxMomentNmm = 0;

    if (type === 'simple') {
      // Point load at midspan: delta = F * L^3 / (48 * E * I), M = F * L / 4
      delta = (F * Math.pow(L, 3)) / (48 * E * I);
      maxMomentNmm = (F * L) / 4;
    } else {
      // Cantilever point load at end: delta = F * L^3 / (3 * E * I), M = F * L
      delta = (F * Math.pow(L, 3)) / (3 * E * I);
      maxMomentNmm = F * L;
    }

    // Stress analysis: c = h / 2, Wx = I / c, sigma_b = M / Wx
    const c = heightMm / 2;
    const sectionModulusMm3 = I / c;
    const sectionModulusCm3 = sectionModulusMm3 / 1000;
    const sigmaB = maxMomentNmm / sectionModulusMm3;

    // Deflection limit
    const limit = L / limitRatio;
    const etaDelta = delta / limit;
    const etaStress = sigmaB / yieldStrengthMPa;
    const etaMax = Math.max(etaDelta, etaStress);

    const verdict = etaMax > 1.0 ? 'FAIL' : etaMax >= 0.8 ? 'WARN' : 'PASS';

    return {
      delta,
      maxMomentNmm,
      maxMomentKNm: maxMomentNmm / 1e6,
      sectionModulusCm3,
      sigmaB,
      limit,
      etaDelta,
      etaStress,
      etaMax,
      verdict,
    };
  }

  describe('Simply Supported Beam Center Load', () => {
    it('computes textbook baseline case (L=3000mm, F=10kN, E=70GPa, I=15.5*10^6 mm^4)', () => {
      const res = computeBeamMechanics({
        lengthMm: 3000,
        loadKN: 10,
        modulusGPa: 70,
        inertia10e6Mm4: 15.5,
        heightMm: 160,
        yieldStrengthMPa: 240,
        limitRatio: 300,
        type: 'simple',
      });

      // F = 10000 N, L = 3000 mm, E = 70000 MPa, I = 15.5e6 mm4
      // delta = 10000 * 27e9 / (48 * 70000 * 15.5e6) = 2.7e14 / 5.208e13 = 5.18433 mm
      expect(res.delta).toBeCloseTo(5.184, 3);
      // M_max = 10000 * 3000 / 4 = 7,500,000 Nmm = 7.5 kNm
      expect(res.maxMomentKNm).toBeCloseTo(7.5, 3);
      // c = 80 mm, Wx = 15.5e6 / 80 = 193750 mm3 = 193.75 cm3
      expect(res.sectionModulusCm3).toBeCloseTo(193.75, 2);
      // sigma_b = 7500000 / 193750 = 38.71 MPa
      expect(res.sigmaB).toBeCloseTo(38.71, 2);
      // limit = 3000 / 300 = 10 mm
      expect(res.limit).toBe(10);
      // etaDelta = 5.184 / 10 = ~0.518 (51.8%)
      expect(res.etaDelta).toBeCloseTo(0.518, 2);
      // etaStress = 38.71 / 240 = ~0.161 (16.1%)
      expect(res.etaStress).toBeCloseTo(0.161, 2);
      // Governing eta is etaDelta = 51.8% < 80% => PASS
      expect(res.verdict).toBe('PASS');
    });

    it('triggers WARN state when utilization is between 80% and 100%', () => {
      // Double the load to 16 kN -> delta = ~8.3 mm, limit = 10 mm -> eta = ~83%
      const res = computeBeamMechanics({
        lengthMm: 3000,
        loadKN: 16,
        modulusGPa: 70,
        inertia10e6Mm4: 15.5,
        heightMm: 160,
        yieldStrengthMPa: 240,
        limitRatio: 300,
        type: 'simple',
      });

      expect(res.etaDelta).toBeGreaterThan(0.80);
      expect(res.etaDelta).toBeLessThanOrEqual(1.00);
      expect(res.verdict).toBe('WARN');
    });

    it('triggers FAIL state when deflection exceeds Eurocode limit', () => {
      // Load 25 kN -> delta = ~12.96 mm, limit = 10 mm -> eta = 1.296 (129.6%)
      const res = computeBeamMechanics({
        lengthMm: 3000,
        loadKN: 25,
        modulusGPa: 70,
        inertia10e6Mm4: 15.5,
        heightMm: 160,
        yieldStrengthMPa: 240,
        limitRatio: 300,
        type: 'simple',
      });

      expect(res.delta).toBeGreaterThan(res.limit);
      expect(res.etaDelta).toBeGreaterThan(1.0);
      expect(res.verdict).toBe('FAIL');
    });
  });

  describe('Cantilever Beam End Point Load', () => {
    it('accurately computes 16x higher deflection multiplier for same span (delta = F*L^3 / (3*E*I))', () => {
      const simple = computeBeamMechanics({
        lengthMm: 2000,
        loadKN: 5,
        modulusGPa: 210,
        inertia10e6Mm4: 10,
        heightMm: 150,
        yieldStrengthMPa: 355,
        type: 'simple',
      });

      const cantilever = computeBeamMechanics({
        lengthMm: 2000,
        loadKN: 5,
        modulusGPa: 210,
        inertia10e6Mm4: 10,
        heightMm: 150,
        yieldStrengthMPa: 355,
        type: 'cantilever',
      });

      // Ratio between 1/3 and 1/48 is exactly 16
      expect(cantilever.delta / simple.delta).toBeCloseTo(16, 5);
      // Cantilever max moment is F * L, simple is F * L / 4 -> ratio is 4
      expect(cantilever.maxMomentNmm / simple.maxMomentNmm).toBeCloseTo(4, 5);
    });
  });

  describe('Engineering Formatting with Global Precision Integration', () => {
    it('formats beam deflection and moment with variable decimal precision', () => {
      const res = computeBeamMechanics({
        lengthMm: 3000,
        loadKN: 10,
        modulusGPa: 70,
        inertia10e6Mm4: 15.5,
        heightMm: 160,
        yieldStrengthMPa: 240,
      });

      expect(formatEngineeringValue(res.delta, 2)).toBe('5.18');
      expect(formatEngineeringValue(res.delta, 4)).toBe('5.1843');
      expect(formatEngineeringValue(res.delta, 6)).toBe('5.184332');
      expect(formatEngineeringValue(res.maxMomentKNm, 2)).toBe('7.5');
      expect(formatEngineeringValue(res.sigmaB, 1)).toBe('38.7');
    });
  });
});
