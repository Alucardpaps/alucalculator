import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';

export const sfdBmdAcademicSchema: CalculatorSchemaV2 = {
    id: 'sfd-bmd-academic',
    metadata: {
        title: "SFD/BMD Interactive Whiteboard",
        description: 'Academic step-by-step drawing of Shear and Moment diagrams.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-25',
        tags: ['beam', 'sfd', 'bmd', 'statics', 'shear', 'moment', 'academic'],
        verifiedStandards: ['Statics and Mechanics of Materials']
    },
    documentation: {
        assumptions: [
            { id: 'simply-supported', text: 'Simply supported beam with a single point load.', impact: 'high' }
        ],
        standards: [],
        formulaLatex: 'R_A = \\frac{P(L-a)}{L}, \\quad R_B = \\frac{Pa}{L}'
    },
    inputs: [
        {
            key: 'L',
            label: 'Beam Length (L)',
            description: 'Total length between supports',
            unit: 'm' as any,
            defaultValue: 10,
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'P',
            label: 'Point Load (P)',
            description: 'Downward force applied',
            unit: 'kN' as any,
            defaultValue: 50,
            validation: { required: true }
        },
        {
            key: 'a',
            label: 'Load Position (a)',
            description: 'Distance of force P from left support A',
            unit: 'm' as any,
            defaultValue: 4,
            validation: { required: true, min: 0 } // Must be <= L in engine logic
        }
    ],
    outputs: [
        {
            key: 'Ra',
            label: 'Reaction A (R_A)',
            unit: 'kN' as any,
            description: 'Vertical reaction at left support',
            formulaLatex: 'R_A = \\frac{P(L-a)}{L}'
        },
        {
            key: 'Rb',
            label: 'Reaction B (R_B)',
            unit: 'kN' as any,
            description: 'Vertical reaction at right support',
            formulaLatex: 'R_B = \\frac{Pa}{L}'
        },
        {
            key: 'Mmax',
            label: 'Max Moment (M_max)',
            unit: 'kNm' as any,
            description: 'Maximum bending moment (under the load)',
            formulaLatex: 'M_{max} = R_A \\cdot a'
        }
    ],
    calculationEngine: (inputs) => {
        const L = Number(inputs.L.value);
        const P = Number(inputs.P.value);
        let a = Number(inputs.a.value);

        const warnings: any[] = [];
        if (a > L) {
            warnings.push({ field: 'a', message: 'Load position (a) cannot exceed Beam Length (L). Capping at L.', severity: 'warning' });
            a = L;
        }

        const b = L - a;
        const Ra = (P * b) / L;
        const Rb = (P * a) / L;
        const Mmax = Ra * a;

        return {
            outputs: {
                Ra: createValidatedValue(Ra, 'kN' as any, 'derived'),
                Rb: createValidatedValue(Rb, 'kN' as any, 'derived'),
                Mmax: createValidatedValue(Mmax, 'kNm' as any, 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: CalculationResult, inputs: Record<string, any>) => {
            if (!result || !result.outputs) return null;

            const L = Number(inputs.L?.value || 10);
            const P = Number(inputs.P?.value || 50);
            let a = Number(inputs.a?.value || 4);
            if (a > L) a = L;
            const b = L - a;

            const Ra = Number(result.outputs.Ra.value);
            const Rb = Number(result.outputs.Rb.value);
            const Mmax = Number(result.outputs.Mmax.value);

            // Responsive SVG bounds
            const w = 600;
            const h = 500;
            const startX = 100;
            const endX = 500;
            const spanX = endX - startX;
            const scaleX = spanX / L;

            const loadX = startX + a * scaleX;

            // Y positions for diagrams
            const yBeam = 80;
            const ySfd = 240;
            const yBmd = 420;

            // Scaling SFD
            const maxShear = Math.max(Math.abs(Ra), Math.abs(Rb));
            const sfdScaleY = maxShear === 0 ? 1 : 40 / maxShear;

            // Scaling BMD
            const maxM = Math.abs(Mmax);
            const bmdScaleY = maxM === 0 ? 1 : 60 / maxM;

            // Step texts for interactive academic feeling
            const step1 = `ΣM_B = 0 ➔ R_A(${L}) - P(${b}) = 0 ➔ R_A = ${Ra.toFixed(2)} kN`;
            const step2 = `ΣF_y = 0 ➔ R_A + R_B - P = 0 ➔ R_B = ${Rb.toFixed(2)} kN`;
            const step3 = `M_max at x=${a} ➔ M_max = R_A × a = ${(Ra * a).toFixed(2)} kNm`;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b12] font-mono text-cyan-50">
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full drop-shadow-lg">

                        {/* ────────────────────────────────────────────────────────── */}
                        {/* 1. FREE BODY DIAGRAM (BEAM) */}
                        {/* ────────────────────────────────────────────────────────── */}
                        <g>
                            <text x="20" y={yBeam - 40} fill="#f8fafc" fontSize="14" fontWeight="bold">1. Free Body Diagram</text>

                            {/* Beam body */}
                            <line x1={startX} y1={yBeam} x2={endX} y2={yBeam} stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

                            {/* Pin Support A */}
                            <polygon points={`${startX},${yBeam + 3} ${startX - 10},${yBeam + 20} ${startX + 10},${yBeam + 20}`} fill="#475569" />
                            <line x1={startX - 15} y1={yBeam + 20} x2={startX + 15} y2={yBeam + 20} stroke="#334155" strokeWidth="3" />

                            {/* Roller Support B */}
                            <circle cx={endX} cy={yBeam + 12} r="8" fill="#475569" />
                            <line x1={endX - 15} y1={yBeam + 20} x2={endX + 15} y2={yBeam + 20} stroke="#334155" strokeWidth="3" />

                            {/* Applied Load P */}
                            {P !== 0 && (
                                <g>
                                    <line x1={loadX} y1={yBeam - 40} x2={loadX} y2={yBeam - 5} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-down)" />
                                    <text x={loadX} y={yBeam - 50} fill="#ef4444" fontSize="12" textAnchor="middle" fontWeight="bold">P = {P} kN</text>
                                </g>
                            )}

                            {/* Reactions */}
                            <line x1={startX} y1={yBeam + 50} x2={startX} y2={yBeam + 25} stroke="#22c55e" strokeWidth="3" markerEnd="url(#arrow-up)" />
                            <text x={startX - 10} y={yBeam + 65} fill="#22c55e" fontSize="11" textAnchor="middle">R_A = {Ra.toFixed(1)}</text>

                            <line x1={endX} y1={yBeam + 50} x2={endX} y2={yBeam + 25} stroke="#22c55e" strokeWidth="3" markerEnd="url(#arrow-up)" />
                            <text x={endX + 10} y={yBeam + 65} fill="#22c55e" fontSize="11" textAnchor="middle">R_B = {Rb.toFixed(1)}</text>

                            {/* Dimensions */}
                            <line x1={startX} y1={yBeam + 85} x2={endX} y2={yBeam + 85} stroke="#64748b" strokeWidth="1" />
                            <line x1={startX} y1={yBeam + 80} x2={startX} y2={yBeam + 90} stroke="#64748b" strokeWidth="1" />
                            <line x1={endX} y1={yBeam + 80} x2={endX} y2={yBeam + 90} stroke="#64748b" strokeWidth="1" />
                            <line x1={loadX} y1={yBeam + 80} x2={loadX} y2={yBeam + 90} stroke="#64748b" strokeWidth="1" />

                            <text x={startX + (loadX - startX) / 2} y={yBeam + 100} fill="#94a3b8" fontSize="10" textAnchor="middle">a = {a}m</text>
                            <text x={loadX + (endX - loadX) / 2} y={yBeam + 100} fill="#94a3b8" fontSize="10" textAnchor="middle">b = {b}m</text>

                            {/* Calculation Steps Right Side */}
                            <g transform="translate(420, 20)">
                                <rect width="170" height="70" fill="#0f172a" stroke="#1e293b" rx="4" />
                                <text x="10" y="20" fill="#fbbf24" fontSize="10">Equilibrium Equations:</text>
                                <text x="10" y="35" fill="#38bdf8" fontSize="9">{step1}</text>
                                <text x="10" y="50" fill="#38bdf8" fontSize="9">{step2}</text>
                                <text x="10" y="65" fill="#38bdf8" fontSize="9">{step3}</text>
                            </g>
                        </g>

                        {/* Guide Lines */}
                        <line x1={startX} y1={yBeam + 50} x2={startX} y2={yBmd + 50} stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1={endX} y1={yBeam + 50} x2={endX} y2={yBmd + 50} stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1={loadX} y1={yBeam} x2={loadX} y2={yBmd + 50} stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />

                        {/* ────────────────────────────────────────────────────────── */}
                        {/* 2. SHEAR FORCE DIAGRAM (SFD) */}
                        {/* ────────────────────────────────────────────────────────── */}
                        <g>
                            <text x="20" y={ySfd - 60} fill="#f8fafc" fontSize="14" fontWeight="bold">2. Shear Force Diagram (V)</text>
                            {/* Neutral Axis */}
                            <line x1={startX - 20} y1={ySfd} x2={endX + 20} y2={ySfd} stroke="#475569" strokeWidth="1" />

                            <path d={`
                                M ${startX} ${ySfd}
                                L ${startX} ${ySfd - Ra * sfdScaleY}
                                L ${loadX} ${ySfd - Ra * sfdScaleY}
                                L ${loadX} ${ySfd + Rb * sfdScaleY}
                                L ${endX} ${ySfd + Rb * sfdScaleY}
                                L ${endX} ${ySfd}
                            `} fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="2" />

                            <text x={startX + 10} y={ySfd - Ra * sfdScaleY - 10} fill="#38bdf8" fontSize="11" fontWeight="bold">{Ra.toFixed(1)} kN</text>
                            <text x={endX - 10} y={ySfd + Rb * sfdScaleY + 15} fill="#38bdf8" fontSize="11" textAnchor="end" fontWeight="bold">{-Rb.toFixed(1)} kN</text>

                            <text x={loadX + 5} y={ySfd + 5} fill="#94a3b8" fontSize="9">Drop = {P} kN</text>
                        </g>

                        {/* ────────────────────────────────────────────────────────── */}
                        {/* 3. BENDING MOMENT DIAGRAM (BMD) */}
                        {/* ────────────────────────────────────────────────────────── */}
                        <g>
                            <text x="20" y={yBmd - 80} fill="#f8fafc" fontSize="14" fontWeight="bold">3. Bending Moment Diagram (M)</text>
                            {/* Neutral Axis */}
                            <line x1={startX - 20} y1={yBmd} x2={endX + 20} y2={yBmd} stroke="#475569" strokeWidth="1" />

                            {/* Standard mechanics plotting: Positive moments are usually drawn BELOW the axis or ABOVE depending on convention.
                                We will draw positive ABOVE the axis (so negative Y in SVG) */}
                            <path d={`
                                M ${startX} ${yBmd}
                                L ${loadX} ${yBmd - Mmax * bmdScaleY}
                                L ${endX} ${yBmd}
                            `} fill="rgba(217, 70, 239, 0.2)" stroke="#d946ef" strokeWidth="2" />

                            {Mmax > 0 && (
                                <text x={loadX} y={yBmd - Mmax * bmdScaleY - 10} fill="#d946ef" fontSize="11" textAnchor="middle" fontWeight="bold">M_max: {Mmax.toFixed(1)} kNm</text>
                            )}

                        </g>

                        {/* Defs/Markers */}
                        <defs>
                            <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
                                <polygon points="0 0, 10 0, 5 10" fill="#ef4444" />
                            </marker>
                            <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto">
                                <polygon points="0 10, 10 10, 5 0" fill="#22c55e" />
                            </marker>
                        </defs>

                    </svg>
                </div>
            );
        }
    },
    tier: 'free'
};

export default sfdBmdAcademicSchema;
