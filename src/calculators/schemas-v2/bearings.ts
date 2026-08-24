
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { BEARING_DATABASE, getBearing } from '@/data/bearingStandards';
import { findBearing } from '@/data/skfBearings';

const bearingLifeSchema: CalculatorSchemaV2 = {
    id: 'bearings', // Keep ID to match file name/registry expectations if possible, or rename file
    metadata: {
        title: 'Bearing Life Calculator (L10)',
        description: 'Calculate L10 life for standard deep groove ball bearings (ISO 281).',
        category: 'mechanical',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-09',
        tags: ['bearing', 'life', 'L10', 'skf', 'iso'],
        verifiedStandards: ['ISO 281'],
    },

    inputs: [
        {
            key: 'model',
            label: 'Bearing Model',
            unit: '-',
            defaultValue: 6204, // Stored as number if possible? Schema says value: number | string. Let's use string code as value if generic allowed, but input type usually number.
            // WORKAROUND: Use the integer part of the code (6204) as the value. 
            // BEARING_DATABASE has '6000', '6200'. These parse to numbers fine.
            description: 'Standard metric ball bearing series.',
            options: BEARING_DATABASE.map(b => ({
                label: `${b.code} (d=${b.d}, D=${b.D}, B=${b.B}) - C=${b.C}kN`,
                value: parseInt(b.code) // Ensure this is number
            })),
            validation: {
                required: true
            }
        },
        {
            key: 'Fr',
            label: 'Radial Load',
            unit: 'kN',
            defaultValue: 5,
            description: 'Applied radial load.',
            validation: {
                required: true,
                min: 0
            }
        },
        {
            key: 'Fa',
            label: 'Axial Load',
            unit: 'kN',
            defaultValue: 0,
            description: 'Applied axial load.',
            validation: {
                required: true,
                min: 0
            }
        },
        {
            key: 'rpm',
            label: 'Rotational Speed',
            unit: 'rpm',
            defaultValue: 1500,
            description: 'Operating speed.',
            validation: {
                required: true,
                min: 1
            }
        },
        {
            key: 'reliability',
            label: 'Reliability Factor (a1)',
            unit: '-',
            defaultValue: 1,
            description: '1.0 = 90% reliability (L10). 0.21 = 99% (L1).',
            options: [
                { label: '90% (L10) - Standard', value: 1.0 },
                { label: '95% (L5)', value: 0.64 },
                { label: '96% (L4)', value: 0.55 },
                { label: '97% (L3)', value: 0.47 },
                { label: '98% (L2)', value: 0.37 },
                { label: '99% (L1)', value: 0.25 }, // a1 for 99% is approx 0.21-0.25 depending on source
            ],
            validation: {
                required: true
            }
        }
    ],

    outputs: [
        {
            key: 'C_dynamic',
            label: 'Dynamic Rating (C)',
            unit: 'kN',
            formulaLatex: 'C_{db}',
            description: 'Basic dynamic load rating from database.',
            precision: 2
        },
        {
            key: 'C0_static',
            label: 'Static Rating (C0)',
            unit: 'kN',
            formulaLatex: 'C_{0}',
            description: 'Basic static load rating.',
            precision: 2
        },
        {
            key: 'P_equiv',
            label: 'Equivalent Load',
            unit: 'kN',
            formulaLatex: 'P = X F_r + Y F_a',
            description: 'Equivalent dynamic bearing load.',
            precision: 3
        },
        {
            key: 'e_factor',
            label: 'Limit e',
            unit: '-',
            formulaLatex: 'e',
            description: 'Fa/Fr ratio limit for factor selection.',
            precision: 3
        },
        {
            key: 'Y_factor',
            label: 'Factor Y',
            unit: '-',
            formulaLatex: 'Y',
            description: 'Axial load factor when Fa/Fr > e.',
            precision: 2
        },
        {
            key: 'L10',
            label: 'Basic Life (L10)',
            unit: 'Mrev',
            formulaLatex: 'L_{10} = (C/P)^3',
            description: 'Life in million revolutions.',
            precision: 1
        },
        {
            key: 'L10h',
            label: 'Life in Hours',
            unit: 'hours',
            formulaLatex: 'L_{10h} = \\frac{10^6}{60 n} L_{10}',
            description: 'Life in operating hours.',
            precision: 0,
            warningThreshold: {
                min: 5000,
                message: 'Life < 5000h. Consider larger bearing or reduced load.'
            }
        }
    ],

    calculationEngine: (inputs) => {
        const code = inputs.model.value.toString();
        const bearing = getBearing(code);
        const skfBearing = findBearing(code);

        if (!bearing) {
            throw new Error(`Bearing ${code} not found`);
        }

        const C = bearing.C;
        const C0 = bearing.C0;
        const Fr = inputs.Fr.value as number;
        const Fa = inputs.Fa.value as number;
        const n = inputs.rpm.value as number;
        const a1 = inputs.reliability.value as number;

        let e = skfBearing?.e ?? 0.25;
        let Y = skfBearing?.Y ?? 1.6;

        // Series fallback when SKF catalog entry lacks e/Y
        if (!skfBearing?.e) {
            const fa_c0 = Fa / C0;
            if (fa_c0 <= 0.014) { e = 0.19; Y = 2.30; }
            else if (fa_c0 <= 0.028) { e = 0.22; Y = 1.99; }
            else if (fa_c0 <= 0.056) { e = 0.26; Y = 1.71; }
            else if (fa_c0 <= 0.084) { e = 0.28; Y = 1.55; }
            else if (fa_c0 <= 0.11) { e = 0.30; Y = 1.45; }
            else if (fa_c0 <= 0.17) { e = 0.34; Y = 1.31; }
            else if (fa_c0 <= 0.28) { e = 0.38; Y = 1.15; }
            else if (fa_c0 <= 0.42) { e = 0.42; Y = 1.04; }
            else { e = 0.44; Y = 1.00; }
        }

        let P = Fr;
        const ratio = Fr > 0 ? Fa / Fr : Infinity;

        if (ratio > e) {
            P = 0.56 * Fr + Y * Fa;
        }

        // Life
        const L10_mr = Math.pow((C / P), 3); // Ball bearings p=3
        const L10_adjusted = L10_mr * a1;
        const L10h = (1000000 / (60 * n)) * L10_adjusted;

        return {
            outputs: {
                C_dynamic: createValidatedValue(C, 'kN', 'derived'),
                C0_static: createValidatedValue(C0, 'kN', 'derived'),
                P_equiv: createValidatedValue(P, 'kN', 'derived'),
                e_factor: createValidatedValue(e, '-', 'derived'),
                Y_factor: createValidatedValue(Y, '-', 'derived'),
                L10: createValidatedValue(L10_adjusted, 'Mrev', 'derived'),
                L10h: createValidatedValue(L10h, 'hours', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },


    documentation: {
        assumptions: [
            { id: 'cleanliness', text: 'Lubricant cleanliness is normal (ISO 4406 -/15/12)', impact: 'medium' },
            { id: 'temp', text: 'Operating temperature < 100°C', impact: 'low' }
        ],
        standards: [
            { code: 'ISO 281', title: 'Rolling bearings — Dynamic load ratings and rating life' }
        ],
        formulaLatex: 'L_{10} = (C/P)^p'
    },

    // Basic visualization placeholder
    visualization: {
        type: 'none'
    },
    tier: 'free'
};

export default bearingLifeSchema;
