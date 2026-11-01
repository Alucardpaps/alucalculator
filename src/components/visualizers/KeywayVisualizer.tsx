'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Layers, Zap, Info, Maximize2, Minimize2, ZoomIn, ZoomOut, X } from 'lucide-react';
import { KeyForm } from '@/lib/calculations/keywayConnection';
import { KeywayFitClass } from '@/data/machiningStandards';
import { useI18nStore, Language } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export interface KeywayVisualizerProps {
    d: number;                      // Shaft diameter (mm)
    b: number;                      // Key width (mm)
    h: number;                      // Key height (mm)
    t1: number;                     // Shaft keyway depth (mm)
    t2: number;                     // Hub keyway depth (mm)
    r?: number;                     // Fillet radius / chamfer (mm)
    keyLength: number;              // Total key length L (mm)
    effectiveLength: number;        // Effective bearing length l_e (mm)
    keyForm: KeyForm;               // 'A' (round ends) | 'B' (square ends)
    keyCount?: 1 | 2;               // 1 key or 2 keys
    doubleKeyAngle?: 120 | 180;     // Angle between double keys
    torque?: number;                // Applied Torque (N·m)
    tangentialForce?: number;       // Tangential force Ft (N)
    pHub?: number;                  // Hub contact pressure (MPa)
    allowablePHub?: number;         // Hub allowable pressure (MPa)
    tauKey?: number;                // Shear stress (MPa)
    allowableTauKey?: number;       // Allowable shear stress (MPa)
    isSafe?: boolean;               // Overall stress safety
    fitClass?: KeywayFitClass;      // Fit tolerance class
    shaftToleranceStr?: string;     // e.g. "12 P9 (-0.018 / -0.054)"
    hubToleranceStr?: string;       // e.g. "12 JS9 (±0.018)"
    language?: Language;
    hideLegend?: boolean;
    initialViewMode?: KeywayViewMode;
}

export type KeywayViewMode = 'transverse' | 'longitudinal' | 'machining';

export default function KeywayVisualizer({
    d,
    b,
    h,
    t1,
    t2,
    r = 0.4,
    keyLength,
    effectiveLength,
    keyForm,
    keyCount = 1,
    doubleKeyAngle = 180,
    torque = 450,
    tangentialForce = 22500,
    pHub = 75,
    allowablePHub = 100,
    tauKey = 35,
    allowableTauKey = 90,
    isSafe = true,
    fitClass = 'normal',
    shaftToleranceStr = 'P9',
    hubToleranceStr = 'JS9',
    language: propLang,
    hideLegend = false,
    initialViewMode = 'transverse',
}: KeywayVisualizerProps) {
    const { language: storeLang } = useI18nStore();
    const language = propLang || storeLang;
    const [viewMode, setViewMode] = useState<KeywayViewMode>(initialViewMode);
    const [showForces, setShowForces] = useState<boolean>(true);
    const [showAssembly, setShowAssembly] = useState<boolean>(true);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    useEffect(() => {
        if (initialViewMode) setViewMode(initialViewMode);
    }, [initialViewMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    const rawId = React.useId().replace(/:/g, '');
    const hatchShaftId = `hatch-shaft-${rawId}`;
    const hatchHubId = `hatch-hub-${rawId}`;
    const arrowCyanId = `arrow-cyan-${rawId}`;
    const arrowAmberId = `arrow-amber-${rawId}`;
    const arrowRedId = `arrow-red-${rawId}`;
    const arrowGreenId = `arrow-green-${rawId}`;

    const precision = useGlobalPrecision();
    // Workshop inspection measurements per DIN 6885
    const shaftInspectionDim = formatEngineeringValue(d - t1, Math.min(precision, 2), false); // Caliper measurement across bottom of shaft groove
    const hubInspectionDim = formatEngineeringValue(d + t2, Math.min(precision, 2), false);   // Caliper measurement across ceiling of hub groove
    const radialClearance = Math.max(0.1, +(t1 + t2 - h).toFixed(2)); // Standard radial clearance above key

    const vbW = hideLegend ? 720 : 1060;
    const vbH = 460;

    return (
        <div className={isFullscreen
            ? "fixed inset-0 z-[9999] bg-[var(--bg-0)] flex flex-col p-3 sm:p-5 overflow-hidden font-sans select-none"
            : "w-full flex flex-col bg-[var(--bg-0)] border border-[var(--line)] rounded-2xl overflow-hidden shadow-2xl font-sans select-none"
        }>
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[var(--bg-1)] border-b border-[var(--line)] text-xs font-mono">
                {/* View Switcher Pills */}
                <div className="flex items-center gap-1 bg-[var(--bg-2)] p-1 rounded-xl border border-[var(--line)]">
                    <button
                        type="button"
                        onClick={() => setViewMode('transverse')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            viewMode === 'transverse'
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm '
                                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                        }`}
                    >
                        {t12(language, 'Transverse Section (A-A)', 'Enine Montaj Kesiti (A-A)')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('longitudinal')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            viewMode === 'longitudinal'
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm '
                                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                        }`}
                    >
                        {t12(language, 'Longitudinal Section', 'Boyuna Kesit')} (Form {keyForm} & L)
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('machining')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            viewMode === 'machining'
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm '
                                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                        }`}
                    >
                        {t12(language, 'Workshop Machining & Tolerance', 'Atölye İmalat & Tolerans')}
                    </button>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Zoom Stepper */}
                    <div className="flex items-center gap-1 bg-[var(--bg-2)] px-1.5 py-0.5 rounded-lg border border-[var(--line)]">
                        <button
                            type="button"
                            onClick={() => setZoomLevel(z => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                            disabled={zoomLevel <= 0.7}
                            className="p-1 text-[var(--alu-dim)] hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors cursor-pointer"
                            title={t12(language, 'Zoom Out', 'Küçült')}
                            aria-label="Zoom Out"
                        >
                            <ZoomOut size={13} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoomLevel(1)}
                            className="px-1 text-[11px] font-bold text-[var(--cyan)] hover:text-[var(--cyan)] min-w-[34px] text-center cursor-pointer"
                            title={t12(language, 'Reset Zoom (100%)', 'Yakınlaştırmayı Sıfırla (%100)')}
                        >
                            {Math.round(zoomLevel * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoomLevel(z => Math.min(2.5, +(z + 0.15).toFixed(2)))}
                            disabled={zoomLevel >= 2.5}
                            className="p-1 text-[var(--alu-dim)] hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors cursor-pointer"
                            title={t12(language, 'Zoom In', 'Büyüt')}
                            aria-label="Zoom In"
                        >
                            <ZoomIn size={13} />
                        </button>
                    </div>

                    {/* Fullscreen / Inspect Button */}
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isFullscreen
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
                        }`}
                        title={isFullscreen ? t12(language, 'Exit Fullscreen (Esc)', 'Tam Ekrandan Çık (Esc)') : t12(language, 'Fullscreen High-Res Blueprint', 'Tam Ekran Yüksek Çözünürlük')}
                    >
                        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        <span className="hidden sm:inline">{isFullscreen ? t12(language, 'Exit', 'Çıkış') : t12(language, 'Inspect', 'Büyüt')}</span>
                    </button>

                    {viewMode === 'transverse' && (
                        <button
                            type="button"
                            onClick={() => setShowForces(!showForces)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                showForces
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)] hover:text-[var(--ink)]'
                            }`}
                            title={t12(language, 'Toggle Force & Stress Vectors', 'Kuvvet ve Gerilme Vektörlerini Aç/Kapat')}
                        >
                            <Zap size={13} className={showForces ? 'text-amber-400' : 'text-[var(--muted)]'} />
                            <span>{t12(language, 'Forces', 'Kuvvetler')}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowAssembly(!showAssembly)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            showAssembly
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)] hover:text-[var(--ink)]'
                        }`}
                        title={t12(language, 'Toggle Key Assembly', 'Kama Montajını Göster/Gizle')}
                    >
                        {showAssembly ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>{t12(language, 'Key', 'Kama')}</span>
                    </button>
                    <span className="text-[10px] text-[var(--muted)] font-mono px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] hidden sm:inline">
                        DIN 6885-1
                    </span>
                </div>
            </div>

            {/* SVG Engineering Blueprint Canvas */}
            <div className={`relative w-full bg-[var(--bg-0)] p-2 sm:p-4 overflow-auto flex items-center justify-center ${
                isFullscreen ? 'flex-1 h-full min-h-0' : 'min-h-[380px] lg:min-h-[460px]'
            }`}>
                <div
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease-out',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg
                        viewBox={`0 0 ${vbW} ${vbH}`}
                        className={isFullscreen ? "w-full h-full max-h-[85vh]" : "w-full h-full max-h-[520px]"}
                        preserveAspectRatio="xMidYMid meet"
                    >
                    <defs>
                        {/* Engineering Blueprint Grid */}
                        <pattern id={`cadGrid-${rawId}`} width="20" height="20" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="20" y2="0" stroke="var(--cyan)" strokeWidth="0.4" strokeOpacity="0.09" />
                            <line x1="0" y1="0" x2="0" y2="20" stroke="var(--cyan)" strokeWidth="0.4" strokeOpacity="0.09" />
                        </pattern>

                        {/* +45 Deg Shaft Steel Cross-Hatch */}
                        <pattern id={hatchShaftId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="var(--cyan)" strokeWidth="1.2" opacity="0.4" />
                        </pattern>

                        {/* -45 Deg Hub Cast Steel Cross-Hatch */}
                        <pattern id={hatchHubId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="var(--warn)" strokeWidth="1.1" opacity="0.4" />
                        </pattern>

                        {/* Dimension Arrowheads */}
                        <marker id={arrowCyanId} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="var(--cyan)" />
                        </marker>
                        <marker id={arrowAmberId} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="var(--warn)" />
                        </marker>
                        <marker id={arrowRedId} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="var(--bad)" />
                        </marker>
                        <marker id={arrowGreenId} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="var(--ok)" />
                        </marker>

                        {/* Realistic Metallic Gradients */}
                        <linearGradient id={`keyMetalGrad-${rawId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="35%" stopColor="#38bdf8" />
                            <stop offset="70%" stopColor="#0369a1" />
                            <stop offset="100%" stopColor="#082f49" />
                        </linearGradient>

                        <linearGradient id={`hudCardGrad-${rawId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--bg-1)" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="var(--bg-2)" stopOpacity="0.95" />
                        </linearGradient>
                    </defs>

                    {/* Canvas Background */}
                    <rect width={vbW} height={vbH} fill="var(--bg-2)" stroke="var(--line)" rx="10" />
                    <rect width={vbW} height={vbH} fill={`url(#cadGrid-${rawId})`} />
                    <rect x="10" y="10" width={vbW - 20} height={vbH - 20} fill="none" stroke="var(--line)" strokeWidth="1.5" rx="6" />

                    {/* RENDER ACTIVE CAD VIEW */}
                    {viewMode === 'transverse' && (
                        <TransverseSectionView
                            d={d}
                            b={b}
                            h={h}
                            t1={t1}
                            t2={t2}
                            keyCount={keyCount}
                            doubleKeyAngle={doubleKeyAngle}
                            showForces={showForces}
                            showAssembly={showAssembly}
                            torque={torque}
                            tangentialForce={tangentialForce}
                            pHub={pHub}
                            allowablePHub={allowablePHub}
                            tauKey={tauKey}
                            allowableTauKey={allowableTauKey}
                            isSafe={isSafe}
                            shaftInspectionDim={shaftInspectionDim}
                            hubInspectionDim={hubInspectionDim}
                            radialClearance={radialClearance}
                            hatchShaftId={hatchShaftId}
                            hatchHubId={hatchHubId}
                            arrowCyanId={arrowCyanId}
                            arrowAmberId={arrowAmberId}
                            arrowRedId={arrowRedId}
                            keyMetalGradId={`keyMetalGrad-${rawId}`}
                            language={language}
                            hideLegend={hideLegend}
                        />
                    )}

                    {viewMode === 'longitudinal' && (
                        <LongitudinalSectionView
                            d={d}
                            b={b}
                            h={h}
                            t1={t1}
                            t2={t2}
                            keyLength={keyLength}
                            effectiveLength={effectiveLength}
                            keyForm={keyForm}
                            showAssembly={showAssembly}
                            hatchShaftId={hatchShaftId}
                            hatchHubId={hatchHubId}
                            arrowCyanId={arrowCyanId}
                            arrowAmberId={arrowAmberId}
                            keyMetalGradId={`keyMetalGrad-${rawId}`}
                            language={language}
                            hideLegend={hideLegend}
                        />
                    )}

                    {viewMode === 'machining' && (
                        <MachiningWorkshopView
                            d={d}
                            b={b}
                            h={h}
                            t1={t1}
                            t2={t2}
                            r={r}
                            keyLength={keyLength}
                            effectiveLength={effectiveLength}
                            keyForm={keyForm}
                            fitClass={fitClass}
                            shaftToleranceStr={shaftToleranceStr}
                            hubToleranceStr={hubToleranceStr}
                            shaftInspectionDim={shaftInspectionDim}
                            hubInspectionDim={hubInspectionDim}
                            hatchShaftId={hatchShaftId}
                            hatchHubId={hatchHubId}
                            arrowCyanId={arrowCyanId}
                            arrowAmberId={arrowAmberId}
                            language={language}
                            hideLegend={hideLegend}
                        />
                    )}

                    {/* Right CAD Technical Info Overlay Card (Rendered only when not embedded with external specs) */}
                    {!hideLegend && (
                        <g transform="translate(810, 20)">
                            <rect
                                x="0"
                                y="0"
                                width="230"
                                height="420"
                                rx="12"
                                fill={`url(#hudCardGrad-${rawId})`}
                                stroke="var(--cyan)"
                                strokeWidth="1"
                                strokeOpacity="0.3"
                            />
                            <rect x="0" y="0" width="230" height="34" rx="12" fill="var(--cyan)" fillOpacity="0.1" />
                            <text x="14" y="22" fontSize="11" fontWeight="900" fill="var(--cyan)" fontFamily="ui-monospace, monospace" letterSpacing="0.08em">
                                {t12(language, 'TECHNICAL SPECS & CHECK', 'TEKNİK ÖLÇÜLER & KONTROL')}
                            </text>
                            <line x1="0" y1="34" x2="230" y2="34" stroke="var(--cyan)" strokeWidth="1" strokeOpacity="0.2" />

                            {/* Standard Callout */}
                            <g transform="translate(14, 50)">
                                <text x="0" y="0" fontSize="9.5" fill="var(--alu-dim)" fontFamily="monospace">
                                    {t12(language, 'STANDARD:', 'STANDART:')}
                                </text>
                                <text x="0" y="16" fontSize="11.5" fontWeight="bold" fill="var(--ink)" fontFamily="monospace">
                                    DIN 6885-1 (Form {keyForm})
                                </text>
                                <line x1="0" y1="26" x2="202" y2="26" stroke="var(--line)" />
                            </g>

                            {/* Spec Rows */}
                            <g transform="translate(14, 88)">
                                <CadLegendRow y={0} label={t12(language, 'Shaft Nominal Dia (d)', 'Mil Nominal Çapı (d)')} value={`Ø${d} mm`} highlight />
                                <CadLegendRow y={37} label={t12(language, 'Key Cross Section (b × h)', 'Kama Kesiti (b × h)')} value={`${b} × ${h} mm`} highlight color="var(--cyan)" />
                                <CadLegendRow y={74} label={t12(language, 'Key Total Length (L)', 'Kama Toplam Boyu (L)')} value={`${keyLength} mm (Form ${keyForm})`} color="var(--ink)" />
                                <CadLegendRow y={111} label={t12(language, 'Effective Bearing Length (l_e)', 'Etkin Taşıma Boyu (l_e)')} value={`${effectiveLength} mm`} color="var(--ok)" />
                                <CadLegendRow y={148} label={t12(language, 'Shaft Keyway Depth (t1)', 'Mil Kanal Derinliği (t1)')} value={`${t1} mm`} color="var(--cyan)" />
                                <CadLegendRow y={185} label={t12(language, 'Hub Keyway Depth (t2)', 'Göbek Kanal Derinliği (t2)')} value={`${t2} mm`} color="var(--warn)" />
                                <CadLegendRow y={222} label={t12(language, 'Shaft Caliper Check (d - t1)', 'Mil Ölçüm Ölçüsü (d - t1)')} value={`${shaftInspectionDim} mm`} color="var(--ink)" />
                                <CadLegendRow y={259} label={t12(language, 'Hub Caliper Check (d + t2)', 'Göbek Ölçüm (d + t2)')} value={`${hubInspectionDim} mm`} color="var(--warn)" />
                            </g>

                            {/* Projection Symbol & Standards badge */}
                            <g transform="translate(14, 388)" opacity="0.8">
                                <line x1="0" y1="0" x2="202" y2="0" stroke="rgba(255,255,255,0.08)" />
                                <circle cx="160" cy="14" r="4" fill="none" stroke="var(--line-strong)" strokeWidth="0.8" />
                                <circle cx="160" cy="14" r="8" fill="none" stroke="var(--line-strong)" strokeWidth="0.8" />
                                <path d="M 176,6 L 192,9 L 192,19 L 176,22 Z" fill="none" stroke="var(--line-strong)" strokeWidth="0.8" />
                                <text x="0" y="17" fontSize="9.5" fill="var(--alu-dim)" fontFamily="monospace">
                                    {t12(language, 'ISO 128 / METRIC', 'ISO 128 / METRİK')}
                                </text>
                            </g>
                        </g>
                    )}
                </svg>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 1: TRANSVERSE ASSEMBLY CROSS-SECTION (A-A)
// Shows full 360° hub, shaft, key(s), force vectors, clearances, caliper dims
// ═══════════════════════════════════════════════════════════════════════════

function TransverseSectionView({
    d,
    b,
    h,
    t1,
    t2,
    keyCount,
    doubleKeyAngle,
    showForces,
    showAssembly,
    torque,
    tangentialForce,
    pHub,
    allowablePHub,
    tauKey,
    allowableTauKey,
    isSafe,
    shaftInspectionDim,
    hubInspectionDim,
    radialClearance,
    hatchShaftId,
    hatchHubId,
    arrowCyanId,
    arrowAmberId,
    arrowRedId,
    keyMetalGradId,
    language,
    hideLegend = false
}: {
    d: number;
    b: number;
    h: number;
    t1: number;
    t2: number;
    keyCount: 1 | 2;
    doubleKeyAngle: 120 | 180;
    showForces: boolean;
    showAssembly: boolean;
    torque: number;
    tangentialForce: number;
    pHub: number;
    allowablePHub: number;
    tauKey: number;
    allowableTauKey: number;
    isSafe: boolean;
    shaftInspectionDim: string;
    hubInspectionDim: string;
    radialClearance: number;
    hatchShaftId: string;
    hatchHubId: string;
    arrowCyanId: string;
    arrowAmberId: string;
    arrowRedId: string;
    keyMetalGradId: string;
    language?: Language;
    hideLegend?: boolean;
}) {
    // Center coords in 720x460 (or 980x460) canvas
    const cx = hideLegend ? 360 : 350;
    const cy = 226;
    // Scale up shaft so it fills the viewbox gracefully with ample room around it
    const rShaft = 110;
    const s = rShaft / (d / 2); // Screen pixels per mm

    const bPx = Math.max(28, b * s);
    const hPx = Math.max(24, h * s);
    const t1Px = t1 * s;
    const t2Px = t2 * s;

    // Hub outer radius (Dh ≈ 1.85 * d)
    const rHub = rShaft + Math.max(46, Math.min(68, Math.round(rShaft * 0.46)));

    const halfB = bPx / 2;
    const topShaftY = cy - rShaft;
    const grooveFloorY = topShaftY + t1Px;
    const sideIntersectY = cy - Math.sqrt(Math.max(0, rShaft * rShaft - halfB * halfB));
    const hubRoofY = topShaftY - t2Px;

    const isDoubleKey = keyCount === 2;

    return (
        <g>
            {/* Centerlines */}
            <line x1={cx - rHub - 25} y1={cy} x2={cx + rHub + 25} y2={cy} stroke="var(--cyan)" strokeWidth="1" strokeDasharray="16 4 3 4" opacity="0.45" />
            <line x1={cx} y1={cy - rHub - 25} x2={cx} y2={cy + rHub + 25} stroke="var(--cyan)" strokeWidth="1" strokeDasharray="16 4 3 4" opacity="0.45" />

            {/* 1. Complete 360° Circular Hub Body (Göbek) with -45 deg hatch */}
            <path
                d={`
                    M ${cx - rHub} ${cy}
                    A ${rHub} ${rHub} 0 1 1 ${cx + rHub} ${cy}
                    A ${rHub} ${rHub} 0 0 1 ${cx - rHub} ${cy}
                    M ${cx - rShaft} ${cy}
                    A ${rShaft} ${rShaft} 0 1 0 ${cx + rShaft} ${cy}
                    A ${rShaft} ${rShaft} 0 0 0 ${cx + halfB} ${sideIntersectY}
                    L ${cx + halfB} ${hubRoofY}
                    L ${cx - halfB} ${hubRoofY}
                    L ${cx - halfB} ${sideIntersectY}
                    A ${rShaft} ${rShaft} 0 0 0 ${cx - rShaft} ${cy}
                    Z
                `}
                fill={`url(#${hatchHubId})`}
                fillRule="evenodd"
                stroke="var(--line-strong)"
                strokeWidth="1.6"
            />
            {/* Hub Outer Contour */}
            <circle cx={cx} cy={cy} r={rHub} fill="none" stroke="var(--line-strong)" strokeWidth="2" />
            {/* Hub Keyway slot outline */}
            <path
                d={`M ${cx + halfB} ${sideIntersectY} L ${cx + halfB} ${hubRoofY} L ${cx - halfB} ${hubRoofY} L ${cx - halfB} ${sideIntersectY}`}
                fill="none"
                stroke="var(--warn)"
                strokeWidth="2.2"
            />

            {/* 2. Full Shaft Body with +45 deg hatch */}
            <path
                d={`
                    M ${cx - rShaft} ${cy}
                    A ${rShaft} ${rShaft} 0 1 0 ${cx + rShaft} ${cy}
                    A ${rShaft} ${rShaft} 0 0 0 ${cx + halfB} ${sideIntersectY}
                    L ${cx + halfB} ${grooveFloorY}
                    L ${cx - halfB} ${grooveFloorY}
                    L ${cx - halfB} ${sideIntersectY}
                    A ${rShaft} ${rShaft} 0 0 0 ${cx - rShaft} ${cy}
                    Z
                `}
                fill={`url(#${hatchShaftId})`}
                stroke="var(--cyan)"
                strokeWidth="2.4"
            />

            {/* 3. Seated Primary Parallel Key (Üst Kama) */}
            {showAssembly && (
                <g>
                    {/* Key Body with Radial Top Clearance */}
                    <rect
                        x={cx - halfB + 0.6}
                        y={grooveFloorY - hPx}
                        width={bPx - 1.2}
                        height={hPx}
                        rx="3"
                        fill={`url(#${keyMetalGradId})`}
                        stroke="var(--cyan)"
                        strokeWidth="2.2"
                    />
                    {/* Bevel highlights on Key */}
                    <line x1={cx - halfB + 3} y1={grooveFloorY - hPx} x2={cx - halfB + 3} y2={grooveFloorY} stroke="var(--line)" strokeWidth="1" opacity="0.75" />
                    <line x1={cx + halfB - 3} y1={grooveFloorY - hPx} x2={cx + halfB - 3} y2={grooveFloorY} stroke="var(--line-strong)" strokeWidth="1" opacity="0.75" />

                    {/* Key Text Badge - scaled cleanly to fit key width */}
                    <text
                        x={cx}
                        y={grooveFloorY - hPx / 2 + 4}
                        textAnchor="middle"
                        fontSize={bPx >= 85 ? "11.5" : bPx >= 50 ? "10.5" : "9.5"}
                        fontWeight="900"
                        fill="var(--accent-ink)"
                        fontFamily="ui-monospace, monospace"
                    >
                        {bPx >= 85 ? `DIN 6885 (${b}×${h})` : bPx >= 50 ? `DIN 6885` : `${b}×${h}`}
                    </text>

                    {/* Shear Plane Line indicator (Kama Kayma Düzlemi) */}
                    <line
                        x1={cx - halfB}
                        y1={topShaftY}
                        x2={cx + halfB}
                        y2={topShaftY}
                        stroke="var(--bad)"
                        strokeWidth="1.6"
                        strokeDasharray="4 2"
                    />

                    {/* Radial Clearance Callout (Üst Radyal Boşluk - Routed cleanly to Top-Right without crossing b dimension) */}
                    <g>
                        <path
                            d={`M ${cx + halfB - 2} ${hubRoofY + 1} L ${cx + halfB + 24} ${hubRoofY - 38} L ${cx + halfB + 48} ${hubRoofY - 38}`}
                            fill="none"
                            stroke="var(--warn)"
                            strokeWidth="1.3"
                        />
                        <circle cx={cx + halfB - 2} cy={hubRoofY + 1} r="2.5" fill="var(--warn)" />
                        <rect x={cx + halfB + 48} y={hubRoofY - 50} width="124" height="24" rx="5" fill="var(--bg-1)" stroke="var(--warn)" strokeWidth="1.2" />
                        <text x={cx + halfB + 110} y={hubRoofY - 34} fill="var(--warn)" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace" textAnchor="middle">
                            {t12(language, 'Clearance c = ', 'Boşluk c = ')}{radialClearance} mm
                        </text>
                    </g>
                </g>
            )}

            {/* 4. Second Key if Key Count is 2 */}
            {isDoubleKey && (
                <g transform={`rotate(${doubleKeyAngle}, ${cx}, ${cy})`}>
                    <path
                        d={`M ${cx - halfB} ${sideIntersectY} L ${cx - halfB} ${grooveFloorY} L ${cx + halfB} ${grooveFloorY} L ${cx + halfB} ${sideIntersectY}`}
                        fill="var(--bg-2)"
                        stroke="var(--cyan)"
                        strokeWidth="2"
                    />
                    <path
                        d={`M ${cx - halfB} ${sideIntersectY} L ${cx - halfB} ${hubRoofY} L ${cx + halfB} ${hubRoofY} L ${cx + halfB} ${sideIntersectY}`}
                        fill="var(--bg-2)"
                        stroke="var(--warn)"
                        strokeWidth="2"
                    />
                    {showAssembly && (
                        <g>
                            <rect
                                x={cx - halfB + 0.6}
                                y={grooveFloorY - hPx}
                                width={bPx - 1.2}
                                height={hPx}
                                rx="3"
                                fill={`url(#${keyMetalGradId})`}
                                stroke="var(--cyan)"
                                strokeWidth="2.2"
                            />
                            <text x={cx} y={grooveFloorY - hPx / 2 + 4.5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--ink)" fontFamily="ui-monospace, monospace">
                                {t12(language, '2nd Key', '2. Kama')}
                            </text>
                        </g>
                    )}
                </g>
            )}

            {/* 5. Force & Pressure Vector Overlays (Dynamic Mechanics) */}
            {showForces && (
                <g>
                    {/* Pressure telemetry callout HUD card in open top-left quadrant */}
                    <g transform="translate(18, 16)">
                        <rect width="168" height="44" rx="8" fill="var(--bg-1)" stroke={pHub <= allowablePHub ? '#10b981' : '#f43f5e'} strokeWidth="1.4" />
                        <text x="10" y="16" fill="var(--alu-dim)" fontSize="10" fontWeight="bold" fontFamily="ui-monospace, monospace">
                            {t12(language, 'HUB PRESSURE (p_hub):', 'GÖBEK BASINCI (p_hub):')}
                        </text>
                        <text x="10" y="34" fill={pHub <= allowablePHub ? '#10b981' : '#f43f5e'} fontSize="13" fontWeight="900" fontFamily="ui-monospace, monospace">
                            {pHub.toFixed(1)} MPa <tspan fill="var(--alu-dim)" fontSize="10" fontWeight="normal">/ {allowablePHub} MPa</tspan>
                        </text>
                    </g>

                    {/* Torque Direction Curved Arrow centered in lower shaft body */}
                    <g transform={`translate(${cx}, ${cy})`}>
                        <path
                            d="M -48 26 A 54 54 0 0 0 48 26"
                            fill="none"
                            stroke="var(--cyan)"
                            strokeWidth="2.4"
                            markerEnd={`url(#${arrowCyanId})`}
                        />
                        <rect x="-60" y="38" width="120" height="22" rx="5" fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth="1.2" />
                        <text x="0" y="53" textAnchor="middle" fill="var(--cyan)" fontSize="11.5" fontWeight="bold" fontFamily="ui-monospace, monospace">
                            T = {torque} N·m
                        </text>
                    </g>

                    {/* Tangential Force Vector Ft on Key Flank (Placed cleanly below t2 extension line, zero collision) */}
                    <line
                        x1={cx + halfB + 140}
                        y1={topShaftY + 18}
                        x2={cx + halfB + 6}
                        y2={topShaftY + 18}
                        stroke="var(--bad)"
                        strokeWidth="3"
                        markerEnd={`url(#${arrowRedId})`}
                    />
                    <rect x={cx + halfB + 65} y={topShaftY + 28} width="112" height="22" rx="5" fill="var(--bg-1)" stroke="var(--bad)" strokeWidth="1.2" />
                    <text x={cx + halfB + 121} y={topShaftY + 43} textAnchor="middle" fill="var(--bad)" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">
                        F_t = {tangentialForce.toFixed(0)} N
                    </text>

                    {/* Contact Surface Pressure Highlight on Hub (t2) */}
                    <rect
                        x={cx + halfB - 2}
                        y={hubRoofY}
                        width="4"
                        height={t2Px}
                        fill="var(--warn)"
                        opacity="0.9"
                    />
                    {/* Contact Surface Pressure Highlight on Shaft (t1) */}
                    <rect
                        x={cx - halfB - 2}
                        y={topShaftY}
                        width="4"
                        height={t1Px}
                        fill="var(--cyan)"
                        opacity="0.9"
                    />
                </g>
            )}

            {/* 6. Precision Technical Dimensions (ISO standard placement outside hatching) */}

            {/* 6a. Key Width b */}
            <HorizDim
                x1={cx - halfB}
                x2={cx + halfB}
                y={hubRoofY - 26}
                extY1={hubRoofY}
                label={`b = ${b} P9`}
                color="var(--cyan)"
                arrowId={arrowCyanId}
            />

            {/* 6b. Shaft Keyway Depth t1 (Left Side of Key) */}
            <VertDim
                x={cx - halfB - 38}
                y1={topShaftY}
                y2={grooveFloorY}
                extX1={cx - halfB}
                label={`t1 = ${t1}`}
                color="var(--cyan)"
                arrowId={arrowCyanId}
            />

            {/* 6c. Hub Keyway Depth t2 (Right Side of Key) */}
            <VertDim
                x={cx + halfB + 38}
                y1={hubRoofY}
                y2={topShaftY}
                extX1={cx + halfB}
                label={`t2 = ${t2}`}
                color="var(--warn)"
                arrowId={arrowAmberId}
            />

            {/* 6d. Caliper Inspection Dimension (d - t1) on Shaft - Outside Hub Perimeter */}
            <g transform={`translate(${cx - rHub - 24}, 0)`}>
                <line x1="0" y1={grooveFloorY} x2="-14" y2={grooveFloorY} stroke="var(--line-strong)" strokeWidth="1" />
                <line x1="0" y1={cy + rShaft} x2="-14" y2={cy + rShaft} stroke="var(--line-strong)" strokeWidth="1" />
                <line x1="-7" y1={grooveFloorY} x2="-7" y2={cy + rShaft} stroke="var(--cyan)" strokeWidth="1.3" markerStart={`url(#${arrowCyanId})`} markerEnd={`url(#${arrowCyanId})`} />
                <rect x="-106" y={(grooveFloorY + cy + rShaft) / 2 - 13} width="98" height="26" fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth="1.3" rx="5" />
                <text x="-57" y={(grooveFloorY + cy + rShaft) / 2 + 5} fill="var(--cyan)" fontSize="12" fontWeight="900" fontFamily="ui-monospace, monospace" textAnchor="middle">
                    d-t1 = {shaftInspectionDim}
                </text>
            </g>

            {/* 6e. Caliper Inspection Dimension (d + t2) on Hub - Outside Hub Perimeter */}
            <g transform={`translate(${cx + rHub + 24}, 0)`}>
                <line x1="0" y1={hubRoofY} x2="14" y2={hubRoofY} stroke="var(--line-strong)" strokeWidth="1" />
                <line x1="0" y1={cy + rShaft} x2="14" y2={cy + rShaft} stroke="var(--line-strong)" strokeWidth="1" />
                <line x1="7" y1={hubRoofY} x2="7" y2={cy + rShaft} stroke="var(--warn)" strokeWidth="1.3" markerStart={`url(#${arrowAmberId})`} markerEnd={`url(#${arrowAmberId})`} />
                <rect x="10" y={(hubRoofY + cy + rShaft) / 2 - 13} width="102" height="26" fill="var(--bg-1)" stroke="var(--warn)" strokeWidth="1.3" rx="5" />
                <text x="61" y={(hubRoofY + cy + rShaft) / 2 + 5} fill="var(--warn)" fontSize="12" fontWeight="900" fontFamily="ui-monospace, monospace" textAnchor="middle">
                    d+t2 = {hubInspectionDim}
                </text>
            </g>

            {/* 6f. Shaft Diameter Callout */}
            <g transform={`translate(${cx}, ${cy + rShaft + 22})`}>
                <rect x="-72" y="-12" width="144" height="24" rx="5" fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth="1.3" />
                <text x="0" y="5" textAnchor="middle" fill="var(--cyan)" fontSize={12} fontWeight="900" fontFamily="ui-monospace, monospace">
                    {t12(language, 'Shaft Ø', 'Mil Ø')}{d} mm (h9)
                </text>
            </g>

            {/* 6g. Hub Outer Diameter Callout */}
            <g transform={`translate(${cx}, ${cy + rHub + 22})`}>
                <text x="0" y="0" textAnchor="middle" fill="var(--alu-dim)" fontSize="11" fontFamily="ui-monospace, monospace">
                    {t12(language, 'Hub Outer Dia ≈ Ø', 'Göbek Dış Çapı ≈ Ø')}{Math.round(d * 1.85)} mm
                </text>
            </g>
        </g>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 2: LONGITUDINAL SECTION VIEW (B-B)
// Shows Form A (round ends) vs Form B (square ends), key length L, effective length
// ═══════════════════════════════════════════════════════════════════════════

function LongitudinalSectionView({
    d,
    b,
    h,
    t1,
    t2,
    keyLength,
    effectiveLength,
    keyForm,
    showAssembly,
    hatchShaftId,
    hatchHubId,
    arrowCyanId,
    arrowAmberId,
    keyMetalGradId,
    language,
    hideLegend = false
}: {
    d: number;
    b: number;
    h: number;
    t1: number;
    t2: number;
    keyLength: number;
    effectiveLength: number;
    keyForm: KeyForm;
    showAssembly: boolean;
    hatchShaftId: string;
    hatchHubId: string;
    arrowCyanId: string;
    arrowAmberId: string;
    keyMetalGradId: string;
    language?: Language;
    hideLegend?: boolean;
}) {
    const cx = hideLegend ? 360 : 350;
    const cy = 236;

    // Longitudinal scaling - larger, prominent and perfectly proportioned
    const maxL = Math.max(keyLength, 80);
    const sL = Math.min(3.4, 340 / maxL);
    const lPx = Math.round(keyLength * sL);
    const bPx = Math.max(26, Math.min(42, Math.round(b * 2.2)));
    const hPx = Math.max(30, Math.min(46, Math.round(h * 2.8)));
    const t1Px = Math.round(hPx * 0.6);
    const t2Px = Math.round(hPx * 0.4);

    const shaftLen = 520;
    const shaftH = 100;
    const hubLen = Math.min(shaftLen - 50, lPx + 100);
    const hubTopY = cy - Math.round(shaftH / 2) - 80;

    const startX = cx - Math.round(lPx / 2);
    const endX = startX + lPx;
    const keyTopY = cy - Math.round(shaftH / 2) - (hPx - t1Px);

    const isFormA = keyForm === 'A';
    const endRadius = Math.round(bPx / 2);

    return (
        <g>
            {/* Shaft Centerline */}
            <line x1={cx - shaftLen / 2 - 25} y1={cy} x2={cx + shaftLen / 2 + 25} y2={cy} stroke="var(--cyan)" strokeWidth="1" strokeDasharray="16 4 3 4" opacity="0.6" />

            {/* Upper Hub Section (Mounted over shaft) */}
            <path
                d={`
                    M ${cx - hubLen / 2} ${cy - shaftH / 2}
                    L ${cx - hubLen / 2} ${hubTopY}
                    L ${cx + hubLen / 2} ${hubTopY}
                    L ${cx + hubLen / 2} ${cy - shaftH / 2}
                    L ${endX + 10} ${cy - shaftH / 2}
                    L ${endX + 10} ${cy - shaftH / 2 - t2Px}
                    L ${startX - 10} ${cy - shaftH / 2 - t2Px}
                    L ${startX - 10} ${cy - shaftH / 2}
                    Z
                `}
                fill={`url(#${hatchHubId})`}
                stroke="var(--line-strong)"
                strokeWidth="1.4"
            />
            {/* Hub Section Label positioned on top-left of hub */}
            <text x={cx - hubLen / 2 + (hideLegend ? 70 : 85)} y={hubTopY + 16} fill="var(--warn)" fontSize={hideLegend ? "10.5" : "12"} fontWeight="bold" fontFamily="ui-monospace, monospace" textAnchor="middle">
                {t12(language, 'HUB SECTION (GÖBEK)', 'GÖBEK KESİTİ (HUB)')}
            </text>

            {/* Shaft Body Longitudinal */}
            <g>
                <rect
                    x={cx - shaftLen / 2}
                    y={cy - shaftH / 2}
                    width={shaftLen}
                    height={shaftH}
                    fill={`url(#${hatchShaftId})`}
                    stroke="var(--cyan)"
                    strokeWidth="2"
                />
                {/* Machined Keyseat Pocket in Shaft */}
                <rect
                    x={startX}
                    y={cy - shaftH / 2}
                    width={lPx}
                    height={t1Px}
                    fill="var(--bg-1)"
                    stroke="var(--cyan)"
                    strokeWidth="1.8"
                />
            </g>

            {/* Key Seated in Pocket */}
            {showAssembly && (
                <g>
                    {isFormA ? (
                        /* Form A: Round Ends (Parmak freze yuvarlak uçlu) */
                        <path
                            d={`
                                M ${startX + endRadius} ${keyTopY}
                                L ${endX - endRadius} ${keyTopY}
                                A ${endRadius} ${hPx / 2} 0 0 1 ${endX - endRadius} ${keyTopY + hPx}
                                L ${startX + endRadius} ${keyTopY + hPx}
                                A ${endRadius} ${hPx / 2} 0 0 1 ${startX + endRadius} ${keyTopY}
                                Z
                            `}
                            fill={`url(#${keyMetalGradId})`}
                            stroke="var(--cyan)"
                            strokeWidth="2.2"
                        />
                    ) : (
                        /* Form B: Flat Square Ends (Disk freze düz uçlu) */
                        <rect
                            x={startX}
                            y={keyTopY}
                            width={lPx}
                            height={hPx}
                            rx="2"
                            fill={`url(#${keyMetalGradId})`}
                            stroke="var(--cyan)"
                            strokeWidth="2.2"
                        />
                    )}

                    {/* Top highlight line on Key */}
                    <line x1={startX + 6} y1={keyTopY + 3} x2={endX - 6} y2={keyTopY + 3} stroke="var(--line)" strokeWidth="1" opacity="0.75" />
                    <text
                        x={cx}
                        y={keyTopY + hPx / 2 + 4}
                        fill="var(--accent-ink)"
                        fontSize={lPx >= 180 ? "11.5" : "10"}
                        fontWeight="900"
                        fontFamily="ui-monospace, monospace"
                        textAnchor="middle"
                    >
                        {lPx >= 190 ? `DIN 6885-1 Form ${keyForm}` : `DIN 6885-1`}
                    </text>
                </g>
            )}

            {/* Hierarchical Dimensions: Shorter (l_e) Closer, Longer (L) Outside */}
            {/* 1. Effective Bearing Length (l_e) */}
            {isFormA ? (
                /* Form A: l_e = L - b */
                <g>
                    <HorizDim
                        x1={startX + endRadius}
                        x2={endX - endRadius}
                        y={keyTopY - 28}
                        extY1={keyTopY}
                        label={`l_e = ${effectiveLength} mm`}
                        color="var(--ok)"
                        arrowId={arrowCyanId}
                    />
                    {/* End-mill radius annotations & leader */}
                    <line x1={startX + endRadius} y1={keyTopY} x2={startX + endRadius} y2={keyTopY + hPx} stroke="var(--ok)" strokeWidth="1.2" strokeDasharray="3 3" />
                    <line x1={endX - endRadius} y1={keyTopY} x2={endX - endRadius} y2={keyTopY + hPx} stroke="var(--ok)" strokeWidth="1.2" strokeDasharray="3 3" />
                    <g>
                        <path
                            d={`M ${startX + 3} ${keyTopY + hPx / 2} L ${startX - 30} ${keyTopY + hPx / 2 - 20} L ${startX - 55} ${keyTopY + hPx / 2 - 20}`}
                            fill="none"
                            stroke="var(--warn)"
                            strokeWidth="1.4"
                        />
                        <circle cx={startX + 3} cy={keyTopY + hPx / 2} r="2.5" fill="var(--warn)" />
                        <rect x={startX - 118} y={keyTopY + hPx / 2 - 32} width="62" height="24" rx="5" fill="var(--bg-1)" stroke="var(--warn)" strokeWidth="1.2" />
                        <text x={startX - 87} y={keyTopY + hPx / 2 - 16} fill="var(--warn)" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace" textAnchor="middle">
                            R = {+(b / 2).toFixed(1)}
                        </text>
                    </g>
                </g>
            ) : (
                /* Form B: l_e = L */
                <g transform={`translate(${cx}, ${keyTopY - 28})`}>
                    <rect x="-95" y="-12" width="190" height="24" rx="5" fill="var(--bg-1)" stroke="var(--ok)" strokeWidth="1.3" />
                    <text x="0" y="5" fill="var(--ok)" fontSize="11.5" fontWeight="bold" fontFamily="ui-monospace, monospace" textAnchor="middle">
                        {t12(language, 'Form B: l_e = L = ', 'Form B: l_e = L = ')}{effectiveLength} mm
                    </text>
                </g>
            )}

            {/* 2. Key Total Length (L) - Above l_e */}
            <HorizDim
                x1={startX}
                x2={endX}
                y={keyTopY - 62}
                extY1={keyTopY}
                label={`${t12(language, 'Key Length L = ', 'Kama Boyu L = ')}${keyLength} mm`}
                color="var(--cyan)"
                arrowId={arrowCyanId}
            />

            {/* Shaft Diameter Dimension on Left */}
            <VertDim
                x={cx - shaftLen / 2 - 32}
                y1={cy - shaftH / 2}
                y2={cy + shaftH / 2}
                extX1={cx - shaftLen / 2}
                label={`Ø${d}`}
                color="var(--cyan)"
                arrowId={arrowCyanId}
            />

            {/* Key Height Dimension on Right */}
            <VertDim
                x={endX + 46}
                y1={keyTopY}
                y2={keyTopY + hPx}
                extX1={endX}
                label={`h = ${h}`}
                color="var(--ink)"
                arrowId={arrowCyanId}
            />

            {/* Information Banner at Bottom */}
            <g transform={`translate(${cx - 260}, ${cy + shaftH / 2 + 20})`}>
                <rect width="520" height="44" rx="8" fill="var(--bg-1)" stroke="var(--line)" strokeWidth="1.2" />
                <text x="14" y="16" fill="var(--alu-dim)" fontSize="10" fontFamily="ui-monospace, monospace">
                    {t12(language, 'MANUFACTURING & FIT NOTE:', 'İMALAT & MONTAJ NOTU:')}
                </text>
                <text x="14" y="32" fill="var(--ink)" fontSize="11.5" fontWeight="bold" fontFamily="ui-monospace, monospace">
                    {isFormA
                        ? t12(language, `Form A: Fits closed keyseat milled with DIN 844 end mill (l_e = L - b = ${effectiveLength} mm).`, `Form A: DIN 844 parmak frezeyle açılan kapalı kanala oturur (l_e = L - b = ${effectiveLength} mm).`)
                        : t12(language, `Form B: Mounted into through-keyway cut with slotting cutter (l_e = L = ${effectiveLength} mm).`, `Form B: Disk frezeyle açılan boydan kanala monte edilir (l_e = L = ${effectiveLength} mm).`)}
                </text>
            </g>
        </g>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 3: MACHINING & WORKSHOP TOLERANCE VIEW
// Detailed split inspection drawing for shaft keyseat and hub keyway
// ═══════════════════════════════════════════════════════════════════════════

function MachiningWorkshopView({
    d,
    b,
    h,
    t1,
    t2,
    r,
    keyLength,
    effectiveLength,
    keyForm,
    fitClass,
    shaftToleranceStr,
    hubToleranceStr,
    shaftInspectionDim,
    hubInspectionDim,
    hatchShaftId,
    hatchHubId,
    arrowCyanId,
    arrowAmberId,
    language,
    hideLegend = false
}: {
    d: number;
    b: number;
    h: number;
    t1: number;
    t2: number;
    r: number;
    keyLength: number;
    effectiveLength: number;
    keyForm: KeyForm;
    fitClass: KeywayFitClass;
    shaftToleranceStr: string;
    hubToleranceStr: string;
    shaftInspectionDim: string;
    hubInspectionDim: string;
    hatchShaftId: string;
    hatchHubId: string;
    arrowCyanId: string;
    arrowAmberId: string;
    language?: Language;
    hideLegend?: boolean;
}) {
    const cardW = hideLegend ? 360 : 345;
    const cardH = hideLegend ? 410 : 400;
    const card1X = hideLegend ? 26 : 0;
    const card2X = hideLegend ? 414 : 385;
    const rootTransform = hideLegend ? "translate(0, 16)" : "translate(35, 20)";

    const halfSlotB = hideLegend ? 18 : 24;

    return (
        <g transform={rootTransform}>
            {/* LEFT CARD: SHAFT KEYWAY (MİL KANALI) */}
            <g transform={`translate(${card1X}, 10)`}>
                <rect width={cardW} height={cardH} rx="12" fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth="1.2" strokeOpacity="0.4" />
                <rect width={cardW} height="32" rx="12" fill="var(--cyan)" fillOpacity="0.1" />
                <text x="14" y="21" fill="var(--cyan)" fontSize={hideLegend ? "10.5" : "12"} fontWeight="bold" fontFamily="ui-monospace, monospace">
                    {t12(language, '1. SHAFT KEYSEAT (MİL)', '1. MİL KAMA KANALI İMALATI')}
                </text>

                {/* Shaft End Cross Section */}
                <g transform={`translate(${cardW / 2}, ${hideLegend ? 130 : 145})`}>
                    <circle cx="0" cy="0" r={hideLegend ? 54 : 68} fill={`url(#${hatchShaftId})`} stroke="var(--cyan)" strokeWidth="2" />
                    {/* Keyway slot */}
                    <path
                        d={`M ${-halfSlotB} ${hideLegend ? -52 : -64} L ${-halfSlotB} ${hideLegend ? -26 : -32} L ${halfSlotB} ${hideLegend ? -26 : -32} L ${halfSlotB} ${hideLegend ? -52 : -64}`}
                        fill="var(--bg-2)"
                        stroke="var(--cyan)"
                        strokeWidth="2"
                    />
                    <line x1={hideLegend ? -70 : -85} y1="0" x2={hideLegend ? 70 : 85} y2="0" stroke="var(--cyan)" strokeWidth="0.8" strokeDasharray="6 3" opacity="0.5" />
                    <line x1="0" y1={hideLegend ? -70 : -85} x2="0" y2={hideLegend ? 70 : 85} stroke="var(--cyan)" strokeWidth="0.8" strokeDasharray="6 3" opacity="0.5" />
                    {/* Slot dimension callouts */}
                    <line x1={-halfSlotB} y1={hideLegend ? -62 : -75} x2={halfSlotB} y2={hideLegend ? -62 : -75} stroke="var(--cyan)" strokeWidth="1.2" markerStart={`url(#${arrowCyanId})`} markerEnd={`url(#${arrowCyanId})`} />
                    <text x="0" y={hideLegend ? -68 : -81} textAnchor="middle" fill="var(--cyan)" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">b = {b}</text>
                </g>

                {/* Inspection Specs */}
                <g transform={`translate(${hideLegend ? 14 : 18}, ${hideLegend ? 220 : 250})`}>
                    <text x="0" y="0" fill="var(--alu-dim)" fontSize="10.5" fontFamily="ui-monospace, monospace">
                        {t12(language, 'Width Tolerance:', 'Genişlik Toleransı:')}
                    </text>
                    <text x="0" y="18" fill="var(--cyan)" fontSize={hideLegend ? "13" : "14"} fontWeight="bold" fontFamily="ui-monospace, monospace">{b} {shaftToleranceStr}</text>

                    <text x="0" y="42" fill="var(--alu-dim)" fontSize="10.5" fontFamily="ui-monospace, monospace">
                        {t12(language, 'Keyway Depth (t1):', 'Kanal Derinliği (t1):')}
                    </text>
                    <text x="0" y="60" fill="var(--ink)" fontSize={hideLegend ? "13" : "14"} fontWeight="bold" fontFamily="ui-monospace, monospace">{t1} mm (+0.2 mm)</text>

                    <text x="0" y="84" fill="var(--alu-dim)" fontSize="10.5" fontFamily="ui-monospace, monospace">
                        {t12(language, 'Micrometer Check (d - t1):', 'Mikrometre Kontrolü (d - t1):')}
                    </text>
                    <text x="0" y="102" fill="var(--cyan)" fontSize={hideLegend ? "14" : "15"} fontWeight="900" fontFamily="ui-monospace, monospace">{shaftInspectionDim} mm</text>
                </g>
            </g>

            {/* RIGHT CARD: HUB KEYWAY (GÖBEK KANALI) */}
            <g transform={`translate(${card2X}, 10)`}>
                <rect width={cardW} height={cardH} rx="12" fill="var(--bg-1)" stroke="var(--warn)" strokeWidth="1.2" strokeOpacity="0.4" />
                <rect width={cardW} height="32" rx="12" fill="var(--warn)" fillOpacity="0.1" />
                <text x="14" y="21" fill="var(--warn)" fontSize={hideLegend ? "10.5" : "12"} fontWeight="bold" fontFamily="ui-monospace, monospace">
                    {t12(language, '2. HUB KEYWAY (GÖBEK)', '2. GÖBEK BROŞLAMA')}
                </text>

                {/* Hub Bore Cross Section */}
                <g transform={`translate(${cardW / 2}, ${hideLegend ? 130 : 145})`}>
                    <circle cx="0" cy="0" r={hideLegend ? 74 : 90} fill={`url(#${hatchHubId})`} stroke="var(--line)" strokeWidth="1.6" />
                    <circle cx="0" cy="0" r={hideLegend ? 50 : 65} fill="var(--bg-2)" stroke="var(--line-strong)" strokeWidth="1.4" />
                    {/* Hub keyway groove */}
                    <path
                        d={`M ${-halfSlotB} ${hideLegend ? -48 : -60} L ${-halfSlotB} ${hideLegend ? -66 : -82} L ${halfSlotB} ${hideLegend ? -66 : -82} L ${halfSlotB} ${hideLegend ? -48 : -60}`}
                        fill="var(--bg-2)"
                        stroke="var(--warn)"
                        strokeWidth="2.2"
                    />
                    <line x1={hideLegend ? -82 : -100} y1="0" x2={hideLegend ? 82 : 100} y2="0" stroke="var(--warn)" strokeWidth="0.8" strokeDasharray="6 3" opacity="0.5" />
                    <line x1="0" y1={hideLegend ? -82 : -100} x2="0" y2={hideLegend ? 82 : 100} stroke="var(--warn)" strokeWidth="0.8" strokeDasharray="6 3" opacity="0.5" />
                    {/* Slot dimension callouts */}
                    <line x1={-halfSlotB} y1={hideLegend ? -74 : -92} x2={halfSlotB} y2={hideLegend ? -74 : -92} stroke="var(--warn)" strokeWidth="1.2" markerStart={`url(#${arrowAmberId})`} markerEnd={`url(#${arrowAmberId})`} />
                    <text x="0" y={hideLegend ? -80 : -98} textAnchor="middle" fill="var(--warn)" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">b = {b}</text>
                </g>

                {/* Inspection Specs */}
                <g transform={`translate(${hideLegend ? 14 : 18}, ${hideLegend ? 220 : 250})`}>
                    <text x="0" y="0" fill="var(--alu-dim)" fontSize="10.5" fontFamily="ui-monospace, monospace">
                        {t12(language, 'Width Tolerance:', 'Genişlik Toleransı:')}
                    </text>
                    <text x="0" y="18" fill="var(--warn)" fontSize={hideLegend ? "13" : "14"} fontWeight="bold" fontFamily="ui-monospace, monospace">{b} {hubToleranceStr}</text>

                    <text x="0" y="42" fill="var(--alu-dim)" fontSize="10.5" fontFamily="ui-monospace, monospace">
                        {t12(language, 'Hub Depth (t2):', 'Göbek Derinliği (t2):')}
                    </text>
                    <text x="0" y="60" fill="var(--ink)" fontSize={hideLegend ? "13" : "14"} fontWeight="bold" fontFamily="ui-monospace, monospace">{t2} mm (+0.2 mm)</text>

                    <text x="0" y="84" fill="var(--alu-dim)" fontSize="10.5" fontFamily="ui-monospace, monospace">
                        {t12(language, 'Caliper Check (d + t2):', 'Kumpas Kontrolü (d + t2):')}
                    </text>
                    <text x="0" y="102" fill="var(--warn)" fontSize={hideLegend ? "14" : "15"} fontWeight="900" fontFamily="ui-monospace, monospace">{hubInspectionDim} mm</text>
                </g>
            </g>
        </g>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAD HELPER DRAWING PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

function CadLegendRow({
    y,
    label,
    value,
    highlight = false,
    color
}: {
    y: number;
    label: string;
    value: string;
    highlight?: boolean;
    color?: string;
}) {
    const textColor = color || (highlight ? 'var(--cyan)' : 'var(--ink)');
    return (
        <g transform={`translate(0, ${y})`}>
            <text x="0" y="0" fontSize="11" fill="var(--alu-dim)" fontFamily="ui-sans-serif, system-ui">
                {label}
            </text>
            <text x="0" y="18" fontSize="14" fontWeight="bold" fill={textColor} fontFamily="ui-monospace, monospace">
                {value}
            </text>
        </g>
    );
}

function DimBadge({ x, y, text, color = 'var(--cyan)', bg = 'var(--bg-1)' }: { x: number; y: number; text: string; color?: string; bg?: string }) {
    const w = Math.max(48, text.length * 7.8 + 14);
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect
                x={-w / 2}
                y={-11}
                width={w}
                height={22}
                rx="5"
                fill={bg}
                stroke={color}
                strokeWidth="1.2"
                strokeOpacity="0.9"
            />
            <text
                x="0"
                y="4"
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="900"
                fill={color}
                fontFamily="ui-monospace, monospace"
            >
                {text}
            </text>
        </g>
    );
}

function HorizDim({
    x1,
    x2,
    y,
    extY1,
    extY2,
    label,
    color = '#00e5ff',
    arrowId
}: {
    x1: number;
    x2: number;
    y: number;
    extY1: number;
    extY2?: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const mid = (x1 + x2) / 2;
    const y2 = extY2 ?? extY1;
    const marker = arrowId ? `url(#${arrowId})` : undefined;

    return (
        <g stroke={color} strokeWidth="1" fill="none" opacity="0.98">
            <line x1={x1} y1={extY1} x2={x1} y2={y > extY1 ? y + 5 : y - 5} stroke="var(--line-strong)" strokeWidth="1" />
            <line x1={x2} y1={y2} x2={x2} y2={y > y2 ? y + 5 : y - 5} stroke="var(--line-strong)" strokeWidth="1" />
            <line x1={x1} y1={y} x2={x2} y2={y} markerStart={marker} markerEnd={marker} stroke={color} strokeWidth="1.3" />
            <DimBadge x={mid} y={y} text={label} color={color} />
        </g>
    );
}

function VertDim({
    x,
    y1,
    y2,
    extX1,
    extX2,
    label,
    color = '#00e5ff',
    arrowId
}: {
    x: number;
    y1: number;
    y2: number;
    extX1: number;
    extX2?: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const mid = (y1 + y2) / 2;
    const x2 = extX2 ?? extX1;
    const marker = arrowId ? `url(#${arrowId})` : undefined;

    return (
        <g stroke={color} strokeWidth="1" fill="none" opacity="0.98">
            <line x1={extX1} y1={y1} x2={x > extX1 ? x + 5 : x - 5} y2={y1} stroke="var(--line-strong)" strokeWidth="1" />
            <line x1={x2} y1={y2} x2={x > x2 ? x + 5 : x - 5} y2={y2} stroke="var(--line-strong)" strokeWidth="1" />
            <line x1={x} y1={y1} x2={x} y2={y2} markerStart={marker} markerEnd={marker} stroke={color} strokeWidth="1.3" />
            <DimBadge x={x} y={mid} text={label} color={color} />
        </g>
    );
}

