import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const bearingsSchema: CalculatorSchemaV2 = {
    id: 'bearings',
    metadata: {
        title: 'Bearings (SKF/ISO)',
        description: 'Static & dynamic load ratings for deep groove ball bearings (L10h life).',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['bearings', 'skf', 'life', 'l10', 'l10h', 'machine elements'],
        verifiedStandards: ['ISO 281:2007', 'SKF General Catalogue']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Constant speed and constant load.', impact: 'high' },
            { id: 'a2', text: 'Reliability of 90% (L10 life).', impact: 'high' },
            { id: 'a3', text: 'Deep groove ball bearings (exponent p = 3).', impact: 'medium' }
        ],
        standards: [
            { code: 'ISO 281', title: 'Rolling bearings — Dynamic load ratings and rating life' }
        ],
        formulaLatex: 'L_{10} = \\left( \\frac{C}{P} \\right)^p \\quad , \\quad L_{10h} = \\frac{10^6}{60 n} L_{10}'
    },
    inputs: [
        { key: 'Fr', label: 'Radial Load (Fr)', unit: 'N', defaultValue: 3000, description: 'Applied radial load', validation: { required: true, min: 0 } },
        { key: 'Fa', label: 'Axial Load (Fa)', unit: 'N', defaultValue: 500, description: 'Applied axial (thrust) load', validation: { required: true, min: 0 } },
        { key: 'rpm', label: 'Speed (n)', unit: 'RPM' as any, defaultValue: 1500, description: 'Rotational speed of the bearing', validation: { required: true, min: 10 } },
        { key: 'C', label: 'Dynamic Load Rating (C)', unit: 'N', defaultValue: 14000, description: 'Basic dynamic load rating (C) from bearing catalogue', validation: { required: true, min: 100 } },
        { key: 'C0', label: 'Static Load Rating (C0)', unit: 'N', defaultValue: 7800, description: 'Basic static load rating (C0) from bearing catalogue', validation: { required: true, min: 100 } },
        { key: 'bearingType', label: 'Bearing Type', unit: '-', defaultValue: 0, description: '0: Ball Bearing (p=3), 1: Roller Bearing (p=10/3)', validation: { required: true, min: 0, max: 1 } }
    ],
    outputs: [
        { key: 'Pe', label: 'Equivalent Load (P)', unit: 'N', description: 'Equivalent dynamic bearing load', precision: 1, formulaLatex: 'P = X \\cdot F_r + Y \\cdot F_a' },
        { key: 'L10', label: 'L10 Life', unit: 'Mrevs' as any, description: 'Basic rating life in millions of revolutions', precision: 2, formulaLatex: 'L_{10} = (C/P)^p' },
        { key: 'L10h', label: 'L10h Life', unit: 'hours', description: 'Basic rating life in operating hours', precision: 0, formulaLatex: 'L_{10h} = \\frac{10^6}{60 n} L_{10}' }
    ],
    calculationEngine: (inputs: any) => {
        const Fr = Number(inputs.Fr.value);
        const Fa = Number(inputs.Fa.value);
        const rpm = Number(inputs.rpm.value);
        const C = Number(inputs.C.value);
        const C0 = Number(inputs.C0.value);
        const bType = Number(inputs.bearingType.value); // 0 = Ball, 1 = Roller

        const p = bType === 0 ? 3.0 : (10.0 / 3.0);

        // 1. Determine Equivalent Dynamic Load (P)
        // Simplified ISO method for Deep Groove Ball Bearings
        // In a real generic app, exact e, X, Y depends on Fa/C0. We approximate typical values.
        let P = Fr;
        const Fa_C0 = Fa / C0;

        let e = 0.22; // Typical starting value
        // Rough interpolation for e based on Fa/C0
        if (Fa_C0 > 0.5) e = 0.44;
        else if (Fa_C0 > 0.25) e = 0.37;
        else if (Fa_C0 > 0.13) e = 0.31;
        else if (Fa_C0 > 0.084) e = 0.28;
        else if (Fa_C0 > 0.056) e = 0.26;
        else if (Fa_C0 > 0.028) e = 0.22;
        else e = 0.19;

        let X = 1.0;
        let Y = 0.0;

        if ((Fa / Fr) > e) {
            X = 0.56;
            // Rough Y interpolation
            if (Fa_C0 > 0.5) Y = 1.0;
            else if (Fa_C0 > 0.25) Y = 1.2;
            else if (Fa_C0 > 0.13) Y = 1.4;
            else if (Fa_C0 > 0.084) Y = 1.55;
            else if (Fa_C0 > 0.056) Y = 1.71;
            else if (Fa_C0 > 0.028) Y = 1.99;
            else Y = 2.3;
        }

        P = X * Fr + Y * Fa;

        // Ensure P is at least Fr
        if (P < Fr) P = Fr;

        // 2. Calculate L10 Life
        let L10 = 0;
        if (P > 0) {
            L10 = Math.pow(C / P, p);
        }

        // 3. Calculate L10h Life
        const L10h = (1000000 / (60 * rpm)) * L10;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];
        if (P > C) {
            warnings.push({ field: 'Pe', message: 'Equivalent load exceeds Dynamic Load Rating (P > C). Bearing will fail rapidly.', severity: 'critical' });
        }
        if (L10h < 1000) {
            warnings.push({ field: 'L10h', message: 'Computed life is very low (< 1000 hours). Consider a larger bearing.', severity: 'warning' });
        }

        return {
            outputs: {
                Pe: createValidatedValue(P, 'N', 'derived'),
                L10: createValidatedValue(L10, 'Mrevs' as any, 'derived'),
                L10h: createValidatedValue(L10h, 'hours', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any) => {
            const out = result.outputs || {};
            const L10h = (out.L10h?.value as number) || 0;
            const P = (out.Pe?.value as number) || 1000;

            // Log scale visualizing life
            const safeThreshold = 10000; // 10k hours is often considered a standard
            let fillWidth = (L10h / (safeThreshold * 2)) * 100;
            if (fillWidth > 100) fillWidth = 100;

            const isFailing = L10h < 1000;
            const color = isFailing ? '#ef4444' : (L10h > 10000 ? '#10b981' : '#eab308');

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#05080b]">
                    {/* Bearing Icon */}
                    <div className="relative w-[150px] h-[150px] mb-8">
                        <svg viewBox="0 0 100 100" width="100%" height="100%" className="animate-[spin_4s_linear_infinite]">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="6" />
                            <circle cx="50" cy="50" r="25" fill="none" stroke="#334155" strokeWidth="6" />
                            {/* Balls */}
                            {Array.from({ length: 8 }).map((_, i) => {
                                const angle = (i * 360 / 8) * (Math.PI / 180);
                                const x = 50 + 35 * Math.cos(angle);
                                const y = 50 + 35 * Math.sin(angle);
                                return <circle key={i} cx={x} cy={y} r="8" fill="#64748b" />;
                            })}
                        </svg>

                        {/* Static Load Vectors overlay (not spinning) */}
                        <div className="absolute inset-0 z-10">
                            <svg viewBox="0 0 100 100" width="100%" height="100%">
                                {/* Fr Vector */}
                                <line x1="50" y1="5" x2="50" y2="20" stroke="#00e5ff" strokeWidth="3" markerEnd="url(#arrow)" />
                                {/* Fa Vector */}
                                <line x1="100" y1="50" x2="85" y2="50" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#arrow)" />

                                <defs>
                                    <marker id="arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                        <polygon points="0 0, 6 2, 0 4" fill="currentColor" />
                                    </marker>
                                </defs>
                            </svg>
                        </div>
                    </div>

                    {/* Life Display Bar */}
                    <div className="w-full max-w-sm">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">L10h Life</span>
                            <span className={`text-2xl font-black font-mono`} style={{ color }}>
                                {L10h >= 1000000 ? '>1M' : Math.round(L10h).toLocaleString()} <span className="text-xs text-gray-500">hrs</span>
                            </span>
                        </div>
                        <div className="h-4 bg-[#1a1f26] rounded-full overflow-hidden relative">
                            <div
                                className="absolute top-0 left-0 bottom-0 transition-all duration-1000 ease-out"
                                style={{ width: `${fillWidth}%`, backgroundColor: color }}
                            />
                            {/* Marker line for 10k hours typical target */}
                            <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-black/50" />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
                            <span>0</span>
                            <span>10,000 (Target)</span>
                            <span>20,000+</span>
                        </div>
                    </div>

                    <div className="mt-6 text-[11px] text-gray-400">Equivalent Load (P): <span className="text-white font-mono">{Math.round(P)} N</span></div>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default bearingsSchema;
