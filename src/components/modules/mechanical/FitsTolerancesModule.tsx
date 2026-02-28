'use client';

import { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

// ISO 286 Hole Basis Fits
const FITS = {
    'H7/g6': { desc: 'Close Running', holeMin: 0, holeMax: 21, shaftMin: -7, shaftMax: -28 },
    'H7/h6': { desc: 'Sliding', holeMin: 0, holeMax: 21, shaftMin: 0, shaftMax: -13 },
    'H7/k6': { desc: 'Location Transition', holeMin: 0, holeMax: 21, shaftMin: 15, shaftMax: 2 },
    'H7/n6': { desc: 'Light Press', holeMin: 0, holeMax: 21, shaftMin: 28, shaftMax: 15 },
    'H7/p6': { desc: 'Press Fit', holeMin: 0, holeMax: 21, shaftMin: 35, shaftMax: 22 },
    'H7/s6': { desc: 'Heavy Press', holeMin: 0, holeMax: 21, shaftMin: 48, shaftMax: 35 },
    'H8/f7': { desc: 'Loose Running', holeMin: 0, holeMax: 33, shaftMin: -20, shaftMax: -41 },
    'H6/g5': { desc: 'Precision Sliding', holeMin: 0, holeMax: 13, shaftMin: -7, shaftMax: -16 },
} as const;

type FitKey = keyof typeof FITS;

/**
 * FitsTolerancesModule - ISO 286 Hole/Shaft fits calculator
 */
export default function FitsTolerancesModule() {
    const [nominalDia, setNominalDia] = useState(25); // mm
    const [selectedFit, setSelectedFit] = useState<FitKey>('H7/h6');

    const fit = FITS[selectedFit];

    const results = useMemo(() => {
        // Scale tolerances based on diameter (simplified for demo)
        // Real ISO 286 uses table lookups based on diameter ranges
        const scale = nominalDia > 50 ? 1.5 : nominalDia > 18 ? 1 : nominalDia > 10 ? 0.8 : 0.7;

        const holeMax = nominalDia + (fit.holeMax * scale) / 1000;
        const holeMin = nominalDia + (fit.holeMin * scale) / 1000;
        const shaftMax = nominalDia + (fit.shaftMax * scale) / 1000;
        const shaftMin = nominalDia + (fit.shaftMin * scale) / 1000;

        // Clearance/Interference
        const maxClearance = holeMax - shaftMin;
        const minClearance = holeMin - shaftMax;

        const fitType = minClearance >= 0 ? 'Clearance' : maxClearance <= 0 ? 'Interference' : 'Transition';

        return {
            holeMax, holeMin, shaftMax, shaftMin,
            holeTol: holeMax - holeMin,
            shaftTol: shaftMax - shaftMin,
            maxClearance, minClearance, fitType,
        };
    }, [nominalDia, selectedFit, fit]);

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Nominal Diameter */}
            <div>
                <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Nominal Diameter (mm)
                    <InfoTooltip text="Basic size of the hole/shaft. Standard tolerance grades depend on this dimension." />
                </label>
                <input
                    type="number"
                    value={nominalDia}
                    onChange={e => setNominalDia(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded text-lg font-mono font-bold text-center"
                    style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-accent)', border: '1px solid var(--color-os-border)' }}
                />
            </div>

            {/* Fit Selection */}
            <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[120px] custom-scrollbar">
                {(Object.keys(FITS) as FitKey[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setSelectedFit(f)}
                        className="py-2 px-2 rounded text-xs transition-all text-left flex flex-col"
                        style={{
                            backgroundColor: selectedFit === f ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: selectedFit === f ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        <span className="font-mono font-bold">{f}</span>
                        <span className="text-[9px] opacity-80">{FITS[f].desc}</span>
                    </button>
                ))}
            </div>

            {/* Dynamic Tolerance Visualization */}
            <div className="rounded-lg p-1 flex justify-center" style={{ backgroundColor: 'var(--color-os-canvas)' }}>
                <FitsSVG
                    holeMax={results.holeMax} holeMin={results.holeMin}
                    shaftMax={results.shaftMax} shaftMin={results.shaftMin}
                    nominal={nominalDia}
                />
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-os-header)', borderLeft: '3px solid var(--color-os-accent)' }}>
                    <div className="font-bold mb-1" style={{ color: 'var(--color-os-accent)' }}>Hole (H)</div>
                    <div className="flex justify-between"><span>Max:</span><span className="font-mono">{results.holeMax.toFixed(3)} mm</span></div>
                    <div className="flex justify-between"><span>Min:</span><span className="font-mono">{results.holeMin.toFixed(3)} mm</span></div>
                    <div className="flex justify-between"><span>Tol:</span><span className="font-mono">{(results.holeTol * 1000).toFixed(1)} μm</span></div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-os-header)', borderLeft: '3px solid var(--color-os-warning)' }}>
                    <div className="font-bold mb-1" style={{ color: 'var(--color-os-warning)' }}>Shaft</div>
                    <div className="flex justify-between"><span>Max:</span><span className="font-mono">{results.shaftMax.toFixed(3)} mm</span></div>
                    <div className="flex justify-between"><span>Min:</span><span className="font-mono">{results.shaftMin.toFixed(3)} mm</span></div>
                    <div className="flex justify-between"><span>Tol:</span><span className="font-mono">{(results.shaftTol * 1000).toFixed(1)} μm</span></div>
                </div>
            </div>

            {/* Clearance/Interference */}
            <div
                className="p-3 rounded-lg text-center"
                style={{
                    backgroundColor: 'var(--color-os-header)',
                    border: `1px solid ${results.fitType === 'Clearance' ? 'var(--color-os-success)' : results.fitType === 'Interference' ? 'var(--color-os-danger)' : 'var(--color-os-warning)'}`
                }}
            >
                <div className="text-[10px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>{results.fitType} Fit</div>
                <div className="font-mono text-sm">
                    {results.minClearance >= 0 ? '+' : ''}{(results.minClearance * 1000).toFixed(1)} ~ {results.maxClearance >= 0 ? '+' : ''}{(results.maxClearance * 1000).toFixed(1)} μm
                </div>
            </div>
        </div>
    );
}

// Dynamic Fits & Tolerances Visualization
function FitsSVG({ holeMax, holeMin, shaftMax, shaftMin, nominal }: { holeMax: number; holeMin: number; shaftMax: number; shaftMin: number; nominal: number }) {
    // Visualization logic:
    // Zero line at Y=50
    const zeroY = 40;

    // Calculate deviations in microns
    const hMaxDev = (holeMax - nominal) * 1000;
    const hMinDev = (holeMin - nominal) * 1000;
    const sMaxDev = (shaftMax - nominal) * 1000;
    const sMinDev = (shaftMin - nominal) * 1000;

    // Auto-scale to fit roughly +/- 50 microns in view, or whatever the max deviation is
    const validMaxDev = Math.max(
        Number.isFinite(hMaxDev) ? Math.abs(hMaxDev) : 0,
        Number.isFinite(sMaxDev) ? Math.abs(sMaxDev) : 0,
        Number.isFinite(hMinDev) ? Math.abs(hMinDev) : 0,
        Number.isFinite(sMinDev) ? Math.abs(sMinDev) : 0,
        10
    );

    const scaleY = 30 / validMaxDev;

    // Safety fallback for rendering rects
    const safeHMax = Number.isFinite(hMaxDev) ? hMaxDev : 0;
    const safeHMin = Number.isFinite(hMinDev) ? hMinDev : 0;
    const safeSMax = Number.isFinite(sMaxDev) ? sMaxDev : 0;
    const safeSMin = Number.isFinite(sMinDev) ? sMinDev : 0;

    return (
        <svg viewBox="0 0 200 80" className="w-full h-20">
            {/* Zero Line */}
            <line x1="0" y1={zeroY} x2="200" y2={zeroY} stroke="var(--color-os-text-primary)" strokeWidth="1" strokeDasharray="4 2" />
            <text x="5" y={zeroY - 2} fontSize="9" fill="var(--color-os-text-primary)" fontWeight="bold">0 (Nominal)</text>

            {/* Hole Zone (Left) */}
            <g transform="translate(40, 0)">
                <rect
                    x="0"
                    y={zeroY - hMaxDev * scaleY}
                    width="50"
                    height={(hMaxDev - hMinDev) * scaleY}
                    fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1"
                />
                <text x="25" y={zeroY + (hMaxDev > 0 ? -hMaxDev * scaleY - 5 : 10)} textAnchor="middle" fontSize="8" fill="var(--color-os-accent)">Hole</text>

                {/* Limits */}
                <text x="55" y={zeroY - hMaxDev * scaleY + 3} fontSize="7" fill="var(--color-os-text-secondary)">+{hMaxDev.toFixed(0)}</text>
                <text x="55" y={zeroY - hMinDev * scaleY + 3} fontSize="7" fill="var(--color-os-text-secondary)">{hMinDev > 0 ? '+' : ''}{hMinDev.toFixed(0)}</text>
            </g>

            {/* Shaft Zone (Right) */}
            <g transform="translate(110, 0)">
                <rect
                    x="0"
                    y={zeroY - sMaxDev * scaleY}
                    width="50"
                    height={(sMaxDev - sMinDev) * scaleY}
                    fill="var(--color-os-warning)" fillOpacity="0.4" stroke="var(--color-os-warning)" strokeWidth="1"
                />
                <text x="25" y={zeroY + (sMaxDev > 0 ? -sMaxDev * scaleY - 5 : 10)} textAnchor="middle" fontSize="8" fill="var(--color-os-warning)">Shaft</text>

                {/* Limits */}
                <text x="55" y={zeroY - sMaxDev * scaleY + 3} fontSize="7" fill="var(--color-os-text-secondary)">{sMaxDev > 0 ? '+' : ''}{sMaxDev.toFixed(0)}</text>
                <text x="55" y={zeroY - sMinDev * scaleY + 3} fontSize="7" fill="var(--color-os-text-secondary)">{sMinDev.toFixed(0)}</text>
            </g>

            {/* Connecting Lines for Fit Visualization */}
            <line x1="90" y1={zeroY - hMinDev * scaleY} x2="110" y2={zeroY - hMinDev * scaleY} stroke="var(--color-os-border)" strokeWidth="0.5" strokeDasharray="2" />
            <line x1="90" y1={zeroY - hMaxDev * scaleY} x2="110" y2={zeroY - hMaxDev * scaleY} stroke="var(--color-os-border)" strokeWidth="0.5" strokeDasharray="2" />
        </svg>
    );
}
