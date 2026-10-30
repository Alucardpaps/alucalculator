import { describe, it, expect } from 'vitest';
import {
    calculateAbutmentDimensions,
    getMountingMethodsForType,
} from '@/data/mechanical/bearingMountingStandards';
import type { BearingType } from '@/data/skfBearings';

describe('Bearing Mounting Standards & Abutment Dimensions (DIN 5418 / ISO 15)', () => {
    it('calculates proper abutment shoulders for standard deep groove ball bearing (6204: 20x47x14)', () => {
        const abutment = calculateAbutmentDimensions('deep-groove-ball', 20, 47, 14);

        // daMin must be greater than bore d (20mm) and provide inner ring shoulder support
        expect(abutment.daMin).toBeGreaterThan(20);
        expect(abutment.daMin).toBeLessThan(abutment.daMax);

        // DaMax must be less than outer diameter D (47mm) to support outer ring
        expect(abutment.DaMax).toBeLessThan(47);
        expect(abutment.DaMax).toBeGreaterThan(abutment.daMin);

        // raMax must not exceed bearing chamfer rMin (to prevent corner binding)
        expect(abutment.raMax).toBeLessThanOrEqual(abutment.rMin);

        // Locknut matching (d = 20mm -> KM 4, MB 4)
        expect(abutment.locknut.designation).toBe('DIN 981 KM 4');
        expect(abutment.locknut.washer).toBe('DIN 5406 MB 4');
        expect(abutment.locknut.tighteningTorqueNm).toBe(35);

        // Fits
        expect(abutment.shaftFit).toBe('k5');
        expect(abutment.housingFit).toBe('H7');
    });

    it('handles tapered roller bearing geometry and tighter fit recommendations (30204: 20x47x15.25)', () => {
        const abutment = calculateAbutmentDimensions('tapered-roller', 20, 47, 15.25);

        expect(abutment.daMin).toBeGreaterThan(20);
        expect(abutment.housingFit).toBe('K7'); // Tighter fit for shock and heavy radial loads
        expect(abutment.greaseGramsInitial).toBeGreaterThan(0);
        expect(abutment.inductionHeatingTempC).toBe(110);
        expect(abutment.radialThermalExpansionUm).toBeGreaterThan(15);
    });

    it('computes thrust bearing abutments with adequate washer clearance', () => {
        const abutment = calculateAbutmentDimensions('thrust-ball', 25, 47, 15);

        expect(abutment.daMin).toBeGreaterThan(25);
        expect(abutment.DaMax).toBeLessThan(47);
    });

    it('returns mounting methods with DB, DF, DT for angular contact bearings', () => {
        const methods = getMountingMethodsForType('angular-contact-ball');
        const ids = methods.map((m) => m.id);

        expect(ids).toContain('back-to-back');
        expect(ids).toContain('face-to-face');
        expect(ids).toContain('tandem');

        const db = methods.find((m) => m.id === 'back-to-back')!;
        expect(db.symbol).toBe('< >');
        expect(db.descriptionTr).toContain('moment rijitliği');
    });

    it('returns locating and non-locating methods for cylindrical roller bearings', () => {
        const methods = getMountingMethodsForType('cylindrical-roller');
        const ids = methods.map((m) => m.id);

        expect(ids).toContain('non-locating');
        expect(ids).toContain('locating');

        const nu = methods.find((m) => m.id === 'non-locating')!;
        expect(nu.nameTr).toContain('NU');
    });

    it('returns washer orientation warnings for thrust bearings', () => {
        const methods = getMountingMethodsForType('thrust-ball');
        expect(methods.length).toBeGreaterThan(0);
        const thrustMethod = methods[0];
        expect(thrustMethod.rulesTr.some((r) => r.includes('Gövde pulu kesinlikle mile temas etmemelidir'))).toBe(true);
    });

    it('returns adapter sleeve method for self-aligning ball bearings', () => {
        const methods = getMountingMethodsForType('self-aligning-ball');
        const ids = methods.map((m) => m.id);
        expect(ids).toContain('adapter-sleeve');
    });
});
