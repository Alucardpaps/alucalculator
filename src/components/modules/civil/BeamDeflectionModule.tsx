'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ruler, AlertTriangle, ArrowDown, Layers, Subtitles, Settings2, Target
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

export default function BeamDeflectionModule() {
    const { t } = useI18nStore();

    const [inputs, setInputs] = useState({
        length: 3000, // mm
        load: 10,     // kN
        modulus: 70,  // GPa (Aluminum)
        inertia: 15.5,// 10^6 mm^4
        type: 'simple' as 'simple' | 'cantilever'
    });

    const results = useMemo(() => {
        const L = inputs.length;
        const F = inputs.load * 1000; // N
        const E = inputs.modulus * 1000; // N/mm^2
        const I = inputs.inertia * 1000000; // mm^4

        let delta = 0;
        if (inputs.type === 'simple') {
            delta = (F * Math.pow(L, 3)) / (48 * E * I);
        } else {
            delta = (F * Math.pow(L, 3)) / (3 * E * I);
        }

        const limit = L / 300;
        const isSafe = delta <= limit;

        return { delta, limit, isSafe };
    }, [inputs]);

    const activeColor = results.isSafe ? '#10b981' : '#ef4444'; // Emerald for safe, Red for unsafe

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-y-auto lg:overflow-hidden p-2 gap-4">
            {/* LEFT PANEL - Control Center (35%) */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full bg-[#080d14]/80 rounded-2xl border border-white/5 backdrop-blur-2xl px-6 py-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <Layers size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-100">{t.modules?.beamDeflection?.title || 'Beam Deflection'}</h2>
                        <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Structural Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                    <Settings2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kinematic Setup</span>
                </div>

                {/* Beam Type Toggle */}
                <div className="flex bg-black/60 rounded-[14px] p-1 border border-white/5 mb-8 shadow-inner">
                    {(['simple', 'cantilever'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setInputs({ ...inputs, type })}
                            className={`flex-1 py-2.5 rounded-[10px] text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${inputs.type === type ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)] border border-blue-400/50' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {type === 'simple' ? 'Simply Supported' : 'Cantilevered'}
                        </button>
                    ))}
                </div>

                <div className="space-y-6 flex-1">
                    <PremiumNumBox
                        label="Beam Length (L)" unit="mm"
                        value={inputs.length} min={500} max={20000} step={100}
                        onChange={(v: number) => setInputs({ ...inputs, length: v })}
                        color="#3b82f6"
                    />
                    <PremiumNumBox
                        label="Applied Load (F)" unit="kN"
                        value={inputs.load} min={0.1} max={500} step={0.5}
                        onChange={(v: number) => setInputs({ ...inputs, load: v })}
                        color="#f59e0b"
                    />
                    <PremiumNumBox
                        label="Elastic Modulus (E)" unit="GPa"
                        value={inputs.modulus} min={10} max={300} step={1}
                        onChange={(v: number) => setInputs({ ...inputs, modulus: v })}
                        color="#10b981"
                    />
                    <PremiumNumBox
                        label="Area Moment (Ix)" unit="10⁶ mm⁴"
                        value={inputs.inertia} min={0.1} max={5000} step={0.1}
                        onChange={(v: number) => setInputs({ ...inputs, inertia: v })}
                        color="#8b5cf6"
                    />
                </div>
            </div>

            {/* RIGHT PANEL - Live Visualization & Output (65%) */}
            <div className="flex-1 h-auto lg:h-full flex flex-col px-6 min-w-0">
                {/* Math Results Header */}
                <div className="flex-none pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div 
                                className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2" 
                                animate={{ color: activeColor }}
                                transition={{ duration: 0.5 }}
                            >
                                <motion.div 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    animate={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} 
                                />
                                {results.isSafe ? 'INTEGRITY: NORMAL' : 'WARNING: LIMIT EXCEEDED'}
                            </motion.div>
                            <div className="flex items-baseline gap-4">
                                <motion.div 
                                    className="text-[9rem] font-black italic tracking-tighter leading-none"
                                    style={{ 
                                        color: activeColor,
                                        textShadow: `0 0 40px ${activeColor}40`,
                                    }}
                                    animate={{ color: activeColor, textShadow: `0 0 40px ${activeColor}40` }}
                                >
                                    {results.delta.toFixed(2)}
                                </motion.div>
                                <span className="text-4xl font-bold text-gray-500 mb-4">mm</span>
                            </div>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Maximum Deflection (ΔMax)</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 pt-6 text-right">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                <Target size={12} /> Allowable Limit (L/300)
                            </span>
                            <span className="text-3xl font-mono font-black text-gray-300">{results.limit.toFixed(2)} <span className="text-xl text-gray-500">mm</span></span>
                        </div>
                    </div>
                </div>

                {/* 3D/Vectors Canvas Area */}
                <div className="flex-1 relative mt-10 mb-8 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner flex flex-col justify-end pb-24">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    <div className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <Ruler size={14} /> LIVE DEFORMATION KINEMATICS
                    </div>

                    {/* Beam Animation Container */}
                    <div className="w-full h-[250px] mx-auto relative z-10 flex items-center justify-center">
                        <motion.svg
                            className="w-full h-full overflow-visible pointer-events-none"
                            viewBox="0 0 1000 300"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {/* Standard Beam Line (Undeformed Reference) */}
                            <line 
                                x1="100" y1="100" x2="900" y2="100" 
                                stroke="rgba(255,255,255,0.2)" strokeWidth="4" strokeDasharray="10, 10" 
                            />
                            
                            {/* Supports Simple */}
                            {inputs.type === 'simple' && (
                                <>
                                    {/* Left Support (Pin) */}
                                    <path d="M 100,100 L 70,150 L 130,150 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                    <line x1="60" y1="150" x2="140" y2="150" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                    {/* Right Support (Roller) */}
                                    <circle cx="900" cy="115" r="15" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                    <line x1="860" y1="130" x2="940" y2="130" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                </>
                            )}
                            
                            {/* Support Cantilever */}
                            {inputs.type === 'cantilever' && (
                                <>
                                    {/* Fixed Wall on Left */}
                                    <rect x="70" y="20" width="30" height="160" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                    {/* Hatching for wall */}
                                    <path d="M 70,30 L 100,60 M 70,60 L 100,90 M 70,90 L 100,120 M 70,120 L 100,150" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                                </>
                            )}

                            {/* Deformed Beam path */}
                            <motion.path
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="12"
                                strokeLinecap="round"
                                style={{ filter: `drop-shadow(0 0 15px ${activeColor}80)` }}
                                animate={{
                                    d: inputs.type === 'simple'
                                        ? `M 100,100 Q 500,${100 + Math.min(results.delta * 4, 180)} 900,100` // max 180 delta visually
                                        : `M 100,100 Q 500,100 900,${100 + Math.min(results.delta * 4, 180)}`
                                }}
                                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                            />
                            
                            {/* Animated Load Arrow */}
                            <motion.g 
                                animate={{ 
                                    y: inputs.type === 'simple' ? 100 + Math.min(results.delta * 4, 180) : 100 + Math.min(results.delta * 4, 180),
                                    x: inputs.type === 'simple' ? 500 : 900
                                }}
                                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                            >
                                <path 
                                    d="M 0,-80 L 0,-20 M -15,-35 L 0,-15 L 15,-35" 
                                    fill="none" 
                                    stroke="#f59e0b" 
                                    strokeWidth="8" 
                                    strokeLinecap="round" strokeLinejoin="round"
                                    style={{ filter: 'drop-shadow(0 0 15px rgba(245,158,11,0.8))' }}
                                />
                                <text x="25" y="-60" fill="#f59e0b" fontSize="28" fontWeight="900" fontFamily="monospace">F</text>
                            </motion.g>
                        </motion.svg>
                    </div>

                    {/* Threat Indicator glow */}
                    {!results.isSafe && (
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-500/20 to-transparent pointer-events-none" />
                    )}
                </div>

                {/* Warning Footer */}
                <AnimatePresence>
                    {!results.isSafe && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex-none bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                        >
                            <AlertTriangle className="shrink-0 animate-pulse" size={32} />
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em]">Critical Structural Warning</p>
                                <p className="text-[11px] opacity-80 mt-1">Deflection exceeds the structural limit. Consider increasing beam inertia ({inputs.inertia} → {Math.ceil(inputs.inertia * 1.5)}) or utilizing a higher modulus material.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Custom Premium Input Control
function PremiumNumBox({ label, unit, value, min, max, step, onChange, color }: any) {
    return (
        <div className="group relative">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-white transition-colors">{label}</span>
            </div>
            
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-white/30 group-focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-lg font-black font-mono px-4 py-3 text-white outline-none appearance-none"
                    style={{ textShadow: `0 0 10px ${color}40` }}
                />
                <div className="px-4 text-[10px] font-bold text-gray-500 border-l border-white/5 bg-white/[0.02] h-full flex flex-col justify-center items-center">
                    <span style={{ color }}>{unit}</span>
                </div>
            </div>
            
            <div className="mt-3 px-1">
                <input
                    type="range" min={min} max={max} step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}
