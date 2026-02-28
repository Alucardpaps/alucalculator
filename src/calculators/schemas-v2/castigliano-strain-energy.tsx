import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const castiglianoEnergySchema: CalculatorSchemaV2 = {
    id: 'castigliano-energy',
    metadata: {
        title: 'Castigliano\'s Theorem (Energy)',
        description: 'Calculates strain energy and displacement using Castigliano\'s second theorem for standard structural elements.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['energy', 'strain', 'castigliano', 'deflection', 'bending', 'axial', 'machine elements'],
        verifiedStandards: ['General Solid Mechanics']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Linear elastic material behavior.', impact: 'high' },
            { id: 'a2', text: 'Small deformations (Euler-Bernoulli assumptions apply to beams).', impact: 'medium' }
        ],
        standards: [
            { code: 'Mechanics of Materials', title: 'Energy Methods - Castigliano\'s Theorem' }
        ],
        formulaLatex: 'U = \\int \\frac{M^2}{2EI} dx \\quad , \\quad \\delta_i = \\frac{\\partial U}{\\partial P_i}'
    },
    inputs: [
        { key: 'type', label: 'Load Type (0=Cant., 1=SS, 2=Axial)', unit: '-', defaultValue: 0, description: 'Type of standard loading: 0 for Cantilever End Load, 1 for Simply Supported Center Load, 2 for Axial Rod', validation: { required: true, min: 0, max: 2 } },
        { key: 'P', label: 'Applied Load (P)', unit: 'N', defaultValue: 1000, description: 'Point load applied to the structure', validation: { required: true, min: 0 } },
        { key: 'L', label: 'Length (L)', unit: 'mm', defaultValue: 1000, description: 'Total length of the beam/rod', validation: { required: true, min: 1 } },
        { key: 'E', label: 'Young\'s Modulus (E)', unit: 'GPa', defaultValue: 200, description: 'Elastic modulus of material (e.g. 200 GPa for steel)', validation: { required: true, min: 1 } },
        { key: 'I', label: 'Moment of Inertia (I)', unit: 'cm^4' as any, defaultValue: 100, description: 'Area moment of inertia (Used for types 0, 1)', validation: { required: true, min: 0.1 } },
        { key: 'A', label: 'Cross-sec Area (A)', unit: 'mm^2' as any, defaultValue: 500, description: 'Cross-sectional area (Used for type 2)', validation: { required: true, min: 1 } }
    ],
    outputs: [
        { key: 'U', label: 'Strain Energy (U)', unit: 'J', description: 'Total elastic strain energy stored in the structure', precision: 3, formulaLatex: 'U' },
        { key: 'delta', label: 'Deflection at P (δ)', unit: 'mm', description: 'Displacement in the direction of the applied load P', precision: 3, formulaLatex: '\\delta = \\frac{\\partial U}{\\partial P}' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const type = Number(inputs.type.value);
        const P = Number(inputs.P.value);
        const L = Number(inputs.L.value); // mm
        const E_GPa = Number(inputs.E.value);
        const I_cm4 = Number(inputs.I.value);
        const A = Number(inputs.A.value); // mm^2

        const E_MPa = E_GPa * 1000;
        const I_mm4 = I_cm4 * 10000;

        let U_Nmm = 0;
        let delta = 0;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (type === 0) {
            // Cantilever, load at free end
            // U = P^2 L^3 / (6 E I)
            // delta = P L^3 / (3 E I)
            U_Nmm = (Math.pow(P, 2) * Math.pow(L, 3)) / (6 * E_MPa * I_mm4);
            delta = (P * Math.pow(L, 3)) / (3 * E_MPa * I_mm4);
        } else if (type === 1) {
            // Simply Supported, load at center
            // U = 2 * int(0 to L/2) ( (Px/2)^2 / (2EI) ) dx = P^2 L^3 / (96 E I)
            // delta = P L^3 / (48 E I)
            U_Nmm = (Math.pow(P, 2) * Math.pow(L, 3)) / (96 * E_MPa * I_mm4);
            delta = (P * Math.pow(L, 3)) / (48 * E_MPa * I_mm4);
        } else if (type === 2) {
            // Axial Bar
            // U = P^2 L / (2 A E)
            // delta = P L / (A E)
            U_Nmm = (Math.pow(P, 2) * L) / (2 * A * E_MPa);
            delta = (P * L) / (A * E_MPa);

            if (A <= 0) warnings.push({ field: 'A', message: 'Area must be greater than zero for axial loading.', severity: 'critical' });
        }

        const U_J = U_Nmm / 1000; // N*mm to Joules (N*m)

        return {
            outputs: {
                U: createValidatedValue(U_J, 'J', 'derived'),
                delta: createValidatedValue(delta, 'mm', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const type = Number(inputs.type?.value || 0);
            const out = result.outputs || {};
            let delta = (out.delta?.value as number) || 0;

            // visually exaggerate delta for rendering
            delta = Math.min(Math.max(delta * 10, 5), 40);

            const W = 300;
            const H = 200;
            const beamW = 200;
            const cx = W / 2;
            const cy = H / 2;

            if (type === 0) {
                // Cantilever
                return (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-[#05080b]">
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="bg-[#0a0e14] border border-[#1a1f26] rounded-xl shadow-lg">
                            <defs>
                                <marker id="arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#00e5ff" />
                                </marker>
                            </defs>
                            {/* Wall */}
                            <rect x="30" y="40" width="20" height="120" fill="#334155" />
                            {/* Un-deflected Beam */}
                            <line x1="50" y1={cy} x2={50 + beamW} y2={cy} stroke="#334155" strokeWidth="6" strokeDasharray="4 4" />
                            {/* Deflected Beam */}
                            <path d={`M 50 ${cy} C ${50 + beamW * 0.6} ${cy}, ${50 + beamW * 0.8} ${cy + delta}, ${50 + beamW} ${cy + delta}`} fill="none" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />
                            {/* Force */}
                            <line x1={50 + beamW} y1={cy + delta - 40} x2={50 + beamW} y2={cy + delta - 10} stroke="#00e5ff" strokeWidth="3" markerEnd="url(#arrow)" />
                            <text x={50 + beamW + 10} y={cy + delta - 25} fill="#00e5ff" fontSize="12" fontWeight="bold">P</text>

                            <text x="150" y="30" fill="#94a3b8" fontSize="12" textAnchor="middle">Cantilever Bending</text>
                            {/* delta marker */}
                            <line x1={50 + beamW + 30} y1={cy} x2={50 + beamW + 30} y2={cy + delta} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                            <text x={50 + beamW + 35} y={cy + delta / 2 + 5} fill="#f43f5e" fontSize="10">δ</text>
                        </svg>
                    </div>
                );
            } else if (type === 1) {
                // Simply Supported
                return (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-[#05080b]">
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="bg-[#0a0e14] border border-[#1a1f26] rounded-xl shadow-lg">
                            <defs>
                                <marker id="arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#00e5ff" />
                                </marker>
                            </defs>
                            {/* Supports */}
                            <polygon points="40,110 50,90 60,110" fill="#334155" />
                            <polygon points="240,110 250,90 260,110" fill="#334155" />
                            <line x1="30" y1="110" x2="270" y2="110" stroke="#1e293b" strokeWidth="2" />

                            {/* Un-deflected Beam */}
                            <line x1="50" y1="90" x2="250" y2="90" stroke="#334155" strokeWidth="6" strokeDasharray="4 4" />
                            {/* Deflected Beam */}
                            <path d={`M 50 90 Q 150 ${90 + delta * 2} 250 90`} fill="none" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />
                            {/* Force */}
                            <line x1="150" y1={90 + delta - 40} x2="150" y2={90 + delta - 10} stroke="#00e5ff" strokeWidth="3" markerEnd="url(#arrow)" />
                            <text x="160" y={90 + delta - 25} fill="#00e5ff" fontSize="12" fontWeight="bold">P</text>

                            <text x="150" y="30" fill="#94a3b8" fontSize="12" textAnchor="middle">Simply Supported Bending</text>
                        </svg>
                    </div>
                );
            } else {
                // Axial
                return (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-[#05080b]">
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="bg-[#0a0e14] border border-[#1a1f26] rounded-xl shadow-lg">
                            <defs>
                                <marker id="arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#00e5ff" />
                                </marker>
                            </defs>
                            {/* Wall */}
                            <rect x="30" y="40" width="20" height="120" fill="#334155" />
                            {/* Un-deflected Ax */}
                            <rect x="50" y={cy - 15} width={beamW} height="30" fill="#334155" opacity="0.5" />
                            {/* Deflected Ax */}
                            <rect x="50" y={cy - 15} width={beamW + delta} height="30" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 2" />

                            {/* Force */}
                            <line x1={50 + beamW + delta + 10} y1={cy} x2={50 + beamW + delta + 40} y2={cy} stroke="#00e5ff" strokeWidth="3" markerEnd="url(#arrow)" />
                            <text x={50 + beamW + delta + 25} y={cy - 10} fill="#00e5ff" fontSize="12" fontWeight="bold">P</text>

                            <text x="150" y="30" fill="#94a3b8" fontSize="12" textAnchor="middle">Axial Tension</text>
                        </svg>
                    </div>
                );
            }
        }
    },
    tier: 'free'
};

export default castiglianoEnergySchema;
