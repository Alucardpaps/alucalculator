import { describe, expect, it } from 'vitest';
import { calculateORingGland } from '@/lib/calculations/oringGland';

describe('O-ring gland geometry', () => {
  it('radial squeeze counts the radial gap: S = (W − (H + g))/W', () => {
    // piston gland, groove root = d1 → no stretch; W 3.53, H 2.60, 2g 0.20 → h 2.70
    const r = calculateORingGland({ cordDiameter: 3.53, innerDiameter: 50, grooveDiameter: 50, applicationType: 'static_radial_piston', materialId: 'nbr-70', operatingPressureBar: 25, customGlandDepth: 2.6, customGlandWidth: 4.8, diametralClearanceGap: 0.2 });
    expect(r.compressedHeight).toBeCloseTo(2.7, 9);
    expect(r.squeezePercent).toBeCloseTo(((3.53 - 2.7) / 3.53) * 100, 6);
    expect(r.glandFillPercent).toBeCloseTo(((Math.PI * 3.53 ** 2) / 4 / (4.8 * 2.7)) * 100, 6);
  });

  it('axial glands ignore the gap', () => {
    const r = calculateORingGland({ cordDiameter: 3.53, innerDiameter: 50, applicationType: 'static_axial_internal', materialId: 'nbr-70', operatingPressureBar: 10, customGlandDepth: 2.6, diametralClearanceGap: 0.2 });
    expect(r.compressedHeight).toBeCloseTo(2.6, 9);
  });

  it('ID stretch from the groove root and thinner cord W/√(1+ε)', () => {
    const r = calculateORingGland({ cordDiameter: 3.53, innerDiameter: 50, grooveDiameter: 53, applicationType: 'static_radial_piston', materialId: 'nbr-70', operatingPressureBar: 25 });
    expect(r.idStretchPercent).toBeCloseTo(6, 9);
    expect(r.effectiveCordDiameter).toBeCloseTo(3.53 / Math.sqrt(1.06), 9);
    expect(r.stretchStatus).toBe('warn');
    expect(r.stretchAssumed).toBe(false);
  });

  it('rod gland: OD compression', () => {
    const r = calculateORingGland({ cordDiameter: 3.53, innerDiameter: 50, grooveDiameter: 55, applicationType: 'static_radial_rod', materialId: 'nbr-70', operatingPressureBar: 25 });
    expect(r.odCompressionPercent).toBeCloseTo(((57.06 - 55) / 57.06) * 100, 6);
    expect(r.stretchStatus).toBe('warn'); // 3.6 % → warn band (3–5 %)
  });

  it('recommended depth lands at mid-range squeeze', () => {
    const r = calculateORingGland({ cordDiameter: 3.53, innerDiameter: 50, applicationType: 'static_radial_piston', materialId: 'nbr-70', operatingPressureBar: 25 });
    expect(r.squeezePercent).toBeGreaterThan(20.5);
    expect(r.squeezePercent).toBeLessThan(22.5);
    expect(r.squeezeStatus).toBe('pass');
  });
});
