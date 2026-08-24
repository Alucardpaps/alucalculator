import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const areaMomentInertiaSchema: CalculatorSchemaV2 = {
    id: 'area-moment-inertia',
    metadata: {
        title: 'Area Moment of Inertia',
        description: 'Calculates cross-sectional properties for parametric I-beams and Rectangles.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['inertia', 'beam', 'cross-section', 'modulus', 'statics'],
        verifiedStandards: ['Euler-Bernoulli Beam Theory']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Section is symmetric about the Y-axis.', impact: 'medium' },
            { id: 'a2', text: 'Thicknesses are uniform.', impact: 'low' }
        ],
        standards: [],
        formulaLatex: 'I_x = \\frac{bh^3}{12} - \\frac{(b-t_w)(h-2t_f)^3}{12}'
    },
    inputs: [
        { key: 'h', label: 'Total Height (h)', unit: 'mm' as any, defaultValue: 200, description: 'Overall height of the section', validation: { required: true, min: 1 } },
        { key: 'b', label: 'Flange Width (b)', unit: 'mm' as any, defaultValue: 100, description: 'Overall width of the section', validation: { required: true, min: 1 } },
        { key: 'tf', label: 'Flange Thickness (tf)', unit: 'mm' as any, defaultValue: 10, description: 'Thickness of top/bottom flanges', validation: { required: true, min: 0 } },
        { key: 'tw', label: 'Web Thickness (tw)', unit: 'mm' as any, defaultValue: 6, description: 'Thickness of the middle web', validation: { required: true, min: 0 } }
    ],
    outputs: [
        { key: 'A', label: 'Cross-Sectional Area', unit: 'mm2' as any, description: 'Total Area', precision: 2, formulaLatex: 'A' },
        { key: 'Ix', label: 'Moment of Inertia (Ix)', unit: 'mm4' as any, description: 'Bending inertia about strong axis', precision: 0, formulaLatex: 'I_x' },
        { key: 'Iy', label: 'Moment of Inertia (Iy)', unit: 'mm4' as any, description: 'Bending inertia about weak axis', precision: 0, formulaLatex: 'I_y' },
        { key: 'Zx', label: 'Section Modulus (Zx)', unit: 'mm3' as any, description: 'Elastic section modulus (strong)', precision: 2, formulaLatex: 'Z_x = \\frac{I_x}{c}' },
        { key: 'Zy', label: 'Section Modulus (Zy)', unit: 'mm3' as any, description: 'Elastic section modulus (weak)', precision: 2, formulaLatex: 'Z_y = \\frac{I_y}{c}' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const h = Number(inputs.h.value);
        const b = Number(inputs.b.value);
        const tf = Math.min(Number(inputs.tf.value), h / 2); // Cannot exceed half height
        const tw = Math.min(Number(inputs.tw.value), b); // Cannot exceed width

        // If tw == b and tf == h/2, it's a solid rectangle.
        const hWeb = h - 2 * tf;
        const bWebEmpty = b - tw;

        // Area: 2 flanges + 1 web
        const A = 2 * (b * tf) + (tw * hWeb);

        // Ix for I Beam (outer rect - empty inner rects)
        const Ix_outer = (b * Math.pow(h, 3)) / 12;
        const Ix_inner = (bWebEmpty * Math.pow(hWeb, 3)) / 12;
        const Ix = Ix_outer - (hWeb > 0 ? Ix_inner : 0);

        // Iy
        const Iy_flanges = 2 * ((tf * Math.pow(b, 3)) / 12);
        const Iy_web = hWeb > 0 ? ((hWeb * Math.pow(tw, 3)) / 12) : 0;
        const Iy = Iy_flanges + Iy_web;

        // Section Modulus
        const Zx = Ix / (h / 2);
        const Zy = Iy / (b / 2);

        const warnings: any[] = [];
        if (tf >= h / 2) warnings.push({ field: 'tf', message: 'Flange thickness exceeds half height. Treating as solid rectangle.', severity: 'info' });
        if (tw >= b) warnings.push({ field: 'tw', message: 'Web thickness exceeds width. Treating as solid rectangle.', severity: 'info' });

        return {
            outputs: {
                A: createValidatedValue(A, 'mm2' as any, 'derived'),
                Ix: createValidatedValue(Ix, 'mm4' as any, 'derived'),
                Iy: createValidatedValue(Iy, 'mm4' as any, 'derived'),
                Zx: createValidatedValue(Zx, 'mm3' as any, 'derived'),
                Zy: createValidatedValue(Zy, 'mm3' as any, 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const h = Number(inputs.h?.value || 200);
            const b = Number(inputs.b?.value || 100);
            const tf = Math.min(Number(inputs.tf?.value || 10), h / 2);
            const tw = Math.min(Number(inputs.tw?.value || 6), b);

            const displaySize = 180;
            const maxDim = Math.max(h, b);
            const scale = displaySize / maxDim;

            const dispH = h * scale;
            const dispB = b * scale;
            const dispTf = tf * scale;
            const dispTw = tw * scale;

            // Center positions
            const cx = 200;
            const cy = 120;

            const Ix = result?.outputs?.Ix?.value || 0;
            const Iy = result?.outputs?.Iy?.value || 0;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    <svg viewBox="0 0 400 240" className="w-full h-full font-mono drop-shadow-2xl">
                        {/* Axes */}
                        <line x1={cx - 150} y1={cy} x2={cx + 150} y2={cy} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1={cx} y1={cy - 100} x2={cx} y2={cy + 100} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Top Flange */}
                        <rect x={cx - dispB / 2} y={cy - dispH / 2} width={dispB} height={dispTf} fill="#38bdf8" fillOpacity="0.4" stroke="#0ea5e9" strokeWidth="2" />
                        {/* Bottom Flange */}
                        <rect x={cx - dispB / 2} y={cy + dispH / 2 - dispTf} width={dispB} height={dispTf} fill="#38bdf8" fillOpacity="0.4" stroke="#0ea5e9" strokeWidth="2" />
                        {/* Web */}
                        {h > 2 * tf && (
                            <rect x={cx - dispTw / 2} y={cy - dispH / 2 + dispTf} width={dispTw} height={dispH - 2 * dispTf} fill="#38bdf8" fillOpacity="0.6" stroke="#0ea5e9" strokeWidth="2" />
                        )}

                        {/* Centroid Mark */}
                        <circle cx={cx} cy={cy} r={3} fill="#fbbf24" />
                        <circle cx={cx} cy={cy} r={8} stroke="#fbbf24" strokeWidth="1" fill="none" />

                        {/* Dimension annotations */}
                        {/* Total Height */}
                        <line x1={cx - dispB / 2 - 20} y1={cy - dispH / 2} x2={cx - dispB / 2 - 20} y2={cy + dispH / 2} stroke="#94a3b8" strokeWidth="1" />
                        <line x1={cx - dispB / 2 - 25} y1={cy - dispH / 2} x2={cx - dispB / 2 - 15} y2={cy - dispH / 2} stroke="#94a3b8" strokeWidth="1" />
                        <line x1={cx - dispB / 2 - 25} y1={cy + dispH / 2} x2={cx - dispB / 2 - 15} y2={cy + dispH / 2} stroke="#94a3b8" strokeWidth="1" />
                        <text x={cx - dispB / 2 - 25} y={cy} fontSize="10" fill="#cbd5e1" textAnchor="end" dominantBaseline="middle">h={h}</text>

                        {/* Total Width */}
                        <line x1={cx - dispB / 2} y1={cy + dispH / 2 + 20} x2={cx + dispB / 2} y2={cy + dispH / 2 + 20} stroke="#94a3b8" strokeWidth="1" />
                        <line x1={cx - dispB / 2} y1={cy + dispH / 2 + 15} x2={cx - dispB / 2} y2={cy + dispH / 2 + 25} stroke="#94a3b8" strokeWidth="1" />
                        <line x1={cx + dispB / 2} y1={cy + dispH / 2 + 15} x2={cx + dispB / 2} y2={cy + dispH / 2 + 25} stroke="#94a3b8" strokeWidth="1" />
                        <text x={cx} y={cy + dispH / 2 + 35} fontSize="10" fill="#cbd5e1" textAnchor="middle">b={b}</text>

                        {/* Mini Data HUD */}
                        <g transform="translate(10, 20)">
                            <rect x="0" y="0" width="100" height="50" fill="rgba(15, 23, 42, 0.8)" rx="4" />
                            <text x="10" y="20" fontSize="10" fill="#00e5ff" fontWeight="bold">Ix: {Ix.toExponential(2)}</text>
                            <text x="10" y="40" fontSize="10" fill="#3b82f6" fontWeight="bold">Iy: {Iy.toExponential(2)}</text>
                        </g>

                    </svg>
                </div>
            );
        }
    },
    tier: 'free'
};

export default areaMomentInertiaSchema;
