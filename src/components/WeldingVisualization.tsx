'use client';

/**
 * WeldingVisualization Component
 * 
 * Visual representation of weld joints showing:
 * - Cross-section diagrams for fillet, butt, and other joints
 * - Heat affected zone
 * - Weld bead profile
 * - Dimensional annotations
 */

import React from 'react';

export type WeldType = 'fillet' | 'butt' | 'doubleFillet' | 'lap' | 'tee' | 'corner' | 'vGroove' | 'uGroove';

interface WeldingVisualizationProps {
    type: WeldType;
    legSize: number;       // a (mm)
    thickness: number;     // t (mm)
    rootGap?: number;      // mm
    grooveAngle?: number;  // degrees
    showDimensions?: boolean;
    showHAZ?: boolean;     // Heat Affected Zone
    heatInput?: number;    // kJ/mm - affects HAZ size
    className?: string;
}

const COLORS = {
    base: '#4a5568',       // Base metal
    weld: '#f59e0b',       // Weld metal
    haz: 'rgba(239, 68, 68, 0.3)', // Heat affected zone
    dimension: '#6366f1',  // Dimension lines
    text: '#e2e8f0',
    stroke: '#1a202c',
};

export function WeldingVisualization({
    type,
    legSize,
    thickness,
    rootGap = 2,
    grooveAngle = 60,
    showDimensions = true,
    showHAZ = true,
    heatInput = 1.5,
    className = '',
}: WeldingVisualizationProps) {
    const scale = 4; // Pixels per mm
    const padding = 40;

    // Calculate HAZ size based on heat input
    const hazSize = Math.min(12, Math.max(3, heatInput * 4)) * scale;

    // SVG dimensions
    const viewWidth = Math.max(200, (thickness * 3 + 60) * scale);
    const viewHeight = Math.max(160, (thickness * 2 + 40) * scale);

    return (
        <div className={`welding-visualization ${className}`}>
            <svg
                viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                width="100%"
                height="auto"
                style={{ maxHeight: '250px' }}
            >
                <defs>
                    {/* Weld metal gradient */}
                    <linearGradient id="weldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>

                    {/* Base metal pattern */}
                    <pattern id="steelPattern" patternUnits="userSpaceOnUse" width="8" height="8">
                        <rect width="8" height="8" fill="#4a5568" />
                        <line x1="0" y1="8" x2="8" y2="0" stroke="#374151" strokeWidth="0.5" />
                    </pattern>

                    {/* HAZ gradient */}
                    <radialGradient id="hazGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.4)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                    </radialGradient>
                </defs>

                {type === 'fillet' && (
                    <FilletWeld
                        legSize={legSize}
                        thickness={thickness}
                        scale={scale}
                        padding={padding}
                        showDimensions={showDimensions}
                        showHAZ={showHAZ}
                        hazSize={hazSize}
                    />
                )}

                {type === 'doubleFillet' && (
                    <DoubleFilletWeld
                        legSize={legSize}
                        thickness={thickness}
                        scale={scale}
                        padding={padding}
                        showDimensions={showDimensions}
                        showHAZ={showHAZ}
                        hazSize={hazSize}
                    />
                )}

                {type === 'butt' && (
                    <ButtWeld
                        thickness={thickness}
                        rootGap={rootGap}
                        scale={scale}
                        padding={padding}
                        showDimensions={showDimensions}
                        showHAZ={showHAZ}
                        hazSize={hazSize}
                    />
                )}

                {type === 'vGroove' && (
                    <VGrooveWeld
                        thickness={thickness}
                        rootGap={rootGap}
                        grooveAngle={grooveAngle}
                        scale={scale}
                        padding={padding}
                        showDimensions={showDimensions}
                        showHAZ={showHAZ}
                        hazSize={hazSize}
                    />
                )}

                {type === 'tee' && (
                    <TeeWeld
                        legSize={legSize}
                        thickness={thickness}
                        scale={scale}
                        padding={padding}
                        showDimensions={showDimensions}
                        showHAZ={showHAZ}
                        hazSize={hazSize}
                    />
                )}

                {type === 'lap' && (
                    <LapWeld
                        legSize={legSize}
                        thickness={thickness}
                        scale={scale}
                        padding={padding}
                        showDimensions={showDimensions}
                        showHAZ={showHAZ}
                        hazSize={hazSize}
                    />
                )}
            </svg>

            <style jsx>{`
                .welding-visualization {
                    background: var(--surface-2, #1a1a2e);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 8px;
                    padding: 12px;
                }
            `}</style>
        </div>
    );
}

// ===== FILLET WELD =====
function FilletWeld({ legSize, thickness, scale, padding, showDimensions, showHAZ, hazSize }: {
    legSize: number; thickness: number; scale: number; padding: number;
    showDimensions: boolean; showHAZ: boolean; hazSize: number;
}) {
    const a = legSize * scale;
    const t = thickness * scale;

    // Base plates
    const plate1 = { x: padding, y: padding + t, width: t * 2, height: t };
    const plate2 = { x: padding + t, y: padding, width: t, height: t * 2 };

    // Fillet weld triangle
    const weldPoints = `
        ${padding + t},${padding + t}
        ${padding + t + a},${padding + t}
        ${padding + t},${padding + t - a}
    `;

    return (
        <g>
            {/* HAZ */}
            {showHAZ && (
                <ellipse
                    cx={padding + t}
                    cy={padding + t}
                    rx={hazSize}
                    ry={hazSize}
                    fill="url(#hazGradient)"
                />
            )}

            {/* Base plates */}
            <rect {...plate1} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />
            <rect {...plate2} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Weld bead */}
            <polygon
                points={weldPoints}
                fill="url(#weldGradient)"
                stroke="#d97706"
                strokeWidth="1"
            />

            {/* Throat line */}
            <line
                x1={padding + t}
                y1={padding + t}
                x2={padding + t + a * 0.707}
                y2={padding + t - a * 0.707}
                stroke={COLORS.dimension}
                strokeWidth="1"
                strokeDasharray="3,2"
            />

            {/* Dimensions */}
            {showDimensions && (
                <>
                    {/* Leg size horizontal */}
                    <line x1={padding + t} y1={padding + t + 15} x2={padding + t + a} y2={padding + t + 15}
                        stroke={COLORS.dimension} strokeWidth="1" />
                    <text x={padding + t + a / 2} y={padding + t + 28}
                        fill={COLORS.text} fontSize="10" textAnchor="middle">a={legSize}</text>

                    {/* Throat annotation */}
                    <text x={padding + t + a * 0.707 + 5} y={padding + t - a * 0.707 - 5}
                        fill={COLORS.dimension} fontSize="9" textAnchor="start">
                        t={Math.round(legSize * 0.707 * 10) / 10}
                    </text>
                </>
            )}
        </g>
    );
}

// ===== DOUBLE FILLET WELD =====
function DoubleFilletWeld({ legSize, thickness, scale, padding, showDimensions, showHAZ, hazSize }: {
    legSize: number; thickness: number; scale: number; padding: number;
    showDimensions: boolean; showHAZ: boolean; hazSize: number;
}) {
    const a = legSize * scale;
    const t = thickness * scale;

    return (
        <g>
            {/* HAZ */}
            {showHAZ && (
                <>
                    <ellipse cx={padding + t} cy={padding + t} rx={hazSize} ry={hazSize} fill="url(#hazGradient)" />
                    <ellipse cx={padding + t * 2} cy={padding + t} rx={hazSize} ry={hazSize} fill="url(#hazGradient)" />
                </>
            )}

            {/* Base plates */}
            <rect x={padding} y={padding + t} width={t * 3} height={t} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />
            <rect x={padding + t} y={padding} width={t} height={t * 2} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Left fillet */}
            <polygon
                points={`${padding + t},${padding + t} ${padding + t},${padding + t - a} ${padding + t - a},${padding + t}`}
                fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1"
            />

            {/* Right fillet */}
            <polygon
                points={`${padding + t * 2},${padding + t} ${padding + t * 2},${padding + t - a} ${padding + t * 2 + a},${padding + t}`}
                fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1"
            />

            {showDimensions && (
                <text x={padding + t * 1.5} y={padding + t + 28}
                    fill={COLORS.text} fontSize="10" textAnchor="middle">2×a={legSize}</text>
            )}
        </g>
    );
}

// ===== BUTT WELD =====
function ButtWeld({ thickness, rootGap, scale, padding, showDimensions, showHAZ, hazSize }: {
    thickness: number; rootGap: number; scale: number; padding: number;
    showDimensions: boolean; showHAZ: boolean; hazSize: number;
}) {
    const t = thickness * scale;
    const gap = rootGap * scale;

    return (
        <g>
            {/* HAZ */}
            {showHAZ && (
                <rect x={padding + t + gap / 2 - hazSize / 2} y={padding} width={hazSize} height={t} fill="url(#hazGradient)" />
            )}

            {/* Left plate */}
            <rect x={padding} y={padding} width={t} height={t} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Right plate */}
            <rect x={padding + t + gap} y={padding} width={t} height={t} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Weld */}
            <rect x={padding + t} y={padding} width={gap} height={t} fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1" />

            {/* Cap reinforcement */}
            <path
                d={`M ${padding + t - 3} ${padding} Q ${padding + t + gap / 2} ${padding - 5} ${padding + t + gap + 3} ${padding}`}
                fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1"
            />

            {showDimensions && (
                <>
                    <text x={padding + t + gap / 2} y={padding + t + 20}
                        fill={COLORS.text} fontSize="10" textAnchor="middle">t={thickness}</text>
                </>
            )}
        </g>
    );
}

// ===== V-GROOVE WELD =====
function VGrooveWeld({ thickness, rootGap, grooveAngle, scale, padding, showDimensions, showHAZ, hazSize }: {
    thickness: number; rootGap: number; grooveAngle: number; scale: number; padding: number;
    showDimensions: boolean; showHAZ: boolean; hazSize: number;
}) {
    const t = thickness * scale;
    const gap = rootGap * scale;
    const angle = (grooveAngle / 2) * Math.PI / 180;
    const grooveWidth = Math.tan(angle) * t;

    return (
        <g>
            {/* HAZ */}
            {showHAZ && (
                <ellipse cx={padding + t + grooveWidth} cy={padding + t / 2} rx={hazSize} ry={hazSize} fill="url(#hazGradient)" />
            )}

            {/* Left plate with bevel */}
            <polygon
                points={`
                    ${padding},${padding}
                    ${padding + t},${padding}
                    ${padding + t + grooveWidth},${padding + t}
                    ${padding},${padding + t}
                `}
                fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1"
            />

            {/* Right plate with bevel */}
            <polygon
                points={`
                    ${padding + t * 2 + grooveWidth * 2},${padding}
                    ${padding + t + grooveWidth * 2},${padding}
                    ${padding + t + grooveWidth},${padding + t}
                    ${padding + t * 2 + grooveWidth * 2},${padding + t}
                `}
                fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1"
            />

            {/* Weld metal in groove */}
            <polygon
                points={`
                    ${padding + t},${padding}
                    ${padding + t + grooveWidth * 2},${padding}
                    ${padding + t + grooveWidth},${padding + t}
                `}
                fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1"
            />

            {showDimensions && (
                <>
                    <text x={padding + t + grooveWidth} y={padding - 10}
                        fill={COLORS.text} fontSize="10" textAnchor="middle">{grooveAngle}°</text>
                </>
            )}
        </g>
    );
}

// ===== TEE WELD =====
function TeeWeld({ legSize, thickness, scale, padding, showDimensions, showHAZ, hazSize }: {
    legSize: number; thickness: number; scale: number; padding: number;
    showDimensions: boolean; showHAZ: boolean; hazSize: number;
}) {
    const a = legSize * scale;
    const t = thickness * scale;

    return (
        <g>
            {/* HAZ */}
            {showHAZ && (
                <>
                    <ellipse cx={padding + t * 1.5 - t / 2} cy={padding + t} rx={hazSize} ry={hazSize} fill="url(#hazGradient)" />
                    <ellipse cx={padding + t * 1.5 + t / 2} cy={padding + t} rx={hazSize} ry={hazSize} fill="url(#hazGradient)" />
                </>
            )}

            {/* Horizontal plate */}
            <rect x={padding} y={padding + t} width={t * 3} height={t} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Vertical plate */}
            <rect x={padding + t} y={padding} width={t} height={t} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Left fillet */}
            <polygon
                points={`${padding + t},${padding + t} ${padding + t - a},${padding + t} ${padding + t},${padding + t - a}`}
                fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1"
            />

            {/* Right fillet */}
            <polygon
                points={`${padding + t * 2},${padding + t} ${padding + t * 2 + a},${padding + t} ${padding + t * 2},${padding + t - a}`}
                fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1"
            />

            {showDimensions && (
                <text x={padding + t * 1.5} y={padding + t * 2 + 20}
                    fill={COLORS.text} fontSize="10" textAnchor="middle">Tee Joint</text>
            )}
        </g>
    );
}

// ===== LAP WELD =====
function LapWeld({ legSize, thickness, scale, padding, showDimensions, showHAZ, hazSize }: {
    legSize: number; thickness: number; scale: number; padding: number;
    showDimensions: boolean; showHAZ: boolean; hazSize: number;
}) {
    const a = legSize * scale;
    const t = thickness * scale;

    return (
        <g>
            {/* HAZ */}
            {showHAZ && (
                <ellipse cx={padding + t * 2} cy={padding + t} rx={hazSize} ry={hazSize} fill="url(#hazGradient)" />
            )}

            {/* Bottom plate */}
            <rect x={padding} y={padding + t} width={t * 3} height={t} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Top plate (overlapping) */}
            <rect x={padding + t} y={padding} width={t * 2} height={t} fill="url(#steelPattern)" stroke={COLORS.stroke} strokeWidth="1" />

            {/* Fillet at edge */}
            <polygon
                points={`${padding + t},${padding + t} ${padding + t - a},${padding + t} ${padding + t},${padding + t - a}`}
                fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1"
            />

            {showDimensions && (
                <text x={padding + t * 1.5} y={padding + t * 2 + 20}
                    fill={COLORS.text} fontSize="10" textAnchor="middle">Lap Joint</text>
            )}
        </g>
    );
}

export default WeldingVisualization;
