/**
 * modules/mechanical/CylinderDesign/BucklingCurveSVG.tsx
 * 
 * Interactive Euler & Tetmajer Buckling Curve SVG Diagram (ISO/TR 10461 / DIN 2413)
 * Renders the critical buckling load/stress vs. slenderness ratio (λ)
 * and highlights the active cylinder operating point and safety zone.
 */

'use client';

import React, { useMemo } from 'react';
import { formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { t12 } from '@/locales/t12';

interface BucklingCurveSVGProps {
    slendernessRatio: number;
    transitionSlenderness: number;
    criticalForceKN: number;
    appliedForceKN: number;
    safetyFactor: number;
    rodDiameterD: number;
    bucklingLengthLk: number;
    bucklingRegime: 'euler_elastic' | 'tetmajer_inelastic';
    language: string;
}

export function BucklingCurveSVG({
    slendernessRatio,
    transitionSlenderness,
    criticalForceKN,
    appliedForceKN,
    safetyFactor,
    rodDiameterD,
    bucklingLengthLk,
    bucklingRegime,
    language
}: BucklingCurveSVGProps) {
    // SVG Viewport coordinate bounds
    const width = 640;
    const height = 260;
    const padL = 65;
    const padR = 25;
    const padT = 30;
    const padB = 40;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Slenderness range: 10 to 180
    const minLambda = 10;
    const maxLambda = Math.max(180, Math.ceil((slendernessRatio + 30) / 20) * 20);

    // Critical stress at yield: ~350-450 MPa
    const maxStress = 450;
    const minStress = 0;

    // Helper functions for mapping data to SVG pixels
    const getX = (lam: number) => padL + ((lam - minLambda) / (maxLambda - minLambda)) * plotW;
    const getY = (sigma: number) => padT + plotH - ((sigma - minStress) / (maxStress - minStress)) * plotH;

    // Calculate curve points
    const { pathD, transitionX, currentPoint, admPathD } = useMemo(() => {
        const points: { x: number; y: number }[] = [];
        const admPoints: { x: number; y: number }[] = [];
        const lamG = transitionSlenderness || 89;
        const E = 210000; // MPa for steel
        const Rp = 350; // Yield strength approx

        const step = 2;
        for (let lam = minLambda; lam <= maxLambda; lam += step) {
            let sigmaK: number;
            if (lam < lamG) {
                // Tetmajer inelastic: linear degradation from Rp
                sigmaK = Rp - ((Rp - 200) / lamG) * lam;
            } else {
                // Euler elastic: pi^2 * E / lambda^2
                sigmaK = (Math.PI * Math.PI * E) / (lam * lam);
            }
            sigmaK = Math.max(10, Math.min(maxStress, sigmaK));
            const x = getX(lam);
            const y = getY(sigmaK);
            points.push({ x, y });

            // Permissible stress with SF = 3.5
            const sigmaAdm = sigmaK / 3.5;
            admPoints.push({ x, y: getY(sigmaAdm) });
        }

        const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
        const admPathD = admPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

        // Current operating point
        const curLam = Math.min(maxLambda, Math.max(minLambda, slendernessRatio));
        const rodAreaMm2 = (Math.PI * rodDiameterD * rodDiameterD) / 4;
        const curAppliedStress = (appliedForceKN * 1000) / (rodAreaMm2 || 1);
        const curCritStress = (criticalForceKN * 1000) / (rodAreaMm2 || 1);

        const curX = getX(curLam);
        const curY = getY(Math.min(maxStress, curAppliedStress));
        const critY = getY(Math.min(maxStress, curCritStress));

        return {
            pathD,
            admPathD,
            transitionX: getX(lamG),
            currentPoint: {
                x: curX,
                appliedY: curY,
                critY,
                appliedStress: curAppliedStress,
                critStress: curCritStress
            }
        };
    }, [slendernessRatio, transitionSlenderness, maxLambda, appliedForceKN, criticalForceKN, rodDiameterD]);

    const isSafe = safetyFactor >= 3.5;

    return (
        <div className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] p-3 space-y-2 select-none font-mono">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-1.5 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--cyan)] " />
                    <span className="font-bold text-white uppercase tracking-wider">
                        {t12(language, 'Euler & Tetmajer Buckling Characteristic', 'Euler & Tetmajer Burkulma Karakteristiği')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--std)]/15 text-[var(--std)] border border-[var(--std)]/30">
                        ISO/TR 10461
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                    <div>
                        <span className="text-[var(--alu-dim)]">λ = </span>
                        <span className="text-[var(--cyan)] font-bold">{slendernessRatio.toFixed(1)}</span>
                    </div>
                    <div>
                        <span className="text-[var(--alu-dim)]">λ_g = </span>
                        <span className="text-[var(--warn)] font-bold">{transitionSlenderness.toFixed(1)}</span>
                    </div>
                    <div className="px-2 py-0.5 rounded text-[10px] font-bold border" style={{
                        backgroundColor: isSafe ? 'rgba(61, 214, 140, 0.15)' : 'rgba(232, 93, 93, 0.15)',
                        borderColor: isSafe ? 'rgba(61, 214, 140, 0.4)' : 'rgba(232, 93, 93, 0.4)',
                        color: isSafe ? 'var(--ok)' : 'var(--bad)'
                    }}>
                        SF = {safetyFactor.toFixed(2)} ({isSafe ? t12(language, 'SAFE', 'GÜVENLİ') : t12(language, 'RISK', 'RİSKLİ')})
                    </div>
                </div>
            </div>

            {/* SVG Plot */}
            <div className="w-full overflow-x-auto custom-scrollbar">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[500px] max-h-[260px] bg-[var(--bg-0)]/80 rounded border border-[var(--line)]/50"
                >
                    <defs>
                        {/* Grid pattern */}
                        <pattern id="bucklingGrid" width="40" height="25" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 25" fill="none" stroke="var(--line)" strokeWidth="0.5" strokeOpacity="0.4" />
                        </pattern>
                        {/* Shading gradients */}
                        <linearGradient id="tetmajerGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#e6b84a" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#e6b84a" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="eulerGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3ad0e6" stopOpacity="0.02" />
                            <stop offset="100%" stopColor="#3ad0e6" stopOpacity="0.08" />
                        </linearGradient>
                    </defs>

                    {/* Grid background */}
                    <rect x={padL} y={padT} width={plotW} height={plotH} fill="url(#bucklingGrid)" />

                    {/* Region Shading */}
                    <rect x={padL} y={padT} width={Math.max(0, transitionX - padL)} height={plotH} fill="url(#tetmajerGrad)" />
                    <rect x={transitionX} y={padT} width={Math.max(0, width - padR - transitionX)} height={plotH} fill="url(#eulerGrad)" />

                    {/* Transition demarcation line (lambda_g) */}
                    <line
                        x1={transitionX}
                        y1={padT}
                        x2={transitionX}
                        y2={height - padB}
                        stroke="var(--warn)"
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                    />
                    <text
                        x={transitionX + 4}
                        y={padT + 14}
                        fill="var(--warn)"
                        fontSize="9"
                        fontWeight="bold"
                    >
                        λ_g = {transitionSlenderness.toFixed(1)} ({t12(language, 'Transition Limit', 'Geçiş Sınırı')})
                    </text>

                    {/* Zone Labels */}
                    <text
                        x={padL + (transitionX - padL) / 2}
                        y={height - padB - 10}
                        textAnchor="middle"
                        fill="var(--alu-dim)"
                        fontSize="10"
                        fontWeight="bold"
                        opacity="0.6"
                    >
                        {t12(language, 'Tetmajer Inelastic Zone (λ < λ_g)', 'Tetmajer İnelastik Bölge (λ < λ_g)')}
                    </text>
                    <text
                        x={transitionX + (width - padR - transitionX) / 2}
                        y={height - padB - 10}
                        textAnchor="middle"
                        fill="var(--alu-dim)"
                        fontSize="10"
                        fontWeight="bold"
                        opacity="0.6"
                    >
                        {t12(language, 'Euler Elastic Zone (λ ≥ λ_g)', 'Euler Elastik Bölge (λ ≥ λ_g)')}
                    </text>

                    {/* Critical Buckling Curve (F_k / sigma_k) */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth="2.5"
                    />

                    {/* Permissible Limit Curve (SF = 3.5) */}
                    <path
                        d={admPathD}
                        fill="none"
                        stroke="var(--ok)"
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                    />

                    {/* Working Point Vertical Margin Line */}
                    <line
                        x1={currentPoint.x}
                        y1={currentPoint.appliedY}
                        x2={currentPoint.x}
                        y2={currentPoint.critY}
                        stroke={isSafe ? 'var(--ok)' : 'var(--bad)'}
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                    />

                    {/* Critical point marker */}
                    <circle
                        cx={currentPoint.x}
                        cy={currentPoint.critY}
                        r="4"
                        fill="var(--bg-0)"
                        stroke="var(--cyan)"
                        strokeWidth="2"
                    />

                    {/* Active operating point marker */}
                    <circle
                        cx={currentPoint.x}
                        cy={currentPoint.appliedY}
                        r="6"
                        fill={isSafe ? 'var(--ok)' : 'var(--bad)'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-pulse"
                    />

                    {/* Operating Point Callout Tag (Adaptive left/right flip & Y clamp prevents axis/tick collisions) */}
                    {(() => {
                        const boxW = 146;
                        const boxH = 34;
                        const calloutX = currentPoint.x + boxW + 12 > width - padR
                            ? currentPoint.x - boxW - 8
                            : currentPoint.x + 8;
                        const calloutY = Math.min(
                            height - padB - boxH - 4,
                            Math.max(padT + 4, currentPoint.appliedY - boxH / 2)
                        );
                        return (
                            <g transform={`translate(${Math.max(padL + 4, calloutX)}, ${calloutY})`}>
                                <rect
                                    x="0"
                                    y="0"
                                    width={boxW}
                                    height={boxH}
                                    rx="3"
                                    fill="var(--bg-2)"
                                    stroke={isSafe ? 'var(--ok)' : 'var(--bad)'}
                                    strokeWidth="1"
                                />
                                <text x="6" y="13" fill="#ffffff" fontSize="9" fontWeight="bold">
                                    {t12(language, 'Operating Load:', 'Çalışma Yükü:')} {appliedForceKN.toFixed(1)} kN
                                </text>
                                <text x="6" y="27" fill={isSafe ? 'var(--ok)' : 'var(--bad)'} fontSize="9" fontWeight="bold">
                                    F_k = {criticalForceKN.toFixed(1)} kN · SF = {safetyFactor.toFixed(2)}
                                </text>
                            </g>
                        );
                    })()}

                    {/* X & Y Axes */}
                    <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="var(--line-strong)" strokeWidth="1.5" />
                    <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="var(--line-strong)" strokeWidth="1.5" />

                    {/* X Axis Ticks & Labels */}
                    {[20, 40, 60, 80, 100, 120, 140, 160, 180].filter(l => l <= maxLambda).map(val => {
                        const x = getX(val);
                        return (
                            <g key={val}>
                                <line x1={x} y1={height - padB} x2={x} y2={height - padB + 4} stroke="var(--line-strong)" strokeWidth="1" />
                                <text x={x} y={height - padB + 16} textAnchor="middle" fill="var(--alu-dim)" fontSize="9">
                                    {val}
                                </text>
                            </g>
                        );
                    })}
                    <text x={width - padR} y={height - padB + 28} textAnchor="end" fill="var(--alu-dim)" fontSize="10" fontWeight="bold">
                        {t12(language, 'Slenderness Ratio (λ)', 'Narinlik Oranı (λ)')}
                    </text>

                    {/* Y Axis Ticks & Labels */}
                    {[0, 100, 200, 300, 400].map(val => {
                        const y = getY(val);
                        return (
                            <g key={val}>
                                <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="var(--line-strong)" strokeWidth="1" />
                                <text x={padL - 8} y={y + 3} textAnchor="end" fill="var(--alu-dim)" fontSize="9">
                                    {val}
                                </text>
                            </g>
                        );
                    })}
                    <text x={padL - 8} y={padT - 10} textAnchor="start" fill="var(--alu-dim)" fontSize="10" fontWeight="bold">
                        σ_k (MPa)
                    </text>
                </svg>
            </div>

            {/* Bottom Legend & Standard Note */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[var(--alu-dim)]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-[var(--cyan)]" />
                        <span>{t12(language, 'Critical Stress σ_k (Euler / Tetmajer)', 'Kritik Gerilme σ_k (Euler / Tetmajer)')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-[var(--ok)] border-t border-dashed" />
                        <span>{t12(language, 'Permissible Limit (SF=3.5)', 'İzin Verilen Emniyetli Sınır (SF=3.5)')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isSafe ? 'var(--ok)' : 'var(--bad)' }} />
                        <span>{t12(language, 'Active State', 'Mevcut Durum')}</span>
                    </div>
                </div>
                <div className="text-[10px]">
                    <span>
                        {bucklingRegime === 'euler_elastic' 
                            ? t12(language, 'In Euler elastic buckling regime', 'Euler elastik burkulma rejiminde') 
                            : t12(language, 'In Tetmajer inelastic buckling regime', 'Tetmajer plastik burkulma rejiminde')}
                        {', '}Lk = <strong className="text-white">{bucklingLengthLk} mm</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
