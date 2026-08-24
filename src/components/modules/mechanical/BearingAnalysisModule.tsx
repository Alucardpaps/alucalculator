'use client';

import React, { useState, useMemo } from 'react';
import MathJaxModule from 'react-mathjax2';
const MathJax = MathJaxModule as any;
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings2, Ruler, ShieldAlert, Cpu, 
    Layers, PenTool, Box, Zap, Search,
    ArrowRight, Activity, Gauge
} from 'lucide-react';
import { SaveButton } from "@/components/calculation/SaveButton";
import { 
    BEARING_CATALOG, 
    BearingData, 
    getBearingTypeInfo,
    BearingType
} from '@/data/skfBearings';
import { analyzeBearingLife, getLifeSensitivity } from '@/lib/mechanical/bearingLifeEngine';

export default function BearingAnalysisModule() {
    const [searchQuery, setSearchQuery] = useState('6204');
    const [radialLoad, setRadialLoad] = useState(2.5); // kN
    const [axialLoad, setAxialLoad] = useState(0.5);   // kN
    const [rpm, setRpm] = useState(1500);
    const [reliability, setReliability] = useState(90);
    const [viscosity, setViscosity] = useState(32); // ISO VG 32 or similar at op temp

    const [selectedType, setSelectedType] = useState<BearingType | 'all'>('all');
    const [selectedSeries, setSelectedSeries] = useState<string | 'all'>('all');

    // 1. Filtered List
    const availableSeries = useMemo(() => {
        const series = new Set<string>();
        BEARING_CATALOG.forEach(b => {
            if (selectedType === 'all' || b.type === selectedType) {
                const s = b.code.substring(0, b.code.length - 2);
                series.add(s);
            }
        });
        return Array.from(series).sort();
    }, [selectedType]);

    const filteredBearings = useMemo(() => {
        return BEARING_CATALOG.filter(b => {
            const matchesType = selectedType === 'all' || b.type === selectedType;
            const s = b.code.substring(0, b.code.length - 2);
            const matchesSeries = selectedSeries === 'all' || s === selectedSeries;
            const matchesSearch = b.code.toUpperCase().includes(searchQuery.toUpperCase());
            return matchesType && matchesSeries && matchesSearch;
        }).slice(0, 100); // Limit UI count for performance
    }, [selectedType, selectedSeries, searchQuery]);

    const activeBearing = useMemo(() => {
        const found = BEARING_CATALOG.find(b => b.code.toUpperCase() === searchQuery.toUpperCase());
        return found || filteredBearings[0] || BEARING_CATALOG[0];
    }, [searchQuery, filteredBearings]);

    const typeInfo = getBearingTypeInfo(activeBearing.type);

    // 2. Results
    const results = useMemo(() => {
        return analyzeBearingLife({
            bearing: activeBearing,
            fr: radialLoad,
            fa: axialLoad,
            rpm,
            reliability,
            baseViscosity: viscosity
        });
    }, [activeBearing, radialLoad, axialLoad, rpm, reliability, viscosity]);

    // 3. Sensitivity Data
    const sensitivity = useMemo(() => {
        return getLifeSensitivity({
            bearing: activeBearing,
            fr: radialLoad,
            fa: axialLoad,
            rpm,
            reliability,
            baseViscosity: viscosity
        }, 12);
    }, [activeBearing, radialLoad, axialLoad, rpm, reliability, viscosity]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-y-auto lg:overflow-hidden p-2 gap-4">
            {/* CONFIGURATION SIDEBAR (38%) */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full bg-[#0b121d]/80 rounded-2xl border border-white/5 backdrop-blur-3xl px-6 py-6 overflow-y-auto custom-scrollbar shadow-2xl">
                
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                            <Activity size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-100 uppercase">ISO 281 Suite</h2>
                            <p className="text-[10px] text-indigo-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Bearing Analytics & Life Prediction</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Bearing Selection */}
                    <ControlGroup label="Bearing Selection" icon={<Search size={14} />}>
                        <div className="flex flex-col gap-3">
                            <div className="relative group">
                                <input 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search SKF Code (e.g. 6204)..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm font-semibold outline-none focus:border-indigo-500/50 transition-all uppercase"
                                />
                                <Search size={16} className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-indigo-400" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <select 
                                    value={selectedType}
                                    onChange={(e) => { setSelectedType(e.target.value as any); setSelectedSeries('all'); }}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-[10px] font-bold text-gray-400 outline-none focus:border-indigo-500/50"
                                >
                                    <option value="all">ALL TYPES</option>
                                    <option value="deep-groove-ball">BALL</option>
                                    <option value="angular-contact-ball">ANGULAR</option>
                                    <option value="cylindrical-roller">CYLINDRICAL</option>
                                    <option value="spherical-roller">SPHERICAL</option>
                                    <option value="tapered-roller">TAPERED</option>
                                    <option value="thrust-ball">THRUST</option>
                                </select>
                                <select 
                                    value={selectedSeries}
                                    onChange={(e) => setSelectedSeries(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-[10px] font-bold text-gray-400 outline-none focus:border-indigo-500/50"
                                >
                                    <option value="all">ALL SERIES</option>
                                    {availableSeries.map(s => <option key={s} value={s}>{s}XXX</option>)}
                                </select>
                            </div>

                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-1">
                                {filteredBearings.map(b => (
                                    <button 
                                        key={b.code} 
                                        onClick={() => setSearchQuery(b.code)} 
                                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${activeBearing.code === b.code ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.08]'}`}
                                    >
                                        {b.code}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ControlGroup>

                    {/* Operational Loads */}
                    <ControlGroup label="Operational Loads" icon={<Gauge size={14} />}>
                        <div className="space-y-6">
                            <PremiumNumBox label="Radial Load (Fr)" unit="kN" value={radialLoad} min={0.1} max={100} step={0.1} onChange={setRadialLoad} color="#6366f1" />
                            <PremiumNumBox label="Axial Load (Fa)" unit="kN" value={axialLoad} min={0} max={50} step={0.1} onChange={setAxialLoad} color="#8b5cf6" />
                        </div>
                    </ControlGroup>

                    {/* Speed & Reliability */}
                    <ControlGroup label="Speed & Environment" icon={<Zap size={14} />}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <PremiumNumBox label="Operating RPM" unit="RPM" value={rpm} min={10} max={20000} step={100} onChange={setRpm} color="#10b981" />
                                <div className="flex flex-col gap-2 group">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Reliability</span>
                                    <select 
                                        value={reliability}
                                        onChange={(e) => setReliability(Number(e.target.value))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {[90, 95, 96, 97, 98, 99].map(r => <option key={r} value={r} className="bg-[#0b121d] text-white">L{100-r} ({r}%)</option>)}
                                    </select>
                                </div>
                            </div>
                            <PremiumNumBox label="Operating Viscosity (ν)" unit="mm²/s" value={viscosity} min={2} max={1000} step={1} onChange={setViscosity} color="#0ea5e9" />
                        </div>
                    </ControlGroup>
                </div>
            </div>

            {/* MAIN CONTENT (62%) */}
            <div className="flex-1 h-auto lg:h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar min-w-0">
                
                {/* PREVIEW HEADER */}
                <div className="bg-[#0b121d]/50 p-6 rounded-[28px] border border-white/5 relative overflow-hidden flex items-center justify-between shadow-lg">
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">{activeBearing.type.replace(/-/g, ' ')}</span>
                        <h1 className="text-4xl font-black tracking-tighter text-white">SKF {activeBearing.code}</h1>
                        <div className="flex gap-4 mt-2">
                           <DimensionTag label="d (Bore)" value={activeBearing.d} />
                           <DimensionTag label="D (Outer)" value={activeBearing.D} />
                           <DimensionTag label="B (Width)" value={activeBearing.B} />
                        </div>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl relative z-10">
                        <div className="flex items-center gap-6">
                            <VerticalStat label="Dynamic (C)" value={`${activeBearing.C} kN`} color="#6366f1" />
                            <VerticalStat label="Static (C0)" value={`${activeBearing.C0} kN`} color="#f59e0b" />
                        </div>
                    </div>
                    {/* Abstract background graphics */}
                    <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
                </div>

                <div className="grid grid-cols-3 gap-4 flex-none">
                    <KPICard label="Rating Life L10h" value={results.L10h.toFixed(0)} unit="Hours" color="#10b981" sub={`At ${rpm} RPM`} />
                    <KPICard label="Equivalent Load P" value={results.P.toFixed(2)} unit="kN" color="#6366f1" sub="Dynamic Equiv." />
                    <KPICard label="Safety Factor s0" value={results.staticSafety.toFixed(2)} unit="Safety" color="#f59e0b" sub="Static P0 Check" />
                </div>

                {/* SENSITIVITY PLOT */}
                <div className="flex-1 min-h-[350px] bg-[#080d14] rounded-[32px] border border-white/5 flex flex-col p-8 relative overflow-hidden group shadow-inner">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <Activity size={16} className="text-indigo-500" /> Life sensitivity Analysis
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">L10h expectation vs. Radial Load variability</p>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                <span className="text-[9px] font-bold text-gray-500 uppercase italic">L10h Target</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative z-10 flex items-center justify-center">
                        <div className="w-full h-full relative">
                            <SensitivityPlot data={sensitivity} maxLife={results.L10h * 2} currentLife={results.L10h} currentLoad={radialLoad} />
                        </div>
                    </div>

                    <div className="absolute top-0 right-0 p-8">
                         <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${results.status === 'safe' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : results.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'}`}>
                             System Status: {results.status}
                         </div>
                    </div>
                </div>

                {/* ENGINEERING DETAILS */}
                <div className="bg-[#0b121d]/40 p-6 rounded-[28px] border border-white/5 flex gap-8 items-center text-gray-400 shadow-md">
                   <div className="flex flex-col gap-1 flex-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60">Reliability & Lube (κ)</span>
                       <p className="text-[11px] leading-relaxed">Adjusted life <span className="text-white font-bold">Lnm = {results.Lna?.toFixed(0)}h</span> calculated for {reliability}% reliability and <span className="text-sky-400 font-bold">κ = {results.viscosityRatio?.toFixed(2)}</span>. Lubrication film is {results.viscosityRatio! < 1 ? 'insufficient' : results.viscosityRatio! < 4 ? 'adequate' : 'optimal'}.</p>
                   </div>
                   <div className="h-10 w-[1px] bg-white/5 shrink-0" />
                   <div className="flex flex-col gap-1 flex-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60">ISO 281:2007 Compliance</span>
                       <p className="text-[11px] leading-relaxed">Basic rating life equation used with exponent p={getLifeExponent(activeBearing.code) === 3 ? '3.0' : '3.33'}. Standard safety margin enforced for high-speed industrial apps.</p>
                   </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function DimensionTag({ label, value }: { label: string, value: number }) {
    return (
        <div className="px-3 py-1.5 bg-indigo-500/5 rounded-lg border border-indigo-500/10 flex gap-2 items-baseline">
            <span className="text-[9px] font-bold text-indigo-400/80 uppercase">{label}</span>
            <span className="text-xs font-black font-mono tracking-wider">{value}mm</span>
        </div>
    );
}

function VerticalStat({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
            <span className="text-lg font-black font-mono" style={{ color }}>{value}</span>
        </div>
    );
}

function ControlGroup({ label, icon, children }: { label: string, icon: any, children: any }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-400/50">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
            </div>
            {children}
        </div>
    );
}

function PremiumNumBox({ label, unit, value, min, max, step, onChange, color }: any) {
    return (
        <div className="group relative">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-indigo-400 transition-colors">{label}</span>
                <span className="text-[9px] font-black font-mono transition-transform group-hover:scale-110" style={{ color }}>{unit}</span>
            </div>
            <div className="relative flex items-center bg-indigo-500/5 border border-white/5 rounded-xl transition-all duration-300 group-focus-within:border-indigo-500/40 group-focus-within:shadow-[0_0_20px_rgba(99,102,241,0.05)]">
                <input
                    type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-sm font-black font-mono px-4 py-2.5 text-white outline-none"
                    style={{ textShadow: `0 0 12px ${color}40` }}
                />
            </div>
            <div className="mt-3 px-1 opacity-40 hover:opacity-100 transition-opacity">
                <input
                    type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}

function KPICard({ label, value, unit, color, sub }: any) {
    return (
        <div className="bg-[#0b121d]/80 rounded-[28px] border border-white/5 p-6 flex flex-col gap-1 shadow-lg backdrop-blur-xl group hover:border-indigo-500/20 transition-all">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono tracking-tighter transition-all group-hover:scale-105" style={{ color }}>{value}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{unit}</span>
            </div>
            <div className="text-[9px] font-bold text-white/15 uppercase tracking-[0.2em] mt-2 group-hover:text-white/30 transition-colors">{sub}</div>
        </div>
    );
}

function SensitivityPlot({ data, currentLife, currentLoad }: any) {
    const [hoverPos, setHoverPos] = useState<{ x: number, y: number, load: number, life: number } | null>(null);
    
    const width = 800;
    const height = 250;
    const padding = { top: 20, right: 80, bottom: 40, left: 60 };

    const maxL = Math.max(...data.map((d: any) => d.life));
    const minLoad = Math.min(...data.map((d: any) => d.load));
    const maxLoad = Math.max(...data.map((d: any) => d.load));

    const getX = (load: number) => padding.left + ((load - minLoad) / (maxLoad - minLoad)) * (width - padding.left - padding.right);
    const getY = (life: number) => height - padding.bottom - (life / maxL) * (height - padding.top - padding.bottom);

    const points = data.map((d: any) => `${getX(d.load)},${getY(d.life)}`).join(' ');

    const curX = getX(currentLoad);
    const curY = getY(currentLife);

    // Ticks for Y axis (Life)
    const yTicks = [0, maxL * 0.25, maxL * 0.5, maxL * 0.75, maxL];
    // Ticks for X axis (Load)
    const xTicks = [minLoad, (minLoad + maxLoad) / 2, maxLoad];

    return (
        <div className="w-full h-full relative group/plot select-none">
            <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-full overflow-visible"
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const mouseX = (e.clientX - rect.left) * (width / rect.width);
                    if (mouseX >= padding.left && mouseX <= width - padding.right) {
                        const load = minLoad + ((mouseX - padding.left) / (width - padding.left - padding.right)) * (maxLoad - minLoad);
                        const closest = data.reduce((prev: any, curr: any) => 
                            Math.abs(curr.load - load) < Math.abs(prev.load - load) ? curr : prev
                        );
                        setHoverPos({ x: getX(closest.load), y: getY(closest.life), load: closest.load, life: closest.life });
                    }
                }}
                onMouseLeave={() => setHoverPos(null)}
            >
                {/* Background Grid - Engineering Logic */}
                {yTicks.map((val, i) => (
                    <g key={i}>
                        <line 
                            x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)} 
                            stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2,2" 
                        />
                        <text x={padding.left - 10} y={getY(val)} fill="#4b5563" fontSize="10" fontWeight="bold" textAnchor="end" alignmentBaseline="middle" className="font-mono">
                            {val.toFixed(0)}
                        </text>
                    </g>
                ))}

                {xTicks.map((val, i) => (
                    <g key={i}>
                        <line 
                            x1={getX(val)} y1={height - padding.bottom} x2={getX(val)} y2={padding.top} 
                            stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2,2" 
                        />
                        <text x={getX(val)} y={height - padding.bottom + 15} fill="#4b5563" fontSize="10" fontWeight="bold" textAnchor="middle" className="font-mono">
                            {val.toFixed(1)} kN
                        </text>
                    </g>
                ))}

                {/* Axes */}
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#374151" strokeWidth="1" />
                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#374151" strokeWidth="1" />

                {/* The Path - Sharp Technical Line */}
                <polyline 
                    points={points} 
                    fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                />

                {/* Current Operating Point Indicator */}
                <line x1={curX} y1={padding.top} x2={curX} y2={height - padding.bottom} stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1" strokeDasharray="4,4" />
                <circle cx={curX} cy={curY} r="4" fill="#f59e0b" className="animate-pulse" />
                <text x={curX + 8} y={curY - 8} fill="#f59e0b" fontSize="10" fontWeight="bold" className="font-mono">OP POINT</text>

                {/* Interactive Crosshair & Tooltip */}
                {hoverPos && (
                    <g>
                        <line x1={hoverPos.x} y1={padding.top} x2={hoverPos.x} y2={height - padding.bottom} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                        <line x1={padding.left} y1={hoverPos.y} x2={width - padding.right} y2={hoverPos.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                        <circle cx={hoverPos.x} cy={hoverPos.y} r="6" fill="rgba(99,102,241,0.5)" stroke="#fff" strokeWidth="1" />
                        
                        <rect x={hoverPos.x + 10} y={hoverPos.y - 40} width="100" height="35" rx="4" fill="#111827" stroke="#374151" strokeWidth="1" />
                        <text x={hoverPos.x + 15} y={hoverPos.y - 28} fill="#fff" fontSize="9" fontWeight="bold" className="font-mono">LOAD: {hoverPos.load.toFixed(1)} kN</text>
                        <text x={hoverPos.x + 15} y={hoverPos.y - 15} fill="#10b981" fontSize="9" fontWeight="bold" className="font-mono">LIFE: {hoverPos.life.toFixed(0)} HRS</text>
                    </g>
                )}
            </svg>
        </div>
    );
}

function getLifeExponent(code: string): number {
    const upper = code.toUpperCase();
    if (/^[NU|NJ|NF|RNA|NA|NK|3|2]/.test(upper)) return 10/3;
    return 3;
}
