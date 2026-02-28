import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';

export const columnBucklingSchema: CalculatorSchemaV2 = {
    id: 'column-buckling',
    metadata: {
        title: 'Column Buckling (Euler)',
        description: 'Calculate critical buckling load and stress for slender columns.',
        category: 'civil',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['buckling', 'euler', 'column', 'stability'],
        verifiedStandards: ['Euler Beam Theory']
    },
    documentation: {
        assumptions: [
            { id: 'elastic', text: 'Material behaves linearly elastic', impact: 'high' },
            { id: 'slender', text: 'Column is slender (large slenderness ratio)', impact: 'high' }
        ],
        standards: [
            { code: 'Euler', title: 'Euler Critical Load Theory' }
        ],
        formulaLatex: 'P_{cr} = \\frac{\\pi^2 E I}{(KL)^2}'
    },
    inputs: [
        {
            key: 'length',
            label: 'Column Length (L)',
            description: 'Unsupported length',
            unit: 'mm',
            defaultValue: 1000,
            validation: { required: true, min: 1, step: 10 }
        },
        {
            key: 'modulus',
            label: 'Young\'s Modulus (E)',
            description: 'Material elasticity',
            unit: 'GPa',
            defaultValue: 200,
            validation: { required: true, min: 1, step: 5 }
        },
        {
            key: 'inertia',
            label: 'Moment of Inertia (I)',
            description: 'Weak axis inertia',
            unit: 'mm4',
            defaultValue: 10000,
            validation: { required: true, min: 1, step: 100 }
        },
        {
            key: 'kFactor',
            label: 'Effective Length Factor (K)',
            unit: '-', // unitless
            defaultValue: 1,
            description: '1.0 (Pinned-Pinned), 0.5 (Fixed-Fixed), 0.7 (Fixed-Pinned), 2.0 (Fixed-Free)',
            validation: { required: true, min: 0.1 }
        }
    ],
    outputs: [
        {
            key: 'criticalLoad',
            label: 'Critical Load (Pcr)',
            unit: 'kN',
            description: 'Maximum axial load before buckling',
            formulaLatex: 'P_{cr} = \\frac{\\pi^2 E I}{(KL)^2}'
        },
        {
            key: 'slenderness',
            label: 'Slenderness Ratio (λ)',
            unit: '-',
            description: 'KL / r (Radius of Gyration)',
            formulaLatex: '\\lambda = \\frac{K L}{r}'
        }
    ],
    calculationEngine: (inputs) => {
        const L = inputs.length.value as number;
        const E_GPa = inputs.modulus.value as number;
        const I = inputs.inertia.value as number;
        const K = inputs.kFactor.value as number;

        const E = E_GPa * 1000; // MPa -> N/mm2

        // Euler Buckling Formula: Pcr = (pi^2 * E * I) / (Le^2)
        // Le = K * L
        const Le = K * L;

        // Pcr in Newtons
        const Pcr_N = (Math.PI ** 2 * E * I) / (Le ** 2);
        const Pcr_kN = Pcr_N / 1000;

        return {
            outputs: {
                criticalLoad: createValidatedValue(Pcr_kN, 'kN', 'derived'),
                slenderness: createValidatedValue(0, '-', 'derived') // Placeholder
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    // Simple visualizer showing the buckled shape mode
    visualization: {
        type: 'svg-parametric',
        render: (result: CalculationResult, inputs: Record<string, number>) => {
            const K = inputs['kFactor'] || 1;

            // Draw column
            const h = 200;
            const w = 50;
            const cx = 150;
            const cy_top = 50;
            const cy_bot = 250;

            // Path generator
            let d = `M${cx},${cy_top} `;
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps; // 0 to 1
                const y = cy_top + t * (cy_bot - cy_top);
                // Simple bow: sin(t * PI) * deflection
                const deflection = 20 * Math.sin(t * Math.PI);
                d += `L${cx + deflection},${y} `;
            }

            return (
                <svg viewBox="0 0 300 300" >
                    <path d={d} stroke="#00e5ff" strokeWidth="3" fill="none" />
                    {/* Load Arrow */}
                    <line x1={cx} y1={20} x2={cx} y2={cy_top} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                    <text x={cx + 10} y={30} fill="#ef4444" > P </text>
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" > <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" /> </marker>
                    </defs>
                    <text x="10" y="290" fill="#666" fontSize="10" > K={K} </text>
                </svg>
            );
        }
    }
};
