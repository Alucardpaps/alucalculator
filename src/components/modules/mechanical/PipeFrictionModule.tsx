'use client';

import React, { useState, useMemo } from 'react';
import { Settings, Droplet, MoveRight, ArrowDownRight, Wind } from 'lucide-react';

export default function PipeFrictionModule() {
    // Inputs
    const [diameter, setDiameter] = useState<number>(50); // mm
    const [length, setLength] = useState<number>(100); // m
    const [flowRate, setFlowRate] = useState<number>(5); // L/s
    const [roughness, setRoughness] = useState<number>(0.045); // mm (Commercial steel)
    const [fluidType, setFluidType] = useState<'water'|'air'|'oil'>('water');

    const fluidProps = useMemo(() => {
        if (fluidType === 'water') return { rho: 998, mu: 0.001 }; // kg/m³, Pa.s (at 20C)
        if (fluidType === 'air') return { rho: 1.225, mu: 0.0000181 };
        if (fluidType === 'oil') return { rho: 870, mu: 0.04 }; // typical hydraulic oil
        return { rho: 998, mu: 0.001 };
    }, [fluidType]);

    const results = useMemo(() => {
        const d = diameter / 1000; // m
        const l = length; // m
        const q = flowRate / 1000; // m³/s
        const eps = roughness / 1000; // m
        const { rho, mu } = fluidProps;

        const area = Math.PI * (d * d) / 4;
        const velocity = area > 0 ? q / area : 0; // m/s
        const reynolds = (rho * velocity * d) / (mu || 1e-10);

        let f = 0;
        let flowRegime = 'Laminar';

        if (reynolds < 2300) {
            flowRegime = 'Laminar';
            f = reynolds > 0 ? 64 / reynolds : 0;
        } else if (reynolds < 4000) {
            flowRegime = 'Transitional';
            // Simple interpolation for transition zone
            const f_lam = 64 / 2300;
            const f_turb = 0.25 / Math.pow(Math.log10(eps / (3.7 * d) + 5.74 / Math.pow(4000, 0.9)), 2);
            f = f_lam + ((reynolds - 2300) / 1700) * (f_turb - f_lam);
        } else {
            flowRegime = 'Turbulent';
            // Swamee-Jain approximation of Colebrook-White
            f = 0.25 / Math.pow(Math.log10(eps / (3.7 * d) + 5.74 / Math.pow(reynolds, 0.9)), 2);
        }

        // Darcy-Weisbach Head Loss
        const g = 9.81;
        const headLoss = f * (l / d) * ((velocity * velocity) / (2 * g));
        const pressureDropPa = f * (l / d) * 0.5 * rho * velocity * velocity;
        const pressureDropBar = pressureDropPa / 100000;

        return {
            velocity,
            reynolds,
            f,
            flowRegime,
            headLoss,
            pressureDropBar
        };
    }, [diameter, length, flowRate, roughness, fluidProps]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                            <MoveRight size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Pipe Flow</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase">Darcy-Weisbach</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Droplet size={12} /> Fluid Properties
                        </h2>
                        <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                            <button onClick={() => setFluidType('water')} className={`flex-1 py-1.5 text-xs font-bold rounded ${fluidType === 'water' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>Water</button>
                            <button onClick={() => setFluidType('oil')} className={`flex-1 py-1.5 text-xs font-bold rounded ${fluidType === 'oil' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>Oil</button>
                            <button onClick={() => setFluidType('air')} className={`flex-1 py-1.5 text-xs font-bold rounded ${fluidType === 'air' ? 'bg-slate-500 text-white' : 'text-gray-400'}`}>Air</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings size={12} /> Pipe Parameters
                        </h2>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-400">Flow Rate (L/s)</span>
                                <span className="text-cyan-400 font-mono">{flowRate}</span>
                            </div>
                            <input type="range" min={0.1} max={50} step={0.1} value={flowRate} onChange={e => setFlowRate(Number(e.target.value))} className="w-full accent-cyan-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Inner Dia (mm)</label>
                                <input type="number" value={diameter} onChange={e => setDiameter(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Length (m)</label>
                                <input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Roughness ε (mm)</label>
                                <input type="number" step={0.001} value={roughness} onChange={e => setRoughness(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                                <div className="text-[8px] text-gray-500 mt-1 uppercase">Comm. Steel: ~0.045, PVC: ~0.0015</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 overflow-hidden">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-cyan-400">Total Pressure Drop</div>
                    <div className="text-7xl font-mono font-black tracking-tighter text-white">
                        {results.pressureDropBar.toFixed(3)}<span className="text-3xl text-gray-500 font-sans ml-2">Bar</span>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.flowRegime === 'Turbulent' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'}`}>
                            {results.flowRegime} Flow
                        </div>
                        <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border bg-white/5 border-white/10 text-gray-300">
                            Re: {results.reynolds.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Velocity (v)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.velocity.toFixed(2)} <span className="text-sm font-sans text-cyan-400">m/s</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Friction Factor (f)</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {results.f.toFixed(4)}
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Head Loss (h_f)</div>
                        <div className="text-3xl font-mono font-black text-cyan-400">
                            {results.headLoss.toFixed(2)} <span className="text-sm font-sans text-cyan-400/50">m</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
