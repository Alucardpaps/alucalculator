'use client';

import React, { useMemo } from 'react';
import { DimLine, FrameDefs, LegendPanel, openDriveLayout, openDrivePath, toothedWheelPath, useFrameIds } from './techframe-utils';

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

function PulleyGraphic({
    cx, cy, rPitch, rBody, z, stroke, isTiming, isV, grooveScale, ids,
}: {
    cx: number; cy: number; rPitch: number; rBody: number; z?: number;
    stroke: string; isTiming: boolean; isV: boolean; grooveScale: number;
    ids: ReturnType<typeof useFrameIds>;
}) {
    if (isTiming && z != null && z >= 6) {
        return (
            <g>
                <path
                    d={toothedWheelPath(cx, cy, rPitch, rBody, z)}
                    fill={`url(#${ids.metal})`}
                    stroke={stroke}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                <circle cx={cx} cy={cy} r={rBody * 0.35} fill="#0a1420" stroke="#334155" strokeWidth="0.8" />
                <circle cx={cx} cy={cy} r={rPitch} fill="none" stroke={stroke} strokeWidth="0.7" strokeDasharray="5,4" opacity="0.45" />
            </g>
        );
    }
    return (
        <g>
            <circle cx={cx} cy={cy} r={rPitch} fill={`url(#${ids.metal})`} stroke={stroke} strokeWidth="1.4" />
            <circle cx={cx} cy={cy} r={rPitch * 0.32} fill="#0a1420" stroke="#334155" strokeWidth="0.8" />
            {isV && (
                <circle cx={cx} cy={cy} r={rPitch * grooveScale} fill="none" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="4,3" opacity="0.65" />
            )}
        </g>
    );
}

export function BeltDriveBlueprint(props: BeltDriveBlueprintProps) {
    const {
        d1, d2, od1, od2, z1, z2, centerDist, centerDistTarget, beltType = 'classical-v', rpm1 = 1450, rpm2,
        beltVelocity, beltLength, arcOfContact, T1, T2, showLegend = true,
    } = props;
    const ids = useFrameIds('belt');
    const isTiming = beltType === 'timing';
    const isV = beltType.includes('v') || beltType === 'poly-v';
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
    const thetaDeg = arcOfContact ?? (beltRun ? (beltRun.thetaRad * 180) / Math.PI : 0);
    const panelW = showLegend ? 520 : W - 24;
    const stdLabel = isTiming ? 'ISO 13050' : 'ISO 5291';
    const beltStroke = isTiming ? '#22d3ee' : '#fbbf24';
    const cNote = isTiming && centerDistTarget != null && Math.abs(C - centerDistTarget) > 0.5
        ? ` · C = ${C.toFixed(1)} mm (hedef ${centerDistTarget.toFixed(0)})`
        : ` · C = ${C.toFixed(0)} mm`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <FrameDefs ids={ids} />
            <style>{`
                @keyframes beltFlow { to { stroke-dashoffset: -24; } }
                @media (prefers-reduced-motion: reduce) {
                    .belt-flow { animation: none !important; }
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

            <PulleyGraphic
                cx={layout.cx1} cy={layout.cy} rPitch={layout.sr1} rBody={rBody1}
                z={z1} stroke="#00e5ff" isTiming={isTiming} isV={isV} grooveScale={0.62} ids={ids}
            />
            <PulleyGraphic
                cx={layout.cx2} cy={layout.cy} rPitch={layout.sr2} rBody={rBody2}
                z={z2} stroke="#8b5cf6" isTiming={isTiming} isV={isV} grooveScale={0.62} ids={ids}
            />

            {beltRun && (
                <>
                    <path d={beltRun.d} fill="none" stroke={beltStroke} strokeWidth={isTiming ? 3.2 : 4} opacity="0.12" strokeLinecap="round" />
                    <path
                        className="belt-flow"
                        d={beltRun.d}
                        fill="none"
                        stroke={beltStroke}
                        strokeWidth={isTiming ? 2.4 : 2.8}
                        strokeDasharray={isTiming ? '6,10' : '14,10'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.92"
                        style={{ animation: 'beltFlow 2.4s linear infinite' }}
                    />
                </>
            )}

            <text x={layout.cx1} y={layout.cy - layout.sr1 - 14} textAnchor="middle" fontSize="10" fill="#00e5ff" fontWeight="700" fontFamily="ui-monospace, monospace">
                {isTiming && z1 != null ? `z1 = ${z1}` : `d1 = ${D1.toFixed(0)}`}
            </text>
            {isTiming && (
                <>
                    <text x={layout.cx1} y={layout.cy - layout.sr1 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">
                        dp = {D1.toFixed(1)} mm
                    </text>
                    <text x={layout.cx1} y={layout.cy - layout.sr1 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">
                        Do = {Do1.toFixed(1)} mm
                    </text>
                </>
            )}

            <text x={layout.cx2} y={layout.cy - layout.sr2 - 14} textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="700" fontFamily="ui-monospace, monospace">
                {isTiming && z2 != null ? `z2 = ${z2}` : `d2 = ${D2.toFixed(0)}`}
            </text>
            {isTiming && (
                <>
                    <text x={layout.cx2} y={layout.cy - layout.sr2 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">
                        dp = {D2.toFixed(1)} mm
                    </text>
                    <text x={layout.cx2} y={layout.cy - layout.sr2 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">
                        Do = {Do2.toFixed(1)} mm
                    </text>
                </>
            )}

            {T1 != null && T1 > 0 && (
                <g transform={`translate(${(layout.cx1 + layout.cx2) / 2}, ${layout.cy + layout.sr2 + 18})`}>
                    <line x1={-40} y1={0} x2={40} y2={0} stroke="#10b981" strokeWidth="1.5" markerStart="url(#tf-arrow)" markerEnd="url(#tf-arrow)" />
                    <text x={0} y={-6} textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="700" fontFamily="ui-monospace, monospace">T1 = {T1.toFixed(0)} N</text>
                </g>
            )}

            <DimLine x1={layout.cx1} y1={layout.cy + layout.sr2 + 48} x2={layout.cx2} y2={layout.cy + layout.sr2 + 48} label={`C = ${layout.Cmm.toFixed(0)} mm`} color="#f59e0b" />

            {showLegend && (
                <LegendPanel x={556} y={56} title="RESULTS" rows={[
                    { label: 'Input rpm n1', value: `${rpm1.toFixed(0)} rpm` },
                    ...(rpm2 != null ? [{ label: 'Output rpm n2', value: `${rpm2.toFixed(0)} rpm` }] : []),
                    { label: 'Belt velocity v', value: beltVelocity != null ? `${beltVelocity.toFixed(2)} m/s` : '-', highlight: true },
                    { label: 'Pitch length L', value: beltLength != null ? `${beltLength.toFixed(0)} mm` : '-' },
                    { label: 'Wrap angle', value: `${thetaDeg.toFixed(1)} deg` },
                    ...(T2 != null ? [{ label: 'Slack tension T2', value: `${T2.toFixed(0)} N` }] : []),
                    ...(T1 != null ? [{ label: 'Tight tension T1', value: `${T1.toFixed(0)} N`, highlight: true }] : []),
                ]} />
            )}
        </svg>
    );
}

export default BeltDriveBlueprint;
