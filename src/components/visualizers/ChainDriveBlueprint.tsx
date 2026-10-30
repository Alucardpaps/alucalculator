'use client';

import React, { useMemo, useState } from 'react';
import {
    DimLine,
    FrameDefs,
    LegendPanel,
    openDriveLayout,
    openDrivePath,
    sprocketOutlinePath,
    useFrameIds,
} from './techframe-utils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useKineticSpin } from '@/hooks/useKineticSpin';
import { 
    downloadSprocketProductionSvg, 
    downloadSprocketProductionDxf 
} from '@/engines/math/sprocket-geometry-factory';
import { createDriveLoop } from '@/engines/math/drive-loop-engine';
import { ChainSectionView } from './ChainSectionView';
import { Download } from 'lucide-react';

export interface ChainDriveBlueprintProps {
    z1: number;
    z2: number;
    pitch: number;
    centerDist: number;
    rpm1?: number;
    ratio?: number;
    rpm2?: number;
    chainVelocity?: number;
    chainLength?: number;
    chainTension?: number;
    d1?: number;
    d2?: number;
    od1?: number;
    od2?: number;
    ratedPower?: number;
    powerUtilization?: number;
    C_even?: number;
    centrifugalN?: number;
    chainType?: string;
    chainSize?: string;
    showLegend?: boolean;
}

function pitchDiameter(p: number, z: number) {
    return p / Math.sin(Math.PI / z);
}

function getDogbonePath(len: number, pitchPx: number): string {
    const rLobe = pitchPx * 0.38;
    const waistH = pitchPx * 0.52;
    const halfW = waistH / 2;
    return `M 0 ${-rLobe.toFixed(2)} ` +
        `C ${(-rLobe * 0.55).toFixed(2)} ${(-rLobe).toFixed(2)}, ${(-rLobe).toFixed(2)} ${(-rLobe * 0.55).toFixed(2)}, ${(-rLobe).toFixed(2)} 0 ` +
        `C ${(-rLobe).toFixed(2)} ${(rLobe * 0.55).toFixed(2)}, ${(-rLobe * 0.55).toFixed(2)} ${(rLobe).toFixed(2)}, 0 ${(rLobe).toFixed(2)} ` +
        `C ${(len * 0.32).toFixed(2)} ${(halfW).toFixed(2)}, ${(len * 0.68).toFixed(2)} ${(halfW).toFixed(2)}, ${len.toFixed(2)} ${(rLobe).toFixed(2)} ` +
        `C ${(len + rLobe * 0.55).toFixed(2)} ${(rLobe).toFixed(2)}, ${(len + rLobe).toFixed(2)} ${(rLobe * 0.55).toFixed(2)}, ${(len + rLobe).toFixed(2)} 0 ` +
        `C ${(len + rLobe).toFixed(2)} ${(-rLobe * 0.55).toFixed(2)}, ${(len + rLobe).toFixed(2)} ${(-rLobe).toFixed(2)}, ${len.toFixed(2)} ${(-rLobe).toFixed(2)} ` +
        `C ${(len * 0.68).toFixed(2)} ${(-halfW).toFixed(2)}, ${(len * 0.32).toFixed(2)} ${(-halfW).toFixed(2)}, 0 ${(-rLobe).toFixed(2)} Z`;
}

function getChainDriveCopy(language: string) {
    return {
        title: t12(language, 'ROLLER CHAIN MECHANISM', 'RULO ZİNCİR MEKANİZMASI'),
        results: t12(language, 'CALCULATION RESULTS', 'HESAP SONUÇLARI'),
        driver: `${t12(language, 'DRIVER', 'DÖNDÜREN')} (z1)`,
        driven: `${t12(language, 'DRIVEN', 'DÖNDÜRÜLEN')} (z2)`,
        tight: t12(language, 'TIGHT STRAND', 'GERGİN KOL'),
        slack: t12(language, 'SLACK STRAND', 'GEVŞEK KOL'),
        dp: t12(language, 'Pitch diameter dp', 'Hatve dairesi çapı dp'),
        da: t12(language, 'Tip diameter Da', 'Diş üstü çapı Da'),
        ratio: t12(language, 'Speed ratio i', 'Çevrim oranı i'),
        n1: t12(language, 'Input speed n1', 'Giriş devri n1'),
        n2: t12(language, 'Output speed n2', 'Çıkış devri n2'),
        v: t12(language, 'Chain velocity v', 'Zincir hızı v'),
        L: t12(language, 'Chain length L', 'Zincir boyu L'),
        F: t12(language, 'Tension force F', 'Çekme kuvveti F'),
        Pr: 'ISO 10823 Pr',
        use: t12(language, 'Capacity utilization', 'Kapasite kullanımı'),
        Ceven: t12(language, 'Even-link C', 'Çift hatve C'),
        Fc: t12(language, 'Centrifugal Fc', 'Merkezkaç Fc'),
    };
}

export function ChainDriveBlueprint(props: ChainDriveBlueprintProps) {
    const {
        z1, z2, pitch, centerDist, rpm1 = 1450, ratio, rpm2, chainVelocity, chainLength,
        chainTension, d1: d1In, d2: d2In, od1: od1In, od2: od2In, ratedPower, powerUtilization, C_even, centrifugalN, chainType = 'roller-simplex', showLegend = true,
    } = props;
    const { language } = useI18nStore();
    const t = getChainDriveCopy(language);
    const ids = useFrameIds('chain');
    const [viewMode, setViewMode] = useState<'transmission' | 'section'>('transmission');

    const z1v = Math.max(11, z1);
    const z2v = Math.max(11, z2);
    // Derive ground truth pitch from d1In if available, preventing input desync
    const derivedPitchFromD1 = d1In != null && d1In > 0 ? d1In * Math.sin(Math.PI / z1v) : undefined;
    const p = Math.max(4, derivedPitchFromD1 ?? pitch);
    const C = Math.max(50, centerDist);
    const strands = chainType.includes('triplex') ? 3 : chainType.includes('duplex') ? 2 : 1;
    const isLeaf = chainType === 'leaf';

    const W = showLegend ? 790 : 1040;
    const H = 460;
    const rightReserve = showLegend ? 235 : 48;

    const layout = useMemo(() => {
        const d1mm = d1In ?? pitchDiameter(p, z1v);
        const d2mm = d2In ?? pitchDiameter(p, z2v);
        const od1mm = od1In ?? (d1mm + p * (1 - 1.6 / z1v));
        const od2mm = od2In ?? (d2mm + p * (1 - 1.6 / z2v));
        const base = openDriveLayout(d1mm, d2mm, C, W, H, rightReserve, 0.36, od1mm, od2mm);
        const srPitch1 = base.sr1;
        const srPitch2 = base.sr2;
        const srTip1 = (od1mm / 2) * base.scale;
        const srTip2 = (od2mm / 2) * base.scale;
        // Pitch in pixels MUST match base.sr1 and base.sr2
        const pitchPx = (d1mm * Math.sin(Math.PI / z1v)) * base.scale;
        return { ...base, d1: d1mm, d2: d2mm, od1: od1mm, od2: od2mm, srPitch1, srPitch2, srTip1, srTip2, pitchPx, pMm: p };
    }, [z1v, z2v, p, C, d1In, d2In, od1In, od2In, W, H, rightReserve]);

    const chainRun = openDrivePath(layout.cx1, layout.cy, layout.srPitch1, layout.cx2, layout.srPitch2);
    const iVal = ratio ?? z2v / z1v;
    const panelW = showLegend ? 520 : W - 24;
    const n1 = rpm1 || 1450;

    // Interactive kinetic spin engine
    const speedFactor = n1 > 0 ? Math.max(0.3, Math.min(2.0, n1 / 1000)) : 1.0;
    const kinetic = useKineticSpin({
        mode: 'circular',
        nominalSpeedDegPerSec: 50 * speedFactor,
        autoPlay: n1 > 0,
        dragSensitivity: 1.1,
        wheelSensitivity: 0.003,
    });

    const angle1 = kinetic.angle % 360;
    const angle2 = (kinetic.angle * (z1v / z2v)) % 360;
    const chainOffset = (kinetic.angle * Math.PI / 180) * layout.srPitch1;

    // Analytical closed-loop drive curve for real roller chain links
    const driveLoop = useMemo(
        () => createDriveLoop(layout.cx1, layout.cy, layout.srPitch1, layout.cx2, layout.cy, layout.srPitch2),
        [layout.cx1, layout.cy, layout.srPitch1, layout.cx2, layout.srPitch2],
    );

    const chainLinks = useMemo(() => {
        if (!driveLoop) return [];
        const totalLen = driveLoop.totalLength;
        const targetPitch = Math.max(7, layout.pitchPx);
        let numLinks = Math.max(8, Math.round(totalLen / targetPitch));
        if (numLinks % 2 !== 0) numLinks += 1;
        const actualPitch = totalLen / numLinks;

        const offset = ((chainOffset % totalLen) + totalLen) % totalLen;
        const list = [];

        for (let i = 0; i < numLinks; i++) {
            const s1 = (i * actualPitch + offset) % totalLen;
            const s2 = ((i + 1) * actualPitch + offset) % totalLen;
            const pt1 = driveLoop.getPointAt(s1);
            const pt2 = driveLoop.getPointAt(s2);
            const dx = pt2.x - pt1.x;
            const dy = pt2.y - pt1.y;
            const len = Math.hypot(dx, dy);
            const ang = (Math.atan2(dy, dx) * 180) / Math.PI;

            list.push({
                i,
                x1: pt1.x,
                y1: pt1.y,
                x2: pt2.x,
                y2: pt2.y,
                ang,
                len,
                isOuter: i % 2 === 0,
            });
        }
        return list;
    }, [driveLoop, layout.pitchPx, chainOffset]);

    const handleDownloadSvg = (target: 'z1' | 'z2') => {
        const isZ1 = target === 'z1';
        downloadSprocketProductionSvg({
            teeth: isZ1 ? z1v : z2v,
            pitch: layout.pMm,
            hasKeyway: true,
        }, `sprocket_${target}_z${isZ1 ? z1v : z2v}_p${layout.pMm.toFixed(2)}mm_1to1_CAM.svg`);
    };

    const handleDownloadDxf = (target: 'z1' | 'z2') => {
        const isZ1 = target === 'z1';
        downloadSprocketProductionDxf({
            teeth: isZ1 ? z1v : z2v,
            pitch: layout.pMm,
            hasKeyway: true,
        }, `sprocket_${target}_z${isZ1 ? z1v : z2v}_p${layout.pMm.toFixed(2)}mm_1to1.dxf`);
    };

    const handleDownloadSectionSvg = () => {
        const svgElement = document.getElementById('chain-section-svg');
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        const source = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svgElement);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chain_section_ISO606_p${layout.pMm.toFixed(2)}mm_${chainType}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            {...(viewMode === 'transmission' ? kinetic.containerProps : {})}
            className="w-full h-full relative select-none"
            title={t12(language, '🖱️ Rotate / drag chain mechanism • Use wheel to accelerate & reverse • Double-click to reset', '🖱️ Zincir mekanizmasını elinle çevir / ittir • Fare tekeriyle hızlandır & yön değiştir • Çift tıkla sıfırla')}
        >
            {/* Toolbar: 1:1 CAM Exports & View Mode Switcher */}
            <div
                className="absolute top-2 left-2 z-30 flex items-center gap-1.5 bg-[var(--bg-1)]/95 p-1 rounded-lg border border-[var(--line)] text-[10px] font-mono shadow-xl"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                data-no-drag="true"
            >
                {/* Mode Selector Tabs */}
                <div className="flex items-center bg-[var(--bg-2)] rounded p-0.5 mr-1 border border-[var(--line)]">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewMode('transmission');
                        }}
                        className={`px-2.5 py-0.5 rounded transition-all font-bold cursor-pointer ${
                            viewMode === 'transmission'
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow'
                                : 'text-[var(--cyan)]/70 hover:text-[var(--cyan)]'
                        }`}
                        title={t12(language, '2D Animated Mechanism View', '2D Hareketli Mekanizma Görünümü')}
                    >
                        ⚙️ {t12(language, '2D Mechanism', '2D Mekanizma')}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewMode('section');
                        }}
                        className={`px-2.5 py-0.5 rounded transition-all font-bold cursor-pointer ${
                            viewMode === 'section'
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow'
                                : 'text-purple-400/70 hover:text-purple-300'
                        }`}
                        title={t12(language, 'ISO 606 Roller Chain Cross-Section View (Section A-A)', 'ISO 606 Makaralı Zincir Enine Kesit Görünümü (Section A-A)')}
                    >
                        📐 {t12(language, 'Section (A-A)', 'Kesit (A-A)')}
                    </button>
                </div>

                {viewMode === 'section' ? (
                    <button
                        type="button"
                        onClick={handleDownloadSectionSvg}
                        className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                        title={t12(language, 'Download A-A Cross-Section View as SVG', 'A-A Kesit Görünümünü SVG olarak indir')}
                    >
                        <Download size={11} /> {t12(language, 'SVG Section (A-A)', 'SVG Kesit (A-A)')}
                    </button>
                ) : (
                    <>
                        <span className="text-[9px] text-[var(--cyan)] font-bold px-1 flex items-center gap-0.5">
                            <Download size={11} /> CAM
                        </span>
                        <button
                            type="button"
                            onClick={() => handleDownloadSvg('z1')}
                            className="px-2 py-0.5 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] hover:bg-[var(--cyan)]/25 transition-colors cursor-pointer"
                            title={t12(language, '1:1 Metric SVG (Driver Sprocket z1)', '1:1 Metrik SVG (Tahrik Dişli z1)')}
                        >
                            SVG z₁
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownloadSvg('z2')}
                            className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer"
                            title={t12(language, '1:1 Metric SVG (Driven Sprocket z2)', '1:1 Metrik SVG (Tahrik Edilen Dişli z2)')}
                        >
                            SVG z₂
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownloadDxf('z1')}
                            className="px-2 py-0.5 rounded bg-[var(--line)]/20 text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors cursor-pointer"
                            title={t12(language, 'AutoCAD DXF (Driver Sprocket z1)', 'AutoCAD DXF (z1)')}
                        >
                            DXF z₁
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownloadDxf('z2')}
                            className="px-2 py-0.5 rounded bg-[var(--line)]/20 text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors cursor-pointer"
                            title={t12(language, 'AutoCAD DXF (Driven Sprocket z2)', 'AutoCAD DXF (z2)')}
                        >
                            DXF z₂
                        </button>
                    </>
                )}
            </div>

            {viewMode === 'transmission' && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-1)] border border-[var(--line)] text-[9px] font-mono text-[var(--cyan)] pointer-events-none select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{Math.abs(kinetic.speedMultiplier).toFixed(1)}x {kinetic.direction === 1 ? 'CW' : 'CCW'}</span>
                </div>
            )}

            {/* SECTION A-A VIEW MODE */}
            {viewMode === 'section' ? (
                <ChainSectionView
                    pitch={layout.pMm}
                    chainType={chainType}
                    d1={layout.d1}
                    width={W}
                    height={H}
                />
            ) : (
                /* TRANSMISSION VIEW MODE */
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
                <FrameDefs ids={ids} />
                <style>{`
                    @keyframes slackPulse { 0%,100% { opacity:.35 } 50% { opacity:.85 } }
                    @media (prefers-reduced-motion: reduce) {
                        .slack-pulse { animation: none !important; }
                    }
                `}</style>
                <rect width={W} height={H} fill="var(--bg-2)" stroke="var(--line)" rx="8" />
                <rect width={W} height={H} fill={`url(#${ids.grid})`} />
                <text x={20} y={28} fontSize="13" fontWeight="700" fill="var(--cyan)" fontFamily="ui-monospace, monospace">{t.title}</text>
                <text x={20} y={44} fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">
                    {chainType.toUpperCase()} · ISO 606 · p = {p.toFixed(3)} mm · C = {C.toFixed(0)} mm
                    {chainLength != null ? ` · L = ${chainLength.toFixed(0)} mm` : ''}
                    {strands > 1 ? ` · ×${strands}` : ''}
                </text>
                <rect x={16} y={56} width={panelW} height={H - 72} rx={8} fill="var(--bg-1)" stroke="var(--line)" strokeWidth="1" />

                {/* Slack sag (top span) */}
                {chainRun && (
                    <path
                        className="slack-pulse"
                        d={`M ${layout.cx1 + 8} ${layout.cy - layout.srPitch1 * 0.15} Q ${(layout.cx1 + layout.cx2) / 2} ${layout.cy - layout.srPitch1 - 10} ${layout.cx2 - 8} ${layout.cy - layout.srPitch2 * 0.15}`}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1.2"
                        strokeDasharray="3 5"
                        style={{ animation: 'slackPulse 2.4s ease-in-out infinite' }}
                    />
                )}

                {/* Multi-strand Sprockets */}
                {([0, 1, 2] as const).filter((s) => s < strands).map((s) => {
                    const dy = (s - (strands - 1) / 2) * 5;
                    const rRoot2 = layout.srPitch2 * 0.75;
                    const hubR2 = layout.srPitch2 * 0.28;
                    return (
                        <g key={s} transform={`translate(0, ${dy})`} opacity={1 - s * 0.18}>
                            {/* Driver Sprocket */}
                            <g
                                className="sprocket-spin"
                                transform={`rotate(${angle1.toFixed(2)} ${layout.cx1} ${layout.cy})`}
                            >
                                {isLeaf ? (
                                    <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1} fill={`url(#${ids.metal}-cyan)`} stroke="var(--cyan)" strokeWidth="1.4" filter={`url(#${ids.glow}-shadow)`} />
                                ) : (
                                    <path
                                        d={sprocketOutlinePath(layout.cx1, layout.cy, z1v, layout.pitchPx)}
                                        fill={`url(#${ids.metal}-cyan)`}
                                        stroke="var(--cyan)"
                                        strokeWidth="1.2"
                                        strokeLinejoin="round"
                                        filter={`url(#${ids.glow}-shadow)`}
                                    />
                                )}
                                <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1 * 0.82} fill="none" stroke="var(--cyan)" strokeWidth="0.8" opacity="0.5" />
                                <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1 * 0.45} fill={`url(#${ids.metal})`} stroke="var(--cyan)" strokeWidth="1.2" />
                                <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1 * 0.28} fill="var(--bg-2)" stroke="#475569" strokeWidth="1.2" />
                                <rect x={layout.cx1 - 2} y={layout.cy - layout.srPitch1 * 0.28 - 4} width="4" height="4" fill="var(--bg-2)" stroke="#475569" strokeWidth="1" />
                                <circle cx={layout.cx1} cy={layout.cy} r={2} fill="var(--cyan)" />
                            </g>

                            {/* Driven Sprocket */}
                            <g
                                className="sprocket-spin"
                                transform={`rotate(${angle2.toFixed(2)} ${layout.cx2} ${layout.cy})`}
                            >
                                {isLeaf ? (
                                    <circle cx={layout.cx2} cy={layout.cy} r={layout.srPitch2} fill={`url(#${ids.metal})`} stroke="#8b5cf6" strokeWidth="1.4" filter={`url(#${ids.glow}-shadow)`} />
                                ) : (
                                    <path
                                        d={sprocketOutlinePath(layout.cx2, layout.cy, z2v, layout.pitchPx, Math.PI / z2v)}
                                        fill={`url(#${ids.metal})`}
                                        stroke="#8b5cf6"
                                        strokeWidth="1.2"
                                        strokeLinejoin="round"
                                        filter={`url(#${ids.glow}-shadow)`}
                                    />
                                )}
                                 <circle cx={layout.cx2} cy={layout.cy} r={layout.srPitch2 * 0.88} fill="none" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.4" />
                                 {/* Recessed Sprocket Web - Solid Machined Metal */}
                                 <circle
                                     cx={layout.cx2}
                                     cy={layout.cy}
                                     r={rRoot2 * 0.88}
                                     fill={`url(#${ids.metal}-dark)`}
                                     stroke="#8b5cf6"
                                     strokeWidth="1.2"
                                     opacity="0.95"
                                 />
                                 <circle cx={layout.cx2} cy={layout.cy} r={rRoot2 * 0.88} fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" />
                                 <circle cx={layout.cx2} cy={layout.cy} r={rRoot2 * 0.88} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
                                 
                                 {/* Lightening holes for large sprocket */}
                                 {z2v >= 24 && [0, 60, 120, 180, 240, 300].map((deg) => {
                                     const rad = (deg * Math.PI) / 180;
                                     const hDist = (rRoot2 * 0.88 + hubR2 * 1.3) / 2;
                                     const hRadius = Math.max(4, (rRoot2 * 0.88 - hubR2 * 1.3) * 0.28);
                                     return (
                                         <g key={deg}>
                                             {/* Through-hole bore to dark background */}
                                             <circle
                                                 cx={layout.cx2 + Math.cos(rad) * hDist}
                                                 cy={layout.cy + Math.sin(rad) * hDist}
                                                 r={hRadius}
                                                 fill="var(--bg-2)"
                                                 stroke="#8b5cf6"
                                                 strokeWidth="1.2"
                                             />
                                             {/* Inner bore 3D depth shadow */}
                                             <circle
                                                 cx={layout.cx2 + Math.cos(rad) * hDist}
                                                 cy={layout.cy + Math.sin(rad) * hDist}
                                                 r={hRadius}
                                                 fill="none"
                                                 stroke="rgba(0,0,0,0.8)"
                                                 strokeWidth="2"
                                             />
                                             <circle
                                                 cx={layout.cx2 + Math.cos(rad) * hDist}
                                                 cy={layout.cy + Math.sin(rad) * hDist}
                                                 r={hRadius - 1}
                                                 fill="none"
                                                 stroke="rgba(255,255,255,0.14)"
                                                 strokeWidth="0.6"
                                             />
                                         </g>
                                     );
                                 })}

                                 {/* Hub Boss & Bored Center */}
                                 <circle cx={layout.cx2} cy={layout.cy} r={hubR2 * 1.3} fill={`url(#${ids.metal})`} stroke="#8b5cf6" strokeWidth="1.4" />
                                 <circle cx={layout.cx2} cy={layout.cy} r={hubR2 * 1.3} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                                 <circle cx={layout.cx2} cy={layout.cy} r={hubR2 * 0.75} fill="var(--bg-2)" stroke="#475569" strokeWidth="1.2" />
                                 <rect x={layout.cx2 - 2} y={layout.cy - hubR2 * 0.75 - 4} width="4" height="4" fill="var(--bg-2)" stroke="#475569" strokeWidth="1" />
                                 <circle cx={layout.cx2} cy={layout.cy} r={2} fill="#8b5cf6" />
                            </g>
                        </g>
                    );
                })}

                {/* AUTHENTIC ISO 606 ROLLER CHAIN LINKS */}
                {chainLinks.length > 0 && (
                    <g className="chain-assembly">
                        {/* 1. Rollers (Makaralar) at each pin position */}
                        {chainLinks.map((link) => (
                            <g key={`roller-${link.i}`} transform={`translate(${link.x1.toFixed(2)}, ${link.y1.toFixed(2)})`}>
                                <circle
                                    r={Math.max(1.8, layout.pitchPx * 0.28)}
                                    fill="#1e293b"
                                    stroke="#fbbf24"
                                    strokeWidth="1.1"
                                />
                                <circle
                                    r={Math.max(1.0, layout.pitchPx * 0.16)}
                                    fill="#0a101f"
                                    stroke="#64748b"
                                    strokeWidth="0.8"
                                />
                            </g>
                        ))}

                        {/* 2. Inner Link Plates (İç Baklalar - odd indices, drawn behind) */}
                        {chainLinks.filter((l) => !l.isOuter).map((link) => (
                            <g
                                key={`inner-${link.i}`}
                                transform={`translate(${link.x1.toFixed(2)}, ${link.y1.toFixed(2)}) rotate(${link.ang.toFixed(2)})`}
                            >
                                <path
                                    d={getDogbonePath(link.len, layout.pitchPx)}
                                    fill="#0b1329"
                                    stroke="#64748b"
                                    strokeWidth="1.1"
                                />
                            </g>
                        ))}

                        {/* 3. Outer Link Plates (Dış Baklalar - even indices, drawn on top) */}
                        {chainLinks.filter((l) => l.isOuter).map((link) => (
                            <g
                                key={`outer-${link.i}`}
                                transform={`translate(${link.x1.toFixed(2)}, ${link.y1.toFixed(2)}) rotate(${link.ang.toFixed(2)})`}
                            >
                                <path
                                    d={getDogbonePath(link.len, layout.pitchPx)}
                                    fill="#082f49"
                                    stroke="var(--cyan)"
                                    strokeWidth="1.3"
                                    filter={`url(#${ids.glow}-shadow)`}
                                />
                                {/* Pin Head Rivets on Outer Plate */}
                                <circle cx={0} cy={0} r={Math.max(1.1, layout.pitchPx * 0.14)} fill="#0284c7" stroke="#e0f2fe" strokeWidth="0.8" />
                                <circle cx={0} cy={0} r={0.8} fill="var(--ink)" />
                                <circle cx={link.len.toFixed(2)} cy={0} r={Math.max(1.1, layout.pitchPx * 0.14)} fill="#0284c7" stroke="#e0f2fe" strokeWidth="0.8" />
                                <circle cx={link.len.toFixed(2)} cy={0} r={0.8} fill="var(--ink)" />
                            </g>
                        ))}
                    </g>
                )}

                <text x={layout.cx1} y={layout.cy + layout.srTip1 + 16} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">{t.driver}</text>
                <text x={layout.cx1} y={layout.cy - layout.srTip1 - 14} textAnchor="middle" fontSize="10" fill="var(--cyan)" fontWeight="700" fontFamily="ui-monospace, monospace">z1 = {z1v}</text>
                <text x={layout.cx1} y={layout.cy - layout.srTip1 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {layout.d1.toFixed(1)} mm</text>
                <text x={layout.cx1} y={layout.cy - layout.srTip1 - 38} textAnchor="middle" fontSize="8" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace">Da = {layout.od1.toFixed(1)} mm</text>

                <text x={layout.cx2} y={layout.cy + layout.srTip2 + 16} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">{t.driven}</text>
                <text x={layout.cx2} y={layout.cy - layout.srTip2 - 14} textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="700" fontFamily="ui-monospace, monospace">z2 = {z2v}</text>
                <text x={layout.cx2} y={layout.cy - layout.srTip2 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {layout.d2.toFixed(1)} mm</text>
                <text x={layout.cx2} y={layout.cy - layout.srTip2 - 38} textAnchor="middle" fontSize="8" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace">Da = {layout.od2.toFixed(1)} mm</text>

                <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy + Math.max(layout.srTip1, layout.srTip2) + 18} textAnchor="middle" fontSize="8" fill="#10b981" fontFamily="ui-monospace, monospace" fontWeight="700">{t.tight}</text>
                <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy - Math.max(layout.srTip1, layout.srTip2) - 8} textAnchor="middle" fontSize="8" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace">{t.slack}</text>

                <DimLine x1={layout.cx1} y1={layout.cy + Math.max(layout.srTip1, layout.srTip2) + 38} x2={layout.cx2} y2={layout.cy + Math.max(layout.srTip1, layout.srTip2) + 38} label={`C = ${layout.Cmm.toFixed(0)} mm`} />

                {showLegend && (
                    <LegendPanel x={556} y={56} title={t.results} rows={[
                        { label: t.dp, value: `${layout.d1.toFixed(2)} mm`, highlight: true },
                        { label: t.da, value: `${layout.od1.toFixed(2)} mm` },
                        { label: t.ratio, value: iVal.toFixed(3) },
                        { label: t.n1, value: `${n1.toFixed(0)} rpm` },
                        ...(rpm2 != null ? [{ label: t.n2, value: `${rpm2.toFixed(0)} rpm` }] : []),
                        ...(chainVelocity != null ? [{ label: t.v, value: `${chainVelocity.toFixed(2)} m/s`, highlight: true }] : []),
                        ...(chainLength != null ? [{ label: t.L, value: `${chainLength.toFixed(0)} mm` }] : []),
                        ...(chainTension != null ? [{ label: t.F, value: `${chainTension.toFixed(0)} N` }] : []),
                        ...(ratedPower != null ? [{ label: t.Pr, value: `${ratedPower.toFixed(2)} kW`, highlight: true }] : []),
                        ...(powerUtilization != null ? [{ label: t.use, value: `${powerUtilization.toFixed(0)} %` }] : []),
                        ...(C_even != null ? [{ label: t.Ceven, value: `${C_even.toFixed(1)} mm` }] : []),
                        ...(centrifugalN != null ? [{ label: t.Fc, value: `${centrifugalN.toFixed(1)} N` }] : []),
                    ]} />
                )}
            </svg>
            )}
        </div>
    );
}

export default ChainDriveBlueprint;
