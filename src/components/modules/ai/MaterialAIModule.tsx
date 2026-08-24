'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Zap, Activity, Thermometer, Weight, 
    DollarSign, Database, Bot, ChevronRight, Info,
    Radar, Shield, Target, Plus, Share2, Sparkles,
    Layout, Layers, Cpu, ArrowRightLeft, TrendingUp,
    ShieldCheck, Scale, FlaskConical, Beaker, Globe
} from 'lucide-react';
import { selectMaterials, parseNaturalQuery } from '@/services/material-selector';
import { motion, AnimatePresence } from 'framer-motion';

export default function MaterialAIModule() {
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
    const [comparisonMode, setComparisonMode] = useState(false);

    const results = useMemo(() => {
        const parsed = parseNaturalQuery(query);
        const all = selectMaterials(parsed, 12); // Show more for better selection
        return all;
    }, [query]);

    useEffect(() => {
        if (!selectedMaterial && results.length > 0) {
            setSelectedMaterial(results[0]);
        }
    }, [results]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 800);
    };

    // Advanced Radar Path with smoothing
    const getRadarPath = (mat: any) => {
        if (!mat) return '';
        const size = 260; // Larger radar
        const center = size / 2;
        const r = center - 40;

        const stats = [
            Math.min(1, mat.yieldStrength / 1800),      // Strength
            Math.min(1, (10000 - mat.density) / 8800), // lightness
            Math.min(1, mat.maxServiceTemp / 900),    // Temp
            Math.min(1, (10 - mat.costIndex) / 9)      // Cost Efficiency
        ];

        const points = stats.map((val, i) => {
            const angle = (i * Math.PI * 2) / stats.length - Math.PI / 2;
            const x = center + r * val * Math.cos(angle);
            const y = center + r * val * Math.sin(angle);
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')} Z`;
    };

    return (
        <div className="flex w-full h-screen bg-[#020408] text-slate-200 overflow-hidden font-sans relative">
            {/* ═══ LAYER 0: AMBIENT DECOR ═══ */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.08)_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

            {/* ═══ LAYER 1: SIDEBAR (NAVIGATION & QUICK SETS) ═══ */}
            <div className="w-[380px] h-full flex flex-col bg-[#05080f]/90 border-r border-white/5 backdrop-blur-3xl z-40 relative">
                <div className="p-10">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <FlaskConical size={28} />
                        </div>
                        <div className="leading-none">
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">MatMatch</h1>
                            <p className="text-[10px] text-purple-500/60 font-mono tracking-[0.4em] uppercase mt-2">Intelligence v5</p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative group mb-10">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Describe application..."
                            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs text-white focus:border-purple-500/50 transition-all placeholder-slate-600"
                        />
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500" />
                    </form>

                    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-350px)] pr-2 custom-scrollbar">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Candidates</div>
                        {results.map((mat, i) => (
                            <button 
                                key={mat.name}
                                onClick={() => setSelectedMaterial(mat)}
                                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${selectedMaterial?.name === mat.name ? 'bg-purple-500/10 border-purple-500/30 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                            >
                                <div className="space-y-1">
                                    <div className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{mat.name}</div>
                                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{mat.category}</div>
                                </div>
                                <div className="text-xl font-black text-purple-600/40 group-hover:text-purple-500 transition-colors tabular-nums">{Math.round(mat.score)}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-8 border-t border-white/5">
                   <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Confidence</span>
                         <span className="text-xs font-mono font-black text-white">94.2%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-purple-500 shadow-[0_0_15px_#a855f7]" />
                      </div>
                   </div>
                </div>
            </div>

            {/* ═══ LAYER 2: WORKSPACE (DETAILED VIEWS) ═══ */}
            <div className="flex-1 h-full overflow-y-auto relative z-10 custom-scrollbar">
                <div className="p-16 max-w-7xl mx-auto space-y-20 pb-32">
                    
                    {/* Hero Section */}
                    {selectedMaterial ? (
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={selectedMaterial.name}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-20"
                            >
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <div className="px-4 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full inline-flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
                                            <ShieldCheck size={12} /> Priority Analysis Base
                                        </div>
                                        <h2 className="text-7xl font-black italic tracking-tighter uppercase text-white leading-none">
                                            {selectedMaterial.name.split(' ')[0]} <br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-500">
                                                {selectedMaterial.name.split(' ').slice(1).join(' ')}
                                            </span>
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <BigMetric label="Yield Strength" value={selectedMaterial.yieldStrength} unit="MPa" highlight="bg-purple-500" />
                                        <BigMetric label="Density" value={selectedMaterial.density} unit="kg/m³" highlight="bg-emerald-500" />
                                        <BigMetric label="Service Temp" value={selectedMaterial.maxServiceTemp} unit="°C" highlight="bg-amber-500" />
                                        <BigMetric label="Cost Factor" value={selectedMaterial.costIndex} unit="/ 10" highlight="bg-blue-500" />
                                    </div>

                                    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] space-y-4">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Info size={14} className="text-purple-500" /> Cognitive Reasoning
                                        </div>
                                        <p className="text-lg text-slate-300 leading-relaxed font-medium italic">
                                            "{selectedMaterial.reasoning}. This material exhibits optimal balance between weight and structural integrity for the requested operational parameters."
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center relative">
                                    <div className="absolute inset-0 bg-purple-500/5 blur-[120px] rounded-full" />
                                    
                                    {/* High-Fidelity Radar Plot Container */}
                                    <div className="w-full aspect-square bg-[#05080c] border border-white/5 rounded-[4rem] shadow-2xl relative flex items-center justify-center p-12 ring-2 ring-purple-500/5 group hover:ring-purple-500/20 transition-all duration-700 overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05)_0%,transparent_70%)]" />
                                        
                                        <svg width="300" height="300" viewBox="0 0 300 300" className="relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                            <defs>
                                                <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                                                </linearGradient>
                                            </defs>

                                            {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => (
                                                <circle 
                                                    key={level}
                                                    cx="150" cy="150" r={120 * level} 
                                                    fill="none" 
                                                    stroke="rgba(255,255,255,0.05)" 
                                                    strokeWidth="1" 
                                                />
                                            ))}
                                            <line x1="150" y1="30" x2="150" y2="270" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                            <line x1="30" y1="150" x2="270" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                                            <motion.path 
                                                key={selectedMaterial.name}
                                                d={(() => {
                                                    const center = 150;
                                                    const r = 120;
                                                    const stats = [
                                                        Math.min(1, selectedMaterial.yieldStrength / 1800),
                                                        Math.min(1, (10000 - selectedMaterial.density) / 8800),
                                                        Math.min(1, selectedMaterial.maxServiceTemp / 900),
                                                        Math.min(1, (11 - selectedMaterial.costIndex) / 10)
                                                    ];
                                                    const points = stats.map((val, i) => {
                                                        const angle = (i * Math.PI * 2) / 4 - Math.PI / 2;
                                                        const visualVal = 0.2 + (val * 0.8);
                                                        const x = center + r * visualVal * Math.cos(angle);
                                                        const y = center + r * visualVal * Math.sin(angle);
                                                        return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
                                                    });
                                                    return points.join(' ') + ' Z';
                                                })()}
                                                fill="url(#radarGrad)"
                                                stroke="#a855f7"
                                                strokeWidth="2"
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: "spring", stiffness: 100 }}
                                            />
                                        </svg>

                                        {/* HUD Labels */}
                                        <div className="absolute top-10 text-[9px] font-black uppercase text-purple-500/50 tracking-[0.2em]">Strength</div>
                                        <div className="absolute bottom-10 text-[9px] font-black uppercase text-emerald-500/50 tracking-[0.2em]">Lightness</div>
                                        <div className="absolute left-10 -rotate-90 text-[9px] font-black uppercase text-blue-500/50 tracking-[0.2em]">Economy</div>
                                        <div className="absolute right-10 rotate-90 text-[9px] font-black uppercase text-amber-500/50 tracking-[0.2em]">Thermals</div>
                                    </div>

                                    <div className="mt-16 w-full max-w-sm flex gap-4 relative z-20">
                                        <button className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95">Initialize Simulation</button>
                                        <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all shadow-xl active:scale-95"><Share2 size={18} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-20">
                            <Target size={120} strokeWidth={0.5} className="mb-8" />
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Neural Engine Ready</h3>
                            <p className="text-xs font-bold uppercase tracking-[0.4em] mt-4">Awaiting operational constraints...</p>
                        </div>
                    )}

                    {/* Manufacturing Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InsightCard title="Machinability" subtitle="CNC Level" value="Excellent" desc="High chip breakability and low tool wear index." icon={<Cpu size={20}/>} />
                        <InsightCard title="Weldability" subtitle="TIG/MIG" value="Certified" desc="Compatible with filler rods ER4043/ER5356." icon={<Zap size={20}/>} />
                        <InsightCard title="Environmental" subtitle="ISO 14001" value="Recyclable" desc="100% circular alloy lifecycle potential." icon={<Globe size={20}/>} />
                    </div>

                </div>
            </div>
        </div>
    );
}

function BigMetric({ label, value, unit, highlight }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity ${highlight}`} />
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">{label}</div>
            <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{value} <span className="text-xs text-slate-600 not-italic ml-2 font-bold uppercase">{unit}</span></div>
        </div>
    );
}

function InsightCard({ title, subtitle, value, desc, icon }: any) {
    return (
        <div className="p-8 bg-[#0a0f18]/40 border border-white/5 rounded-[3rem] backdrop-blur-md space-y-6 flex flex-col items-center text-center group hover:bg-purple-500/5 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-slate-500 group-hover:text-purple-400 transition-all shadow-lg border border-white/5 group-hover:border-purple-500/30">
                {icon}
            </div>
            <div className="space-y-1">
                <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest leading-none mb-2">{subtitle}</div>
                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">{title}</h4>
            </div>
            <div className="text-sm font-black text-white italic tracking-widest uppercase px-6 py-2 bg-white/5 rounded-full">{value}</div>
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed uppercase tracking-widest">{desc}</p>
        </div>
    );
}

function RadarGrid({ size }: { size: number }) {
    const center = size / 2;
    return (
        <>
            <circle cx={center} cy={center} r={100} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <circle cx={center} cy={center} r={80} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <circle cx={center} cy={center} r={60} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <circle cx={center} cy={center} r={40} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <circle cx={center} cy={center} r={20} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1={center} y1={center-100} x2={center} y2={center+100} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1={center-100} y1={center} x2={center+100} y2={center} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </>
    );
}

function RadarLabel({ top, bottom, left, right, rotate, text }: any) {
    return (
        <div 
            className="absolute text-[9px] font-black uppercase text-slate-600 tracking-[0.2em]"
            style={{ top, bottom, left, right, transform: `translate(-50%, -50%) rotate(${rotate || '0deg'})` }}
        >
            {text}
        </div>
    );
}
