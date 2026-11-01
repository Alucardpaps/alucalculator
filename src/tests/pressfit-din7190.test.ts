import { describe, expect, it } from 'vitest';
import { calculatePressFit, type PressFitCalculationInput } from '@/lib/calculations/pressFit';

/**
 * Hand check — Ø50 H7/s6 (ISO 286-2: H7 0/+25 μm, s6 +43/+59 μm) → U_min 18, U_max 59 μm.
 * Steel/steel, D_a 100 (Q_A 0.5), solid shaft, Rz 4 + 6 → ΔU = 8 μm.
 * K_A + K_I = [(1.25/0.75 + 0.3) + (1 − 0.3)] / 210000 = 12.698e-6 1/MPa
 * p_min = 0.010 / (50 · 12.698e-6) = 15.75 MPa, p_max = 0.051 / (50 · 12.698e-6) = 80.33 MPa
 * p_gA = (1 − 0.25)/√3 · 355 = 153.7 MPa → S_A = 1.91
 */
const base: PressFitCalculationInput = {
  contactDiameter: 50, contactLength: 60, hubOuterDiameter: 100, shaftInnerDiameter: 0,
  tolerancePair: 'H7/s6', hubMaterialId: 'steel', shaftMaterialId: 'steel',
  assemblyMethod: 'thermal_shrink', operatingTorque: 500, operatingAxialForce: 0,
};

describe('DIN 7190-1 press fit', () => {
  const r = calculatePressFit(base);
  it('takes U_min/U_max from ISO 286-2', () => {
    expect(r.interferenceMinUm).toBe(18);
    expect(r.interferenceMaxUm).toBe(59);
    expect(r.interferenceSource).toBe('ISO 286-2');
  });
  it('p_min / p_max (Lamé)', () => {
    expect(r.contactPressure).toBeCloseTo(15.75, 1);
    expect(r.contactPressureMax).toBeCloseTo(80.33, 1);
  });
  it('torque capacity from p_min: μ·p·π·d·l·d/2', () => {
    expect(r.transmissibleTorque).toBeCloseTo((0.16 * 15.75 * Math.PI * 50 * 60 * 25) / 1000, 0);
  });
  it('hub elastic limit p_gA and safety from p_max', () => {
    expect(r.hubElasticLimitPressure).toBeCloseTo(153.7, 0);
    expect(r.hubSafetyFactor).toBeCloseTo(153.7 / 80.33, 2);
  });
  it('heating ΔT uses U_max + joining clearance', () => {
    expect(r.requiredTempDiffHub).toBe(Math.ceil((0.059 + 0.05) / (11.5e-6 * 50)));
  });
  it('custom range keeps min and max', () => {
    const c = calculatePressFit({ ...base, tolerancePair: 'custom', customInterferenceUm: 30, customInterferenceMaxUm: 70 });
    expect(c.interferenceMinUm).toBe(30);
    expect(c.interferenceMaxUm).toBe(70);
    expect(c.contactPressureMax).toBeGreaterThan(c.contactPressure);
  });
});
