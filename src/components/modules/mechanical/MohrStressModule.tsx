'use client';

import { useState, useMemo } from 'react';

// Mohr's Circle Stress Analysis — Production-grade
export default function MohrStressModule() {
    const [sigmaX, setSigmaX] = useState(100); // MPa
    const [sigmaY, setSigmaY] = useState(40);  // MPa
    const [tauXY, setTauXY] = useState(30);    // MPa
    const [angle, setAngle] = useState(0);      // degrees — rotation angle

    const results = useMemo(() => {
        const sigmaAvg = (sigmaX + sigmaY) / 2;
        const R = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));

        const sigma1 = sigmaAvg + R;
        const sigma2 = sigmaAvg - R;
        const tauMax = R;

        // Principal angle (degrees)
        const theta_p = (Math.atan2(2 * tauXY, sigmaX - sigmaY) / 2) * (180 / Math.PI);

        // Von Mises equivalent stress (plane stress)
        const vonMises = Math.sqrt(sigma1 * sigma1 - sigma1 * sigma2 + sigma2 * sigma2);

        // Stress at user-defined angle
        const thetaRad = angle * Math.PI / 180;
        const sigma_n = sigmaAvg + ((sigmaX - sigmaY) / 2) * Math.cos(2 * thetaRad) + tauXY * Math.sin(2 * thetaRad);
        const tau_n = -((sigmaX - sigmaY) / 2) * Math.sin(2 * thetaRad) + tauXY * Math.cos(2 * thetaRad);

        return { sigmaAvg, R, sigma1, sigma2, tauMax, theta_p, vonMises, sigma_n, tau_n };
    }, [sigmaX, sigmaY, tauXY, angle]);

    // SVG Mohr's Circle — dark theme, properly scaled
    const svgW = 280;
    const svgH = 200;
    const cx = svgW / 2;
    const cy = svgH / 2;

    // Auto-scale
    const maxVal = Math.max(Math.abs(results.sigma1), Math.abs(results.sigma2), results.tauMax, 1);
    const scale = (svgH * 0.35) / maxVal;

    const circleCx = cx + results.sigmaAvg * scale;
    const circleR = results.R * scale;

    // Point on circle at current angle
    const thetaRad = angle * Math.PI / 180;
    const pointX = circleCx + circleR * Math.cos(2 * thetaRad);
    const pointY = cy - circleR * Math.sin(2 * thetaRad);

    // Principal stress point positions
    const p1x = cx + results.sigma1 * scale;
    const p2x = cx + results.sigma2 * scale;

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Inputs */}
            <div className="grid grid-cols-3 gap-2">
                <InputField label="σx (MPa)" value={sigmaX} onChange={setSigmaX} color="#06b6d4" />
                <InputField label="σy (MPa)" value={sigmaY} onChange={setSigmaY} color="#f59e0b" />
                <InputField label="τxy (MPa)" value={tauXY} onChange={setTauXY} color="#ef4444" />
            </div>

            {/* Angle Slider */}
            <div className="flex items-center gap-2 px-1">
                <span className="text-[8px] text-gray-500 font-bold uppercase w-8">θ</span>
                <input
                    type="range" min={-90} max={90} value={angle}
                    onChange={e => setAngle(Number(e.target.value))}
                    className="flex-1 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-cyan-500"
                />
                <span className="text-[10px] font-mono text-cyan-400 w-10 text-right">{angle}°</span>
            </div>

            {/* Mohr's Circle SVG */}
            <div className="flex-1 rounded-xl flex items-center justify-center bg-[#05070a] border border-white/5 overflow-hidden">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-52">
                    {/* Grid Lines */}
                    <line x1="10" y1={cy} x2={svgW - 10} y2={cy} stroke="#1e293b" strokeWidth="0.5" />
                    <line x1={cx} y1="10" x2={cx} y2={svgH - 10} stroke="#1e293b" strokeWidth="0.5" />

                    {/* Axis labels */}
                    <text x={svgW - 14} y={cy - 6} fontSize="8" fill="#64748b" fontFamily="monospace">σ</text>
                    <text x={cx + 5} y="14" fontSize="8" fill="#64748b" fontFamily="monospace">τ</text>

                    {/* Origin tick marks */}
                    {[-3, -2, -1, 1, 2, 3].map(i => {
                        const t = i * maxVal / 3;
                        const px = cx + t * scale;
                        if (px < 15 || px > svgW - 15) return null;
                        return (
                            <g key={`tx-${i}`}>
                                <line x1={px} y1={cy - 2} x2={px} y2={cy + 2} stroke="#334155" strokeWidth="0.5" />
                                <text x={px} y={cy + 10} fontSize="6" fill="#475569" textAnchor="middle" fontFamily="monospace">
                                    {Math.round(t)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Circle */}
                    <circle
                        cx={circleCx} cy={cy} r={circleR}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        opacity="0.8"
                    />

                    {/* Circle fill */}
                    <circle cx={circleCx} cy={cy} r={circleR} fill="#06b6d4" opacity="0.04" />

                    {/* Diameter line — from (σx, τxy) to (σy, -τxy) */}
                    <line
                        x1={cx + sigmaX * scale} y1={cy - tauXY * scale}
                        x2={cx + sigmaY * scale} y2={cy + tauXY * scale}
                        stroke="#475569" strokeWidth="0.5" strokeDasharray="3,2"
                    />

                    {/* Center point */}
                    <circle cx={circleCx} cy={cy} r="2.5" fill="#06b6d4" />
                    <text x={circleCx} y={cy + 14} fontSize="6" fill="#06b6d4" textAnchor="middle" fontFamily="monospace">
                        C={results.sigmaAvg.toFixed(0)}
                    </text>

                    {/* Principal stress points */}
                    <circle cx={p1x} cy={cy} r="4" fill="#22c55e" />
                    <text x={p1x} y={cy - 8} fontSize="7" fill="#22c55e" textAnchor="middle" fontWeight="bold" fontFamily="monospace">σ₁</text>

                    <circle cx={p2x} cy={cy} r="4" fill="#f59e0b" />
                    <text x={p2x} y={cy - 8} fontSize="7" fill="#f59e0b" textAnchor="middle" fontWeight="bold" fontFamily="monospace">σ₂</text>

                    {/* Max shear points */}
                    <circle cx={circleCx} cy={cy - circleR} r="3" fill="#ef4444" />
                    <text x={circleCx + 10} y={cy - circleR + 3} fontSize="6" fill="#ef4444" fontFamily="monospace">τmax</text>

                    {/* Current angle point */}
                    <line x1={circleCx} y1={cy} x2={pointX} y2={pointY} stroke="#a78bfa" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx={pointX} cy={pointY} r="4" fill="#a78bfa" stroke="#0a0e14" strokeWidth="1.5" />
                    <text x={pointX + 8} y={pointY + 3} fontSize="6" fill="#a78bfa" fontFamily="monospace">
                        θ={angle}°
                    </text>
                </svg>
            </div>

            {/* Stress at current angle */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <ResultBlock label={`σ_n at θ=${angle}°`} value={`${results.sigma_n.toFixed(1)} MPa`} color="#a78bfa" />
                <ResultBlock label={`τ_n at θ=${angle}°`} value={`${results.tau_n.toFixed(1)} MPa`} color="#a78bfa" />
            </div>

            {/* Results */}
            <div className="grid grid-cols-3 gap-2">
                <ResultBlock label="σ₁ Principal" value={`${results.sigma1.toFixed(1)}`} color="#22c55e" />
                <ResultBlock label="σ₂ Principal" value={`${results.sigma2.toFixed(1)}`} color="#f59e0b" />
                <ResultBlock label="τ_max Shear" value={`${results.tauMax.toFixed(1)}`} color="#ef4444" />
                <ResultBlock label="θp Angle" value={`${results.theta_p.toFixed(1)}°`} color="#06b6d4" />
                <ResultBlock label="σ_avg Center" value={`${results.sigmaAvg.toFixed(1)}`} color="#64748b" />
                <ResultBlock label="σ_vm Von Mises" value={`${results.vonMises.toFixed(1)}`} color="#06b6d4" />
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color?: string }) {
    return (
        <div>
            <label className="block text-[8px] font-bold uppercase mb-1 tracking-widest" style={{ color: color || '#64748b' }}>{label}</label>
            <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg text-xs font-mono text-center bg-[#05070a] text-white border border-white/10 outline-none focus:border-cyan-500/30 transition-colors"
            />
        </div>
    );
}

function ResultBlock({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="px-2 py-1.5 rounded-lg text-center bg-white/[0.02] border border-white/5">
            <div className="text-[8px] uppercase font-bold tracking-widest text-gray-500">{label}</div>
            <div className="font-mono font-black text-sm" style={{ color: color || '#e2e8f0' }}>{value}</div>
        </div>
    );
}
