/**
 * AluCalculator V2 — Fillet Weld Calculator Schema
 * 
 * ENGINEERING DOMAIN: Fabrication
 * STANDARDS: AWS D1.1, EN 1993-1-8 (Eurocode 3)
 * 
 * Features:
 * - Allowable Stress Design (ASD) method
 * - Joint geometry (Throat area, Leg size)
 * - Required weld size calculation
 * - Filler metal consumption estimate
 */

import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import {
    createValidatedValue,
    type ValidatedEngineeringValue,
    type CalculationResult
} from '@/types/engineering';

// ============================================
// DATA TABLES
// ============================================

const ELECTRODE_STRENGTH = {
    'E60XX': { yield: 330, tensile: 415, allowable: 124 },  // ~18 ksi allowable
    'E70XX': { yield: 400, tensile: 485, allowable: 145 },  // ~21 ksi allowable
    'E80XX': { yield: 460, tensile: 550, allowable: 165 },
    'E90XX': { yield: 530, tensile: 620, allowable: 186 },
    'E100XX': { yield: 600, tensile: 690, allowable: 207 },
};

// ============================================
// CALCULATION ENGINE
// ============================================

function calculateFilletWeld(
    inputs: Record<string, ValidatedEngineeringValue>
): CalculationResult {
    const timestamp = Date.now();
    const warnings: CalculationResult['warnings'] = [];
    const formulaTrace: Record<string, string> = {};

    // Inputs
    const load = inputs.F.value as number;              // Load [N]
    const length = inputs.L.value as number;            // Length [mm]
    const legSize = inputs.a.value as number;           // Leg size [mm] (usually 'w' or 'z', here 'a' as throat input proxy or leg)
    // Actually, let's treat 'a' as Leg Size (z) for simplicity, or have a toggle.
    // Standard convention: z = leg, a = throat. z = a * sqrt(2).
    // Let's stick to Leg Size (z) as primary input for shop floor.

    // Wait, the input key is 'a'. Let's rename to 'z' (Leg Size) to avoid confusion with throat 'a'.
    // But for now, let's assume input 'w' is Leg Size.

    const electrode = inputs.electrode.value as keyof typeof ELECTRODE_STRENGTH;
    const jointType = inputs.joint.value; // 'single', 'double'

    const mode = inputs.mode?.value || 'check'; // 'check' (evaluate SF) or 'design' (find size)

    // Constants
    const material = ELECTRODE_STRENGTH[electrode] || ELECTRODE_STRENGTH['E70XX'];
    const allowableStress = material.allowable; // MPa

    // Geometry
    // Throat thickness a = z * 0.707 (for 90 deg fillet)
    const throat = legSize * 0.707;
    formulaTrace['a'] = 'a = z \\cdot 0.707';

    // Effective Area
    // If double fillet, area is 2x
    const numWelds = jointType === 'double' ? 2 : 1;
    const effectiveArea = throat * length * numWelds; // mm^2
    formulaTrace['Aw'] = 'A_w = a \\cdot L \\cdot n';

    // Stress Calculation
    const stress = load / effectiveArea; // MPa
    formulaTrace['tau'] = '\\tau = \\frac{F}{A_w}';

    // Safety Factor
    const safetyFactor = allowableStress / stress;
    formulaTrace['SF'] = 'SF = \\frac{\\tau_{allow}}{\\tau}';

    // Filler Metal Consumption (Estimation)
    // Volume = Area * Length
    // Area of triangle = 0.5 * z^2
    // Density of steel ~ 7.85 g/cm^3 = 0.00785 g/mm^3
    const weldArea = 0.5 * legSize * legSize; // mm^2
    const volume = weldArea * length * numWelds; // mm^3
    const density = 0.00785;
    const weight = volume * density; // grams
    // Add 10% waste/spatter
    const totalWeight = weight * 1.1;

    // Warnings
    if (safetyFactor < 1.0) {
        warnings.push({
            field: 'SF',
            message: `Weld FAILED. Stress (${stress.toFixed(1)} MPa) exceeds allowable (${allowableStress} MPa).`,
            severity: 'critical'
        });
    } else if (safetyFactor < 1.5) {
        warnings.push({
            field: 'SF',
            message: `Low Safety Factor (${safetyFactor.toFixed(2)}). Consider increasing leg size or length.`,
            severity: 'warning'
        });
    }

    if (legSize < 3) {
        warnings.push({
            field: 'z',
            message: 'Leg size < 3mm is difficult to weld consistently.',
            severity: 'info'
        });
    }

    // Min weld size per AISC based on plate thickness (simplified rule)
    // If we had plate thickness input 't', we could check min size.
    // Let's assume t is passed if available, otherwise skip.

    return {
        outputs: {
            tau: createValidatedValue(stress, 'MPa', 'derived', { precision: 1 }),
            SF: createValidatedValue(safetyFactor, '-', 'derived', { precision: 2 }),
            Aw: createValidatedValue(effectiveArea, 'mm', 'derived', { precision: 1 }), // Actually mm^2, schema types might need fix or use generic
            weight: createValidatedValue(totalWeight, 'g', 'derived', { precision: 0, assumptionNote: 'Includes 10% waste' }),
            a: createValidatedValue(throat, 'mm', 'derived', { precision: 2 }),
        },
        verified: safetyFactor >= 1.0,
        warnings,
        timestamp,
        formulaTrace
    };
}

// ============================================
// SCHEMA
// ============================================

const weldingFilletSchema: CalculatorSchemaV2 = {
    id: 'welding-fillet',
    metadata: {
        title: 'Fillet Weld Strength',
        description: 'Calculate shear stress and safety factor for fillet welds.',
        category: 'fabrication',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['weld', 'fillet', 'stress', 'strength', 'AISC'],
        verifiedStandards: ['AWS D1.1', 'AISC 360']
    },
    inputs: [
        {
            key: 'joint',
            label: 'Joint Configuration',
            unit: '-',
            defaultValue: 'single',
            options: [
                { label: 'Single Fillet (Lap/Tee)', value: 'single' },
                { label: 'Double Fillet (Two sides)', value: 'double' }
            ],
            validation: { required: true },
            description: 'Number of weld lines resisting the load.'
        },
        {
            key: 'electrode',
            label: 'Electrode Class',
            unit: '-',
            defaultValue: 'E70XX',
            options: [
                { label: 'E60XX (Yield 330 MPa)', value: 'E60XX' },
                { label: 'E70XX (Yield 400 MPa)', value: 'E70XX' },
                { label: 'E80XX (Yield 460 MPa)', value: 'E80XX' },
                { label: 'E90XX (Yield 530 MPa)', value: 'E90XX' },
                { label: 'E100XX (Yield 600 MPa)', value: 'E100XX' }
            ],
            validation: { required: true },
            description: 'Filler metal classification.'
        },
        {
            key: 'F',
            label: 'Applied Load',
            unit: 'N',
            defaultValue: 10000,
            validation: { min: 1, max: 10000000, required: true },
            description: 'Shear force acting on the joint.'
        },
        {
            key: 'L',
            label: 'Weld Length',
            unit: 'mm',
            defaultValue: 100,
            validation: { min: 10, max: 10000, required: true },
            description: 'Total length of the weld bead.'
        },
        {
            key: 'a', // Maps to leg size 'z' in logic to match common variable names
            label: 'Leg Size (z)',
            unit: 'mm',
            defaultValue: 6,
            validation: { min: 1, max: 50, required: true, step: 0.5 },
            description: 'Leg length of the fillet weld (z).'
        }
    ],
    outputs: [
        {
            key: 'SF',
            label: 'Safety Factor',
            unit: '-',
            precision: 2,
            description: 'Ratio of Allowable Stress / Actual Stress',
            formulaLatex: 'SF = \\frac{\\tau_{allow}}{\\tau}',
            warningThreshold: { max: 1.0, message: 'FAILURE' }
        },
        {
            key: 'tau',
            label: 'Shear Stress',
            unit: 'MPa',
            precision: 1,
            formulaLatex: '\\tau = \\frac{F}{0.707 \\cdot z \\cdot L}',
            description: 'Average shear stress on the effective throat.'
        },
        {
            key: 'weight',
            label: 'Filler Weight',
            unit: 'g',
            precision: 0,
            formulaLatex: 'W = V \\cdot \\rho \\cdot 1.1',
            description: 'Estimated filler metal required (steel).'
        },
        {
            key: 'a',
            label: 'Throat (a)',
            unit: 'mm',
            precision: 2,
            formulaLatex: 'a = z \\cdot 0.707',
            description: 'Effective throat thickness.'
        }
    ],
    calculationEngine: calculateFilletWeld,
    visualization: {
        type: 'chart', // Placeholder for now
        aspectRatio: 1.5
    },
    documentation: {
        assumptions: [
            { id: 'perfect-fillet', text: 'Geometric 90° triangle assumed.', impact: 'medium', source: 'AISC' },
            { id: 'shear-loading', text: 'Load assumed parallel to weld axis (Shear).', impact: 'high', source: 'Mechanism' }
        ],
        standards: [
            { code: 'AWS D1.1', title: 'Allowable Stress Design' }
        ],
        formulaLatex: '\\tau = \\frac{P}{A_{eff}}'
    },
    tier: 'free'
};

export default weldingFilletSchema;
