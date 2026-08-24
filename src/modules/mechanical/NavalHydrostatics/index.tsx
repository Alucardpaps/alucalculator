'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Anchor, Waves, ArrowDown, ArrowUp, Activity, Ruler, Info } from 'lucide-react';

export default function NavalHydrostatics() {
    // Inputs
    const [length, setLength] = useState<number>(120);       // Length (L) in meters
    const [beam, setBeam] = useState<number>(20);            // Beam (B) in meters
    const [draft, setDraft] = useState<number>(6.5);         // Draft (T) in meters
    const [cb, setCb] = useState<number>(0.65);              // Block Coefficient (Cb)
    const [kg, setKg] = useState<number>(6.0);               // Center of Gravity above Keel (KG)
    const [density, setDensity] = useState<number>(1.025);   // Water density (t/m^3)

    // --- Hydrostatic Calculations ---
    const hydro = useMemo(() => {
        // Volume of Displacement (V)
        const volume = length * beam * draft * cb;
        
        // Displacement (Delta) in tonnes
        const displacement = volume * density;

        // Estimated Waterplane Area Coefficient (Cw)
        const cw = 0.67 * cb + 0.33; 

        // Waterplane Area (Aw)
        const aw = length * beam * cw;

        // Center of Buoyancy above Keel (KB) limit estimation
        const kb = draft * (0.833 - cb / (3 * cw));

        // Transverse Moment of Inertia Coefficient (Cit)
        const cit = (0.04 * cw) + (0.04 * Math.pow(cw, 3));
        
        // Transverse Moment of Inertia (It)
        const it = cit * length * Math.pow(beam, 3);

        // Metacentric Radius (BM)
        const bm = it / volume;

        // Transverse Metacenter above Keel (KM)
        const km = kb + bm;

        // Metacentric Height (GM)
        const gm = km - kg;

        return { volume, displacement, aw, kb, bm, km, gm };
    }, [length, beam, draft, cb, kg, density]);

    const formatNum = (num: number, digits=2) => {
        return num.toFixed(digits);
    };

    return (
        <div className="flex flex-col lg:flex-row w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Visual Grid Layer */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL: Controls */}
            <div className="w-full lg:w-[380px] bg-[#05080f]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Anchor size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase text-white">Hydrostatics</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase">Naval Architecture Core</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    {/* Dimension Inputs */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Ruler size={12} /> Hull Dimensions
                        </h2>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Length (L)</span>
                                <span className="text-cyan-400 font-mono">{length} m</span>
                            </div>
                            <input type="range" min="10" max="400" step="1" value={length} onChange={(e) => setLength(e.target.valueAsNumber)} className="w-full accent-cyan-500" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Beam (B)</span>
                                <span className="text-cyan-400 font-mono">{beam} m</span>
                            </div>
                            <input type="range" min="2" max="60" step="0.5" value={beam} onChange={(e) => setBeam(e.target.valueAsNumber)} className="w-full accent-cyan-500" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Draft (T)</span>
                                <span className="text-amber-400 font-mono">{draft.toFixed(1)} m</span>
                            </div>
                            <input type="range" min="0.5" max="25" step="0.1" value={draft} onChange={(e) => setDraft(e.target.valueAsNumber)} className="w-full accent-amber-500" />
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5 my-4" />

                    {/* Properties Inputs */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Activity size={12} /> Form & Stability Constants
                        </h2>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Block Coeff (C_b)</span>
                                <span className="text-cyan-400 font-mono">{cb.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0.4" max="0.9" step="0.01" value={cb} onChange={(e) => setCb(e.target.valueAsNumber)} className="w-full accent-cyan-500" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Center of Gravity (KG)</span>
                                <span className="text-red-400 font-mono">{kg.toFixed(1)} m</span>
                            </div>
                            <input type="range" min="1" max="20" step="0.1" value={kg} onChange={(e) => setKg(e.target.valueAsNumber)} className="w-full accent-red-500" />
                        </div>

                        <div className="space-y-1 mt-4">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold mb-2">
                                <span className="text-slate-400">Water Density</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setDensity(1.025)} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${density === 1.025 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                >
                                    Salt (1.025)
                                </button>
                                <button 
                                    onClick={() => setDensity(1.000)} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${density === 1.000 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                >
                                    Fresh (1.000)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col relative z-10 p-8 lg:p-12 gap-8 overflow-y-auto">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />
                
                {/* Data Grid */}
                <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Displacement (Δ)</div>
                        <div className="text-2xl font-black font-mono text-white">{formatNum(hydro.displacement, 0)}</div>
                        <div className="text-xs text-slate-500 mt-1">tonnes</div>
                    </div>
                    
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Volume (∇)</div>
                        <div className="text-2xl font-black font-mono text-white">{formatNum(hydro.volume, 0)}</div>
                        <div className="text-xs text-slate-500 mt-1">m³</div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Waterplane Area (Aw)</div>
                        <div className="text-2xl font-black font-mono text-cyan-400">{formatNum(hydro.aw, 0)}</div>
                        <div className="text-xs text-cyan-500/50 mt-1">m²</div>
                    </div>

                    <div className="bg-[#0a101f]/80 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <div className="absolute top-0 right-0 p-3 opacity-20"><Info size={24} className="text-emerald-400"/></div>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Stability (GM)</div>
                        <div className={`text-3xl font-black font-mono ${hydro.gm > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                            {formatNum(hydro.gm, 2)}
                        </div>
                        <div className={`text-xs mt-1 ${hydro.gm > 0 ? 'text-emerald-500/50' : 'text-red-500/50'}`}>
                            {hydro.gm > 0 ? 'Stable' : 'UNSTABLE'}
                        </div>
                    </div>
                </motion.div>

                {/* Transverse Cross Section Graphic */}
                <div className="flex-1 min-h-[400px] bg-black/40 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
                    
                    {/* Water Level Graphic */}
                    <div className="absolute left-0 right-0 top-1/2 flex flex-col z-10 w-full opacity-60">
                        <div className="h-px bg-cyan-500 w-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                        <div className="h-48 bg-gradient-to-b from-cyan-900/40 to-transparent w-full" />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-6 flex items-center gap-2 text-cyan-400 z-30 opacity-70">
                        <span className="text-[10px] font-bold uppercase tracking-widest font-mono border-b border-cyan-500">Waterline</span>
                        <Waves size={16} />
                    </div>

                    {/* Ship Hull Cross Section Graphic */}
                    <div className="relative w-64 h-64 border-b-[8px] border-l-[8px] border-r-[8px] border-slate-700 bg-slate-900/80 rounded-b-[40px] z-20 flex flex-col items-center shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                        
                        {/* KG Line Component (Red) */}
                        <div className="absolute bottom-0 w-px bg-red-500/50" style={{ height: `${Math.min(100, (hydro.km / 15) * 100)}%` }}></div>
                        
                        {/* Center of Gravity (G) */}
                        <div 
                            className="absolute z-40 bg-red-500 border-2 border-slate-900 rounded-full w-4 h-4 flex items-center justify-center -translate-x-1/2"
                            style={{ 
                                bottom: `${Math.min(100, (kg / 15) * 100)}%`, 
                                left: '50%',
                                transform: 'translate(-50%, 50%)'
                            }}
                        >
                            <div className="absolute left-6 whitespace-nowrap text-[10px] font-black text-red-400 tracking-widest bg-black/80 px-2 py-0.5 rounded border border-red-500/30">G ({formatNum(kg)}m)</div>
                        </div>

                        {/* Center of Buoyancy (B) */}
                        <div 
                            className="absolute z-30 bg-blue-400 border-2 border-slate-900 rounded-sm w-4 h-4 flex items-center justify-center -translate-x-1/2"
                            style={{ 
                                bottom: `${Math.min(100, (hydro.kb / 15) * 100)}%`, 
                                left: '50%',
                                transform: 'translate(-50%, 50%)'
                            }}
                        >
                            <div className="absolute left-6 whitespace-nowrap text-[10px] font-black text-blue-400 tracking-widest bg-black/80 px-2 py-0.5 rounded border border-blue-500/30">B ({formatNum(hydro.kb)}m)</div>
                            <ArrowUp size={24} className="text-blue-500 absolute -top-8 opacity-40 mix-blend-screen" />
                        </div>

                        {/* Metacenter (M) */}
                        <div 
                            className="absolute z-50 bg-emerald-400 w-2 h-2 rounded-full -translate-x-1/2"
                            style={{ 
                                bottom: `${Math.min(100, (hydro.km / 15) * 100)}%`, 
                                left: '50%',
                                transform: 'translate(-50%, 50%)',
                                display: hydro.km > 15 ? 'none' : 'block' // hide if off screen
                            }}
                        >
                            <div className="absolute left-6 whitespace-nowrap text-[10px] font-black text-emerald-400 tracking-widest bg-black/80 px-2 py-0.5 rounded border border-emerald-500/30">M ({formatNum(hydro.km)}m)</div>
                        </div>

                        {/* Gravity Vector */}
                        <div 
                           className="absolute z-20 w-1 bg-gradient-to-b from-red-500 to-transparent -translate-x-1/2"
                           style={{
                               top: `${100 - Math.min(100, (kg / 15) * 100)}%`,
                               bottom: '-20%',
                               left: '50%'
                           }}
                        ></div>

                        {/* Labels for Keel Height */}
                        <div className="absolute bottom-2 left-2 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Keel Base</div>
                    </div>
                </div>

                {/* Metacentric Stability Breakdown */}
                <div className="flex border border-white/10 rounded-2xl p-6 relative z-10 bg-black/20 backdrop-blur-sm divide-x divide-white/10">
                    <div className="flex-1 px-4 flex flex-col justify-center">
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">KB (Buoyancy z)</div>
                       <div className="text-xl font-black font-mono text-blue-400">{formatNum(hydro.kb)} m</div>
                    </div>
                    <div className="flex-1 px-4 flex flex-col justify-center">
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">BM (Radius)</div>
                       <div className="text-xl font-black font-mono text-purple-400">{formatNum(hydro.bm)} m</div>
                    </div>
                    <div className="flex-1 px-4 flex flex-col justify-center">
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">KM (Metacenter z)</div>
                       <div className="text-xl font-black font-mono text-white">{formatNum(hydro.km)} m</div>
                    </div>
                    <div className="flex-1 px-4 flex flex-col justify-center bg-emerald-500/5 -mx-2 -my-6 p-4 border-l border-emerald-500/20 relative overflow-hidden">
                       <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${hydro.gm > 0 ? 'text-emerald-500' : 'text-red-500'}`}>GM (Stability)</div>
                       <div className={`text-2xl font-black font-mono ${hydro.gm > 0 ? 'text-emerald-400' : 'text-red-500'}`}>{formatNum(hydro.gm)} m</div>
                       <div className="absolute bottom-4 right-4 text-6xl opacity-10 font-bold z-0">=</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
