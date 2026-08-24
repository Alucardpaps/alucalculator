'use client';

/**
 * Mohr's Circle Visualization Component
 * 
 * Interactive SVG visualization showing:
 * - Mohr's circle with principal stress points
 * - Current stress state point
 * - Principal angle indicator
 * - Axis labels and grid
 */

import React from 'react';

interface MohrCircleProps {
    sigmaX: number;
    sigmaY: number;
    tauXY: number;
    className?: string;
}

export function MohrCircleVisualization({ sigmaX, sigmaY, tauXY, className = '' }: MohrCircleProps) {
    // Calculate Mohr's circle parameters
    const center = (sigmaX + sigmaY) / 2;
    const radius = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));

    const sigma1 = center + radius;
    const sigma2 = center - radius;
    const tauMax = radius;

    // Principal angle (degrees)
    const theta2p = Math.atan2(2 * tauXY, sigmaX - sigmaY);
    const thetaP = (theta2p / 2) * (180 / Math.PI);

    // SVG viewport setup - normalize to circle size
    const padding = 60;
    const maxStress = Math.max(Math.abs(sigma1), Math.abs(sigma2), Math.abs(tauMax), 1) * 1.3;
    const scale = 120 / maxStress;
    const viewSize = 300;
    const cx = viewSize / 2 + (center * scale);
    const cy = viewSize / 2;
    const r = radius * scale;

    // Points on circle
    const stateXPoint = {
        x: viewSize / 2 + sigmaX * scale,
        y: viewSize / 2 - tauXY * scale
    };
    const stateYPoint = {
        x: viewSize / 2 + sigmaY * scale,
        y: viewSize / 2 + tauXY * scale
    };

    return (
        <div className={`mohr-circle-viz ${className}`}>
            <svg
                viewBox={`0 0 ${viewSize} ${viewSize}`}
                width="100%"
                height="auto"
                style={{ maxHeight: '350px' }}
                className="bg-slate-900 rounded-xl"
            >
                <defs>
                    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
                    </linearGradient>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                </defs>

                {/* Grid lines */}
                <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3">
                    <line x1={padding} y1={cy} x2={viewSize - padding} y2={cy} />
                    <line x1={viewSize / 2} y1={padding} x2={viewSize / 2} y2={viewSize - padding} />
                </g>

                {/* Axes with arrows */}
                <g stroke="#64748b" strokeWidth="1.5">
                    <line x1={padding - 10} y1={cy} x2={viewSize - padding + 10} y2={cy} markerEnd="url(#arrowhead)" />
                    <line x1={viewSize / 2} y1={viewSize - padding + 10} x2={viewSize / 2} y2={padding - 10} markerEnd="url(#arrowhead)" />
                </g>

                {/* Axis labels */}
                <text x={viewSize - padding + 15} y={cy + 4} fill="#94a3b8" fontSize="12" fontWeight="bold">σ</text>
                <text x={viewSize / 2 + 8} y={padding - 15} fill="#94a3b8" fontSize="12" fontWeight="bold">τ</text>

                {/* Mohr's Circle */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="url(#circleGrad)"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                />

                {/* Center point */}
                <circle cx={cx} cy={cy} r="3" fill="#f59e0b" />
                <text x={cx} y={cy + 18} fill="#f59e0b" fontSize="9" textAnchor="middle">
                    σavg = {center.toFixed(0)}
                </text>

                {/* Principal stress σ1 point */}
                <circle cx={cx + r} cy={cy} r="5" fill="#10b981" stroke="#fff" strokeWidth="1" />
                <text x={cx + r} y={cy - 12} fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">
                    σ₁ = {sigma1.toFixed(1)}
                </text>

                {/* Principal stress σ2 point */}
                <circle cx={cx - r} cy={cy} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="1" />
                <text x={cx - r} y={cy - 12} fill="#3b82f6" fontSize="10" textAnchor="middle" fontWeight="bold">
                    σ₂ = {sigma2.toFixed(1)}
                </text>

                {/* Max shear point (top) */}
                <circle cx={cx} cy={cy - r} r="4" fill="#ef4444" stroke="#fff" strokeWidth="1" />
                <text x={cx + 15} y={cy - r} fill="#ef4444" fontSize="9" textAnchor="start">
                    τmax = {tauMax.toFixed(1)}
                </text>

                {/* Current state point X (σx, τxy) */}
                <circle cx={stateXPoint.x} cy={stateXPoint.y} r="5" fill="#fbbf24" stroke="#fff" strokeWidth="1" />
                <text x={stateXPoint.x + 8} y={stateXPoint.y - 8} fill="#fbbf24" fontSize="9">
                    X
                </text>

                {/* Current state point Y (σy, -τxy) */}
                <circle cx={stateYPoint.x} cy={stateYPoint.y} r="5" fill="#fb923c" stroke="#fff" strokeWidth="1" />
                <text x={stateYPoint.x + 8} y={stateYPoint.y + 12} fill="#fb923c" fontSize="9">
                    Y
                </text>

                {/* Line connecting X and Y through center */}
                <line
                    x1={stateXPoint.x} y1={stateXPoint.y}
                    x2={stateYPoint.x} y2={stateYPoint.y}
                    stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,2"
                />

                {/* Principal angle arc */}
                {r > 10 && (
                    <g>
                        <path
                            d={`M ${cx + 25} ${cy} A 25 25 0 0 ${tauXY >= 0 ? 0 : 1} ${cx + 25 * Math.cos(-theta2p)} ${cy + 25 * Math.sin(-theta2p)}`}
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="1.5"
                        />
                        <text
                            x={cx + 35}
                            y={cy - 5}
                            fill="#a855f7"
                            fontSize="9"
                        >
                            2θp = {(theta2p * 180 / Math.PI).toFixed(1)}°
                        </text>
                    </g>
                )}

                {/* Origin label */}
                <text x={viewSize / 2 + 8} y={cy + 15} fill="#64748b" fontSize="9">0</text>

            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-400">σ₁ (Max)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-slate-400">σ₂ (Min)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-slate-400">τmax</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span className="text-slate-400">State (X,Y)</span>
                </div>
            </div>
        </div>
    );
}

export default MohrCircleVisualization;
