import { describe, it, expect } from 'vitest';
import {
    calculateHelicalSpring,
    getMaterialRm,
    SPRING_MATERIALS,
    SpringInputs
} from '@/data/mechanical/springStandards';
import { getSpringModuleStrings } from '../locales/springModuleTranslations';

describe('DIN EN 13906-1 / DIN 2089 Helical Spring Standards', () => {
    it('calculates spring index C and Wahl stress factor Kw correctly', () => {
        const inputs: SpringInputs = {
            wireDiameter: 5.0,
            meanDiameter: 40.0, // C = 8.0
            freeLength: 100.0,
            activeCoils: 10.0,
            endType: 'squared_ground',
            appliedForce1: 200,
            appliedForce2: 600,
            materialId: 'en10270-1-sh'
        };

        const res = calculateHelicalSpring(inputs);
        expect(res.C).toBe(8.0);
        expect(res.isIndexRecommended).toBe(true);

        // kw formula for C=8: (31/28) + 0.615/8 = 1.10714 + 0.076875 = 1.1840
        expect(res.kw).toBeCloseTo(1.184, 3);
    });

    it('calculates spring rate R accurately matching DIN EN 13906-1', () => {
        // d = 4mm, D = 32mm, n = 8, G = 81500 MPa
        // R = (81500 * 4^4) / (8 * 32^3 * 8) = (81500 * 256) / (8 * 32768 * 8) = 20,864,000 / 2,097,152 = 9.9487 N/mm
        const inputs: SpringInputs = {
            wireDiameter: 4.0,
            meanDiameter: 32.0,
            freeLength: 80.0,
            activeCoils: 8.0,
            endType: 'squared_ground',
            appliedForce1: 100,
            appliedForce2: 300,
            materialId: 'en10270-1-sh'
        };

        const res = calculateHelicalSpring(inputs);
        expect(res.R).toBeCloseTo(9.949, 2);

        // Deflection at F2 = 300 N: s2 = 300 / 9.9487 = ~30.15 mm
        expect(res.s2).toBeCloseTo(30.15, 1);
        expect(res.L2).toBeCloseTo(80 - 30.15, 1);
    });

    it('calculates solid length Lc correctly based on end types', () => {
        const base: SpringInputs = {
            wireDiameter: 5.0,
            meanDiameter: 35.0,
            freeLength: 100.0,
            activeCoils: 8.0,
            endType: 'squared_ground',
            appliedForce1: 200,
            appliedForce2: 500,
            materialId: 'en10270-1-sh'
        };

        // Squared and ground: nt = n + 2 = 10; Lc = 10 * 5 = 50 mm
        const resGround = calculateHelicalSpring(base);
        expect(resGround.nt).toBe(10);
        expect(resGround.Lc).toBe(50);
        expect(resGround.sc).toBe(50); // 100 - 50 = 50 mm

        // Squared unground: nt = n + 1.5 = 9.5; Lc = (nt + 1.5) * d = 11 * 5 = 55 mm
        const resUnground = calculateHelicalSpring({ ...base, endType: 'squared_unground' });
        expect(resUnground.nt).toBe(9.5);
        expect(resUnground.Lc).toBe(55);

        // Plain open: nt = n = 8; Lc = (8 + 1) * 5 = 45 mm
        const resOpen = calculateHelicalSpring({ ...base, endType: 'plain_open' });
        expect(resOpen.nt).toBe(8);
        expect(resOpen.Lc).toBe(45);
    });

    it('determines diameter-dependent tensile strength Rm(d) per EN 10270', () => {
        const matSH = SPRING_MATERIALS['en10270-1-sh'];
        // For d = 2.0 mm: Rm = 1780 / (2^0.145) = 1780 / 1.1057 = ~1609 MPa
        const rm2 = getMaterialRm(matSH, 2.0);
        // For d = 8.0 mm: Rm = 1780 / (8^0.145) = 1780 / 1.3518 = ~1316 MPa
        const rm8 = getMaterialRm(matSH, 8.0);

        expect(rm2).toBeGreaterThan(rm8);
        expect(rm2).toBeCloseTo(1610, -1);
        expect(rm8).toBeCloseTo(1316, -1);
    });

    it('accurately identifies buckling risk when slenderness L0 / Dm > 4', () => {
        // Slender spring: L0 = 150, Dm = 25 -> L0/Dm = 6 > 4
        const slender: SpringInputs = {
            wireDiameter: 3.0,
            meanDiameter: 25.0,
            freeLength: 150.0,
            activeCoils: 12.0,
            endType: 'squared_ground',
            appliedForce1: 50,
            appliedForce2: 250,
            materialId: 'en10270-1-sh'
        };

        const resSlender = calculateHelicalSpring(slender);
        expect(resSlender.slenderness).toBe(6.0);
        expect(resSlender.isBucklingRisk).toBe(true);

        // Stiff spring: L0 = 60, Dm = 30 -> L0/Dm = 2 <= 4
        const stable: SpringInputs = {
            wireDiameter: 5.0,
            meanDiameter: 30.0,
            freeLength: 60.0,
            activeCoils: 5.0,
            endType: 'squared_ground',
            appliedForce1: 200,
            appliedForce2: 600,
            materialId: 'en10270-1-sh'
        };
        const resStable = calculateHelicalSpring(stable);
        expect(resStable.slenderness).toBe(2.0);
        expect(resStable.isBucklingRisk).toBe(false);
    });

    it('calculates resonance natural frequency fe', () => {
        const inputs: SpringInputs = {
            wireDiameter: 4.0,
            meanDiameter: 28.0,
            freeLength: 60.0,
            activeCoils: 6.0,
            endType: 'squared_ground',
            appliedForce1: 150,
            appliedForce2: 450,
            materialId: 'en10270-2-vdsicr'
        };

        const res = calculateHelicalSpring(inputs);
        // fe should be positive and in typical range for automotive valve springs (150 - 450 Hz)
        expect(res.resonanceFreq).toBeGreaterThan(100);
        expect(res.resonanceFreq).toBeLessThan(600);
    });

    it('calculates Goodman dynamic fatigue and shot-peening boost', () => {
        const base: SpringInputs = {
            wireDiameter: 4.5,
            meanDiameter: 28.0,
            freeLength: 52.0,
            activeCoils: 5.5,
            endType: 'squared_ground',
            appliedForce1: 200,
            appliedForce2: 600,
            materialId: 'en10270-2-vdsicr',
            isShotPeened: false
        };

        const resUnpeened = calculateHelicalSpring(base);
        const resPeened = calculateHelicalSpring({ ...base, isShotPeened: true });

        expect(resUnpeened.tau_m).toBeCloseTo((resUnpeened.tau1 + resUnpeened.tau2) / 2, 1);
        expect(resUnpeened.tau_a).toBeCloseTo((resUnpeened.tau2 - resUnpeened.tau1) / 2, 1);
        expect(resPeened.tau_O).toBeGreaterThan(resUnpeened.tau_O);
        expect(resPeened.SF_dynamic).toBeGreaterThan(resUnpeened.SF_dynamic);
    });

    it('applies temperature derating to shear modulus G and stiffness R', () => {
        const base: SpringInputs = {
            wireDiameter: 4.0,
            meanDiameter: 32.0,
            freeLength: 80.0,
            activeCoils: 8.0,
            endType: 'squared_ground',
            appliedForce1: 100,
            appliedForce2: 300,
            materialId: 'en10270-1-sh',
            operatingTemp: 20
        };

        const res20 = calculateHelicalSpring(base);
        const res100 = calculateHelicalSpring({ ...base, operatingTemp: 100 });

        expect(res20.G_effective).toBe(81500);
        expect(res100.G_effective).toBeLessThan(res20.G_effective);
        expect(res100.R).toBeLessThan(res20.R);
        expect(res100.tempDeratingFactor).toBeCloseTo(1 - 2.5e-4 * (100 - 20), 4);
    });

    it('calculates radial expansion under load and housing clearance', () => {
        const inputs: SpringInputs = {
            wireDiameter: 4.0,
            meanDiameter: 30.0,
            freeLength: 70.0,
            activeCoils: 7.0,
            endType: 'squared_ground',
            appliedForce1: 100,
            appliedForce2: 400,
            materialId: 'en10270-1-sh',
            housingDiameter: 36.0,
            mandrelDiameter: 24.0
        };

        const res = calculateHelicalSpring(inputs);
        expect(res.deltaDe_c).toBeGreaterThan(0);
        expect(res.De_c).toBeGreaterThan(res.De);
        expect(res.De_2).toBeGreaterThanOrEqual(res.De);
        expect(res.housingClearance).toBeCloseTo(36.0 - res.De_c, 2);
        expect(res.isHousingOk).toBe(true);
    });

    it('scales DIN EN 15800 tolerances according to grade (1, 2, 3)', () => {
        const base: SpringInputs = {
            wireDiameter: 3.0,
            meanDiameter: 24.0,
            freeLength: 60.0,
            activeCoils: 8.0,
            endType: 'squared_ground',
            appliedForce1: 50,
            appliedForce2: 200,
            materialId: 'en10270-1-sh',
        };

        const grade1 = calculateHelicalSpring({ ...base, toleranceGrade: 1 });
        const grade2 = calculateHelicalSpring({ ...base, toleranceGrade: 2 });
        const grade3 = calculateHelicalSpring({ ...base, toleranceGrade: 3 });

        expect(grade1.tol_De).toBeLessThan(grade2.tol_De);
        expect(grade2.tol_De).toBeLessThan(grade3.tol_De);
        expect(grade1.tol_L0).toBeLessThan(grade2.tol_L0);
        expect(grade2.tol_L0).toBeLessThan(grade3.tol_L0);
    });

    it('calculates DIN EN 13906-2 helical extension spring mechanics (initial tension F0, hook bending stress sigma_b2, and elongation)', () => {
        const tensionInputs: SpringInputs = {
            springKind: 'extension',
            wireDiameter: 2.0,
            meanDiameter: 16.0,
            freeLength: 50.0,
            activeCoils: 15.0,
            endType: 'plain_open',
            hookType: 'german',
            appliedForce1: 20,
            appliedForce2: 60,
            materialId: 'en10270-1-sh',
            toleranceGrade: 2,
            operatingTemp: 20
        };

        const res = calculateHelicalSpring(tensionInputs);

        // 1. Initial tension F0 must be positive and non-zero
        expect(res.F0).toBeGreaterThan(0);
        expect(res.tau0).toBeGreaterThan(0);

        // 2. Deflection starts only after F > F0
        expect(res.s1).toBeCloseTo(Math.max(0, (20 - res.F0) / res.R), 2);
        expect(res.s2).toBeCloseTo(Math.max(0, (60 - res.F0) / res.R), 2);

        // 3. Extended lengths
        expect(res.L1).toBeCloseTo(res.L0 + res.s1, 2);
        expect(res.L2).toBeCloseTo(res.L0 + res.s2, 2);

        // 4. Hook bending stress sigma_b2 and hook safety factor
        expect(res.sigma_b2).toBeGreaterThan(0);
        expect(res.SF_hook).toBeGreaterThan(0);
        expect(res.SF_body).toBeGreaterThan(0);
        expect(res.SF_static).toBe(Math.min(res.SF_body, res.SF_hook));

        // 5. Body length Lk and hook height LH
        expect(res.Lk).toBe((15.0 + 1) * 2.0); // 32 mm
        expect(res.LH).toBe(14.0); // Di = Dm - d = 16 - 2 = 14 mm
    });

    it('handles custom initial tension force and respects safe deflection limits in extension springs', () => {
        const customF0Inputs: SpringInputs = {
            springKind: 'extension',
            wireDiameter: 2.5,
            meanDiameter: 20.0,
            freeLength: 70.0,
            activeCoils: 20.0,
            endType: 'plain_open',
            hookType: 'extended_german',
            initialTensionForce: 35.0,
            appliedForce1: 30, // Less than F0 -> s1 should be 0
            appliedForce2: 120, // Greater than F0 -> s2 should be (120 - 35) / R
            materialId: 'en10270-1-sh'
        };

        const res = calculateHelicalSpring(customF0Inputs);
        expect(res.F0).toBe(35.0);
        expect(res.s1).toBe(0); // F1 < F0, no elongation
        expect(res.s2).toBeCloseTo((120 - 35) / res.R, 2);
        expect(res.s_zul).toBeGreaterThan(0);
        expect(res.isBucklingRisk).toBe(false); // Tension springs do not buckle
    });

    it('provides complete and valid 12-language dictionaries with zero undefined values', () => {
        const languages = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'] as const;

        for (const lang of languages) {
            const t = getSpringModuleStrings(lang);
            expect(t).toBeDefined();
            expect(t.titleCompression).toBeTruthy();
            expect(t.titleExtension).toBeTruthy();
            expect(t.compressionSpring).toBeTruthy();
            expect(t.extensionSpring).toBeTruthy();
            expect(t.hookType).toBeTruthy();
            expect(t.initialTension).toBeTruthy();
            expect(t.hookGerman).toBeTruthy();
            expect(t.hookIntegrityTitle).toBeTruthy();
            expect(t.hookStressCardTitle).toBeTruthy();

            // Ensure no key is undefined
            for (const [key, value] of Object.entries(t)) {
                expect(value, `Key "${key}" in language "${lang}" must not be undefined`).toBeDefined();
                expect(typeof value).toBe('string');
            }
        }
    });
});


