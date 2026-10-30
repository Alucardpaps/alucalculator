'use client';

import React, { useMemo, useState } from 'react';
import { DimLine, FrameDefs, LegendPanel, openDriveLayout, openDrivePath, toothedWheelPath, useFrameIds } from './techframe-utils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useKineticSpin } from '@/hooks/useKineticSpin';
import { 
    downloadPulleyProductionSvg, 
    downloadPulleyProductionDxf 
} from '@/engines/math/pulley-geometry-factory';
import { createDriveLoop } from '@/engines/math/drive-loop-engine';
import { BeltSectionView } from './BeltSectionView';
import { Download } from 'lucide-react';

export interface BeltDriveBlueprintProps {
    d1: number;
    d2: number;
    od1?: number;
    od2?: number;
    z1?: number;
    z2?: number;
    pitch?: number;
    centerDist: number;
    centerDistTarget?: number;
    beltType?: string;
    rpm1?: number;
    rpm2?: number;
    beltVelocity?: number;
    beltLength?: number;
    arcOfContact?: number;
    T1?: number;
    T2?: number;
    Tc?: number;
    shaftLoad?: number;
    flexHz?: number;
    teethInMesh?: number;
    beltWidth?: number;
    beltHeight?: number;
    profileLabel?: string;
    showLegend?: boolean;
}

function getBeltDriveCopy(language: string) {
    return {
        results: t12(language, 'CALCULATION RESULTS', 'HESAP SONUÇLARI'),
        driver: t12(language, 'DRIVER', 'DÖNDÜREN'),
        driven: t12(language, 'DRIVEN', 'DÖNDÜRÜLEN'),
        tight: t12(language, 'TIGHT STRAND', 'GERGİN KOL'),
        slack: t12(language, 'SLACK STRAND', 'GEVŞEK KOL'),
        target: t12(language, 'target', 'hedef'),
        n1: t12(language, 'Input speed n1', 'Giriş devri n1'),
        n2: t12(language, 'Output speed n2', 'Çıkış devri n2'),
        v: t12(language, 'Belt speed v', 'Kayış hızı v'),
        L: t12(language, 'Pitch length L', 'Hatve boyu L'),
        wrap: t12(language, 'Contact angle θ1', 'Sarım açısı θ1'),
        t1: t12(language, 'Tight tension F1', 'Gergin kol kuvveti F1'),
        t2: t12(language, 'Slack tension F2', 'Gevşek kol kuvveti F2'),
        tc: t12(language, 'Centrifugal Tc', 'Merkezkaç Tc'),
        fs: t12(language, 'Shaft load Fs', 'Mil yükü Fs'),
        flex: t12(language, 'Flex frequency', 'Esneme frekansı'),
        zim: t12(language, 'Teeth in mesh', 'Kavrama dişi'),
    };
}

function PulleyGraphic({
    cx, cy, rPitch, rBody, z, stroke, isTiming, isV, isPoly, grooveScale, ids, isDriven, angle = 0,
}: {
    cx: number; cy: number; rPitch: number; rBody: number; z?: number; stroke: string;
    isTiming: boolean; isV: boolean; isPoly: boolean; grooveScale: number;
    ids: ReturnType<typeof useFrameIds>; isDriven: boolean; angle?: number;
}) {
    const flange = rPitch * 1.15;
    const hubR = Math.max(5, rPitch * 0.28);
    const hasHoles = isDriven ? (rPitch > 65 && (!z || z >= 32)) : (rPitch > 100 && (!z || z >= 60));

    if (isTiming && z != null) {
        const rim = rPitch * 0.96;
        return (
            <g transform={`rotate(${angle.toFixed(2)} ${cx} ${cy})`}>
                {/* Outer Flange */}
                <circle cx={cx} cy={cy} r={flange} fill="none" stroke={stroke} strokeWidth="1.8" opacity="0.65" />
                
                {/* ISO 13050 Toothed Pulley Contour */}
                <path
                    d={toothedWheelPath(cx, cy, rPitch, rBody, z)}
                    fill={isDriven ? `url(#${ids.metal})` : `url(#${ids.metal}-cyan)`}
                    stroke={stroke}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    filter={`url(#${ids.glow}-shadow)`}
                />

                {/* Recessed Rim Web - Machined Metal Web */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={rim * 0.82}
                    fill={isDriven ? `url(#${ids.metal}-dark)` : `url(#${ids.metal}-cyan-dark)`}
                    stroke={stroke}
                    strokeWidth="1.2"
                    opacity="0.95"
                />
                <circle cx={cx} cy={cy} r={rim * 0.82} fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" />
                <circle cx={cx} cy={cy} r={rim * 0.82} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

                {/* Lightening Through-Holes */}
                {hasHoles && [0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const hDist = (rim * 0.82 + hubR * 1.4) / 2;
                    const hRadius = Math.max(4, (rim * 0.82 - hubR * 1.4) * 0.28);
                    return (
                        <g key={deg}>
                            {/* Through-hole bore to dark background */}
                            <circle
                                cx={cx + Math.cos(rad) * hDist}
                                cy={cy + Math.sin(rad) * hDist}
                                r={hRadius}
                                fill="var(--bg-2)"
                                stroke={stroke}
                                strokeWidth="1.2"
                            />
                            {/* Inner bore 3D depth shadow */}
                            <circle
                                cx={cx + Math.cos(rad) * hDist}
                                cy={cy + Math.sin(rad) * hDist}
                                r={hRadius}
                                fill="none"
                                stroke="rgba(0,0,0,0.8)"
                                strokeWidth="2"
                            />
                            <circle
                                cx={cx + Math.cos(rad) * hDist}
                                cy={cy + Math.sin(rad) * hDist}
                                r={hRadius - 1}
                                fill="none"
                                stroke="rgba(255,255,255,0.14)"
                                strokeWidth="0.6"
                            />
                        </g>
                    );
                })}

                {!hasHoles && [0, 120, 240].map((deg) => {
                    const a = (deg * Math.PI) / 180;
                    return <line key={deg} x1={cx + Math.cos(a) * hubR} y1={cy + Math.sin(a) * hubR} x2={cx + Math.cos(a) * rim * 0.82} y2={cy + Math.sin(a) * rim * 0.82} stroke={stroke} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />;
                })}

                {/* Hub Boss & Bored Center */}
                <circle cx={cx} cy={cy} r={hubR * 1.35} fill={isDriven ? `url(#${ids.metal})` : `url(#${ids.metal}-cyan)`} stroke={stroke} strokeWidth="1.4" />
                <circle cx={cx} cy={cy} r={hubR * 1.35} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                <circle cx={cx} cy={cy} r={hubR} fill="var(--bg-2)" stroke="#475569" strokeWidth="1.2" />
                <rect x={cx - hubR * 0.25} y={cy - hubR * 1.25} width={hubR * 0.5} height={hubR * 0.5} fill="var(--bg-2)" stroke="#475569" strokeWidth="0.8" />
                <circle cx={cx} cy={cy} r={2} fill={stroke} />
            </g>
        );
    }
    return (
        <g transform={`rotate(${angle.toFixed(2)} ${cx} ${cy})`}>
            {/* Outer Flange */}
            <circle cx={cx} cy={cy} r={flange} fill="none" stroke={stroke} strokeWidth="1.6" opacity="0.55" />
            
            {/* Solid Pulley Body */}
            <circle cx={cx} cy={cy} r={rPitch} fill={isDriven ? `url(#${ids.metal})` : `url(#${ids.metal}-cyan)`} stroke={stroke} strokeWidth="1.4" filter={`url(#${ids.glow}-shadow)`} />
            
            {isV && (
                <>
                    <circle cx={cx} cy={cy} r={rPitch * grooveScale} fill="none" stroke="#f59e0b" strokeWidth="2.4" opacity="0.85" />
                    <circle cx={cx} cy={cy} r={rPitch * (grooveScale - 0.06)} fill="none" stroke="#78350f" strokeWidth="1.2" opacity="0.75" />
                </>
            )}
            {isPoly && [0.52, 0.58, 0.64, 0.7].map((g) => (
                <circle key={g} cx={cx} cy={cy} r={rPitch * g} fill="none" stroke="#fbbf24" strokeWidth="0.8" opacity="0.6" />
            ))}

            {/* Inner Recessed Web - Solid Machined Metal */}
            <circle
                cx={cx}
                cy={cy}
                r={rPitch * 0.72}
                fill={isDriven ? `url(#${ids.metal}-dark)` : `url(#${ids.metal}-cyan-dark)`}
                stroke={stroke}
                strokeWidth="1.2"
                opacity="0.95"
            />
            <circle cx={cx} cy={cy} r={rPitch * 0.72} fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" />
            <circle cx={cx} cy={cy} r={rPitch * 0.72} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

            {/* Lightening holes for large pulley */}
            {hasHoles && [0, 60, 120, 180, 240, 300].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const hDist = (rPitch * 0.72 + hubR * 1.4) / 2;
                const hRadius = Math.max(4, (rPitch * 0.72 - hubR * 1.4) * 0.28);
                return (
                    <g key={deg}>
                        <circle
                            cx={cx + Math.cos(rad) * hDist}
                            cy={cy + Math.sin(rad) * hDist}
                            r={hRadius}
                            fill="var(--bg-2)"
                            stroke={stroke}
                            strokeWidth="1.2"
                        />
                        <circle
                            cx={cx + Math.cos(rad) * hDist}
                            cy={cy + Math.sin(rad) * hDist}
                            r={hRadius}
                            fill="none"
                            stroke="rgba(0,0,0,0.75)"
                            strokeWidth="2"
                        />
                        <circle
                            cx={cx + Math.cos(rad) * hDist}
                            cy={cy + Math.sin(rad) * hDist}
                            r={hRadius - 1}
                            fill="none"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="0.6"
                        />
                    </g>
                );
            })}

            {!hasHoles && [0, 120, 240].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return <line key={deg} x1={cx + Math.cos(a) * hubR} y1={cy + Math.sin(a) * hubR} x2={cx + Math.cos(a) * rPitch * 0.72} y2={cy + Math.sin(a) * rPitch * 0.72} stroke={stroke} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />;
            })}

            {/* Hub Boss & Bored Center */}
            <circle cx={cx} cy={cy} r={hubR * 1.35} fill={isDriven ? `url(#${ids.metal})` : `url(#${ids.metal}-cyan)`} stroke={stroke} strokeWidth="1.4" />
            <circle cx={cx} cy={cy} r={hubR * 1.35} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
            <circle cx={cx} cy={cy} r={hubR} fill="var(--bg-2)" stroke="#475569" strokeWidth="1.2" />
            <rect x={cx - hubR * 0.25} y={cy - hubR * 1.25} width={hubR * 0.5} height={hubR * 0.5} fill="var(--bg-2)" stroke="#475569" strokeWidth="0.8" />
            <circle cx={cx} cy={cy} r={2} fill={stroke} />
        </g>
    );
}

export function BeltDriveBlueprint(props: BeltDriveBlueprintProps) {
    const {
        d1, d2, od1, od2, z1, z2, pitch = 5, centerDist, centerDistTarget, beltType = 'classical-v', rpm1 = 1450, rpm2,
        beltVelocity, beltLength, arcOfContact, T1, T2, Tc, shaftLoad, flexHz, teethInMesh, beltWidth, beltHeight, profileLabel, showLegend = true,
    } = props;
    const { language } = useI18nStore();
    const t = getBeltDriveCopy(language);
    const ids = useFrameIds('belt');
    const [viewMode, setViewMode] = useState<'transmission' | 'section'>('transmission');

    const isTiming = beltType === 'timing';
    const isV = beltType.includes('v') && beltType !== 'poly-v';
    const isPoly = beltType === 'poly-v';
    const isCogged = beltType === 'cogged-v';
    const D1 = Math.max(10, d1);
    const D2 = Math.max(10, d2);
    const Do1 = od1 != null && od1 > 0 ? od1 : D1 * 0.94;
    const Do2 = od2 != null && od2 > 0 ? od2 : D2 * 0.94;
    const C = Math.max(centerDist, (D1 + D2) / 2);

    const W = showLegend ? 790 : 1040;
    const H = 460;
    const rightReserve = showLegend ? 235 : 48;

    const layout = useMemo(
        () => openDriveLayout(
            D1,
            D2,
            C,
            W,
            H,
            rightReserve,
            0.36,
            isTiming ? D1 * 1.16 : Math.max(Do1, D1 * 1.05),
            isTiming ? D2 * 1.16 : Math.max(Do2, D2 * 1.05),
        ),
        [D1, D2, C, W, H, rightReserve, isTiming, Do1, Do2],
    );

    const rBody1 = (Do1 / 2) * layout.scale;
    const rBody2 = (Do2 / 2) * layout.scale;
    const beltRun = openDrivePath(layout.cx1, layout.cy, layout.sr1, layout.cx2, layout.sr2);
    const thetaDeg = arcOfContact ?? (beltRun ? (beltRun.thetaRad * 180) / Math.PI : 0);
    const panelW = showLegend ? 520 : W - 24;
    const stdLabel = isTiming ? 'ISO 13050' : 'ISO 5291';
    const cNote = isTiming && centerDistTarget != null && Math.abs(C - centerDistTarget) > 0.5
        ? ` · C = ${C.toFixed(1)} mm (${t.target} ${centerDistTarget.toFixed(0)})`
        : ` · C = ${C.toFixed(0)} mm`;

    // Interactive kinetic spin engine
    const speedFactor = rpm1 > 0 ? Math.max(0.3, Math.min(2.0, rpm1 / 1000)) : 1.0;
    const kinetic = useKineticSpin({
        mode: 'circular',
        nominalSpeedDegPerSec: 50 * speedFactor,
        autoPlay: rpm1 > 0,
        dragSensitivity: 1.1,
        wheelSensitivity: 0.003,
    });

    const angle1 = kinetic.angle % 360;
    const angle2 = (kinetic.angle * (D1 / D2)) % 360;
    const beltOffset = (kinetic.angle * Math.PI / 180) * layout.sr1;

    // Analytical closed-loop drive loop
    const driveLoop = useMemo(
        () => createDriveLoop(layout.cx1, layout.cy, layout.sr1, layout.cx2, layout.cy, layout.sr2),
        [layout.cx1, layout.cy, layout.sr1, layout.cx2, layout.sr2],
    );

    // Continuous closed ribbon path for belt body
    const beltRibbonPath = useMemo(() => {
        if (!driveLoop) return '';
        if (isTiming) {
            // Timing belt backing ribbon outside pitch line
            return driveLoop.getRibbonPath(3.6, -0.4, 120);
        } else {
            // V-belt thick industrial ribbon
            const th = isV ? 5.2 : 3.8;
            return driveLoop.getRibbonPath(th, -th, 120);
        }
    }, [driveLoop, isTiming, isV]);

    // Molded Timing Belt Teeth or Cogged V-Belt Notches
    const beltTeethList = useMemo(() => {
        if (!driveLoop) return [];
        const totalLen = driveLoop.totalLength;

        if (isTiming) {
            // Compute pitch spacing in pixels
            const targetPitchPx = z1 != null && z1 > 0
                ? (Math.PI * 2 * layout.sr1) / z1
                : Math.max(6, pitch * layout.scale);
            const numTeeth = Math.max(12, Math.round(totalLen / targetPitchPx));
            const actualPitch = totalLen / numTeeth;
            const toothWidth = actualPitch * 0.52;
            const toothDepth = 2.4;

            const list = [];
            const offset = ((beltOffset % totalLen) + totalLen) % totalLen;

            for (let i = 0; i < numTeeth; i++) {
                const s = (i * actualPitch + offset) % totalLen;
                const pt = driveLoop.getPointAt(s);

                // Tangent vector
                const tx = Math.cos(pt.ang);
                const ty = Math.sin(pt.ang);
                // Inward normal vector (into pulleys / inside of loop)
                const inX = -pt.nx;
                const inY = -pt.ny;

                // Tooth base left & right points
                const bLx = pt.x - tx * (toothWidth / 2);
                const bLy = pt.y - ty * (toothWidth / 2);
                const bRx = pt.x + tx * (toothWidth / 2);
                const bRy = pt.y + ty * (toothWidth / 2);

                // Tooth crest tip
                const tipX = pt.x + inX * toothDepth;
                const tipY = pt.y + inY * toothDepth;

                // HTD curvilinear tooth path
                const path = `M ${bLx.toFixed(2)} ${bLy.toFixed(2)} ` +
                    `Q ${bLx + inX * toothDepth * 0.5} ${bLy + inY * toothDepth * 0.5} ${tipX.toFixed(2)} ${tipY.toFixed(2)} ` +
                    `Q ${bRx + inX * toothDepth * 0.5} ${bRy + inY * toothDepth * 0.5} ${bRx.toFixed(2)} ${bRy.toFixed(2)} Z`;

                list.push({ i, path, tipX, tipY });
            }
            return list;
        } else if (isCogged) {
            // Transverse cooling cogs on inner underside
            const cogSpacing = 11.0;
            const numCogs = Math.max(8, Math.round(totalLen / cogSpacing));
            const actualPitch = totalLen / numCogs;
            const cogW = actualPitch * 0.45;
            const cogH = 2.8;

            const list = [];
            const offset = ((beltOffset % totalLen) + totalLen) % totalLen;

            for (let i = 0; i < numCogs; i++) {
                const s = (i * actualPitch + offset) % totalLen;
                const pt = driveLoop.getPointAt(s);
                const tx = Math.cos(pt.ang);
                const ty = Math.sin(pt.ang);
                const inX = -pt.nx;
                const inY = -pt.ny;

                // Position on inner belt surface
                const baseCenterX = pt.x + inX * 3.8;
                const baseCenterY = pt.y + inY * 3.8;

                const bLx = baseCenterX - tx * (cogW / 2);
                const bLy = baseCenterY - ty * (cogW / 2);
                const bRx = baseCenterX + tx * (cogW / 2);
                const bRy = baseCenterY + ty * (cogW / 2);

                const tipX = baseCenterX + inX * cogH;
                const tipY = baseCenterY + inY * cogH;

                const path = `M ${bLx.toFixed(2)} ${bLy.toFixed(2)} ` +
                    `Q ${tipX.toFixed(2)} ${tipY.toFixed(2)} ${bRx.toFixed(2)} ${bRy.toFixed(2)} Z`;

                list.push({ i, path, tipX, tipY });
            }
            return list;
        }

        return [];
    }, [driveLoop, isTiming, isCogged, z1, layout.sr1, layout.scale, pitch, beltOffset]);

    const handleDownloadSvg = (target: 'd1' | 'd2') => {
        const isD1 = target === 'd1';
        const z = isD1 ? z1 : z2;
        const dia = isD1 ? D1 : D2;
        const od = isD1 ? Do1 : Do2;
        downloadPulleyProductionSvg({
            type: isTiming ? 'timing-htd' : 'v-belt',
            teeth: isTiming ? z : undefined,
            pitch: isTiming ? pitch : undefined,
            datumDiameter: !isTiming ? dia : undefined,
            outsideDiameter: od,
            hasFlange: isTiming,
            hasKeyway: true,
        }, `pulley_${target}_${isTiming ? `z${z}_p${pitch}mm` : `d${dia.toFixed(0)}mm`}_1to1_CAM.svg`);
    };

    const handleDownloadDxf = (target: 'd1' | 'd2') => {
        const isD1 = target === 'd1';
        const z = isD1 ? z1 : z2;
        const dia = isD1 ? D1 : D2;
        const od = isD1 ? Do1 : Do2;
        downloadPulleyProductionDxf({
            type: isTiming ? 'timing-htd' : 'v-belt',
            teeth: isTiming ? z : undefined,
            pitch: isTiming ? pitch : undefined,
            datumDiameter: !isTiming ? dia : undefined,
            outsideDiameter: od,
            hasFlange: isTiming,
            hasKeyway: true,
        }, `pulley_${target}_${isTiming ? `z${z}_p${pitch}mm` : `d${dia.toFixed(0)}mm`}_1to1.dxf`);
    };

    const handleDownloadSectionSvg = () => {
        const svgElement = document.getElementById('belt-section-svg');
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        const source = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svgElement);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `belt_section_${beltType}_${isTiming ? `p${pitch.toFixed(1)}mm` : `b${(beltWidth ?? 17).toFixed(1)}mm`}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            {...(viewMode === 'transmission' ? kinetic.containerProps : {})}
            className="w-full h-full relative select-none"
            title={t12(language, '🖱️ Rotate / drag belt mechanism • Use wheel to accelerate & reverse • Double-click to reset', '🖱️ Kayış mekanizmasını elinle çevir / ittir • Fare tekeriyle hızlandır & yön değiştir • Çift tıkla sıfırla')}
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
                                : 'text-[var(--warn)]/70 hover:text-[var(--warn)]'
                        }`}
                        title={t12(language, '2D Animated Belt Mechanism View', '2D Hareketli Kayış Mekanizması Görünümü')}
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
                                : 'text-[var(--cyan)]/70 hover:text-[var(--cyan)]'
                        }`}
                        title={t12(language, 'Belt Cross-Section View (Section B-B)', 'Kayış Kesit Görünümü (Section B-B)')}
                    >
                        📐 {t12(language, 'Section (B-B)', 'Kesit (B-B)')}
                    </button>
                </div>

                {viewMode === 'section' ? (
                    <button
                        type="button"
                        onClick={handleDownloadSectionSvg}
                        className="px-2 py-0.5 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] hover:bg-[var(--cyan)]/25 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                        title={t12(language, 'Download B-B Cross-Section View as SVG', 'B-B Kesit Görünümünü SVG olarak indir')}
                    >
                        <Download size={11} /> {t12(language, 'SVG Section (B-B)', 'SVG Kesit (B-B)')}
                    </button>
                ) : (
                    <>
                        <span className="text-[9px] text-[var(--warn)] font-bold px-1 flex items-center gap-0.5">
                            <Download size={11} /> CAM
                        </span>
                        <button
                            type="button"
                            onClick={() => handleDownloadSvg('d1')}
                            className="px-2 py-0.5 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] hover:bg-[var(--cyan)]/25 transition-colors cursor-pointer"
                            title={t12(language, '1:1 Metric SVG (Pulley 1)', '1:1 Metrik SVG (Kasnak 1)')}
                        >
                            SVG 1
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownloadSvg('d2')}
                            className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer"
                            title={t12(language, '1:1 Metric SVG (Pulley 2)', '1:1 Metrik SVG (Kasnak 2)')}
                        >
                            SVG 2
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownloadDxf('d1')}
                            className="px-2 py-0.5 rounded bg-[var(--line)]/20 text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors cursor-pointer"
                            title={t12(language, 'AutoCAD DXF (Pulley 1)', 'AutoCAD DXF (Kasnak 1)')}
                        >
                            DXF 1
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownloadDxf('d2')}
                            className="px-2 py-0.5 rounded bg-[var(--line)]/20 text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors cursor-pointer"
                            title={t12(language, 'AutoCAD DXF (Pulley 2)', 'AutoCAD DXF (Kasnak 2)')}
                        >
                            DXF 2
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

            {/* SECTION B-B VIEW MODE */}
            {viewMode === 'section' ? (
                <BeltSectionView
                    beltType={beltType}
                    pitch={pitch}
                    beltWidth={beltWidth}
                    beltHeight={beltHeight}
                    profileLabel={profileLabel}
                    width={W}
                    height={H}
                />
            ) : (
                /* TRANSMISSION VIEW MODE */
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
                <FrameDefs ids={ids} />
                <rect width={W} height={H} fill="var(--bg-2)" stroke="var(--line)" rx="8" />
                <rect width={W} height={H} fill={`url(#${ids.grid})`} />
                <text x={20} y={28} fontSize="13" fontWeight="700" fill="#f59e0b" fontFamily="ui-monospace, monospace">
                    {beltType.toUpperCase().replace(/-/g, ' ')} DRIVE
                </text>
                <text x={20} y={44} fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">
                    {stdLabel} · pitch line{cNote}
                    {beltLength != null ? ` · L = ${beltLength.toFixed(0)} mm` : ''}
                </text>
                <rect x={16} y={56} width={panelW} height={H - 72} rx={8} fill="var(--bg-1)" stroke="var(--line)" strokeWidth="1" />

                {/* REALISTIC CONTINUOUS BELT BODY RIBBON */}
                {beltRibbonPath && (
                    <path
                        d={beltRibbonPath}
                        fill={isTiming ? '#0a192f' : '#111827'}
                        stroke={isTiming ? '#22d3ee' : '#f59e0b'}
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                        fillRule="evenodd"
                        opacity="0.95"
                    />
                )}

                {/* PULLEYS */}
                <PulleyGraphic
                    cx={layout.cx1} cy={layout.cy} rPitch={layout.sr1} rBody={rBody1}
                    z={z1} stroke="var(--cyan)" isTiming={isTiming} isV={isV} isPoly={isPoly} grooveScale={0.62} ids={ids}
                    isDriven={false} angle={angle1}
                />

                <PulleyGraphic
                    cx={layout.cx2} cy={layout.cy} rPitch={layout.sr2} rBody={rBody2}
                    z={z2} stroke="#8b5cf6" isTiming={isTiming} isV={isV} isPoly={isPoly} grooveScale={0.62} ids={ids}
                    isDriven={true} angle={angle2}
                />

                {/* MOLDED TIMING BELT TEETH OR COGGED V-BELT NOTCHES */}
                {beltTeethList.length > 0 && (
                    <g className="belt-teeth-assembly">
                        {beltTeethList.map((t) => (
                            <path
                                key={t.i}
                                d={t.path}
                                fill={isTiming ? '#0891b2' : '#78350f'}
                                stroke={isTiming ? '#22d3ee' : '#f59e0b'}
                                strokeWidth="0.9"
                            />
                        ))}
                    </g>
                )}

                {/* HIGH-TENSILE EMBEDDED CORD LINE (Neutral Pitch Line) */}
                {beltRun && (
                    <path
                        d={beltRun.d}
                        fill="none"
                        stroke={isTiming ? '#38bdf8' : '#fbbf24'}
                        strokeWidth={isTiming ? 1.4 : 1.6}
                        strokeDasharray={isTiming ? '4 2' : '6 3'}
                        strokeLinecap="round"
                        opacity="0.85"
                    />
                )}

                {/* POLY-V LONGITUDINAL RIB TRACKS */}
                {isPoly && driveLoop && (
                    <g opacity="0.65">
                        <path d={driveLoop.getRibbonPath(1.8, 1.8, 80)} fill="none" stroke="#fbbf24" strokeWidth="0.8" />
                        <path d={driveLoop.getRibbonPath(-1.8, -1.8, 80)} fill="none" stroke="#fbbf24" strokeWidth="0.8" />
                    </g>
                )}

                <text x={layout.cx1} y={layout.cy - layout.sr1 - 14} textAnchor="middle" fontSize="10" fill="var(--cyan)" fontWeight="700" fontFamily="ui-monospace, monospace">
                    {isTiming && z1 != null ? `z1 = ${z1}` : `d1 = ${D1.toFixed(0)}`}
                </text>
                {isTiming && (
                    <>
                        <text x={layout.cx1} y={layout.cy - layout.sr1 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {D1.toFixed(1)} mm</text>
                        <text x={layout.cx1} y={layout.cy - layout.sr1 - 38} textAnchor="middle" fontSize="8" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace">Do = {Do1.toFixed(1)} mm</text>
                    </>
                )}
                <text x={layout.cx2} y={layout.cy - layout.sr2 - 14} textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="700" fontFamily="ui-monospace, monospace">
                    {isTiming && z2 != null ? `z2 = ${z2}` : `d2 = ${D2.toFixed(0)}`}
                </text>
                {isTiming && (
                    <>
                        <text x={layout.cx2} y={layout.cy - layout.sr2 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {D2.toFixed(1)} mm</text>
                        <text x={layout.cx2} y={layout.cy - layout.sr2 - 38} textAnchor="middle" fontSize="8" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace">Do = {Do2.toFixed(1)} mm</text>
                    </>
                )}

                <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy + Math.max(layout.sr1, layout.sr2) + 16} textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="700" fontFamily="ui-monospace, monospace">
                    {t.tight}{T1 != null ? ` = ${T1.toFixed(0)} N` : ''}
                </text>
                <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy - Math.max(layout.sr1, layout.sr2) - 8} textAnchor="middle" fontSize="8" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace">
                    {t.slack}{T2 != null ? ` = ${T2.toFixed(0)} N` : ''}
                </text>

                <g transform={`translate(${Math.max(28, layout.cx1 - layout.sr1 - 12)}, ${layout.cy})`}>
                    <path d={`M 0 ${-layout.sr1 * 0.5} A ${layout.sr1 + 10} ${layout.sr1 + 10} 0 0 0 0 ${layout.sr1 * 0.5}`} fill="none" stroke="var(--cyan)" strokeWidth="1.1" strokeDasharray="3 3" />
                    <rect x="-34" y="-7" width="32" height="14" rx="2" fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth="0.6" opacity="0.9" />
                    <text x="-18" y="3" textAnchor="middle" fontSize="7.5" fill="var(--ink)" fontFamily="ui-monospace, monospace" fontWeight="bold">θ={thetaDeg.toFixed(0)}°</text>
                </g>

                <DimLine x1={layout.cx1} y1={layout.cy + Math.max(layout.sr1, layout.sr2) + 42} x2={layout.cx2} y2={layout.cy + Math.max(layout.sr1, layout.sr2) + 42} label={`C = ${layout.Cmm.toFixed(0)} mm`} color="#f59e0b" />

                {showLegend && (
                    <LegendPanel x={556} y={56} title={t.results} rows={[
                        { label: t.n1, value: `${rpm1.toFixed(0)} rpm` },
                        ...(rpm2 != null ? [{ label: t.n2, value: `${rpm2.toFixed(0)} rpm` }] : []),
                        { label: t.v, value: beltVelocity != null ? `${beltVelocity.toFixed(2)} m/s` : '-', highlight: true },
                        { label: t.L, value: beltLength != null ? `${beltLength.toFixed(0)} mm` : '-' },
                        { label: t.wrap, value: `${thetaDeg.toFixed(1)} deg` },
                        ...(T2 != null ? [{ label: t.t2, value: `${T2.toFixed(0)} N` }] : []),
                        ...(T1 != null ? [{ label: t.t1, value: `${T1.toFixed(0)} N`, highlight: true }] : []),
                        ...(Tc != null ? [{ label: t.tc, value: `${Tc.toFixed(0)} N` }] : []),
                        ...(shaftLoad != null ? [{ label: t.fs, value: `${shaftLoad.toFixed(0)} N` }] : []),
                        ...(flexHz != null ? [{ label: t.flex, value: `${flexHz.toFixed(1)} Hz` }] : []),
                        ...(isTiming && teethInMesh != null ? [{ label: t.zim, value: teethInMesh.toFixed(1) }] : []),
                    ]} />
                )}
            </svg>
            )}
        </div>
    );
}

export default BeltDriveBlueprint;
