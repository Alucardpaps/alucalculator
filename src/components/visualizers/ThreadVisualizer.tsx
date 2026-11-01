'use client';

import React, { useId, useRef, useState, useMemo } from 'react';
import {
    computeThreadProfile,
    kindOf,
    STANDARD_THREAD_SIZES,
    type ThreadTypeCode,
    type StandardThreadSize,
} from '@/lib/fastener/threadProfiles';
import {
    handbookForType,
    polyClosed,
    polyOpen,
} from '@/lib/fastener/handbookProfile';
import { Download, Compass, Layers, Eye, RefreshCw, Box } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { ThreadDrawings } from './ThreadDrawings';

export interface ThreadVisualizerProps {
    type: ThreadTypeCode | string;
    pitch: number;
    angle?: number;
    height?: number;
    majorDia?: number;
    tapDrill?: number;
    onSelectPreset?: (preset: StandardThreadSize) => void;
}

export type VisualizerViewMode = 'flank' | 'male' | 'female' | 'gauge';

function n4(v: number) {
    return v.toFixed(4);
}

function DimH({
    uid, x1, x2, y, label, fs, yExt, color = 'var(--cyan, #38bdf8)',
}: { uid: string; x1: number; x2: number; y: number; label: string; fs: number; yExt?: number; color?: string }) {
    const a = Math.min(x1, x2);
    const b = Math.max(x1, x2);
    const mid = (a + b) / 2;
    const h = fs * 1.45;
    const w = Math.max(fs * 3.2, label.length * fs * 0.65 + fs * 1.4);
    return (
        <g>
            {yExt !== undefined && (
                <>
                    <line x1={a} y1={yExt} x2={a} y2={y > yExt ? y + fs * 0.4 : y - fs * 0.4} stroke="var(--muted, #475569)" strokeWidth={Math.max(0.8, fs * 0.06)} strokeDasharray="3 2" />
                    <line x1={b} y1={yExt} x2={b} y2={y > yExt ? y + fs * 0.4 : y - fs * 0.4} stroke="var(--muted, #475569)" strokeWidth={Math.max(0.8, fs * 0.06)} strokeDasharray="3 2" />
                </>
            )}
            <line x1={a} y1={y} x2={b} y2={y} stroke={color} strokeWidth={Math.max(1.2, fs * 0.08)} markerStart={`url(#${uid}-b)`} markerEnd={`url(#${uid}-a)`} />
            <rect x={mid - w / 2} y={y - h / 2} width={w} height={h} rx={fs * 0.22} fill="var(--bg-2, #050a14)" stroke={color} strokeWidth={Math.max(1.1, fs * 0.07)} />
            <text x={mid} y={y} dominantBaseline="central" textAnchor="middle" fill="var(--ink, #ffffff)" fontSize={fs * 0.95} fontWeight="900" fontFamily="ui-monospace, monospace">{label}</text>
        </g>
    );
}

function DimV({
    uid, x, y1, y2, label, fs, xExt, color = 'var(--cyan, #38bdf8)',
}: { uid: string; x: number; y1: number; y2: number; label: string; fs: number; xExt?: number; color?: string }) {
    const a = Math.min(y1, y2);
    const b = Math.max(y1, y2);
    const mid = (a + b) / 2;
    const h = fs * 1.45;
    const w = Math.max(fs * 3.2, label.length * fs * 0.65 + fs * 1.4);
    return (
        <g>
            {xExt !== undefined && (
                <>
                    <line x1={xExt} y1={a} x2={x > xExt ? x + fs * 0.4 : x - fs * 0.4} y2={a} stroke="var(--muted, #475569)" strokeWidth={Math.max(0.8, fs * 0.06)} strokeDasharray="3 2" />
                    <line x1={xExt} y1={b} x2={x > xExt ? x + fs * 0.4 : x - fs * 0.4} y2={b} stroke="var(--muted, #475569)" strokeWidth={Math.max(0.8, fs * 0.06)} strokeDasharray="3 2" />
                </>
            )}
            <line x1={x} y1={a} x2={x} y2={b} stroke={color} strokeWidth={Math.max(1.2, fs * 0.08)} markerStart={`url(#${uid}-b)`} markerEnd={`url(#${uid}-a)`} />
            <rect x={x - w / 2} y={mid - h / 2} width={w} height={h} rx={fs * 0.22} fill="var(--bg-2, #050a14)" stroke={color} strokeWidth={Math.max(1.1, fs * 0.07)} />
            <text x={x} y={mid} dominantBaseline="central" textAnchor="middle" fill="var(--ink, #ffffff)" fontSize={fs * 0.95} fontWeight="900" fontFamily="ui-monospace, monospace">{label}</text>
        </g>
    );
}

function defs(uid: string, fs: number) {
    const hatch = Math.max(0.1, fs * 0.6);
    return (
        <defs>
            <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                <path d="M0 1.5 L9 5 L0 8.5 Z" fill="var(--cyan, #38bdf8)" />
            </marker>
            <marker id={`${uid}-b`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                <path d="M9 1.5 L1 5 L9 8.5 Z" fill="var(--cyan, #38bdf8)" />
            </marker>
            <marker id={`${uid}-lead`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                <path d="M0 1.5 L9 5 L0 8.5 Z" fill="var(--warn, #f59e0b)" />
            </marker>
            <pattern id={`${uid}-h`} patternUnits="userSpaceOnUse" width={hatch} height={hatch} patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2={hatch} stroke="var(--cyan, #06b6d4)" strokeWidth={hatch * 0.25} opacity="0.65" />
            </pattern>
            <pattern id={`${uid}-metal`} patternUnits="userSpaceOnUse" width={hatch * 1.2} height={hatch * 1.2} patternTransform="rotate(-45)">
                <line x1="0" y1="0" x2="0" y2={hatch * 1.2} stroke="var(--warn, #f59e0b)" strokeWidth={hatch * 0.22} opacity="0.35" />
            </pattern>
        </defs>
    );
}

export const ThreadVisualizer: React.FC<ThreadVisualizerProps> = ({
    type,
    pitch = 1.5,
    majorDia,
    tapDrill,
    onSelectPreset,
}) => {
    const { language } = useI18nStore();
    const uid = useId().replace(/:/g, '');
    const svgRef = useRef<SVGSVGElement>(null);
    const [viewMode, setViewMode] = useState<VisualizerViewMode>('flank');
    const [flankSubMode, setFlankSubMode] = useState<'profile' | 'fit'>('profile');
    const [isLeftHand, setIsLeftHand] = useState<boolean>(false);

    const P = pitch > 0.05 ? pitch : 1.5;
    const dNom = Number.isFinite(majorDia) && (majorDia as number) > 0 ? (majorDia as number) : 10;
    const g = computeThreadProfile(type, dNom, P);
    const tap = Number.isFinite(tapDrill) && (tapDrill as number) > 0 ? (tapDrill as number) : g.tapDrill;
    const hb = handbookForType(type, P, 2);
    const kind = kindOf(type);
    const Y = (y: number) => -y;
    const nPitch = 2;
    const xEnd = nPitch * P;

    const fmtN = (v: number) => String(parseFloat(v.toFixed(3)));
    const handSuffix = isLeftHand ? '-LH' : '';
    const calloutExt = kind === 'iso60'
        ? `M${fmtN(dNom)}×${fmtN(P)}-6g${handSuffix}`
        : `${String(type)} ${fmtN(dNom)}×${fmtN(P)}${handSuffix}`;
    const calloutInt = kind === 'iso60'
        ? `M${fmtN(dNom)}×${fmtN(P)}-6H${handSuffix}`
        : calloutExt;

    const catalogMatch = useMemo(() => {
        return STANDARD_THREAD_SIZES.find(
            (s) => (s.standardType === type || (s.standardType === 'G' && (type === 'BSPP' || type === 'G'))) &&
                   Math.abs(s.diameterMm - dNom) < 0.8
        );
    }, [type, dNom]);

    // Download current active SVG
    const downloadSvg = () => {
        if (!svgRef.current) return;
        const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const blob = new Blob(
            ['<?xml version="1.0" encoding="UTF-8"?>\n<!-- AluCalculator 1 user unit = 1 mm -->\n', clone.outerHTML],
            { type: 'image/svg+xml;charset=utf-8' },
        );
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${String(type)}_${dNom.toFixed(1)}x${P.toFixed(2)}_${viewMode}.svg`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // ── Mode 1: Basic Flank Geometry (Normalized Scale for Scale-Invariant Typography) ──
    const scaleF = 180 / P;
    const sX = (x: number) => x * scaleF;
    const sY = (y: number) => y * scaleF;

    const scaledMalePts = useMemo(() => hb.male.map((p) => ({ x: sX(p.x), y: sY(p.y) })), [hb.male, scaleF]);
    const scaledSharpPts = useMemo(() => hb.sharp.map((p) => ({ x: sX(p.x), y: sY(p.y) })), [hb.sharp, scaleF]);

    const maleLine = polyOpen(scaledMalePts, Y);
    const maleFill = polyClosed(scaledMalePts, sY(hb.yMaleRoot - 0.45 * hb.H), Y);
    const sharp = polyOpen(scaledSharpPts, Y);

    // Assembly Fit Mating Thread: female shifted so tooth valleys enclose male crests with radial clearance
    const radialGap = Math.max(0.04 * P, (hb.H / 6 - hb.H / 8));
    const fitFemPts = useMemo(() => {
        return hb.female.map((p) => ({
            x: sX(p.x),
            y: sY(p.y + radialGap),
        }));
    }, [hb.female, radialGap, scaleF]);
    const fitFemLine = polyOpen(fitFemPts, Y);
    const fitFemFill = polyClosed(fitFemPts, sY(hb.yFemaleMajor + 0.5 * hb.H), Y);

    const P_s = 180;
    const xEnd_s = nPitch * P_s; // 360
    const H_s = sY(hb.H);
    const halfAngle = (hb.angleDeg * Math.PI) / 360;

    const vbX = -350;
    const vbY = -225;
    const vbW = 1060;
    const vbH = 380;
    const fs = 17;
    const sw = 1.6;

    // ── Mode 2: Male Thread (External Bolt / Stud or Conical Pipe Nipple) ──
    const taperL1 = catalogMatch?.gaugeLengthMm ?? (g.isTapered ? Math.max(4, dNom * 0.38) : 8);
    const taperL2 = taperL1 * 1.6;
    const taperL4 = Math.max(taperL1 * 2.2, dNom * 1.2);
    const taperLen = taperL4 + 12;
    const taperHalf = 1 / 32; // 1:16 on diameter = 1:32 on radius

    const shaftLen = g.isTapered ? taperLen : Math.max(30, Math.min(90, dNom * 2.0));
    const nThreads = Math.max(4, Math.floor(shaftLen / P));
    const rD = dNom / 2;
    const rD1 = g.d1 / 2;
    const rTip = g.isTapered ? Math.max(2, (g.d2 / 2) - (taperL1 * taperHalf)) : rD;
    const rL1 = rTip + taperL1 * taperHalf;
    const rL2 = rTip + taperL2 * taperHalf;
    const rL4 = rTip + taperL4 * taperHalf;
    const rMax = rTip + taperLen * taperHalf;

    const maleVbW = shaftLen + dNom * 0.5 + 48;
    const maleVbH = Math.max(50, (g.isTapered ? rMax * 2 : rD * 2) * 2.1);
    const maleVbX = -14;
    const maleVbY = -(maleVbH / 2);
    const maleFs = Math.max(2.8, Math.min(6.8, maleVbH * 0.055));

    // ── Mode 3: Female Thread (Tapped Hole: Parallel or 1:16 Tapered Pipe Port) ──
    const nHole = Math.max(4, Math.min(10, Math.round(Math.max(g.d1, 6) / P)));
    const hbHole = handbookForType(type, P, nHole);
    const Lh = g.isTapered ? taperL4 : nHole * P;
    const cham = Math.min(P * 0.6, (g.d - g.d1) / 3.5);
    const wall = Math.max(rD * 0.55, P * 1.4);
    const drillDepth = Lh + Math.max(3.5 * P, 5.0);
    const coneDepth = (tap / 2) / 1.664; // 118° drill point cone (DIN 338 twist drill)
    const pointX = drillDepth + coneDepth;
    const blockEnd = pointX + wall * 0.6;

    const topInner = hbHole.female.map((p) => {
        const localTaper = g.isTapered ? Math.min(p.x, taperL4) * taperHalf : 0;
        return { x: p.x, y: -(rD - localTaper + p.y - hb.yFemaleMajor) };
    });
    const botInner = hbHole.female.map((p) => {
        const localTaper = g.isTapered ? Math.min(p.x, taperL4) * taperHalf : 0;
        return { x: p.x, y: rD - localTaper + p.y - hb.yFemaleMajor };
    });

    const holeTop = [
        `M ${n4(-cham)} ${n4(-(rD + wall))}`,
        `L ${n4(-cham)} ${n4(-rD)}`,
        `L 0 ${n4(-rD1)}`,
        ...topInner.map((p) => `L ${n4(p.x)} ${n4(p.y)}`),
        `L ${n4(Lh)} ${n4(-(tap / 2))}`,
        `L ${n4(drillDepth)} ${n4(-(tap / 2))}`,
        `L ${n4(pointX)} 0`,
        `L ${n4(blockEnd)} 0`,
        `L ${n4(blockEnd)} ${n4(-(rD + wall))}`,
        'Z',
    ].join(' ');

    const holeBot = [
        `M ${n4(-cham)} ${n4(rD + wall)}`,
        `L ${n4(-cham)} ${n4(rD)}`,
        `L 0 ${n4(rD1)}`,
        ...botInner.map((p) => `L ${n4(p.x)} ${n4(p.y)}`),
        `L ${n4(Lh)} ${n4(tap / 2)}`,
        `L ${n4(drillDepth)} ${n4(tap / 2)}`,
        `L ${n4(pointX)} 0`,
        `L ${n4(blockEnd)} 0`,
        `L ${n4(blockEnd)} ${n4(rD + wall)}`,
        'Z',
    ].join(' ');

    const holeFs = Math.max(2.8, Math.min(6.8, (rD + wall) * 0.22));
    const holeVbX = -cham - holeFs * 2.5;
    const holeVbY = -(rD + wall + holeFs * 4.6);
    const holeVbW = blockEnd + cham + holeFs * 22.0;
    const holeVbH = 2 * (rD + wall + holeFs * 4.6);

    // ── Mode 4: Tapered Pipe Gauge Station (ASME B1.20.1 / ISO 7-1) ──
    const L1 = taperL1;
    const L2 = taperL2;
    const L4 = taperL4;
    const e0 = g.d2 - (L1 / 16);
    const e1 = g.d2;
    const e2 = g.d2 + ((L2 - L1) / 16);
    const gaugeVbW = L4 + 35;
    const gaugeVbH = Math.max(50, dNom * 1.8 + 20);
    const gaugeVbX = -6;
    const gaugeVbY = -(gaugeVbH / 2);
    const gaugeFs = Math.max(2.8, Math.min(6.8, gaugeVbH * 0.055));

    return (
        <div className="w-full flex flex-col bg-[var(--bg-0)] rounded-2xl border border-white/10 shadow-2xl overflow-hidden font-sans">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[var(--bg-1)] border-b border-white/10 text-xs">
                {/* Mode Switcher Tabs */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                        type="button"
                        onClick={() => setViewMode('flank')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === 'flank'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Layers size={13} />
                        <span>{t12(language, 'Flank Geometry', 'Flank Geometrisi')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('male')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === 'male'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Eye size={13} />
                        <span>{t12(language, 'Male Thread (Bolt)', 'Erkek Diş (Civata)')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('female')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === 'female'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Eye size={13} />
                        <span>{t12(language, 'Female Thread (Nut/Hole)', 'Dişi Diş (Somun/Delik)')}</span>
                    </button>
                    {g.isTapered && (
                        <button
                            type="button"
                            onClick={() => setViewMode('gauge')}
                            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                viewMode === 'gauge'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Compass size={13} />
                            <span>{t12(language, 'Taper Gauge Blueprint', 'Konik Mastar Şeması')}</span>
                        </button>
                    )}
                </div>

                {/* Controls: Hand + SVG Download + 3D Export */}
                <div className="flex items-center gap-2 flex-wrap">

                    <button
                        type="button"
                        onClick={() => setIsLeftHand(!isLeftHand)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isLeftHand
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                        }`}
                        title="Right-Hand (RH) vs Left-Hand (LH) thread rotation"
                    >
                        <RefreshCw size={11} className={isLeftHand ? 'rotate-180 transition-transform' : ''} />
                        <span>{isLeftHand ? t12(language, 'LH (Left Hand)', 'LH (Sol Helis)') : t12(language, 'RH (Right Hand)', 'RH (Sağ Helis)')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={downloadSvg}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title={t12(language, 'Download 1:1 CAD SVG', '1:1 CAD SVG İndir')}
                    >
                        <Download size={12} />
                        <span>SVG 1:1</span>
                    </button>

                    <button
                        type="button"
                        onClick={async () => {
                            const { CrossModuleBridge } = await import('@/system/crossModuleBridge');
                            CrossModuleBridge.exportThreadTo3D({
                                type: String(type),
                                nominalDia: dNom,
                                pitch: P,
                                lengthMm: shaftLen,
                                role: viewMode === 'female' ? 'nut' : (viewMode === 'flank' ? 'assembly' : 'bolt'),
                                switchWindow: true,
                            });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title={t12(language, 'Export to 3D Design Studio', '3D Design Studio\'ya Aktar')}
                    >
                        <Box size={12} />
                        <span>{t12(language, 'Export to 3D', '3D\'ye Aktar')}</span>
                    </button>
                </div>
            </div>

            {/* Sub-Header Telemetry Strip */}
            <div className="px-4 py-2.5 bg-[var(--bg-0)] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-[13px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{g.standardCode}</span>
                    <span>·</span>
                    <span className="text-cyan-400 font-semibold">{g.angleLabel} {t12(language, 'Profile', 'Profil')}</span>
                    {g.isTapered && (
                        <>
                            <span>·</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
                                {g.taperLabel}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-slate-300 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/30">P = <strong className="text-amber-300">{P.toFixed(3)} mm</strong></span>
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/30">Ød = <strong className="text-amber-300">{g.d.toFixed(3)} mm</strong></span>
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/20">Ød₂ = <strong className="text-white">{g.d2.toFixed(3)} mm</strong></span>
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-cyan-500/30">Ød₁ = <strong className="text-cyan-300">{g.d1.toFixed(3)} mm</strong></span>
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-emerald-500/30">{t12(language, 'Tap Drill', 'Matkap')} = <strong className="text-emerald-400">{tap.toFixed(2)} mm</strong></span>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="p-4 relative min-h-[360px] flex items-center justify-center bg-[var(--bg-0)]">
                {/* ── MODES 1–3: FLANK PROFILE / FIT, MALE PART, FEMALE PART (ISO 128 / ISO 6410) ── */}
                {viewMode !== 'gauge' && (
                    <div className="w-full flex flex-col gap-2">
                        {viewMode === 'flank' && (
                            <div className="flex flex-wrap items-center gap-1 self-start p-1 rounded-lg border border-[var(--line)] bg-[var(--bg-1)] text-xs">
                                {(['profile', 'fit'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setFlankSubMode(m)}
                                        aria-pressed={flankSubMode === m}
                                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                                            flankSubMode === m
                                                ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-line)]'
                                                : 'text-[var(--muted)] hover:text-[var(--ink)] border border-transparent'
                                        }`}
                                    >
                                        {m === 'profile'
                                            ? t12(language, 'Basic profile', 'Temel profil')
                                            : t12(language, 'External + internal fit', 'Erkek + dişi geçme')}
                                    </button>
                                ))}
                            </div>
                        )}
                        <ThreadDrawings
                            view={viewMode === 'flank' ? flankSubMode : viewMode}
                            kind={kind}
                            d={dNom}
                            P={P}
                            tapDrill={tap}
                            callout={calloutExt}
                            internalCallout={calloutInt}
                            standard={g.standardCode || undefined}
                            leftHand={isLeftHand}
                            tapered={g.isTapered}
                            svgRef={svgRef}
                            labels={{
                                male: t12(language, 'External (bolt)', 'Erkek (cıvata)'),
                                female: t12(language, 'Internal (nut)', 'Dişi (somun)'),
                                contact: t12(language, 'flank contact', 'yanak teması'),
                                play: t12(language, 'play', 'boşluk'),
                                threadDepth: t12(language, 'thread', 'diş'),
                                drillDepth: t12(language, 'drill', 'delik'),
                            }}
                        />
                    </div>
                )}

                {/* ── MODE 4: TAPERED GAUGE STATION ── */}
                {viewMode === 'gauge' && (
                    <svg
                        ref={svgRef}
                        viewBox={`${gaugeVbX} ${gaugeVbY} ${gaugeVbW} ${gaugeVbH}`}
                        className="w-full h-auto max-h-[460px] select-none font-mono"
                    >
                        {defs(`${uid}g`, gaugeFs)}
                        <rect x={gaugeVbX} y={gaugeVbY} width={gaugeVbW} height={gaugeVbH} fill="var(--bg-1, #020408)" />

                        {/* Centerline */}
                        <line x1={-2} y1={0} x2={L4 + 10} y2={0} stroke="var(--cyan, #38bdf8)" strokeWidth={gaugeFs * 0.08} strokeDasharray="5 2 1 2" />

                        {/* Tapered Pipe Cone Profile (1:16 slope on diameter) */}
                        <polygon
                            points={`
                                0,${-(e0 / 2)}
                                ${L1},${-(e1 / 2)}
                                ${L2},${-(e2 / 2)}
                                ${L4},${-(e2 / 2 + (L4 - L2) / 32)}
                                ${L4},${e2 / 2 + (L4 - L2) / 32}
                                ${L2},${e2 / 2}
                                ${L1},${e1 / 2}
                                0,${e0 / 2}
                            `}
                            fill="var(--bg-3, #0f172a)"
                            stroke="var(--cyan, #06b6d4)"
                            strokeWidth={gaugeFs * 0.12}
                        />

                        {/* E0 Plane (Boru Ucu) */}
                        <line x1={0} y1={-(dNom * 0.8)} x2={0} y2={dNom * 0.8} stroke="var(--bad, #ef4444)" strokeWidth={gaugeFs * 0.1} strokeDasharray="3 2" />
                        <text x={0} y={-(dNom * 0.85)} fill="var(--bad, #ef4444)" fontSize={gaugeFs * 0.85} textAnchor="middle" fontWeight="800">E₀ ({t12(language, 'Pipe End Plane', 'Uç Düzlemi')})</text>

                        {/* L1 Gauge Plane (Elle Sıkma Düzlemi) */}
                        <line x1={L1} y1={-(dNom * 0.8)} x2={L1} y2={dNom * 0.8} stroke="var(--ok, #10b981)" strokeWidth={gaugeFs * 0.14} />
                        <text x={L1} y={-(dNom * 0.85)} fill="var(--ok, #10b981)" fontSize={gaugeFs * 0.9} textAnchor="middle" fontWeight="800">L₁ ({t12(language, 'Gauge Plane / Hand-Tight', 'Mastar Düzlemi / Elle Sıkma')})</text>

                        {/* L2 Wrench Makeup Plane (Anahtar ile Sıkma) */}
                        <line x1={L2} y1={-(dNom * 0.8)} x2={L2} y2={dNom * 0.8} stroke="var(--warn, #f59e0b)" strokeWidth={gaugeFs * 0.1} strokeDasharray="3 2" />
                        <text x={L2} y={-(dNom * 0.85)} fill="var(--warn, #f59e0b)" fontSize={gaugeFs * 0.85} textAnchor="middle" fontWeight="800">L₂ ({t12(language, 'Wrench Makeup', 'Anahtar Sıkma')})</text>

                        {/* Cone Slope Callout (1:16) */}
                        <g>
                            <line x1={L1 * 0.5} y1={-(e1 / 2 + 3)} x2={L2 * 0.9} y2={-(e2 / 2 + 3)} stroke="var(--cyan, #38bdf8)" strokeWidth={gaugeFs * 0.08} />
                            <text x={(L1 + L2) / 2} y={-(e2 / 2 + 5)} fill="var(--cyan, #38bdf8)" fontSize={gaugeFs * 0.9} textAnchor="middle" fontWeight="800">
                                {t12(language, 'Taper Slope 1:16 (1°47\')', 'Konik Eğim 1:16 (1°47\')')}
                            </text>
                        </g>

                        {/* Dimension: L1 Length */}
                        <DimH uid={`${uid}g`} fs={gaugeFs} x1={0} x2={L1} y={dNom * 0.65} label={`L₁ = ${L1.toFixed(2)} mm`} />
                        <DimH uid={`${uid}g`} fs={gaugeFs} x1={0} x2={L2} y={dNom * 0.82} label={`L₂ = ${L2.toFixed(2)} mm`} />

                        <text x={gaugeVbX + 5} y={gaugeVbY + gaugeFs * 1.5} fill="var(--alu-dim, #94a3b8)" fontSize={gaugeFs * 0.85}>
                            ASME B1.20.1 / ISO 7-1 {t12(language, 'Taper Pipe Thread Gauge Planes (Hand-Tight ~4.5 Turns + Wrench ~3 Turns)', 'Konik Boru Mastar Düzlemleri (Elle Sıkma ~4.5 Tur + Anahtar ~3 Tur)')}
                        </text>
                    </svg>
                )}
            </div>
        </div>
    );
};
