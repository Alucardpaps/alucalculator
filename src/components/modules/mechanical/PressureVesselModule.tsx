'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ShieldAlert, Activity, Droplets, ArrowDownToLine, Maximize2 } from 'lucide-react';

export default function PressureVesselModule() {
    // Inputs
    const [pressure, setPressure] = useState<number>(10); // MPa
    const [innerRadius, setInnerRadius] = useState<number>(500); // mm
    const [thickness, setThickness] = useState<number>(10); // mm
    const [yieldStrength, setYieldStrength] = useState<number>(250); // MPa (e.g. A36 Steel)
    const [jointEfficiency, setJointEfficiency] = useState<number>(0.85); // E
    
    const [vesselType, setVesselType] = useState<'cylinder' | 'sphere'>('cylinder');
    
    // Calculations
    const results = useMemo(() => {
        const p = pressure;
        const r = innerRadius;
        const t = thickness;
        const e = jointEfficiency;
        const sy = yieldStrength;

        // Ratio for thick vs thin wall
        const isThinWalled = r / t >= 10;
        
        let hoopStress = 0;
        let longStress = 0;
        let maxStress = 0;
        let requiredThickness = 0;
        
        if (vesselType === 'cylinder') {
            if (isThinWalled) {
                hoopStress = (p * r) / t;
                longStress = (p * r) / (2 * t);
            } else {
                // Lame's equation for inner surface (max hoop stress)
                const outerRadius = r + t;
                hoopStress = p * ((outerRadius ** 2 + r ** 2) / (outerRadius ** 2 - r ** 2));
                longStress = p * (r ** 2 / (outerRadius ** 2 - r ** 2));
            }
            maxStress = Math.max(hoopStress, longStress);
            
            // ASME Section VIII Div 1 (Simplified for internal pressure)
            // t = (P * R) / (S * E - 0.6 * P)
            const allowableStress = sy / 1.5; // Safety factor 1.5
            requiredThickness = (p * r) / (allowableStress * e - 0.6 * p);
            
        } else {
            // Sphere
            if (isThinWalled) {
                hoopStress = (p * r) / (2 * t);
                longStress = hoopStress;
            } else {
                const outerRadius = r + t;
                hoopStress = p * ((outerRadius ** 3 + 2 * r ** 3) / (2 * (outerRadius ** 3 - r ** 3)));
                longStress = hoopStress;
            }
            maxStress = hoopStress;
            
            // ASME Sec VIII Div 1
            // t = (P * R) / (2 * S * E - 0.2 * P)
            const allowableStress = sy / 1.5;
            requiredThickness = (p * r) / (2 * allowableStress * e - 0.2 * p);
        }

        const safetyFactor = sy / maxStress;
        const isSafe = safetyFactor >= 1.5;

        return {
            hoopStress,
            longStress,
            maxStress,
            isThinWalled,
            requiredThickness,
            safetyFactor,
            isSafe
        };

    }, [pressure, innerRadius, thickness, yieldStrength, jointEfficiency, vesselType]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-blue-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                            <Droplets size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Vessel Analytix</h1>
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-widest uppercase">ASME Section VIII Div 1</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Geometry & Type */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings size={12} /> Parameters
                        </h2>
                        
                        <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                            <button onClick={() => setVesselType('cylinder')} className={`flex-1 py-1.5 text-xs font-bold rounded ${vesselType === 'cylinder' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>Cylinder</button>
                            <button onClick={() => setVesselType('sphere')} className={`flex-1 py-1.5 text-xs font-bold rounded ${vesselType === 'sphere' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>Sphere</button>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Internal Pressure (P)</span>
                                <span className="text-blue-400 font-mono">{pressure} MPa</span>
                            </div>
                            <input type="range" min={0.1} max={100} step={0.1} value={pressure} onChange={e => setPressure(Number(e.target.value))} className="w-full accent-blue-500" />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Inner Radius (mm)</label>
                                <input type="number" value={innerRadius} onChange={e => setInnerRadius(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Thickness (mm)</label>
                                <input type="number" value={thickness} onChange={e => setThickness(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5 my-2" />

                    {/* Material */}
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Yield Strength (MPa)</label>
                                <input type="number" value={yieldStrength} onChange={e => setYieldStrength(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Joint Effic. (E)</label>
                                <input type="number" step={0.05} max={1} min={0.1} value={jointEfficiency} onChange={e => setJointEfficiency(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${results.isSafe ? 'bg-blue-500/10' : 'bg-red-500/10'}`} />
                
                {/* Main Results Graphic */}
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 overflow-hidden">
                    {/* Visualizer Lines */}
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5" />
                    
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${results.isSafe ? 'text-blue-400' : 'text-red-400'}`}>Max Principal Stress</div>
                    <div className="text-7xl font-mono font-black tracking-tighter text-white">
                        {results.maxStress.toFixed(1)}<span className="text-3xl text-gray-500 font-sans ml-2">MPa</span>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.isThinWalled ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-purple-500/20 border-purple-500/40 text-purple-400'}`}>
                            {results.isThinWalled ? 'Thin-Walled Theory' : 'Thick-Walled (Lame)'}
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.isSafe ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                            FOS: {results.safetyFactor.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Maximize2 /></div>
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Hoop Stress (σ_h)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.hoopStress.toFixed(1)} <span className="text-sm font-sans text-blue-400">MPa</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><ArrowDownToLine /></div>
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Longitudinal (σ_l)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.longStress.toFixed(1)} <span className="text-sm font-sans text-purple-400">MPa</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><ShieldAlert /></div>
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Req. Thickness (ASME)</div>
                        <div className="text-3xl font-mono font-black text-emerald-400">
                            {Math.max(0, results.requiredThickness).toFixed(2)} <span className="text-sm font-sans text-emerald-400/50">mm</span>
                        </div>
                        {thickness < results.requiredThickness && (
                             <div className="mt-2 text-[10px] text-red-400 uppercase tracking-widest font-bold">Fails ASME standard</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
