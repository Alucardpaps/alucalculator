import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const heatExchangerSchema: CalculatorSchemaV2 = {
    id: 'heat-exchanger',
    metadata: {
        title: 'Heat Exchanger Sizing (LMTD)',
        description: 'Heat transfer rate, Logarithmic Mean Temperature Difference (LMTD), and required heat transfer area for shell & tube or plate heat exchangers.',
        category: 'thermal',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['heat exchanger', 'LMTD', 'thermal area', 'convection', 'heat transfer', 'thermal engineering'],
        verifiedStandards: ['ASME Sec VIII Div 1', 'TEMA Standards']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'No ambient heat loss (perfect outer shell insulation).', impact: 'medium' },
            { id: 'a2', text: 'Constant specific heat and overall heat transfer coefficient.', impact: 'medium' }
        ],
        standards: [
            { code: 'ASME Sec VIII', title: 'Rules for Construction of Pressure Vessels' },
            { code: 'TEMA Standards', title: 'Standards of the Tubular Exchanger Manufacturers Association' }
        ],
        formulaLatex: 'Q = \\dot{m}_h C_{p,h} (T_{h,in} - T_{h,out}) \\quad , \\quad LMTD = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1 / \\Delta T_2)} \\quad , \\quad A = \\frac{Q}{U \\cdot LMTD}'
    },
    inputs: [
        { key: 'Thi', label: 'Hot Inlet Temp (Thi)', unit: '°C', defaultValue: 90, description: 'Inlet temperature of the hot fluid side', validation: { required: true, min: -50, max: 1000 } },
        { key: 'Tho', label: 'Hot Outlet Temp (Tho)', unit: '°C', defaultValue: 60, description: 'Outlet temperature of the hot fluid side', validation: { required: true, min: -50, max: 1000 } },
        { key: 'Tci', label: 'Cold Inlet Temp (Tci)', unit: '°C', defaultValue: 20, description: 'Inlet temperature of the cold fluid side', validation: { required: true, min: -50, max: 1000 } },
        { key: 'Tco', label: 'Cold Outlet Temp (Tco)', unit: '°C', defaultValue: 45, description: 'Outlet temperature of the cold fluid side', validation: { required: true, min: -50, max: 1000 } },
        { key: 'U', label: 'Heat Coeff (U)', unit: 'W/m²·K' as any, defaultValue: 800, description: 'Overall heat transfer coefficient (typically 200-1500 for water-oil, 800-4000 for water-water)', validation: { required: true, min: 1, max: 20000 } },
        { key: 'mh', label: 'Hot Mass Flow (mh)', unit: 'kg/s' as any, defaultValue: 1.5, description: 'Mass flow rate of the hot fluid side', validation: { required: true, min: 0.001, max: 1000 } },
        { key: 'Cph', label: 'Hot Specific Heat (Cph)', unit: 'J/kg·K' as any, defaultValue: 4182, description: 'Specific heat capacity of the hot fluid (e.g. 4182 for Water, ~2000 for Oil)', validation: { required: true, min: 500, max: 10000 } },
        {
            key: 'config',
            label: 'Flow Arrangement',
            unit: '-',
            defaultValue: 'counter',
            description: 'Direction of relative fluid flows',
            options: [
                { label: 'Counter-Current Flow (Recommended)', value: 'counter' },
                { label: 'Co-Current Parallel Flow', value: 'parallel' }
            ],
            validation: { required: true }
        }
    ],
    outputs: [
        { key: 'Q', label: 'Heat Flow (Q)', unit: 'kW', description: 'Thermal heat transfer power exchanged', precision: 1, formulaLatex: 'Q = \\dot{m}_h C_{p,h} (T_{h,in} - T_{h,out}) \\cdot 10^{-3}' },
        { key: 'dT1', label: 'ΔT1 Difference', unit: '°C', description: 'Temperature difference at inlet boundary', precision: 1, formulaLatex: '\\Delta T_1 = T_{h,in} - T_{c,out} \\text{ (Counter)}' },
        { key: 'dT2', label: 'ΔT2 Difference', unit: '°C', description: 'Temperature difference at outlet boundary', precision: 1, formulaLatex: '\\Delta T_2 = T_{h,out} - T_{c,in} \\text{ (Counter)}' },
        { key: 'lmtd', label: 'LMTD', unit: '°C', description: 'Logarithmic Mean Temperature Difference', precision: 2, formulaLatex: 'LMTD = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1 / \\Delta T_2)}' },
        { key: 'area', label: 'Required Area (A)', unit: 'm2', description: 'Required effective heat transfer surface area', precision: 2, formulaLatex: 'A = \\frac{Q \\cdot 10^3}{U \\cdot LMTD}' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const Thi = Number(inputs.Thi.value);
        const Tho = Number(inputs.Tho.value);
        const Tci = Number(inputs.Tci.value);
        const Tco = Number(inputs.Tco.value);
        const U = Number(inputs.U.value);
        const mh = Number(inputs.mh.value);
        const Cph = Number(inputs.Cph.value);
        const config = String(inputs.config.value);

        // 1. Heat transfer rate
        const Q_kW = (mh * Cph * (Thi - Tho)) / 1000;

        // 2. Temperature differences
        let dT1 = 0;
        let dT2 = 0;

        if (config === 'counter') {
            dT1 = Thi - Tco;
            dT2 = Tho - Tci;
        } else {
            dT1 = Thi - Tci;
            dT2 = Tho - Tco;
        }

        // Avoid division by zero or negative log terms
        let lmtd = 0;
        if (Math.abs(dT1 - dT2) < 0.1) {
            lmtd = (dT1 + dT2) / 2; // Arithmetic mean if differences match exactly
        } else if (dT1 > 0 && dT2 > 0) {
            lmtd = (dT1 - dT2) / Math.log(dT1 / dT2);
        }

        // 3. Required area in m²
        const area = lmtd > 0 ? (Q_kW * 1000) / (U * lmtd) : 0;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (Thi <= Tho) {
            warnings.push({
                field: 'Tho',
                message: 'Hot inlet temperature (Thi) must be strictly greater than hot outlet temperature (Tho).',
                severity: 'critical'
            });
        }
        if (Tco <= Tci) {
            warnings.push({
                field: 'Tco',
                message: 'Cold outlet temperature (Tco) must be strictly greater than cold inlet temperature (Tci).',
                severity: 'critical'
            });
        }
        if (dT1 <= 0 || dT2 <= 0) {
            warnings.push({
                field: 'config',
                message: 'Temperature crossover occurred. Outlet temperature exceeds inlet potential limits (second law of thermodynamics violation). Check temperature bounds.',
                severity: 'critical'
            });
        }

        return {
            outputs: {
                Q: createValidatedValue(Q_kW, 'kW', 'derived'),
                dT1: createValidatedValue(dT1, '°C', 'derived'),
                dT2: createValidatedValue(dT2, '°C', 'derived'),
                lmtd: createValidatedValue(lmtd, '°C', 'derived'),
                area: createValidatedValue(area, 'm2', 'derived')
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
            const area = (out.area?.value as number) || 5.0;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Temperature Profile SVG chart representation */}
                    <div className="relative w-[180px] h-[180px]">
                        <svg viewBox="0 0 160 160" width="100%" height="100%" className="overflow-visible">
                            {/* Axis Lines */}
                            <line x1="20" y1="20" x2="20" y2="140" stroke="#475569" strokeWidth="2" />
                            <line x1="20" y1="140" x2="140" y2="140" stroke="#475569" strokeWidth="2" />
                            
                            {/* Hot side curve (Falling from left to right) */}
                            <path d="M 25 35 Q 80 50 135 65" fill="none" stroke="#ef4444" strokeWidth="3" />
                            {/* Cold side curve (Rising from right to left - Counter flow) */}
                            <path d="M 25 80 Q 80 100 135 125" fill="none" stroke="#38bdf8" strokeWidth="3" />
                            
                            {/* Flow arrows */}
                            <line x1="75" y1="46" x2="85" y2="47" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow_thermal)" />
                            <line x1="85" y1="102" x2="75" y2="100" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow_thermal)" />
                            
                            <defs>
                                <marker id="arrow_thermal" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="currentColor" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Required Area</div>
                            <div className="text-xl font-bold font-mono text-[#00e5ff]">
                                {area.toFixed(2)} <span className="text-[10px] text-gray-500">m²</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">LMTD</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.lmtd?.value as number) || 0).toFixed(1)} <span className="text-[10px] text-gray-500">°C</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Heat rate</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">
                                {((out.Q?.value as number) || 0).toFixed(1)} <span className="text-[10px] text-gray-500">kW</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default heatExchangerSchema;
