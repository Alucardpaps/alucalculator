'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Droplets, Wind, Activity, Ruler, Cylinder, 
    Gauge, Thermometer, Zap, Info, ArrowRight,
    Play, RotateCcw, Shield, Maximize2
} from 'lucide-react';

const FLUIDS = [
    { id: 'water', label: 'Water', p: 998, u: 0.001, color: '#3b82f6' },
    { id: 'oil', label: 'Hydraulic Oil', p: 870, u: 0.027, color: '#f59e0b' },
    { id: 'air', label: 'Air (STP)', p: 1.22, u: 0.000018, color: '#94a3b8' },
    { id: 'custom', label: 'Custom Fluid', p: 1000, u: 0.001, color: '#10b981' }
];

const ROUGHNESS = [
    { label: 'PVC/Glass', e: 0.0015 },
    { label: 'Steel (Comm)', e: 0.045 },
    { label: 'Cast Iron', e: 0.26 },
    { label: 'Concrete', e: 1.0 }
];

export default function FluidDynamics() {
    // Inputs
    const [fluidId, setFluidId] = useState('water');
    const [diameter, setDiameter] = useState(100); // mm
    const [length, setLength] = useState(50); // m
    const [flowRate, setFlowRate] = useState(20); // m3/h
    const [roughnessIdx, setRoughnessIdx] = useState(1);
    const [elevation, setElevation] = useState(0); // m
    
    // Logic
    const results = useMemo(() => {
        const fluid = FLUIDS.find(f => f.id === fluidId) || FLUIDS[0];
        const rho = fluid.p;
        const mu = fluid.u;
        const d_m = diameter / 1000;
        const area = (Math.PI * Math.pow(d_m, 2)) / 4;
        const q_m3s = flowRate / 3600;
        const velocity = q_m3s / area;
        
        // Reynolds Number
        const re = (rho * velocity * d_m) / mu;
        
        // Friction Factor (Haaland)
        const eps = ROUGHNESS[roughnessIdx].e / 1000;
        const relRough = eps / d_m;
        let headLoss = 0;
        let frictionFactor = 0;
        
        if (re < 2300) {
            frictionFactor = 64 / re;
        } else {
            const h_term = Math.pow(relRough / 3.7, 1.11) + (6.9 / re);
            frictionFactor = Math.pow(-1.8 * Math.log10(h_term), -2);
        }
        
        // Darcy-Weisbach: hf = f * (L/D) * (v^2/2g)
        const g = 9.81;
        headLoss = frictionFactor * (length / d_m) * (Math.pow(velocity, 2) / (2 * g));
        
        const pressureDrop = (headLoss * rho * g) / 1000; // kPa
        const pumpPower = (pressureDrop * 1000 * q_m3s) / 1000; // kW
        
        return { 
            velocity, 
            re, 
            frictionFactor, 
            headLoss, 
            pressureDrop, 
            pumpPower,
            isLaminar: re < 2300,
            fluidColor: fluid.color
        };
    }, [fluidId, diameter, length, flowRate, roughnessIdx, elevation]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-blue-500/30">
            {/* Visual Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL */}
            <div className="w-[340px] bg-[#05080f]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-blue-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <Droplets size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Fluid Workstation</h1>
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-widest uppercase mt-1">Hydraulic Analysis Engine</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    {/* Fluid Profile */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Shield size={12} /> Fluid Profile
                        </h2>
                        <div className="grid grid-cols-2 gap-2">
                            {FLUIDS.map(f => (
                                <button key={f.id} onClick={() => setFluidId(f.id)}
                                    className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${fluidId === f.id ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white hover:bg-white/5'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Mechanical Geometry */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Cylinder size={12} /> Pipe Geometry
                        </h2>
                        
                        <div className="space-y-4">
                            <ParameterInput label="Inside Diameter" unit="mm" value={diameter} onChange={setDiameter} icon={<Maximize2 size={12}/>} />
                            <ParameterInput label="Total Length" unit="m" value={length} onChange={setLength} icon={<Activity size={12}/>} />
                            
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Internal Roughness</span>
                                <select value={roughnessIdx} onChange={(e) => setRoughnessIdx(Number(e.target.value))}
                                    className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500/50">
                                    {ROUGHNESS.map((r, i) => (
                                        <option key={i} value={i}>{r.label} ({r.e}mm)</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Operational Dynamics */}
                    <div className="space-y-4 pb-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Gauge size={12} /> Flow Ops
                        </h2>
                        <ParameterInput label="Target Flow" unit="m³/h" value={flowRate} onChange={setFlowRate} icon={<Zap size={12}/>} />
                        <ParameterInput label="Elevation Gain" unit="m" value={elevation} onChange={setElevation} icon={<Info size={12}/>} />
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label="Reynolds Number" value={results.re.toFixed(0)} sub={results.isLaminar ? 'LAMINAR' : 'TURBULENT'} color={results.isLaminar ? '#10b981' : '#3b82f6'} />
                    <ValueCard label="Pressure Drop" value={results.pressureDrop.toFixed(2)} unit="kPa" sub={(results.pressureDrop / 100).toFixed(3) + ' bar'} color="#8b5cf6" />
                    <ValueCard label="Required Power" value={results.pumpPower.toFixed(2)} unit="kW" sub={(results.pumpPower * 1.34).toFixed(2) + ' HP'} color="#f59e0b" />
                </div>

                {/* Flow Visualizer Viewport */}
                <div className="flex-1 min-h-[440px] bg-black/40 border border-white/10 rounded-[3rem] p-12 flex flex-col relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 flex gap-4">
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400">
                           Sim Speed: {results.velocity.toFixed(2)} m/s
                        </div>
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3">
                        <Activity size={14} className="text-blue-500" />
                        Cross-Section X-Ray Visualization
                    </h3>

                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Pipe Rendering */}
                        <div className="w-full h-48 relative border-y-2 border-white/10 overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
                            {/* Turbulence Pattern Overlay */}
                            <div className={`absolute inset-0 transition-opacity duration-1000 ${results.isLaminar ? 'opacity-0' : 'opacity-10'}`} style={{
                                backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
                                backgroundSize: '10px 10px'
                            }} />

                            {/* Streamline Particles */}
                            {[...Array(30)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute h-0.5 rounded-full"
                                    style={{
                                        width: results.isLaminar ? '120px' : '40px',
                                        backgroundColor: results.fluidColor,
                                        opacity: results.isLaminar ? 0.3 : 0.6,
                                        top: `${10 + Math.random() * 80}%`,
                                        left: '-20%'
                                    }}
                                    animate={{ 
                                        x: ['0%', '150%'],
                                        y: results.isLaminar ? 0 : [0, Math.random() * 6 - 3, 0]
                                    }}
                                    transition={{
                                        duration: Math.max(0.3, 3 / (results.velocity || 1)),
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: Math.random() * 2
                                    }}
                                />
                            ))}

                            <div className="absolute inset-0 bg-gradient-to-r from-[#03060a] via-transparent to-[#03060a]" />
                        </div>

                        {/* Central Flow Line Detail */}
                        <div className="absolute inset-x-0 h-px bg-blue-500/20 shadow-[0_0_20px_blue]" />
                    </div>

                    <div className="mt-8 flex justify-between items-end">
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Velocity</span>
                                <span className="text-xl font-black text-blue-400">{results.velocity.toFixed(2)} <span className="text-xs text-slate-600 font-sans tracking-normal">m/s</span></span>
                            </div>
                            <div className="w-px h-8 bg-white/10 self-end mb-1" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Flow Type</span>
                                <span className="text-xl font-black text-white italic">{results.isLaminar ? 'Laminar' : 'Turbulent'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Friction Coeff (f)</span>
                             <div className="text-2xl font-black font-mono text-blue-400">{results.frictionFactor.toFixed(5)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, onChange, icon }: any) {
    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-blue-400">{value} {unit}</span>
            </div>
            <input type="range" min="1" max={label.includes('Length') ? 500 : 1000} step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Activity size={64}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white" style={{ color: value === '0' ? '#475569' : 'white' }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase">{unit}</span>}
            </div>
            <div className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: color || '#64748b' }}>{sub}</div>
        </div>
    );
}
