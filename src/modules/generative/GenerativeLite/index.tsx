'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Cpu, Play, Square, Layers, Activity, 
    Zap, Download, Info, Target, Maximize2,
    Database, ShieldAlert, Boxes
} from 'lucide-react';

// --- VOXEL TYPE ---
interface Voxel {
    id: number;
    x: number;
    y: number;
    density: number; // 0 to 1
    stress: number;   // normalized 0 to 1
}

const GRID_SIZE = 24;

export default function GenerativeLite() {
    // Optimization State
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [iteration, setIteration] = useState(0);
    const [targetVolume, setTargetVolume] = useState(0.4);
    const [voxels, setVoxels] = useState<Voxel[]>([]);
    
    // Initialize Voxels
    useEffect(() => {
        const initial: Voxel[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Initialize with random density/stress for viz
                initial.push({
                    id: y * GRID_SIZE + x,
                    x, y,
                    density: 1.0,
                    stress: Math.sin(x/5) * Math.cos(y/5) + Math.random() * 0.2
                });
            }
        }
        setVoxels(initial);
    }, []);

    // Optimization Loop (Simulation)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && iteration < 40) {
            interval = setInterval(() => {
                setIteration(prev => prev + 1);
                setProgress(prev => Math.min(100, (iteration / 40) * 100));
                
                setVoxels(prev => {
                    const currentVolume = prev.filter(v => v.density > 0.1).length / (GRID_SIZE * GRID_SIZE);
                    const shouldRemove = currentVolume > targetVolume;
                    
                    return prev.map(v => {
                        // SIMP-like removal: if stress is low and volume is high, reduce density
                        if (shouldRemove && v.stress < (0.2 + iteration * 0.01) && v.density > 0) {
                            return { ...v, density: Math.max(0, v.density - 0.2) };
                        }
                        return v;
                    });
                });
            }, 100);
        } else if (iteration >= 40) {
            setIsRunning(false);
        }
        return () => clearInterval(interval);
    }, [isRunning, iteration, targetVolume]);

    const handleReset = () => {
        setIsRunning(false);
        setIteration(0);
        setProgress(0);
        setVoxels(v => v.map(vox => ({ ...vox, density: 1.0 })));
    };

    const stats = useMemo(() => {
        const activeCount = voxels.filter(v => v.density > 0.1).length;
        const volumeFraction = activeCount / (GRID_SIZE * GRID_SIZE);
        const massSaved = (1 - volumeFraction) * 50; // Mock mass
        return { volumeFraction, massSaved };
    }, [voxels]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Visual Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />

            {/* LEFT PANEL */}
            <div className="w-[340px] bg-[#05080f]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Boxes size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Generative Lite</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">Topology Optimizer v2</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Constraints */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Target size={12} /> Optimization Target
                        </h2>
                        <ParameterInput label="Volume Fraction" unit="VF" value={targetVolume} min={0.1} max={0.9} step={0.05} onChange={setTargetVolume} icon={<Layers size={12}/>} />
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Solver Control */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Activity size={12} /> Optimization Kernel
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {isRunning ? (
                                <button onClick={() => setIsRunning(false)} className="col-span-2 py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
                                    <Square size={16} fill="currentColor" /> Stop
                                </button>
                            ) : (
                                <button onClick={() => setIsRunning(true)} className="col-span-2 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                    <Play size={16} fill="currentColor" /> Solve Loop
                                </button>
                            )}
                            <button onClick={handleReset} className="col-span-2 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                                Reset Lattice
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Telemetry */}
                    <div className="space-y-4 pb-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Database size={12} /> Live Metrics
                        </h2>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                             <div className="flex justify-between text-[10px] font-mono">
                                 <span className="text-slate-500 uppercase font-black">Iteration</span>
                                 <span className="text-cyan-400">{iteration} / 40</span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div className="h-full bg-cyan-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                             </div>
                             <div className="flex justify-between text-[10px] font-mono">
                                 <span className="text-slate-500 uppercase font-black">Live Volume</span>
                                 <span className="text-amber-400">{(stats.volumeFraction * 100).toFixed(1)}%</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label="Weight Optimization" value={(100 - stats.volumeFraction * 100).toFixed(1)} unit="%" sub="REMOVAL RATIO" color="#22d3ee" />
                    <ValueCard label="Estimated Mass Saving" value={stats.massSaved.toFixed(2)} unit="kg" sub="AL-6061 ALLOY" color="#10b981" />
                    <ValueCard label="Convergence Rate" value={(iteration / 0.4).toFixed(0)} unit="MS" sub="SOLVER SPEED" color="#8b5cf6" />
                </div>

                {/* Voxel Canvas Viewport */}
                <div className="flex-1 bg-black/40 border border-white/10 rounded-[3rem] p-12 flex items-center justify-center relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="grid grid-cols-24 gap-px w-full h-full max-w-[600px] max-h-[600px] p-4 bg-white/5 rounded-xl border border-white/10" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
                        {voxels.map((v) => (
                            <motion.div 
                                key={v.id}
                                initial={false}
                                animate={{ 
                                    opacity: v.density,
                                    scale: 0.1 + v.density * 0.9,
                                    backgroundColor: v.density < 0.1 ? 'transparent' : (v.stress > 0.6 ? '#f87171' : v.stress > 0.3 ? '#22d3ee' : '#1e293b')
                                }}
                                className="aspect-square rounded-sm"
                                style={{
                                    border: v.density > 0.1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                }}
                            />
                        ))}
                    </div>

                    <div className="absolute bottom-8 right-12 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] pointer-events-none">
                        SIMP Density Evolution Matrix
                    </div>

                    <div className="absolute top-8 left-12 flex gap-4">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">High Stress Load</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-slate-800" />
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vacuum Potential</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, min, max, step, onChange, icon }: any) {
    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-cyan-400">{Math.round(value * 100)}%</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan-600" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Zap size={64}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase italic leading-none">{unit}</span>}
            </div>
            {sub && <div className="text-[9px] font-bold mt-2 uppercase tracking-widest text-[#64748b]">{sub}</div>}
        </div>
    );
}
