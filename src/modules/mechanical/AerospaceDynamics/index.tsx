'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plane, Wind, ArrowUp, Activity, Gauge, CloudFog, Compass } from 'lucide-react';

export default function AerospaceDynamics() {
    // Inputs
    const [altitude, setAltitude] = useState<number>(0);         // meters
    const [velocity, setVelocity] = useState<number>(250);       // m/s
    const [wingArea, setWingArea] = useState<number>(120);       // m^2
    const [cl, setCl] = useState<number>(0.5);                   // Lift Coefficient
    const [cd, setCd] = useState<number>(0.025);                 // Drag Coefficient

    // --- Standard Atmosphere Model (ISA) ---
    const isa = useMemo(() => {
        // Constants
        const T0 = 288.15;        // Sea level temp (K)
        const P0 = 101325;        // Sea level pressure (Pa)
        const g = 9.80665;        // Gravity (m/s^2)
        const R = 8.3144598;      // Gas constant (J/(mol·K))
        const M = 0.0289644;      // Molar mass of Earth's air (kg/mol)
        const L = 0.0065;         // Temperature lapse rate (K/m)

        let T: number, P: number, rho: number;
        let h = Math.max(0, altitude);

        if (h <= 11000) {
            // Troposphere
            T = T0 - L * h;
            P = P0 * Math.pow(1 - (L * h) / T0, (g * M) / (R * L));
        } else if (h <= 20000) {
            // Tropopause (isothermal)
            T = 216.65;
            const P11 = 22632; // Pressure at 11km
            P = P11 * Math.exp((-g * M * (h - 11000)) / (R * T));
        } else {
            // Stratosphere (approximation for simplicity in demo)
            T = 216.65 + 0.001 * (h - 20000);
            P = 5474 * Math.pow(216.65 / T, (g * M) / (R * 0.001)); // simplified
        }
        
        rho = (P * M) / (R * T);
        return { T, P, rho };
    }, [altitude]);

    // --- Aerodynamic Forces ---
    const forces = useMemo(() => {
        const q = 0.5 * isa.rho * Math.pow(velocity, 2); // Dynamic pressure
        const lift = q * wingArea * cl;
        const drag = q * wingArea * cd;
        const l_d_ratio = cl / (cd || 1e-10);
        return { q, lift, drag, l_d_ratio };
    }, [isa.rho, velocity, wingArea, cl, cd]);

    const formatNum = (num: number, digits=2) => {
        if (num >= 1e6) return (num / 1e6).toFixed(digits) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(digits) + 'k';
        return num.toFixed(digits);
    };

    return (
        <div className="flex flex-col lg:flex-row w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-orange-500/30">
            {/* Visual Grid Layer */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL: Controls */}
            <div className="w-full lg:w-[380px] bg-[#05080f]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-orange-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <Plane size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Aero Dynamics</h1>
                            <p className="text-[10px] text-orange-500/60 font-mono tracking-widest uppercase">ISA Flight Envelope Engine</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    {/* Atmospheric Input */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <CloudFog size={12} /> Standard Atmosphere (ISA)
                        </h2>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Altitude (h)</span>
                                <span className="text-orange-400 font-mono">{formatNum(altitude, 0)} m</span>
                            </div>
                            <input 
                                type="range" min="0" max="25000" step="100" 
                                value={altitude} onChange={(e) => setAltitude(e.target.valueAsNumber)} 
                                className="w-full accent-orange-500" 
                            />
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5 my-4" />

                    {/* Flight Conditions Inputs */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Gauge size={12} /> Flight Conditions
                        </h2>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Velocity (v)</span>
                                <span className="text-orange-400 font-mono">{velocity} m/s</span>
                            </div>
                            <input 
                                type="range" min="10" max="1000" step="5" 
                                value={velocity} onChange={(e) => setVelocity(e.target.valueAsNumber)} 
                                className="w-full accent-orange-500" 
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Wing Area (S)</span>
                                <span className="text-orange-400 font-mono">{wingArea} m²</span>
                            </div>
                            <input 
                                type="range" min="5" max="500" step="1" 
                                value={wingArea} onChange={(e) => setWingArea(e.target.valueAsNumber)} 
                                className="w-full accent-orange-500" 
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Lift Coeff (C_l)</span>
                                <span className="text-emerald-400 font-mono">{cl.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="-0.5" max="2.5" step="0.05" 
                                value={cl} onChange={(e) => setCl(e.target.valueAsNumber)} 
                                className="w-full accent-emerald-500" 
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Drag Coeff (C_d)</span>
                                <span className="text-red-400 font-mono">{cd.toFixed(3)}</span>
                            </div>
                            <input 
                                type="range" min="0.005" max="0.5" step="0.005" 
                                value={cd} onChange={(e) => setCd(e.target.valueAsNumber)} 
                                className="w-full accent-red-500" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col relative z-10 p-8 lg:p-12 gap-8 overflow-y-auto">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                {/* ISA Environment Data Block */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Compass size={64}/></div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Density (ρ)</div>
                        <div className="text-3xl font-black font-mono text-white">{isa.rho.toFixed(4)}</div>
                        <div className="text-xs text-slate-500 mt-1">kg/m³</div>
                    </div>
                    
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Gauge size={64}/></div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pressure (P)</div>
                        <div className="text-3xl font-black font-mono text-white">{formatNum(isa.P, 1)}</div>
                        <div className="text-xs text-slate-500 mt-1">Pa</div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Activity size={64}/></div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Temperature (T)</div>
                        <div className="text-3xl font-black font-mono text-white">{isa.T.toFixed(1)}</div>
                        <div className="text-xs text-slate-500 mt-1">Kelvin</div>
                    </div>
                </motion.div>

                {/* Primary Forces Graphic Display */}
                <div className="flex-1 min-h-[400px] bg-black/40 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
                    {/* Visualizer Lines */}
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />

                    {/* Central Airplane Node */}
                    <div className="relative w-24 h-24 bg-[#0a101f] border border-orange-500/50 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.2)] z-20">
                        <Plane className="text-orange-400 -rotate-90" size={32} />
                    </div>

                    {/* Lift Vector (Up) */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 w-full">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-4 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.1)] mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowUp className="text-emerald-400" size={16} />
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">LIFT (L)</span>
                            </div>
                            <div className="text-4xl font-mono font-black text-white">{formatNum(forces.lift)} <span className="text-lg text-emerald-500/50 font-sans">N</span></div>
                        </div>
                        <div className="w-1 h-32 bg-gradient-to-t from-emerald-500 to-transparent rounded-t-full" />
                    </div>

                    {/* Drag Vector (Backwards - Right side visually pushing back) */}
                    <div className="absolute top-1/2 right-12 -translate-y-1/2 flex items-center z-10 hidden md:flex">
                         <div className="w-32 h-1 bg-gradient-to-r from-red-500 to-transparent rounded-r-full mr-4" />
                         <div className="bg-red-500/10 border border-red-500/30 px-6 py-4 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black uppercase tracking-widest text-red-400">DRAG (D)</span>
                                <Wind className="text-red-400 rotate-180" size={16} />
                            </div>
                            <div className="text-3xl font-mono font-black text-white">{formatNum(forces.drag)} <span className="text-lg text-red-500/50 font-sans">N</span></div>
                        </div>
                    </div>
                </div>

                {/* Efficiency Footer */}
                <div className="flex items-center justify-between bg-orange-900/20 border border-orange-500/20 rounded-2xl p-6 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                           <Activity className="text-orange-400" size={20} />
                       </div>
                       <div>
                           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Aerodynamic Efficiency</div>
                           <div className="text-xl font-black text-white italic">Lift-to-Drag Ratio (L/D)</div>
                       </div>
                    </div>
                    <div className="text-5xl font-mono font-black tracking-tighter text-orange-400">
                        {forces.l_d_ratio.toFixed(1)}
                        <span className="text-xl text-orange-500/50 ml-2 font-sans font-medium hover:text-white transition-colors cursor-pointer block text-right mt-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px' }}>Efficiency Metric</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
