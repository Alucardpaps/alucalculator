import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';

export const machiningGrindingSchema: CalculatorSchemaV2 = {
    id: 'machining-grinding',
    metadata: {
        title: 'Grinding Calculator',
        description: 'Calculate peripheral speed (Vs) for grinding wheels.',
        category: 'fabrication',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['grinding', 'machining', 'cutting-speed', 'abrasive'],
        verifiedStandards: ['Industry Standard']
    },
    documentation: {
        assumptions: [
            { id: 'perfect-circle', text: 'Wheel is perfectly circular', impact: 'low' }
        ],
        standards: [],
        formulaLatex: 'V_s = \\frac{\\pi \\cdot D \\cdot n}{60,000}'
    },
    inputs: [
        {
            key: 'diameter',
            label: 'Wheel Diameter (D)',
            description: 'Outer diameter',
            unit: 'mm',
            defaultValue: 250,
            validation: { required: true, min: 1, step: 10 }
        },
        {
            key: 'rpm',
            label: 'Rotational Speed (n)',
            description: 'Spindle speed',
            unit: 'rpm',
            defaultValue: 2800,
            validation: { required: true, min: 1, step: 100 }
        }
    ],
    outputs: [
        {
            key: 'cuttingSpeed',
            label: 'Cutting Speed (Vs)',
            unit: 'm/s',
            description: 'Peripheral velocity of the wheel',
            formulaLatex: 'V_s = \\frac{\\pi \\cdot D \\cdot n}{1000 \\cdot 60}'
        }
    ],
    calculationEngine: (inputs) => {
        const D = Number(inputs.diameter.value);
        const n = Number(inputs.rpm.value);

        // Vs = (pi * D * n) / (1000 * 60)  -> m/s
        // D in mm -> /1000 to m
        // n in rpm -> /60 to rps
        const Vs = (Math.PI * D * n) / (1000 * 60);

        return {
            outputs: {
                cuttingSpeed: createValidatedValue(Vs, 'm/s', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result) => {
            const Vs = result.outputs?.cuttingSpeed?.value as number || 0;

            // Spinning Wheel Animation (CSS override possible, or just imply motion)
            // User likes "Avant Garde". Let's verify rotation.

            return (
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#0a0e14]">
                    <svg viewBox="0 0 200 200" width="100%" height="100%" className="animate-[spin_4s_linear_infinite]">
                        {/* Wheel Body */}
                        <circle cx="100" cy="100" r="80" fill="#334155" stroke="#475569" strokeWidth="2" />
                        <circle cx="100" cy="100" r="30" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />

                        {/* Spokes / Texture for motion verify */}
                        <path d="M100,20 L100,180" stroke="#475569" strokeWidth="1" strokeDasharray="4,4" />
                        <path d="M20,100 L180,100" stroke="#475569" strokeWidth="1" strokeDasharray="4,4" />

                        {/* Spark effect (static for now) */}
                    </svg>

                    <div className="absolute bottom-4 right-4 text-right">
                        <div className="text-4xl font-bold text-[#00e5ff] font-mono leading-none drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
                            {Vs.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">m/s</div>
                    </div>
                </div>
            );
        }
    }
};

export default machiningGrindingSchema;
