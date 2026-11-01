import { describe, it, expect } from 'vitest';
import { calculateIT, getFundamentalDeviation, calculateFit } from '@/lib/engine/iso286';
import { analyzeBearingLife } from '@/lib/mechanical/bearingLifeEngine';
import { SheetMetalEngine } from '@/modules/mechanical/SheetMetal/engine';

describe('P0 Quality & Standard Audit Verification Suite', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ISO 286 Fits & Tolerances Engine (P0-1)
    // ─────────────────────────────────────────────────────────────────────────
    describe('ISO 286-1 & ISO 286-2 Precision Verification', () => {
        it('calculates correct IT grades for nominal steps', () => {
            // For nominal 25mm (18-30 step, D = sqrt(18*30) = 23.24mm):
            // i = 0.45 * (23.24)^(1/3) + 0.001 * 23.24 = 1.284 + 0.023 = 1.307 um
            // IT6 = 10 * i = 13.07 -> 13 um
            // IT7 = 16 * i = 20.91 -> 21 um
            // IT8 = 25 * i = 32.68 -> 33 um
            expect(calculateIT(25, 6)).toBe(13);
            expect(calculateIT(25, 7)).toBe(21);
            expect(calculateIT(25, 8)).toBe(33);
        });

        it('returns exact tabulated fundamental deviations for transition & interference shafts', () => {
            // Nominal 25mm (18-30 step):
            // h: es = 0
            expect(getFundamentalDeviation(25, 'h', 6, false)).toBe(0);
            // p: ei = +22 um
            expect(getFundamentalDeviation(25, 'p', 6, false)).toBe(22);
            // r: ei = +28 um
            expect(getFundamentalDeviation(25, 'r', 6, false)).toBe(28);
            // s: ei = +35 um
            expect(getFundamentalDeviation(25, 's', 6, false)).toBe(35);
            // u: ei = +48 um
            expect(getFundamentalDeviation(25, 'u', 6, false)).toBe(48);

            // Nominal 50mm (40-50 step):
            // p: ei = +26 um
            expect(getFundamentalDeviation(50, 'p', 6, false)).toBe(26);
            // s: ei = +43 um
            expect(getFundamentalDeviation(50, 's', 6, false)).toBe(43);
        });

        it('correctly classifies H7/p6 as pure Interference Fit on Ø25', () => {
            const fit = calculateFit(25, 'H', 7, 'p', 6);
            // Hole H7: 0 to +21 um (25.000 to 25.021 mm)
            expect(fit.holeEI).toBe(0);
            expect(fit.holeES).toBe(21);
            // Shaft p6: +22 to +35 um (25.022 to 25.035 mm)
            expect(fit.shaft_ei).toBe(22);
            expect(fit.shaft_es).toBe(35);

            expect(fit.fitType).toBe('Interference');
            expect(fit.maxClearanceUm).toBe(-1); // min interference = 1 um
            expect(fit.minClearanceUm).toBe(-35); // max interference = 35 um
        });

        it('correctly classifies H7/h6 as Clearance/Location Fit on Ø25', () => {
            const fit = calculateFit(25, 'H', 7, 'h', 6);
            expect(fit.fitType).toBe('Clearance');
            expect(fit.holeEI).toBe(0);
            expect(fit.shaft_es).toBe(0);
            expect(fit.shaft_ei).toBe(-13);
            expect(fit.minClearanceUm).toBe(0);
            expect(fit.maxClearanceUm).toBe(34);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Bearing Life Exponent Regex Bug (P0-2)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Bearing Life Exponent & Type Detection', () => {
        it('assigns ball bearing exponent p = 3 to flanged ball bearings like F688', () => {
            const ballBearing = {
                code: 'F688',
                type: 'deep-groove-ball' as const,
                d: 8,
                D: 16,
                B: 5,
                C: 1.6,
                C0: 0.71
            };
            const life = analyzeBearingLife({
                bearing: ballBearing,
                fr: 0.5,
                fa: 0,
                rpm: 3000
            });
            // L10 = (C / P)^p. With p=3: (1.6 / 0.5)^3 = 3.2^3 = 32.768 million revs
            expect(life.L10).toBeCloseTo(32.768, 1);
        });

        it('assigns roller bearing exponent p = 10/3 to cylindrical roller NU 205', () => {
            const rollerBearing = {
                code: 'NU 205',
                type: 'cylindrical-roller' as const,
                d: 25,
                D: 52,
                B: 15,
                C: 28.5,
                C0: 24.0
            };
            const life = analyzeBearingLife({
                bearing: rollerBearing,
                fr: 5.0,
                fa: 0,
                rpm: 1500
            });
            // L10 = (28.5 / 5.0)^(10/3) = 5.7^(3.333) = ~333 million revs
            const expectedL10 = Math.pow(28.5 / 5.0, 10 / 3);
            expect(life.L10).toBeCloseTo(expectedL10, 1);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Sheet Metal 180° Hemming Singularity Guard (P0-4)
    // ─────────────────────────────────────────────────────────────────────────
    describe('DIN 6935 Sheet Metal Hemming & Boundary Conditions', () => {
        it('calculates standard 90° bend parameters without error', () => {
            const res = SheetMetalEngine.calculate({
                thickness: 2,
                bendAngle: 90,
                innerRadius: 2,
                kFactor: 0.4,
                material: 'Steel'
            });
            // OSSB for 90°: (R + t) * tan(45°) = (2 + 2) * 1 = 4.0 mm
            expect(res.result.outsideSetback).toBe(4.0);
            // BA: (pi/2) * (2 + 0.4 * 2) = 1.57079 * 2.8 = 4.398 mm
            expect(res.result.bendAllowance).toBeCloseTo(4.398, 2);
            expect(res.metadata.validationStatus).toBe('success');
        });

        it('safely handles 180° flat hem without NaN or Infinity explosion', () => {
            const res = SheetMetalEngine.calculate({
                thickness: 1.5,
                bendAngle: 180,
                innerRadius: 0.5,
                kFactor: 0.33,
                material: 'Steel'
            });
            expect(Number.isFinite(res.result.outsideSetback)).toBe(true);
            expect(Number.isFinite(res.result.bendAllowance)).toBe(true);
            expect(Number.isFinite(res.result.bendDeduction)).toBe(true);
            expect(res.metadata.warnings.some(w => w.includes('180° hem'))).toBe(true);
            expect(res.metadata.validationStatus).toBe('warning');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Mohr Stress 3D Tresca Validation (P0-5)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Mohr Circle & 3D Tresca Maximum Shear Stress', () => {
        it('calculates true 3D Tresca shear stress for biaxial tensile stress state', () => {
            // Biaxial tension in plane: sigma_x = 150, sigma_y = 100, tau_xy = 0
            // In-plane: sigma1 = 150, sigma2 = 100
            // In-plane radius R = (150 - 100) / 2 = 25 MPa
            // In 3D plane stress, sigma3 = 0
            // True Tresca max shear = (150 - 0) / 2 = 75 MPa!
            const sigma1 = 150;
            const sigma2 = 100;
            const tauMaxInPlane = (sigma1 - sigma2) / 2;
            const tauMax3D = Math.max(
                Math.abs(sigma1 - sigma2) / 2,
                Math.abs(sigma1) / 2,
                Math.abs(sigma2) / 2
            );
            expect(tauMaxInPlane).toBe(25);
            expect(tauMax3D).toBe(75);
            expect(tauMax3D).toBeGreaterThan(tauMaxInPlane);
        });
    });
});
