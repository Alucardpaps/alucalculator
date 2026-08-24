/**
 * AluCalculator V2 — Welding Heat Input Calculator
 * 
 * ENGINEERING DOMAIN: Fabrication
 * STANDARDS: EN 1011-1, AWS D1.1
 * 
 * CRITICAL REQUIREMENT:
 * Efficiency factor η has NO DEFAULT.
 * User MUST select process and enter η explicitly.
 * 
 * Features:
 * - Process selection (TIG/MIG/MMA/SAW)
 * - Efficiency enforcement (breaks calculation if missing)
 * - Heat input per EN 1011-1
 * - Full traceability
 */

import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import {
    createValidatedValue,
    createUnverifiedValue,
    type ValidatedEngineeringValue,
    type CalculationResult
} from '@/types/engineering';

// ============================================
// PROCESS EFFICIENCY DATA
// ============================================

const WELDING_PROCESSES = {
    TIG: { name: 'TIG (GTAW)', efficiencyRange: [0.55, 0.65], typical: 0.60 },
    MIG: { name: 'MIG (GMAW)', efficiencyRange: [0.75, 0.85], typical: 0.80 },
    MMA: { name: 'MMA (SMAW)', efficiencyRange: [0.70, 0.85], typical: 0.80 },
    SAW: { name: 'SAW', efficiencyRange: [0.90, 0.99], typical: 0.95 },
    FCAW: { name: 'FCAW', efficiencyRange: [0.80, 0.90], typical: 0.85 },
};

// ============================================
// CALCULATION ENGINE
// ============================================

function calculateWeldingHeatInput(
    inputs: Record<string, ValidatedEngineeringValue>
): CalculationResult {
    const timestamp = Date.now();
    const warnings: CalculationResult['warnings'] = [];
    const formulaTrace: Record<string, string> = {};

    // Extract values
    const voltage = inputs.V.value as number;           // Voltage [V]
    const current = inputs.I.value as number;           // Current [A]
    const speed = inputs.v.value as number;             // Travel speed [mm/s]
    const efficiency = inputs.eta?.value as number;     // Efficiency factor (REQUIRED)
    const thickness = (inputs.t?.value as number) ?? 0;   // Material thickness [mm]

    // ===== EFFICIENCY ENFORCEMENT =====
    // This is NON-NEGOTIABLE per Master Prompt

    if (efficiency === undefined || efficiency === null || isNaN(efficiency)) {
        return {
            outputs: {},
            verified: false,
            warnings: [
                {
                    field: 'eta',
                    message: 'CALCULATION BLOCKED: Efficiency factor η is REQUIRED. Select welding process and enter η value.',
                    severity: 'critical',
                },
            ],
            timestamp,
            formulaTrace: {},
        };
    }

    // Validate efficiency range
    if (efficiency < 0.5 || efficiency > 1.0) {
        warnings.push({
            field: 'eta',
            message: `Efficiency η=${efficiency} is outside typical range (0.5-1.0). Verify process selection.`,
            severity: 'warning',
        });
    }

    // ===== HEAT INPUT CALCULATION =====

    // Heat input per EN 1011-1: Q = (η × V × I) / v [kJ/mm]
    // V in volts, I in amps, v in mm/s
    const heatInputJmm = (efficiency * voltage * current) / speed; // J/mm
    const heatInputKJmm = heatInputJmm / 1000; // kJ/mm

    formulaTrace['Q'] = 'Q = \\frac{\\eta \\cdot V \\cdot I}{v}';

    // Power delivered
    const arcPower = voltage * current / 1000; // kW
    formulaTrace['P'] = 'P = V \\cdot I';

    // Effective power (with efficiency)
    const effectivePower = arcPower * efficiency; // kW
    formulaTrace['Peff'] = 'P_{eff} = P \\cdot \\eta';

    // ===== ENGINEERING WARNINGS =====

    // High heat input warning (>3 kJ/mm for steel, >2 for aluminum)
    if (heatInputKJmm > 3.0) {
        warnings.push({
            field: 'Q',
            message: `Heat input ${heatInputKJmm.toFixed(2)} kJ/mm is HIGH. Risk of distortion and HAZ overheating.`,
            severity: 'warning',
        });
    }

    // Low heat input warning (may cause lack of fusion)
    if (heatInputKJmm < 0.3) {
        warnings.push({
            field: 'Q',
            message: `Heat input ${heatInputKJmm.toFixed(2)} kJ/mm is LOW. Risk of lack of fusion.`,
            severity: 'warning',
        });
    }

    // Cooling rate estimation (simplified)
    let coolingRate = 0;
    let t85 = 0;
    if (thickness > 0) {
        // Simplified Rosenthal equation for thin plates
        // This is illustrative - real calculations are more complex
        coolingRate = (2 * Math.PI * 50 * thickness * thickness) / (heatInputJmm); // °C/s at 300°C
        t85 = heatInputKJmm * 1000 / (thickness * 2); // seconds (simplified)

        formulaTrace['t85'] = 't_{8/5} \\approx \\frac{Q}{2t}';
    }

    // ===== BUILD OUTPUT =====

    const verified = warnings.filter(w => w.severity === 'critical').length === 0;

    const outputs: Record<string, ValidatedEngineeringValue> = {
        Q: createValidatedValue(heatInputKJmm, 'kJ/mm', 'derived', { precision: 3 }),
        P: createValidatedValue(arcPower, 'kW', 'derived', { precision: 2 }),
        Peff: createValidatedValue(effectivePower, 'kW', 'derived', { precision: 2 }),
    };

    if (thickness > 0 && t85 > 0) {
        outputs.t85 = createValidatedValue(t85, '-', 'derived', {
            precision: 1,
            assumptionNote: 'Simplified t8/5 estimation'
        });
    }

    return {
        outputs,
        verified,
        warnings,
        timestamp,
        formulaTrace,
    };
}

// ============================================
// SCHEMA DEFINITION
// ============================================

const weldingHeatSchema: CalculatorSchemaV2 = {
    id: 'welding-heat',

    metadata: {
        title: 'Welding Heat Input Calculator',
        description: 'Calculate heat input per EN 1011-1. Process efficiency factor is REQUIRED.',
        category: 'fabrication',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-09',
        tags: ['welding', 'heat input', 'TIG', 'MIG', 'MMA', 'SAW', 'EN 1011'],
        verifiedStandards: ['EN 1011-1', 'AWS D1.1'],
    },

    inputs: [
        {
            key: 'process',
            label: 'Welding Process',
            unit: '-',
            defaultValue: null, // MUST SELECT
            validation: {
                required: true,
            },
            description: 'Select welding process to determine typical efficiency range.',
            options: [
                { label: 'TIG (GTAW) — η: 0.55-0.65', value: 'TIG' },
                { label: 'MIG (GMAW) — η: 0.75-0.85', value: 'MIG' },
                { label: 'MMA (SMAW) — η: 0.70-0.85', value: 'MMA' },
                { label: 'SAW — η: 0.90-0.99', value: 'SAW' },
                { label: 'FCAW — η: 0.80-0.90', value: 'FCAW' },
            ],
        },
        {
            key: 'eta',
            label: 'Efficiency Factor (η)',
            unit: '-',
            defaultValue: null, // NO DEFAULT - REQUIRED INPUT
            validation: {
                min: 0.5,
                max: 1.0,
                required: true,
                step: 0.01,
                warnings: [
                    {
                        condition: (v) => v < 0.55,
                        message: 'Very low efficiency. Typical minimum is 0.55 for TIG.',
                        severity: 'warning',
                    },
                ],
            },
            description: 'Process thermal efficiency. NO DEFAULT — you must verify with your process.',
        },
        {
            key: 'V',
            label: 'Arc Voltage (V)',
            unit: 'V',
            defaultValue: 22,
            validation: {
                min: 10,
                max: 50,
                required: true,
                step: 0.5,
            },
            description: 'Arc voltage in volts.',
        },
        {
            key: 'I',
            label: 'Welding Current (I)',
            unit: 'A',
            defaultValue: 150,
            validation: {
                min: 20,
                max: 1000,
                required: true,
                step: 5,
            },
            description: 'Welding current in amperes.',
        },
        {
            key: 'v',
            label: 'Travel Speed (v)',
            unit: 'mm/s',
            defaultValue: 3,
            validation: {
                min: 0.5,
                max: 50,
                required: true,
                step: 0.1,
            },
            description: 'Welding travel speed in mm/s.',
        },
        {
            key: 't',
            label: 'Material Thickness',
            unit: 'mm',
            defaultValue: 10,
            validation: {
                min: 1,
                max: 100,
                required: false,
                step: 1,
            },
            description: 'Plate thickness for cooling rate estimation (optional).',
            group: 'advanced',
        },
    ],

    outputs: [
        {
            key: 'Q',
            label: 'Heat Input (Q)',
            unit: 'kJ/mm',
            formulaLatex: 'Q = \\frac{\\eta \\cdot V \\cdot I}{v \\cdot 1000}',
            description: 'Heat input per unit length of weld.',
            precision: 3,
            warningThreshold: {
                max: 3.0,
                message: 'High heat input — risk of distortion.',
            },
        },
        {
            key: 'P',
            label: 'Arc Power',
            unit: 'kW',
            formulaLatex: 'P = V \\cdot I',
            description: 'Total arc power.',
            precision: 2,
        },
        {
            key: 'Peff',
            label: 'Effective Power',
            unit: 'kW',
            formulaLatex: 'P_{eff} = P \\cdot \\eta',
            description: 'Power actually transferred to workpiece.',
            precision: 2,
        },
        {
            key: 't85',
            label: 'Cooling Time t₈/₅',
            unit: '-',
            formulaLatex: 't_{8/5} \\approx \\frac{Q}{2t}',
            description: 'Time to cool from 800°C to 500°C (simplified).',
            precision: 1,
        },
    ],

    calculationEngine: calculateWeldingHeatInput,

    visualization: {
        type: 'chart',
        aspectRatio: 2,
    },

    documentation: {
        assumptions: [
            {
                id: 'steady-state',
                text: 'Steady-state welding conditions assumed.',
                impact: 'medium',
                source: 'EN 1011-1',
            },
            {
                id: 't85-simplified',
                text: 'Cooling time t₈/₅ is a simplified estimate. Full 2D/3D heat flow requires FEA.',
                impact: 'high',
                source: 'Rosenthal equations',
            },
            {
                id: 'single-pass',
                text: 'Single-pass weld assumed. Multi-pass requires summation.',
                impact: 'medium',
                source: 'EN 1011-1',
            },
        ],
        standards: [
            { code: 'EN 1011-1', section: '7.4', title: 'Arc energy and heat input' },
            { code: 'AWS D1.1', title: 'Structural Welding Code — Steel' },
            { code: 'EN ISO 15614-1', title: 'Welding procedure qualification' },
        ],
        formulaLatex: 'Q = \\frac{\\eta \\cdot V \\cdot I}{v} \\quad [\\text{kJ/mm}]',
    },

    tier: 'free',
};

export default weldingHeatSchema;
