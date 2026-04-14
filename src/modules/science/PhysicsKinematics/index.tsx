'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, Target, Move, Activity, 
    Zap, Compass, MousePointer2, Settings,
    Play, Pause, RotateCcw, Box, 
    ArrowUpRight, Gauge
} from 'lucide-react';
import { KinematicsEngine, KinematicsResult } from '@/engine/science/KinematicsEngine';

export default function PhysicsKinematics() {
    const [isSimulating, setIsSimulating] = useState(false);
    
    // Physics Parameters State
    const [v0, setV0] = useState(45);
    const [angle, setAngle] = useState(32);
    const [g, setG] = useState(9.81);
    const [k, setK] = useState(0.012);
    
    // Results
    const [result, setResult] = useState<KinematicsResult | null>(null);

    // Initial Load - calculate default path
    useEffect(() => {
        handleCompute();
    }, []);

    const handleCompute = () => {
        setIsSimulating(true);
        const data = KinematicsEngine.computeTrajectory({
            v0: Number(v0),
            angle: Number(angle),
            g: Number(g),
            k: Number(k),
            y0: 0
        });
        
        setResult(data);
        
        // Small delay just to show simulation active state cleanly
        setTimeout(() => {
            setIsSimulating(false);
        }, 500);
    };

    // Calculate dynamic SVG path string
    const svgPath = useMemo(() => {
        if (!result || result.path.length === 0) return "M 0 0";
        
        // Find maximums for scaling
        const maxX = Math.max(result.range, 10);
        const maxY = Math.max(result.maxHeight, 10);
        
        // SVG Viewbox dimensions (using arbitrary scale units for internal drawing)
        // We will map 0->maxX to 0->800, and 0->maxY to 500->0
        
        const pathData = result.path.map((p, i) => {
            const mappedX = (p.x / maxX) * 800; 
            const mappedY = 500 - (p.y / maxY) * 500; // Invert Y for SVG coordinates
            return `${i === 0 ? 'M' : 'L'} ${mappedX} ${mappedY}`;
        });
        
        return pathData.join(" ");
    }, [result]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative">
            {/* LEFT SIDEBAR: Parameters & Config */}
            <div className="w-[300px] bg-[#080b11] border-r border-white/5 flex flex-col z-20 shadow-2xl relative">
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-blue-500/5 to-transparent">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Rocket className="text-blue-400" size={22} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-widest uppercase italic italic">Kinematics Node</h1>
                            <div className="text-[10px] text-blue-500/50 font-mono tracking-widest leading-none">PHYS-CORE v4.1</div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Interactive Parameters */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={10}/> Initial Velocity</span>
                                <span className="text-[10px] font-mono text-blue-400">{v0} m/s</span>
                            </div>
                            <input type="range" min="1" max="150" value={v0} onChange={(e) => setV0(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ArrowUpRight size={10}/> Launch Angle</span>
                                <span className="text-[10px] font-mono text-blue-400">{angle}°</span>
                            </div>
                            <input type="range" min="1" max="89" value={angle} onChange={(e) => setAngle(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Box size={10}/> Gravity</span>
                                <span className="text-[10px] font-mono text-blue-400">{g} m/s²</span>
                            </div>
                            <input type="range" min="1" max="25" step="0.1" value={g} onChange={(e) => setG(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Compass size={10}/> Air Drag (k/m)</span>
                                <span className="text-[10px] font-mono text-blue-400">{k}</span>
                            </div>
                            <input type="range" min="0" max="0.1" step="0.001" value={k} onChange={(e) => setK(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Vector Analysis</h3>
                    <div className="space-y-3">
                        {['Velocity Vector', 'Acceleration Vector', 'Displacement'].map((item, i) => (
                            <button key={i} className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-slate-500 group-hover:text-blue-400">
                                        <Move size={14} />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase italic">{item}</span>
                                </div>
                                <Activity size={12} className="text-slate-700" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-blue-500/5 border-t border-white/5">
                    <button 
                        onClick={handleCompute}
                        disabled={isSimulating}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black tracking-[0.2em] uppercase rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isSimulating ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />} 
                        {isSimulating ? 'Computing...' : 'Compute Trajectory'}
                    </button>
                </div>
            </div>

            {/* MAIN AREA: Ballistics Canvas */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Visualizer Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#03060a_100%)]" />

                <div className="h-16 border-b border-white/5 bg-[#080b11]/80 backdrop-blur-xl px-8 flex items-center justify-between z-20">
                    <div className="flex items-center gap-6">
                        {['Trajectory', 'Forces', 'Kinetic Energy'].map((tab, i) => (
                            <button key={tab} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${i===0 ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                            <span className={`text-[10px] font-mono uppercase ${isSimulating ? 'text-amber-500/70' : 'text-emerald-500/70'}`}>
                                {isSimulating ? 'Solver: Running' : 'Solver: Ready'}
                            </span>
                        </div>
                        <Settings size={16} className="text-slate-500 cursor-pointer hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="flex-1 p-12 relative flex items-center justify-center overflow-hidden z-10">
                    {/* Simulated Path Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center p-20">
                         <div className="w-full h-full max-w-4xl max-h-[600px] border-l-2 border-b-2 border-slate-700/50 relative bg-black/20 rounded-tr-3xl backdrop-blur-sm">
                             {/* Arc Simulation */}
                             <svg viewBox="0 -50 850 600" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                 <motion.path 
                                    key={svgPath} // Force re-render of animation when path changes
                                    d={svgPath} 
                                    fill="none" 
                                    stroke="url(#arcGradient)" 
                                    strokeWidth="3" 
                                    strokeDasharray="10 5"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                 />
                                 <defs>
                                     <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                         <stop offset="0%" stopColor="#3b82f6" />
                                         <stop offset="50%" stopColor="#8b5cf6" />
                                         <stop offset="100%" stopColor="#06b6d4" />
                                     </linearGradient>
                                 </defs>
                             </svg>

                             {/* Labels */}
                             <div className="absolute bottom-[-25px] left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 tracking-widest">X-AXIS / RANGE (0 to {(result?.range || 0).toFixed(1)}m)</div>
                             <div className="absolute top-1/2 left-[-60px] -translate-y-1/2 text-[10px] font-mono text-slate-500 -rotate-90 origin-center tracking-widest">Y-AXIS / ALTITUDE (0 to {(result?.maxHeight || 0).toFixed(1)}m)</div>
                         </div>
                    </div>

                    <div className="relative z-20 flex flex-col items-center pointer-events-none mt-auto mb-20">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="px-8 py-6 bg-[#080b11]/80 border border-blue-500/20 rounded-[32px] backdrop-blur-2xl flex flex-row items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-blue-500/40"
                        >
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                    <Target size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white italic tracking-widest uppercase">Target Vector</h2>
                                    <p className="text-slate-400 text-[10px] leading-tight">Drag-adjusted trajectory mapped</p>
                                </div>
                            </div>
                            
                            <div className="w-px h-10 bg-white/10 mx-2" />
                            
                            <div className="flex gap-8">
                                <div className="flex flex-col items-start justify-center">
                                    <div className="text-[20px] font-black text-white italic group-hover:text-blue-400 transition-colors">
                                        {(result?.timeOfFlight || 0).toFixed(2)}<span className="text-slate-500 text-sm ml-1">s</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Time of flight</span>
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <div className="text-[20px] font-black text-white italic">
                                        {(result?.range || 0).toFixed(1)}<span className="text-slate-500 text-sm ml-1">m</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Displacement</span>
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <div className="text-[20px] font-black text-blue-400 italic">
                                        {(result?.maxHeight || 0).toFixed(1)}<span className="text-blue-500/50 text-sm ml-1">m</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-blue-500/50 uppercase tracking-widest">Max Altitude</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* BOTTOM METRICS BAR */}
                <div className="h-24 border-t border-white/5 bg-[#080b11]/80 backdrop-blur-xl px-8 flex items-center justify-around z-20">
                    {[
                        { label: 'Initial Velocity', value: `${v0.toFixed(1)} m/s`, icon: Gauge },
                        { label: 'Launch Angle', value: `${angle.toFixed(1)}°`, icon: ArrowUpRight },
                        { label: 'Impact Velocity', value: `${(result?.finalVelocity || 0).toFixed(1)} m/s`, icon: Target },
                        { label: 'Air Drag Constraint', value: `${k.toFixed(3)} k/m`, icon: Compass },
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest text-[9px] font-bold italic">
                                <m.icon size={10} /> {m.label}
                            </div>
                            <div className={`text-sm font-black italic tracking-tight ${i === 2 ? 'text-blue-400' : 'text-white'}`}>{m.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
