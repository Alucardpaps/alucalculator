import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const transformerDesignSchema: CalculatorSchemaV2 = {
    id: 'transformer-design',
    metadata: {
        title: 'Transformer Design',
        description: 'Turns count, core area, currents, and winding specification for single-phase shell or core type transformers.',
        category: 'electrical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['transformer', 'turns count', 'core area', 'flux density', 'windings', 'electrical engineering'],
        verifiedStandards: ['IEC 60076', 'IEEE Std C57.12.00']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Single-phase transformer operation.', impact: 'high' },
            { id: 'a2', text: 'Iron core is operating below saturation region.', impact: 'high' },
            { id: 'a3', text: '3% winding resistance voltage drop compensation added to secondary turns.', impact: 'medium' }
        ],
        standards: [
            { code: 'IEC 60076', title: 'Power transformers - All parts' },
            { code: 'IEEE Std C57.12.00', title: 'Standard for General Requirements for Liquid-Immersed Distribution, Power, and Regulating Transformers' }
        ],
        formulaLatex: 'A_c = 1.15 \\sqrt{S} \\quad , \\quad N_1 = \\frac{V_1 \\cdot 10^4}{4.44 \\cdot f \\cdot B_m \\cdot A_c} \\quad , \\quad N_2 = N_1 \\frac{V_2 \\cdot 1.03}{V_1}'
    },
    inputs: [
        { key: 'V1', label: 'Primary Voltage (V1)', unit: 'V', defaultValue: 230, description: 'Input nominal primary voltage', validation: { required: true, min: 1, max: 100000 } },
        { key: 'V2', label: 'Secondary Voltage (V2)', unit: 'V', defaultValue: 24, description: 'Output secondary voltage', validation: { required: true, min: 1, max: 100000 } },
        { key: 'I2', label: 'Secondary Current (I2)', unit: 'A', defaultValue: 10, description: 'Nominal output secondary load current', validation: { required: true, min: 0.1, max: 5000 } },
        { key: 'f', label: 'Frequency (f)', unit: 'Hz' as any, defaultValue: 50, description: 'AC power system frequency (e.g., 50 Hz or 60 Hz)', validation: { required: true, min: 25, max: 400 } },
        { key: 'Bm', label: 'Flux Density (Bm)', unit: 'T' as any, defaultValue: 1.2, description: 'Peak magnetic flux density in core (usually 1.0 to 1.6 Tesla for silicon steel)', validation: { required: true, min: 0.2, max: 2.0 } }
    ],
    outputs: [
        { key: 'S', label: 'Apparent Power (S)', unit: 'VA' as any, description: 'Transformer nominal apparent rating', precision: 1, formulaLatex: 'S = V_2 \\cdot I_2' },
        { key: 'Ac', label: 'Core Area (Ac)', unit: 'cm2', description: 'Required iron core cross-sectional area', precision: 2, formulaLatex: 'A_c = 1.15 \\cdot \\sqrt{S}' },
        { key: 'N1', label: 'Primary Turns (N1)', unit: '-', description: 'Total turns required for primary winding', precision: 0, formulaLatex: 'N_1 = \\frac{V_1 \\cdot 10^4}{4.44 \\cdot f \\cdot B_m \\cdot A_c}' },
        { key: 'N2', label: 'Secondary Turns (N2)', unit: '-', description: 'Turns required for secondary winding (with 3% copper compensation)', precision: 0, formulaLatex: 'N_2 = 1.03 \\cdot N_1 \\cdot (V_2 / V1)' },
        { key: 'Tpv', label: 'Turns per Volt', unit: 'turns/V' as any, description: 'Voltage winding density ratio', precision: 3, formulaLatex: 'T_{pv} = N_1 / V_1' },
        { key: 'I1', label: 'Primary Current (I1)', unit: 'A', description: 'Primary winding line current at full load', precision: 2, formulaLatex: 'I_1 = S / V_1' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const V1 = Number(inputs.V1.value);
        const V2 = Number(inputs.V2.value);
        const I2 = Number(inputs.I2.value);
        const f = Number(inputs.f.value);
        const Bm = Number(inputs.Bm.value);

        // 1. Apparent Power
        const S = V2 * I2;

        // 2. Core Area (Ac) in cm²
        // Empirical rule: Ac = 1.15 * sqrt(S)
        const Ac = 1.15 * Math.sqrt(S);

        // 3. Primary turns
        // E = 4.44 * f * Bm * Ac * N1 * 10^-4  --> V1 = 4.44 * f * Bm * Ac * N1 / 10000
        const N1 = (V1 * 10000) / (4.44 * f * Bm * Ac);

        // 4. Secondary turns (compensated for 3% copper loss)
        const N2 = 1.03 * N1 * (V2 / V1);

        const Tpv = N1 / V1;
        const I1 = S / V1;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (Bm > 1.6) {
            warnings.push({
                field: 'Bm',
                message: `Flux density is very high (${Bm} T). Silicon steel core may saturate, causing high core losses, heating, and harmonics. Consider lowering below 1.4 T.`,
                severity: 'warning'
            });
        }
        if (S > 50000) {
            warnings.push({
                field: 'I2',
                message: `This simple empirical model is designed for small transformers (< 50 kVA). For high-power distribution transformers, advanced structural cooling and impedance models are required.`,
                severity: 'warning'
            });
        }

        return {
            outputs: {
                S: createValidatedValue(S, 'VA' as any, 'derived'),
                Ac: createValidatedValue(Ac, 'cm2', 'derived'),
                N1: createValidatedValue(Math.round(N1), '-', 'derived'),
                N2: createValidatedValue(Math.round(N2), '-', 'derived'),
                Tpv: createValidatedValue(Tpv, 'turns/V' as any, 'derived'),
                I1: createValidatedValue(I1, 'A', 'derived')
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
            const N1 = (out.N1?.value as number) || 400;
            const N2 = (out.N2?.value as number) || 40;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Transformer Bobbin SVG */}
                    <div className="relative w-[180px] h-[180px]">
                        <svg viewBox="0 0 180 180" width="100%" height="100%" className="overflow-visible">
                            {/* Iron Core Outer Frame */}
                            <rect x="25" y="25" width="130" height="130" fill="none" stroke="#475569" strokeWidth="16" rx="4" />
                            {/* Iron Core Central Limb */}
                            <line x1="90" y1="25" x2="90" y2="155" stroke="#475569" strokeWidth="24" />
                            
                            {/* Primary Winding (Left) */}
                            <rect x="50" y="45" width="24" height="90" fill="#b45309" stroke="#d97706" strokeWidth="1.5" rx="2" fillOpacity="0.8" />
                            <text x="62" y="93" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 62 93)">PRI</text>

                            {/* Secondary Winding (Right) */}
                            <rect x="106" y="45" width="24" height="90" fill="#b45309" stroke="#d97706" strokeWidth="1.5" rx="2" fillOpacity="0.8" />
                            <text x="118" y="93" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 118 93)">SEC</text>
                            
                            {/* Connection Leads */}
                            <path d="M 40 60 L 50 60" stroke="#f59e0b" strokeWidth="2.5" />
                            <path d="M 40 120 L 50 120" stroke="#f59e0b" strokeWidth="2.5" />
                            <path d="M 130 60 L 140 60" stroke="#f59e0b" strokeWidth="2.5" />
                            <path d="M 130 120 L 140 120" stroke="#f59e0b" strokeWidth="2.5" />
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Primary Winding</div>
                            <div className="text-lg font-bold font-mono text-white">
                                {Math.round(N1)} <span className="text-[10px] text-gray-500">turns</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Secondary Winding</div>
                            <div className="text-lg font-bold font-mono text-white">
                                {Math.round(N2)} <span className="text-[10px] text-gray-500">turns</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Apparent S</div>
                            <div className="text-xl font-bold font-mono text-[#00e5ff]">
                                {((out.S?.value as number) || 0).toFixed(0)} <span className="text-[10px] text-gray-500">VA</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default transformerDesignSchema;
