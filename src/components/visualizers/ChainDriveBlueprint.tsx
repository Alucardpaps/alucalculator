'use client';

import React, { useMemo } from 'react';
import {
    DimLine,
    FrameDefs,
    LegendPanel,
    openDriveLayout,
    openDrivePath,
    sampleOpenDrive,
    sprocketOutlinePath,
    useFrameIds,
} from './techframe-utils';
import { useI18nStore } from '@/store/i18nStore';

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

const COPY: Record<string, Record<string, string>> = {
    en: {
        title: 'ROLLER CHAIN DRIVE',
        results: 'RESULTS',
        driver: 'DRIVER',
        driven: 'DRIVEN',
        tight: 'TIGHT SIDE',
        slack: 'SLACK SIDE',
        dp: 'Driver pitch dia. dp',
        da: 'Driver tooth-tip Da',
        ratio: 'Speed ratio i',
        n1: 'Input rpm n1',
        n2: 'Output rpm n2',
        v: 'Chain velocity v',
        L: 'Chain length L',
        F: 'Design tension F',
    },
    tr: {
        title: 'MAKARALI ZİNCİR TAHRİK',
        results: 'SONUÇLAR',
        driver: 'TAHRİK',
        driven: 'TAHRİK EDİLEN',
        tight: 'GERGİN KOL',
        slack: 'BOŞ KOL',
        dp: 'Tahrik hatve çapı dp',
        da: 'Tahrik diş tepe Da',
        ratio: 'Devir oranı i',
        n1: 'Giriş n1',
        n2: 'Çıkış n2',
        v: 'Zincir hızı v',
        L: 'Zincir boyu L',
        F: 'Tasarım çekmesi F',
    },
};

export function ChainDriveBlueprint(props: ChainDriveBlueprintProps) {
    const {
        z1, z2, pitch, centerDist, rpm1 = 1450, ratio, rpm2, chainVelocity, chainLength,
        chainTension, d1: d1In, d2: d2In, od1: od1In, od2: od2In, chainType = 'roller-simplex', showLegend = true,
    } = props;
    const { language } = useI18nStore();
    const t = COPY[language] ?? COPY.en;
    const ids = useFrameIds('chain');
    const z1v = Math.max(11, z1);
    const z2v = Math.max(11, z2);
    const p = Math.max(4, pitch);
    const C = Math.max(50, centerDist);
    const strands = chainType.includes('triplex') ? 3 : chainType.includes('duplex') ? 2 : 1;
    const isSilent = chainType === 'silent';
    const isLeaf = chainType === 'leaf';

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
        const pitchPx = p * base.scale;
        return { ...base, d1: d1mm, d2: d2mm, od1: od1mm, od2: od2mm, srPitch1, srPitch2, srTip1, srTip2, pitchPx };
    }, [z1v, z2v, p, C, d1In, d2In, od1In, od2In, W, H, rightReserve]);

    const chainRun = openDrivePath(layout.cx1, layout.cy, layout.srPitch1, layout.cx2, layout.srPitch2);
    const samples = useMemo(
        () => sampleOpenDrive(layout.cx1, layout.cy, layout.srPitch1, layout.cx2, layout.srPitch2, Math.max(7, layout.pitchPx)),
        [layout.cx1, layout.cy, layout.srPitch1, layout.cx2, layout.srPitch2, layout.pitchPx],
    );
    const iVal = ratio ?? z2v / z1v;
    const panelW = showLegend ? 520 : W - 24;
    const rollerR = Math.max(1.6, layout.pitchPx * 0.22);
    const n1 = rpm1 || 1450;
    const dur1 = Math.max((60 / n1) * 10, 0.45);
    const dur2 = dur1 * iVal;

    const links = useMemo(() => {
        if (!samples || samples.length < 4) return [];
        const out: { x: number; y: number; ang: number; outer: boolean }[] = [];
        const step = Math.max(1, Math.round(layout.pitchPx / 8));
        for (let i = 0; i < samples.length; i += step) {
            out.push({ ...samples[i], outer: out.length % 2 === 0 });
        }
        return out.slice(0, 96);
    }, [samples, layout.pitchPx]);

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <FrameDefs ids={ids} />
            <style>{`
                @keyframes chainRun { to { stroke-dashoffset: -${Math.max(12, layout.pitchPx).toFixed(1)}; } }
                @keyframes sprocketSpin { to { transform: rotate(360deg); } }
                @keyframes slackPulse { 0%,100% { opacity:.35 } 50% { opacity:.85 } }
                @media (prefers-reduced-motion: reduce) {
                    .chain-run, .sprocket-spin, .slack-pulse { animation: none !important; }
                }
            `}</style>
            <rect width={W} height={H} fill="#040810" rx="8" />
            <rect width={W} height={H} fill={`url(#${ids.grid})`} />
            <text x={20} y={28} fontSize="13" fontWeight="700" fill="#00e5ff" fontFamily="ui-monospace, monospace">{t.title}</text>
            <text x={20} y={44} fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">
                {chainType.toUpperCase()} · ISO 606 · p = {p.toFixed(3)} mm · C = {C.toFixed(0)} mm
                {chainLength != null ? ` · L = ${chainLength.toFixed(0)} mm` : ''}
                {strands > 1 ? ` · ×${strands}` : ''}
            </text>
            <rect x={16} y={56} width={panelW} height={H - 72} rx={8} fill="rgba(0,0,0,0.35)" stroke="rgba(0,229,255,0.15)" strokeWidth="1" />

            {/* Slack sag (top span) */}
            {chainRun && (
                <path
                    className="slack-pulse"
                    d={`M ${layout.cx1 + 8} ${layout.cy - layout.srPitch1 * 0.15} Q ${(layout.cx1 + layout.cx2) / 2} ${layout.cy - layout.srPitch1 - 10} ${layout.cx2 - 8} ${layout.cy - layout.srPitch2 * 0.15}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.2"
                    strokeDasharray="3 5"
                    style={{ animation: 'slackPulse 2.4s ease-in-out infinite' }}
                />
            )}

            {([0, 1, 2] as const).filter((s) => s < strands).map((s) => {
                const dy = (s - (strands - 1) / 2) * 5;
                return (
                    <g key={s} transform={`translate(0, ${dy})`} opacity={1 - s * 0.18}>
                        <g
                            className="sprocket-spin"
                            style={{
                                transformOrigin: `${layout.cx1}px ${layout.cy}px`,
                                transformBox: 'view-box',
                                animation: `sprocketSpin ${dur1}s linear infinite`,
                            }}
                        >
                            {isLeaf ? (
                                <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1} fill={`url(#${ids.metal})`} stroke="#00e5ff" strokeWidth="1.4" />
                            ) : (
                                <path
                                    d={sprocketOutlinePath(layout.cx1, layout.cy, z1v, layout.pitchPx)}
                                    fill={`url(#${ids.metal})`}
                                    stroke="#00e5ff"
                                    strokeWidth="1.15"
                                    strokeLinejoin="round"
                                />
                            )}
                            <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1} fill="none" stroke="#00e5ff" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.45" />
                            <circle cx={layout.cx1} cy={layout.cy} r={layout.srPitch1 * 0.34} fill="#0a1420" stroke="#94a3b8" strokeWidth="1.1" />
                            <rect x={layout.cx1 - 2.2} y={layout.cy - layout.srPitch1 * 0.34 - 5} width="4.4" height="5" fill="#00e5ff" opacity="0.7" />
                            <circle cx={layout.cx1} cy={layout.cy} r={2} fill="#00e5ff" />
                        </g>
                        <g
                            className="sprocket-spin"
                            style={{
                                transformOrigin: `${layout.cx2}px ${layout.cy}px`,
                                transformBox: 'view-box',
                                animation: `sprocketSpin ${dur2}s linear infinite reverse`,
                            }}
                        >
                            {isLeaf ? (
                                <circle cx={layout.cx2} cy={layout.cy} r={layout.srPitch2} fill={`url(#${ids.metal})`} stroke="#8b5cf6" strokeWidth="1.4" />
                            ) : (
                                <path
                                    d={sprocketOutlinePath(layout.cx2, layout.cy, z2v, layout.pitchPx, Math.PI / z2v)}
                                    fill={`url(#${ids.metal})`}
                                    stroke="#8b5cf6"
                                    strokeWidth="1.15"
                                    strokeLinejoin="round"
                                />
                            )}
                            <circle cx={layout.cx2} cy={layout.cy} r={layout.srPitch2} fill="none" stroke="#8b5cf6" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.45" />
                            <circle cx={layout.cx2} cy={layout.cy} r={layout.srPitch2 * 0.34} fill="#0a1420" stroke="#94a3b8" strokeWidth="1.1" />
                            <circle cx={layout.cx2} cy={layout.cy} r={2} fill="#8b5cf6" />
                        </g>
                    </g>
                );
            })}

            {chainRun && (
                <>
                    <path d={chainRun.d} fill="none" stroke="#00e5ff" strokeWidth={isSilent ? 4.2 : 3.2} opacity="0.08" />
                    <path
                        className="chain-run"
                        d={chainRun.d}
                        fill="none"
                        stroke={isSilent ? '#94a3b8' : '#22d3ee'}
                        strokeWidth={isSilent ? 2.6 : 2.1}
                        strokeDasharray={isSilent ? '5 7' : `${Math.max(5, layout.pitchPx * 0.55).toFixed(1)} ${Math.max(6, layout.pitchPx * 0.62).toFixed(1)}`}
                        strokeLinecap="round"
                        style={{ animation: `chainRun ${Math.max(1.1, 18 / Math.max(1, n1 / 120))}s linear infinite` }}
                    />
                </>
            )}

            {!isSilent && links.map((lk, i) => (
                <g key={i} transform={`translate(${lk.x}, ${lk.y}) rotate(${(lk.ang * 180) / Math.PI})`}>
                    <rect x={-layout.pitchPx * 0.38} y={lk.outer ? -rollerR * 1.35 : -rollerR * 0.85} width={layout.pitchPx * 0.76} height={lk.outer ? rollerR * 0.55 : rollerR * 0.42} rx="0.6" fill={lk.outer ? '#cbd5e1' : '#64748b'} opacity="0.85" />
                    <circle r={rollerR} fill="#0f172a" stroke="#fbbf24" strokeWidth="0.9" />
                    <circle r={rollerR * 0.35} fill="#fbbf24" opacity="0.7" />
                </g>
            ))}

            <text x={layout.cx1} y={layout.cy + layout.srTip1 + 16} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">{t.driver}</text>
            <text x={layout.cx1} y={layout.cy - layout.srTip1 - 14} textAnchor="middle" fontSize="10" fill="#00e5ff" fontWeight="700" fontFamily="ui-monospace, monospace">z1 = {z1v}</text>
            <text x={layout.cx1} y={layout.cy - layout.srTip1 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {layout.d1.toFixed(1)} mm</text>
            <text x={layout.cx1} y={layout.cy - layout.srTip1 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">Da = {layout.od1.toFixed(1)} mm</text>

            <text x={layout.cx2} y={layout.cy + layout.srTip2 + 16} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">{t.driven}</text>
            <text x={layout.cx2} y={layout.cy - layout.srTip2 - 14} textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="700" fontFamily="ui-monospace, monospace">z2 = {z2v}</text>
            <text x={layout.cx2} y={layout.cy - layout.srTip2 - 26} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">dp = {layout.d2.toFixed(1)} mm</text>
            <text x={layout.cx2} y={layout.cy - layout.srTip2 - 38} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">Da = {layout.od2.toFixed(1)} mm</text>

            <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy + Math.max(layout.srTip1, layout.srTip2) + 18} textAnchor="middle" fontSize="8" fill="#10b981" fontFamily="ui-monospace, monospace" fontWeight="700">{t.tight}</text>
            <text x={(layout.cx1 + layout.cx2) / 2} y={layout.cy - Math.max(layout.srTip1, layout.srTip2) - 8} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">{t.slack}</text>

            <DimLine x1={layout.cx1} y1={layout.cy + layout.srTip2 + 36} x2={layout.cx2} y2={layout.cy + layout.srTip2 + 36} label={`C = ${layout.Cmm.toFixed(0)} mm`} />

            {showLegend && (
                <LegendPanel x={556} y={56} title={t.results} rows={[
                    { label: t.dp, value: `${layout.d1.toFixed(2)} mm`, highlight: true },
                    { label: t.da, value: `${layout.od1.toFixed(2)} mm` },
                    { label: t.ratio, value: iVal.toFixed(3) },
                    { label: t.n1, value: `${n1.toFixed(0)} rpm` },
                    ...(rpm2 != null ? [{ label: t.n2, value: `${rpm2.toFixed(0)} rpm` }] : []),
                    ...(chainVelocity != null ? [{ label: t.v, value: `${chainVelocity.toFixed(2)} m/s`, highlight: true }] : []),
                    ...(chainLength != null ? [{ label: t.L, value: `${chainLength.toFixed(0)} mm` }] : []),
                    ...(chainTension != null ? [{ label: t.F, value: `${chainTension.toFixed(0)} N` }] : []),
                ]} />
            )}
        </svg>
    );
}

export default ChainDriveBlueprint;
