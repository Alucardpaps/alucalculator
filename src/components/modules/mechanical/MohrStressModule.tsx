'use client';

import { useState, useMemo } from 'react';

// Mohr's Circle Stress Analysis
export default function MohrStressModule() {
    const [sigmaX, setSigmaX] = useState(100); // MPa
    const [sigmaY, setSigmaY] = useState(40); // MPa
    const [tauXY, setTauXY] = useState(30); // MPa

    const results = useMemo(() => {
        const sigmaAvg = (sigmaX + sigmaY) / 2;
        const R = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));

        const sigma1 = sigmaAvg + R; // Principal stress 1
        const sigma2 = sigmaAvg - R; // Principal stress 2
        const tauMax = R; // Maximum shear stress

        // Principal angle (degrees)
        const theta_p = (Math.atan2(2 * tauXY, sigmaX - sigmaY) / 2) * (180 / Math.PI);

        // Von Mises equivalent stress (plane stress)
        const vonMises = Math.sqrt(sigma1 * sigma1 - sigma1 * sigma2 + sigma2 * sigma2);

        return { sigmaAvg, R, sigma1, sigma2, tauMax, theta_p, vonMises };
    }, [sigmaX, sigmaY, tauXY]);

    // SVG Mohr's Circle
    const svgSize = 200;
    const center = svgSize / 2;
    const scale = 0.8; // Scale factor for circle

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Inputs */}
            <div className="grid grid-cols-3 gap-2">
                <InputField label="σx (MPa)" value={sigmaX} onChange={setSigmaX} />
                <InputField label="σy (MPa)" value={sigmaY} onChange={setSigmaY} />
                <InputField label="τxy (MPa)" value={tauXY} onChange={setTauXY} />
            </div>

            {/* Mohr's Circle SVG */}
            <div className="flex-1 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-os-canvas)' }}>
                <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-full max-h-48">
                    {/* Grid */}
                    <line x1="10" y1={center} x2={svgSize - 10} y2={center} stroke="var(--color-os-border)" strokeWidth="0.5" />
                    <line x1={center} y1="10" x2={center} y2={svgSize - 10} stroke="var(--color-os-border)" strokeWidth="0.5" />

                    {/* Axis labels */}
                    <text x={svgSize - 15} y={center - 5} fontSize="8" fill="var(--color-os-text-secondary)">σ</text>
                    <text x={center + 5} y="15" fontSize="8" fill="var(--color-os-text-secondary)">τ</text>

                    {/* Circle */}
                    <circle
                        cx={center + results.sigmaAvg * scale * 0.5}
                        cy={center}
                        r={results.R * scale * 0.5}
                        fill="none"
                        stroke="var(--color-os-accent)"
                        strokeWidth="2"
                    />

                    {/* Center point */}
                    <circle
                        cx={center + results.sigmaAvg * scale * 0.5}
                        cy={center}
                        r="3"
                        fill="var(--color-os-accent)"
                    />

                    {/* Principal stress points */}
                    <circle
                        cx={center + results.sigma1 * scale * 0.5}
                        cy={center}
                        r="4"
                        fill="var(--color-os-success)"
                    />
                    <circle
                        cx={center + results.sigma2 * scale * 0.5}
                        cy={center}
                        r="4"
                        fill="var(--color-os-warning)"
                    />

                    {/* Max shear point */}
                    <circle
                        cx={center + results.sigmaAvg * scale * 0.5}
                        cy={center - results.tauMax * scale * 0.5}
                        r="4"
                        fill="var(--color-os-danger)"
                    />

                    {/* Labels */}
                    <text x={center + results.sigma1 * scale * 0.5} y={center + 15} fontSize="7" fill="var(--color-os-success)" textAnchor="middle">σ₁</text>
                    <text x={center + results.sigma2 * scale * 0.5} y={center + 15} fontSize="7" fill="var(--color-os-warning)" textAnchor="middle">σ₂</text>
                </svg>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-2">
                <ResultBlock label="σ₁ (Principal)" value={`${results.sigma1.toFixed(1)} MPa`} color="var(--color-os-success)" />
                <ResultBlock label="σ₂ (Principal)" value={`${results.sigma2.toFixed(1)} MPa`} color="var(--color-os-warning)" />
                <ResultBlock label="τ_max (Shear)" value={`${results.tauMax.toFixed(1)} MPa`} color="var(--color-os-danger)" />
                <ResultBlock label="θp (Angle)" value={`${results.theta_p.toFixed(1)}°`} />
                <ResultBlock label="σ_avg (Center)" value={`${results.sigmaAvg.toFixed(1)} MPa`} />
                <ResultBlock label="σ_vm (Von Mises)" value={`${results.vonMises.toFixed(1)} MPa`} color="var(--color-os-accent)" />
            </div>
        </div>
    );
}

function InputField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</label>
            <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded text-xs font-mono text-center"
                style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
            />
        </div>
    );
}

function ResultBlock({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="px-2 py-1.5 rounded text-center" style={{ backgroundColor: 'var(--color-os-header)' }}>
            <div className="text-[9px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</div>
            <div className="font-mono font-bold text-sm" style={{ color: color || 'var(--color-os-text-primary)' }}>{value}</div>
        </div>
    );
}
