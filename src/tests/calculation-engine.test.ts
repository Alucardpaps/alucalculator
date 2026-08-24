import { describe, it, expect } from 'vitest';
import { CalculationEngine } from '@/lib/CalculationEngine';

describe('Calculation Engine - Machine Engineer Suite', () => {
  const engine = new CalculationEngine('6061-T6 (US Standard)');

  it('calculates plate weight, volume, and surface area accurately', () => {
    // 1000mm x 500mm x 10mm aluminum plate (6061-T6 density ~2.7 g/cm^3)
    const result = engine.calculatePlate(1000, 500, 10, 1);
    expect(result.success).toBe(true);
    expect(result.volumeCm3).toBe(5000); // 1000 * 500 * 10 / 1000 = 5000 cm3
    expect(result.unitWeightKg).toBeCloseTo(13.5, 1); // 5000 * 2.7 / 1000 = 13.5 kg
    expect(result.surfaceAreaCm2).toBe(10300);
  });

  it('handles material switching dynamically', () => {
    engine.setMaterial('Alu 7075-T6');
    expect(engine.getMaterial().name).toContain('7075');
    expect(engine.getMaterial().density).toBeGreaterThan(2.7);
  });

  it('validates invalid dimensions and rejects negative numbers', () => {
    const res = engine.calculatePlate(-100, 50, 5);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
