'use client';

import React from 'react';

export interface ThreadVisualizerProps {
    type: 'M' | 'W' | 'G' | 'Tr' | 'Rd' | 'S' | 'UNC' | 'UNF' | 'Other';
    pitch: number;
    angle?: number;
    height?: number;
}

/**
 * ThreadVisualizer - Generates proper thread profile geometry SVG
 * Based on ISO/DIN standards for various thread types.
 */
export const ThreadVisualizer: React.FC<ThreadVisualizerProps> = ({
    type,
    pitch = 1.5,
    angle = 60,
    height = 200
}) => {
    const p = 100; // Base visual pitch width for SVG scaling
    const w_box = 400;
    const h_box = height;

    // Cyber-Industrial Hatch Pattern
    const hatchPattern = (
        <pattern id="hatchThread" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1" />
        </pattern>
    );

    let points = "";
    let label = `${angle}°`;

    // 1. Calculate Profile Points based on Type
    // Coordinate system: 0,0 is top-left. 
    // y=50 is the "Thread Crest" line (Top of material)
    const y_crest = 50;

    // Type Normalization
    const normType = (type?.includes('UN') || type === 'M') ? 'M' : type;

    if (normType === 'M') {
        // Metric / Unified: 60 deg, flattened crests/roots
        // H = 0.866025 P
        const H = p * 0.866025;
        const h_actual = H;
        const flat = p / 8;

        // Triangle wave
        points = `
            M0,${h_box} 
            L0,${y_crest} 
            L${p / 2 - flat},${y_crest + h_actual - flat} 
            L${p / 2 + flat},${y_crest + h_actual - flat} 
            L${p},${y_crest} 
            L${1.5 * p - flat},${y_crest + h_actual - flat}
            L${1.5 * p + flat},${y_crest + h_actual - flat}
            L${2 * p},${y_crest}
            L${2.5 * p},${y_crest + h_actual}
            L${2.5 * p},${h_box} 
            Z
        `;
    } else if (['W', 'G'].includes(normType)) {
        // Whitworth / Pipe: 55 deg, rounded crests/roots
        const h_thread = p * 0.96;
        points = `
            M0,${h_box} 
            L0,${y_crest} 
            Q${p / 4},${y_crest + h_thread / 2} ${p / 2},${y_crest + h_thread} 
            Q${3 * p / 4},${y_crest + h_thread / 2} ${p},${y_crest} 
            Q${1.25 * p},${y_crest + h_thread / 2} ${1.5 * p},${y_crest + h_thread} 
            L${2 * p},${y_crest} 
            L${2 * p},${h_box} 
            Z
        `;
        label = "55°";
    } else if (normType === 'Tr') {
        // Trapezoidal: 30 deg
        const h_thread = p * 0.5;
        const top = p * 0.366;
        const slope = (p - top) / 2;
        points = `
            M0,${h_box} 
            L0,${y_crest} 
            L${slope / 2},${y_crest + h_thread} 
            L${slope / 2 + top},${y_crest + h_thread} 
            L${p},${y_crest} 
            L${p + slope / 2},${y_crest + h_thread} 
            L${p + slope / 2 + top},${y_crest + h_thread} 
            L${2 * p},${y_crest} 
            L${2 * p},${h_box} 
            Z
        `;
        label = "30°";
    } else if (normType === 'Rd') {
        // Round (Knuckle)
        const h_thread = p * 0.5;
        points = `
            M0,${h_box} 
            L0,${y_crest} 
            Q${p / 2},${y_crest + h_thread * 1.8} ${p},${y_crest} 
            Q${1.5 * p},${y_crest + h_thread * 1.8} ${2 * p},${y_crest} 
            L${2 * p},${h_box} 
            Z
        `;
        label = "30° (Rd)";
    } else if (normType === 'S') {
        // Sawtooth (Buttress)
        const h_thread = p * 0.75;
        const x_top = h_thread * Math.tan(3 * Math.PI / 180);
        const x_slope = h_thread * Math.tan(30 * Math.PI / 180);
        points = `
            M0,${h_box} 
            L0,${y_crest} 
            L${x_top},${y_crest + h_thread} 
            L${p - x_slope},${y_crest + h_thread} 
            L${p},${y_crest} 
            L${p + x_top},${y_crest + h_thread} 
            L${2 * p - x_slope},${y_crest + h_thread} 
            L${2 * p},${y_crest} 
            L${2 * p},${h_box} 
            Z
        `;
        label = "33° (S)";
    } else {
        // Generic / Custom
        points = `M0,${h_box} L0,${y_crest} L${p / 2},${y_crest + 50} L${p},${y_crest} L${1.5 * p},${y_crest + 50} L${2 * p},${y_crest} L${2 * p},${h_box} Z`;
        label = "Custom";
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0e14] overflow-hidden relative">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${w_box} ${h_box}`}
                preserveAspectRatio="xMidYMid meet"
                className="max-h-[300px]"
            >
                <defs>
                    {hatchPattern}
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#334155" />
                    </marker>
                </defs>

                {/* Material Body */}
                <path d={points} fill="url(#hatchThread)" stroke="#00e5ff" strokeWidth="2" opacity="0.9" />

                {/* Pitch Line / Ref Lines */}
                <line x1="0" y1={y_crest} x2={w_box} y2={y_crest} stroke="#94a3b8" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />

                {/* Dimension Lines */}
                <line x1={0} y1={y_crest - 20} x2={0} y2={y_crest} stroke="#64748b" strokeWidth="1" />
                <line x1={p} y1={y_crest - 20} x2={p} y2={y_crest} stroke="#64748b" strokeWidth="1" />

                <line
                    x1={0} y1={y_crest - 15}
                    x2={p} y2={y_crest - 15}
                    stroke="#334155"
                    strokeWidth="1.5"
                    markerStart="url(#arrow)"
                    markerEnd="url(#arrow)"
                />

                {/* Text Labels */}
                <text x={p / 2} y={y_crest - 25} textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" fontFamily="monospace">
                    P={pitch}mm
                </text>

                <text x={p / 2} y={y_crest + 80} textAnchor="middle" fill="#ef4444" fontSize="14" fontWeight="bold" fontFamily="monospace">
                    {label}
                </text>

                <text x={w_box - 20} y={h_box - 10} textAnchor="end" fill="#334155" fontSize="10" fontFamily="monospace">
                    {type} PROFILE
                </text>
            </svg>
        </div>
    );
};
