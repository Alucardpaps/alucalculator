import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const pressureVesselSchema: CalculatorSchemaV2 = {
    id: 'pressure-vessel',
    metadata: {
        title: 'Pressure Vessel (Lame\'s Eq)',
        description: 'Analyzes stresses in thick and thin-walled cylindrical pressure vessels using Lame\'s equations.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['pressure', 'vessel', 'cylinder', 'lame', 'stress', 'thick-walled', 'thin-walled', 'machine elements'],
        verifiedStandards: ['General Solid Mechanics']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Linear elastic, homogeneous, isotropic material.', impact: 'high' },
            { id: 'a2', text: 'Plane strain condition assumed away from ends (open/closed ends affect longitudinal stress only).', impact: 'low' }
        ],
        standards: [
            { code: 'Mechanics of Materials', title: 'Thick Cylinders - Lame Equations' }
        ],
        formulaLatex: '\\sigma_t = \\frac{p_i r_i^2 - p_o r_o^2}{r_o^2 - r_i^2} + \\frac{r_i^2 r_o^2 (p_i - p_o)}{r^2 (r_o^2 - r_i^2)}'
    },
    inputs: [
        { key: 'ri', label: 'Inner Radius (ri)', unit: 'mm', defaultValue: 100, description: 'Internal radius of the cylinder', validation: { required: true, min: 1 } },
        { key: 'ro', label: 'Outer Radius (ro)', unit: 'mm', defaultValue: 150, description: 'External radius of the cylinder', validation: { required: true, min: 2 } },
        { key: 'pi', label: 'Internal Pressure (pi)', unit: 'MPa', defaultValue: 50, description: 'Internal fluid pressure', validation: { required: true, min: 0 } },
        { key: 'po', label: 'External Pressure (po)', unit: 'MPa', defaultValue: 0, description: 'External environmental pressure', validation: { required: true, min: 0 } },
        { key: 'closedEnd', label: 'Closed Ends?', unit: '-', defaultValue: 1, description: '1: Closed Ends (Longitudinal Stress), 0: Open Ends', validation: { required: true, min: 0, max: 1 } }
    ],
    outputs: [
        { key: 'classification', label: 'Classification', unit: '-', description: 'Thin or Thick walled classification (t/ri ratio)', precision: 0, formulaLatex: 't/r_i < 0.1 \\implies Thin' },
        { key: 'sigTMax', label: 'Max Hoop (σt)', unit: 'MPa', description: 'Maximum tangential (hoop) stress, usually at inner surface', precision: 1, formulaLatex: '\\sigma_{t,max}' },
        { key: 'sigRMax', label: 'Max Radial (σr)', unit: 'MPa', description: 'Maximum absolute radial stress', precision: 1, formulaLatex: '\\sigma_{r,max} = -p_i' },
        { key: 'sigL', label: 'Longitudinal (σl)', unit: 'MPa', description: 'Longitudinal stress (if closed ends)', precision: 1, formulaLatex: '\\sigma_l = \\frac{p_i r_i^2 - p_o r_o^2}{r_o^2 - r_i^2}' },
        { key: 'tauMax', label: 'Max Shear (τmax)', unit: 'MPa', description: 'Absolute maximum shear stress', precision: 1, formulaLatex: '\\tau_{max} = \\frac{\\sigma_{1} - \\sigma_{3}}{2}' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const ri = Number(inputs.ri.value);
        const ro = Number(inputs.ro.value);
        const pi = Number(inputs.pi.value);
        const po = Number(inputs.po.value);
        const closed = Number(inputs.closedEnd.value) === 1;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (ro <= ri) {
            warnings.push({ field: 'ro', message: 'Outer radius must be strictly greater than inner radius.', severity: 'critical' });
            return {
                outputs: {
                    classification: createValidatedValue(0, '-', 'derived'),
                    sigTMax: createValidatedValue(0, 'MPa', 'derived'),
                    sigRMax: createValidatedValue(0, 'MPa', 'derived'),
                    sigL: createValidatedValue(0, 'MPa', 'derived'),
                    tauMax: createValidatedValue(0, 'MPa', 'derived')
                },
                verified: false,
                warnings,
                timestamp: Date.now()
            };
        }

        const t = ro - ri;
        const ratio = t / ri;
        // 0 = Thin, 1 = Thick
        const classificationCode = ratio <= 0.1 ? 0 : 1;
        if (classificationCode === 0) {
            warnings.push({ field: 'classification', message: `t/ri = ${ratio.toFixed(3)}. Vessel is technically Thin-Walled. Lame's equations still apply exactly, but thin-wall approximations might be sufficient.`, severity: 'info' });
        }

        const denominator = Math.pow(ro, 2) - Math.pow(ri, 2);
        const term1 = (pi * Math.pow(ri, 2) - po * Math.pow(ro, 2)) / denominator;
        const term2_coef = (Math.pow(ri, 2) * Math.pow(ro, 2) * (pi - po)) / denominator;

        // tangential stress: simga_t = term1 + term2_coef / r^2
        // radial stress: sigma_r = term1 - term2_coef / r^2

        // Max hoop stress typically occurs at the inner radius (r = ri)
        const sigT_ri = term1 + term2_coef / Math.pow(ri, 2);
        const sigT_ro = term1 + term2_coef / Math.pow(ro, 2);
        const sigTMax = Math.max(Math.abs(sigT_ri), Math.abs(sigT_ro)) * (sigT_ri >= 0 ? 1 : -1);

        // Max absolute radial stress is always at the boundary (r=ri or r=ro)
        const sigRMax = -Math.max(pi, po);

        // Longitudinal stress (constant across thickness for closed ends)
        let sigL = 0;
        if (closed) {
            sigL = term1; // By Lame's derivation, sig_L exactly equals the constant term1
        }

        // Principal stresses at the critical point (inner radius usually)
        const p1 = Math.max(sigT_ri, -pi, sigL);
        const p3 = Math.min(sigT_ri, -pi, sigL);
        const tauMax = (p1 - p3) / 2;

        return {
            outputs: {
                classification: createValidatedValue(classificationCode, '-', 'derived'),
                sigTMax: createValidatedValue(sigT_ri, 'MPa', 'derived'),
                sigRMax: createValidatedValue(sigRMax, 'MPa', 'derived'),
                sigL: createValidatedValue(sigL, 'MPa', 'derived'),
                tauMax: createValidatedValue(tauMax, 'MPa', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const ri = Number(inputs.ri?.value || 100);
            const ro = Number(inputs.ro?.value || 150);
            const pi = Number(inputs.pi?.value || 50);
            const po = Number(inputs.po?.value || 0);

            const denominator = Math.pow(ro, 2) - Math.pow(ri, 2);
            if (denominator <= 0) return <div>Invalid Geometry</div>;

            const term1 = (pi * Math.pow(ri, 2) - po * Math.pow(ro, 2)) / denominator;
            const term2_coef = (Math.pow(ri, 2) * Math.pow(ro, 2) * (pi - po)) / denominator;

            // Generate plot points for sigma_t and sigma_r across thickness
            const steps = 20;
            const dr = (ro - ri) / steps;

            const pointsT: [number, number][] = [];
            const pointsR: [number, number][] = [];
            let maxStress = 0;
            let minStress = 0;

            for (let i = 0; i <= steps; i++) {
                const r = ri + i * dr;
                const st = term1 + term2_coef / Math.pow(r, 2);
                const sr = term1 - term2_coef / Math.pow(r, 2);
                pointsT.push([r, st]);
                pointsR.push([r, sr]);

                if (st > maxStress) maxStress = st;
                if (sr < minStress) minStress = sr;
            }

            // Drawing canvas
            const W = 300;
            const H = 200;
            const padX = 40;
            const padY = 20;
            const drawW = W - 2 * padX;
            const drawH = H - 2 * padY;

            // Scales
            const scaleX = drawW / (ro - ri);
            const rangeY = (maxStress - minStress) || 1;
            const scaleY = drawH / rangeY;

            const cx = (r: number) => padX + (r - ri) * scaleX;
            const cy = (s: number) => H - padY - (s - minStress) * scaleY;

            const y0 = cy(0);

            // Build SVG paths
            const pathT = pointsT.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx(p[0])} ${cy(p[1])}`).join(' ');
            const pathR = pointsR.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx(p[0])} ${cy(p[1])}`).join(' ');

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    <div className="relative w-full max-w-[400px]">
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="bg-[#0a0e14] border border-[#1a1f26] rounded-xl shadow-lg">
                            {/* Grid/Axes */}
                            <line x1={padX} y1={y0} x2={W - padX} y2={y0} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1={padX} y1={padY} x2={padX} y2={H - padY} stroke="#334155" strokeWidth="1" />
                            <line x1={W - padX} y1={padY} x2={W - padX} y2={H - padY} stroke="#334155" strokeWidth="1" />

                            <text x={padX} y={H - 5} fill="#64748b" fontSize="10" textAnchor="middle">Inner (ri)</text>
                            <text x={W - padX} y={H - 5} fill="#64748b" fontSize="10" textAnchor="middle">Outer (ro)</text>

                            {/* Paths */}
                            <path d={pathT} fill="none" stroke="#00e5ff" strokeWidth="2" />
                            <path d={pathR} fill="none" stroke="#f43f5e" strokeWidth="2" />

                            {/* Legend */}
                            <rect x={W - 80} y={15} width="6" height="6" fill="#00e5ff" />
                            <text x={W - 70} y={22} fill="#94a3b8" fontSize="8">Hoop (σt)</text>

                            <rect x={W - 80} y={30} width="6" height="6" fill="#f43f5e" />
                            <text x={W - 70} y={37} fill="#94a3b8" fontSize="8">Radial (σr)</text>

                            {/* Max values pinned */}
                            <circle cx={cx(ri)} cy={cy(pointsT[0][1])} r="3" fill="#00e5ff" />
                            <text x={cx(ri) + 5} y={cy(pointsT[0][1]) - 5} fill="#00e5ff" fontSize="10" fontWeight="bold">
                                {pointsT[0][1].toFixed(1)}
                            </text>

                            <circle cx={cx(ri)} cy={cy(pointsR[0][1])} r="3" fill="#f43f5e" />
                            <text x={cx(ri) + 5} y={cy(pointsR[0][1]) + 12} fill="#f43f5e" fontSize="10" fontWeight="bold">
                                {pointsR[0][1].toFixed(1)}
                            </text>
                        </svg>
                    </div>

                    <div className="mt-4 text-xs text-gray-400 max-w-[400px] text-center">
                        <span className="text-[#00e5ff]">Hoop stress</span> is maximum at the inner radius.
                        <span className="text-[#f43f5e]"> Radial stress</span> is compressive equal to the internal pressure at the inner wall.
                    </div>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default pressureVesselSchema;
