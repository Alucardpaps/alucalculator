'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Activity, Info, Settings, ArrowRight, 
    Layers, ShieldCheck, Thermometer, Anchor, 
    RotateCcw, Maximize2, Share2, Download
} from 'lucide-react';

export default function ThreePhasePowerModule() {
    const [connection, setConnection] = useState<'Delta' | 'Wye'>('Wye');
    const [vLine, setVLine] = useState(400); // 400V RMS Line-to-Line
    const [iLine, setILine] = useState(10);  // 10A Line Current
    const [pf, setPF] = useState(0.85);      // Power Factor
    const [freq, setFreq] = useState(50);    // Frequency (Hz)

    const stats = useMemo(() => {
        // Basic 3-Phase Relations
        // P = sqrt(3) * V_L * I_L * cos(phi)
        const s = Math.sqrt(3) * vLine * iLine; // VA (Apparent)
        const p = s * pf;                      // W (Real)
        const phi = Math.acos(pf);
        const q = s * Math.sin(phi);           // VAR (Reactive)
        
        // Phase values
        const vPhase = connection === 'Wye' ? vLine / Math.sqrt(3) : vLine;
        const iPhase = connection === 'Wye' ? iLine : iLine / Math.sqrt(3);
        
        return { s, p, q, vPhase, iPhase, phi };
    }, [connection, vLine, iLine, pf]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-amber-500/30 font-sans">
            {/* Ambient Pulse */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.05)_0%,transparent_50%)]" />

            {/* SIDEBAR: Configuration */}
            <div className="w-[360px] bg-[#05080f]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-amber-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-6 text-amber-500">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none text-white">Grid Core</h1>
                            <p className="text-[10px] text-amber-500/60 font-mono tracking-widest uppercase mt-1">3-Phase Power v5.1</p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 mb-2">
                        {(['Delta', 'Wye'] as const).map(c => (
                            <button
                                key={c}
                                onClick={() => setConnection(c)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${connection === c ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <section className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} /> Line Parameters
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <ParameterInput label="Line Voltage (V_L)" value={vLine} unit="V" icon={<Zap size={14}/>} color="#f59e0b" onChange={setVLine} min={0} max={1000} />
                            <ParameterInput label="Line Current (I_L)" value={iLine} unit="A" icon={<Activity size={14}/>} color="#f59e0b" onChange={setILine} min={0} max={1000} />
                            <ParameterInput label="Power Factor (cosφ)" value={pf} unit="pf" icon={<Layers size={14}/>} color="#f59e0b" onChange={setPF} min={0} max={1} step={0.01} />
                        </div>
                    </section>

                    <section className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Topology Insight</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic border-l border-amber-500/30 pl-4 py-1">
                            {connection === 'Wye' 
                                ? "In Wye (Star), Line Voltage = √3 × Phase Voltage. Neutral connection available." 
                                : "In Delta (Mesh), Line Current = √3 × Phase Current. Line voltage equals phase voltage."}
                        </p>
                    </section>
                </div>

                <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                         <div className="flex items-center gap-2 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Steady-State Solver</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE: Analytics */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10 custom-scrollbar relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />

                {/* KPI Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <MetricCard label="Apparent Power (S)" value={(stats.s / 1000).toFixed(2)} unit="kVA" color="#f59e0b" label2="Total Magnitude" />
                    <MetricCard label="Real Power (P)" value={(stats.p / 1000).toFixed(2)} unit="kW" color="#10b981" label2="Energy Work" />
                    <MetricCard label="Reactive Power (Q)" value={(stats.q / 1000).toFixed(2)} unit="kVAR" color="#ef4444" label2="Field Energy" />
                </div>

                {/* Vector Analysis Visualizer */}
                <div className="flex-1 flex flex-col xl:flex-row gap-8 min-h-[400px]">
                    {/* Phasor Visualizer */}
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-[3rem] p-12 flex flex-col relative overflow-hidden backdrop-blur-md shadow-2xl">
                         <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-8xl font-black italic tracking-tighter uppercase pointer-events-none">PHASOR</div>
                         
                         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3 relative z-10">
                             <RotateCcw size={14} className="text-amber-500 animate-spin-slow" />
                             Interactive Phasor Plane
                         </h3>

                         <div className="flex-1 flex items-center justify-center relative translate-y-[-20px]">
                             <svg viewBox="-120 -120 240 240" className="w-full h-full max-w-[320px] overflow-visible">
                                 {/* Circular Grids */}
                                 {[20, 40, 60, 80, 100].map(r => (
                                     <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
                                 ))}
                                 <line x1="-120" y1="0" x2="120" y2="0" stroke="white" strokeWidth="0.2" strokeOpacity="0.1" />
                                 <line x1="0" y1="-120" x2="0" y2="120" stroke="white" strokeWidth="0.2" strokeOpacity="0.1" />

                                 {/* Phasor Vectors (120° offsets) */}
                                 <PhasorVector angle={0} color="#f59e0b" label="L1" length={100} />
                                 <PhasorVector angle={120} color="#fcd34d" label="L2" length={100} />
                                 <PhasorVector angle={240} color="#d97706" label="L3" length={100} />
                                 
                                 {/* Current Vector with animatable phase shift */}
                                 <PhasorVector 
                                     angle={-(stats.phi * (180/Math.PI))} 
                                     color="#10b981" 
                                     label="I_line" 
                                     length={Math.min(70 + (iLine / 10) * 10, 110)} 
                                     dashed 
                                 />
                             </svg>
                         </div>

                         <div className="absolute bottom-8 left-12 flex gap-8">
                             <div className="flex flex-col">
                                 <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Phase Angle</div>
                                 <div className="text-xl font-black text-amber-500">{(stats.phi * (180/Math.PI)).toFixed(1)}°</div>
                             </div>
                             <div className="h-10 w-px bg-white/5" />
                             <div className="flex flex-col">
                                 <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Freq.</div>
                                 <div className="text-xl font-black text-white">{freq} Hz</div>
                             </div>
                         </div>
                    </div>

                    {/* Industrial Recs Table */}
                    <div className="w-full xl:w-[400px] flex flex-col gap-6">
                         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node Analysis Outcome</h4>
                             
                             <ResultItem label="Phase Voltage (Vp)" value={stats.vPhase.toFixed(1)} unit="V" />
                             <ResultItem label="Phase Current (Ip)" value={stats.iPhase.toFixed(2)} unit="A" />
                             <ResultItem label="Reactive Charge" value={(stats.q / stats.s * 100).toFixed(1)} unit="%" />
                             
                             <div className="h-px bg-white/5" />
                             
                             <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex flex-col gap-1">
                                 <div className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Efficiency Rating</div>
                                 <div className="text-lg font-black text-emerald-400 italic">OPTIMAL (CAT-1)</div>
                             </div>
                         </div>

                         <div className="flex gap-4">
                             <ActionBtn icon={<Download size={18}/>} />
                             <ActionBtn icon={<Share2 size={18}/>} />
                             <button className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl group">
                                 Generate Report <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PhasorVector({ angle, color, label, length, dashed }: any) {
    const rad = angle * (Math.PI / 180);
    const x = length * Math.cos(rad);
    const y = -length * Math.sin(rad); // Flip Y for SVG coords

    return (
        <g>
            <motion.line 
                x1="0" y1="0" 
                initial={{ x2: 0, y2: 0 }}
                animate={{ x2: x, y2: y }}
                stroke={color} 
                strokeWidth={dashed ? "1" : "2.5"} 
                strokeDasharray={dashed ? "4 4" : "0"}
                transition={{ type: 'spring', damping: 12 }}
            />
            <motion.circle 
                initial={{ cx: 0, cy: 0 }}
                animate={{ cx: x, cy: y }}
                r="3" fill={color} 
                transition={{ type: 'spring', damping: 12 }}
            />
            <motion.text 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: x + (x > 0 ? 10 : -20), y: y + (y > 0 ? 10 : -10) }}
                fill={color} fontSize="8" fontWeight="900" 
                fontFamily="system-ui"
            >
                {label}
            </motion.text>
        </g>
    );
}

function ParameterInput({ label, value, unit, icon, color, onChange, min, max, step = 1 }: any) {
    return (
        <div className="space-y-3 group">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <div className="text-slate-500 group-hover:text-amber-500 transition-colors">{icon}</div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                </div>
                <div className="text-[11px] font-mono font-black text-white">{value} <span className="text-[8px] opacity-40">{unit}</span></div>
            </div>
            <input 
                type="range" 
                min={min} max={max} step={step} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/5 rounded-full appearance-none outline-none cursor-pointer accent-amber-500"
            />
        </div>
    );
}

function MetricCard({ label, value, unit, color, label2 }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden backdrop-blur-md hover:bg-white/[0.04] transition-all">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
             <div className="flex items-baseline gap-2">
                 <motion.div 
                    initial={false}
                    animate={{ color }}
                    className="text-4xl font-black font-mono tracking-tighter italic"
                 >
                    {value}
                 </motion.div>
                 <span className="text-xs font-bold text-slate-600 uppercase italic">{unit}</span>
             </div>
             <div className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">{label2}</div>
        </div>
    );
}

function ResultItem({ label, value, unit }: any) {
    return (
        <div className="flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
             <div className="flex items-baseline gap-1">
                 <span className="text-sm font-black italic">{value}</span>
                 <span className="text-[8px] font-bold text-slate-700">{unit}</span>
             </div>
        </div>
    );
}

function ActionBtn({ icon }: any) {
    return (
        <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all shadow-xl backdrop-blur-md">
            {icon}
        </button>
    );
}
