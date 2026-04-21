'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Database, Search, Box, Thermometer, 
    ShieldCheck, Activity, Brain, Share2,
    Download, Info, Filter, BarChart,
    ChevronRight, ExternalLink
} from 'lucide-react';

// --- DATASET ---
const MATERIALS = [
    { id: 'al-7075', name: '7075-T6 Aluminum', category: 'Aluminum Alloys', density: 2.81, yield: 503, thermal: 23.6, cost: 4, iso: 'EN AW-7075', desc: 'Typical aircraft structural alloy. 1.6% Cu, 2.5% Mg, 5.6% Zn.' },
    { id: 'st-4140', name: 'AISI 4140 Steel', category: 'Alloy Steels', density: 7.85, yield: 655, thermal: 12.2, cost: 2, iso: '42CrMo4', desc: 'Chromium-molybdenum alloy steel. High toughness and fatigue strength.' },
    { id: 'ti-64', name: 'Ti-6Al-4V (Grade 5)', category: 'Titanium Alloys', density: 4.43, yield: 880, thermal: 8.6, cost: 10, iso: '3.7165', desc: 'Workhorse of the titanium industry. High strength-to-weight ratio.' },
    { id: 'ss-304', name: '304 Stainless Steel', category: 'Stainless', density: 8.0, yield: 215, thermal: 17.2, cost: 3, iso: '1.4301', desc: 'Excellent corrosion resistance. Non-magnetic in annealed state.' },
    { id: 'cfrp', name: 'Carbon Fiber Prep.', category: 'Composites', density: 1.6, yield: 1200, thermal: 2.0, cost: 12, iso: 'N/A', desc: 'High modulus structural composite. Orthotropic properties.' }
];

export default function MaterialsExplorer() {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('al-7075');
    
    const active = useMemo(() => 
        MATERIALS.find(m => m.id === selectedId) || MATERIALS[0], 
    [selectedId]);

    const filtered = useMemo(() => 
        MATERIALS.filter(m => m.name.toLowerCase().includes(search.toLowerCase())),
    [search]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-cyan-500/30 font-sans">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.05)_0%,transparent_50%)]" />

            {/* LEFT SIDEBAR: Material Library */}
            <div className="w-[360px] bg-[#05080f]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Database size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none text-white">Lattice Node</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">Material Intelligence v4</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find alloy/composite..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filtered.map((mat) => (
                        <MaterialRow 
                            key={mat.id} 
                            active={selectedId === mat.id} 
                            mat={mat} 
                            onClick={() => setSelectedId(mat.id)} 
                        />
                    ))}
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5">
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                         <div className="flex items-center gap-2 mb-2">
                             <Brain size={14} className="text-cyan-400" />
                             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">AluCalc Predictive AI</span>
                         </div>
                         <p className="text-[10px] text-slate-400 leading-relaxed italic">"Composite materials show high anisotropy. Results based on longitudinal axis properties."</p>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD: Property Analytics */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10 custom-scrollbar">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />

                {/* KPI Header */}
                <div className="flex justify-between items-end relative z-10 w-full mb-4">
                    <div>
                         <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-2">{active.category}</div>
                         <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{active.name}</h2>
                    </div>
                    <div className="flex gap-4">
                         <ActionBtn icon={<Download size={18}/>} />
                         <ActionBtn icon={<Share2 size={18}/>} />
                    </div>
                </div>

                {/* Stats & Radar Container */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
                    {/* Property Cards */}
                    <div className="xl:col-span-4 space-y-6">
                         <PropertyCard icon={<Activity size={18}/>} label="Yield Strength" value={active.yield} unit="MPa" color="#22d3ee" />
                         <PropertyCard icon={<Box size={18}/>} label="Mass Density" value={active.density} unit="g/cm³" color="#10b981" />
                         <PropertyCard icon={<Thermometer size={18}/>} label="Thermal Expansion" value={active.thermal} unit="µm/m·K" color="#f59e0b" />
                    </div>

                    {/* Integrated Analytics Visual */}
                    <div className="xl:col-span-8 bg-black/40 border border-white/10 rounded-[3rem] p-12 flex flex-col relative overflow-hidden backdrop-blur-md shadow-2xl">
                         <div className="absolute top-0 right-0 p-8 flex gap-4">
                             <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                ISO Comparison
                             </div>
                         </div>

                         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3">
                            <BarChart size={14} className="text-cyan-500" />
                            Multi-Attribute Performance Mesh
                         </h3>

                         <div className="flex-1 flex flex-col lg:flex-row gap-12 items-center">
                             {/* SVG RADAR CHART */}
                             <div className="w-64 h-64 shrink-0 relative">
                                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                     {/* Background circles */}
                                     {[20, 40, 60, 80, 100].map(r => (
                                         <circle key={r} cx="50" cy="50" r={r/2} fill="none" stroke="white" strokeWidth="0.1" strokeOpacity="0.1" />
                                     ))}
                                     {/* Radar Path */}
                                     <motion.polygon 
                                         points={getRadarPoints(active)}
                                         fill="rgba(6,182,212,0.15)"
                                         stroke="#06b6d4"
                                         strokeWidth="1.5"
                                         initial={{ opacity: 0, scale: 0.8 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         transition={{ type: 'spring', damping: 15 }}
                                     />
                                 </svg>
                                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Strength</div>
                                 <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Cost</div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Weight</div>
                                 <div className="absolute top-1/2 -left-8 -translate-y-1/2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Thermal</div>
                             </div>

                             {/* Specification Details */}
                             <div className="flex-1 space-y-6">
                                  <div className="space-y-1">
                                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Common Standard (ISO/DIN)</div>
                                      <div className="text-2xl font-black text-white italic">{active.iso}</div>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm italic opacity-80 border-l-2 border-cyan-500/30 pl-4">{active.desc}</p>
                                  <div className="flex gap-3">
                                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                          <ExternalLink size={12}/> View Material Data Sheet
                                      </button>
                                  </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Bottom Matrix Summary */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 relative z-10 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity uppercase font-black text-9xl pointer-events-none">MATRIX</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                         <div className="space-y-2">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processable</div>
                             <div className="text-lg font-black text-emerald-400">CNC, CAST, FORGE</div>
                         </div>
                         <div className="space-y-2">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modulus (E)</div>
                             <div className="text-lg font-black text-white">{(active.yield * 0.15).toFixed(1)} GPa</div>
                         </div>
                         <div className="space-y-2">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recyclability</div>
                             <div className="text-lg font-black text-white">HIGH (Tier-1)</div>
                         </div>
                         <div className="text-right">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Kernel</div>
                             <div className="text-xl font-black font-mono text-cyan-400 italic">SYS_MAT_LAB_v2</div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getRadarPoints(mat: any) {
    // Mock mapping for radar
    const valStr = Math.min(100, (mat.yield / 1200) * 100);
    const valCost = mat.cost * 8;
    const valWeight = (1 - mat.density / 8) * 100;
    const valTherm = (1 - mat.thermal / 30) * 100;

    const scale = 0.5;
    const p1 = `50,${50 - valStr * scale}`; // Top
    const p2 = `${50 + valCost * scale},50`; // Right
    const p3 = `50,${50 + valWeight * scale}`; // Bottom
    const p4 = `${50 - valTherm * scale},50`; // Left
    return `${p1} ${p2} ${p3} ${p4}`;
}

function MaterialRow({ active, mat, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${active ? 'bg-cyan-500/10 border border-cyan-500/20 shadow-lg' : 'bg-transparent border border-transparent hover:bg-white/[0.03]'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${active ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                    <Box size={20} />
                </div>
                <div className="text-left">
                    <div className={`text-xs font-black uppercase tracking-tight ${active ? 'text-white' : 'text-slate-400'}`}>{mat.name}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{mat.category}</div>
                </div>
            </div>
            {active && <ChevronRight size={16} className="text-cyan-500" />}
        </button>
    );
}

function PropertyCard({ icon, label, value, unit, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] transition-all">
             <div className="flex justify-between items-center mb-2">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
                 <div style={{ color }}>{icon}</div>
             </div>
             <div className="flex items-baseline gap-2">
                 <div className="text-3xl font-black font-mono text-white tracking-tighter" style={{ color }}>{value}</div>
                 <span className="text-xs font-bold text-slate-600 uppercase italic">{unit}</span>
             </div>
        </div>
    );
}

function ActionBtn({ icon }: any) {
    return (
        <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all shadow-xl">
            {icon}
        </button>
    );
}
