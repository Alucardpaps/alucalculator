'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Activity, Settings, BarChart2, 
    Target, Cpu, Maximize2, Shield, TrendingUp, Thermometer
} from 'lucide-react';

export default function MotorSelection() {
    // Inputs
    const [targetTorque, setTargetTorque] = useState(50); // Nm
    const [targetSpeed, setTargetSpeed] = useState(1500); // RPM
    const [gearRatio, setGearRatio] = useState(1);
    const [efficiency, setEfficiency] = useState(0.9);
    
    // Logic - Professional Powertrain Kernel
    const stats = useMemo(() => {
        const omega_rad_s = (targetSpeed * 2 * Math.PI) / 60;
        const shaftPower = targetTorque * omega_rad_s; // Watts
        
        // Motor side requirements
        const motorTorque = targetTorque / (gearRatio * efficiency);
        const motorSpeed = targetSpeed * gearRatio;
        const motorPower = shaftPower / efficiency;
        
        // Thermal stress estimation (Mock based on current vs limit)
        const thermalLoad = Math.min(100, (motorPower / 7.5) * 10); // Standard 7.5kW motor base
        const isSafe = thermalLoad < 85;
        
        return { 
            shaftPower: shaftPower / 1000, 
            motorTorque, 
            motorSpeed, 
            motorPower: motorPower / 1000,
            thermalLoad,
            isSafe
        };
    }, [targetTorque, targetSpeed, gearRatio, efficiency]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Visual Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL: CONFIG */}
            <div className="w-[340px] bg-[#05080f]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Motor Node</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">E-Drive Sync Kernel</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Target size={12} /> Target Load
                        </h2>
                        <div className="space-y-6">
                            <ParameterInput label="Shaft Torque" unit="Nm" value={targetTorque} min={1} max={500} step={1} onChange={setTargetTorque} icon={<Activity size={12}/>} />
                            <ParameterInput label="Shaft Speed" unit="RPM" value={targetSpeed} min={10} max={6000} step={50} onChange={setTargetSpeed} icon={<Maximize2 size={12}/>} />
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Settings size={12} /> Transmission
                        </h2>
                        <div className="space-y-6">
                            <ParameterInput label="Gear Ratio (i)" unit=":1" value={gearRatio} min={0.1} max={100} step={0.1} onChange={setGearRatio} icon={<Cpu size={12}/>} />
                            <ParameterInput label="System Efficiency" unit="η" value={efficiency} min={0.5} max={1.0} step={0.01} onChange={setEfficiency} icon={<Shield size={12}/>} />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10 custom-scrollbar">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label="Motor Power" value={stats.motorPower.toFixed(2)} unit="kW" sub={(stats.motorPower * 1.341).toFixed(2) + ' HP'} color="#22d3ee" />
                    <ValueCard label="Motor Torque" value={stats.motorTorque.toFixed(1)} unit="Nm" sub="INPUT_SIDE" color="#8b5cf6" />
                    <ValueCard label="Motor Speed" value={stats.motorSpeed.toFixed(0)} unit="RPM" sub="N_MAX" color="#10b981" />
                </div>

                {/* Torque-Speed Dynamic Analysis */}
                <div className="flex-1 min-h-[440px] bg-black/60 border border-white/10 rounded-[3rem] p-12 flex flex-col relative overflow-hidden backdrop-blur-xl shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 flex gap-4">
                        <div className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${stats.isSafe ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'}`}>
                           {stats.isSafe ? 'Optimal Operating State' : 'Critical Power Limit'}
                        </div>
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3">
                        <BarChart2 size={14} className="text-cyan-500" />
                        Dynamic Characteristic Map
                    </h3>

                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Torque-Speed Curve SVG */}
                        <svg className="w-full h-full max-w-2xl max-h-[300px] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid lines */}
                            {Array.from({ length: 5 }).map((_, i) => (
                                <line key={i} x1="0" y1={i * 25} x2="100" y2={i * 25} stroke="white" strokeWidth="0.1" strokeOpacity="0.1" />
                            ))}
                            
                            {/* Motor Operating Envelope (Approximation) */}
                            <path 
                                d="M 0 10 Q 70 15 90 90 L 100 100 L 0 100 Z" 
                                fill="url(#curveGrad)" 
                                className="transition-all duration-700"
                            />

                            {/* Operating Point Crosshairs */}
                            <motion.line 
                                animate={{ y: 100 - (stats.motorTorque / 5) }}
                                x1="0" x2="100" stroke="white" strokeWidth="0.2" strokeDasharray="2 2" strokeOpacity="0.3" 
                            />
                            <motion.line 
                                animate={{ x: (stats.motorSpeed / 60) }}
                                y1="0" y2="100" stroke="white" strokeWidth="0.2" strokeDasharray="2 2" strokeOpacity="0.3" 
                            />
                            
                            {/* Dynamic Operating Point */}
                            <motion.circle 
                                animate={{ cx: (stats.motorSpeed / 60), cy: 100 - (stats.motorTorque / 5) }} 
                                r="4" 
                                fill={stats.isSafe ? "#22d3ee" : "#f87171"} 
                                className="shadow-[0_0_30px_#22d3ee]"
                            />
                        </svg>

                        {/* Labels */}
                        <div className="absolute -bottom-6 left-0 w-full flex justify-between px-2 text-[8px] font-black uppercase tracking-widest text-slate-700">
                             <span>0 RPM</span>
                             <span>Max Speed Capability</span>
                        </div>
                        <div className="absolute top-0 -left-12 h-full flex flex-col justify-between py-2 text-[8px] font-black uppercase tracking-widest text-slate-700 [writing-mode:vertical-lr] rotate-180">
                             <span>0 Nm</span>
                             <span>Max Torque Range</span>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-between items-end border-t border-white/5 pt-8">
                        <div className="flex gap-10">
                             <div>
                                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5"><Thermometer size={10}/> Thermal Stress</span>
                                 <div className="flex items-center gap-3 mt-1">
                                    <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div animate={{ width: `${stats.thermalLoad}%` }} className={`h-full transition-colors ${stats.thermalLoad > 80 ? 'bg-red-500' : 'bg-cyan-500'}`} />
                                    </div>
                                    <span className="text-xl font-black text-white">{stats.thermalLoad.toFixed(0)}%</span>
                                 </div>
                             </div>
                             <div className="w-px h-10 bg-white/10 self-center" />
                             <div>
                                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5"><TrendingUp size={10}/> Efficiency η</span>
                                 <div className="text-2xl font-black text-cyan-400 mt-1">{(efficiency * 100).toFixed(0)}%</div>
                             </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Motor Kernel</div>
                             <div className="text-3xl font-black font-mono text-white tracking-tighter italic">E-SYNC_V3.8</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, min, max, step, onChange, icon }: any) {
    return (
        <div className="space-y-3 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">{icon} {label}</span>
                <span className="text-[11px] font-black font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded-lg border border-cyan-500/10">{value} <span className="text-[9px] text-slate-600 ml-1">{unit}</span></span>
            </div>
            <div className="relative flex items-center">
                <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan-500 bg-white/5 h-1.5 rounded-full" />
            </div>
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-[#0a0f18] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Zap size={80}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-4xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase italic leading-none">{unit}</span>}
            </div>
            {sub && <div className="text-[10px] font-bold mt-3 uppercase tracking-[0.2em] text-[#475569]">{sub}</div>}
        </div>
    );
}
