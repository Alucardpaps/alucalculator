'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { ISO_606_STRAND_FACTOR, type Iso606Strands } from '@/data/mechanical/iso606';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export interface ChainSectionViewProps {
    pitch: number;
    chainType?: string;
    d1?: number; // roller diameter if known
    width?: number;
    height?: number;
    showTitle?: boolean;
    showDownloadButton?: boolean;
}

export function ChainSectionView(props: ChainSectionViewProps) {
    const {
        pitch,
        chainType = 'roller-simplex',
        d1: d1Prop,
        width = 760,
        height = 420,
        showTitle = true,
        showDownloadButton = false,
    } = props;

    const { language } = useI18nStore();

    const p = Math.max(6, pitch);
    const strands: Iso606Strands = chainType.includes('triplex') ? 3 : chainType.includes('duplex') ? 2 : 1;

    // ISO 606 / DIN 8187 geometric proportions
    const rollerDia = d1Prop != null && d1Prop > 0 ? d1Prop : p * 0.67;
    const pinDia = p * 0.35;
    const bushingDia = pinDia * 1.32;
    const innerWidth = p * 0.61; // b1
    const plateThick = p * 0.125; // s1 = s2
    const plateHeight = p * 0.92; // h2
    const transPitch = p * 1.10; // pt for duplex / triplex
    const rivetHeadExt = p * 0.08;

    // Total width across all strands in mm
    const strandWidth = innerWidth + 2 * plateThick;
    const totalAssemblyWidth = strands === 1
        ? strandWidth + 2 * plateThick + 2 * rivetHeadExt
        : (strands - 1) * transPitch + strandWidth + 2 * plateThick + 2 * rivetHeadExt;

    // View layout
    const W = width;
    const H = height;

    // Drawing viewport bounds
    const maxDrawW = Math.max(300, W - 230); // leave right side for spec card
    const maxDrawH = Math.max(200, H - 90);

    // Longitudinal pitch distance (between 2 pins) in mm = p
    const assemblyLengthMm = p + rollerDia * 1.1;
    const assemblyHeightMm = totalAssemblyWidth * 1.15;

    const scaleX = (maxDrawW - 120) / assemblyLengthMm;
    const scaleY = (maxDrawH - 60) / assemblyHeightMm;
    const scale = Math.min(scaleX, scaleY, 13);

    const centerX = 24 + (maxDrawW - 90) / 2;
    const centerY = 45 + maxDrawH / 2;

    // Two pin centers along horizontal axis
    const pin1X = centerX - (p / 2) * scale;
    const pin2X = centerX + (p / 2) * scale;

    // Generate unique SVG IDs
    const hatchOuterId = `chain-hatch-outer-${React.useId().replace(/:/g, '')}`;
    const hatchInnerId = `chain-hatch-inner-${React.useId().replace(/:/g, '')}`;
    const hatchRollerId = `chain-hatch-roller-${React.useId().replace(/:/g, '')}`;

    // Dimensions in px
    const rRoller = (rollerDia / 2) * scale;
    const rPin = (pinDia / 2) * scale;
    const rBush = (bushingDia / 2) * scale;
    const tPlate = plateThick * scale;
    const b1Px = innerWidth * scale;
    const ptPx = transPitch * scale;

    const downloadSectionSvg = () => {
        const svgElement = document.getElementById('chain-section-svg');
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        const source = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svgElement);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chain_section_ISO606_p${p.toFixed(2)}mm_${chainType}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full relative select-none flex flex-col items-center">
            {/* Optional Standalone Download Button */}
            {showDownloadButton && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-[var(--bg-1)]/90 p-1 rounded-lg border border-white/10 text-[10px] font-mono shadow-xl">
                    <span className="text-[9px] text-cyan-400 font-bold px-1.5 flex items-center gap-1">
                        <Download size={11} /> 1:1 CAD
                    </span>
                    <button
                        type="button"
                        onClick={downloadSectionSvg}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                        title={t12(language, 'Download A-A Section View as SVG', 'A-A Kesit Görünümünü SVG olarak indir')}
                    >
                        {t12(language, 'SVG Section (A-A)', 'SVG Kesit (A-A)')}
                    </button>
                </div>
            )}

            <svg
                id="chain-section-svg"
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-full select-none"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Dimension Arrowhead Marker */}
                    <marker id="tf-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#00e5ff" />
                    </marker>
                    {/* 45 degree DIN standard steel hatching */}
                    <pattern id={hatchOuterId} width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                    {/* -45 degree DIN standard steel hatching for adjacent parts */}
                    <pattern id={hatchInnerId} width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#a78bfa" strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                    {/* 60 degree hatching for rollers */}
                    <pattern id={hatchRollerId} width="6" height="6" patternTransform="rotate(60 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#fbbf24" strokeWidth="0.7" opacity="0.5" />
                    </pattern>
                </defs>

                {/* Dark engineering blueprint background */}
                <rect width={W} height={H} fill="var(--bg-2)" stroke="var(--line)" rx="8" />

                {/* Subtle grid */}
                <pattern id="grid-sec-chain" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,229,255,0.04)" strokeWidth="0.5" />
                </pattern>
                <rect width={W} height={H} fill="url(#grid-sec-chain)" />

                {/* Title */}
                {showTitle && (
                    <>
                        <text x={20} y={28} fontSize="12" fontWeight="700" fill="#00e5ff" fontFamily="ui-monospace, monospace">
                            SECTION A-A · ISO 606 / DIN 8187 PRECISION ROLLER CHAIN
                        </text>
                        <text x={20} y={44} fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">
                            {chainType.toUpperCase()} · p = {p.toFixed(3)} mm · d1 = {rollerDia.toFixed(2)} mm · b1 = {innerWidth.toFixed(2)} mm
                        </text>
                    </>
                )}

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

                {/* Section Cut Line Indicator Symbol */}
                <g opacity="0.85">
                    <text x={28} y={76} fontSize="11" fontWeight="bold" fill="#00e5ff" fontFamily="ui-monospace, monospace">
                        A-A {t12(language, 'TRANSVERSE AND LONGITUDINAL COMPOUND SECTION', 'ENİNE VE BOYUNA BİLEŞİK KESİT')} ({t12(language, '1:1 MANUFACTURING STANDARD', '1:1 İMALAT STANDARDI')})
                    </text>
                </g>

                {/* Pitch Centerline (Horizontal) */}
                <line
                    x1={pin1X - rRoller - 25}
                    y1={centerY}
                    x2={pin2X + rRoller + 25}
                    y2={centerY}
                    stroke="#ef4444"
                    strokeWidth="0.9"
                    strokeDasharray="14 3 3 3"
                    opacity="0.75"
                />

                {/* Vertical Centerlines through Pins */}
                <line
                    x1={pin1X}
                    y1={centerY - (totalAssemblyWidth * scale) / 2 - 20}
                    x2={pin1X}
                    y2={centerY + (totalAssemblyWidth * scale) / 2 + 20}
                    stroke="#ef4444"
                    strokeWidth="0.8"
                    strokeDasharray="12 3 3 3"
                    opacity="0.6"
                />
                <line
                    x1={pin2X}
                    y1={centerY - (totalAssemblyWidth * scale) / 2 - 20}
                    x2={pin2X}
                    y2={centerY + (totalAssemblyWidth * scale) / 2 + 20}
                    stroke="#ef4444"
                    strokeWidth="0.8"
                    strokeDasharray="12 3 3 3"
                    opacity="0.6"
                />

                {/* Render Each Strand Row */}
                {Array.from({ length: strands }).map((_, sIdx) => {
                    const rowCenterY = centerY + (sIdx - (strands - 1) / 2) * ptPx;

                    const innerPlateTopY = rowCenterY - b1Px / 2 - tPlate;
                    const innerPlateBotY = rowCenterY + b1Px / 2;

                    const outerPlateTopY = innerPlateTopY - tPlate;
                    const outerPlateBotY = innerPlateBotY + tPlate;

                    return (
                        <g key={sIdx}>
                            {/* Rollers (Makara Gövdesi) on Pin 1 and Pin 2 */}
                            {[pin1X, pin2X].map((px, pIdx) => (
                                <g key={pIdx}>
                                    {/* Roller Outer Shell Rect in Section */}
                                    <rect
                                        x={px - rRoller}
                                        y={rowCenterY - b1Px / 2}
                                        width={rRoller * 2}
                                        height={b1Px}
                                        rx={1.5}
                                        fill="#0f172a"
                                        stroke="#fbbf24"
                                        strokeWidth="1.2"
                                    />
                                    {/* Roller Cross Hatch */}
                                    <rect
                                        x={px - rRoller}
                                        y={rowCenterY - b1Px / 2}
                                        width={rRoller * 2}
                                        height={b1Px}
                                        rx={1.5}
                                        fill={`url(#${hatchRollerId})`}
                                    />
                                    {/* Roller Bore (Bushing Hole) */}
                                    <rect
                                        x={px - rBush}
                                        y={rowCenterY - b1Px / 2 + 0.5}
                                        width={rBush * 2}
                                        height={b1Px - 1}
                                        fill="#060913"
                                        stroke="#94a3b8"
                                        strokeWidth="0.8"
                                        strokeDasharray="2 2"
                                    />
                                </g>
                            ))}

                            {/* Bushing (Kovan) extending into inner plates */}
                            {[pin1X, pin2X].map((px, pIdx) => (
                                <g key={`bush-${pIdx}`}>
                                    <rect
                                        x={px - rBush}
                                        y={innerPlateTopY}
                                        width={rBush * 2}
                                        height={b1Px + 2 * tPlate}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="0.9"
                                    />
                                </g>
                            ))}

                            {/* Inner Link Plates (İç Bakla Plakaları) */}
                            {/* Top inner plate */}
                            <rect
                                x={pin1X - rRoller * 0.95}
                                y={innerPlateTopY}
                                width={p * scale + rRoller * 1.9}
                                height={tPlate}
                                rx={1}
                                fill="#1e1b4b"
                                stroke="#8b5cf6"
                                strokeWidth="1.1"
                            />
                            <rect
                                x={pin1X - rRoller * 0.95}
                                y={innerPlateTopY}
                                width={p * scale + rRoller * 1.9}
                                height={tPlate}
                                fill={`url(#${hatchInnerId})`}
                            />

                            {/* Bottom inner plate */}
                            <rect
                                x={pin1X - rRoller * 0.95}
                                y={innerPlateBotY}
                                width={p * scale + rRoller * 1.9}
                                height={tPlate}
                                rx={1}
                                fill="#1e1b4b"
                                stroke="#8b5cf6"
                                strokeWidth="1.1"
                            />
                            <rect
                                x={pin1X - rRoller * 0.95}
                                y={innerPlateBotY}
                                width={p * scale + rRoller * 1.9}
                                height={tPlate}
                                fill={`url(#${hatchInnerId})`}
                            />

                            {/* Outer Link Plates (Dış Bakla Plakaları) */}
                            {/* Top outer plate */}
                            <rect
                                x={pin1X - rRoller * 1.05}
                                y={outerPlateTopY}
                                width={p * scale + rRoller * 2.1}
                                height={tPlate}
                                rx={1}
                                fill="#082f49"
                                stroke="#00e5ff"
                                strokeWidth="1.2"
                            />
                            <rect
                                x={pin1X - rRoller * 1.05}
                                y={outerPlateTopY}
                                width={p * scale + rRoller * 2.1}
                                height={tPlate}
                                fill={`url(#${hatchOuterId})`}
                            />

                            {/* Bottom outer plate */}
                            <rect
                                x={pin1X - rRoller * 1.05}
                                y={outerPlateBotY}
                                width={p * scale + rRoller * 2.1}
                                height={tPlate}
                                rx={1}
                                fill="#082f49"
                                stroke="#00e5ff"
                                strokeWidth="1.2"
                            />
                            <rect
                                x={pin1X - rRoller * 1.05}
                                y={outerPlateBotY}
                                width={p * scale + rRoller * 2.1}
                                height={tPlate}
                                fill={`url(#${hatchOuterId})`}
                            />

                            {/* Stepped Pins (Pimler) running through all components */}
                            {[pin1X, pin2X].map((px, pIdx) => {
                                const pinTopY = outerPlateTopY - rivetHeadExt * scale;
                                const pinBotY = outerPlateBotY + tPlate + rivetHeadExt * scale;
                                return (
                                    <g key={`pin-${pIdx}`}>
                                        {/* Pin Cylindrical Shank */}
                                        <rect
                                            x={px - rPin}
                                            y={outerPlateTopY}
                                            width={rPin * 2}
                                            height={outerPlateBotY + tPlate - outerPlateTopY}
                                            fill="#1e293b"
                                            stroke="#e2e8f0"
                                            strokeWidth="1.1"
                                        />
                                        {/* Top Rivet Head */}
                                        <ellipse
                                            cx={px}
                                            cy={outerPlateTopY}
                                            rx={rPin * 1.25}
                                            ry={rivetHeadExt * scale}
                                            fill="#475569"
                                            stroke="#e2e8f0"
                                            strokeWidth="1.1"
                                        />
                                        {/* Bottom Rivet Head */}
                                        <ellipse
                                            cx={px}
                                            cy={outerPlateBotY + tPlate}
                                            rx={rPin * 1.25}
                                            ry={rivetHeadExt * scale}
                                            fill="#475569"
                                            stroke="#e2e8f0"
                                            strokeWidth="1.1"
                                        />
                                        {/* Chamfer & Center Pip */}
                                        <circle cx={px} cy={outerPlateTopY - rivetHeadExt * scale * 0.4} r={1.2} fill="#00e5ff" />
                                        <circle cx={px} cy={outerPlateBotY + tPlate + rivetHeadExt * scale * 0.4} r={1.2} fill="#00e5ff" />
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

                {/* Dimension: Pitch p (Horizontal between pin centers) */}
                <g transform={`translate(0, ${centerY + (totalAssemblyWidth * scale) / 2 + 36})`}>
                    <line x1={pin1X} y1={-16} x2={pin1X} y2={6} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={pin2X} y1={-16} x2={pin2X} y2={6} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={pin1X} y1={0} x2={pin2X} y2={0} stroke="#00e5ff" strokeWidth="1" markerStart="url(#tf-arrow)" markerEnd="url(#tf-arrow)" />
                    <rect x={(pin1X + pin2X) / 2 - 34} y={-8} width={68} height={16} rx={3} fill="var(--bg-1)" stroke="#00e5ff" strokeWidth="0.8" />
                    <text x={(pin1X + pin2X) / 2} y={3} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#00e5ff" fontFamily="ui-monospace, monospace">
                        p = {p.toFixed(3)}
                    </text>
                </g>

                {/* Dimension: Roller Diameter d1 */}
                <g transform={`translate(${pin1X}, ${centerY - (totalAssemblyWidth * scale) / 2 - 32})`}>
                    <line x1={-rRoller} y1={18} x2={-rRoller} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={rRoller} y1={18} x2={rRoller} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={-rRoller} y1={0} x2={rRoller} y2={0} stroke="#fbbf24" strokeWidth="0.9" />
                    <rect x={-28} y={-8} width={56} height={15} rx={3} fill="var(--bg-1)" stroke="#fbbf24" strokeWidth="0.8" />
                    <text x={0} y={3} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fbbf24" fontFamily="ui-monospace, monospace">
                        Ød₁ = {rollerDia.toFixed(2)}
                    </text>
                </g>

                {/* Dimension: Pin Diameter d2 */}
                <g transform={`translate(${pin2X}, ${centerY - (totalAssemblyWidth * scale) / 2 - 32})`}>
                    <line x1={-rPin} y1={18} x2={-rPin} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={rPin} y1={18} x2={rPin} y2={-4} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={-rPin} y1={0} x2={rPin} y2={0} stroke="#e2e8f0" strokeWidth="0.9" />
                    <rect x={-28} y={-8} width={56} height={15} rx={3} fill="var(--bg-1)" stroke="#e2e8f0" strokeWidth="0.8" />
                    <text x={0} y={3} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#e2e8f0" fontFamily="ui-monospace, monospace">
                        Ød₂ = {pinDia.toFixed(2)}
                    </text>
                </g>

                {/* Dimension: Inner Width b1 */}
                <g transform={`translate(${pin2X + rRoller + 24}, ${centerY})`}>
                    <line x1={-14} y1={-b1Px / 2} x2={8} y2={-b1Px / 2} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={-14} y1={b1Px / 2} x2={8} y2={b1Px / 2} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={0} y1={-b1Px / 2} x2={0} y2={b1Px / 2} stroke="#a78bfa" strokeWidth="0.9" />
                    <rect x={6} y={-8} width={58} height={16} rx={3} fill="var(--bg-1)" stroke="#a78bfa" strokeWidth="0.8" />
                    <text x={35} y={3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#a78bfa" fontFamily="ui-monospace, monospace">
                        b₁ = {innerWidth.toFixed(2)}
                    </text>
                </g>

                {/* Dimension: Total Assembly Pin Length L */}
                <g transform={`translate(${pin2X + rRoller + 84}, ${centerY})`}>
                    <line x1={-12} y1={-(totalAssemblyWidth * scale) / 2} x2={8} y2={-(totalAssemblyWidth * scale) / 2} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={-12} y1={(totalAssemblyWidth * scale) / 2} x2={8} y2={(totalAssemblyWidth * scale) / 2} stroke="#64748b" strokeWidth="0.7" />
                    <line x1={0} y1={-(totalAssemblyWidth * scale) / 2} x2={0} y2={(totalAssemblyWidth * scale) / 2} stroke="#38bdf8" strokeWidth="0.9" />
                    <rect x={6} y={-8} width={58} height={16} rx={3} fill="var(--bg-1)" stroke="#38bdf8" strokeWidth="0.8" />
                    <text x={35} y={3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#38bdf8" fontFamily="ui-monospace, monospace">
                        L = {totalAssemblyWidth.toFixed(1)}
                    </text>
                </g>

                {/* Technical Engineering Spec Panel (Right Side) */}
                <g transform={`translate(${W - 200}, 56)`}>
                    <rect width={184} height={H - 72} rx={8} fill="var(--bg-1)" stroke="var(--line)" strokeWidth="1" />
                    <text x={12} y={22} fontSize="9" fontWeight="700" fill="var(--alu-dim)" fontFamily="ui-monospace, monospace" letterSpacing="0.1em">
                        {t12(language, 'ISO 606 / DIN 8187 PARAMETERS', 'ISO 606 / DIN 8187 PARAMETRELERİ')}
                    </text>
                    <line x1={12} y1={30} x2={172} y2={30} stroke="var(--line)" />

                    {[
                        { label: t12(language, 'Type / Strands', 'Tip / Sıra'), val: `${chainType.toUpperCase()}` },
                        { label: t12(language, 'Pitch (p)', 'Hatve (p)'), val: `${p.toFixed(3)} mm` },
                        { label: t12(language, 'Roller Dia (d₁)', 'Makara Çapı (d₁)'), val: `${rollerDia.toFixed(2)} mm` },
                        { label: t12(language, 'Pin Dia (d₂)', 'Pim Çapı (d₂)'), val: `${pinDia.toFixed(2)} mm` },
                        { label: t12(language, 'Inner Width (b₁)', 'İç Genişlik (b₁)'), val: `${innerWidth.toFixed(2)} mm` },
                        { label: t12(language, 'Plate Thickness (s)', 'Plaka Kalınlığı (s)'), val: `${plateThick.toFixed(2)} mm` },
                        { label: t12(language, 'Total Pin Length (L)', 'Toplam Pim Boyu (L)'), val: `${totalAssemblyWidth.toFixed(1)} mm` },
                        ...(strands > 1 ? [{ label: t12(language, 'Transverse Pitch (pt)', 'Enine Hatve (pt)'), val: `${transPitch.toFixed(2)} mm` }] : []),
                        { label: t12(language, 'Material (Plate)', 'Malzeme (Plaka)'), val: 'C45 / 42CrMo4' },
                        { label: t12(language, 'Material (Pin/Roller)', 'Malzeme (Pim/Makara)'), val: `16MnCr5 (${t12(language, 'Case-Hardened', 'Sementasyon')})` },
                        { label: t12(language, 'Hardness', 'Sertlik'), val: '58–62 HRC' },
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

export default ChainSectionView;
