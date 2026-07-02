import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const concreteBeamDesignSchema: CalculatorSchemaV2 = {
    id: 'concrete-beam-design',
    metadata: {
        title: 'Concrete Beam Design (ACI 318)',
        description: 'Bending capacity, reinforcement ratios, compression block, and limit checks for reinforced concrete rectangular beams.',
        category: 'civil',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['concrete beam', 'rebar', 'reinforcement ratio', 'bending capacity', 'compression block', 'civil engineering'],
        verifiedStandards: ['ACI 318-19', 'TS 500']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Tension-controlled design condition (steel yields first).', impact: 'high' },
            { id: 'a2', text: 'Whitney stress block for concrete compression stress distribution.', impact: 'medium' }
        ],
        standards: [
            { code: 'ACI 318-19', title: 'Building Code Requirements for Structural Concrete' },
            { code: 'TS 500', title: 'Requirements for Design and Construction of Reinforced Concrete Structures' }
        ],
        formulaLatex: 'a = \\frac{A_s \\cdot f_y}{0.85 \\cdot f\'_c \\cdot b} \\quad , \\quad M_n = A_s \\cdot f_y \\left(d - \\frac{a}{2}\\right) \\quad , \\quad \\phi M_n = 0.9 \\cdot M_n'
    },
    inputs: [
        { key: 'b', label: 'Beam Width (b)', unit: 'mm', defaultValue: 300, description: 'Width of the rectangular beam cross-section', validation: { required: true, min: 100, max: 2000 } },
        { key: 'h', label: 'Beam Height (h)', unit: 'mm', defaultValue: 500, description: 'Total depth/height of the beam', validation: { required: true, min: 150, max: 3000 } },
        { key: 'cc', label: 'Concrete Cover (cc)', unit: 'mm', defaultValue: 50, description: 'Distance from bottom fiber to centroid of steel bars', validation: { required: true, min: 20, max: 200 } },
        { key: 'As', label: 'Steel Area (As)', unit: 'mm2', defaultValue: 1200, description: 'Total area of longitudinal tension reinforcement', validation: { required: true, min: 50, max: 50000 } },
        { key: 'fc', label: 'Concrete Strength (f\'c)', unit: 'MPa', defaultValue: 30, description: 'Specified compressive strength of concrete cylinder', validation: { required: true, min: 15, max: 100 } },
        { key: 'fy', label: 'Steel Yield Strength (fy)', unit: 'MPa', defaultValue: 420, description: 'Specified yield strength of reinforcement bars', validation: { required: true, min: 220, max: 600 } },
        { key: 'Mu', label: 'Factored Load Moment (Mu)', unit: 'kNm', defaultValue: 180, description: 'Design bending moment from factored loads', validation: { required: true, min: 0, max: 10000 } }
    ],
    outputs: [
        { key: 'd', label: 'Effective Depth (d)', unit: 'mm', description: 'Distance from top compression fiber to centroid of steel', precision: 1, formulaLatex: 'd = h - cc' },
        { key: 'rho', label: 'Steel Ratio (ρ)', unit: '-', description: 'Ratio of tension reinforcement (As / bd)', precision: 4, formulaLatex: '\\rho = A_s / (b \\cdot d)' },
        { key: 'a', label: 'Whitney Block Depth (a)', unit: 'mm', description: 'Depth of equivalent rectangular stress block', precision: 1, formulaLatex: 'a = \\frac{A_s \\cdot f_y}{0.85 \\cdot f\'_c \\cdot b}' },
        { key: 'Mn', label: 'Nominal Capacity (Mn)', unit: 'kNm', description: 'Theoretical ultimate bending moment capacity', precision: 1, formulaLatex: 'M_n = A_s \\cdot f_y \\cdot (d - a/2) \\cdot 10^{-6}' },
        { key: 'phiMn', label: 'Design Capacity (φMn)', unit: 'kNm', description: 'Safe bending capacity with strength reduction factor φ=0.9', precision: 1, formulaLatex: '\\phi M_n = 0.9 \\cdot M_n' },
        { key: 'SF', label: 'Safety Index (φMn/Mu)', unit: '-', description: 'Ratio of design capacity to load moment', precision: 2, formulaLatex: '\\text{Safety Index} = \\phi M_n / M_u' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const b = Number(inputs.b.value);
        const h = Number(inputs.h.value);
        const cc = Number(inputs.cc.value);
        const As = Number(inputs.As.value);
        const fc = Number(inputs.fc.value);
        const fy = Number(inputs.fy.value);
        const Mu = Number(inputs.Mu.value);

        // 1. Effective depth
        const d = h - cc;

        // 2. Steel ratio
        const rho = As / (b * d);

        // 3. Compression block depth
        const a = (As * fy) / (0.85 * fc * b);

        // 4. Moment capacity
        const Mn = As * fy * (d - a / 2) * 1e-6; // convert N-mm to kN-m
        const phiMn = 0.9 * Mn; // φ = 0.9 for tension controlled bending

        const safetyIndex = Mu > 0 ? phiMn / Mu : 99.9;

        // Minimum reinforcement limits (ACI 318)
        const rhoMinLimit = Math.max(Math.sqrt(fc) / (4 * fy), 1.4 / fy);
        // Maximum reinforcement limit (simplified approximation for tension control)
        const rhoMaxLimit = 0.025; // typically ~2.5% for structural members

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (rho < rhoMinLimit) {
            warnings.push({
                field: 'As',
                message: `Reinforcement ratio (ρ = ${rho.toFixed(4)}) is below the minimum limit (ρ_min = ${rhoMinLimit.toFixed(4)}). Sudden brittle failure may occur upon concrete cracking.`,
                severity: 'critical'
            });
        }
        if (rho > rhoMaxLimit) {
            warnings.push({
                field: 'As',
                message: `Reinforcement ratio is very high (ρ = ${rho.toFixed(4)}). Risk of brittle concrete compression failure before steel yield. Use a larger beam section.`,
                severity: 'warning'
            });
        }
        if (phiMn < Mu) {
            warnings.push({
                field: 'Mu',
                message: `Factored bending load (Mu = ${Mu} kNm) exceeds design bending capacity (φMn = ${phiMn.toFixed(1)} kNm). The beam is structurally inadequate!`,
                severity: 'critical'
            });
        }

        return {
            outputs: {
                d: createValidatedValue(d, 'mm', 'derived'),
                rho: createValidatedValue(rho, '-', 'derived'),
                a: createValidatedValue(a, 'mm', 'derived'),
                Mn: createValidatedValue(Mn, 'kNm', 'derived'),
                phiMn: createValidatedValue(phiMn, 'kNm', 'derived'),
                SF: createValidatedValue(safetyIndex, '-', 'derived')
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
            const safety = (out.SF?.value as number) || 1.5;
            const isFailing = safety < 1.0;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Beam Cross Section SVG */}
                    <div className="relative w-[150px] h-[220px]">
                        <svg viewBox="0 0 120 180" width="100%" height="100%" className="overflow-visible">
                            {/* Concrete boundary */}
                            <rect x="20" y="10" width="80" height="150" fill="#334155" fillOpacity="0.4" stroke={isFailing ? '#ef4444' : '#64748b'} strokeWidth="3" rx="2" />
                            
                            {/* Rebar tension zone dots (bottom) */}
                            <circle cx="35" cy="140" r="5" fill="#f44336" />
                            <circle cx="60" cy="140" r="5" fill="#f44336" />
                            <circle cx="85" cy="140" r="5" fill="#f44336" />
                            <line x1="30" y1="140" x2="90" y2="140" stroke="#f44336" strokeWidth="2" />

                            {/* Hanger bar dots (top) */}
                            <circle cx="35" cy="30" r="3.5" fill="#94a3b8" />
                            <circle cx="85" cy="30" r="3.5" fill="#94a3b8" />
                            
                            {/* Shear stirrups outline link */}
                            <rect x="28" y="22" width="64" height="126" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeOpacity="0.8" />
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Capacity (φMn)</div>
                            <div className={`text-xl font-bold font-mono ${isFailing ? 'text-red-400' : 'text-emerald-400'}`}>
                                {((out.phiMn?.value as number) || 0).toFixed(1)} <span className="text-[10px] text-gray-500">kNm</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Steel Ratio (ρ)</div>
                            <div className="text-sm font-bold font-mono text-white">
                                {(((out.rho?.value as number) || 0) * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Adequacy</div>
                            <div className={`text-xs font-bold font-mono ${isFailing ? 'text-red-400' : 'text-emerald-400'}`}>
                                {isFailing ? 'INSUFFICIENT' : 'PASS'}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default concreteBeamDesignSchema;
