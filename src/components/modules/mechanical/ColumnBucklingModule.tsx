'use client';

import React, { useState, useMemo } from 'react';
import { Settings, AlignVerticalSpaceAround, Activity, Ruler } from 'lucide-react';

export default function ColumnBucklingModule() {
    // Inputs
    const [length, setLength] = useState<number>(2000); // mm
    const [endCondition, setEndCondition] = useState<'pinned-pinned' | 'fixed-free' | 'fixed-fixed' | 'fixed-pinned'>('pinned-pinned');
    
    // Material (Steel default)
    const [elasticModulus, setElasticModulus] = useState<number>(200); // GPa
    const [yieldStrength, setYieldStrength] = useState<number>(250); // MPa
    
    // Cross-section
    const [sectionType, setSectionType] = useState<'circular' | 'rectangular'>('circular');
    const [diameter, setDiameter] = useState<number>(50); // mm
    const [width, setWidth] = useState<number>(50); // mm
    const [height, setHeight] = useState<number>(50); // mm
    const [load, setLoad] = useState<number>(10); // kN (Applied Load)

    const K_FACTOR = {
        'pinned-pinned': 1.0,
        'fixed-free': 2.0,
        'fixed-fixed': 0.5,
        'fixed-pinned': 0.707
    };

    const results = useMemo(() => {
        const L = length; // mm
        const K = K_FACTOR[endCondition];
        const E = elasticModulus * 1000; // MPa
        const Sy = yieldStrength; // MPa
        const P_applied = load * 1000; // N

        let I = 0; // mm^4
        let A = 0; // mm^2

        if (sectionType === 'circular') {
            I = (Math.PI * Math.pow(diameter, 4)) / 64;
            A = (Math.PI * Math.pow(diameter, 2)) / 4;
        } else {
            I = (width * Math.pow(height, 3)) / 12; // Weak axis is determined by min(I_x, I_y)
            const I_y = (height * Math.pow(width, 3)) / 12;
            I = Math.min(I, I_y);
            A = width * height;
        }

        const r = Math.sqrt(I / A); // radius of gyration
        const slendernessRatio = (K * L) / r;
        const criticalSlenderness = Math.sqrt((2 * Math.pow(Math.PI, 2) * E) / Sy);

        let Pcr = 0;
        let mode = '';

        if (slendernessRatio > criticalSlenderness) {
            mode = 'Euler (Long Column)';
            Pcr = (Math.pow(Math.PI, 2) * E * I) / Math.pow(K * L, 2);
        } else {
            mode = 'Johnson (Short Column)';
            Pcr = A * (Sy - (Math.pow(Sy, 2) / (4 * Math.pow(Math.PI, 2) * E)) * Math.pow(slendernessRatio, 2));
        }

        const safetyFactor = Pcr / P_applied;
        const criticalStress = Pcr / A;

        return {
            I,
            A,
            r,
            slendernessRatio,
            criticalSlenderness,
            Pcr: Pcr / 1000, // kN
            mode,
            safetyFactor,
            criticalStress, // MPa
            isSafe: safetyFactor >= 2.0 // common FOS for buckling
        };
    }, [length, endCondition, elasticModulus, yieldStrength, sectionType, diameter, width, height, load]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-orange-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                            <AlignVerticalSpaceAround size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Buckling</h1>
                            <p className="text-[10px] text-orange-500/60 font-mono tracking-widest uppercase">Euler-Johnson</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings size={12} /> Condition & Load
                        </h2>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">End Conditions (K-Factor)</label>
                            <select value={endCondition} onChange={e => setEndCondition(e.target.value as any)} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none font-mono">
                                <option value="pinned-pinned">Pinned-Pinned (K=1.0)</option>
                                <option value="fixed-free">Fixed-Free (K=2.0)</option>
                                <option value="fixed-fixed">Fixed-Fixed (K=0.5)</option>
                                <option value="fixed-pinned">Fixed-Pinned (K=0.7)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Length (mm)</label>
                                <input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">App. Load (kN)</label>
                                <input type="number" value={load} onChange={e => setLoad(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Ruler size={12} /> Cross Section
                        </h2>
                        <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                            <button onClick={() => setSectionType('circular')} className={`flex-1 py-1.5 text-xs font-bold rounded ${sectionType === 'circular' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>Circular</button>
                            <button onClick={() => setSectionType('rectangular')} className={`flex-1 py-1.5 text-xs font-bold rounded ${sectionType === 'rectangular' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>Rectangular</button>
                        </div>

                        {sectionType === 'circular' ? (
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Diameter (mm)</label>
                                <input type="number" value={diameter} onChange={e => setDiameter(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Width (mm)</label>
                                    <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Height (mm)</label>
                                    <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${results.isSafe ? 'bg-orange-500/10' : 'bg-red-500/10'}`} />
                
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 overflow-hidden">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${results.isSafe ? 'text-orange-400' : 'text-red-400'}`}>Critical Buckling Load (P_cr)</div>
                    <div className="text-7xl font-mono font-black tracking-tighter text-white">
                        {results.Pcr.toFixed(1)}<span className="text-3xl text-gray-500 font-sans ml-2">kN</span>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.mode.includes('Euler') ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'}`}>
                            {results.mode}
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.isSafe ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                            FOS: {results.safetyFactor.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Slenderness Ratio (λ)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.slendernessRatio.toFixed(1)} <span className="text-sm font-sans text-orange-400">/ {results.criticalSlenderness.toFixed(0)}</span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-600 uppercase mt-1">Actual / Critical</div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Area Moment (I_min)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {(results.I / 10000).toFixed(1)} <span className="text-sm font-sans text-orange-400">cm⁴</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Critical Stress (σ_cr)</div>
                        <div className="text-3xl font-mono font-black text-orange-400">
                            {results.criticalStress.toFixed(1)} <span className="text-sm font-sans text-orange-400/50">MPa</span>
                        </div>
                        {results.criticalStress > yieldStrength && (
                            <div className="mt-2 text-[10px] text-red-400 uppercase tracking-widest font-bold">Exceeds Yield!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
