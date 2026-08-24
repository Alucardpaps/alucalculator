'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Circle, Square, Wrench, CircleSlash, BoxSelect, Droplet, ShieldCheck } from 'lucide-react';
import { CalculatorInput } from "@/components/CalculatorInput";
import { useI18nStore } from '@/store/i18nStore';
import { getMachiningDetailsStrings } from '@/locales/machiningDetailsTranslations';
import {
    ImbusSVG,
    KeywaySVG,
    CirclipSVG,
    CenterDrillSVG,
    CountersinkSVG,
    UndercutSVG,
} from './MachiningDrawings';
import {
    DIN_912,
    DIN_332,
    DIN_7991,
    getKeywayData,
    getKeywayTolerances,
    getCirclipData,
    getUndercutData,
    getClearanceHole,
    STANDARD_SOURCES,
    type KeywayFitClass,
} from '@/data/machiningStandards';

// ════════════════════════════════════════════
// TRANSLATION DICTIONARIES
// ════════════════════════════════════════════
export default function MachiningDetailsModule() {
    const { language } = useI18nStore();
    const t = getMachiningDetailsStrings(language);

    const tabs = [
        { id: 'imbus', label: t.socketHead, icon: Circle, source: STANDARD_SOURCES.imbus },
        { id: 'keyway', label: t.keyways, icon: Square, source: STANDARD_SOURCES.keyway },
        { id: 'circlip', label: t.circlips, icon: CircleSlash, source: STANDARD_SOURCES.circlip471 },
        { id: 'centerdrill', label: t.centerDrills, icon: Droplet, source: STANDARD_SOURCES.centerdrill },
        { id: 'countersink', label: t.countersink, icon: Scissors, source: STANDARD_SOURCES.countersink },
        { id: 'undercut', label: t.undercut, icon: BoxSelect, source: STANDARD_SOURCES.undercut },
    ];

    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const activeSource = tabs.find(tObj => tObj.id === activeTab)?.source ?? '';

    return (
        <div className="relative z-10 flex flex-col h-full bg-[#020408] text-slate-200 select-none font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">{t.title}</h1>
                        <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">{t.subtitle}</p>
                    </div>
                </div>

                <SourceBadge source={activeSource} verifiedLabel={t.verified} />

                <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar">
                    {tabs.map(tObj => (
                        <button
                            key={tObj.id}
                            onClick={() => setActiveTab(tObj.id)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${activeTab === tObj.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-slate-500 border border-white/5 hover:text-white'}`}
                        >
                            <tObj.icon size={14} /> {tObj.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 h-full min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'imbus' && <ImbusTab />}
                            {activeTab === 'keyway' && <KeywayTab />}
                            {activeTab === 'circlip' && <CirclipTab />}
                            {activeTab === 'centerdrill' && <CenterDrillTab />}
                            {activeTab === 'countersink' && <CountersinkTab />}
                            {activeTab === 'undercut' && <UndercutTab />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function SourceBadge({ source, verifiedLabel }: { source: string; verifiedLabel: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] font-mono text-emerald-400/90">
                {verifiedLabel}: {source}
            </span>
        </div>
    );
}

function ImbusTab() {
    const { language } = useI18nStore();
    const t = getMachiningDetailsStrings(language);

    const [size, setSize] = useState('M10');
    const [holeSeries, setHoleSeries] = useState<'fine' | 'normal' | 'coarse'>('normal');
    const data = DIN_912.find(d => d.size === size) || DIN_912[0];
    const clearance = getClearanceHole(size, holeSeries);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t.selectScrew}</label>
                    <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none">
                        {DIN_912.map(d => <option key={d.size} value={d.size}>{d.size}</option>)}
                    </select>
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t.clearanceSeries}</label>
                        <div className="flex gap-2">
                            {(['fine', 'normal', 'coarse'] as const).map(s => (
                                <button key={s} onClick={() => setHoleSeries(s)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg ${holeSeries === s ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>
                                    {s === 'fine' ? t.fine : s === 'coarse' ? t.coarse : t.normal}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">{t.counterboreSpecs}</h2>
                    <DimTable data={[
                        { label: t.nominalThread, val: data.d, unit: 'mm' },
                        { label: t.headDia, val: data.dk, unit: 'mm' },
                        { label: t.headHeight, val: data.k, unit: 'mm' },
                        { label: t.counterboreDia, val: data.D, unit: 'mm', highlight: true },
                        { label: t.counterboreDepth, val: data.T, unit: 'mm', highlight: true },
                        { label: `${t.clearanceHole} (${holeSeries === 'fine' ? t.fine : holeSeries === 'coarse' ? t.coarse : t.normal})`, val: clearance ?? '-', unit: 'mm', highlight: true },
                    ]} copyLabel={t.copyDims} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">DIN 912 / ISO 4762</div>
                <div className="w-full pt-8">
                    <ImbusSVG data={data} />
                </div>
            </div>
        </div>
    );
}

function KeywayTab() {
    const { language } = useI18nStore();
    const t = getMachiningDetailsStrings(language);

    const [d, setD] = useState(30);
    const [fit, setFit] = useState<KeywayFitClass>('normal');
    const data = getKeywayData(d);
    const tolerances = data ? getKeywayTolerances(data.b, fit) : null;
    const hubDepthTotal = data ? (d + data.t2).toFixed(1) : null;
    const lengthHint = data?.recommendedLengths.length
        ? `${data.recommendedLengths[0]}-${data.recommendedLengths[data.recommendedLengths.length - 1]} mm`
        : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="relative z-20 bg-[#0a0c10] border border-white/10 rounded-3xl p-6 space-y-4">
                    <CalculatorInput label={t.shaftDia} unit="mm" value={d} min={6} max={500} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setD(Number(e.target.value))} />
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t.fitClass}</label>
                        <div className="flex gap-2">
                            {(['normal', 'free', 'tight'] as const).map(f => (
                                <button key={f} onClick={() => setFit(f)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg ${fit === f ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>
                                    {f === 'free' ? t.free : f === 'tight' ? t.tight : t.normal}
                                </button>
                            ))}
                        </div>
                    </div>
                    {!data ? <p className="text-red-400 text-xs mt-2 font-mono">{t.validShaftWarning}</p> : null}
                </div>

                {data ? (
                    <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">{t.keyDimensions}</h2>
                        <DimTable data={[
                            { label: t.shaftRange, val: `${data.min} - ${data.max}`, unit: 'mm' },
                            { label: t.keyWidth, val: data.b, unit: 'mm', highlight: true },
                            { label: t.keyHeight, val: data.h, unit: 'mm' },
                            { label: t.shaftGrooveDepth, val: data.t1, unit: 'mm', highlight: true },
                            { label: t.hubGrooveDepth, val: data.t2, unit: 'mm', highlight: true },
                            { label: t.hubMinBore, val: data.hubMinBore.toFixed(1), unit: 'mm', highlight: true },
                            { label: t.hubDepthToKey, val: hubDepthTotal, unit: 'mm' },
                            { label: t.shaftKeywayWidth, val: tolerances?.bShaft ?? '-', unit: '' },
                            { label: t.hubKeywayWidth, val: tolerances?.bHub ?? '-', unit: '' },
                            { label: t.standardKeyLengths, val: lengthHint ?? '-', unit: '' },
                        ]} copyLabel={t.copyDims} />
                    </div>
                ) : (
                    <div className="text-red-400 text-xs font-mono p-4 bg-red-500/10 rounded-xl">{t.noKeywayData}</div>
                )}
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">DIN 6885 Parallel Keys</div>
                <div className="w-full pt-8">
                    {data ? <KeywaySVG d={d} data={data} /> : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">{t.validShaftWarning}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CirclipTab() {
    const { language } = useI18nStore();
    const t = getMachiningDetailsStrings(language);

    const [d, setD] = useState(20);
    const [type, setType] = useState<'shaft' | 'bore'>('shaft');
    const isShaft = type === 'shaft';
    const data = getCirclipData(d, isShaft);
    const source = isShaft ? STANDARD_SOURCES.circlip471 : STANDARD_SOURCES.circlip472;
    const minD = isShaft ? 3 : 8;
    const maxD = 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="relative z-20 bg-[#0a0c10] border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex gap-2">
                        <button onClick={() => setType('shaft')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg ${type === 'shaft' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>{t.shaft} (DIN 471)</button>
                        <button onClick={() => setType('bore')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg ${type === 'bore' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>{t.bore} (DIN 472)</button>
                    </div>
                    <CalculatorInput label={`${isShaft ? t.shaft : t.bore} ${t.shaftDia.replace('d1', 'd1')}`} unit="mm" value={d} min={minD} max={maxD} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setD(Number(e.target.value))} />
                    {!data && <p className="text-red-400 text-xs font-mono">DIN {isShaft ? '471' : '472'} range: {minD}-{maxD} mm ({t.normal} sizes)</p>}
                    {data?.snapped && (
                        <p className="text-amber-400 text-xs font-mono">{t.nearestSize}: d1={data.nominalSize} mm</p>
                    )}
                </div>

                {data ? (
                    <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">{t.grooveSpecs}</h2>
                        <DimTable data={[
                            { label: t.inputDia, val: data.d1, unit: 'mm' },
                            { label: t.catalogSize, val: data.nominalSize, unit: 'mm' },
                            { label: t.grooveDia, val: data.d2.toFixed(2), unit: 'mm', highlight: true },
                            { label: t.grooveWidth, val: data.m, unit: 'mm', highlight: true },
                            { label: t.ringThickness, val: data.s, unit: 'mm' },
                            { label: t.grooveDepth, val: data.depth.toFixed(2), unit: 'mm', highlight: true },
                        ]} copyLabel={t.copyDims} />
                        <p className="text-[9px] text-slate-500 font-mono mt-4">{source}</p>
                    </div>
                ) : (
                    <div className="text-red-400 text-xs font-mono p-4 bg-red-500/10 rounded-xl">{t.noCirclipData}</div>
                )}
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">{isShaft ? 'DIN 471 Shaft' : 'DIN 472 Bore'} Circlip</div>
                <div className="w-full pt-8">
                    {data ? <CirclipSVG type={type} data={data} /> : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">{t.validBoreWarning}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CenterDrillTab() {
    const { language } = useI18nStore();
    const t = getMachiningDetailsStrings(language);

    const [type, setType] = useState(DIN_332[3].type);
    const data = DIN_332.find(d => d.type === type) || DIN_332[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t.centerDrillType}</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none">
                        {DIN_332.map(d => <option key={d.type} value={d.type}>{d.type}</option>)}
                    </select>
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">{t.drillDimensions}</h2>
                    <DimTable data={[
                        { label: t.pilotHole, val: data.d1, unit: 'mm', highlight: true },
                        { label: t.countersink, val: data.d2, unit: 'mm', highlight: true },
                        { label: t.refDepth, val: data.t, unit: 'mm' },
                        { label: t.angle, val: '60', unit: 'deg' },
                    ]} copyLabel={t.copyDims} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">DIN 332 Form A Center Drill</div>
                <div className="w-full pt-8">
                    <CenterDrillSVG data={data} />
                </div>
            </div>
        </div>
    );
}

function CountersinkTab() {
    const { language } = useI18nStore();
    const t = getMachiningDetailsStrings(language);

    const [size, setSize] = useState(DIN_7991[3].size);
    const data = DIN_7991.find(d => d.size === size) || DIN_7991[0];
    const clearance = getClearanceHole(size, 'normal');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t.countersunkScrewSize}</label>
                    <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none">
                        {DIN_7991.map(d => <option key={d.size} value={d.size}>{d.size}</option>)}
                    </select>
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">{t.countersinkSpecs}</h2>
                    <DimTable data={[
                        { label: t.clearanceHole, val: data.d1, unit: 'mm', highlight: true },
                        { label: `ISO 273 ${t.normal} (dh)`, val: clearance ?? '-', unit: 'mm' },
                        { label: t.counterboreDia, val: data.d2, unit: 'mm', highlight: true },
                        { label: `${t.countersink} ${t.refDepth.replace('t', 't')}`, val: data.t, unit: 'mm' },
                        { label: t.countersinkAngle, val: data.alpha, unit: 'deg' },
                    ]} copyLabel={t.copyDims} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">DIN 74-F Countersink</div>
                <div className="w-full pt-8">
                    <CountersinkSVG data={data} />
                </div>
            </div>
        </div>
    );
}

function UndercutTab() {
    const { language } = useI18nStore();
    const t = getMachiningDetailsStrings(language);

    const [dSmall, setDSmall] = useState(25);
    const [dLarge, setDLarge] = useState(40);
    const data = getUndercutData(dSmall);
    const undercutDepth = data.r * (1 - Math.sin(Math.PI / 4));
    const grooveWidth = data.r * 2 + 0.5;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                    <CalculatorInput label={t.smallerShaft} unit="mm" value={dSmall} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDSmall(Number(e.target.value))} />
                    <CalculatorInput label={t.largerShoulder} unit="mm" value={dLarge} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDLarge(Number(e.target.value))} />
                    {dLarge <= dSmall && <p className="text-amber-400 text-xs font-mono">{t.shoulderWarning}</p>}
                </div>
                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">{t.undercutSpecs}</h2>
                    <DimTable data={[
                        { label: t.undercutRadius, val: data.r, unit: 'mm', highlight: true },
                        { label: t.reliefDepth, val: undercutDepth.toFixed(2), unit: 'mm', highlight: true },
                        { label: `${t.countersink} ${t.grooveWidth} (approx)`, val: grooveWidth.toFixed(2), unit: 'mm' },
                        { label: t.transitionAngle, val: '45', unit: 'deg' },
                        { label: t.shaftRange, val: `${data.min}-${data.max}`, unit: 'mm' },
                    ]} copyLabel={t.copyDims} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">DIN 509 Shoulder Undercut</div>
                <div className="w-full pt-8">
                    <UndercutSVG dSmall={dSmall} dLarge={dLarge} r={data.r} />
                </div>
            </div>
        </div>
    );
}

function DimTable({ data, copyLabel }: { data: { label: string; val: string | number | null; unit: string; highlight?: boolean }[]; copyLabel: string }) {
    const copySpecs = () => {
        const text = data.map(d => `${d.label}: ${d.val}${d.unit ? ' ' + d.unit : ''}`).join('\n');
        navigator.clipboard?.writeText(text);
    };
    return (
        <div className="space-y-2">
            <button type="button" onClick={copySpecs}
                className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-cyan-400/80 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 transition-all">
                {copyLabel}
            </button>
            <div className="space-y-1">
                {data.map((d, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${d.highlight ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
                        <span className="text-[10px] font-mono text-white/50">{d.label}</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-sm font-bold font-mono ${d.highlight ? 'text-cyan-400' : 'text-white'}`}>{d.val}</span>
                            {d.unit ? <span className="text-[9px] font-mono text-white/30">{d.unit}</span> : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
