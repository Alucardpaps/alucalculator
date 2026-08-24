import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const fatigueLifeSnSchema: CalculatorSchemaV2 = {
    id: 'fatigue-advanced',
    metadata: {
        title: 'Fatigue Life S-N (Basquin)',
        description: 'Predict the expected cycle life of a component under fluctuating load.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-04-06',
        tags: ['fatigue', 'S-N curve', 'Basquin', 'life cycle', 'fracture'],
        verifiedStandards: ['ASTM E606']
    },
    inputs: [
        { key: 'alternatingStress', label: 'Alt. Stress (σa)', unit: 'MPa' as any, defaultValue: 200, description: 'The half-amplitude of the fluctuating stress cycle.', validation: { required: true, min: 1 } },
        { key: 'tensileStrength', label: 'Tensile Strength (Sut)', unit: 'MPa' as any, defaultValue: 600, description: 'Material ultimate tensile strength.', validation: { required: true, min: 10 } },
        { key: 'fractureStrength', label: 'Frac. Strength (σf\')', unit: 'MPa' as any, defaultValue: 1000, description: 'True fracture strength (empirical offset).', validation: { required: true, min: 1 } },
        { key: 'basquinExponent', label: 'Basquin Exp (b)', unit: '-' as any, defaultValue: -0.08, description: 'Fatigue strength exponent (typically -0.05 to -0.12).', validation: { required: true, max: -0.01 } }
    ],
    outputs: [
        { key: 'fatigueCycles', label: 'Cycle Life (N)', unit: 'Cycles' as any, formulaLatex: 'N = \\frac{1}{2}\\left(\\frac{\\sigma_a}{\\sigma_f\'}\\right)^{1/b}', precision: 0, description: 'Estimated number of cycles before failure.' },
        { key: 'regime', label: 'Fatigue Regime', unit: '-' as any, formulaLatex: 'N > 10^3', precision: 0, description: 'LCF (<10^3) vs HCF (>10^3) regime.' }
    ],
    calculationEngine: (inputs) => {
        const sa = Number(inputs.alternatingStress.value);
        const sf = Number(inputs.fractureStrength.value);
        const b = Number(inputs.basquinExponent.value);

        // N = 0.5 * (sa/sf)^(1/b)
        const cycles = 0.5 * Math.pow(sa / sf, 1 / b);

        return {
            outputs: {
                fatigueCycles: createValidatedValue(Math.round(cycles), 'Cycles' as any, 'derived'),
                regime: createValidatedValue(cycles > 1000 ? 1 : 0, '-' as any, 'derived')
            },
            verified: true,
            warnings: cycles < 10000 ? [{ field: 'fatigueCycles', message: 'Low cycle fatigue detected. Expect failure within operating life.', severity: 'critical' as const }] : [],
            timestamp: Date.now()
        };
    },
    documentation: {
        assumptions: [{ id: 'zero-mean', text: 'Analysis assumes fully reversed loading (Mean Stress = 0).', impact: 'high' }],
        standards: [{ code: 'ASTM E606', title: 'Standard Test Method for Strain-Controlled Fatigue Testing' }],
        formulaLatex: '\\sigma_a = \\sigma_f\' (2N)^b'
    },
    tier: 'pro',
    visualization: { type: 'none' }
};

export default fatigueLifeSnSchema;
