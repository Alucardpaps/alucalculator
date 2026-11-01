import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';

/**
 * Motor power + shaft speed → torque.
 * Industrial convention T[N·m] = 9550 · P[kW] / n[rpm]
 * (9550 ≈ 60 000 / (2π)). Exact value is 9549.296… — documented, not implicit-cast.
 */

export interface PowerTorqueInput {
    power_kw: number;
    rpm: number;
}

export interface PowerTorqueOutput {
    torque_nm: number;
    validation_report: { valid: boolean; errors: string[]; warnings: string[] };
    report_payload: Record<string, unknown>;
}

const K_9550 = 9550;

export const PowerTorqueNode: EngineeringNodeSchema<PowerTorqueInput, PowerTorqueOutput> = {
    id: 'mech-power-torque',
    version: '1.0.0',
    title: 'Power → Torque',
    description: 'Converts motor power and shaft speed to torque. T = 9550 · P / n. Does not implicit-cast units.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'IEC 60034',
    inputs: [
        { id: 'power_kw', label: 'Power P (kW)', type: 'power_kw', required: true, defaultValue: 7.5 },
        { id: 'rpm', label: 'Speed n (rpm)', type: 'rpm', required: true, defaultValue: 1450 },
    ],
    outputs: [
        { id: 'torque_nm', label: 'Torque T (N·m)', type: 'torque_nm' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!(input.power_kw > 0)) errors.push('Power must be positive.');
        if (!(input.rpm > 0)) errors.push('Shaft speed must be positive.');
        if (input.rpm > 30000) warnings.push('High-speed regime (> 30,000 rpm).');
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input) => {
        const torque = (K_9550 * input.power_kw) / input.rpm;
        const exact = (input.power_kw * 1000) / ((2 * Math.PI * input.rpm) / 60);
        return {
            torque_nm: Number(torque.toFixed(4)),
            validation_report: { valid: true, errors: [], warnings: [] },
            report_payload: {
                power_kw: input.power_kw,
                rpm: input.rpm,
                torque_nm: Number(torque.toFixed(4)),
                torque_exact_nm: Number(exact.toFixed(4)),
                formula_trace: [
                    'T = 9550 · P / n   (industrial, P in kW, n in rpm, T in N·m)',
                    'T_exact = P·1000 / (2π n / 60)',
                ],
                assumptions: [
                    '9550 ≈ 60 000 / (2π) — IEC motor nameplate convention',
                    'Steady rated power, no service factor, no efficiency loss',
                ],
            },
        };
    },
};
