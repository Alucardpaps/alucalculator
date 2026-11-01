import { describe, expect, it } from 'vitest';
import { alphaShoulder, betaFactors, din743Check, K1, K2, KF } from '@/modules/mechanical/ShaftDesign/din743';
import { ShaftDesignEngine, type ShaftDesignInput, type ShaftSegment } from '@/modules/mechanical/ShaftDesign/engine';

const C45 = { Rm: 630, Re: 370, steelClass: 'quenched-tempered' as const };

describe('DIN 743 factors', () => {
  it('size and surface factors', () => {
    expect(K1(16, 'quenched-tempered')).toBe(1);
    expect(K1(40, 'quenched-tempered')).toBeCloseTo(0.8965, 3);
    expect(K1(40, 'quenched-tempered', true)).toBeCloseTo(0.8647, 3);
    expect(K2(7.5)).toBeCloseTo(1, 6);
    expect(K2(150)).toBeCloseTo(0.8, 6);
    const kf = KF(6.3, 600);
    expect(kf.s).toBeLessThan(1);
    expect(kf.t).toBeGreaterThan(kf.s);
  });

  it('shoulder fillet αk and βσ (D50/d40/r2, C45)', () => {
    const a = alphaShoulder(50, 40, 2);
    expect(a.ab).toBeCloseTo(2.0206, 3);
    const b = betaFactors({ kind: 'shoulder', D: 50, d: 40, r: 2 }, C45, 40);
    expect(b.bs).toBeCloseTo(1.715, 2);
    expect(b.tier).toBe('normative');
  });

  it('keyway βσ follows 3.0·(σB/1000)^0.38', () => {
    const b = betaFactors({ kind: 'keyway', d: 40 }, C45, 40);
    expect(b.bs).toBeCloseTo(3.0 * Math.pow((0.8965 * 630) / 1000, 0.38), 2);
    expect(b.bt).toBeCloseTo(0.56 * b.bs + 0.1, 6);
  });

  it('press fit βσ = 2.7·(σB/1000)^0.43', () => {
    const b = betaFactors({ kind: 'press-fit', d: 40 }, C45, 40);
    expect(b.bs).toBeCloseTo(2.7 * Math.pow((0.8965 * 630) / 1000, 0.43), 2);
  });

  it('fatigue safety falls with a notch, static safety does not', () => {
    const plain = din743Check({ sigmaB: 80, tau: 40, d: 40, notch: { kind: 'none' } }, C45);
    const key = din743Check({ sigmaB: 80, tau: 40, d: 40, notch: { kind: 'keyway', d: 40 } }, C45);
    expect(key.SD).toBeLessThan(plain.SD);
    expect(key.SF).toBeCloseTo(plain.SF, 9);
  });
});

describe('ShaftDesignEngine', () => {
  const seg = (id: string, length: number, diameter: number): ShaftSegment => ({
    id, segmentIndex: 0, length, diameter, shoulderFilletRadius: 1.5, shoulderTransition: 'radius', toleranceGrade: 'h9', features: [],
  });

  it('overhung load: signed-moment deflection matches F·a²(L+a)/(3EI)', () => {
    const input: ShaftDesignInput = {
      totalLength: 400, segments: [seg('s1', 400, 30)], materialId: 'c45',
      supportAPos: 0, supportBPos: 300, radialLoads: [{ id: 'f', position: 400, forceN: 1000 }],
      torque: { torqueNm: 0, inputPosition: 0, outputPosition: 0 }, targetSafetyFactor: 1.2,
    };
    const { result } = ShaftDesignEngine.analyze(input);
    expect(result.maxDeflectionX).toBeCloseTo(400, 0);
    expect(result.maxDeflectionMm).toBeCloseTo(0.1597, 2);
    expect(result.supportReactions.RaN).toBeCloseTo(-333.3, 0);
  });

  it('Rayleigh critical speed of a uniform simply supported shaft ≈ exact value', () => {
    const input: ShaftDesignInput = {
      totalLength: 300, segments: [seg('s1', 300, 30)], materialId: 'c45',
      supportAPos: 0, supportBPos: 300, radialLoads: [],
      torque: { torqueNm: 0, inputPosition: 0, outputPosition: 0 }, targetSafetyFactor: 1.2,
    };
    const { result } = ShaftDesignEngine.analyze(input);
    expect(result.criticalSpeedRpm / 40622).toBeGreaterThan(0.99);
    expect(result.criticalSpeedRpm / 40622).toBeLessThan(1.01);
  });

  it('reports DIN 743 static and fatigue safeties separately', () => {
    const input: ShaftDesignInput = {
      totalLength: 300, segments: [seg('s1', 150, 40), seg('s2', 150, 50)], materialId: 'c45',
      supportAPos: 10, supportBPos: 290, radialLoads: [{ id: 'f', position: 150, forceN: 6000 }],
      torque: { torqueNm: 200, inputPosition: 0, outputPosition: 300 }, targetSafetyFactor: 1.2,
    };
    const { result } = ShaftDesignEngine.analyze(input);
    expect(result.minFatigueSafety).toBeLessThan(result.minStaticSafety!);
    expect(result.criticalChecks.some((c) => c.featureType === 'shoulder')).toBe(true);
    expect(result.minSafetyFactor).toBeCloseTo(Math.min(result.minFatigueSafety!, result.minStaticSafety!), 1);
  });
});
