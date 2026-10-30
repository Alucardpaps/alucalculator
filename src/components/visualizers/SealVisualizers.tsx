'use client';

import React, { useState } from 'react';
import { Language } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { GlandApplicationType } from '@/lib/calculations/oringGland';
import { SuptexSealType, KastasSeriesInfo } from '@/data/sealsCatalogDatabase';
import { Eye, EyeOff, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

// =============================================================================
// 1. ISO 3601 O-RING GLAND CROSS-SECTION BLUEPRINT
// Grounded in ISO 3601-2 & Parker O-Ring Handbook Gland Design
// Supports Radial Piston, Radial Rod, and Axial Face (Internal/External) Glands
// =============================================================================

export interface ORingCrossSectionSVGProps {
    cordDia: number;
    depth: number;
    width: number;
    squeezePercent: number;
    pressureBar: number;
    radialGap: number;
    maxAllowedGap?: number;
    backupRingRequired?: boolean;
    innerDiameter?: number;
    applicationType?: GlandApplicationType;
    materialName?: string;
    squeezeStatus?: 'pass' | 'warn' | 'fail';
    fillPercent?: number;
    fillStatus?: 'pass' | 'warn' | 'fail';
    overallStatus?: string;
    language?: Language;
}

export function ORingCrossSectionSVG({
    cordDia,
    depth,
    width,
    squeezePercent,
    pressureBar,
    radialGap,
    maxAllowedGap = 0.2,
    backupRingRequired = false,
    innerDiameter = 50,
    applicationType = 'static_radial_piston',
    materialName = 'NBR 70 Shore A',
    squeezeStatus = 'pass',
    fillPercent = 75,
    fillStatus = 'pass',
    overallStatus = 'SAFE',
    language = 'tr'
}: ORingCrossSectionSVGProps) {
    const [showFreeCircle, setShowFreeCircle] = useState<boolean>(true);
    const [simulatePressure, setSimulatePressure] = useState<boolean>(pressureBar > 0);

    const isAxial = applicationType === 'static_axial_internal' || applicationType === 'static_axial_external';
    const isAxialInternal = applicationType === 'static_axial_internal';
    const isRodGland = applicationType === 'static_radial_rod';
    const isPistonGland = !isAxial && !isRodGland;

    // Technical CAD scaling calculations
    const scale = Math.min(48, Math.max(26, 210 / Math.max(width, 1)));
    const gw = Math.round(width * scale);
    const gh = Math.round(depth * scale);
    const centerX = 400;
    const Y_bottom = 245;
    const Y_piston = Y_bottom - gh;

    // In axial face seal, clamped gap is essentially 0 mm (metal-to-metal contact).
    // In radial seals, radial gap g separates moving/mating parts.
    const actualGapMm = isAxial ? 0.02 : (radialGap || 0.15);
    const gapPx = isAxial ? 2 : Math.max(8, Math.min(18, Math.round(actualGapMm * scale * 2.0)));
    const Y_mating = Y_piston - gapPx;
    const Y_mating_top = Y_mating - 45;
    const Y_piston_bottom = Y_bottom + 45;

    const XL = centerX - Math.round(gw / 2);
    const XR = centerX + Math.round(gw / 2);
    const r1 = Math.min(12, Math.max(5, Math.round(0.6 * scale))); // Bottom fillet radius
    const r2 = Math.min(6, Math.max(2, Math.round(0.2 * scale)));  // Top edge break

    // Uncompressed reference circle
    const D0 = cordDia * scale;
    const R0 = D0 / 2;

    // Compressed deformed ellipse (Volume conservation: Area = pi * R0^2)
    const H_comp = gh + gapPx;
    const Ry = Math.max(10, H_comp / 2);
    const Rx = Math.max(14, (R0 * R0) / Ry);
    const deformedCy = (Y_bottom + Y_mating) / 2;

    // Pressure shift logic
    const isPressurized = simulatePressure && pressureBar > 0;
    const bw = Math.round(Math.min(34, Math.max(20, 1.25 * scale)));

    let oRingCx = centerX;
    if (isPressurized) {
        if (isAxial && !isAxialInternal) {
            // External pressure / vacuum pushes O-ring toward the INSIDE wall (left)
            oRingCx = XL + Rx - 2;
        } else {
            // Internal fluid pressure pushes O-ring toward the OUTSIDE wall (right)
            if (backupRingRequired) {
                oRingCx = XR - bw - Rx + 2;
            } else {
                oRingCx = XR - Rx + 2;
            }
        }
    }

    const ghostCx = isPressurized ? oRingCx : centerX;
    const ghostCy = deformedCy;
    const isGapAlert = !isAxial && radialGap > maxAllowedGap;
    const isExtrusionRisk = isPressurized && pressureBar >= 50 && !backupRingRequired && isGapAlert;

    const rawId = React.useId().replace(/:/g, '');

    return (
        <div className="relative w-full flex flex-col">
            {/* Visual Controls Sub-bar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 bg-[var(--bg-1)] border-b border-slate-800 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span
                        className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold whitespace-nowrap"
                        title={
                            isAxial
                                ? isAxialInternal
                                    ? t12(language, 'Axial Flange (Internal Pressure)', 'Eksenel Flanş (İç Basınç)')
                                    : t12(language, 'Axial Flange (External Pressure / Vacuum)', 'Eksenel Flanş (Dış Basınç/Vakum)')
                                : isRodGland
                                ? t12(language, 'Radial Rod (Shaft Groove)', 'Radyal Boğaz (Mil İçi Oluk)')
                                : t12(language, 'Radial Piston (Piston Outer Groove)', 'Radyal Piston (Piston Dışı Oluk)')
                        }
                    >
                        {isAxial
                            ? t12(language, 'Axial Flange', 'Eksenel Flanş')
                            : isRodGland
                            ? t12(language, 'Radial Rod', 'Radyal Boğaz')
                            : t12(language, 'Radial Piston', 'Radyal Piston')}
                    </span>
                    <span className="text-slate-500 whitespace-nowrap text-[9.5px]">
                        {isAxial ? t12(language, 'Face Seal', 'Alın Sızdırmazlık') : 'ISO 3601-2'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setSimulatePressure(!simulatePressure)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap transition-all ${
                            simulatePressure
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                    >
                        <Zap size={11} className={simulatePressure ? 'text-cyan-400' : 'text-slate-500'} />
                        <span className="whitespace-nowrap">{t12(language, 'Pressure:', 'Basınç:')} {simulatePressure ? `${pressureBar} bar` : '0 bar'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowFreeCircle(!showFreeCircle)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap transition-all ${
                            showFreeCircle
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                    >
                        {showFreeCircle ? <Eye size={11} /> : <EyeOff size={11} />}
                        <span className="whitespace-nowrap">{t12(language, 'Free ØW', 'Serbest ØW')}</span>
                    </button>
                </div>
            </div>

            <svg
                viewBox="0 0 760 380"
                className="w-full aspect-[2/1] max-h-[360px] bg-[var(--bg-0)] rounded-b-2xl border border-slate-800/80 shadow-2xl overflow-hidden font-mono select-none"
            >
                <defs>
                    {/* Background CAD Grid */}
                    <pattern id={`cadGridOring-${rawId}`} width="20" height="20" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="20" y2="0" stroke="#00e5ff" strokeWidth="0.4" strokeOpacity="0.06" />
                        <line x1="0" y1="0" x2="0" y2="20" stroke="#00e5ff" strokeWidth="0.4" strokeOpacity="0.06" />
                    </pattern>

                    {/* Metal Hatching */}
                    <pattern id={`oringMetalHatch-${rawId}`} width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.3" />
                    </pattern>
                    <pattern id={`oringMatingHatch-${rawId}`} width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="1.1" strokeOpacity="0.3" />
                    </pattern>
                    <pattern id={`ptfeHatch-${rawId}`} width="6" height="6" patternTransform="rotate(30 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.6" />
                    </pattern>

                    {/* Gradients */}
                    <radialGradient id={`oringElastomerGrad-${rawId}`} cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#5eead4" />
                        <stop offset="35%" stopColor="#14b8a6" />
                        <stop offset="75%" stopColor="#0f766e" />
                        <stop offset="100%" stopColor="#042f2e" />
                    </radialGradient>
                    <linearGradient id={`ptfeGrad-${rawId}`} x1="0%" y1="0%" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="60%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                    <linearGradient id={`pressureFade-${rawId}`} x1="0%" y1="0%" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                    </linearGradient>

                    {/* Dimension Arrowheads */}
                    <marker id={`cadArrow-${rawId}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 1, 5 3, 0 5" fill="#38bdf8" />
                    </marker>
                    <marker id={`cadArrowStart-${rawId}`} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                        <polygon points="5 1, 0 3, 5 5" fill="#38bdf8" />
                    </marker>
                    <marker id={`arrowRed-${rawId}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 1, 5 3, 0 5" fill="#ef4444" />
                    </marker>
                </defs>

                {/* CAD Grid Backdrop */}
                <rect width="760" height="380" fill={`url(#cadGridOring-${rawId})`} />
                <rect x="12" y="12" width="736" height="356" fill="none" stroke="#1e293b" strokeWidth="1" rx="8" />

                {/* Pressure Chamber Fluid Background (Shows where high pressure oil/gas sits) */}
                {isPressurized && (
                    <g>
                        {isAxial && !isAxialInternal ? (
                            /* External Pressure: fluid is on the RIGHT */
                            <rect x={XR + 5} y={Y_mating} width={Math.max(20, 715 - XR)} height={Y_bottom - Y_mating} fill={`url(#pressureFade-${rawId})`} />
                        ) : (
                            /* Internal Pressure: fluid is on the LEFT */
                            <rect x="40" y={Y_mating} width={Math.max(10, XL - 40 + (isPressurized ? 15 : 0))} height={Y_bottom - Y_mating} fill={`url(#pressureFade-${rawId})`} />
                        )}
                    </g>
                )}

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 1. UPPER MATING BODY                                                  */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                <g>
                    {isAxial ? (
                        /* CASE A: AXIAL FACE SEAL — FLAT TOP CLAMPED FLANGE */
                        <g>
                            <path
                                d={`M 40 ${Y_mating_top} 
                                    L 720 ${Y_mating_top} 
                                    L 720 ${Y_mating} 
                                    L 40 ${Y_mating} Z`}
                                fill={`url(#oringMatingHatch-${rawId})`}
                                stroke="#475569"
                                strokeWidth="1.2"
                            />
                            <line x1="40" y1={Y_mating} x2="720" y2={Y_mating} stroke="#e2e8f0" strokeWidth="2.2" />
                            <text x="45" y={Y_mating - 16} fill="#f8fafc" fontSize="9.5" fontWeight="bold">
                                {t12(language, 'TOP MATING FLANGE (BOLTED COVER) — Ra 0.8 μm', 'ÜST KARŞI FLANŞ (KAPAK ALNI) — Ra 0.8 μm')}
                            </text>
                        </g>
                    ) : isRodGland ? (
                        /* CASE B: RADIAL ROD SEAL — HOUSING AT TOP HAS THE INTERNAL GROOVE! */
                        <g>
                            <path
                                d={`M 40 ${Y_mating_top} 
                                    L 720 ${Y_mating_top} 
                                    L 720 ${Y_mating} 
                                    L ${XR + r2} ${Y_mating} 
                                    Q ${XR} ${Y_mating} ${XR} ${Y_mating - r2} 
                                    L ${XR} ${Y_mating_top + 16 + r1} 
                                    Q ${XR} ${Y_mating_top + 16} ${XR - r1} ${Y_mating_top + 16} 
                                    L ${XL + r1} ${Y_mating_top + 16} 
                                    Q ${XL} ${Y_mating_top + 16} ${XL} ${Y_mating_top + 16 + r1} 
                                    L ${XL} ${Y_mating - r2} 
                                    Q ${XL} ${Y_mating} ${XL - r2} ${Y_mating} 
                                    L 40 ${Y_mating} Z`}
                                fill={`url(#oringMetalHatch-${rawId})`}
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                            />
                            <text x="45" y={Y_mating_top + 12} fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                                {t12(language, 'CYLINDER HEAD HOUSING (INTERNAL GROOVE) — ISO 3601-2', 'SİLİNDİR BOĞAZ GÖVDESİ (İÇ KANAL) — ISO 3601-2')}
                            </text>
                        </g>
                    ) : (
                        /* CASE C: RADIAL PISTON SEAL — CYLINDER BORE AT TOP WITH LEAD-IN CHAMFER */
                        <g>
                            <path
                                d={`M 40 ${Y_mating_top} 
                                    L 720 ${Y_mating_top} 
                                    L 720 ${Y_mating - 14} 
                                    L ${XR + 90} ${Y_mating - 14} 
                                    L ${XR + 45} ${Y_mating} 
                                    L 40 ${Y_mating} Z`}
                                fill={`url(#oringMatingHatch-${rawId})`}
                                stroke="#475569"
                                strokeWidth="1.2"
                            />
                            <line x1="40" y1={Y_mating} x2={XR + 45} y2={Y_mating} stroke="#94a3b8" strokeWidth="2" />
                            <line x1={XR + 45} y1={Y_mating} x2={XR + 90} y2={Y_mating - 14} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />
                            <line x1={XR + 90} y1={Y_mating - 14} x2="720" y2={Y_mating - 14} stroke="#94a3b8" strokeWidth="2" />

                            <text x="45" y={Y_mating - 16} fill="#94a3b8" fontSize="9.5" fontWeight="bold">
                                {t12(language, 'CYLINDER BORE WALL — Honed Ra 0.2-0.4 μm', 'SİLİNDİR BORUSU (DELİK DUVARI) — Honlanmış Ra 0.2-0.4 μm')}
                            </text>

                            {/* Lead-in Chamfer Annotation */}
                            <g transform={`translate(${XR + 68}, ${Y_mating - 20})`}>
                                <line x1="0" y1="0" x2="22" y2="-12" stroke="#38bdf8" strokeWidth="1" />
                                <text x="26" y="-10" fill="#38bdf8" fontSize="8.5" fontWeight="bold">
                                    {t12(language, '15°–20° Lead-in Chamfer', '15°–20° Giriş Pahı')}
                                </text>
                            </g>
                        </g>
                    )}
                </g>

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 2. LOWER GLAND BODY                                                  */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                <g>
                    {isRodGland ? (
                        /* CASE B-LOWER: SMOOTH CHROMED ROD AT BOTTOM */
                        <g>
                            <rect
                                x="40"
                                y={Y_bottom}
                                width="680"
                                height={Y_piston_bottom - Y_bottom}
                                fill={`url(#oringMatingHatch-${rawId})`}
                                stroke="#475569"
                                strokeWidth="1.2"
                            />
                            <line x1="40" y1={Y_bottom} x2="720" y2={Y_bottom} stroke="#38bdf8" strokeWidth="2.5" />
                            <text x="45" y={Y_bottom + 26} fill="#e2e8f0" fontSize="9.5" fontWeight="bold">
                                {t12(language, 'CYLINDRICAL ROD', 'KROM KAPLI MİL')}: Ø{innerDiameter} mm f7 ({t12(language, 'Chrome', 'Krom')} Ra 0.2 μm)
                            </text>
                        </g>
                    ) : (
                        /* CASE A & C-LOWER: GLAND BODY WITH MACHINED PRECISION GROOVE */
                        <g>
                            <path
                                d={`M 40 ${Y_piston} 
                                    L ${XL - r2} ${Y_piston} 
                                    Q ${XL} ${Y_piston} ${XL} ${Y_piston + r2} 
                                    L ${XL} ${Y_bottom - r1} 
                                    Q ${XL} ${Y_bottom} ${XL + r1} ${Y_bottom} 
                                    L ${XR - r1} ${Y_bottom} 
                                    Q ${XR} ${Y_bottom} ${XR} ${Y_bottom - r1} 
                                    L ${XR} ${Y_piston + r2} 
                                    Q ${XR} ${Y_piston} ${XR + r2} ${Y_piston} 
                                    L 720 ${Y_piston} 
                                    L 720 ${Y_piston_bottom} 
                                    L 40 ${Y_piston_bottom} Z`}
                                fill={`url(#oringMetalHatch-${rawId})`}
                                stroke="#334155"
                                strokeWidth="1.2"
                            />

                            {/* Groove Machined Highlight */}
                            <path
                                d={`M 40 ${Y_piston} 
                                    L ${XL - r2} ${Y_piston} 
                                    Q ${XL} ${Y_piston} ${XL} ${Y_piston + r2} 
                                    L ${XL} ${Y_bottom - r1} 
                                    Q ${XL} ${Y_bottom} ${XL + r1} ${Y_bottom} 
                                    L ${XR - r1} ${Y_bottom} 
                                    Q ${XR} ${Y_bottom} ${XR} ${Y_bottom - r1} 
                                    L ${XR} ${Y_piston + r2} 
                                    Q ${XR} ${Y_piston} ${XR + r2} ${Y_piston} 
                                    L 720 ${Y_piston}`}
                                fill="none"
                                stroke="#00e5ff"
                                strokeWidth="2.2"
                            />

                            <text x="45" y={Y_piston + 28} fill="#64748b" fontSize="9.5" fontWeight="bold">
                                {isAxial
                                    ? t12(language, 'FLANGE FACE GROOVE — ISO 3601-2', 'FLANŞ ALIN KANALI — ISO 3601-2')
                                    : t12(language, 'PISTON BODY (EXTERNAL GROOVE) — ISO 3601-2', 'PİSTON GÖVDESİ (DIŞ RADYAL KANAL) — ISO 3601-2')}
                            </text>
                        </g>
                    )}
                </g>

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 3. GHOST REFERENCE: UNCOMPRESSED O-RING CORD                         */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                {showFreeCircle && (
                    <g opacity="0.65">
                        <circle
                            cx={ghostCx}
                            cy={ghostCy}
                            r={R0}
                            fill="none"
                            stroke="#2dd4bf"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                        />
                        <line x1={ghostCx - 6} y1={ghostCy} x2={ghostCx + 6} y2={ghostCy} stroke="#2dd4bf" strokeWidth="1" />
                        <line x1={ghostCx} y1={ghostCy - 6} x2={ghostCx} y2={ghostCy + 6} stroke="#2dd4bf" strokeWidth="1" />
                        <rect x={ghostCx - 44} y={ghostCy - R0 - 16} width="88" height="14" rx="3" fill="#020610" stroke="#2dd4bf" strokeWidth="0.8" />
                        <text x={ghostCx} y={ghostCy - R0 - 6} fill="#2dd4bf" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {t12(language, 'Free', 'Serbest')}: Ø{cordDia} mm
                        </text>
                    </g>
                )}

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 4. PTFE BACKUP RING (DESTEK HALKASI)                                 */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                {backupRingRequired && (
                    <g>
                        <path
                            d={`M ${XR - bw} ${Y_mating} 
                                L ${XR} ${Y_mating} 
                                L ${XR} ${Y_bottom} 
                                L ${XR - bw} ${Y_bottom} 
                                Q ${XR - bw + 6} ${deformedCy} ${XR - bw} ${Y_mating} Z`}
                            fill={`url(#ptfeGrad-${rawId})`}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                        />
                        <path
                            d={`M ${XR - bw} ${Y_mating} 
                                L ${XR} ${Y_mating} 
                                L ${XR} ${Y_bottom} 
                                L ${XR - bw} ${Y_bottom} 
                                Q ${XR - bw + 6} ${deformedCy} ${XR - bw} ${Y_mating} Z`}
                            fill={`url(#ptfeHatch-${rawId})`}
                        />
                        {/* Backup Ring Tag */}
                        <text x={XR - bw / 2} y={deformedCy + 3} fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">
                            PTFE
                        </text>
                        <line x1={XR - bw / 2} y1={Y_bottom} x2={XR - bw / 2} y2={Y_bottom + 16} stroke="#fbbf24" strokeWidth="1" />
                        <text x={XR - bw / 2} y={Y_bottom + 26} fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {t12(language, 'Backup Ring', 'Destek Halkası')}
                        </text>
                    </g>
                )}

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 5. COMPRESSED DEFORMED O-RING ELASTOMER                              */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                <g>
                    <ellipse
                        cx={oRingCx}
                        cy={deformedCy}
                        rx={Rx}
                        ry={Ry}
                        fill={`url(#oringElastomerGrad-${rawId})`}
                        stroke="#5eead4"
                        strokeWidth="2"
                    />

                    {/* Elastic Flat Contact Lands with Metal Surfaces */}
                    <line x1={oRingCx - Rx * 0.38} y1={Y_mating} x2={oRingCx + Rx * 0.38} y2={Y_mating} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    <line x1={oRingCx - Rx * 0.38} y1={Y_bottom} x2={oRingCx + Rx * 0.38} y2={Y_bottom} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

                    {/* Center Core Badge */}
                    <text x={oRingCx} y={deformedCy - 2} fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                        O-RING
                    </text>
                    <text x={oRingCx} y={deformedCy + 10} fill="#99f6e4" fontSize="8" fontWeight="bold" textAnchor="middle">
                        S = {language === 'tr' ? `%${squeezePercent.toFixed(1)}` : `${squeezePercent.toFixed(1)}%`}
                    </text>

                    {/* Extrusion Tongue Hazard if High Pressure & No Backup Ring */}
                    {isExtrusionRisk && (
                        <g>
                            <path
                                d={`M ${XR} ${Y_piston} 
                                    Q ${XR + gapPx * 0.9} ${Y_piston - gapPx * 0.3} ${XR + gapPx * 0.7} ${Y_mating} 
                                    L ${XR} ${Y_mating} Z`}
                                fill="#ef4444"
                                stroke="#f87171"
                                strokeWidth="1.5"
                            />
                            <g transform={`translate(${XR + 36}, ${Y_mating - 28})`}>
                                <line x1="0" y1="14" x2="-20" y2="28" stroke="#ef4444" strokeWidth="1" />
                                <rect width="124" height="18" rx="3" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
                                <text x="6" y="12" fill="#fca5a5" fontSize="8" fontWeight="bold">
                                    {t12(language, '! EXTRUSION HAZARD', '! EKSTRÜZYON HASARI')}
                                </text>
                            </g>
                        </g>
                    )}
                </g>

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 6. PRESSURE VECTOR ARROWS                                            */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                {isPressurized && (
                    <g>
                        {isAxial && !isAxialInternal ? (
                            /* External Pressure: Vectors push from RIGHT to LEFT */
                            <g transform={`translate(${XR + 85}, ${deformedCy})`}>
                                <line x1="30" y1="0" x2="-10" y2="0" stroke="#38bdf8" strokeWidth="2.5" markerEnd={`url(#cadArrow-${rawId})`} />
                                <line x1="30" y1="-14" x2="-10" y2="-14" stroke="#38bdf8" strokeWidth="2.5" markerEnd={`url(#cadArrow-${rawId})`} />
                                <line x1="30" y1="14" x2="-10" y2="14" stroke="#38bdf8" strokeWidth="2.5" markerEnd={`url(#cadArrow-${rawId})`} />
                                <text x="10" y="-22" fill="#38bdf8" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                                    P = {pressureBar} bar
                                </text>
                                <text x="10" y="-12" fill="#0284c7" fontSize="7.5" textAnchor="middle">
                                    {t12(language, '(External Pressure / Vacuum)', '(Dış Basınç / Vakum)')}
                                </text>
                            </g>
                        ) : (
                            /* Internal Pressure: Vectors push from LEFT to RIGHT */
                            <g transform={`translate(80, ${deformedCy})`}>
                                <line x1="-30" y1="0" x2="10" y2="0" stroke="#38bdf8" strokeWidth="2.5" markerEnd={`url(#cadArrow-${rawId})`} />
                                <line x1="-30" y1="-14" x2="10" y2="-14" stroke="#38bdf8" strokeWidth="2.5" markerEnd={`url(#cadArrow-${rawId})`} />
                                <line x1="-30" y1="14" x2="10" y2="14" stroke="#38bdf8" strokeWidth="2.5" markerEnd={`url(#cadArrow-${rawId})`} />
                                <text x="-10" y="-22" fill="#38bdf8" fontSize="10.5" fontWeight="bold">
                                    P = {pressureBar} bar
                                </text>
                                <text x="-10" y="-12" fill="#0284c7" fontSize="7.5">
                                    {t12(language, '(Fluid Pressure)', '(Akışkan Basıncı)')}
                                </text>
                            </g>
                        )}
                    </g>
                )}

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 7. PRECISION CAD DIMENSIONS                                          */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 7a. Gland Width (b) */}
                <g>
                    <line x1={XL} y1={Y_bottom + 4} x2={XL} y2={Y_bottom + 40} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={XR} y1={Y_bottom + 4} x2={XR} y2={Y_bottom + 40} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                    <line
                        x1={XL}
                        y1={Y_bottom + 32}
                        x2={XR}
                        y2={Y_bottom + 32}
                        stroke="#00e5ff"
                        strokeWidth="1.5"
                        markerStart={`url(#cadArrowStart-${rawId})`}
                        markerEnd={`url(#cadArrow-${rawId})`}
                    />
                    <rect x={centerX - 46} y={Y_bottom + 24} width="92" height="16" fill="#020610" rx="3" stroke="#00e5ff" strokeWidth="0.8" />
                    <text x={centerX} y={Y_bottom + 36} fill="#00e5ff" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                        b = {width} mm <tspan fill="#94a3b8" fontSize="7.5">+0.10</tspan>
                    </text>
                </g>

                {/* 7b. Gland Depth (H) */}
                <g>
                    <line x1={XL - 4} y1={Y_piston} x2={XL - 30} y2={Y_piston} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={XL - 4} y1={Y_bottom} x2={XL - 30} y2={Y_bottom} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                    <line
                        x1={XL - 20}
                        y1={Y_piston}
                        x2={XL - 20}
                        y2={Y_bottom}
                        stroke="#00e5ff"
                        strokeWidth="1.5"
                        markerStart={`url(#cadArrowStart-${rawId})`}
                        markerEnd={`url(#cadArrow-${rawId})`}
                    />
                    <rect x={XL - 52} y={(Y_piston + Y_bottom) / 2 - 8} width="46" height="16" fill="#020610" rx="3" stroke="#00e5ff" strokeWidth="0.8" />
                    <text x={XL - 29} y={(Y_piston + Y_bottom) / 2 + 4} fill="#00e5ff" fontSize="9" fontWeight="bold" textAnchor="middle">
                        H = {depth}
                    </text>
                </g>

                {/* 7c. Radial Clearance Gap (g) */}
                {!isAxial && (
                    <g>
                        <line x1={XR + 28} y1={Y_mating} x2={XR + 28} y2={Y_piston} stroke={isGapAlert ? '#ef4444' : '#38bdf8'} strokeWidth="1.5" markerStart={`url(#cadArrowStart-${rawId})`} markerEnd={`url(#cadArrow-${rawId})`} />
                        <line x1={XR + 20} y1={Y_mating} x2={XR + 36} y2={Y_mating} stroke="#475569" strokeWidth="1" />
                        <line x1={XR + 20} y1={Y_piston} x2={XR + 36} y2={Y_piston} stroke="#475569" strokeWidth="1" />
                        <rect x={XR + 36} y={(Y_mating + Y_piston) / 2 - 8} width="72" height="16" fill="#020610" rx="3" stroke={isGapAlert ? '#ef4444' : '#38bdf8'} strokeWidth="0.8" />
                        <text x={XR + 72} y={(Y_mating + Y_piston) / 2 + 4} fill={isGapAlert ? '#ef4444' : '#38bdf8'} fontSize="8.5" fontWeight="bold" textAnchor="middle">
                            g = {radialGap.toFixed(2)} mm
                        </text>
                    </g>
                )}

                {/* 7d. Fillet Radii Callout (Left corner clears backup ring) */}
                <g transform={`translate(${XL + r1}, ${Y_bottom - r1})`}>
                    <line x1="0" y1="0" x2="-14" y2="14" stroke="#64748b" strokeWidth="1" />
                    <line x1="-14" y1="14" x2="-32" y2="14" stroke="#64748b" strokeWidth="1" />
                    <text x="-36" y="17" fill="#94a3b8" fontSize="8" textAnchor="end">
                        R₁ = 0.4–0.8 mm
                    </text>
                </g>

                {/* 8. Technical HUD Overlay Header */}
                <g transform="translate(25, 24)">
                    <rect width="270" height="34" fill="#090d16" stroke="#1e293b" rx="6" />
                    <text x="12" y="15" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                        {t12(language, 'ISO 3601-2 GLAND SECTION BLUEPRINT', 'ISO 3601-2 KANAL KESİTİ & SIZDIRMAZLIK')}
                    </text>
                    <text x="12" y="27" fill="#94a3b8" fontSize="8">
                        {materialName} | d₁ = Ø{innerDiameter} mm | W = Ø{cordDia} mm
                    </text>
                </g>

                {/* Top-Right KPI Badges */}
                <g transform="translate(450, 22)">
                    {/* Squeeze Badge */}
                    <rect
                        x="0"
                        y="0"
                        width="86"
                        height="26"
                        rx="6"
                        fill={squeezeStatus === 'pass' ? '#064e3b' : squeezeStatus === 'warn' ? '#78350f' : '#881337'}
                        stroke={squeezeStatus === 'pass' ? '#10b981' : squeezeStatus === 'warn' ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="1"
                    />
                    <text x="43" y="10" fill="#cbd5e1" fontSize="7" textAnchor="middle">
                        {t12(language, 'SQUEEZE', 'SIKIŞMA')}
                    </text>
                    <text x="43" y="20" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {language === 'tr' ? `%${squeezePercent.toFixed(1)}` : `${squeezePercent.toFixed(1)}%`}
                    </text>

                    {/* Fill Badge */}
                    <rect
                        x="94"
                        y="0"
                        width="86"
                        height="26"
                        rx="6"
                        fill={fillStatus === 'pass' ? '#064e3b' : fillStatus === 'warn' ? '#78350f' : '#881337'}
                        stroke={fillStatus === 'pass' ? '#10b981' : fillStatus === 'warn' ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="1"
                    />
                    <text x="137" y="10" fill="#cbd5e1" fontSize="7" textAnchor="middle">
                        {t12(language, 'GLAND FILL', 'DOLULUK')}
                    </text>
                    <text x="137" y="20" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {language === 'tr' ? `%${fillPercent.toFixed(1)}` : `${fillPercent.toFixed(1)}%`}
                    </text>

                    {/* Backup Ring Badge */}
                    <rect
                        x="188"
                        y="0"
                        width="96"
                        height="26"
                        rx="6"
                        fill={backupRingRequired ? '#78350f' : '#090d16'}
                        stroke={backupRingRequired ? '#f59e0b' : '#334155'}
                        strokeWidth="1"
                    />
                    <text x="236" y="10" fill="#cbd5e1" fontSize="7" textAnchor="middle">
                        {t12(language, 'BACKUP RING', 'DESTEK')}
                    </text>
                    <text x="236" y="20" fill={backupRingRequired ? '#fde68a' : '#94a3b8'} fontSize="8" fontWeight="bold" textAnchor="middle">
                        {backupRingRequired ? t12(language, 'PTFE REQ.', 'PTFE ŞART') : t12(language, 'NOT REQ.', 'GEREKMEZ')}
                    </text>
                </g>

                {/* Bottom Standard Reference */}
                <text x="25" y="360" fill="#64748b" fontSize="8">
                    {t12(language, 'SCALE', 'ÖLÇEK')}: 1:{Math.round(100 / scale)} | {t12(language, 'SURFACE: DYNAMIC Ra 0.2-0.4 μm / STATIC Ra 0.8-1.6 μm (ISO 3601-2)', 'YÜZEY KALİTESİ: DİNAMİK Ra 0.2-0.4 μm / STATİK Ra 0.8-1.6 μm (ISO 3601-2)')}
                </text>
            </svg>
        </div>
    );
}

// =============================================================================
// 2. SUPTEX ROTARY SHAFT OIL SEAL (DIN 3760 / ISO 6194) BLUEPRINT
// =============================================================================

export interface OilSealCrossSectionSVGProps {
    shaftDia: number;
    boreD: number;
    widthB: number;
    sealType: SuptexSealType;
    material?: 'NBR' | 'FKM' | 'PTFE';
    speedRpm?: number;
    peripheralSpeed?: number;
    maxAllowedSpeed?: number;
    pressureBar?: number;
    isSpeedSafe?: boolean;
    isPressureSafe?: boolean;
    language?: Language;
}

export function OilSealCrossSectionSVG({
    shaftDia,
    boreD,
    widthB,
    sealType,
    material = 'NBR',
    speedRpm = 1500,
    peripheralSpeed = 3.14,
    maxAllowedSpeed = 12,
    pressureBar = 0.2,
    isSpeedSafe = true,
    isPressureSafe = true,
    language = 'tr'
}: OilSealCrossSectionSVGProps) {
    const rawId = React.useId().replace(/:/g, '');
    const wPx = Math.max(120, Math.min(180, Math.round(widthB * 15)));
    const hPx = 130;
    const X_oil = 280;
    const X_air = X_oil + wPx;
    const Y_bore = 85;
    const Y_shaft = Y_bore + hPx;
    const Y_CL = 325; // Shaft centerline

    const hasDustLip = sealType?.hasDustLip ?? false;
    const isMetalOuter = sealType?.outerCase === 'metal' || sealType?.outerCase === 'double_metal';
    const isDoubleMetal = sealType?.id === 'B2';

    const l1_mm = shaftDia <= 30 ? 3.0 : shaftDia <= 70 ? 4.0 : 5.0;

    // Primary sealing lip positions
    const X_lip = X_oil + Math.round(wPx * 0.42);
    const X_spring = X_lip + 2;
    const Y_spring = Y_shaft - 30;

    const rubberFill = material === 'FKM' ? '#991b1b' : material === 'PTFE' ? '#475569' : '#d97706';
    const rubberStroke = material === 'FKM' ? '#ef4444' : material === 'PTFE' ? '#94a3b8' : '#f59e0b';

    return (
        <div className="relative w-full">
            <svg
                viewBox="0 0 760 380"
                className="w-full h-72 sm:h-80 lg:h-96 bg-[var(--bg-0)] rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden font-mono select-none"
            >
                <defs>
                    <pattern id={`cadGridOilSeal-${rawId}`} width="20" height="20" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="20" y2="0" stroke="#00e5ff" strokeWidth="0.4" strokeOpacity="0.06" />
                        <line x1="0" y1="0" x2="0" y2="20" stroke="#00e5ff" strokeWidth="0.4" strokeOpacity="0.06" />
                    </pattern>
                    <pattern id={`housingHatch-${rawId}`} width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="1.1" strokeOpacity="0.35" />
                    </pattern>
                    <pattern id={`shaftHatch-${rawId}`} width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#00e5ff" strokeWidth="1.2" strokeOpacity="0.35" />
                    </pattern>

                    <linearGradient id={`steelCaseGrad-${rawId}`} x1="0%" y1="0%" x2="1" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="50%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <radialGradient id={`springGrad-${rawId}`} cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="40%" stopColor="#ef4444" />
                        <stop offset="85%" stopColor="#991b1b" />
                        <stop offset="100%" stopColor="#450a0a" />
                    </radialGradient>

                    <marker id={`amberArrow-${rawId}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 1, 5 3, 0 5" fill="#f59e0b" />
                    </marker>
                    <marker id={`amberArrowStart-${rawId}`} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                        <polygon points="5 1, 0 3, 5 5" fill="#f59e0b" />
                    </marker>
                    <marker id={`cadArrowBlue-${rawId}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 1, 5 3, 0 5" fill="#00e5ff" />
                    </marker>
                    <marker id={`cadArrowBlueStart-${rawId}`} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                        <polygon points="5 1, 0 3, 5 5" fill="#00e5ff" />
                    </marker>
                </defs>

                <rect width="760" height="380" fill={`url(#cadGridOilSeal-${rawId})`} />
                <rect x="12" y="12" width="736" height="356" fill="none" stroke="#1e293b" strokeWidth="1" rx="8" />

                {/* 1. Housing Wall (Upper Body) */}
                <g>
                    <path
                        d={`M 40 35 
                            L 720 35 
                            L 720 ${Y_bore - 12} 
                            L ${X_air + 25} ${Y_bore - 12} 
                            L ${X_air + 5} ${Y_bore} 
                            L ${X_oil - 20} ${Y_bore} 
                            L ${X_oil - 20} ${Y_bore - 20} 
                            L 40 ${Y_bore - 20} Z`}
                        fill={`url(#housingHatch-${rawId})`}
                        stroke="#475569"
                        strokeWidth="1.2"
                    />
                    <line x1={X_oil - 20} y1={Y_bore} x2={X_air + 5} y2={Y_bore} stroke="#e2e8f0" strokeWidth="2" />
                    <line x1={X_air + 5} y1={Y_bore} x2={X_air + 25} y2={Y_bore - 12} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 1" />

                    <text x="45" y="55" fill="#f59e0b" fontSize="10" fontWeight="bold">
                        {t12(language, 'HOUSING BORE', 'GÖVDE YUVASI')} — Ø{boreD} H8 (Ra 1.6–3.2 μm)
                    </text>
                </g>

                {/* 2. Rotating Shaft (Lower Body) */}
                <g>
                    <path
                        d={`M 40 ${Y_shaft} 
                            L 640 ${Y_shaft} 
                            L 670 ${Y_shaft + 14} 
                            L 720 ${Y_shaft + 14} 
                            L 720 310 
                            L 40 310 Z`}
                        fill={`url(#shaftHatch-${rawId})`}
                        stroke="#00e5ff"
                        strokeWidth="1.2"
                    />
                    <line x1="40" y1={Y_shaft} x2="640" y2={Y_shaft} stroke="#00e5ff" strokeWidth="2.5" />
                    <line x1="640" y1={Y_shaft} x2="670" y2={Y_shaft + 14} stroke="#00e5ff" strokeWidth="2" strokeDasharray="3 1" />
                    <line x1="670" y1={Y_shaft + 14} x2="720" y2={Y_shaft + 14} stroke="#94a3b8" strokeWidth="2" />

                    {/* Shaft Centerline (CL) */}
                    <line x1="35" y1={Y_CL} x2="725" y2={Y_CL} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="24 4 4 4" opacity="0.8" />
                    <text x="705" y={Y_CL - 6} fill="#f59e0b" fontSize="9" fontWeight="bold">
                        CL
                    </text>

                    <text x="45" y={Y_shaft + 28} fill="#e2e8f0" fontSize="10" fontWeight="bold">
                        {t12(language, 'ROTATING SHAFT', 'DÖNER MİL')}: Ø{shaftDia} mm h11 | {t12(language, 'Plunge Ground', 'Dalma Taşlama')} (Ra 0.2–0.6 μm) | ≥45 HRC
                    </text>

                    {/* Speed Badge */}
                    <g transform="translate(60, 240)">
                        <path d="M 0 15 A 15 15 0 0 1 20 0" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd={`url(#amberArrow-${rawId})`} />
                        <text x="28" y="8" fill="#f59e0b" fontSize="9" fontWeight="bold">
                            {speedRpm} RPM
                        </text>
                        <text x="28" y="20" fill={isSpeedSafe ? '#10b981' : '#ef4444'} fontSize="8" fontWeight="bold">
                            v = {peripheralSpeed.toFixed(2)} m/s
                        </text>
                    </g>
                </g>

                {/* 3. Oil Seal Body */}
                <g>
                    {isMetalOuter ? (
                        <path
                            d={`M ${X_oil} ${Y_bore} 
                                L ${X_air} ${Y_bore} 
                                L ${X_air} ${Y_bore + 14} 
                                L ${X_air - 12} ${Y_shaft - 30} 
                                L ${X_lip + 25} ${Y_shaft - 18} 
                                L ${X_lip} ${Y_shaft} 
                                L ${X_lip - 18} ${Y_shaft - 25} 
                                L ${X_oil + 16} ${Y_shaft - 28} 
                                L ${X_oil} ${Y_bore + 25} Z`}
                            fill={`url(#steelCaseGrad-${rawId})`}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                        />
                    ) : (
                        <g>
                            <path
                                d={`M ${X_oil} ${Y_bore} 
                                    L ${X_air} ${Y_bore} 
                                    L ${X_air} ${Y_bore + 14} 
                                    L ${X_air - 12} ${Y_shaft - 32} 
                                    L ${X_lip + 28} ${Y_shaft - 18} 
                                    L ${X_lip} ${Y_shaft} 
                                    L ${X_lip - 20} ${Y_shaft - 25} 
                                    L ${X_oil + 14} ${Y_shaft - 30} 
                                    L ${X_oil} ${Y_bore + 25} Z`}
                                fill={rubberFill}
                                fillOpacity="0.85"
                                stroke={rubberStroke}
                                strokeWidth="2"
                            />
                        </g>
                    )}

                    {/* Internal Steel Stiffener Ring */}
                    <path
                        d={`M ${X_oil + 12} ${Y_bore + 8} 
                            L ${X_air - 10} ${Y_bore + 8} 
                            L ${X_air - 10} ${Y_shaft - 42} 
                            L ${X_air - 16} ${Y_shaft - 42} 
                            L ${X_air - 16} ${Y_bore + 14} 
                            L ${X_oil + 12} ${Y_bore + 14} Z`}
                        fill="#334155"
                        stroke="#cbd5e1"
                        strokeWidth="1.2"
                    />

                    {/* Primary Sealing Lip Apex */}
                    <polygon
                        points={`${X_lip},${Y_shaft} ${X_lip - 10},${Y_shaft - 10} ${X_lip + 15},${Y_shaft - 10}`}
                        fill="#fef08a"
                    />
                    <circle cx={X_lip} cy={Y_shaft} r="2.5" fill="#ef4444" />

                    {/* Garter Helical Spring */}
                    <g>
                        <circle
                            cx={X_spring}
                            cy={Y_spring}
                            r="10"
                            fill={`url(#springGrad-${rawId})`}
                            stroke="#f87171"
                            strokeWidth="1.5"
                        />
                        <line x1={X_spring - 6} y1={Y_spring - 6} x2={X_spring + 6} y2={Y_spring + 6} stroke="#ffffff" strokeWidth="1" opacity="0.8" />
                        <line x1={X_spring - 6} y1={Y_spring + 6} x2={X_spring + 6} y2={Y_spring - 6} stroke="#ffffff" strokeWidth="1" opacity="0.8" />
                    </g>

                    {/* Dust Lip */}
                    {hasDustLip && (
                        <g>
                            <path
                                d={`M ${X_air - 14} ${Y_shaft - 32} 
                                    L ${X_air - 4} ${Y_shaft - 6} 
                                    L ${X_air - 12} ${Y_shaft - 8} 
                                    L ${X_air - 22} ${Y_shaft - 28} Z`}
                                fill={rubberFill}
                                stroke={rubberStroke}
                                strokeWidth="1.2"
                            />
                            <line x1={X_air - 6} y1={Y_shaft - 7} x2={X_air + 35} y2={Y_shaft - 14} stroke="#fbbf24" strokeWidth="1" />
                            <text x={X_air + 40} y={Y_shaft - 11} fill="#fbbf24" fontSize="8" fontWeight="bold">
                                {t12(language, 'Dust Lip (Form AS)', 'Toz Dudağı (Form AS)')}
                            </text>
                        </g>
                    )}
                </g>

                {/* 4. Seal Width Dimension */}
                <g>
                    <line x1={X_oil} y1={Y_bore - 4} x2={X_oil} y2={Y_bore - 32} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={X_air} y1={Y_bore - 4} x2={X_air} y2={Y_bore - 32} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                    <line
                        x1={X_oil}
                        y1={Y_bore - 22}
                        x2={X_air}
                        y2={Y_bore - 22}
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        markerStart={`url(#amberArrowStart-${rawId})`}
                        markerEnd={`url(#amberArrow-${rawId})`}
                    />
                    <rect x={(X_oil + X_air) / 2 - 34} y={Y_bore - 30} width="68" height="16" fill="#020610" rx="3" stroke="#f59e0b" strokeWidth="0.8" />
                    <text x={(X_oil + X_air) / 2} y={Y_bore - 18} fill="#f59e0b" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                        b = {widthB} mm
                    </text>
                </g>

                {/* 5. Diameter Callouts */}
                <g transform="translate(25, 24)">
                    <rect width="270" height="34" fill="#090d16" stroke="#1e293b" rx="6" />
                    <text x="12" y="15" fill="#f59e0b" fontSize="10" fontWeight="bold">
                        SUPTEX {sealType?.id ?? '111'} (DIN 3760 FORM {sealType?.dinForm ?? 'AS'})
                    </text>
                    <text x="12" y="27" fill="#94a3b8" fontSize="8">
                        {material} | {shaftDia}×{boreD}×{widthB} mm
                    </text>
                </g>
            </svg>
        </div>
    );
}

// =============================================================================
// 3. KASTAŞ HYDRAULIC SEAL (ISO 7425-1 / ISO 7425-2) BLUEPRINT
// CORRECTED: Piston seal groove is in PISTON (lower body)!
// Rod seal groove is in CYLINDER HEAD (upper body)!
// =============================================================================

export interface HydraulicSealCrossSectionSVGProps {
    category?: 'rod' | 'piston' | 'wiper';
    series: KastasSeriesInfo;
    dia: number;
    grooveDia: number;
    widthL: number;
    depthS: number;
    chamferC?: number;
    radiusR1?: number;
    pressureBar?: number;
    extrusionGap?: number;
    maxAllowedGap?: number;
    isGapSafe?: boolean;
    isPressureSafe?: boolean;
    language?: Language;
}

export function HydraulicSealCrossSectionSVG({
    category = 'rod',
    series,
    dia,
    grooveDia,
    widthL,
    depthS,
    chamferC = 4,
    radiusR1 = 0.6,
    pressureBar = 160,
    extrusionGap = 0.2,
    maxAllowedGap = 0.35,
    isGapSafe = true,
    isPressureSafe = true,
    language = 'tr'
}: HydraulicSealCrossSectionSVGProps) {
    const rawId = React.useId().replace(/:/g, '');
    const wPx = Math.max(120, Math.min(190, Math.round(widthL * 20)));
    const depthPx = Math.max(85, Math.min(125, Math.round(depthS * 15)));
    const centerX = 390;
    const XL = centerX - Math.round(wPx / 2);
    const XR = centerX + Math.round(wPx / 2);

    const isPiston = category === 'piston';
    const isRod = category === 'rod';
    const isWiper = category === 'wiper';

    // Alignment geometry
    const gapPx = Math.max(8, Math.min(18, Math.round(extrusionGap * 30)));
    const Y_sliding_line = 180; // Sliding contact line between housing and moving surface

    return (
        <div className="relative w-full">
            {/* Visual Indicator Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-1)] border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                        isPiston
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : isRod
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    }`}>
                        {isPiston
                            ? t12(language, 'Piston Seal (Piston Head Groove)', 'Piston Keçesi (Piston Başı Kanalı)')
                            : isRod
                            ? t12(language, 'Rod Seal (Cylinder Head Groove)', 'Boğaz Keçesi (Kovan İçi Kanal)')
                            : t12(language, 'Wiper Seal (Scraper)', 'Toz Keçesi (Sıyırıcı)')}
                    </span>
                    <span className="text-slate-500">
                        {series.code} ({series.material}) — {series.isoStandard}
                    </span>
                </div>
                <div className="text-[10px] text-slate-400">
                    P_max = {series.maxPressureBar} bar | v ≤ {series.maxSpeedMs} m/s
                </div>
            </div>

            <svg
                viewBox="0 0 760 380"
                className="w-full h-72 sm:h-80 lg:h-96 bg-[var(--bg-0)] rounded-b-2xl border border-slate-800/80 shadow-2xl overflow-hidden font-mono select-none"
            >
                <defs>
                    <pattern id={`cadGridHydraulic-${rawId}`} width="20" height="20" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="20" y2="0" stroke="#00e5ff" strokeWidth="0.4" strokeOpacity="0.06" />
                        <line x1="0" y1="0" x2="0" y2="20" stroke="#00e5ff" strokeWidth="0.4" strokeOpacity="0.06" />
                    </pattern>
                    <pattern id={`hydMetalHatch-${rawId}`} width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#6366f1" strokeWidth="1.2" strokeOpacity="0.35" />
                    </pattern>
                    <pattern id={`slidingCounterHatch-${rawId}`} width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.35" />
                    </pattern>

                    <linearGradient id={`ptfeBronzeGrad-${rawId}`} x1="0%" y1="0%" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="40%" stopColor="#d97706" />
                        <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                    <radialGradient id={`puEnergizerGrad-${rawId}`} cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="40%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#312e81" />
                    </radialGradient>
                    <linearGradient id={`puSealGrad-${rawId}`} x1="0%" y1="0%" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#0891b2" />
                        <stop offset="100%" stopColor="#164e63" />
                    </linearGradient>

                    <marker id={`cadArrowBlue-${rawId}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 1, 5 3, 0 5" fill="#38bdf8" />
                    </marker>
                    <marker id={`cadArrowBlueStart-${rawId}`} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                        <polygon points="5 1, 0 3, 5 5" fill="#38bdf8" />
                    </marker>
                </defs>

                <rect width="760" height="380" fill={`url(#cadGridHydraulic-${rawId})`} />
                <rect x="12" y="12" width="736" height="356" fill="none" stroke="#1e293b" strokeWidth="1" rx="8" />

                {/* ═════════════════════════════════════════════════════════════════ */}
                {/* CASE 1: PISTON SEAL (KANAL PİSTON KAFASINDA, SİLİNDİR BORUSU DÜZ) */}
                {/* ═════════════════════════════════════════════════════════════════ */}
                {isPiston ? (
                    <g>
                        {/* Upper Body = Straight Honed Cylinder Tube */}
                        <path
                            d={`M 40 35 
                                L 720 35 
                                L 720 ${Y_sliding_line - gapPx} 
                                L 40 ${Y_sliding_line - gapPx} Z`}
                            fill={`url(#slidingCounterHatch-${rawId})`}
                            stroke="#475569"
                            strokeWidth="1.2"
                        />
                        <line x1="40" y1={Y_sliding_line - gapPx} x2="720" y2={Y_sliding_line - gapPx} stroke="#e2e8f0" strokeWidth="2.5" />
                        <text x="45" y={Y_sliding_line - gapPx - 16} fill="#38bdf8" fontSize="10" fontWeight="bold">
                            {t12(language, 'CYLINDER BORE TUBE', 'SİLİNDİR BORUSU')} (Ø{dia} mm H8) — {t12(language, 'Honed', 'Honlanmış')} Ra 0.2-0.4 μm
                        </text>

                        {/* Lower Body = Piston Head with machined groove */}
                        <path
                            d={`M 40 ${Y_sliding_line} 
                                L ${XL} ${Y_sliding_line} 
                                L ${XL} ${Y_sliding_line + depthPx} 
                                L ${XR} ${Y_sliding_line + depthPx} 
                                L ${XR} ${Y_sliding_line} 
                                L 720 ${Y_sliding_line} 
                                L 720 320 
                                L 40 320 Z`}
                            fill={`url(#hydMetalHatch-${rawId})`}
                            stroke="#6366f1"
                            strokeWidth="1.5"
                        />
                        <text x="45" y={Y_sliding_line + depthPx + 24} fill="#e2e8f0" fontSize="10" fontWeight="bold">
                            {t12(language, 'PISTON HEAD', 'PİSTON KAFASI')} ({t12(language, 'Groove', 'Kanal')} Ø{grooveDia.toFixed(1)} mm h9)
                        </text>

                        {/* Hydraulic Seal Seated in Piston Groove */}
                        <g>
                            {/* Elastomer Energizer Ring */}
                            <circle
                                cx={centerX}
                                cy={Y_sliding_line + Math.round(depthPx * 0.65)}
                                r={Math.round(depthPx * 0.28)}
                                fill={`url(#puEnergizerGrad-${rawId})`}
                                stroke="#818cf8"
                                strokeWidth="2"
                            />
                            {/* Sliding Face Element */}
                            <path
                                d={`M ${XL + 8} ${Y_sliding_line + Math.round(depthPx * 0.45)} 
                                    L ${XR - 8} ${Y_sliding_line + Math.round(depthPx * 0.45)} 
                                    L ${XR - 8} ${Y_sliding_line - gapPx} 
                                    L ${XL + 8} ${Y_sliding_line - gapPx} Z`}
                                fill={`url(#ptfeBronzeGrad-${rawId})`}
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                            />
                            <text x={centerX} y={Y_sliding_line + Math.round(depthPx * 0.25)} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                                {series.code} ({series.material})
                            </text>
                        </g>

                        {/* Precision Gland Dimensions */}
                        {/* Groove Width L */}
                        <g>
                            <line x1={XL} y1={Y_sliding_line + depthPx + 4} x2={XL} y2={Y_sliding_line + depthPx + 38} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XR} y1={Y_sliding_line + depthPx + 4} x2={XR} y2={Y_sliding_line + depthPx + 38} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XL} y1={Y_sliding_line + depthPx + 30} x2={XR} y2={Y_sliding_line + depthPx + 30} stroke="#6366f1" strokeWidth="1.5" markerStart={`url(#cadArrowBlueStart-${rawId})`} markerEnd={`url(#cadArrowBlue-${rawId})`} />
                            <rect x={centerX - 42} y={Y_sliding_line + depthPx + 22} width="84" height="16" rx="3" fill="#020610" stroke="#6366f1" strokeWidth="0.8" />
                            <text x={centerX} y={Y_sliding_line + depthPx + 34} fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                                L = {widthL} mm
                            </text>
                        </g>
                        {/* Groove Depth S */}
                        <g>
                            <line x1={XL - 4} y1={Y_sliding_line} x2={XL - 28} y2={Y_sliding_line} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XL - 4} y1={Y_sliding_line + depthPx} x2={XL - 28} y2={Y_sliding_line + depthPx} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XL - 18} y1={Y_sliding_line} x2={XL - 18} y2={Y_sliding_line + depthPx} stroke="#6366f1" strokeWidth="1.5" markerStart={`url(#cadArrowBlueStart-${rawId})`} markerEnd={`url(#cadArrowBlue-${rawId})`} />
                            <rect x={XL - 48} y={Y_sliding_line + depthPx / 2 - 8} width="42" height="16" rx="3" fill="#020610" stroke="#6366f1" strokeWidth="0.8" />
                            <text x={XL - 27} y={Y_sliding_line + depthPx / 2 + 4} fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                                S = {depthS}
                            </text>
                        </g>
                    </g>
                ) : (
                    /* ═════════════════════════════════════════════════════════════ */
                    /* CASE 2: ROD SEAL (KANAL BOĞAZ GÖVDESİNDE, MİL DÜZ KROM)       */
                    /* ═════════════════════════════════════════════════════════════ */
                    <g>
                        {/* Upper Body = Cylinder Head with Internal Groove */}
                        <path
                            d={`M 40 35 
                                L 720 35 
                                L 720 ${Y_sliding_line - gapPx} 
                                L ${XR} ${Y_sliding_line - gapPx} 
                                L ${XR} ${Y_sliding_line - gapPx - depthPx} 
                                L ${XL} ${Y_sliding_line - gapPx - depthPx} 
                                L ${XL} ${Y_sliding_line - gapPx} 
                                L 40 ${Y_sliding_line - gapPx} Z`}
                            fill={`url(#hydMetalHatch-${rawId})`}
                            stroke="#6366f1"
                            strokeWidth="1.5"
                        />
                        <text x="45" y={Y_sliding_line - gapPx - depthPx - 10} fill="#f59e0b" fontSize="10" fontWeight="bold">
                            {t12(language, 'CYLINDER HEAD HOUSING', 'SİLİNDİR BOĞAZ GÖVDESİ')} ({t12(language, 'Groove', 'Kanal')} Ø{grooveDia.toFixed(1)} mm H9)
                        </text>

                        {/* Lower Body = Smooth Chrome-Plated Rod */}
                        <path
                            d={`M 40 ${Y_sliding_line} 
                                L 650 ${Y_sliding_line} 
                                L 685 ${Y_sliding_line + 16} 
                                L 720 ${Y_sliding_line + 16} 
                                L 720 320 
                                L 40 320 Z`}
                            fill={`url(#slidingCounterHatch-${rawId})`}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                        />
                        <line x1="40" y1={Y_sliding_line} x2="650" y2={Y_sliding_line} stroke="#38bdf8" strokeWidth="2.5" />
                        <line x1="650" y1={Y_sliding_line} x2="685" y2={Y_sliding_line + 16} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />

                        <text x="45" y={Y_sliding_line + 28} fill="#e2e8f0" fontSize="10" fontWeight="bold">
                            {t12(language, 'CHROME PLATED ROD', 'KROM KAPLI MİL')}: Ø{dia} mm f7 (Ra 0.1–0.2 μm, 20 μm {t12(language, 'Hard Chrome', 'Sert Krom')})
                        </text>

                        {/* Seal seated in housing groove */}
                        <g>
                            <circle
                                cx={centerX}
                                cy={Y_sliding_line - gapPx - Math.round(depthPx * 0.65)}
                                r={Math.round(depthPx * 0.28)}
                                fill={`url(#puEnergizerGrad-${rawId})`}
                                stroke="#818cf8"
                                strokeWidth="2"
                            />
                            <path
                                d={`M ${XL + 8} ${Y_sliding_line - gapPx - Math.round(depthPx * 0.45)} 
                                    L ${XR - 8} ${Y_sliding_line - gapPx - Math.round(depthPx * 0.45)} 
                                    L ${XR - 8} ${Y_sliding_line} 
                                    L ${XL + 8} ${Y_sliding_line} Z`}
                                fill={`url(#ptfeBronzeGrad-${rawId})`}
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                            />
                            <text x={centerX} y={Y_sliding_line - gapPx - Math.round(depthPx * 0.2)} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                                {series.code} ({series.material})
                            </text>
                        </g>

                        {/* Precision Gland Dimensions */}
                        {/* Groove Width L */}
                        <g>
                            <line x1={XL} y1={Y_sliding_line - gapPx - depthPx - 4} x2={XL} y2={Y_sliding_line - gapPx - depthPx - 30} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XR} y1={Y_sliding_line - gapPx - depthPx - 4} x2={XR} y2={Y_sliding_line - gapPx - depthPx - 30} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XL} y1={Y_sliding_line - gapPx - depthPx - 22} x2={XR} y2={Y_sliding_line - gapPx - depthPx - 22} stroke="#6366f1" strokeWidth="1.5" markerStart={`url(#cadArrowBlueStart-${rawId})`} markerEnd={`url(#cadArrowBlue-${rawId})`} />
                            <rect x={centerX - 42} y={Y_sliding_line - gapPx - depthPx - 30} width="84" height="16" rx="3" fill="#020610" stroke="#6366f1" strokeWidth="0.8" />
                            <text x={centerX} y={Y_sliding_line - gapPx - depthPx - 18} fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                                L = {widthL} mm
                            </text>
                        </g>
                        {/* Groove Depth S */}
                        <g>
                            <line x1={XL - 4} y1={Y_sliding_line - gapPx} x2={XL - 28} y2={Y_sliding_line - gapPx} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XL - 4} y1={Y_sliding_line - gapPx - depthPx} x2={XL - 28} y2={Y_sliding_line - gapPx - depthPx} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1={XL - 18} y1={Y_sliding_line - gapPx} x2={XL - 18} y2={Y_sliding_line - gapPx - depthPx} stroke="#6366f1" strokeWidth="1.5" markerStart={`url(#cadArrowBlueStart-${rawId})`} markerEnd={`url(#cadArrowBlue-${rawId})`} />
                            <rect x={XL - 48} y={Y_sliding_line - gapPx - depthPx / 2 - 8} width="42" height="16" rx="3" fill="#020610" stroke="#6366f1" strokeWidth="0.8" />
                            <text x={XL - 27} y={Y_sliding_line - gapPx - depthPx / 2 + 4} fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                                S = {depthS}
                            </text>
                        </g>
                    </g>
                )}

                {/* Reciprocating Stroke Arrows */}
                <g transform={`translate(${centerX - 40}, 340)`}>
                    <line x1="-30" y1="0" x2="30" y2="0" stroke="#38bdf8" strokeWidth="2" markerStart={`url(#cadArrowBlueStart-${rawId})`} markerEnd={`url(#cadArrowBlue-${rawId})`} />
                    <text x="38" y="4" fill="#38bdf8" fontSize="9" fontWeight="bold">
                        v ≤ {series?.maxSpeedMs ?? 0.5} m/s
                    </text>
                </g>

                {/* HUD Header */}
                <g transform="translate(25, 20)">
                    <rect width="270" height="34" fill="#090d16" stroke="#1e293b" rx="6" />
                    <text x="12" y="15" fill="#6366f1" fontSize="10" fontWeight="bold">
                        KASTAŞ {series.code} ({series.isoStandard})
                    </text>
                    <text x="12" y="27" fill="#94a3b8" fontSize="8">
                        {isPiston ? `Piston Ø${dia} mm` : `Mil Ø${dia} mm`} | Kanal: {widthL}×{depthS} mm
                    </text>
                </g>
            </svg>
        </div>
    );
}
