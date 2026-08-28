'use client';

import React from 'react';
import type { BearingType } from '@/data/skfBearings';

export function BearingBlueprint({
    type,
    code,
    d,
    D,
    B,
    rpm = 0,
    fr = 0,
    fa = 0,
}: {
    type: BearingType;
    code: string;
    d: number;
    D: number;
    B: number;
    rpm?: number;
    fr?: number;
    fa?: number;
}) {
    const isRoller = type.includes('roller') && !type.includes('ball');
    const isNeedle = type === 'needle-roller';
    const isTaper = type === 'tapered-roller';
    const isThrust = type.startsWith('thrust');
    const nBalls = isNeedle ? 16 : isRoller ? 10 : 8;
    const pitchR = 59;
    const elR = isNeedle ? 3.2 : isRoller ? 7 : 13;
    const dur = rpm > 0 ? Math.max((60 / rpm) * 8, 0.4) : 0;

    return (
        <svg viewBox="0 0 240 200" className="w-full h-full overflow-visible text-cyan-400 font-mono">
            <style>{`
                @keyframes bearingSpin { to { transform: rotate(360deg); } }
                @keyframes loadPulse { 0%,100% { opacity:.45 } 50% { opacity:1 } }
                @media (prefers-reduced-motion: reduce) {
                    .bearing-spin, .load-pulse { animation: none !important; }
                }
            `}</style>
            <rect width="240" height="200" fill="#050810" rx="8" />
            <text x="12" y="16" fontSize="8" fill="#64748b">{code} · {type.replace(/-/g, ' ')}</text>
            <text x="12" y="28" fontSize="8" fill="#94a3b8">{d}×{D}×{B} mm</text>

            <g transform="translate(20,0)">
                {/* Outer ring */}
                <circle cx="100" cy="108" r="78" fill="none" stroke="#00e5ff" strokeWidth="7" opacity="0.25" />
                <circle cx="100" cy="108" r="78" fill="none" stroke="#00e5ff" strokeWidth="2.2" />
                <circle cx="100" cy="108" r="66" fill="rgba(0,229,255,0.04)" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 2" />

                <g
                    className="bearing-spin"
                    style={dur ? { transformOrigin: '100px 108px', transformBox: 'view-box', animation: `bearingSpin ${dur}s linear infinite` } : undefined}
                >
                    <circle cx="100" cy="108" r={pitchR} fill="none" stroke="rgba(0,229,255,0.25)" strokeWidth="10" />
                    {Array.from({ length: nBalls }).map((_, i) => {
                        const a = (i / nBalls) * Math.PI * 2;
                        const x = 100 + pitchR * Math.cos(a);
                        const y = 108 + pitchR * Math.sin(a);
                        if (isNeedle) {
                            return <rect key={i} x={x - 1.4} y={y - 9} width="2.8" height="18" rx="1" fill="#67e8f9" stroke="#00e5ff" transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} />;
                        }
                        if (isTaper) {
                            return <polygon key={i} points={`${x},${y - 11} ${x + 6},${y + 9} ${x - 6},${y + 9}`} fill="#67e8f9" stroke="#00e5ff" transform={`rotate(${(a * 180) / Math.PI + 12} ${x} ${y})`} />;
                        }
                        if (isRoller) {
                            return <rect key={i} x={x - 4} y={y - 9} width="8" height="18" rx="2" fill="rgba(0,229,255,0.25)" stroke="#00e5ff" transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} />;
                        }
                        return (
                            <g key={i}>
                                <circle cx={x} cy={y} r={elR} fill="rgba(0,229,255,0.18)" stroke="#00e5ff" strokeWidth="1.4" />
                                <circle cx={x - 3} cy={y - 3} r="2.4" fill="#fff" opacity="0.35" />
                            </g>
                        );
                    })}
                </g>

                <g
                    className="bearing-spin"
                    style={dur ? { transformOrigin: '100px 108px', transformBox: 'view-box', animation: `bearingSpin ${Math.max(dur * 0.55, 0.25)}s linear infinite` } : undefined}
                >
                    <circle cx="100" cy="108" r={isThrust ? 38 : 34} fill="#040810" stroke="#00e5ff" strokeWidth="6" />
                    <circle cx="100" cy="108" r="22" fill="#050810" stroke="#67e8f9" strokeWidth="1.4" />
                    <rect x="97" y="80" width="6" height="6" fill="#00e5ff" opacity="0.7" />
                </g>
                <circle cx="100" cy="108" r="2.4" fill="#00e5ff" />
            </g>

            {/* Load arrows */}
            <g className="load-pulse" style={{ animation: 'loadPulse 1.6s ease-in-out infinite' }}>
                <line x1="210" y1="108" x2="228" y2="108" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#br-arrow)" />
                <text x="230" y="104" fontSize="8" fill="#f59e0b">Fr {Math.round(fr)}</text>
                {fa > 0 && (
                    <>
                        <line x1="120" y1="38" x2="120" y2="22" stroke="#a78bfa" strokeWidth="2" />
                        <text x="124" y="20" fontSize="8" fill="#a78bfa">Fa {Math.round(fa)}</text>
                    </>
                )}
            </g>
            <defs>
                <marker id="br-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
            </defs>
        </svg>
    );
}

export default BearingBlueprint;
