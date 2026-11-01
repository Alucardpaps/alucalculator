import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { hydraulicCylinderDxf } from '@/export/dxf/schematics';

/**
 * Hydraulic cylinder sizing — ISO 6020/6022 bore snap, Lamé wall, Euler rod.
 * Pressure port is pressure_mpa (16 MPa = 160 bar). Force is force_n.
 */

export interface HydraulicCylinderInput {
    F: number;
    P: number;
    stroke: number;
    K: number;
    E: number;
    fy: number;
    piston_speed_mm_s?: number;
}

export interface HydraulicCylinderOutput {
    bore_std: number;
    rod_std: number;
    t_wall: number;
    F_push: number;
    F_pull: number;
    Pcr: number;
    hoop_stress: number;
    Q_L_min: number;
    safety_factor: number;
    geometry: string;
    validation_report: { valid: boolean; errors: string[]; warnings: string[] };
    report_payload: Record<string, unknown>;
}

const ISO_BORES = [40, 50, 63, 80, 100, 125, 160, 200, 250, 320];
const ROD_PAIR: Record<number, number> = {
    40: 22,
    50: 28,
    63: 36,
    80: 45,
    100: 56,
    125: 70,
    160: 90,
    200: 110,
    250: 140,
    320: 180,
};

function r2(v: number): number {
    return Number(v.toFixed(2));
}

function r3(v: number): number {
    return Number(v.toFixed(3));
}

function r4(v: number): number {
    return Number(v.toFixed(4));
}

export const HydraulicCylinderNode: EngineeringNodeSchema<HydraulicCylinderInput, HydraulicCylinderOutput> = {
    id: 'mech-hydraulic-cylinder',
    version: '1.0.0',
    title: 'Hydraulic Cylinder (ISO 6020)',
    description:
        'Bore from F/P, ISO 6020/6022 snap, push/pull, Lamé inner von Mises wall, Euler rod buckling, Q = A·v.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'ISO 6020 / ISO 6022',
    inputs: [
        { id: 'F', label: 'Push force F', type: 'force_n', required: true, defaultValue: 50000 },
        { id: 'P', label: 'Pressure P', type: 'pressure_mpa', required: true, defaultValue: 16 },
        { id: 'stroke', label: 'Stroke S', type: 'length_mm', required: true, defaultValue: 500 },
        { id: 'K', label: 'Rod K', type: 'ratio', required: true, defaultValue: 1 },
        { id: 'E', label: 'Rod E (GPa)', type: 'number', required: true, defaultValue: 200 },
        { id: 'fy', label: 'Tube fy', type: 'yield_strength_mpa', required: true, defaultValue: 350 },
        { id: 'piston_speed_mm_s', label: 'vp (mm/s)', type: 'number', required: false, defaultValue: 100 },
    ],
    outputs: [
        { id: 'bore_std', label: 'ISO bore D', type: 'diameter_mm' },
        { id: 'rod_std', label: 'ISO rod d', type: 'diameter_mm' },
        { id: 't_wall', label: 'Wall t', type: 'length_mm' },
        { id: 'F_push', label: 'F push', type: 'force_n' },
        { id: 'F_pull', label: 'F pull', type: 'force_n' },
        { id: 'Pcr', label: 'Rod Pcr', type: 'force_n' },
        { id: 'hoop_stress', label: 'σvm inner', type: 'stress_mpa' },
        { id: 'Q_L_min', label: 'Q (L/min)', type: 'number' },
        { id: 'safety_factor', label: 'Rod SF', type: 'safety_factor' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!(input.F > 0)) errors.push('Push force F must be positive.');
        if (!(input.P > 0)) errors.push('Pressure P must be positive.');
        if (!(input.stroke > 0)) errors.push('Stroke must be positive.');
        if (!(input.K > 0)) errors.push('Rod effective-length factor K must be positive.');
        if (!(input.E > 0)) errors.push('Rod modulus E must be positive.');
        if (!(input.fy > 0)) errors.push('Tube yield fy must be positive.');
        if (input.P > 25) warnings.push('P > 25 MPa is above the ISO 6020 160 bar series — use ISO 6022 (25 MPa) or a higher series.');
        const allow = input.fy / 1.5;
        if (input.P * Math.sqrt(3) >= allow) {
            errors.push('Lamé: P√3 ≥ fy/1.5 — no finite wall satisfies inner von Mises at this pressure.');
        }
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input): HydraulicCylinderOutput => {
        const F = input.F;
        const P = input.P;
        const stroke = input.stroke;
        const K = input.K;
        const E_MPa = input.E * 1000;
        const fy = input.fy;
        const vp = input.piston_speed_mm_s && input.piston_speed_mm_s > 0 ? input.piston_speed_mm_s : 100;

        const Ap_req = F / P;
        const D_req = Math.sqrt((4 * Ap_req) / Math.PI);
        const bore = ISO_BORES.find((b) => b >= D_req) ?? ISO_BORES[ISO_BORES.length - 1];
        const rod = ROD_PAIR[bore] ?? Math.round(bore * 0.56);

        const Ap = (Math.PI * bore * bore) / 4;
        const Ar = (Math.PI * (bore * bore - rod * rod)) / 4;
        const F_push = P * Ap;
        const F_pull = P * Ar;

        const sigmaAll = fy / 1.5;
        const k2 = sigmaAll / (sigmaAll - P * Math.sqrt(3));
        const k = Math.sqrt(Math.max(1.001, k2));
        const ri = bore / 2;
        const t_lame = ri * (k - 1);
        const t_thin = (P * bore) / (2 * sigmaAll);
        const t = Math.max(t_lame, t_thin);
        const ro = ri + t;
        const kAct = ro / ri;
        const hoop = (P * Math.sqrt(3) * kAct * kAct) / (kAct * kAct - 1);

        const I_rod = (Math.PI * Math.pow(rod, 4)) / 64;
        const Le = K * stroke;
        const Pcr = Le > 0 ? (Math.PI * Math.PI * E_MPa * I_rod) / (Le * Le) : 0;
        const SF = F_push > 0 ? Pcr / F_push : 0;
        const Q = Ap * vp * 6e-5;

        const warnings: string[] = [];
        const errors: string[] = [];
        if (SF < 1) errors.push(`Rod buckling FAIL: Fpush=${F_push.toFixed(0)} N > Pcr=${Pcr.toFixed(0)} N.`);
        else if (SF < 3.5) warnings.push(`Rod buckling SF ${SF.toFixed(2)} < 3.5 (ISO 6020 practice). Increase rod or reduce stroke.`);
        if (t < 3) warnings.push(`Required wall t=${t.toFixed(2)} mm is thin for shop welding / ISO 6020 tubes — check the tube standard.`);
        if (F_push + 1 < F) warnings.push('ISO snapped bore still delivers Fpush < requested F — next bore was selected by ≥ D_req; check rounding.');

        const geometry = hydraulicCylinderDxf({ bore, rod, stroke, t });
        return {
            bore_std: bore,
            rod_std: rod,
            t_wall: r3(t),
            F_push: r3(F_push),
            F_pull: r3(F_pull),
            Pcr: r3(Pcr),
            hoop_stress: r3(hoop),
            Q_L_min: r3(Q),
            safety_factor: r4(SF),
            geometry,
            validation_report: { valid: errors.length === 0, errors, warnings },
            report_payload: {
                F_N: F,
                P_MPa: P,
                stroke_mm: stroke,
                K,
                E_GPa: input.E,
                fy_MPa: fy,
                D_req_mm: r3(D_req),
                bore_std_mm: bore,
                rod_std_mm: rod,
                t_wall_mm: r3(t),
                t_lame_mm: r3(t_lame),
                t_thin_mm: r3(t_thin),
                F_push_N: r3(F_push),
                F_pull_N: r3(F_pull),
                Pcr_N: r3(Pcr),
                hoop_vm_MPa: r3(hoop),
                Q_L_min: r3(Q),
                vp_mm_s: vp,
                safety_factor_rod: r4(SF),
                formula_trace: [
                    'Ap = F / P     D = √(4 Ap / π)     snap to ISO 6020/6022 {40,50,63,80,100,125,160,200,250,320}',
                    'Fpush = P · π D²/4     Fpull = P · π (D²−d²)/4',
                    'Lamé inner von Mises: σvm = P √3 k² / (k²−1), k=ro/ri,  set σvm = fy/1.5 → t = ri(k−1)',
                    'Thin-wall check: t = P D / (2 fy/1.5)     t_req = max(t_Lamé, t_thin)',
                    'Rod Euler: Pcr = π² E I / (K S)²    I = π d⁴ / 64',
                    'Q [L/min] = Ap[mm²] · vp[mm/s] · 6·10⁻⁵',
                ],
                assumptions: [
                    'ISO 6020 160 bar series bore/rod pairing (2:1 / 1.4:1 family); 25 MPa uses the same snap set (ISO 6022)',
                    'γ = 1.5 on tube fy for wall sizing; no corrosion allowance',
                    'Buckling length = K · stroke (clevis extra neglected — conservative for pin-pin if K=1)',
                    'Steady pressure, no shock factor, no cushion / bulk modulus',
                    'DXF is a side-view schematic, not an ISO 8133 mounting drawing',
                ],
            },
        };
    },
};
