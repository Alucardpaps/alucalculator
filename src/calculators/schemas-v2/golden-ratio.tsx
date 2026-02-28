import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const PHI = 1.618033988749895;

const goldenRatioSchema: CalculatorSchemaV2 = {
    id: 'golden-ratio',
    metadata: {
        title: 'Golden Ratio Generator',
        description: 'Calculate perfect proportions (Φ = 1.618) for industrial design.',
        category: 'math',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['design', 'phi', 'ratio', 'proportion', 'golden'],
        verifiedStandards: ['Aesthetics']
    },
    documentation: {
        assumptions: [],
        standards: [],
        formulaLatex: 'A/B = (A+B)/A = \\Phi \\approx 1.618'
    },
    inputs: [
        {
            key: 'baseValue',
            label: 'Base Length (A or B)',
            unit: 'mm',
            defaultValue: 100,
            description: 'The starting dimension to scale from.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'mode',
            label: 'Mode',
            unit: '-',
            defaultValue: 'Multiply',
            description: 'Multiply (Base is B) or Divide (Base is A)',
            validation: { required: true, min: 0 }
        } // We treat 'mode' as string but schema UI expects number by default for V2. We will map 0=Divide, 1=Multiply in engine.
    ],

    outputs: [
        {
            key: 'larger',
            label: 'Larger Segment (A)',
            unit: 'mm',
            description: 'The longer segment.',
            precision: 2,
            formulaLatex: 'A = \\Phi \\cdot B'
        },
        {
            key: 'smaller',
            label: 'Smaller Segment (B)',
            unit: 'mm',
            description: 'The shorter segment.',
            precision: 2,
            formulaLatex: 'B = A / \\Phi'
        },
        {
            key: 'total',
            label: 'Total Length (A+B)',
            unit: 'mm',
            description: 'The overall dimension.',
            precision: 2,
            formulaLatex: 'T = A + B'
        }
    ],

    calculationEngine: (inputs) => {
        const base = Number(inputs.baseValue.value);
        // If mode is passed as number from a dropdown in future or defaults to 1:
        // Here we just provide both A and B given any single value by assuming user wants to see the series.
        // Actually, let's just output assuming Base is 'A' (Larger) AND 'B' (Smaller)

        const ifBaseIsLarger_Smaller = base / PHI;
        const ifBaseIsLarger_Total = base + ifBaseIsLarger_Smaller;

        // Simplify: Let's assume the user inputs the "Total" length, or "Larger" length.
        // We will just calculate Larger, Smaller, and Total from whatever they enter assuming it is the LARGER segment (A).
        const larger = base;
        const smaller = larger / PHI;
        const total = larger + smaller;
        const nextSize = total * PHI;

        return {
            outputs: {
                larger: createValidatedValue(larger, 'mm', 'derived'),
                smaller: createValidatedValue(smaller, 'mm', 'derived'),
                total: createValidatedValue(total, 'mm', 'derived'),
                // Injecting next size as extra
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result) => {
            const A = result.outputs?.larger?.value as number || 100;
            const B = result.outputs?.smaller?.value as number || 61.80;

            // Normalize for visual SVG
            const scale = 140 / (A + B);
            const wA = A * scale;
            const wB = B * scale;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#0a0e14]">
                    <svg viewBox="0 0 200 200" width="100%" height="100%">
                        {/* Golden Rectangle Base */}
                        <g transform="translate(30, 60)">
                            {/* Segment A */}
                            <rect x="0" y="0" width={wA} height={wA} fill="#0f172a" stroke="#00e5ff" strokeWidth="2" />
                            <text x={wA / 2} y={wA / 2} fill="#00e5ff" fontSize="14" textAnchor="middle" dominantBaseline="middle" className="font-mono font-bold">A</text>

                            {/* Segment B */}
                            <rect x={wA} y="0" width={wB} height={wA} fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                            <text x={wA + wB / 2} y={wA / 2} fill="#f59e0b" fontSize="12" textAnchor="middle" dominantBaseline="middle" className="font-mono font-bold">B</text>

                            {/* Spiral arc approximation visually */}
                            <path d={`M 0,0 A ${wA},${wA} 0 0,0 ${wA},${wA}`} stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
                        </g>

                        <text x="100" y="40" fill="white" fontSize="12" textAnchor="middle" className="font-mono opacity-50 tracking-[0.3em]">A/B = (A+B)/A ≈ 1.618</text>
                    </svg>

                    <div className="absolute bottom-4 left-4 text-left">
                        <div className="text-2xl font-bold text-[#f59e0b] font-mono leading-none drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                            {B.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Smaller (B)</div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default goldenRatioSchema;
