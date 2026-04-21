'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Circle, Square, Wrench, CircleSlash, BoxSelect, Droplet } from 'lucide-react';
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { CalculatorInput } from "@/components/CalculatorInput";

// ============================================
// DATA & STANDARDS
// ============================================

// DIN 912 Socket Head Cap Screws & Counterbores (Imbus Yuvası)
const DIN_912 = [
    { size: 'M3', d: 3, dk: 5.5, k: 3, D: 6.5, T: 3.4 },
    { size: 'M4', d: 4, dk: 7, k: 4, D: 8, T: 4.4 },
    { size: 'M5', d: 5, dk: 8.5, k: 5, D: 10, T: 5.4 },
    { size: 'M6', d: 6, dk: 10, k: 6, D: 11, T: 6.4 },
    { size: 'M8', d: 8, dk: 13, k: 8, D: 15, T: 8.6 },
    { size: 'M10', d: 10, dk: 16, k: 10, D: 18, T: 10.6 },
    { size: 'M12', d: 12, dk: 18, k: 12, D: 20, T: 12.6 },
    { size: 'M16', d: 16, dk: 24, k: 16, D: 26, T: 16.8 },
    { size: 'M20', d: 20, dk: 30, k: 20, D: 33, T: 20.8 },
    { size: 'M24', d: 24, dk: 36, k: 24, D: 40, T: 24.8 },
];

// DIN 6885 Keyways (Kama Kanalı)
const DIN_6885 = [
    { min: 6, max: 8, b: 2, h: 2, t1: 1.2, t2: 1.0 },
    { min: 8, max: 10, b: 3, h: 3, t1: 1.8, t2: 1.4 },
    { min: 10, max: 12, b: 4, h: 4, t1: 2.5, t2: 1.8 },
    { min: 12, max: 17, b: 5, h: 5, t1: 3.0, t2: 2.3 },
    { min: 17, max: 22, b: 6, h: 6, t1: 3.5, t2: 2.8 },
    { min: 22, max: 30, b: 8, h: 7, t1: 4.0, t2: 3.3 },
    { min: 30, max: 38, b: 10, h: 8, t1: 5.0, t2: 3.3 },
    { min: 38, max: 44, b: 12, h: 8, t1: 5.0, t2: 3.3 },
    { min: 44, max: 50, b: 14, h: 9, t1: 5.5, t2: 3.8 },
    { min: 50, max: 58, b: 16, h: 10, t1: 6.0, t2: 4.3 },
    { min: 58, max: 65, b: 18, h: 11, t1: 7.0, t2: 4.4 },
    { min: 65, max: 75, b: 20, h: 12, t1: 7.5, t2: 4.9 },
    { min: 75, max: 85, b: 22, h: 14, t1: 9.0, t2: 5.4 },
    { min: 85, max: 95, b: 25, h: 14, t1: 9.0, t2: 5.4 },
    { min: 95, max: 110, b: 28, h: 16, t1: 10.0, t2: 6.4 }
];

// DIN 471/472 Circlips (Segman) Simplified
function getCirclipData(d: number, isShaft: boolean) {
    // Approximate mathematical approach matching standards
    if (d < 4 || d > 300) return null;
    let m = 0; // Groove width
    let d2 = 0; // Groove dia
    
    if (d <= 10) m = Math.max(0.7, d * 0.08);
    else if (d <= 20) m = 1.1;
    else if (d <= 35) m = 1.3;
    else if (d <= 50) m = 1.85;
    else if (d <= 80) m = 2.15;
    else if (d <= 100) m = 2.65;
    else m = 3.15;
    
    // Depth roughly scales
    const depth = d < 20 ? 0.5 : d < 40 ? 1.0 : d < 80 ? 1.5 : 2.5;
    d2 = isShaft ? d - depth * 2 : d + depth * 2;
    
    return { d, d2, m: m.toFixed(2), depth };
}

// DIN 332 Center Drills (Punta)
const DIN_332 = [
    { type: 'A 1.0x2.12', d1: 1.0, d2: 2.12, t: 1.5 },
    { type: 'A 1.6x3.36', d1: 1.6, d2: 3.36, t: 2.0 },
    { type: 'A 2.0x4.25', d1: 2.0, d2: 4.25, t: 2.5 },
    { type: 'A 2.5x5.3', d1: 2.5, d2: 5.3, t: 3.1 },
    { type: 'A 3.15x6.7', d1: 3.15, d2: 6.7, t: 3.9 },
    { type: 'A 4.0x8.5', d1: 4.0, d2: 8.5, t: 5.0 },
    { type: 'A 5.0x10.6', d1: 5.0, d2: 10.6, t: 6.3 },
    { type: 'A 6.3x13.2', d1: 6.3, d2: 13.2, t: 8.0 }
];

// DIN 7991 Countersunk Head Screws (Havşa Başlı Civata)
const DIN_7991 = [
    { size: 'M3', d: 3, d1: 3.4, d2: 6.6, t: 1.6, alpha: 90 },
    { size: 'M4', d: 4, d1: 4.5, d2: 9.0, t: 2.25, alpha: 90 },
    { size: 'M5', d: 5, d1: 5.5, d2: 11.0, t: 2.75, alpha: 90 },
    { size: 'M6', d: 6, d1: 6.6, d2: 13.0, t: 3.2, alpha: 90 },
    { size: 'M8', d: 8, d1: 9.0, d2: 17.2, t: 4.1, alpha: 90 },
    { size: 'M10', d: 10, d1: 11.0, d2: 21.5, t: 5.25, alpha: 90 },
    { size: 'M12', d: 12, d1: 13.5, d2: 25.5, t: 6.0, alpha: 90 },
    { size: 'M16', d: 16, d1: 17.5, d2: 33.0, t: 7.75, alpha: 90 },
    { size: 'M20', d: 20, d1: 22.0, d2: 40.0, t: 9.0, alpha: 90 },
];

// ============================================
// ============================================

export default function MachiningDetailsModule() {
    const tabs = [
        { id: 'imbus', label: 'Socket Head (İmbus)', icon: Circle },
        { id: 'keyway', label: 'Keyways (Kama)', icon: Square },
        { id: 'circlip', label: 'Circlips (Segman)', icon: CircleSlash },
        { id: 'centerdrill', label: 'Center Drills (Punta)', icon: Droplet },
        { id: 'countersink', label: 'Countersink (Havşa)', icon: Scissors }
    ];

    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return (
        <div className="flex flex-col h-full bg-[#020408] text-slate-200 select-none font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Machining Details</h1>
                        <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">DIN/ISO Manufacturing Standards 2D</p>
                    </div>
                </div>

                {/* Tabs */}
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

                {/* Content Area */}
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ============================================
// TAB COMPONENTS
// ============================================

function ImbusTab() {
    const [size, setSize] = useState('M10');
    const data = DIN_912.find(d => d.size === size) || DIN_912[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Select DIN 912 Screw Size</label>
                    <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none">
                        {DIN_912.map(d => <option key={d.size} value={d.size}>{d.size}</option>)}
                    </select>
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Counterbore Specs</h2>
                    <DimTable data={[
                        { label: 'Nominal Thread (d)', val: data.d, unit: 'mm' },
                        { label: 'Head Dia (dk)', val: data.dk, unit: 'mm' },
                        { label: 'Head Height (k)', val: data.k, unit: 'mm' },
                        { label: 'Counterbore Dia (D)', val: data.D, unit: 'mm', highlight: true },
                        { label: 'Counterbore Depth (T)', val: data.T, unit: 'mm', highlight: true },
                    ]} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-8 relative flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">DIN 912 / ISO 4762</div>
                <ImbusSVG data={data} />
            </div>
        </div>
    );
}

function KeywayTab() {
    const [d, setD] = useState(30);
    const data = DIN_6885.find(k => d >= k.min && d < k.max) || DIN_6885[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <CalculatorInput label="Shaft Diameter (d)" unit="mm" value={d} onChange={e => setD(Number(e.target.value))} />
                    {d < 6 || d > 110 ? <p className="text-red-400 text-xs mt-2 font-mono">Out of DIN 6885 bounds (6-110mm)</p> : null}
                </div>

                <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Key & Keyway Dimensions</h2>
                    <DimTable data={[
                        { label: 'Shaft Range', val: `${data.min} - ${data.max}`, unit: 'mm' },
                        { label: 'Key Width (b)', val: data.b, unit: 'mm', highlight: true },
                        { label: 'Key Height (h)', val: data.h, unit: 'mm' },
                        { label: 'Shaft Groove Depth (t1)', val: data.t1, unit: 'mm', highlight: true },
                        { label: 'Hub Groove Depth (t2)', val: data.t2, unit: 'mm', highlight: true },
                    ]} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-8 relative flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">DIN 6885 Parallel Keys</div>
                <KeywaySVG d={d} data={data} />
            </div>
        </div>
    );
}

function CirclipTab() {
    const [d, setD] = useState(20);
    const [type, setType] = useState('shaft');
    const data = getCirclipData(d, type === 'shaft');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex gap-2">
                        <button onClick={() => setType('shaft')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg ${type === 'shaft' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>Shaft (DIN 471)</button>
                        <button onClick={() => setType('bore')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg ${type === 'bore' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>Bore (DIN 472)</button>
                    </div>
                    <CalculatorInput label={`${type === 'shaft' ? 'Shaft' : 'Bore'} Diameter (d1)`} unit="mm" value={d} onChange={e => setD(Number(e.target.value))} />
                </div>

                {data ? (
                    <div className="bg-[#0a0c10] border border-cyan-500/20 rounded-[2.5rem] p-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Groove Specs</h2>
                        <DimTable data={[
                            { label: 'Nominal Dia (d1)', val: data.d, unit: 'mm' },
                            { label: 'Groove Dia (d2)', val: data.d2.toFixed(2), unit: 'mm', highlight: true },
                            { label: 'Groove Width (m)', val: data.m, unit: 'mm', highlight: true },
                            { label: 'Groove Depth (approx)', val: data.depth, unit: 'mm' },
                        ]} />
                    </div>
                ) : (
                    <div className="text-red-400 text-xs font-mono p-4 bg-red-500/10 rounded-xl">Invalid diameter for circlip standard</div>
                )}
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-8 relative flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">{type === 'shaft' ? 'DIN 471 Shaft' : 'DIN 472 Bore'} Circlip</div>
                {data && <CirclipSVG type={type} data={data} />}
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
                        { label: 'Angle', val: '60', unit: '°' },
                    ]} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-8 relative flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">DIN 332 Form A Center Drill</div>
                <CenterDrillSVG data={data} />
            </div>
        </div>
    );
}

function CountersinkTab() {
    const [size, setSize] = useState(DIN_7991[3].size);
    const data = DIN_7991.find(d => d.size === size) || DIN_7991[0];

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
                        { label: 'Countersink Dia (d2)', val: data.d2, unit: 'mm', highlight: true },
                        { label: 'Countersink Depth (t)', val: data.t, unit: 'mm' },
                        { label: 'Countersink Angle', val: data.alpha, unit: '°' },
                    ]} />
                </div>
            </div>
            <div className="bg-[#05080f] border border-white/5 rounded-[3rem] p-8 relative flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">DIN 74-F Countersink</div>
                <CountersinkSVG data={data} />
            </div>
        </div>
    );
}

// ============================================
// SVG HELPER COMPONENTS

function DimTable({ data }: { data: any[] }) {
    return (
        <div className="space-y-1">
            {data.map((d, i) => (
                <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${d.highlight ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-[10px] font-mono text-white/50">{d.label}</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-sm font-bold font-mono ${d.highlight ? 'text-cyan-400' : 'text-white'}`}>{d.val}</span>
                        <span className="text-[9px] font-mono text-white/30">{d.unit}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function TitleBlock({ title }: { title: string }) {
    return (
        <g>
            <rect x="5" y="100" width="100" height="15" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.5" />
            <text x="10" y="110" fontSize="6" fontFamily="monospace" fill="#06b6d4" opacity="0.8">{title}</text>
            <rect x="105" y="100" width="30" height="15" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.5" />
            <text x="110" y="106" fontSize="4" fontFamily="monospace" fill="#06b6d4" opacity="0.5">ISO 2768-mK</text>
            <text x="110" y="112" fontSize="4" fontFamily="monospace" fill="#06b6d4" opacity="0.5">Scale 1:1</text>
        </g>
    );
}

function GDTBox({ x, y, type, tol, datum }: any) {
    return (
        <g transform={`translate(${x}, ${y})`} stroke="#94a3b8" fill="none" strokeWidth="1">
            <rect x="0" y="0" width="35" height="12" />
            <line x1="12" y1="0" x2="12" y2="12" />
            <line x1="24" y1="0" x2="24" y2="12" />
            <text x="6" y="8" fontSize="8" fill="#cbd5e1" stroke="none" textAnchor="middle">◎</text>
            <text x="18" y="9" fontSize="6" fontFamily="monospace" fill="#cbd5e1" stroke="none" textAnchor="middle">{tol}</text>
            <text x="30" y="9" fontSize="6" fontFamily="monospace" fill="#cbd5e1" stroke="none" textAnchor="middle">{datum}</text>
        </g>
    );
}

function SurfaceFinish({ x, y, val, rot }: any) {
    return (
        <g transform={`translate(${x}, ${y}) rotate(${rot})`} stroke="#94a3b8" fill="none" strokeWidth="0.8">
            <path d="M -5 -8 L 0 0 L 5 -8 L 10 0" />
            <line x1="-5" y1="-8" x2="15" y2="-8" />
            <text x="5" y="-12" fontSize="6" fontFamily="monospace" fill="#94a3b8" stroke="none" textAnchor="middle">{val}</text>
        </g>
    );
}

function ImbusSVG({ data }: { data: any }) {
    const maxDim = Math.max(data.D, data.T * 1.5);
    const scale = 140 / maxDim; // Increased base size
    const D = data.D * scale;
    const d = data.d * scale;
    const T = data.T * scale;

    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>
            <TitleBlock title={`DIN 912 Counterbore ${data.size}`} />
            <line x1="0" y1="-90" x2="0" y2="70" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            <path d={`M -100 -60 L -${D/2} -60 L -${D/2} ${-40 + T} L -${d/2} ${-40 + T} L -${d/2} 60 L -100 60 Z`} fill="url(#hatch)" stroke="#06b6d4" strokeWidth="1" />
            <path d={`M 100 -60 L ${D/2} -60 L ${D/2} ${-40 + T} L ${d/2} ${-40 + T} L ${d/2} 60 L 100 60 Z`} fill="url(#hatch)" stroke="#06b6d4" strokeWidth="1" />

            <path d={`M -${D/2} -60 L -${D/2} ${-40 + T} L -${d/2} ${-40 + T} L -${d/2} 60`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
            <path d={`M ${D/2} -60 L ${D/2} ${-40 + T} L ${d/2} ${-40 + T} L ${d/2} 60`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <SurfaceFinish x={-D/2} y={-20} val="Rz 16" rot={-90} />
            <SurfaceFinish x={0} y={-40 + T} val="Rz 25" rot={0} />

            <GDTBox x={-70} y={65} type="concentricity" tol="0.1" datum="A" />
            <path d="M -50 65 L -50 45 L -15 45" fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />
            <g transform={`translate(${d/2 + 25}, 40)`} stroke="#94a3b8" fill="none" strokeWidth="1">
                <rect x="0" y="0" width="12" height="12" />
                <text x="6" y="8" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1" stroke="none" textAnchor="middle">A</text>
            </g>
            <line x1={d/2} y1="46" x2={d/2+25} y2="46" stroke="#94a3b8" strokeWidth="1" />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                <line x1={-D/2} y1="-65" x2={-D/2} y2="-85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={D/2} y1="-65" x2={D/2} y2="-85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={-D/2} y1="-80" x2={D/2} y2="-80" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y="-85" textAnchor="middle">Ø{data.D} H12</text>

                <line x1={-d/2} y1="65" x2={-d/2} y2="85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={d/2} y1="65" x2={d/2} y2="85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={-d/2} y1="80" x2={d/2} y2="80" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y="90" textAnchor="middle">Ø{data.d} H13</text>

                <line x1={D/2 + 2} y1="-60" x2={D/2 + 45} y2="-60" stroke="#94a3b8" strokeWidth="1" />
                <line x1={D/2 + 2} y1={-40 + T} x2={D/2 + 45} y2={-40 + T} stroke="#94a3b8" strokeWidth="1" />
                <line x1={D/2 + 35} y1="-60" x2={D/2 + 35} y2={-40 + T} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={D/2 + 40} y={-60 + T/2 + 3} textAnchor="start">T={data.T}</text>
            </g>
        </svg>
    );
}

function KeywaySVG({ d, data }: { d: number, data: any }) {
    const scale = 160 / d; // Perfect fit for viewBox
    const rad = (d/2) * scale;
    const b = data.b * scale;
    const t1 = data.t1 * scale;
    const t2 = data.t2 * scale;
    const keywayBottom = -Math.sqrt(rad*rad - (b/2)*(b/2));
    
    return (
        <svg viewBox="-140 -140 280 280" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>

            <TitleBlock title="DIN 6885 Parallel Key" />

            <circle cx="0" cy="0" r={rad} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
            <line x1="-120" y1="0" x2="120" y2="0" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            <line x1="0" y1="-120" x2="0" y2="120" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />

            <path d={`
                M ${-rad} 0 
                A ${rad} ${rad} 0 1 0 ${rad} 0 
                A ${rad} ${rad} 0 0 0 ${b/2} ${keywayBottom}
                L ${b/2} ${-rad + t1}
                L ${-b/2} ${-rad + t1}
                L ${-b/2} ${keywayBottom}
                A ${rad} ${rad} 0 0 0 ${-rad} 0
            `} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <path d={`
                M ${-b/2} ${keywayBottom}
                L ${-b/2} ${-rad - t2}
                L ${b/2} ${-rad - t2}
                L ${b/2} ${keywayBottom}
            `} fill="none" stroke="#f97316" strokeDasharray="3,3" strokeWidth="2" />

            <GDTBox x={45} y={-rad+t1+25} type="parallelism" tol="0.05" datum="B" />
            <path d={`M 60 ${-rad+t1+25} L 60 ${-rad+t1} L ${b/2} ${-rad+t1}`} fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />

            <g transform={`translate(${-rad - 40}, 0)`} stroke="#94a3b8" fill="none" strokeWidth="1">
                <rect x="0" y="0" width="12" height="12" />
                <text x="6" y="8" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1" stroke="none" textAnchor="middle">B</text>
            </g>
            <line x1={-rad} y1="6" x2={-rad-28} y2="6" stroke="#94a3b8" strokeWidth="1" />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                <line x1={0} y1={rad} x2={45} y2={rad+25} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" />
                <text x="48" y={rad+28} textAnchor="start">Ø{d} k6</text>

                {/* Fix overlap for b */}
                <line x1={-b/2} y1={-rad + t1} x2={-b/2} y2={-rad - 55} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={b/2} y1={-rad + t1} x2={b/2} y2={-rad - 55} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-b/2} y1={-rad - 45} x2={b/2} y2={-rad - 45} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y={-rad - 50} textAnchor="middle">b={data.b} P9</text>

                {/* Fix overlap for t1 by placing it further left */}
                <line x1={-rad-45} y1={-rad + t1} x2={-b/2} y2={-rad + t1} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-rad-45} y1={-rad} x2={0} y2={-rad} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-rad-35} y1={-rad} x2={-rad-35} y2={-rad + t1} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={-rad-40} y={-rad + t1/2 + 3} textAnchor="end">t1={data.t1}</text>

                <line x1={rad+45} y1={-rad - t2} x2={b/2} y2={-rad - t2} stroke="#f97316" strokeWidth="0.8" />
                <line x1={rad+45} y1={-rad} x2={0} y2={-rad} stroke="#f97316" strokeWidth="0.8" />
                <line x1={rad+35} y1={-rad - t2} x2={rad+35} y2={-rad} stroke="#f97316" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={rad+40} y={-rad - t2/2 + 3} textAnchor="start" fill="#f97316">Hub t2={data.t2}</text>
            </g>
        </svg>
    );
}

function CirclipSVG({ type, data }: { type: string, data: any }) {
    const scale = 140 / data.d; // Increased to fill viewBox
    const r1 = (data.d/2) * scale;
    const r2 = (data.d2/2) * scale;
    // Increase visual m to avoid text overlap
    const m_visual = Math.max(data.m * scale, 12); 
    const n_visual = m_visual * 2; 

    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch2" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>
            <TitleBlock title={`DIN 47${type==='shaft'?'1':'2'} Circlip Groove`} />
            <line x1="-100" y1="0" x2="100" y2="0" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            {type === 'shaft' ? (
                <g>
                    <rect x="-90" y={-r1} width={90-m_visual/2} height={r1*2} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="1" />
                    <rect x={m_visual/2} y={-r1} width={n_visual} height={r1*2} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="1" />
                    <rect x={m_visual/2+n_visual} y={-r1} width="20" height={r1*2} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3,3" />
                    <rect x={-m_visual/2} y={-r2} width={m_visual} height={r2*2} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="1" />
                    <path d={`M -90 -${r1} L -${m_visual/2} -${r1} L -${m_visual/2} -${r2} L ${m_visual/2} -${r2} L ${m_visual/2} -${r1} L ${m_visual/2+n_visual} -${r1}`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                    <path d={`M -90 ${r1} L -${m_visual/2} ${r1} L -${m_visual/2} ${r2} L ${m_visual/2} ${r2} L ${m_visual/2} ${r1} L ${m_visual/2+n_visual} ${r1}`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                    <SurfaceFinish x={0} y={-r2} val="Rz 10" rot={0} />

                    <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                        <line x1={-m_visual/2} y1={-r1-45} x2={-m_visual/2} y2={-r1} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={m_visual/2} y1={-r1-45} x2={m_visual/2} y2={-r1} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={-m_visual/2} y1={-r1-35} x2={m_visual/2} y2={-r1-35} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="0" y={-r1-40} textAnchor="middle">m={data.m} H13</text>

                        <line x1={m_visual/2} y1={-r1-20} x2={m_visual/2+n_visual} y2={-r1-20} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x={m_visual/2+n_visual/2} y={-r1-25} textAnchor="middle">n min</text>

                        <line x1="30" y1={-r2} x2="80" y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="30" y1={r2} x2="80" y2={r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="70" y1={-r2} x2="70" y2={r2} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="75" y="3" textAnchor="start">Ø{data.d2.toFixed(2)} h11</text>
                    </g>
                </g>
            ) : (
                <g>
                    <path d={`M -90 -90 L 90 -90 L 90 -${r1} L ${m_visual/2} -${r1} L ${m_visual/2} -${r2} L -${m_visual/2} -${r2} L -${m_visual/2} -${r1} L -90 -${r1} Z`} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="2" />
                    <path d={`M -90 90 L 90 90 L 90 ${r1} L ${m_visual/2} ${r1} L ${m_visual/2} ${r2} L -${m_visual/2} ${r2} L -${m_visual/2} ${r1} L -90 ${r1} Z`} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="2" />

                    <SurfaceFinish x={0} y={-r2} val="Rz 10" rot={180} />

                    <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                        <line x1={-m_visual/2} y1={-r2-45} x2={-m_visual/2} y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={m_visual/2} y1={-r2-45} x2={m_visual/2} y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={-m_visual/2} y1={-r2-35} x2={m_visual/2} y2={-r2-35} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="0" y={-r2-40} textAnchor="middle">m={data.m} H13</text>

                        <line x1="30" y1={-r2} x2="80" y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="30" y1={r2} x2="80" y2={r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="70" y1={-r2} x2="70" y2={r2} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="75" y="3" textAnchor="start">Ø{data.d2.toFixed(2)} H11</text>
                    </g>
                </g>
            )}
        </svg>
    );
}

function CenterDrillSVG({ data }: { data: any }) {
    const scale = 140 / data.d2;
    const d1 = data.d1 * scale;
    const d2 = data.d2 * scale;
    const t = data.t * scale;
    const pilotL = t * 0.4; 
    const tipL = d1 * 0.3; 

    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch3" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>
            <TitleBlock title="DIN 332 Center Drill Form A" />
            <line x1="0" y1="-100" x2="0" y2="90" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            <path d={`
                M -100 -80 L 100 -80 L 100 80 L -100 80 Z
                M -${d2/2} -80
                L -${d2/2} -${t}
                L -${d1/2} -${pilotL}
                L -${d1/2} ${tipL}
                L 0 ${tipL + d1/2}
                L ${d1/2} ${tipL}
                L ${d1/2} -${pilotL}
                L ${d2/2} -${t}
                L ${d2/2} -80 Z
            `} fill="url(#hatch3)" fillRule="evenodd" stroke="none" />

            <path d={`
                M -${d2/2} -80
                L -${d2/2} -${t}
                L -${d1/2} -${pilotL}
                L -${d1/2} ${tipL}
                L 0 ${tipL + d1/2}
                L ${d1/2} ${tipL}
                L ${d1/2} -${pilotL}
                L ${d2/2} -${t}
                L ${d2/2} -80
            `} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <SurfaceFinish x={-d1/2 - (d2/2-d1/2)/2} y={-pilotL - (t-pilotL)/2} val="Rz 6.3" rot={-60} />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                <path d={`M -${d2/2} -${t+12} A 30 30 0 0 0 ${d2/2} -${t+12}`} fill="none" stroke="#94a3b8" strokeWidth="1" />
                <text x="0" y={-t-15} textAnchor="middle">60°</text>
                <text x="0" y={tipL + d1/2 + 15} textAnchor="middle">120°</text>

                <line x1={-d2/2} y1="-95" x2={d2/2} y2="-95" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <line x1={-d2/2} y1="-95" x2={-d2/2} y2="-80" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2} y1="-95" x2={d2/2} y2="-80" stroke="#94a3b8" strokeWidth="0.8" />
                <text x="0" y="-99" textAnchor="middle">Ø{data.d2}</text>

                <line x1={-d1/2} y1="0" x2={d1/2} y2="0" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={d1/2 + 10} y="3" textAnchor="start">Ø{data.d1}</text>

                <line x1={d2/2 + 2} y1="-80" x2={d2/2 + 45} y2="-80" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2 + 2} y1={-t} x2={d2/2 + 45} y2={-t} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2 + 35} y1="-80" x2={d2/2 + 35} y2={-t} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={d2/2 + 40} y={-t/2 + 3} textAnchor="start">t={data.t}</text>
            </g>
        </svg>
    );
}

function CountersinkSVG({ data }: { data: any }) {
    const maxDim = Math.max(data.d2, data.t * 2);
    const scale = 140 / maxDim;
    const d1 = data.d1 * scale;
    const d2 = data.d2 * scale;
    const t = data.t * scale;
    const k = data.k * scale;

    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch5" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>
            <TitleBlock title={`DIN 74 Form F Countersink ${data.size}`} />
            
            <line x1="0" y1="-90" x2="0" y2="70" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            {/* Cut material section */}
            <path d={`
                M -100 -60 L 100 -60 L 100 60 L -100 60 Z
                M -${d2/2} -60
                L -${d1/2} ${-60 + t}
                L -${d1/2} 60
                L 0 60
                L ${d1/2} 60
                L ${d1/2} ${-60 + t}
                L ${d2/2} -60 Z
            `} fill="url(#hatch5)" fillRule="evenodd" stroke="none" />

            {/* Profile lines */}
            <path d={`
                M -${d2/2} -60
                L -${d1/2} ${-60 + t}
                L -${d1/2} 60
            `} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
            <path d={`
                M ${d2/2} -60
                L ${d1/2} ${-60 + t}
                L ${d1/2} 60
            `} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <SurfaceFinish x={-d1/2 - (d2/2-d1/2)/2} y={-60 + t/2} val="Rz 12.5" rot={-45} />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                {/* Angle */}
                <path d={`M -${d1/2 + 5} ${-60 + t + 5} A 30 30 0 0 0 ${d1/2 + 5} ${-60 + t + 5}`} fill="none" stroke="#94a3b8" strokeWidth="1" />
                <text x="0" y={-60 + t + 15} textAnchor="middle">{data.alpha}°</text>

                {/* Diameters */}
                <line x1={-d2/2} y1="-65" x2={-d2/2} y2="-85" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2} y1="-65" x2={d2/2} y2="-85" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-d2/2} y1="-80" x2={d2/2} y2="-80" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y="-85" textAnchor="middle">Ø{data.d2} H12</text>

                <line x1={-d1/2} y1="65" x2={-d1/2} y2="85" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d1/2} y1="65" x2={d1/2} y2="85" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-d1/2} y1="80" x2={d1/2} y2="80" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y="77" textAnchor="middle">Ø{data.d1} H13</text>

                {/* Depth */}
                <line x1={d2/2 + 5} y1="-60" x2={d2/2 + 45} y2="-60" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d1/2 + 5} y1={-60 + t} x2={d2/2 + 45} y2={-60 + t} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2 + 35} y1="-60" x2={d2/2 + 35} y2={-60 + t} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={d2/2 + 40} y={-60 + t/2 + 3} textAnchor="start">t={data.t}</text>

                <text x={-d2/2 - 10} y={-60 + t/2} textAnchor="end" opacity="0.7">Head k={data.k}</text>
            </g>
        </svg>
    );
}

// Ensure TitleBlock, GDTBox, and SurfaceFinish are present before the export default if they were stripped.
// Wait, they are at the top, or they are defined in MachiningDetailsModule.tsx before SVG HELPER COMPONENTS.
// Actually, earlier in MachiningDetailsModule.tsx, there are helper components. Let's make sure they are not duplicated.
// The split marker is `// SVG HELPER COMPONENTS` so the helpers should be in parts[0] or parts[1].
// Let's just append the new SVGs directly.
