'use client';

import React, { useMemo } from 'react';
import { DimLine, FrameDefs, LegendPanel, openDriveLayout, openDrivePath, toothedWheelPath, useFrameIds } from './techframe-utils';

export interface ChainDriveBlueprintProps {
    z1: number;
    z2: number;
    pitch: number;
    centerDist: number;
    rpm1?: number;
    ratio?: number;
    rpm2?: number;
    chainVelocity?: number;
    chainLength?: number;
    chainTension?: number;
    d1?: number;
    d2?: number;
    od1?: number;
    od2?: number;
    chainType?: string;
    showLegend?: boolean;
}

function pitchDiameter(p: number, z: number) {
    return p / Math.sin(Math.PI / z);
}

export function ChainDriveBlueprint(props: ChainDriveBlueprintProps) {
    const {
        z1, z2, pitch, centerDist, rpm1 = 1450, ratio, rpm2, chainVelocity, chainLength,
        chainTension, d1: d1In, d2: d2In, od1: od1In, od2: od2In, chainType = 'roller-simplex', showLegend = true,
    } = props;
    const ids = useFrameIds('chain');
    const z1v = Math.max(11, z1);
    const z2v = Math.max(11, z2);
    const p = Math.max(4, pitch);
    const C = Math.max(50, centerDist);

    const W = showLegend ? 760 : 1040;
    const H = showLegend ? 400 : 460;
    const rightReserve = showLegend ? 230 : 48;

    const layout = useMemo(() => {
        const d1mm = d1In ?? pitchDiameter(p, z1v);
        const d2mm = d2In ?? pitchDiameter(p, z2v);
        const od1mm = od1In ?? d1mm * 1.08;
        const od2mm = od2In ?? d2mm * 1.08;
        const base = openDriveLayout(d1mm, d2mm, C, W, H, rightReserve, 0.36);
        const srPitch1 = base.sr1;
        const srPitch2 = base.sr2;
        const srTip1 = (od1mm / 2) * base.scale;
        const srTip2 = (od2mm / 2) * base.scale;
        return { ...base, d1: d1mm, d2: d2mm, od1: od1mm, od2: od2mm, srPitch1, srPitch2, srTip1, srTip2 };
    }, [z1v, z2v, p, C, d1In, d2In, od1In, od2In, W, H, rightReserve]);

    const chainRun = openDrivePath(layout.cx1, layout.cy, layout.srPitch1, layout.cx2, layout.srPitch2);
    const iVal = ratio ?? z2v / z1v;
    const panelW = showLegend ? 520 : W - 24;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <FrameDefs ids={ids} />
            <style>{`
                @keyframes chainRun { to { stroke-dashoffset: -22; } }
                @media (prefers-reduced-motion: reduce) {
                    .chain-run { animation: none !important; }
                }
            `}</style>
            <rect width={W} height={H} fill="#040810" rx="8" />
            <rect width={W} height={H} fill={`url(#${ids.grid})`} />
            <text x={20} y={28} fontSize="13" fontWeight="700" fill="#00e5ff" fontFamily="ui-monospace, monospace">ROLLER CHAIN DRIVE</text>
            <text x={20} y={44} fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">
                {chainType.toUpperCase()} · p = {p.toFixed(3)} mm · C = {C.toFixed(0)} mm
                {chainLength != null ? ` · L = ${chainLength.toFixed(0)} mm` : ''}
            </text>
            <rect x={16} y={56} width={panelW} height={H - 72} rx={8} fill="rgba(0,0,0,0.35)" stroke="rgba(0,229,255,0.15)" strokeWidth="1" />

            <path
                d={toothedWheelPath(layout.cx1, layout.cy, layout.srTip1, layout.srPitch1 * 0.88, z1v)}
                fill={`url(#${ids.metal})`}
                stroke="#00e5ff"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1 * 0.28} fill="#0a1420" stroke="#334155" />
            <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1} fill="none" stroke="#00e5ff" strokeWidth="0.7" strokeDasharray="5,4" opacity="0.4" />

            <path
                d={toothedWheelPath(layout.cx2, layout.cy, layout.srTip2, layout.srPitch2 * 0.88, z2v, Math.PI / z2v)}
                fill={`url(#${ids.metal})`}
                stroke="#8b5cf6"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <circle cx={layout.cx2} cy={layout.cy} r={layout.srPitch2 * 0.28} fill="#0a1420" stroke="#334155" />
            <circle cx={layout.cx2} cy={layout.cy} r={layout.srPitch2} fill="none" stroke="#8b5cf6" strokeWidth="0.7" strokeDasharray="5,4" opacity="0.4" />

            {chainRun && (
                <>
                    <path d={chainRun.d} fill="none" stroke="#00e5ff" strokeWidth="3.5" opacity="0.1" strokeLinecap="round" />
                    <path
                        className="chain-run"
                        d={chainRun.d}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2"
                        strokeDasharray="8,9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ animation: 'chainRun 2.2s linear infinite' }}
                    />
                </>
            )}

            <text x={layout.cx1} y={layout.cy - layout.srTip1 - 14} textAnchor="middle" fontSize="10" fill="#00e5ff" fontWeight="700" fontFamily="ui-monospace, monospace">z1 = {z1v}</text>
            <text x={layout.cx1} y={layout.cy - layout.srTip1 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {layout.d1.toFixed(1)} mm</text>
            <text x={layout.cx1} y={layout.cy - layout.srTip1 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">Da = {layout.od1.toFixed(1)} mm</text>

            <text x={layout.cx2} y={layout.cy - layout.srTip2 - 14} textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="700" fontFamily="ui-monospace, monospace">z2 = {z2v}</text>
            <text x={layout.cx2} y={layout.cy - layout.srTip2 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {layout.d2.toFixed(1)} mm</text>
            <text x={layout.cx2} y={layout.cy - layout.srTip2 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">Da = {layout.od2.toFixed(1)} mm</text>

            <DimLine x1={layout.cx1} y1={layout.cy + layout.srTip2 + 32} x2={layout.cx2} y2={layout.cy + layout.srTip2 + 32} label={`C = ${layout.Cmm.toFixed(0)} mm`} />

            {showLegend && (
                <LegendPanel x={556} y={56} title="RESULTS" rows={[
                    { label: 'Driver pitch dia. dp', value: `${layout.d1.toFixed(2)} mm`, highlight: true },
                    { label: 'Driver tooth-tip Da', value: `${layout.od1.toFixed(2)} mm` },
                    { label: 'Speed ratio i', value: iVal.toFixed(3) },
                    { label: 'Input rpm n1', value: `${rpm1.toFixed(0)} rpm` },
                    ...(rpm2 != null ? [{ label: 'Output rpm n2', value: `${rpm2.toFixed(0)} rpm` }] : []),
                    ...(chainVelocity != null ? [{ label: 'Chain velocity v', value: `${chainVelocity.toFixed(2)} m/s`, highlight: true }] : []),
                    ...(chainLength != null ? [{ label: 'Chain length L', value: `${chainLength.toFixed(0)} mm` }] : []),
                    ...(chainTension != null ? [{ label: 'Design tension F', value: `${chainTension.toFixed(0)} N` }] : []),
                ]} />
            )}
        </svg>
    );
}

export default ChainDriveBlueprint;
