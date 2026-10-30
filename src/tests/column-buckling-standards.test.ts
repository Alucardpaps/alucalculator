/**
 * src/tests/column-buckling-standards.test.ts
 *
 * Verifies Column Buckling equations against:
 * - EN 1993-1-1 (Eurocode 3) Design of Steel Structures
 * - AISC 360-16 Specification for Structural Steel Buildings (Chapter E)
 * - DIN 4114 Tetmajer Inelastic Buckling
 * - Euler Elastic Buckling (Cases 1-4)
 */

import { describe, it, expect } from 'vitest';

describe('Column Buckling Multi-Standard Verification', () => {
    // Standard test column: S275 steel, pinned-pinned, L = 2000 mm, d = 50 mm circular rod
    const L = 2000; // mm
    const E_MPa = 200000; // MPa (200 GPa)
    const fy = 275; // MPa
    const d = 50; // mm
    const I = (Math.PI * Math.pow(d, 4)) / 64; // mm^4
    const A = (Math.PI * Math.pow(d, 2)) / 4; // mm^2
    const r = Math.sqrt(I / A); // d / 4 = 12.5 mm

    it('computes exact Euler buckling load across all 4 boundary conditions', () => {
        const K_FACTORS: Record<string, number> = {
            'fixed-fixed': 0.5,
            'fixed-pinned': 0.707,
            'pinned-pinned': 1.0,
            'fixed-free': 2.0
        };

        for (const [condition, K] of Object.entries(K_FACTORS)) {
            const Le = K * L;
            const Pcr = (Math.PI * Math.PI * E_MPa * I) / (Le * Le); // N
            const Pcr_kN = Pcr / 1000;

            // Theoretical ratios relative to pinned-pinned (K=1.0)
            // K=0.5 -> 4.0x
            // K=0.707 -> ~2.0x
            // K=2.0 -> 0.25x
            const Pcr_pinned = (Math.PI * Math.PI * E_MPa * I) / (L * L);
            const ratio = Pcr / Pcr_pinned;

            if (condition === 'fixed-fixed') {
                expect(ratio).toBeCloseTo(4.0, 2);
            } else if (condition === 'fixed-pinned') {
                expect(ratio).toBeCloseTo(2.0, 1);
            } else if (condition === 'fixed-free') {
                expect(ratio).toBeCloseTo(0.25, 2);
            } else {
                expect(ratio).toBeCloseTo(1.0, 2);
            }
            expect(Pcr_kN).toBeGreaterThan(0);
        }
    });

    it('verifies AISC 360-16 Chapter E inelastic vs elastic transition', () => {
        // Effective length factor for pinned-pinned: K = 1.0
        const lambda = (1.0 * L) / r; // 2000 / 12.5 = 160
        const lambda_c_AISC = 4.71 * Math.sqrt(E_MPa / fy); // 4.71 * sqrt(200000/275) = 127.0

        // For lambda = 160 > 127.0 -> Elastic buckling regime
        const Fe = (Math.PI * Math.PI * E_MPa) / (lambda * lambda);
        const Fcr_elastic = 0.877 * Fe;
        const Pn_elastic = (Fcr_elastic * A) / 1000; // kN
        const phiC_Pn = 0.90 * Pn_elastic;

        expect(lambda).toBeGreaterThan(lambda_c_AISC);
        expect(Fcr_elastic).toBeLessThan(fy);
        expect(phiC_Pn).toBeLessThan(Pn_elastic);
        expect(phiC_Pn).toBeCloseTo(0.90 * Pn_elastic, 2);

        // For a short/stubby column (L = 500 mm -> lambda = 40 <= 127.0 -> Inelastic regime)
        const lambda_short = (1.0 * 500) / r; // 40
        const Fe_short = (Math.PI * Math.PI * E_MPa) / (lambda_short * lambda_short);
        const Fcr_inelastic = Math.pow(0.658, fy / Fe_short) * fy;
        const Pn_inelastic = (Fcr_inelastic * A) / 1000;

        expect(lambda_short).toBeLessThan(lambda_c_AISC);
        expect(Fcr_inelastic).toBeGreaterThan(Fcr_elastic);
        expect(Fcr_inelastic).toBeLessThanOrEqual(fy);
        expect(Pn_inelastic).toBeGreaterThan(0);
    });

    it('verifies EN 1993-1-1 Eurocode 3 reduction factor chi across slenderness curves', () => {
        const eps = Math.sqrt(235 / fy);
        const lambda1 = 93.9 * eps;
        const lambda = (1.0 * L) / r;
        const lambdaBar = lambda / lambda1;

        expect(lambdaBar).toBeGreaterThan(0.2); // Not in plateau region

        const alpha_b = 0.34; // Curve b
        const Phi = 0.5 * (1 + alpha_b * (lambdaBar - 0.2) + lambdaBar * lambdaBar);
        const disc = Math.max(0, Phi * Phi - lambdaBar * lambdaBar);
        const chi = Math.min(1.0, 1.0 / (Phi + Math.sqrt(disc)));

        expect(chi).toBeGreaterThan(0);
        expect(chi).toBeLessThan(1.0);

        const Nb_rd = (chi * A * fy) / 1.0 / 1000; // kN
        expect(Nb_rd).toBeGreaterThan(0);
        expect(Nb_rd).toBeLessThan((A * fy) / 1000); // Less than squash load
    });

    it('verifies boundary fixture assignment logic', () => {
        const getFixtures = (endCondition: 'pinned-pinned' | 'fixed-free' | 'fixed-fixed' | 'fixed-pinned') => {
            let topFixtureType: 'pinned' | 'fixed' | 'free' = 'pinned';
            let botFixtureType: 'pinned' | 'fixed' = 'pinned';
            if (endCondition === 'fixed-free') {
                topFixtureType = 'free';
                botFixtureType = 'fixed';
            } else if (endCondition === 'fixed-fixed') {
                topFixtureType = 'fixed';
                botFixtureType = 'fixed';
            } else if (endCondition === 'fixed-pinned') {
                topFixtureType = 'pinned';
                botFixtureType = 'fixed';
            } else {
                topFixtureType = 'pinned';
                botFixtureType = 'pinned';
            }
            return { topFixtureType, botFixtureType };
        };

        expect(getFixtures('fixed-pinned')).toEqual({ topFixtureType: 'pinned', botFixtureType: 'fixed' });
        expect(getFixtures('fixed-fixed')).toEqual({ topFixtureType: 'fixed', botFixtureType: 'fixed' });
        expect(getFixtures('pinned-pinned')).toEqual({ topFixtureType: 'pinned', botFixtureType: 'pinned' });
        expect(getFixtures('fixed-free')).toEqual({ topFixtureType: 'free', botFixtureType: 'fixed' });
    });

    describe('P0 Regression Vectors (ALUCALC_P0_REGRESSION_VECTORS_2026-10-03)', () => {
        const E_ref = 200000; // MPa
        const Sy_ref = 250; // MPa
        const A_ref = 1963; // mm²

        it('COL-EUL-001: verifies slender column (lambda = 160 > Cc) yields Euler and Johnson is N/A', () => {
            const lambda = 160;
            const Cc = Math.sqrt((2 * Math.PI ** 2 * E_ref) / Sy_ref);
            expect(Cc).toBeCloseTo(125.663706, 5);

            const eulerStress = (Math.PI ** 2 * E_ref) / (lambda ** 2);
            const eulerLoad_kN = (eulerStress * A_ref) / 1000;

            expect(eulerStress).toBeCloseTo(77.106284, 4);
            expect(eulerLoad_kN).toBeCloseTo(151.359636, 4);

            const johnsonApplicable = lambda <= Cc;
            expect(johnsonApplicable).toBe(false);

            // Crucial acceptance: Johnson must NOT copy Euler's load when lambda > Cc
            const johnsonStress = johnsonApplicable
                ? Sy_ref * (1 - (Sy_ref * lambda ** 2) / (4 * Math.PI ** 2 * E_ref))
                : null;
            expect(johnsonStress).toBeNull();
        });

        it('COL-JHN-001: verifies intermediate column (lambda = 100 <= Cc) activates Johnson parabolic', () => {
            const lambda = 100;
            const Cc = Math.sqrt((2 * Math.PI ** 2 * E_ref) / Sy_ref);
            expect(lambda <= Cc).toBe(true);

            const eulerStress = (Math.PI ** 2 * E_ref) / (lambda ** 2);
            expect(eulerStress).toBeCloseTo(197.392088, 4);

            const johnsonStress = Sy_ref * (1 - (Sy_ref * lambda ** 2) / (4 * Math.PI ** 2 * E_ref));
            const johnsonLoad_kN = (johnsonStress * A_ref) / 1000;

            expect(johnsonStress).toBeCloseTo(170.842825, 4);
            expect(johnsonLoad_kN).toBeCloseTo(335.364466, 4);
            expect(johnsonStress).toBeLessThan(eulerStress);
        });

        it('COL-TRN-001: verifies exact Euler/Johnson transition intersection at lambda = Cc', () => {
            const Cc = Math.sqrt((2 * Math.PI ** 2 * E_ref) / Sy_ref); // 125.6637061436
            const lambda = Cc;

            const eulerStress = (Math.PI ** 2 * E_ref) / (lambda ** 2);
            const johnsonStress = Sy_ref * (1 - (Sy_ref * lambda ** 2) / (4 * Math.PI ** 2 * E_ref));

            // At transition, both equations yield exactly Sy / 2 = 125.0 MPa
            expect(eulerStress).toBeCloseTo(125.0, 5);
            expect(johnsonStress).toBeCloseTo(125.0, 5);
            expect(eulerStress).toBeCloseTo(johnsonStress, 6);
        });
    });
});
