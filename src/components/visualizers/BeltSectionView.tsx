'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export interface BeltSectionViewProps {
    beltType?: string;
    pitch?: number;
    width?: number;
    height?: number;
    beltWidth?: number;  // top width bo
    beltHeight?: number; // total height h
    profileLabel?: string;
    showDownloadButton?: boolean;
}

export function BeltSectionView(props: BeltSectionViewProps) {
    const {
        beltType = 'classical-v',
        pitch = 5,
        width = 760,
        height = 420,
        beltWidth: beltWidthProp,
        beltHeight: beltHeightProp,
        profileLabel,
        showDownloadButton = false,
    } = props;

    const { language } = useI18nStore();

    const isTiming = beltType === 'timing';
    const isPoly = beltType === 'poly-v';
    const isCogged = beltType === 'cogged-v';
    const isV = !isTiming && !isPoly;

    const W = width;
    const H = height;

    const hatchRubberId = `belt-hatch-rubber-${React.useId().replace(/:/g, '')}`;
    const hatchFabricId = `belt-hatch-fabric-${React.useId().replace(/:/g, '')}`;

    // Dimensions in mm
    // If timing belt:
    const p = Math.max(3, pitch);
    const ht = p * 0.42; // tooth height
    const hs = ht * 1.85; // total belt thickness
    const timingWidthMm = beltWidthProp != null && beltWidthProp > 0 ? beltWidthProp : 25; // default width

    // If V-belt:
    const bo = beltWidthProp != null && beltWidthProp > 0 ? beltWidthProp : (isCogged ? 13 : 17); // top width
    const hBelt = beltHeightProp != null && beltHeightProp > 0 ? beltHeightProp : (isCogged ? 8 : 11); // height
    const bd = bo * 0.82; // datum/pitch width
    const wedgeAngleDeg = 38; // wedge angle
    const cordDepthMm = hBelt * 0.32; // distance from top to pitch cord layer

    // Poly-V
    const polyRibs = 6;
    const polyPitchMm = 2.34; // PK profile
    const polyHeightMm = 4.0;
    const polyWidthMm = polyRibs * polyPitchMm;

    // Viewport scaling
    const maxDrawW = Math.max(300, W - 230);
    const maxDrawH = Math.max(200, H - 90);
    const centerX = 24 + (maxDrawW - 90) / 2;
    const centerY = 45 + maxDrawH / 2;

    const downloadSectionSvg = () => {
        const svgElement = document.getElementById('belt-section-svg');
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        const source = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svgElement);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `belt_section_${beltType}_${isTiming ? `p${p.toFixed(1)}mm` : `b${bo.toFixed(1)}mm`}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full relative select-none flex flex-col items-center">
            {/* Optional Standalone Download Button */}
            {showDownloadButton && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-[var(--bg-1)]/90 p-1 rounded-lg border border-white/10 text-[10px] font-mono shadow-xl">
                    <span className="text-[9px] text-amber-400 font-bold px-1.5 flex items-center gap-1">
                        <Download size={11} /> 1:1 CAD
                    </span>
                    <button
                        type="button"
                        onClick={downloadSectionSvg}
                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                        title={t12(language, 'Download B-B Section View as SVG', 'B-B Kesit Görünümünü SVG olarak indir')}
                    >
                        {t12(language, 'SVG Section (B-B)', 'SVG Kesit (B-B)')}
                    </button>
                </div>
            )}

            <svg
                id="belt-section-svg"
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-full select-none"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Dimension Arrowhead Marker */}
                    <marker id="tf-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                    </marker>
                    {/* Rubber section hatch */}
                    <pattern id={hatchRubberId} width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                    {/* Fabric wrap cross-hatch */}
                    <pattern id={hatchFabricId} width="4" height="4" patternUnits="userSpaceOnUse">
                        <path d="M 0 0 L 4 4 M 4 0 L 0 4" stroke="#94a3b8" strokeWidth="0.5" opacity="0.4" />
                    </pattern>
                </defs>

                {/* Background */}
                <rect width={W} height={H} fill="var(--bg-2)" stroke="var(--line)" rx="8" />

                {/* Subtle grid */}
                <pattern id="grid-sec-belt" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(245,158,11,0.04)" strokeWidth="0.5" />
                </pattern>
                <rect width={W} height={H} fill="url(#grid-sec-belt)" />

                {/* Title */}
                <text x={20} y={28} fontSize="12" fontWeight="700" fill="#f59e0b" fontFamily="ui-monospace, monospace">
                    SECTION B-B · {isTiming ? 'ISO 13050 TIMING BELT PROFILE' : isPoly ? 'ISO 9982 POLY-V RIBBED BELT' : 'ISO 4184 / DIN 2215 V-BELT SECTION'}
                </text>
                <text x={20} y={44} fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">
                    {profileLabel ?? beltType.toUpperCase()} · {isTiming ? `p = ${p.toFixed(2)} mm · ht = ${ht.toFixed(2)} mm · hs = ${hs.toFixed(2)} mm` : `bo = ${bo.toFixed(1)} mm · h = ${hBelt.toFixed(1)} mm · 2β = ${wedgeAngleDeg}°`}
                </text>

                {/* Main Drawing Area Border */}
                <rect
                    x={16}
                    y={56}
                    width={maxDrawW + 48}
                    height={H - 72}
                    rx={8}
                    fill="var(--bg-1)"
                    stroke="var(--line)"
                    strokeWidth="1"
                />

                <text x={28} y={76} fontSize="11" fontWeight="bold" fill="#f59e0b" fontFamily="ui-monospace, monospace">
                    B-B {isTiming ? t12(language, 'LONGITUDINAL TOOTH GEOMETRY AND CROSS-SECTION', 'BOYUNA DİŞ GEOMETRİSİ VE ENİNE KESİT') : t12(language, 'TRANSVERSE TRAPEZOID / MULTI-RIB SECTION', 'ENİNE TRAPEZ / ÇOKLU KANAL KESİTİ')} ({t12(language, '1:1 MANUFACTURING STANDARD', '1:1 İMALAT STANDARDI')})
                </text>

                {/* 1. V-BELT CROSS SECTION */}
                {isV && (() => {
                    const scale = Math.min(maxDrawW / (bo * 2.8), maxDrawH / (hBelt * 2.8), 12);
                    const boPx = bo * scale;
                    const hPx = hBelt * scale;
                    const halfTan = Math.tan((wedgeAngleDeg / 2) * (Math.PI / 180));
                    const bottomWidthPx = boPx - 2 * (hPx * halfTan);
                    const cordY = centerY - hPx / 2 + cordDepthMm * scale;

                    const tl = { x: centerX - boPx / 2, y: centerY - hPx / 2 };
                    const tr = { x: centerX + boPx / 2, y: centerY - hPx / 2 };
                    const br = { x: centerX + bottomWidthPx / 2, y: centerY + hPx / 2 };
                    const bl = { x: centerX - bottomWidthPx / 2, y: centerY + hPx / 2 };

                    const trapPath = `M ${tl.x} ${tl.y} L ${tr.x} ${tr.y} L ${br.x} ${br.y} L ${bl.x} ${bl.y} Z`;

                    // Number of embedded cords in cross section
                    const numCords = Math.max(5, Math.round(bo / 1.8));
                    const cordSpacingPx = (boPx * 0.76) / (numCords - 1);
                    const cordStartXPx = centerX - (boPx * 0.76) / 2;

                    return (
                        <g>
                            {/* Centerline */}
                            <line x1={centerX} y1={tl.y - 25} x2={centerX} y2={bl.y + 35} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="10 3 3 3" opacity="0.6" />

                            {/* Pitch / Datum Width Line (bd) */}
                            <line x1={centerX - (bd * scale) / 2 - 20} y1={cordY} x2={centerX + (bd * scale) / 2 + 20} y2={cordY} stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="6 2" opacity="0.8" />
                            <text x={centerX + (bd * scale) / 2 + 24} y={cordY + 3} fontSize="8" fill="#38bdf8" fontFamily="ui-monospace, monospace">Pitch/Datum Line (bd)</text>

                            {/* Outer Protective Fabric Jacket */}
                            <path d={trapPath} fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d={trapPath} fill={`url(#${hatchRubberId})`} />

                            {/* If cogged, draw molded notches on inner face */}
                            {isCogged && (
                                <g opacity="0.85">
                                    {[-0.3, 0, 0.3].map((pos, i) => (
                                        <path
                                            key={i}
                                            d={`M ${centerX + pos * bottomWidthPx - 10} ${bl.y} Q ${centerX + pos * bottomWidthPx} ${bl.y - 8} ${centerX + pos * bottomWidthPx + 10} ${bl.y}`}
                                            fill="var(--bg-2)"
                                            stroke="#f59e0b"
                                            strokeWidth="1"
                                        />
                                    ))}
                                </g>
                            )}

                            {/* Tensile Cords Layer (Cross section of twisted cords) */}
                            {Array.from({ length: numCords }).map((_, cIdx) => {
                                const cx = cordStartXPx + cIdx * cordSpacingPx;
                                return (
                                    <g key={cIdx}>
                                        <circle cx={cx} cy={cordY} r={scale * 0.55} fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                                        <circle cx={cx} cy={cordY} r={scale * 0.25} fill="#ffffff" opacity="0.8" />
                                    </g>
                                );
                            })}

                            {/* Dimension: Top Width bo */}
                            <g transform={`translate(0, ${tl.y - 20})`}>
                                <line x1={tl.x} y1={14} x2={tl.x} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={tr.x} y1={14} x2={tr.x} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={tl.x} y1={0} x2={tr.x} y2={0} stroke="#f59e0b" strokeWidth="1" markerStart="url(#tf-arrow)" markerEnd="url(#tf-arrow)" />
                                <rect x={centerX - 30} y={-8} width={60} height={16} rx={3} fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="0.8" />
                                <text x={centerX} y={3} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f59e0b" fontFamily="ui-monospace, monospace">
                                    bo = {bo.toFixed(1)}
                                </text>
                            </g>

                            {/* Dimension: Height h */}
                            <g transform={`translate(${tl.x - 30}, 0)`}>
                                <line x1={24} y1={tl.y} x2={-4} y2={tl.y} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={24} y1={bl.y} x2={-4} y2={bl.y} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={0} y1={tl.y} x2={0} y2={bl.y} stroke="#f59e0b" strokeWidth="1" />
                                <rect x={-36} y={centerY - 8} width={50} height={16} rx={3} fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="0.8" />
                                <text x={-11} y={centerY + 3} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f59e0b" fontFamily="ui-monospace, monospace">
                                    h = {hBelt.toFixed(1)}
                                </text>
                            </g>

                            {/* Wedge Angle Dimension 2β */}
                            <g transform={`translate(${tr.x + 25}, ${centerY})`}>
                                <path d="M 0 -18 L 14 0 L 0 18" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                                <text x={18} y={3} fontSize="8.5" fill="#e2e8f0" fontWeight="bold" fontFamily="ui-monospace, monospace">
                                    2β = {wedgeAngleDeg}°
                                </text>
                            </g>
                        </g>
                    );
                })()}

                {/* 2. TIMING BELT PROFILE & TOOTH SECTION */}
                {isTiming && (() => {
                    const scale = Math.min(maxDrawW / (p * 5.2), maxDrawH / (hs * 5.5), 14);
                    const pPx = p * scale;
                    const htPx = ht * scale;
                    const hsPx = hs * scale;
                    const backThickPx = hsPx - htPx;

                    // Draw 3 complete timing belt teeth along longitudinal section
                    const startX = centerX - 1.5 * pPx;
                    const topY = centerY - hsPx / 2;
                    const landY = topY + backThickPx;
                    const toothTipY = topY + hsPx;
                    const cordY = topY + backThickPx * 0.65;

                    // Tooth path construction for 3 HTD curvilinear teeth
                    let toothPath = `M ${startX - 15} ${topY} L ${startX + 3 * pPx + 15} ${topY} L ${startX + 3 * pPx + 15} ${landY}`;

                    for (let i = 2; i >= 0; i--) {
                        const toothCenterX = startX + (i + 0.5) * pPx;
                        const landRightX = toothCenterX + pPx * 0.28;
                        const landLeftX = toothCenterX - pPx * 0.28;

                        toothPath += ` L ${landRightX} ${landY}`;
                        // HTD rounded curvilinear tooth contour
                        toothPath += ` C ${landRightX} ${toothTipY - htPx * 0.15}, ${toothCenterX + pPx * 0.16} ${toothTipY}, ${toothCenterX} ${toothTipY}`;
                        toothPath += ` C ${toothCenterX - pPx * 0.16} ${toothTipY}, ${landLeftX} ${toothTipY - htPx * 0.15}, ${landLeftX} ${landY}`;
                    }

                    toothPath += ` L ${startX - 15} ${landY} Z`;

                    return (
                        <g>
                            {/* Belt Body with HTD Teeth */}
                            <path d={toothPath} fill="#082f49" stroke="#00e5ff" strokeWidth="1.4" strokeLinejoin="round" />
                            <path d={toothPath} fill={`url(#${hatchRubberId})`} />

                            {/* Pitch / Cord Line */}
                            <line x1={startX - 20} y1={cordY} x2={startX + 3 * pPx + 20} y2={cordY} stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="5 2" opacity="0.9" />
                            <text x={startX + 3 * pPx + 24} y={cordY + 3} fontSize="8" fill="#38bdf8" fontFamily="ui-monospace, monospace">Pitch Line / Cam Elyafı Kordlar</text>

                            {/* Embedded continuous glass-fiber cords */}
                            {Array.from({ length: 18 }).map((_, cIdx) => {
                                const cx = startX - 10 + cIdx * ((3 * pPx + 20) / 17);
                                return (
                                    <circle key={cIdx} cx={cx} cy={cordY} r={scale * 0.35} fill="#22d3ee" stroke="#0891b2" strokeWidth="0.6" />
                                );
                            })}

                            {/* Wear-resistant Polyamide Nylon Fabric Layer on Teeth */}
                            <path
                                d={`M ${startX - 15} ${landY} ` + Array.from({ length: 3 }).map((_, i) => {
                                    const toothCenterX = startX + (i + 0.5) * pPx;
                                    const landRightX = toothCenterX + pPx * 0.28;
                                    const landLeftX = toothCenterX - pPx * 0.28;
                                    return `L ${landLeftX} ${landY} C ${landLeftX} ${toothTipY - htPx * 0.15}, ${toothCenterX - pPx * 0.16} ${toothTipY}, ${toothCenterX} ${toothTipY} C ${toothCenterX + pPx * 0.16} ${toothTipY}, ${landRightX} ${toothTipY - htPx * 0.15}, ${landRightX} ${landY}`;
                                }).join(' ') + ` L ${startX + 3 * pPx + 15} ${landY}`}
                                fill="none"
                                stroke="#a78bfa"
                                strokeWidth="2.2"
                                opacity="0.85"
                            />

                            {/* Pitch Dimension p */}
                            <g transform={`translate(0, ${toothTipY + 22})`}>
                                <line x1={startX + 0.5 * pPx} y1={-14} x2={startX + 0.5 * pPx} y2={4} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={startX + 1.5 * pPx} y1={-14} x2={startX + 1.5 * pPx} y2={4} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={startX + 0.5 * pPx} y1={0} x2={startX + 1.5 * pPx} y2={0} stroke="#00e5ff" strokeWidth="1" markerStart="url(#tf-arrow)" markerEnd="url(#tf-arrow)" />
                                <rect x={startX + pPx - 28} y={-8} width={56} height={16} rx={3} fill="var(--bg-1)" stroke="#00e5ff" strokeWidth="0.8" />
                                <text x={startX + pPx} y={3} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#00e5ff" fontFamily="ui-monospace, monospace">
                                    p = {p.toFixed(2)}
                                </text>
                            </g>

                            {/* Tooth Height ht Dimension */}
                            <g transform={`translate(${startX - 25}, 0)`}>
                                <line x1={18} y1={landY} x2={-4} y2={landY} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={18} y1={toothTipY} x2={-4} y2={toothTipY} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={0} y1={landY} x2={0} y2={toothTipY} stroke="#fbbf24" strokeWidth="1" />
                                <rect x={-36} y={(landY + toothTipY) / 2 - 8} width={48} height={16} rx={3} fill="var(--bg-1)" stroke="#fbbf24" strokeWidth="0.8" />
                                <text x={-12} y={(landY + toothTipY) / 2 + 3} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fbbf24" fontFamily="ui-monospace, monospace">
                                    ht = {ht.toFixed(2)}
                                </text>
                            </g>

                            {/* Total Height hs Dimension */}
                            <g transform={`translate(${startX - 75}, 0)`}>
                                <line x1={68} y1={topY} x2={-4} y2={topY} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={68} y1={toothTipY} x2={-4} y2={toothTipY} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={0} y1={topY} x2={0} y2={toothTipY} stroke="#38bdf8" strokeWidth="1" />
                                <rect x={-36} y={centerY - 8} width={48} height={16} rx={3} fill="var(--bg-1)" stroke="#38bdf8" strokeWidth="0.8" />
                                <text x={-12} y={centerY + 3} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#38bdf8" fontFamily="ui-monospace, monospace">
                                    hs = {hs.toFixed(2)}
                                </text>
                            </g>
                        </g>
                    );
                })()}

                {/* 3. POLY-V MULTI-RIB SECTION */}
                {isPoly && (() => {
                    const scale = Math.min(maxDrawW / (polyWidthMm * 2.5), maxDrawH / (polyHeightMm * 4.5), 16);
                    const ribPx = polyPitchMm * scale;
                    const wPx = polyWidthMm * scale;
                    const hPx = polyHeightMm * scale;
                    const backY = centerY - hPx / 2;
                    const tipY = centerY + hPx / 2;
                    const cordY = backY + hPx * 0.35;

                    let polyPath = `M ${centerX - wPx / 2} ${backY} L ${centerX + wPx / 2} ${backY} L ${centerX + wPx / 2} ${cordY + 4}`;

                    for (let r = polyRibs - 1; r >= 0; r--) {
                        const ribRightX = centerX - wPx / 2 + (r + 1) * ribPx;
                        const ribCenterX = ribRightX - ribPx / 2;
                        const ribLeftX = ribRightX - ribPx;

                        polyPath += ` L ${ribCenterX + ribPx * 0.1} ${tipY} L ${ribCenterX - ribPx * 0.1} ${tipY} L ${ribLeftX} ${cordY + 4}`;
                    }

                    polyPath += ` L ${centerX - wPx / 2} ${backY} Z`;

                    return (
                        <g>
                            <path d={polyPath} fill="#0f172a" stroke="#fbbf24" strokeWidth="1.3" />
                            <path d={polyPath} fill={`url(#${hatchRubberId})`} />

                            {/* Pitch Cord Layer */}
                            <line x1={centerX - wPx / 2 - 15} y1={cordY} x2={centerX + wPx / 2 + 15} y2={cordY} stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="4 2" />

                            {/* Dimension: Total Width */}
                            <g transform={`translate(0, ${backY - 18})`}>
                                <line x1={centerX - wPx / 2} y1={12} x2={centerX - wPx / 2} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={centerX + wPx / 2} y1={12} x2={centerX + wPx / 2} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                                <line x1={centerX - wPx / 2} y1={0} x2={centerX + wPx / 2} y2={0} stroke="#fbbf24" strokeWidth="1" />
                                <rect x={centerX - 35} y={-8} width={70} height={16} rx={3} fill="var(--bg-1)" stroke="#fbbf24" strokeWidth="0.8" />
                                <text x={centerX} y={3} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fbbf24" fontFamily="ui-monospace, monospace">
                                    W = {polyWidthMm.toFixed(1)} mm
                                </text>
                            </g>
                        </g>
                    );
                })()}

                {/* Technical Engineering Spec Panel (Right Side) */}
                <g transform={`translate(${W - 200}, 56)`}>
                    <rect width={184} height={H - 72} rx={8} fill="var(--bg-1)" stroke="var(--line)" strokeWidth="1" />
                    <text x={12} y={22} fontSize="9" fontWeight="700" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace" letterSpacing="0.1em">
                        {t12(language, 'BELT SECTION SPECS', 'KAYIŞ KESİT ÖZELLİKLERİ')}
                    </text>
                    <line x1={12} y1={30} x2={172} y2={30} stroke="var(--line)" />

                    {[
                        { label: t12(language, 'Type', 'Tip'), val: `${isTiming ? t12(language, 'Timing Belt', 'Triger (Zamanlama)') : isPoly ? t12(language, 'Poly-V (Ribbed)', 'Poly-V (Kanallı)') : isCogged ? t12(language, 'Cogged Raw Edge V-Belt', 'Tırtıllı / Cogged V') : t12(language, 'Classical / Narrow V-Belt', 'Klasik / Dar V')}` },
                        { label: t12(language, 'Standard', 'Standart'), val: `${isTiming ? 'ISO 13050 / ISO 5291' : isPoly ? 'ISO 9982' : 'ISO 4184 / DIN 2215'}` },
                        ...(isTiming ? [
                            { label: t12(language, 'Pitch (p)', 'Hatve (p)'), val: `${p.toFixed(2)} mm` },
                            { label: t12(language, 'Tooth Height (ht)', 'Diş Yüksekliği (ht)'), val: `${ht.toFixed(2)} mm` },
                            { label: t12(language, 'Total Thickness (hs)', 'Toplam Kalınlık (hs)'), val: `${hs.toFixed(2)} mm` },
                            { label: t12(language, 'Tensile Cord', 'Gergi Kordu'), val: t12(language, 'Helical Fiberglass', 'Spiral Cam Elyafı (Fiberglass)') },
                            { label: t12(language, 'Tooth Facing', 'Diş Örtüsü'), val: t12(language, 'Wear-Resistant Polyamide', 'Aşınmaz Poliamid Kumaş') },
                        ] : [
                            { label: t12(language, 'Top Width (bo)', 'Üst Genişlik (bo)'), val: `${bo.toFixed(1)} mm` },
                            { label: t12(language, 'Datum Width (bd)', 'Referans Genişlik (bd)'), val: `${bd.toFixed(1)} mm` },
                            { label: t12(language, 'Height (h)', 'Yükseklik (h)'), val: `${hBelt.toFixed(1)} mm` },
                            { label: t12(language, 'Wedge Angle (2β)', 'Kama Açısı (2β)'), val: `${wedgeAngleDeg}°` },
                            { label: t12(language, 'Tensile Cord', 'Gergi Kordu'), val: t12(language, 'Polyester / High-Mod Aramid', 'Polyester / Yüksek Modüllü Aramid') },
                            { label: t12(language, 'Cushion Rubber', 'Gövde Kauçuğu'), val: t12(language, 'Chloroprene / EPDM Rubber', 'Kloropren / EPDM Kauçuk') },
                        ]),
                        { label: t12(language, 'Working Temp', 'Çalışma Sıcaklığı'), val: '-30°C / +90°C' },
                        { label: t12(language, 'Oil & Ozone Resist', 'Yağ & Ozon Direnci'), val: t12(language, 'High (ISO 1817 Compliant)', 'Yüksek (ISO 1817 Uyumlu)') },
                    ].map((row, idx) => (
                        <g key={row.label} transform={`translate(12, ${46 + idx * 25})`}>
                            <text x={0} y={0} fontSize="7.5" fill="var(--alu-dim)" fontFamily="ui-sans-serif, system-ui">{row.label}</text>
                            <text x={0} y={12} fontSize="9" fontWeight="700" fill="var(--ink)" fontFamily="ui-monospace, monospace">{row.val}</text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
}

export default BeltSectionView;
