'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Thermometer, Wind, Zap, AlignLeft, BarChart2, Activity } from 'lucide-react';

const MATERIALS = [
    { id: 'alu_6061', name: 'Aluminum 6061', k: 167 }, // W/mK
    { id: 'alu_1050', name: 'Aluminum 1050', k: 220 },
    { id: 'copper', name: 'Copper', k: 401 },
    { id: 'steel', name: 'Stainless Steel', k: 15 },
];

export default function HeatSinkModule() {
    // Inputs
    const [power, setPower] = useState(50); // Watts
    const [ambientTemp, setAmbientTemp] = useState(25); // Celsius
    
    // Geometry
    const [baseWidth, setBaseWidth] = useState(50); // mm
    const [baseLength, setBaseLength] = useState(50); // mm
    const [finHeight, setFinHeight] = useState(20); // mm
    const [finThickness, setFinThickness] = useState(2); // mm
    const [finCount, setFinCount] = useState(10); 
    
    // Environment
    const [material, setMaterial] = useState(MATERIALS[0]);
    const [convection, setConvection] = useState(10); // W/m²K (natural = 5-25, forced = 25-250)

    const results = useMemo(() => {
        // Convert mm to m
        const bw = baseWidth / 1000;
        const bl = baseLength / 1000;
        const fh = finHeight / 1000;
        const ft = finThickness / 1000;
        const k = material.k;
        const h = convection;

        // Base area exposed to air (subtract fin bases)
        const aBase = (bw * bl) - (finCount * ft * bl);
        
        // Single fin area (both sides + tip)
        const aSingleFin = (2 * fh * bl) + (ft * bl);
        const aTotalFins = finCount * aSingleFin;

        // Fin Efficiency (rectangular straight fin)
        const m = Math.sqrt((2 * h) / (k * ft));
        let finEfficiency = 1;
        if (m * fh > 0) {
            finEfficiency = Math.tanh(m * fh) / (m * fh);
        }

        // Effective Area
        const aEff = Math.max(0, aBase) + (finEfficiency * aTotalFins);

        // Convective Thermal Resistance (R_th)
        const rTh = 1 / (h * aEff);

        // Junction / Surface Temperature
        const tSurface = ambientTemp + (power * rTh);

        return {
            aBase, aTotalFins, aEff, finEfficiency, rTh, tSurface
        };

    }, [power, ambientTemp, baseWidth, baseLength, finHeight, finThickness, finCount, material, convection]);

    const isDanger = results.tSurface > 85;

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-full lg:w-[350px] shrink-0 flex flex-col bg-[#080d14]/80 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                            <Flame size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-100">Thermal Mgt.</h2>
                            <p className="text-[10px] text-red-400/70 font-semibold uppercase tracking-widest">Heat Sink Analyzer</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Operating Conditions */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">
                            <Zap size={12} /> Heat Source
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-[#0e1622] border border-white/5 rounded-xl p-3">
                                <div className="text-[10px] text-gray-400 mb-1">Power (W)</div>
                                <input type="number" value={power} onChange={e => setPower(Number(e.target.value))} className="w-full bg-transparent text-lg font-mono text-white outline-none" />
                            </div>
                            <div className="flex-1 bg-[#0e1622] border border-white/5 rounded-xl p-3">
                                <div className="text-[10px] text-gray-400 mb-1">Ambient (°C)</div>
                                <input type="number" value={ambientTemp} onChange={e => setAmbientTemp(Number(e.target.value))} className="w-full bg-transparent text-lg font-mono text-white outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Material & Environment */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">
                            <Wind size={12} /> Convection & Material
                        </label>
                        <div className="space-y-3">
                            <div className="bg-[#0e1622] border border-white/5 rounded-xl p-3">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-gray-400">Heat Transfer Coeff. (h)</span>
                                    <span className="text-[10px] font-mono text-amber-400">{convection} W/m²K</span>
                                </div>
                                <input type="range" min={5} max={250} step={5} value={convection} onChange={e => setConvection(Number(e.target.value))} className="w-full accent-amber-500 mt-2" />
                                <div className="flex justify-between text-[8px] text-gray-500 mt-1 uppercase tracking-widest">
                                    <span>Natural (5-25)</span>
                                    <span>Forced (25-250)</span>
                                </div>
                            </div>
                            
                            <div className="bg-[#0e1622] border border-white/5 rounded-xl p-3">
                                <div className="text-[10px] text-gray-400 mb-2">Heatsink Material</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {MATERIALS.map(m => (
                                        <button key={m.id} onClick={() => setMaterial(m)}
                                            className={`py-1.5 px-2 rounded-lg text-left text-[10px] transition-all border ${material.id === m.id ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-transparent border-white/5 text-gray-400 hover:bg-white/5'}`}>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Geometry */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                            <AlignLeft size={12} /> Fin Geometry
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <GeoInput label="Base Width" val={baseWidth} setVal={setBaseWidth} />
                            <GeoInput label="Base Length" val={baseLength} setVal={setBaseLength} />
                            <GeoInput label="Fin Height" val={finHeight} setVal={setFinHeight} />
                            <GeoInput label="Fin Thick." val={finThickness} setVal={setFinThickness} />
                        </div>
                        <div className="mt-2 bg-[#0e1622] border border-white/5 rounded-xl p-3">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-gray-400">Number of Fins</span>
                                <span className="text-[10px] font-mono text-blue-400">{finCount}</span>
                            </div>
                            <input type="range" min={2} max={100} value={finCount} onChange={e => setFinCount(Number(e.target.value))} className="w-full accent-blue-500 mt-2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Results */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${isDanger ? 'bg-red-500/10' : 'bg-emerald-500/10'}`} />
                
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] bg-[#05080f]/60 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8">
                    <Thermometer size={48} className={isDanger ? 'text-red-500 mb-4 animate-pulse' : 'text-emerald-500 mb-4'} />
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Steady State Temp</div>
                    <div className={`text-7xl font-mono font-black tracking-tighter ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                        {results.tSurface.toFixed(1)}<span className="text-3xl text-gray-500 font-sans ml-2">°C</span>
                    </div>
                    {isDanger && (
                        <div className="mt-4 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest">
                            Thermal Critical ( &gt; 85°C)
                        </div>
                    )}
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ResultCard icon={<Activity />} label="Thermal Resistance (Rth)" value={results.rTh.toFixed(3)} unit="°C/W" color="#f59e0b" />
                    <ResultCard icon={<BarChart2 />} label="Fin Efficiency (η)" value={(results.finEfficiency * 100).toFixed(1)} unit="%" color="#3b82f6" />
                    <ResultCard icon={<AlignLeft />} label="Effective Surface Area" value={(results.aEff * 10000).toFixed(0)} unit="cm²" color="#8b5cf6" />
                </div>
            </div>
        </div>
    );
}

function GeoInput({ label, val, setVal }: { label: string, val: number, setVal: (v: number) => void }) {
    return (
        <div className="bg-[#0e1622] border border-white/5 rounded-xl p-3 flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{label} (mm)</span>
            <input type="number" value={val} onChange={e => setVal(Number(e.target.value))} className="w-full bg-transparent font-mono text-sm text-white outline-none" />
        </div>
    );
}

function ResultCard({ icon, label, value, unit, color }: { icon: React.ReactNode, label: string, value: string, unit: string, color: string }) {
    return (
        <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity" style={{ color }}>{icon}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">{label}</div>
            <div className="text-3xl font-mono font-black text-white">
                {value} <span className="text-sm font-sans" style={{ color }}>{unit}</span>
            </div>
        </div>
    );
}
