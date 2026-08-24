'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertOctagon, Activity, ShieldX, BarChart, 
    Zap, Thermometer, Info, Target, Compass,
    Maximize2, HardDrive, ShieldAlert, Cpu
} from 'lucide-react';

const FAILURE_MODES = [
    { id: 'yield', label: 'Ductile Yielding', desc: 'Von-Mises Criterion', color: '#10b981' },
    { id: 'fatigue', label: 'Fatigue Failure', desc: 'Goodman / Soderberg', color: '#3b82f6' },
    { id: 'brittle', label: 'Brittle Fracture', desc: 'Mohr-Coulomb', color: '#f59e0b' }
];

export default function FailureDiagnosis() {
    // Inputs: Fatigue/Static Stress
    const [sigmaMean, setSigmaMean] = useState(100); // Mean Stress
    const [sigmaAmp, setSigmaAmp] = useState(150);   // Amplitude Stress
    const [yieldStrength, setYieldStrength] = useState(400); 
    const [tensileStrength, setTensileStrength] = useState(600);
    const [enduranceLimit, setEnduranceLimit] = useState(250);
    const [criterion, setCriterion] = useState('fatigue');

    // Logic: Modified Goodman Equation
    // (sigma_a / Se) + (sigma_m / Sut) = 1/n
    const stats = useMemo(() => {
        const n_goodman = 1 / ((sigmaAmp / enduranceLimit) + (sigmaMean / tensileStrength));
        const n_soderberg = 1 / ((sigmaAmp / enduranceLimit) + (sigmaMean / yieldStrength));
        const n_static = yieldStrength / (sigmaMean + sigmaAmp); // Conservative static sum
        
        const isSafe = criterion === 'fatigue' ? n_goodman > 1.2 : n_static > 1.2;
        
        return { n_goodman, n_soderberg, n_static, isSafe };
    }, [sigmaMean, sigmaAmp, yieldStrength, tensileStrength, enduranceLimit, criterion]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-red-500/30">
            {/* Visual Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL */}
            <div className="w-[340px] bg-[#05080f]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-red-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <AlertOctagon size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Failure Diagnostic</h1>
                            <p className="text-[10px] text-red-500/60 font-mono tracking-widest uppercase mt-1">Structural Integrity Node</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    {/* Failure Criterion */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <ShieldAlert size={12} /> Analysis Type
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {FAILURE_MODES.map(f => (
                                <button key={f.id} onClick={() => setCriterion(f.id)}
                                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${criterion === f.id ? 'bg-red-500/10 border-red-500/40' : 'bg-white/[0.02] border-white/5'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${criterion === f.id ? 'text-red-400' : 'text-slate-500'}`}>{f.label}</div>
                                    <div className="text-[9px] text-slate-600 font-mono italic">{f.desc}</div>
                                    {criterion === f.id && <motion.div layoutId="crit" className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_red]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Stress State */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Target size={12} /> Stress Multi-Vector
                        </h2>
                        <div className="space-y-4">
                            <ParameterInput label="Mean Stress (σm)" unit="MPa" value={sigmaMean} min={0} max={500} step={1} onChange={setSigmaMean} icon={<Activity size={12}/>} />
                            <ParameterInput label="Alt. Stress (σa)" unit="MPa" value={sigmaAmp} min={0} max={500} step={1} onChange={setSigmaAmp} icon={<Zap size={12}/>} />
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Material Bounds */}
                    <div className="space-y-4 pb-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <HardDrive size={12} /> Limit Properties
                        </h2>
                        <ParameterInput label="Yield Strength (Sy)" unit="MPa" value={yieldStrength} min={100} max={1200} step={10} onChange={setYieldStrength} icon={<Maximize2 size={12}/>} />
                        <ParameterInput label="Endurance (Se)" unit="MPa" value={enduranceLimit} min={50} max={600} step={10} onChange={setEnduranceLimit} icon={<Compass size={12}/>} />
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label="Goodman Safety" value={stats.n_goodman.toFixed(2)} unit="SF" sub="FATIGUE LIMIT" color={stats.n_goodman > 1.2 ? '#10b981' : '#f87171'} />
                    <ValueCard label="Soderberg Safety" value={stats.n_soderberg.toFixed(2)} unit="SF" sub="CONSERVATIVE" color={stats.n_soderberg > 1.2 ? '#3b82f6' : '#f87171'} />
                    <ValueCard label="Combined Yield" value={stats.n_static.toFixed(2)} unit="SF" sub="PEAK STRESS" color={stats.n_static > 1.2 ? '#f59e0b' : '#ef4444'} />
                </div>

                {/* Envelope Visualization (Haigh Diagram) */}
                <div className="flex-1 min-h-[440px] bg-black/40 border border-white/10 rounded-[3rem] p-12 flex flex-col relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 flex gap-4">
                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400">
                           Failure Realm
                        </div>
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3">
                        <Compass size={14} className="text-red-500" />
                        Haigh Diagram Envelope Monitoring
                    </h3>

                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Haigh Chart Component SVG */}
                        <svg className="w-full h-full max-w-2xl max-h-[300px] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Axes */}
                            <line x1="0" y1="100" x2="105" y2="100" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
                            <line x1="0" y1="100" x2="0" y2="-5" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
                            
                            {/* Goodman Line */}
                            <line x1="0" y1={100 - (enduranceLimit/600)*100} x2={(tensileStrength/600)*100} y2="100" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" />
                            <text x={(tensileStrength/600)*100} y="105" fill="#3b82f6" fontSize="3" fontWeight="bold">Sut</text>
                            
                            {/* Soderberg Line */}
                            <line x1="0" y1={100 - (enduranceLimit/600)*100} x2={(yieldStrength/600)*100} y2="100" stroke="#10b981" strokeWidth="1" />
                            <text x={(yieldStrength/600)*100} y="105" fill="#10b981" fontSize="3" fontWeight="bold">Sy</text>
                            <text x="-5" y={100 - (enduranceLimit/600)*100} fill="#f87171" fontSize="3" fontWeight="bold">Se</text>

                            {/* Safe Zone Shading */}
                            <polygon points={`0,100 0,${100 - (enduranceLimit/600)*100} ${(yieldStrength/600)*100},100`} fill="#10b981" fillOpacity="0.05" />

                            {/* Operating Point */}
                            <motion.circle 
                                cx={(sigmaMean/600)*100} 
                                cy={100 - (sigmaAmp/600)*100} 
                                r="2" 
                                fill={stats.isSafe ? '#10b981' : '#ef4444'} 
                                className="shadow-[0_0_20px_white]"
                                initial={false}
                                animate={{ cx: (sigmaMean/600)*100, cy: 100 - (sigmaAmp/600)*100 }}
                            />
                            
                            {/* Crosshairs */}
                            <line x1="0" y1={100 - (sigmaAmp/600)*100} x2={(sigmaMean/600)*100} y2={100 - (sigmaAmp/600)*100} stroke="white" strokeWidth="0.2" strokeDasharray="1 1" strokeOpacity="0.3" />
                            <line x1={(sigmaMean/600)*100} y1="100" x2={(sigmaMean/600)*100} y2={100 - (sigmaAmp/600)*100} stroke="white" strokeWidth="0.2" strokeDasharray="1 1" strokeOpacity="0.3" />
                        </svg>

                        {/* Labels */}
                        <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 opacity-50 text-[8px] font-black uppercase tracking-widest text-slate-500">
                             <div className="flex flex-col items-center"><span>Amplitude Stress (σa)</span></div>
                             <div className="flex flex-col items-center"><span>Mean Stress (σm)</span></div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-end border-t border-white/5 pt-8">
                        <div className="flex gap-10">
                             <div>
                                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Failure Probability</span>
                                 <div className="text-xl font-black text-white italic">{stats.isSafe ? 'MARGINAL_STABLE' : 'CRITICAL_BEYOND_YIELD'}</div>
                             </div>
                             <div className="w-px h-8 bg-white/10 self-center" />
                             <div>
                                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Load History</span>
                                 <div className="text-xl font-black text-red-500">REALTIME_PASS</div>
                             </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Diagnostic Kernel</div>
                             <div className="text-2xl font-black font-mono text-white tracking-tighter italic">FAIL_SENS_V4.8</div>
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
                <span className="text-[10px] font-mono text-red-400">{value} {unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-red-600" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Activity size={64}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase italic leading-none">{unit}</span>}
            </div>
            {sub && <div className="text-[9px] font-bold mt-2 uppercase tracking-widest text-[#64748b]">{sub}</div>}
        </div>
    );
}
