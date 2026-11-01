import { describe, it, expect } from 'vitest';
import {
    calculateKhkInternalGear,
    calculateKhkRackAndPinion,
    calculateKhkBevelGear,
    calculateKhkWormGear,
    calculateKhkScrewGear,
} from '@/engines/math/khkGearSuiteEngine';

describe('KHK Gear Suite Engine (KHK Reference Section 4 / ISO / DIN / JIS)', () => {
    describe('1. KHK Internal Gears & Interference Analysis (KHK Table 4.4 & 4.5)', () => {
        it('calculates standard internal gear dimensions according to KHK Table 4.4', () => {
            const result = calculateKhkInternalGear({
                module: 2.5,
                pinionTeeth: 18,
                ringTeeth: 54,
                pressureAngleDeg: 20,
            });

            // Reference diameters: d = z * m
            expect(result.d1).toBeCloseTo(45.0, 4);
            expect(result.d2).toBeCloseTo(135.0, 4);
            // Center distance: a = (z2 - z1) * m / 2 = 36 * 2.5 / 2 = 45 mm
            expect(result.centerDistance).toBeCloseTo(45.0, 4);
            // Ring gear internal tip diameter: da2 = d2 - 2 * m = 135 - 5 = 130 mm
            expect(result.da2).toBeCloseTo(130.0, 4);
            // Ring gear root diameter: df2 = d2 + 2.5 * m = 135 + 6.25 = 141.25 mm
            expect(result.df2).toBeCloseTo(141.25, 4);
            // Pinion tip da1 = 45 + 5 = 50 mm
            expect(result.da1).toBeCloseTo(50.0, 4);
            // Safe assembly with z2 - z1 = 36 >> 8
            expect(result.isSafeForAssembly).toBe(true);
            expect(result.trochoidInterference.hasInterference).toBe(false);
        });

        it('detects trochoid and trimming interference when tooth difference is dangerously small', () => {
            const result = calculateKhkInternalGear({
                module: 3,
                pinionTeeth: 20,
                ringTeeth: 24, // deltaZ = 4, severe interference
                pressureAngleDeg: 20,
            });

            expect(result.trochoidInterference.hasInterference).toBe(true);
            expect(result.trimmingInterference.hasInterference).toBe(true);
            expect(result.isSafeForAssembly).toBe(false);
        });
    });

    describe('2. KHK Rack and Pinion (KHK Table 4.6, 4.7 & 4.10)', () => {
        it('calculates standard spur rack and pinion dimensions and linear travel (KHK Table 4.6)', () => {
            const result = calculateKhkRackAndPinion({
                module: 3,
                pinionTeeth: 20,
                rackHeightToPitch: 28, // H = 28 mm
                helixAngleDeg: 0,
                rpm: 150,
                pinionTorqueNm: 40,
            });

            // d1 = 20 * 3 = 60 mm
            expect(result.d1).toBeCloseTo(60.0, 4);
            // Mounting distance: a = d1/2 + H = 30 + 28 = 58 mm
            expect(result.mountingDistance).toBeCloseTo(58.0, 4);
            // Travel per rev: L = pi * d1 = 60 * pi = 188.4955 mm
            expect(result.travelPerRevMm).toBeCloseTo(Math.PI * 60, 4);
            // Linear velocity: (188.4955 * 150) / 60000 = 0.4712 m/s
            expect(result.linearVelocityMPerSec).toBeCloseTo(0.4712, 3);
            // Feed force: Ft = 2000 * 40 / 60 = 1333.33 N
            expect(result.feedForceN).toBeCloseTo(1333.333, 2);
            expect(result.axialThrustForceN).toBeCloseTo(0, 4);
        });

        it('calculates profile-shifted helical rack and mounting distance (KHK Table 4.10)', () => {
            const result = calculateKhkRackAndPinion({
                module: 2.5,
                pinionTeeth: 24,
                rackHeightToPitch: 32,
                helixAngleDeg: 15,
                profileShift: 0.25,
            });

            // mt = 2.5 / cos(15 deg) = 2.58819 mm
            expect(result.mt).toBeCloseTo(2.5 / Math.cos(15 * Math.PI / 180), 4);
            const expectedD1 = 24 * (2.5 / Math.cos(15 * Math.PI / 180));
            expect(result.d1).toBeCloseTo(expectedD1, 4);
            // a = d1/2 + H + x * mn = d1/2 + 32 + 0.25 * 2.5
            const expectedMounting = expectedD1 / 2 + 32 + 0.25 * 2.5;
            expect(result.mountingDistance).toBeCloseTo(expectedMounting, 4);
            // Axial thrust is non-zero for helical rack
            expect(result.axialThrustForceN).toBeGreaterThan(0);
        });
    });

    describe('3. KHK Bevel Gears (Gleason System Table 4.16)', () => {
        it('calculates Gleason miter gear pair (1:1 ratio, 90 deg shaft angle)', () => {
            const result = calculateKhkBevelGear({
                module: 4,
                pinionTeeth: 25,
                gearTeeth: 25,
                shaftAngleDeg: 90,
                system: 'gleason',
            });

            expect(result.d1).toBeCloseTo(100.0, 4);
            expect(result.d2).toBeCloseTo(100.0, 4);
            // Pitch cone angles: delta1 = delta2 = 45 deg
            expect(result.delta1Deg).toBeCloseTo(45.0, 4);
            expect(result.delta2Deg).toBeCloseTo(45.0, 4);
            // Outer cone distance Re = 100 / (2 * sin(45 deg)) = 70.7107 mm
            expect(result.coneDistanceRe).toBeCloseTo(50 * Math.SQRT2, 4);
            // For 1:1 miter, ha1 = ha2 = 1.0 * m = 4.0 mm
            expect(result.ha1).toBeCloseTo(4.0, 4);
            expect(result.ha2).toBeCloseTo(4.0, 4);
            // Tip diameter: da1 = d1 + 2 * ha1 * cos(45) = 100 + 8 * 0.7071 = 105.6568 mm
            expect(result.da1).toBeCloseTo(100 + 8 * Math.cos(Math.PI / 4), 3);
        });

        it('calculates Gleason reduction bevel gear with strength balancing (Table 4.16)', () => {
            const result = calculateKhkBevelGear({
                module: 3,
                pinionTeeth: 20,
                gearTeeth: 40, // ratio u = 2
                shaftAngleDeg: 90,
                system: 'gleason',
            });

            expect(result.d1).toBeCloseTo(60.0, 4);
            expect(result.d2).toBeCloseTo(120.0, 4);
            // delta1 = arctan(20/40) = 26.565 deg, delta2 = 63.435 deg
            expect(result.delta1Deg).toBeCloseTo(26.565, 2);
            expect(result.delta2Deg).toBeCloseTo(63.435, 2);
            // Gleason addendums: ha2 = 3 * (0.54 + 0.46 / 4) = 1.965 mm, ha1 = 6 - 1.965 = 4.035 mm
            expect(result.ha2).toBeCloseTo(1.965, 3);
            expect(result.ha1).toBeCloseTo(4.035, 3);
            // Pinion tip diameter: da1 = 60 + 2 * 4.035 * cos(26.565 deg) = 67.218 mm
            expect(result.da1).toBeCloseTo(60 + 2 * 4.035 * Math.cos(26.565 * Math.PI / 180), 2);
        });
    });

    describe('4. KHK Cylindrical Worm Gear Pair (Table 4.22 / DIN 3975)', () => {
        it('calculates worm and wheel dimensions, center distance and efficiency (KHK Table 4.22)', () => {
            const result = calculateKhkWormGear({
                axialModule: 4,
                wormStarts: 2,
                wheelTeeth: 40,
                diameterFactorQ: 10,
                normalPressureAngleDeg: 20,
                frictionCoeff: 0.04,
                wormRpm: 1450,
                wormTorqueNm: 60,
            });

            // d1 = q * mx = 10 * 4 = 40 mm
            expect(result.d1).toBeCloseTo(40.0, 4);
            // d2 = z2 * mx = 40 * 4 = 160 mm
            expect(result.d2).toBeCloseTo(160.0, 4);
            // a = (d1 + d2) / 2 = (40 + 160) / 2 = 100 mm
            expect(result.centerDistance).toBeCloseTo(100.0, 4);
            // Lead angle gamma = arctan(z1 / q) = arctan(2 / 10) = 11.3099 deg
            expect(result.leadAngleGammaDeg).toBeCloseTo(11.31, 2);
            // Worm tip da1 = 40 + 2 * 4 = 48 mm, df1 = 40 - 2.4 * 4 = 30.4 mm
            expect(result.da1).toBeCloseTo(48.0, 4);
            expect(result.df1).toBeCloseTo(30.4, 4);
            // Wheel throat da2 = 160 + 8 = 168 mm
            expect(result.da2).toBeCloseTo(168.0, 4);
            // Throat curvature radius: ri = a - da1/2 = 100 - 24 = 76 mm
            expect(result.throatRadiusRi).toBeCloseTo(76.0, 4);
            // High efficiency with 2-start worm
            expect(result.meshEfficiencyEta).toBeGreaterThan(75);
            expect(result.isSelfLocking).toBe(false);
        });

        it('identifies self-locking condition on single-start worm with low lead angle', () => {
            const result = calculateKhkWormGear({
                axialModule: 2,
                wormStarts: 1, // Single start
                wheelTeeth: 60,
                diameterFactorQ: 18, // Large q => very small gamma
                frictionCoeff: 0.08,
            });

            // tan(gamma) = 1 / 18 = 0.0555 => gamma = 3.18 deg
            expect(result.leadAngleGammaDeg).toBeLessThan(4.0);
            // Friction angle rho' = arctan(0.08 / cos(20 deg)) = 4.86 deg
            // Since gamma (3.18 deg) < rho' (4.86 deg), drive is self-locking
            expect(result.isSelfLocking).toBe(true);
        });
    });

    describe('5. KHK Screw Gears / Crossed Helical (Table 4.24 / JIS B 1702)', () => {
        it('calculates 90 deg shaft angle screw gear pair (KHK Table 4.24)', () => {
            const result = calculateKhkScrewGear({
                normalModule: 3,
                teethPinion: 15,
                teethGear: 30,
                helixAnglePinionDeg: 45,
                helixAngleGearDeg: 45,
                handPinion: 'right',
                handGear: 'right',
                pinionRpm: 1200,
            });

            // Shaft angle Sigma = 45 + 45 = 90 deg
            expect(result.shaftAngleSigmaDeg).toBeCloseTo(90.0, 4);
            // d1 = 15 * 3 / cos(45 deg) = 63.6396 mm
            expect(result.d1).toBeCloseTo(45 / Math.cos(Math.PI / 4), 3);
            // d2 = 30 * 3 / cos(45 deg) = 127.2792 mm
            expect(result.d2).toBeCloseTo(90 / Math.cos(Math.PI / 4), 3);
            // a = (d1 + d2) / 2 = 95.4594 mm
            expect(result.centerDistance).toBeCloseTo((result.d1 + result.d2) / 2, 4);
            // da1 = d1 + 2 * mn = 63.6396 + 6 = 69.6396 mm
            expect(result.da1).toBeCloseTo(result.d1 + 6, 4);
            // Sliding velocity is computed
            expect(result.slidingVelocityVs).toBeGreaterThan(0);
        });
    });
});
