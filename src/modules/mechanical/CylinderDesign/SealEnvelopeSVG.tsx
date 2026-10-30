/**
 * modules/mechanical/CylinderDesign/SealEnvelopeSVG.tsx
 * 
 * Interactive Sealing Architecture & PV Operating Envelope Visualizer
 * Conforms to ISO 7425-1, ISO 7425-2, and Kastaş / Parker Sealing Standards.
 */

'use client';

import React, { useMemo } from 'react';
import { formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { Droplets, ShieldCheck, AlertTriangle, Layers, Activity } from 'lucide-react';
import { t12 } from '@/locales/t12';

interface SealEnvelopeSVGProps {
    pistonSealType: 'K16' | 'K21' | 'K40';
    rodSealType: 'K33' | 'K35';
    wiperType: 'K01' | 'K03';
    operatingPressureBar: number;
    rodSpeedMPerSec: number;
    boreD: number;
    rodD: number;
    sealingBOM: {
        rodSeal: string;
        wiperSeal: string;
        pistonSeal: string;
        pistonGuideRings: string;
        internalRodORing: string;
        tubeGlandORing: string;
        backupRing: string;
    };
    language: string;
}

export function SealEnvelopeSVG({
    pistonSealType,
    rodSealType,
    wiperType,
    operatingPressureBar,
    rodSpeedMPerSec,
    boreD,
    rodD,
    sealingBOM,
    language
}: SealEnvelopeSVGProps) {
    // Material operating limits
    // PU9401: 400 bar, 0.5 m/s
    // NBR 80: 250 bar, 0.5 m/s
    // PTFE Bronze: 500 bar, 5.0 m/s
    const maxPlotP = 450; // bar
    const maxPlotV = 1.0; // m/s

    // SVG coordinates for PV Chart
    const width = 640;
    const height = 240;
    const padL = 60;
    const padR = 30;
    const padT = 30;
    const padB = 40;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const getX = (v: number) => padL + (Math.min(maxPlotV, v) / maxPlotV) * plotW;
    const getY = (p: number) => padT + plotH - (Math.min(maxPlotP, p) / maxPlotP) * plotH;

    // Active operating point
    const activeX = getX(rodSpeedMPerSec);
    const activeY = getY(operatingPressureBar);

    // Is operating point within PU9401 envelope?
    const isSafePU = operatingPressureBar <= 400 && rodSpeedMPerSec <= 0.5;

    // ISO 7425 groove dimensions
    const grooveData = useMemo(() => {
        // ISO 7425-1 Piston seal groove
        const pistonGrooveID = boreD - 15;
        const pistonGrooveWidth = 12.5;

        // ISO 7425-2 Rod seal groove
        const rodGrooveOD = rodD + 10;
        const rodGrooveWidth = 8.0;

        // Max extrusion gap
        const maxExtrusionGap = operatingPressureBar <= 160 ? 0.25 : 0.15;

        return {
            pistonGrooveID,
            pistonGrooveWidth,
            rodGrooveOD,
            rodGrooveWidth,
            maxExtrusionGap
        };
    }, [boreD, operatingPressureBar, rodD]);

    return (
        <div className="w-full rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] p-3.5 space-y-3 font-mono">
            {/* Header & Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                        <Droplets size={14} className="text-[var(--cyan)]" />
                        {t12(language, 'Kastaş & Parker Sealing Pack Architecture & PV Operating Envelope', 'Kastaş & Parker Sızdırmazlık Paketi Mimarisi & PV Çalışma Zarfı')}
                    </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded border font-bold ${
                        isSafePU 
                            ? 'bg-[var(--ok)]/10 border-[var(--ok)]/30 text-[var(--ok)]' 
                            : 'bg-[var(--warn)]/10 border-[var(--warn)]/30 text-[var(--warn)]'
                    }`}>
                        {isSafePU ? t12(language, 'WITHIN SEAL ENVELOPE (SAFE)', 'SIZDIRMAZLIK ZARFI İÇİNDE (UYGUN)') : t12(language, 'CHECK PV LIMITS', 'PV LİMİTLERİNİ KONTROL ET')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)]">
                        ISO 7425-1 / ISO 7425-2
                    </span>
                </div>
            </div>

            {/* Split Section: Seal Cross-Section Diagram + PV Operating Envelope */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* 1. Dynamic Seal Package Architectural Preview (SVG) */}
                <div className="p-3 rounded bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-xs">
                        <span className="font-bold text-[var(--cyan)] flex items-center gap-1.5">
                            <Layers size={13} /> {t12(language, 'Gland & Piston Seal Configuration', 'Boğaz & Piston Sızdırmazlık Paketi')}
                        </span>
                        <span className="text-[10px] text-[var(--alu-dim)]">Ø{boreD} / Ø{rodD} mm</span>
                    </div>

                    {/* Schematic Seal Pack Layout */}
                    <div className="relative w-full h-[180px] flex flex-col justify-around py-1 text-xs">
                        {/* Rod Seal Package Row */}
                        <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-white font-bold text-[11px] flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[var(--cyan)] inline-block" />
                                    {t12(language, 'Rod Gland Package:', 'Boğaz Paketi (Rod Gland Package):')}
                                </span>
                                <span className="text-[10px] text-[var(--cyan)] font-bold">Kastaş {rodSealType} + {wiperType}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-[10px] text-[var(--alu-dim)] pt-0.5">
                                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                    <div className="text-white font-bold">{wiperType} {t12(language, 'Wiper', 'Sıyırıcı')}</div>
                                    <div>PU9401 / {t12(language, 'Metal Case', 'Metal Kafes')}</div>
                                    <div className="text-[var(--cyan)]">{t12(language, 'Dirt Exclusion', 'Dış Toz Önleme')}</div>
                                </div>
                                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                    <div className="text-white font-bold">{rodSealType} {t12(language, 'Asymmetric Seal', 'Asimetrik Keçe')}</div>
                                    <div>PU9401 (400 bar)</div>
                                    <div className="text-[var(--ok)]">{t12(language, 'Dynamic Twin Lip', 'Dinamik Çift Dudak')}</div>
                                </div>
                                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                    <div className="text-white font-bold">K40 {t12(language, 'Guide Strip', 'Yataklama Bandı')}</div>
                                    <div>POM {t12(language, 'Thermoplastic', 'Termoplastik')}</div>
                                    <div className="text-[var(--warn)]">p_max 40 N/mm²</div>
                                </div>
                            </div>
                        </div>

                        {/* Piston Seal Package Row */}
                        <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-white font-bold text-[11px] flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[var(--warn)] inline-block" />
                                    {t12(language, 'Piston Seal Package:', 'Piston Paketi (Piston Seal Package):')}
                                </span>
                                <span className="text-[10px] text-[var(--warn)] font-bold">Kastaş {pistonSealType} {t12(language, 'Compact Set', 'Kompakt Set')}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-[10px] text-[var(--alu-dim)] pt-0.5">
                                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                    <div className="text-white font-bold">K16 {t12(language, 'NBR Ring', 'NBR Halka')}</div>
                                    <div>Elastomer NBR 80</div>
                                    <div className="text-[var(--cyan)]">{t12(language, 'Double-Acting Pressure', 'Çift Yönlü Basınç')}</div>
                                </div>
                                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                    <div className="text-white font-bold">2x {t12(language, 'Backup Ring', 'Destek Halkası')}</div>
                                    <div>Hytrel / TPE</div>
                                    <div className="text-[var(--ok)]">{t12(language, 'Prevents Gap Extrusion', 'Yarığa Akma Önler')}</div>
                                </div>
                                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                                    <div className="text-white font-bold">2x K40 {t12(language, 'Guide Ring', 'Yataklama')}</div>
                                    <div>POM {t12(language, 'Glass Filled', 'Cam Elyaf Katkı')}</div>
                                    <div className="text-[var(--warn)]">{t12(language, 'Zero Metal Contact', 'Ters Metal Sürtünme Yok')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Interactive Pressure vs Velocity (P-V) Operating Envelope (SVG) */}
                <div className="p-3 rounded bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-xs">
                        <span className="font-bold text-[var(--warn)] flex items-center gap-1.5">
                            <Activity size={13} /> {t12(language, 'Pressure-Velocity (P-V) Operating Envelope', 'Basınç-Hız (P-V) Çalışma Zarfı')}
                        </span>
                        <span className="text-[10px] text-[var(--alu-dim)]">PU9401 / NBR / PTFE</span>
                    </div>

                    <div className="relative w-full overflow-hidden rounded bg-[var(--bg-0)]">
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            className="w-full h-auto block select-none"
                            style={{ maxHeight: '180px' }}
                        >
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                                const y = padT + frac * plotH;
                                return (
                                    <line
                                        key={`pv-hgrid-${idx}`}
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
                                        key={`pv-vgrid-${idx}`}
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

                            {/* PU9401 Limit Box: 400 bar, 0.5 m/s */}
                            <rect
                                x={padL}
                                y={getY(400)}
                                width={getX(0.5) - padL}
                                height={plotH - (getY(400) - padT)}
                                fill="var(--cyan)"
                                fillOpacity="0.12"
                                stroke="var(--cyan)"
                                strokeWidth="1.2"
                                strokeDasharray="4 2"
                            />
                            <text x={getX(0.5) - 4} y={getY(400) + 12} fill="var(--cyan)" fontSize="8" textAnchor="end" fontWeight="bold">
                                {t12(language, 'PU9401 Envelope (400 bar · 0.5 m/s)', 'PU9401 Zarfı (400 bar · 0.5 m/s)')}
                            </text>

                            {/* NBR 80 Limit Box: 250 bar, 0.5 m/s */}
                            <rect
                                x={padL}
                                y={getY(250)}
                                width={getX(0.5) - padL}
                                height={plotH - (getY(250) - padT)}
                                fill="var(--warn)"
                                fillOpacity="0.08"
                                stroke="var(--warn)"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                            />
                            <text x={getX(0.5) - 4} y={getY(250) + 12} fill="var(--warn)" fontSize="8" textAnchor="end">
                                {t12(language, 'NBR 80 Envelope (250 bar)', 'NBR 80 Zarfı (250 bar)')}
                            </text>

                            {/* Axes */}
                            <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--alu-dim)" strokeWidth="1" />
                            <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="var(--alu-dim)" strokeWidth="1" />

                            {/* Y Axis Labels (Pressure) */}
                            <text x={padL - 6} y={padT + 4} fill="var(--alu-dim)" fontSize="8" textAnchor="end">450 bar</text>
                            <text x={padL - 6} y={getY(300)} fill="var(--alu-dim)" fontSize="8" textAnchor="end">300</text>
                            <text x={padL - 6} y={getY(150)} fill="var(--alu-dim)" fontSize="8" textAnchor="end">150</text>
                            <text x={padL - 6} y={padT + plotH} fill="var(--alu-dim)" fontSize="8" textAnchor="end">0</text>
                            <text
                                x={18}
                                y={padT + plotH / 2}
                                fill="var(--alu)"
                                fontSize="9"
                                fontWeight="bold"
                                transform={`rotate(-90 18 ${padT + plotH / 2})`}
                                textAnchor="middle"
                            >
                                {t12(language, 'Pressure p (bar)', 'Basınç p (bar)')}
                            </text>

                            {/* X Axis Labels (Velocity) */}
                            <text x={padL} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">0.0</text>
                            <text x={getX(0.25)} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">0.25</text>
                            <text x={getX(0.5)} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">0.50 m/s</text>
                            <text x={getX(0.75)} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">0.75</text>
                            <text x={padL + plotW} y={height - 18} fill="var(--alu-dim)" fontSize="8" textAnchor="middle">1.0 m/s</text>
                            <text x={padL + plotW / 2} y={height - 6} fill="var(--alu)" fontSize="9" fontWeight="bold" textAnchor="middle">
                                {t12(language, 'Rod Stroke Velocity v (m/s)', 'Mil İlerleme Hızı v (m/s)')}
                            </text>

                            {/* Live Operating Point Reticle */}
                            <line
                                x1={activeX}
                                y1={padT}
                                x2={activeX}
                                y2={padT + plotH}
                                stroke="var(--cyan)"
                                strokeWidth="0.8"
                                strokeDasharray="3 3"
                            />
                            <line
                                x1={padL}
                                y1={activeY}
                                x2={padL + plotW}
                                y2={activeY}
                                stroke="var(--cyan)"
                                strokeWidth="0.8"
                                strokeDasharray="3 3"
                            />
                            <circle
                                cx={activeX}
                                cy={activeY}
                                r="5"
                                fill="var(--cyan)"
                                stroke="var(--bg-0)"
                                strokeWidth="2"
                                className="animate-pulse"
                            />
                            {/* Callout box (Adaptive flip & Y clamp prevents axis/tick collisions) */}
                            {(() => {
                                const boxW = 136;
                                const boxH = 24;
                                const calloutX = activeX + boxW + 10 > padL + plotW ? activeX - boxW - 8 : activeX + 8;
                                const calloutY = Math.min(padT + plotH - boxH - 4, Math.max(padT + 4, activeY - boxH / 2));
                                return (
                                    <g transform={`translate(${Math.max(padL + 4, calloutX)}, ${calloutY})`}>
                                        <rect x="0" y="0" width={boxW} height={boxH} rx="3" fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth="1" />
                                        <text x="6" y="10" fill="var(--ink)" fontSize="8" fontWeight="bold">
                                            {t12(language, 'Active:', 'Aktif:')} {operatingPressureBar} bar · {rodSpeedMPerSec.toFixed(2)} m/s
                                        </text>
                                        <text x="6" y="20" fill={isSafePU ? 'var(--ok)' : 'var(--warn)'} fontSize="7" fontWeight="bold">
                                            {isSafePU ? t12(language, '✓ Seal Envelope Ideal', '✓ Sızdırmazlık Zarfı İdeal') : t12(language, '⚠ High Speed / Thermal Load', '⚠ Yüksek Hız / Termal Yük')}
                                        </text>
                                    </g>
                                );
                            })()}
                        </svg>
                    </div>
                </div>
            </div>

            {/* Bottom: ISO 7425/1 & ISO 7425/2 Machining Groove Dimension Table */}
            <div className="p-3 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                    <span className="font-bold text-[var(--std)] flex items-center gap-1.5">
                        <ShieldCheck size={13} /> {t12(language, 'ISO 7425 Seal Groove Machining Dimensions & Extrusion Gap Tolerance', 'ISO 7425 Keçe Yuvası Talaşlı İmalat Ölçüleri & Yarık Açıklığı')}
                    </span>
                    <span className="text-[10px] text-[var(--alu-dim)]">ISO 7425-1 (Piston) / ISO 7425-2 (Boğaz)</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <div className="text-[var(--alu-dim)]">{t12(language, 'Rod Gland Groove OD (D_1):', 'Boğaz Yuvası Dış Çapı (D_1):')}</div>
                        <div className="text-white font-bold">Ø{grooveData.rodGrooveOD} mm (H9: +0.062/0)</div>
                        <div className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Groove Width:', 'Yuva Genişliği:')} {grooveData.rodGrooveWidth} mm (+0.2/0)</div>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <div className="text-[var(--alu-dim)]">{t12(language, 'Piston Groove ID (d_1):', 'Piston Yuvası İç Çapı (d_1):')}</div>
                        <div className="text-white font-bold">Ø{grooveData.pistonGrooveID} mm (h9: 0/-0.062)</div>
                        <div className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Groove Width:', 'Yuva Genişliği:')} {grooveData.pistonGrooveWidth} mm (+0.2/0)</div>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <div className="text-[var(--alu-dim)]">{t12(language, 'Max Permissible Gap (e_max):', 'İzin Verilen Azami Yarık (e_max):')}</div>
                        <div className="text-[var(--cyan)] font-bold">{grooveData.maxExtrusionGap} mm ({t12(language, 'Radial', 'Radyal')})</div>
                        <div className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Extrusion prevented by backup ring', 'Destek halkası ile akma önlenir')}</div>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <div className="text-[var(--alu-dim)]">{t12(language, 'Groove Surface Roughness:', 'Yuva Yüzey Pürüzlülüğü:')}</div>
                        <div className="text-[var(--ok)] font-bold">Ra ≤ 0.40 µm · Rz ≤ 1.6 µm</div>
                        <div className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Bearing Area Ratio Rmr: 50%-70%', 'Yataklama Payı Rmr: %50-%70')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
