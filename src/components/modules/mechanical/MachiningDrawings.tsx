'use client';

import React from 'react';

function useSvgIds() {
    const raw = React.useId().replace(/:/g, '');
    return { hatch: `hatch-${raw}`, arrow: `arrow-${raw}` };
}

function TechFrame({ title, children, legend }: { title: string; children: React.ReactNode; legend: React.ReactNode }) {
    const clipId = React.useId().replace(/:/g, '');
    return (
        <svg viewBox="0 0 720 400" className="w-full h-full min-h-[380px] max-h-[520px]" preserveAspectRatio="xMidYMid meet">
            <defs>
                <clipPath id={`draw-clip-${clipId}`}>
                    <rect x={0} y={48} width={460} height={340} rx={4} />
                </clipPath>
            </defs>
            <rect width="720" height="400" fill="#05080f" rx="8" />
            {Array.from({ length: 12 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 40} y1={48} x2={i * 40} y2={388} stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={48 + i * 40} x2={460} y2={48 + i * 40} stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
            ))}

            <text x={24} y={28} fontSize="14" fontWeight="700" fill="#00e5ff" fontFamily="ui-monospace, monospace" letterSpacing="0.06em">
                {title}
            </text>
            <line x1={24} y1={36} x2={696} y2={36} stroke="rgba(0,229,255,0.2)" strokeWidth="1" />

            <g clipPath={`url(#draw-clip-${clipId})`}>{children}</g>

            <g transform="translate(480, 56)">
                <rect x={0} y={0} width={216} height={328} rx={12} fill="rgba(10,16,24,0.95)" stroke="rgba(0,229,255,0.25)" strokeWidth="1" />
                <text x={16} y={24} fontSize="11" fontWeight="700" fill="#64748b" fontFamily="ui-monospace, monospace" letterSpacing="0.15em">DIMENSIONS</text>
                <line x1={16} y1={32} x2={200} y2={32} stroke="rgba(255,255,255,0.08)" />
                {legend}
            </g>
        </svg>
    );
}

function LegendRow({ y, label, value, unit = 'mm', highlight = false }: { y: number; label: string; value: string | number; unit?: string; highlight?: boolean }) {
    return (
        <g transform={`translate(16, ${y})`}>
            <text x={0} y={0} fontSize="11" fill="#94a3b8" fontFamily="ui-sans-serif, system-ui">{label}</text>
            <text x={0} y={18} fontSize="15" fontWeight="700" fill={highlight ? '#00e5ff' : '#f1f5f9'} fontFamily="ui-monospace, monospace">
                {value} <tspan fontSize="11" fill="#64748b">{unit}</tspan>
            </text>
        </g>
    );
}

function DimBadge({ x, y, text, color = '#00e5ff' }: { x: number; y: number; text: string; color?: string }) {
    const w = Math.max(56, text.length * 8.5 + 16);
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect x={-w / 2} y={-14} width={w} height={22} rx={5} fill="rgba(5,10,18,0.92)" stroke={color} strokeWidth="1" />
            <text x={0} y={2} textAnchor="middle" fontSize="13" fontWeight="700" fill={color} fontFamily="ui-monospace, monospace">{text}</text>
        </g>
    );
}

function HorizDim({ x1, x2, y, extY, label, ids }: { x1: number; x2: number; y: number; extY: number; label: string; ids: { arrow: string } }) {
    const mid = (x1 + x2) / 2;
    return (
        <g stroke="#64748b" fill="none" strokeWidth="1.2">
            <line x1={x1} y1={extY} x2={x1} y2={y + 6} />
            <line x1={x2} y1={extY} x2={x2} y2={y + 6} />
            <line x1={x1} y1={y} x2={x2} y2={y} markerStart={`url(#${ids.arrow})`} markerEnd={`url(#${ids.arrow})`} />
            <DimBadge x={mid} y={y - 22} text={label} />
        </g>
    );
}

function VertDim({ x, y1, y2, label, ids }: { x: number; y1: number; y2: number; label: string; ids: { arrow: string } }) {
    const mid = (y1 + y2) / 2;
    return (
        <g stroke="#64748b" fill="none" strokeWidth="1.2">
            <line x1={x - 6} y1={y1} x2={x + 30} y2={y1} />
            <line x1={x - 6} y1={y2} x2={x + 30} y2={y2} />
            <line x1={x + 18} y1={y1} x2={x + 18} y2={y2} markerStart={`url(#${ids.arrow})`} markerEnd={`url(#${ids.arrow})`} />
            <DimBadge x={x + 18} y={mid} text={label} />
        </g>
    );
}

function DrawingDefs({ ids }: { ids: { hatch: string; arrow: string } }) {
    return (
        <defs>
            <pattern id={ids.hatch} patternUnits="userSpaceOnUse" width="8" height="8">
                <path d="M0,8 L8,0" stroke="#00e5ff" strokeWidth="0.8" opacity="0.25" />
            </pattern>
            <marker id={ids.arrow} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 Z" fill="#94a3b8" />
            </marker>
        </defs>
    );
}

function CenterLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00e5ff" strokeWidth="1" strokeDasharray="12 6 2 6" opacity="0.5" />;
}

export function ImbusSVG({ data }: { data: { size: string; d: number; D: number; T: number; dk: number; k: number } }) {
    const ids = useSvgIds();
    const maxD = Math.max(data.D, data.d);
    const s = 220 / maxD;
    const D = data.D * s;
    const d = data.d * s;
    const T = data.T * s;
    const top = 60;
    const cx = 220;

    return (
        <TechFrame title={`DIN 912 - ${data.size} Counterbore`} legend={
            <>
                <LegendRow y={48} label="Counterbore D (D)" value={data.D} highlight />
                <LegendRow y={96} label="Clearance hole D (d)" value={data.d} highlight />
                <LegendRow y={144} label="Counterbore depth (T)" value={data.T} highlight />
                <LegendRow y={192} label="Head D (dk)" value={data.dk} />
                <LegendRow y={240} label="Head height (k)" value={data.k} />
            </>
        }>
            <DrawingDefs ids={ids} />
            <CenterLine x1={cx} y1={top} x2={cx} y2={top + 280} />
            <rect x={cx - 200} y={top} width={160} height={260} fill={`url(#${ids.hatch})`} stroke="#475569" strokeWidth="1.5" />
            <rect x={cx + 40} y={top} width={160} height={260} fill={`url(#${ids.hatch})`} stroke="#475569" strokeWidth="1.5" />
            <path
                d={`M ${cx - D / 2} ${top + 20} L ${cx - D / 2} ${top + 20 + T} L ${cx - d / 2} ${top + 20 + T} L ${cx - d / 2} ${top + 240} L ${cx + d / 2} ${top + 240} L ${cx + d / 2} ${top + 20 + T} L ${cx + D / 2} ${top + 20 + T} L ${cx + D / 2} ${top + 20}`}
                fill="none" stroke="#00e5ff" strokeWidth="2.5"
            />
            <HorizDim x1={cx - D / 2} x2={cx + D / 2} y={top + 8} extY={top + 20} label={`D${data.D}`} ids={ids} />
            <HorizDim x1={cx - d / 2} x2={cx + d / 2} y={top + 252} extY={top + 240} label={`D${data.d}`} ids={ids} />
            <VertDim x={cx + D / 2 + 10} y1={top + 20} y2={top + 20 + T} label={`T=${data.T}`} ids={ids} />
        </TechFrame>
    );
}

export function KeywaySVG({ d, data }: { d: number; data: { b: number; t1: number; t2: number; h: number } }) {
    const ids = useSvgIds();
    const cx = 230;
    const cy = 220;
    const r = 95;
    const s = r / (d / 2);
    const b = data.b * s;
    const t1 = data.t1 * s;
    const t2 = data.t2 * s;
    const topY = cy - r;
    const grooveFloorY = topY + t1;
    const halfB = b / 2;
    const sideY = cy - Math.sqrt(Math.max(0, r * r - halfB * halfB));

    return (
        <TechFrame title={`DIN 6885 - Keyway @ D${d}mm`} legend={
            <>
                <LegendRow y={48} label="Shaft diameter (d)" value={d} highlight />
                <LegendRow y={96} label="Key width (b)" value={data.b} highlight />
                <LegendRow y={144} label="Shaft groove depth (t1)" value={data.t1} highlight />
                <LegendRow y={192} label="Hub groove depth (t2)" value={data.t2} highlight />
                <LegendRow y={240} label="Key height (h)" value={data.h} />
            </>
        }>
            <DrawingDefs ids={ids} />
            <CenterLine x1={cx - r - 30} y1={cy} x2={cx + r + 30} y2={cy} />
            <CenterLine x1={cx} y1={cy - r - 40} x2={cx} y2={cy + r + 20} />
            <circle cx={cx} cy={cy} r={r} fill="rgba(0,229,255,0.04)" stroke="#334155" strokeWidth="2" />
            <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx + halfB} ${sideY} L ${cx + halfB} ${grooveFloorY} L ${cx - halfB} ${grooveFloorY} L ${cx - halfB} ${sideY} A ${r} ${r} 0 0 1 ${cx - r} ${cy}`}
                fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="2.5"
            />
            <rect x={cx - halfB} y={topY - t2} width={b} height={t2} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8 5" opacity="0.9" />
            <text x={cx + halfB + 8} y={topY - t2 / 2 + 4} fontSize="11" fill="#f59e0b" fontFamily="ui-monospace, monospace">hub t2</text>
            <DimBadge x={cx} y={cy + r + 32} text={`D${d}`} />
            <HorizDim x1={cx - halfB} x2={cx + halfB} y={topY - 18} extY={topY} label={`b=${data.b}`} ids={ids} />
            <VertDim x={cx - r - 28} y1={topY} y2={grooveFloorY} label={`t1=${data.t1}`} ids={ids} />
        </TechFrame>
    );
}

export function CirclipSVG({ type, data }: { type: string; data: { d: number; d2: number; m: string; depth: number } }) {
    const ids = useSvgIds();
    const cx = 230;
    const cy = 220;
    const r1 = 72;
    const r2 = r1 * (data.d2 / data.d);
    const m = Math.max((parseFloat(data.m) / data.d) * r1 * 2.2, 16);
    const isShaft = type === 'shaft';
    const leftW = 110;
    const rightW = 90;

    return (
        <TechFrame title={`DIN 47${isShaft ? '1' : '2'} - ${isShaft ? 'Shaft' : 'Bore'} Groove`} legend={
            <>
                <LegendRow y={48} label="Nominal D (d1)" value={data.d} highlight />
                <LegendRow y={96} label="Groove D (d2)" value={Number(data.d2).toFixed(2)} highlight />
                <LegendRow y={144} label="Groove width (m)" value={data.m} highlight />
                <LegendRow y={192} label="Groove depth" value={data.depth} />
            </>
        }>
            <DrawingDefs ids={ids} />
            <CenterLine x1={cx - leftW - 20} y1={cy} x2={cx + rightW + 20} y2={cy} />
            {isShaft ? (
                <g>
                    <rect x={cx - leftW - 20} y={cy - r1} width={leftW} height={r1 * 2} fill={`url(#${ids.hatch})`} stroke="#475569" strokeWidth="1.5" />
                    <rect x={cx - m / 2} y={cy - r2} width={m} height={r2 * 2} fill="#0f172a" stroke="#00e5ff" strokeWidth="2.5" />
                    <rect x={cx + m / 2 + 6} y={cy - r1} width={rightW} height={r1 * 2} fill={`url(#${ids.hatch})`} stroke="#475569" strokeWidth="1.5" strokeDasharray="8 4" />
                    <path d={`M ${cx - leftW - 20} ${cy - r1} L ${cx - m / 2} ${cy - r1} L ${cx - m / 2} ${cy - r2} L ${cx + m / 2} ${cy - r2} L ${cx + m / 2} ${cy - r1} L ${cx + rightW} ${cy - r1}`} fill="none" stroke="#00e5ff" strokeWidth="2.5" />
                    <path d={`M ${cx - leftW - 20} ${cy + r1} L ${cx - m / 2} ${cy + r1} L ${cx - m / 2} ${cy + r2} L ${cx + m / 2} ${cy + r2} L ${cx + m / 2} ${cy + r1} L ${cx + rightW} ${cy + r1}`} fill="none" stroke="#00e5ff" strokeWidth="2.5" />
                    <line x1={cx - leftW - 20} y1={cy - r1} x2={cx + rightW} y2={cy - r1} stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                    <line x1={cx - leftW - 20} y1={cy + r1} x2={cx + rightW} y2={cy + r1} stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                </g>
            ) : (
                <g>
                    <path d={`M ${cx - leftW} ${cy - 95} L ${cx + rightW} ${cy - 95} L ${cx + rightW} ${cy - r1} L ${cx + m / 2} ${cy - r1} L ${cx + m / 2} ${cy - r2} L ${cx - m / 2} ${cy - r2} L ${cx - m / 2} ${cy - r1} L ${cx - leftW} ${cy - r1} Z`} fill={`url(#${ids.hatch})`} stroke="#00e5ff" strokeWidth="2" />
                    <path d={`M ${cx - leftW} ${cy + 95} L ${cx + rightW} ${cy + 95} L ${cx + rightW} ${cy + r1} L ${cx + m / 2} ${cy + r1} L ${cx + m / 2} ${cy + r2} L ${cx - m / 2} ${cy + r2} L ${cx - m / 2} ${cy + r1} L ${cx - leftW} ${cy + r1} Z`} fill={`url(#${ids.hatch})`} stroke="#00e5ff" strokeWidth="2" />
                </g>
            )}
            <DimBadge x={cx} y={cy + r1 + 34} text={`D${data.d}`} />
            <HorizDim x1={cx - m / 2} x2={cx + m / 2} y={cy - r1 - 28} extY={cy - r1} label={`m=${data.m}`} ids={ids} />
            <VertDim x={cx + 55} y1={cy - r2} y2={cy + r2} label={`D${Number(data.d2).toFixed(1)}`} ids={ids} />
        </TechFrame>
    );
}

export function CenterDrillSVG({ data }: { data: { type: string; d1: number; d2: number; t: number } }) {
    const ids = useSvgIds();
    const s = 200 / data.d2;
    const d1 = data.d1 * s;
    const d2 = data.d2 * s;
    const t = data.t * s;
    const cx = 220;
    const top = 70;

    return (
        <TechFrame title={`DIN 332 - ${data.type}`} legend={
            <>
                <LegendRow y={48} label="Pilot hole D (d1)" value={data.d1} highlight />
                <LegendRow y={96} label="Countersink D (d2)" value={data.d2} highlight />
                <LegendRow y={144} label="Reference depth (t)" value={data.t} highlight />
                <LegendRow y={192} label="Included angle" value="60" unit=" deg" />
            </>
        }>
            <DrawingDefs ids={ids} />
            <CenterLine x1={cx} y1={top} x2={cx} y2={top + 260} />
            <rect x={cx - 180} y={top} width={360} height={240} fill={`url(#${ids.hatch})`} stroke="#475569" strokeWidth="1.5" />
            <path
                d={`M ${cx - d2 / 2} ${top + 10} L ${cx - d2 / 2} ${top + 10 + t} L ${cx - d1 / 2} ${top + 10 + t + 8} L ${cx} ${top + 10 + t + 8 + d1 * 0.35} L ${cx + d1 / 2} ${top + 10 + t + 8} L ${cx + d2 / 2} ${top + 10 + t} L ${cx + d2 / 2} ${top + 10}`}
                fill="#0f172a" stroke="#00e5ff" strokeWidth="2.5"
            />
            <HorizDim x1={cx - d2 / 2} x2={cx + d2 / 2} y={top - 4} extY={top + 10} label={`D${data.d2}`} ids={ids} />
            <HorizDim x1={cx - d1 / 2} x2={cx + d1 / 2} y={top + 250} extY={top + 240} label={`D${data.d1}`} ids={ids} />
            <VertDim x={cx + d2 / 2 + 8} y1={top + 10} y2={top + 10 + t} label={`t=${data.t}`} ids={ids} />
            <DimBadge x={cx} y={top + 10 + t + 40} text="60 deg" color="#f59e0b" />
        </TechFrame>
    );
}

export function CountersinkSVG({ data }: { data: { size: string; d1: number; d2: number; t: number; alpha: number } }) {
    const ids = useSvgIds();
    const s = 200 / Math.max(data.d2, data.t * 2);
    const d1 = data.d1 * s;
    const d2 = data.d2 * s;
    const t = data.t * s;
    const cx = 220;
    const top = 70;

    return (
        <TechFrame title={`DIN 74-F - ${data.size} Countersink`} legend={
            <>
                <LegendRow y={48} label="Countersink D (d2)" value={data.d2} highlight />
                <LegendRow y={96} label="Clearance hole D (d1)" value={data.d1} highlight />
                <LegendRow y={144} label="Countersink depth (t)" value={data.t} highlight />
                <LegendRow y={192} label="Countersink angle" value={data.alpha} unit=" deg" highlight />
            </>
        }>
            <DrawingDefs ids={ids} />
            <CenterLine x1={cx} y1={top} x2={cx} y2={top + 260} />
            <rect x={cx - 180} y={top} width={360} height={240} fill={`url(#${ids.hatch})`} stroke="#475569" strokeWidth="1.5" />
            <path
                d={`M ${cx - d2 / 2} ${top + 10} L ${cx - d1 / 2} ${top + 10 + t} L ${cx - d1 / 2} ${top + 230} L ${cx + d1 / 2} ${top + 230} L ${cx + d1 / 2} ${top + 10 + t} L ${cx + d2 / 2} ${top + 10}`}
                fill="#0f172a" stroke="#00e5ff" strokeWidth="2.5"
            />
            <HorizDim x1={cx - d2 / 2} x2={cx + d2 / 2} y={top - 4} extY={top + 10} label={`D${data.d2}`} ids={ids} />
            <HorizDim x1={cx - d1 / 2} x2={cx + d1 / 2} y={top + 248} extY={top + 230} label={`D${data.d1}`} ids={ids} />
            <VertDim x={cx + d2 / 2 + 8} y1={top + 10} y2={top + 10 + t} label={`t=${data.t}`} ids={ids} />
            <DimBadge x={cx} y={top + 10 + t + 36} text={`${data.alpha} deg`} color="#f59e0b" />
        </TechFrame>
    );
}

export function UndercutSVG({ dSmall, dLarge, r }: { dSmall: number; dLarge: number; r: number }) {
    const ids = useSvgIds();
    const s = 200 / Math.max(dLarge, 40);
    const ds = dSmall * s;
    const dl = dLarge * s;
    const rs = r * s;
    const cx = 200;
    const cy = 200;
    const shoulderX = cx + 40;

    return (
        <TechFrame title="DIN 509 - Shoulder Undercut" legend={
            <>
                <LegendRow y={48} label="Small shaft D (d)" value={dSmall} highlight />
                <LegendRow y={96} label="Shoulder D (D)" value={dLarge} highlight />
                <LegendRow y={144} label="Undercut radius (r)" value={r} highlight />
                <LegendRow y={192} label="Relief depth (approx)" value={(r * (1 - Math.sin(Math.PI / 4))).toFixed(2)} />
            </>
        }>
            <DrawingDefs ids={ids} />
            <CenterLine x1={cx - 160} y1={cy} x2={cx + 200} y2={cy} />
            <rect x={cx - 160} y={cy - dl / 2} width={shoulderX - (cx - 160)} height={dl} fill={`url(#${ids.hatch})`} stroke="#475569" strokeWidth="1.5" />
            <rect x={shoulderX} y={cy - ds / 2} width={180} height={ds} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <path
                d={`M ${shoulderX} ${cy - ds / 2} Q ${shoulderX + rs} ${cy - ds / 2 - rs} ${shoulderX + rs * 2} ${cy - ds / 2} L ${shoulderX + rs * 2} ${cy + ds / 2} Q ${shoulderX + rs} ${cy + ds / 2 + rs} ${shoulderX} ${cy + ds / 2}`}
                fill="none" stroke="#00e5ff" strokeWidth="2.5"
            />
            <DimBadge x={shoulderX + 100} y={cy} text={`D${dSmall}`} />
            <DimBadge x={cx - 60} y={cy} text={`D${dLarge}`} />
            <DimBadge x={shoulderX + rs} y={cy - ds / 2 - rs - 20} text={`r=${r}`} />
        </TechFrame>
    );
}
