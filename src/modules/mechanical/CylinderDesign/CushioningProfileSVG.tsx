/**
 * modules/mechanical/CylinderDesign/CushioningProfileSVG.tsx
 * 
 * Interactive End-of-Stroke Cushioning Deceleration Profile & Pressure Spike Graph
 * Conforms to ISO 6020-2 / DIN 24554 cushioning dynamics standards.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { Sliders, Activity, ShieldCheck, AlertTriangle, Wind, Gauge } from 'lucide-react';
import { t12 } from '@/locales/t12';

interface CushioningProfileSVGProps {
    cushionSpearDiaMm: number;
    cushionLengthMm: number;
    approachSpeedMPerSec: number;
    movingMassKg: number;
    operatingPressureBar: number;
    peakPressureBar: number;
    kineticEnergyJoules: number;
    baseDecelerationMPerSec2: number;
    basePeakPressureBar: number;
    portSize: string;
    portFluidVelocityMPerSec: number;
    portVelocityRating: 'optimal' | 'moderate' | 'high_loss';
    reynoldsNumber: number;
    hasCushioningFront: boolean;
    hasCushioningRear: boolean;
    language: string;
}

export function CushioningProfileSVG({
    cushionSpearDiaMm,
    cushionLengthMm,
    approachSpeedMPerSec,
    movingMassKg,
    operatingPressureBar,
    peakPressureBar,
    kineticEnergyJoules,
    baseDecelerationMPerSec2,
    basePeakPressureBar,
    portSize,
    portFluidVelocityMPerSec,
    portVelocityRating,
    reynoldsNumber,
    hasCushioningFront,
    hasCushioningRear,
    language
}: CushioningProfileSVGProps) {
    // Adjustable throttle needle orifice opening: 10% (tight choke) to 100% (wide open)
    const [needleOpeningPct, setNeedleOpeningPct] = useState<number>(35);

    // Cushioning physics scaling based on needle throttle opening
    // Throttle factor: smaller opening -> sharper deceleration, higher pressure spike
    const throttleFactor = 1 / Math.max(0.1, needleOpeningPct / 50);

    const effectiveDeceleration = useMemo(() => {
        return Math.max(0.1, baseDecelerationMPerSec2 * Math.pow(throttleFactor, 0.7));
    }, [baseDecelerationMPerSec2, throttleFactor]);

    const effectivePeakPressure = useMemo(() => {
        return Math.min(peakPressureBar * 2.2, Math.max(operatingPressureBar, basePeakPressureBar * Math.pow(throttleFactor, 0.85)));
    }, [operatingPressureBar, basePeakPressureBar, peakPressureBar, throttleFactor]);

    // Deceleration g-force: a / 9.81
    const gForce = (effectiveDeceleration / 9.81).toFixed(2);

    // Cushioning duration: t_c ≈ 2 * l_c / (v_0 + v_end) in milliseconds
    const cushionDurationMs = Math.round(((2 * (cushionLengthMm / 1000)) / (approachSpeedMPerSec + 0.02)) * 1000 / Math.pow(throttleFactor, 0.4));

    // Permissible pressure threshold: 1.5 * p_oper
    const permissiblePressureBar = Math.round(operatingPressureBar * 1.5);
    const isPressureSafe = effectivePeakPressure <= permissiblePressureBar;

    // SVG coordinates
    const width = 640;
    const height = 240;
    const padL = 60;
    const padR = 60;
    const padT = 30;
    const padB = 40;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Points along the cushion stroke x from 0 to cushionLengthMm
    const steps = 40;
    const { velocityPath, pressurePath, peakPoint } = useMemo(() => {
        const vPoints: [number, number][] = [];
        const pPoints: [number, number][] = [];
        let maxP = 0;
        let maxPt: [number, number] = [0, 0];

        const maxV = Math.max(0.15, approachSpeedMPerSec * 1.25);
        const maxPScale = Math.max(permissiblePressureBar * 1.25, effectivePeakPressure * 1.15);

        for (let i = 0; i <= steps; i++) {
            const frac = i / steps; // 0 = entrance, 1 = end of stroke
            const xMm = frac * cushionLengthMm;
            const xPx = padL + frac * plotW;

            // Deceleration curve: exponential / smooth S-decay
            const vVal = approachSpeedMPerSec * Math.pow(1 - frac, 1.35 * Math.pow(throttleFactor, 0.4)) + 0.01;
            const yVPx = padT + plotH - (vVal / maxV) * plotH;
            vPoints.push([xPx, yVPx]);

            // Pressure spike profile: rises as fluid is forced through closing spear annular gap
            // and peaks near middle-to-late deceleration before leveling off
            const spearPenetration = Math.sin(frac * Math.PI * 0.95);
            const dynamicPressureRise = (effectivePeakPressure - operatingPressureBar) * Math.pow(spearPenetration, 1.4);
            const pVal = operatingPressureBar + dynamicPressureRise;

            if (pVal > maxP) {
                maxP = pVal;
                maxPt = [xPx, padT + plotH - (pVal / maxPScale) * plotH];
            }

            const yPPx = padT + plotH - (pVal / maxPScale) * plotH;
            pPoints.push([xPx, yPPx]);
        }

        const buildSvgPath = (pts: [number, number][]) => {
            return pts.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`, '');
        };

        return {
            velocityPath: buildSvgPath(vPoints),
            pressurePath: buildSvgPath(pPoints),
            peakPoint: maxPt
        };
    }, [approachSpeedMPerSec, cushionLengthMm, effectivePeakPressure, operatingPressureBar, permissiblePressureBar, plotH, plotW, throttleFactor]);

    // Permissible pressure limit line Y
    const maxPScale = Math.max(permissiblePressureBar * 1.25, effectivePeakPressure * 1.15);
    const permissibleLineY = padT + plotH - (permissiblePressureBar / maxPScale) * plotH;

    return (
        <div className="w-full rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] p-3.5 space-y-3 font-mono">
            {/* Header & Status Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                        <Activity size={14} className="text-[var(--cyan)]" />
                        {t12(language, 'End-of-Stroke Cushioning & Pressure Spike Dynamics (ISO 6020-2)', 'Strok Sonu Yastıklama Yavaşlama & Basınç Tepe Dinamiği (ISO 6020-2)')}
                    </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded border font-bold ${
                        isPressureSafe 
                            ? 'bg-[var(--ok)]/10 border-[var(--ok)]/30 text-[var(--ok)]' 
                            : 'bg-[var(--bad)]/10 border-[var(--bad)]/30 text-[var(--bad)]'
                    }`}>
                        {isPressureSafe ? t12(language, 'PRESSURE SAFE', 'BASINÇ GÜVENLİ') : t12(language, 'PRESSURE SPIKE WARNING', 'AŞIRI BASINÇ UYARISI')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)]">
                        Spear: Ø{cushionSpearDiaMm} x {cushionLengthMm} mm
                    </span>
                </div>
            </div>

            {/* Interactive Throttle Needle Adjustment Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-xs">
                <div className="flex items-center gap-2">
                    <Sliders size={13} className="text-[var(--warn)]" />
                    <span className="text-[var(--alu-dim)] font-bold">
                        {t12(language, 'Cushion Needle Throttle Valve Opening:', 'Yastıklama İğne Valfi Kısma Açıklığı:')}
                    </span>
                    <span className="text-[var(--cyan)] font-bold">{needleOpeningPct}%</span>
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-xs">
                    <span className="text-[10px] text-[var(--alu-dim)]">10% ({t12(language, 'Hard', 'Sert')})</span>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={needleOpeningPct}
                        onChange={(e) => setNeedleOpeningPct(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-[var(--bg-0)] rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <span className="text-[10px] text-[var(--alu-dim)]">100% ({t12(language, 'Soft', 'Yumuşak')})</span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                    <div>
                        <span className="text-[var(--alu-dim)]">{t12(language, 'Peak Cushion p:', 'Tepe Yastıklama p:')} </span>
                        <span className={`font-bold ${isPressureSafe ? 'text-[var(--cyan)]' : 'text-[var(--bad)]'}`}>
                            {effectivePeakPressure.toFixed(1)} bar
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--alu-dim)]">{t12(language, 'Decel a:', 'Yavaşlama İvmesi a:')} </span>
                        <span className="text-white font-bold">{effectiveDeceleration.toFixed(2)} m/s² ({gForce} g)</span>
                    </div>
                    <div>
                        <span className="text-[var(--alu-dim)]">{t12(language, 'Time t_c:', 'Süre t_c:')} </span>
                        <span className="text-[var(--ok)] font-bold">{cushionDurationMs} ms</span>
                    </div>
                </div>
            </div>

            {/* SVG Graph Canvas */}
            <div className="relative w-full overflow-hidden rounded bg-[var(--bg-0)] border border-[var(--line)]">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto block select-none"
                    style={{ maxHeight: '250px' }}
                >
                    <defs>
                        {/* Shaded Area Gradients */}
                        <linearGradient id="cushionPressureGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--warn)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--warn)" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="cushionVelocityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                        const y = padT + frac * plotH;
                        return (
                            <line
                                key={`hgrid-${idx}`}
                                x1={padL}
                                y1={y}
                                x2={padL + plotW}
                                y2={y}
                                stroke="var(--line)"
                                strokeWidth="0.5"
                                strokeDasharray="3 3"
                            />
                        );
                    })}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                        const x = padL + frac * plotW;
                        return (
                            <line
                                key={`vgrid-${idx}`}
                                x1={x}
                                y1={padT}
                                x2={x}
                                y2={padT + plotH}
                                stroke="var(--line)"
                                strokeWidth="0.5"
                                strokeDasharray="3 3"
                            />
                        );
                    })}

                    {/* Permissible Pressure Limit Line (1.5 x p_oper) */}
                    <line
                        x1={padL}
                        y1={permissibleLineY}
                        x2={padL + plotW}
                        y2={permissibleLineY}
                        stroke="var(--bad)"
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                    />
                    <text
                        x={padL + plotW - 6}
                        y={permissibleLineY - 4}
                        fill="var(--bad)"
                        fontSize="9"
                        textAnchor="end"
                        fontWeight="bold"
                    >
                        {t12(language, 'Permissible Limit (1.5 · p_oper = ', 'İzin Verilen Limit (1.5 · p_oper = ')}{permissiblePressureBar} bar)
                    </text>

                    {/* Curve 1: Deceleration Velocity v(x) (Cyan) */}
                    <path
                        d={velocityPath}
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Curve 2: Cushion Chamber Pressure Spike p(x) (Amber) */}
                    <path
                        d={pressurePath}
                        fill="none"
                        stroke="var(--warn)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Peak Pressure Callout Point */}
                    <circle
                        cx={peakPoint[0]}
                        cy={peakPoint[1]}
                        r="4"
                        fill="var(--warn)"
                        stroke="var(--bg-0)"
                        strokeWidth="1.5"
                    />
                    <rect
                        x={peakPoint[0] - 56}
                        y={Math.max(padT + 2, peakPoint[1] - 22)}
                        width="112"
                        height="16"
                        rx="3"
                        fill="var(--bg-0)"
                        stroke="var(--warn)"
                        strokeWidth="0.8"
                    />
                    <text
                        x={peakPoint[0]}
                        y={Math.max(padT + 2, peakPoint[1] - 22) + 11.5}
                        fill="var(--warn)"
                        fontSize="8.5"
                        textAnchor="middle"
                        fontWeight="bold"
                    >
                        p_peak = {effectivePeakPressure.toFixed(1)} bar
                    </text>

                    {/* Axes */}
                    <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--alu-dim)" strokeWidth="1" />
                    <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="var(--alu-dim)" strokeWidth="1" />
                    <line x1={padL + plotW} y1={padT} x2={padL + plotW} y2={padT + plotH} stroke="var(--alu-dim)" strokeWidth="1" />

                    {/* Left Axis Labels: Velocity (m/s) in Cyan */}
                    <text x={padL - 6} y={padT + 4} fill="var(--cyan)" fontSize="9" textAnchor="end" fontWeight="bold">
                        {approachSpeedMPerSec.toFixed(2)} m/s
                    </text>
                    <text x={padL - 6} y={padT + plotH / 2} fill="var(--cyan)" fontSize="8" textAnchor="end">
                        {(approachSpeedMPerSec / 2).toFixed(2)}
                    </text>
                    <text x={padL - 6} y={padT + plotH} fill="var(--cyan)" fontSize="8" textAnchor="end">
                        0.00
                    </text>
                    <text
                        x={18}
                        y={padT + plotH / 2}
                        fill="var(--cyan)"
                        fontSize="9"
                        fontWeight="bold"
                        transform={`rotate(-90 18 ${padT + plotH / 2})`}
                        textAnchor="middle"
                    >
                        {t12(language, 'Approach Velocity v (m/s)', 'İlerleme Hızı v (m/s)')}
                    </text>

                    {/* Right Axis Labels: Pressure (bar) in Amber */}
                    <text x={padL + plotW + 6} y={padT + 4} fill="var(--warn)" fontSize="9" textAnchor="start" fontWeight="bold">
                        {Math.round(maxPScale)} bar
                    </text>
                    <text x={padL + plotW + 6} y={padT + plotH / 2} fill="var(--warn)" fontSize="8" textAnchor="start">
                        {Math.round(maxPScale / 2)}
                    </text>
                    <text x={padL + plotW + 6} y={padT + plotH} fill="var(--warn)" fontSize="8" textAnchor="start">
                        0
                    </text>
                    <text
                        x={width - 15}
                        y={padT + plotH / 2}
                        fill="var(--warn)"
                        fontSize="9"
                        fontWeight="bold"
                        transform={`rotate(90 ${width - 15} ${padT + plotH / 2})`}
                        textAnchor="middle"
                    >
                        {t12(language, 'Cushion Pressure p_c (bar)', 'Yastıklama Basıncı p_c (bar)')}
                    </text>

                    {/* Bottom Axis Labels: Cushion Stroke Position (mm) */}
                    <text x={padL} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">
                        0 mm ({t12(language, 'Entrance', 'Giriş')})
                    </text>
                    <text x={padL + plotW / 2} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">
                        {Math.round(cushionLengthMm / 2)} mm
                    </text>
                    <text x={padL + plotW} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">
                        {cushionLengthMm} mm ({t12(language, 'Full Stop', 'Tam Durma')})
                    </text>
                    <text x={padL + plotW / 2} y={height - 6} fill="var(--alu-dim)" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {t12(language, 'Cushion Penetration Stroke x (mm)', 'Yastıklama Mızrağı İlerleme Mesafesi x (mm)')}
                    </text>

                    {/* Legend */}
                    <g transform={`translate(${padL + 12}, ${padT + 8})`}>
                        <rect x="0" y="0" width="220" height="20" rx="3" fill="var(--bg-1)" fillOpacity="0.85" stroke="var(--line)" strokeWidth="0.5" />
                        <line x1="10" y1="10" x2="26" y2="10" stroke="var(--cyan)" strokeWidth="2.5" />
                        <text x="32" y="13" fill="var(--cyan)" fontSize="8" fontWeight="bold">v(x) {t12(language, 'Deceleration', 'Hız Sönümü')}</text>
                        <line x1="110" y1="10" x2="126" y2="10" stroke="var(--warn)" strokeWidth="2.5" />
                        <text x="132" y="13" fill="var(--warn)" fontSize="8" fontWeight="bold">p_c(x) {t12(language, 'Peak Pressure', 'Tepe Basıncı')}</text>
                    </g>
                </svg>
            </div>

            {/* Bottom Row: Fluid Flow Velocity & Reynolds Regime Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Port Flow Velocity */}
                <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--alu-dim)] font-bold flex items-center gap-1.5">
                            <Gauge size={12} className="text-[var(--cyan)]" />
                            {t12(language, 'Port Fluid Velocity (ISO 6149):', 'Port Akışkan Hızı (ISO 6149):')}
                        </span>
                        <span className="text-white font-bold">{portFluidVelocityMPerSec.toFixed(2)} m/s ({portSize})</span>
                    </div>
                    {/* Visual Meter */}
                    <div className="w-full bg-[var(--bg-0)] h-2 rounded-full overflow-hidden flex">
                        <div
                            className={`h-full transition-all duration-300 ${
                                portFluidVelocityMPerSec <= 4.5 
                                    ? 'bg-[var(--ok)]' 
                                    : portFluidVelocityMPerSec <= 6.0 
                                        ? 'bg-[var(--warn)]' 
                                        : 'bg-[var(--bad)]'
                            }`}
                            style={{ width: `${Math.min(100, (portFluidVelocityMPerSec / 8.0) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--alu-dim)]">
                        <span>0 m/s ({t12(language, 'Low', 'Düşük')})</span>
                        <span className={portFluidVelocityMPerSec <= 4.5 ? 'text-[var(--ok)] font-bold' : 'text-[var(--warn)] font-bold'}>
                            {portVelocityRating === 'optimal' ? t12(language, 'Ideal (<= 4.5 m/s)', 'İdeal (<= 4.5 m/s)') : t12(language, 'Moderate / Pressure Loss Present', 'Orta / Basınç Kaybı Var')}
                        </span>
                        <span>8.0 m/s ({t12(language, 'Limit', 'Limit')})</span>
                    </div>
                </div>

                {/* Reynolds Flow Regime */}
                <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--alu-dim)] font-bold flex items-center gap-1.5">
                            <Wind size={12} className="text-[var(--std)]" />
                            {t12(language, 'Reynolds Number & Flow Regime:', 'Reynolds Sayısı & Akış Rejimi:')}
                        </span>
                        <span className="text-[var(--cyan)] font-bold">Re = {Math.round(reynoldsNumber)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded border font-bold ${
                            reynoldsNumber < 2300 
                                ? 'bg-[var(--ok)]/10 border-[var(--ok)]/30 text-[var(--ok)]' 
                                : reynoldsNumber < 4000
                                    ? 'bg-[var(--warn)]/10 border-[var(--warn)]/30 text-[var(--warn)]'
                                    : 'bg-[var(--bad)]/10 border-[var(--bad)]/30 text-[var(--bad)]'
                        }`}>
                            {reynoldsNumber < 2300 ? t12(language, 'Laminar Flow (Re < 2300)', 'Laminer Akış (Re < 2300)') : reynoldsNumber < 4000 ? t12(language, 'Transition Zone (2300-4000)', 'Geçiş Bölgesi (2300-4000)') : t12(language, 'Turbulent Flow (Re > 4000)', 'Türbülanslı Akış (Re > 4000)')}
                        </span>
                        <span className="text-[var(--alu-dim)]">
                            {t12(language, 'Kinetic E_k:', 'Kinetik E_k:')} {kineticEnergyJoules.toFixed(1)} J ({t12(language, 'Mass:', 'Kütle:')} {movingMassKg} kg)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
