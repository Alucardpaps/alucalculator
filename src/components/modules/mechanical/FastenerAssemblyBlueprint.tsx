'use client';

import React, { useMemo } from 'react';

type BlueprintLabels = {
    title: string;
    subtitle: string;
    partHead: string;
    partShank: string;
    partThread: string;
    partNut: string;
    partWasher: string;
    plateA: string;
    plateB: string;
    gripZone: string;
    preload: string;
    torque: string;
    legend: string;
    tension: string;
    clearance: string;
    grade: string;
};

function useSvgIds() {
    const raw = React.useId().replace(/:/g, '');
    return {
        hatchA: `hatch-a-${raw}`,
        hatchB: `hatch-b-${raw}`,
        arrow: `arrow-${raw}`,
        metal: `metal-${raw}`,
        stress: `stress-${raw}`,
        cone: `cone-${raw}`,
    };
}

function DimBadge({ x, y, text, color = '#00e5ff' }: { x: number; y: number; text: string; color?: string }) {
    const w = Math.max(52, text.length * 7.2 + 14);
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect x={-w / 2} y={-12} width={w} height={20} rx={4} fill="rgba(5,10,18,0.94)" stroke={color} strokeWidth="1" />
            <text x={0} y={3} textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="ui-monospace, monospace">{text}</text>
        </g>
    );
}

function Callout({ x, y, text, color = '#94a3b8' }: { x: number; y: number; text: string; color?: string }) {
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect x={0} y={-10} width={text.length * 5.8 + 10} height={16} rx={3} fill="rgba(8,12,20,0.9)" stroke={color} strokeWidth="0.8" />
            <text x={5} y={2} fontSize="9" fontWeight="700" fill={color} fontFamily="ui-monospace, monospace" letterSpacing="0.04em">{text}</text>
        </g>
    );
}

function LegendRow({ y, label, value, unit = 'mm', highlight = false }: { y: number; label: string; value: string | number; unit?: string; highlight?: boolean }) {
    return (
        <g transform={`translate(14, ${y})`}>
            <text x={0} y={0} fontSize="10" fill="#64748b" fontFamily="ui-sans-serif, system-ui">{label}</text>
            <text x={0} y={16} fontSize="13" fontWeight="700" fill={highlight ? '#00e5ff' : '#e2e8f0'} fontFamily="ui-monospace, monospace">
                {value} <tspan fontSize="10" fill="#64748b">{unit}</tspan>
            </text>
        </g>
    );
}

export function FastenerAssemblyBlueprint({
    results,
    length,
    yieldUtilization = 90,
    grade,
    size,
    labels,
    isPrint = false,
    isPipe = false,
}: {
    results: any;
    length: number;
    yieldUtilization?: number;
    grade: string;
    size: string;
    labels: BlueprintLabels;
    isPrint?: boolean;
    isPipe?: boolean;
}) {
    const ids = useSvgIds();
    const strokeC = isPrint ? '#000' : '#475569';
    const textC = isPrint ? '#000' : '#94a3b8';
    const accent = isPrint ? '#000' : '#00e5ff';

    const d = results.d_nom;
    const l = length;
    const k = results.boltDim?.k || d * 0.7;
    const s = results.boltDim?.s || d * 1.5;
    const m = results.nutDim?.height || d * 0.8;
    const dw = results.dw || s;
    const dh = results.dh || d + 1;
    const utilPct = Math.min(100, Math.max(0, yieldUtilization));
    const heat = utilPct > 85 ? '#ef4444' : utilPct > 60 ? '#f97316' : '#10b981';

    const geom = useMemo(() => {
        const drawFieldW = 640;
        const cy = 210;
        const scale = Math.min(620 / (k + l + m + 24), 90 / Math.max(s, d * 1.6));
        const dk = k * scale;
        const ds = s * scale;
        const dm = m * scale;
        const dd = d * scale;
        const ddw = dw * scale;
        const ddh = dh * scale;
        const dl = l * scale;
        const dp = Math.max(results.pitchVal * scale, 3.5);
        const washerT = Math.max(2.5, scale * 1.8);
        const asmW = dk + dl + dm * 0.15;
        const x0 = 36 + Math.max(0, (drawFieldW - asmW) / 2);
        const xHeadRight = x0 + dk;
        const xShankEnd = xHeadRight + dl;
        const xNutLeft = xShankEnd - dm;
        const xNutRight = xShankEnd;
        const xWasherNut = xNutLeft - washerT;
        const xWasherHead = xHeadRight;
        const gripPx = Math.max(8, xWasherNut - xWasherHead - washerT);
        const xPlateSplit = xWasherHead + washerT + gripPx * 0.5;
        const plateH = ds * 1.35;
        const gripMm = gripPx / scale;
        const xThreadStart = xHeadRight + Math.min(dl * 0.35, 28);
        const threadW = xShankEnd - xThreadStart;
        const teeth = Math.max(2, Math.floor(threadW / dp));
        const threadDepth = Math.min(dp * 0.38, dd * 0.14);

        let shank = `M ${xHeadRight} ${cy - dd / 2} L ${xThreadStart} ${cy - dd / 2} `;
        for (let i = 0; i < teeth; i++) {
            const t1 = xThreadStart + i * dp;
            shank += `L ${t1 + dp * 0.5} ${cy - dd / 2 + threadDepth} L ${t1 + dp} ${cy - dd / 2} `;
        }
        shank += `L ${xShankEnd} ${cy - dd / 2} L ${xShankEnd} ${cy + dd / 2} `;
        for (let i = teeth - 1; i >= 0; i--) {
            const t2 = xThreadStart + (i + 1) * dp;
            shank += `L ${t2 - dp * 0.5} ${cy + dd / 2 - threadDepth} L ${xThreadStart + i * dp} ${cy + dd / 2} `;
        }
        shank += `L ${xHeadRight} ${cy + dd / 2} Z`;

        return {
            cy, scale, dk, ds, dm, dd, ddw, ddh, dl, dp, washerT, x0, xHeadRight, xShankEnd,
            xNutLeft, xNutRight, xWasherNut, xWasherHead, gripPx, xPlateSplit, plateH, gripMm,
            xThreadStart, threadW, teeth, shank,
        };
    }, [d, l, k, s, m, dw, dh, results.pitchVal]);

    if (isPipe) {
        return (
            <svg viewBox="0 0 720 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <rect width="720" height="400" fill="#05080f" rx="8" />
                <text x={20} y={26} fontSize="13" fontWeight="700" fill="#f97316" fontFamily="ui-monospace, monospace">{labels.title}</text>
                <text x={20} y={42} fontSize="10" fill="#64748b" fontFamily="ui-monospace, monospace">{labels.subtitle}</text>
                <text x={360} y={210} textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="ui-monospace, monospace">Pipe thread model - select metric bolt for assembly view</text>
            </svg>
        );
    }

    const g = geom;

    return (
        <svg viewBox="0 0 880 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
                <pattern id={ids.hatchA} patternUnits="userSpaceOnUse" width="6" height="6">
                    <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="#00d8f6" strokeWidth="1" opacity="0.35" />
                </pattern>
                <pattern id={ids.hatchB} patternUnits="userSpaceOnUse" width="6" height="6">
                    <path d="M-1,5 l2,2 M0,0 l6,6 M5,-1 l2,2" stroke="#f97316" strokeWidth="1" opacity="0.35" />
                </pattern>
                <linearGradient id={ids.metal} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id={ids.stress} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={heat} stopOpacity="0.55" />
                    <stop offset={`${utilPct}%`} stopColor={heat} stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#334155" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id={ids.cone} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.18" />
                    <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.04" />
                    <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.18" />
                </linearGradient>
                <marker id={ids.arrow} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={textC} />
                </marker>
            </defs>
            <style>{`
                @keyframes preloadPulse { 0%,100% { opacity: .45; stroke-width: 1.2; } 50% { opacity: 1; stroke-width: 2.4; } }
                @keyframes torqueSweep { to { stroke-dashoffset: -24; } }
                @media (prefers-reduced-motion: reduce) {
                    .preload-pulse, .torque-sweep { animation: none !important; }
                }
            `}</style>

            <rect width="880" height="400" fill="#05080f" rx="8" />
            {Array.from({ length: 17 }).map((_, i) => (
                <line key={`gv${i}`} x1={24 + i * 38} y1={58} x2={24 + i * 38} y2={362} stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
                <line key={`gh${i}`} x1={24} y1={58 + i * 38} x2={664} y2={58 + i * 38} stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
            ))}

            <text x={20} y={26} fontSize="13" fontWeight="700" fill="#f97316" fontFamily="ui-monospace, monospace" letterSpacing="0.05em">{labels.title}</text>
            <text x={20} y={42} fontSize="10" fill="#64748b" fontFamily="ui-monospace, monospace">{labels.subtitle}</text>
            <rect x={18} y={52} width={652} height={318} rx={6} fill="rgba(0,0,0,0.25)" stroke="rgba(0,229,255,0.12)" strokeWidth="1" />
            <text x={28} y={68} fontSize="8" fontWeight="700" fill="#64748b" fontFamily="ui-monospace, monospace">SECTION A-A</text>
            <rect x={480} y={14} width={72} height={22} rx={5} fill="rgba(249,115,22,0.12)" stroke="#f97316" strokeWidth="1" />
            <text x={516} y={29} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fb923c" fontFamily="ui-monospace, monospace">{labels.grade} {grade}</text>

            <line x1={24} y1={g.cy} x2={664} y2={g.cy} stroke={accent} strokeWidth="0.8" strokeDasharray="10,4,2,4" opacity="0.35" />

            <rect x={g.xWasherHead + g.washerT} y={g.cy - g.plateH / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill={`url(#${ids.hatchA})`} stroke={strokeC} strokeWidth="1" />
            <rect x={g.xWasherHead + g.washerT} y={g.cy + g.ddh / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill={`url(#${ids.hatchA})`} stroke={strokeC} strokeWidth="1" />
            <rect x={g.xPlateSplit} y={g.cy - g.plateH / 2} width={g.xWasherNut - g.xPlateSplit} height={(g.plateH - g.ddh) / 2} fill={`url(#${ids.hatchB})`} stroke={strokeC} strokeWidth="1" />
            <rect x={g.xPlateSplit} y={g.cy + g.ddh / 2} width={g.xWasherNut - g.xPlateSplit} height={(g.plateH - g.ddh) / 2} fill={`url(#${ids.hatchB})`} stroke={strokeC} strokeWidth="1" />
            <line x1={g.xWasherHead + g.washerT} y1={g.cy - g.ddh / 2} x2={g.xWasherNut} y2={g.cy - g.ddh / 2} stroke="#64748b" strokeWidth="1" strokeDasharray="4,3" />
            <line x1={g.xWasherHead + g.washerT} y1={g.cy + g.ddh / 2} x2={g.xWasherNut} y2={g.cy + g.ddh / 2} stroke="#64748b" strokeWidth="1" strokeDasharray="4,3" />

            <path
                d={`M ${g.xWasherHead + g.washerT} ${g.cy - g.ddw / 2} L ${g.xPlateSplit} ${g.cy - g.ds * 0.55} L ${g.xWasherNut} ${g.cy - g.ddw / 2}
                    L ${g.xWasherNut} ${g.cy + g.ddw / 2} L ${g.xPlateSplit} ${g.cy + g.ds * 0.55} L ${g.xWasherHead + g.washerT} ${g.cy + g.ddw / 2} Z`}
                fill={`url(#${ids.cone})`}
            />

            <rect x={g.xWasherHead} y={g.cy - g.ddw / 2} width={g.washerT} height={g.ddw} fill={`url(#${ids.metal})`} stroke={strokeC} strokeWidth="1" />
            <rect x={g.xWasherNut} y={g.cy - g.ddw / 2} width={g.washerT} height={g.ddw} fill={`url(#${ids.metal})`} stroke={strokeC} strokeWidth="1" />

            <path d={g.shank} fill={isPrint ? 'none' : `url(#${ids.stress})`} stroke={strokeC} strokeWidth="1.4" />
            <line x1={g.xHeadRight} y1={g.cy} x2={g.xShankEnd} y2={g.cy} stroke={heat} strokeWidth="2" opacity="0.75" />

            <path
                d={`M ${g.xHeadRight} ${g.cy - g.ds / 2} L ${g.x0 + 2} ${g.cy - g.ds / 2} L ${g.x0} ${g.cy - g.ds / 4} L ${g.x0} ${g.cy + g.ds / 4} L ${g.x0 + 2} ${g.cy + g.ds / 2} L ${g.xHeadRight} ${g.cy + g.ds / 2} Z`}
                fill={`url(#${ids.metal})`}
                stroke={strokeC}
                strokeWidth="1.4"
            />
            <line x1={g.x0} y1={g.cy - g.ds / 4} x2={g.xHeadRight} y2={g.cy - g.ds / 4} stroke={strokeC} strokeWidth="0.7" opacity="0.55" />
            <line x1={g.x0} y1={g.cy + g.ds / 4} x2={g.xHeadRight} y2={g.cy + g.ds / 4} stroke={strokeC} strokeWidth="0.7" opacity="0.55" />

            <path
                d={`M ${g.xNutLeft} ${g.cy - g.ds / 2} L ${g.xNutRight - 2} ${g.cy - g.ds / 2} L ${g.xNutRight} ${g.cy - g.ds / 4} L ${g.xNutRight} ${g.cy + g.ds / 4} L ${g.xNutRight - 2} ${g.cy + g.ds / 2} L ${g.xNutLeft} ${g.cy + g.ds / 2} Z`}
                fill={`url(#${ids.metal})`}
                stroke={strokeC}
                strokeWidth="1.4"
            />

            {/* Preload Line and Badge */}
            <line className="preload-pulse" x1={g.xShankEnd + 8} y1={g.cy} x2={g.x0 - 6} y2={g.cy} stroke="#10b981" strokeWidth="1.5" markerEnd={`url(#${ids.arrow})`} style={{ animation: 'preloadPulse 1.8s ease-in-out infinite' }} />
            <g transform={`translate(${(g.xHeadRight + g.xNutLeft) / 2}, ${g.cy - g.dd / 2 - 14})`}>
                <rect x="-48" y="-7" width="96" height="14" rx="3" fill="#05080f" stroke="#10b981" strokeWidth="0.8" />
                <text x="0" y="3" textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="700" fontFamily="ui-monospace, monospace">
                    {labels.preload} = {results.Fm_max.toFixed(1)} kN
                </text>
            </g>

            {/* Torque sweep and Badge */}
            <path
                className="torque-sweep"
                d={`M ${g.x0 + 4},${g.cy - g.ds / 2 - 8} A ${g.ds / 2 + 10},${g.ds / 2 + 10} 0 0,1 ${g.x0 + g.dk - 4},${g.cy - g.ds / 2 - 8}`}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="1.2"
                strokeDasharray="10,6"
                style={{ animation: 'torqueSweep 1.2s linear infinite' }}
                markerEnd={`url(#${ids.arrow})`}
            />
            <g transform={`translate(${g.x0 + g.dk / 2}, ${g.cy - g.ds / 2 - 18})`}>
                <rect x="-48" y="-7" width="96" height="14" rx="3" fill="#05080f" stroke="#00e5ff" strokeWidth="0.8" />
                <text x="0" y="3" textAnchor="middle" fontSize="9" fill="#00e5ff" fontWeight="700" fontFamily="ui-monospace, monospace">
                    {labels.torque} = {results.MA.toFixed(1)} Nm
                </text>
            </g>

            {/* Part Callout Labels */}
            {(() => {
                const yPlateTop = g.cy - g.plateH / 2;
                const yPlateBot = g.cy + g.plateH / 2;
                const yShankTop = g.cy - g.dd / 2;
                const yShankBot = g.cy + g.dd / 2;
                const yHeadBot = g.cy + g.ds / 2;

                const xPlateACenter = (g.xWasherHead + g.washerT + g.xPlateSplit) / 2;
                const xPlateBCenter = (g.xPlateSplit + g.xWasherNut) / 2;

                return (
                    <>
                        <Callout x={g.x0 - 2} y={yHeadBot + 18} text={labels.partHead} color="#f97316" />
                        <Callout x={g.xHeadRight + 12} y={yShankTop - 20} text={labels.partShank} />
                        <Callout x={g.xThreadStart + g.threadW * 0.35} y={yShankBot + 18} text={labels.partThread} color="#a78bfa" />
                        <Callout x={g.xNutLeft} y={yHeadBot + 18} text={labels.partNut} color="#f97316" />
                        
                        <Callout x={g.xWasherHead - 42} y={yPlateTop - 12} text={labels.partWasher} />
                        <Callout x={xPlateACenter - 20} y={yPlateTop - 12} text={labels.plateA} color="#22d3ee" />
                        <Callout x={xPlateBCenter - 20} y={yPlateTop - 12} text={labels.plateB} color="#fb923c" />
                        <Callout x={(g.xWasherHead + g.xPlateSplit) / 2 - 15} y={yPlateBot + 12} text={labels.gripZone} color="#10b981" />

                        {/* Dimension Lines & Badges */}
                        <g stroke="#64748b" fill="none" strokeWidth="1">
                            {/* Bolt Length L (Bottom) */}
                            <line x1={g.xHeadRight} y1={yPlateBot + 32} x2={g.xShankEnd} y2={yPlateBot + 32} markerStart={`url(#${ids.arrow})`} markerEnd={`url(#${ids.arrow})`} />
                            <line x1={g.xHeadRight} y1={yPlateBot + 8} x2={g.xHeadRight} y2={yPlateBot + 38} />
                            <line x1={g.xShankEnd} y1={yPlateBot + 8} x2={g.xShankEnd} y2={yPlateBot + 38} />
                            <DimBadge x={(g.xHeadRight + g.xShankEnd) / 2} y={yPlateBot + 32} text={`L = ${l} mm`} />

                            {/* Grip Length (Top) */}
                            <line x1={g.xWasherHead + g.washerT} y1={yPlateTop - 35} x2={g.xWasherNut} y2={yPlateTop - 35} markerStart={`url(#${ids.arrow})`} markerEnd={`url(#${ids.arrow})`} />
                            <line x1={g.xWasherHead + g.washerT} y1={yPlateTop - 8} x2={g.xWasherHead + g.washerT} y2={yPlateTop - 40} />
                            <line x1={g.xWasherNut} y1={yPlateTop - 8} x2={g.xWasherNut} y2={yPlateTop - 40} />
                            <DimBadge x={(g.xWasherHead + g.washerT + g.xWasherNut) / 2} y={yPlateTop - 35} text={`Grip = ${g.gripMm.toFixed(1)} mm`} color="#10b981" />

                            {/* Bolt Diameter d (Right side) */}
                            <line x1={g.xShankEnd + 14} y1={g.cy - g.dd / 2} x2={g.xShankEnd + 14} y2={g.cy + g.dd / 2} markerStart={`url(#${ids.arrow})`} markerEnd={`url(#${ids.arrow})`} />
                            <line x1={g.xShankEnd + 6} y1={g.cy - g.dd / 2} x2={g.xShankEnd + 20} y2={g.cy - g.dd / 2} />
                            <line x1={g.xShankEnd + 6} y1={g.cy + g.dd / 2} x2={g.xShankEnd + 20} y2={g.cy + g.dd / 2} />
                            <DimBadge x={g.xShankEnd + 14} y={g.cy} text={`d = ${d.toFixed(1)}`} />

                            {/* Clearance Hole dh (Leader Line to bottom) */}
                            <line x1={g.xPlateSplit} y1={yShankBot} x2={g.xPlateSplit + 15} y2={yPlateBot + 12} />
                            <circle cx={g.xPlateSplit} cy={yShankBot} r="1.5" fill="#a78bfa" />
                            <DimBadge x={g.xPlateSplit + 38} y={yPlateBot + 12} text={`dh = ${dh.toFixed(1)}`} color="#a78bfa" />

                            {/* Head Diameter s (Vertical left) */}
                            <line x1={g.x0 - 8} y1={g.cy - g.ds / 2} x2={g.x0 - 8} y2={g.cy + g.ds / 2} markerStart={`url(#${ids.arrow})`} markerEnd={`url(#${ids.arrow})`} />
                            <line x1={g.x0 - 14} y1={g.cy - g.ds / 2} x2={g.x0 - 2} y2={g.cy - g.ds / 2} />
                            <line x1={g.x0 - 14} y1={g.cy + g.ds / 2} x2={g.x0 - 2} y2={g.cy + g.ds / 2} />
                            <DimBadge x={g.x0 - 8} y={g.cy} text={`s = ${s.toFixed(1)}`} color="#64748b" />

                            {/* Head Thickness k (Horizontal left top) */}
                            <line x1={g.x0} y1={g.cy - g.ds / 2 - 10} x2={g.xHeadRight} y2={g.cy - g.ds / 2 - 10} markerStart={`url(#${ids.arrow})`} markerEnd={`url(#${ids.arrow})`} />
                            <line x1={g.x0} y1={g.cy - g.ds / 2 - 2} x2={g.x0} y2={g.cy - g.ds / 2 - 14} />
                            <line x1={g.xHeadRight} y1={g.cy - g.ds / 2 - 2} x2={g.xHeadRight} y2={g.cy - g.ds / 2 - 14} />
                            <DimBadge x={(g.x0 + g.xHeadRight) / 2} y={g.cy - g.ds / 2 - 10} text={`k = ${k.toFixed(1)}`} color="#64748b" />
                        </g>
                    </>
                );
            })()}

            <g transform="translate(684, 52)">
                <rect x={0} y={0} width={180} height={318} rx={10} fill="rgba(10,16,24,0.96)" stroke="rgba(0,229,255,0.22)" strokeWidth="1" />
                <text x={14} y={22} fontSize="10" fontWeight="700" fill="#64748b" fontFamily="ui-monospace, monospace" letterSpacing="0.12em">{labels.legend}</text>
                <line x1={14} y1={30} x2={166} y2={30} stroke="rgba(255,255,255,0.08)" />
                <LegendRow y={44} label={size} value={`D${d.toFixed(1)}`} highlight />
                <LegendRow y={82} label="L" value={l} />
                <LegendRow y={120} label="Grip (L_G)" value={g.gripMm.toFixed(1)} highlight />
                <LegendRow y={158} label="dh (ISO 273)" value={dh.toFixed(1)} />
                <LegendRow y={196} label="dw" value={dw.toFixed(1)} />
                <LegendRow y={234} label="As" value={results.As.toFixed(1)} unit="mm2" />
                <line x1={14} y1={268} x2={166} y2={268} stroke="rgba(255,255,255,0.06)" />
                <rect x={14} y={280} width={10} height={10} fill={heat} rx={2} />
                <text x={30} y={289} fontSize="9" fill="#94a3b8" fontFamily="ui-sans-serif">{labels.tension}</text>
                <rect x={14} y={298} width={10} height={10} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3,2" rx={2} />
                <text x={30} y={307} fontSize="9" fill="#94a3b8" fontFamily="ui-sans-serif">{labels.clearance}</text>
            </g>
        </svg>
    );
}
