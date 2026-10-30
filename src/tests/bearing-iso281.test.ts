import { describe, expect, it } from 'vitest';
import { aIsoFactor, analyzeBearingLife, calculateReferenceViscosity, estimateFatigueLoadLimit, RELIABILITY_FACTORS } from '@/lib/mechanical/bearingLifeEngine';
import { calculateBearingLife, computeEquivalentLoadsAndWarnings, type BearingData } from '@/data/skfBearings';

const b6205: BearingData = { code: '6205', type: 'deep-groove-ball', d: 25, D: 52, B: 15, C: 14.8, C0: 7.8 };

describe('ISO 281:2007', () => {
  it('a1 reliability factors (Table 12)', () => {
    expect(RELIABILITY_FACTORS[95]).toBe(0.64);
    expect(RELIABILITY_FACTORS[99]).toBe(0.25);
    expect(calculateBearingLife(b6205, 1, 0, 1000, 99).Lna / calculateBearingLife(b6205, 1, 0, 1000, 90).Lna).toBeCloseTo(0.25, 6);
  });

  it('reference viscosity ν1 has two speed branches', () => {
    const dm = 38.5;
    expect(calculateReferenceViscosity(500, dm)).toBeCloseTo(45000 * 500 ** -0.83 * dm ** -0.5, 6);
    expect(calculateReferenceViscosity(3000, dm)).toBeCloseTo(4500 * 3000 ** -0.5 * dm ** -0.5, 6);
  });

  it('aISO: κ = 1, eC·Cu/P = 0.1 (ball) ≈ 2.43; capped at 50; grows with κ', () => {
    expect(aIsoFactor(false, 1, 0.1)).toBeCloseTo(2.43, 1);
    expect(aIsoFactor(false, 4, 5)).toBe(50);
    expect(aIsoFactor(false, 2, 0.2)).toBeGreaterThan(aIsoFactor(false, 0.5, 0.2));
    expect(aIsoFactor(true, 1, 0.1)).toBeGreaterThan(0.1);
  });

  it('Cu estimate from C0 (Annex B)', () => {
    expect(estimateFatigueLoadLimit(b6205)).toBeCloseTo(7.8 / 22, 6);
  });

  it('deep-groove X/Y switch at Fa/Fr = e (Table 3)', () => {
    const low = computeEquivalentLoadsAndWarnings(b6205, 2, 0.2);
    expect(low.X).toBe(1);
    expect(low.Y).toBe(0);
    expect(low.P).toBeCloseTo(2, 9);
    const high = computeEquivalentLoadsAndWarnings(b6205, 1, 1);
    expect(high.X).toBe(0.56);
    expect(high.P).toBeCloseTo(0.56 + (high.Y ?? 0), 9);
  });

  it('Lnm = a1 · aISO · L10h', () => {
    const r = analyzeBearingLife({ bearing: b6205, fr: 2.5, fa: 0.4, rpm: 1450, reliability: 95, baseViscosity: 20, contamination: 0.55 });
    expect(r.Lna!).toBeCloseTo(0.64 * r.aISO! * r.L10h, 3);
  });
});
