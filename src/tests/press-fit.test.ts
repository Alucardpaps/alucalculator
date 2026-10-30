import { describe, it, expect } from 'vitest';
import {
    calculatePressFit,
    PRESS_FIT_MATERIALS,
    TOLERANCE_PAIR_PRESETS
} from '@/lib/calculations/pressFit';

describe('DIN 7190 Press Fit Calculation Engine', () => {
    it('should correctly calculate contact pressure for solid steel shaft & hub', () => {
        // Benchmark test:
        // Steel-steel: d_F = 50 mm, D_a = 100 mm, d_i = 0 mm, l_F = 50 mm
        // Custom interference U = 50 μm
        // Roughness smoothing: 0.8 * (4 + 6) = 8 μm -> U_eff = 42 μm = 0.042 mm
        // Q_h = 50 / 100 = 0.5
        // Q_s = 0 / 50 = 0 (solid shaft)
        // E = 210,000 MPa, nu = 0.3
        // C_h = (1/210000) * [ (1 + 0.25)/(1 - 0.25) + 0.3 ] = (1/210000) * [ 1.6667 + 0.3 ] = 1.9667 / 210000
        // C_s = (1/210000) * [ 1 - 0.3 ] = 0.7 / 210000
        // C_total = 2.6667 / 210000
        // p_f = 0.042 / [ 50 * (2.6667 / 210000) ] = 0.042 * 210000 / (50 * 2.6667) = 66.15 MPa
        const res = calculatePressFit({
            contactDiameter: 50,
            contactLength: 50,
            hubOuterDiameter: 100,
            shaftInnerDiameter: 0,
            tolerancePair: 'custom',
            customInterferenceUm: 50,
            roughnessShaftRz: 4,
            roughnessHubRz: 6,
            hubMaterialId: 'steel',
            shaftMaterialId: 'steel',
            assemblyMethod: 'dry_press',
            operatingTorque: 300,
            operatingAxialForce: 1000
        });

        expect(res.contactPressure).toBeCloseTo(66.15, 0);
        expect(res.effectiveInterferenceUm).toBe(42);
        expect(res.transmissibleTorque).toBeGreaterThan(500); // Plenty for 300 N·m
        expect(res.hubHoopStress).toBeGreaterThan(res.contactPressure);
        expect(res.isHubSafe).toBe(true);
    });

    it('should compute higher contact pressure for hollow shaft compared to solid shaft with same interference', () => {
        const baseInput = {
            contactDiameter: 60,
            contactLength: 60,
            hubOuterDiameter: 120,
            tolerancePair: 'custom' as const,
            customInterferenceUm: 60,
            hubMaterialId: 'steel',
            shaftMaterialId: 'steel',
            assemblyMethod: 'thermal_shrink' as const,
            operatingTorque: 500,
            operatingAxialForce: 0
        };

        const resSolid = calculatePressFit({ ...baseInput, shaftInnerDiameter: 0 });
        const resHollow = calculatePressFit({ ...baseInput, shaftInnerDiameter: 30 });

        // Hollow shaft is more flexible (Cs is larger), hence contact pressure pf is lower for the same interference
        expect(resHollow.contactPressure).toBeLessThan(resSolid.contactPressure);
    });

    it('should compute realistic thermal assembly temperatures', () => {
        const res = calculatePressFit({
            contactDiameter: 50,
            contactLength: 50,
            hubOuterDiameter: 100,
            shaftInnerDiameter: 0,
            tolerancePair: 'H7/s6',
            hubMaterialId: 'steel',
            shaftMaterialId: 'steel',
            assemblyMethod: 'thermal_shrink',
            operatingTorque: 400,
            operatingAxialForce: 0,
            ambientTemperature: 20
        });

        // Heating temperature should be around 100°C - 250°C for standard steel shrink fit
        expect(res.hubTargetHeatingTemp).toBeGreaterThan(100);
        expect(res.hubTargetHeatingTemp).toBeLessThan(350);
        expect(res.requiredTempDiffHub).toBeGreaterThan(80);
    });

    it('should return nominalDia and finite non-NaN values from calculateFit for tolerance diagram', async () => {
        const { calculateFit } = await import('@/lib/engine/iso286');
        const fit = calculateFit(50, 'H', 7, 'p', 6);
        expect(fit.nominalDia).toBe(50);
        expect(fit.nominal).toBe(50);
        expect(Number.isFinite(fit.holeES)).toBe(true);
        expect(Number.isFinite(fit.holeEI)).toBe(true);
        expect(Number.isFinite(fit.shaft_es)).toBe(true);
        expect(Number.isFinite(fit.shaft_ei)).toBe(true);
        expect(fit.holeMax).toBeGreaterThanOrEqual(fit.holeMin);
        expect(fit.shaftMax).toBeGreaterThanOrEqual(fit.shaftMin);
    });
});
