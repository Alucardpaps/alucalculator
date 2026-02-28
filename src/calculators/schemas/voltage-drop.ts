/**
 * AluCalc OS — Voltage Drop Calculator Schema
 * 
 * ENGINEERING DOMAIN: Electrical
 * STANDARDS: IEC 60364, NEC
 * 
 * Calculate cable voltage drop and sizing:
 * - Voltage drop percentage
 * - Cable cross-section selection
 * - Power loss
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const voltageDropSchema: CalculatorSchema = {
    id: 'voltage-drop-v1',
    version: '1.0.0',
    domain: 'electrical',

    metadata: {
        title: 'Voltage Drop Calculator',
        description: 'Calculate cable voltage drop and verify sizing per IEC 60364.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['voltage drop', 'cable', 'conductor', 'sizing', 'electrical']
    },

    inputs: [
        {
            key: 'Vsupply',
            name: 'Supply Voltage',
            unit: 'V',
            default: 400,
            min: 12,
            max: 1000,
            step: 1,
            description: 'System voltage (line-to-line for 3-phase).',
            required: true
        },
        {
            key: 'phases',
            name: 'Phase Configuration',
            unit: '-',
            default: 3,
            min: 1,
            max: 3,
            step: 2,
            description: '1=Single-phase, 3=Three-phase',
            required: true
        },
        {
            key: 'I',
            name: 'Load Current',
            unit: 'A',
            default: 50,
            min: 0.1,
            max: 1000,
            step: 1,
            description: 'Full load current.',
            required: true
        },
        {
            key: 'L',
            name: 'Cable Length',
            unit: 'm',
            default: 100,
            min: 1,
            max: 10000,
            step: 1,
            description: 'One-way cable length.',
            required: true
        },
        {
            key: 'A',
            name: 'Conductor Area',
            unit: 'mm²',
            default: 16,
            min: 0.5,
            max: 630,
            step: 0.5,
            description: 'Cross-sectional area per conductor.',
            required: true
        },
        {
            key: 'conductorType',
            name: 'Conductor Material',
            unit: '-',
            default: 1,
            min: 1,
            max: 2,
            step: 1,
            description: '1=Copper (ρ=0.0175), 2=Aluminum (ρ=0.028)',
            required: true
        },
        {
            key: 'pf',
            name: 'Power Factor',
            unit: '-',
            default: 0.85,
            min: 0.5,
            max: 1,
            step: 0.01,
            description: 'Load power factor (cos φ).',
            required: false
        },
        {
            key: 'maxDropPercent',
            name: 'Max Allowed Drop',
            unit: '%',
            default: 4,
            min: 1,
            max: 10,
            step: 0.5,
            description: 'Maximum allowable voltage drop per standards.',
            required: false
        }
    ],

    outputs: [
        {
            key: 'rho',
            name: 'Resistivity',
            unit: 'Ω·mm²/m',
            formula: 'conductorType == 1 ? 0.0175 : 0.028',
            description: 'Conductor resistivity at 20°C',
            precision: 4
        },
        {
            key: 'R',
            name: 'Cable Resistance',
            unit: 'Ω',
            formula: '2 * rho * L / A',
            description: 'Total round-trip resistance',
            precision: 4
        },
        {
            key: 'Vdrop',
            name: 'Voltage Drop',
            unit: 'V',
            formula: 'phases == 1 ? 2 * I * R * pf : sqrt(3) * I * R * pf',
            description: 'Voltage drop in the cable',
            precision: 2
        },
        {
            key: 'VdropPercent',
            name: 'Drop Percentage',
            unit: '%',
            formula: '(Vdrop / Vsupply) * 100',
            description: 'Voltage drop as percentage of supply',
            precision: 2,
            warningThreshold: {
                max: 4,
                message: 'Voltage drop exceeds 4%. Consider larger cable.'
            }
        },
        {
            key: 'Vload',
            name: 'Load Voltage',
            unit: 'V',
            formula: 'Vsupply - Vdrop',
            description: 'Voltage at load terminals',
            precision: 1
        },
        {
            key: 'Ploss',
            name: 'Power Loss',
            unit: 'W',
            formula: 'phases == 1 ? I^2 * R : 3 * I^2 * R / 2',
            description: 'Power dissipated in cable',
            precision: 1
        },
        {
            key: 'passesCheck',
            name: 'Passes Check',
            unit: '-',
            formula: 'VdropPercent <= maxDropPercent ? 1 : 0',
            description: '1=OK, 0=Increase cable size',
            precision: 0
        },
        {
            key: 'recommendedArea',
            name: 'Recommended Area',
            unit: 'mm²',
            formula: '(VdropPercent / maxDropPercent) * A * 1.1',
            description: 'Approximate cable size for compliance',
            precision: 1
        }
    ],

    assumptions: [
        {
            id: 'resistive-only',
            text: 'Ignores cable inductance. Valid for most LV installations.',
            impact: 'low',
            source: 'IEC 60364-5-52'
        },
        {
            id: 'ambient-temp',
            text: 'Resistivity at 20°C. Hot environments increase resistance.',
            impact: 'medium',
            source: 'IEC 60228'
        },
        {
            id: 'balanced-load',
            text: 'For 3-phase: balanced load assumed. Unbalance increases drop.',
            impact: 'medium',
            source: 'Electrical engineering practice'
        }
    ],

    references: [
        {
            standard: 'IEC 60364-5-52',
            title: 'Selection and erection of electrical equipment - Wiring systems',
        },
        {
            standard: 'NEC',
            title: 'National Electrical Code - Article 215/210',
        }
    ],

    tier: 'free'
};

export default voltageDropSchema;
