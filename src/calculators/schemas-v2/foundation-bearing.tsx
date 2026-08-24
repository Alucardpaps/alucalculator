import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const foundationBearingSchema: CalculatorSchemaV2 = {
    id: 'foundation-bearing',
    metadata: {
        title: 'Foundation Bearing Capacity',
        description: 'Meyerhof & Terzaghi geotechnical formulas for ultimate and allowable bearing capacity of shallow foundations.',
        category: 'civil',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['foundation', 'bearing capacity', 'meyerhof', 'terzaghi', 'geotechnical', 'civil engineering'],
        verifiedStandards: ['Eurocode 7', 'AASHTO LRFD']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Shallow strip or rectangular foundation under vertical concentric load.', impact: 'high' },
            { id: 'a2', text: 'Water table is located deep below the foundation level.', impact: 'medium' }
        ],
        standards: [
            { code: 'Eurocode 7', title: 'Geotechnical design - Part 1: General rules' },
            { code: 'AASHTO LRFD', title: 'Bridge Design Specifications, Section 10' }
        ],
        formulaLatex: 'q_{ult} = c \\cdot N_c \\cdot s_c + q \\cdot N_q \\cdot s_q + 0.5 \\cdot \\gamma \\cdot B \\cdot N_\\gamma \\cdot s_\\gamma \\quad , \\quad q_{all} = \\frac{q_{ult}}{FS}'
    },
    inputs: [
        { key: 'B', label: 'Foundation Width (B)', unit: 'm', defaultValue: 2.0, description: 'Shorter plan dimension of the footing', validation: { required: true, min: 0.5, max: 50 } },
        { key: 'L', label: 'Foundation Length (L)', unit: 'm', defaultValue: 3.0, description: 'Longer plan dimension of the footing', validation: { required: true, min: 0.5, max: 200 } },
        { key: 'Df', label: 'Embedment Depth (Df)', unit: 'm', defaultValue: 1.5, description: 'Depth of footing base below ground level', validation: { required: true, min: 0.0, max: 50 } },
        { key: 'c', label: 'Soil Cohesion (c)', unit: 'kPa' as any, defaultValue: 20, description: 'Undrained shear strength or cohesion intercept', validation: { required: true, min: 0, max: 1000 } },
        { key: 'phi', label: 'Internal Friction Angle (φ)', unit: 'deg', defaultValue: 28, description: 'Angle of shearing resistance of the soil', validation: { required: true, min: 0, max: 50 } },
        { key: 'gamma', label: 'Soil Unit Weight (γ)', unit: 'kN/m3' as any, defaultValue: 18.5, description: 'Bulk density/unit weight of the soil', validation: { required: true, min: 10, max: 30 } },
        { key: 'FS', label: 'Safety Factor (FS)', unit: '-', defaultValue: 3.0, description: 'Safety factor for allowable capacity (typically 3.0)', validation: { required: true, min: 1.5, max: 10 } }
    ],
    outputs: [
        { key: 'Nc', label: 'Nc Cohesion Factor', unit: '-', description: 'Bearing capacity factor for soil cohesion', precision: 2, formulaLatex: 'N_c = (N_q - 1) \\cot \\phi' },
        { key: 'Nq', label: 'Nq Surcharge Factor', unit: '-', description: 'Bearing capacity factor for embedment depth', precision: 2, formulaLatex: 'N_q = e^{\\pi \\tan \\phi} \\tan^2(45 + \\phi/2)' },
        { key: 'Ng', label: 'Nγ Unit Weight Factor', unit: '-', description: 'Bearing capacity factor for soil weight', precision: 2, formulaLatex: 'N_\\gamma = 2(N_q + 1)\\tan \\phi' },
        { key: 'q', label: 'Overburden Surcharge (q)', unit: 'kPa' as any, description: 'Effective stress at footing base level', precision: 1, formulaLatex: 'q = \\gamma \\cdot D_f' },
        { key: 'qult', label: 'Ultimate Bearing (qult)', unit: 'kPa' as any, description: 'Peak bearing stress causing shear failure in soil', precision: 1, formulaLatex: 'q_{ult} = c N_c s_c + q N_q s_q + 0.5 \\gamma B N_\\gamma s_\\gamma' },
        { key: 'qall', label: 'Allowable Bearing (qall)', unit: 'kPa' as any, description: 'Safe working bearing capacity with FS applied', precision: 1, formulaLatex: 'q_{all} = q_{ult} / FS' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const B = Number(inputs.B.value);
        const L = Number(inputs.L.value);
        const Df = Number(inputs.Df.value);
        const c = Number(inputs.c.value);
        const phiDeg = Number(inputs.phi.value);
        const gamma = Number(inputs.gamma.value);
        const FS = Number(inputs.FS.value);

        const phiRad = (phiDeg * Math.PI) / 180;

        // 1. Calculate Nq
        let Nq = 1.0;
        let Nc = 5.14;
        let Ng = 0.0;

        if (phiDeg > 0) {
            Nq = Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
            Nc = (Nq - 1) / Math.tan(phiRad);
            Ng = 2 * (Nq + 1) * Math.tan(phiRad); // Meyerhof version
        }

        // 2. Overburden pressure
        const q = gamma * Df;

        // 3. Shape Factors (Meyerhof)
        let sc = 1.0;
        let sq = 1.0;
        let sg = 1.0;
        if (L > 0 && B <= L) {
            sc = 1 + 0.2 * (B / L);
            if (phiDeg > 10) {
                sq = 1 + 0.1 * (B / L) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
                sg = sq;
            }
        }

        // 4. Ultimate Bearing Capacity
        const qult = c * Nc * sc + q * Nq * sq + 0.5 * gamma * B * Ng * sg;
        const qall = qult / FS;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (B > L) {
            warnings.push({
                field: 'B',
                message: 'Footing width (B) should be less than or equal to its length (L). Swap input parameters.',
                severity: 'warning'
            });
        }
        if (phiDeg < 15 && c < 5) {
            warnings.push({
                field: 'phi',
                message: 'Very weak soil shear parameters. Risk of excessive settlement or shear failure. Deep foundation (piles) recommended.',
                severity: 'critical'
            });
        }

        return {
            outputs: {
                Nc: createValidatedValue(Nc, '-', 'derived'),
                Nq: createValidatedValue(Nq, '-', 'derived'),
                Ng: createValidatedValue(Ng, '-', 'derived'),
                q: createValidatedValue(q, 'kPa' as any, 'derived'),
                qult: createValidatedValue(qult, 'kPa' as any, 'derived'),
                qall: createValidatedValue(qall, 'kPa' as any, 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: any) => {
            const out = result.outputs || {};
            const qall = (out.qall?.value as number) || 150;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Geotechnical Section SVG */}
                    <div className="relative w-[180px] h-[200px]">
                        <svg viewBox="0 0 180 200" width="100%" height="100%" className="overflow-visible">
                            {/* Ground Line */}
                            <line x1="10" y1="60" x2="170" y2="60" stroke="#854d0e" strokeWidth="3" />
                            
                            {/* Soil Hatching under footing */}
                            <path d="M 10 60 L 10 180 L 170 180 L 170 60 Z" fill="#854d0e" fillOpacity="0.15" />
                            
                            {/* Footing Structure */}
                            <rect x="50" y="60" width="80" height="60" fill="#334155" stroke="#475569" strokeWidth="2" />
                            <rect x="30" y="120" width="120" height="20" fill="#475569" stroke="#64748b" strokeWidth="2" />
                            <circle cx="90" cy="130" r="4" fill="#00e5ff" />

                            {/* Bearing Stress Arrows */}
                            <line x1="40" y1="145" x2="40" y2="165" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow_soil)" />
                            <line x1="70" y1="145" x2="70" y2="165" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow_soil)" />
                            <line x1="100" y1="145" x2="100" y2="165" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow_soil)" />
                            <line x1="130" y1="145" x2="130" y2="165" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow_soil)" />
                            
                            {/* Soil Failure Shear lines (wedges representation) */}
                            <path d="M 30 140 Q 5 160 30 180 Q 90 190 150 180 Q 175 160 150 140" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.6" />

                            <defs>
                                <marker id="arrow_soil" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="6 0, 0 2, 6 4" fill="#f59e0b" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Allowable q</div>
                            <div className="text-xl font-bold font-mono text-[#00e5ff]">
                                {qall.toFixed(0)} <span className="text-[10px] text-gray-500">kPa</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Ultimate q</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.qult?.value as number) || 0).toFixed(0)} <span className="text-[10px] text-gray-500">kPa</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Safety Factor</div>
                            <div className="text-sm font-bold font-mono text-emerald-400">
                                {((inputs.FS?.value as number) || 3).toFixed(1)}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default foundationBearingSchema;
