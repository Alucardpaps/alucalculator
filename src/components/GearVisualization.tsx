'use client';

/**
 * GearVisualization Component
 * 
 * Real-time SVG renderer for spur gears showing:
 * - Pitch circles
 * - Addendum & dedendum circles
 * - Involute tooth profiles
 * - Engaging gear pair
 */

import React, { useMemo } from 'react';

interface GearParams {
    module: number;         // Module (mm)
    teeth: number;          // Number of teeth
    pressureAngle?: number; // Pressure angle (degrees), default 20°
    color?: string;         // Fill color
    label?: string;         // Optional label (e.g., "Pinion", "Gear")
}

interface GearVisualizationProps {
    pinion: GearParams;
    gear: GearParams;
    showAnnotations?: boolean;
    showMesh?: boolean;
    className?: string;
}

// Generate involute curve points
function involute(baseRadius: number, t: number): { x: number; y: number } {
    const x = baseRadius * (Math.cos(t) + t * Math.sin(t));
    const y = baseRadius * (Math.sin(t) - t * Math.cos(t));
    return { x, y };
}

// Generate tooth profile points
function generateToothProfile(
    pitchRadius: number,
    baseRadius: number,
    addendumRadius: number,
    dedendumRadius: number,
    toothAngle: number,
    pressureAngleRad: number
): string {
    const points: string[] = [];
    const steps = 20;

    // Calculate involute range
    const tMax = Math.sqrt((addendumRadius / baseRadius) ** 2 - 1);

    // Right flank (involute curve)
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tMax;
        const { x, y } = involute(baseRadius, t);
        points.push(`${x.toFixed(3)},${y.toFixed(3)}`);
    }

    return points.join(' ');
}

// Generate complete gear SVG path
function generateGearPath(
    module: number,
    teeth: number,
    pressureAngle: number = 20,
    cx: number = 0,
    cy: number = 0
): string {
    const pressureAngleRad = (pressureAngle * Math.PI) / 180;

    // Gear geometry calculations
    const pitchRadius = (module * teeth) / 2;
    const addendum = module;
    const dedendum = 1.25 * module;
    const addendumRadius = pitchRadius + addendum;
    const dedendumRadius = pitchRadius - dedendum;
    const baseRadius = pitchRadius * Math.cos(pressureAngleRad);

    // Tooth angular pitch
    const toothAngle = (2 * Math.PI) / teeth;
    const halfToothAngle = toothAngle / 2;

    // Simplified tooth profile using arcs and lines
    const pathParts: string[] = [];

    for (let i = 0; i < teeth; i++) {
        const angle = i * toothAngle;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const cosHalf = Math.cos(angle + halfToothAngle * 0.5);
        const sinHalf = Math.sin(angle + halfToothAngle * 0.5);
        const cosNext = Math.cos(angle + halfToothAngle);
        const sinNext = Math.sin(angle + halfToothAngle);
        const cosEnd = Math.cos(angle + toothAngle);
        const sinEnd = Math.sin(angle + toothAngle);

        // Root point
        const rx = cx + dedendumRadius * cos;
        const ry = cy + dedendumRadius * sin;

        // Tip point (left side)
        const txL = cx + addendumRadius * cosHalf;
        const tyL = cy + addendumRadius * sinHalf;

        // Tip point (right side)
        const txR = cx + addendumRadius * cosNext;
        const tyR = cy + addendumRadius * sinNext;

        // Next root point
        const rxNext = cx + dedendumRadius * cosEnd;
        const ryNext = cy + dedendumRadius * sinEnd;

        if (i === 0) {
            pathParts.push(`M ${rx.toFixed(2)} ${ry.toFixed(2)}`);
        }

        // Rising flank
        pathParts.push(`L ${txL.toFixed(2)} ${tyL.toFixed(2)}`);

        // Tooth tip arc
        pathParts.push(`A ${addendumRadius.toFixed(2)} ${addendumRadius.toFixed(2)} 0 0 1 ${txR.toFixed(2)} ${tyR.toFixed(2)}`);

        // Falling flank
        pathParts.push(`L ${rxNext.toFixed(2)} ${ryNext.toFixed(2)}`);

        // Root arc to next tooth
        if (i < teeth - 1) {
            const nextRx = cx + dedendumRadius * Math.cos((i + 1) * toothAngle);
            const nextRy = cy + dedendumRadius * Math.sin((i + 1) * toothAngle);
            pathParts.push(`A ${dedendumRadius.toFixed(2)} ${dedendumRadius.toFixed(2)} 0 0 1 ${nextRx.toFixed(2)} ${nextRy.toFixed(2)}`);
        }
    }

    pathParts.push('Z');
    return pathParts.join(' ');
}

export function GearVisualization({
    pinion,
    gear,
    showAnnotations = true,
    showMesh = true,
    className = '',
}: GearVisualizationProps) {
    const pressureAngle = pinion.pressureAngle ?? 20;

    // Calculate gear geometry
    const pinionPitchR = (pinion.module * pinion.teeth) / 2;
    const gearPitchR = (gear.module * gear.teeth) / 2;
    const centerDistance = pinionPitchR + gearPitchR;

    // SVG viewport calculation
    const maxRadius = Math.max(
        pinionPitchR + pinion.module * 1.25,
        gearPitchR + gear.module * 1.25
    );
    const padding = maxRadius * 0.15;
    const viewWidth = centerDistance + maxRadius * 2 + padding * 2;
    const viewHeight = maxRadius * 2 + padding * 2;

    // Gear centers
    const pinionCx = padding + pinionPitchR + pinion.module * 1.25;
    const pinionCy = viewHeight / 2;
    const gearCx = pinionCx + centerDistance;
    const gearCy = viewHeight / 2;

    // Generate gear paths
    const pinionPath = useMemo(
        () => generateGearPath(pinion.module, pinion.teeth, pressureAngle, pinionCx, pinionCy),
        [pinion.module, pinion.teeth, pressureAngle, pinionCx, pinionCy]
    );

    const gearPath = useMemo(
        () => generateGearPath(gear.module, gear.teeth, pressureAngle, gearCx, gearCy),
        [gear.module, gear.teeth, pressureAngle, gearCx, gearCy]
    );

    const pinionColor = pinion.color ?? '#6366f1';
    const gearColor = gear.color ?? '#8b5cf6';

    return (
        <div className={`gear-visualization ${className}`}>
            <svg
                viewBox={`0 0 ${viewWidth.toFixed(1)} ${viewHeight.toFixed(1)}`}
                className="gear-svg"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Gradient for pinion */}
                    <linearGradient id="pinionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={pinionColor} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={pinionColor} stopOpacity="0.6" />
                    </linearGradient>

                    {/* Gradient for gear */}
                    <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gearColor} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={gearColor} stopOpacity="0.6" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background grid */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Pitch circles (dashed) */}
                {showAnnotations && (
                    <>
                        <circle
                            cx={pinionCx}
                            cy={pinionCy}
                            r={pinionPitchR}
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                        <circle
                            cx={gearCx}
                            cy={gearCy}
                            r={gearPitchR}
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                    </>
                )}

                {/* Gear bodies */}
                <g className="gear-body" filter="url(#glow)">
                    <path
                        d={gearPath}
                        fill="url(#gearGrad)"
                        stroke={gearColor}
                        strokeWidth="1"
                    />
                </g>

                <g className="pinion-body" filter="url(#glow)">
                    <path
                        d={pinionPath}
                        fill="url(#pinionGrad)"
                        stroke={pinionColor}
                        strokeWidth="1"
                    />
                </g>

                {/* Center holes */}
                <circle cx={pinionCx} cy={pinionCy} r={pinion.module * 2} fill="var(--surface-1, #0f0f1a)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <circle cx={gearCx} cy={gearCy} r={gear.module * 2} fill="var(--surface-1, #0f0f1a)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

                {/* Center marks */}
                <circle cx={pinionCx} cy={pinionCy} r="2" fill={pinionColor} />
                <circle cx={gearCx} cy={gearCy} r="2" fill={gearColor} />

                {/* Center distance line */}
                {showAnnotations && showMesh && (
                    <g className="annotations">
                        <line
                            x1={pinionCx}
                            y1={pinionCy}
                            x2={gearCx}
                            y2={gearCy}
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth="1"
                            strokeDasharray="6 3"
                        />
                        <text
                            x={(pinionCx + gearCx) / 2}
                            y={pinionCy - 10}
                            fill="rgba(255,255,255,0.7)"
                            fontSize="10"
                            textAnchor="middle"
                        >
                            a = {centerDistance.toFixed(1)} mm
                        </text>
                    </g>
                )}

                {/* Labels */}
                {showAnnotations && (
                    <>
                        <text
                            x={pinionCx}
                            y={pinionCy + pinionPitchR + pinion.module * 2 + 15}
                            fill="rgba(255,255,255,0.8)"
                            fontSize="11"
                            fontWeight="600"
                            textAnchor="middle"
                        >
                            {pinion.label ?? 'Pinion'} (z={pinion.teeth})
                        </text>
                        <text
                            x={gearCx}
                            y={gearCy + gearPitchR + gear.module * 2 + 15}
                            fill="rgba(255,255,255,0.8)"
                            fontSize="11"
                            fontWeight="600"
                            textAnchor="middle"
                        >
                            {gear.label ?? 'Gear'} (z={gear.teeth})
                        </text>
                    </>
                )}
            </svg>

            {/* Info panel */}
            <div className="gear-info">
                <div className="info-row">
                    <span className="info-label">Module</span>
                    <span className="info-value">{pinion.module} mm</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Ratio</span>
                    <span className="info-value">{(gear.teeth / pinion.teeth).toFixed(3)}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Center Dist.</span>
                    <span className="info-value">{centerDistance.toFixed(2)} mm</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Pitch Ø (P)</span>
                    <span className="info-value">{(pinionPitchR * 2).toFixed(2)} mm</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Pitch Ø (G)</span>
                    <span className="info-value">{(gearPitchR * 2).toFixed(2)} mm</span>
                </div>
            </div>

            <style jsx>{`
                .gear-visualization {
                    position: relative;
                    background: var(--surface-1, #0f0f1a);
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid var(--border, #2a2a4a);
                }
                
                .gear-svg {
                    width: 100%;
                    height: auto;
                    max-height: 350px;
                    display: block;
                }
                
                .gear-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 8px;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-dim, #1a1a2e);
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 10px;
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 6px;
                }
                
                .info-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-dim, #666);
                }
                
                .info-value {
                    font-family: var(--font-mono, 'JetBrains Mono', monospace);
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--accent, #6366f1);
                }
            `}</style>
        </div>
    );
}

export default GearVisualization;
