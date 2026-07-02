'use client';

import React, { useState, useMemo } from 'react';
import { Settings, Activity, Waves } from 'lucide-react';

export default function VibrationModule() {
    // Inputs
    const [mass, setMass] = useState<number>(100); // kg
    const [stiffness, setStiffness] = useState<number>(50000); // N/m
    const [dampingRatio, setDampingRatio] = useState<number>(0.05); // zeta (zeta = c / c_c)
    const [excitationFreq, setExcitationFreq] = useState<number>(10); // Hz

    const results = useMemo(() => {
        const m = mass;
        const k = stiffness;
        const zeta = dampingRatio;
        const f = excitationFreq; // Hz

        // Natural frequency
        const omega_n = Math.sqrt(k / m); // rad/s
        const fn = omega_n / (2 * Math.PI); // Hz

        // Frequency Ratio r
        const r = f / fn;

        // Transmissibility (Tr)
        // Tr = sqrt( 1 + (2*zeta*r)^2 ) / sqrt( (1 - r^2)^2 + (2*zeta*r)^2 )
        const num = 1 + Math.pow(2 * zeta * r, 2);
        const den = Math.pow(1 - Math.pow(r, 2), 2) + Math.pow(2 * zeta * r, 2);
        const transmissibility = Math.sqrt(num / den);

        // Isolation Efficiency (%)
        const isolationEfficiency = (1 - transmissibility) * 100;
        const isIsolated = transmissibility < 1;
        const isResonance = r > 0.8 && r < 1.2;

        return {
            omega_n,
            fn,
            r,
            transmissibility,
            isolationEfficiency: Math.max(0, isolationEfficiency),
            isIsolated,
            isResonance
        };
    }, [mass, stiffness, dampingRatio, excitationFreq]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-rose-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                            <Waves size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Vibration</h1>
                            <p className="text-[10px] text-rose-500/60 font-mono tracking-widest uppercase">SDOF Isolation</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings size={12} /> System Parameters
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Mass, m (kg)</label>
                                <input type="number" value={mass} onChange={e => setMass(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Stiffness, k (N/m)</label>
                                <input type="number" value={stiffness} onChange={e => setStiffness(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Damping Ratio, ζ</label>
                                <input type="number" step="0.01" value={dampingRatio} onChange={e => setDampingRatio(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Excitation Freq (Hz)</label>
                                <input type="number" value={excitationFreq} onChange={e => setExcitationFreq(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${results.isResonance ? 'bg-red-500/10' : results.isIsolated ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`} />
                
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 overflow-hidden">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${results.isResonance ? 'text-red-400' : 'text-rose-400'}`}>Transmissibility (Tr)</div>
                    <div className="text-7xl font-mono font-black tracking-tighter text-white">
                        {results.transmissibility.toFixed(2)}
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.isResonance ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'}`}>
                            {results.isResonance ? 'DANGER: RESONANCE' : `Ratio (r): ${results.r.toFixed(2)}`}
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.isIsolated ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                            {results.isIsolated ? `Isolated (${results.isolationEfficiency.toFixed(1)}%)` : 'Amplified'}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Natural Frequency (fn)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.fn.toFixed(2)} <span className="text-sm font-sans text-rose-400">Hz</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">({results.omega_n.toFixed(1)} rad/s)</div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Excitation (f)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {excitationFreq.toFixed(2)} <span className="text-sm font-sans text-rose-400">Hz</span>
                        </div>
                        {results.r > Math.SQRT2 && (
                            <div className="text-[10px] text-emerald-500 mt-1 uppercase font-bold tracking-widest">Effective Isolation Region (r &gt; √2)</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
