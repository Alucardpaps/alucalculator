import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { calculateIso6336Mesh } from '@/lib/iso6336';

export interface SafetyFactorInput {
    stress_mpa: number;
    yield_strength_mpa: number;
}

export interface SafetyFactorOutput {
    safety_factor: number;
    validation_report: {
        valid: boolean;
        errors: string[];
        warnings: string[];
        sf: number;
    };
}

export const SafetyFactorNode: EngineeringNodeSchema<SafetyFactorInput, SafetyFactorOutput> = {
    id: 'val-safety-factor',
    version: '1.0.0',
    title: 'Safety Factor',
    description: 'SF = Sy / σ. Blocks export when SF < 1.',
    category: 'validation',
    deterministic: true,
    inputs: [
        { id: 'stress_mpa', label: 'Stress σ', type: 'stress_mpa', required: true, defaultValue: 100 },
        { id: 'yield_strength_mpa', label: 'Yield Sy', type: 'yield_strength_mpa', required: true, defaultValue: 250 },
    ],
    outputs: [
        { id: 'safety_factor', label: 'Safety Factor', type: 'safety_factor' },
        { id: 'validation_report', label: 'Report', type: 'validation_report' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        if (!(input.stress_mpa > 0)) errors.push('Stress must be positive.');
        if (!(input.yield_strength_mpa > 0)) errors.push('Yield strength must be positive.');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (input) => {
        const sf = input.yield_strength_mpa / input.stress_mpa;
        const warnings: string[] = [];
        const errors: string[] = [];
        if (sf < 1) errors.push(`SF ${sf.toFixed(3)} < 1 — yield exceeded.`);
        else if (sf < 1.5) warnings.push(`SF ${sf.toFixed(3)} < 1.5 — marginal for static steel.`);
        return {
            safety_factor: Number(sf.toFixed(4)),
            validation_report: {
                valid: errors.length === 0,
                errors,
                warnings,
                sf: Number(sf.toFixed(4)),
            },
        };
    },
};

export interface UndercutInput {
    tooth_count: number;
    pressure_angle_deg: number;
    profile_shift: number;
}

export interface UndercutOutput {
    validation_report: {
        valid: boolean;
        errors: string[];
        warnings: string[];
        zMin: number;
        undercut: boolean;
    };
}

export const UndercutDetectorNode: EngineeringNodeSchema<UndercutInput, UndercutOutput> = {
    id: 'val-undercut',
    version: '1.0.0',
    title: 'Undercut Detector',
    description: 'Minimum teeth without undercut: z_min = 2 / sin²(α). Profile shift reduces the limit.',
    category: 'validation',
    deterministic: true,
    isoStandard: 'DIN 3960',
    inputs: [
        { id: 'tooth_count', label: 'Teeth z', type: 'tooth_count', required: true, defaultValue: 18 },
        { id: 'pressure_angle_deg', label: 'Pressure Angle α', type: 'pressure_angle_deg', required: true, defaultValue: 20 },
        { id: 'profile_shift', label: 'Shift x', type: 'ratio', required: false, defaultValue: 0 },
    ],
    outputs: [
        { id: 'validation_report', label: 'Report', type: 'validation_report' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        if (!(input.tooth_count >= 6)) errors.push('Tooth count must be ≥ 6.');
        if (!(input.pressure_angle_deg > 0 && input.pressure_angle_deg < 45)) {
            errors.push('Pressure angle must be between 0° and 45°.');
        }
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (input) => {
        const alpha = (input.pressure_angle_deg * Math.PI) / 180;
        const sinA = Math.sin(alpha);
        const zMinRaw = 2 / (sinA * sinA);
        const x = input.profile_shift || 0;
        const zMin = Math.ceil(zMinRaw - 2 * x);
        const undercut = input.tooth_count < zMin;
        const warnings: string[] = [];
        const errors: string[] = [];
        if (undercut) {
            warnings.push(`Undercut risk: z=${input.tooth_count} < z_min=${zMin} (α=${input.pressure_angle_deg}°, x=${x}).`);
        }
        return {
            validation_report: {
                valid: errors.length === 0,
                errors,
                warnings,
                zMin,
                undercut,
            },
        };
    },
};

export interface Iso6336Input {
    module_mm: number;
    tooth_count: number;
    face_width_mm: number;
    torque_nm: number;
    yield_strength_mpa: number;
}

export interface Iso6336Output {
    stress_mpa: number;
    safety_factor: number;
    validation_report: {
        valid: boolean;
        errors: string[];
        warnings: string[];
        method: string;
    };
}

/**
 * ISO 6336 Method B screening of root bending (and pitting as a warning).
 */
export const Iso6336PreliminaryNode: EngineeringNodeSchema<Iso6336Input, Iso6336Output> = {
    id: 'val-iso-6336-prelim',
    version: '1.1.0',
    title: 'ISO 6336 Preliminary',
    description: 'ISO 6336 Method B root bending stress and SF. Not a Method-A certificate.',
    category: 'validation',
    deterministic: true,
    isoStandard: 'ISO 6336',
    inputs: [
        { id: 'module_mm', label: 'Module m', type: 'module_mm', required: true, defaultValue: 2 },
        { id: 'tooth_count', label: 'Teeth z', type: 'tooth_count', required: true, defaultValue: 20 },
        { id: 'face_width_mm', label: 'Face width b', type: 'length_mm', required: true, defaultValue: 20 },
        { id: 'torque_nm', label: 'Torque T', type: 'torque_nm', required: true, defaultValue: 50 },
        { id: 'yield_strength_mpa', label: 'Yield Sy', type: 'yield_strength_mpa', required: true, defaultValue: 400 },
    ],
    outputs: [
        { id: 'stress_mpa', label: 'Bending σ_F', type: 'stress_mpa' },
        { id: 'safety_factor', label: 'SF', type: 'safety_factor' },
        { id: 'validation_report', label: 'Report', type: 'validation_report' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        if (!(input.module_mm > 0)) errors.push('Module must be positive.');
        if (!(input.tooth_count >= 8)) errors.push('Tooth count must be ≥ 8.');
        if (!(input.face_width_mm > 0)) errors.push('Face width must be positive.');
        if (!(input.torque_nm >= 0)) errors.push('Torque must be ≥ 0.');
        if (!(input.yield_strength_mpa > 0)) errors.push('Yield strength must be positive.');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (input) => {
        const m = input.module_mm;
        const z = input.tooth_count;
        const b = input.face_width_mm;
        const iso = calculateIso6336Mesh({
            mn: m,
            z1: z,
            z2: Math.max(z + 8, Math.round(z * 2)),
            b,
            torqueNm: input.torque_nm,
            rpmPinion: 1450,
            sigmaFlim1: 0.55 * input.yield_strength_mpa,
            sigmaFlim2: 0.55 * input.yield_strength_mpa,
            sigmaHlim: 1.3 * input.yield_strength_mpa,
        });
        const sigmaF = iso.sigmaF1;
        const sf = iso.SF1;
        const warnings: string[] = [...(iso.epsilonAlpha < 1.2 ? [`εα=${iso.epsilonAlpha.toFixed(2)} < 1.2.`] : [])];
        const errors: string[] = [];
        if (sf < 1) errors.push(`ISO 6336 SF ${sf.toFixed(3)} < 1.`);
        else if (sf < 1.4) warnings.push(`ISO 6336 SF ${sf.toFixed(3)} is below industrial target 1.4.`);
        if (iso.SH < 1.0) warnings.push(`ISO 6336 SH ${iso.SH.toFixed(3)} < 1.0 (pitting).`);
        if (b / m < 6) warnings.push('b/m < 6 — narrow face, check load distribution.');
        if (b / m > 15) warnings.push('b/m > 15 — wide face, check alignment.');
        return {
            stress_mpa: Number(sigmaF.toFixed(4)),
            safety_factor: Number(sf.toFixed(4)),
            validation_report: {
                valid: errors.length === 0,
                errors,
                warnings,
                method: 'ISO 6336 Method B (YF YS Yβ KA Kv)',
            },
        };
    },
};
