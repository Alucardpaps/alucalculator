import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';

export const mohrsCircleSchema: CalculatorSchemaV2 = {
    id: 'mohrs-circle',
    metadata: {
        title: "Mohr's Circle (Academic)",
        description: 'Interactive 2D stress transformation with visual element mapping.',
        category: 'mechanical',
        version: '2.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-25',
        tags: ['stress', 'mechanics', 'transformation', 'mohr', 'principal'],
        verifiedStandards: ['Mechanics of Materials']
    },
    documentation: {
        assumptions: [
            { id: 'plane-stress', text: 'Assumes plane stress state (sigma_z = 0)', impact: 'high' }
        ],
        standards: [],
        formulaLatex: '\\sigma_{1,2} = \\frac{\\sigma_x + \\sigma_y}{2} \\pm \\sqrt{\\left(\\frac{\\sigma_x - \\sigma_y}{2}\\right)^2 + \\tau_{xy}^2}'
    },
    inputs: [
        {
            key: 'sigmaX',
            label: 'Normal Stress X (σx)',
            description: 'Normal stress acting on the X face',
            unit: 'MPa' as any,
            defaultValue: 50,
            validation: { required: true }
        },
        {
            key: 'sigmaY',
            label: 'Normal Stress Y (σy)',
            description: 'Normal stress acting on the Y face',
            unit: 'MPa' as any,
            defaultValue: 10,
            validation: { required: true }
        },
        {
            key: 'tauXY',
            label: 'Shear Stress (τxy)',
            description: 'Shear stress acting on the X face',
            unit: 'MPa' as any,
            defaultValue: 20,
            validation: { required: true }
        },
        {
            key: 'theta',
            label: 'Rotation Angle (θ)',
            description: 'Angle to rotate element (CCW positive)',
            unit: 'deg' as any,
            defaultValue: 0,
            validation: { min: -360, max: 360, required: true }
        }
    ],
    outputs: [
        {
            key: 'sigma1',
            label: 'Principal Stress 1 (σ₁)',
            unit: 'MPa' as any,
            description: 'Maximum normal stress',
            formulaLatex: '\\sigma_1 = \\sigma_{avg} + R'
        },
        {
            key: 'sigma2',
            label: 'Principal Stress 2 (σ₂)',
            unit: 'MPa' as any,
            description: 'Minimum normal stress',
            formulaLatex: '\\sigma_2 = \\sigma_{avg} - R'
        },
        {
            key: 'tauMax',
            label: 'Max Shear Stress (τmax)',
            unit: 'MPa' as any,
            description: 'Maximum in-plane shear stress',
            formulaLatex: '\\tau_{max} = R'
        },
        {
            key: 'sigmaAvg',
            label: 'Average Stress (σavg)',
            unit: 'MPa' as any,
            description: 'Center of Mohr\'s circle',
            formulaLatex: '\\sigma_{avg} = \\frac{\\sigma_x + \\sigma_y}{2}'
        },
        {
            key: 'thetaP',
            label: 'Principal Angle (θp)',
            unit: 'deg' as any,
            description: 'Angle to principal planes',
            formulaLatex: '\\tan(2\\theta_p) = \\frac{2\\tau_{xy}}{\\sigma_x - \\sigma_y}'
        },
        {
            key: 'sigmaX_rot',
            label: 'Rotated Normal Stress (σx\')',
            unit: 'MPa' as any,
            description: 'Stress at given rotation',
            formulaLatex: '\\sigma_x^\''
        },
        {
            key: 'tauXY_rot',
            label: 'Rotated Shear Stress (τx\'y\')',
            unit: 'MPa' as any,
            description: 'Shear stress at given rotation',
            formulaLatex: '\\tau_{x\'y\'}'
        }
    ],
    calculationEngine: (inputs) => {
        const sx = Number(inputs.sigmaX.value);
        const sy = Number(inputs.sigmaY.value);
        const txy = Number(inputs.tauXY.value);
        const theta = Number(inputs.theta?.value || 0);

        const C = (sx + sy) / 2;
        const R = Math.sqrt(Math.pow((sx - sy) / 2, 2) + Math.pow(txy, 2));

        const s1 = C + R;
        const s2 = C - R;
        const tmax = R;

        let thetaRad = Math.atan2(2 * txy, sx - sy) / 2;
        let thetaP = (thetaRad * 180) / Math.PI;

        const thetaRotRad = (theta * Math.PI) / 180;
        const sx_rot = C + ((sx - sy) / 2) * Math.cos(2 * thetaRotRad) + txy * Math.sin(2 * thetaRotRad);
        const sy_rot = C - ((sx - sy) / 2) * Math.cos(2 * thetaRotRad) - txy * Math.sin(2 * thetaRotRad);
        const txy_rot = -((sx - sy) / 2) * Math.sin(2 * thetaRotRad) + txy * Math.cos(2 * thetaRotRad);

        return {
            outputs: {
                sigma1: createValidatedValue(s1, 'MPa' as any, 'derived'),
                sigma2: createValidatedValue(s2, 'MPa' as any, 'derived'),
                tauMax: createValidatedValue(tmax, 'MPa' as any, 'derived'),
                sigmaAvg: createValidatedValue(C, 'MPa' as any, 'derived'),
                thetaP: createValidatedValue(thetaP, 'deg' as any, 'derived'),
                sigmaX_rot: createValidatedValue(sx_rot, 'MPa' as any, 'derived'),
                sigmaY_rot: createValidatedValue(sy_rot, 'MPa' as any, 'derived'),
                tauXY_rot: createValidatedValue(txy_rot, 'MPa' as any, 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: CalculationResult, inputs: Record<string, any>) => {
            if (!result || !result.outputs) return null;

            const s1 = Number(result.outputs.sigma1.value);
            const s2 = Number(result.outputs.sigma2.value);
            const tmax = Number(result.outputs.tauMax.value);
            const C = Number(result.outputs.sigmaAvg.value);
            const sx = Number(inputs.sigmaX?.value || 0);
            const sy = Number(inputs.sigmaY?.value || 0);
            const txy = Number(inputs.tauXY?.value || 0);
            const theta = Number(inputs.theta?.value || 0);

            const sx_rot = Number(result.outputs.sigmaX_rot.value);
            const txy_rot = Number(result.outputs.tauXY_rot.value);
            const sy_rot = Number(result.outputs.sigmaY_rot.value);

            // Mohr's Circle Scaling
            const maxStress = Math.max(Math.abs(s1), Math.abs(s2), Math.abs(tmax));
            const viewRadius = maxStress * 1.5 || 20;

            const w = 400; const h = 400;
            const cx = 200; const cy = 200;
            const scale = (w / 2) / viewRadius * 0.8;

            const mapX = (val: number) => cx + val * scale;
            const mapY = (val: number) => cy - val * scale; // Standard Mechanics: +Shear down on graph sometimes, but let's use +Up for standard math

            const r_px = tmax * scale;
            const c_px = mapX(C);

            const sx_px = mapX(sx);
            const txy_px = mapY(txy);
            const sy_px = mapX(sy);
            const tyx_px = mapY(-txy);

            const rot_xs_px = mapX(sx_rot);
            const rot_yt_px = mapY(txy_rot);

            // Element Drawing
            const elSize = 60;
            const Arrow = ({ x, y, angle, label, color, isPulling }: any) => {
                const len = 30;
                const endX = x + Math.cos(angle) * (isPulling ? len : -len);
                const endY = y - Math.sin(angle) * (isPulling ? len : -len); // SVG Y is down
                const headLen = 6;
                const aDir = Math.atan2(endY - y, endX - x);
                const h1X = endX - headLen * Math.cos(aDir - Math.PI / 6);
                const h1Y = endY - headLen * Math.sin(aDir - Math.PI / 6);
                const h2X = endX - headLen * Math.cos(aDir + Math.PI / 6);
                const h2Y = endY - headLen * Math.sin(aDir + Math.PI / 6);

                return (
                    <g>
                        <line x1={x} y1={y} x2={endX} y2={endY} stroke={color} strokeWidth="2" />
                        <line x1={endX} y1={endY} x2={h1X} y2={h1Y} stroke={color} strokeWidth="2" />
                        <line x1={endX} y1={endY} x2={h2X} y2={h2Y} stroke={color} strokeWidth="2" />
                        <text x={endX + Math.cos(angle) * 10} y={endY - Math.sin(angle) * 10} fill={color} fontSize="10" textAnchor="middle">{label}</text>
                    </g>
                );
            };

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    <div className="flex gap-4 w-full justify-between items-center mb-4">
                        <div className="flex-1 bg-black/40 rounded p-2 text-cyan-400 font-mono text-xs border border-cyan-900/30 shadow-inner">
                            <div>σ₁: {s1.toFixed(1)} MPa</div>
                            <div>σ₂: {s2.toFixed(1)} MPa</div>
                            <div>τ_max: {tmax.toFixed(1)} MPa</div>
                        </div>
                        <div className="flex-1 bg-black/40 rounded p-2 text-fuchsia-400 font-mono text-xs border border-fuchsia-900/30 shadow-inner text-right">
                            <div>σx': {sx_rot.toFixed(1)} MPa</div>
                            <div>σy': {sy_rot.toFixed(1)} MPa</div>
                            <div>τx'y': {txy_rot.toFixed(1)} MPa</div>
                        </div>
                    </div>

                    <div className="flex flex-row w-full max-h-[400px]">
                        {/* Mohr Circle */}
                        <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 h-full drop-shadow-2xl font-mono border-r border-slate-800">
                            {/* Axes */}
                            <line x1="0" y1={cy} x2={w} y2={cy} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1={cx} y1="0" x2={cx} y2={h} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                            {/* Circle */}
                            <circle cx={c_px} cy={cy} r={r_px} fill="rgba(0, 229, 255, 0.05)" stroke="#0ea5e9" strokeWidth="2" />

                            {/* Original State Line */}
                            <line x1={sx_px} y1={txy_px} x2={sy_px} y2={tyx_px} stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 5" />
                            <circle cx={sx_px} cy={txy_px} r="4" fill="#fbbf24" />
                            <text x={sx_px + 8} y={txy_px} fill="#fbbf24" fontSize="10">X(σx, τxy)</text>

                            <circle cx={sy_px} cy={tyx_px} r="4" fill="#60a5fa" />
                            <text x={sy_px + 8} y={tyx_px} fill="#60a5fa" fontSize="10">Y(σy, -τxy)</text>

                            {/* Rotated State Line */}
                            {theta !== 0 && (
                                <>
                                    <line x1={rot_xs_px} y1={rot_yt_px} x2={mapX(sy_rot)} y2={mapY(-txy_rot)} stroke="#d946ef" strokeWidth="2" />
                                    <circle cx={rot_xs_px} cy={rot_yt_px} r="5" fill="#d946ef" />
                                    <text x={rot_xs_px + 8} y={rot_yt_px - 8} fill="#d946ef" fontSize="10">Rotated X'</text>
                                </>
                            )}

                            {/* Principals */}
                            <circle cx={mapX(s1)} cy={cy} r="4" fill="#22c55e" />
                            <text x={mapX(s1) + 6} y={cy - 6} fill="#22c55e" fontSize="12" fontWeight="bold">σ₁</text>

                            <circle cx={mapX(s2)} cy={cy} r="4" fill="#22c55e" />
                            <text x={mapX(s2) - 18} y={cy - 6} fill="#22c55e" fontSize="12" fontWeight="bold">σ₂</text>

                            {/* Center */}
                            <circle cx={c_px} cy={cy} r="3" fill="#ffffff" />
                        </svg>

                        {/* Stressed Element */}
                        <svg viewBox="-80 -80 160 160" className="w-[180px] h-full drop-shadow-xl ml-2">
                            {/* Base Reference Axes */}
                            <line x1="-70" y1="0" x2="70" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1="0" y1="-70" x2="0" y2="70" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

                            <g transform={`rotate(${-theta})`}>
                                {/* Square */}
                                <rect x={-elSize / 2} y={-elSize / 2} width={elSize} height={elSize} fill="rgba(217, 70, 239, 0.1)" stroke="#d946ef" strokeWidth="2" />

                                {/* Normal Stresses */}
                                <Arrow x={elSize / 2} y={0} angle={0} label={`${sx_rot.toFixed(1)}`} color="#d946ef" isPulling={sx_rot >= 0} />
                                <Arrow x={-elSize / 2} y={0} angle={Math.PI} label="" color="#d946ef" isPulling={sx_rot >= 0} />

                                <Arrow x={0} y={-elSize / 2} angle={Math.PI / 2} label={`${sy_rot.toFixed(1)}`} color="#60a5fa" isPulling={sy_rot >= 0} />
                                <Arrow x={0} y={elSize / 2} angle={-Math.PI / 2} label="" color="#60a5fa" isPulling={sy_rot >= 0} />

                                {/* Shear Stresses (Simplified arrows on corners) */}
                                {txy_rot !== 0 && (
                                    <>
                                        {/* Right edge */}
                                        <path d={`M ${elSize / 2 + 5} ${txy_rot > 0 ? elSize / 4 : -elSize / 4} L ${elSize / 2 + 5} ${txy_rot > 0 ? -elSize / 4 : elSize / 4}`} stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                        {/* Top edge */}
                                        <path d={`M ${txy_rot > 0 ? -elSize / 4 : elSize / 4} ${-elSize / 2 - 5} L ${txy_rot > 0 ? elSize / 4 : -elSize / 4} ${-elSize / 2 - 5}`} stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                    </>
                                )}
                            </g>

                            {/* Defs for arrowheads */}
                            <defs>
                                <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="2" refY="2.5" orient="auto">
                                    <polygon points="0 0, 5 2.5, 0 5" fill="#fbbf24" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default mohrsCircleSchema;
