import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { columnBucklingDxf } from '@/export/dxf/schematics';

/**
 * Column buckling — Euler elastic + DIN 4114 Tetmajer + EN 1993-1-1 χ.
 * Units: E in GPa, I in mm⁴, A in mm², L in mm, P in N → Pcr in N, σ in MPa.
 * No implicit unit conversion between ports.
 */

export type BucklingCurve = 'a' | 'b' | 'c' | 'd';

export interface ColumnBucklingInput {
    L: number;
    I: number;
    A: number;
    E: number;
    fy: number;
    K: number;
    P: number;
    buckling_curve?: BucklingCurve;
    gamma_M1?: number;
}

export interface ColumnBucklingOutput {
    Pcr: number;
    Pcr_euler: number;
    Pcr_tetmajer: number;
    Nb_rd: number;
    lambda: number;
    lambda_bar: number;
    chi: number;
    sigma_cr: number;
    sigma_equiv: number;
    safety_factor: number;
    regime: string;
    geometry: string;
    validation_report: { valid: boolean; errors: string[]; warnings: string[] };
    report_payload: Record<string, unknown>;
}

const CURVE_ALPHA: Record<BucklingCurve, number> = {
    a: 0.21,
    b: 0.34,
    c: 0.49,
    d: 0.76,
};

function r3(v: number): number {
    return Number(v.toFixed(3));
}

function r4(v: number): number {
    return Number(v.toFixed(4));
}

export const ColumnBucklingNode: EngineeringNodeSchema<ColumnBucklingInput, ColumnBucklingOutput> = {
    id: 'mech-column-buckling',
    version: '1.0.0',
    title: 'Column Buckling (Euler / Tetmajer / EN 1993-1-1)',
    description:
        'Euler Pcr, DIN 4114 Tetmajer intermediate, and EN 1993-1-1 reduction factor χ. Governing Nb is the minimum applicable capacity.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'DIN 4114 / EN 1993-1-1',
    inputs: [
        { id: 'L', label: 'Length L', type: 'length_mm', required: true, defaultValue: 1500 },
        { id: 'I', label: 'Inertia I (mm⁴)', type: 'number', required: true, defaultValue: 125664 },
        { id: 'A', label: 'Area A (mm²)', type: 'number', required: true, defaultValue: 1257 },
        { id: 'E', label: 'Young E (GPa)', type: 'number', required: true, defaultValue: 200 },
        { id: 'fy', label: 'Yield fy', type: 'yield_strength_mpa', required: true, defaultValue: 350 },
        { id: 'K', label: 'Effective K', type: 'ratio', required: true, defaultValue: 1 },
        { id: 'P', label: 'Applied P', type: 'force_n', required: true, defaultValue: 35000 },
        { id: 'buckling_curve', label: 'EN curve a–d', type: 'string', required: false, defaultValue: 'b' },
        { id: 'gamma_M1', label: 'γM1', type: 'ratio', required: false, defaultValue: 1 },
    ],
    outputs: [
        { id: 'Pcr', label: 'Governing Pcr', type: 'force_n' },
        { id: 'Pcr_euler', label: 'Euler Pcr', type: 'force_n' },
        { id: 'Pcr_tetmajer', label: 'Tetmajer Pcr', type: 'force_n' },
        { id: 'Nb_rd', label: 'EN 1993 Nb,Rd', type: 'force_n' },
        { id: 'lambda', label: 'Slenderness λ', type: 'ratio' },
        { id: 'lambda_bar', label: 'λ̄', type: 'ratio' },
        { id: 'chi', label: 'χ', type: 'ratio' },
        { id: 'sigma_cr', label: 'σcr', type: 'stress_mpa' },
        { id: 'sigma_equiv', label: 'σ* = fy·P/Pcr', type: 'stress_mpa' },
        { id: 'safety_factor', label: 'SF = Pcr/P', type: 'safety_factor' },
        { id: 'regime', label: 'Governing regime', type: 'string' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!(input.L > 0)) errors.push('Length L must be positive.');
        if (!(input.I > 0)) errors.push('Moment of inertia I must be positive.');
        if (!(input.A > 0)) errors.push('Area A must be positive.');
        if (!(input.E > 0)) errors.push('Young modulus E must be positive.');
        if (!(input.fy > 0)) errors.push('Yield fy must be positive.');
        if (!(input.K > 0)) errors.push('Effective-length factor K must be positive.');
        if (!(input.P > 0)) errors.push('Applied load P must be positive.');
        const allowed: BucklingCurve[] = ['a', 'b', 'c', 'd'];
        const curve = (input.buckling_curve ?? 'b') as BucklingCurve;
        if (!allowed.includes(curve)) errors.push('Buckling curve must be a, b, c or d (EN 1993-1-1 Table 6.2).');
        if (input.E < 100) warnings.push('E < 100 GPa — EN 1993-1-1 χ is for steel; use EN 1999 for aluminium.');
        if (input.K > 2.1) warnings.push('K > 2.1 is outside the usual Euler end-fixity set {0.5, 0.7, 1.0, 2.0}.');
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input): ColumnBucklingOutput => {
        const L = input.L;
        const I = input.I;
        const A = input.A;
        const E_MPa = input.E * 1000;
        const fy = input.fy;
        const K = input.K;
        const P = input.P;
        const curve = ((input.buckling_curve ?? 'b') as BucklingCurve);
        const alpha = CURVE_ALPHA[curve] ?? CURVE_ALPHA.b;
        const gammaM1 = input.gamma_M1 && input.gamma_M1 > 0 ? input.gamma_M1 : 1;

        const i = Math.sqrt(I / A);
        const Le = K * L;
        const lambda = i > 0 ? Le / i : 0;

        const P_euler = Le > 0 ? (Math.PI * Math.PI * E_MPa * I) / (Le * Le) : 0;
        const P_squash = fy * A;

        const tetA = fy <= 275 ? 310 : 335;
        const tetB = fy <= 275 ? 1.14 : 0.62;
        const sigma_t = Math.max(0, tetA - tetB * lambda);
        const P_tet = Math.min(fy, sigma_t) * A;

        const sigma_p = 0.8 * fy;
        const lambda_p = sigma_p > 0 ? Math.PI * Math.sqrt(E_MPa / sigma_p) : 0;

        const eps = Math.sqrt(235 / fy);
        const lambda1 = 93.9 * eps;
        const lambdaBar = lambda1 > 0 ? lambda / lambda1 : 0;
        let chi = 1;
        if (lambdaBar > 0.2) {
            const Phi = 0.5 * (1 + alpha * (lambdaBar - 0.2) + lambdaBar * lambdaBar);
            const disc = Math.max(0, Phi * Phi - lambdaBar * lambdaBar);
            chi = Math.min(1, 1 / (Phi + Math.sqrt(disc)));
        }
        const Nb_rd = (chi * A * fy) / gammaM1;

        let regime: string;
        let Pcr: number;
        if (lambda <= 20) {
            regime = 'squash';
            Pcr = Math.min(P_squash, Nb_rd);
        } else if (lambda < lambda_p) {
            regime = 'tetmajer';
            Pcr = Math.min(P_tet, Nb_rd, P_squash);
        } else {
            regime = 'euler';
            Pcr = Math.min(P_euler, Nb_rd);
        }

        const sigma_cr = A > 0 ? Pcr / A : 0;
        const SF = P > 0 ? Pcr / P : 0;
        const sigma_equiv = Pcr > 0 ? fy * (P / Pcr) : fy;

        const warnings: string[] = [];
        const errors: string[] = [];
        if (lambda < 50 && regime !== 'squash') {
            warnings.push(`λ=${lambda.toFixed(1)} is intermediate — Euler over-predicts; Tetmajer / EN 1993-1-1 govern.`);
        }
        if (SF < 1) errors.push(`Buckling FAIL: P=${P.toFixed(0)} N exceeds Pcr=${Pcr.toFixed(0)} N (SF=${SF.toFixed(3)}).`);
        else if (SF < 1.5) warnings.push(`SF ${SF.toFixed(2)} < 1.5 — marginal for steel columns.`);
        if (lambda > 250) warnings.push('λ > 250 — very slender; check geometric imperfections and EN 1993-1-1 §5.3.');

        const geometry = columnBucklingDxf({ L, A, K, P, Pcr, lambda });
        return {
            Pcr: r3(Pcr),
            Pcr_euler: r3(P_euler),
            Pcr_tetmajer: r3(P_tet),
            Nb_rd: r3(Nb_rd),
            lambda: r4(lambda),
            lambda_bar: r4(lambdaBar),
            chi: r4(chi),
            sigma_cr: r3(sigma_cr),
            sigma_equiv: r3(sigma_equiv),
            safety_factor: r4(SF),
            regime,
            geometry,
            validation_report: { valid: errors.length === 0, errors, warnings },
            report_payload: {
                L_mm: L,
                I_mm4: I,
                A_mm2: A,
                E_GPa: input.E,
                fy_MPa: fy,
                K,
                P_N: P,
                i_mm: r4(i),
                lambda: r4(lambda),
                lambda_p: r4(lambda_p),
                lambda_bar: r4(lambdaBar),
                chi: r4(chi),
                buckling_curve: curve,
                alpha,
                gamma_M1: gammaM1,
                Pcr_N: r3(Pcr),
                Pcr_euler_N: r3(P_euler),
                Pcr_tetmajer_N: r3(P_tet),
                Nb_rd_N: r3(Nb_rd),
                P_squash_N: r3(P_squash),
                sigma_cr_MPa: r3(sigma_cr),
                safety_factor: r4(SF),
                regime,
                formula_trace: [
                    'i = √(I/A)    λ = K L / i',
                    'Euler: Pcr = π² E I / (K L)²     (E in N/mm², I in mm⁴, L in mm → N)',
                    'DIN 4114 Tetmajer: σk = 310 − 1.14λ (St37) or 335 − 0.62λ (St52), λp = π √(E / 0.8 fy)',
                    'EN 1993-1-1: λ̄ = λ / (93.9 ε), ε=√(235/fy),  Φ=0.5[1+α(λ̄−0.2)+λ̄²],  χ=1/(Φ+√(Φ²−λ̄²))',
                    'Nb,Rd = χ A fy / γM1    governing Pcr = min of applicable capacities',
                    'σ* = fy · P / Pcr  so val-safety-factor reports SF = Pcr / P',
                ],
                assumptions: [
                    'Straight prismatic column, concentric compression, linear elastic until Euler/Tetmajer/EN branch',
                    'EN 1993-1-1 curve default b (α=0.21/0.34/0.49/0.76 for a/b/c/d)',
                    'γM1 = 1.0 characteristic unless overridden — not a nationally determined Nb,Rd',
                    'DIN 4114 Tetmajer coefficients locked to St37/St52 families (fy split at 275 MPa)',
                    'DXF is a schematic (end-fixity glyphs), not a fabrication drawing',
                ],
            },
        };
    },
};
