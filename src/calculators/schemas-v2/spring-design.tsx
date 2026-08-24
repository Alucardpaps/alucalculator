import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const springDesignSchema: CalculatorSchemaV2 = {
    id: 'spring-design',
    metadata: {
        title: 'Helical Spring Design',
        description: 'Design of helical compression springs including Wahl Factor, Shear Stress, and Deflection.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['spring', 'helical', 'wahl factor', 'stiffness', 'deflection', 'machine elements'],
        verifiedStandards: ['Shigley\'s Mechanical Engineering Design']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Helical compression spring under static or low-cycle loading.', impact: 'medium' },
            { id: 'a2', text: 'Linear elastic material behavior strictly.', impact: 'high' }
        ],
        standards: [
            { code: 'DIN 2089', title: 'Helical compression springs out of round wire and rod' }
        ],
        formulaLatex: '\\tau = K_W \\frac{8 F D}{\\pi d^3} \\quad , \\quad \delta = \\frac{8 F D^3 N_a}{G d^4} \\quad , \\quad K_W = \\frac{4C-1}{4C-4} + \\frac{0.615}{C}'
    },
    inputs: [
        { key: 'F', label: 'Applied Axial Force (F)', unit: 'N', defaultValue: 500, description: 'Axial load applied to the spring', validation: { required: true, min: 0 } },
        { key: 'd', label: 'Wire Diameter (d)', unit: 'mm', defaultValue: 5, description: 'Diameter of the spring wire', validation: { required: true, min: 0.1 } },
        { key: 'D', label: 'Mean Coil Diameter (D)', unit: 'mm', defaultValue: 40, description: 'Mean diameter of the spring coil (OD - d)', validation: { required: true, min: 1 } },
        { key: 'Na', label: 'Active Coils (Na)', unit: '-', defaultValue: 10, description: 'Number of active coils', validation: { required: true, min: 1 } },
        { key: 'G', label: 'Shear Modulus (G)', unit: 'GPa', defaultValue: 79.3, description: 'Shear Modulus of the spring material (e.g. 79.3 GPa for Steel)', validation: { required: true, min: 10 } },
        { key: 'Sy', label: 'Yield Strength in Shear (Ssy)', unit: 'MPa', defaultValue: 600, description: 'Torsional yield strength bounds check', validation: { required: true, min: 10 } }
    ],
    outputs: [
        { key: 'C', label: 'Spring Index (C)', unit: '-', description: 'Ratio of Mean Coil Dia to Wire Dia (D/d)', precision: 2, formulaLatex: 'C = D / d' },
        { key: 'Kw', label: 'Wahl Factor (Kw)', unit: '-', description: 'Stress correction factor for curvature', precision: 3, formulaLatex: 'K_W = \\frac{4C-1}{4C-4} + \\frac{0.615}{C}' },
        { key: 'tau', label: 'Shear Stress (τ)', unit: 'MPa', description: 'Maximum shear stress at the inner fiber', precision: 1, formulaLatex: '\\tau = K_W \\frac{8 F D}{\\pi d^3}' },
        { key: 'delta', label: 'Deflection (δ)', unit: 'mm', description: 'Axial deflection of the spring', precision: 2, formulaLatex: '\\delta = \\frac{8 F D^3 N_a}{G d^4}' },
        { key: 'k', label: 'Spring Rate (k)', unit: 'N/mm' as any, description: 'Stiffness of the spring (F/δ)', precision: 2, formulaLatex: 'k = \\frac{G d^4}{8 D^3 N_a}' },
        { key: 'SF', label: 'Safety Factor (SF)', unit: '-', description: 'Ratio of yield strength to max shear stress (Ssy/τ)', precision: 2, formulaLatex: 'SF = S_{sy} / \\tau' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const F = Number(inputs.F.value);
        const d = Number(inputs.d.value);
        const D = Number(inputs.D.value);
        const Na = Number(inputs.Na.value);
        const G_GPa = Number(inputs.G.value);
        const Ssy = Number(inputs.Sy.value);

        const G_MPa = G_GPa * 1000;

        // 1. Spring Index
        const C = D / d;

        // 2. Wahl Factor
        let Kw = 1.0;
        if (C > 1) {
            Kw = ((4 * C - 1) / (4 * C - 4)) + (0.615 / C);
        } else {
            // Unrealistic practically (C < 3 is very hard to manufacture), handle gracefully
            Kw = Number.MAX_VALUE;
        }

        // 3. Max Shear Stress
        const tau = Kw * ((8 * F * D) / (Math.PI * Math.pow(d, 3)));

        // 4. Deflection
        const delta = (8 * F * Math.pow(D, 3) * Na) / (G_MPa * Math.pow(d, 4));

        // 5. Spring Rate (Stiffness)
        const k = (G_MPa * Math.pow(d, 4)) / (8 * Math.pow(D, 3) * Na);

        const SF = tau > 0 ? Ssy / tau : 0;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (C < 4 || C > 12) {
            warnings.push({ field: 'C', message: 'Spring index (C) should ideally be between 4 and 12 for manufacturability.', severity: 'warning' });
        }

        if (tau > Ssy) {
            warnings.push({ field: 'tau', message: `Maximum shear stress (${tau.toFixed(1)} MPa) exceeds the specified yield strength (${Ssy} MPa). Permanent set will occur!`, severity: 'critical' });
        }

        return {
            outputs: {
                C: createValidatedValue(C, '-', 'derived'),
                Kw: createValidatedValue(Kw, '-', 'derived'),
                tau: createValidatedValue(tau, 'MPa', 'derived'),
                delta: createValidatedValue(delta, 'mm', 'derived'),
                k: createValidatedValue(k, 'N/mm' as any, 'derived'),
                SF: createValidatedValue(SF, '-', 'derived')
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
            const defl = (out.delta?.value as number) || 0;
            const tau = (out.tau?.value as number) || 0;
            const C = (out.C?.value as number) || 0;

            const isFailing = tau > 600; // Mock reference for color if > 600 MPa (often Ssy could be 600)
            const stressColor = isFailing ? '#ef4444' : '#10b981';

            // Spring drawing logic
            const numCoils = 6;
            const startY = 30;
            const maxL = 140; // max length area

            // visually compress the spring
            const compressionRatio = Math.min(defl / 50, 0.6); // cap at 60% visual compression
            const currentL = maxL * (1 - compressionRatio);
            const pitch = currentL / numCoils;

            let pathD = `M 50 ${startY} `; // start

            for (let i = 0; i <= numCoils; i++) {
                const y = startY + i * pitch;
                if (i === 0) {
                    pathD += `L 150 ${y + pitch / 2} `;
                } else if (i === numCoils) {
                    pathD += `L 50 ${y} `;
                } else {
                    pathD += `L 50 ${y} L 150 ${y + pitch / 2} `;
                }
            }

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Visual Spring SVG */}
                    <div className="relative w-[200px] h-[200px]">
                        <svg viewBox="0 0 200 200" width="100%" height="100%" className="overflow-visible transition-all duration-500">
                            {/* Top Plate/Force */}
                            <line x1="20" y1={startY - 5} x2="180" y2={startY - 5} stroke="#334155" strokeWidth="4" />
                            <line x1="100" y1="5" x2="100" y2={startY - 5} stroke="#00e5ff" strokeWidth="3" markerEnd="url(#arrow_spring)" />
                            <text x="110" y="20" fill="#00e5ff" fontSize="12" fontWeight="bold">F</text>

                            {/* The Spring */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke={stressColor}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-500"
                            />

                            {/* Inner shadow/highlight for 3d effect on spring */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="2"
                                strokeOpacity="0.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-500"
                            />

                            {/* Bottom Plate */}
                            <line x1="20" y1={startY + currentL + 5} x2="180" y2={startY + currentL + 5} stroke="#334155" strokeWidth="4" />

                            <defs>
                                <marker id="arrow_spring" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#00e5ff" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-col gap-6 w-32 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Index (C)</div>
                            <div className={`text-xl font-bold font-mono ${(C < 4 || C > 12) ? 'text-orange-400' : 'text-emerald-400'}`}>
                                {C.toFixed(1)}
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Max τ</div>
                            <div className={`text-xl font-bold font-mono ${isFailing ? 'text-red-400' : 'text-white'}`}>
                                {tau.toFixed(0)} <span className="text-[10px] text-gray-500">MPa</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Deflection</div>
                            <div className="text-xl font-bold font-mono text-[#00e5ff]">
                                {defl.toFixed(1)} <span className="text-[10px] text-gray-500">mm</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default springDesignSchema;
