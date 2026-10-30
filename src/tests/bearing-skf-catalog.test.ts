import { describe, it, expect } from 'vitest';
import { findSKFBearing, SKF_MASTER_CATALOG } from '@/data/mechanical/skfCatalogDatabase';
import {
    calculateAbutmentDimensions,
    getSKFMaintenanceProtocol,
} from '@/data/mechanical/bearingMountingStandards';
import {
    calculateBearingLife,
    BearingData,
    detectBearingType,
} from '@/data/skfBearings';

describe('SKF Master Catalog & Maintenance Handbook Verification (8 Families)', () => {
    // ═════════════════════════════════════════════════════════════════════════
    // 1. DEEP GROOVE BALL BEARINGS (DGBB)
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF 6000-2RSH dimensions and catalog page 266-267', () => {
        const b = findSKFBearing('6000-2RSH');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(266);
        expect(b.d).toBe(10);
        expect(b.D).toBe(26);
        expect(b.B).toBe(8);
        expect(b.d2).toBe(13);
        expect(b.D2).toBe(22.6);
        expect(b.r12Min).toBe(0.3);
        expect(b.daMin).toBe(12);
        expect(b.daMax).toBe(12.5);
        expect(b.DaMax).toBe(24);
        expect(b.raMax).toBe(0.3);
        expect(b.C).toBe(4.75);
        expect(b.C0).toBe(1.96);
        expect(b.Pu).toBe(0.083);
        expect(b.speedLimitingSealedRpm).toBe(19000);
        expect(b.massKg).toBe(0.019);

        // ISO P6 Tolerances (mm)
        expect(b.tolerances.p6.bore_dmp.lowerMm).toBe(-0.007);
        expect(b.tolerances.p6.outer_Dmp.lowerMm).toBe(-0.008);
        expect(b.tolerances.p6.width_Bs.lowerMm).toBe(-0.06);
    });

    it('verifies exact SKF 6301-2RSH dimensions and catalog page 272-273', () => {
        const b = findSKFBearing('6301-2RSH');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(272);
        expect(b.d).toBe(12);
        expect(b.D).toBe(37);
        expect(b.B).toBe(12);
        expect(b.d2).toBe(17.5);
        expect(b.D2).toBe(31.48);
        expect(b.r12Min).toBe(1.0);
        expect(b.daMin).toBe(17.6);
        expect(b.daMax).toBe(17.8);
        expect(b.DaMax).toBe(31.4);
        expect(b.raMax).toBe(1.0);
        expect(b.C).toBe(10.1);
        expect(b.C0).toBe(4.75);
        expect(b.Pu).toBe(0.2);
        expect(b.speedLimitingSealedRpm).toBe(14000);
        expect(b.massKg).toBe(0.06);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 2. ANGULAR CONTACT BALL BEARINGS (ACBB)
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF 7204-BEP (alpha=40°) against catalog page 408-409', () => {
        const b = findSKFBearing('7204-BEP');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(408);
        expect(b.type).toBe('angular-contact-ball');
        expect(b.d).toBe(20);
        expect(b.D).toBe(47);
        expect(b.B).toBe(14);
        expect(b.contactAngleAlpha).toBe(40);
        expect(b.C).toBe(13.3);
        expect(b.C0).toBe(7.65);
        expect(b.Pu).toBe(0.325);
        expect(b.e).toBe(1.14);
        expect(b.Y).toBe(0.57);
        expect(b.Y0).toBe(0.52);

        // ISO 281 load test: Fa/Fr <= 1.14 => P = Fr; Fa/Fr > 1.14 => P = 0.35 Fr + 0.57 Fa
        const bearingData: BearingData = {
            code: b.code,
            type: b.type,
            d: b.d,
            D: b.D,
            B: b.B,
            C: b.C,
            C0: b.C0,
            e: b.e,
            Y: b.Y,
            Y0: b.Y0,
        };

        const loadLowAxial = calculateBearingLife(bearingData, 5.0, 2.0, 3000); // Fa/Fr = 0.4 <= 1.14
        expect(loadLowAxial.P).toBeCloseTo(5.0, 2);

        const loadHighAxial = calculateBearingLife(bearingData, 2.0, 4.0, 3000); // Fa/Fr = 2.0 > 1.14
        expect(loadHighAxial.P).toBeCloseTo(0.35 * 2.0 + 0.57 * 4.0, 2);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 3. SELF-ALIGNING BALL BEARINGS (SABB)
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF 1204 ETN9 against catalog page 452-453', () => {
        const b = findSKFBearing('1204 ETN9');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(452);
        expect(b.type).toBe('self-aligning-ball');
        expect(b.d).toBe(20);
        expect(b.D).toBe(47);
        expect(b.B).toBe(14);
        expect(b.C).toBe(12.7);
        expect(b.C0).toBe(3.4);
        expect(b.Pu).toBe(0.18);
        expect(b.e).toBe(0.28);
        expect(b.Y1).toBe(2.3);
        expect(b.Y2).toBe(3.5);
        expect(b.Y0).toBe(2.5);
        expect(b.adapterSleeveDesignation).toBe('H 204');

        // ISO 281 load test: Fa/Fr <= 0.28 => P = Fr + Y1 * Fa; Fa/Fr > 0.28 => P = 0.65 Fr + Y2 * Fa
        const bearingData: BearingData = {
            code: b.code,
            type: b.type,
            d: b.d,
            D: b.D,
            B: b.B,
            C: b.C,
            C0: b.C0,
            e: b.e,
            Y: b.Y1,
            Y0: b.Y0,
            Y1: b.Y1,
            Y2: b.Y2,
        };

        const loadLow = calculateBearingLife(bearingData, 5.0, 1.0, 3000); // Fa/Fr = 0.2 <= 0.28
        expect(loadLow.P).toBeCloseTo(5.0 + 2.3 * 1.0, 2);

        const loadHigh = calculateBearingLife(bearingData, 2.0, 2.0, 3000); // Fa/Fr = 1.0 > 0.28
        expect(loadHigh.P).toBeCloseTo(0.65 * 2.0 + 3.5 * 2.0, 2);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 4. TAPERED ROLLER BEARINGS (TRB)
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF 30204 J2/Q dimensions (T, B, C, a) against catalog page 696-697', () => {
        const b = findSKFBearing('30204');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(696);
        expect(b.type).toBe('tapered-roller');
        expect(b.d).toBe(20);
        expect(b.D).toBe(47);
        expect(b.totalWidthT).toBe(15.25);
        expect(b.coneWidthB).toBe(14);
        expect(b.cupWidthC).toBe(12);
        expect(b.loadCenterDistA).toBe(11);
        expect(b.C).toBe(34.1);
        expect(b.C0).toBe(28);
        expect(b.Pu).toBe(3.0);
        expect(b.e).toBe(0.37);
        expect(b.Y).toBe(1.6);
        expect(b.Y0).toBe(0.9);

        // Check abutment calculation picks up separable tapered roller parameters
        const abutment = calculateAbutmentDimensions('tapered-roller', 20, 47, 15.25);
        expect(abutment.totalWidthT).toBe(15.25);
        expect(abutment.coneWidthB).toBe(14);
        expect(abutment.cupWidthC).toBe(12);
        expect(abutment.loadCenterDistA).toBe(11);
        expect(abutment.isSeparable).toBe(true);

        // ISO 281 load test: Fa/Fr <= 0.37 => P = Fr; Fa/Fr > 0.37 => P = 0.4 Fr + 1.6 Fa
        const bearingData: BearingData = {
            code: b.code,
            type: b.type,
            d: b.d,
            D: b.D,
            B: b.B,
            C: b.C,
            C0: b.C0,
            e: b.e,
            Y: b.Y,
            Y0: b.Y0,
        };

        const loadLow = calculateBearingLife(bearingData, 10.0, 2.0, 1500); // Fa/Fr = 0.2 <= 0.37
        expect(loadLow.P).toBeCloseTo(10.0, 2);

        const loadHigh = calculateBearingLife(bearingData, 5.0, 4.0, 1500); // Fa/Fr = 0.8 > 0.37
        expect(loadHigh.P).toBeCloseTo(0.4 * 5.0 + 1.6 * 4.0, 2);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 5. CYLINDRICAL ROLLER BEARINGS (CRB NU)
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF NU 204 ECP (F=26.5mm) and TMBR dismounting protocol against page 518-519', () => {
        const b = findSKFBearing('NU 204 ECP');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(518);
        expect(b.type).toBe('cylindrical-roller');
        expect(b.d).toBe(20);
        expect(b.D).toBe(47);
        expect(b.B).toBe(14);
        expect(b.racewayDiameterF).toBe(26.5);
        expect(b.C).toBe(28.5);
        expect(b.C0).toBe(22);
        expect(b.Pu).toBe(2.75);

        // Abutment must enforce daMax < F to allow free axial withdrawal of the inner ring
        const abutment = calculateAbutmentDimensions('cylindrical-roller', 20, 47, 14);
        expect(abutment.racewayDiameterF).toBe(26.5);
        expect(abutment.daMax).toBeLessThan(26.5);
        expect(abutment.isNonLocating).toBe(true);

        // Maintenance protocol must recommend TMBR series induction heating rings for NU flangeless inner ring
        const protocol = getSKFMaintenanceProtocol('cylindrical-roller', 20, 47, false);
        expect(protocol.recommendedDismountingTools.some(t => t.toolCode.includes('TMBR'))).toBe(true);

        // Load test: NU can carry only radial load (Fa triggers warning)
        const bearingData: BearingData = {
            code: b.code,
            type: b.type,
            d: b.d,
            D: b.D,
            B: b.B,
            C: b.C,
            C0: b.C0,
        };
        const loadResult = calculateBearingLife(bearingData, 10.0, 1.0, 3000);
        expect(loadResult.P).toBe(10.0);
        expect(loadResult.warnings.some(w => w.includes('NU tipi silindirik makaralı'))).toBe(true);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 6. SPHERICAL ROLLER BEARINGS (SRB)
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF 22205 E / EK and SKF Drive-up method against catalog page 794-795', () => {
        const b = findSKFBearing('22205 E');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(794);
        expect(b.type).toBe('spherical-roller');
        expect(b.d).toBe(25);
        expect(b.D).toBe(52);
        expect(b.B).toBe(18);
        expect(b.C).toBe(49.9);
        expect(b.C0).toBe(44);
        expect(b.Pu).toBe(4.75);
        expect(b.e).toBe(0.35);
        expect(b.Y1).toBe(1.9);
        expect(b.Y2).toBe(2.9);
        expect(b.Y0).toBe(1.8);
        expect(b.taperedBoreAvailable).toBe(true);
        expect(b.adapterSleeveDesignation).toBe('H 305');

        // Sealed spherical roller bearing protocol: Feeler gauge is physically impossible!
        // SKF Drive-up method with HMV..E hydraulic nut and dial indicator is MANDATORY.
        const protocolSealed = getSKFMaintenanceProtocol('spherical-roller', 25, 52, true);
        expect(protocolSealed.recommendedMountingTools.some(t => t.toolCode.includes('HMV'))).toBe(true);
        expect(protocolSealed.recommendedMountingTools.some(t => t.toolCode.includes('TMCD') || t.toolNameTr.includes('Drive-up'))).toBe(true);
        expect(protocolSealed.mountingStepsTr.some(s => s.includes('Drive-up'))).toBe(true);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 7. THRUST BALL BEARINGS (TBB)
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF 51104 (H=10mm) and pure axial load against catalog page 474-475', () => {
        const b = findSKFBearing('51104');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(474);
        expect(b.type).toBe('thrust-ball');
        expect(b.d).toBe(20);
        expect(b.D).toBe(35);
        expect(b.heightH).toBe(10);
        expect(b.housingWasherBoreD1).toBe(21);
        expect(b.shaftWasherOuterD1).toBe(35);
        expect(b.C).toBe(15.1);
        expect(b.C0).toBe(29);
        expect(b.Pu).toBe(1.08);

        // Abutment must distinguish shaft washer d vs housing washer D1
        const abutment = calculateAbutmentDimensions('thrust-ball', 20, 35, 10);
        expect(abutment.heightH).toBe(10);
        expect(abutment.d1Shoulder).toBe(35);
        expect(abutment.D1Shoulder).toBe(21);

        // Maintenance protocol: force must be applied strictly to shaft washer, never through balls!
        const protocol = getSKFMaintenanceProtocol('thrust-ball', 20, 35, false);
        expect(protocol.mountingStepsTr.some(s => s.includes('mil puluna'))).toBe(true);

        // ISO 281 load test: Thrust ball takes purely Fa. Any Fr triggers warning!
        const bearingData: BearingData = {
            code: b.code,
            type: b.type,
            d: b.d,
            D: b.D,
            B: b.B,
            C: b.C,
            C0: b.C0,
        };
        const loadResult = calculateBearingLife(bearingData, 1.0, 5.0, 1500);
        expect(loadResult.P).toBe(5.0);
        expect(loadResult.warnings.some(w => w.includes('Eksenel rulmanlar radyal yük taşıyamaz'))).toBe(true);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 8. NEEDLE ROLLER BEARINGS (NRB) - DRAWN CUP & MACHINED
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies exact SKF HK 2016 drawn cup (Fw=20, D=26, C=16) and non-reusable destruction rule', () => {
        const b = findSKFBearing('HK 2016');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(622);
        expect(b.type).toBe('needle-roller');
        expect(b.needleType).toBe('drawn-cup');
        expect(b.d).toBe(20);
        expect(b.D).toBe(26);
        expect(b.B).toBe(16);
        expect(b.C).toBe(12.3);
        expect(b.C0).toBe(20.4);
        expect(b.Pu).toBe(2.36);
        expect(b.massKg).toBe(0.019);
        expect(b.shaftHardnessHrc).toContain('58');
        expect(b.shaftRoughnessRa).toContain('0.2');
        expect(b.isReusableAfterDismounting).toBe(false);

        // Maintenance protocol must explicitly declare "Tahribatlı Söküm"
        const protocol = getSKFMaintenanceProtocol('needle-roller', 20, 26, false);
        expect(protocol.recommendedMountingTools.some(t => t.toolNameTr.includes('Mandrel'))).toBe(true);
        expect(protocol.dismountingStepsTr.some(s => s.includes('Tahribatlı Söküm'))).toBe(true);
        expect(protocol.goldenSafetyRulesTr.some(r => r.includes('KESİNLİKLE TEKRAR KULLANILAMAZ'))).toBe(true);
    });

    it('verifies exact SKF NA 4904 machined ring needle bearing against catalog page 640-641', () => {
        const b = findSKFBearing('NA 4904');
        expect(b).toBeDefined();
        if (!b) return;

        expect(b.catalogPageRef).toBe(640);
        expect(b.type).toBe('needle-roller');
        expect(b.needleType).toBe('machined-ring');
        expect(b.d).toBe(20);
        expect(b.D).toBe(37);
        expect(b.B).toBe(17);
        expect(b.racewayDiameterF).toBe(24);
        expect(b.C).toBe(21.6);
        expect(b.C0).toBe(28);
        expect(b.Pu).toBe(3.35);
        expect(b.isReusableAfterDismounting).toBe(true);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 9. LUBRICATION STANDARDS: REPLENISHMENT (Gp) VS INITIAL FILL
    // ═════════════════════════════════════════════════════════════════════════
    it('verifies SKF relubrication formula Gp = 0.005 * D * B and sealed zero initial fill rule', () => {
        // Deep groove sealed bearing (6301-2RSH: d=12, D=37, B=12)
        const abutmentSealed = calculateAbutmentDimensions('deep-groove-ball', 12, 37, 12);
        
        // Relubrication quantity: 0.005 * 37 * 12 = 2.22 g -> rounded to 2.2 g
        expect(abutmentSealed.replenishmentGreaseGrams).toBeCloseTo(0.005 * 37 * 12, 1);

        // Pre-greased sealed bearing (2RSH/2RS1/2Z): Initial fill is ZERO (comes filled from factory)
        expect(abutmentSealed.isPreGreasedSealed).toBe(true);
        expect(abutmentSealed.initialGreaseFillGrams).toBe(0);

        // Open bearing (e.g. 6305 open: d=25, D=62, B=17)
        const abutmentOpen = calculateAbutmentDimensions('deep-groove-ball', 25, 62, 17);
        expect(abutmentOpen.replenishmentGreaseGrams).toBeCloseTo(0.005 * 62 * 17, 1);
        expect(abutmentOpen.isPreGreasedSealed).toBe(false);
        expect(abutmentOpen.initialGreaseFillGrams).toBeGreaterThan(0); // 20-30% housing free volume
    });
});
