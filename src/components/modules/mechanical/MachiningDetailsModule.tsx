'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Circle, Square, Wrench, CircleSlash, BoxSelect, Droplet, ShieldCheck } from 'lucide-react';
import { CalculatorInput } from "@/components/CalculatorInput";
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

export default function MachiningDetailsModule() {
    const tabs = [
        { id: 'imbus', label: 'Socket Head (Imbus)', icon: Circle, source: STANDARD_SOURCES.imbus },
        { id: 'keyway', label: 'Keyways (Kama)', icon: Square, source: STANDARD_SOURCES.keyway },
        { id: 'circlip', label: 'Circlips (Segman)', icon: CircleSlash, source: STANDARD_SOURCES.circlip471 },
        { id: 'centerdrill', label: 'Center Drills (Punta)', icon: Droplet, source: STANDARD_SOURCES.centerdrill },
        { id: 'countersink', label: 'Countersink (Havsa)', icon: Scissors, source: STANDARD_SOURCES.countersink },
        { id: 'undercut', label: 'Undercut (Freistich)', icon: BoxSelect, source: STANDARD_SOURCES.undercut },
    ];

    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const activeSource = tabs.find(t => t.id === activeTab)?.source ?? '';

    return (
        <div className="relative z-10 flex flex-col h-full bg-[#020408] text-slate-200 select-none font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Machining Details</h1>
                        <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">DIN/ISO Manufacturing Standards 2D</p>
                    </div>
                </div>

                <SourceBadge source={activeSource} />

                <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${activeTab === t.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-slate-500 border border-white/5 hover:text-white'}`}
                        >
                            <t.icon size={14} /> {t.label}
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

function SourceBadge({ source }: { source: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] font-mono text-emerald-400/90">
                Verified: {source}
            </span>
        </div>
    );
}

function ImbusTab() {
    const [size, setSize] = useState('M10');
    const [holeSeries, setHoleSeries] = useState<'fine' | 'normal' | 'coarse'>('normal');
    const data = DIN_912.find(d => d.size === size) || DIN_912[0];
    const clearance = getClearanceHole(size, holeSeries);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Select DIN 912 Screw Size</label>
                    <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none">
                        {DIN_912.map(d => <option key={d.size} value={d.size}>{d.size}</option>)}
                    </select>
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">ISO 273 Clearance Series</label>
                        <div className="flex gap-2">
                            {(['fine', 'normal', 'coarse'] as const).map(s => (
                                <button key={s} onClick={() => setHoleSeries(s)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg ${holeSeries === s ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Counterbore Specs</h2>
                    <DimTable data={[
                        { label: 'Nominal Thread (d)', val: data.d, unit: 'mm' },
                        { label: 'Head Dia (dk)', val: data.dk, unit: 'mm' },
                        { label: 'Head Height (k)', val: data.k, unit: 'mm' },
                        { label: 'Counterbore Dia (D)', val: data.D, unit: 'mm', highlight: true },
                        { label: 'Counterbore Depth (T)', val: data.T, unit: 'mm', highlight: true },
                        { label: `Clearance Hole (${holeSeries})`, val: clearance ?? '-', unit: 'mm', highlight: true },
                    ]} />
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
                    <CalculatorInput label="Shaft Diameter (d1)" unit="mm" value={d} min={6} max={500} onChange={e => setD(Number(e.target.value))} />
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Fit Class (DIN 6885)</label>
                        <div className="flex gap-2">
                            {(['normal', 'free', 'tight'] as const).map(f => (
                                <button key={f} onClick={() => setFit(f)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg ${fit === f ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    {!data ? <p className="text-red-400 text-xs mt-2 font-mono">DIN 6885 range: 6-500 mm</p> : null}
                </div>

                {data ? (
                    <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Key & Keyway Dimensions</h2>
                        <DimTable data={[
                            { label: 'Shaft Range', val: `${data.min} - ${data.max}`, unit: 'mm' },
                            { label: 'Key Width (b)', val: data.b, unit: 'mm', highlight: true },
                            { label: 'Key Height (h)', val: data.h, unit: 'mm' },
                            { label: 'Shaft Groove Depth (t1)', val: data.t1, unit: 'mm', highlight: true },
                            { label: 'Hub Groove Depth (t2)', val: data.t2, unit: 'mm', highlight: true },
                            { label: 'Hub Min Bore (d1+d2)', val: data.hubMinBore.toFixed(1), unit: 'mm', highlight: true },
                            { label: 'Hub Depth to Key Bottom (d+t2)', val: hubDepthTotal, unit: 'mm' },
                            { label: 'Shaft Keyway Width', val: tolerances?.bShaft ?? '-', unit: '' },
                            { label: 'Hub Keyway Width', val: tolerances?.bHub ?? '-', unit: '' },
                            { label: 'Standard Key Lengths', val: lengthHint ?? '-', unit: '' },
                        ]} />
                    </div>
                ) : (
                    <div className="text-red-400 text-xs font-mono p-4 bg-red-500/10 rounded-xl">No DIN 6885 keyway data for this diameter</div>
                )}
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">DIN 6885 Parallel Keys</div>
                <div className="w-full pt-8">
                    {data ? <KeywaySVG d={d} data={data} /> : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">Enter a valid shaft diameter (6-500 mm)</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CirclipTab() {
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
                        <button onClick={() => setType('shaft')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg ${type === 'shaft' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>Shaft (DIN 471)</button>
                        <button onClick={() => setType('bore')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg ${type === 'bore' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>Bore (DIN 472)</button>
                    </div>
                    <CalculatorInput label={`${isShaft ? 'Shaft' : 'Bore'} Diameter (d1)`} unit="mm" value={d} min={minD} max={maxD} onChange={e => setD(Number(e.target.value))} />
                    {!data && <p className="text-red-400 text-xs font-mono">DIN {isShaft ? '471' : '472'} range: {minD}-{maxD} mm (standard sizes)</p>}
                    {data?.snapped && (
                        <p className="text-amber-400 text-xs font-mono">Nearest standard size: d1={data.nominalSize} mm (catalog discrete sizes)</p>
                    )}
                </div>

                {data ? (
                    <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Groove Specs</h2>
                        <DimTable data={[
                            { label: 'Input Dia (d1)', val: data.d1, unit: 'mm' },
                            { label: 'Catalog Size', val: data.nominalSize, unit: 'mm' },
                            { label: 'Groove Dia (d2)', val: data.d2.toFixed(2), unit: 'mm', highlight: true },
                            { label: 'Groove Width (m)', val: data.m, unit: 'mm', highlight: true },
                            { label: 'Ring Thickness (s)', val: data.s, unit: 'mm' },
                            { label: 'Groove Depth', val: data.depth.toFixed(2), unit: 'mm', highlight: true },
                        ]} />
                        <p className="text-[9px] text-slate-500 font-mono mt-4">{source}</p>
                    </div>
                ) : (
                    <div className="text-red-400 text-xs font-mono p-4 bg-red-500/10 rounded-xl">No DIN {isShaft ? '471' : '472'} groove data for this diameter</div>
                )}
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-4 lg:p-6 relative flex items-stretch justify-center min-h-[420px]">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest z-10">{isShaft ? 'DIN 471 Shaft' : 'DIN 472 Bore'} Circlip</div>
                <div className="w-full pt-8">
                    {data ? <CirclipSVG type={type} data={data} /> : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">Enter a valid {isShaft ? 'shaft' : 'bore'} diameter</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CenterDrillTab() {
    const [type, setType] = useState(DIN_332[3].type);
    const data = DIN_332.find(d => d.type === type) || DIN_332[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Center Drill Type A (DIN 332)</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none">
                        {DIN_332.map(d => <option key={d.type} value={d.type}>{d.type}</option>)}
                    </select>
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Drill Dimensions</h2>
                    <DimTable data={[
                        { label: 'Pilot Hole (d1)', val: data.d1, unit: 'mm', highlight: true },
                        { label: 'Countersink Dia (d2)', val: data.d2, unit: 'mm', highlight: true },
                        { label: 'Ref Depth (t)', val: data.t, unit: 'mm' },
                        { label: 'Angle', val: '60', unit: 'deg' },
                    ]} />
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
    const [size, setSize] = useState(DIN_7991[3].size);
    const data = DIN_7991.find(d => d.size === size) || DIN_7991[0];
    const clearance = getClearanceHole(size, 'normal');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Countersunk Screw Size (DIN 7991)</label>
                    <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none">
                        {DIN_7991.map(d => <option key={d.size} value={d.size}>{d.size}</option>)}
                    </select>
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Countersink Specs (DIN 74 Form F)</h2>
                    <DimTable data={[
                        { label: 'Clearance Hole (d1)', val: data.d1, unit: 'mm', highlight: true },
                        { label: 'ISO 273 Normal (dh)', val: clearance ?? '-', unit: 'mm' },
                        { label: 'Countersink Dia (d2)', val: data.d2, unit: 'mm', highlight: true },
                        { label: 'Countersink Depth (t)', val: data.t, unit: 'mm' },
                        { label: 'Countersink Angle', val: data.alpha, unit: 'deg' },
                    ]} />
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
    const [dSmall, setDSmall] = useState(25);
    const [dLarge, setDLarge] = useState(40);
    const data = getUndercutData(dSmall);
    const undercutDepth = data.r * (1 - Math.sin(Math.PI / 4));
    const grooveWidth = data.r * 2 + 0.5;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                    <CalculatorInput label="Smaller Shaft Dia (d)" unit="mm" value={dSmall} onChange={e => setDSmall(Number(e.target.value))} />
                    <CalculatorInput label="Larger Shoulder Dia (D)" unit="mm" value={dLarge} onChange={e => setDLarge(Number(e.target.value))} />
                    {dLarge <= dSmall && <p className="text-amber-400 text-xs font-mono">Shoulder diameter must exceed shaft diameter.</p>}
                </div>
                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">DIN 509 Undercut (Freistich)</h2>
                    <DimTable data={[
                        { label: 'Undercut Radius (r)', val: data.r, unit: 'mm', highlight: true },
                        { label: 'Relief Depth (approx)', val: undercutDepth.toFixed(2), unit: 'mm', highlight: true },
                        { label: 'Groove Width (approx)', val: grooveWidth.toFixed(2), unit: 'mm' },
                        { label: 'Transition Angle', val: '45', unit: 'deg' },
                        { label: 'Shaft Range', val: `${data.min}-${data.max}`, unit: 'mm' },
                    ]} />
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

function DimTable({ data }: { data: { label: string; val: string | number | null; unit: string; highlight?: boolean }[] }) {
    const copySpecs = () => {
        const text = data.map(d => `${d.label}: ${d.val}${d.unit ? ' ' + d.unit : ''}`).join('\n');
        navigator.clipboard?.writeText(text);
    };
    return (
        <div className="space-y-2">
            <button type="button" onClick={copySpecs}
                className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-cyan-400/80 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 transition-all">
                Copy Dimensions
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
