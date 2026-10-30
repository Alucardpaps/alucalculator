/**
 * modules/mechanical/CylinderDesign/ManufacturingPassportCard.tsx
 * 
 * Interactive Manufacturing Passport, ISO 286 Fit Gauge Bars & Quality Testing Protocol
 * Conforms to ISO 286-1, DIN EN ISO 4287, DIN EN ISO 5817, and DIN ISO 10100 standards.
 */

'use client';

import React from 'react';
import { formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { Wrench, CheckCircle2, ShieldCheck, Activity, Award, Check } from 'lucide-react';
import { t12 } from '@/locales/t12';

interface ManufacturingPassportCardProps {
    boreD: number;
    rodD: number;
    tubeBoreTolerance: string;
    rodTolerance: string;
    pistonTolerance: string;
    glandTolerance: string;
    operatingPressureBar: number;
    peakPressureBar: number;
    language: string;
}

export function ManufacturingPassportCard({
    boreD,
    rodD,
    tubeBoreTolerance,
    rodTolerance,
    pistonTolerance,
    glandTolerance,
    operatingPressureBar,
    peakPressureBar,
    language
}: ManufacturingPassportCardProps) {
    // Proof test pressure per DIN ISO 10100: 1.5 x operating pressure
    const proofTestPressureBar = Math.round(operatingPressureBar * 1.5);

    // Approximate ISO 286-1 deviation values (µm) based on diameter
    // Bore H8: 0 to +46 µm (for 50-80mm), Piston h8: 0 to -46 µm
    const boreDevUpperUm = boreD <= 50 ? 39 : boreD <= 80 ? 46 : boreD <= 120 ? 54 : 63;
    const rodDevUpperUm = -(rodD <= 30 ? 20 : rodD <= 50 ? 25 : rodD <= 80 ? 30 : 36);
    const rodDevLowerUm = rodDevUpperUm - (rodD <= 30 ? 21 : rodD <= 50 ? 25 : rodD <= 80 ? 30 : 35);
    const glandDevUpperUm = rodD <= 30 ? 52 : rodD <= 50 ? 62 : rodD <= 80 ? 74 : 87;

    const minPistonClearanceUm = 0;
    const maxPistonClearanceUm = boreDevUpperUm * 2;

    const minRodClearanceUm = Math.abs(rodDevUpperUm);
    const maxRodClearanceUm = glandDevUpperUm + Math.abs(rodDevLowerUm);

    return (
        <div className="w-full rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] p-3.5 space-y-3 font-mono">
            {/* Header & Quality Passport Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                        <Award size={14} className="text-[var(--std)]" />
                        {t12(language, 'Manufacturing Quality Passport & ISO 286 Fits (DIN ISO 10100)', 'İmalat Kalite Pasaportu & ISO 286 Geçme Toleransları (DIN ISO 10100)')}
                    </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-[var(--ok)]/10 border border-[var(--ok)]/30 text-[var(--ok)] font-bold">
                        FAT PROOF TEST: {proofTestPressureBar} BAR
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)]">
                        DIN EN ISO 5817 Seviye B
                    </span>
                </div>
            </div>

            {/* Grid 1: ISO 286-1 Tolerance Fit Gauge Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Piston in Honed Bore (H8 / h8) */}
                <div className="p-3 rounded bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-xs">
                        <span className="font-bold text-[var(--cyan)]">
                            1. {t12(language, 'Bore & Piston Guiding Fit', 'Honlu Boru & Piston Yataklama Geçmesi')}
                        </span>
                        <span className="text-[10px] text-white font-bold bg-[var(--bg-2)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                            Ø{boreD} H8 / h8
                        </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Honed Tube Tolerance:', 'Honlanmış Boru Toleransı:')}</span>
                            <span className="text-white font-bold">Ø{boreD} H8 (+0.0{boreDevUpperUm} / 0 mm)</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Piston Body Tolerance:', 'Piston Gövdesi Toleransı:')}</span>
                            <span className="text-white font-bold">Ø{boreD} h8 (0 / -0.0{boreDevUpperUm} mm)</span>
                        </div>

                        {/* Graphic Tolerance Zone Bar */}
                        <div className="pt-1.5 space-y-1">
                            <div className="flex justify-between text-[10px] text-[var(--alu-dim)]">
                                <span>-46 µm ({t12(language, 'Piston Min', 'Piston Min')})</span>
                                <span className="text-[var(--cyan)] font-bold">0.0 (Nominal Ø{boreD})</span>
                                <span>+{boreDevUpperUm} µm ({t12(language, 'Bore Max', 'Boru Max')})</span>
                            </div>
                            <div className="w-full h-4 bg-[var(--bg-2)] rounded border border-[var(--line)] relative overflow-hidden flex items-center">
                                {/* Center nominal line */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--line-strong)] z-10" />
                                {/* Piston zone: left of center */}
                                <div
                                    className="absolute right-1/2 top-1 bottom-1 bg-[var(--warn)]/40 border border-[var(--warn)] rounded-l-sm"
                                    style={{ width: '38%' }}
                                    title={t12(language, 'Piston h8 tolerance zone', 'Piston h8 tolerans aralığı')}
                                />
                                {/* Bore zone: right of center */}
                                <div
                                    className="absolute left-1/2 top-1 bottom-1 bg-[var(--cyan)]/40 border border-[var(--cyan)] rounded-r-sm"
                                    style={{ width: '38%' }}
                                    title={t12(language, 'Honed tube H8 tolerance zone', 'Honlu Boru H8 tolerans aralığı')}
                                />
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-[var(--ok)] font-bold">{t12(language, 'Min Clearance:', 'Min Boşluk:')} {minPistonClearanceUm} µm</span>
                                <span className="text-[var(--warn)] font-bold">{t12(language, 'Max Clearance:', 'Max Boşluk:')} {maxPistonClearanceUm} µm</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Rod in Gland Bushing (f7 / H9) */}
                <div className="p-3 rounded bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-xs">
                        <span className="font-bold text-[var(--std)]">
                            2. {t12(language, 'Rod & Gland Bushing Fit', 'Mil & Boğaz Kılavuz Yataklama Geçmesi')}
                        </span>
                        <span className="text-[10px] text-white font-bold bg-[var(--bg-2)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                            Ø{rodD} f7 / H9
                        </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Chrome Plated Rod Tolerance:', 'Krom Kaplı Mil Toleransı:')}</span>
                            <span className="text-white font-bold">Ø{rodD} f7 ({rodDevUpperUm} / {rodDevLowerUm} µm)</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Gland Bushing Tolerance:', 'Boğaz Kılavuz Burcu:')}</span>
                            <span className="text-white font-bold">Ø{rodD} H9 (+{glandDevUpperUm} / 0 µm)</span>
                        </div>

                        {/* Graphic Tolerance Zone Bar */}
                        <div className="pt-1.5 space-y-1">
                            <div className="flex justify-between text-[10px] text-[var(--alu-dim)]">
                                <span>{rodDevLowerUm} µm ({t12(language, 'Rod Min', 'Mil Min')})</span>
                                <span className="text-[var(--std)] font-bold">0.0 (Nominal Ø{rodD})</span>
                                <span>+{glandDevUpperUm} µm ({t12(language, 'Gland Max', 'Boğaz Max')})</span>
                            </div>
                            <div className="w-full h-4 bg-[var(--bg-2)] rounded border border-[var(--line)] relative overflow-hidden flex items-center">
                                {/* Center nominal line */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--line-strong)] z-10" />
                                {/* Rod zone: left of center */}
                                <div
                                    className="absolute right-1/2 top-1 bottom-1 bg-[var(--std)]/40 border border-[var(--std)] rounded-l-sm"
                                    style={{ width: '42%' }}
                                    title={t12(language, 'Rod f7 tolerance zone', 'Mil f7 tolerans aralığı')}
                                />
                                {/* Gland bushing zone: right of center */}
                                <div
                                    className="absolute left-1/2 top-1 bottom-1 bg-[var(--ok)]/40 border border-[var(--ok)] rounded-r-sm"
                                    style={{ width: '46%' }}
                                    title={t12(language, 'Gland H9 tolerance zone', 'Boğaz H9 tolerans aralığı')}
                                />
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-[var(--ok)] font-bold">{t12(language, 'Min Guide Clearance:', 'Min Yatak Boşluğu:')} +{minRodClearanceUm} µm</span>
                                <span className="text-[var(--warn)] font-bold">{t12(language, 'Max Guide Clearance:', 'Max Yatak Boşluğu:')} +{maxRodClearanceUm} µm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid 2: Surface Roughness Profilometer & Factory Acceptance Testing (FAT) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Surface Roughness & Chrome Specs */}
                <div className="p-3 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                        <span className="font-bold text-[var(--cyan)] flex items-center gap-1.5">
                            <Activity size={13} /> {t12(language, 'Surface Finish & Honing Spec (DIN EN ISO 4287)', 'Yüzey Pürüzlülüğü & Honlama Spesifikasyonu (DIN EN ISO 4287)')}
                        </span>
                        <span className="text-[10px] text-[var(--alu-dim)]">Cross-Hatch 45°-55°</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Honed Tube ID (Honed ID):', 'Honlu Boru İç Yüzeyi (Honed ID):')}</span>
                            <span className="text-white font-bold">Ra ≤ 0.40 µm · Rz ≤ 1.60 µm</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Chrome Plating Thickness & Hardness:', 'Krom Kaplama Kalınlığı & Sertlik:')}</span>
                            <span className="text-[var(--cyan)] font-bold">25-30 µm {t12(language, 'Hard Chrome', 'Sert Krom')} (65-68 HRC)</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Chrome Rod Roughness:', 'Kromlu Mil Pürüzlülüğü:')}</span>
                            <span className="text-white font-bold">Ra ≤ 0.20 µm · Rz ≤ 1.00 µm</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Corrosion Test (ISO 9227 NSS):', 'Korozyon Testi (ISO 9227 NSS):')}</span>
                            <span className="text-[var(--ok)] font-bold">≥ 200 {t12(language, 'Hours (Rating 10 Zero Corrosion)', 'Saat (Korozyonsuz Seviye 10)')}</span>
                        </div>
                    </div>
                </div>

                {/* DIN ISO 10100 Quality Acceptance Testing Protocol */}
                <div className="p-3 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                        <span className="font-bold text-[var(--ok)] flex items-center gap-1.5">
                            <ShieldCheck size={13} /> {t12(language, 'Factory Acceptance Testing Protocol (DIN ISO 10100)', 'Fabrika Kabul & Test Protokolü (DIN ISO 10100)')}
                        </span>
                        <span className="text-[10px] text-[var(--ok)] font-bold">{t12(language, 'Class A Zero Leakage', 'Seviye A Kaçaksız')}</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Static Proof Test Pressure (1.5 · p_oper):', 'Statik Sızdırmazlık Test Basıncı (1.5 · p_oper):')}</span>
                            <span className="text-[var(--ok)] font-bold">{proofTestPressureBar} bar ({t12(language, '60s hold', '60 sn bekleme')})</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'External Leakage Criterion:', 'Dış Sızıntı Kriteri (External Leakage):')}</span>
                            <span className="text-white font-bold">0 {t12(language, 'drops (Zero sweating / Class A)', 'damla (Sıfır terleme / Seviye A)')}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Internal Bypass Leakage Limit:', 'Piston İç Kaçak Limiti (Internal Bypass):')}</span>
                            <span className="text-white font-bold">&lt; 0.5 cm³/dk (160 bar test)</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                            <span className="text-[var(--alu-dim)]">{t12(language, 'Breakaway Starting Pressure:', 'Kopma / İlk Hareket Basıncı (Breakaway):')}</span>
                            <span className="text-[var(--cyan)] font-bold">p_breakaway ≤ 5.0 bar ({t12(language, 'No Stick-Slip', 'Stick-Slip Yok')})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
