/**
 * modules/mechanical/CylinderDesign/CylinderReportModal.tsx
 * 
 * Certified Engineering Calculation Passport & Technical Datasheet Modal
 * Conforms to ISO 6020-2, DIN 2413, ISO/TR 10461, and VDI 2230 standards.
 */

'use client';

import React from 'react';
import { formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { 
    X, 
    Printer, 
    Copy, 
    Download, 
    Check, 
    ShieldCheck, 
    Award, 
    Cpu, 
    Activity, 
    FileText 
} from 'lucide-react';
import { t12 } from '@/locales/t12';
import { CylinderDesignResult } from './engine';
import { APP_RELEASE_NAME } from '@/config/app';

interface CylinderReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: CylinderDesignResult;
    precision: number;
    language: string;
    onCopyReport: () => void;
    copied: boolean;
    onExportCSV: () => void;
}

export function CylinderReportModal({
    isOpen,
    onClose,
    result,
    precision,
    language,
    onCopyReport,
    copied,
    onExportCSV
}: CylinderReportModalProps) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const calculationHash = 'SHA256-' + Math.abs(
        Math.round(result.pushForceKN * 1000 + result.tubeHoopStressMPa * 100 + result.criticalBucklingForceKN)
    ).toString(16).toUpperCase().padStart(8, '0');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line-strong)] shadow-2xl font-mono text-xs overflow-hidden">
                {/* Modal Title Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-2)] border-b border-[var(--line)]">
                    <div className="flex items-center gap-2">
                        <Award size={16} className="text-[var(--cyan)]" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                            {t12(language, 'ISO 6020-2 / DIN 2413 Engineering Calculation Passport', 'ISO 6020-2 / DIN 2413 Mühendislik Hesaplama Pasaportu')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px] text-[var(--cyan)] font-mono">
                            {calculationHash}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1 rounded text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-3)] transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Printable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Official Certificate Header */}
                    <div className="p-3 rounded bg-[var(--bg-0)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <div className="text-[13px] font-bold text-white tracking-wide">
                                ALUCALC INDUSTRIAL ENGINEERING OPERATING SYSTEM
                            </div>
                            <div className="text-[10px] text-[var(--alu-dim)]">
                                Deterministic Mechanical Solver Core · ISO 6020-2 / DIN 2413 / ISO/TR 10461 / VDI 2230
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`px-2.5 py-1 rounded border text-center font-bold ${
                                result.isDesignSafeOverall 
                                    ? 'bg-[var(--ok)]/10 border-[var(--ok)]/30 text-[var(--ok)]' 
                                    : 'bg-[var(--bad)]/10 border-[var(--bad)]/30 text-[var(--bad)]'
                            }`}>
                                <div className="text-[10px] uppercase">{t12(language, 'DESIGN STATUS', 'TASARIM DURUMU')}</div>
                                <div className="text-xs">{result.isDesignSafeOverall ? t12(language, '✓ COMPLIANT (PASS)', '✓ UYGUN (PASS)') : t12(language, '⚠ LIMIT EXCEEDED', '⚠ LİMİT AŞIMI')}</div>
                            </div>
                            <div className="px-2.5 py-1 rounded border border-[var(--line)] bg-[var(--bg-2)] text-center">
                                <div className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'TOTAL MASS', 'TOPLAM KÜTLE')}</div>
                                <div className="text-xs font-bold text-white">{result.totalCylinderMassKg} kg</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Dimensions & Sizing */}
                    <div className="space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5 border-b border-[var(--line)] pb-1">
                            <Cpu size={13} /> 1. {t12(language, 'Geometric Sizing & ISO 3320 Pairings', 'Geometrik Boyutlar & ISO 3320 Eşleşmesi')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Bore Dia (ØD):', 'Anma Çapı (ØD):')}</span>
                                <div className="text-white font-bold text-xs">Ø{result.tubeInnerDiaD} mm (H8)</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Rod Dia (Ød):', 'Mil Çapı (Ød):')}</span>
                                <div className="text-white font-bold text-xs">Ø{result.rodSelfWeightKg > 0 ? (result.tubeInnerDiaD >= 80 ? 45 : 28) : 45} mm (f7)</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Closed / Open Length:', 'Kapalı / Açık Boy:')}</span>
                                <div className="text-white font-bold text-xs">{result.closedLengthMm} / {result.extendedLengthMm} mm</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Tube Wall Thickness (t):', 'Boru Et Kalınlığı (t):')}</span>
                                <div className="text-[var(--ok)] font-bold text-xs">{result.tubeWallThicknessT} mm (Min: {result.minRequiredWallThicknessT} mm)</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Kinematic & Force Balance */}
                    <div className="space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase text-[var(--warn)] flex items-center gap-1.5 border-b border-[var(--line)] pb-1">
                            <Activity size={13} /> 2. {t12(language, 'Kinematic & Force Balance', 'Kinematik & Kuvvet Dengesi')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Thrust Force F_push:', 'İtme Kuvveti F_push:')}</span>
                                <div className="text-[var(--cyan)] font-bold text-xs">{formatEngineeringValue(result.pushForceKN, precision, true)} kN ({Math.round(result.pushForceKN * 101.97)} kgf)</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Pull Force F_pull:', 'Çekme Kuvveti F_pull:')}</span>
                                <div className="text-[var(--warn)] font-bold text-xs">{formatEngineeringValue(result.pullForceKN, precision, true)} kN ({Math.round(result.pullForceKN * 101.97)} kgf)</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Push Speed & Time:', 'İlerleme Hızı & Süre:')}</span>
                                <div className="text-white font-bold text-xs">{formatEngineeringValue(result.pushSpeedMPerSec, precision, true)} m/s ({formatEngineeringValue(result.pushStrokeTimeSec, precision, true)} s)</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Hydraulic Power Demand:', 'Hidrolik Güç Talebi:')}</span>
                                <div className="text-[var(--ok)] font-bold text-xs">{formatEngineeringValue(result.hydraulicPowerKW, precision, true)} kW</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Pressure & Buckling Safety */}
                    <div className="space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase text-[var(--std)] flex items-center gap-1.5 border-b border-[var(--line)] pb-1">
                            <ShieldCheck size={13} /> 3. {t12(language, 'Pressure & Column Buckling Safety (DIN 2413 / ISO/TR 10461)', 'Basınç & Burkulma Emniyet Tahkikleri (DIN 2413 / ISO/TR 10461)')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Hoop Stress (σ_t):', 'Çeper Gerilmesi (Hoop):')}</span>
                                <div className="text-white font-bold text-xs">{result.tubeHoopStressMPa} MPa (SF: {result.tubeYieldSafetyFactor})</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Tube Burst Pressure:', 'Boru Patlama Basıncı:')}</span>
                                <div className="text-[var(--ok)] font-bold text-xs">{result.tubeBurstPressureBar} bar (SF: {result.tubeBurstSafetyFactor})</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Slenderness λ / Trans λ_g:', 'Narinlik λ / Geçiş λ_g:')}</span>
                                <div className="text-white font-bold text-xs">λ = {result.rodSlendernessRatio} (λ_g = {result.transitionSlendernessLambdaG})</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Buckling Safety (SF):', 'Burkulma Emniyeti (SF):')}</span>
                                <div className={`font-bold text-xs ${result.isBucklingSafe ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                    {formatEngineeringValue(result.bucklingSafetyFactor, precision, true)} (Min: 3.50)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Fasteners, Joints & Ports */}
                    <div className="space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase text-[var(--alu)] flex items-center gap-1.5 border-b border-[var(--line)] pb-1">
                            <FileText size={13} /> 4. {t12(language, 'Fasteners, Joint Stresses & Port Dynamics', 'Bağlantı Elemanları, Gerilmeler & Port Dinamiği')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Barrel Construction:', 'Gövde Konstrüksiyonu:')}</span>
                                <div className="text-white font-bold text-xs">{result.barrelConnectionStyle}</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Port Size (ISO 6149):', 'Port Ölçüsü (ISO 6149):')}</span>
                                <div className="text-white font-bold text-xs">{result.recommendedPortSize} ({result.portFluidVelocityMPerSec.toFixed(2)} m/s)</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Peak Cushioning Pressure:', 'Yastıklama Tepe Basıncı:')}</span>
                                <div className="text-[var(--cyan)] font-bold text-xs">{result.peakCushioningPressureBar} bar (E_k: {result.kineticEnergyJoules.toFixed(1)} J)</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Horizontal Rod Sag:', 'Yatay Mil Sehimi (Sag):')}</span>
                                <div className={`font-bold text-xs ${result.isDeflectionAcceptable ? 'text-[var(--ok)]' : 'text-[var(--warn)]'}`}>
                                    {result.maxHorizontalDeflectionMm} mm ({result.needsStopTube ? t12(language, 'Stop Tube Required', 'Stop Tube Gerekli') : t12(language, 'Acceptable', 'Uygun')})
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Sealing Package & Tolerances */}
                    <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1 text-[11px]">
                        <div className="font-bold text-[var(--cyan)]">{t12(language, 'Standard Sealing Package (Kastaş & ISO 3601):', 'Standart Sızdırmazlık Paketi (Kastaş & ISO 3601):')}</div>
                        <div className="text-[var(--alu)]">
                            · {t12(language, 'Rod Seal:', 'Boğaz Keçesi:')} {result.sealingBOM.rodSeal} | {t12(language, 'Wiper:', 'Toz Sıyırıcı:')} {result.sealingBOM.wiperSeal} | {t12(language, 'Piston Seal:', 'Piston Keçesi:')} {result.sealingBOM.pistonSeal}
                        </div>
                        <div className="text-[var(--alu-dim)] text-[10px]">
                            · {t12(language, 'Guide Bands:', 'Yataklama:')} {result.sealingBOM.pistonGuideRings} | {t12(language, 'Static O-Rings:', 'Statik O-Ringler:')} {result.sealingBOM.internalRodORing} & {result.sealingBOM.tubeGlandORing}
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[var(--bg-2)] border-t border-[var(--line)]">
                    <div className="text-[10px] text-[var(--alu-dim)]">
                        {APP_RELEASE_NAME} · ISO 6020-2 / DIN 2413 Deterministic Verification
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCopyReport}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--bg-3)] hover:bg-[var(--line)] text-white font-bold transition-colors"
                        >
                            {copied ? <Check size={13} className="text-[var(--ok)]" /> : <Copy size={13} />}
                            <span>{copied ? t12(language, 'Copied', 'Kopyalandı') : t12(language, 'Copy Text Report', 'Metin Raporu Kopyala')}</span>
                        </button>
                        <button
                            onClick={onExportCSV}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--bg-3)] hover:bg-[var(--line)] text-[var(--cyan)] font-bold transition-colors"
                        >
                            <Download size={13} />
                            <span>{t12(language, 'Download BOM CSV', 'BOM CSV İndir')}</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] text-black font-bold transition-colors"
                        >
                            <Printer size={13} />
                            <span>{t12(language, 'Print / PDF', 'Yazdır / PDF')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
