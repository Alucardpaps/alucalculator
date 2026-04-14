'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, ShieldAlert, Zap, Layers, Info
} from 'lucide-react';
import { HeadlessEngine } from '@/headless-engine/engine';

export default function FatigueAnalysisModule() {
    const [inputs, setInputs] = useState({
        S_ut: 800,     // MPa (Ultimate Strength)
        S_y: 650,      // MPa (Yield Strength)
        sigma_a: 150,  // MPa (Alternating Stress)
        sigma_m: 100,  // MPa (Mean Stress)
        k_a: 0.85,     // Surface condition
        k_b: 0.90,     // Size factor
        k_c: 1.0       // Load factor
    });

    const engine = useMemo(() => new HeadlessEngine(), []);
    
    // Evaluate via Headless Engine
    const results = useMemo(() => {
        const res = engine.execute('fatigue_analysis', inputs);
        
        let S_e = 0;
        let n_goodman = 0;
        let n_yield = 0;
        
        if (res.success) {
             S_e = res.result['S_e'];
             n_goodman = res.result['n_Goodman'];
             n_yield = res.result['n_Yield'];
        }

        const isSafe = n_goodman >= 1.0 && n_yield >= 1.0;
        const criticalVal = Math.min(n_goodman, n_yield);

        return { S_e, n_goodman, n_yield, isSafe, criticalVal };
    }, [inputs, engine]);

    const activeColor = results.isSafe ? '#10b981' : '#ef4444'; // Emerald for safe, Red for unsafe

    // Calculate plotting points for the Goodman Diagram (x: Mean Stress, y: Alternating Stress)
    const MAX_X = Math.max(inputs.S_ut, inputs.S_y, inputs.sigma_m * 1.2);
    const MAX_Y = Math.max(results.S_e, inputs.S_y, inputs.sigma_a * 1.2);
    
    // Convert mathematical coordinates to SVG box (1000x500 layout)
    const padding = 60; // Increased padding for labels
    const boxW = 1000 - padding * 2;
    const boxH = 500 - padding * 2;
    
    const scaleX = (val: number) => padding + (val / MAX_X) * boxW;
    const scaleY = (val: number) => 500 - padding - (val / MAX_Y) * boxH;

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden p-2">
            {/* LEFT PANEL - Control Center (35%) */}
            <div className="w-[35%] h-full flex flex-col bg-[#080d14]/80 rounded-2xl border border-white/5 backdrop-blur-2xl px-6 py-6 overflow-y-auto custom-scrollbar">
                
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="p-2.5 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.15)]">
                        <Activity size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-100">Fatigue Life</h2>
                        <p className="text-[10px] text-fuchsia-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Endurance Limit Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                    <Layers size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Material & Load Setup</span>
                </div>

                <div className="space-y-6 flex-1">
                    <PremiumNumBox label="Ultimate Tensile (S_ut)" unit="MPa" value={inputs.S_ut} min={100} max={3000} step={10} onChange={(v: number) => setInputs({ ...inputs, S_ut: v })} color="#a855f7" />
                    <PremiumNumBox label="Yield Strength (S_y)" unit="MPa" value={inputs.S_y} min={100} max={2500} step={10} onChange={(v: number) => setInputs({ ...inputs, S_y: v })} color="#3b82f6" />
                    
                    <div className="my-8 border-t border-white/5 pt-6"></div>

                    <PremiumNumBox label="Alternating Stress (σ_a)" unit="MPa" value={inputs.sigma_a} min={0} max={1000} step={5} onChange={(v: number) => setInputs({ ...inputs, sigma_a: v })} color="#f59e0b" />
                    <PremiumNumBox label="Mean Stress (σ_m)" unit="MPa" value={inputs.sigma_m} min={0} max={1000} step={5} onChange={(v: number) => setInputs({ ...inputs, sigma_m: v })} color="#ef4444" />
                    
                    <div className="my-8 border-t border-white/5 pt-6"></div>
                    
                    <div className="bg-[#0e1622] rounded-xl border border-white/5 p-4 space-y-4">
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Marin Factors (k_a, k_b, k_c)</p>
                        <PremiumNumBox label="Surface (k_a)" unit="" value={inputs.k_a} min={0.1} max={1.0} step={0.05} onChange={(v: number) => setInputs({ ...inputs, k_a: v })} color="#10b981" />
                        <PremiumNumBox label="Size (k_b)" unit="" value={inputs.k_b} min={0.5} max={1.0} step={0.05} onChange={(v: number) => setInputs({ ...inputs, k_b: v })} color="#10b981" />
                        <PremiumNumBox label="Load (k_c)" unit="" value={inputs.k_c} min={0.5} max={1.0} step={0.05} onChange={(v: number) => setInputs({ ...inputs, k_c: v })} color="#10b981" />
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Live Visualization & Output (65%) */}
            <div className="w-[65%] h-full flex flex-col px-6">
                
                {/* Math Results Header */}
                <div className="flex-none pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div 
                                className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2" 
                                animate={{ color: activeColor }}
                            >
                                <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
                                {results.isSafe ? 'INFINITE LIFE CONFIRMED' : 'WARNING: FATIGUE FAILURE PREDICTED'}
                            </motion.div>
                            <div className="flex items-baseline gap-4">
                                <motion.div 
                                    className="text-[8rem] font-black italic tracking-tighter leading-none"
                                    animate={{ color: activeColor, textShadow: `0 0 40px ${activeColor}40` }}
                                >
                                    {results.criticalVal.toFixed(2)}
                                </motion.div>
                                <span className="text-3xl font-bold text-gray-500 mb-4">FS</span>
                            </div>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Overall Factor of Safety (min)</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 pt-6 text-right">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Endurance Limit (Se)</span>
                            <span className="text-3xl font-mono font-black text-fuchsia-400">{results.S_e.toFixed(1)} <span className="text-xl text-gray-500">MPa</span></span>
                        </div>
                    </div>
                </div>

                {/* Modified Goodman Diagram (SVG Canvas) */}
                <div className="flex-1 relative mt-6 mb-8 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    
                    <div className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <Zap size={14} /> LIVE MODIFIED GOODMAN DIAGRAM
                    </div>

                    <div className="w-full h-full relative z-10 flex items-center justify-center p-8">
                        <motion.svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
                            
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.4)" />
                                </marker>
                                
                                {/* Accurate Safe Zone using intersection of Goodman & Yield triangles */}
                                <clipPath id="goodman-clip">
                                    <polygon points={`${scaleX(0)},${scaleY(0)} ${scaleX(0)},${scaleY(results.S_e)} ${scaleX(inputs.S_ut)},${scaleY(0)}`} />
                                </clipPath>
                            </defs>

                            {/* Axes */}
                            <line x1={padding} y1={500-padding} x2={1000-padding+20} y2={500-padding} stroke="rgba(255,255,255,0.4)" strokeWidth="3" markerEnd="url(#arrow)" />
                            <line x1={padding} y1={500-padding} x2={padding} y2={padding-20} stroke="rgba(255,255,255,0.4)" strokeWidth="3" markerEnd="url(#arrow)" />
                            
                            {/* Axis Labels */}
                            <text x={1000-padding+25} y={500-padding+5} fill="rgba(255,255,255,0.4)" fontSize="14" fontWeight="bold">σ_m</text>
                            <text x={padding-5} y={padding-35} fill="rgba(255,255,255,0.4)" fontSize="14" fontWeight="bold" textAnchor="middle">σ_a</text>

                            {/* Safe Zone Fill (Polygon bounded by clipPath) */}
                            <polygon 
                                clipPath="url(#goodman-clip)"
                                points={`${scaleX(0)},${scaleY(0)} ${scaleX(0)},${scaleY(inputs.S_y)} ${scaleX(inputs.S_y)},${scaleY(0)}`} 
                                fill="rgba(16, 185, 129, 0.15)" stroke="none"
                            />

                            {/* Goodman Line (S_e on Y to S_ut on X) */}
                            <line 
                                x1={scaleX(0)} y1={scaleY(results.S_e)} 
                                x2={scaleX(inputs.S_ut)} y2={scaleY(0)} 
                                stroke="#a855f7" strokeWidth="3" strokeDasharray="6,6" opacity={0.8}
                            />
                            
                            {/* Goodman Labels */}
                            <text x={scaleX(inputs.S_ut)} y={scaleY(0)+25} fill="#a855f7" fontSize="13" fontWeight="bold" textAnchor="middle">S_ut ({inputs.S_ut})</text>
                            <text x={scaleX(0)-15} y={scaleY(results.S_e)} fill="#a855f7" fontSize="13" fontWeight="bold" textAnchor="end" dominantBaseline="middle">S_e ({results.S_e.toFixed(0)})</text>
                            <circle cx={scaleX(inputs.S_ut)} cy={scaleY(0)} r="4" fill="#a855f7" />
                            <circle cx={scaleX(0)} cy={scaleY(results.S_e)} r="4" fill="#a855f7" />

                            {/* Langer Yield Line (S_y on Y to S_y on X) */}
                            <line 
                                x1={scaleX(0)} y1={scaleY(inputs.S_y)} 
                                x2={scaleX(inputs.S_y)} y2={scaleY(0)} 
                                stroke="#3b82f6" strokeWidth="3" opacity={0.6}
                            />
                            
                            {/* Yield Labels */}
                            <text x={scaleX(inputs.S_y)} y={scaleY(0)-15} fill="#3b82f6" fontSize="13" fontWeight="bold" textAnchor="middle">S_y ({inputs.S_y})</text>
                            <text x={scaleX(0)-15} y={scaleY(inputs.S_y)} fill="#3b82f6" fontSize="13" fontWeight="bold" textAnchor="end" dominantBaseline="middle">S_y ({inputs.S_y})</text>
                            <circle cx={scaleX(inputs.S_y)} cy={scaleY(0)} r="4" fill="#3b82f6" />
                            <circle cx={scaleX(0)} cy={scaleY(inputs.S_y)} r="4" fill="#3b82f6" />

                            {/* Load Point (σ_m, σ_a) */}
                            <motion.g 
                                animate={{ x: scaleX(inputs.sigma_m), y: scaleY(inputs.sigma_a) }} 
                                transition={{ type: 'spring', stiffness: 50 }}
                            >
                                <circle cx="0" cy="0" r="8" fill={activeColor} style={{ filter: `drop-shadow(0 0 15px ${activeColor})` }} />
                                {/* Load Line from origin to operating point */}
                                <line x1={scaleX(0) - scaleX(inputs.sigma_m)} y1={scaleY(0) - scaleY(inputs.sigma_a)} x2="0" y2="0" stroke={activeColor} strokeWidth="2" strokeDasharray="3,3" opacity="0.6"/>
                                <text x="15" y="-15" fill={activeColor} fontSize="14" fontWeight="bold" opacity="0.9">
                                    Load ({inputs.sigma_m}, {inputs.sigma_a})
                                </text>
                            </motion.g>

                        </motion.svg>
                    </div>
                </div>

                {/* Warning Footer */}
                <AnimatePresence>
                    {!results.isSafe && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="flex-none bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                        >
                            <ShieldAlert className="shrink-0 animate-pulse" size={32} />
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em]">Fatigue Envelope Exceeded</p>
                                <p className="text-[11px] opacity-80 mt-1">Operating stress combination lies outside the Goodman/Langer safe zone. Infinite life cannot be guaranteed.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
