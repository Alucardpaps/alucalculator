'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Layers, Sparkles } from 'lucide-react';
import { UndercutVisualizer } from '@/components/visualizers/UndercutVisualizer';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

// ═══════════════════════════════════════════════════════════════════════════
// CAD BLUEPRINT FRAME & COMMON DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

function DrawingDefs({ ids }: { ids: { hatch: string; arrow: string; metalSteel: string; copper: string; darkMetal: string } }) {
    return (
        <defs>
            {/* 45 Degree Engineering Section Cross-Hatch */}
            <pattern id={ids.hatch} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#38bdf8" strokeWidth="1.2" opacity="0.32" />
            </pattern>

            {/* Fine Section Hatch for Hub / Secondary Workpiece */}
            <pattern id={`${ids.hatch}-hub`} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-45)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="1.0" opacity="0.32" />
            </pattern>

            {/* Dimensional Arrowhead Markers */}
            <marker id={ids.arrow} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#00e5ff" />
            </marker>
            <marker id={`${ids.arrow}-amber`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#f59e0b" />
            </marker>
            <marker id={`${ids.arrow}-green`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#34d399" />
            </marker>
            <marker id={`${ids.arrow}-sky`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#38bdf8" />
            </marker>

            {/* Realistic Metal Gradients */}
            <linearGradient id={ids.metalSteel} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="30%" stopColor="#475569" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="70%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id={ids.darkMetal} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            <linearGradient id="cyanSurfaceGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0" />
            </linearGradient>
        </defs>
    );
}

function TechFrame({
    standard,
    title,
    scale = '1:1',
    children,
    legend,
    showAssembly = true,
    setShowAssembly,
    hideLegend = false,
}: {
    standard: string;
    title: string;
    scale?: string;
    children: React.ReactNode;
    legend?: React.ReactNode;
    showAssembly?: boolean;
    setShowAssembly?: (val: boolean) => void;
    hideLegend?: boolean;
}) {
    const { language } = useI18nStore();
    const rawId = React.useId().replace(/:/g, '');

    // Dynamic ViewBox: When hideLegend is true, tailor width to 560 for 1:1 crisp display
    const vbW = hideLegend ? 560 : 740;
    const vbH = 430;

    return (
        <div className="w-full h-full flex flex-col select-none rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--bg-1)] shadow-2xl">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-1)] border-b border-[var(--line)] text-[11px] font-mono">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold tracking-wider">
                        {standard}
                    </span>
                    <span className="text-[var(--ink)] font-medium hidden sm:inline">{title}</span>
                </div>

                <div className="flex items-center gap-3">
                    {setShowAssembly && (
                        <button
                            type="button"
                            onClick={() => setShowAssembly(!showAssembly)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                showAssembly
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                    : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)] hover:text-[var(--ink)]'
                            }`}
                        >
                            {showAssembly ? <Eye size={12} /> : <EyeOff size={12} />}
                            <span>{t12(language, 'Assembly / Part', 'Montaj / Parça')}</span>
                        </button>
                    )}
                    <span className="text-[10px] text-[var(--alu-dim)] font-mono hidden md:inline">{t12(language, 'SCALE', 'ÖLÇEK')} {scale}</span>
                </div>
            </div>

            {/* SVG Engineering Canvas */}
            <div className="flex-1 bg-[var(--bg-1)] relative flex items-center justify-center p-2 overflow-hidden">
                <svg
                    viewBox={`0 0 ${vbW} ${vbH}`}
                    className="w-full h-auto min-h-[360px] max-h-[500px]"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <DrawingDefs
                        ids={{
                            hatch: `hatch-${rawId}`,
                            arrow: `arrow-${rawId}`,
                            metalSteel: `metalSteel-${rawId}`,
                            copper: `copper-${rawId}`,
                            darkMetal: `darkMetal-${rawId}`,
                        }}
                    />

                    {/* Blueprint Background Grid */}
                    <rect width={vbW} height={vbH} fill="var(--bg-2)" stroke="var(--line)" rx="8" />
                    {Array.from({ length: Math.ceil(vbW / 40) + 1 }).map((_, i) => (
                        <line
                            key={`v${i}`}
                            x1={i * 40}
                            y1={0}
                            x2={i * 40}
                            y2={vbH}
                            stroke="var(--cyan, #00e5ff)"
                            strokeWidth="0.6"
                            opacity={i % 4 === 0 ? 0.08 : 0.025}
                        />
                    ))}
                    {Array.from({ length: Math.ceil(vbH / 40) + 1 }).map((_, i) => (
                        <line
                            key={`h${i}`}
                            x1={0}
                            y1={i * 40}
                            x2={vbW}
                            y2={i * 40}
                            stroke="var(--cyan, #00e5ff)"
                            strokeWidth="0.6"
                            opacity={i % 4 === 0 ? 0.08 : 0.025}
                        />
                    ))}

                    {/* ISO Standard Outer Drawing Border */}
                    <rect x="12" y="12" width={vbW - 24} height={vbH - 24} fill="none" stroke="var(--line, #1e293b)" strokeWidth="1.4" rx="4" />
                    <rect x="16" y="16" width={vbW - 32} height={vbH - 32} fill="none" stroke="var(--line, #334155)" strokeWidth="0.7" />

                    {/* Drawing Area */}
                    <g>{children}</g>

                    {/* Right CAD Dimension / Legend HUD Card (Rendered only if not hidden) */}
                    {!hideLegend && legend && (
                        <g transform="translate(488, 24)">
                            <rect
                                x="0"
                                y="0"
                                width="224"
                                height="382"
                                rx="10"
                                fill="var(--bg-1)"
                                stroke="var(--cyan, #00e5ff)"
                                strokeWidth="1.2"
                                strokeOpacity="0.3"
                            />
                            <rect x="0" y="0" width="224" height="36" rx="10" fill="url(#cyanSurfaceGlow)" />
                            <text x="14" y="23" fontSize="10.5" fontWeight="900" fill="var(--cyan, #00e5ff)" fontFamily="ui-monospace, monospace" letterSpacing="0.1em">
                                {t12(language, 'TECHNICAL SPECS', 'TEKNİK ÖLÇÜLER')}
                            </text>
                            <line x1="0" y1="36" x2="224" y2="36" stroke="var(--cyan, #00e5ff)" strokeWidth="1" strokeOpacity="0.2" />
                            <g transform="translate(14, 52)">{legend}</g>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}

function LegendRow({ y, label, value, highlight = false, color, unit }: { y: number; label: string; value: string | number; highlight?: boolean; color?: string; unit?: string }) {
    const textColor = color || (highlight ? 'var(--cyan, #00e5ff)' : 'var(--ink, #f8fafc)');
    return (
        <g transform={`translate(0, ${y})`} className="font-mono">
            <text x="0" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">
                {label}
            </text>
            <text x="0" y="16" fontSize="13.5" fontWeight="bold" fill={textColor}>
                {value} {unit && <tspan fontSize="9.5" fontWeight="normal" fill="var(--muted, #64748b)">{unit}</tspan>}
            </text>
        </g>
    );
}

function DimBadge({ x, y, text, color = 'var(--cyan, #00e5ff)', bg = 'var(--bg-1, #030712)' }: { x: number; y: number; text: string; color?: string; bg?: string }) {
    const w = Math.max(56, text.length * 8.8 + 20);
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect
                x={-w / 2}
                y={-13}
                width={w}
                height={26}
                rx="5"
                fill={bg}
                stroke={color}
                strokeWidth="1.3"
                strokeOpacity="0.95"
            />
            <text
                x="0"
                y="5"
                textAnchor="middle"
                fontSize="13"
                fontWeight="900"
                fill={color}
                fontFamily="ui-monospace, monospace"
            >
                {text}
            </text>
        </g>
    );
}

function HorizDim({
    x1,
    x2,
    y,
    extY1,
    extY2,
    label,
    color = '#00e5ff',
    arrowId,
}: {
    x1: number;
    x2: number;
    y: number;
    extY1: number;
    extY2?: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const mid = (x1 + x2) / 2;
    const y2 = extY2 ?? extY1;
    const marker = arrowId ? `url(#${arrowId})` : undefined;

    return (
        <g stroke={color} strokeWidth="1" fill="none">
            <line x1={x1} y1={extY1} x2={x1} y2={y > extY1 ? y + 6 : y - 6} stroke="#64748b" strokeWidth="0.9" strokeDasharray="3 2" opacity="0.7" />
            <line x1={x2} y1={y2} x2={x2} y2={y > y2 ? y + 6 : y - 6} stroke="#64748b" strokeWidth="0.9" strokeDasharray="3 2" opacity="0.7" />
            <line x1={x1} y1={y} x2={x2} y2={y} markerStart={marker} markerEnd={marker} stroke={color} strokeWidth="1.3" />
            <DimBadge x={mid} y={y} text={label} color={color} />
        </g>
    );
}

function VertDim({
    x,
    y1,
    y2,
    extX1,
    extX2,
    label,
    color = '#00e5ff',
    arrowId,
}: {
    x: number;
    y1: number;
    y2: number;
    extX1: number;
    extX2?: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const mid = (y1 + y2) / 2;
    const x2 = extX2 ?? extX1;
    const marker = arrowId ? `url(#${arrowId})` : undefined;

    return (
        <g stroke={color} strokeWidth="1" fill="none">
            <line x1={extX1} y1={y1} x2={x > extX1 ? x + 6 : x - 6} y2={y1} stroke="#64748b" strokeWidth="0.9" strokeDasharray="3 2" opacity="0.7" />
            <line x1={x2} y1={y2} x2={x > x2 ? x + 6 : x - 6} y2={y2} stroke="#64748b" strokeWidth="0.9" strokeDasharray="3 2" opacity="0.7" />
            <line x1={x} y1={y1} x2={x} y2={y2} markerStart={marker} markerEnd={marker} stroke={color} strokeWidth="1.3" />
            <DimBadge x={x} y={mid} text={label} color={color} />
        </g>
    );
}

function CenterLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#00e5ff"
            strokeWidth="1.1"
            strokeDasharray="18 4 3 4"
            opacity="0.7"
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. DIN 912 / ISO 4762 IMBUS (SOCKET HEAD CAP SCREW & COUNTERBORE)
// Scaled up to fill 85% of canvas with distinct screw knurl, socket, & chamfer
// ═══════════════════════════════════════════════════════════════════════════

export function ImbusSVG({
    data,
    hideLegend = false,
}: {
    data: { size: string; D: number; T: number; d: number; dk: number; k: number; s?: number; dh?: number };
    hideLegend?: boolean;
}) {
  const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const [showAssembly, setShowAssembly] = useState(true);
    const rawId = React.useId().replace(/:/g, '');
    const hatchId = `hatch-${rawId}`;
    const arrowId = `arrow-${rawId}`;

    const effectiveDh = data.dh ?? (data.d <= 3 ? data.d + 0.4 : data.d <= 6 ? data.d + 0.6 : data.d <= 10 ? data.d + 1.5 : data.d + 2);

    const cx = hideLegend ? 280 : 240;
    const topY = 56;
    const blockW = hideLegend ? 245 : 185;
    const blockH = 320;

    // Direct proportional scaling so the counterbore dominates the drawing
    const scaledD = 180;
    const scaledT = 112;
    const scaledDh = 110;
    const scaledDk = 160;
    const scaledK = 100;
    const hexSW = 74;

    return (
        <TechFrame
            standard="DIN 912 / ISO 4762"
            title={`${data.size} ${t12(language, 'Socket Head Cap Screw Counterbore Section', 'Silindirik Başlı İmbus Havşa Kesiti')}`}
            showAssembly={showAssembly}
            setShowAssembly={setShowAssembly}
            hideLegend={hideLegend}
            legend={
                <>
                    <LegendRow y={0} label={t12(language, 'Counterbore Dia (D)', 'Havşa Çapı (D)')} value={`Ø${data.D}`} highlight />
                    <LegendRow y={46} label={t12(language, 'Counterbore Depth (T)', 'Havşa Derinliği (T)')} value={data.T} highlight />
                    <LegendRow y={92} label={t12(language, 'Clearance Hole (dh)', 'Geçiş Deliği (dh)')} value={`Ø${effectiveDh}`} highlight color="#38bdf8" />
                    <LegendRow y={138} label={t12(language, 'Screw Head Dia (dk)', 'Cıvata Kafa Çapı (dk)')} value={`Ø${data.dk}`} color="#f59e0b" />
                    <LegendRow y={184} label={t12(language, 'Screw Head Height (k)', 'Cıvata Kafa Boyu (k)')} value={data.k} color="#f59e0b" />
                    <LegendRow y={230} label={t12(language, 'Hex Key Size (s)', 'Alyan Anahtarı (s)')} value={`SW ${formatEngineeringValue(Math.max(2.5, data.s || (data.d * 0.8)), precision, false)}`} />
                </>
            }
        >
            <CenterLine x1={cx} y1={topY - 30} x2={cx} y2={topY + blockH + 30} />

            {/* Left Workpiece Metal Block */}
            <path
                d={`M ${cx - blockW} ${topY} L ${cx - scaledD / 2} ${topY} L ${cx - scaledD / 2} ${topY + scaledT} L ${cx - scaledDh / 2} ${topY + scaledT} L ${cx - scaledDh / 2} ${topY + blockH} L ${cx - blockW} ${topY + blockH} Z`}
                fill={`url(#${hatchId})`}
                stroke="#1e293b"
                strokeWidth="1.4"
            />
            <path
                d={`M ${cx - blockW} ${topY} L ${cx - scaledD / 2} ${topY} L ${cx - scaledD / 2} ${topY + scaledT} L ${cx - scaledDh / 2} ${topY + scaledT} L ${cx - scaledDh / 2} ${topY + blockH}`}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Right Workpiece Metal Block */}
            <path
                d={`M ${cx + scaledD / 2} ${topY} L ${cx + blockW} ${topY} L ${cx + blockW} ${topY + blockH} L ${cx + scaledDh / 2} ${topY + blockH} L ${cx + scaledDh / 2} ${topY + scaledT} L ${cx + scaledD / 2} ${topY + scaledT} Z`}
                fill={`url(#${hatchId})`}
                stroke="#1e293b"
                strokeWidth="1.4"
            />
            <path
                d={`M ${cx + blockW} ${topY} L ${cx + scaledD / 2} ${topY} L ${cx + scaledD / 2} ${topY + scaledT} L ${cx + scaledDh / 2} ${topY + scaledT} L ${cx + scaledDh / 2} ${topY + blockH}`}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Assembled DIN 912 Screw */}
            {showAssembly && (
                <g>
                    {/* Head Cylinder with Chamfers */}
                    <rect
                        x={cx - scaledDk / 2}
                        y={topY + (scaledT - scaledK)}
                        width={scaledDk}
                        height={scaledK}
                        rx="3"
                        fill="#0c1424"
                        stroke="#38bdf8"
                        strokeWidth="2.2"
                    />

                    {/* Knurled Grip Texture on Head Sides */}
                    {[-70, -60, -50, -40, 40, 50, 60, 70].map((dx, i) => (
                        <line
                            key={`knurl-${i}`}
                            x1={cx + dx}
                            y1={topY + (scaledT - scaledK) + 4}
                            x2={cx + dx}
                            y2={topY + scaledT - 4}
                            stroke="#38bdf8"
                            strokeWidth="1"
                            opacity="0.35"
                        />
                    ))}

                    {/* 3D Hex Socket Recess with Facets */}
                    <path
                        d={`M ${cx - hexSW / 2} ${topY + (scaledT - scaledK)} L ${cx - hexSW / 2} ${topY + (scaledT - scaledK) + 55} L ${cx} ${topY + (scaledT - scaledK) + 68} L ${cx + hexSW / 2} ${topY + (scaledT - scaledK) + 55} L ${cx + hexSW / 2} ${topY + (scaledT - scaledK)} Z`}
                        fill="#020617"
                        stroke="#00e5ff"
                        strokeWidth="1.8"
                    />
                    <line
                        x1={cx}
                        y1={topY + (scaledT - scaledK)}
                        x2={cx}
                        y2={topY + (scaledT - scaledK) + 68}
                        stroke="#00e5ff"
                        strokeWidth="1.2"
                        opacity="0.8"
                    />
                    <DimBadge
                        x={cx}
                        y={topY + (scaledT - scaledK) + 32}
                        text={`SW ${data.s || 8}`}
                        color="#00e5ff"
                    />

                    {/* Threaded Shank with Pitch Lines */}
                    <rect
                        x={cx - (scaledDh - 14) / 2}
                        y={topY + scaledT}
                        width={scaledDh - 14}
                        height={blockH - scaledT}
                        fill="#080f1e"
                        stroke="#38bdf8"
                        strokeWidth="2"
                    />
                    {Array.from({ length: 9 }).map((_, i) => (
                        <line
                            key={`th-${i}`}
                            x1={cx - (scaledDh - 14) / 2 + 4}
                            y1={topY + scaledT + 18 + i * 16}
                            x2={cx + (scaledDh - 14) / 2 - 4}
                            y2={topY + scaledT + 24 + i * 16}
                            stroke="#38bdf8"
                            strokeWidth="1"
                            opacity="0.45"
                        />
                    ))}
                </g>
            )}

            {/* CAD Dimensions */}
            {/* 1. Counterbore Diameter D */}
            <HorizDim
                x1={cx - scaledD / 2}
                x2={cx + scaledD / 2}
                y={topY - 26}
                extY1={topY}
                label={`Ø${data.D} mm (Counterbore D)`}
                color="#00e5ff"
                arrowId={arrowId}
            />

            {/* 2. Clearance Hole dh */}
            <HorizDim
                x1={cx - scaledDh / 2}
                x2={cx + scaledDh / 2}
                y={topY + blockH + 26}
                extY1={topY + blockH}
                label={`Ø${effectiveDh} mm (Clearance dh)`}
                color="#38bdf8"
                arrowId={arrowId}
            />

            {/* 3. Counterbore Depth T */}
            <VertDim
                x={cx + scaledD / 2 + 28}
                y1={topY}
                y2={topY + scaledT}
                extX1={cx + scaledD / 2}
                label={`T = ${data.T} mm`}
                color="#38bdf8"
                arrowId={`${arrowId}-sky`}
            />

            {/* 4. Screw Head Height k */}
            {showAssembly && (
                <VertDim
                    x={cx - scaledD / 2 - 28}
                    y1={topY + (scaledT - scaledK)}
                    y2={topY + scaledT}
                    extX1={cx - scaledDk / 2}
                    label={`k = ${data.k} mm`}
                    color="#f59e0b"
                    arrowId={`${arrowId}-amber`}
                />
            )}
        </TechFrame>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. DIN 471 / 472 RETAINING RING GROOVE (MİL & DELİK EMNİYET SEGMANI)
// Massive shaft diameter, 15° lead-in chamfer, edge margin n >= 3t
// ═══════════════════════════════════════════════════════════════════════════

export function CirclipSVG({
    type,
    data,
    hideLegend = false,
}: {
    type: string;
    data: { d: number; d2: number; m: string; depth: number };
    hideLegend?: boolean;
}) {
    const { language } = useI18nStore();
    const precision = useGlobalPrecision();
    const [showAssembly, setShowAssembly] = useState(true);
    const rawId = React.useId().replace(/:/g, '');
    const hatchId = `hatch-${rawId}`;
    const arrowId = `arrow-${rawId}`;

    const isShaft = type === 'shaft';
    const cx = hideLegend ? 280 : 240;
    const cy = 215;

    // Enlarge shaft diameter to 240px (fills vertical space)
    const r1 = 120;
    const r2 = r1 - 24; // Groove depth ~24px
    const grooveW = 34;

    const leftLen = hideLegend ? 195 : 170;
    const rightLen = hideLegend ? 185 : 130;
    const chamferLen = 28;
    const chamferH = 14;

    return (
        <TechFrame
            standard={`DIN ${isShaft ? t12(language, '471 (Shaft)', '471 (Mil)') : t12(language, '472 (Bore)', '472 (Delik)')}`}
            title={`Ø${data.d} mm ${isShaft ? t12(language, 'Shaft', 'Mil') : t12(language, 'Bore', 'Delik')} ${t12(language, 'Retaining Ring Groove', 'Emniyet Segmanı Yuvası')}`}
            showAssembly={showAssembly}
            setShowAssembly={setShowAssembly}
            hideLegend={hideLegend}
            legend={
                <>
                    <LegendRow y={0} label={t12(language, 'Nominal Dia (d1)', 'Nominal Çap (d1)')} value={`Ø${data.d}`} highlight />
                    <LegendRow y={46} label={t12(language, 'Groove Dia (d2)', 'Kanal Çapı (d2)')} value={`Ø${formatEngineeringValue(Number(data.d2), precision, false)}`} highlight color="#00e5ff" />
                    <LegendRow y={92} label={t12(language, 'Groove Width (m H13)', 'Kanal Genişliği (m H13)')} value={`${data.m}`} highlight color="#f59e0b" />
                    <LegendRow y={138} label={t12(language, 'Groove Depth (t)', 'Kanal Derinliği (t)')} value={data.depth} color="#38bdf8" />
                    <LegendRow y={184} label={t12(language, 'Edge Margin (n)', 'Kenar Mesafesi (n)')} value={`${formatEngineeringValue((data.depth * 3), precision, false)} mm`} color="#34d399" />
                    <LegendRow y={230} label={t12(language, 'Tolerance Class', 'Tolerans Sınıfı')} value={isShaft ? 'd2: h11, m: H13' : 'd2: H11, m: H13'} />
                </>
            }
        >
            <CenterLine x1={cx - leftLen - 30} y1={cy} x2={cx + rightLen + 30} y2={cy} />

            {isShaft ? (
                /* DIN 471 EXTERNAL SHAFT RETAINING RING GROOVE */
                <g>
                    {/* Main Shaft Body (Left Side) */}
                    <rect
                        x={cx - leftLen}
                        y={cy - r1}
                        width={leftLen - grooveW / 2}
                        height={r1 * 2}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />

                    {/* Shaft End Section (Right Side) with 15° Lead-in Chamfer */}
                    <path
                        d={`
                            M ${cx + grooveW / 2} ${cy - r1}
                            L ${cx + rightLen - chamferLen} ${cy - r1}
                            L ${cx + rightLen} ${cy - r1 + chamferH}
                            L ${cx + rightLen} ${cy + r1 - chamferH}
                            L ${cx + rightLen - chamferLen} ${cy + r1}
                            L ${cx + grooveW / 2} ${cy + r1}
                            Z
                        `}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />

                    {/* Groove Bottom Cylinder Body */}
                    <rect
                        x={cx - grooveW / 2}
                        y={cy - r2}
                        width={grooveW}
                        height={r2 * 2}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />

                    {/* Outer Cyan Contour Lines */}
                    <path
                        d={`
                            M ${cx - leftLen} ${cy - r1}
                            L ${cx - grooveW / 2} ${cy - r1}
                            L ${cx - grooveW / 2} ${cy - r2}
                            L ${cx + grooveW / 2} ${cy - r2}
                            L ${cx + grooveW / 2} ${cy - r1}
                            L ${cx + rightLen - chamferLen} ${cy - r1}
                            L ${cx + rightLen} ${cy - r1 + chamferH}
                            L ${cx + rightLen} ${cy + r1 - chamferH}
                            L ${cx + rightLen - chamferLen} ${cy + r1}
                            L ${cx + grooveW / 2} ${cy + r1}
                            L ${cx + grooveW / 2} ${cy + r2}
                            L ${cx - grooveW / 2} ${cy + r2}
                            L ${cx - grooveW / 2} ${cy + r1}
                            L ${cx - leftLen} ${cy + r1}
                        `}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Assembled DIN 471 Spring Steel Retaining Ring */}
                    {showAssembly && (
                        <g>
                            {/* Top Circlip Cross-Section */}
                            <rect
                                x={cx - grooveW / 2 + 3}
                                y={cy - r1 - 14}
                                width={grooveW - 6}
                                height={r1 - r2 + 14}
                                rx="3"
                                fill="#0f172a"
                                stroke="#f59e0b"
                                strokeWidth="2"
                            />
                            {/* Top Plier Eyelet Hole */}
                            <circle cx={cx} cy={cy - r1 - 7} r="3.5" fill="#030712" stroke="#f59e0b" strokeWidth="1.2" />

                            {/* Bottom Circlip Cross-Section */}
                            <rect
                                x={cx - grooveW / 2 + 3}
                                y={cy + r2}
                                width={grooveW - 6}
                                height={r1 - r2 + 14}
                                rx="3"
                                fill="#0f172a"
                                stroke="#f59e0b"
                                strokeWidth="2"
                            />
                            {/* Bottom Plier Eyelet Hole */}
                            <circle cx={cx} cy={cy + r1 + 7} r="3.5" fill="#030712" stroke="#f59e0b" strokeWidth="1.2" />
                        </g>
                    )}

                    {/* Lead-in Chamfer Tag */}
                    <g transform={`translate(${cx + rightLen - 12}, ${cy - r1 - 8})`}>
                        <text x="0" y="0" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                            15° Lead-in
                        </text>
                    </g>
                </g>
            ) : (
                /* DIN 472 INTERNAL BORE RETAINING RING GROOVE */
                <g>
                    {/* Top Housing Wall */}
                    <rect x={cx - leftLen} y={cy - r1 - 50} width={leftLen + rightLen} height="50" fill={`url(#${hatchId}-hub)`} stroke="#1e293b" strokeWidth="1.4" />
                    {/* Bottom Housing Wall */}
                    <rect x={cx - leftLen} y={cy + r1} width={leftLen + rightLen} height="50" fill={`url(#${hatchId}-hub)`} stroke="#1e293b" strokeWidth="1.4" />

                    {/* Groove Pockets in Bore */}
                    <rect x={cx - grooveW / 2} y={cy - r1 - 24} width={grooveW} height="24" fill={`url(#${hatchId}-hub)`} stroke="#1e293b" strokeWidth="1.4" />
                    <rect x={cx - grooveW / 2} y={cy + r1} width={grooveW} height="24" fill={`url(#${hatchId}-hub)`} stroke="#1e293b" strokeWidth="1.4" />

                    {/* Bore Outlines */}
                    <line x1={cx - leftLen} y1={cy - r1} x2={cx - grooveW / 2} y2={cy - r1} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx - grooveW / 2} y1={cy - r1} x2={cx - grooveW / 2} y2={cy - r1 - 24} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx - grooveW / 2} y1={cy - r1 - 24} x2={cx + grooveW / 2} y2={cy - r1 - 24} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx + grooveW / 2} y1={cy - r1 - 24} x2={cx + grooveW / 2} y2={cy - r1} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx + grooveW / 2} y1={cy - r1} x2={cx + rightLen} y2={cy - r1} stroke="#00e5ff" strokeWidth="2.8" />

                    <line x1={cx - leftLen} y1={cy + r1} x2={cx - grooveW / 2} y2={cy + r1} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx - grooveW / 2} y1={cy + r1} x2={cx - grooveW / 2} y2={cy + r1 + 24} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx - grooveW / 2} y1={cy + r1 + 24} x2={cx + grooveW / 2} y2={cy + r1 + 24} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx + grooveW / 2} y1={cy + r1 + 24} x2={cx + grooveW / 2} y2={cy + r1} stroke="#00e5ff" strokeWidth="2.8" />
                    <line x1={cx + grooveW / 2} y1={cy + r1} x2={cx + rightLen} y2={cy + r1} stroke="#00e5ff" strokeWidth="2.8" />
                </g>
            )}

            {/* CAD Dimensions */}
            {/* 1. Groove Width m */}
            <HorizDim
                x1={cx - grooveW / 2}
                x2={cx + grooveW / 2}
                y={cy - r1 - 32}
                extY1={cy - r1}
                label={`m = ${data.m} (H13)`}
                color="#f59e0b"
                arrowId={`${arrowId}-amber`}
            />

            {/* 2. Edge Margin n >= 3t */}
            <HorizDim
                x1={cx + grooveW / 2}
                x2={cx + rightLen - chamferLen}
                y={cy - r1 - 32}
                extY1={cy - r1}
                label={`n ≥ ${formatEngineeringValue((data.depth * 3), precision, false)} mm (3t)`}
                color="#34d399"
                arrowId={`${arrowId}-green`}
            />

            {/* 3. Nominal Shaft Diameter d1 - Outside Left Face */}
            <VertDim
                x={cx - leftLen - 26}
                y1={cy - r1}
                y2={cy + r1}
                extX1={cx - leftLen}
                label={`Ø${data.d} mm (d₁)`}
                color="#38bdf8"
                arrowId={`${arrowId}-sky`}
            />

            {/* 4. Groove Bottom Diameter d2 - Inside Central Well */}
            <VertDim
                x={cx}
                y1={cy - r2}
                y2={cy + r2}
                extX1={cx}
                label={`Ø${formatEngineeringValue(Number(data.d2), precision, false)} mm (d₂ h11)`}
                color="#00e5ff"
                arrowId={arrowId}
            />
        </TechFrame>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. DIN 332-1 CENTER DRILL HOLES (TORNA PUNTA DELİKLERİ)
// Prominent 60° cone angle, 120° protective rim, Form A, B, R
// ═══════════════════════════════════════════════════════════════════════════

export function CenterDrillSVG({
    data,
    hideLegend = false,
}: {
    data: { type: string; form: string; d1: number; d2: number; d3?: number; t: number; t1?: number; r?: number };
    hideLegend?: boolean;
}) {
    const { language } = useI18nStore();
    const rawId = React.useId().replace(/:/g, '');
    const hatchId = `hatch-${rawId}`;
    const arrowId = `arrow-${rawId}`;
    const form = data.form || 'A';

    const cx = hideLegend ? 280 : 240;
    const topY = 56;
    const blockW = hideLegend ? 245 : 185;
    const blockH = 320;

    // Generous geometry scaling so cone and pilot fill the drawing
    const scaledD1 = 52;
    const scaledD2 = 148;
    const scaledD3 = 216;
    const coneH = 84;
    const rimH = 30;
    const pilotH = 110;

    return (
        <TechFrame
            standard={`DIN 332-1 Form ${form}`}
            title={`DIN 332 - ${data.type} ${form === 'B' ? t12(language, 'Protected Countersink', 'Çift / Koruyucu Havşalı') : form === 'R' ? t12(language, 'Radiused', 'Radyuslu') : t12(language, 'Straight 60°', 'Düz 60°')} ${t12(language, 'Center Drill Hole', 'Punta Deliği')}`}
            hideLegend={hideLegend}
            legend={
                <>
                    <LegendRow y={0} label={t12(language, 'Pilot Hole (d1)', 'Kılavuz Delik (d1)')} value={`Ø${data.d1}`} highlight />
                    <LegendRow y={46} label={t12(language, '60° Cone Dia (d2)', '60° Koni Çapı (d2)')} value={`Ø${data.d2}`} highlight color="#00e5ff" />
                    {form === 'B' && (
                        <LegendRow y={92} label={t12(language, 'Protected Outer Dia (d3)', 'Çift Havşa Dış Çapı (d3)')} value={`Ø${data.d3}`} highlight color="#f59e0b" />
                    )}
                    {form === 'R' && (
                        <LegendRow y={92} label={t12(language, 'Drill Radius (R)', 'Punta Radyusu (R)')} value={`R ${data.r}`} highlight color="#f59e0b" />
                    )}
                    <LegendRow y={form === 'A' ? 92 : 138} label={t12(language, 'Total Depth (t)', 'Toplam Derinlik (t)')} value={data.t} highlight color="#38bdf8" />
                    <LegendRow y={form === 'A' ? 138 : 184} label={t12(language, 'Cone Angles', 'Koni Açıları')} value={form === 'B' ? '60° + 120° (Koruyucu)' : '60°'} />
                    <LegendRow y={form === 'A' ? 184 : 230} label={t12(language, 'Type', 'Tip')} value={form === 'B' ? 'Form B: Korumalı Merkezleme' : form === 'R' ? 'Form R: Yay Baskılı Punta' : 'Form A: Standart Torna'} />
                </>
            }
        >
            <CenterLine x1={cx} y1={topY - 30} x2={cx} y2={topY + blockH + 30} />

            {/* Form A: 60° Cone + Pilot Hole */}
            {form === 'A' && (
                <g>
                    {/* Left Workpiece Metal */}
                    <path
                        d={`M ${cx - blockW} ${topY} L ${cx - scaledD2 / 2} ${topY} L ${cx - scaledD1 / 2} ${topY + coneH} L ${cx - scaledD1 / 2} ${topY + coneH + pilotH} L ${cx} ${topY + coneH + pilotH + 20} L ${cx} ${topY + blockH} L ${cx - blockW} ${topY + blockH} Z`}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />
                    <path
                        d={`M ${cx - blockW} ${topY} L ${cx - scaledD2 / 2} ${topY} L ${cx - scaledD1 / 2} ${topY + coneH} L ${cx - scaledD1 / 2} ${topY + coneH + pilotH} L ${cx} ${topY + coneH + pilotH + 20}`}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Right Workpiece Metal */}
                    <path
                        d={`M ${cx + scaledD2 / 2} ${topY} L ${cx + blockW} ${topY} L ${cx + blockW} ${topY + blockH} L ${cx} ${topY + blockH} L ${cx} ${topY + coneH + pilotH + 20} L ${cx + scaledD1 / 2} ${topY + coneH + pilotH} L ${cx + scaledD1 / 2} ${topY + coneH} Z`}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />
                    <path
                        d={`M ${cx + blockW} ${topY} L ${cx + scaledD2 / 2} ${topY} L ${cx + scaledD1 / 2} ${topY + coneH} L ${cx + scaledD1 / 2} ${topY + coneH + pilotH} L ${cx} ${topY + coneH + pilotH + 20}`}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* 60° Angle Arc Callout */}
                    <path d={`M ${cx - 36} ${topY + 32} A 42 42 0 0 0 ${cx + 36} ${topY + 32}`} fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="4 2" />
                    <DimBadge x={cx} y={topY + 48} text="60° Cone" color="#f59e0b" />
                </g>
            )}

            {/* Form B: Protected Countersink (60° Cone + 120° Outer Rim) */}
            {form === 'B' && (
                <g>
                    {/* Left Workpiece Metal */}
                    <path
                        d={`M ${cx - blockW} ${topY} L ${cx - scaledD3 / 2} ${topY} L ${cx - scaledD2 / 2} ${topY + rimH} L ${cx - scaledD1 / 2} ${topY + rimH + coneH} L ${cx - scaledD1 / 2} ${topY + rimH + coneH + pilotH} L ${cx} ${topY + rimH + coneH + pilotH + 20} L ${cx} ${topY + blockH} L ${cx - blockW} ${topY + blockH} Z`}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />
                    <path
                        d={`M ${cx - blockW} ${topY} L ${cx - scaledD3 / 2} ${topY} L ${cx - scaledD2 / 2} ${topY + rimH} L ${cx - scaledD1 / 2} ${topY + rimH + coneH} L ${cx - scaledD1 / 2} ${topY + rimH + coneH + pilotH} L ${cx} ${topY + rimH + coneH + pilotH + 20}`}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Right Workpiece Metal */}
                    <path
                        d={`M ${cx + scaledD3 / 2} ${topY} L ${cx + blockW} ${topY} L ${cx + blockW} ${topY + blockH} L ${cx} ${topY + blockH} L ${cx} ${topY + rimH + coneH + pilotH + 20} L ${cx + scaledD1 / 2} ${topY + rimH + coneH + pilotH} L ${cx + scaledD1 / 2} ${topY + rimH + coneH} L ${cx + scaledD2 / 2} ${topY + rimH} Z`}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />
                    <path
                        d={`M ${cx + blockW} ${topY} L ${cx + scaledD3 / 2} ${topY} L ${cx + scaledD2 / 2} ${topY + rimH} L ${cx + scaledD1 / 2} ${topY + rimH + coneH} L ${cx + scaledD1 / 2} ${topY + rimH + coneH + pilotH} L ${cx} ${topY + rimH + coneH + pilotH + 20}`}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* 120° Outer Rim Chamfer Callout (Leader to left side) */}
                    <line x1={cx - scaledD3 / 2 + 12} y1={topY + rimH / 2} x2={cx - scaledD3 / 2 - 24} y2={topY - 14} stroke="#f59e0b" strokeWidth="1.2" markerStart={`url(#${arrowId}-amber)`} />
                    <DimBadge x={cx - scaledD3 / 2 - 70} y={topY - 14} text="120° Rim" color="#f59e0b" />

                    {/* 60° Inner Center Cone Callout (Leader to left side to eliminate overlap with depth t) */}
                    <line x1={cx - scaledD1 / 2 - 14} y1={topY + rimH + coneH / 2} x2={cx - scaledD1 / 2 - 45} y2={topY + rimH + coneH / 2} stroke="#38bdf8" strokeWidth="1.2" markerStart={`url(#${arrowId}-sky)`} />
                    <DimBadge x={cx - scaledD1 / 2 - 92} y={topY + rimH + coneH / 2} text="60° Cone" color="#38bdf8" />

                    {/* d3 Outer Diameter */}
                    <HorizDim
                        x1={cx - scaledD3 / 2}
                        x2={cx + scaledD3 / 2}
                        y={topY - 26}
                        extY1={topY}
                        label={`Ø${data.d3} mm (d3)`}
                        color="#f59e0b"
                        arrowId={`${arrowId}-amber`}
                    />
                </g>
            )}

            {/* Form R: Radiused Curved Center Hole */}
            {form === 'R' && (
                <g>
                    {/* Left Workpiece Metal */}
                    <path
                        d={`M ${cx - blockW} ${topY} L ${cx - scaledD2 / 2} ${topY} Q ${cx - scaledD1 / 2} ${topY + coneH * 0.5} ${cx - scaledD1 / 2} ${topY + coneH} L ${cx - scaledD1 / 2} ${topY + coneH + pilotH} L ${cx} ${topY + coneH + pilotH + 20} L ${cx} ${topY + blockH} L ${cx - blockW} ${topY + blockH} Z`}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />
                    <path
                        d={`M ${cx - blockW} ${topY} L ${cx - scaledD2 / 2} ${topY} Q ${cx - scaledD1 / 2} ${topY + coneH * 0.5} ${cx - scaledD1 / 2} ${topY + coneH} L ${cx - scaledD1 / 2} ${topY + coneH + pilotH} L ${cx} ${topY + coneH + pilotH + 20}`}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Right Workpiece Metal */}
                    <path
                        d={`M ${cx + scaledD2 / 2} ${topY} L ${cx + blockW} ${topY} L ${cx + blockW} ${topY + blockH} L ${cx} ${topY + blockH} L ${cx} ${topY + coneH + pilotH + 20} L ${cx + scaledD1 / 2} ${topY + coneH + pilotH} L ${cx + scaledD1 / 2} ${topY + coneH} Q ${cx + scaledD1 / 2} ${topY + coneH * 0.5} ${cx + scaledD2 / 2} ${topY} Z`}
                        fill={`url(#${hatchId})`}
                        stroke="#1e293b"
                        strokeWidth="1.4"
                    />
                    <path
                        d={`M ${cx + blockW} ${topY} L ${cx + scaledD2 / 2} ${topY} Q ${cx + scaledD1 / 2} ${topY + coneH * 0.5} ${cx + scaledD1 / 2} ${topY + coneH} L ${cx + scaledD1 / 2} ${topY + coneH + pilotH} L ${cx} ${topY + coneH + pilotH + 20}`}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    <DimBadge x={cx} y={topY + coneH / 2} text={`R ${data.r || 2.5} mm`} color="#f59e0b" />
                </g>
            )}

            {/* Common Dimensions */}
            {/* 1. d2 Cone Diameter */}
            {form !== 'B' && (
                <HorizDim
                    x1={cx - scaledD2 / 2}
                    x2={cx + scaledD2 / 2}
                    y={topY - 26}
                    extY1={topY}
                    label={`Ø${data.d2} mm (d₂)`}
                    color="#00e5ff"
                    arrowId={arrowId}
                />
            )}

            {/* 2. d1 Pilot Hole Diameter */}
            <HorizDim
                x1={cx - scaledD1 / 2}
                x2={cx + scaledD1 / 2}
                y={topY + (form === 'B' ? rimH : 0) + coneH + pilotH + 34}
                extY1={topY + (form === 'B' ? rimH : 0) + coneH + pilotH}
                label={`Ø${data.d1} mm (d₁)`}
                color="#38bdf8"
                arrowId={arrowId}
            />

            {/* 3. Total Depth t */}
            <VertDim
                x={cx + (form === 'B' ? scaledD3 : scaledD2) / 2 + 28}
                y1={topY}
                y2={topY + (form === 'B' ? rimH : 0) + coneH}
                extX1={cx + (form === 'B' ? scaledD3 : scaledD2) / 2}
                label={`t = ${data.t} mm`}
                color="#f59e0b"
                arrowId={`${arrowId}-amber`}
            />
        </TechFrame>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. DIN 74 FORM A / DIN 7991 (COUNTERSUNK 90° SCREW RECESS)
// ═══════════════════════════════════════════════════════════════════════════

export interface CountersinkData {
    size: string;
    d: number;
    d1?: number;
    d2?: number;
    D?: number;
    dk?: number;
    k?: number;
    s?: number;
    t?: number;
    alpha?: number;
    dh?: number;
}

export function CountersinkSVG({
    data,
    hideLegend = false,
}: {
    data: CountersinkData;
    hideLegend?: boolean;
}) {
    const { language } = useI18nStore();
    const [showAssembly, setShowAssembly] = useState(true);
    const rawId = React.useId().replace(/:/g, '');
    const hatchId = `hatch-${rawId}`;
    const arrowId = `arrow-${rawId}`;

    const effectiveD = data.D ?? data.d2 ?? 17.2;
    const effectiveDh = data.dh ?? data.d1 ?? (data.d <= 3 ? data.d + 0.4 : data.d <= 6 ? data.d + 0.6 : data.d <= 10 ? data.d + 1.5 : data.d + 2);
    const effectiveK = data.k ?? data.t ?? 4.1;
    const effectiveSW = data.s ?? (data.d === 3 ? 2 : data.d === 4 ? 2.5 : data.d === 5 ? 3 : data.d === 6 ? 4 : data.d === 8 ? 5 : data.d === 10 ? 6 : data.d === 12 ? 8 : 10);

    const cx = hideLegend ? 280 : 240;
    const topY = 56;
    const blockW = hideLegend ? 245 : 185;
    const blockH = 320;

    const scaledD = 200;
    const scaledDh = 100;
    const coneH = (scaledD - scaledDh) / 2; // 90° countersink: 45° per side, height = (D - d)/2
    const hexSW = 65;

    return (
        <TechFrame
            standard="DIN 74 Form A / DIN 7991"
            title={`${data.size} ${t12(language, 'Countersunk Screw Recess (90°)', '90° Havşalı Cıvata Yuvası')}`}
            showAssembly={showAssembly}
            setShowAssembly={setShowAssembly}
            hideLegend={hideLegend}
            legend={
                <>
                    <LegendRow y={0} label={t12(language, 'Countersink Dia (D)', 'Havşa Çapı (D)')} value={`Ø${effectiveD}`} highlight />
                    <LegendRow y={46} label={t12(language, 'Countersink Angle', 'Havşa Açısı')} value="90° (DIN 74-A)" highlight color="#f59e0b" />
                    <LegendRow y={92} label={t12(language, 'Clearance Hole (dh)', 'Geçiş Deliği (dh)')} value={`Ø${effectiveDh}`} highlight color="#38bdf8" />
                    <LegendRow y={138} label={t12(language, 'Head Height (k max)', 'Kafa Yüksekliği (k)')} value={effectiveK} color="#f59e0b" />
                    <LegendRow y={184} label={t12(language, 'Hex Socket (s)', 'Alyan Ölçüsü (s)')} value={`SW ${effectiveSW}`} />
                </>
            }
        >
            <CenterLine x1={cx} y1={topY - 30} x2={cx} y2={topY + blockH + 30} />

            {/* Left Workpiece Metal */}
            <path
                d={`M ${cx - blockW} ${topY} L ${cx - scaledD / 2} ${topY} L ${cx - scaledDh / 2} ${topY + coneH} L ${cx - scaledDh / 2} ${topY + blockH} L ${cx - blockW} ${topY + blockH} Z`}
                fill={`url(#${hatchId})`}
                stroke="#1e293b"
                strokeWidth="1.4"
            />
            <path
                d={`M ${cx - blockW} ${topY} L ${cx - scaledD / 2} ${topY} L ${cx - scaledDh / 2} ${topY + coneH} L ${cx - scaledDh / 2} ${topY + blockH}`}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Right Workpiece Metal */}
            <path
                d={`M ${cx + scaledD / 2} ${topY} L ${cx + blockW} ${topY} L ${cx + blockW} ${topY + blockH} L ${cx + scaledDh / 2} ${topY + blockH} L ${cx + scaledDh / 2} ${topY + coneH} Z`}
                fill={`url(#${hatchId})`}
                stroke="#1e293b"
                strokeWidth="1.4"
            />
            <path
                d={`M ${cx + blockW} ${topY} L ${cx + scaledD / 2} ${topY} L ${cx + scaledDh / 2} ${topY + coneH} L ${cx + scaledDh / 2} ${topY + blockH}`}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 90° Countersink Angle Callout Arc */}
            <path d={`M ${cx - 36} ${topY + 18} A 40 40 0 0 0 ${cx + 36} ${topY + 18}`} fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="4 2" />
            <DimBadge x={cx} y={topY + 34} text="90° (DIN 74-A)" color="#f59e0b" />

            {/* Assembled Flush DIN 7991 Screw */}
            {showAssembly && (
                <g>
                    {/* Countersunk Flat Head Seated Flush */}
                    <path
                        d={`M ${cx - scaledD / 2 + 3} ${topY} L ${cx + scaledD / 2 - 3} ${topY} L ${cx + scaledDh / 2 - 4} ${topY + coneH - 2} L ${cx - scaledDh / 2 + 4} ${topY + coneH - 2} Z`}
                        fill="#0c1424"
                        stroke="#38bdf8"
                        strokeWidth="2"
                    />

                    {/* 3D Hex Socket */}
                    <rect
                        x={cx - hexSW / 2}
                        y={topY}
                        width={hexSW}
                        height={coneH - 6}
                        fill="#020617"
                        stroke="#00e5ff"
                        strokeWidth="1.6"
                    />
                    <DimBadge x={cx} y={topY + (coneH - 6) / 2} text={`SW ${effectiveSW}`} color="#00e5ff" />

                    {/* Threaded Shank */}
                    <rect
                        x={cx - (scaledDh - 14) / 2}
                        y={topY + coneH - 2}
                        width={scaledDh - 14}
                        height={blockH - coneH + 2}
                        fill="#080f1e"
                        stroke="#38bdf8"
                        strokeWidth="2"
                    />
                    {Array.from({ length: 9 }).map((_, i) => (
                        <line
                            key={`cth-${i}`}
                            x1={cx - (scaledDh - 14) / 2 + 4}
                            y1={topY + coneH + 18 + i * 16}
                            x2={cx + (scaledDh - 14) / 2 - 4}
                            y2={topY + coneH + 24 + i * 16}
                            stroke="#38bdf8"
                            strokeWidth="1"
                            opacity="0.45"
                        />
                    ))}
                </g>
            )}

            {/* CAD Dimensions */}
            {/* 1. Countersink Diameter D */}
            <HorizDim
                x1={cx - scaledD / 2}
                x2={cx + scaledD / 2}
                y={topY - 26}
                extY1={topY}
                label={`Ø${effectiveD} mm (DIN 74-A)`}
                color="#00e5ff"
                arrowId={arrowId}
            />

            {/* 2. Clearance Hole dh */}
            <HorizDim
                x1={cx - scaledDh / 2}
                x2={cx + scaledDh / 2}
                y={topY + blockH + 26}
                extY1={topY + blockH}
                label={`Ø${effectiveDh} mm (Clearance)`}
                color="#38bdf8"
                arrowId={arrowId}
            />
        </TechFrame>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. UNDERCUT SECTION RE-EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export function UndercutSectionSVG(props: any) {
    return (
        <UndercutVisualizer
            dSmall={props.d || 40}
            dLarge={props.D || (props.d ? props.d + 15 : 55)}
            r={props.r || 1.0}
            form={props.form || 'E'}
            t1={props.t1 || 0.2}
            t2={props.t2 || 0.1}
            f={props.f || 2.5}
            g={props.g || 1.4}
            hideLegend={props.hideLegend}
        />
    );
}
