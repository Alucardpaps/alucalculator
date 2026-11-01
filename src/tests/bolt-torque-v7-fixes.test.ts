/**
 * Regression tests for the bolt-torque page review (Oct 2026):
 * engine (d3, Rm, pG, αA, friction scatter, stripping), ISO head tables, number formatting,
 * cross tightening order, quick-chart nut factor and the production drawing geometry.
 */
import { describe, expect, it } from 'vitest';
import { computeBoltAssembly, CLAMPED_MATERIALS, getTensileStrength } from '@/lib/fastener/sharedEngine';
import { getBoltHeadDimensions } from '@/data/boltHeadStandards';
import { getNutDimension } from '@/data/boltNutStandards';
import { formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { generateStarTighteningOrder, chartNutFactor, METRIC_QUICK_CHART_ROWS } from '@/components/modules/mechanical/BoltTorqueOmniSuite';
import { buildBoltDrawing } from '@/components/modules/mechanical/boltDrawing/BoltDrawingSvg';
import { toBoltDrawingModel } from '@/components/modules/mechanical/boltDrawing/model';

const m12 = () => computeBoltAssembly({
  threadStandard: 'Metric Coarse', size: 'M12', grade: '8.8', muThread: 0.14, muHead: 0.14,
  yieldUtilization: 70, length: 50, boltType: 'hex_bolt', clampedMaterialId: 'steel_s235',
});

describe('VDI 2230 engine — M12 8.8, μ = 0.14, ν = 70 % Sp', () => {
  it('uses the ISO 68-1 external root diameter d3 (not D1) for the stress diameter', () => {
    const r = m12();
    expect(r.d3).toBeCloseTo(12 - 1.226869 * 1.75, 3); // 9.853
    expect(r.d1).toBeCloseTo(12 - 1.082532 * 1.75, 3); // 10.106
    const dS = (r.d2 + r.d3) / 2;
    expect(r.Wp).toBeCloseTo((Math.PI * dS ** 3) / 16, 6);
  });

  it('matches a hand calculation of FM, MA, τ and σred', () => {
    const r = m12();
    expect(r.Fm_max).toBeCloseTo(0.7 * 580 * 84.3 / 1000, 3); // 34.226 kN
    // K = P/(2πd) + 0.577 μG d2/d + μK (dw + dh)/(4d), dw = 16.63 (ISO 4014), dh = 13.5
    const K = 1.75 / (2 * Math.PI * 12) + 0.57735 * 0.14 * (10.863 / 12) + 0.14 * ((16.63 + 13.5) / 4) / 12;
    expect(r.MA).toBeCloseTo(K * r.Fm_max * 12, 1); // ≈ 75.7 N·m
    expect(r.tau).toBeCloseTo(181.4, 0);
    expect(r.sigmaEq).toBeCloseTo(513.4, 0);
  });

  it('takes Rm from the property-class table instead of Rp0.2 / 0.8', () => {
    expect(getTensileStrength('10.9', 12)).toBe(1040);
    expect(getTensileStrength('12.9', 12)).toBe(1220);
    expect(getTensileStrength('8.8', 20)).toBe(830);
    expect(getTensileStrength('A2-70', 8)).toBe(700);
    expect(m12().Rm).toBe(800);
  });

  it('uses VDI 2230-1:2015 Table A9 limiting surface pressures', () => {
    const pg = (id: string) => CLAMPED_MATERIALS.find((m) => m.id === id)!.pG_zul;
    expect(pg('steel_s235')).toBe(490);
    expect(pg('steel_s355')).toBe(760);
    expect(pg('cast_iron_gj_250')).toBe(850);
    expect(pg('nodular_iron_500')).toBe(750);
    expect(pg('alu_7075')).toBe(540);
    const r = m12();
    expect(r.pM).toBeCloseTo(r.Fm_max * 1000 / ((Math.PI / 4) * (16.63 ** 2 - 13.5 ** 2)), 3);
    expect(r.surfaceSafety).toBeGreaterThan(1); // 462 < 490 MPa → no crushing for the default case
  });

  it('passes αA through to FM,min and the assumptions ledger', () => {
    const r = computeBoltAssembly({ threadStandard: 'Metric Coarse', size: 'M12', grade: '8.8', muThread: 0.14, muHead: 0.14, yieldUtilization: 70, alphaA: 1.2 });
    expect(r.alphaA).toBe(1.2);
    expect(r.FM_min_kN).toBeCloseTo(r.Fm_max / 1.2, 6);
    expect(r.assumptionsLedger.find((a) => a.id === 'alpha_a')!.value).toBe(1.2);
  });

  it('centres the friction scatter on the input μ', () => {
    const lo = computeBoltAssembly({ threadStandard: 'Metric Coarse', size: 'M12', grade: '8.8', muThread: 0.08, muHead: 0.08, yieldUtilization: 70 });
    expect(lo.frictionRangeAnalysis.muMin).toBeCloseTo(0.05, 6);
    expect(lo.frictionRangeAnalysis.muMax).toBeCloseTo(0.11, 6);
    expect(lo.frictionRangeAnalysis.FM_max_kN).toBeGreaterThan(lo.Fm_max);
    expect(lo.frictionRangeAnalysis.FM_min_kN).toBeLessThan(lo.Fm_max);
  });

  it('thread stripping: a matched ISO 4032 nut is stronger than the bolt', () => {
    const r = m12();
    expect(r.mCrit).toBeGreaterThan(5);
    expect(r.mCrit).toBeLessThan(r.nutDim.height);
    expect(r.strippingSafety).toBeGreaterThan(1.5);
  });
});

describe('ISO head / nut tables', () => {
  it('hex head = ISO 4014/4017, nut = ISO 4032', () => {
    const h = getBoltHeadDimensions('hex_bolt', 'M12');
    expect(h.s).toBe(18);
    expect(h.e).toBeCloseTo(20.03, 2);
    expect(h.dw).toBeCloseTo(16.63, 2);
    expect(getNutDimension('M12').width).toBe(18);
    expect(getNutDimension('M10').width).toBe(16);
  });
  it('socket cap bearing face uses ISO 4762 dw,min', () => {
    expect(getBoltHeadDimensions('socket_cap', 'M12').dw).toBeCloseTo(17.23, 2);
  });
});

describe('formatEngineeringValue', () => {
  it('keeps the zeros of integers', () => {
    expect(formatEngineeringValue(50, 0)).toBe('50');
    expect(formatEngineeringValue(360, 0)).toBe('360');
    expect(formatEngineeringValue(1000, 2)).toBe('1000');
    expect(formatEngineeringValue(50.0, 2)).toBe('50');
    expect(formatEngineeringValue(1.75, 3)).toBe('1.75');
  });
});

describe('cross tightening order (ASME PCC-1 legacy pattern)', () => {
  it('8, 12 and 16 holes', () => {
    expect(generateStarTighteningOrder(8)).toEqual([1, 5, 3, 7, 2, 6, 4, 8]);
    expect(generateStarTighteningOrder(12)).toEqual([1, 7, 4, 10, 2, 8, 5, 11, 3, 9, 6, 12]);
    expect(generateStarTighteningOrder(16)).toEqual([1, 9, 5, 13, 3, 11, 7, 15, 2, 10, 6, 14, 4, 12, 8, 16]);
  });
  it('every hole exactly once and pairs are opposite for even n', () => {
    for (const n of [4, 6, 8, 10, 12, 20, 24]) {
      const s = generateStarTighteningOrder(n);
      expect([...s].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      for (let i = 0; i < n; i += 2) expect(Math.abs(s[i + 1] - s[i])).toBe(n / 2);
    }
  });
});

describe('quick torque chart uses the same nut factor as the assembly tab', () => {
  it('M12 8.8 μ0.14 ν70 %', () => {
    const row = METRIC_QUICK_CHART_ROWS.find((r) => r.size === 'M12')!;
    const FM = (row.As * 580 * 0.7) / 1000;
    expect(chartNutFactor(row, 0.14) * FM * 12).toBeCloseTo(m12().MA, 1);
  });
});

describe('production drawing geometry', () => {
  const shopFor = (r: ReturnType<typeof m12>, L: number) => ({
    d: r.d_nom, p: r.pitchVal, d1: r.d1, d2: r.d2, d3: r.d3, s: r.boltDim.s, e: r.boltDim.e, k: r.boltDim.k,
    m: r.nutDim.height, L, b: r.threadLengthB, ls: L - r.threadLengthB, vanish: 2 * r.pitchVal,
    chamfer: 1, r: 0.6, tap: r.tapDrill, dw: r.dw, dh: r.dh, grade: r.grade, threadCallout: 'M12 × 1.75 - 6g',
    tapCallout: '', metricKey: 'M12', boltType: r.boltType, headDim: r.headDim, pM: r.pM, pG: r.pG_zul, FM_kN: r.Fm_max,
  });
  it('builds part and joint views with a constant on-screen text size', () => {
    const r = m12();
    const model = toBoltDrawingModel(shopFor(r, 50) as never, 'hex_bolt');
    expect(model.d3).toBeCloseTo(r.d3, 6);
    const a = buildBoltDrawing(model, { mode: 'part', widthPx: 760, fontPx: 12, uid: 't' });
    const b = buildBoltDrawing(model, { mode: 'joint', widthPx: 760, fontPx: 12, uid: 't' });
    // text height in px = fs (mm) × px/mm
    expect((a.kit.fs * 760) / a.vb.w).toBeGreaterThan(10);
    expect((a.kit.fs * 760) / a.vb.w).toBeLessThan(14);
    expect(b.info.seated).toBe(true);
    expect(b.info.lk).toBeGreaterThan(0);
    expect(b.info.lk + r.nutDim.height).toBeLessThanOrEqual(50);
  });
  it('loosening lifts the nut off the plate', () => {
    const r = m12();
    const model = toBoltDrawingModel(shopFor(r, 50) as never, 'hex_bolt');
    const b = buildBoltDrawing(model, { mode: 'joint', widthPx: 760, uid: 't', nutGap: 1.75 });
    expect(b.info.seated).toBe(false);
    expect(b.info.gap).toBeCloseTo(1.75, 6);
  });
});
