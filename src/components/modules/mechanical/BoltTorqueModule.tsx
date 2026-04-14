'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench, ShieldCheck, Zap, Layers, Link as LinkIcon
} from 'lucide-react';
import { HeadlessEngine } from '@/headless-engine/engine';

export default function BoltTorqueModule() {
    const [inputs, setInputs] = useState({
        D: 10,        // mm (Nominal Bolt Diameter - M10)
        K: 0.20,      // Torque Coefficient (e.g. 0.20 bare steel)
        S_p: 600,     // MPa (Proof Strength - e.g. Class 8.8 is ~600)
        A_t: 58.0     // mm^2 (Tensile stress area for M10 standard coarse)
    });

    const engine = useMemo(() => new HeadlessEngine(), []);
    
    // Evaluate via Headless Engine
    const results = useMemo(() => {
        const res = engine.execute('bolt_torque', inputs);
        
        let F_i = 0;
        let T = 0;
        
        if (res.success) {
             F_i = res.result['F_i'];
             T = res.result['T'];
        }

        // Simplistic safety logic: High torque warns about wrench limits
        const isSafe = T < 1000; 
        
        return { F_i: F_i / 1000, T, isSafe }; // F_i in kN
    }, [inputs, engine]);

    const activeColor = '#fbbf24'; // Amber for bolting forces

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden p-2">
            {/* LEFT PANEL - Control Center (35%) */}
            <div className="w-[35%] h-full flex flex-col bg-[#080d14]/80 rounded-2xl border border-white/5 backdrop-blur-2xl px-6 py-6 overflow-y-auto custom-scrollbar">
                
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                        <Wrench size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-100">Bolt Torque</h2>
                        <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Fastener Preload Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                    <Layers size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bolt Properties</span>
                </div>

                <div className="space-y-6 flex-1">
                    <PremiumNumBox label="Nominal Diameter (D)" unit="mm" value={inputs.D} min={3} max={100} step={1} onChange={(v: number) => setInputs({ ...inputs, D: v })} color="#a855f7" />
                    <PremiumNumBox label="Tensile Area (A_t)" unit="mm²" value={inputs.A_t} min={5} max={8000} step={0.5} onChange={(v: number) => setInputs({ ...inputs, A_t: v })} color="#3b82f6" />
                    <PremiumNumBox label="Proof Strength (S_p)" unit="MPa" value={inputs.S_p} min={200} max={1500} step={10} onChange={(v: number) => setInputs({ ...inputs, S_p: v })} color="#10b981" />
                    
                    <div className="my-8 border-t border-white/5 pt-6"></div>

                    <div className="flex items-center gap-2 mb-4 text-cyan-400">
                        <LinkIcon size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Joint Conditions</span>
                    </div>

                    <PremiumNumBox label="Nut Factor (K)" unit="" value={inputs.K} min={0.05} max={0.4} step={0.01} onChange={(v: number) => setInputs({ ...inputs, K: v })} color="#f59e0b" />
                </div>
            </div>

            {/* RIGHT PANEL - Output (65%) */}
            <div className="w-[65%] h-full flex flex-col px-6">
                
                {/* Math Results Header */}
                <div className="flex-none pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div 
                                className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2 text-amber-400"
                            >
                                <motion.div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_15px_#fbbf24]" />
                                REQUIRED FASTENING TORQUE
                            </motion.div>
                            <div className="flex items-baseline gap-4">
                                <motion.div 
                                    className="text-[8rem] font-black italic tracking-tighter leading-none text-amber-400"
                                    style={{ textShadow: `0 0 40px rgba(251,191,36,0.4)` }}
                                >
                                    {results.T.toFixed(1)}
                                </motion.div>
                                <span className="text-3xl font-bold text-gray-500 mb-4">Nm</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 pt-6 text-right">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Achieved Preload (Fi)</span>
                            <span className="text-4xl font-mono font-black text-emerald-400">{results.F_i.toFixed(1)} <span className="text-xl text-gray-500">kN</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative mt-6 mb-8 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    
                    <div className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <Zap size={14} /> KINEMATIC ROTATION
                    </div>

                    {/* Torque Wrench Abstract Animation */}
                    <motion.svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
                        {/* Bolt Head */}
                        <polygon points="250,150 200,175 200,225 250,250 300,225 300,175" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                        
                        <circle cx="250" cy="200" r="15" fill="none" stroke="#fbbf24" strokeWidth="4" />
                        <motion.circle 
                            cx="250" cy="200" r="30" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="2" strokeDasharray="10 10"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            style={{ transformOrigin: "250px 200px" }}
                        />
                        
                        {/* Abstract Torque vector */}
                        <motion.path 
                            d="M 280,200 A 70 70 0 0 1 250,270" 
                            fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round"
                            style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }}
                            animate={{ pathLength: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* Abstract Wrench Lever */}
                        <motion.line 
                            x1="250" y1="200" x2="450" y2="400" 
                            stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round"
                        />
                    </motion.svg>
                </div>
            </div>
        </div>
    );
}

function PremiumNumBox({ label, unit, value, min, max, step, onChange, color }: any) {
    return (
        <div className="group relative">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-white transition-colors">{label}</span>
            </div>
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-white/30 group-focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <input
                    type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-lg font-black font-mono px-4 py-3 text-white outline-none appearance-none"
                    style={{ textShadow: `0 0 10px ${color}40` }}
                />
                {unit && (
                   <div className="px-4 text-[10px] font-bold text-gray-500 border-l border-white/5 bg-white/[0.02] h-full flex flex-col justify-center items-center">
                    <span style={{ color }}>{unit}</span>
                   </div>
                )}
            </div>
            <div className="mt-3 px-1">
                <input
                    type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}
