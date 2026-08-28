'use client';

import React, { useMemo } from 'react';
import { DimLine, FrameDefs, LegendPanel, openDriveLayout, openDrivePath, toothedWheelPath, useFrameIds } from './techframe-utils';
import { useI18nStore } from '@/store/i18nStore';

export interface BeltDriveBlueprintProps {
    d1: number;
    d2: number;
    od1?: number;
    od2?: number;
    z1?: number;
    z2?: number;
    centerDist: number;
    centerDistTarget?: number;
    beltType?: string;
    rpm1?: number;
    rpm2?: number;
    beltVelocity?: number;
    beltLength?: number;
    arcOfContact?: number;
    T1?: number;
    T2?: number;
    showLegend?: boolean;
}

const COPY: Record<string, Record<string, string>> = {
    en: {
        results: 'RESULTS',
        n1: 'Input rpm n1',
        n2: 'Output rpm n2',
        v: 'Belt velocity v',
        L: 'Pitch length L',
        wrap: 'Wrap angle',
        t2: 'Slack tension T2',
        t1: 'Tight tension T1',
        tight: 'TIGHT T1',
        slack: 'SLACK T2',
        target: 'target',
    },
    tr: {
        results: 'SONUÇLAR',
        n1: 'Giriş n1',
        n2: 'Çıkış n2',
        v: 'Kayış hızı v',
        L: 'Hatve boyu L',
        wrap: 'Sarım açısı',
        t2: 'Boş kol T2',
        t1: 'Gergin kol T1',
        tight: 'GERGİN T1',
        slack: 'BOŞ T2',
        target: 'hedef',
    },
};

function PulleyGraphic({
    cx, cy, rPitch, rBody, z, stroke, isTiming, isV, isPoly, grooveScale, ids, rpm = 1450, isDriven = false, ratio = 1,
}: {
    cx: number; cy: number; rPitch: number; rBody: number; z?: number;
    stroke: string; isTiming: boolean; isV: boolean; isPoly: boolean; grooveScale: number;
    ids: ReturnType<typeof useFrameIds>; rpm?: number; isDriven?: boolean; ratio?: number;
}) {
    const actualRpm = isDriven ? (rpm / Math.max(ratio, 0.1)) : rpm;
    const dur = actualRpm > 0 ? (60 / actualRpm) * 12 : 0;
    const animStyle = dur > 0 ? {
        transformOrigin: `${cx}px ${cy}px`,
        transformBox: 'view-box' as const,
        animation: `pulleySpin ${dur}s linear infinite${isDriven ? ' reverse' : ''}`,
    } : {};

    const flange = rPitch * 1.08;
    const rim = Math.max(rBody * 0.92, rPitch * 0.88);

    if (isTiming && z != null && z >= 6) {
        return (
            <g style={animStyle}>
                <path d={toothedWheelPath(cx, cy, rPitch, rim, z)} fill={`url(#${ids.metal})`} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
                <circle cx={cx} cy={cy} r={rPitch} fill="none" stroke={stroke} strokeWidth="0.7" strokeDasharray="5,4" opacity="0.45" />
                <circle cx={cx} cy={cy} r={rim * 0.38} fill="#0a1420" stroke="#334155" strokeWidth="0.9" />
                {[0, 120, 240].map((deg) => {
                    const a = (deg * Math.PI) / 180;
                    return <line key={deg} x1={cx + Math.cos(a) * rim * 0.38} y1={cy + Math.sin(a) * rim * 0.38} x2={cx + Math.cos(a) * rim * 0.72} y2={cy + Math.sin(a) * rim * 0.72} stroke={stroke} strokeWidth="1.1" opacity="0.35" />;
                })}
                <circle cx={cx} cy={cy} r={2} fill={stroke} />
            </g>
        );
    }
    return (
        <g style={animStyle}>
            <circle cx={cx} cy={cy} r={flange} fill="none" stroke={stroke} strokeWidth="1.6" opacity="0.55" />
            <circle cx={cx} cy={cy} r={rPitch} fill={`url(#${ids.metal})`} stroke={stroke} strokeWidth="1.4" />
            {isV && (
                <>
                    <circle cx={cx} cy={cy} r={rPitch * grooveScale} fill="none" stroke="#f59e0b" strokeWidth="2.2" opacity="0.8" />
                    <circle cx={cx} cy={cy} r={rPitch * (grooveScale - 0.06)} fill="none" stroke="#78350f" strokeWidth="1.1" opacity="0.7" />
                </>
            )}
            {isPoly && [0.52, 0.58, 0.64, 0.7].map((g) => (
                <circle key={g} cx={cx} cy={cy} r={rPitch * g} fill="none" stroke="#fbbf24" strokeWidth="0.7" opacity="0.55" />
            ))}
            <circle cx={cx} cy={cy} r={rPitch * 0.32} fill="#0a1420" stroke="#334155" strokeWidth="0.8" />
            <rect x={cx - 2} y={cy - rPitch * 0.32 - 5} width="4" height="5" fill={stroke} opacity="0.65" />
            {[0, 120, 240].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return <line key={deg} x1={cx + Math.cos(a) * rPitch * 0.32} y1={cy + Math.sin(a) * rPitch * 0.32} x2={cx + Math.cos(a) * rPitch * 0.72} y2={cy + Math.sin(a) * rPitch * 0.72} stroke={stroke} strokeWidth="1" opacity="0.35" />;
            })}
            <circle cx={cx} cy={cy} r={2} fill={stroke} />
        </g>
    );
}

export function BeltDriveBlueprint(props: BeltDriveBlueprintProps) {
    const {
        d1, d2, od1, od2, z1, z2, centerDist, centerDistTarget, beltType = 'classical-v', rpm1 = 1450, rpm2,
        beltVelocity, beltLength, arcOfContact, T1, T2, showLegend = true,
    } = props;
    const { language } = useI18nStore();
    const t = COPY[language] ?? COPY.en;
    const ids = useFrameIds('belt');
    const isTiming = beltType === 'timing';
    const isV = beltType.includes('v') && beltType !== 'poly-v';
    const isPoly = beltType === 'poly-v';
    const isCogged = beltType === 'cogged-v';
    const D1 = Math.max(10, d1);
    const D2 = Math.max(10, d2);
    const Do1 = od1 != null && od1 > 0 ? od1 : D1 * 0.94;
    const Do2 = od2 != null && od2 > 0 ? od2 : D2 * 0.94;
    const C = Math.max(centerDist, (D1 + D2) / 2);

    const W = showLegend ? 760 : 1040;
    const H = showLegend ? 400 : 460;
    const rightReserve = showLegend ? 230 : 48;

    const layout = useMemo(
        () => openDriveLayout(D1, D2, C, W, H, rightReserve, 0.36),
        [D1, D2, C, W, H, rightReserve],
    );

    const rBody1 = (Do1 / 2) * layout.scale;
    const rBody2 = (Do2 / 2) * layout.scale;
    const beltRun = openDrivePath(layout.cx1, layout.cy, layout.sr1, layout.cx2, layout.sr2);
    const beltOuter = openDrivePath(layout.cx1, layout.cy, layout.sr1 + (isV ? 5 : 3.2), layout.cx2, layout.sr2 + (isV ? 5 : 3.2));
    const thetaDeg = arcOfContact ?? (beltRun ? (beltRun.thetaRad * 180) / Math.PI : 0);
    const panelW = showLegend ? 520 : W - 24;
    const stdLabel = isTiming ? 'ISO 13050' : 'ISO 5291';
    const beltStroke = isTiming ? '#22d3ee' : '#fbbf24';
    const cNote = isTiming && centerDistTarget != null && Math.abs(C - centerDistTarget) > 0.5
        ? ` · C = ${C.toFixed(1)} mm (${t.target} ${centerDistTarget.toFixed(0)})`
        : ` · C = ${C.toFixed(0)} mm`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <FrameDefs ids={ids} />
            <style>{`
                @keyframes beltFlow { to { stroke-dashoffset: -28; } }
                @keyframes pulleySpin { to { transform: rotate(360deg); } }
                @media (prefers-reduced-motion: reduce) {
                    .belt-flow, [style*="pulleySpin"] { animation: none !important; }
                }
            `}</style>
            <rect width={W} height={H} fill="#040810" rx="8" />
            <rect width={W} height={H} fill={`url(#${ids.grid})`} />
            <text x={20} y={28} fontSize="13" fontWeight="700" fill="#f59e0b" fontFamily="ui-monospace, monospace">
                {beltType.toUpperCase().replace(/-/g, ' ')} DRIVE
            </text>
            <text x={20} y={44} fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">
                {stdLabel} · pitch line{cNote}
                {beltLength != null ? ` · L = ${beltLength.toFixed(0)} mm` : ''}
            </text>
            <rect x={16} y={56} width={panelW} height={H - 72} rx={8} fill="rgba(0,0,0,0.35)" stroke="rgba(245,158,11,0.18)" strokeWidth="1" />

            {beltOuter && beltRun && (
                <path d={`${beltOuter.d} ${beltRun.d}`} fill={isTiming ? 'rgba(34,211,238,0.16)' : 'rgba(251,191,36,0.18)'} opacity="0.9" fillRule="evenodd" />
            )}

            <PulleyGraphic
                cx={layout.cx1} cy={layout.cy} rPitch={layout.sr1} rBody={rBody1}
                z={z1} stroke="#00e5ff" isTiming={isTiming} isV={isV} isPoly={isPoly} grooveScale={0.62} ids={ids}
                rpm={rpm1} isDriven={false} ratio={1}
            />
            <PulleyGraphic
                cx={layout.cx2} cy={layout.cy} rPitch={layout.sr2} rBody={rBody2}
                z={z2} stroke="#8b5cf6" isTiming={isTiming} isV={isV} isPoly={isPoly} grooveScale={0.62} ids={ids}
                rpm={rpm1} isDriven={true} ratio={D2 / D1}
            />

            {beltRun && (
                <path
                    className="belt-flow"
                    d={beltRun.d}
                    fill="none"
                    stroke={beltStroke}
                    strokeWidth={isTiming ? 2.2 : isCogged ? 2.6 : 3.2}
                    strokeDasharray={isTiming ? '4,8' : isCogged ? '6,4,2,4' : isPoly ? '10,4' : '16,8'}
                    strokeLinecap="round"
                    opacity="0.95"
                    style={{ animation: 'beltFlow 2.2s linear infinite' }}
                />
            )}

            <text x={layout.cx1} y={layout.cy - layout.sr1 - 14} textAnchor="middle" fontSize="10" fill="#00e5ff" fontWeight="700" fontFamily="ui-monospace, monospace">
                {isTiming && z1 != null ? `z1 = ${z1}` : `d1 = ${D1.toFixed(0)}`}
            </text>
            {isTiming && (
                <>
                    <text x={layout.cx1} y={layout.cy - layout.sr1 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {D1.toFixed(1)} mm</text>
                    <text x={layout.cx1} y={layout.cy - layout.sr1 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">Do = {Do1.toFixed(1)} mm</text>
                </>
            )}
            <text x={layout.cx2} y={layout.cy - layout.sr2 - 14} textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="700" fontFamily="ui-monospace, monospace">
                {isTiming && z2 != null ? `z2 = ${z2}` : `d2 = ${D2.toFixed(0)}`}
            </text>
            {isTiming && (
                <>
                    <text x={layout.cx2} y={layout.cy - layout.sr2 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {D2.toFixed(1)} mm</text>
                    <text x={layout.cx2} y={layout.cy - layout.sr2 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">Do = {Do2.toFixed(1)} mm</text>
                </>
            )}

            <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy + Math.max(layout.sr1, layout.sr2) + 16} textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="700" fontFamily="ui-monospace, monospace">
                {t.tight}{T1 != null ? ` = ${T1.toFixed(0)} N` : ''}
            </text>
            <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy - Math.max(layout.sr1, layout.sr2) - 8} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">
                {t.slack}{T2 != null ? ` = ${T2.toFixed(0)} N` : ''}
            </text>

            <g transform={`translate(${layout.cx1 - layout.sr1 - 18}, ${layout.cy})`}>
                <path d={`M 0 ${-layout.sr1 * 0.55} A ${layout.sr1 + 14} ${layout.sr1 + 14} 0 0 0 0 ${layout.sr1 * 0.55}`} fill="none" stroke="#38bdf8" strokeWidth="1.1" strokeDasharray="3 3" />
                <text x={-6} y={4} textAnchor="end" fontSize="8" fill="#38bdf8" fontFamily="ui-monospace, monospace">θ={thetaDeg.toFixed(0)}°</text>
            </g>

            <DimLine x1={layout.cx1} y1={layout.cy + layout.sr2 + 48} x2={layout.cx2} y2={layout.cy + layout.sr2 + 48} label={`C = ${layout.Cmm.toFixed(0)} mm`} color="#f59e0b" />

            {showLegend && (
                <LegendPanel x={556} y={56} title={t.results} rows={[
                    { label: t.n1, value: `${rpm1.toFixed(0)} rpm` },
                    ...(rpm2 != null ? [{ label: t.n2, value: `${rpm2.toFixed(0)} rpm` }] : []),
                    { label: t.v, value: beltVelocity != null ? `${beltVelocity.toFixed(2)} m/s` : '-', highlight: true },
                    { label: t.L, value: beltLength != null ? `${beltLength.toFixed(0)} mm` : '-' },
                    { label: t.wrap, value: `${thetaDeg.toFixed(1)} deg` },
                    ...(T2 != null ? [{ label: t.t2, value: `${T2.toFixed(0)} N` }] : []),
                    ...(T1 != null ? [{ label: t.t1, value: `${T1.toFixed(0)} N`, highlight: true }] : []),
                ]} />
            )}
        </svg>
    );
}

export default BeltDriveBlueprint;
