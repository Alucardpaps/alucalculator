'use client';

import React, { useState, useMemo } from 'react';
import { Ruler, Info } from 'lucide-react';
import { getFastenerSchematicStrings } from '@/locales/fastenerSchematicTranslations';

type SchematicLabels = {
    partHead: string;
    partShank: string;
    partThread: string;
    partNut: string;
    partWasher: string;
    plateA: string;
    plateB: string;
    gripZone: string;
    clearance: string;
};

interface FastenerInteractiveSchematicProps {
    results: any;
    length: number;
    yieldUtilization: number;
    grade: string;
    size: string;
    labels: SchematicLabels;
    isPipe?: boolean;
    lang: string;
}

export function FastenerInteractiveSchematic({
    results,
    length,
    yieldUtilization,
    grade,
    size,
    labels,
    isPipe = false,
    lang = 'en',
}: FastenerInteractiveSchematicProps) {
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);
    const fs = getFastenerSchematicStrings(lang);

    const d = results.d_nom;
    const l = length;
    const k = results.boltDim?.k || d * 0.7;
    const s = results.boltDim?.s || d * 1.5;
    const m = results.nutDim?.height || d * 0.8;
    const dw = results.dw || s;
    const dh = results.dh || d + 1;
    const utilPct = Math.min(100, Math.max(0, yieldUtilization));
    const heat = utilPct > 85 ? '#ef4444' : utilPct > 60 ? '#f97316' : '#10b981';

    // Tooltip data content based on hovered part
    const partDetails = useMemo(() => {
        if (hoveredPart === 'head') {
            return {
                title: labels.partHead,
                desc: fs.headDesc,
                metrics: [
                    { label: fs.hexSize, val: `${s.toFixed(1)} mm` },
                    { label: fs.headHeight, val: `${k.toFixed(1)} mm` },
                    { label: fs.bearingDia, val: `${dw.toFixed(1)} mm` },
                ]
            };
        }
        if (hoveredPart === 'shank') {
            return {
                title: labels.partShank,
                desc: fs.shankDesc,
                metrics: [
                    { label: fs.nominalDia, val: `${d.toFixed(1)} mm` },
                    { label: fs.shankLength, val: `${Math.max(0, l - (results.pitchVal * 8)).toFixed(0)} mm` },
                ]
            };
        }
        if (hoveredPart === 'thread') {
            return {
                title: labels.partThread,
                desc: fs.threadDesc,
                metrics: [
                    { label: fs.minorDia, val: `${results.d3.toFixed(2)} mm` },
                    { label: fs.pitchDia, val: `${results.d2.toFixed(2)} mm` },
                    { label: fs.pitch, val: `${results.pitchVal.toFixed(2)} mm` },
                    { label: fs.stressArea, val: `${results.As.toFixed(1)} mm²` },
                ]
            };
        }
        if (hoveredPart === 'plates') {
            return {
                title: fs.platesTitle,
                desc: fs.platesDesc,
                metrics: [
                    { label: fs.gripLength, val: `${(l - m - 4).toFixed(1)} mm` },
                    { label: fs.clearanceHole, val: `${dh.toFixed(1)} mm` },
                ]
            };
        }
        if (hoveredPart === 'nut') {
            return {
                title: labels.partNut,
                desc: fs.nutDesc,
                metrics: [
                    { label: fs.nutHeight, val: `${m.toFixed(1)} mm` },
                    { label: fs.threadClass, val: size },
                ]
            };
        }
        if (hoveredPart === 'washer') {
            return {
                title: labels.partWasher,
                desc: fs.washerDesc,
                metrics: [
                    { label: fs.washerDia, val: `${dw.toFixed(1)} mm` },
                ]
            };
        }
        return null;
    }, [hoveredPart, s, k, dw, d, l, results, m, dh, size, labels, fs]);

    const geom = useMemo(() => {
        const drawFieldW = 460;
        const cy = 100;
        const scale = Math.min(420 / (k + l + m + 18), 44 / Math.max(s, d * 1.6));
        const dk = k * scale;
        const ds = s * scale;
        const dm = m * scale;
        const dd = d * scale;
        const ddw = dw * scale;
        const ddh = dh * scale;
        const dl = l * scale;
        const dp = Math.max(results.pitchVal * scale, 2.5);
        const washerT = Math.max(2, scale * 1.5);
        const asmW = dk + dl + dm * 0.15;
        const x0 = 16 + Math.max(0, (drawFieldW - asmW) / 2);
        const xHeadRight = x0 + dk;
        const xShankEnd = xHeadRight + dl;
        const xNutLeft = xShankEnd - dm;
        const xNutRight = xShankEnd;
        const xWasherNut = xNutLeft - washerT;
        const xWasherHead = xHeadRight;
        const gripPx = Math.max(4, xWasherNut - xWasherHead - washerT);
        const xPlateSplit = xWasherHead + washerT + gripPx * 0.5;
        const plateH = ds * 1.25;
        const gripMm = gripPx / scale;
        const xThreadStart = xHeadRight + Math.min(dl * 0.35, 20);
        const threadW = xShankEnd - xThreadStart;
        const teeth = Math.max(2, Math.floor(threadW / dp));
        const threadDepth = Math.min(dp * 0.38, dd * 0.14);

        // Separate paths for Shank and Thread
        const shankPath = `M ${xHeadRight} ${cy - dd / 2} L ${xThreadStart} ${cy - dd / 2} L ${xThreadStart} ${cy + dd / 2} L ${xHeadRight} ${cy + dd / 2} Z`;
        
        let threadPath = `M ${xThreadStart} ${cy - dd / 2} `;
        for (let i = 0; i < teeth; i++) {
            const t1 = xThreadStart + i * dp;
            threadPath += `L ${t1 + dp * 0.5} ${cy - dd / 2 + threadDepth} L ${t1 + dp} ${cy - dd / 2} `;
        }
        threadPath += `L ${xShankEnd} ${cy - dd / 2} L ${xShankEnd} ${cy + dd / 2} `;
        for (let i = teeth - 1; i >= 0; i--) {
            const t2 = xThreadStart + (i + 1) * dp;
            threadPath += `L ${t2 - dp * 0.5} ${cy + dd / 2 - threadDepth} L ${xThreadStart + i * dp} ${cy + dd / 2} `;
        }
        threadPath += `Z`;

        return {
            cy, scale, dk, ds, dm, dd, ddw, ddh, dl, dp, washerT, x0, xHeadRight, xShankEnd,
            xNutLeft, xNutRight, xWasherNut, xWasherHead, gripPx, xPlateSplit, plateH, gripMm,
            xThreadStart, threadW, teeth, shankPath, threadPath,
        };
    }, [d, l, k, s, m, dw, dh, results.pitchVal]);

    if (isPipe) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#04060a]/90 rounded-2xl border border-white/5 min-h-[220px]">
                <Info className="text-orange-400 mb-2" size={24} />
                <span className="text-xs font-mono font-bold text-slate-400 text-center">
                    {fs.pipeNotSupported}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 text-center">
                    {fs.selectMetricUnc}
                </span>
            </div>
        );
    }

    const g = geom;
    const highlightColor = '#f97316'; // Neon orange highlights

    return (
        <div className="relative w-full h-full flex flex-col bg-[#04060a] border border-white/5 rounded-2xl overflow-hidden min-h-[220px]">
            {/* INTERACTIVE SVG */}
            <div className="flex-1 relative min-h-0">
                <svg viewBox="0 0 490 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        {/* Hatch patterns for joint plates */}
                        <pattern id="hatchPlateA" patternUnits="userSpaceOnUse" width="5" height="5">
                            <path d="M-1,1 l2,-2 M0,5 l5,-5 M4,6 l2,-2" stroke={hoveredPart === 'plates' ? highlightColor : '#00e5ff'} strokeWidth="0.8" opacity="0.3" />
                        </pattern>
                        <pattern id="hatchPlateB" patternUnits="userSpaceOnUse" width="5" height="5">
                            <path d="M-1,4 l2,2 M0,0 l5,5 M4,-1 l2,2" stroke={hoveredPart === 'plates' ? highlightColor : '#f97316'} strokeWidth="0.8" opacity="0.3" />
                        </pattern>
                        {/* Glowing Filters */}
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background grid */}
                    <line x1={0} y1={g.cy} x2={490} y2={g.cy} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" strokeDasharray="5,5" />

                    {/* CLAMPED PLATES (INTERACTIVE) */}
                    <g 
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPart('plates')}
                        onMouseLeave={() => setHoveredPart(null)}
                    >
                        {/* Plate A */}
                        <rect x={g.xWasherHead + g.washerT} y={g.cy - g.plateH / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateA)" stroke={hoveredPart === 'plates' ? highlightColor : '#1e293b'} strokeWidth="0.8" />
                        <rect x={g.xWasherHead + g.washerT} y={g.cy + g.ddh / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateA)" stroke={hoveredPart === 'plates' ? highlightColor : '#1e293b'} strokeWidth="0.8" />
                        {/* Plate B */}
                        <rect x={g.xPlateSplit} y={g.cy - g.plateH / 2} width={g.xWasherNut - g.xPlateSplit} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateB)" stroke={hoveredPart === 'plates' ? highlightColor : '#1e293b'} strokeWidth="0.8" />
                        <rect x={g.xPlateSplit} y={g.cy + g.ddh / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateB)" stroke={hoveredPart === 'plates' ? highlightColor : '#1e293b'} strokeWidth="0.8" />
                    </g>

                    {/* WASHERS (INTERACTIVE) */}
                    <g
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPart('washer')}
                        onMouseLeave={() => setHoveredPart(null)}
                    >
                        <rect x={g.xWasherHead} y={g.cy - g.ddw / 2} width={g.washerT} height={g.ddw} fill={hoveredPart === 'washer' ? highlightColor : '#475569'} opacity={hoveredPart === 'washer' ? 0.9 : 0.6} stroke={hoveredPart === 'washer' ? '#fff' : '#1e293b'} strokeWidth="0.8" />
                        <rect x={g.xWasherNut} y={g.cy - g.ddw / 2} width={g.washerT} height={g.ddw} fill={hoveredPart === 'washer' ? highlightColor : '#475569'} opacity={hoveredPart === 'washer' ? 0.9 : 0.6} stroke={hoveredPart === 'washer' ? '#fff' : '#1e293b'} strokeWidth="0.8" />
                    </g>

                    {/* BOLT SHANK (UNTHREADED - INTERACTIVE) */}
                    <path 
                        d={g.shankPath} 
                        fill={hoveredPart === 'shank' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)'}
                        stroke={hoveredPart === 'shank' ? highlightColor : '#475569'} 
                        strokeWidth="1.2"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPart('shank')}
                        onMouseLeave={() => setHoveredPart(null)}
                    />

                    {/* BOLT THREADED SECTION (INTERACTIVE) */}
                    <path 
                        d={g.threadPath} 
                        fill={hoveredPart === 'thread' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)'}
                        stroke={hoveredPart === 'thread' ? highlightColor : '#475569'} 
                        strokeWidth="1.2"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPart('thread')}
                        onMouseLeave={() => setHoveredPart(null)}
                    />

                    {/* YIELD UTILIZATION STRESS LINES (INSIDE SHANK & THREAD) */}
                    <line 
                        x1={g.xHeadRight} 
                        y1={g.cy} 
                        x2={g.xShankEnd} 
                        y2={g.cy} 
                        stroke={heat} 
                        strokeWidth="1.8" 
                        opacity="0.85" 
                        filter={utilPct > 75 ? 'url(#neonGlow)' : undefined}
                    />

                    {/* BOLT HEAD (INTERACTIVE) */}
                    <path 
                        d={`M ${g.xHeadRight} ${g.cy - g.ds / 2} L ${g.x0 + 1.5} ${g.cy - g.ds / 2} L ${g.x0} ${g.cy - g.ds / 4} L ${g.x0} ${g.cy + g.ds / 4} L ${g.x0 + 1.5} ${g.cy + g.ds / 2} L ${g.xHeadRight} ${g.cy + g.ds / 2} Z`}
                        fill={hoveredPart === 'head' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)'}
                        stroke={hoveredPart === 'head' ? highlightColor : '#64748b'} 
                        strokeWidth="1.4"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPart('head')}
                        onMouseLeave={() => setHoveredPart(null)}
                    />

                    {/* NUT (INTERACTIVE) */}
                    <path 
                        d={`M ${g.xNutLeft} ${g.cy - g.ds / 2} L ${g.xNutRight - 1.5} ${g.cy - g.ds / 2} L ${g.xNutRight} ${g.cy - g.ds / 4} L ${g.xNutRight} ${g.cy + g.ds / 4} L ${g.xNutRight - 1.5} ${g.cy + g.ds / 2} L ${g.xNutLeft} ${g.cy + g.ds / 2} Z`}
                        fill={hoveredPart === 'nut' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)'}
                        stroke={hoveredPart === 'nut' ? highlightColor : '#64748b'} 
                        strokeWidth="1.4"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPart('nut')}
                        onMouseLeave={() => setHoveredPart(null)}
                    />
                </svg>

                {/* DYNAMIC TOOLTIP OVERLAY */}
                {partDetails && (
                    <div className="absolute top-2 left-2 right-2 bg-slate-950/90 border border-orange-500/30 rounded-xl p-2.5 z-20 flex flex-col gap-1.5 shadow-xl backdrop-blur-sm animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Ruler size={11} className="text-orange-400" />
                                {partDetails.title}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500">{partDetails.desc}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {partDetails.metrics.map((m, idx) => (
                                <div key={idx} className="flex items-baseline gap-1 text-[9px]">
                                    <span className="text-slate-400 font-medium">{m.label}:</span>
                                    <span className="font-mono font-black text-orange-400">{m.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* HELP NOTE WHEN NOTHING HOVERED */}
                {!hoveredPart && (
                    <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none z-10">
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/[0.02]">
                            {fs.hoverHint}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
