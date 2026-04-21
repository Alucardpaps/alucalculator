'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, ShieldAlert, History, BarChart2, 
    Settings, Zap, AlertTriangle, Info,
    Play, RotateCcw, Clock, Target, Shield
} from 'lucide-react';

export default function FailurePrediction() {
    // Inputs
    const [shape, setShape] = useState(1.5); // Beta (Weibull)
    const [scale, setScale] = useState(5000); // Eta (Characteristic life)
    const [time, setTime] = useState(1000); // Current operational time
    const [gamma, setGamma] = useState(0);    // Threshold
    
    // Logic
    const stats = useMemo(() => {
        // Reliability R(t) = exp(- ((t-gamma)/scale)^shape )
        const t_adj = Math.max(0, time - gamma);
        const reliability = Math.exp(-Math.pow(t_adj / scale, shape));
        
        // Hazard Rate h(t) = (shape/scale) * ((t-gamma)/scale)^(shape-1)
        const hazard = (shape / scale) * Math.pow(t_adj / scale, shape - 1);
        
        // MTBF = scale * Gamma(1 + 1/shape) -> simplified approximation
        const mtbf = scale * (0.89 + 0.11 / shape); // approx for gamma(1+1/b)
        
        const probabilityOfFailure = 1 - reliability;
        
        return { reliability, hazard, mtbf, probabilityOfFailure };
    }, [shape, scale, time, gamma]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-amber-500/30">
            {/* Visual Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL */}
            <div className="w-[340px] bg-[#05080f]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-amber-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Reliability Node</h1>
                            <p className="text-[10px] text-amber-500/60 font-mono tracking-widest uppercase mt-1">Stochastic Failure Engine</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    {/* Weibull Parameters */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Settings size={12} /> Weibull Coefficients
                        </h2>
                        <div className="space-y-4">
                            <ParameterInput label="Shape (Beta)" value={shape} min={0.5} max={5} step={0.1} onChange={setShape} icon={<Zap size={12}/>} />
                            <ParameterInput label="Scale (Eta)" value={scale} min={100} max={20000} step={100} onChange={setScale} icon={<Clock size={12}/>} />
                            <ParameterInput label="Threshold (Gamma)" value={gamma} min={0} max={1000} step={10} onChange={setGamma} icon={<History size={12}/>} />
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Simulation Parameters */}
                    <div className="space-y-4 pb-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Activity size={12} /> Operational State
                        </h2>
                        <ParameterInput label="Current Time (t)" value={time} min={0} max={scale * 2} step={10} onChange={setTime} icon={<Target size={12}/>} />
                        
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-2xl p-4 mt-6">
                            <div className="flex items-center gap-3 text-amber-400/80 mb-2">
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Risk Assessment</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                                {shape < 1 ? 'Early-life failure profile. Stress testing recommended.' : 
                                 shape === 1 ? 'Constant failure rate (exponential). Purely random risk.' : 
                                 'Wear-out characteristic. Preventive maintenance advised.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label="Survival Prob (R)" value={(stats.reliability * 100).toFixed(1)} unit="%" sub="RELIABILITY INDEX" color="#10b981" />
                    <ValueCard label="Failure Hazard (λ)" value={stats.hazard.toExponential(4)} unit="failures/hr" sub="INSTANTANEOUS RISK" color="#f87171" />
                    <ValueCard label="System MTBF" value={stats.mtbf.toFixed(0)} unit="hrs" sub="MEAN TIME BETWEEN FAILURES" color="#3b82f6" />
                </div>

                {/* Failure Visualization */}
                <div className="flex-1 min-h-[440px] bg-black/40 border border-white/10 rounded-[3rem] p-12 flex flex-col relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 flex gap-4">
                        <div className="flex gap-2">
                            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400">
                               Safe Zone
                            </div>
                            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400">
                               Wear Out
                            </div>
                        </div>
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3">
                        <BarChart2 size={14} className="text-amber-500" />
                        Probability Density Function (PDF) / Hazard Visualization
                    </h3>

                    <div className="flex-1 flex items-end justify-between relative gap-1 px-4">
                        <div className="absolute inset-x-0 h-px bg-white/5 bottom-0" />
                        
                        {/* Dynamic Bar Graph Mockup of the Bathtub Curve */}
                        {Array.from({ length: 50 }).map((_, i) => {
                            const t_val = (i / 50) * (scale * 2);
                            const t_adj = Math.max(0, t_val - gamma);
                            // pdf = (b/a)*(t/a)^(b-1) * exp(-(t/a)^b)
                            const pdf = (shape / scale) * Math.pow(t_adj / scale, shape - 1) * Math.exp(-Math.pow(t_adj / scale, shape));
                            const height = Math.min(100, pdf * scale * 50); // Normalized for viz
                            const isActive = Math.abs(t_val - time) < (scale / 25);

                            return (
                                <motion.div 
                                    key={i}
                                    style={{ 
                                        height: `${Math.max(2, height)}%`,
                                        backgroundColor: isActive ? '#f59e0b' : 'rgba(245,158,11,0.05)',
                                        width: '100%',
                                        borderRadius: '4px 4px 0 0',
                                        border: isActive ? '1px solid #f59e0b' : 'none'
                                    }}
                                    className="transition-all duration-300"
                                />
                            );
                        })}

                        {/* Current Time Indicator Vertical Line */}
                        <div className="absolute top-0 bottom-0 w-px bg-amber-500/50 shadow-[0_0_15px_#f59e0b] z-20" style={{ left: `${(time / (scale * 2)) * 100}%` }}>
                             <div className="absolute top-0 -translate-x-1/2 px-2 py-1 bg-amber-500 text-black text-[9px] font-black rounded uppercase">NOW</div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-end border-t border-white/5 pt-8">
                        <div className="flex gap-10">
                             <div>
                                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Failure Mode</span>
                                 <div className="text-xl font-black text-white italic">{shape < 1.0 ? 'Decreasing' : shape === 1.0 ? 'Constant' : 'Increasing'}</div>
                             </div>
                             <div>
                                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Cumulative Prob</span>
                                 <div className="text-xl font-black text-amber-400">{(stats.probabilityOfFailure * 100).toFixed(2)}%</div>
                             </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Engine Load</div>
                             <div className="text-2xl font-black font-mono text-white tracking-tighter">WEIBULL_ALPHA_64</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParameterInput({ label, value, min, max, step, onChange, icon }: any) {
    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-amber-400">{value}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Shield size={64}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase italic leading-none">{unit}</span>}
            </div>
            {sub && <div className="text-[9px] font-bold mt-2 uppercase tracking-widest text-[#64748b]">{sub}</div>}
        </div>
    );
}
