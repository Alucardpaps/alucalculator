'use client';

import React from 'react';
import { AluminumProfile, SIGMA_PROFILES } from '@/data/mechanical/profiles';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export type ShapeType =
    | 'plate'
    | 'round'
    | 'tube'
    | 'hollow-rect'
    | 'angle'
    | 'channel'
    | 'i-beam'
    | 'hex'
    | 't-profile'
    | 'sigma';

export interface ProfileCADProps {
    shape: ShapeType;
    dimensions: {
        length: number;
        width: number;
        height: number;
        thickness: number;
        diameter: number;
        wallThickness: number;
        flangeW: number;
        webH: number;
        flangeT: number;
        webT: number;
        sigmaId?: string;
    };
    material: {
        category: string;
        name: string;
        density: number;
        basePrice?: number;
    };
    viewMode: '2d' | '3d';
    showDimensions?: boolean;
    showAxes?: boolean;
    showHatch?: boolean;
}

export function ProfileCADCanvas({
    shape,
    dimensions,
    material,
    viewMode,
    showDimensions = true,
    showAxes = true,
    showHatch = true,
}: ProfileCADProps) {
  const precision = useGlobalPrecision();
    const rawId = React.useId().replace(/:/g, '');

    // Material theme colors
    const matCategory = (material.category || 'Aluminum').toLowerCase();
    const isSteel = matCategory.includes('steel') && !matCategory.includes('stainless');
    const isStainless = matCategory.includes('stainless');
    const isCopperOrBrass = matCategory.includes('copper') || matCategory.includes('brass') || matCategory.includes('bronze');
    const isTitanium = matCategory.includes('titanium');

    return (
        <div className="w-full h-full flex items-center justify-center select-none relative overflow-hidden bg-[var(--bg-0)]">
            <svg
                viewBox="0 0 800 480"
                className="w-full h-full min-h-[380px] max-h-[560px]"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* 45 Degree Cross-Section Hatch */}
                    <pattern
                        id={`hatch-${rawId}`}
                        patternUnits="userSpaceOnUse"
                        width="10"
                        height="10"
                        patternTransform="rotate(45)"
                    >
                        <line
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="10"
                            stroke={isCopperOrBrass ? '#f59e0b' : '#00e5ff'}
                            strokeWidth="1.2"
                            opacity={showHatch ? 0.35 : 0}
                        />
                    </pattern>

                    {/* Arrowhead Markers */}
                    <marker
                        id={`arrow-${rawId}`}
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#00e5ff" />
                    </marker>

                    <marker
                        id={`arrow-amber-${rawId}`}
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#f59e0b" />
                    </marker>

                    {/* Realistic Material Gradients */}
                    <linearGradient id={`matTop-${rawId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        {isCopperOrBrass ? (
                            <>
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="50%" stopColor="#d97706" />
                                <stop offset="100%" stopColor="#78350f" />
                            </>
                        ) : isStainless ? (
                            <>
                                <stop offset="0%" stopColor="#94a3b8" />
                                <stop offset="50%" stopColor="#cbd5e1" />
                                <stop offset="100%" stopColor="#64748b" />
                            </>
                        ) : isSteel ? (
                            <>
                                <stop offset="0%" stopColor="#334155" />
                                <stop offset="50%" stopColor="#475569" />
                                <stop offset="100%" stopColor="#1e293b" />
                            </>
                        ) : isTitanium ? (
                            <>
                                <stop offset="0%" stopColor="#1e293b" />
                                <stop offset="50%" stopColor="#334155" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </>
                        ) : (
                            /* Aluminum */
                            <>
                                <stop offset="0%" stopColor="#475569" />
                                <stop offset="35%" stopColor="#94a3b8" />
                                <stop offset="70%" stopColor="#64748b" />
                                <stop offset="100%" stopColor="#334155" />
                            </>
                        )}
                    </linearGradient>

                    <linearGradient id={`matSide-${rawId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        {isCopperOrBrass ? (
                            <>
                                <stop offset="0%" stopColor="#92400e" />
                                <stop offset="100%" stopColor="#451a03" />
                            </>
                        ) : isStainless ? (
                            <>
                                <stop offset="0%" stopColor="#475569" />
                                <stop offset="100%" stopColor="#1e293b" />
                            </>
                        ) : isSteel ? (
                            <>
                                <stop offset="0%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#0b1120" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#334155" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </>
                        )}
                    </linearGradient>

                    {/* Glowing Accent Gradient */}
                    <linearGradient id={`glowGrad-${rawId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0" />
                    </linearGradient>
                </defs>

                {/* Blueprint Background Grid */}
                <rect width="800" height="480" fill="#02050c" rx="12" />
                {Array.from({ length: 21 }).map((_, i) => (
                    <line
                        key={`v${i}`}
                        x1={i * 40}
                        y1={0}
                        x2={i * 40}
                        y2={480}
                        stroke="#00e5ff"
                        strokeWidth="0.8"
                        opacity={i % 4 === 0 ? 0.08 : 0.03}
                    />
                ))}
                {Array.from({ length: 13 }).map((_, i) => (
                    <line
                        key={`h${i}`}
                        x1={0}
                        y1={i * 40}
                        x2={800}
                        y2={i * 40}
                        stroke="#00e5ff"
                        strokeWidth="0.8"
                        opacity={i % 4 === 0 ? 0.08 : 0.03}
                    />
                ))}

                {/* Outer ISO 128 Drawing Frame */}
                <rect x="16" y="16" width="768" height="448" fill="none" stroke="#1e293b" strokeWidth="1.6" rx="6" />
                <rect x="20" y="20" width="760" height="440" fill="none" stroke="#334155" strokeWidth="0.8" />

                {/* Content Rendering by View Mode */}
                {viewMode === '2d' ? (
                    <Render2DCrossSection
                        shape={shape}
                        dims={dimensions}
                        rawId={rawId}
                        showDimensions={showDimensions}
                        showAxes={showAxes}
                        showHatch={showHatch}
                    />
                ) : (
                    <Render3DIsometricExtrusion
                        shape={shape}
                        dims={dimensions}
                        rawId={rawId}
                        showDimensions={showDimensions}
                    />
                )}

                {/* Bottom-Right Title Block HUD */}
                <g transform="translate(560, 396)">
                    <rect x="0" y="0" width="216" height="60" rx="8" fill="#060c18" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.3" />
                    <rect x="0" y="0" width="216" height="20" rx="8" fill={`url(#glowGrad-${rawId})`} />
                    <text x="12" y="14" fontSize="9.5" fontWeight="900" fill="#00e5ff" fontFamily="monospace" letterSpacing="0.1em">
                        {viewMode === '2d' ? '2D KESİT GÖRÜNÜŞÜ' : '3D İZOMETRİK EKSTRÜZYON'}
                    </text>
                    <text x="12" y="34" fontSize="10.5" fontWeight="bold" fill="#f8fafc" fontFamily="monospace">
                        {material.name}
                    </text>
                    <text x="12" y="48" fontSize="8.5" fill="#64748b" fontFamily="monospace">
                        YOĞUNLUK: {formatEngineeringValue(material.density, precision, false)} g/cm³ | L={dimensions.length}mm
                    </text>
                </g>
            </svg>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2D CAD BLUEPRINT CROSS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function Render2DCrossSection({
    shape,
    dims,
    rawId,
    showDimensions,
    showAxes,
    showHatch,
}: {
    shape: ShapeType;
    dims: any;
    rawId: string;
    showDimensions: boolean;
    showAxes: boolean;
    showHatch: boolean;
}) {
    const cx = 380;
    const cy = 240;
    const hatchUrl = `url(#hatch-${rawId})`;
    const arrowUrl = `url(#arrow-${rawId})`;
    const arrowAmber = `url(#arrow-amber-${rawId})`;

    // Scale calculation helper
    const getScale = (w: number, h: number) => {
        const maxDim = Math.max(w, h, 10);
        return Math.min(260 / maxDim, 4.0);
    };

    switch (shape) {
        case 'plate': {
            const wVal = Math.max(dims.width || 100, 1);
            const tVal = Math.max(dims.thickness || 10, 0.5);
            const s = getScale(wVal, tVal * 3);
            const w = wVal * s;
            const t = Math.max(tVal * s, 8);

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={w / 2 + 50} spanY={t / 2 + 50} />}
                    <rect
                        x={cx - w / 2}
                        y={cy - t / 2}
                        width={w}
                        height={t}
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.2"
                        rx="2"
                    />
                    {showDimensions && (
                        <>
                            <HorizDim x1={cx - w / 2} x2={cx + w / 2} y={cy - t / 2 - 28} extY={cy - t / 2} label={`W = ${wVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={cx + w / 2 + 30} y1={cy - t / 2} y2={cy + t / 2} extX={cx + w / 2} label={`t = ${tVal} mm`} arrowId={arrowAmber} color="#f59e0b" />
                        </>
                    )}
                </g>
            );
        }

        case 'round': {
            const dVal = Math.max(dims.diameter || 50, 1);
            const s = getScale(dVal, dVal);
            const r = (dVal * s) / 2;

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={r + 40} spanY={r + 40} />}
                    <circle cx={cx} cy={cy} r={r} fill={hatchUrl} stroke="#00e5ff" strokeWidth="2.2" />
                    {showDimensions && (
                        <HorizDim x1={cx - r} x2={cx + r} y={cy - r - 28} extY={cy - r} label={`ØD = ${dVal} mm`} arrowId={arrowUrl} />
                    )}
                </g>
            );
        }

        case 'tube': {
            const dVal = Math.max(dims.diameter || 50, 2);
            const wtVal = Math.min(Math.max(dims.wallThickness || 5, 0.5), dVal / 2 - 0.1);
            const s = getScale(dVal, dVal);
            const rOuter = (dVal * s) / 2;
            const rInner = ((dVal - 2 * wtVal) * s) / 2;

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={rOuter + 45} spanY={rOuter + 45} />}
                    {/* Outer circle with hatch */}
                    <path
                        d={`
                            M ${cx - rOuter} ${cy}
                            A ${rOuter} ${rOuter} 0 1 0 ${cx + rOuter} ${cy}
                            A ${rOuter} ${rOuter} 0 1 0 ${cx - rOuter} ${cy}
                            M ${cx - rInner} ${cy}
                            A ${rInner} ${rInner} 0 1 1 ${cx + rInner} ${cy}
                            A ${rInner} ${rInner} 0 1 1 ${cx - rInner} ${cy}
                        `}
                        fillRule="evenodd"
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.2"
                    />
                    {showDimensions && (
                        <>
                            <HorizDim x1={cx - rOuter} x2={cx + rOuter} y={cy - rOuter - 30} extY={cy - rOuter} label={`ØD = ${dVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={cx + rOuter + 30} y1={cy - rOuter} y2={cy - rInner} extX={cx + rOuter} label={`t = ${wtVal} mm`} arrowId={arrowAmber} color="#f59e0b" />
                        </>
                    )}
                </g>
            );
        }

        case 'hollow-rect': {
            const wVal = Math.max(dims.width || 80, 5);
            const hVal = Math.max(dims.height || 60, 5);
            const wtVal = Math.min(Math.max(dims.wallThickness || 4, 0.5), Math.min(wVal, hVal) / 2 - 0.1);
            const s = getScale(wVal, hVal);
            const w = wVal * s;
            const h = hVal * s;
            const wt = wtVal * s;
            const cornerR = Math.max(wt * 0.8, 3);

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={w / 2 + 45} spanY={h / 2 + 45} />}
                    <path
                        d={`
                            M ${cx - w / 2 + cornerR} ${cy - h / 2}
                            L ${cx + w / 2 - cornerR} ${cy - h / 2}
                            Q ${cx + w / 2} ${cy - h / 2} ${cx + w / 2} ${cy - h / 2 + cornerR}
                            L ${cx + w / 2} ${cy + h / 2 - cornerR}
                            Q ${cx + w / 2} ${cy + h / 2} ${cx + w / 2 - cornerR} ${cy + h / 2}
                            L ${cx - w / 2 + cornerR} ${cy + h / 2}
                            Q ${cx - w / 2} ${cy + h / 2} ${cx - w / 2} ${cy + h / 2 - cornerR}
                            L ${cx - w / 2} ${cy - h / 2 + cornerR}
                            Q ${cx - w / 2} ${cy - h / 2} ${cx - w / 2 + cornerR} ${cy - h / 2}
                            Z
                            M ${cx - w / 2 + wt + 2} ${cy - h / 2 + wt}
                            L ${cx + w / 2 - wt - 2} ${cy - h / 2 + wt}
                            L ${cx + w / 2 - wt} ${cy + h / 2 - wt}
                            L ${cx - w / 2 + wt} ${cy + h / 2 - wt}
                            Z
                        `}
                        fillRule="evenodd"
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.2"
                    />
                    {showDimensions && (
                        <>
                            <HorizDim x1={cx - w / 2} x2={cx + w / 2} y={cy - h / 2 - 28} extY={cy - h / 2} label={`W = ${wVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={cx + w / 2 + 30} y1={cy - h / 2} y2={cy + h / 2} extX={cx + w / 2} label={`H = ${hVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={cx - w / 2 - 30} y1={cy - h / 2} y2={cy - h / 2 + wt} extX={cx - w / 2} label={`t = ${wtVal}`} arrowId={arrowAmber} color="#f59e0b" />
                        </>
                    )}
                </g>
            );
        }

        case 'angle': {
            const wVal = Math.max(dims.width || 60, 5);
            const hVal = Math.max(dims.height || 60, 5);
            const tVal = Math.min(Math.max(dims.thickness || 6, 1), Math.min(wVal, hVal) - 1);
            const s = getScale(wVal, hVal);
            const w = wVal * s;
            const h = hVal * s;
            const t = tVal * s;

            const ox = cx - w / 2;
            const oy = cy + h / 2;

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={w / 2 + 45} spanY={h / 2 + 45} />}
                    <path
                        d={`
                            M ${ox} ${oy}
                            L ${ox + w} ${oy}
                            L ${ox + w} ${oy - t}
                            L ${ox + t + 4} ${oy - t}
                            Q ${ox + t} ${oy - t} ${ox + t} ${oy - t - 4}
                            L ${ox + t} ${oy - h}
                            L ${ox} ${oy - h}
                            Z
                        `}
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.2"
                    />
                    {showDimensions && (
                        <>
                            <HorizDim x1={ox} x2={ox + w} y={oy + 28} extY={oy} label={`B = ${wVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={ox - 30} y1={oy - h} y2={oy} extX={ox} label={`H = ${hVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={ox + w + 24} y1={oy - t} y2={oy} extX={ox + w} label={`t = ${tVal} mm`} arrowId={arrowAmber} color="#f59e0b" />
                        </>
                    )}
                </g>
            );
        }

        case 'channel': {
            const wVal = Math.max(dims.width || 50, 5);
            const hVal = Math.max(dims.height || 100, 5);
            const tVal = Math.min(Math.max(dims.thickness || 6, 1), wVal - 1);
            const s = getScale(wVal, hVal);
            const w = wVal * s;
            const h = hVal * s;
            const t = tVal * s;

            const ox = cx - w / 2;
            const oy = cy - h / 2;

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={w / 2 + 45} spanY={h / 2 + 45} />}
                    <path
                        d={`
                            M ${ox} ${oy}
                            L ${ox + w} ${oy}
                            L ${ox + w} ${oy + t}
                            L ${ox + t} ${oy + t}
                            L ${ox + t} ${oy + h - t}
                            L ${ox + w} ${oy + h - t}
                            L ${ox + w} ${oy + h}
                            L ${ox} ${oy + h}
                            Z
                        `}
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.2"
                    />
                    {showDimensions && (
                        <>
                            <HorizDim x1={ox} x2={ox + w} y={oy - 28} extY={oy} label={`B = ${wVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={ox - 30} y1={oy} y2={oy + h} extX={ox} label={`H = ${hVal} mm`} arrowId={arrowUrl} />
                            <HorizDim x1={ox} x2={ox + t} y={oy + h + 28} extY={oy + h} label={`tw = ${tVal} mm`} arrowId={arrowAmber} color="#f59e0b" />
                        </>
                    )}
                </g>
            );
        }

        case 'i-beam': {
            const fwVal = Math.max(dims.flangeW || 60, 5);
            const whVal = Math.max(dims.webH || 120, 10);
            const ftVal = Math.max(dims.flangeT || 8, 1);
            const wtVal = Math.max(dims.webT || 5, 1);

            const s = getScale(fwVal, whVal);
            const fw = fwVal * s;
            const wh = whVal * s;
            const ft = ftVal * s;
            const wt = wtVal * s;

            const ox = cx;
            const oy = cy;

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={fw / 2 + 50} spanY={wh / 2 + 50} />}
                    <path
                        d={`
                            M ${ox - fw / 2} ${oy - wh / 2}
                            L ${ox + fw / 2} ${oy - wh / 2}
                            L ${ox + fw / 2} ${oy - wh / 2 + ft}
                            L ${ox + wt / 2} ${oy - wh / 2 + ft}
                            L ${ox + wt / 2} ${oy + wh / 2 - ft}
                            L ${ox + fw / 2} ${oy + wh / 2 - ft}
                            L ${ox + fw / 2} ${oy + wh / 2}
                            L ${ox - fw / 2} ${oy + wh / 2}
                            L ${ox - fw / 2} ${oy + wh / 2 - ft}
                            L ${ox - wt / 2} ${oy + wh / 2 - ft}
                            L ${ox - wt / 2} ${oy - wh / 2 + ft}
                            L ${ox - fw / 2} ${oy - wh / 2 + ft}
                            Z
                        `}
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.2"
                    />
                    {showDimensions && (
                        <>
                            <HorizDim x1={ox - fw / 2} x2={ox + fw / 2} y={oy - wh / 2 - 28} extY={oy - wh / 2} label={`b = ${fwVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={ox + fw / 2 + 30} y1={oy - wh / 2} y2={oy + wh / 2} extX={ox + fw / 2} label={`h = ${whVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={ox - fw / 2 - 30} y1={oy - wh / 2} y2={oy - wh / 2 + ft} extX={ox - fw / 2} label={`tf = ${ftVal}`} arrowId={arrowAmber} color="#f59e0b" />
                            <HorizDim x1={ox - wt / 2} x2={ox + wt / 2} y={oy + 20} extY={oy} label={`tw = ${wtVal}`} arrowId={arrowAmber} color="#f59e0b" />
                        </>
                    )}
                </g>
            );
        }

        case 'hex': {
            const sVal = Math.max(dims.diameter || 40, 5);
            const s = getScale(sVal * 1.15, sVal * 1.15);
            const rIn = (sVal * s) / 2; // inradius
            const rOut = rIn / Math.cos(Math.PI / 6); // circumradius

            const pts = Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * Math.PI) / 3;
                return `${cx + rOut * Math.cos(angle)},${cy + rOut * Math.sin(angle)}`;
            }).join(' ');

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={rOut + 45} spanY={rOut + 45} />}
                    <polygon points={pts} fill={hatchUrl} stroke="#00e5ff" strokeWidth="2.2" />
                    {showDimensions && (
                        <HorizDim x1={cx - rIn} x2={cx + rIn} y={cy - rOut - 24} extY={cy - rOut} label={`S = ${sVal} mm (Anahtar Ağzı)`} arrowId={arrowUrl} />
                    )}
                </g>
            );
        }

        case 't-profile': {
            const wVal = Math.max(dims.width || 60, 5);
            const hVal = Math.max(dims.height || 60, 5);
            const ftVal = Math.max(dims.flangeT || dims.thickness || 6, 1);
            const wtVal = Math.max(dims.webT || dims.thickness || 6, 1);

            const s = getScale(wVal, hVal);
            const w = wVal * s;
            const h = hVal * s;
            const ft = ftVal * s;
            const wt = wtVal * s;

            const ox = cx;
            const oy = cy;

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={w / 2 + 45} spanY={h / 2 + 45} />}
                    <path
                        d={`
                            M ${ox - w / 2} ${oy - h / 2}
                            L ${ox + w / 2} ${oy - h / 2}
                            L ${ox + w / 2} ${oy - h / 2 + ft}
                            L ${ox + wt / 2} ${oy - h / 2 + ft}
                            L ${ox + wt / 2} ${oy + h / 2}
                            L ${ox - wt / 2} ${oy + h / 2}
                            L ${ox - wt / 2} ${oy - h / 2 + ft}
                            L ${ox - w / 2} ${oy - h / 2 + ft}
                            Z
                        `}
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.2"
                    />
                    {showDimensions && (
                        <>
                            <HorizDim x1={ox - w / 2} x2={ox + w / 2} y={oy - h / 2 - 28} extY={oy - h / 2} label={`B = ${wVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={ox + w / 2 + 30} y1={oy - h / 2} y2={oy + h / 2} extX={ox + w / 2} label={`H = ${hVal} mm`} arrowId={arrowUrl} />
                        </>
                    )}
                </g>
            );
        }

        case 'sigma': {
            const profile = SIGMA_PROFILES.find(p => p.id === dims.sigmaId) || SIGMA_PROFILES[0];
            const wVal = profile.w;
            const hVal = profile.h;
            const s = getScale(wVal, hVal);
            const w = wVal * s;
            const h = hVal * s;

            return (
                <g>
                    {showAxes && <AxesLines cx={cx} cy={cy} spanX={w / 2 + 45} spanY={h / 2 + 45} />}
                    <SigmaCrossSection cx={cx} cy={cy} w={w} h={h} slot={profile.slot * s} hatchUrl={hatchUrl} />
                    {showDimensions && (
                        <>
                            <HorizDim x1={cx - w / 2} x2={cx + w / 2} y={cy - h / 2 - 28} extY={cy - h / 2} label={`W = ${wVal} mm`} arrowId={arrowUrl} />
                            <VertDim x={cx + w / 2 + 30} y1={cy - h / 2} y2={cy + h / 2} extX={cx + w / 2} label={`H = ${hVal} mm`} arrowId={arrowUrl} />
                            <DimBadge x={cx} y={cy + h / 2 + 32} text={`${profile.name} (Kanal ${profile.slot}mm)`} color="#00e5ff" />
                        </>
                    )}
                </g>
            );
        }

        default:
            return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3D ISOMETRIC EXTRUSION RENDERER
// ═══════════════════════════════════════════════════════════════════════════

function Render3DIsometricExtrusion({
    shape,
    dims,
    rawId,
    showDimensions,
}: {
    shape: ShapeType;
    dims: any;
    rawId: string;
    showDimensions: boolean;
}) {
    const cx = 280;
    const cy = 270;
    const topGrad = `url(#matTop-${rawId})`;
    const sideGrad = `url(#matSide-${rawId})`;
    const hatchUrl = `url(#hatch-${rawId})`;
    const arrowUrl = `url(#arrow-${rawId})`;

    // Isometric projection angle vector (approx 30 deg up-right)
    const isoDx = 220;
    const isoDy = -110;

    // Normalizing front dimensions
    const maxW = Math.max(dims.width || dims.diameter || dims.flangeW || 60, 10);
    const maxH = Math.max(dims.height || dims.diameter || dims.webH || dims.thickness || 60, 10);
    const scale = Math.min(130 / Math.max(maxW, maxH), 2.2);

    const w = (dims.width || dims.diameter || dims.flangeW || 60) * scale;
    const h = (dims.height || dims.diameter || dims.webH || dims.thickness || 60) * scale;
    const t = Math.max((dims.thickness || dims.wallThickness || dims.flangeT || 6) * scale, 6);

    return (
        <g>
            {/* Isometric Shadow on Floor */}
            <polygon
                points={`
                    ${cx - w / 2 + 20},${cy + h / 2 + 30}
                    ${cx + w / 2 + 20},${cy + h / 2 + 30}
                    ${cx + w / 2 + isoDx + 20},${cy + h / 2 + isoDy + 30}
                    ${cx - w / 2 + isoDx + 20},${cy + h / 2 + isoDy + 30}
                `}
                fill="#000000"
                opacity="0.5"
                filter="blur(10px)"
            />

            {/* Extruded 3D Body based on shape */}
            {shape === 'round' || shape === 'tube' ? (
                <g>
                    {/* Cylindrical side hull */}
                    <path
                        d={`
                            M ${cx} ${cy - w / 2}
                            L ${cx + isoDx} ${cy - w / 2 + isoDy}
                            A ${w / 2} ${w / 2} 0 0 1 ${cx + isoDx + (w / 2) * 0.86} ${cy + (w / 2) * 0.5 + isoDy}
                            L ${cx + (w / 2) * 0.86} ${cy + (w / 2) * 0.5}
                            A ${w / 2} ${w / 2} 0 0 1 ${cx} ${cy - w / 2}
                        `}
                        fill={topGrad}
                        stroke="#475569"
                        strokeWidth="1.2"
                    />

                    {/* Back cylinder cap */}
                    <ellipse cx={cx + isoDx} cy={cy + isoDy} rx={w / 2} ry={w / 2} fill={sideGrad} stroke="#334155" strokeWidth="1.2" />

                    {/* Front Face Cross-Section */}
                    <circle cx={cx} cy={cy} r={w / 2} fill={hatchUrl} stroke="#00e5ff" strokeWidth="2.5" />
                    {shape === 'tube' && (
                        <circle cx={cx} cy={cy} r={w / 2 - t} fill="#02050c" stroke="#00e5ff" strokeWidth="1.8" />
                    )}
                </g>
            ) : (
                <g>
                    {/* Top extruded facet */}
                    <polygon
                        points={`
                            ${cx - w / 2},${cy - h / 2}
                            ${cx + w / 2},${cy - h / 2}
                            ${cx + w / 2 + isoDx},${cy - h / 2 + isoDy}
                            ${cx - w / 2 + isoDx},${cy - h / 2 + isoDy}
                        `}
                        fill={topGrad}
                        stroke="#334155"
                        strokeWidth="1.2"
                    />

                    {/* Right side extruded facet */}
                    <polygon
                        points={`
                            ${cx + w / 2},${cy - h / 2}
                            ${cx + w / 2 + isoDx},${cy - h / 2 + isoDy}
                            ${cx + w / 2 + isoDx},${cy + h / 2 + isoDy}
                            ${cx + w / 2},${cy + h / 2}
                        `}
                        fill={sideGrad}
                        stroke="#1e293b"
                        strokeWidth="1.2"
                    />

                    {/* Back end face */}
                    <polygon
                        points={`
                            ${cx - w / 2 + isoDx},${cy - h / 2 + isoDy}
                            ${cx + w / 2 + isoDx},${cy - h / 2 + isoDy}
                            ${cx + w / 2 + isoDx},${cy + h / 2 + isoDy}
                            ${cx - w / 2 + isoDx},${cy + h / 2 + isoDy}
                        `}
                        fill="#0a101d"
                        stroke="#334155"
                        strokeWidth="0.8"
                        strokeDasharray="4 2"
                    />

                    {/* Front Cutaway Face with Neon Cyan Highlight */}
                    <rect
                        x={cx - w / 2}
                        y={cy - h / 2}
                        width={w}
                        height={h}
                        fill={hatchUrl}
                        stroke="#00e5ff"
                        strokeWidth="2.5"
                    />
                    {shape === 'hollow-rect' && (
                        <rect
                            x={cx - w / 2 + t}
                            y={cy - h / 2 + t}
                            width={w - 2 * t}
                            height={h - 2 * t}
                            fill="#02050c"
                            stroke="#00e5ff"
                            strokeWidth="1.8"
                        />
                    )}
                </g>
            )}

            {/* Length Extrusion Dimension Line */}
            {showDimensions && (
                <g>
                    <line
                        x1={cx + w / 2 + 15}
                        y1={cy - h / 2 + 15}
                        x2={cx + w / 2 + isoDx + 15}
                        y2={cy - h / 2 + isoDy + 15}
                        stroke="#00e5ff"
                        strokeWidth="1.2"
                        markerStart={arrowUrl}
                        markerEnd={arrowUrl}
                    />
                    <DimBadge
                        x={cx + w / 2 + isoDx / 2 + 40}
                        y={cy - h / 2 + isoDy / 2 + 15}
                        text={`L = ${dims.length} mm`}
                        color="#00e5ff"
                    />
                </g>
            )}
        </g>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGMA T-SLOT COMPLEX CROSS SECTION HELPER
// ═══════════════════════════════════════════════════════════════════════════

function SigmaCrossSection({
    cx,
    cy,
    w,
    h,
    slot,
    hatchUrl,
}: {
    cx: number;
    cy: number;
    w: number;
    h: number;
    slot: number;
    hatchUrl: string;
}) {
    const halfW = w / 2;
    const halfH = h / 2;
    const sw = Math.max(slot * 0.7, 6);
    const centerHoleR = Math.max(slot * 0.6, 5);

    return (
        <g>
            {/* Outer Box Body */}
            <rect
                x={cx - halfW}
                y={cy - halfH}
                width={w}
                height={h}
                fill={hatchUrl}
                stroke="#00e5ff"
                strokeWidth="2.2"
                rx="3"
            />

            {/* Center Core Drill Hole */}
            <circle cx={cx} cy={cy} r={centerHoleR} fill="#02050c" stroke="#00e5ff" strokeWidth="1.5" />

            {/* Top T-Slot */}
            <path
                d={`M ${cx - sw / 2} ${cy - halfH} L ${cx - sw / 2} ${cy - halfH + sw * 0.8} L ${cx - sw} ${cy - halfH + sw} L ${cx - sw} ${cy - halfH + sw * 1.5} L ${cx + sw} ${cy - halfH + sw * 1.5} L ${cx + sw} ${cy - halfH + sw} L ${cx + sw / 2} ${cy - halfH + sw * 0.8} L ${cx + sw / 2} ${cy - halfH}`}
                fill="#02050c"
                stroke="#00e5ff"
                strokeWidth="1.2"
            />

            {/* Bottom T-Slot */}
            <path
                d={`M ${cx - sw / 2} ${cy + halfH} L ${cx - sw / 2} ${cy + halfH - sw * 0.8} L ${cx - sw} ${cy + halfH - sw} L ${cx - sw} ${cy + halfH - sw * 1.5} L ${cx + sw} ${cy + halfH - sw * 1.5} L ${cx + sw} ${cy + halfH - sw} L ${cx + sw / 2} ${cy + halfH - sw * 0.8} L ${cx + sw / 2} ${cy + halfH}`}
                fill="#02050c"
                stroke="#00e5ff"
                strokeWidth="1.2"
            />

            {/* Left T-Slot */}
            <path
                d={`M ${cx - halfW} ${cy - sw / 2} L ${cx - halfW + sw * 0.8} ${cy - sw / 2} L ${cx - halfW + sw} ${cy - sw} L ${cx - halfW + sw * 1.5} ${cy - sw} L ${cx - halfW + sw * 1.5} ${cy + sw} L ${cx - halfW + sw} ${cy + sw} L ${cx - halfW + sw * 0.8} ${cy + sw / 2} L ${cx - halfW} ${cy + sw / 2}`}
                fill="#02050c"
                stroke="#00e5ff"
                strokeWidth="1.2"
            />

            {/* Right T-Slot */}
            <path
                d={`M ${cx + halfW} ${cy - sw / 2} L ${cx + halfW - sw * 0.8} ${cy - sw / 2} L ${cx + halfW - sw} ${cy - sw} L ${cx + halfW - sw * 1.5} ${cy - sw} L ${cx + halfW - sw * 1.5} ${cy + sw} L ${cx + halfW - sw} ${cy + sw} L ${cx + halfW - sw * 0.8} ${cy + sw / 2} L ${cx + halfW} ${cy + sw / 2}`}
                fill="#02050c"
                stroke="#00e5ff"
                strokeWidth="1.2"
            />
        </g>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAD ANNOTATIONS & DIMENSIONS
// ═══════════════════════════════════════════════════════════════════════════

function AxesLines({ cx, cy, spanX, spanY }: { cx: number; cy: number; spanX: number; spanY: number }) {
    return (
        <g stroke="#38bdf8" strokeWidth="1" strokeDasharray="14 4 2 4" opacity="0.65">
            <line x1={cx - spanX} y1={cy} x2={cx + spanX} y2={cy} />
            <line x1={cx} y1={cy - spanY} x2={cx} y2={cy + spanY} />
            {/* Center of Gravity (CG) G Marker */}
            <circle cx={cx} cy={cy} r="4" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
            <path d={`M ${cx - 4} ${cy} L ${cx + 4} ${cy} M ${cx} ${cy - 4} L ${cx} ${cy + 4}`} stroke="#f59e0b" strokeWidth="1" />
            <text x={cx + 7} y={cy - 5} fontSize="9" fontWeight="900" fill="#f59e0b" fontFamily="monospace">G</text>
        </g>
    );
}

function DimBadge({ x, y, text, color = '#00e5ff' }: { x: number; y: number; text: string; color?: string }) {
    const w = Math.max(52, text.length * 7 + 14);
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect x={-w / 2} y={-9} width={w} height={18} rx="4" fill="#040812" stroke={color} strokeWidth="1" strokeOpacity="0.8" />
            <text x="0" y="3.5" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill={color} fontFamily="monospace">
                {text}
            </text>
        </g>
    );
}

function HorizDim({
    x1,
    x2,
    y,
    extY,
    label,
    color = '#00e5ff',
    arrowId,
}: {
    x1: number;
    x2: number;
    y: number;
    extY: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const mid = (x1 + x2) / 2;
    return (
        <g stroke={color} strokeWidth="1" fill="none" opacity="0.95">
            <line x1={x1} y1={extY} x2={x1} y2={y > extY ? y + 4 : y - 4} stroke="#475569" strokeWidth="0.8" />
            <line x1={x2} y1={extY} x2={x2} y2={y > extY ? y + 4 : y - 4} stroke="#475569" strokeWidth="0.8" />
            <line x1={x1} y1={y} x2={x2} y2={y} markerStart={arrowId} markerEnd={arrowId} stroke={color} strokeWidth="1.1" />
            <DimBadge x={mid} y={y} text={label} color={color} />
        </g>
    );
}

function VertDim({
    x,
    y1,
    y2,
    extX,
    label,
    color = '#00e5ff',
    arrowId,
}: {
    x: number;
    y1: number;
    y2: number;
    extX: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const mid = (y1 + y2) / 2;
    return (
        <g stroke={color} strokeWidth="1" fill="none" opacity="0.95">
            <line x1={extX} y1={y1} x2={x > extX ? x + 4 : x - 4} y2={y1} stroke="#475569" strokeWidth="0.8" />
            <line x1={extX} y1={y2} x2={x > extX ? x + 4 : x - 4} y2={y2} stroke="#475569" strokeWidth="0.8" />
            <line x1={x} y1={y1} x2={x} y2={y2} markerStart={arrowId} markerEnd={arrowId} stroke={color} strokeWidth="1.1" />
            <DimBadge x={x} y={mid} text={label} color={color} />
        </g>
    );
}
