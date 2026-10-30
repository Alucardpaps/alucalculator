import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { weldJointDxf } from '@/export/dxf/schematics';
import {
    betaWFromFy,
    directionalFilletCheck,
    filletThroatMm,
    filletThroatStresses,
    simplifiedFilletFwRd,
    type WeldLoadDir,
} from '@/data/mechanical/en1993Weld';

/**
 * Fillet & full-penetration butt weld resistance.
 * EN 1993-1-8 simplified (§4.5.3.3) + directional (§4.5.3.2) + AWS D1.1 ASD.
 */

export type WeldJointKind = 'fillet-single' | 'fillet-double' | 'butt-full';

export interface WeldJointInput {
    F: number;
    L: number;
    z: number;
    fu: number;
    fy: number;
    joint?: WeldJointKind | string;
    beta_w?: number;
    gamma_M2?: number;
    FEXX?: number;
    load_dir?: WeldLoadDir | string;
    F_parallel?: number;
    F_transverse?: number;
}

export interface WeldJointOutput {
    a_throat: number;
    tau: number;
    sigma_perp: number;
    tau_perp: number;
    tau_par: number;
    sigma_w: number;
    Fw_rd: number;
    Fw_rd_dir: number;
    Fw_aws: number;
    safety_factor: number;
    geometry: string;
    validation_report: { valid: boolean; errors: string[]; warnings: string[] };
    report_payload: Record<string, unknown>;
}

function r3(v: number): number {
    return Number(v.toFixed(3));
}

function r4(v: number): number {
    return Number(v.toFixed(4));
}

function resolveLoad(input: WeldJointInput): { F_par: number; F_tr: number; dir: WeldLoadDir } {
    const hasPar = typeof input.F_parallel === 'number' && Number.isFinite(input.F_parallel);
    const hasTr = typeof input.F_transverse === 'number' && Number.isFinite(input.F_transverse);
    if (hasPar || hasTr) {
        return {
            F_par: hasPar ? Math.max(0, input.F_parallel as number) : 0,
            F_tr: hasTr ? Math.max(0, input.F_transverse as number) : 0,
            dir: 'combined',
        };
    }
    const dir: WeldLoadDir = input.load_dir === 'transverse' ? 'transverse' : 'parallel';
    if (dir === 'transverse') return { F_par: 0, F_tr: input.F, dir };
    return { F_par: input.F, F_tr: 0, dir };
}

export const WeldJointNode: EngineeringNodeSchema<WeldJointInput, WeldJointOutput> = {
    id: 'mech-weld-joint',
    version: '1.1.0',
    title: 'Welded Joint (EN 1993-1-8 / AWS D1.1)',
    description:
        'Fillet throat a=z/√2. EN 1993-1-8 simplified Fw,Rd, directional σ⊥/τ⊥/τ∥ von Mises (§4.5.3.2), AWS D1.1 0.30·FEXX.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'EN 1993-1-8 / AWS D1.1',
    inputs: [
        { id: 'F', label: 'Load F', type: 'force_n', required: true, defaultValue: 25000 },
        { id: 'L', label: 'Weld length L', type: 'length_mm', required: true, defaultValue: 120 },
        { id: 'z', label: 'Leg z', type: 'length_mm', required: true, defaultValue: 6 },
        { id: 'fu', label: 'fu weaker', type: 'stress_mpa', required: true, defaultValue: 420 },
        { id: 'fy', label: 'fy parent', type: 'yield_strength_mpa', required: true, defaultValue: 350 },
        { id: 'joint', label: 'Joint', type: 'string', required: false, defaultValue: 'fillet-double' },
        { id: 'beta_w', label: 'βw', type: 'ratio', required: false },
        { id: 'gamma_M2', label: 'γM2', type: 'ratio', required: false, defaultValue: 1.25 },
        { id: 'FEXX', label: 'FEXX (MPa)', type: 'stress_mpa', required: false, defaultValue: 485 },
        { id: 'load_dir', label: 'parallel | transverse', type: 'string', required: false, defaultValue: 'parallel' },
        { id: 'F_parallel', label: 'F∥', type: 'force_n', required: false },
        { id: 'F_transverse', label: 'F⊥', type: 'force_n', required: false },
    ],
    outputs: [
        { id: 'a_throat', label: 'Throat a', type: 'length_mm' },
        { id: 'tau', label: 'τ = F/Aw', type: 'stress_mpa' },
        { id: 'sigma_perp', label: 'σ⊥', type: 'stress_mpa' },
        { id: 'tau_perp', label: 'τ⊥', type: 'stress_mpa' },
        { id: 'tau_par', label: 'τ∥', type: 'stress_mpa' },
        { id: 'sigma_w', label: 'σw von Mises', type: 'stress_mpa' },
        { id: 'Fw_rd', label: 'Fw,Rd simplified', type: 'force_n' },
        { id: 'Fw_rd_dir', label: 'Fw,Rd directional', type: 'force_n' },
        { id: 'Fw_aws', label: 'Fallow AWS', type: 'force_n' },
        { id: 'safety_factor', label: 'SF', type: 'safety_factor' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!(input.F > 0)) errors.push('Load F must be positive.');
        if (!(input.L > 0)) errors.push('Weld length L must be positive.');
        if (!(input.z > 0)) errors.push('Leg size z must be positive.');
        if (!(input.fu > 0)) errors.push('Ultimate fu must be positive.');
        if (!(input.fy > 0)) errors.push('Yield fy must be positive.');
        const joint = input.joint ?? 'fillet-double';
        if (joint !== 'fillet-single' && joint !== 'fillet-double' && joint !== 'butt-full') {
            errors.push("Joint must be 'fillet-single', 'fillet-double' or 'butt-full'.");
        }
        if (input.load_dir && input.load_dir !== 'parallel' && input.load_dir !== 'transverse' && input.load_dir !== 'combined') {
            errors.push("load_dir must be 'parallel', 'transverse' or 'combined'.");
        }
        if (input.z < 3) warnings.push('Leg z < 3 mm is difficult to deposit consistently (AWS D1.1 min size).');
        if (input.L < 4 * input.z) warnings.push('L < 4z — short welds: check end returns / EN 1993-1-8 §4.11.');
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input): WeldJointOutput => {
        const F = input.F;
        const L = input.L;
        const z = input.z;
        const fu = input.fu;
        const fy = input.fy;
        const joint = (input.joint ?? 'fillet-double') as WeldJointKind;
        const gammaM2 = input.gamma_M2 && input.gamma_M2 > 0 ? input.gamma_M2 : 1.25;
        const beta_w = input.beta_w && input.beta_w > 0 ? input.beta_w : betaWFromFy(fy);
        const FEXX = input.FEXX && input.FEXX > 0 ? input.FEXX : 485;
        const nWeld = joint === 'fillet-double' ? 2 : 1;
        const butt = joint === 'butt-full';
        const a = butt ? z : filletThroatMm(z);
        const load = resolveLoad(input);
        const F_res = Math.hypot(load.F_par, load.F_tr) || F;

        const stresses = filletThroatStresses({
            F_parallel: load.F_par,
            F_transverse: load.F_tr,
            a,
            L,
            n: nWeld,
        });
        const Aw = stresses.Aw;
        const tau = Aw > 0 ? F_res / Aw : 0;

        const Fw_rd_simp = butt ? (fu * a * L) / gammaM2 : simplifiedFilletFwRd(Aw, fu, beta_w, gammaM2);
        const dir = directionalFilletCheck({
            sigma_perp: stresses.sigma_perp,
            tau_perp: stresses.tau_perp,
            tau_par: stresses.tau_par,
            fu,
            beta_w,
            gamma_M2: gammaM2,
        });
        const Fw_rd_dir = dir.U > 0 ? F_res / dir.U : Fw_rd_simp;
        const Fv_aws = 0.3 * FEXX;
        const Fw_aws = Fv_aws * Aw;
        const Fw_rd = butt ? Fw_rd_simp : Math.min(Fw_rd_simp, Fw_rd_dir);
        const Fallow = Math.min(Fw_rd, Fw_aws);
        const SF = F_res > 0 ? Fallow / F_res : 0;

        const warnings: string[] = [];
        const errors: string[] = [];
        if (SF < 1) errors.push(`Weld FAIL: F=${F_res.toFixed(0)} N exceeds min(EN, AWS)=${Fallow.toFixed(0)} N.`);
        else if (SF < 1.5) warnings.push(`SF ${SF.toFixed(2)} < 1.5 — increase z or L.`);
        if (beta_w < 0.8) warnings.push('βw < 0.8 is below EN 1993-1-8 Table 4.1 S235 value.');
        if (!butt && dir.U_perp > dir.U_vm) {
            warnings.push('σ⊥ limit (0.9 fu/γM2) governs over the von Mises throat check.');
        }

        const geometry = weldJointDxf({ L, z, a, joint });
        return {
            a_throat: r4(a),
            tau: r3(tau),
            sigma_perp: r3(stresses.sigma_perp),
            tau_perp: r3(stresses.tau_perp),
            tau_par: r3(stresses.tau_par),
            sigma_w: r3(dir.sigma_w),
            Fw_rd: r3(Fw_rd_simp),
            Fw_rd_dir: r3(Fw_rd_dir),
            Fw_aws: r3(Fw_aws),
            safety_factor: r4(SF),
            geometry,
            validation_report: { valid: errors.length === 0, errors, warnings },
            report_payload: {
                F_N: F,
                F_parallel_N: load.F_par,
                F_transverse_N: load.F_tr,
                F_res_N: r3(F_res),
                load_dir: load.dir,
                L_mm: L,
                z_mm: z,
                a_mm: r4(a),
                Aw_mm2: r3(Aw),
                n_weld: nWeld,
                joint,
                fu_MPa: fu,
                fy_MPa: fy,
                beta_w,
                gamma_M2: gammaM2,
                FEXX_MPa: FEXX,
                tau_MPa: r3(tau),
                sigma_perp_MPa: r3(stresses.sigma_perp),
                tau_perp_MPa: r3(stresses.tau_perp),
                tau_par_MPa: r3(stresses.tau_par),
                sigma_w_MPa: r3(dir.sigma_w),
                fw_MPa: r3(dir.fw),
                sigma_perp_lim_MPa: r3(dir.sigma_perp_lim),
                U_vm: r4(dir.U_vm),
                U_perp: r4(dir.U_perp),
                U: r4(dir.U),
                Fw_rd_N: r3(Fw_rd_simp),
                Fw_rd_dir_N: r3(Fw_rd_dir),
                Fw_aws_N: r3(Fw_aws),
                safety_factor: r4(SF),
                formula_trace: [
                    'Fillet 90°: a = z / √2     Aw = a · L · n',
                    'EN 1993-1-8 §4.5.3.3 simplified: Fw,Rd = fu / (√3 βw γM2) · Aw     γM2=1.25',
                    '§4.5.3.2 directional: σ⊥ = τ⊥ = F⊥ / (Aw √2),  τ∥ = F∥ / Aw',
                    '√(σ⊥² + 3(τ⊥² + τ∥²)) ≤ fu/(βw γM2)     and     σ⊥ ≤ 0.9 fu / γM2',
                    'βw from Table 4.1: 0.80 (≤235), 0.85 (≤275), 0.90 (≤355), 1.00 otherwise',
                    'Butt full pen.: Fw,Rd = fu · a · L / γM2  (a taken as z = plate thickness)',
                    'AWS D1.1 ASD: Fv = 0.30 · FEXX (E70XX default 485 MPa), Fallow = Fv · Aw',
                ],
                assumptions: [
                    'Equal-leg 90° fillet; throat plane at 45° (EN Fig. 4.5)',
                    'Effective length leff = L (no end-return deduction)',
                    'Default load_dir = parallel (longitudinal shear). Set transverse or wire F_parallel + F_transverse for combined',
                    'FEXX default 485 MPa = E70XX; parent fu from material Su',
                    'DXF is a T-joint schematic, not a WPS / AWS prequalified joint detail',
                ],
            },
        };
    },
};
