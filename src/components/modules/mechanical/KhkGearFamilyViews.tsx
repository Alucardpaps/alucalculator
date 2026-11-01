'use client';

import React, { useState, useMemo } from 'react';
import {
    calculateKhkInternalGear,
    calculateKhkRackAndPinion,
    calculateKhkBevelGear,
    calculateKhkWormGear,
    calculateKhkScrewGear,
    KhkRackAndPinionResult,
    KhkBevelGearResult,
    KhkWormGearResult,
    KhkScrewGearResult,
} from '@/engines/math/khkGearSuiteEngine';
import { useKineticSpin } from '@/hooks/useKineticSpin';
import {
    generateExternalGearContour,
    pointsToSvgPath,
    downloadGearProductionSvg,
} from '@/engines/math/gear-involute-factory';
import { useKhkGearStore } from '@/stores/khkGearStore';
import { getGearsModuleStrings } from '@/locales/gearsModuleTranslations';
import { t12 } from '@/locales/t12';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import {
    FileSpreadsheet,
    Copy,
    Check,
    Download,
    ChevronDown,
    ShieldCheck,
    RotateCcw,
    Zap,
    MoveRight,
    Cog,
    CircleDot,
    Box,
    Layers,
    BookOpen,
} from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export interface CommonViewProps {
    currentLang?: string;
    isTr?: boolean;
}

// ═════════════════════════════════════════════════════════════════════════
// SHARED DEFINITIONS & HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════════════

export function SvgSharedDefs() {
    return (
        <defs>
            <linearGradient id="metalPinionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="35%" stopColor="#4f46e5" />
                <stop offset="70%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="metalGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="35%" stopColor="#0891b2" />
                <stop offset="70%" stopColor="#0e7490" />
                <stop offset="100%" stopColor="#164e63" />
            </linearGradient>
            <linearGradient id="metalBronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="35%" stopColor="#d97706" />
                <stop offset="70%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="metalSteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="35%" stopColor="#94a3b8" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <pattern id="diagHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#243041" strokeWidth="1.2" />
            </pattern>
            <pattern id="cadHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#334155" strokeWidth="0.9" />
            </pattern>
            <filter id="gearShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.75" />
            </filter>
            <filter id="neonLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="glow1" />
                <feGaussianBlur stdDeviation="6" result="glow2" />
                <feMerge>
                    <feMergeNode in="glow2" />
                    <feMergeNode in="glow1" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="amberLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="glow1" />
                <feGaussianBlur stdDeviation="5" result="glow2" />
                <feMerge>
                    <feMergeNode in="glow2" />
                    <feMergeNode in="glow1" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="emeraldLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="glow1" />
                <feGaussianBlur stdDeviation="5.5" result="glow2" />
                <feMerge>
                    <feMergeNode in="glow2" />
                    <feMergeNode in="glow1" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <marker id="arrowLaser" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#3ad0e6" />
            </marker>
            <marker id="arrowEmerald" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#3dd68c" />
            </marker>
            <marker id="arrowAmber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e6b84a" />
            </marker>
        </defs>
    );
}

export function SvgLaserHudBadge({
    selectedDim,
    dimName,
    onClear,
    isTr,
    currentLang,
}: {
    selectedDim: string | null;
    dimName?: string;
    onClear: () => void;
    isTr?: boolean;
    currentLang?: string;
}) {
    if (!selectedDim) return null;
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    return (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-[var(--bg-1)] px-3 py-1.5 rounded-xl border border-cyan-400/50 text-[11px] font-mono ">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-cyan-300 font-bold">
                {t('ACTIVE MEASURE: ', 'VURGULANAN ÖLÇÜ: ')}
                <span className="text-white underline decoration-cyan-400 decoration-2">
                    {dimName || selectedDim}
                </span>
            </span>
            <button
                type="button"
                onClick={onClear}
                className="ml-1 text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10 text-xs font-bold leading-none cursor-pointer"
                title={t('Clear', 'Vurgulamayı Kapat')}
            >
                ✕
            </button>
        </div>
    );
}

export function SvgKineticBadge({
    speedMultiplier,
    direction,
}: {
    speedMultiplier: number;
    direction: 1 | -1;
}) {
    const precision = useGlobalPrecision();
    return (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[var(--bg-1)] px-2.5 py-1.5 rounded-xl border border-[var(--line)] text-[10px] font-mono shadow-xl pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-bold">
                {formatEngineeringValue(Math.abs(speedMultiplier), precision, false)}x {direction === 1 ? 'CW' : 'CCW'}
            </span>
        </div>
    );
}

function downloadRawSvg(filename: string, content: string) {
    const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ═════════════════════════════════════════════════════════════════════════
// 1. KHK RACK AND PINION (CONTROLS & VIEW)
// ═════════════════════════════════════════════════════════════════════════

export function KhkRackControls({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const { rack, setRackParam } = useKhkGearStore();

    const calc = useMemo(() => calculateKhkRackAndPinion({
        module: rack.moduleVal,
        pinionTeeth: rack.teethZ1,
        rackHeightToPitch: rack.rackH,
        helixAngleDeg: rack.helixAngle,
        profileShift: rack.profileShiftX,
        rpm: rack.rpm,
        pinionTorqueNm: rack.torqueNm,
    }), [rack]);

    return (
        <div className="space-y-3 font-mono">
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <MoveRight size={14} className="text-[var(--cyan)]" />
                        {s.rackTitle}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold">{t12(currentLang, 'KHK Table 4.6 & 4.10', 'KHK Tablo 4.6 & 4.10')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.gearModule} (mn)</label>
                        <input
                            type="number"
                            step="any"
                            value={rack.moduleVal}
                            onChange={(e) => setRackParam('moduleVal', Math.max(0.5, parseFloat(e.target.value) || 1))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.pinionTeeth} (z₁)</label>
                        <input
                            type="number"
                            step="1"
                            value={rack.teethZ1}
                            onChange={(e) => setRackParam('teethZ1', Math.max(10, parseInt(e.target.value) || 10))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.rackPitchHeight} (H)</label>
                        <input
                            type="number"
                            step="any"
                            value={rack.rackH}
                            onChange={(e) => setRackParam('rackH', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--warn)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.helixAngle} β (°)</label>
                        <input
                            type="number"
                            step="any"
                            value={rack.helixAngle}
                            onChange={(e) => setRackParam('helixAngle', Math.min(45, Math.max(0, parseFloat(e.target.value) || 0)))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.profileShift} (x₁)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={rack.profileShiftX}
                            onChange={(e) => setRackParam('profileShiftX', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">RPM (n₁)</label>
                        <input
                            type="number"
                            step="any"
                            value={rack.rpm}
                            onChange={(e) => setRackParam('rpm', Math.max(1, parseFloat(e.target.value) || 1))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--ok)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">Torque (T₁) Nm</label>
                    <input
                        type="number"
                        step="any"
                        value={rack.torqueNm}
                        onChange={(e) => setRackParam('torqueNm', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--cyan)] font-bold outline-none focus:border-[var(--cyan)]"
                    />
                </div>
            </div>

            {/* Quick Kinetic Telemetry */}
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] font-mono text-[11px] space-y-2">
                <span className="text-[10px] font-bold uppercase text-[var(--alu-dim)] block">
                    {t12(currentLang, 'LINEAR KINEMATICS & THRUST', 'DOĞRUSAL KİNEMATİK & İTME')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{s.rackTravelPerRev}:</span>
                        <span className="text-sm font-black text-[var(--cyan)]">{formatEngineeringValue(calc.travelPerRevMm, precision, false)} mm</span>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{s.rackFeedForce}:</span>
                        <span className="text-sm font-black text-[var(--ok)]">{formatEngineeringValue(calc.feedForceN, precision, false)} N</span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px]">
                    <span className="text-[var(--alu-dim)]">{s.rackSeparatingForce}:</span>
                    <span className="font-bold text-[var(--warn)]">{formatEngineeringValue(calc.separatingForceN, precision, false)} N</span>
                </div>
            </div>
        </div>
    );
}

export function KhkRackView({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const { rack } = useKhkGearStore();

    const [selectedDim, setSelectedDim] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true);

    const calc: KhkRackAndPinionResult = useMemo(() => calculateKhkRackAndPinion({
        module: rack.moduleVal,
        pinionTeeth: rack.teethZ1,
        rackHeightToPitch: rack.rackH,
        helixAngleDeg: rack.helixAngle,
        profileShift: rack.profileShiftX,
        rpm: rack.rpm,
        pinionTorqueNm: rack.torqueNm,
    }), [rack]);

    const kinetic = useKineticSpin({
        mode: 'circular',
        nominalSpeedDegPerSec: 36 * Math.max(0.2, Math.min(2.5, rack.rpm / 150)),
        autoPlay: true,
        dragSensitivity: 1.15,
        wheelSensitivity: 0.0035,
    });

    const angle1 = kinetic.angle % 360;

    const cx1 = 380;
    const totalVerticalMm = Math.max(calc.da1 + calc.H + 15, 35);
    const scale = Math.min(185 / (calc.da1 / 2), 310 / totalVerticalMm);

    const r1 = (calc.d1 / 2) * scale;
    const ra1 = (calc.da1 / 2) * scale;
    const rf1 = (calc.df1 / 2) * scale;

    const cy1 = 155;
    const yPitch = cy1 + r1;
    const yDatum = yPitch + calc.H * scale;
    const rackPitchMm = Math.PI * calc.mt * scale;
    const rackHa = rack.moduleVal * scale;
    const rackHf = 1.25 * rack.moduleVal * scale;
    const yTipRack = yPitch - rackHa;
    const yRootRack = yPitch + rackHf;

    const pinionPath = useMemo(() => {
        const pts = generateExternalGearContour({
            module: rack.moduleVal * scale,
            teeth: rack.teethZ1,
            helixAngle: rack.helixAngle,
            profileShift: rack.profileShiftX,
            pressureAngle: 20,
            center: { x: cx1, y: cy1 },
            pointsPerFlank: 10,
        });
        return pointsToSvgPath(pts);
    }, [rack.moduleVal, scale, rack.teethZ1, rack.helixAngle, rack.profileShiftX, cx1, cy1]);

    const rackShift = -((kinetic.angle * Math.PI / 180) * r1);

    const rackPath = useMemo(() => {
        const startX = cx1 - 650 + (((rackShift % rackPitchMm) + rackPitchMm) % rackPitchMm) - rackPitchMm;
        const teethCount = Math.ceil(1300 / rackPitchMm) + 4;
        const pressureTan = Math.tan((20 * Math.PI) / 180);
        let d = `M ${formatEngineeringValue(startX, precision, false)} ${formatEngineeringValue(yDatum, precision, false)} L ${formatEngineeringValue(startX, precision, false)} ${formatEngineeringValue(yRootRack, precision, false)} `;

        for (let i = 0; i < teethCount; i++) {
            const xPitchCenter = startX + i * rackPitchMm;
            const xRootLeft = xPitchCenter - (rackPitchMm * 0.25) - (rackHf * pressureTan);
            const xTipLeft = xPitchCenter - (rackPitchMm * 0.25) + (rackHa * pressureTan);
            const xTipRight = xPitchCenter + (rackPitchMm * 0.25) - (rackHa * pressureTan);
            const xRootRight = xPitchCenter + (rackPitchMm * 0.25) + (rackHf * pressureTan);

            d += `L ${formatEngineeringValue(xRootLeft, precision, false)} ${formatEngineeringValue(yRootRack, precision, false)} `;
            d += `L ${formatEngineeringValue(xTipLeft, precision, false)} ${formatEngineeringValue(yTipRack, precision, false)} `;
            d += `L ${formatEngineeringValue(xTipRight, precision, false)} ${formatEngineeringValue(yTipRack, precision, false)} `;
            d += `L ${formatEngineeringValue(xRootRight, precision, false)} ${formatEngineeringValue(yRootRack, precision, false)} `;
        }

        const endX = startX + teethCount * rackPitchMm;
        d += `L ${formatEngineeringValue(endX, precision, false)} ${formatEngineeringValue(yRootRack, precision, false)} L ${formatEngineeringValue(endX, precision, false)} ${formatEngineeringValue(yDatum, precision, false)} Z`;
        return d;
    }, [rackShift, yDatum, yRootRack, yTipRack, rackPitchMm, rackHa, rackHf, cx1]);

    const vbMinY = cy1 - ra1 - 25;
    const vbMaxY = yDatum + 35;
    const vbH = Math.max(240, vbMaxY - vbMinY);
    const vbW = vbH * (760 / 420);
    const vbMinX = cx1 - vbW / 2;

    const handleExportPinionSvg = () => {
        downloadGearProductionSvg({
            module: rack.moduleVal,
            teeth: rack.teethZ1,
            helixAngle: rack.helixAngle,
            profileShift: rack.profileShiftX,
            pressureAngle: 20,
            boreDiameter: Math.max(10, Math.round(rack.teethZ1 * rack.moduleVal * 0.25)),
            hasKeyway: true,
        }, `KHK_Kremayer_Pinyon_m${rack.moduleVal}_z${rack.teethZ1}.svg`);
    };

    const handleExport3D = () => {
        CrossModuleBridge.exportRackAndPinionTo3D({
            module: rack.moduleVal,
            pinionTeeth: rack.teethZ1,
            rackPitchHeight: rack.rackH,
            helixAngle: rack.helixAngle,
            profileShift: rack.profileShiftX,
            rackLengthMm: 400,
            rackWidthMm: 20,
            switchWindow: true,
        });
    };

    const handleExport2DCad = () => {
        CrossModuleBridge.exportRackAndPinionTo2DCad({
            title: `KHK Rack & Pinion m=${rack.moduleVal} z1=${rack.teethZ1}`,
            module: rack.moduleVal,
            pinionTeeth: rack.teethZ1,
            rackPitchHeight: rack.rackH,
            rackLengthMm: 400,
            switchWindow: true,
        });
    };

    const handleExportRackSvg = () => {
        const lengthMm = 400;
        const pMm = Math.PI * calc.mt;
        const teethCount = Math.floor(lengthMm / pMm);
        const ha = rack.moduleVal;
        const hf = 1.25 * rack.moduleVal;
        const tanA = Math.tan((20 * Math.PI) / 180);
        const totalHeightMm = calc.H + ha + 20;
        const yDatum = totalHeightMm - 12;
        const yPitch = yDatum - calc.H;
        const yTip = yPitch - ha;
        const yRoot = yPitch + hf;

        let rackOutline = `M 0 ${yDatum.toFixed(2)} L 0 ${yRoot.toFixed(2)} `;
        for (let i = 0; i < teethCount; i++) {
            const xc = i * pMm + pMm / 2;
            const xRootL = xc - pMm * 0.25 - hf * tanA;
            const xTipL = xc - pMm * 0.25 + ha * tanA;
            const xTipR = xc + pMm * 0.25 - ha * tanA;
            const xRootR = xc + pMm * 0.25 + hf * tanA;
            rackOutline += `L ${xRootL.toFixed(2)} ${yRoot.toFixed(2)} L ${xTipL.toFixed(2)} ${yTip.toFixed(2)} L ${xTipR.toFixed(2)} ${yTip.toFixed(2)} L ${xRootR.toFixed(2)} ${yRoot.toFixed(2)} `;
        }
        const totalTeethL = teethCount * pMm;
        rackOutline += `L ${totalTeethL.toFixed(2)} ${yRoot.toFixed(2)} L ${totalTeethL.toFixed(2)} ${yDatum.toFixed(2)} Z`;

        // Mounting holes every 80mm
        const holesSvg = Array.from({ length: Math.floor(totalTeethL / 80) }).map((_, idx) => {
            const hx = (idx + 1) * 80;
            const hy = yDatum - calc.H * 0.45;
            return `<circle cx="${hx}" cy="${hy.toFixed(2)}" r="3.3" fill="none" stroke="#2563eb" stroke-width="0.3"/>
                    <circle cx="${hx}" cy="${hy.toFixed(2)}" r="5.5" fill="none" stroke="#2563eb" stroke-width="0.3" stroke-dasharray="2 1"/>`;
        }).join('\n');

        const rackSvgStr = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${lengthMm + 40}mm" height="${totalHeightMm + 40}mm" viewBox="-20 -20 ${lengthMm + 40} ${totalHeightMm + 40}">
  <defs>
    <style>
      .cut { fill: none; stroke: #000000; stroke-width: 0.35; stroke-linecap: round; stroke-linejoin: round; }
      .cl { fill: none; stroke: #dc2626; stroke-width: 0.2; stroke-dasharray: 8 2 1 2; }
      .dim { fill: none; stroke: #2563eb; stroke-width: 0.2; }
      .txt { font-family: monospace; font-size: 3.5px; fill: #0f172a; }
      .tbl-title { font-family: monospace; font-size: 4px; font-weight: bold; fill: #0f172a; }
    </style>
  </defs>

  <!-- Rack Body Outer Contour (DIN 867 1:1 Metric) -->
  <path d="${rackOutline}" class="cut" />
  ${holesSvg}

  <!-- Centerline Pitch Line (y = H from datum) -->
  <line x1="-10" y1="${yPitch.toFixed(2)}" x2="${(totalTeethL + 10).toFixed(2)}" y2="${yPitch.toFixed(2)}" class="cl" />

  <!-- Dimensions -->
  <line x1="0" y1="${yDatum + 8}" x2="${totalTeethL.toFixed(2)}" y2="${yDatum + 8}" class="dim" />
  <text x="${(totalTeethL / 2).toFixed(2)}" y="${yDatum + 12}" class="txt" text-anchor="middle">L = ${totalTeethL.toFixed(2)} mm</text>
  <line x1="${totalTeethL + 8}" y1="${yPitch.toFixed(2)}" x2="${totalTeethL + 8}" y2="${yDatum.toFixed(2)}" class="dim" />
  <text x="${totalTeethL + 12}" y="${((yPitch + yDatum) / 2).toFixed(2)}" class="txt" dominant-baseline="middle">H = ${calc.H.toFixed(2)} mm</text>

  <!-- Title Block (ISO 7200 / DIN 867) -->
  <g transform="translate(180, ${totalHeightMm - 5})">
    <rect x="0" y="0" width="190" height="22" fill="#ffffff" stroke="#000000" stroke-width="0.3"/>
    <text x="5" y="6" class="tbl-title">KHK / DIN 867 PRECISION GEAR RACK 1:1 PRODUCTION DRAWING</text>
    <text x="5" y="12" class="txt">Module mn = ${calc.mn} mm | Pitch p = ${pMm.toFixed(2)} mm | α = 20° | Travel/Rev = ${calc.travelPerRevMm.toFixed(2)} mm</text>
    <text x="5" y="18" class="txt">Pinion z1 = ${calc.z1} | Mounting a = ${calc.mountingDistance.toFixed(2)} mm | Standard: DIN 867 / KHK Table 4.6</text>
  </g>
</svg>`;
        downloadRawSvg(`KHK_Kremayer_1to1_m${rack.moduleVal}_L${lengthMm}mm.svg`, rackSvgStr);
    };

    const dataRows = [
        { label: t('Normal Module', 'Normal Modül'), sym: 'mn', val:formatEngineeringValue(calc.mn, precision, false), unit: 'mm', std: 'DIN 867', dimKey: 'mn' },
        { label: t('Transverse Module', 'Alın Modülü'), sym: 'mt', val:formatEngineeringValue(calc.mt, precision, false), unit: 'mm', std: 'KHK 4.10', dimKey: 'mt' },
        { label: t('Pinion Teeth', 'Pinyon Diş Sayısı'), sym: 'z₁', val: `${calc.z1}`, unit: '-', std: 'ISO 21771', dimKey: 'd1' },
        { label: t('Helix Angle', 'Helis Açısı'), sym: 'β', val: `${formatEngineeringValue(calc.beta_deg, precision, false)}°`, unit: 'deg', dimKey: 'beta', std: 'DIN 3960' },
        { label: t('Profile Shift', 'Profil Kaydırma'), sym: 'x₁', val: calc.x1 >= 0 ? `+${formatEngineeringValue(calc.x1, precision, false)}` :formatEngineeringValue(calc.x1, precision, false), unit: '-', dimKey: 'x1', std: 'DIN 3960' },
        { label: t('Pitch Diameter', 'Bölüm Çapı (Pinyon)'), sym: 'd₁', val:formatEngineeringValue(calc.d1, precision, false), unit: 'mm', dimKey: 'd1', std: 'KHK 4.6', highlight: true },
        { label: t('Tip Diameter', 'Diş Başı Çapı'), sym: 'da₁', val:formatEngineeringValue(calc.da1, precision, false), unit: 'mm', dimKey: 'da1', std: 'DIN 3960' },
        { label: t('Root Diameter', 'Diş Dibi Çapı'), sym: 'df₁', val:formatEngineeringValue(calc.df1, precision, false), unit: 'mm', dimKey: 'df1', std: 'DIN 3960' },
        { label: s.rackPitchHeight, sym: 'H', val:formatEngineeringValue(calc.H, precision, false), unit: 'mm', dimKey: 'H', std: 'KHK 4.6', highlight: true },
        { label: t('Mounting Distance', 'Montaj Eksen Mesafesi'), sym: 'a', val:formatEngineeringValue(calc.mountingDistance, precision, false), unit: 'mm', dimKey: 'a', std: 'KHK Table 4.6 Eq 4', highlight: true },
        { label: s.rackTravelPerRev, sym: 'L', val:formatEngineeringValue(calc.travelPerRevMm, precision, false), unit: 'mm/rev', dimKey: 'L', std: 'KHK 4.6', highlight: true },
        { label: s.rackFeedVelocity, sym: 'v', val:formatEngineeringValue(calc.linearVelocityMPerSec, precision, false), unit: 'm/s', std: 'Kinematics', dimKey: 'L' },
        { label: s.rackFeedForce, sym: 'Fx (Ft)', val:formatEngineeringValue(calc.feedForceN, precision, false), unit: 'N', std: 'DIN 3990', dimKey: 'Fx', highlight: true },
        { label: s.rackSeparatingForce, sym: 'Fr', val:formatEngineeringValue(calc.separatingForceN, precision, false), unit: 'N', std: 'DIN 3990', dimKey: 'Fr' },
        { label: t('Axial Force', 'Eksenel Yanal Kuvvet'), sym: 'Fa', val:formatEngineeringValue(calc.axialThrustForceN, precision, false), unit: 'N', std: 'DIN 3990', dimKey: 'Fa' },
    ];

    const handleCopy = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), t('Value', 'Değer'), t('Unit', 'Birim'), t('Standard', 'Standart')].join('\t');
        const rows = dataRows.map(r => [r.label, r.sym, r.val, r.unit, r.std].join('\t'));
        navigator.clipboard.writeText([header, ...rows].join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCsv = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), t('Value', 'Değer'), t('Unit', 'Birim'), t('Standard', 'Standart')].join(';');
        const rows = dataRows.map(r => `"${r.label}";"${r.sym}";"${r.val}";"${r.unit}";"${r.std}"`);
        const blob = new Blob(['\uFEFF' + [header, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `khk_kremayer_pinyon_m${calc.mn}_z${calc.z1}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };


    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden min-h-0">
            {/* ═══ CENTER: VISUALIZATION BLUEPRINT (ORTA: GÖRÜNTÜ) ═══ */}
            <div className="flex-1 relative flex flex-col min-h-[460px] lg:min-h-0 bg-[var(--bg-0)] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                {/* Dedicated Toolbar Header */}
                <div className="flex-none px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2 z-20 bg-[var(--bg-0)]/90">
                    <div className="text-[10px] font-mono font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                        <Cog size={13} className="animate-spin-slow shrink-0" />
                        <span className="truncate">{s.rackBlueprintTitle}</span>
                        <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            DIN 867 / KHK 4.6
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <button
                            type="button"
                            onClick={handleExport3D}
                            className="px-2 py-1 rounded-lg bg-[#a855f7]/15 hover:bg-[#a855f7]/25 border border-[#a855f7]/40 text-[#c084fc] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 3D Design Studio", "1:1 3D CAD Tasarım Stüdyosuna Aktar")}
                        >
                            <Box size={11} />
                            <span>3D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExport2DCad}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 2D Drafting (AluCAD)", "1:1 2D Teknik Çizim Modülüne Aktar")}
                        >
                            <Layers size={11} />
                            <span>2D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportPinionSvg}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Download 1:1 Pinion SVG", "1:1 Ölçekli Pinyon Dişli SVG İndir")}
                        >
                            <Download size={11} />
                            <span>{t("Pinion", "Pinyon")} (z₁={calc.z1})</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportRackSvg}
                            className="px-2 py-1 rounded-lg bg-[var(--warn)]/15 hover:bg-[var(--warn)]/25 border border-[var(--warn)]/40 text-[var(--warn)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Download 1:1 Rack SVG", "1:1 Ölçekli Kremayer Gövde SVG İndir")}
                        >
                            <Download size={11} />
                            <span>{t("Rack", "Kremayer")} (H={calc.H}mm)</span>
                        </button>
                    </div>
                </div>

                {/* Blueprint Drawing Viewport */}
                <div
                    {...kinetic.containerProps}
                    className="flex-1 w-full h-full min-h-[360px] relative flex items-center justify-center p-3 select-none overflow-hidden group"
                >
                    <svg className="absolute w-0 h-0"><SvgSharedDefs /></svg>
                    <SvgLaserHudBadge
                        selectedDim={selectedDim}
                        dimName={dataRows.find(r => r.dimKey === selectedDim)?.label}
                        onClear={() => setSelectedDim(null)}
                        isTr={isTr}
                        currentLang={currentLang}
                    />

                    <SvgKineticBadge speedMultiplier={kinetic.speedMultiplier} direction={kinetic.direction} />

                    <svg viewBox={`${vbMinX.toFixed(1)} ${vbMinY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`} className="w-full h-full max-h-[500px]" preserveAspectRatio="xMidYMid meet">
                        <g opacity="0.15">
                            <line x1={vbMinX} y1={cy1} x2={vbMinX + vbW} y2={cy1} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="4 4" />
                            <line x1={cx1} y1={vbMinY} x2={cx1} y2={vbMaxY + 20} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="4 4" />
                            <line x1={vbMinX} y1={yPitch} x2={vbMinX + vbW} y2={yPitch} stroke="#e6b84a" strokeWidth="0.8" strokeDasharray="8 4" />
                        </g>

                        <g>
                            <path
                                d={rackPath}
                                fill="url(#cadHatch)"
                                stroke="#38bdf8"
                                strokeWidth="1.2"
                                filter="url(#gearShadow)"
                            />
                            <rect x={vbMinX - 50} y={yDatum} width={vbW + 100} height={40} fill="#0c1016" stroke="#243041" strokeWidth="1.5" />
                            <line
                                x1={vbMinX - 50}
                                y1={yPitch}
                                x2={vbMinX + vbW + 50}
                                y2={yPitch}
                                stroke="#e6b84a"
                                strokeWidth="1.2"
                                strokeDasharray="16 4 3 4"
                                opacity="0.85"
                            />
                        </g>

                        <g style={{ transformOrigin: `${cx1}px ${cy1}px`, transform: `rotate(${angle1.toFixed(2)}deg)` }}>
                            <path
                                d={pinionPath}
                                fill="url(#metalPinionGrad)"
                                stroke="#38bdf8"
                                strokeWidth="1.4"
                                filter="url(#gearShadow)"
                            />
                            <circle cx={cx1} cy={cy1} r={rf1} fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                            <circle cx={cx1} cy={cy1} r={r1} fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="6 3" opacity="0.85" />
                            {Array.from({ length: 4 }).map((_, i) => {
                                const angleRad = (i * 90 * Math.PI) / 180;
                                const hx = cx1 + Math.cos(angleRad) * (r1 * 0.58);
                                const hy = cy1 + Math.sin(angleRad) * (r1 * 0.58);
                                return <circle key={i} cx={hx} cy={hy} r={Math.max(5, r1 * 0.14)} fill="#07090c" stroke="#334155" strokeWidth="1" />;
                            })}
                            <circle cx={cx1} cy={cy1} r={Math.max(8, r1 * 0.28)} fill="#07090c" stroke="#38bdf8" strokeWidth="1.5" />
                            <rect x={cx1 - 2.5} y={cy1 - Math.max(8, r1 * 0.28) - 3} width="5" height="4" fill="#07090c" stroke="#38bdf8" strokeWidth="1" />
                        </g>

                        <g>
                            <circle cx={cx1} cy={yPitch} r="4" fill="#3dd68c" filter="url(#emeraldLaserGlow)" />
                            <circle cx={cx1} cy={yPitch} r="8" fill="none" stroke="#3dd68c" strokeWidth="0.8" opacity="0.6" />
                            <text x={cx1 + 10} y={yPitch - 6} fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">P (Pitch Point)</text>
                        </g>

                        <g>
                            <line x1={cx1} y1={yPitch} x2={cx1 + 80} y2={yPitch} stroke="#3dd68c" strokeWidth="2.5" markerEnd="url(#arrowEmerald)" />
                            <text x={cx1 + 85} y={yPitch - 5} fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                Fx = {formatEngineeringValue(calc.feedForceN, precision, false)} N
                            </text>
                            <line x1={cx1} y1={yPitch} x2={cx1} y2={yPitch - 45} stroke="#e6b84a" strokeWidth="2" markerEnd="url(#arrowAmber)" />
                            <text x={cx1 + 6} y={yPitch - 35} fill="#e6b84a" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                                Fr = {formatEngineeringValue(calc.separatingForceN, precision, false)} N
                            </text>
                        </g>

                        {selectedDim === 'a' && (
                            <g>
                                <line x1={cx1 - Math.max(135, r1 + 30)} y1={cy1} x2={cx1 - Math.max(135, r1 + 30)} y2={yDatum} stroke="#3dd68c" strokeWidth="2.5" filter="url(#emeraldLaserGlow)" />
                                <circle cx={cx1 - Math.max(135, r1 + 30)} cy={cy1} r="3.5" fill="#3dd68c" />
                                <circle cx={cx1 - Math.max(135, r1 + 30)} cy={yDatum} r="3.5" fill="#3dd68c" />
                                <line x1={cx1 - Math.max(135, r1 + 30) - 10} y1={cy1} x2={cx1} y2={cy1} stroke="#3dd68c" strokeWidth="0.8" strokeDasharray="3 3" />
                                <line x1={cx1 - Math.max(135, r1 + 30) - 10} y1={yDatum} x2={cx1} y2={yDatum} stroke="#3dd68c" strokeWidth="0.8" strokeDasharray="3 3" />
                                <rect x={cx1 - Math.max(135, r1 + 30) - 95} y={(cy1 + yDatum) / 2 - 12} width="90" height="24" rx="4" fill="#07090c" stroke="#3dd68c" strokeWidth="1.2" />
                                <text x={cx1 - Math.max(135, r1 + 30) - 50} y={(cy1 + yDatum) / 2 + 4} textAnchor="middle" fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    a = {formatEngineeringValue(calc.mountingDistance, precision, false)} mm
                                </text>
                            </g>
                        )}

                        {selectedDim === 'H' && (
                            <g>
                                <line x1={cx1 + Math.max(135, r1 + 30)} y1={yPitch} x2={cx1 + Math.max(135, r1 + 30)} y2={yDatum} stroke="#e6b84a" strokeWidth="2.5" filter="url(#amberLaserGlow)" />
                                <circle cx={cx1 + Math.max(135, r1 + 30)} cy={yPitch} r="3.5" fill="#e6b84a" />
                                <circle cx={cx1 + Math.max(135, r1 + 30)} cy={yDatum} r="3.5" fill="#e6b84a" />
                                <rect x={cx1 + Math.max(135, r1 + 30) + 10} y={(yPitch + yDatum) / 2 - 12} width="85" height="24" rx="4" fill="#07090c" stroke="#e6b84a" strokeWidth="1.2" />
                                <text x={cx1 + Math.max(135, r1 + 30) + 52} y={(yPitch + yDatum) / 2 + 4} textAnchor="middle" fill="#e6b84a" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    H = {formatEngineeringValue(calc.H, precision, false)} mm
                                </text>
                            </g>
                        )}

                        {selectedDim === 'd1' && (
                            <g>
                                <line x1={cx1 - r1} y1={cy1} x2={cx1 + r1} y2={cy1} stroke="#3ad0e6" strokeWidth="2.5" filter="url(#neonLaserGlow)" />
                                <circle cx={cx1 - r1} cy={cy1} r="3.5" fill="#3ad0e6" />
                                <circle cx={cx1 + r1} cy={cy1} r="3.5" fill="#3ad0e6" />
                                <rect x={cx1 - 45} y={cy1 - 25} width="90" height="20" rx="4" fill="#07090c" stroke="#3ad0e6" strokeWidth="1.2" />
                                <text x={cx1} y={cy1 - 11} textAnchor="middle" fill="#3ad0e6" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    d₁ = {formatEngineeringValue(calc.d1, precision, false)} mm
                                </text>
                            </g>
                        )}

                        {selectedDim === 'L' && (
                            <g>
                                <line x1={cx1 - 100} y1={yDatum + 15} x2={cx1 + 100} y2={yDatum + 15} stroke="#3dd68c" strokeWidth="2.5" filter="url(#emeraldLaserGlow)" markerEnd="url(#arrowEmerald)" />
                                <rect x={cx1 - 90} y={yDatum + 20} width="180" height="24" rx="4" fill="#07090c" stroke="#3dd68c" strokeWidth="1.2" />
                                <text x={cx1} y={yDatum + 36} textAnchor="middle" fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    L = {formatEngineeringValue(calc.travelPerRevMm, precision, false)} mm / rev
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            </div>

            {/* ═══ RIGHT: OUTPUTS & TELEMETRY (SAĞ: ÇIKTILAR) ═══ */}
            <div className="w-full lg:w-[410px] xl:w-[450px] 2xl:w-[480px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/90 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {/* Kinematic & Forces KPI Cluster */}
                <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Zap size={13} className="text-[var(--cyan)]" />
                            <span>{t('FEED KINEMATICS & FORCES', 'İLERLEME KİNEMATİĞİ & KUVVETLER')}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            DIN 3990
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.rackFeedForce} (Fx)</span>
                            <span className="text-sm font-black text-emerald-400 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.feedForceN, precision, false)} <span className="text-[10px] font-normal text-slate-400">N</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.rackSeparatingForce} (Fr)</span>
                            <span className="text-sm font-black text-amber-400 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.separatingForceN, precision, false)} <span className="text-[10px] font-normal text-slate-400">N</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.rackTravelPerRev} (L)</span>
                            <span className="text-sm font-black text-cyan-300 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.travelPerRevMm, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm/d</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.rackFeedVelocity} (v)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.linearVelocityMPerSec, precision, false)} <span className="text-[10px] font-normal text-slate-400">m/s</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Mounting Distance', 'Eksen Mesafesi')} (a)</span>
                            <span className="text-sm font-black text-cyan-300 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.mountingDistance, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.rackPitchHeight} (H)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.H, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Manufacturing Data Sheet Table */}
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden font-mono text-xs shadow-xl">
                    <div
                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                        className="flex items-center justify-between p-3.5 bg-[var(--bg-2)] border-b border-[var(--line)] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet size={15} className="text-[var(--cyan)]" />
                            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                                {t('KHK RACK & PINION MANUFACTURING SHEET', 'KHK KREMAYER & PİNYON İMALAT PASAPORTU')}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--cyan)]/10 text-[var(--cyan)] font-bold border border-[var(--cyan)]/20">
                                DIN 867
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-gray-300 border border-[var(--line)] transition-all cursor-pointer"
                            >
                                {copied ? <Check size={11} className="text-[var(--ok)]" /> : <Copy size={11} />}
                                <span>{copied ? t('Copied', 'Kopyalandı') : t('Copy', 'Kopyala')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownloadCsv(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--line)] transition-all cursor-pointer"
                            >
                                <Download size={11} />
                                <span>CSV</span>
                            </button>
                            <ChevronDown size={15} className={`text-[var(--alu-dim)] transition-transform duration-200 ${isTableExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {isTableExpanded && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-[var(--bg-0)] text-[var(--alu-dim)] border-b border-[var(--line)]">
                                        <th className="px-3 py-2 font-bold">{t('Parameter Name', 'Parametre Adı')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Symbol', 'Sembol')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Value', 'Değer')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Unit', 'Birim')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Standard / Formula', 'Standart / Formül')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--line)]/50">
                                    {dataRows.map((row, idx) => {
                                        const isSelected = selectedDim === row.dimKey;
                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => setSelectedDim(isSelected ? null : (row.dimKey || null))}
                                                className={`transition-all duration-150 select-none cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[var(--cyan)]/20 text-cyan-100 font-bold shadow-[inset_0_0_12px_rgba(58,208,230,0.2)]'
                                                        : row.highlight
                                                        ? 'bg-[var(--cyan)]/5 hover:bg-white/[0.04]'
                                                        : 'hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                    {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />}
                                                    <span className={isSelected ? 'text-cyan-300' : 'text-gray-200'}>{row.label}</span>
                                                </td>
                                                <td className="px-2 py-1.5 text-center text-[var(--cyan)] font-bold">{row.sym}</td>
                                                <td className="px-3 py-1.5 text-center text-white font-bold">{row.val}</td>
                                                <td className="px-2 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.unit}</td>
                                                <td className="px-3 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.std}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function KhkRackAndPinionView(props: CommonViewProps) {
    return (
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5 p-2">
            <div className="2xl:col-span-4 space-y-3">
                <KhkRackControls {...props} />
            </div>
            <div className="2xl:col-span-8 space-y-4">
                <KhkRackView {...props} />
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// 2. KHK BEVEL GEAR (CONTROLS & VIEW)
// ═════════════════════════════════════════════════════════════════════════

export function KhkBevelControls({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const { bevel, setBevelParam } = useKhkGearStore();

    const calc = useMemo(() => calculateKhkBevelGear({
        module: bevel.moduleVal,
        pinionTeeth: bevel.teethZ1,
        gearTeeth: bevel.teethZ2,
        shaftAngleDeg: bevel.shaftAngle,
        system: bevel.system,
    }), [bevel]);

    return (
        <div className="space-y-3 font-mono">
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Cog size={14} className="text-[var(--cyan)]" />
                        {s.bevelTitle}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold">{t12(currentLang, 'KHK Table 4.16 & 4.17', 'KHK Tablo 4.16 & 4.17')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.gearModule} (m)</label>
                        <input
                            type="number"
                            step="any"
                            value={bevel.moduleVal}
                            onChange={(e) => setBevelParam('moduleVal', Math.max(0.5, parseFloat(e.target.value) || 1))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.bevelShaftAngle} Σ (°)</label>
                        <input
                            type="number"
                            step="any"
                            value={bevel.shaftAngle}
                            onChange={(e) => setBevelParam('shaftAngle', parseFloat(e.target.value) || 90)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--warn)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.pinionTeeth} (z₁)</label>
                        <input
                            type="number"
                            step="1"
                            value={bevel.teethZ1}
                            onChange={(e) => setBevelParam('teethZ1', Math.max(10, parseInt(e.target.value) || 10))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--cyan)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.gearTeeth} (z₂)</label>
                        <input
                            type="number"
                            step="1"
                            value={bevel.teethZ2}
                            onChange={(e) => setBevelParam('teethZ2', Math.max(10, parseInt(e.target.value) || 10))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--warn)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{t('Tooth Profile System', 'Diş Profili Standardı')}</label>
                    <select
                        value={bevel.system}
                        onChange={(e) => setBevelParam('system', e.target.value as 'gleason' | 'standard')}
                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-mono outline-none text-xs"
                    >
                        <option value="gleason">{s.bevelGleasonSystem} (KHK Tablo 4.16)</option>
                        <option value="standard">{s.bevelStandardSystem} (KHK Tablo 4.17)</option>
                    </select>
                </div>
            </div>

            {/* Quick Telemetry */}
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] font-mono text-[11px] space-y-2">
                <span className="text-[10px] font-bold uppercase text-[var(--alu-dim)] block">{t('CONE GEOMETRY SUMMARY', 'KONİK AÇILARI ÖZETİ')}</span>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{t('Pinion Angle δ₁:', 'Pinyon Koni δ₁:')}</span>
                        <span className="text-sm font-black text-[var(--cyan)]">{formatEngineeringValue(calc.delta1Deg, precision, false)}°</span>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{t('Gear Angle δ₂:', 'Çark Koni δ₂:')}</span>
                        <span className="text-sm font-black text-[var(--warn)]">{formatEngineeringValue(calc.delta2Deg, precision, false)}°</span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px]">
                    <span className="text-[var(--alu-dim)]">{s.bevelConeDistance}:</span>
                    <span className="font-bold text-[var(--ok)]">{formatEngineeringValue(calc.coneDistanceRe, precision, false)} mm</span>
                </div>
            </div>
        </div>
    );
}

export function KhkBevelView({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const { bevel } = useKhkGearStore();

    const [selectedDim, setSelectedDim] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true);

    const kinetic = useKineticSpin({ nominalSpeedDegPerSec: 30 });

    const calc: KhkBevelGearResult = useMemo(() => calculateKhkBevelGear({
        module: bevel.moduleVal,
        pinionTeeth: bevel.teethZ1,
        gearTeeth: bevel.teethZ2,
        shaftAngleDeg: bevel.shaftAngle,
        system: bevel.system,
    }), [bevel]);

    const dataRows = [
        { label: t('Module', 'Modül'), sym: 'm', v1:formatEngineeringValue(calc.m, precision, false), v2:formatEngineeringValue(calc.m, precision, false), unit: 'mm', std: 'DIN 867', dimKey: 'm' },
        { label: t('Teeth Count', 'Diş Sayısı'), sym: 'z', v1: `${calc.z1}`, v2: `${calc.z2}`, unit: '-', std: 'ISO 21771', dimKey: 'z' },
        { label: t('Gear Ratio', 'Çevrim Oranı'), sym: 'u (i)', v1: '1.000', v2:formatEngineeringValue(calc.ratio, precision, false), unit: '-', std: 'DIN 3971', dimKey: 'ratio' },
        { label: s.bevelShaftAngle, sym: 'Σ', v1: `${calc.shaftAngleDeg}°`, v2: `${calc.shaftAngleDeg}°`, unit: 'deg', std: 'KHK 4.16', dimKey: 'sigma', highlight: true },
        { label: t('Pitch Diameter', 'Bölüm Çapı'), sym: 'd', v1:formatEngineeringValue(calc.d1, precision, false), v2:formatEngineeringValue(calc.d2, precision, false), unit: 'mm', std: 'KHK Table 4.16 Eq 3', dimKey: 'd', highlight: true },
        { label: t('Pitch Cone Angle', 'Bölüm Koni Açısı'), sym: 'δ', v1: `${formatEngineeringValue(calc.delta1Deg, precision, false)}°`, v2: `${formatEngineeringValue(calc.delta2Deg, precision, false)}°`, unit: 'deg', std: 'KHK Table 4.16 Eq 4 & 5', dimKey: 'delta', highlight: true },
        { label: s.bevelConeDistance, sym: 'Re', v1:formatEngineeringValue(calc.coneDistanceRe, precision, false), v2:formatEngineeringValue(calc.coneDistanceRe, precision, false), unit: 'mm', std: 'KHK Table 4.16 Eq 6', dimKey: 'Re', highlight: true },
        { label: t('Addendum', 'Diş Başı Yüksekliği'), sym: 'ha', v1:formatEngineeringValue(calc.ha1, precision, false), v2:formatEngineeringValue(calc.ha2, precision, false), unit: 'mm', std: 'KHK Table 4.16 Eq 7 & 8', dimKey: 'ha' },
        { label: t('Dedendum', 'Diş Dibi Yüksekliği'), sym: 'hf', v1:formatEngineeringValue(calc.hf1, precision, false), v2:formatEngineeringValue(calc.hf2, precision, false), unit: 'mm', std: 'KHK Table 4.16', dimKey: 'hf' },
        { label: t('Tip Diameter', 'Diş Başı (Dış) Çapı'), sym: 'da', v1:formatEngineeringValue(calc.da1, precision, false), v2:formatEngineeringValue(calc.da2, precision, false), unit: 'mm', std: 'KHK Table 4.16 Eq 13', dimKey: 'da', highlight: true },
        { label: s.bevelApexToCrown, sym: 'X', v1:formatEngineeringValue(calc.pitchApexToCrown1, precision, false), v2:formatEngineeringValue(calc.pitchApexToCrown2, precision, false), unit: 'mm', std: 'KHK Table 4.16 Eq 14', dimKey: 'X' },
        { label: s.bevelMaxFaceWidth, sym: 'b_max', v1:formatEngineeringValue(calc.recommendedMaxFaceWidth, precision, false), v2:formatEngineeringValue(calc.recommendedMaxFaceWidth, precision, false), unit: 'mm', std: 'Re / 3 (KHK)', dimKey: 'b_max' },
    ];

    const handleCopy = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), `${t('Pinion', 'Pinyon')} (1)`, `${t('Gear', 'Çark')} (2)`, t('Unit', 'Birim'), t('Standard', 'Standart')].join('\t');
        const rows = dataRows.map(r => [r.label, r.sym, r.v1, r.v2, r.unit, r.std].join('\t'));
        navigator.clipboard.writeText([header, ...rows].join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCsv = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), `${t('Pinion', 'Pinyon')} (1)`, `${t('Gear', 'Çark')} (2)`, t('Unit', 'Birim'), t('Standard', 'Standart')].join(';');
        const rows = dataRows.map(r => `"${r.label}";"${r.sym}";"${r.v1}";"${r.v2}";"${r.unit}";"${r.std}"`);
        const blob = new Blob(['\uFEFF' + [header, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `khk_gleason_konik_m${calc.m}_z${calc.z1}_z${calc.z2}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExport3D = () => {
        CrossModuleBridge.exportBevelTo3D({
            module: bevel.moduleVal,
            z1: bevel.teethZ1,
            z2: bevel.teethZ2,
            coneDistanceRe: calc.coneDistanceRe,
            delta1Deg: calc.delta1Deg,
            delta2Deg: calc.delta2Deg,
            bMm: Math.min(calc.coneDistanceRe / 3, 10 * bevel.moduleVal),
            switchWindow: true,
        });
    };

    const handleExport2DCad = () => {
        CrossModuleBridge.exportBevelTo2DCad({
            title: `KHK Gleason Bevel m=${bevel.moduleVal} z1=${bevel.teethZ1} z2=${bevel.teethZ2}`,
            module: bevel.moduleVal,
            z1: bevel.teethZ1,
            z2: bevel.teethZ2,
            coneDistanceRe: calc.coneDistanceRe,
            delta1Deg: calc.delta1Deg,
            delta2Deg: calc.delta2Deg,
            d1: calc.d1,
            d2: calc.d2,
            da1: calc.da1,
            da2: calc.da2,
            switchWindow: true,
        });
    };

    const handleExportBevelSvg = () => {
        const r1 = calc.d1 / 2;
        const r2 = calc.d2 / 2;
        const Re = calc.coneDistanceRe;
        const b = Math.min(Re / 3, 10 * calc.m);
        const k = Math.max(0.2, (Re - b) / Re);
        const ha1 = calc.ha1;
        const hf1 = calc.hf1;
        const ha2 = calc.ha2;
        const hf2 = calc.hf2;

        const pad = 40;
        const apexX = pad + r1 + 20;
        const apexY = pad + r2 + calc.pitchApexToCrown1 + 20;
        const svgW = Math.max(280, apexX + calc.pitchApexToCrown2 + r2 + 60);
        const svgH = Math.max(280, apexY + 50);

        const ux = r1 / Re;
        const uy = -r2 / Re;
        const nx = r2 / Re;
        const ny = r1 / Re;

        const pxOut = apexX + r1;
        const pyOut = apexY - r2;
        const pxIn = apexX + (Re - b) * ux;
        const pyIn = apexY + (Re - b) * uy;

        const p1_tip_out = [pxOut + ha1 * nx, pyOut + ha1 * ny];
        const p2_root_out = [pxOut - hf1 * nx, pyOut - hf1 * ny];
        const p3_root_in = [pxIn - hf1 * k * nx, pyIn - hf1 * k * ny];
        const p4_tip_in = [pxIn + ha1 * k * nx, pyIn + ha1 * k * ny];

        const g1_tip_out = [pxOut - ha2 * nx, pyOut - ha2 * ny];
        const g2_root_out = [pxOut + hf2 * nx, pyOut + hf2 * ny];
        const g3_root_in = [pxIn + hf2 * k * nx, pyIn + hf2 * k * ny];
        const g4_tip_in = [pxIn - ha2 * k * nx, pyIn - ha2 * k * ny];

        const mirX = (x: number) => 2 * apexX - x;
        const mirY = (y: number) => 2 * apexY - y;

        const boreR1 = Math.max(8, r1 * 0.3);
        const boreR2 = Math.max(10, r2 * 0.28);
        const yCrown1 = apexY - calc.pitchApexToCrown1;
        const xCrown2 = apexX + calc.pitchApexToCrown2;

        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}mm" height="${svgH}mm" viewBox="0 0 ${svgW} ${svgH}">
  <defs>
    <style>
      .cut { fill: none; stroke: #000000; stroke-width: 0.35; stroke-linecap: round; stroke-linejoin: round; }
      .mesh { fill: #e2e8f0; stroke: #0f172a; stroke-width: 0.3; }
      .cl { fill: none; stroke: #dc2626; stroke-width: 0.2; stroke-dasharray: 8 2 1 2; }
      .dim { fill: none; stroke: #2563eb; stroke-width: 0.2; }
      .txt { font-family: monospace; font-size: 3.5px; fill: #0f172a; }
      .tbl-title { font-family: monospace; font-size: 4px; font-weight: bold; fill: #0f172a; }
    </style>
  </defs>

  <!-- Shaft Centerlines (Intersecting at Apex O) -->
  <line x1="${apexX}" y1="10" x2="${apexX}" y2="${svgH - 10}" class="cl" />
  <line x1="10" y1="${apexY}" x2="${svgW - 10}" class="cl" />
  <line x1="${apexX}" y1="${apexY}" x2="${pxOut.toFixed(2)}" y2="${pyOut.toFixed(2)}" class="cl" />

  <!-- Pinion Teeth & Conical Blank Cross Section -->
  <polygon points="${p1_tip_out[0].toFixed(2)},${p1_tip_out[1].toFixed(2)} ${p2_root_out[0].toFixed(2)},${p2_root_out[1].toFixed(2)} ${p3_root_in[0].toFixed(2)},${p3_root_in[1].toFixed(2)} ${p4_tip_in[0].toFixed(2)},${p4_tip_in[1].toFixed(2)}" class="mesh" />
  <polygon points="${mirX(p1_tip_out[0]).toFixed(2)},${p1_tip_out[1].toFixed(2)} ${mirX(p2_root_out[0]).toFixed(2)},${p2_root_out[1].toFixed(2)} ${mirX(p3_root_in[0]).toFixed(2)},${p3_root_in[1].toFixed(2)} ${mirX(p4_tip_in[0]).toFixed(2)},${p4_tip_in[1].toFixed(2)}" class="mesh" />
  <path d="M ${p2_root_out[0].toFixed(2)} ${p2_root_out[1].toFixed(2)} L ${(apexX + r1 * 0.6).toFixed(2)} ${yCrown1.toFixed(2)} L ${(apexX + boreR1).toFixed(2)} ${yCrown1.toFixed(2)} L ${(apexX + boreR1).toFixed(2)} ${(yCrown1 - 25).toFixed(2)} L ${(apexX - boreR1).toFixed(2)} ${(yCrown1 - 25).toFixed(2)} L ${(apexX - boreR1).toFixed(2)} ${yCrown1.toFixed(2)} L ${(apexX - r1 * 0.6).toFixed(2)} ${yCrown1.toFixed(2)} L ${mirX(p2_root_out[0]).toFixed(2)} ${p2_root_out[1].toFixed(2)}" class="cut" />

  <!-- Gear Teeth & Conical Blank Cross Section -->
  <polygon points="${g1_tip_out[0].toFixed(2)},${g1_tip_out[1].toFixed(2)} ${g2_root_out[0].toFixed(2)},${g2_root_out[1].toFixed(2)} ${g3_root_in[0].toFixed(2)},${g3_root_in[1].toFixed(2)} ${g4_tip_in[0].toFixed(2)},${g4_tip_in[1].toFixed(2)}" class="mesh" />
  <polygon points="${g1_tip_out[0].toFixed(2)},${mirY(g1_tip_out[1]).toFixed(2)} ${g2_root_out[0].toFixed(2)},${mirY(g2_root_out[1]).toFixed(2)} ${g3_root_in[0].toFixed(2)},${mirY(g3_root_in[1]).toFixed(2)} ${g4_tip_in[0].toFixed(2)},${mirY(g4_tip_in[1]).toFixed(2)}" class="mesh" />
  <path d="M ${g2_root_out[0].toFixed(2)} ${g2_root_out[1].toFixed(2)} L ${xCrown2.toFixed(2)} ${(apexY - r2 * 0.6).toFixed(2)} L ${xCrown2.toFixed(2)} ${(apexY - boreR2).toFixed(2)} L ${(xCrown2 + 25).toFixed(2)} ${(apexY - boreR2).toFixed(2)} L ${(xCrown2 + 25).toFixed(2)} ${(apexY + boreR2).toFixed(2)} L ${xCrown2.toFixed(2)} ${(apexY + boreR2).toFixed(2)} L ${xCrown2.toFixed(2)} ${(apexY + r2 * 0.6).toFixed(2)} L ${g2_root_out[0].toFixed(2)} ${mirY(g2_root_out[1]).toFixed(2)}" class="cut" />

  <!-- Apex Marker (O) -->
  <circle cx="${apexX}" cy="${apexY}" r="1.5" fill="#dc2626" />
  <text x="${apexX - 18}" y="${apexY + 8}" class="txt" font-weight="bold">Apex (O)</text>

  <!-- Title Block (ISO 7200 / DIN 3971 / KHK Table 4.16) -->
  <g transform="translate(${Math.max(20, svgW - 195)}, ${svgH - 28})">
    <rect x="0" y="0" width="190" height="24" fill="#ffffff" stroke="#000000" stroke-width="0.3"/>
    <text x="5" y="6" class="tbl-title">KHK / GLEASON STRAIGHT BEVEL GEAR 1:1 DRAWING</text>
    <text x="5" y="12" class="txt">Module m = ${calc.m} mm | Pinion z1 = ${calc.z1} (δ1 = ${calc.delta1Deg.toFixed(2)}°) | Gear z2 = ${calc.z2} (δ2 = ${calc.delta2Deg.toFixed(2)}°)</text>
    <text x="5" y="18" class="txt">Cone Dist Re = ${Re.toFixed(2)} mm | Face Width b = ${b.toFixed(2)} mm | Shaft Angle Σ = ${calc.shaftAngleDeg}°</text>
  </g>
</svg>`;
        downloadRawSvg(`khk_gleason_bevel_1to1_m${calc.m}_z${calc.z1}_z${calc.z2}.svg`, svgContent);
    };

    const totalWMm = Math.max(calc.da1 / 2 + calc.pitchApexToCrown2 + 15, 25);
    const totalHMm = Math.max(calc.pitchApexToCrown1 + calc.da2 / 2 + 15, 25);
    const scale = Math.min(500 / totalWMm, 320 / totalHMm);

    const r1 = (calc.d1 / 2) * scale;
    const r2 = (calc.d2 / 2) * scale;
    const re = calc.coneDistanceRe * scale;
    const b = Math.min(re / 3, 10 * calc.m * scale);
    const k = Math.max(0.2, (re - b) / re);

    const ha1 = calc.ha1 * scale;
    const hf1 = calc.hf1 * scale;
    const ha2 = calc.ha2 * scale;
    const hf2 = calc.hf2 * scale;

    const X1Scaled = calc.pitchApexToCrown1 * scale;
    const X2Scaled = calc.pitchApexToCrown2 * scale;

    const apexX = 200;
    const apexY = 220;

    const ux = r1 / re;
    const uy = -r2 / re;
    const nx = r2 / re;
    const ny = r1 / re;

    const pxOut = apexX + r1;
    const pyOut = apexY - r2;
    const pxIn = apexX + (re - b) * ux;
    const pyIn = apexY + (re - b) * uy;

    const p1_tip_out = [pxOut + ha1 * nx, pyOut + ha1 * ny];
    const p2_root_out = [pxOut - hf1 * nx, pyOut - hf1 * ny];
    const p3_root_in = [pxIn - hf1 * k * nx, pyIn - hf1 * k * ny];
    const p4_tip_in = [pxIn + ha1 * k * nx, pyIn + ha1 * k * ny];

    const g1_tip_out = [pxOut - ha2 * nx, pyOut - ha2 * ny];
    const g2_root_out = [pxOut + hf2 * nx, pyOut + hf2 * ny];
    const g3_root_in = [pxIn + hf2 * k * nx, pyIn + hf2 * k * ny];
    const g4_tip_in = [pxIn - ha2 * k * nx, pyIn - ha2 * k * ny];

    const mirX = (x: number) => 2 * apexX - x;
    const p1L = [mirX(p1_tip_out[0]), p1_tip_out[1]];
    const p2L = [mirX(p2_root_out[0]), p2_root_out[1]];
    const p3L = [mirX(p3_root_in[0]), p3_root_in[1]];
    const p4L = [mirX(p4_tip_in[0]), p4_tip_in[1]];

    const mirY = (y: number) => 2 * apexY - y;
    const g1B = [g1_tip_out[0], mirY(g1_tip_out[1])];
    const g2B = [g2_root_out[0], mirY(g2_root_out[1])];
    const g3B = [g3_root_in[0], mirY(g3_root_in[1])];
    const g4B = [g4_tip_in[0], mirY(g4_tip_in[1])];

    const yCrown1 = apexY - X1Scaled;
    const boreR1 = Math.max(8, r1 * 0.32);

    const xCrown2 = apexX + X2Scaled;
    const boreR2 = Math.max(10, r2 * 0.28);

    // Compute dynamic bounding box
    const allGeomPts: [number, number][] = [
        p1_tip_out as [number, number], p2_root_out as [number, number], p3_root_in as [number, number], p4_tip_in as [number, number],
        p1L as [number, number], p2L as [number, number], p3L as [number, number], p4L as [number, number],
        g1_tip_out as [number, number], g2_root_out as [number, number], g3_root_in as [number, number], g4_tip_in as [number, number],
        g1B as [number, number], g2B as [number, number], g3B as [number, number], g4B as [number, number],
        [apexX, apexY],
        [apexX - boreR1, yCrown1 - 30],
        [apexX + boreR1, yCrown1 - 30],
        [xCrown2 + 30, apexY - boreR2],
        [xCrown2 + 30, apexY + boreR2],
    ];
    const minGeomX = Math.min(...allGeomPts.map(p => p[0]));
    const maxGeomX = Math.max(...allGeomPts.map(p => p[0]));
    const minGeomY = Math.min(...allGeomPts.map(p => p[1]));
    const maxGeomY = Math.max(...allGeomPts.map(p => p[1]));

    const rawW = Math.max(120, maxGeomX - minGeomX);
    const rawH = Math.max(120, maxGeomY - minGeomY);
    const padX = Math.max(30, rawW * 0.1);
    const padY = Math.max(25, rawH * 0.1);

    const vbX = minGeomX - padX;
    const vbY = minGeomY - padY;
    const vbW = rawW + 2 * padX;
    const vbH = rawH + 2 * padY;

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden min-h-0">
            {/* ═══ CENTER: VISUALIZATION BLUEPRINT (ORTA: GÖRÜNTÜ) ═══ */}
            <div className="flex-1 relative flex flex-col min-h-[460px] lg:min-h-0 bg-[var(--bg-0)] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                {/* Dedicated Toolbar Header */}
                <div className="flex-none px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2 z-20 bg-[var(--bg-0)]/90">
                    <div className="text-[10px] font-mono font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                        <CircleDot size={13} className="animate-spin-slow shrink-0" />
                        <span className="truncate">{s.bevelBlueprintTitle}</span>
                        <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            DIN 3971 / KHK 4.16
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <button
                            type="button"
                            onClick={handleExport3D}
                            className="px-2 py-1 rounded-lg bg-[#a855f7]/15 hover:bg-[#a855f7]/25 border border-[#a855f7]/40 text-[#c084fc] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 3D Design Studio", "1:1 3D CAD Tasarım Stüdyosuna Aktar")}
                        >
                            <Box size={11} />
                            <span>3D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExport2DCad}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 2D Drafting (AluCAD)", "1:1 2D Teknik Çizim Modülüne Aktar")}
                        >
                            <Layers size={11} />
                            <span>2D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportBevelSvg}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Download 1:1 Bevel CAD SVG", "1:1 Ölçekli Konik Dişli CAD/SVG İndir")}
                        >
                            <Download size={11} />
                            <span>1:1 SVG (Re={formatEngineeringValue(calc.coneDistanceRe, precision, false)}mm)</span>
                        </button>
                    </div>
                </div>

                {/* Blueprint Drawing Viewport */}
                <div
                    {...kinetic.containerProps}
                    className="flex-1 w-full h-full min-h-[360px] relative flex items-center justify-center p-3 select-none overflow-hidden group"
                >
                    <svg className="absolute w-0 h-0"><SvgSharedDefs /></svg>
                    <SvgLaserHudBadge
                        selectedDim={selectedDim}
                        dimName={dataRows.find(r => r.dimKey === selectedDim)?.label}
                        onClear={() => setSelectedDim(null)}
                        isTr={isTr}
                        currentLang={currentLang}
                    />

                    <SvgKineticBadge speedMultiplier={kinetic.speedMultiplier} direction={kinetic.direction} />

                    <svg viewBox={`${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`} className="w-full h-full max-h-[500px]" preserveAspectRatio="xMidYMid meet">
                        <g opacity="0.35">
                            <line x1={apexX} y1={vbY} x2={apexX} y2={vbY + vbH} stroke="#38bdf8" strokeWidth="1" strokeDasharray="16 4 3 4" />
                            <line x1={vbX} y1={apexY} x2={vbX + vbW} y2={apexY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="16 4 3 4" />
                            <line x1={apexX} y1={apexY} x2={pxOut} y2={pyOut} stroke="#e6b84a" strokeWidth="1.2" strokeDasharray="6 3" />
                            <line x1={apexX} y1={apexY} x2={mirX(pxOut)} y2={pyOut} stroke="#e6b84a" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                            <line x1={apexX} y1={apexY} x2={pxOut} y2={mirY(pyOut)} stroke="#e6b84a" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                        </g>

                        <g>
                            <circle cx={apexX} cy={apexY} r="4" fill="#3dd68c" filter="url(#emeraldLaserGlow)" />
                            <text x={apexX - 25} y={apexY + 16} fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">Apex (O)</text>
                        </g>

                        <g>
                            <polygon
                                points={`
                                    ${p3L[0]},${p3L[1]}
                                    ${p2L[0]},${p2L[1]}
                                    ${apexX - r1 * 0.7},${yCrown1}
                                    ${apexX - boreR1},${yCrown1}
                                    ${apexX - boreR1},${yCrown1 - 25}
                                    ${apexX + boreR1},${yCrown1 - 25}
                                    ${apexX + boreR1},${yCrown1}
                                    ${apexX + r1 * 0.7},${yCrown1}
                                    ${p2_root_out[0]},${p2_root_out[1]}
                                    ${p3_root_in[0]},${p3_root_in[1]}
                                `}
                                fill="#0c1016"
                                stroke="#475569"
                                strokeWidth="1.2"
                            />
                            <polygon
                                points={`${p1_tip_out[0]},${p1_tip_out[1]} ${p2_root_out[0]},${p2_root_out[1]} ${p3_root_in[0]},${p3_root_in[1]} ${p4_tip_in[0]},${p4_tip_in[1]}`}
                                fill="url(#metalPinionGrad)"
                                stroke="#38bdf8"
                                strokeWidth="1.4"
                            />
                            <polygon
                                points={`${p1L[0]},${p1L[1]} ${p2L[0]},${p2L[1]} ${p3L[0]},${p3L[1]} ${p4L[0]},${p4L[1]}`}
                                fill="url(#metalPinionGrad)"
                                stroke="#38bdf8"
                                strokeWidth="1.4"
                            />
                        </g>

                        <g>
                            <polygon
                                points={`
                                    ${g3B[0]},${g3B[1]}
                                    ${g2B[0]},${g2B[1]}
                                    ${xCrown2},${apexY + r2 * 0.7}
                                    ${xCrown2},${apexY + boreR2}
                                    ${xCrown2 + 25},${apexY + boreR2}
                                    ${xCrown2 + 25},${apexY - boreR2}
                                    ${xCrown2},${apexY - boreR2}
                                    ${xCrown2},${apexY - r2 * 0.7}
                                    ${g2_root_out[0]},${g2_root_out[1]}
                                    ${g3_root_in[0]},${g3_root_in[1]}
                                `}
                                fill="#0c1016"
                                stroke="#475569"
                                strokeWidth="1.2"
                            />
                            <polygon
                                points={`${g1_tip_out[0]},${g1_tip_out[1]} ${g2_root_out[0]},${g2_root_out[1]} ${g3_root_in[0]},${g3_root_in[1]} ${g4_tip_in[0]},${g4_tip_in[1]}`}
                                fill="url(#metalGearGrad)"
                                stroke="#38bdf8"
                                strokeWidth="1.4"
                            />
                            <polygon
                                points={`${g1B[0]},${g1B[1]} ${g2B[0]},${g2B[1]} ${g3B[0]},${g3B[1]} ${g4B[0]},${g4B[1]}`}
                                fill="url(#metalGearGrad)"
                                stroke="#38bdf8"
                                strokeWidth="1.4"
                            />
                        </g>

                        <g>
                            <circle cx={pxOut} cy={pyOut} r="4.5" fill="#3dd68c" filter="url(#emeraldLaserGlow)" />
                            <circle cx={pxOut} cy={pyOut} r="8" fill="none" stroke="#3dd68c" strokeWidth="0.8" opacity="0.6" />
                            <text x={pxOut + 10} y={pyOut - 6} fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                {t('P (Pitch Point)', 'P (Kavrama Noktası)')}
                            </text>
                        </g>

                        {selectedDim === 'Re' && (
                            <g>
                                <line x1={apexX} y1={apexY} x2={pxOut} y2={pyOut} stroke="#3dd68c" strokeWidth="2.5" filter="url(#emeraldLaserGlow)" />
                                <circle cx={apexX} cy={apexY} r="4" fill="#3dd68c" />
                                <circle cx={pxOut} cy={pyOut} r="4" fill="#3dd68c" />
                                <rect x={(apexX + pxOut) / 2 - 50} y={(apexY + pyOut) / 2 - 14} width="100" height="24" rx="4" fill="#07090c" stroke="#3dd68c" strokeWidth="1.2" />
                                <text x={(apexX + pxOut) / 2} y={(apexY + pyOut) / 2 + 2} textAnchor="middle" fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    Re = {formatEngineeringValue(calc.coneDistanceRe, precision, false)} mm
                                </text>
                            </g>
                        )}

                        {selectedDim === 'delta' && (
                            <g>
                                <path
                                    d={`M ${apexX} ${apexY - 60} A 60 60 0 0 1 ${apexX + 60 * Math.sin(calc.delta1Deg * Math.PI / 180)} ${apexY - 60 * Math.cos(calc.delta1Deg * Math.PI / 180)}`}
                                    fill="none"
                                    stroke="#38bdf8"
                                    strokeWidth="2.5"
                                    filter="url(#neonLaserGlow)"
                                />
                                <rect x={apexX + 25} y={apexY - 80} width="95" height="20" rx="4" fill="#07090c" stroke="#38bdf8" strokeWidth="1.2" />
                                <text x={apexX + 72} y={apexY - 66} textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                                    δ₁ = {formatEngineeringValue(calc.delta1Deg, precision, false)}°
                                </text>

                                <rect x={apexX + 80} y={apexY - 35} width="95" height="20" rx="4" fill="#07090c" stroke="#e6b84a" strokeWidth="1.2" />
                                <text x={apexX + 127} y={apexY - 21} textAnchor="middle" fill="#e6b84a" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                                    δ₂ = {formatEngineeringValue(calc.delta2Deg, precision, false)}°
                                </text>
                            </g>
                        )}

                        {selectedDim === 'd' && (
                            <g>
                                <line x1={apexX - r1} y1={pyOut} x2={apexX + r1} y2={pyOut} stroke="#3ad0e6" strokeWidth="2" filter="url(#neonLaserGlow)" />
                                <circle cx={apexX - r1} cy={pyOut} r="3" fill="#3ad0e6" />
                                <circle cx={apexX + r1} cy={pyOut} r="3" fill="#3ad0e6" />
                                <rect x={apexX - 45} y={pyOut - 24} width="90" height="20" rx="4" fill="#07090c" stroke="#3ad0e6" strokeWidth="1.2" />
                                <text x={apexX} y={pyOut - 10} textAnchor="middle" fill="#3ad0e6" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    d₁ = {formatEngineeringValue(calc.d1, precision, false)} mm
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            </div>

            {/* ═══ RIGHT: OUTPUTS & TELEMETRY (SAĞ: ÇIKTILAR) ═══ */}
            <div className="w-full lg:w-[410px] xl:w-[450px] 2xl:w-[480px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/90 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {/* Conical Geometry & Transmission HUD */}
                <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Zap size={13} className="text-[var(--cyan)]" />
                            <span>{t('CONICAL GEOMETRY & TRANSMISSION', 'KONİK GEOMETRİ & GÜÇ İLETİMİ')}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            DIN 3971
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.bevelConeDistance} (Re)</span>
                            <span className="text-sm font-black text-emerald-400 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.coneDistanceRe, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Gear Ratio', 'Çevrim Oranı')} (u)</span>
                            <span className="text-sm font-black text-cyan-300 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.ratio, precision, false)} <span className="text-[10px] font-normal text-slate-400">: 1</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Pinion Cone Angle', 'Pinyon Koni')} (δ₁)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.delta1Deg, precision, false)}°
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Gear Cone Angle', 'Çark Koni')} (δ₂)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.delta2Deg, precision, false)}°
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.bevelShaftAngle} (Σ)</span>
                            <span className="text-sm font-black text-amber-400 flex items-baseline gap-1">
                                {calc.shaftAngleDeg}°
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.bevelMaxFaceWidth} (b_max)</span>
                            <span className="text-sm font-black text-cyan-300 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.recommendedMaxFaceWidth, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Manufacturing Data Sheet Table */}
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden font-mono text-xs shadow-xl">
                    <div
                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                        className="flex items-center justify-between p-3.5 bg-[var(--bg-2)] border-b border-[var(--line)] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet size={15} className="text-[var(--cyan)]" />
                            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                                {t('KHK BEVEL GEAR MANUFACTURING SHEET', 'KHK KONİK DİŞLİ İMALAT PASAPORTU')}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--cyan)]/10 text-[var(--cyan)] font-bold border border-[var(--cyan)]/20">
                                DIN 3971
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-gray-300 border border-[var(--line)] transition-all cursor-pointer"
                            >
                                {copied ? <Check size={11} className="text-[var(--ok)]" /> : <Copy size={11} />}
                                <span>{copied ? t('Copied', 'Kopyalandı') : t('Copy', 'Kopyala')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownloadCsv(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--line)] transition-all cursor-pointer"
                            >
                                <Download size={11} />
                                <span>CSV</span>
                            </button>
                            <ChevronDown size={15} className={`text-[var(--alu-dim)] transition-transform duration-200 ${isTableExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {isTableExpanded && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-[var(--bg-0)] text-[var(--alu-dim)] border-b border-[var(--line)]">
                                        <th className="px-3 py-2 font-bold">{t('Parameter Name', 'Parametre Adı')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Symbol', 'Sembol')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Pinion (1)', 'Pinyon (1)')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Gear (2)', 'Çark (2)')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Unit', 'Birim')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Standard / Rule', 'Standart / Kural')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--line)]/50">
                                    {dataRows.map((row, idx) => {
                                        const isSelected = selectedDim === row.dimKey;
                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => setSelectedDim(isSelected ? null : (row.dimKey || null))}
                                                className={`transition-all duration-150 select-none cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[var(--cyan)]/20 text-cyan-100 font-bold shadow-[inset_0_0_12px_rgba(58,208,230,0.2)]'
                                                        : row.highlight
                                                        ? 'bg-[var(--cyan)]/5 hover:bg-white/[0.04]'
                                                        : 'hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                    {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />}
                                                    <span className={isSelected ? 'text-cyan-300' : 'text-gray-200'}>{row.label}</span>
                                                </td>
                                                <td className="px-2 py-1.5 text-center text-[var(--cyan)] font-bold">{row.sym}</td>
                                                <td className="px-3 py-1.5 text-center text-white font-bold">{row.v1}</td>
                                                <td className="px-3 py-1.5 text-center text-white font-bold">{row.v2}</td>
                                                <td className="px-2 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.unit}</td>
                                                <td className="px-3 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.std}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function KhkBevelGearView(props: CommonViewProps) {
    return (
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5 p-2">
            <div className="2xl:col-span-4 space-y-3">
                <KhkBevelControls {...props} />
            </div>
            <div className="2xl:col-span-8 space-y-4">
                <KhkBevelView {...props} />
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// 3. KHK WORM GEAR (CONTROLS & VIEW)
// ═════════════════════════════════════════════════════════════════════════

export function KhkWormControls({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const { worm, setWormParam } = useKhkGearStore();

    const calc = useMemo(() => calculateKhkWormGear({
        axialModule: worm.axialModule,
        wormStarts: worm.wormStarts,
        wheelTeeth: worm.wheelTeeth,
        diameterFactorQ: worm.qFactor,
        frictionCoeff: worm.friction,
        wormRpm: worm.rpm,
        wormTorqueNm: worm.torqueNm,
    }), [worm]);

    return (
        <div className="space-y-3 font-mono">
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Zap size={14} className="text-[var(--cyan)]" />
                        {s.wormTitle}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold">{t12(currentLang, 'KHK Table 4.22', 'KHK Tablo 4.22')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.wormAxialModule} (mx)</label>
                        <input
                            type="number"
                            step="any"
                            value={worm.axialModule}
                            onChange={(e) => setWormParam('axialModule', Math.max(0.5, parseFloat(e.target.value) || 1))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.wormStarts} (z₁)</label>
                        <select
                            value={worm.wormStarts}
                            onChange={(e) => setWormParam('wormStarts', parseInt(e.target.value) || 1)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--cyan)] font-mono outline-none text-xs"
                        >
                            <option value={1}>{t("1 (Single Start / Self-Locking)", "1 (Tek Ağızlı / Oto-Blokajlı)")}</option>
                            <option value={2}>{t("2 (Double Start / Balanced)", "2 (Çift Ağızlı / Dengeli)")}</option>
                            <option value={3}>{t("3 (Triple Start)", "3 (Üç Ağızlı)")}</option>
                            <option value={4}>{t("4 (Four Starts / High Speed)", "4 (Dört Ağızlı / Yüksek Hız)")}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.wormWheelTeeth} (z₂)</label>
                        <input
                            type="number"
                            step="1"
                            value={worm.wheelTeeth}
                            onChange={(e) => setWormParam('wheelTeeth', Math.max(15, parseInt(e.target.value) || 20))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--warn)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.wormDiameterFactor} (q)</label>
                        <input
                            type="number"
                            step="any"
                            value={worm.qFactor}
                            onChange={(e) => setWormParam('qFactor', Math.max(6, parseFloat(e.target.value) || 10))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.wormFrictionCoeff} (μ)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={worm.friction}
                            onChange={(e) => setWormParam('friction', parseFloat(e.target.value) || 0.04)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">RPM (n₁)</label>
                        <input
                            type="number"
                            step="any"
                            value={worm.rpm}
                            onChange={(e) => setWormParam('rpm', parseFloat(e.target.value) || 1450)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--ok)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">Torque (T₁) Nm</label>
                    <input
                        type="number"
                        step="any"
                        value={worm.torqueNm}
                        onChange={(e) => setWormParam('torqueNm', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--cyan)] font-bold outline-none focus:border-[var(--cyan)]"
                    />
                </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--alu-dim)]">{t('SELF-LOCKING STATUS', 'OTO-BLOKAJ DENETİMİ')}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${calc.isSelfLocking ? 'bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/40' : 'bg-[var(--warn)]/20 text-[var(--warn)] border border-[var(--warn)]/40'}`}>
                        {calc.isSelfLocking ? s.wormSelfLocking : s.wormReversible}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[var(--alu-dim)] block text-[8.5px] uppercase">{s.wormLeadAngle}:</span>
                        <span className="text-sm font-bold text-[var(--cyan)]">{formatEngineeringValue(calc.leadAngleGammaDeg, precision, false)}°</span>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[var(--alu-dim)] block text-[8.5px] uppercase">{s.wormEfficiency}:</span>
                        <span className="text-sm font-bold text-[var(--ok)]">{formatEngineeringValue(calc.meshEfficiencyEta, precision, false)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function KhkWormView({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const { worm } = useKhkGearStore();

    const [selectedDim, setSelectedDim] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true);

    const kinetic = useKineticSpin({ nominalSpeedDegPerSec: 35 });
    const angle1 = kinetic.angle;

    const calc: KhkWormGearResult = useMemo(() => calculateKhkWormGear({
        axialModule: worm.axialModule,
        wormStarts: worm.wormStarts,
        wheelTeeth: worm.wheelTeeth,
        diameterFactorQ: worm.qFactor,
        frictionCoeff: worm.friction,
        wormRpm: worm.rpm,
        wormTorqueNm: worm.torqueNm,
    }), [worm]);

    const angle2 = -(angle1 * (calc.z1 / Math.max(1, calc.z2))) % 360;

    const dataRows = [
        { label: s.wormAxialModule, sym: 'mx', v1:formatEngineeringValue(calc.mx, precision, false), v2:formatEngineeringValue(calc.mx, precision, false), unit: 'mm', std: 'DIN 3975', dimKey: 'mx' },
        { label: t('Starts / Teeth Count', 'Ağız / Diş Sayısı'), sym: 'z', v1: `${calc.z1}`, v2: `${calc.z2}`, unit: '-', std: 'KHK 4.22', dimKey: 'z' },
        { label: t('Gear Ratio', 'Tahvil Oranı'), sym: 'i', v1: '1.000', v2:formatEngineeringValue(calc.ratio, precision, false), unit: '-', std: 'DIN 3975', dimKey: 'ratio' },
        { label: s.wormDiameterFactor, sym: 'q', v1:formatEngineeringValue(calc.q, precision, false), v2: '-', unit: '-', std: 'KHK Table 4.22', dimKey: 'q', highlight: true },
        { label: t('Pitch Diameter', 'Bölüm Dairesi Çapı'), sym: 'd', v1:formatEngineeringValue(calc.d1, precision, false), v2:formatEngineeringValue(calc.d2, precision, false), unit: 'mm', std: 'KHK Table 4.22', dimKey: 'd', highlight: true },
        { label: s.wormLeadAngle, sym: 'γ', v1: `${formatEngineeringValue(calc.leadAngleGammaDeg, precision, false)}°`, v2: '-', unit: 'deg', std: 'KHK Table 4.22 Eq 5', dimKey: 'gamma', highlight: true },
        { label: t('Center Distance', 'Eksenler Arası Mesafe'), sym: 'a', v1:formatEngineeringValue(calc.centerDistance, precision, false), v2:formatEngineeringValue(calc.centerDistance, precision, false), unit: 'mm', std: 'KHK Table 4.22 Eq 4', dimKey: 'a', highlight: true },
        { label: t('Tip Diameter', 'Diş Başı Çapı'), sym: 'da', v1:formatEngineeringValue(calc.da1, precision, false), v2:formatEngineeringValue(calc.da2, precision, false), unit: 'mm', std: 'KHK Table 4.22 Eq 7 & 9', dimKey: 'da' },
        { label: s.wormThroatRadius, sym: 'ri', v1: '-', v2:formatEngineeringValue(calc.throatRadiusRi, precision, false), unit: 'mm', std: 'KHK Table 4.22', dimKey: 'ri', highlight: true },
        { label: t('Sliding Velocity', 'Kayma Hızı'), sym: 'vs', v1:formatEngineeringValue(calc.slidingVelocityVs, precision, false), v2:formatEngineeringValue(calc.slidingVelocityVs, precision, false), unit: 'm/s', std: 'KHK 4.6 Eq 4.15', dimKey: 'vs', highlight: true },
        { label: s.wormEfficiency, sym: 'η', v1: `${formatEngineeringValue(calc.meshEfficiencyEta, precision, false)}%`, v2: `${formatEngineeringValue(calc.meshEfficiencyEta, precision, false)}%`, unit: '%', std: 'DIN 3975', dimKey: 'eta', highlight: true },
        { label: s.wormOutputTorque, sym: 'T₂', v1: `${formatEngineeringValue(worm.torqueNm, precision, false)} Nm`, v2: `${formatEngineeringValue(calc.outputTorqueNm, precision, false)} Nm`, unit: 'Nm', std: 'Dynamics', dimKey: 'torque' },
    ];

    const handleCopy = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), t('Worm (1)', 'Sonsuz Vida (1)'), t('Wheel (2)', 'Çark (2)'), t('Unit', 'Birim'), t('Standard', 'Standart')].join('\t');
        const rows = dataRows.map(r => [r.label, r.sym, r.v1, r.v2, r.unit, r.std].join('\t'));
        navigator.clipboard.writeText([header, ...rows].join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCsv = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), `${t('Worm', 'Sonsuz')} (1)`, `${t('Wheel', 'Çark')} (2)`, t('Unit', 'Birim'), t('Standard', 'Standart')].join(';');
        const rows = dataRows.map(r => `"${r.label}";"${r.sym}";"${r.v1}";"${r.v2}";"${r.unit}";"${r.std}"`);
        const blob = new Blob(['\uFEFF' + [header, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `khk_worm_pair_mx${calc.mx}_z${calc.z1}_z${calc.z2}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExport3D = () => {
        CrossModuleBridge.exportWormTo3D({
            axialModule: worm.axialModule,
            z1: worm.wormStarts,
            z2: worm.wheelTeeth,
            q: worm.qFactor,
            centerDistance: calc.centerDistance,
            leadAngleGammaDeg: calc.leadAngleGammaDeg,
            da1: calc.da1,
            df1: calc.df1,
            da2: calc.da2,
            df2: calc.df2,
            throatRadiusRi: calc.throatRadiusRi,
            switchWindow: true,
        });
    };

    const handleExport2DCad = () => {
        CrossModuleBridge.exportWormTo2DCad({
            title: `KHK Worm Pair mx=${worm.axialModule} z1=${worm.wormStarts} z2=${worm.wheelTeeth}`,
            axialModule: worm.axialModule,
            z1: worm.wormStarts,
            z2: worm.wheelTeeth,
            q: calc.q,
            centerDistance: calc.centerDistance,
            leadAngleGammaDeg: calc.leadAngleGammaDeg,
            d1: calc.d1,
            d2: calc.d2,
            da1: calc.da1,
            da2: calc.da2,
            throatRadiusRi: calc.throatRadiusRi,
            switchWindow: true,
        });
    };

    const handleExportWormSvg = () => {
        const mx = calc.mx;
        const z1 = calc.z1;
        const z2 = calc.z2;
        const d1 = calc.d1;
        const da1 = calc.da1;
        const df1 = calc.df1;
        const d2 = calc.d2;
        const da2 = calc.da2;
        const de2 = calc.de2;
        const df2 = calc.df2;
        const a = calc.centerDistance;
        const ri = calc.throatRadiusRi;
        const px = calc.axialPitchPxMm;
        const gammaDeg = calc.leadAngleGammaDeg;

        const wormL = Math.max(80, 14 * mx);
        const shaftExt = 35;
        const totalWormL = wormL + shaftExt * 2;
        const bore2 = Math.max(12, Math.round(d2 * 0.28));
        const hubR2 = Math.max(18, d2 * 0.25);

        const pad = 50;
        const svgW = Math.max(300, totalWormL + pad * 2);
        const svgH = Math.max(300, a + da1 / 2 + de2 / 2 + pad * 2 + 30);

        const wormX = svgW / 2;
        const wormY = pad + da1 / 2 + 20;
        const wheelX = svgW / 2;
        const wheelY = wormY + a;

        const wL = wormX - wormL / 2;
        const wR = wormX + wormL / 2;
        const numThreads = Math.ceil(wormL / px) + 2;
        const tanGamma = Math.tan((gammaDeg * Math.PI) / 180);
        const ha1 = mx;
        const hf1 = 1.2 * mx;

        // ACME thread teeth paths in true millimeters
        let threadSvg = '';
        for (let i = 0; i < numThreads; i++) {
            const tx = wL + i * px;
            if (tx < wL - 5 || tx > wR + 5) continue;
            const tilt = tanGamma * (ha1 + hf1);
            const wCrest = px * 0.38;
            const p1 = `${(tx - wCrest / 2 - tilt / 2).toFixed(2)},${(wormY - da1 / 2).toFixed(2)}`;
            const p2 = `${(tx + wCrest / 2 - tilt / 2).toFixed(2)},${(wormY - da1 / 2).toFixed(2)}`;
            const p3 = `${(tx + wCrest / 2 + px * 0.15 + tilt / 2).toFixed(2)},${(wormY + da1 / 2).toFixed(2)}`;
            const p4 = `${(tx - wCrest / 2 - px * 0.15 + tilt / 2).toFixed(2)},${(wormY + da1 / 2).toFixed(2)}`;
            threadSvg += `<polygon points="${p1} ${p2} ${p3} ${p4}" fill="#f1f5f9" stroke="#000000" stroke-width="0.3" />\n`;
        }

        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}mm" height="${svgH}mm" viewBox="0 0 ${svgW} ${svgH}">
  <defs>
    <style>
      .cut { fill: none; stroke: #000000; stroke-width: 0.35; stroke-linecap: round; stroke-linejoin: round; }
      .mesh { fill: #f8fafc; stroke: #0f172a; stroke-width: 0.3; }
      .cl { fill: none; stroke: #dc2626; stroke-width: 0.2; stroke-dasharray: 8 2 1 2; }
      .dim { fill: none; stroke: #2563eb; stroke-width: 0.2; }
      .txt { font-family: monospace; font-size: 3.5px; fill: #0f172a; }
      .tbl-title { font-family: monospace; font-size: 4px; font-weight: bold; fill: #0f172a; }
    </style>
  </defs>

  <!-- Centerlines (ISO 128-20) -->
  <line x1="15" y1="${wormY}" x2="${svgW - 15}" y2="${wormY}" class="cl" />
  <line x1="${wheelX}" y1="15" x2="${wheelX}" y2="${svgH - 15}" class="cl" />
  <line x1="15" y1="${wheelY}" x2="${svgW - 15}" y2="${wheelY}" class="cl" />
  <line x1="15" y1="${wormY + d1 / 2}" x2="${svgW - 15}" y2="${wormY + d1 / 2}" class="cl" />

  <!-- Globoid Wheel (Driven z2) -->
  <circle cx="${wheelX}" cy="${wheelY}" r="${(de2 / 2).toFixed(2)}" fill="#fef3c7" stroke="#000000" stroke-width="0.35" />
  <circle cx="${wheelX}" cy="${wheelY}" r="${(da2 / 2).toFixed(2)}" fill="none" stroke="#d97706" stroke-width="0.25" stroke-dasharray="3 1" />
  <circle cx="${wheelX}" cy="${wheelY}" r="${(d2 / 2).toFixed(2)}" fill="none" stroke="#dc2626" stroke-width="0.25" stroke-dasharray="8 2 1 2" />
  <circle cx="${wheelX}" cy="${wheelY}" r="${(df2 / 2).toFixed(2)}" fill="#f1f5f9" stroke="#000000" stroke-width="0.3" />
  <path d="M ${(wheelX - d2 * 0.22).toFixed(2)} ${(wheelY - ri).toFixed(2)} A ${ri.toFixed(2)} ${ri.toFixed(2)} 0 0 1 ${(wheelX + d2 * 0.22).toFixed(2)} ${(wheelY - ri).toFixed(2)}" fill="none" stroke="#2563eb" stroke-width="0.4" stroke-dasharray="2 1" />

  <!-- Wheel Hub, Bore & Keyway -->
  <circle cx="${wheelX}" cy="${wheelY}" r="${hubR2.toFixed(2)}" fill="#e2e8f0" stroke="#000000" stroke-width="0.3" />
  <circle cx="${wheelX}" cy="${wheelY}" r="${(bore2 / 2).toFixed(2)}" fill="#ffffff" stroke="#000000" stroke-width="0.3" />
  <rect x="${(wheelX - 2.5).toFixed(2)}" y="${(wheelY - bore2 / 2 - 3.5).toFixed(2)}" width="5" height="4" fill="#ffffff" stroke="#000000" stroke-width="0.25" />

  <!-- Cylindrical Worm Screw (Driver z1) -->
  <rect x="${(wL - shaftExt).toFixed(2)}" y="${(wormY - df1 * 0.35).toFixed(2)}" width="${shaftExt.toFixed(2)}" height="${(df1 * 0.7).toFixed(2)}" fill="#e2e8f0" stroke="#000000" stroke-width="0.3" />
  <rect x="${wR.toFixed(2)}" y="${(wormY - df1 * 0.35).toFixed(2)}" width="${shaftExt.toFixed(2)}" height="${(df1 * 0.7).toFixed(2)}" fill="#e2e8f0" stroke="#000000" stroke-width="0.3" />
  <rect x="${wL.toFixed(2)}" y="${(wormY - df1 / 2).toFixed(2)}" width="${wormL.toFixed(2)}" height="${df1.toFixed(2)}" fill="#e2e8f0" stroke="#000000" stroke-width="0.35" />
  ${threadSvg}

  <!-- Center Distance Dimension (a) -->
  <line x1="${(wL - shaftExt - 15).toFixed(2)}" y1="${wormY}" x2="${(wL - shaftExt - 15).toFixed(2)}" y2="${wheelY}" class="dim" />
  <text x="${(wL - shaftExt - 18).toFixed(2)}" y="${((wormY + wheelY) / 2).toFixed(2)}" class="txt" text-anchor="end" dominant-baseline="middle">a = ${a.toFixed(2)} mm</text>

  <!-- Title Block (ISO 7200 / DIN 3975 / KHK Table 4.22) -->
  <g transform="translate(${Math.max(20, svgW - 195)}, ${svgH - 28})">
    <rect x="0" y="0" width="190" height="24" fill="#ffffff" stroke="#000000" stroke-width="0.3"/>
    <text x="5" y="6" class="tbl-title">KHK / DIN 3975 CYLINDRICAL WORM & GLOBOID WHEEL 1:1 DRAWING</text>
    <text x="5" y="12" class="txt">Axial Module mx = ${mx} mm | Worm z1 = ${z1} (γ = ${gammaDeg.toFixed(2)}°) | Wheel z2 = ${z2} (d2 = ${d2.toFixed(2)} mm)</text>
    <text x="5" y="18" class="txt">Center Dist a = ${a.toFixed(2)} mm | Throat ri = ${ri.toFixed(2)} mm | Lead pz = ${calc.leadPzMm.toFixed(2)} mm | η = ${calc.meshEfficiencyEta.toFixed(1)}%</text>
  </g>
</svg>`;
        downloadRawSvg(`khk_worm_pair_1to1_mx${mx}_z${z1}_z${z2}.svg`, svgContent);
    };

    // Real millimetric dimensions with 1:1 scale mapping directly to responsive viewBox
    const r1 = calc.d1 / 2;
    const ra1 = calc.da1 / 2;
    const rf1 = calc.df1 / 2;

    const r2 = calc.d2 / 2;
    const ra2 = calc.da2 / 2;
    const rf2 = calc.df2 / 2;
    const re2 = calc.de2 / 2;
    const ri = calc.throatRadiusRi;
    const a = calc.centerDistance;

    const wormCx = 0;
    const wormCy = a / 2;
    const wheelCx = 0;
    const wheelCy = -a / 2;

    const px = calc.axialPitchPxMm;
    const pz = calc.leadPzMm;
    const gammaRad = (calc.leadAngleGammaDeg * Math.PI) / 180;
    const dx = ((angle1 / 360) * pz) % px;

    const wormWidth = Math.max(14 * calc.mx, 60, r2 * 1.1 + 35);
    const wormLeft = wormCx - wormWidth / 2;
    const wormRight = wormCx + wormWidth / 2;
    const meshY = wormCy - r1;

    // Dynamic bounding box with 8% padding so geometry always fills 80-85% of SVG viewport
    const minGeomX = Math.min(wormLeft - 28, wheelCx - re2 - 12);
    const maxGeomX = Math.max(wormRight + 28, wheelCx + re2 + 12);
    const minGeomY = wheelCy - re2 - 18;
    const maxGeomY = wormCy + ra1 + 25;
    const rawW = maxGeomX - minGeomX;
    const rawH = maxGeomY - minGeomY;
    const padX = rawW * 0.08;
    const padY = rawH * 0.08;
    const vbMinX = minGeomX - padX;
    const vbMinY = minGeomY - padY;
    const vbW = rawW + padX * 2;
    const vbH = rawH + padY * 2;

    // Wheel spokes and throat contour
    const spokeCount = Math.max(24, Math.min(48, calc.z2));

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden min-h-0">
            {/* ═══ CENTER: VISUALIZATION BLUEPRINT (ORTA: GÖRÜNTÜ) ═══ */}
            <div className="flex-1 relative flex flex-col min-h-[460px] lg:min-h-0 bg-[var(--bg-0)] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                {/* Dedicated Toolbar Header */}
                <div className="flex-none px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2 z-20 bg-[var(--bg-0)]/90">
                    <div className="text-[10px] font-mono font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                        <Zap size={13} className="animate-spin-slow text-[var(--cyan)] shrink-0" />
                        <span className="truncate">{s.wormBlueprintTitle}</span>
                        <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            DIN 3975 / KHK 4.22
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <button
                            type="button"
                            onClick={handleExport3D}
                            className="px-2 py-1 rounded-lg bg-[#a855f7]/15 hover:bg-[#a855f7]/25 border border-[#a855f7]/40 text-[#c084fc] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 3D Design Studio", "1:1 3D CAD Tasarım Stüdyosuna Aktar")}
                        >
                            <Box size={11} />
                            <span>3D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExport2DCad}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 2D Drafting (AluCAD)", "1:1 2D Teknik Çizim Modülüne Aktar")}
                        >
                            <Layers size={11} />
                            <span>2D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportWormSvg}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Download 1:1 Worm CAD SVG", "1:1 Ölçekli Sonsuz Vida CAD/SVG İndir")}
                        >
                            <Download size={11} />
                            <span>1:1 SVG (a={formatEngineeringValue(calc.centerDistance, precision, false)}mm)</span>
                        </button>
                    </div>
                </div>

                {/* Blueprint Drawing Viewport */}
                <div
                    {...kinetic.containerProps}
                    className="flex-1 w-full h-full min-h-[360px] relative flex items-center justify-center p-3 select-none overflow-hidden group"
                >
                    <svg className="absolute w-0 h-0"><SvgSharedDefs /></svg>
                    <SvgLaserHudBadge
                        selectedDim={selectedDim}
                        dimName={dataRows.find(r => r.dimKey === selectedDim)?.label}
                        onClear={() => setSelectedDim(null)}
                        isTr={isTr}
                        currentLang={currentLang}
                    />

                    <SvgKineticBadge speedMultiplier={kinetic.speedMultiplier} direction={kinetic.direction} />

                    <svg viewBox={`${vbMinX.toFixed(1)} ${vbMinY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`} className="w-full h-full max-h-[500px]" preserveAspectRatio="xMidYMid meet">
                        {/* Kinematic Centerlines */}
                        <g opacity="0.25">
                            <line x1={vbMinX} y1={wormCy} x2={vbMinX + vbW} y2={wormCy} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="16 4 3 4" />
                            <line x1={vbMinX} y1={wheelCy} x2={vbMinX + vbW} y2={wheelCy} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="16 4 3 4" />
                            <line x1="0" y1={vbMinY} x2="0" y2={vbMinY + vbH} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="16 4 3 4" />
                            <line x1={vbMinX} y1={meshY} x2={vbMinX + vbW} y2={meshY} stroke="#e6b84a" strokeWidth="0.7" strokeDasharray="6 3" />
                        </g>

                        {/* Globoid Worm Wheel (Driven z2) */}
                        <g style={{ transformOrigin: `${wheelCx}px ${wheelCy}px`, transform: `rotate(${angle2.toFixed(2)}deg)` }}>
                            {/* Wheel Outer Rim (de2) */}
                            <circle cx={wheelCx} cy={wheelCy} r={re2} fill="url(#metalBronzeGrad)" stroke="#d97706" strokeWidth="1.6" filter="url(#gearShadow)" />
                            {/* Wheel Throated Tip Circle (da2) */}
                            <circle cx={wheelCx} cy={wheelCy} r={ra2} fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.85" />
                            {/* Wheel Pitch Circle (d2) */}
                            <circle cx={wheelCx} cy={wheelCy} r={r2} fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="8 4" opacity="0.9" />
                            {/* Wheel Root Circle (df2) */}
                            <circle cx={wheelCx} cy={wheelCy} r={rf2} fill="#0c1016" stroke="#b45309" strokeWidth="1.2" />

                            {/* Radial Wheel Teeth / Involute Flanks with 3D Depth */}
                            {Array.from({ length: spokeCount }).map((_, i) => {
                                const th = (i * 360) / spokeCount;
                                const rad = (th * Math.PI) / 180;
                                const halfW = (Math.PI * r2) / (spokeCount * 2);
                                const perpRad = rad + Math.PI / 2;
                                const cPerp = Math.cos(perpRad);
                                const sPerp = Math.sin(perpRad);
                                const cRad = Math.cos(rad);
                                const sRad = Math.sin(rad);
                                
                                const xR1 = wheelCx + cRad * rf2 - cPerp * (halfW * 0.65);
                                const yR1 = wheelCy + sRad * rf2 - sPerp * (halfW * 0.65);
                                const xT1 = wheelCx + cRad * re2 - cPerp * (halfW * 0.35);
                                const yT1 = wheelCy + sRad * re2 - sPerp * (halfW * 0.35);
                                const xT2 = wheelCx + cRad * re2 + cPerp * (halfW * 0.35);
                                const yT2 = wheelCy + sRad * re2 + sPerp * (halfW * 0.35);
                                const xR2 = wheelCx + cRad * rf2 + cPerp * (halfW * 0.65);
                                const yR2 = wheelCy + sRad * rf2 + sPerp * (halfW * 0.65);

                                return (
                                    <polygon
                                        key={i}
                                        points={`${xR1.toFixed(1)},${yR1.toFixed(1)} ${xT1.toFixed(1)},${yT1.toFixed(1)} ${xT2.toFixed(1)},${yT2.toFixed(1)} ${xR2.toFixed(1)},${yR2.toFixed(1)}`}
                                        fill="#d97706"
                                        stroke="#f59e0b"
                                        strokeWidth="0.8"
                                        opacity="0.9"
                                    />
                                );
                            })}

                            {/* Center Bore & Keyway */}
                            <circle cx={wheelCx} cy={wheelCy} r={Math.max(10, r2 * 0.28)} fill="#07090c" stroke="#38bdf8" strokeWidth="1.5" />
                            <rect x={wheelCx - 2.5} y={wheelCy - Math.max(10, r2 * 0.28) - 3} width="5" height="4" fill="#07090c" stroke="#38bdf8" strokeWidth="1" />
                        </g>

                        {/* Cylindrical Worm Screw (Driver z1) */}
                        <g>
                            {/* Extended Shaft Supports */}
                            <rect x={wormLeft - 22} y={wormCy - rf1 * 0.7} width={22} height={rf1 * 1.4} fill="#0c1016" stroke="#334155" strokeWidth="1.2" />
                            <rect x={wormRight} y={wormCy - rf1 * 0.7} width={22} height={rf1 * 1.4} fill="#0c1016" stroke="#334155" strokeWidth="1.2" />

                            {/* Root Body Cylinder */}
                            <rect x={wormLeft} y={wormCy - rf1} width={wormWidth} height={rf1 * 2} fill="#0c1016" stroke="#475569" strokeWidth="1.2" />
                            
                            {/* Pitch Cylinder Guideline */}
                            <line x1={wormLeft} y1={wormCy - r1} x2={wormRight} y2={wormCy - r1} stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 3" opacity="0.75" />
                            <line x1={wormLeft} y1={wormCy + r1} x2={wormRight} y2={wormCy + r1} stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 3" opacity="0.75" />

                            {/* Dynamic ACME Trapezoidal Threads moving linearly with rotation */}
                            {Array.from({ length: Math.ceil(wormWidth / px) + 3 }).map((_, i) => {
                                const threadX = wormLeft - px + i * px + dx;
                                if (threadX < wormLeft - 15 || threadX > wormRight + 15) return null;
                                
                                const threadW = px * 0.42;
                                const tilt = Math.tan(gammaRad) * (ra1 - rf1);

                                const pt1 = `${(threadX - threadW / 2 - tilt).toFixed(1)},${(wormCy - ra1).toFixed(1)}`;
                                const pt2 = `${(threadX + threadW / 2 - tilt).toFixed(1)},${(wormCy - ra1).toFixed(1)}`;
                                const pt3 = `${(threadX + threadW / 2 + tilt).toFixed(1)},${(wormCy + ra1).toFixed(1)}`;
                                const pt4 = `${(threadX - threadW / 2 + tilt).toFixed(1)},${(wormCy + ra1).toFixed(1)}`;

                                return (
                                    <polygon
                                        key={i}
                                        points={`${pt1} ${pt2} ${pt3} ${pt4}`}
                                        fill="url(#metalSteelGrad)"
                                        stroke="#94a3b8"
                                        strokeWidth="1.2"
                                        filter="url(#gearShadow)"
                                    />
                                );
                            })}
                        </g>

                        {/* Pitch Point (P) at worm/wheel tangency */}
                        <circle cx="0" cy={meshY} r="4.5" fill="#3dd68c" filter="url(#emeraldLaserGlow)" />
                        <circle cx="0" cy={meshY} r="8" fill="none" stroke="#3dd68c" strokeWidth="0.8" opacity="0.6" />
                        <text x="12" y={meshY - 6} fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                            {t('P (Pitch Point)', 'P (Kavrama Noktası)')}
                        </text>

                        {/* Dimension Overlays */}
                        {selectedDim === 'a' && (
                            <g>
                                <line x1={wormLeft - 35} y1={wheelCy} x2={wormLeft - 35} y2={wormCy} stroke="#3dd68c" strokeWidth="2.5" filter="url(#emeraldLaserGlow)" />
                                <circle cx={wormLeft - 35} cy={wheelCy} r="3.5" fill="#3dd68c" />
                                <circle cx={wormLeft - 35} cy={wormCy} r="3.5" fill="#3dd68c" />
                                <line x1={wormLeft - 45} y1={wheelCy} x2={wheelCx} y2={wheelCy} stroke="#3dd68c" strokeWidth="0.8" strokeDasharray="3 3" />
                                <line x1={wormLeft - 45} y1={wormCy} x2={wormCx} y2={wormCy} stroke="#3dd68c" strokeWidth="0.8" strokeDasharray="3 3" />
                                <rect x={wormLeft - 130} y={(wheelCy + wormCy) / 2 - 12} width="90" height="24" rx="4" fill="#07090c" stroke="#3dd68c" strokeWidth="1.2" />
                                <text x={wormLeft - 85} y={(wheelCy + wormCy) / 2 + 4} textAnchor="middle" fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    a = {formatEngineeringValue(calc.centerDistance, precision, false)} mm
                                </text>
                            </g>
                        )}

                        {selectedDim === 'd' && (
                            <g>
                                <line x1={wormCx - r1} y1={wormCy + ra1 + 15} x2={wormCx + r1} y2={wormCy + ra1 + 15} stroke="#3ad0e6" strokeWidth="2" filter="url(#neonLaserGlow)" />
                                <circle cx={wormCx - r1} cy={wormCy + ra1 + 15} r="3" fill="#3ad0e6" />
                                <circle cx={wormCx + r1} cy={wormCy + ra1 + 15} r="3" fill="#3ad0e6" />
                                <rect x={wormCx - 45} y={wormCy + ra1 + 20} width="90" height="20" rx="4" fill="#07090c" stroke="#3ad0e6" strokeWidth="1.2" />
                                <text x={wormCx} y={wormCy + ra1 + 34} textAnchor="middle" fill="#3ad0e6" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    d₁ = {formatEngineeringValue(calc.d1, precision, false)} mm
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            </div>

            {/* ═══ RIGHT: OUTPUTS & TELEMETRY (SAĞ: ÇIKTILAR) ═══ */}
            <div className="w-full lg:w-[410px] xl:w-[450px] 2xl:w-[480px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/90 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {/* Worm Mesh & Efficiency HUD */}
                <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Zap size={13} className="text-[var(--cyan)]" />
                            <span>{t('WORM MESH & EFFICIENCY', 'SONSUZ VİDA KAVRAMA & VERİM')}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            DIN 3975
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Center Distance', 'Eksen Mesafesi')} (a)</span>
                            <span className="text-sm font-black text-cyan-300 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.centerDistance, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Mesh Efficiency', 'Kavrama Verimi')} (η)</span>
                            <span className={`text-sm font-black flex items-baseline gap-1 ${calc.meshEfficiencyEta >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {formatEngineeringValue(calc.meshEfficiencyEta, precision, false)} <span className="text-[10px] font-normal text-slate-400">%</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.wormLeadAngle} (γ)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.leadAngleGammaDeg, precision, false)}°
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Axial Lead', 'Hatve')} (pz)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.leadPzMm, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.wormDiameterFactor} (q)</span>
                            <span className="text-sm font-black text-amber-400 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.q, precision, false)}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Sliding Velocity', 'Kayma Hızı')} (vs)</span>
                            <span className="text-sm font-black text-cyan-300 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.slidingVelocityVs, precision, false)} <span className="text-[10px] font-normal text-slate-400">m/s</span>
                            </span>
                        </div>
                    </div>

                    {/* Self Locking Status Diagnostic */}
                    <div className="mt-2.5 p-2 rounded-lg bg-[var(--bg-0)] border border-white/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">{t('Self-Locking (Statik Otoblokaj):', 'Statik Otoblokaj:')}</span>
                        {calc.leadAngleGammaDeg <= 5 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                                {t('YES (Safe / Güvenli)', 'EVET (Güvenli)')}
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                                {t('NO (Reversible)', 'HAYIR (Döndürülebilir)')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Manufacturing Data Sheet Table */}
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden font-mono text-xs shadow-xl">
                    <div
                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                        className="flex items-center justify-between p-3.5 bg-[var(--bg-2)] border-b border-[var(--line)] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet size={15} className="text-[var(--cyan)]" />
                            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                                {t('KHK WORM GEAR MANUFACTURING SHEET', 'KHK SONSUZ VİDA İMALAT PASAPORTU')}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--cyan)]/10 text-[var(--cyan)] font-bold border border-[var(--cyan)]/20">
                                DIN 3975 / KHK 4.22
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-gray-300 border border-[var(--line)] transition-all cursor-pointer"
                            >
                                {copied ? <Check size={11} className="text-[var(--ok)]" /> : <Copy size={11} />}
                                <span>{copied ? t('Copied', 'Kopyalandı') : t('Copy', 'Kopyala')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownloadCsv(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--line)] transition-all cursor-pointer"
                            >
                                <Download size={11} />
                                <span>CSV</span>
                            </button>
                            <ChevronDown size={15} className={`text-[var(--alu-dim)] transition-transform duration-200 ${isTableExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {isTableExpanded && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-[var(--bg-0)] text-[var(--alu-dim)] border-b border-[var(--line)]">
                                        <th className="px-3 py-2 font-bold">{t('Parameter Name', 'Parametre Adı')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Symbol', 'Sembol')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Worm (1)', 'Sonsuz Vida (1)')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Wheel (2)', 'Çark (2)')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Unit', 'Birim')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Standard / Formula', 'Standart / Formül')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--line)]/50">
                                    {dataRows.map((row, idx) => {
                                        const isSelected = selectedDim === row.dimKey;
                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => setSelectedDim(isSelected ? null : (row.dimKey || null))}
                                                className={`transition-all duration-150 select-none cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[var(--cyan)]/20 text-cyan-100 font-bold shadow-[inset_0_0_12px_rgba(58,208,230,0.2)]'
                                                        : row.highlight
                                                        ? 'bg-[var(--cyan)]/5 hover:bg-white/[0.04]'
                                                        : 'hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                    {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />}
                                                    <span className={isSelected ? 'text-cyan-300' : 'text-gray-200'}>{row.label}</span>
                                                </td>
                                                <td className="px-2 py-1.5 text-center text-[var(--cyan)] font-bold">{row.sym}</td>
                                                <td className="px-3 py-1.5 text-center text-white font-bold">{row.v1}</td>
                                                <td className="px-3 py-1.5 text-center text-white font-bold">{row.v2}</td>
                                                <td className="px-2 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.unit}</td>
                                                <td className="px-3 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.std}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function KhkWormGearView(props: CommonViewProps) {
    return (
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5 p-2">
            <div className="2xl:col-span-4 space-y-3">
                <KhkWormControls {...props} />
            </div>
            <div className="2xl:col-span-8 space-y-4">
                <KhkWormView {...props} />
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// 4. KHK SCREW GEAR (CROSSED HELICAL) (CONTROLS & VIEW)
// ═════════════════════════════════════════════════════════════════════════

export function KhkScrewControls({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const { screw, setScrewParam } = useKhkGearStore();

    const calc = useMemo(() => calculateKhkScrewGear({
        normalModule: screw.moduleVal,
        teethPinion: screw.teethZ1,
        teethGear: screw.teethZ2,
        helixAnglePinionDeg: screw.beta1,
        helixAngleGearDeg: screw.beta2,
        handPinion: 'right',
        handGear: 'right',
        pinionRpm: screw.rpm,
    }), [screw]);

    return (
        <div className="space-y-3 font-mono">
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <RotateCcw size={14} className="text-[var(--cyan)]" />
                        {s.screwTitle}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold">{t12(currentLang, 'KHK Table 4.24', 'KHK Tablo 4.24')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.gearModule} (mn)</label>
                        <input
                            type="number"
                            step="any"
                            value={screw.moduleVal}
                            onChange={(e) => setScrewParam('moduleVal', Math.max(0.5, parseFloat(e.target.value) || 1))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">RPM (n₁)</label>
                        <input
                            type="number"
                            step="any"
                            value={screw.rpm}
                            onChange={(e) => setScrewParam('rpm', parseFloat(e.target.value) || 1000)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--ok)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.pinionTeeth} (z₁)</label>
                        <input
                            type="number"
                            step="1"
                            value={screw.teethZ1}
                            onChange={(e) => setScrewParam('teethZ1', Math.max(10, parseInt(e.target.value) || 15))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--cyan)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.gearTeeth} (z₂)</label>
                        <input
                            type="number"
                            step="1"
                            value={screw.teethZ2}
                            onChange={(e) => setScrewParam('teethZ2', Math.max(10, parseInt(e.target.value) || 30))}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--warn)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.screwHelixPinion} β₁</label>
                        <input
                            type="number"
                            step="any"
                            value={screw.beta1}
                            onChange={(e) => setScrewParam('beta1', parseFloat(e.target.value) || 45)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--cyan)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                    <div>
                        <label className="text-[9.5px] uppercase text-[var(--alu-dim)] block mb-1">{s.screwHelixGear} β₂</label>
                        <input
                            type="number"
                            step="any"
                            value={screw.beta2}
                            onChange={(e) => setScrewParam('beta2', parseFloat(e.target.value) || 45)}
                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[var(--warn)] font-bold outline-none focus:border-[var(--cyan)]"
                        />
                    </div>
                </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] font-mono text-[11px] space-y-2">
                <span className="text-[10px] font-bold uppercase text-[var(--alu-dim)] block">{t('CROSSED SHAFT KINEMATICS', 'ÇAPRAZ MİL KİNEMATİĞİ')}</span>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{s.screwShaftAngle}:</span>
                        <span className="text-sm font-black text-[var(--cyan)]">{formatEngineeringValue(calc.shaftAngleSigmaDeg, precision, false)}°</span>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{s.screwSlidingVelocity}:</span>
                        <span className="text-sm font-black text-[var(--ok)]">{formatEngineeringValue(calc.slidingVelocityVs, precision, false)} m/s</span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px]">
                    <span className="text-[var(--alu-dim)]">{s.centerDist}:</span>
                    <span className="font-bold text-[var(--warn)]">{formatEngineeringValue(calc.centerDistance, precision, false)} mm</span>
                </div>
            </div>
        </div>
    );
}

export function KhkScrewView({ isTr, currentLang }: CommonViewProps) {
    const precision = useGlobalPrecision();
    const s = getGearsModuleStrings(currentLang || (isTr ? 'tr' : 'en'));
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const { screw } = useKhkGearStore();

    const [selectedDim, setSelectedDim] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true);

    const kinetic = useKineticSpin({ nominalSpeedDegPerSec: 30 });
    const angle1 = kinetic.angle;

    const calc: KhkScrewGearResult = useMemo(() => calculateKhkScrewGear({
        normalModule: screw.moduleVal,
        teethPinion: screw.teethZ1,
        teethGear: screw.teethZ2,
        helixAnglePinionDeg: screw.beta1,
        helixAngleGearDeg: screw.beta2,
        handPinion: 'right',
        handGear: 'right',
        pinionRpm: screw.rpm,
    }), [screw]);

    const angle2 = -(angle1 * (calc.z1 / Math.max(1, calc.z2))) % 360;

    const dataRows = [
        { label: t('Normal Module', 'Normal Modül'), sym: 'mn', v1:formatEngineeringValue(calc.mn, precision, false), v2:formatEngineeringValue(calc.mn, precision, false), unit: 'mm', std: 'JIS B 1702', dimKey: 'mn' },
        { label: t('Teeth Count', 'Diş Sayısı'), sym: 'z', v1: `${calc.z1}`, v2: `${calc.z2}`, unit: '-', std: 'KHK 4.24', dimKey: 'z' },
        { label: s.helixAngle, sym: 'β', v1: `${formatEngineeringValue(calc.beta1_deg, precision, false)}°`, v2: `${formatEngineeringValue(calc.beta2_deg, precision, false)}°`, unit: 'deg', std: 'KHK 4.24', dimKey: 'beta', highlight: true },
        { label: s.screwShaftAngle, sym: 'Σ', v1: `${formatEngineeringValue(calc.shaftAngleSigmaDeg, precision, false)}°`, v2: `${formatEngineeringValue(calc.shaftAngleSigmaDeg, precision, false)}°`, unit: 'deg', std: 'KHK Table 4.24 Eq 4', dimKey: 'Sigma', highlight: true },
        { label: t('Gear Ratio', 'Tahvil Oranı'), sym: 'i', v1: '1.000', v2:formatEngineeringValue(calc.ratio, precision, false), unit: '-', std: 'JIS B 1702', dimKey: 'ratio' },
        { label: t('Pitch Diameter', 'Bölüm Dairesi Çapı'), sym: 'd', v1:formatEngineeringValue(calc.d1, precision, false), v2:formatEngineeringValue(calc.d2, precision, false), unit: 'mm', std: 'KHK Table 4.24 Eq 5 & 6', dimKey: 'd', highlight: true },
        { label: t('Center Distance', 'Eksenler Arası Mesafe'), sym: 'a', v1:formatEngineeringValue(calc.centerDistance, precision, false), v2:formatEngineeringValue(calc.centerDistance, precision, false), unit: 'mm', std: 'KHK Table 4.24 Eq 7', dimKey: 'a', highlight: true },
        { label: t('Tip Diameter', 'Diş Başı Çapı'), sym: 'da', v1:formatEngineeringValue(calc.da1, precision, false), v2:formatEngineeringValue(calc.da2, precision, false), unit: 'mm', std: 'KHK Table 4.24 Eq 8', dimKey: 'da' },
        { label: s.screwSlidingVelocity, sym: 'vs', v1:formatEngineeringValue(calc.slidingVelocityVs, precision, false), v2:formatEngineeringValue(calc.slidingVelocityVs, precision, false), unit: 'm/s', std: 'KHK 4.5 Eq 4.14', dimKey: 'vs', highlight: true },
    ];

    const handleCopy = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), t('Pinion (1)', 'Pinyon (1)'), t('Gear (2)', 'Çark (2)'), t('Unit', 'Birim'), t('Standard', 'Standart')].join('\t');
        const rows = dataRows.map(r => [r.label, r.sym, r.v1, r.v2, r.unit, r.std].join('\t'));
        navigator.clipboard.writeText([header, ...rows].join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCsv = () => {
        const header = [t('Parameter', 'Parametre'), t('Symbol', 'Sembol'), `${t('Pinion', 'Pinyon')} (1)`, `${t('Gear', 'Çark')} (2)`, t('Unit', 'Birim'), t('Standard', 'Standart')].join(';');
        const rows = dataRows.map(r => `"${r.label}";"${r.sym}";"${r.v1}";"${r.v2}";"${r.unit}";"${r.std}"`);
        const blob = new Blob(['\uFEFF' + [header, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `khk_screw_pair_mn${calc.mn}_z${calc.z1}_z${calc.z2}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExport3D = () => {
        CrossModuleBridge.exportScrewTo3D({
            normalModule: screw.moduleVal,
            z1: screw.teethZ1,
            z2: screw.teethZ2,
            beta1Deg: screw.beta1,
            beta2Deg: screw.beta2,
            shaftAngleSigmaDeg: calc.shaftAngleSigmaDeg,
            centerDistance: calc.centerDistance,
            d1: calc.d1,
            d2: calc.d2,
            switchWindow: true,
        });
    };

    const handleExport2DCad = () => {
        CrossModuleBridge.exportScrewTo2DCad({
            title: `KHK Screw Gear mn=${screw.moduleVal} z1=${screw.teethZ1} z2=${screw.teethZ2}`,
            normalModule: screw.moduleVal,
            z1: screw.teethZ1,
            z2: screw.teethZ2,
            beta1Deg: screw.beta1,
            beta2Deg: screw.beta2,
            shaftAngleSigmaDeg: calc.shaftAngleSigmaDeg,
            centerDistance: calc.centerDistance,
            d1: calc.d1,
            d2: calc.d2,
            switchWindow: true,
        });
    };

    const handleExportScrewSvg = () => {
        const mn = calc.mn;
        const z1 = calc.z1;
        const z2 = calc.z2;
        const d1 = calc.d1;
        const da1 = calc.da1;
        const d2 = calc.d2;
        const da2 = calc.da2;
        const a = calc.centerDistance;
        const b1 = Math.max(25, 10 * mn);
        const b2 = Math.max(25, 10 * mn);
        const beta1 = calc.beta1_deg;
        const beta2 = calc.beta2_deg;
        const sigma = calc.shaftAngleSigmaDeg;

        const pad = 40;
        const svgW = Math.max(280, d1 + d2 + b1 + b2 + pad * 2);
        const svgH = Math.max(280, a + da1 / 2 + da2 / 2 + pad * 2 + 30);

        const cX = svgW / 2;
        const cY = svgH / 2;

        const th1 = (beta1 * Math.PI) / 180;
        const th2 = (-beta2 * Math.PI) / 180;

        const u1 = [Math.cos(th1), -Math.sin(th1)];
        const n1 = [Math.sin(th1), Math.cos(th1)];
        const u2 = [Math.cos(th2), -Math.sin(th2)];
        const n2 = [Math.sin(th2), Math.cos(th2)];

        const c1 = [cX, cY - a / 2];
        const c2 = [cX, cY + a / 2];

        const p1L = [c1[0] - u1[0] * (b1 / 2), c1[1] - u1[1] * (b1 / 2)];
        const p1R = [c1[0] + u1[0] * (b1 / 2), c1[1] + u1[1] * (b1 / 2)];
        const p2L = [c2[0] - u2[0] * (b2 / 2), c2[1] - u2[1] * (b2 / 2)];
        const p2R = [c2[0] + u2[0] * (b2 / 2), c2[1] + u2[1] * (b2 / 2)];

        const p1a = [p1L[0] + n1[0] * (da1 / 2), p1L[1] + n1[1] * (da1 / 2)];
        const p1b = [p1R[0] + n1[0] * (da1 / 2), p1R[1] + n1[1] * (da1 / 2)];
        const p1c = [p1R[0] - n1[0] * (da1 / 2), p1R[1] - n1[1] * (da1 / 2)];
        const p1d = [p1L[0] - n1[0] * (da1 / 2), p1L[1] - n1[1] * (da1 / 2)];

        const p2a = [p2L[0] + n2[0] * (da2 / 2), p2L[1] + n2[1] * (da2 / 2)];
        const p2b = [p2R[0] + n2[0] * (da2 / 2), p2R[1] + n2[1] * (da2 / 2)];
        const p2c = [p2R[0] - n2[0] * (da2 / 2), p2R[1] - n2[1] * (da2 / 2)];
        const p2d = [p2L[0] - n2[0] * (da2 / 2), p2L[1] - n2[1] * (da2 / 2)];

        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}mm" height="${svgH}mm" viewBox="0 0 ${svgW} ${svgH}">
  <defs>
    <style>
      .cut { fill: none; stroke: #000000; stroke-width: 0.35; stroke-linecap: round; stroke-linejoin: round; }
      .mesh1 { fill: #e0f2fe; stroke: #0369a1; stroke-width: 0.3; }
      .mesh2 { fill: #fef3c7; stroke: #b45309; stroke-width: 0.3; }
      .cl { fill: none; stroke: #dc2626; stroke-width: 0.2; stroke-dasharray: 8 2 1 2; }
      .dim { fill: none; stroke: #2563eb; stroke-width: 0.2; }
      .txt { font-family: monospace; font-size: 3.5px; fill: #0f172a; }
      .tbl-title { font-family: monospace; font-size: 4px; font-weight: bold; fill: #0f172a; }
    </style>
  </defs>

  <!-- Shaft Centerlines -->
  <line x1="${(c1[0] - u1[0] * (b1 * 0.9)).toFixed(2)}" y1="${(c1[1] - u1[1] * (b1 * 0.9)).toFixed(2)}" x2="${(c1[0] + u1[0] * (b1 * 0.9)).toFixed(2)}" y2="${(c1[1] + u1[1] * (b1 * 0.9)).toFixed(2)}" class="cl" />
  <line x1="${(c2[0] - u2[0] * (b2 * 0.9)).toFixed(2)}" y1="${(c2[1] - u2[1] * (b2 * 0.9)).toFixed(2)}" x2="${(c2[0] + u2[0] * (b2 * 0.9)).toFixed(2)}" y2="${(c2[1] + u2[1] * (b2 * 0.9)).toFixed(2)}" class="cl" />

  <!-- Gear 2 (Rear Skewed Cylinder) -->
  <polygon points="${p2a[0].toFixed(2)},${p2a[1].toFixed(2)} ${p2b[0].toFixed(2)},${p2b[1].toFixed(2)} ${p2c[0].toFixed(2)},${p2c[1].toFixed(2)} ${p2d[0].toFixed(2)},${p2d[1].toFixed(2)}" class="mesh2" />
  <line x1="${(p2L[0] + n2[0] * (d2 / 2)).toFixed(2)}" y1="${(p2L[1] + n2[1] * (d2 / 2)).toFixed(2)}" x2="${(p2R[0] + n2[0] * (d2 / 2)).toFixed(2)}" y2="${(p2R[1] + n2[1] * (d2 / 2)).toFixed(2)}" class="cl" />

  <!-- Pinion 1 (Foreground Skewed Cylinder) -->
  <polygon points="${p1a[0].toFixed(2)},${p1a[1].toFixed(2)} ${p1b[0].toFixed(2)},${p1b[1].toFixed(2)} ${p1c[0].toFixed(2)},${p1c[1].toFixed(2)} ${p1d[0].toFixed(2)},${p1d[1].toFixed(2)}" class="mesh1" />
  <line x1="${(p1L[0] + n1[0] * (d1 / 2)).toFixed(2)}" y1="${(p1L[1] + n1[1] * (d1 / 2)).toFixed(2)}" x2="${(p1R[0] + n1[0] * (d1 / 2)).toFixed(2)}" y2="${(p1R[1] + n1[1] * (d1 / 2)).toFixed(2)}" class="cl" />

  <!-- Pitch Contact Point -->
  <circle cx="${cX}" cy="${cY}" r="1.5" fill="#16a34a" />

  <!-- Dimensions -->
  <line x1="${(cX - 25).toFixed(2)}" y1="${c1[1].toFixed(2)}" x2="${(cX - 25).toFixed(2)}" y2="${c2[1].toFixed(2)}" class="dim" />
  <text x="${(cX - 28).toFixed(2)}" y="${cY.toFixed(2)}" class="txt" text-anchor="end" dominant-baseline="middle">a = ${a.toFixed(2)} mm</text>

  <!-- Title Block (ISO 7200 / JIS B 1702 / KHK Table 4.24) -->
  <g transform="translate(${Math.max(20, svgW - 195)}, ${svgH - 28})">
    <rect x="0" y="0" width="190" height="24" fill="#ffffff" stroke="#000000" stroke-width="0.3"/>
    <text x="5" y="6" class="tbl-title">KHK / JIS B 1702 CROSSED HELICAL (SCREW) GEAR 1:1 DRAWING</text>
    <text x="5" y="12" class="txt">Module mn = ${mn} mm | Pinion z1 = ${z1} (β1 = ${beta1.toFixed(2)}°) | Gear z2 = ${z2} (β2 = ${beta2.toFixed(2)}°)</text>
    <text x="5" y="18" class="txt">Shaft Angle Σ = ${sigma.toFixed(2)}° | Center Dist a = ${a.toFixed(2)} mm | d1 = ${d1.toFixed(2)} mm, d2 = ${d2.toFixed(2)} mm</text>
  </g>
</svg>`;
        downloadRawSvg(`khk_screw_gear_1to1_mn${mn}_z${z1}_z${z2}.svg`, svgContent);
    };

    // Physical millimeter dimensions with 1:1 dynamic projection
    const r1 = calc.d1 / 2;
    const ra1 = calc.da1 / 2;
    const r2 = calc.d2 / 2;
    const ra2 = calc.da2 / 2;
    const a = calc.centerDistance;

    // Face lengths proportional to gear size
    const L1 = Math.max(90, Math.min(280, ra1 * 3.4 + 35));
    const L2 = Math.max(100, Math.min(300, ra2 * 3.4 + 35));

    // Inclination angles in radians
    const th1 = (calc.beta1_deg * Math.PI) / 180;
    const th2 = (-calc.beta2_deg * Math.PI) / 180;

    // Shaft unit vectors (u: along cylinder axis, n: normal to axis in projection plane)
    const u1: [number, number] = [Math.cos(th1), -Math.sin(th1)];
    const n1: [number, number] = [Math.sin(th1), Math.cos(th1)];

    const u2: [number, number] = [Math.cos(th2), -Math.sin(th2)];
    const n2: [number, number] = [Math.sin(th2), Math.cos(th2)];

    // Center coordinates for Pinion (front layer, shifted by +r1) and Gear (rear layer, shifted by -r2)
    // Contact pitch point is at (0, 0)
    const c1: [number, number] = [0, r1];
    const c2: [number, number] = [0, -r2];

    // Cylinder end caps
    const c1L: [number, number] = [c1[0] - u1[0] * (L1 / 2), c1[1] - u1[1] * (L1 / 2)];
    const c1R: [number, number] = [c1[0] + u1[0] * (L1 / 2), c1[1] + u1[1] * (L1 / 2)];

    const c2L: [number, number] = [c2[0] - u2[0] * (L2 / 2), c2[1] - u2[1] * (L2 / 2)];
    const c2R: [number, number] = [c2[0] + u2[0] * (L2 / 2), c2[1] + u2[1] * (L2 / 2)];

    // Pinion 1 four cylinder corners
    const p1a: [number, number] = [c1L[0] + n1[0] * ra1, c1L[1] + n1[1] * ra1];
    const p1b: [number, number] = [c1R[0] + n1[0] * ra1, c1R[1] + n1[1] * ra1];
    const p1c: [number, number] = [c1R[0] - n1[0] * ra1, c1R[1] - n1[1] * ra1];
    const p1d: [number, number] = [c1L[0] - n1[0] * ra1, c1L[1] - n1[1] * ra1];

    // Gear 2 four cylinder corners
    const p2a: [number, number] = [c2L[0] + n2[0] * ra2, c2L[1] + n2[1] * ra2];
    const p2b: [number, number] = [c2R[0] + n2[0] * ra2, c2R[1] + n2[1] * ra2];
    const p2c: [number, number] = [c2R[0] - n2[0] * ra2, c2R[1] - n2[1] * ra2];
    const p2d: [number, number] = [c2L[0] - n2[0] * ra2, c2L[1] - n2[1] * ra2];

    // Elliptical end cap depth factor
    const capDepth1 = Math.max(6, ra1 * 0.22);
    const capDepth2 = Math.max(6, ra2 * 0.22);

    // Tangential velocities at pitch point (0, 0)
    const vScale = 45;
    const v1Head: [number, number] = [n1[0] * vScale, n1[1] * vScale];
    const v2Head: [number, number] = [n2[0] * vScale, n2[1] * vScale];

    // Sliding velocity vector (vs = v1 - v2)
    const vsVec: [number, number] = [v1Head[0] - v2Head[0], v1Head[1] - v2Head[1]];

    // Dynamic Bounding Box calculation across all geometry
    const allX = [
        p1a[0], p1b[0], p1c[0], p1d[0],
        p2a[0], p2b[0], p2c[0], p2d[0],
        c1L[0] - u1[0] * capDepth1, c1R[0] + u1[0] * capDepth1,
        c2L[0] - u2[0] * capDepth2, c2R[0] + u2[0] * capDepth2,
        0, v1Head[0], v2Head[0], v1Head[0] + 45,
        -a * 0.8, a * 0.8,
    ];
    const allY = [
        p1a[1], p1b[1], p1c[1], p1d[1],
        p2a[1], p2b[1], p2c[1], p2d[1],
        c1L[1] - u1[1] * capDepth1, c1R[1] + u1[1] * capDepth1,
        c2L[1] - u2[1] * capDepth2, c2R[1] + u2[1] * capDepth2,
        0, v1Head[1], v2Head[1], -r2 - 25, r1 + 25,
    ];

    const minGeomX = Math.min(...allX);
    const maxGeomX = Math.max(...allX);
    const minGeomY = Math.min(...allY);
    const maxGeomY = Math.max(...allY);

    const rawW = Math.max(150, maxGeomX - minGeomX);
    const rawH = Math.max(150, maxGeomY - minGeomY);
    const padX = Math.max(35, rawW * 0.10);
    const padY = Math.max(30, rawH * 0.10);

    const vbMinX = minGeomX - padX;
    const vbMinY = minGeomY - padY;
    const vbW = rawW + 2 * padX;
    const vbH = rawH + 2 * padY;

    // Helical tooth flutes count & animation shift
    const flSpacing1 = Math.max(14, calc.mn * 5);
    const flSpacing2 = Math.max(14, calc.mn * 5);
    const flCount1 = Math.ceil(L1 / flSpacing1) + 2;
    const flCount2 = Math.ceil(L2 / flSpacing2) + 2;
    const flShift1 = (angle1 * 0.9) % flSpacing1;
    const flShift2 = (angle2 * 0.9) % flSpacing2;

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden min-h-0">
            {/* ═══ CENTER: VISUALIZATION BLUEPRINT (ORTA: GÖRÜNTÜ) ═══ */}
            <div className="flex-1 relative flex flex-col min-h-[460px] lg:min-h-0 bg-[var(--bg-0)] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                {/* Dedicated Toolbar Header */}
                <div className="flex-none px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2 z-20 bg-[var(--bg-0)]/90">
                    <div className="text-[10px] font-mono font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                        <RotateCcw size={13} className="animate-spin-slow text-[var(--cyan)] shrink-0" />
                        <span className="truncate">{s.screwBlueprintTitle}</span>
                        <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            JIS B 1702 / KHK 4.25
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <button
                            type="button"
                            onClick={handleExport3D}
                            className="px-2 py-1 rounded-lg bg-[#a855f7]/15 hover:bg-[#a855f7]/25 border border-[#a855f7]/40 text-[#c084fc] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 3D Design Studio", "1:1 3D CAD Tasarım Stüdyosuna Aktar")}
                        >
                            <Box size={11} />
                            <span>3D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExport2DCad}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Export to 2D Drafting (AluCAD)", "1:1 2D Teknik Çizim Modülüne Aktar")}
                        >
                            <Layers size={11} />
                            <span>2D CAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportScrewSvg}
                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={t("Download 1:1 Screw CAD SVG", "1:1 Ölçekli Çapraz Helis CAD/SVG İndir")}
                        >
                            <Download size={11} />
                            <span>1:1 SVG (Σ={formatEngineeringValue(calc.shaftAngleSigmaDeg, precision, false)}°)</span>
                        </button>
                    </div>
                </div>

                {/* Blueprint Drawing Viewport */}
                <div
                    {...kinetic.containerProps}
                    className="flex-1 w-full h-full min-h-[360px] relative flex items-center justify-center p-3 select-none overflow-hidden group"
                >
                    <svg className="absolute w-0 h-0"><SvgSharedDefs /></svg>
                    <SvgLaserHudBadge
                        selectedDim={selectedDim}
                        dimName={dataRows.find(r => r.dimKey === selectedDim)?.label}
                        onClear={() => setSelectedDim(null)}
                        isTr={isTr}
                        currentLang={currentLang}
                    />

                    <SvgKineticBadge speedMultiplier={kinetic.speedMultiplier} direction={kinetic.direction} />

                    <svg viewBox={`${vbMinX.toFixed(1)} ${vbMinY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`} className="w-full h-full max-h-[500px]" preserveAspectRatio="xMidYMid meet">
                        {/* Centerlines */}
                        <g opacity="0.30">
                            <line
                                x1={(c2L[0] - u2[0] * (L2 * 0.45)).toFixed(1)}
                                y1={(c2L[1] - u2[1] * (L2 * 0.45)).toFixed(1)}
                                x2={(c2R[0] + u2[0] * (L2 * 0.45)).toFixed(1)}
                                y2={(c2R[1] + u2[1] * (L2 * 0.45)).toFixed(1)}
                                stroke="#f59e0b"
                                strokeWidth="1"
                                strokeDasharray="16 4 3 4"
                            />
                            <line
                                x1={(c1L[0] - u1[0] * (L1 * 0.45)).toFixed(1)}
                                y1={(c1L[1] - u1[1] * (L1 * 0.45)).toFixed(1)}
                                x2={(c1R[0] + u1[0] * (L1 * 0.45)).toFixed(1)}
                                y2={(c1R[1] + u1[1] * (L1 * 0.45)).toFixed(1)}
                                stroke="#38bdf8"
                                strokeWidth="1"
                                strokeDasharray="16 4 3 4"
                            />
                        </g>

                        {/* Driven Gear 2 (Background Cylinder with helical flutes) */}
                        <g>
                            <polygon
                                points={`${p2a[0].toFixed(1)},${p2a[1].toFixed(1)} ${p2b[0].toFixed(1)},${p2b[1].toFixed(1)} ${p2c[0].toFixed(1)},${p2c[1].toFixed(1)} ${p2d[0].toFixed(1)},${p2d[1].toFixed(1)}`}
                                fill="url(#metalBronzeGrad)"
                                stroke="#d97706"
                                strokeWidth="1.5"
                                filter="url(#gearShadow)"
                            />
                            <ellipse
                                cx={c2L[0].toFixed(1)}
                                cy={c2L[1].toFixed(1)}
                                rx={capDepth2.toFixed(1)}
                                ry={ra2.toFixed(1)}
                                transform={`rotate(${(-calc.beta2_deg).toFixed(1)} ${c2L[0].toFixed(1)} ${c2L[1].toFixed(1)})`}
                                fill="#b45309"
                                stroke="#f59e0b"
                                strokeWidth="1.2"
                            />
                            <ellipse
                                cx={c2R[0].toFixed(1)}
                                cy={c2R[1].toFixed(1)}
                                rx={capDepth2.toFixed(1)}
                                ry={ra2.toFixed(1)}
                                transform={`rotate(${(-calc.beta2_deg).toFixed(1)} ${c2R[0].toFixed(1)} ${c2R[1].toFixed(1)})`}
                                fill="#78350f"
                                stroke="#d97706"
                                strokeWidth="1.2"
                            />

                            {/* Helical Flutes on Gear 2 */}
                            {Array.from({ length: flCount2 }).map((_, i) => {
                                const dist = -L2 / 2 + i * flSpacing2 + flShift2;
                                if (dist < -L2 / 2 + 5 || dist > L2 / 2 - 5) return null;
                                const f1 = [c2[0] + u2[0] * dist + n2[0] * ra2, c2[1] + u2[1] * dist + n2[1] * ra2];
                                const f2 = [c2[0] + u2[0] * dist - n2[0] * ra2, c2[1] + u2[1] * dist - n2[1] * ra2];
                                return (
                                    <line
                                        key={i}
                                        x1={f1[0].toFixed(1)}
                                        y1={f1[1].toFixed(1)}
                                        x2={f2[0].toFixed(1)}
                                        y2={f2[1].toFixed(1)}
                                        stroke="#fef3c7"
                                        strokeWidth="1.2"
                                        opacity="0.45"
                                        strokeDasharray="4 2"
                                    />
                                );
                            })}
                        </g>

                        {/* Driver Pinion 1 (Foreground Cylinder with helical flutes) */}
                        <g>
                            <polygon
                                points={`${p1a[0].toFixed(1)},${p1a[1].toFixed(1)} ${p1b[0].toFixed(1)},${p1b[1].toFixed(1)} ${p1c[0].toFixed(1)},${p1c[1].toFixed(1)} ${p1d[0].toFixed(1)},${p1d[1].toFixed(1)}`}
                                fill="url(#metalSteelGrad)"
                                stroke="#475569"
                                strokeWidth="1.5"
                                filter="url(#gearShadow)"
                            />
                            <ellipse
                                cx={c1L[0].toFixed(1)}
                                cy={c1L[1].toFixed(1)}
                                rx={capDepth1.toFixed(1)}
                                ry={ra1.toFixed(1)}
                                transform={`rotate(${calc.beta1_deg.toFixed(1)} ${c1L[0].toFixed(1)} ${c1L[1].toFixed(1)})`}
                                fill="#334155"
                                stroke="#94a3b8"
                                strokeWidth="1.2"
                            />
                            <ellipse
                                cx={c1R[0].toFixed(1)}
                                cy={c1R[1].toFixed(1)}
                                rx={capDepth1.toFixed(1)}
                                ry={ra1.toFixed(1)}
                                transform={`rotate(${calc.beta1_deg.toFixed(1)} ${c1R[0].toFixed(1)} ${c1R[1].toFixed(1)})`}
                                fill="#1e293b"
                                stroke="#64748b"
                                strokeWidth="1.2"
                            />

                            {/* Helical Flutes on Pinion 1 */}
                            {Array.from({ length: flCount1 }).map((_, i) => {
                                const dist = -L1 / 2 + i * flSpacing1 + flShift1;
                                if (dist < -L1 / 2 + 5 || dist > L1 / 2 - 5) return null;
                                const f1 = [c1[0] + u1[0] * dist + n1[0] * ra1, c1[1] + u1[1] * dist + n1[1] * ra1];
                                const f2 = [c1[0] + u1[0] * dist - n1[0] * ra1, c1[1] + u1[1] * dist - n1[1] * ra1];
                                return (
                                    <line
                                        key={i}
                                        x1={f1[0].toFixed(1)}
                                        y1={f1[1].toFixed(1)}
                                        x2={f2[0].toFixed(1)}
                                        y2={f2[1].toFixed(1)}
                                        stroke="#e2e8f0"
                                        strokeWidth="1.4"
                                        opacity="0.55"
                                        strokeDasharray="6 3"
                                    />
                                );
                            })}
                        </g>

                        {/* Pitch Point Contact (0, 0) */}
                        <circle cx="0" cy="0" r="4.5" fill="#3dd68c" filter="url(#emeraldLaserGlow)" />
                        <circle cx="0" cy="0" r="8" fill="none" stroke="#3dd68c" strokeWidth="0.8" opacity="0.6" />
                        <text x="12" y="-6" fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                            {t('P (Pitch Point)', 'P (Kavrama Noktası)')}
                        </text>

                        {/* Sliding Velocity Vector at Pitch Point */}
                        <g>
                            <line x1="0" y1="0" x2={v1Head[0].toFixed(1)} y2={v1Head[1].toFixed(1)} stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowLaser)" />
                            <text x={(v1Head[0] + 6).toFixed(1)} y={v1Head[1].toFixed(1)} fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">v₁</text>

                            <line x1="0" y1="0" x2={v2Head[0].toFixed(1)} y2={v2Head[1].toFixed(1)} stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowAmber)" />
                            <text x={(v2Head[0] + 6).toFixed(1)} y={v2Head[1].toFixed(1)} fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">v₂</text>

                            <line x1={v2Head[0].toFixed(1)} y1={v2Head[1].toFixed(1)} x2={v1Head[0].toFixed(1)} y2={v1Head[1].toFixed(1)} stroke="#e85d5d" strokeWidth="2" strokeDasharray="3 2" markerEnd="url(#arrowLaser)" />
                            <text x={((v1Head[0] + v2Head[0]) / 2 + 8).toFixed(1)} y={((v1Head[1] + v2Head[1]) / 2).toFixed(1)} fill="#e85d5d" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                                vs = {formatEngineeringValue(calc.slidingVelocityVs, precision, false)} m/s
                            </text>
                        </g>

                        {/* Dimension Overlays */}
                        {selectedDim === 'a' && (
                            <g>
                                <line x1={-rawW * 0.42} y1={c2[1]} x2={-rawW * 0.42} y2={c1[1]} stroke="#3dd68c" strokeWidth="2.5" filter="url(#emeraldLaserGlow)" />
                                <circle cx={-rawW * 0.42} cy={c2[1]} r="3.5" fill="#3dd68c" />
                                <circle cx={-rawW * 0.42} cy={c1[1]} r="3.5" fill="#3dd68c" />
                                <line x1={-rawW * 0.45} y1={c2[1]} x2={c2[0]} y2={c2[1]} stroke="#3dd68c" strokeWidth="0.8" strokeDasharray="3 3" />
                                <line x1={-rawW * 0.45} y1={c1[1]} x2={c1[0]} y2={c1[1]} stroke="#3dd68c" strokeWidth="0.8" strokeDasharray="3 3" />
                                <rect x={-rawW * 0.42 - 95} y={(c1[1] + c2[1]) / 2 - 12} width="90" height="24" rx="4" fill="#07090c" stroke="#3dd68c" strokeWidth="1.2" />
                                <text x={-rawW * 0.42 - 50} y={(c1[1] + c2[1]) / 2 + 4} textAnchor="middle" fill="#3dd68c" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    a = {formatEngineeringValue(calc.centerDistance, precision, false)} mm
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            </div>

            {/* ═══ RIGHT: OUTPUTS & TELEMETRY (SAĞ: ÇIKTILAR) ═══ */}
            <div className="w-full lg:w-[410px] xl:w-[450px] 2xl:w-[480px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/90 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {/* Crossed Helical Kinematics HUD */}
                <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Zap size={13} className="text-[var(--cyan)]" />
                            <span>{t('CROSSED HELICAL KINEMATICS', 'ÇAPRAZ HELİS KİNEMATİĞİ')}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            JIS B 1702
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Center Distance', 'Eksen Mesafesi')} (a)</span>
                            <span className="text-sm font-black text-cyan-300 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.centerDistance, precision, false)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.screwShaftAngle} (Σ)</span>
                            <span className="text-sm font-black text-amber-400 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.shaftAngleSigmaDeg, precision, false)}°
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{s.screwSlidingVelocity} (vs)</span>
                            <span className="text-sm font-black text-red-400 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.slidingVelocityVs, precision, false)} <span className="text-[10px] font-normal text-slate-400">m/s</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Gear Ratio', 'Çevrim Oranı')} (i)</span>
                            <span className="text-sm font-black text-emerald-400 flex items-baseline gap-1">
                                {formatEngineeringValue(calc.ratio, precision, false)} <span className="text-[10px] font-normal text-slate-400">: 1</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Pinion Helix', 'Pinyon Helis')} (β₁)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.beta1_deg, precision, false)}°
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-0)] border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 block">{t('Gear Helix', 'Çark Helis')} (β₂)</span>
                            <span className="text-sm font-black text-white flex items-baseline gap-1">
                                {formatEngineeringValue(calc.beta2_deg, precision, false)}°
                            </span>
                        </div>
                    </div>

                    {/* Tribological Advisory Note */}
                    <div className="mt-2.5 p-2 rounded-lg bg-[var(--bg-0)] border border-amber-500/20 text-[10px] font-mono text-amber-300/90 leading-relaxed">
                        <span className="font-bold text-amber-300">{t('Tribology Note: ', 'Triboloji Notu: ')}</span>
                        {t('Non-parallel crossed shafts operate via theoretical point contact. Continuous high sliding requires EP lubrication.', 'Aykırı eksenli dişliler noktasal temasla çalışır. Yüksek kayma hızı nedeniyle EP katkılı sürekli yağlama zorunludur.')}
                    </div>
                </div>

                {/* Manufacturing Data Sheet Table */}
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden font-mono text-xs shadow-xl">
                    <div
                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                        className="flex items-center justify-between p-3.5 bg-[var(--bg-2)] border-b border-[var(--line)] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet size={15} className="text-[var(--cyan)]" />
                            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                                {t('KHK SCREW GEAR MANUFACTURING SHEET', 'KHK ÇAPRAZ HELİS İMALAT PASAPORTU')}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--cyan)]/10 text-[var(--cyan)] font-bold border border-[var(--cyan)]/20">
                                JIS B 1702 / KHK 4.24
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-gray-300 border border-[var(--line)] transition-all cursor-pointer"
                            >
                                {copied ? <Check size={11} className="text-[var(--ok)]" /> : <Copy size={11} />}
                                <span>{copied ? t('Copied', 'Kopyalandı') : t('Copy', 'Kopyala')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownloadCsv(); }}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--line)] transition-all cursor-pointer"
                            >
                                <Download size={11} />
                                <span>CSV</span>
                            </button>
                            <ChevronDown size={15} className={`text-[var(--alu-dim)] transition-transform duration-200 ${isTableExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {isTableExpanded && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-[var(--bg-0)] text-[var(--alu-dim)] border-b border-[var(--line)]">
                                        <th className="px-3 py-2 font-bold">{t('Parameter Name', 'Parametre Adı')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Symbol', 'Sembol')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Pinion (1)', 'Pinyon (1)')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Gear (2)', 'Çark (2)')}</th>
                                        <th className="px-2 py-2 font-bold text-center">{t('Unit', 'Birim')}</th>
                                        <th className="px-3 py-2 font-bold text-center">{t('Standard / Formula', 'Standart / Formül')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--line)]/50">
                                    {dataRows.map((row, idx) => {
                                        const isSelected = selectedDim === row.dimKey;
                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => setSelectedDim(isSelected ? null : (row.dimKey || null))}
                                                className={`transition-all duration-150 select-none cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[var(--cyan)]/20 text-cyan-100 font-bold shadow-[inset_0_0_12px_rgba(58,208,230,0.2)]'
                                                        : row.highlight
                                                        ? 'bg-[var(--cyan)]/5 hover:bg-white/[0.04]'
                                                        : 'hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                    {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />}
                                                    <span className={isSelected ? 'text-cyan-300' : 'text-gray-200'}>{row.label}</span>
                                                </td>
                                                <td className="px-2 py-1.5 text-center text-[var(--cyan)] font-bold">{row.sym}</td>
                                                <td className="px-3 py-1.5 text-center text-white font-bold">{row.v1}</td>
                                                <td className="px-3 py-1.5 text-center text-white font-bold">{row.v2}</td>
                                                <td className="px-2 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.unit}</td>
                                                <td className="px-3 py-1.5 text-center text-[var(--alu-dim)] text-[10px]">{row.std}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function KhkScrewGearView(props: CommonViewProps) {
    return (
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5 p-2">
            <div className="2xl:col-span-4 space-y-3">
                <KhkScrewControls {...props} />
            </div>
            <div className="2xl:col-span-8 space-y-4">
                <KhkScrewView {...props} />
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// 5. KHK INTERNAL GEAR INTERFERENCE DIAGNOSTICS BANNER
// ═════════════════════════════════════════════════════════════════════════

export function KhkInternalInterferenceBanner({
    moduleVal,
    pinionTeeth,
    ringTeeth,
    isTr,
    currentLang,
}: {
    moduleVal: number;
    pinionTeeth: number;
    ringTeeth: number;
    isTr?: boolean;
    currentLang?: string;
}) {
    const t = (en: string, tr: string) => t12(currentLang, en, tr);
    const diag = calculateKhkInternalGear({
        module: moduleVal,
        pinionTeeth,
        ringTeeth,
        pressureAngleDeg: 20,
    });

    const involuteMsg = diag.involuteInterference.hasInterference
        ? t('Involute Interference Risk (Tip to root interference - KHK Eq 4.2)', 'İnvolüt Girişimi Riski (Diş kökü ile temas hatası - KHK Eq 4.2)')
        : t('No Involute Interference (Safe)', 'İnvolüt Girişimi Yok (Güvenli)');

    const trochoidMsg = diag.trochoidInterference.hasInterference
        ? `${t('Trochoid Interference: Insufficient tooth difference', 'Trochoid Girişimi: Diş farkı yetersiz')} (z₂ - z₁ = ${diag.trochoidInterference.actualToothDiff} < ${diag.trochoidInterference.minToothDiffRequired})`
        : t('No Trochoid Interference (Safe)', 'Trochoid Girişimi Yok (Güvenli)');

    const trimmingMsg = diag.trimmingInterference.hasInterference
        ? `${t('Trimming Interference: Axial assembly required', 'Trimming Girişimi: Eksenel montaj gereklidir')} (Δz < ${diag.trimmingInterference.minTeethForRadialAssembly})`
        : t('Suitable for Radial & Axial Assembly', 'Radyal ve Eksenel Montaja Uygun');

    return (
        <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] font-mono text-[11px] space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--line)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[var(--cyan)]" />
                    {t('KHK INTERNAL GEAR INTERFERENCE AUDIT', 'KHK İÇ DİŞLİ GİRİŞİM & MONTAJ DENETİMİ')}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    diag.isSafeForAssembly
                        ? 'bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/40'
                        : 'bg-[var(--bad)]/20 text-[var(--bad)] border border-[var(--bad)]/40'
                }`}>
                    {diag.isSafeForAssembly ? t('✓ ZERO INTERFERENCE / SAFE', '✓ GİRİŞİMSİZ / GÜVENLİ') : t('⚠ INTERFERENCE DETECTED', '⚠ GİRİŞİM RİSKİ VAR')}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                <div className={`p-2 rounded-lg border ${
                    diag.involuteInterference.hasInterference ? 'bg-[var(--bad)]/10 border-[var(--bad)]/30 text-[var(--bad)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-gray-300'
                }`}>
                    <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{t('1. Involute Interference:', '1. İnvolüt Girişimi:')}</span>
                    <span className="font-bold">{involuteMsg}</span>
                </div>

                <div className={`p-2 rounded-lg border ${
                    diag.trochoidInterference.hasInterference ? 'bg-[var(--bad)]/10 border-[var(--bad)]/30 text-[var(--bad)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-gray-300'
                }`}>
                    <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{t('2. Trochoid Interference:', '2. Trochoid Girişimi:')}</span>
                    <span className="font-bold">{trochoidMsg}</span>
                </div>

                <div className={`p-2 rounded-lg border ${
                    diag.trimmingInterference.hasInterference ? 'bg-[var(--warn)]/10 border-[var(--warn)]/30 text-[var(--warn)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-gray-300'
                }`}>
                    <span className="text-[8.5px] text-[var(--alu-dim)] block uppercase">{t('3. Trimming Interference:', '3. Trimming Girişimi:')}</span>
                    <span className="font-bold">{trimmingMsg}</span>
                </div>
            </div>
        </div>
    );
}
