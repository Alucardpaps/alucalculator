import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { pressureVesselFlangeDxf } from '@/export/dxf/schematics';

/**
 * ASME Section VIII Div. 1 UG-27 + EN 13445-3 cylindrical shell thickness.
 * Pressure port is pressure_mpa (not stress_mpa). Joint efficiency is ratio.
 */

export interface PressureVesselCodeInput {
    P: number;
    R: number;
    S: number;
    E: number;
    CA: number;
}

export interface PressureVesselCodeOutput {
    t_asme_mm: number;
    t_en_mm: number;
    t_req_mm: number;
    hoop_stress_mpa: number;
    geometry: string;
    validation_report: { valid: boolean; errors: string[]; warnings: string[] };
    report_payload: Record<string, unknown>;
}

export const PressureVesselCodeNode: EngineeringNodeSchema<PressureVesselCodeInput, PressureVesselCodeOutput> = {
    id: 'mech-pressure-vessel-code',
    version: '1.0.0',
    title: 'Pressure Vessel & Flange',
    description: 'ASME VIII Div.1 UG-27 and EN 13445-3 cylindrical shell thickness with flanged-head schematic DXF.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'ASME VIII Div 1 / EN 13445',
    inputs: [
        { id: 'P', label: 'Design pressure P', type: 'pressure_mpa', required: true, defaultValue: 1.6 },
        { id: 'R', label: 'Inside radius R', type: 'length_mm', required: true, defaultValue: 400 },
        { id: 'S', label: 'Allowable S', type: 'stress_mpa', required: true, defaultValue: 138 },
        { id: 'E', label: 'Joint efficiency E', type: 'ratio', required: true, defaultValue: 0.85 },
        { id: 'CA', label: 'Corrosion CA', type: 'length_mm', required: false, defaultValue: 1.5 },
    ],
    outputs: [
        { id: 't_asme_mm', label: 't ASME (mm)', type: 'length_mm' },
        { id: 't_en_mm', label: 't EN 13445 (mm)', type: 'length_mm' },
        { id: 't_req_mm', label: 't required (mm)', type: 'length_mm' },
        { id: 'hoop_stress_mpa', label: 'Hoop stress', type: 'stress_mpa' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!(input.P > 0)) errors.push('Design pressure P must be positive.');
        if (!(input.R > 0)) errors.push('Inside radius R must be positive.');
        if (!(input.S > 0)) errors.push('Allowable stress S must be positive.');
        if (!(input.E > 0 && input.E <= 1)) errors.push('Joint efficiency E must be in (0, 1].');
        const denomAsme = input.S * input.E - 0.6 * input.P;
        if (input.P > 0 && denomAsme <= 0) {
            errors.push('ASME UG-27 denominator SE − 0.6P ≤ 0 — pressure exceeds code limit for this S,E.');
        }
        if (input.E < 0.7) warnings.push('Joint efficiency E < 0.7 — check weld type / RT (UW-12).');
        if (input.P / input.S > 0.385) warnings.push('P/S high — UG-27 thin-wall formula may not apply (t > 0.5R).');
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input): PressureVesselCodeOutput => {
        const P = input.P;
        const R = input.R;
        const S = input.S;
        const E = input.E;
        const CA = input.CA ?? 0;
        const denomAsme = S * E - 0.6 * P;
        const denomEn = S * E - 0.5 * P;
        const tAsme = denomAsme > 0 ? (P * R) / denomAsme + CA : 0;
        const tEn = denomEn > 0 ? (P * R) / denomEn + CA : 0;
        const tReq = Math.max(tAsme, tEn);
        const hoop = tReq > CA ? (P * (R + 0.6 * (tReq - CA))) / (E * (tReq - CA)) : 0;
        const warnings: string[] = [];
        if (tReq - CA > 0.5 * R) warnings.push('Required thickness > 0.5 R — use thick-wall / Lame analysis.');
        const geometry = pressureVesselFlangeDxf({ R, t: tReq, P });
        return {
            t_asme_mm: Number(tAsme.toFixed(3)),
            t_en_mm: Number(tEn.toFixed(3)),
            t_req_mm: Number(tReq.toFixed(3)),
            hoop_stress_mpa: Number(hoop.toFixed(3)),
            geometry,
            validation_report: { valid: true, errors: [], warnings },
            report_payload: {
                P_MPa: P,
                R_mm: R,
                S_MPa: S,
                E,
                CA_mm: CA,
                t_asme_mm: Number(tAsme.toFixed(3)),
                t_en_mm: Number(tEn.toFixed(3)),
                t_req_mm: Number(tReq.toFixed(3)),
                hoop_stress_mpa: Number(hoop.toFixed(3)),
                formula_trace: [
                    'ASME VIII Div.1 UG-27: t = P R / (S E − 0.6 P) + CA',
                    'EN 13445-3: t = P R / (f z − 0.5 P) + CA   (f≡S, z≡E)',
                    'Hoop check: σ = P (R + 0.6 t_corr) / (E t_corr)',
                ],
                assumptions: [
                    'Circumferential stress governs (longitudinal joint)',
                    'Thin-wall UG-27 / EN 13445-3 cylindrical shell, no openings',
                    'Flange DXF is schematic (not a full ASME VIII Div.2 / Appendix 2 design)',
                ],
            },
        };
    },
};
