import { describe, expect, it } from 'vitest';
import { iso965Limits } from '@/lib/fastener/iso965';

describe('ISO 965-1 6g/6H', () => {
  it('M12×1.75 6g major and pitch sit below basic size', () => {
    const d = 12;
    const p = 1.75;
    const d2 = d - 0.64952 * p;
    const d3 = d - 1.22687 * p;
    const d1 = d - 1.08253 * p;
    const lim = iso965Limits(d, d2, d3, d1, p);
    expect(lim.dMax).toBeLessThan(d);
    expect(lim.dMin).toBeLessThan(lim.dMax);
    expect(lim.d2Max).toBeLessThan(d2);
    expect(lim.d2Min).toBeLessThan(lim.d2Max);
    expect(lim.D2Min).toBeCloseTo(d2, 3);
    expect(lim.D2Max).toBeGreaterThan(d2);
    expect(lim.dMax).toBeCloseTo(11.966, 2);
  });
});
