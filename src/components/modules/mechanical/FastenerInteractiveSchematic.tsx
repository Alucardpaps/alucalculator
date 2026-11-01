'use client';
import { t12 } from '@/locales/t12';

import React, { useState, useMemo } from 'react';
import { Ruler, Info, Layers, Eye, Activity, ShieldCheck, Flame } from 'lucide-react';
import { getFastenerSchematicStrings } from '@/locales/fastenerSchematicTranslations';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

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
  const precision = useGlobalPrecision();
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);
    const [selectedPart, setSelectedPart] = useState<string>('thread');
    const [showDimensions, setShowDimensions] = useState(true);
    const [showStressHeatmap, setShowStressHeatmap] = useState(false);
    const [showClampingCones, setShowClampingCones] = useState(false);
    const fs = getFastenerSchematicStrings(lang);

    const activePart = hoveredPart || selectedPart;
    const d = Number(results?.d_nom ?? 12);
    const l = Number(length || 50);
    const pVal = Number(results?.pitchVal ?? 1.75);
    const d2 = Number(results?.d2 ?? (d - 0.64952 * pVal));
    const d3 = Number(results?.d3 ?? (d - 1.2269 * pVal));
    const k = Number(results?.boltDim?.k ?? (d * 0.7));
    const s = Number(results?.boltDim?.s ?? (d * 1.5));
    const e = Number(results?.boltDim?.e ?? (s * 1.155));
    const m = Number(results?.nutDim?.height ?? (d * 0.85));
    const dw = Number(results?.dw ?? s);
    const dh = Number(results?.dh ?? (d + 1));
    const utilPct = Math.min(100, Math.max(0, yieldUtilization));
    const heatColor = utilPct > 85 ? '#ef4444' : utilPct > 65 ? '#f59e0b' : '#10b981';

    // Stress Calculations
    const Fm = Number(results.Fm_max ?? (results.preload ? results.preload / 1000 : 0)); // kN
    const As = Number(results.As ?? 84.3); // mm2
    const sigmaZ = As > 0 ? (Fm * 1000) / As : 0; // MPa
    const Wp = (Math.PI * Math.pow(d3, 3)) / 16;
    const M2 = Number(results.K2 ? results.K2 * (Fm * 1000) * (d / 1000) : (results.MA ?? 0) * 0.45); // N.m
    const tau = Wp > 0 ? (M2 * 1000) / Wp : 0; // MPa
    const sigmaEq = Math.sqrt(Math.pow(sigmaZ, 2) + 3 * Math.pow(tau, 2));
    const Sy = Number(results.Sy ?? 640);
    const safetyYield = sigmaEq > 0 ? Sy / sigmaEq : 1.2;

    const standard = results?.geometry?.standard || results?.threadStandard || '';
    const isNPT = standard === 'NPT' || size.includes('NPT');
    const isBSPT = standard === 'BSPT (R)' || size.startsWith('R');
    const isBSPP = standard === 'BSPP (G)' || (!isNPT && !isBSPT && (size.startsWith('G') || standard.includes('BSPP') || standard.includes('G ')));
    const isTaperedPipe = isNPT || isBSPT;
    const isPipeStandard = isPipe || isNPT || isBSPT || isBSPP || standard.includes('Pipe');

    // Tooltip data content based on hovered part
    const partDetails = useMemo(() => {
        if (isPipeStandard) {
            const tpiVal = pVal > 0 ?formatEngineeringValue((25.4 / pVal), precision, false) : '14';
            const boreVal = Math.max(4, d * 0.65);
            const wallVal = (d - boreVal) / 2;

            if (activePart === 'fitting') {
                return {
                    title: isBSPP 
                        ? (t12(lang, 'BSPP (G) Parallel Male Fitting', 'BSPP (G) Paralel Erkek Rakor'))
                        : (t12(lang, 'NPT Tapered Male Nipple', 'NPT Konik Erkek Nipel')),
                    desc: isBSPP 
                        ? (t12(lang, 'ISO 228 cylindrical parallel thread with sealing shoulder', 'ISO 228 silindirik dişli, faturalı sızdırmazlık nipeli'))
                        : (t12(lang, 'ANSI B1.20.1 1:16 tapered thread pipe nipple', 'ANSI B1.20.1 1:16 konik dişli pirinç/çelik nipel')),
                    metrics: [
                        { label: t12(lang, 'Hex Size (s)', 'Anahtar Ağzı (s)'), val: `${formatEngineeringValue(s, precision, false)} mm` },
                        { label: t12(lang, 'Major Dia (OD)', 'Dış Çap (OD)'), val: `${formatEngineeringValue(d, precision, false)} mm` },
                        { label: 'Standart', val: isBSPP ? `BSPP (${size})` : isBSPT ? `BSPT (${size})` : `NPT (${size})` },
                    ]
                };
            }
            if (activePart === 'thread') {
                return {
                    title: isBSPP
                        ? (t12(lang, 'G Parallel Thread & Face Seal', 'G Paralel Diş & Yüzey Sızdırmazlığı'))
                        : (t12(lang, 'NPT 1:16 Taper Thread Engagement', 'NPT 1:16 Konik Dişli Kavrama')),
                    desc: isBSPP
                        ? (t12(lang, 'Face sealing via bonded Dowty washer / O-ring', 'Dowty pul / O-ring ile alın faturası sızdırmazlığı'))
                        : (t12(lang, 'Conical wedging interference + PTFE tape seal', '1:16 konik diş kilitlemesi + PTFE teflon bant')),
                    metrics: [
                        { label: t12(lang, 'Geometry', 'Geometri'), val: isBSPP ? 'Paralel (Cylindrical)' : 'Konik 1:16 (1° 47\')' },
                        { label: 'Hatve / TPI', val: `${tpiVal} TPI (${formatEngineeringValue(pVal, precision, false)}mm)` },
                        { label: t12(lang, 'Make-up Torque', 'Sıkma Torku'), val: `${(results.MA ?? results.torque ??formatEngineeringValue(0), precision, false)} N·m` },
                    ]
                };
            }
            if (activePart === 'port') {
                return {
                    title: t12(lang, 'Female Manifold Port / Coupling', 'Dişi Valf Gövdesi / Manşon Portu'),
                    desc: isBSPP
                        ? (t12(lang, 'Spotface counterbore with internal parallel thread', 'Alın taşlamalı O-ring yuvası ve silindirik iç diş'))
                        : (t12(lang, 'Taper tapped receiving manifold port', 'Konik kılavuz çekilmiş alıcı port')),
                    metrics: [
                        { label: t12(lang, 'Tap Drill', 'Kılavuz Matkap'), val: `${(results?.geometry?.tapDrill ??formatEngineeringValue((d - pVal)), precision, false)} mm` },
                        { label: t12(lang, 'Housing OD', 'Gövde Dış Çapı'), val: `${formatEngineeringValue((d * 1.6), precision, false)} mm` },
                    ]
                };
            }
            if (activePart === 'bore') {
                return {
                    title: t12(lang, 'Internal Fluid Passage Conduit', 'İç Akışkan Kanalı (Fluid Bore)'),
                    desc: t12(lang, 'Pressurized continuous fluid passage', 'Basınçlı hat kesintisiz akış kanalı'),
                    metrics: [
                        { label: t12(lang, 'Bore ID', 'İç Çap (ID)'), val: `${formatEngineeringValue(boreVal, precision, false)} mm` },
                        { label: t12(lang, 'Wall Thickness', 'Et Kalınlığı'), val: `${formatEngineeringValue(wallVal, precision, false)} mm` },
                    ]
                };
            }
            return null;
        }

        // Standard bolt tooltips
        if (activePart === 'head') {
            return {
                title: labels.partHead,
                desc: fs.headDesc,
                metrics: [
                    { label: fs.hexSize, val: `${formatEngineeringValue(s, precision, false)} mm` },
                    { label: t12(lang, 'Corner Dia (e)', 'Köşe Çapı (e)'), val: `${formatEngineeringValue(e, precision, false)} mm` },
                    { label: fs.headHeight, val: `${formatEngineeringValue(k, precision, false)} mm` },
                    { label: fs.bearingDia, val: `${formatEngineeringValue(dw, precision, false)} mm` },
                ]
            };
        }
        if (activePart === 'shank') {
            const lsVal = Math.max(0, l - (pVal * 8));
            return {
                title: labels.partShank,
                desc: fs.shankDesc,
                metrics: [
                    { label: fs.nominalDia, val: `${formatEngineeringValue(d, precision, false)} mm` },
                    { label: fs.shankLength, val: `${formatEngineeringValue(lsVal, precision, false)} mm` },
                    { label: t12(lang, 'von Mises σ_eq', 'Eşdeğer Gerilme σ_eq'), val: `${formatEngineeringValue(sigmaEq, precision, false)} MPa (${utilPct}% Sy)` },
                    { label: t12(lang, 'Yield Safety', 'Akma Güvenliği'), val: `n = ${formatEngineeringValue(safetyYield, precision, false)}` },
                ]
            };
        }
        if (activePart === 'thread') {
            return {
                title: labels.partThread,
                desc: fs.threadDesc,
                metrics: [
                    { label: t12(lang, 'Pitch Dia d₂', 'Bölüm Dairesi d₂'), val: `${formatEngineeringValue(d2, precision, false)} mm` },
                    { label: t12(lang, 'Minor Dia d₃', 'Diş Dibi Çapı d₃'), val: `${formatEngineeringValue(d3, precision, false)} mm` },
                    { label: fs.pitch, val: `${formatEngineeringValue(pVal, precision, false)} mm` },
                    { label: fs.stressArea, val: `${formatEngineeringValue(As, precision, false)} mm²` },
                ]
            };
        }
        if (activePart === 'plates') {
            const gripVal = Math.max(5, l - m - 4);
            return {
                title: fs.platesTitle,
                desc: fs.platesDesc,
                metrics: [
                    { label: fs.gripLength, val: `${formatEngineeringValue(gripVal, precision, false)} mm (lK)` },
                    { label: fs.clearanceHole, val: `${formatEngineeringValue(dh, precision, false)} mm (dh)` },
                    { label: t12(lang, 'Clamp Force', 'Kavrama Basıncı'), val: `${formatEngineeringValue(Fm, precision, false)} kN` },
                    { label: t12(lang, 'Cone Angle', 'Rötscher Konisi'), val: '2α = 60° (30° Basma)' },
                ]
            };
        }
        if (activePart === 'nut') {
            return {
                title: labels.partNut,
                desc: fs.nutDesc,
                metrics: [
                    { label: fs.nutHeight, val: `${formatEngineeringValue(m, precision, false)} mm (m)` },
                    { label: t12(lang, 'Hex Width', 'Anahtar Ağzı'), val: `${formatEngineeringValue(s, precision, false)} mm (s)` },
                    { label: fs.threadClass, val: size },
                ]
            };
        }
        if (activePart === 'washer') {
            return {
                title: labels.partWasher,
                desc: fs.washerDesc,
                metrics: [
                    { label: fs.washerDia, val: `${formatEngineeringValue(dw, precision, false)} mm (dw)` },
                    { label: t12(lang, 'Thickness', 'Et Kalınlığı'), val: `${formatEngineeringValue(Math.max(1.5, d * 0.15), precision, false)} mm` },
                ]
            };
        }
        return null;
    }, [activePart, isPipeStandard, isBSPP, isNPT, isBSPT, s, k, dw, d, l, results, m, dh, size, labels, fs, lang, pVal, e, d2, d3, As, sigmaEq, utilPct, safetyYield, Fm]);

    const geom = useMemo(() => {
        const drawFieldW = 490;
        const cy = 100;
        const scale = Math.min(420 / (k + l + m + 18), 44 / Math.max(s, d * 1.6));
        const dk = k * scale;
        const ds = s * scale;
        const dm = m * scale;
        const dd = d * scale;
        const ddw = dw * scale;
        const ddh = dh * scale;
        const dl = l * scale;
        const dp = Math.max(pVal * scale, 2.5);
        const washerT = Math.max(2.5, scale * 1.6);
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
        const plateH = Math.max(ds * 1.35, dd * 2.2);
        const gripMm = gripPx / scale;
        const xThreadStart = xHeadRight + Math.min(dl * 0.35, 22);
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
    }, [d, l, k, s, m, dw, dh, pVal]);

    const g = geom;
    const highlightColor = '#f97316'; // Neon orange highlights

    return (
        <div className="relative w-full h-full flex flex-col bg-[var(--bg-0)] border border-white/5 rounded-2xl overflow-hidden min-h-[260px]">
            {/* ═══ TOP LAYER CONTROLS & VISUAL METRIC BADGES ═══ */}
            <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-white/5 bg-[var(--bg-1)]/80 gap-2 z-10">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {size} · {grade}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                        L={l}mm · {t12(lang, `Preload FM = ${formatEngineeringValue(Fm, precision, false)} kN`, `Önyük FM = ${formatEngineeringValue(Fm, precision, false)} kN`)}
                    </span>
                </div>

                {/* Layer Toggles */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setShowDimensions(!showDimensions)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[8.5px] font-mono font-semibold transition-all ${
                            showDimensions ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300'
                        }`}
                    >
                        <Ruler size={10} />
                        {t12(lang, 'Dimensions', 'Ölçüler (CAD)')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowClampingCones(!showClampingCones)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[8.5px] font-mono font-semibold transition-all ${
                            showClampingCones ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300'
                        }`}
                    >
                        <Layers size={10} />
                        {t12(lang, 'Clamp Cone', 'Basma Konisi (30°)')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowStressHeatmap(!showStressHeatmap)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[8.5px] font-mono font-semibold transition-all ${
                            showStressHeatmap ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300'
                        }`}
                    >
                        <Flame size={10} />
                        {t12(lang, `Stress (${formatEngineeringValue(sigmaEq, precision, false)} MPa)`, `Gerilme σ (${formatEngineeringValue(sigmaEq, precision, false)} MPa)`)}
                    </button>
                </div>
            </div>

            {/* ═══ INTERACTIVE SVG VIEWPORT ═══ */}
            <div className="flex-1 relative min-h-0">
                <svg viewBox="0 0 490 230" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        {/* 3D Solid Metallic Shaders for Fastener Components */}
                        <linearGradient id="boltHeadSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="25%" stopColor="#f1f5f9" />
                            <stop offset="55%" stopColor="#64748b" />
                            <stop offset="85%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>

                        <linearGradient id="boltShankSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#cbd5e1" />
                            <stop offset="20%" stopColor="#f8fafc" />
                            <stop offset="60%" stopColor="#64748b" />
                            <stop offset="90%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>

                        <linearGradient id="threadTeethSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="30%" stopColor="#e2e8f0" />
                            <stop offset="70%" stopColor="#475569" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>

                        <linearGradient id="nutSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="30%" stopColor="#f8fafc" />
                            <stop offset="65%" stopColor="#64748b" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>

                        <linearGradient id="washerSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#cbd5e1" />
                            <stop offset="50%" stopColor="#64748b" />
                            <stop offset="100%" stopColor="#334155" />
                        </linearGradient>

                        <linearGradient id="plateSteelA" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#083344" />
                            <stop offset="50%" stopColor="#0e7490" />
                            <stop offset="100%" stopColor="#082f49" />
                        </linearGradient>

                        <linearGradient id="plateSteelB" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e1b4b" />
                            <stop offset="50%" stopColor="#4338ca" />
                            <stop offset="100%" stopColor="#312e81" />
                        </linearGradient>

                        {/* Refined Brass & Machined Steel Shaders for Pipe Fittings */}
                        <linearGradient id="brassSatin" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fef9c3" />
                            <stop offset="25%" stopColor="#eab308" />
                            <stop offset="60%" stopColor="#a16207" />
                            <stop offset="85%" stopColor="#713f12" />
                            <stop offset="100%" stopColor="#451a03" />
                        </linearGradient>

                        <linearGradient id="pipePortSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="35%" stopColor="#334155" />
                            <stop offset="70%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#090d16" />
                        </linearGradient>

                        <linearGradient id="fluidStream" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
                        </linearGradient>

                        <linearGradient id="dowtySeal" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#0891b2" />
                            <stop offset="100%" stopColor="#164e63" />
                        </linearGradient>

                        {/* FEA Stress Heatmap Gradient */}
                        <linearGradient id="stressHeatmap" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                            <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.9" />
                            <stop offset="80%" stopColor={heatColor} stopOpacity="0.95" />
                            <stop offset="100%" stopColor={heatColor} stopOpacity="0.95" />
                        </linearGradient>

                        {/* Clamping Frustum Cone Gradient (Rötscher 30 deg) */}
                        <linearGradient id="coneLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.08" />
                        </linearGradient>
                        <linearGradient id="coneRight" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.08" />
                        </linearGradient>

                        {/* Hatch patterns for joint plates & manifold housing */}
                        <pattern id="hatchPlateA" patternUnits="userSpaceOnUse" width="6" height="6">
                            <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="#00e5ff" strokeWidth="0.8" opacity="0.45" />
                        </pattern>
                        <pattern id="hatchPlateB" patternUnits="userSpaceOnUse" width="6" height="6">
                            <path d="M-1,5 l2,2 M0,0 l6,6 M5,-1 l2,2" stroke="#818cf8" strokeWidth="0.8" opacity="0.45" />
                        </pattern>
                        <pattern id="hatchPort" patternUnits="userSpaceOnUse" width="6" height="6">
                            <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="#64748b" strokeWidth="0.7" opacity="0.3" />
                        </pattern>

                        <filter id="boltDropShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
                        </filter>

                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <marker id="cad-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                            <path d="M 0 2 L 10 5 L 0 8 z" fill="#38bdf8" />
                        </marker>
                        <marker id="torque-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                        </marker>
                        <marker id="clamp-arrow-left" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#00e5ff" />
                        </marker>
                        <marker id="clamp-arrow-right" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#00e5ff" />
                        </marker>
                        <marker id="seal-arrow-top" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
                        </marker>
                        <marker id="seal-arrow-bot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
                        </marker>
                    </defs>

                    <style>{`
                        @keyframes torqueRotate { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -40; } }
                        @keyframes clampPulse { 0%, 100% { opacity: 0.7; transform: scaleX(1); } 50% { opacity: 1; transform: scaleX(1.06); } }
                        @keyframes flowPulse { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -30; } }
                        @keyframes sealGlow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
                    `}</style>

                    {/* Centerline */}
                    <line x1={10} y1={g.cy} x2={480} y2={g.cy} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" strokeDasharray="8 4 2 4" />

                    {isPipeStandard ? (
                        /* ══════════════════════════════════════════════════════════════════════════════════════════
                           PIPE THREAD JOINT: DISTINGUISHING PARALLEL (BSPP G) VS TAPERED (NPT / BSPT)
                           ══════════════════════════════════════════════════════════════════════════════════════════ */
                        <g>
                            {/* ─── 1. FEMALE THREADED RECEIVING MANIFOLD / HOUSING ─── */}
                            <g 
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('port')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('port')}
                            >
                                <polygon points="215,25 470,25 470,72 265,72 265,65 215,65" fill="url(#pipePortSteel)" stroke={activePart === 'port' ? highlightColor : '#64748b'} strokeWidth="1.2" />
                                <polygon points="215,25 470,25 470,72 265,72 265,65 215,65" fill="url(#hatchPort)" />

                                <polygon points="215,175 470,175 470,128 265,128 265,135 215,135" fill="url(#pipePortSteel)" stroke={activePart === 'port' ? highlightColor : '#64748b'} strokeWidth="1.2" />
                                <polygon points="215,175 470,175 470,128 265,128 265,135 215,135" fill="url(#hatchPort)" />

                                <line x1="215" y1="25" x2="215" y2="65" stroke="#94a3b8" strokeWidth="1.5" />
                                <line x1="215" y1="135" x2="215" y2="175" stroke="#94a3b8" strokeWidth="1.5" />

                                <text x="360" y="48" fill="#94a3b8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                    {isBSPP ? (t12(lang, 'ISO 228 FEMALE PORT (G)', 'ISO 228 DİŞİ PORT (G)')) : (t12(lang, 'NPT TAPERED PORT (1:16)', 'NPT KONİK PORT (1:16)'))}
                                </text>

                                {/* Internal thread (tap) on the female port — visible kılavuz dişi */}
                                {Array.from({ length: 10 }).map((_, i) => {
                                    const tx = 216 + i * 10;
                                    const taperY = isBSPP ? 0 : i * 0.35;
                                    return (
                                        <g key={`ft-${i}`}>
                                            <polyline
                                                points={`${tx},${65 - taperY} ${tx + 5},${72 - taperY} ${tx + 10},${65 - taperY}`}
                                                fill="none"
                                                stroke="#67e8f9"
                                                strokeWidth="1.35"
                                            />
                                            <polyline
                                                points={`${tx},${135 + taperY} ${tx + 5},${128 + taperY} ${tx + 10},${135 + taperY}`}
                                                fill="none"
                                                stroke="#67e8f9"
                                                strokeWidth="1.35"
                                            />
                                        </g>
                                    );
                                })}
                                <line x1="215" y1="78" x2="320" y2={isBSPP ? 78 : 82} stroke="#fbbf24" strokeWidth="1.1" strokeDasharray="5 3" />
                                <line x1="215" y1="122" x2="320" y2={isBSPP ? 122 : 118} stroke="#fbbf24" strokeWidth="1.1" strokeDasharray="5 3" />
                                <text x="218" y="90" fill="#fbbf24" fontSize="7" fontFamily="monospace" fontWeight="bold">
                                    {t12(lang, `TAP Ø${(results?.geometry?.tapDrill ??formatEngineeringValue((d - pVal)), precision, false)}`, `KILAVUZ Ø${(results?.geometry?.tapDrill ??formatEngineeringValue((d - pVal)), precision, false)}`)}
                                </text>
                            </g>

                            {/* ─── 2. CENTRAL FLUID FLOW PASSAGE ─── */}
                            <g 
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('bore')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('bore')}
                            >
                                <rect x="25" y="86" width="445" height="28" fill="url(#fluidStream)" />
                                <line x1="25" y1="100" x2="465" y2="100" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="8 6" opacity="0.8" style={{ animation: 'flowPulse 1.8s linear infinite' }} />
                                <line x1="25" y1="93" x2="465" y2="93" stroke="#e0f2fe" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.6" style={{ animation: 'flowPulse 2.4s linear infinite' }} />
                                <line x1="25" y1="107" x2="465" y2="107" stroke="#e0f2fe" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.6" style={{ animation: 'flowPulse 2.4s linear infinite' }} />
                                
                                <text x="135" y="103" fill="#ffffff" fontSize="7.5" fontFamily="monospace" fontWeight="900" opacity="0.9">
                                    ►► {t12(lang, 'FLUID FLOW', 'BASINÇLI AKIŞ')} ►►
                                </text>
                            </g>

                            {/* ─── 3. DOWTY BONDED WASHER / O-RING (PARALLEL BSPP G) ─── */}
                            {isBSPP && (
                                <g 
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredPart('thread')}
                                    onMouseLeave={() => setHoveredPart(null)}
                                    onClick={() => setSelectedPart('thread')}
                                >
                                    <rect x="207" y="52" width="7" height="15" rx="1.5" fill="url(#dowtySeal)" stroke="#06b6d4" strokeWidth="1" />
                                    <rect x="207" y="133" width="7" height="15" rx="1.5" fill="url(#dowtySeal)" stroke="#06b6d4" strokeWidth="1" />
                                    <text x="210" y="44" fill="#06b6d4" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                        DOWTY / O-RING
                                    </text>
                                </g>
                            )}

                            {/* ─── 4. MALE PIPE FITTING BODY ─── */}
                            <g
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('fitting')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('fitting')}
                            >
                                <path 
                                    d="M 35,38 L 98,38 L 98,162 L 35,162 L 28,145 L 28,55 Z" 
                                    fill={activePart === 'fitting' ? 'rgba(249,115,22,0.4)' : 'url(#brassSatin)'} 
                                    stroke={activePart === 'fitting' ? highlightColor : '#a16207'} 
                                    strokeWidth="1.2" 
                                    filter="url(#boltDropShadow)"
                                />
                                <line x1="28" y1="55" x2="98" y2="55" stroke="#fef9c3" strokeWidth="0.7" opacity="0.6" />
                                <line x1="28" y1="145" x2="98" y2="145" stroke="#fef9c3" strokeWidth="0.7" opacity="0.6" />
                                
                                {isBSPP ? (
                                    <g>
                                        <rect x="98" y="55" width="10" height="31" fill="#713f12" stroke="#a16207" strokeWidth="0.8" />
                                        <rect x="98" y="114" width="10" height="31" fill="#713f12" stroke="#a16207" strokeWidth="0.8" />
                                        <rect x="108" y="52" width="145" height="34" fill="url(#brassSatin)" stroke="#a16207" strokeWidth="1" />
                                        <rect x="108" y="114" width="145" height="34" fill="url(#brassSatin)" stroke="#a16207" strokeWidth="1" />
                                    </g>
                                ) : (
                                    <g>
                                        <polygon points="98,50 255,54 255,86 98,86" fill="url(#brassSatin)" stroke="#a16207" strokeWidth="1" />
                                        <polygon points="98,150 255,146 255,114 98,114" fill="url(#brassSatin)" stroke="#a16207" strokeWidth="1" />
                                    </g>
                                )}

                                <text x="65" y="75" fill="#451a03" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle">
                                    {size}
                                </text>
                                <text x="65" y="130" fill="#451a03" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                    {isBSPP ? 'BSPP G' : isBSPT ? 'BSPT R' : 'NPT MALE'}
                                </text>
                            </g>

                            {/* ─── 5. THREAD RIDGES ─── */}
                            <g
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('thread')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('thread')}
                            >
                                {[112, 124, 136, 148, 160, 172, 184, 196, 208].map((tx) => (
                                    <g key={tx}>
                                        <line x1={tx} y1={isBSPP ? 52 : 50 + (tx - 98) * 0.025} x2={tx + 6} y2="86" stroke="#ca8a04" strokeWidth="1" />
                                        <line x1={tx} y1={isBSPP ? 148 : 150 - (tx - 98) * 0.025} x2={tx + 6} y2="114" stroke="#ca8a04" strokeWidth="1" />
                                    </g>
                                ))}

                                {[220, 232, 244].map((tx) => (
                                    <g key={tx} style={{ animation: 'sealGlow 2s ease-in-out infinite' }}>
                                        <line x1={tx} y1={isBSPP ? 52 : 50 + (tx - 98) * 0.025} x2={tx + 6} y2="86" stroke={isBSPP ? '#06b6d4' : '#ec4899'} strokeWidth="1.8" strokeDasharray="2 1" />
                                        <line x1={tx} y1={isBSPP ? 148 : 150 - (tx - 98) * 0.025} x2={tx + 6} y2="114" stroke={isBSPP ? '#06b6d4' : '#ec4899'} strokeWidth="1.8" strokeDasharray="2 1" />
                                    </g>
                                ))}

                                {isTaperedPipe ? (
                                    <g>
                                        <line x1="98" y1="46" x2="255" y2="50" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 2" />
                                        <text x="175" y="42" fill="#f59e0b" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                                            Taper 1:16 (1° 47')
                                        </text>
                                        <g transform="translate(215, 12)">
                                            <rect x="-28" y="0" width="56" height="13" rx="3" fill="rgba(236,72,153,0.15)" stroke="#ec4899" strokeWidth="0.8" />
                                            <text x="0" y="9" fill="#ec4899" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                                PTFE / SEAL
                                            </text>
                                        </g>
                                    </g>
                                ) : (
                                    <g>
                                        <line x1="108" y1="48" x2="255" y2="48" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 2" />
                                        <text x="180" y="44" fill="#06b6d4" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                                            ISO 228 Parallel
                                        </text>
                                    </g>
                                )}
                            </g>

                            {/* ─── 6. TIGHTENING TORQUE & SEALING VECTORS ─── */}
                            <g transform="translate(65, 24)">
                                <path 
                                    d="M -15 6 A 16 16 0 1 1 10 9" 
                                    fill="none" 
                                    stroke="#f59e0b" 
                                    strokeWidth="1.8" 
                                    strokeDasharray="4 2" 
                                    markerEnd="url(#torque-arrow)" 
                                    style={{ animation: 'torqueRotate 4s linear infinite' }}
                                />
                                <text x="0" y="-8" fill="#f59e0b" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                    MA = {(results.MA ?? results.torque ??formatEngineeringValue(0), precision, false)} N·m
                                </text>
                            </g>

                            {isBSPP ? (
                                <g style={{ animation: 'clampPulse 2s ease-in-out infinite' }}>
                                    <line x1="230" y1="60" x2="215" y2="60" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#clamp-arrow-left)" />
                                    <line x1="230" y1="140" x2="215" y2="140" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#clamp-arrow-left)" />
                                    <text x="240" y="63" fill="#06b6d4" fontSize="7" fontWeight="bold" fontFamily="monospace">
                                        F_face (Dowty)
                                    </text>
                                </g>
                            ) : (
                                <g style={{ animation: 'sealGlow 2.5s ease-in-out infinite' }}>
                                    <line x1="235" y1="36" x2="235" y2="51" stroke="#ec4899" strokeWidth="1.8" markerEnd="url(#seal-arrow-top)" />
                                    <line x1="235" y1="164" x2="235" y2="149" stroke="#ec4899" strokeWidth="1.8" markerEnd="url(#seal-arrow-bot)" />
                                    <text x="245" y="44" fill="#ec4899" fontSize="7" fontWeight="bold" fontFamily="monospace">
                                        F_seal (1:16 Wedge)
                                    </text>
                                </g>
                            )}
                        </g>
                    ) : (
                        /* ══════════════════════════════════════════════════════════════════════════════════════════
                           STANDARD BOLT JOINT (HEX BOLT + CLAMPED PLATES A & B + WASHERS + NUT)
                           ══════════════════════════════════════════════════════════════════════════════════════════ */
                        <g>
                            {/* ═══ 0. RÖTSCHER 30° CLAMPING PRESSURE CONES (VISUAL FRUSTUMS) ═══ */}
                            {showClampingCones && (
                                <g opacity="0.85">
                                    {/* Left Cone radiating from Bolt Head */}
                                    <polygon 
                                        points={`${g.xWasherHead + g.washerT},${g.cy - g.ddw / 2} ${g.xPlateSplit},${g.cy - g.plateH / 2} ${g.xPlateSplit},${g.cy + g.plateH / 2} ${g.xWasherHead + g.washerT},${g.cy + g.ddw / 2}`} 
                                        fill="url(#coneLeft)" 
                                        stroke="#00e5ff" 
                                        strokeWidth="0.8" 
                                        strokeDasharray="3 2"
                                    />
                                    {/* Right Cone radiating from Nut */}
                                    <polygon 
                                        points={`${g.xWasherNut},${g.cy - g.ddw / 2} ${g.xPlateSplit},${g.cy - g.plateH / 2} ${g.xPlateSplit},${g.cy + g.plateH / 2} ${g.xWasherNut},${g.cy + g.ddw / 2}`} 
                                        fill="url(#coneRight)" 
                                        stroke="#818cf8" 
                                        strokeWidth="0.8" 
                                        strokeDasharray="3 2"
                                    />
                                    <rect x={g.xPlateSplit - 60} y={g.cy - g.plateH / 2 - 2} width="120" height="12" rx="2" fill="#040810" stroke="#38bdf8" strokeWidth="0.6" opacity="0.9" />
                                    <text x={g.xPlateSplit} y={g.cy - g.plateH / 2 + 7} fill="#38bdf8" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                        {t12(lang, 'Rötscher Cone (2α=60°)', 'Rötscher Konisi (2α=60°)')}
                                    </text>
                                </g>
                            )}

                            {/* ═══ 1. CLAMPED JOINT PLATES (SOLID SECTION) ═══ */}
                            <g 
                                className="cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredPart('plates')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('plates')}
                            >
                                {/* Plate A Top & Bottom Blocks */}
                                <rect x={g.xWasherHead + g.washerT} y={g.cy - g.plateH / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill="url(#plateSteelA)" stroke={activePart === 'plates' ? highlightColor : '#00e5ff'} strokeWidth="1" />
                                <rect x={g.xWasherHead + g.washerT} y={g.cy - g.plateH / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateA)" />

                                <rect x={g.xWasherHead + g.washerT} y={g.cy + g.ddh / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill="url(#plateSteelA)" stroke={activePart === 'plates' ? highlightColor : '#00e5ff'} strokeWidth="1" />
                                <rect x={g.xWasherHead + g.washerT} y={g.cy + g.ddh / 2} width={g.xPlateSplit - g.xWasherHead - g.washerT} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateA)" />

                                {/* Plate B Top & Bottom Blocks */}
                                <rect x={g.xPlateSplit} y={g.cy - g.plateH / 2} width={g.xWasherNut - g.xPlateSplit} height={(g.plateH - g.ddh) / 2} fill="url(#plateSteelB)" stroke={activePart === 'plates' ? highlightColor : '#818cf8'} strokeWidth="1" />
                                <rect x={g.xPlateSplit} y={g.cy - g.plateH / 2} width={g.xWasherNut - g.xPlateSplit} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateB)" />

                                <rect x={g.xPlateSplit} y={g.cy + g.ddh / 2} width={g.xWasherNut - g.xPlateSplit} height={(g.plateH - g.ddh) / 2} fill="url(#plateSteelB)" stroke={activePart === 'plates' ? highlightColor : '#818cf8'} strokeWidth="1" />
                                <rect x={g.xPlateSplit} y={g.cy + g.ddh / 2} width={g.xWasherNut - g.xPlateSplit} height={(g.plateH - g.ddh) / 2} fill="url(#hatchPlateB)" />

                                {/* Joint Separation Seam */}
                                <line x1={g.xPlateSplit} y1={g.cy - g.plateH / 2} x2={g.xPlateSplit} y2={g.cy + g.plateH / 2} stroke="#f8fafc" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />
                            </g>

                            {/* ═══ 2. HARDENED STEEL WASHERS ═══ */}
                            <g
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('washer')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('washer')}
                            >
                                <rect x={g.xWasherHead} y={g.cy - g.ddw / 2} width={g.washerT} height={g.ddw} rx="1" fill={activePart === 'washer' ? highlightColor : 'url(#washerSteel)'} stroke={activePart === 'washer' ? '#fff' : '#475569'} strokeWidth="1" filter="url(#boltDropShadow)" />
                                <rect x={g.xWasherNut} y={g.cy - g.ddw / 2} width={g.washerT} height={g.ddw} rx="1" fill={activePart === 'washer' ? highlightColor : 'url(#washerSteel)'} stroke={activePart === 'washer' ? '#fff' : '#475569'} strokeWidth="1" filter="url(#boltDropShadow)" />
                            </g>

                            {/* ═══ 3. SOLID BOLT SHANK & THREAD ═══ */}
                            {/* Unthreaded Shank Body */}
                            <path 
                                d={g.shankPath} 
                                fill={activePart === 'shank' ? 'rgba(249,115,22,0.3)' : 'url(#boltShankSteel)'}
                                stroke={activePart === 'shank' ? highlightColor : '#64748b'} 
                                strokeWidth="1.2"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('shank')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('shank')}
                                filter="url(#boltDropShadow)"
                            />

                            {/* Solid Metric Thread Teeth Section */}
                            <path 
                                d={g.threadPath} 
                                fill={activePart === 'thread' ? 'rgba(249,115,22,0.3)' : 'url(#threadTeethSteel)'}
                                stroke={activePart === 'thread' ? highlightColor : '#94a3b8'} 
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('thread')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('thread')}
                                filter="url(#boltDropShadow)"
                            />

                            {/* Thread Pitch d2 & Root d3 Lines */}
                            <line x1={g.xThreadStart} y1={g.cy - (g.dd * 0.44)} x2={g.xShankEnd} y2={g.cy - (g.dd * 0.44)} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />
                            <line x1={g.xThreadStart} y1={g.cy + (g.dd * 0.44)} x2={g.xShankEnd} y2={g.cy + (g.dd * 0.44)} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />

                            {/* ═══ 4. FINITE-ELEMENT STRESS HEATMAP CORE ═══ */}
                            {showStressHeatmap && (
                                <g>
                                    <line 
                                        x1={g.xHeadRight} 
                                        y1={g.cy} 
                                        x2={g.xShankEnd} 
                                        y2={g.cy} 
                                        stroke="url(#stressHeatmap)" 
                                        strokeWidth="4.5" 
                                        strokeLinecap="round"
                                        opacity="0.95" 
                                        strokeDasharray="6 2"
                                        className="animate-pulse"
                                        filter="url(#neonGlow)"
                                    />
                                    {/* Stress Value Badge */}
                                    <g transform={`translate(${(g.xHeadRight + g.xShankEnd) / 2}, ${g.cy})`}>
                                        <rect x="-35" y="-7" width="70" height="14" rx="3" fill="#040810" stroke={heatColor} strokeWidth="1" />
                                        <text x="0" y="3.5" fill={heatColor} fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                            σeq {formatEngineeringValue(sigmaEq, precision, false)} MPa
                                        </text>
                                    </g>
                                </g>
                            )}

                            {/* ═══ 5. 3D SOLID HEX BOLT HEAD & GRADE STAMP ═══ */}
                            <g
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('head')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('head')}
                            >
                                <path 
                                    d={`M ${g.xHeadRight} ${g.cy - g.ds / 2} L ${g.x0 + 2.5} ${g.cy - g.ds / 2} L ${g.x0} ${g.cy - g.ds / 4} L ${g.x0} ${g.cy + g.ds / 4} L ${g.x0 + 2.5} ${g.cy + g.ds / 2} L ${g.xHeadRight} ${g.cy + g.ds / 2} Z`}
                                    fill={activePart === 'head' ? 'rgba(249,115,22,0.3)' : 'url(#boltHeadSteel)'}
                                    stroke={activePart === 'head' ? highlightColor : '#94a3b8'} 
                                    strokeWidth="1.4"
                                    filter="url(#boltDropShadow)"
                                />
                                <line x1={g.x0 + 2.5} y1={g.cy - g.ds / 4} x2={g.xHeadRight} y2={g.cy - g.ds / 4} stroke="#cbd5e1" strokeWidth="0.8" opacity="0.6" />
                                <line x1={g.x0 + 2.5} y1={g.cy + g.ds / 4} x2={g.xHeadRight} y2={g.cy + g.ds / 4} stroke="#cbd5e1" strokeWidth="0.8" opacity="0.6" />
                                
                                <text x={g.x0 + g.dk * 0.45} y={g.cy + 3} fill="#090d16" fontSize="8" fontWeight="900" fontFamily="monospace" textAnchor="middle" opacity="0.9">
                                    {grade}
                                </text>
                            </g>

                            {/* ═══ 6. 3D SOLID HEX NUT ═══ */}
                            <g
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPart('nut')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => setSelectedPart('nut')}
                            >
                                <path 
                                    d={`M ${g.xNutLeft} ${g.cy - g.ds / 2} L ${g.xNutRight - 2} ${g.cy - g.ds / 2} L ${g.xNutRight} ${g.cy - g.ds / 4} L ${g.xNutRight} ${g.cy + g.ds / 4} L ${g.xNutRight - 2} ${g.cy + g.ds / 2} L ${g.xNutLeft} ${g.cy + g.ds / 2} Z`}
                                    fill={activePart === 'nut' ? 'rgba(249,115,22,0.3)' : 'url(#nutSteel)'}
                                    stroke={activePart === 'nut' ? highlightColor : '#94a3b8'} 
                                    strokeWidth="1.4"
                                    filter="url(#boltDropShadow)"
                                />
                                <line x1={g.xNutLeft} y1={g.cy - g.ds / 4} x2={g.xNutRight - 2} y2={g.cy - g.ds / 4} stroke="#cbd5e1" strokeWidth="0.8" opacity="0.6" />
                                <line x1={g.xNutLeft} y1={g.cy + g.ds / 4} x2={g.xNutRight - 2} y2={g.cy + g.ds / 4} stroke="#cbd5e1" strokeWidth="0.8" opacity="0.6" />
                            </g>

                            {/* ═══ 7. CLAMPING PRELOAD FORCES & TIGHTENING TORQUE ANIMATION ═══ */}
                            {/* Tightening Torque Vector (Placed comfortably at top left) */}
                            <g transform={`translate(${g.x0 - 15}, 26)`}>
                                <path 
                                    d="M -14 6 A 15 15 0 1 1 10 10" 
                                    fill="none" 
                                    stroke="#f59e0b" 
                                    strokeWidth="1.8" 
                                    strokeDasharray="3 2" 
                                    markerEnd="url(#torque-arrow)" 
                                    style={{ animation: 'torqueRotate 4s linear infinite' }}
                                />
                                <rect x="-42" y="-18" width="84" height="14" rx="3" fill="#040810" stroke="#f59e0b" strokeWidth="0.6" />
                                <text x="0" y="-8" fill="#f59e0b" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                    MA = {(results.MA ?? results.torque ??formatEngineeringValue(0), precision, false)} N·m
                                </text>
                            </g>

                            {/* Clamping Force FM Opposing Arrows */}
                            <g style={{ animation: 'clampPulse 2.2s ease-in-out infinite' }}>
                                <line x1={g.x0 - 32} y1={g.cy} x2={g.x0 - 4} y2={g.cy} stroke="#00e5ff" strokeWidth="2.5" markerEnd="url(#clamp-arrow-left)" />
                                <text x={g.x0 - 36} y={g.cy - 5} fill="#00e5ff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                                    FM {formatEngineeringValue(Fm, precision, false)} kN
                                </text>

                                <line x1={g.xNutRight + 32} y1={g.cy} x2={g.xNutRight + 4} y2={g.cy} stroke="#00e5ff" strokeWidth="2.5" markerEnd="url(#clamp-arrow-right)" />
                                <text x={g.xNutRight + 36} y={g.cy - 5} fill="#00e5ff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="start">
                                    FM {formatEngineeringValue(Fm, precision, false)} kN
                                </text>
                            </g>

                            {/* ═══ 8. PERSISTENT CAD DIMENSION OVERLAYS ═══ */}
                            {showDimensions && (
                                <g opacity="0.95" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="700">
                                    <line x1={g.xHeadRight} y1={g.cy + g.plateH / 2 + 16} x2={g.xShankEnd} y2={g.cy + g.plateH / 2 + 16} stroke="#38bdf8" strokeWidth="1" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
                                    <line x1={g.xHeadRight} y1={g.cy + g.dd / 2} x2={g.xHeadRight} y2={g.cy + g.plateH / 2 + 20} stroke="#64748b" strokeWidth="0.6" strokeDasharray="2 2" />
                                    <line x1={g.xShankEnd} y1={g.cy + g.dd / 2} x2={g.xShankEnd} y2={g.cy + g.plateH / 2 + 20} stroke="#64748b" strokeWidth="0.6" strokeDasharray="2 2" />
                                    <text x={(g.xHeadRight + g.xShankEnd) / 2} y={g.cy + g.plateH / 2 + 28} fill="#38bdf8" textAnchor="middle">
                                        L = {l} mm
                                    </text>
                                    <text x={(g.xHeadRight + g.xShankEnd) / 2} y={g.cy + g.plateH / 2 + 40} fill="#94a3b8" textAnchor="middle" fontSize="8" fontWeight="600">
                                        Ød = {formatEngineeringValue(d, precision, false)} · d₂ = {formatEngineeringValue(d2, precision, false)} · d₃ = {formatEngineeringValue(d3, precision, false)}
                                    </text>

                                    <line x1={g.xWasherHead + g.washerT} y1={16} x2={g.xWasherNut} y2={16} stroke="#00e5ff" strokeWidth="1" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
                                    <line x1={g.xWasherHead + g.washerT} y1={g.cy - g.plateH / 2} x2={g.xWasherHead + g.washerT} y2={12} stroke="#64748b" strokeWidth="0.6" strokeDasharray="2 2" />
                                    <line x1={g.xWasherNut} y1={g.cy - g.plateH / 2} x2={g.xWasherNut} y2={12} stroke="#64748b" strokeWidth="0.6" strokeDasharray="2 2" />
                                    <text x={(g.xWasherHead + g.washerT + g.xWasherNut) / 2} y={17} fill="#00e5ff" textAnchor="middle">
                                        lK = {formatEngineeringValue(Math.max(0, Number(results?.gripLength ?? (l - m - 4))), precision, false)} mm
                                    </text>

                                    <line x1={g.x0} y1={g.cy + g.ds / 2 + 10} x2={g.xHeadRight} y2={g.cy + g.ds / 2 + 10} stroke="#94a3b8" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
                                    <text x={(g.x0 + g.xHeadRight) / 2} y={g.cy + g.ds / 2 + 20} fill="#cbd5e1" textAnchor="middle">
                                        k={formatEngineeringValue(k, precision, false)}
                                    </text>

                                    <line x1={g.xNutLeft} y1={g.cy + g.ds / 2 + 10} x2={g.xNutRight} y2={g.cy + g.ds / 2 + 10} stroke="#94a3b8" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
                                    <text x={(g.xNutLeft + g.xNutRight) / 2} y={g.cy + g.ds / 2 + 20} fill="#cbd5e1" textAnchor="middle">
                                        m={formatEngineeringValue(m, precision, false)}
                                    </text>
                                </g>
                            )}
                        </g>
                    )}
                </svg>

            </div>

                {partDetails && (
                    <div className="shrink-0 border-t border-orange-500/25 bg-slate-950/90 px-3 py-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                                <Ruler size={12} className="text-orange-400" />
                                {partDetails.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{partDetails.desc}</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1">
                            {partDetails.metrics.map((metric, idx) => (
                                <div key={idx} className="flex items-baseline justify-between gap-2 text-[11px]">
                                    <span className="text-slate-400">{metric.label}</span>
                                    <span className="font-mono font-bold tabular-nums text-orange-300">{metric.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
}

export default FastenerInteractiveSchematic;
