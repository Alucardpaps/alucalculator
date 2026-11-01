import { describe, it, expect } from 'vitest';
import {
    getStandardKeywayDimensions,
    calculateKeywayConnection,
    DIN_6885_TABLE,
    KEYWAY_MATERIALS
} from '@/lib/calculations/keywayConnection';
import { getUndercutData } from '@/data/machiningStandards';

describe('DIN 6885 Keyway Calculation Engine', () => {
    it('should correctly resolve DIN 6885-1 standard dimensions for various shaft diameters', () => {
        // d = 25 mm should be in range (22, 30] -> b=8, h=7, t1=4.0, t2=3.3
        const std25 = getStandardKeywayDimensions(25);
        expect(std25.b).toBe(8);
        expect(std25.h).toBe(7);
        expect(std25.t1).toBe(4.0);
        expect(std25.t2).toBe(3.3);

        // d = 40 mm should be in range (38, 44] -> b=12, h=8, t1=5.0, t2=3.3
        const std40 = getStandardKeywayDimensions(40);
        expect(std40.b).toBe(12);
        expect(std40.h).toBe(8);

        // d = 60 mm should be in range (58, 65] -> b=18, h=11, t1=7.0, t2=4.4
        const std60 = getStandardKeywayDimensions(60);
        expect(std60.b).toBe(18);
        expect(std60.h).toBe(11);
    });

    it('should calculate effective length correctly for Form A vs Form B', () => {
        const inputFormA = {
            shaftDiameter: 30, // b=8
            keyLength: 50,
            keyCount: 1 as const,
            keyForm: 'A' as const,
            torque: 200,
            serviceFactor: 1.0,
            hubMaterialId: 'c45',
            shaftMaterialId: 'c45',
            keyMaterialId: 'c45'
        };
        const resA = calculateKeywayConnection(inputFormA);
        // Form A: l_e = l - b = 50 - 8 = 42
        expect(resA.effectiveLength).toBe(42);

        const inputFormB = {
            ...inputFormA,
            keyForm: 'B' as const
        };
        const resB = calculateKeywayConnection(inputFormB);
        // Form B: l_e = l = 50
        expect(resB.effectiveLength).toBe(50);
    });

    it('should calculate contact pressures and shear stresses realistically', () => {
        // Test benchmark: d = 50 mm, T = 500 N·m, l = 60 mm, Form A
        // d=50 -> b=14, h=9, t1=5.5, t2=3.8
        // l_e = 60 - 14 = 46 mm
        // F_t = 2 * 500 * 1000 / 50 = 20,000 N
        // p_hub = 20000 / (3.8 * 46) = 114.4 MPa
        // tau = 20000 / (14 * 46) = 31.05 MPa
        const res = calculateKeywayConnection({
            shaftDiameter: 50,
            keyLength: 60,
            keyCount: 1,
            keyForm: 'A',
            torque: 500,
            serviceFactor: 1.0,
            hubMaterialId: 'c45', // p_adm = 120
            shaftMaterialId: 'c45', // p_adm = 120
            keyMaterialId: 'c45'   // tau_adm = 90
        });

        expect(res.tangentialForce).toBeCloseTo(20000, 0);
        expect(res.pHub).toBeCloseTo(149.93, 1);
        expect(res.tauKey).toBeCloseTo(31.05, 0);
        expect(res.safetyFactorHub).toBeGreaterThan(0.75);
        expect(res.safetyFactorShear).toBeGreaterThan(2.0);
    });

    it('should reflect 2-key load distribution factor of 1.50 (2 * 0.75 per DIN 6892)', () => {
        const input1 = {
            shaftDiameter: 50,
            keyLength: 60,
            keyCount: 1 as const,
            keyForm: 'A' as const,
            torque: 500,
            serviceFactor: 1.0,
            hubMaterialId: 'c45',
            shaftMaterialId: 'c45',
            keyMaterialId: 'c45'
        };
        const res1 = calculateKeywayConnection(input1);
        const res2 = calculateKeywayConnection({ ...input1, keyCount: 2 });

        // Pressure for 2 keys with DIN 6892 phi=0.75 -> effective factor 1.50
        expect(res2.pHub).toBeCloseTo(res1.pHub / 1.50, 1);
        expect(res2.maxTransmissibleTorque).toBeCloseTo(res1.maxTransmissibleTorque * 1.50, 0);
    });
});

describe('DIN 509 Relief Grooves / Undercuts Data Engine', () => {
    it('should correctly provide standard Form E dimensions', () => {
        const d25 = getUndercutData(25, 'E');
        expect(d25.form).toBe('E');
        expect(d25.r).toBe(1.0);
        expect(d25.t1).toBe(0.2);
        expect(d25.f).toBe(2.5);
        expect(d25.angleCylinder).toBe(15);
    });

    it('should correctly provide standard Form F dimensions including face undercut t2 and g', () => {
        const d25 = getUndercutData(25, 'F');
        expect(d25.form).toBe('F');
        expect(d25.r).toBe(1.0);
        expect(d25.t1).toBe(0.2);
        expect(d25.t2).toBe(0.1);
        expect(d25.g).toBe(1.4);
        expect(d25.angleFace).toBe(8);
        expect(d25.angleCylinder).toBe(15);
    });

    it('should correctly provide standard Form G and Form H angles', () => {
        const d25G = getUndercutData(25, 'G');
        expect(d25G.form).toBe('G');
        expect(d25G.angleFace).toBe(55);
        expect(d25G.angleCylinder).toBe(17.5);

        const d25H = getUndercutData(25, 'H');
        expect(d25H.form).toBe('H');
        expect(d25H.angleFace).toBe(60);
        expect(d25H.angleCylinder).toBe(15);
    });
});

