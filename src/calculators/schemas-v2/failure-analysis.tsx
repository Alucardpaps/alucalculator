import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const failureAnalysisSchema: CalculatorSchemaV2 = {
    id: 'failure-diagnosis',
    metadata: {
        title: 'Failure Analysis & Safety Tool',
        description: 'Analyze mechanical components for yield, fatigue, and overload failure modes.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-04-06',
        tags: ['failure', 'safety factor', 'stress', 'yield', 'fatigue'],
        verifiedStandards: ['ASME B15.1']
    },
    inputs: [
        { key: 'appliedStress', label: 'Applied Stress (σ)', unit: 'MPa' as any, defaultValue: 150, description: 'Maximum equivalent stress calculated for the part.', validation: { required: true, min: 0 } },
        { key: 'yieldStrength', label: 'Yield Strength (Sy)', unit: 'MPa' as any, defaultValue: 250, description: 'Material yield strength.', validation: { required: true, min: 1 } },
        { key: 'tensileStrength', label: 'Tensile Strength (Sut)', unit: 'MPa' as any, defaultValue: 400, description: 'Material ultimate tensile strength.', validation: { required: true, min: 1 } },
        { key: 'enduranceLimit', label: 'Endurance Limit (Se)', unit: 'MPa' as any, defaultValue: 180, description: 'Corrected endurance limit for fatigue analysis.', validation: { required: true, min: 0 } },
        { key: 'loadType', label: 'Load Type', unit: '-' as any, defaultValue: 'static', options: [{ label: 'Static (Steady)', value: 'static' }, { label: 'Fluctuating (Fatigue)', value: 'fatigue' }], description: 'Nature of the applied load (Static or Cyclic).', validation: { required: true } }
    ],
    outputs: [
        { key: 'fosYield', label: 'Static Safety Factor (Ny)', unit: '-' as any, formulaLatex: 'N_y = \\frac{S_y}{\\sigma}', precision: 2, description: 'Factor of safety against permanent deformation.' },
        { key: 'fosFatigue', label: 'Fatigue Safety Factor (Nf)', unit: '-' as any, formulaLatex: 'N_f = \\frac{S_e}{\\sigma}', precision: 2, description: 'Factor of safety against fatigue failure (Infinite life).' },
        { key: 'status', label: 'Design Status', unit: '-' as any, formulaLatex: 'NY \\ge 1.0', precision: 0, description: 'General assessment based on safety factors.' }
    ],
    calculationEngine: (inputs) => {
        const sigma = Number(inputs.appliedStress.value);
        const Sy = Number(inputs.yieldStrength.value);
        const Se = Number(inputs.enduranceLimit.value);
        const loadType = inputs.loadType.value;

        const ny = Sy / sigma;
        const nf = Se / sigma;

        return {
            outputs: {
                fosYield: createValidatedValue(ny, '-' as any, 'derived'),
                fosFatigue: createValidatedValue(nf, '-' as any, 'derived'),
                status: createValidatedValue(ny < 1 ? 0 : 1, '-' as any, 'derived')
            },
            verified: true,
            warnings: ny < 1.2 ? [{ field: 'fosYield', message: 'Safety factor is dangerously low (< 1.2). High risk of yielding.', severity: 'critical' as const }] : [],
            timestamp: Date.now()
        };
    },
    documentation: {
        assumptions: [{ id: 'von-mises', text: 'Stresses are assumed to be Von Mises equivalent stresses.', impact: 'high' }],
        standards: [{ code: 'ASME B15.1', title: 'Safety Standard for Mechanical Power Transmission Apparatus' }],
        formulaLatex: 'N = \\frac{\\text{Strength}}{\\text{Stress}}'
    },
    tier: 'pro',
    visualization: { type: 'none' }
};

export default failureAnalysisSchema;
