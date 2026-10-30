/**
 * tests/shaft-bearing-and-gear.test.ts
 * 
 * Unit tests for Shaft Bearing Catalog Selection, ISO 281 L10h Life Rating,
 * DIN 3960 / ISO 2203 Gear Feature Calculations, and Store Synchronization.
 */

import { describe, test, expect } from 'vitest';
import { 
    calculateGearGeometry, 
    calculateBearingL10h 
} from '../modules/mechanical/ShaftDesign/engine';
import { useShaftDesignStore } from '../modules/mechanical/ShaftDesign/store';
import { BEARING_CATALOG } from '../data/skfBearings';

describe('Gear Geometry Calculations (DIN 3960 / ISO 54)', () => {
    test('Calculates spur gear diameters and forces accurately', () => {
        const m = 2.5;
        const z = 28;
        const b = 40;
        const torqueNm = 150;

        const geom = calculateGearGeometry(m, z, b, 0, 20, torqueNm);

        // d0 = m * z = 2.5 * 28 = 70 mm
        expect(geom.pitchDiameter).toBe(70);
        // da = d0 + 2m = 70 + 5 = 75 mm
        expect(geom.tipDiameter).toBe(75);
        // df = d0 - 2.5m = 70 - 6.25 = 63.75 mm
        expect(geom.rootDiameter).toBe(63.75);

        // Tangential force: Ft = 2 * T / (d0 * 1e-3) = 300 / 0.070 = 4285.7 N -> 4286 N
        expect(geom.tangentialForceN).toBe(4286);
        // Radial force: Fr = Ft * tan(20°) = 4285.7 * 0.36397 = 1559.8 N -> 1560 N
        expect(geom.radialForceN).toBe(1560);
        // Callout includes standard specs
        expect(geom.callout).toContain('Düz Dişli m=2.5 z=28 (d₀=Ø70 da=Ø75)');
    });

    test('Calculates helical gear pitch diameter with cosine beta factor', () => {
        const m = 3.0;
        const z = 20;
        const b = 45;
        const betaDeg = 15;

        const geom = calculateGearGeometry(m, z, b, betaDeg, 20, 200);

        // d0 = (m * z) / cos(15°) = 60 / 0.9659258 = 62.116 mm -> 62.12 mm
        expect(geom.pitchDiameter).toBeCloseTo(62.12, 1);
        expect(geom.tipDiameter).toBeCloseTo(62.12 + 2 * 3.0, 1);
        expect(geom.callout).toContain('Helisel Dişli (β=15°)');
    });
});

describe('ISO 281 Bearing Life (L10h) Calculations', () => {
    test('Calculates ball bearing L10h life correctly (p = 3)', () => {
        const C_kN = 14.8; // SKF 6205
        const loadN = 1480; // 1.48 kN -> C/P = 10
        const rpm = 1500;

        // L10 = (C/P)^3 = 10^3 = 1000 million revolutions
        // L10h = 1e6 / (60 * n) * (C/P)^3 = (1000000 / 90000) * 1000 = 11111.1 hours -> 11111 h
        const l10h = calculateBearingL10h(C_kN, loadN, rpm, false);
        expect(l10h).toBe(11111);
    });

    test('Calculates roller bearing L10h life correctly (p = 10/3)', () => {
        const C_kN = 30.0;
        const loadN = 3000; // C/P = 10
        const rpm = 1000;

        // L10 = 10^(10/3) = 2154.43 million revolutions
        // L10h = (1e6 / 60000) * 2154.43 = 35907 hours
        const l10h = calculateBearingL10h(C_kN, loadN, rpm, true);
        expect(l10h).toBeCloseTo(35907, -2);
    });
});

describe('Shaft Design Store - Bearing Selection & Diameter Synchronization', () => {
    test('BEARING_CATALOG has SKF standard series', () => {
        const skf6205 = BEARING_CATALOG.find(b => b.code === '6205');
        expect(skf6205).toBeDefined();
        expect(skf6205?.d).toBe(25);
        expect(skf6205?.D).toBe(52);
        expect(skf6205?.B).toBe(15);
        expect(skf6205?.C).toBe(14.8);

        const skf6208 = BEARING_CATALOG.find(b => b.code === '6208');
        expect(skf6208).toBeDefined();
        expect(skf6208?.d).toBe(40);
        expect(skf6208?.D).toBeGreaterThanOrEqual(80);
        expect(skf6208?.B).toBeGreaterThanOrEqual(18);
    });

    test('Selecting bearing synchronizes shaft segment diameter', () => {
        const store = useShaftDesignStore.getState();

        // Support A is at position 35mm (falls inside seg-1: length 70)
        // Let's set bearing for Support A to SKF 6206 (bore d = 30mm)
        store.setBearingForSupport('A', '6206', true);

        const stateAfter = useShaftDesignStore.getState();
        expect(stateAfter.supportABearing.bearingCode).toBe('6206');
        expect(stateAfter.supportABearing.boreDia).toBe(30);

        // Segment 0 (covering Support A at 35mm) must now have diameter 30mm
        const seg0 = stateAfter.segments[0];
        expect(seg0.diameter).toBe(30);
    });

    test('Adding and updating gear feature computes valid geometry in store', () => {
        const store = useShaftDesignStore.getState();
        const targetSeg = store.segments[1]; // seg-2

        store.addFeatureToSegment(targetSeg.id, 'gear');
        const stateAfterAdd = useShaftDesignStore.getState();
        const updatedSeg = stateAfterAdd.segments.find(s => s.id === targetSeg.id);
        const gear = updatedSeg?.features.find(f => f.type === 'gear');

        expect(gear).toBeDefined();
        if (gear?.type === 'gear') {
            expect(gear.module).toBeGreaterThan(0);
            expect(gear.pitchDiameter).toBe(gear.module * gear.numTeeth);
            expect(gear.tipDiameter).toBe(gear.pitchDiameter + 2 * gear.module);

            // Update gear teeth
            store.updateFeature(targetSeg.id, gear.id, { numTeeth: 32 });
            const stateAfterUpdate = useShaftDesignStore.getState();
            const segAfter = stateAfterUpdate.segments.find(s => s.id === targetSeg.id);
            const updatedGear = segAfter?.features.find(f => f.id === gear.id);

            if (updatedGear?.type === 'gear') {
                expect(updatedGear.numTeeth).toBe(32);
                expect(updatedGear.pitchDiameter).toBe(updatedGear.module * 32);
            }
        }
    });

    test('Handles large diameter shafts (Ø250mm, Ø500mm) without numerical overflow or breakdown', () => {
        const store = useShaftDesignStore.getState();
        const targetSeg = store.segments[2]; // seg-3

        // Set diameter to 250mm as in user scenario
        store.updateSegment(targetSeg.id, { diameter: 250, length: 425 });
        const stateAfter250 = useShaftDesignStore.getState();
        const seg3 = stateAfter250.segments.find(s => s.id === targetSeg.id);
        expect(seg3?.diameter).toBe(250);
        expect(seg3?.length).toBe(425);

        // Verification of result calculation
        expect(stateAfter250.result).toBeDefined();
        if (stateAfter250.result) {
            expect(stateAfter250.result.maxBendingMomentNm).toBeGreaterThanOrEqual(0);
            expect(stateAfter250.result.minSafetyFactor).toBeGreaterThan(0);
        }

        // Test even larger diameter (Ø500mm turbine rotor)
        store.updateSegment(targetSeg.id, { diameter: 500 });
        const stateAfter500 = useShaftDesignStore.getState();
        const seg500 = stateAfter500.segments.find(s => s.id === targetSeg.id);
        expect(seg500?.diameter).toBe(500);
        expect(stateAfter500.result?.minSafetyFactor).toBeGreaterThan(1);
    });
});

