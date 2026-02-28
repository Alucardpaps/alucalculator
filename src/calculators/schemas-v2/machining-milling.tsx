import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const machiningMillingSchema: CalculatorSchemaV2 = {
    id: 'machining-milling',
    metadata: {
        title: 'Milling Feeds & Speeds',
        description: 'Calculate Spindle RPM, Feed Rate, and Material Removal Rate (MRR).',
        category: 'fabrication',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['milling', 'cnc', 'machining', 'feeds', 'speeds', 'mrr'],
        verifiedStandards: ['Industry Standard']
    },
    documentation: {
        assumptions: [],
        standards: [],
        formulaLatex: 'N = Vc / (\\pi \\cdot D)'
    },
    inputs: [
        {
            key: 'cuttingSpeed',
            label: 'Cutting Speed (Vc)',
            unit: 'm/min' as any,
            defaultValue: 150,
            description: 'Surface speed of the cutting tool.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'diameter',
            label: 'Tool Diameter (D)',
            unit: 'mm',
            defaultValue: 10,
            description: 'Cutter diameter.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'teeth',
            label: 'Number of Teeth (Z)',
            unit: '-',
            defaultValue: 4,
            description: 'Flutes on the endmill.',
            validation: { required: true, min: 1, step: 1 }
        },
        {
            key: 'feedPerTooth',
            label: 'Feed per Tooth (fz)',
            unit: 'mm/tooth' as any,
            defaultValue: 0.05,
            description: 'Chip load per flute.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'radialDepth',
            label: 'Radial Depth (ae)',
            unit: 'mm',
            defaultValue: 5,
            description: 'Width of cut.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'axialDepth',
            label: 'Axial Depth (ap)',
            unit: 'mm',
            defaultValue: 10,
            description: 'Depth of cut.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'specificCuttingForce',
            label: 'Specific Cutting Force (kc)',
            unit: 'MPa',
            defaultValue: 1500,
            description: 'Material resistance (Al~700, Steel~2000)',
            validation: { required: true, min: 100 }
        }
    ],

    outputs: [
        {
            key: 'spindleSpeed',
            label: 'Spindle Speed (N)',
            unit: 'RPM' as any,
            formulaLatex: 'N = \\frac{V_c \\cdot 1000}{\\pi \\cdot D}',
            description: 'Rotational speed of the spindle.',
            precision: 0
        },
        {
            key: 'feedRate',
            label: 'Feed Rate (Vf)',
            unit: 'mm/min' as any,
            formulaLatex: 'V_f = f_z \\cdot Z \\cdot N',
            description: 'Machine table feed velocity.',
            precision: 0
        },
        {
            key: 'mrr',
            label: 'Material Removal Rate',
            unit: 'cm³/min' as any,
            formulaLatex: 'MRR = \\frac{a_e \\cdot a_p \\cdot V_f}{1000}',
            description: 'Volume of material removed per minute.',
            precision: 2
        },
        {
            key: 'spindlePower',
            label: 'Spindle Power (Pc)',
            unit: 'kW' as any,
            formulaLatex: 'P_c = \\frac{MRR \\cdot k_c}{60 \\times 10^3}',
            description: 'Required machining power.',
            precision: 2
        },
        {
            key: 'torque',
            label: 'Spindle Torque (Mc)',
            unit: 'Nm' as any,
            formulaLatex: 'M_c = \\frac{P_c \\cdot 9550}{N}',
            description: 'Cutting torque on spindle.',
            precision: 2
        }
    ],

    calculationEngine: (inputs) => {
        const Vc = Number(inputs.cuttingSpeed.value);
        const D = Number(inputs.diameter.value);
        const Z = Number(inputs.teeth.value);
        const fz = Number(inputs.feedPerTooth.value);
        const ae = Number(inputs.radialDepth.value);
        const ap = Number(inputs.axialDepth.value);
        const kc = Number(inputs.specificCuttingForce.value);

        const N = Math.round((Vc * 1000) / (Math.PI * D));
        const Vf = Math.round(fz * Z * N);
        const MRR = (ae * ap * Vf) / 1000; // cm^3/min

        // Pc in kW = (ap * ae * Vf * kc) / (60 * 10^6)
        const Pc = (ap * ae * Vf * kc) / 60000000;
        const Mc = N > 0 ? (Pc * 9550) / N : 0;

        return {
            outputs: {
                spindleSpeed: createValidatedValue(N, 'RPM' as any, 'derived'),
                feedRate: createValidatedValue(Vf, 'mm/min' as any, 'derived'),
                mrr: createValidatedValue(MRR, 'cm³/min' as any, 'derived'),
                spindlePower: createValidatedValue(Pc, 'kW' as any, 'derived'),
                torque: createValidatedValue(Mc, 'Nm' as any, 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            const D = inputs?.diameter || 10;
            const ae = inputs?.radialDepth || 5;
            const N = result.outputs?.spindleSpeed?.value as number || 0;

            const cutterX = 100;
            const cutterY = 100;
            const R = (D as number) * 3;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#0a0e14]">
                    <svg viewBox="0 0 200 200" width="100%" height="100%">
                        <rect x="0" y="0" width="100" height="200" fill="#1e293b" />
                        <rect x="0" y="0" width="100" height="200" fill="url(#metalPattern)" opacity="0.3" />

                        <rect x={100 - (ae as number) * 6} y="0" width={(ae as number) * 6} height="100" fill="#0f172a" />

                        <g className="animate-[spin_2s_linear_infinite]" style={{ transformOrigin: '100px 100px' }}>
                            <circle cx={cutterX} cy={cutterY} r={R} fill="#00e5ff" fillOpacity="0.2" stroke="#00e5ff" strokeWidth="2" />
                            <path d={`M${cutterX},${cutterY - R} L${cutterX},${cutterY + R}`} stroke="#00e5ff" strokeWidth="1" />
                            <path d={`M${cutterX - R},${cutterY} L${cutterX + R},${cutterY}`} stroke="#00e5ff" strokeWidth="1" />
                        </g>

                        <path d="M100,160 L100,130" stroke="#f59e0b" strokeWidth="4" markerEnd="url(#arrow)" />
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                            </marker>
                            <pattern id="metalPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <line stroke="#ffffff" strokeWidth="1" opacity="0.1" x1="0" y1="0" x2="0" y2="10" />
                            </pattern>
                        </defs>
                    </svg>
                    <div className="absolute top-4 left-4 text-left">
                        <div className="text-xl font-bold text-[#00e5ff] font-mono leading-none drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
                            {N.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">RPM</div>

                        {result.outputs?.spindlePower && (
                            <div className="mt-4">
                                <div className="text-lg font-bold text-[#f59e0b] font-mono leading-none drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    {Number(result.outputs.spindlePower.value).toFixed(2)}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">kW Power</div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default machiningMillingSchema;
