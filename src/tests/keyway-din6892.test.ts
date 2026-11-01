import { describe, expect, it } from 'vitest';
import { calculateKeywayConnection, getStandardKeywayDimensions } from '@/lib/calculations/keywayConnection';

describe('DIN 6885 / DIN 6892 parallel key', () => {
  it('standard key for Ø45 is 14×9, t1 5.5, t2 3.8', () => {
    const k = getStandardKeywayDimensions(45);
    expect([k.b, k.h, k.t1, k.t2]).toEqual([14, 9, 5.5, 3.8]);
  });

  it('pressures use load-bearing heights h − t1 − s (hub) and t1 − s (shaft)', () => {
    const r = calculateKeywayConnection({
      shaftDiameter: 45, keyLength: 50, keyCount: 1, keyForm: 'A', torque: 300, serviceFactor: 1.25,
      hubMaterialId: 'c45', shaftMaterialId: 'c45', keyMaterialId: 'c45',
    });
    expect(r.effectiveLength).toBe(36);
    expect(r.pHub).toBeCloseTo(159.64, 1);
    expect(r.pShaft).toBeCloseTo(94.48, 1);
    expect(r.tauKey).toBeCloseTo(33.07, 1);
  });

  it('two keys carry i·φ = 1.5 times one key', () => {
    const base = { shaftDiameter: 45, keyLength: 50, keyForm: 'B' as const, torque: 300, serviceFactor: 1, hubMaterialId: 'c45', shaftMaterialId: 'c45', keyMaterialId: 'c45' };
    const one = calculateKeywayConnection({ ...base, keyCount: 1 });
    const two = calculateKeywayConnection({ ...base, keyCount: 2 });
    expect(one.pHub / two.pHub).toBeCloseTo(1.5, 9);
  });
});
