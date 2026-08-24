'use client';

import React from 'react';

export interface OpenDrivePath {
    d: string;
    phi: number;
    thetaRad: number;
}

/** Point on circle using math angles (y-up); converted to SVG (y-down). */
function polar(cx: number, cy: number, r: number, angleRad: number) {
    return { x: cx + r * Math.cos(angleRad), y: cy - r * Math.sin(angleRad) };
}

/**
 * Open-belt path tangent to two circles (pitch or outer radii).
 * Uses y-up trigonometry internally so the belt wraps outside pulleys in SVG.
 */
export function openDrivePath(
    cx1: number,
    cy: number,
    r1: number,
    cx2: number,
    r2: number,
    cy2 = cy,
): OpenDrivePath | null {
    const dx = cx2 - cx1;
    const dy = cy2 - cy;
    const C = Math.hypot(dx, dy);
    if (C <= 0 || r1 <= 0 || r2 <= 0) return null;
    if (C <= Math.abs(r2 - r1)) return null;

    const base = Math.atan2(dy, dx);
    const theta = Math.acos((r1 - r2) / C);

    const aTop = base + theta;
    const aBot = base - theta;

    const p1t = polar(cx1, cy, r1, aTop);
    const p2t = polar(cx2, cy2, r2, aTop);
    const p2b = polar(cx2, cy2, r2, aBot);
    const p1b = polar(cx1, cy, r1, aBot);

    const largeArc1 = r1 >= r2 ? 1 : 0;
    const largeArc2 = r2 >= r1 ? 1 : 0;

    const d = [
        `M ${p1t.x.toFixed(2)} ${p1t.y.toFixed(2)}`,
        `L ${p2t.x.toFixed(2)} ${p2t.y.toFixed(2)}`,
        `A ${r2} ${r2} 0 ${largeArc2} 1 ${p2b.x.toFixed(2)} ${p2b.y.toFixed(2)}`,
        `L ${p1b.x.toFixed(2)} ${p1b.y.toFixed(2)}`,
        `A ${r1} ${r1} 0 ${largeArc1} 1 ${p1t.x.toFixed(2)} ${p1t.y.toFixed(2)}`,
        'Z',
    ].join(' ');

    const phi = Math.asin(Math.abs(r2 - r1) / C);
    const thetaRad = Math.PI - 2 * phi;

    return { d, phi, thetaRad };
}

/** Layout helper: scale mm geometry into SVG px with correct center distance. */
export function openDriveLayout(
    d1Mm: number,
    d2Mm: number,
    centerMm: number,
    viewW: number,
    viewH: number,
    rightReserve = 48,
    verticalFraction = 0.38,
) {
    const r1 = Math.max(5, d1Mm / 2);
    const r2 = Math.max(5, d2Mm / 2);
    const C = Math.max(centerMm, r1 + r2);
    const cy = viewH / 2;
    const scaleW = (viewW - rightReserve) / (r1 + C + r2);
    const scaleH = (viewH * verticalFraction) / Math.max(r1, r2);
    const scale = Math.min(scaleW, scaleH);
    const sr1 = r1 * scale;
    const sr2 = r2 * scale;
    const gap = C * scale;
    const drawW = sr1 + gap + sr2;
    const startX = Math.max(24, (viewW - rightReserve - drawW) / 2);
    const cx1 = startX + sr1;
    const cx2 = cx1 + gap;
    return { cx1, cx2, cy, sr1, sr2, scale, Cmm: C, r1mm: r1, r2mm: r2 };
}

export function openBeltPitchLengthMm(dSmall: number, dLarge: number, centerDistMm: number): number {
    const d1 = Math.min(dSmall, dLarge);
    const d2 = Math.max(dSmall, dLarge);
    const C = centerDistMm;
    if (C <= 0) return 0;
    return 2 * C + (Math.PI / 2) * (d1 + d2) + Math.pow(d2 - d1, 2) / (4 * C);
}

/** ISO 5291 pitch length using tooth-derived pitch diameters (d = z·p/π). */
export function timingBeltLengthMm(
    pitchMm: number,
    z1: number,
    z2: number,
    centerDistMm: number,
): { lengthMm: number; betaDeg: number } {
    if (pitchMm <= 0 || centerDistMm <= 0 || z1 <= 0 || z2 <= 0) {
        return { lengthMm: 0, betaDeg: 0 };
    }
    const d1 = (pitchMm * z1) / Math.PI;
    const d2 = (pitchMm * z2) / Math.PI;
    const dSmall = Math.min(d1, d2);
    const dLarge = Math.max(d1, d2);
    const lengthMm = openBeltPitchLengthMm(dSmall, dLarge, centerDistMm);
    const arg = (dLarge - dSmall) / (2 * centerDistMm);
    const betaRad = Math.abs(arg) <= 1 ? Math.asin(arg) : 0;
    const betaDeg = (betaRad * 180) / Math.PI;
    return { lengthMm, betaDeg };
}

export function pitchTeethFromLength(lengthMm: number, pitchMm: number): number {
    if (pitchMm <= 0) return 0;
    return Math.round(lengthMm / pitchMm);
}

export function catalogLengthFromTeeth(teeth: number, pitchMm: number): number {
    return teeth * pitchMm;
}

/** Inverse ISO 5291 open-belt length → center distance (pick root nearest preferNear). */
export function centerDistanceFromBeltLengthMm(
    dSmall: number,
    dLarge: number,
    lengthMm: number,
    preferNear?: number,
): number | null {
    const minC = (dSmall + dLarge) / 2;
    const A = (Math.PI / 2) * (dSmall + dLarge);
    const B = Math.pow(dLarge - dSmall, 2);
    const disc = Math.pow(lengthMm - A, 2) - 2 * B;
    if (disc < 0) return null;
    const s = Math.sqrt(disc);
    const roots = [((lengthMm - A) + s) / 4, ((lengthMm - A) - s) / 4].filter((c) => c >= minC - 1e-3);
    if (roots.length === 0) return null;
    if (preferNear != null) {
        return roots.reduce((best, c) => (Math.abs(c - preferNear) < Math.abs(best - preferNear) ? c : best));
    }
    return Math.max(...roots);
}

/** Snap timing belt to integer teeth and back-solve center distance (ISO 13050 catalog flow). */
export function snapTimingBeltCatalog(
    dSmall: number,
    dLarge: number,
    centerTargetMm: number,
    pitchMm: number,
): {
    L_theoretical: number;
    beltTeeth: number;
    L_standard: number;
    C_actual: number;
} {
    const L_theoretical = openBeltPitchLengthMm(dSmall, dLarge, centerTargetMm);
    const beltTeeth = Math.max(2, Math.round(L_theoretical / pitchMm));
    const L_standard = beltTeeth * pitchMm;
    const C_actual = centerDistanceFromBeltLengthMm(dSmall, dLarge, L_standard, centerTargetMm)
        ?? centerTargetMm;
    return { L_theoretical, beltTeeth, L_standard, C_actual };
}

/** SVG polygon path alternating tip/root radii (timing pulleys, sprockets). */
export function toothedWheelPath(
    cx: number,
    cy: number,
    rTip: number,
    rRoot: number,
    teeth: number,
    phase = 0,
): string {
    const z = Math.max(6, Math.round(teeth));
    const step = (2 * Math.PI) / z;
    const parts: string[] = [];
    for (let i = 0; i < z; i++) {
        const aTip = phase + step * i - Math.PI / 2;
        const aRoot = aTip + step / 2;
        const xTip = cx + rTip * Math.cos(aTip);
        const yTip = cy + rTip * Math.sin(aTip);
        const xRoot = cx + rRoot * Math.cos(aRoot);
        const yRoot = cy + rRoot * Math.sin(aRoot);
        parts.push(`${i === 0 ? 'M' : 'L'} ${xTip.toFixed(2)} ${yTip.toFixed(2)} L ${xRoot.toFixed(2)} ${yRoot.toFixed(2)}`);
    }
    return `${parts.join(' ')} Z`;
}

export function useFrameIds(prefix: string) {
    const raw = React.useId().replace(/:/g, '');
    return {
        grid: `${prefix}-grid-${raw}`,
        metal: `${prefix}-metal-${raw}`,
        glow: `${prefix}-glow-${raw}`,
        arrow: `${prefix}-arrow-${raw}`,
    };
}

export function DimLine({
    x1, y1, x2, y2, label, color = '#00e5ff', offset = 0,
}: {
    x1: number; y1: number; x2: number; y2: number; label: string; color?: string; offset?: number;
}) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 + offset;
    return (
        <g stroke={color} fill="none" strokeWidth="0.9" opacity="0.85">
            <line x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#tf-arrow)" markerEnd="url(#tf-arrow)" />
            <rect x={mx - label.length * 3.4 - 6} y={my - 10} width={label.length * 6.8 + 12} height={18} rx={4} fill="rgba(5,10,18,0.92)" stroke={color} strokeWidth="0.8" />
            <text x={mx} y={my + 3} textAnchor="middle" fontSize="10" fontWeight="700" fill={color} fontFamily="ui-monospace, monospace">{label}</text>
        </g>
    );
}

export function LegendPanel({
    x, y, title, rows,
}: {
    x: number; y: number; title: string;
    rows: { label: string; value: string; highlight?: boolean }[];
}) {
    const h = 44 + rows.length * 34;
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect width={200} height={h} rx={10} fill="rgba(8,14,22,0.95)" stroke="rgba(0,229,255,0.25)" strokeWidth="1" />
            <text x={14} y={22} fontSize="9" fontWeight="700" fill="#64748b" fontFamily="ui-monospace, monospace" letterSpacing="0.14em">{title}</text>
            <line x1={14} y1={30} x2={186} y2={30} stroke="rgba(255,255,255,0.08)" />
            {rows.map((row, i) => (
                <g key={row.label} transform={`translate(14, ${44 + i * 34})`}>
                    <text x={0} y={0} fontSize="9" fill="#64748b" fontFamily="ui-sans-serif, system-ui">{row.label}</text>
                    <text x={0} y={16} fontSize="12" fontWeight="700" fill={row.highlight ? '#00e5ff' : '#e2e8f0'} fontFamily="ui-monospace, monospace">{row.value}</text>
                </g>
            ))}
        </g>
    );
}

export function FrameDefs({ ids }: { ids: ReturnType<typeof useFrameIds> }) {
    return (
        <defs>
            <pattern id={ids.grid} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,229,255,0.06)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id={ids.metal} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="45%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <radialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </radialGradient>
            <marker id="tf-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
        </defs>
    );
}
