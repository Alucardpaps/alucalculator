import { describe, expect, it } from 'vitest';
import { chiEC3, computeColumnBuckling, effectiveSpan, modeShape, sectionProps } from '@/lib/structural/columnBuckling';

// Reference values computed independently (EN 1993-1-1 §6.3.1, AISC 360-16 E3)
describe('column buckling engine', () => {
  const base = {
    L: 3000, end: 'pinned-pinned' as const, E: 210000, fy: 235, curve: 'a' as const, gammaM1: 1,
    section: { kind: 'tube' as const, d: 60, t: 4 }, N: 40000, steel: true,
  };

  it('CHS 60×4 section properties', () => {
    const s = sectionProps(base.section);
    expect(s.A).toBeCloseTo(703.72, 1);
    expect(s.I).toBeCloseTo(277264, -1);
    expect(s.i).toBeCloseTo(19.849, 2);
  });

  it('EC3 χ and Nb,Rd for CHS 60×4, L = 3 m, curve a', () => {
    const r = computeColumnBuckling(base);
    expect(r.lambda).toBeCloseTo(151.14, 1);
    expect(r.lambdaBar).toBeCloseTo(1.6093, 3);
    expect(r.chi).toBeCloseTo(0.3299, 3);
    expect(r.NbRd / 1000).toBeCloseTo(54.55, 1);
    expect(r.Ncr / 1000).toBeCloseTo(63.85, 1);
    expect(r.phiPnAISC / 1000).toBeCloseTo(50.40, 1);
    expect(r.regime).toBe('elastic');
  });

  it('λ1 follows the user E (aluminium), not 93.9ε', () => {
    const r = computeColumnBuckling({ ...base, E: 70000, fy: 240, steel: false });
    expect(r.lambda1).toBeCloseTo(Math.PI * Math.sqrt(70000 / 240), 6);
    expect(r.tetmajer).toBeNull();
  });

  it('χ = 1 up to λ̄ = 0.2 and decreasing after', () => {
    expect(chiEC3(0.2, 0.34)).toBe(1);
    expect(chiEC3(1.0, 0.34)).toBeCloseTo(0.5970, 3); // EN 1993-1-1 Fig. 6.4, curve b
    expect(chiEC3(1.0, 0.76)).toBeLessThan(chiEC3(1.0, 0.13));
  });

  it('weak axis governs for a rectangular bar', () => {
    const s = sectionProps({ kind: 'rect', b: 40, h: 20 });
    expect(s.i).toBeCloseTo(5.7735, 3);
  });

  it('exact mode shapes are normalised and satisfy the supports', () => {
    for (const e of ['pinned-pinned', 'fixed-free', 'fixed-fixed', 'fixed-pinned'] as const) {
      let m = 0;
      for (let k = 0; k <= 1000; k++) m = Math.max(m, Math.abs(modeShape(e, k / 1000)));
      expect(m).toBeCloseTo(1, 3);
      expect(modeShape(e, 0)).toBeCloseTo(0, 6);
    }
    expect(modeShape('fixed-pinned', 1)).toBeCloseTo(0, 5);
    const [a, b] = effectiveSpan('fixed-pinned');
    expect(b - a).toBeCloseTo(0.6992, 3);
  });
});
