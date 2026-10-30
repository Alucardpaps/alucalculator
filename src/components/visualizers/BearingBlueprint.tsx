import React, { useState } from 'react';
import { useKineticSpin } from '@/hooks/useKineticSpin';
import { BearingType, getBearingTypeInfo } from '@/data/skfBearings';
import { findSKFBearing } from '@/data/mechanical/skfCatalogDatabase';
import { calculateAbutmentDimensions, getSKFMaintenanceProtocol } from '@/data/mechanical/bearingMountingStandards';
import { getBearingsModuleUiStrings } from '@/locales/bearingsModuleUiTranslations';
import { Language } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export type BearingBlueprintViewMode = 'orbital' | 'section' | 'mounting' | 'tools';

export interface BearingBlueprintProps {
    type: BearingType;
    code: string;
    d: number;
    D: number;
    B: number;
    C?: number;
    C0?: number;
    rpm?: number;
    fr?: number;
    fa?: number;
    life?: {
        P?: number;
        P0?: number;
        L10?: number;
        L10h?: number;
        Lna?: number;
        staticSafety?: number;
    };
    capping?: 'open' | '2RSH' | '2Z';
    initialView?: BearingBlueprintViewMode;
    viewMode?: BearingBlueprintViewMode;
    onViewModeChange?: (mode: BearingBlueprintViewMode) => void;
    language?: Language;
}

export function BearingBlueprint({
    type,
    code,
    d,
    D,
    B,
    C,
    C0,
    rpm = 0,
    fr = 0,
    fa = 0,
    life,
    capping = '2RSH',
    initialView = 'orbital',
    viewMode: controlledViewMode,
    onViewModeChange,
    language = 'en',
}: BearingBlueprintProps) {
    const [internalViewMode, setInternalViewMode] = useState<BearingBlueprintViewMode>(initialView);
    const viewMode = controlledViewMode ?? internalViewMode;

    const setViewMode = (mode: BearingBlueprintViewMode) => {
        setInternalViewMode(mode);
        onViewModeChange?.(mode);
    };
    const t = getBearingsModuleUiStrings(language);
    const typeInfo = getBearingTypeInfo(type);

    const skfRecord = findSKFBearing(code);
    const abutment = calculateAbutmentDimensions(type, d, D, B);
    const maintenanceProtocol = getSKFMaintenanceProtocol(type, d, D, capping === '2RSH');
    const dynC = C || skfRecord?.C || 0;
    const statC0 = C0 || skfRecord?.C0 || 0;

    // Bearing Family Flags
    const isNeedle = type === 'needle-roller' || code.startsWith('HK') || code.startsWith('NA');
    const isHK = code.startsWith('HK') || skfRecord?.needleType === 'drawn-cup' || (!code.startsWith('NA') && isNeedle && d <= 25 && D <= 32);
    const isNA = isNeedle && !isHK;
    const isTaper = type === 'tapered-roller' || code.startsWith('30') || code.startsWith('32');
    const isCylindrical = type === 'cylindrical-roller' || code.startsWith('NU') || code.startsWith('NJ');
    const isAngular = type === 'angular-contact-ball' || code.startsWith('72') || code.startsWith('73');
    const isSelfAligning = type === 'self-aligning-ball' || code.startsWith('12') || code.startsWith('13') || code.startsWith('22');
    const isSpherical = type === 'spherical-roller' || code.startsWith('222') || code.startsWith('223');
    const isThrust = type === 'thrust-ball' || type === 'thrust-roller' || code.startsWith('511') || code.startsWith('512');

    // Real dimensions from SKF database or calculated
    const totalWidth = skfRecord?.totalWidthT || abutment.totalWidthT || B;
    const heightH = skfRecord?.heightH || abutment.heightH || B;
    const effectiveWidth = isThrust ? heightH : totalWidth;

    const rMinVal = skfRecord ? skfRecord.r12Min : abutment.rMin;
    const daMinVal = skfRecord ? skfRecord.daMin : abutment.daMin;
    const daMaxVal = skfRecord ? skfRecord.daMax : abutment.daMax;
    const DaMaxVal = skfRecord ? skfRecord.DaMax : abutment.DaMax;
    const raMaxVal = skfRecord ? skfRecord.raMax : abutment.raMax;

    // Viewport dimensions for orbital view (Balanced and centered in 660 x 340 canvas)
    const cx = 330;
    const cy = 170;
    const rOuter = 116;
    const rInner = isHK ? 80 : isNA ? 70 : isNeedle ? 74 : 52;
    const rPitch = (rOuter + rInner) / 2;
    const elRadius = isNeedle ? 4.2 : isCylindrical ? 10 : isTaper ? 10.5 : isSelfAligning || isSpherical ? 8 : 13;
    const nElements = isNeedle ? 28 : isCylindrical ? 13 : isTaper ? 14 : isSpherical ? 13 : isSelfAligning ? 12 : 10;

    // Interactive kinetic spin engine
    const speedFactor = rpm > 0 ? Math.max(0.2, Math.min(2.5, rpm / 1500)) : 1.0;
    const kinetic = useKineticSpin({
        mode: 'circular',
        nominalSpeedDegPerSec: 25 * speedFactor,
        autoPlay: rpm > 0,
        dragSensitivity: 1.1,
        wheelSensitivity: 0.003,
    });

    const cageAngle = kinetic.angle % 360;

    return (
        <div className="w-full flex-1 flex flex-col justify-between select-none relative">
            {/* Top View Mode Switcher Header */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10 z-20 flex-wrap px-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setViewMode('orbital')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            viewMode === 'orbital'
                                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-md '
                                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <span>🔄</span>
                        <span>{t.viewOrbital}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('section')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            viewMode === 'section'
                                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/60 shadow-md '
                                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <span>📐</span>
                        <span>{t.viewSection}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('mounting')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            viewMode === 'mounting'
                                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-md '
                                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <span>🔩</span>
                        <span>{t.viewMounting}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('tools')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            viewMode === 'tools'
                                ? 'bg-purple-500/25 text-purple-200 border border-purple-400/60 shadow-md '
                                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <span>🛠️</span>
                        <span>{t.viewTools}</span>
                    </button>
                </div>

                {viewMode === 'orbital' && (
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/30">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span>{t.dragToRotate} ({(kinetic.speedMagnitude * (rpm || 1000)).toFixed(0)} RPM)</span>
                    </div>
                )}
            </div>

            {/* Main Interactive Viewport Canvas (Widescreen 780x440 / Compact 660x340) */}
            <div
                {...kinetic.containerProps}
                className="w-full h-[310px] sm:h-[335px] relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
                <svg
                    viewBox={viewMode === 'orbital' ? "0 0 660 340" : "0 0 780 440"}
                    className="w-full h-full max-h-[335px] select-none"
                    preserveAspectRatio="xMidYMid meet"
                    suppressHydrationWarning
                >
                    <defs>
                        {/* Engineering Steel Gradients */}
                        <linearGradient id="brOuterSteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="25%" stopColor="#475569" />
                            <stop offset="50%" stopColor="#94a3b8" />
                            <stop offset="75%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>

                        <linearGradient id="brInnerSteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="35%" stopColor="#64748b" />
                            <stop offset="70%" stopColor="#cbd5e1" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>

                        <radialGradient id="brChromeSphere" cx="35%" cy="35%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="25%" stopColor="#e2e8f0" />
                            <stop offset="60%" stopColor="#64748b" />
                            <stop offset="90%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#020617" />
                        </radialGradient>

                        {/* ISO 128 Compliant Hatching Patterns */}
                        {/* Outer Ring Upper: +45 deg Cyan Hatch */}
                        <pattern id="brOuterHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1.2" opacity="0.45" />
                        </pattern>
                        {/* Outer Ring Lower (Mirrored Coordinate Space): -45 deg -> +45 deg world */}
                        <pattern id="brOuterHatchLower" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1.2" opacity="0.45" />
                        </pattern>

                        {/* Inner Ring Upper: -45 deg Emerald Hatch */}
                        <pattern id="brInnerHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#34d399" strokeWidth="1.2" opacity="0.45" />
                        </pattern>
                        {/* Inner Ring Lower (Mirrored Coordinate Space): +45 deg -> -45 deg world */}
                        <pattern id="brInnerHatchLower" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#34d399" strokeWidth="1.2" opacity="0.45" />
                        </pattern>

                        {/* Housing: +45 deg Steel Gray */}
                        <pattern id="brHousingHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="12" stroke="#64748b" strokeWidth="1" opacity="0.3" />
                        </pattern>

                        {/* Shaft: -45 deg Deep Blue */}
                        <pattern id="brShaftHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                            <line x1="0" y1="0" x2="0" y2="12" stroke="#0ea5e9" strokeWidth="1" opacity="0.3" />
                        </pattern>

                        <linearGradient id="brTaperEndGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fde68a" />
                            <stop offset="45%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#78350f" />
                        </linearGradient>

                        <linearGradient id="brCylinderEndGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f8fafc" />
                            <stop offset="35%" stopColor="#cbd5e1" />
                            <stop offset="80%" stopColor="#475569" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>

                        <linearGradient id="brBrassCageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="50%" stopColor="#ca8a04" />
                            <stop offset="100%" stopColor="#854d0e" />
                        </linearGradient>

                        <radialGradient id="brRubberSealGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="70%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#020617" />
                        </radialGradient>

                        <filter id="brDropGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00e5ff" floodOpacity="0.35" />
                        </filter>

                        {/* Precision Dimension Arrows */}
                        <marker id="brDimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#00e5ff" />
                        </marker>
                        <marker id="brDimArrowGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#34d399" />
                        </marker>
                        <marker id="brDimArrowAmber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f59e0b" />
                        </marker>
                        <marker id="brDimArrowPink" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#ec4899" />
                        </marker>
                    </defs>

                    {/* Technical Grid Background */}
                    <rect x="0" y="0" width="780" height="440" fill="var(--bg-2)" stroke="var(--line)" rx="12" />
                    <g opacity="0.08">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <line key={`gx_${i}`} x1={i * 40} y1="0" x2={i * 40} y2="440" stroke="var(--cyan, #38bdf8)" strokeWidth="1" />
                        ))}
                        {Array.from({ length: 11 }).map((_, i) => (
                            <line key={`gy_${i}`} x1="0" y1={i * 40} x2="780" y2={i * 40} stroke="var(--cyan, #38bdf8)" strokeWidth="1" />
                        ))}
                    </g>

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* MODE 1: KİNETİK ETKİLEŞİMLİ ÖN YÜZ (ORBITAL VIEW)           */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {viewMode === 'orbital' && (
                        <g>
                            {/* Outer Casing Ring */}
                            <circle cx={cx} cy={cy} r={rOuter} fill="url(#brOuterSteelGrad)" stroke="var(--cyan, #38bdf8)" strokeWidth={isHK ? "1.6" : "2.5"} filter="url(#brDropGlow)" />
                            <circle cx={cx} cy={cy} r={rOuter - (isHK ? 5 : 12)} fill="var(--bg-1)" stroke="var(--line, #1e293b)" strokeWidth="1.4" />

                            {/* NA Series Machined Ring Oil Hole Indicator */}
                            {isNA && (
                                <g>
                                    <circle cx={cx} cy={cy - rOuter + 6} r="3" fill="#f59e0b" stroke="#000" strokeWidth="1" />
                                    <text x={cx} y={cy - rOuter - 5} textAnchor="middle" fontSize="9" fill="#f59e0b" fontFamily="monospace" fontWeight="bold">
                                        Ø 2.5 mm
                                    </text>
                                </g>
                            )}

                            {/* Rubber Seal Ring (if 2RSH) */}
                            {capping === '2RSH' && !isNeedle && !isThrust && (
                                <g opacity="0.92">
                                    <circle cx={cx} cy={cy} r={rOuter - 13} fill="url(#brRubberSealGrad)" stroke="var(--line, #0f172a)" strokeWidth="1" />
                                    <circle cx={cx} cy={cy} r={rInner + 12} fill="var(--bg-2)" />
                                    <circle cx={cx} cy={cy} r={rPitch + 13} fill="none" stroke="var(--line, #334155)" strokeWidth="1" strokeDasharray="5 2.5" />
                                    <circle cx={cx} cy={cy} r={rPitch - 13} fill="none" stroke="var(--line, #334155)" strokeWidth="1" strokeDasharray="5 2.5" />
                                    <text x={cx} y={cy - rPitch} textAnchor="middle" fontSize="9.5" fill="var(--alu-dim, #94a3b8)" fontFamily="monospace" fontWeight="bold">
                                        SKF · {code} · 2RSH CONTACT SEAL
                                    </text>
                                </g>
                            )}

                            {/* ORBITING CAGE & ELEMENTS */}
                            <g transform={`rotate(${cageAngle.toFixed(2)} ${cx} ${cy})`}>
                                {!isNeedle && !isSpherical && !isSelfAligning && (
                                    <circle cx={cx} cy={cy} r={rPitch} fill="none" stroke="url(#brBrassCageGrad)" strokeWidth={elRadius * 1.3} opacity="0.85" />
                                )}

                                {/* Double-row cage for Spherical & Self-Aligning */}
                                {(isSpherical || isSelfAligning) && (
                                    <g>
                                        <circle cx={cx} cy={cy} r={rPitch + 7} fill="none" stroke="url(#brBrassCageGrad)" strokeWidth={elRadius * 0.9} opacity="0.75" />
                                        <circle cx={cx} cy={cy} r={rPitch - 7} fill="none" stroke="url(#brBrassCageGrad)" strokeWidth={elRadius * 0.9} opacity="0.75" />
                                    </g>
                                )}

                                {/* Rolling Elements Array */}
                                {Array.from({ length: nElements }).map((_, i) => {
                                    const a = (i / nElements) * Math.PI * 2;
                                    const bx = (cx + rPitch * Math.cos(a)).toFixed(2);
                                    const by = (cy + rPitch * Math.sin(a)).toFixed(2);

                                    return (
                                        <g key={i} transform={`translate(${bx}, ${by})`}>
                                            {isCylindrical ? (
                                                <g>
                                                    {/* Cylindrical Roller End Face with Dimple */}
                                                    <circle cx="0" cy="0" r={elRadius} fill="url(#brCylinderEndGrad)" stroke="#e2e8f0" strokeWidth="1.3" filter="url(#brDropGlow)" />
                                                    <circle cx="0" cy="0" r={elRadius * 0.75} fill="none" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                                                    <circle cx="0" cy="0" r="2.2" fill="#334155" stroke="#94a3b8" strokeWidth="0.8" />
                                                </g>
                                            ) : isTaper ? (
                                                <g>
                                                    {/* Tapered Roller Large End Face */}
                                                    <circle cx="0" cy="0" r={elRadius} fill="url(#brTaperEndGrad)" stroke="#f59e0b" strokeWidth="1.3" filter="url(#brDropGlow)" />
                                                    <circle cx="0" cy="0" r={elRadius * 0.78} fill="none" stroke="#fde68a" strokeWidth="0.8" />
                                                    <circle cx="0" cy="0" r="2.2" fill="#78350f" />
                                                </g>
                                            ) : isNeedle ? (
                                                <g>
                                                    {/* Needle Roller End Face */}
                                                    <circle cx="0" cy="0" r={elRadius} fill="url(#brCylinderEndGrad)" stroke="#38bdf8" strokeWidth="1.1" />
                                                    <circle cx="0" cy="0" r="1.1" fill="#0f172a" />
                                                </g>
                                            ) : isSpherical ? (
                                                <g>
                                                    {/* Double Row Barrel Roller Faces */}
                                                    <g transform={`translate(${(Math.cos(a) * 7).toFixed(2)}, ${(Math.sin(a) * 7).toFixed(2)})`}>
                                                        <ellipse cx="0" cy="0" rx={elRadius} ry={elRadius * 0.85} fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.1" filter="url(#brDropGlow)" />
                                                        <circle cx="0" cy="0" r="1.8" fill="#334155" />
                                                    </g>
                                                    <g transform={`translate(${(-Math.cos(a) * 7).toFixed(2)}, ${(-Math.sin(a) * 7).toFixed(2)})`}>
                                                        <ellipse cx="0" cy="0" rx={elRadius} ry={elRadius * 0.85} fill="url(#brCylinderEndGrad)" stroke="#94a3b8" strokeWidth="1" opacity="0.85" />
                                                        <circle cx="0" cy="0" r="1.8" fill="#334155" />
                                                    </g>
                                                </g>
                                            ) : isSelfAligning ? (
                                                <g>
                                                    {/* Double Row Spherical Balls */}
                                                    <circle cx={(Math.cos(a) * 7).toFixed(2)} cy={(Math.sin(a) * 7).toFixed(2)} r={elRadius} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" filter="url(#brDropGlow)" />
                                                    <circle cx={(-Math.cos(a) * 7).toFixed(2)} cy={(-Math.sin(a) * 7).toFixed(2)} r={elRadius * 0.95} fill="url(#brChromeSphere)" stroke="#cbd5e1" strokeWidth="1.1" opacity="0.85" />
                                                </g>
                                            ) : (
                                                <circle cx="0" cy="0" r={elRadius} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" filter="url(#brDropGlow)" />
                                            )}
                                        </g>
                                    );
                                })}
                            </g>

                            {/* Inner Ring / Shaft Surface */}
                            {!isHK ? (
                                <g>
                                    <circle cx={cx} cy={cy} r={rInner + (isNA ? 6 : 12)} fill="url(#brInnerSteelGrad)" stroke="var(--cyan, #38bdf8)" strokeWidth="2" />
                                    <circle cx={cx} cy={cy} r={rInner} fill="var(--bg-1)" stroke="var(--cyan, #00e5ff)" strokeWidth="2.5" />
                                    {/* Clean Technical Shaft Bore & Center Mark */}
                                    <circle cx={cx} cy={cy} r={rInner * 0.7} fill="var(--bg-2)" stroke="var(--line, #334155)" strokeWidth="1" strokeDasharray="4 2" />
                                    <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke="var(--cyan, #38bdf8)" strokeWidth="1.2" opacity="0.7" />
                                    <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke="var(--cyan, #38bdf8)" strokeWidth="1.2" opacity="0.7" />
                                </g>
                            ) : (
                                <g>
                                    {/* HK Direct Shaft Surface Callout */}
                                    <circle cx={cx} cy={cy} r={rInner} fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="2.2" strokeDasharray="6 3" />
                                    <circle cx={cx} cy={rInner * 0.7} r={rInner * 0.7} fill="var(--bg-2)" stroke="var(--line, #334155)" strokeWidth="1" strokeDasharray="4 2" />
                                    <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke="#f59e0b" strokeWidth="1.2" opacity="0.7" />
                                    <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke="#f59e0b" strokeWidth="1.2" opacity="0.7" />
                                    <text x={cx} y={cy + 36} textAnchor="middle" fontSize="10" fill="#f59e0b" fontFamily="monospace" fontWeight="bold">
                                        {t.directGroundShaft}
                                    </text>
                                </g>
                            )}

                            {/* Angular Contact Alpha Angle Vector */}
                            {isAngular && (
                                <g transform={`translate(${cx}, ${cy})`}>
                                    <line x1="0" y1="0" x2={rPitch * 0.707} y2={-rPitch * 0.707} stroke="#ec4899" strokeWidth="2.2" strokeDasharray="4 2" />
                                    <text x={rPitch * 0.75} y={-rPitch * 0.72} fill="#ec4899" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                        {t.contactLine}
                                    </text>
                                </g>
                            )}

                            {/* ─── LIVE LOAD VECTORS ON BEARING ─── */}
                            {/* Radial Load Fr Downward Vector */}
                            {fr > 0 && (
                                <g transform={`translate(${cx}, ${cy - rOuter})`}>
                                    <line x1="0" y1="-22" x2="0" y2="-4" stroke="var(--cyan, #00e5ff)" strokeWidth="2.8" markerEnd="url(#brDimArrow)" />
                                    <rect x="-35" y="-34" width="70" height="17" rx="3.5" fill="var(--bg-1)" stroke="var(--cyan, #00e5ff)" strokeWidth="1" opacity="0.95" />
                                    <text x="0" y="-22" fontSize="9.5" fontWeight="bold" fill="var(--cyan, #00e5ff)" fontFamily="monospace" textAnchor="middle">
                                        Fr={fr}N
                                    </text>
                                </g>
                            )}

                            {/* Axial Load Fa Vector (ISO 128 / Engineering Convention: Axial Vector into Screen) */}
                            {fa > 0 && (
                                <g transform={`translate(${cx}, ${cy})`}>
                                    {/* Axial into-screen symbol ⊗ */}
                                    <circle cx="0" cy="0" r="13" fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="1.6" />
                                    <line x1="-8" y1="-8" x2="8" y2="8" stroke="#f59e0b" strokeWidth="1.6" />
                                    <line x1="8" y1="-8" x2="-8" y2="8" stroke="#f59e0b" strokeWidth="1.6" />
                                    <rect x="-35" y="17" width="70" height="16" rx="3.5" fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="1" opacity="0.95" />
                                    <text x="0" y="29" fontSize="9" fontWeight="bold" fill="#f59e0b" fontFamily="monospace" textAnchor="middle">
                                        Fa={fa}N ⊗
                                    </text>
                                </g>
                            )}

                            {/* Center Bore & Dimension Callouts */}
                            <g transform={`translate(${cx}, ${cy + rOuter + 6})`}>
                                <text x="0" y="16" textAnchor="middle" fontSize="11" fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
                                    Ø D={D} mm · Ø d={d} mm · B={effectiveWidth} mm
                                </text>
                            </g>

                            {/* ─── LEFT TECHNICAL SPECIFICATION PANEL ─── */}
                            <g transform="translate(14, 16)">
                                {/* Background Panel */}
                                <rect x="0" y="0" width="175" height="308" rx="8" fill="var(--bg-1)" fillOpacity="0.95" stroke="var(--line)" strokeWidth="1" />
                                <rect x="0" y="0" width="175" height="26" rx="8" fill="var(--cyan, #38bdf8)" fillOpacity="0.12" />
                                
                                {/* Panel Header */}
                                <text x="12" y="18" fontSize="9.5" fontWeight="bold" fill="var(--cyan, #38bdf8)" fontFamily="monospace" letterSpacing="0.8">
                                    {t12(language, 'BEARING SPECS', 'RULMAN ÖZELLİKLERİ')}
                                </text>

                                {/* Code & Family */}
                                <text x="12" y="44" fontSize="14" fontWeight="bold" fill="var(--ink, #ffffff)" fontFamily="monospace">
                                    SKF {skfRecord?.fullDesignation || code}
                                </text>
                                <text x="12" y="58" fontSize="9.5" fill="var(--alu-dim, #94a3b8)" fontFamily="monospace" fontWeight="bold">
                                    {t12(language, typeInfo?.name || type.replace(/-/g, ' ').toUpperCase(), typeInfo?.nameTr)}
                                </text>

                                <line x1="12" y1="67" x2="163" y2="67" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                {/* ISO 15 Boundaries */}
                                <text x="12" y="80" fontSize="8.5" fontWeight="bold" fill="var(--cyan, #00e5ff)" fontFamily="monospace" letterSpacing="0.5">
                                    {t12(language, 'ISO 15 BOUNDARIES', 'ISO 15 BOYUTLAR')}
                                </text>

                                <text x="12" y="96" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    {t12(language, 'Bore', 'İç Çap')} (d): <tspan fill="var(--ink, #ffffff)" fontWeight="bold">{d} mm</tspan>
                                </text>
                                <text x="12" y="112" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    {t12(language, 'Outer', 'Dış Çap')} (D): <tspan fill="var(--ink, #ffffff)" fontWeight="bold">{D} mm</tspan>
                                </text>
                                <text x="12" y="128" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    {t12(language, 'Width', 'Genişlik')} (B): <tspan fill="var(--ink, #ffffff)" fontWeight="bold">{effectiveWidth} mm</tspan>
                                </text>

                                <line x1="12" y1="138" x2="163" y2="138" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                {/* Load Ratings */}
                                <text x="12" y="151" fontSize="8.5" fontWeight="bold" fill="#34d399" fontFamily="monospace" letterSpacing="0.5">
                                    {t12(language, 'LOAD RATINGS', 'YÜK KAPASİTESİ')}
                                </text>

                                <text x="12" y="167" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    C (Dyn): <tspan fill="#34d399" fontWeight="bold">{dynC ? `${dynC} kN` : '—'}</tspan>
                                </text>
                                <text x="12" y="183" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    C₀ (Stat): <tspan fill="#34d399" fontWeight="bold">{statC0 ? `${statC0} kN` : '—'}</tspan>
                                </text>

                                <line x1="12" y1="193" x2="163" y2="193" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                {/* Physical Attributes */}
                                <text x="12" y="206" fontSize="8.5" fontWeight="bold" fill="#f59e0b" fontFamily="monospace" letterSpacing="0.5">
                                    {t12(language, 'ATTRIBUTES', 'NİTELİKLER')}
                                </text>

                                <text x="12" y="222" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    n_lim: <tspan fill="#f59e0b" fontWeight="bold">{(skfRecord?.speedLimitingOpenRpm ?? skfRecord?.speedLimitingSealedRpm ?? 18000).toLocaleString()} rpm</tspan>
                                </text>
                                <text x="12" y="238" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    {t12(language, 'Mass', 'Ağırlık')}: <tspan fill="var(--ink, #ffffff)" fontWeight="bold">{skfRecord?.massKg !== undefined ? `${skfRecord.massKg} kg` : `${(d * D * effectiveWidth * 0.00000785).toFixed(3)} kg`}</tspan>
                                </text>
                                <text x="12" y="254" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    {t12(language, 'Seal', 'Keçe')}: <tspan fill="var(--cyan, #38bdf8)" fontWeight="bold">{capping}</tspan>
                                </text>

                                <line x1="12" y1="264" x2="163" y2="264" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                <rect x="12" y="272" width="151" height="24" rx="4" fill="var(--bg-2)" stroke="var(--line, #334155)" strokeWidth="1" />
                                <text x="87" y="288" fontSize="9" fill="var(--alu-dim, #94a3b8)" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                    ISO 281 · SKF CATALOG
                                </text>
                            </g>

                            {/* ─── RIGHT KINEMATICS & LOAD TELEMETRY PANEL ─── */}
                            <g transform="translate(471, 16)">
                                {/* Background Panel */}
                                <rect x="0" y="0" width="175" height="308" rx="8" fill="var(--bg-1)" fillOpacity="0.95" stroke="var(--line)" strokeWidth="1" />
                                <rect x="0" y="0" width="175" height="26" rx="8" fill="var(--cyan, #38bdf8)" fillOpacity="0.12" />

                                {/* Panel Header */}
                                <text x="12" y="18" fontSize="9.5" fontWeight="bold" fill="var(--cyan, #38bdf8)" fontFamily="monospace" letterSpacing="0.8">
                                    {t12(language, 'LIVE KINEMATICS', 'CANLI TELEMETRİ')}
                                </text>

                                {/* Velocity & Speed */}
                                <text x="12" y="42" fontSize="8.5" fontWeight="bold" fill="var(--cyan, #00e5ff)" fontFamily="monospace" letterSpacing="0.5">
                                    {t12(language, 'SPEED & VELOCITY', 'HIZ VE DEVİR')}
                                </text>
                                <text x="12" y="58" fontSize="13" fontWeight="bold" fill="var(--ink, #ffffff)" fontFamily="monospace">
                                    n = {rpm} <tspan fontSize="9" fill="var(--alu-dim, #94a3b8)">RPM</tspan>
                                </text>
                                <text x="12" y="73" fontSize="10" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    ω = {((rpm * Math.PI) / 30).toFixed(1)} rad/s
                                </text>
                                <text x="12" y="87" fontSize="10" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    v = {((Math.PI * d * rpm) / 60000).toFixed(2)} m/s
                                </text>

                                <line x1="12" y1="96" x2="163" y2="96" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                {/* Applied Loads */}
                                <text x="12" y="109" fontSize="8.5" fontWeight="bold" fill="#f59e0b" fontFamily="monospace" letterSpacing="0.5">
                                    {t12(language, 'APPLIED LOADS', 'UYGULANAN YÜKLER')}
                                </text>
                                <text x="12" y="125" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    Fr (Rad): <tspan fill="var(--cyan, #38bdf8)" fontWeight="bold">{fr} N</tspan>
                                </text>
                                <text x="12" y="141" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    Fa (Ax): <tspan fill="#f59e0b" fontWeight="bold">{fa} N</tspan>
                                </text>
                                <text x="12" y="155" fontSize="10" fill="var(--alu-dim, #94a3b8)" fontFamily="monospace">
                                    Fa / Fr = {(fa / Math.max(1, fr)).toFixed(2)}
                                </text>

                                <line x1="12" y1="165" x2="163" y2="165" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                {/* Equivalent & Safety */}
                                <text x="12" y="178" fontSize="8.5" fontWeight="bold" fill="#ec4899" fontFamily="monospace" letterSpacing="0.5">
                                    {t12(language, 'EQUIV LOAD & S0', 'EŞDEĞER YÜK & S₀')}
                                </text>
                                <text x="12" y="194" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    P (Dyn): <tspan fill="var(--ink, #ffffff)" fontWeight="bold">{life?.P ? `${(life.P * 1000).toFixed(0)} N` : '—'}</tspan>
                                </text>
                                <text x="12" y="210" fontSize="11" fill="var(--alu-dim, #cbd5e1)" fontFamily="monospace">
                                    S₀ (Stat): <tspan fill={life && (life.staticSafety || 0) >= 1.5 ? '#34d399' : '#f59e0b'} fontWeight="bold">{life?.staticSafety ? Number(life.staticSafety).toFixed(2) : '—'}</tspan>
                                </text>

                                <line x1="12" y1="220" x2="163" y2="220" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                {/* Rating Life Preview */}
                                <text x="12" y="233" fontSize="8.5" fontWeight="bold" fill="#34d399" fontFamily="monospace" letterSpacing="0.5">
                                    {t12(language, 'L10H RATING LIFE', 'L₁₀h NOMİNAL ÖMÜR')}
                                </text>
                                <text x="12" y="250" fontSize="13" fontWeight="bold" fill="#34d399" fontFamily="monospace">
                                    {life?.L10h ? (life.L10h >= 1e6 ? `${life.L10h.toExponential(2)} h` : `${life.L10h.toFixed(0)} h`) : '—'}
                                </text>
                                <text x="12" y="264" fontSize="10" fill="var(--alu-dim, #94a3b8)" fontFamily="monospace">
                                    Lnm = {life?.Lna ? (life.Lna >= 1e6 ? `${life.Lna.toExponential(2)} h` : `${life.Lna.toFixed(0)} h`) : '—'}
                                </text>

                                <line x1="12" y1="270" x2="163" y2="270" stroke="var(--line, #1e293b)" strokeWidth="1" />

                                {/* Status Tag */}
                                <g transform="translate(12, 274)">
                                    <rect x="0" y="0" width="151" height="24" rx="4" fill="#042f2e" stroke="#14b8a6" strokeWidth="1" />
                                    <circle cx="16" cy="12" r="3.5" fill="#2dd4bf" className="animate-pulse" />
                                    <text x="26" y="15" fontSize="8.5" fontWeight="bold" fill="#2dd4bf" fontFamily="monospace">
                                        {rpm > 0 ? t12(language, 'ROTATING · RUN', 'DÖNÜYOR · ÇALIŞIYOR') : t12(language, 'STOPPED', 'DURDU')}
                                    </text>
                                </g>
                            </g>
                        </g>
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* MODE 2: SKF 2D KESİT ÇİZİMİ (CROSS-SECTION VIEW - ISO 128)  */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {viewMode === 'section' && (
                        <g>
                            {/* Header Info */}
                            <g transform="translate(28, 36)">
                                <text x="0" y="0" fontSize="16" fontWeight="bold" fill="#34d399" fontFamily="monospace">
                                    SKF {skfRecord?.fullDesignation || code} {t12(language, '2D Technical Section Drawing', '2D Teknik Kesit Çizimi')}
                                </text>
                                <text x="0" y="20" fontSize="13" fill="#cbd5e1" fontFamily="monospace">
                                    {t12(language, 'DIN ISO 128 Standard Section Hatching', 'DIN ISO 128 Standart Kesit Taraması')} · {isThrust ? t.shaftWasher + ' & ' + t.housingWasher : isHK ? t.directGroundShaft : isCylindrical ? t.flangelessRaceway : isTaper ? t.coneAndRib : isAngular ? t.contactLine : t.tabDimensions}
                                </text>
                            </g>

                            {/* Bearing Axis Centerline */}
                            <line x1="40" y1="220" x2="740" y2="220" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="18 4 3 4" opacity="0.8" />
                            <text x="744" y="224" fill="#00e5ff" fontSize="11" fontFamily="monospace">{t.bearingAxis}</text>

                            {isThrust ? (
                                /* ─── EKSENEL BİLYALI (51100 SERİSİ) KESİTİ ─── */
                                <g transform="translate(290, 70)">
                                    {/* Upper Half */}
                                    {/* Shaft Washer (Left, tight fit d on rotating shaft) */}
                                    <path d="M 0 0 L 38 0 L 38 135 L 0 135 Z" fill="url(#brInnerHatch)" stroke="#34d399" strokeWidth="2" />
                                    <text x="19" y="72" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.shaftWasher}</text>

                                    {/* Thrust Ball in cage */}
                                    <circle cx="68" cy="68" r="24" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.5" />

                                    {/* Housing Washer (Right, clearance bore D1 > d) */}
                                    <path d="M 98 0 L 136 0 L 136 125 L 98 125 Z" fill="url(#brOuterHatch)" stroke="#38bdf8" strokeWidth="2" />
                                    <text x="117" y="68" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.housingWasher}</text>

                                    {/* Lower Half (Symmetrical) */}
                                    <g transform="translate(0, 160)">
                                        <path d="M 0 0 L 38 0 L 38 135 L 0 135 Z" fill="url(#brInnerHatch)" stroke="#34d399" strokeWidth="2" />
                                        <circle cx="68" cy="68" r="24" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.5" />
                                        <path d="M 98 10 L 136 10 L 136 135 L 98 135 Z" fill="url(#brOuterHatch)" stroke="#38bdf8" strokeWidth="2" />
                                    </g>

                                    {/* Axial Load Vector Fa */}
                                    <g transform="translate(-100, 80)">
                                        <line x1="0" y1="70" x2="80" y2="70" stroke="#34d399" strokeWidth="3" markerEnd="url(#brDimArrowGreen)" />
                                        <text x="40" y="58" fill="#34d399" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.axialLoadDirection}</text>
                                    </g>
                                </g>
                            ) : (
                                /* ─── RADYAL RULMAN KESİTİ (BİLYALI / MAKARALI / İĞNELİ) ─── */
                                <g>
                                    {/* ─── 1. UPPER HALF BEARING SECTION (Y = 60 to 205) ─── */}
                                    <g transform="translate(300, 60)">
                                        {/* Upper Outer Ring */}
                                        <path
                                            d={isTaper
                                                ? "M 0 0 L 130 0 L 130 38 L 0 58 Z"
                                                : isHK
                                                ? "M 0 0 L 130 0 L 130 16 L 122 22 L 8 22 L 0 16 Z"
                                                : isNA
                                                ? "M 0 0 L 130 0 L 130 52 L 118 52 L 118 40 L 12 40 L 12 52 L 0 52 Z"
                                                : isCylindrical
                                                ? "M 0 0 L 130 0 L 130 58 L 118 58 L 118 42 L 12 42 L 12 58 L 0 58 Z"
                                                : isAngular
                                                ? "M 0 0 L 130 0 L 130 52 L 82 52 A 23 23 0 0 1 42 38 L 0 38 Z"
                                                : isSpherical
                                                ? "M 0 0 L 130 0 L 130 50 Q 65 38 0 50 Z"
                                                : isSelfAligning
                                                ? "M 0 0 L 130 0 L 130 50 Q 65 36 0 50 Z"
                                                : "M 0 0 L 130 0 L 130 50 L 0 50 Z"}
                                            fill="url(#brOuterHatch)"
                                            stroke="#38bdf8"
                                            strokeWidth="2"
                                        />

                                        {/* Upper Rolling Element */}
                                        {isTaper ? (
                                            <g>
                                                {/* True Truncated Conical Roller */}
                                                <path d="M 16 58 L 114 38 Q 118 64 114 90 L 16 88 Z" fill="url(#brTaperEndGrad)" stroke="#f59e0b" strokeWidth="1.6" />
                                                <line x1="16" y1="73" x2="114" y2="64" stroke="#78350f" strokeWidth="1" strokeDasharray="3 2" />
                                                {/* Apex projection lines converging on axis */}
                                                <line x1="114" y1="38" x2="220" y2="160" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.6" />
                                                <line x1="114" y1="90" x2="220" y2="160" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.6" />
                                                <circle cx="220" cy="160" r="3" fill="#f59e0b" />
                                                <text x="226" y="156" fill="#f59e0b" fontSize="10" fontFamily="monospace">{t.apexPoint}</text>
                                            </g>
                                        ) : isCylindrical ? (
                                            <g>
                                                {/* True Cylindrical Roller Held in Outer Ring Ribs */}
                                                <rect x="16" y="44" width="98" height="42" fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.6" rx="2" />
                                                <line x1="18" y1="65" x2="112" y2="65" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
                                                <text x="65" y="69" fill="#020617" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.cylindricalRoller}</text>
                                            </g>
                                        ) : isNeedle ? (
                                            <g>
                                                {/* True Slender Needle Roller */}
                                                <rect x="12" y={isHK ? "24" : "42"} width={isHK ? "106" : "98"} height={isHK ? "18" : "20"} fill="url(#brCylinderEndGrad)" stroke="#38bdf8" strokeWidth="1.4" rx="1.5" />
                                                <text x="65" y={isHK ? "37" : "56"} fill="#020617" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.needleRoller}</text>
                                            </g>
                                        ) : isSpherical ? (
                                            <g>
                                                {/* AUTHENTIC DOUBLE ROW BARREL ROLLERS (NOT ELLIPSES!) */}
                                                {/* Left Barrel Roller (tilted -10 deg) */}
                                                <g transform="rotate(-10 38 72)">
                                                    <path d="M 26 54 L 50 54 Q 56 72 50 90 L 26 90 Q 20 72 26 54 Z" fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.6" />
                                                    <line x1="38" y1="56" x2="38" y2="88" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                                                    <circle cx="38" cy="54" r="1.5" fill="#334155" />
                                                    <circle cx="38" cy="90" r="1.5" fill="#334155" />
                                                </g>
                                                {/* Right Barrel Roller (tilted +10 deg) */}
                                                <g transform="rotate(10 92 72)">
                                                    <path d="M 80 54 L 104 54 Q 110 72 104 90 L 80 90 Q 74 72 80 54 Z" fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.6" />
                                                    <line x1="92" y1="56" x2="92" y2="88" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                                                    <circle cx="92" cy="54" r="1.5" fill="#334155" />
                                                    <circle cx="92" cy="90" r="1.5" fill="#334155" />
                                                </g>
                                                <text x="65" y="76" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.barrelRoller}</text>
                                            </g>
                                        ) : isSelfAligning ? (
                                            <g>
                                                {/* Double Row Spherical Balls */}
                                                <circle cx="38" cy="72" r="18" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                                <circle cx="92" cy="72" r="18" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                            </g>
                                        ) : isAngular ? (
                                            <g>
                                                {/* Angular Contact Ball with 40° Contact Line */}
                                                <circle cx="65" cy="74" r="22" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.3" />
                                                <line x1="33" y1="101" x2="97" y2="47" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="5 3" />
                                                <circle cx="48" cy="88" r="3.5" fill="#ec4899" />
                                                <circle cx="82" cy="60" r="3.5" fill="#ec4899" />
                                                <text x="104" y="44" fill="#ec4899" fontSize="11" fontWeight="bold" fontFamily="monospace">{t.contactLine}</text>
                                            </g>
                                        ) : (
                                            <circle cx="65" cy="74" r="23" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.3" />
                                        )}

                                        {/* Upper Inner Ring */}
                                        {!isHK ? (
                                            <path
                                                d={isTaper
                                                    ? "M 0 82 L 14 82 L 14 88 L 114 90 L 116 36 L 130 36 L 130 145 L 0 145 Z"
                                                    : isCylindrical
                                                    ? "M 0 86 L 130 86 L 130 145 L 0 145 Z"
                                                    : isNA
                                                    ? "M 0 62 L 130 62 L 130 145 L 0 145 Z"
                                                    : isAngular
                                                    ? "M 0 96 L 48 96 A 23 23 0 0 1 88 110 L 130 110 L 130 145 L 0 145 Z"
                                                    : isSpherical
                                                    ? "M 0 94 Q 38 97 60 92 L 65 89 L 70 92 Q 92 97 130 94 L 130 145 L 0 145 Z"
                                                    : isSelfAligning
                                                    ? "M 0 92 Q 38 102 60 92 L 70 92 Q 92 102 130 92 L 130 145 L 0 145 Z"
                                                    : "M 0 98 L 130 98 L 130 145 L 0 145 Z"}
                                                fill="url(#brInnerHatch)"
                                                stroke="#34d399"
                                                strokeWidth="2"
                                            />
                                        ) : (
                                            /* HK has NO inner ring - direct ground shaft */
                                            <g>
                                                <line x1="-15" y1="42" x2="145" y2="42" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3" />
                                                <text x="65" y="64" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                                    {t.directGroundShaft}
                                                </text>
                                            </g>
                                        )}

                                        {/* Cylindrical Float Indicator Arrow */}
                                        {isCylindrical && (
                                            <g>
                                                <line x1="16" y1="83" x2="114" y2="83" stroke="#38bdf8" strokeWidth="2" markerStart="url(#brDimArrow)" markerEnd="url(#brDimArrow)" />
                                                <text x="65" y="78" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                                    {t.axialFloatFreedom}
                                                </text>
                                                <text x="65" y="118" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                                    {t.flangelessRaceway}
                                                </text>
                                            </g>
                                        )}
                                    </g>

                                    {/* ─── 2. LOWER HALF BEARING SECTION (MIRRORED ACROSS AXIS Y=220) ─── */}
                                    {/* Uses scale(1, -1) centered at Y=380: GUARANTEES 100% MATHEMATICAL SYMMETRY! */}
                                    <g transform="translate(300, 380) scale(1, -1)">
                                        {/* Lower Outer Ring */}
                                        <path
                                            d={isTaper
                                                ? "M 0 0 L 130 0 L 130 38 L 0 58 Z"
                                                : isHK
                                                ? "M 0 0 L 130 0 L 130 16 L 122 22 L 8 22 L 0 16 Z"
                                                : isNA
                                                ? "M 0 0 L 130 0 L 130 52 L 118 52 L 118 40 L 12 40 L 12 52 L 0 52 Z"
                                                : isCylindrical
                                                ? "M 0 0 L 130 0 L 130 58 L 118 58 L 118 42 L 12 42 L 12 58 L 0 58 Z"
                                                : isAngular
                                                ? "M 0 0 L 130 0 L 130 52 L 82 52 A 23 23 0 0 1 42 38 L 0 38 Z"
                                                : isSpherical
                                                ? "M 0 0 L 130 0 L 130 50 Q 65 38 0 50 Z"
                                                : isSelfAligning
                                                ? "M 0 0 L 130 0 L 130 50 Q 65 36 0 50 Z"
                                                : "M 0 0 L 130 0 L 130 50 L 0 50 Z"}
                                            fill="url(#brOuterHatchLower)"
                                            stroke="#38bdf8"
                                            strokeWidth="2"
                                        />

                                        {/* Lower Rolling Element (Exact Mirror) */}
                                        {isTaper ? (
                                            <g>
                                                {/* Lower Truncated Conical Roller */}
                                                <path d="M 16 58 L 114 38 Q 118 64 114 90 L 16 88 Z" fill="url(#brTaperEndGrad)" stroke="#f59e0b" strokeWidth="1.6" />
                                                <line x1="16" y1="73" x2="114" y2="64" stroke="#78350f" strokeWidth="1" strokeDasharray="3 2" />
                                                <line x1="114" y1="38" x2="220" y2="160" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.6" />
                                                <line x1="114" y1="90" x2="220" y2="160" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.6" />
                                            </g>
                                        ) : isCylindrical ? (
                                            <rect x="16" y="44" width="98" height="42" fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.6" rx="2" />
                                        ) : isNeedle ? (
                                            <rect x="12" y={isHK ? "24" : "42"} width={isHK ? "106" : "98"} height={isHK ? "18" : "20"} fill="url(#brCylinderEndGrad)" stroke="#38bdf8" strokeWidth="1.4" rx="1.5" />
                                        ) : isSpherical ? (
                                            <g>
                                                {/* Symmetrical Lower Barrel Rollers */}
                                                <g transform="rotate(-10 38 72)">
                                                    <path d="M 26 54 L 50 54 Q 56 72 50 90 L 26 90 Q 20 72 26 54 Z" fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.6" />
                                                    <line x1="38" y1="56" x2="38" y2="88" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                                                </g>
                                                <g transform="rotate(10 92 72)">
                                                    <path d="M 80 54 L 104 54 Q 110 72 104 90 L 80 90 Q 74 72 80 54 Z" fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.6" />
                                                    <line x1="92" y1="56" x2="92" y2="88" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                                                </g>
                                            </g>
                                        ) : isSelfAligning ? (
                                            <g>
                                                <circle cx="38" cy="72" r="18" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                                <circle cx="92" cy="72" r="18" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                            </g>
                                        ) : isAngular ? (
                                            <g>
                                                <circle cx="65" cy="74" r="22" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.3" />
                                                <line x1="33" y1="101" x2="97" y2="47" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="5 3" />
                                                <circle cx="48" cy="60" r="3.5" fill="#ec4899" />
                                                <circle cx="82" cy="88" r="3.5" fill="#ec4899" />
                                            </g>
                                        ) : (
                                            <circle cx="65" cy="74" r="23" fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.3" />
                                        )}

                                        {/* Lower Inner Ring */}
                                        {!isHK ? (
                                            <path
                                                d={isTaper
                                                    ? "M 0 82 L 14 82 L 14 88 L 114 90 L 116 36 L 130 36 L 130 145 L 0 145 Z"
                                                    : isCylindrical
                                                    ? "M 0 86 L 130 86 L 130 145 L 0 145 Z"
                                                    : isNA
                                                    ? "M 0 62 L 130 62 L 130 145 L 0 145 Z"
                                                    : isAngular
                                                    ? "M 0 96 L 48 96 A 23 23 0 0 1 88 110 L 130 110 L 130 145 L 0 145 Z"
                                                    : isSpherical
                                                    ? "M 0 94 Q 38 97 60 92 L 65 89 L 70 92 Q 92 97 130 94 L 130 145 L 0 145 Z"
                                                    : isSelfAligning
                                                    ? "M 0 92 Q 38 102 60 92 L 70 92 Q 92 102 130 92 L 130 145 L 0 145 Z"
                                                    : "M 0 98 L 130 98 L 130 145 L 0 145 Z"}
                                                fill="url(#brInnerHatchLower)"
                                                stroke="#34d399"
                                                strokeWidth="2"
                                            />
                                        ) : (
                                            <line x1="-15" y1="42" x2="145" y2="42" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3" />
                                        )}
                                    </g>
                                    {/* Axial Load Vector Fa on Section View for Radial / Angular / Taper Bearings */}
                                    {fa > 0 && (
                                        <g transform="translate(435, 220)">
                                             <line x1="60" y1="0" x2="6" y2="0" stroke="#f59e0b" strokeWidth="2.6" markerEnd="url(#brDimArrowAmber)" />
                                             <rect x="62" y="-10" width="70" height="20" rx="4" fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="1.2" opacity="0.95" />
                                             <text x="97" y="4" fontSize="10" fontWeight="bold" fill="#f59e0b" fontFamily="monospace" textAnchor="middle">
                                                 Fa={fa}N
                                             </text>
                                        </g>
                                    )}
                                </g>
                            )}

                            {/* Dimension Callouts with Clear DIN Arrows */}
                            {/* Bore d (ISO 129 outside arrows pointing inward to clear tight bore gap) */}
                            <g transform="translate(240, 0)">
                                <line x1="0" y1="205" x2="55" y2="205" stroke="var(--alu-dim, #94a3b8)" strokeWidth="1" />
                                <line x1="0" y1="235" x2="55" y2="235" stroke="var(--alu-dim, #94a3b8)" strokeWidth="1" />
                                <line x1="25" y1="160" x2="25" y2="205" stroke="var(--cyan, #00e5ff)" strokeWidth="1.8" markerEnd="url(#brDimArrow)" />
                                <line x1="25" y1="280" x2="25" y2="235" stroke="var(--cyan, #00e5ff)" strokeWidth="1.8" markerEnd="url(#brDimArrow)" />
                                <line x1="25" y1="205" x2="25" y2="235" stroke="var(--cyan, #00e5ff)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.5" />
                                <rect x="-85" y="211" width="95" height="18" rx="3" fill="var(--bg-1)" stroke="var(--cyan, #00e5ff)" strokeWidth="0.8" opacity="0.95" />
                                <text x="-37" y="224" textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--cyan, #00e5ff)" fontFamily="monospace">
                                    d = {d} mm
                                </text>
                            </g>

                            {/* Outer Diameter D */}
                            <g transform="translate(140, 0)">
                                <line x1="0" y1="60" x2="155" y2="60" stroke="var(--alu-dim, #94a3b8)" strokeWidth="1" />
                                <line x1="0" y1="380" x2="155" y2="380" stroke="var(--alu-dim, #94a3b8)" strokeWidth="1" />
                                <line x1="40" y1="65" x2="40" y2="375" stroke="#34d399" strokeWidth="1.8" markerStart="url(#brDimArrowGreen)" markerEnd="url(#brDimArrowGreen)" />
                                <rect x="-70" y="211" width="95" height="18" rx="3" fill="var(--bg-1)" stroke="#34d399" strokeWidth="0.8" opacity="0.95" />
                                <text x="-22" y="224" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#34d399" fontFamily="monospace">
                                    D = {D} mm
                                </text>
                            </g>

                            {/* Width B or T or H */}
                            <g transform="translate(300, 395)">
                                <line x1="0" y1="-10" x2="0" y2="18" stroke="#94a3b8" strokeWidth="1" />
                                <line x1="130" y1="-10" x2="130" y2="18" stroke="#94a3b8" strokeWidth="1" />
                                <line x1="6" y1="10" x2="124" y2="10" stroke="#f59e0b" strokeWidth="1.8" markerStart="url(#brDimArrowAmber)" markerEnd="url(#brDimArrowAmber)" />
                                <text x="65" y="28" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#f59e0b" fontFamily="monospace">
                                    {isThrust ? `H = ${effectiveWidth}` : isTaper ? `T = ${effectiveWidth}` : `B = ${effectiveWidth}`} mm
                                </text>
                            </g>
                        </g>
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* MODE 3: FATURA VE DAYANAK ŞEMASI (MOUNTING ABUTMENT VIEW)   */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* MODE 3: FATURA VE DAYANAK ŞEMASI (MOUNTING ABUTMENT VIEW)   */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {viewMode === 'mounting' && (
                        <g>
                            <g transform="translate(28, 36)">
                                <text x="0" y="0" fontSize="16" fontWeight="bold" fill="#f59e0b" fontFamily="monospace">
                                    SKF {skfRecord?.fullDesignation || code} {t.viewMounting}
                                </text>
                                <text x="0" y="20" fontSize="13" fill="#cbd5e1" fontFamily="monospace">
                                    {isThrust ? t.shaftWasher + ' & ' + t.housingWasher : isTaper ? t.coneAndRib : isHK ? t.drawnCupNotice : isCylindrical ? t.flangelessRaceway : t.tabAbutment}
                                </text>
                            </g>

                            {/* Bearing Axis Centerline */}
                            <line x1="40" y1="220" x2="740" y2="220" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="18 4 3 4" opacity="0.8" />
                            <text x="744" y="224" fill="#00e5ff" fontSize="11" fontFamily="monospace">{t.bearingAxis}</text>

                            {isThrust ? (
                                /* ─── EKSENEL BİLYALI MONTAJ ŞEMASI (DIN 5418 / ISO 15) ─── */
                                (() => {
                                    const Xs = 240;
                                    const washerW = 30;
                                    const ballDia = 34;
                                    const totalW = washerW * 2 + ballDia; // 94 px
                                    const Xbe = Xs + totalW;
                                    const XshaftEnd = 670;
                                    const XhousingEnd = 620;

                                    const dispRd = 46;
                                    const dispRD = 136;
                                    const dispH = dispRD - dispRd;
                                    const deltaMm = D - d || 1;
                                    const daVal = daMinVal || (d + deltaMm * 0.6);
                                    const DaVal = DaMaxVal || (d + deltaMm * 0.4);

                                    // Strictly proportional screen radii: da >= 29 mm is taller than Da <= 26 mm
                                    const daRatio = Math.max(0.25, Math.min(0.85, (daVal - d) / deltaMm));
                                    const DaRatio = Math.max(0.15, Math.min(0.80, (DaVal - d) / deltaMm));

                                    const dispRda = Math.round(dispRd + dispH * daRatio);
                                    const dispRDa = Math.round(dispRd + dispH * DaRatio);
                                    const dispRHousing = dispRD + 28;

                                    return (
                                        <g>
                                            {/* Stepped Shaft (Supports Shaft Washer on Left) */}
                                            <path
                                                d={`M 40 ${cy} L 40 ${cy - dispRda} L ${Xs} ${cy - dispRda} L ${Xs} ${cy - dispRd} L ${XshaftEnd} ${cy - dispRd} L ${XshaftEnd} ${cy} Z`}
                                                fill="url(#brShaftHatch)"
                                                stroke="#00e5ff"
                                                strokeWidth="1.8"
                                            />
                                            <path
                                                d={`M 40 ${cy} L 40 ${cy + dispRda} L ${Xs} ${cy + dispRda} L ${Xs} ${cy + dispRd} L ${XshaftEnd} ${cy + dispRd} L ${XshaftEnd} ${cy} Z`}
                                                fill="url(#brShaftHatch)"
                                                stroke="#00e5ff"
                                                strokeWidth="1.8"
                                            />

                                            {/* Housing (Supports Housing Washer on Right) */}
                                            <path
                                                d={`M ${Xs + washerW + 8} ${cy - dispRHousing} L ${XhousingEnd} ${cy - dispRHousing} L ${XhousingEnd} ${cy - dispRDa} L ${Xbe} ${cy - dispRDa} L ${Xbe} ${cy - dispRD} L ${Xs + washerW + 8} ${cy - dispRD} Z`}
                                                fill="url(#brHousingHatch)"
                                                stroke="#64748b"
                                                strokeWidth="1.8"
                                            />
                                            <path
                                                d={`M ${Xs + washerW + 8} ${cy + dispRHousing} L ${XhousingEnd} ${cy + dispRHousing} L ${XhousingEnd} ${cy + dispRDa} L ${Xbe} ${cy + dispRDa} L ${Xbe} ${cy + dispRD} L ${Xs + washerW + 8} ${cy + dispRD} Z`}
                                                fill="url(#brHousingHatch)"
                                                stroke="#64748b"
                                                strokeWidth="1.8"
                                            />

                                            {/* Shaft Washer (Left, tight fit on shaft d, seated on da) */}
                                            <rect x={Xs} y={cy - dispRD} width={washerW} height={dispH} rx="3" fill="url(#brInnerHatch)" stroke="#34d399" strokeWidth="1.8" />
                                            <rect x={Xs} y={cy + dispRd} width={washerW} height={dispH} rx="3" fill="url(#brInnerHatchLower)" stroke="#34d399" strokeWidth="1.8" />
                                            <text x={Xs + washerW / 2} y={cy - dispRD + dispH / 2 + 4} fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.shaftWasher}</text>

                                            {/* Thrust Balls in Cage */}
                                            <g transform={`translate(${Xs + washerW + ballDia / 2}, ${cy - (dispRd + dispRD) / 2})`}>
                                                <circle cx="0" cy="0" r={ballDia / 2 - 2} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.4" />
                                            </g>
                                            <g transform={`translate(${Xs + washerW + ballDia / 2}, ${cy + (dispRd + dispRD) / 2})`}>
                                                <circle cx="0" cy="0" r={ballDia / 2 - 2} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.4" />
                                            </g>

                                            {/* Housing Washer (Right, bore clearance gap over shaft d, outer D seated in housing) */}
                                            <rect x={Xs + washerW + ballDia} y={cy - dispRD} width={washerW} height={dispH - 14} rx="3" fill="url(#brOuterHatch)" stroke="#38bdf8" strokeWidth="1.8" />
                                            <rect x={Xs + washerW + ballDia} y={cy + dispRd + 14} width={washerW} height={dispH - 14} rx="3" fill="url(#brOuterHatchLower)" stroke="#38bdf8" strokeWidth="1.8" />
                                            <text x={Xs + washerW + ballDia + washerW / 2} y={cy - dispRD + dispH / 2} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.housingWasher}</text>

                                            {/* Clearance Gap Label */}
                                            <text x={Xs + washerW + ballDia + washerW / 2} y={cy - dispRd - 4} fill="#f59e0b" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t12(language, 'Clearance', 'Boşluk')}</text>

                                            {/* Axial Load Fa Arrow */}
                                            <line x1={Xs - 75} y1={cy} x2={Xs - 15} y2={cy} stroke="#34d399" strokeWidth="3" markerEnd="url(#brDimArrowGreen)" />
                                            <text x={Xs - 45} y={cy - 10} fill="#34d399" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t.axialLoadDirection}</text>

                                            {/* Shaft Shoulder da Dimension Line */}
                                            <line x1="125" y1={cy - dispRda} x2="125" y2={cy + dispRda} stroke="#00e5ff" strokeWidth="1.5" markerStart="url(#brDimArrow)" markerEnd="url(#brDimArrow)" />
                                            <g transform="translate(32, 74)">
                                                <rect x="0" y="0" width="150" height="48" fill="var(--bg-1)" stroke="var(--cyan, #00e5ff)" strokeWidth="1.3" rx="6" opacity="0.95" />
                                                <text x="12" y="18" fill="var(--cyan, #00e5ff)" fontSize="11" fontWeight="bold" fontFamily="monospace">{t.shaftAbutment}</text>
                                                <text x="12" y="36" fill="var(--ink, #ffffff)" fontSize="13" fontWeight="bold" fontFamily="monospace">≥ {daMinVal} mm</text>
                                            </g>

                                            {/* Housing Shoulder Da Dimension Line */}
                                            <line x1={Xbe + 18} y1={cy - dispRDa} x2={Xbe + 18} y2={cy + dispRDa} stroke="var(--cyan, #38bdf8)" strokeWidth="1.5" markerStart="url(#brDimArrow)" markerEnd="url(#brDimArrow)" />
                                            <g transform="translate(480, 74)">
                                                <rect x="0" y="0" width="160" height="48" fill="var(--bg-1)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.3" rx="6" opacity="0.95" />
                                                <text x="12" y="18" fill="var(--cyan, #38bdf8)" fontSize="11" fontWeight="bold" fontFamily="monospace">{t.housingAbutment}</text>
                                                <text x="12" y="36" fill="var(--ink, #ffffff)" fontSize="13" fontWeight="bold" fontFamily="monospace">≤ {DaMaxVal} mm</text>
                                            </g>
                                        </g>
                                    );
                                })()
                            ) : isHK ? (
                                /* ─── HK SAC KOVAN MONTAJ ŞEMASI (DIN 618 / ISO 3245) ─── */
                                (() => {
                                    const Xs = 240;
                                    const cupWidth = Math.max(90, Math.min(140, Math.round(80 + (effectiveWidth / (D - d || 1)) * 30)));
                                    const Xbe = Xs + cupWidth;
                                    const XshaftEnd = 670;

                                    const dispRd = 58; // screen bore radius
                                    const needleDia = 24; // needle roller thickness
                                    const cupThick = 5; // drawn steel cup thickness
                                    const dispRD = dispRd + needleDia + cupThick; // 87 px
                                    const dispRHousing = dispRD + 35; // 122 px

                                    return (
                                        <g>
                                            {/* Ground & Hardened Shaft (Continuous, No Shoulders Needed) */}
                                            <rect x="40" y={cy - dispRd} width={XshaftEnd - 40} height={dispRd * 2} fill="url(#brShaftHatch)" stroke="var(--cyan, #00e5ff)" strokeWidth="1.8" />
                                            <line x1="40" y1={cy} x2={XshaftEnd} y2={cy} stroke="var(--cyan, #00e5ff)" strokeWidth="1.2" strokeDasharray="16 4 3 4" opacity="0.7" />

                                            {/* Housing with Interference Fit Bore */}
                                            <path
                                                d={`M 160 ${cy - dispRHousing} L ${Xbe + 80} ${cy - dispRHousing} L ${Xbe + 80} ${cy - dispRD} L 160 ${cy - dispRD} Z`}
                                                fill="url(#brHousingHatch)"
                                                stroke="var(--line, #64748b)"
                                                strokeWidth="1.8"
                                            />
                                            <path
                                                d={`M 160 ${cy + dispRHousing} L ${Xbe + 80} ${cy + dispRHousing} L ${Xbe + 80} ${cy + dispRD} L 160 ${cy + dispRD} Z`}
                                                fill="url(#brHousingHatch)"
                                                stroke="var(--line, #64748b)"
                                                strokeWidth="1.8"
                                            />

                                            {/* Thin Drawn Steel Cup (Pressed in Housing Bore, wrapped over needles) */}
                                            <path
                                                d={`M ${Xs} ${cy - dispRD} L ${Xbe} ${cy - dispRD} L ${Xbe} ${cy - dispRD + 12} L ${Xbe - 4} ${cy - dispRD + 12} L ${Xbe - 4} ${cy - dispRD + cupThick} L ${Xs + 4} ${cy - dispRD + cupThick} L ${Xs + 4} ${cy - dispRD + 12} L ${Xs} ${cy - dispRD + 12} Z`}
                                                fill="#38bdf8"
                                                stroke="#0284c7"
                                                strokeWidth="1.2"
                                            />
                                            <path
                                                d={`M ${Xs} ${cy + dispRD} L ${Xbe} ${cy + dispRD} L ${Xbe} ${cy + dispRD - 12} L ${Xbe - 4} ${cy + dispRD - 12} L ${Xbe - 4} ${cy + dispRD - cupThick} L ${Xs + 4} ${cy + dispRD - cupThick} L ${Xs + 4} ${cy + dispRD - 12} L ${Xs} ${cy + dispRD - 12} Z`}
                                                fill="#38bdf8"
                                                stroke="#0284c7"
                                                strokeWidth="1.2"
                                            />

                                            {/* Slender Needle Rollers Running Directly on Shaft and in Cup */}
                                            <rect x={Xs + 8} y={cy - dispRd - needleDia} width={cupWidth - 16} height={needleDia} rx="2" fill="url(#brCylinderEndGrad)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.4" />
                                            <rect x={Xs + 8} y={cy + dispRd} width={cupWidth - 16} height={needleDia} rx="2" fill="url(#brCylinderEndGrad)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.4" />
                                            <text x={Xs + cupWidth / 2} y={cy - dispRd - 8} fill="var(--ink, #020617)" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HK {t.needleRoller}</text>

                                            {/* Direct Ground Shaft Callout Card */}
                                            <g transform="translate(30, 78)">
                                                <rect x="0" y="0" width="180" height="54" fill="var(--bg-1)" stroke="var(--cyan, #00e5ff)" strokeWidth="1.3" rx="6" opacity="0.95" />
                                                <text x="12" y="18" fill="var(--cyan, #00e5ff)" fontSize="11" fontWeight="bold" fontFamily="monospace">{t12(language, `SHAFT: Ø ${d} mm (h6)`, `MİL: Ø ${d} mm (h6)`)}</text>
                                                <text x="12" y="34" fill="var(--ink, #ffffff)" fontSize="11" fontFamily="monospace">{t12(language, '58 - 64 HRC Hardness', '58 - 64 HRC Sertlik')}</text>
                                                <text x="12" y="47" fill="var(--alu-dim, #94a3b8)" fontSize="10" fontFamily="monospace">{t12(language, 'Ra ≤ 0.2 µm Ground Finish', 'Ra ≤ 0.2 µm Taşlanmış')}</text>
                                            </g>

                                            {/* Housing Interference Fit Card */}
                                            <g transform="translate(470, 74)">
                                                <rect x="0" y="0" width="190" height="54" fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="1.3" rx="6" opacity="0.95" />
                                                <text x="12" y="18" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">{t12(language, `HOUSING: Ø ${D} mm (N6 / R6)`, `GÖVDE: Ø ${D} mm (N6 / R6)`)}</text>
                                                <text x="12" y="34" fill="var(--ink, #ffffff)" fontSize="11" fontFamily="monospace">{t12(language, 'Interference Press Fit', 'Pres Geçme Sıkılık')}</text>
                                                <text x="12" y="47" fill="var(--alu-dim, #94a3b8)" fontSize="10" fontFamily="monospace">{t12(language, 'No Axial Shoulders Required', 'Eksenel Fatura Gerekmez')}</text>
                                            </g>

                                            {/* Info Badge at bottom */}
                                            <g transform="translate(180, 365)">
                                                <rect x="-10" y="-12" width="420" height="34" fill="var(--bg-1)" stroke="var(--cyan, #38bdf8)" strokeWidth="1" rx="6" opacity="0.95" />
                                                <text x="200" y="10" fill="var(--cyan, #38bdf8)" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                                    {t.drawnCupNotice}
                                                </text>
                                            </g>
                                        </g>
                                    );
                                })()
                            ) : (
                                /* ─── STANDART RADYAL & KONİK DIN 5418 MONTAJ VE FATURA ÇİZİMİ ─── */
                                (() => {
                                    const Xs = 255; // Shaft shoulder face X position
                                    const dispWidth = Math.max(90, Math.min(135, Math.round(80 + (effectiveWidth / (D - d || 1)) * 32)));
                                    const Xbe = Xs + dispWidth; // Bearing end X position
                                    const XshaftEnd = 670;
                                    const XhousingEnd = 605;

                                    const dispRd = 48; // Screen bore radius
                                    const dispRD = 136; // Screen outer radius
                                    const dispH = dispRD - dispRd; // 88 px
                                    const realDelta = D - d || 1;

                                    // Proportional and realistic shoulder heights per DIN 5418
                                    const daMid = daMinVal && daMaxVal ? (daMinVal + daMaxVal) / 2 : (daMinVal || (d + realDelta * 0.22));
                                    const daRatio = Math.max(0.18, Math.min(0.38, (daMid - d) / realDelta));
                                    const dispRda = Math.round(dispRd + dispH * daRatio); // e.g. ~66 px

                                    const DaMid = DaMaxVal ? DaMaxVal : (D - realDelta * 0.22);
                                    const DaRatio = Math.max(0.68, Math.min(0.88, (DaMid - d) / realDelta));
                                    const dispRDa = Math.round(dispRd + dispH * DaRatio); // e.g. ~118 px

                                    const dispRHousing = dispRD + 28; // ~164 px
                                    const dispRa = 6; // Shaft & housing fillet radius in px
                                    const dispRmin = 9; // Bearing ring chamfer in px (> dispRa)

                                    const rollPitch = (dispRd + dispRD) / 2;
                                    const rollRadius = Math.max(9, Math.min(22, dispH * 0.22));

                                    return (
                                        <g>
                                            {/* ─── 1. STEPPED SHAFT WITH DIN 5418 FILLET (ra) ─── */}
                                            {/* Upper Shaft Half */}
                                            <path
                                                d={`M 40 ${cy} L 40 ${cy - dispRda} L ${Xs} ${cy - dispRda} L ${Xs} ${cy - dispRd - dispRa} A ${dispRa} ${dispRa} 0 0 0 ${Xs + dispRa} ${cy - dispRd} L ${XshaftEnd} ${cy - dispRd} L ${XshaftEnd} ${cy} Z`}
                                                fill="url(#brShaftHatch)"
                                                stroke="#00e5ff"
                                                strokeWidth="1.8"
                                            />
                                            {/* Lower Shaft Half (Symmetrical) */}
                                            <path
                                                d={`M 40 ${cy} L 40 ${cy + dispRda} L ${Xs} ${cy + dispRda} L ${Xs} ${cy + dispRd + dispRa} A ${dispRa} ${dispRa} 0 0 1 ${Xs + dispRa} ${cy + dispRd} L ${XshaftEnd} ${cy + dispRd} L ${XshaftEnd} ${cy} Z`}
                                                fill="url(#brShaftHatch)"
                                                stroke="#00e5ff"
                                                strokeWidth="1.8"
                                            />
                                            {/* Machined end face markers */}
                                            <line x1="40" y1={cy - dispRda} x2="40" y2={cy + dispRda} stroke="#00e5ff" strokeWidth="2" />
                                            <line x1={XshaftEnd} y1={cy - dispRd} x2={XshaftEnd} y2={cy + dispRd} stroke="#00e5ff" strokeWidth="2" />

                                            {/* ─── 2. HOUSING & HOUSING ABUTMENT (Da) PER DIN 5418 ─── */}
                                            {/* Upper Housing Block (Left Shoulder Da Seating Outer Ring) */}
                                            <path
                                                d={`M 60 ${cy - dispRHousing} L ${Xbe + 35} ${cy - dispRHousing} L ${Xbe + 35} ${cy - dispRD} L ${Xs + dispRa} ${cy - dispRD} A ${dispRa} ${dispRa} 0 0 1 ${Xs} ${cy - dispRD + dispRa} L ${Xs} ${cy - dispRDa} L 60 ${cy - dispRDa} Z`}
                                                fill="url(#brHousingHatch)"
                                                stroke="#64748b"
                                                strokeWidth="1.8"
                                            />
                                            {/* Lower Housing Block (Symmetrical) */}
                                            <path
                                                d={`M 60 ${cy + dispRHousing} L ${Xbe + 35} ${cy + dispRHousing} L ${Xbe + 35} ${cy + dispRD} L ${Xs + dispRa} ${cy + dispRD} A ${dispRa} ${dispRa} 0 0 0 ${Xs} ${cy + dispRD - dispRa} L ${Xs} ${cy + dispRDa} L 60 ${cy + dispRDa} Z`}
                                                fill="url(#brHousingHatch)"
                                                stroke="#64748b"
                                                strokeWidth="1.8"
                                            />

                                            {/* ─── 3. BEARING ASSEMBLY SEATED AGAINST SHOULDER ─── */}
                                            {/* ─── 3a. UPPER BEARING CROSS-SECTION ─── */}
                                            {/* Upper Inner Ring with Chamfer Clearance over Shaft Fillet */}
                                            <path
                                                d={`M ${Xs} ${cy - dispRd - dispRmin} L ${Xs} ${cy - dispRd - dispH * 0.32} L ${Xbe} ${cy - dispRd - dispH * 0.32} L ${Xbe} ${cy - dispRd} L ${Xs + dispRmin} ${cy - dispRd} A ${dispRmin} ${dispRmin} 0 0 1 ${Xs} ${cy - dispRd - dispRmin} Z`}
                                                fill="url(#brInnerHatch)"
                                                stroke="#34d399"
                                                strokeWidth="1.8"
                                            />

                                            {/* Upper Outer Ring Seated against Housing Shoulder at Xs */}
                                            <path
                                                d={`M ${Xs} ${cy - dispRD + dispRmin} L ${Xs + dispRmin} ${cy - dispRD} L ${Xbe} ${cy - dispRD} L ${Xbe} ${cy - dispRd - dispH * 0.68} L ${Xs} ${cy - dispRd - dispH * 0.68} Z`}
                                                fill="url(#brOuterHatch)"
                                                stroke="#38bdf8"
                                                strokeWidth="1.8"
                                            />

                                            {/* Upper Rolling Element (True Geometric Profile) */}
                                            {isTaper ? (
                                                <g>
                                                    <path
                                                        d={`M ${Xs + 8} ${cy - dispRd - dispH * 0.70} L ${Xbe - 8} ${cy - dispRd - dispH * 0.78} Q ${Xbe - 4} ${cy - rollPitch} ${Xbe - 8} ${cy - dispRd - dispH * 0.24} L ${Xs + 8} ${cy - dispRd - dispH * 0.30} Z`}
                                                        fill="url(#brTaperEndGrad)"
                                                        stroke="#f59e0b"
                                                        strokeWidth="1.5"
                                                    />
                                                </g>
                                            ) : isNeedle ? (
                                                <g>
                                                    <rect
                                                        x={Xs + 8}
                                                        y={cy - rollPitch - 7}
                                                        width={dispWidth - 16}
                                                        height="14"
                                                        rx="2"
                                                        fill="url(#brCylinderEndGrad)"
                                                        stroke="#38bdf8"
                                                        strokeWidth="1.4"
                                                    />
                                                    <text x={Xs + dispWidth / 2} y={cy - rollPitch + 4} fill="#020617" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                                        {t.needleRoller}
                                                    </text>
                                                </g>
                                            ) : isCylindrical ? (
                                                <g>
                                                    <rect
                                                        x={Xs + 10}
                                                        y={cy - rollPitch - 15}
                                                        width={dispWidth - 20}
                                                        height="30"
                                                        rx="2.5"
                                                        fill="url(#brCylinderEndGrad)"
                                                        stroke="#cbd5e1"
                                                        strokeWidth="1.5"
                                                    />
                                                    <circle cx={Xs + dispWidth / 2} cy={cy - rollPitch} r="2.5" fill="#334155" />
                                                </g>
                                            ) : isSpherical ? (
                                                <g>
                                                    <ellipse cx={Xs + dispWidth * 0.32} cy={cy - rollPitch} rx={dispWidth * 0.18} ry={dispH * 0.17} fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.4" />
                                                    <ellipse cx={Xs + dispWidth * 0.68} cy={cy - rollPitch} rx={dispWidth * 0.18} ry={dispH * 0.17} fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.4" />
                                                </g>
                                            ) : isSelfAligning ? (
                                                <g>
                                                    <circle cx={Xs + dispWidth * 0.32} cy={cy - rollPitch} r={rollRadius * 0.85} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                                    <circle cx={Xs + dispWidth * 0.68} cy={cy - rollPitch} r={rollRadius * 0.85} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                                </g>
                                            ) : isAngular ? (
                                                <g>
                                                    <circle cx={Xs + dispWidth / 2} cy={cy - rollPitch} r={rollRadius} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.3" />
                                                    <line x1={Xs + 8} y1={cy - dispRd - dispH * 0.28} x2={Xbe - 8} y2={cy - dispRd - dispH * 0.72} stroke="#ec4899" strokeWidth="2" strokeDasharray="3 2" />
                                                </g>
                                            ) : (
                                                <circle cx={Xs + dispWidth / 2} cy={cy - rollPitch} r={rollRadius} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.4" />
                                            )}

                                            {/* ─── 3b. LOWER BEARING CROSS-SECTION (EXACT SYMMETRY ACROSS cy=220) ─── */}
                                            <g transform={`translate(0, ${cy * 2}) scale(1, -1)`}>
                                                <path
                                                    d={`M ${Xs} ${cy - dispRd - dispRmin} L ${Xs} ${cy - dispRd - dispH * 0.32} L ${Xbe} ${cy - dispRd - dispH * 0.32} L ${Xbe} ${cy - dispRd} L ${Xs + dispRmin} ${cy - dispRd} A ${dispRmin} ${dispRmin} 0 0 1 ${Xs} ${cy - dispRd - dispRmin} Z`}
                                                    fill="url(#brInnerHatchLower)"
                                                    stroke="#34d399"
                                                    strokeWidth="1.8"
                                                />
                                                <path
                                                    d={`M ${Xs} ${cy - dispRD + dispRmin} L ${Xs + dispRmin} ${cy - dispRD} L ${Xbe} ${cy - dispRD} L ${Xbe} ${cy - dispRd - dispH * 0.68} L ${Xs} ${cy - dispRd - dispH * 0.68} Z`}
                                                    fill="url(#brOuterHatchLower)"
                                                    stroke="#38bdf8"
                                                    strokeWidth="1.8"
                                                />
                                                {isTaper ? (
                                                    <path
                                                        d={`M ${Xs + 8} ${cy - dispRd - dispH * 0.70} L ${Xbe - 8} ${cy - dispRd - dispH * 0.78} Q ${Xbe - 4} ${cy - rollPitch} ${Xbe - 8} ${cy - dispRd - dispH * 0.24} L ${Xs + 8} ${cy - dispRd - dispH * 0.30} Z`}
                                                        fill="url(#brTaperEndGrad)"
                                                        stroke="#f59e0b"
                                                        strokeWidth="1.5"
                                                    />
                                                ) : isNeedle ? (
                                                    <rect
                                                        x={Xs + 8}
                                                        y={cy - rollPitch - 7}
                                                        width={dispWidth - 16}
                                                        height="14"
                                                        rx="2"
                                                        fill="url(#brCylinderEndGrad)"
                                                        stroke="#38bdf8"
                                                        strokeWidth="1.4"
                                                    />
                                                ) : isCylindrical ? (
                                                    <rect
                                                        x={Xs + 10}
                                                        y={cy - rollPitch - 15}
                                                        width={dispWidth - 20}
                                                        height="30"
                                                        rx="2.5"
                                                        fill="url(#brCylinderEndGrad)"
                                                        stroke="#cbd5e1"
                                                        strokeWidth="1.5"
                                                    />
                                                ) : isSpherical ? (
                                                    <g>
                                                        <ellipse cx={Xs + dispWidth * 0.32} cy={cy - rollPitch} rx={dispWidth * 0.18} ry={dispH * 0.17} fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.4" />
                                                        <ellipse cx={Xs + dispWidth * 0.68} cy={cy - rollPitch} rx={dispWidth * 0.18} ry={dispH * 0.17} fill="url(#brCylinderEndGrad)" stroke="#cbd5e1" strokeWidth="1.4" />
                                                    </g>
                                                ) : isSelfAligning ? (
                                                    <g>
                                                        <circle cx={Xs + dispWidth * 0.32} cy={cy - rollPitch} r={rollRadius * 0.85} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                                        <circle cx={Xs + dispWidth * 0.68} cy={cy - rollPitch} r={rollRadius * 0.85} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.2" />
                                                    </g>
                                                ) : isAngular ? (
                                                    <circle cx={Xs + dispWidth / 2} cy={cy - rollPitch} r={rollRadius} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.3" />
                                                ) : (
                                                    <circle cx={Xs + dispWidth / 2} cy={cy - rollPitch} r={rollRadius} fill="url(#brChromeSphere)" stroke="#ffffff" strokeWidth="1.4" />
                                                )}
                                            </g>

                                            {/* ─── 4. AXIAL RETENTION ELEMENT (DIN 981 KM LOCKNUT / CIRCLIP) ─── */}
                                            <g transform={`translate(${Xbe + 3}, 0)`}>
                                                {/* Locknut / Circlip Clamping Washer */}
                                                <rect x="0" y={cy - dispRd - 6} width="10" height={dispRd * 2 + 12} fill="#1e293b" stroke="#f59e0b" strokeWidth="1.3" rx="1.5" />
                                                {/* Locknut Body */}
                                                <rect x="10" y={cy - dispRd - 14} width="22" height={dispRd * 2 + 28} fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" rx="2.5" />
                                                <line x1="21" y1={cy - dispRd - 14} x2="21" y2={cy + dispRd + 14} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />
                                                <text x="21" y={cy - dispRd - 18} fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                                    {abutment.locknut?.designation?.replace('DIN 981 ', '') || 'KM 4'}
                                                </text>
                                            </g>

                                            {/* ─── 5. PRECISION CAD DIMENSIONS & LEADERS ─── */}
                                            {/* 5a. Shaft Shoulder da (DIN 5418) */}
                                            <line x1="110" y1={cy - dispRda} x2="110" y2={cy + dispRda} stroke="#00e5ff" strokeWidth="1.5" markerStart="url(#brDimArrow)" markerEnd="url(#brDimArrow)" />
                                            <line x1="100" y1={cy - dispRda} x2={Xs} y2={cy - dispRda} stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />
                                            <line x1="100" y1={cy + dispRda} x2={Xs} y2={cy + dispRda} stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />

                                            {/* da Card */}
                                            <g transform="translate(30, 72)">
                                                <rect x="0" y="0" width="155" height="50" fill="var(--bg-1)" stroke="var(--cyan, #00e5ff)" strokeWidth="1.4" rx="6" opacity="0.95" />
                                                <text x="12" y="18" fill="var(--cyan, #00e5ff)" fontSize="11" fontWeight="bold" fontFamily="monospace">{t.shaftAbutment}</text>
                                                <text x="12" y="38" fill="var(--ink, #ffffff)" fontSize="13" fontWeight="bold" fontFamily="monospace">
                                                    da: {daMinVal} - {daMaxVal} mm
                                                </text>
                                            </g>

                                            {/* 5b. Housing Shoulder Da (DIN 5418) */}
                                            <line x1="175" y1={cy - dispRDa} x2="175" y2={cy + dispRDa} stroke="var(--cyan, #38bdf8)" strokeWidth="1.5" markerStart="url(#brDimArrow)" markerEnd="url(#brDimArrow)" />
                                            <line x1="165" y1={cy - dispRDa} x2={Xs} y2={cy - dispRDa} stroke="var(--cyan, #38bdf8)" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />
                                            <line x1="165" y1={cy + dispRDa} x2={Xs} y2={cy + dispRDa} stroke="var(--cyan, #38bdf8)" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />

                                            {/* Da Card */}
                                            <g transform="translate(485, 68)">
                                                <rect x="0" y="0" width="165" height="50" fill="var(--bg-1)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.4" rx="6" opacity="0.95" />
                                                <text x="12" y="18" fill="var(--cyan, #38bdf8)" fontSize="11" fontWeight="bold" fontFamily="monospace">{t.housingAbutment}</text>
                                                <text x="12" y="38" fill="var(--ink, #ffffff)" fontSize="13" fontWeight="bold" fontFamily="monospace">
                                                    Da ≤ {DaMaxVal} mm
                                                </text>
                                            </g>

                                            {/* 5c. Shaft Seat Diameter d */}
                                            <line x1="560" y1={cy - dispRd} x2="560" y2={cy + dispRd} stroke="#34d399" strokeWidth="1.5" markerStart="url(#brDimArrowGreen)" markerEnd="url(#brDimArrowGreen)" />
                                            <g transform="translate(485, 195)">
                                                <rect x="0" y="0" width="165" height="42" fill="var(--bg-1)" stroke="#34d399" strokeWidth="1.2" rx="6" opacity="0.95" />
                                                <text x="12" y="16" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">{t12(language, 'SHAFT DIAMETER (d)', 'MİL ÇAPI (d)')}</text>
                                                <text x="12" y="33" fill="var(--ink, #ffffff)" fontSize="12" fontWeight="bold" fontFamily="monospace">
                                                    Ø {d} mm ({abutment.shaftFit || 'k5'})
                                                </text>
                                            </g>

                                            {/* 5d. Shaft Fillet Radius ra & Clearance Guarantee */}
                                            {/* Curved Leader Line pointing directly to the fillet */}
                                            <path
                                                d={`M 175 340 L 220 340 L ${Xs + 2} ${cy + dispRd + 3}`}
                                                fill="none"
                                                stroke="#f59e0b"
                                                strokeWidth="1.6"
                                                markerEnd="url(#brDimArrowAmber)"
                                            />
                                            <g transform="translate(30, 318)">
                                                <rect x="0" y="0" width="195" height="54" fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="1.4" rx="6" opacity="0.95" />
                                                <text x="12" y="18" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">{t.filletRadius}</text>
                                                <text x="12" y="34" fill="var(--ink, #ffffff)" fontSize="12" fontWeight="bold" fontFamily="monospace">
                                                    ra ≤ {raMaxVal} mm (r1,2 = {rMinVal})
                                                </text>
                                                <text x="12" y="47" fill="#34d399" fontSize="9.5" fontFamily="monospace">
                                                    {t12(language, '✓ ra < r1,2 Non-Interference Guarantee', '✓ ra < r1,2 Köşe Kasmama Güvencesi')}
                                                </text>
                                            </g>

                                            {/* 5e. Bearing Width B */}
                                            <line x1={Xs} y1={cy + dispRHousing + 12} x2={Xbe} y2={cy + dispRHousing + 12} stroke="#f59e0b" strokeWidth="1.5" markerStart="url(#brDimArrowAmber)" markerEnd="url(#brDimArrowAmber)" />
                                            <line x1={Xs} y1={cy + dispRHousing + 4} x2={Xs} y2={cy + dispRHousing + 20} stroke="#94a3b8" strokeWidth="0.8" />
                                            <line x1={Xbe} y1={cy + dispRHousing + 4} x2={Xbe} y2={cy + dispRHousing + 20} stroke="#94a3b8" strokeWidth="0.8" />
                                            <text x={Xs + dispWidth / 2} y={cy + dispRHousing + 28} fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                                {isTaper ? `T = ${effectiveWidth} mm` : `B = ${effectiveWidth} mm`}
                                            </text>
                                        </g>
                                    );
                                })()
                            )}
                        </g>
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* MODE 4: SÖKÜM VE MONTAJ ALETLERİ (MAINTENANCE TOOLS VIEW)   */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {viewMode === 'tools' && (
                        <g>
                            <g transform="translate(28, 36)">
                                <text x="0" y="0" fontSize="16" fontWeight="bold" fill="#c084fc" fontFamily="monospace">
                                    SKF {skfRecord?.fullDesignation || code} {t.viewTools}
                                </text>
                                <text x="0" y="20" fontSize="13" fill="#cbd5e1" fontFamily="monospace">
                                    SKF Maintenance Handbook (PUB SR/P7 10001/1 EN)
                                </text>
                            </g>

                            {/* Left Box: Mounting Procedure Schematic */}
                            <g transform="translate(50, 90)">
                                <rect x="0" y="0" width="310" height="300" fill="var(--bg-1)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.5" rx="10" />
                                <text x="20" y="32" fill="var(--cyan, #38bdf8)" fontSize="14" fontWeight="bold" fontFamily="monospace">
                                    🟢 {t.mountingMethod}
                                </text>
                                <text x="20" y="58" fill="var(--ink, #ffffff)" fontSize="13" fontWeight="bold" fontFamily="monospace">
                                    {maintenanceProtocol.recommendedMountingTools[0]?.toolCode || 'SKF TMFT 36'}
                                </text>
                                <text x="20" y="78" fill="var(--cyan, #a5f3fc)" fontSize="12" fontFamily="monospace">
                                    {t12(language, maintenanceProtocol.recommendedMountingTools[0]?.toolNameEn || 'SKF Impact Fitting Tool', maintenanceProtocol.recommendedMountingTools[0]?.descriptionTr)}
                                </text>

                                {/* Tool CAD Schematic */}
                                {isCylindrical ? (
                                    <g transform="translate(45, 110)">
                                        <rect x="0" y="0" width="220" height="95" fill="var(--bg-2)" stroke="#f59e0b" strokeWidth="1.8" rx="6" />
                                        <text x="110" y="38" fill="#f59e0b" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">SKF TIH 030m</text>
                                        <text x="110" y="62" fill="var(--ink, #ffffff)" fontSize="12" textAnchor="middle" fontFamily="monospace">110°C Induction Heating</text>
                                        <text x="110" y="82" fill="var(--cyan, #38bdf8)" fontSize="11" textAnchor="middle" fontFamily="monospace">Magnetic Temperature Probe</text>
                                    </g>
                                ) : isHK ? (
                                    <g transform="translate(45, 110)">
                                        <rect x="0" y="0" width="220" height="95" fill="var(--bg-2)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.8" rx="6" />
                                        <text x="110" y="38" fill="var(--cyan, #38bdf8)" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">SKF TMFT Mandrel</text>
                                        <text x="110" y="62" fill="var(--ink, #ffffff)" fontSize="12" textAnchor="middle" fontFamily="monospace">Pilot Pin Press Fitting</text>
                                        <text x="110" y="82" fill="var(--cyan, #a5f3fc)" fontSize="11" textAnchor="middle" fontFamily="monospace">Uniform Perpendicular Press</text>
                                    </g>
                                ) : (
                                    <g transform="translate(45, 110)">
                                        <rect x="0" y="0" width="220" height="95" fill="var(--bg-2)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.8" rx="6" />
                                        <text x="110" y="38" fill="var(--cyan, #38bdf8)" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">SKF TMFT 36</text>
                                        <text x="110" y="62" fill="var(--ink, #ffffff)" fontSize="12" textAnchor="middle" fontFamily="monospace">Impact Fitting Ring & Sleeve</text>
                                        <text x="110" y="82" fill="#34d399" fontSize="11" textAnchor="middle" fontFamily="monospace">Equal Ring Pressure</text>
                                    </g>
                                )}

                                <g transform="translate(20, 230)">
                                    <text x="0" y="0" fill="var(--alu-dim, #94a3b8)" fontSize="11" fontFamily="monospace">{t.mountingForceRule}</text>
                                    <text x="0" y="18" fill="var(--ink, #e2e8f0)" fontSize="12" fontFamily="monospace">
                                        {isThrust ? t.forceRuleNotice : t.forceRuleNotice}
                                    </text>
                                    <text x="0" y="38" fill="#34d399" fontSize="12" fontFamily="monospace">
                                        {t.greaseReplenishment} {abutment.replenishmentGreaseGrams} g
                                    </text>
                                </g>
                            </g>

                            {/* Right Box: Dismounting Procedure Schematic */}
                            <g transform="translate(400, 90)">
                                <rect x="0" y="0" width="330" height="300" fill="var(--bg-1)" stroke="#ef4444" strokeWidth="1.5" rx="10" />
                                <text x="20" y="32" fill="#f87171" fontSize="14" fontWeight="bold" fontFamily="monospace">
                                    🔴 {t.dismountingMethod}
                                </text>
                                <text x="20" y="58" fill="var(--ink, #ffffff)" fontSize="13" fontWeight="bold" fontFamily="monospace">
                                    {maintenanceProtocol.recommendedDismountingTools[0]?.toolCode || 'SKF TMMA 60'}
                                </text>
                                <text x="20" y="78" fill="#fca5a5" fontSize="12" fontFamily="monospace">
                                    {t12(language, maintenanceProtocol.recommendedDismountingTools[0]?.toolNameEn || 'SKF EasyPull Mechanical Puller', maintenanceProtocol.recommendedDismountingTools[0]?.descriptionTr)}
                                </text>

                                {/* Dismount Tool CAD Schematic */}
                                {isHK ? (
                                    <g transform="translate(20, 105)">
                                        <rect x="0" y="0" width="290" height="100" fill="#450a0a" stroke="#ef4444" strokeWidth="2" rx="6" />
                                        <text x="145" y="30" fill="#ef4444" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                            {t.destructiveDismountNotice}
                                        </text>
                                    </g>
                                ) : isCylindrical ? (
                                    <g transform="translate(20, 105)">
                                        <rect x="0" y="0" width="290" height="100" fill="var(--bg-2)" stroke="#818cf8" strokeWidth="2" rx="6" />
                                        <text x="145" y="30" fill="#a5b4fc" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                            SKF TMBR Heating Rings
                                        </text>
                                        <text x="145" y="54" fill="var(--ink, #ffffff)" fontSize="12" textAnchor="middle" fontFamily="monospace">
                                            {t.flangelessRaceway}
                                        </text>
                                        <text x="145" y="74" fill="var(--cyan, #38bdf8)" fontSize="11" textAnchor="middle" fontFamily="monospace">
                                            Max. 280°C
                                        </text>
                                    </g>
                                ) : (
                                    <g transform="translate(20, 105)">
                                        <rect x="0" y="0" width="290" height="100" fill="var(--bg-2)" stroke="#f87171" strokeWidth="1.8" rx="6" />
                                        <text x="145" y="30" fill="#f87171" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                            SKF TMMA 60 EasyPull
                                        </text>
                                        <text x="145" y="54" fill="var(--ink, #ffffff)" fontSize="12" textAnchor="middle" fontFamily="monospace">
                                            Spring-assisted Mechanical Puller
                                        </text>
                                    </g>
                                )}

                                <g transform="translate(20, 230)">
                                    <text x="0" y="0" fill="var(--alu-dim, #94a3b8)" fontSize="11" fontFamily="monospace">{t.reuseProtocol}</text>
                                    <text x="0" y="18" fill="var(--ink, #e2e8f0)" fontSize="12" fontFamily="monospace">
                                        {isHK ? t.destructiveDismountNotice : 'Inspect raceways for spalling before reuse.'}
                                    </text>
                                    <text x="0" y="38" fill="var(--cyan, #38bdf8)" fontSize="12" fontFamily="monospace">
                                        Clean with SKF VM 1000 Solvent.
                                    </text>
                                </g>
                            </g>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}
