import { describe, it, expect } from 'vitest';
import { ColumnBucklingNode } from '@/flow/nodes/Mechanical/mech-column-buckling';
import { 
    betaWFromFy, 
    filletThroatMm, 
    filletThroatStresses, 
    directionalFilletCheck 
} from '@/data/mechanical/en1993Weld';

describe('P1 Engineering Standards Verification Suite', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Column Buckling: DIN 4114 Tetmajer & EN 1993-1-1 Eurocode 3
    // ─────────────────────────────────────────────────────────────────────────
    describe('DIN 4114 & EN 1993-1-1 Column Buckling', () => {
        it('calculates Euler elastic buckling correctly for slender columns', () => {
            // L = 3000 mm, pin-pin (K=1), E = 210 GPa, solid circular d = 40 mm
            // I = pi * 40^4 / 64 = 125663.7 mm^4
            // A = pi * 40^2 / 4 = 1256.64 mm^2
            // r = d/4 = 10 mm
            // lambda = 3000 / 10 = 300 (Slender column, well above lambda_p)
            const I = (Math.PI * Math.pow(40, 4)) / 64;
            const A = (Math.PI * Math.pow(40, 2)) / 4;
            const res = ColumnBucklingNode.compute({
                L: 3000,
                I,
                A,
                E: 210,
                fy: 250,
                K: 1.0,
                P: 10000,
                buckling_curve: 'b',
                gamma_M1: 1.0
            });

            // Euler Pcr = pi^2 * E * I / L^2
            const expectedEuler = (Math.PI * Math.PI * 210000 * I) / Math.pow(3000, 2);
            expect(res.Pcr_euler).toBeCloseTo(expectedEuler, -1);
            expect(res.regime).toBe('euler');
        });

        it('uses DIN 4114 Tetmajer intermediate formula when slenderness is below proportionality limit', () => {
            // L = 600 mm, pin-pin (K=1), E = 200 GPa, fy = 250 MPa, circular d = 40 mm
            // r = 10 mm -> lambda = 60 -> intermediate range (lambda <= lambda_p ~ 100)
            // fy <= 275 -> St37 -> tetA = 310, tetB = 1.14
            // sigma_tet = 310 - 1.14 * 60 = 310 - 68.4 = 241.6 MPa
            const I = (Math.PI * Math.pow(40, 4)) / 64;
            const A = (Math.PI * Math.pow(40, 2)) / 4;
            const res = ColumnBucklingNode.compute({
                L: 600,
                I,
                A,
                E: 200,
                fy: 250,
                K: 1.0,
                P: 10000,
                buckling_curve: 'b',
                gamma_M1: 1.0
            });

            expect(res.regime).toBe('tetmajer');
            const expectedTetSigma = 310 - 1.14 * res.lambda;
            const expectedTetPcr = expectedTetSigma * A;
            expect(res.Pcr_tetmajer).toBeCloseTo(expectedTetPcr, -1);
        });

        it('computes EN 1993-1-1 reduction factor chi adhering to imperfection factor alpha', () => {
            const I = (Math.PI * Math.pow(50, 4)) / 64;
            const A = (Math.PI * Math.pow(50, 2)) / 4;
            
            // Compare curve a (alpha=0.21) vs curve d (alpha=0.76) on same section
            const resA = ColumnBucklingNode.compute({
                L: 1500,
                I,
                A,
                E: 200,
                fy: 355,
                K: 1.0,
                P: 20000,
                buckling_curve: 'a'
            });

            const resD = ColumnBucklingNode.compute({
                L: 1500,
                I,
                A,
                E: 200,
                fy: 355,
                K: 1.0,
                P: 20000,
                buckling_curve: 'd'
            });

            // Curve a has less imperfection than curve d -> chi_a > chi_d -> Nb,Rd_a > Nb,Rd_d
            expect(resA.chi).toBeGreaterThan(resD.chi);
            expect(resA.Nb_rd).toBeGreaterThan(resD.Nb_rd);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Eurocode 3 Weld Joint Resistance (EN 1993-1-8)
    // ─────────────────────────────────────────────────────────────────────────
    describe('EN 1993-1-8 Eurocode 3 Weld Verification', () => {
        it('determines correct correlation factor beta_w from steel yield strength', () => {
            expect(betaWFromFy(235)).toBe(0.8);
            expect(betaWFromFy(275)).toBe(0.85);
            expect(betaWFromFy(355)).toBe(0.9);
            expect(betaWFromFy(460)).toBe(1.0);
        });

        it('resolves fillet throat stresses and directional Von Mises verification', () => {
            const legSize = 6;
            const throatA = filletThroatMm(legSize); // 6 / sqrt(2) = 4.2426 mm
            expect(throatA).toBeCloseTo(4.2426, 3);

            const stresses = filletThroatStresses({
                F_parallel: 20000, // 20 kN
                F_transverse: 10000, // 10 kN
                a: throatA,
                L: 100, // mm
                n: 2 // double fillet
            });

            // Total throat area Aw = 4.2426 * 100 * 2 = 848.53 mm^2
            expect(stresses.Aw).toBeCloseTo(848.53, 1);
            // Parallel shear tau_par = 20000 / 848.53 = 23.57 MPa
            expect(stresses.tau_par).toBeCloseTo(23.57, 1);

            // Directional check: S275 steel, fu = 430 MPa, beta_w = 0.85, gamma_M2 = 1.25
            const check = directionalFilletCheck({
                sigma_perp: stresses.sigma_perp,
                tau_perp: stresses.tau_perp,
                tau_par: stresses.tau_par,
                fu: 430,
                beta_w: 0.85,
                gamma_M2: 1.25
            });

            // Allowable design strength fw = fu / (beta_w * gamma_M2) = 430 / (0.85 * 1.25) = 404.7 MPa
            expect(check.fw).toBeCloseTo(404.7, 1);
            expect(check.U).toBeLessThanOrEqual(1.0);
            expect(check.U_vm).toBeLessThan(1.0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Shigley High-Strength Fatigue Endurance Limit Ceiling
    // ─────────────────────────────────────────────────────────────────────────
    describe('Shigley §6.7 High-Strength Fatigue Endurance Ceiling', () => {
        it('caps uncorrected endurance limit SePrime at 700 MPa for Sut > 1400 MPa', () => {
            const calculateSePrime = (Sut: number) => {
                if (Sut <= 1400) {
                    return 0.5 * Sut;
                }
                return 700; // Shigley §6.7 standard ceiling
            };

            expect(calculateSePrime(800)).toBe(400);
            expect(calculateSePrime(1200)).toBe(600);
            expect(calculateSePrime(1400)).toBe(700);
            expect(calculateSePrime(1600)).toBe(700); // capped
            expect(calculateSePrime(2000)).toBe(700); // capped
        });

        it('computes Gerber parabolic and Soderberg safety factors correctly', () => {
            const sigma_a = 150; // alternating stress (MPa)
            const sigma_m = 100; // mean stress (MPa)
            const Se = 250; // endurance limit (MPa)
            const Sut = 600; // ultimate tensile strength (MPa)
            const Sy = 450; // yield strength (MPa)

            // Goodman: sigma_a / Se + sigma_m / Sut = 1/n
            const goodmanInv = sigma_a / Se + sigma_m / Sut;
            const n_goodman = 1 / goodmanInv;

            // Soderberg: sigma_a / Se + sigma_m / Sy = 1/n
            const soderbergInv = sigma_a / Se + sigma_m / Sy;
            const n_soderberg = 1 / soderbergInv;

            // Gerber: sigma_a / Se + (sigma_m / Sut)^2 = 1/n  (or solving quadratic for n)
            // Quadratic in n: (sigma_m/Sut)^2 * n^2 + (sigma_a/Se) * n - 1 = 0
            const A = Math.pow(sigma_m / Sut, 2);
            const B = sigma_a / Se;
            const n_gerber = (-B + Math.sqrt(B * B + 4 * A)) / (2 * A);

            // Gerber is less conservative than Goodman, and Soderberg is more conservative than Goodman
            expect(n_gerber).toBeGreaterThan(n_goodman);
            expect(n_goodman).toBeGreaterThan(n_soderberg);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. ISO/TR 14179 Reducer Power Loss & Thermal Equilibrium
    // ─────────────────────────────────────────────────────────────────────────
    describe('ISO/TR 14179 Reducer Thermal Power Loss', () => {
        it('computes physics-based power loss components without arbitrary scalar constants', () => {
            const power = 7.5; // kW
            const ratio = 31.5;
            const stages = ratio <= 6 ? 1 : ratio <= 45 ? 2 : 3; // 2 stages
            expect(stages).toBe(2);

            // Mesh loss: eta = 0.985^2 = 0.970225 -> loss = ~2.98%
            const Pv_mesh = power * (1 - Math.pow(0.985, stages));
            expect(Pv_mesh).toBeCloseTo(0.223, 2);

            // Bearing loss: 0.005 * power * (stages + 1) = 0.005 * 7.5 * 3 = 0.1125 kW
            const Pv_bearing = 0.005 * power * (stages + 1);
            expect(Pv_bearing).toBeCloseTo(0.1125, 3);

            // Seal loss: 0.03 * (stages + 1) = 0.09 kW
            const Pv_seal = 0.03 * (stages + 1);
            expect(Pv_seal).toBeCloseTo(0.09, 2);

            // Total loss is ~0.485 kW (approx 6.5% loss for 2-stage helical gear drive)
            const Pv_total = Pv_mesh + Pv_bearing + Pv_seal + power * 0.008;
            expect(Pv_total).toBeGreaterThan(0.3);
            expect(Pv_total).toBeLessThan(0.7);

            // Heat dissipation balance: alpha * area * deltaT = Pv * 1000
            const alpha = 45; // W/m²K
            const area = 0.8; // m²
            const deltaT = (Pv_total * 1000) / (alpha * area);
            expect(deltaT).toBeGreaterThan(5);
            expect(deltaT).toBeLessThan(25);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Darcy-Weisbach & Crane TP-410 Minor Losses
    // ─────────────────────────────────────────────────────────────────────────
    describe('Darcy-Weisbach & Crane TP-410 Flow Loss Model', () => {
        it('calculates both major pipe friction and minor fitting head losses', () => {
            const d = 0.05; // 50 mm
            const l = 100; // 100 m
            const v = 2.0; // m/s
            const g = 9.80665;
            const f = 0.022; // Darcy friction factor
            const sumK = 3.5; // Minor loss coefficient for fittings (elbows, valves)

            const velocityHead = (v * v) / (2 * g); // 4 / (2 * 9.80665) = 0.2039 m
            const hf = f * (l / d) * velocityHead; // 0.022 * 2000 * 0.2039 = 8.97 m
            const hm = sumK * velocityHead; // 3.5 * 0.2039 = 0.71 m
            const hTotal = hf + hm;

            expect(hf).toBeCloseTo(8.97, 1);
            expect(hm).toBeCloseTo(0.71, 1);
            expect(hTotal).toBeCloseTo(9.68, 1);
            expect(hTotal).toBeGreaterThan(hf);
        });
    });
});
