'use client';

import React, { useState, useMemo } from 'react';
import { Settings, ShieldAlert, Activity, ArrowUpDown } from 'lucide-react';

export default function AdvancedSpringModule() {
    // Inputs
    const [wireDiameter, setWireDiameter] = useState<number>(5); // d in mm
    const [meanDiameter, setMeanDiameter] = useState<number>(40); // D in mm
    const [activeCoils, setActiveCoils] = useState<number>(10); // Na
    const [appliedForce, setAppliedForce] = useState<number>(500); // F in N
    
    // Material (e.g. Music Wire ASTM A228)
    const [shearModulus, setShearModulus] = useState<number>(79300); // G in MPa
    const [tensileStrength, setTensileStrength] = useState<number>(1500); // Sut in MPa

    const results = useMemo(() => {
        const d = wireDiameter;
        const D = meanDiameter;
        const Na = activeCoils;
        const F = appliedForce;
        const G = shearModulus;

        // Spring Index
        const C = d > 0 ? D / d : 0;
        
        // Wahl Correction Factor
        const Kw = C > 1 ? ((4 * C - 1) / (4 * C - 4)) + (0.615 / C) : 0;
        
        // Shear Stress (tau) = Kw * (8 * F * D) / (pi * d^3)
        const shearStress = (d > 0) ? (Kw * 8 * F * D) / (Math.PI * Math.pow(d, 3)) : 0;

        // Spring Rate (k) = (G * d^4) / (8 * D^3 * Na)
        const springRate = (D > 0 && Na > 0) ? (G * Math.pow(d, 4)) / (8 * Math.pow(D, 3) * Na) : 0;
        
        // Deflection
        const deflection = springRate > 0 ? F / springRate : 0;

        // Allowable Shear Stress (approx 45% of Ultimate Tensile Strength for static loading)
        const allowableStress = tensileStrength * 0.45;
        const safetyFactor = shearStress > 0 ? allowableStress / shearStress : 0;
        const isSafe = safetyFactor >= 1.2;

        return {
            C,
            Kw,
            shearStress,
            springRate,
            deflection,
            allowableStress,
            safetyFactor,
            isSafe
        };
    }, [wireDiameter, meanDiameter, activeCoils, appliedForce, shearModulus, tensileStrength]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-fuchsia-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400">
                            <ArrowUpDown size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Spring Design</h1>
                            <p className="text-[10px] text-fuchsia-500/60 font-mono tracking-widest uppercase">Helical Compression</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings size={12} /> Geometry & Load
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Wire Dia, d (mm)</label>
                                <input type="number" value={wireDiameter} onChange={e => setWireDiameter(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Mean Dia, D (mm)</label>
                                <input type="number" value={meanDiameter} onChange={e => setMeanDiameter(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Coils (Na)</label>
                                <input type="number" value={activeCoils} onChange={e => setActiveCoils(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Force, F (N)</label>
                                <input type="number" value={appliedForce} onChange={e => setAppliedForce(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5 my-2" />

                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Activity size={12} /> Material Properties
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Shear Mod (MPa)</label>
                                <input type="number" value={shearModulus} onChange={e => setShearModulus(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ultimate Tensile (MPa)</label>
                                <input type="number" value={tensileStrength} onChange={e => setTensileStrength(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${results.isSafe ? 'bg-fuchsia-500/10' : 'bg-red-500/10'}`} />
                
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 overflow-hidden">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${results.isSafe ? 'text-fuchsia-400' : 'text-red-400'}`}>Max Shear Stress (τ)</div>
                    <div className="text-7xl font-mono font-black tracking-tighter text-white">
                        {results.shearStress.toFixed(1)}<span className="text-3xl text-gray-500 font-sans ml-2">MPa</span>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-400">
                            Index (C): {results.C.toFixed(1)}
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.isSafe ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                            FOS: {results.safetyFactor.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Spring Rate (k)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.springRate.toFixed(2)} <span className="text-sm font-sans text-fuchsia-400">N/mm</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Deflection (δ)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.deflection.toFixed(2)} <span className="text-sm font-sans text-fuchsia-400">mm</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><ShieldAlert /></div>
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Allowable Stress</div>
                        <div className="text-3xl font-mono font-black text-emerald-400">
                            {results.allowableStress.toFixed(1)} <span className="text-sm font-sans text-emerald-400/50">MPa</span>
                        </div>
                        {results.shearStress > results.allowableStress && (
                             <div className="mt-2 text-[10px] text-red-400 uppercase tracking-widest font-bold">Exceeds Allowable!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
