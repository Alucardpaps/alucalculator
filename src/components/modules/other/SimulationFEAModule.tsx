'use client';

import { useState, useMemo } from 'react';
import {
    calculateBeam, calculateBuckling, calculateTorsion,
    calculatePressureVessel, calculateCombinedLoading,
    calculateGoodman, calculateSoderberg,
    STRENGTH_MATERIALS, MaterialStrength, BeamType, LoadType
} from '@/lib/stressAnalysis';
import {
    Box, ArrowDownToLine, Zap, Layers, Circle, Activity,
    Info, BookOpen, Scaling, Ruler, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BeamCanvas3D from '@/components/modules/fea/BeamCanvas3D';
import MohrCircleVisualization from '@/components/MohrCircleVisualization';

/**
 * SimulationFEAModule 
 * Advanced Engineering Analysis Suite (Lite FEA)
 * Unified Layout: [Inputs] | [Visualizer + Descriptions]
 */
export default function SimulationFEAModule() {
    const [activeTab, setActiveTab] = useState<(
        'beam' | 'buckling' | 'torsion' | 'pressure' | 'combined' | 'fatigue'
    )>('beam');

    return (
        <div className="h-full flex flex-col bg-transparent text-cyan-50">
            {/* Header & Navigation */}
            <div className="flex-none p-4 flex items-center justify-between border-b border-cyan-900/40 bg-[#05090e]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-lg text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-widest uppercase">FEA Engineering Suite</h2>
                        <p className="text-[10px] text-slate-500 font-mono">Real-time Stress & Deflection Analysis</p>
                    </div>
                </div>

                <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {[
                        { id: 'beam', label: 'Beam', icon: ArrowDownToLine },
                        { id: 'buckling', label: 'Buckling', icon: Box },
                        { id: 'torsion', label: 'Torsion', icon: Circle },
                        { id: 'pressure', label: 'Pressure', icon: Layers },
                        { id: 'combined', label: 'Combined', icon: Activity },
                        { id: 'fatigue', label: 'Fatigue', icon: Zap },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] tracking-widest font-mono font-bold uppercase transition-all flex items-center gap-2
                                ${activeTab === tab.id
                                    ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                                    : 'text-cyan-900/60 hover:text-[#00e5ff] hover:bg-cyan-900/10 hover:border-cyan-900/30 border border-transparent border-dashed'}`}
                        >
                            <tab.icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full overflow-y-auto custom-scrollbar p-6"
                    >
                        {activeTab === 'beam' && <BeamAnalysis />}
                        {activeTab === 'buckling' && <BucklingAnalysis />}
                        {activeTab === 'torsion' && <TorsionAnalysis />}
                        {activeTab === 'pressure' && <PressureVesselAnalysis />}
                        {activeTab === 'combined' && <CombinedLoadingAnalysis />}
                        {activeTab === 'fatigue' && <FatigueAnalysis />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// GLOBAL UI COMPONENTS
// ------------------------------------------------------------------

function MaterialSelector({ value, onChange }: { value: string, onChange: (m: MaterialStrength) => void }) {
    return (
        <div className="bg-[#020408]/60 p-4 rounded-xl border border-cyan-900/30">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
                <label className="text-[10px] font-bold font-mono uppercase text-cyan-50/50 tracking-[0.2em]">Material Engine</label>
            </div>
            <select
                value={value}
                onChange={(e) => {
                    const mat = STRENGTH_MATERIALS.find(m => m.name === e.target.value);
                    if (mat) onChange(mat);
                }}
                className="w-full bg-[#05090e]/80 border border-cyan-900/40 rounded-lg p-2.5 text-sm font-bold font-mono text-cyan-50 outline-none focus:border-[#00e5ff] transition-all cursor-pointer appearance-none shadow-inner"
            >
                {STRENGTH_MATERIALS.map(m => (
                    <option key={m.name} value={m.name} className="bg-[#020408] font-mono">{m.name}</option>
                ))}
            </select>
            <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-black/30 rounded-lg text-[10px] font-mono text-slate-500">
                <div>E: {STRENGTH_MATERIALS.find(m => m.name === value)?.E} MPa</div>
                <div>Sy: {STRENGTH_MATERIALS.find(m => m.name === value)?.Sy} MPa</div>
            </div>
        </div>
    );
}

function ResultCard({ title, value, unit, status, icon: Icon }: { title: string, value: string | number, unit?: string, status?: 'safe' | 'marginal' | 'failure', icon?: any }) {
    const statusGlow =
        status === 'safe' ? 'shadow-[0_0_20px_rgba(0,229,255,0.1)] border-[#00e5ff]/30' :
            status === 'marginal' ? 'shadow-[0_0_20px_rgba(245,158,11,0.1)] border-amber-500/30' :
                status === 'failure' ? 'shadow-[0_0_20px_rgba(239,68,68,0.15)] border-red-500/40' :
                    'border-cyan-900/30';

    const textColor =
        status === 'safe' ? 'text-[#00e5ff]' :
            status === 'marginal' ? 'text-amber-400' :
                status === 'failure' ? 'text-red-400' :
                    'text-cyan-50';

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-2xl bg-[#020408]/60 border ${statusGlow} transition-all duration-300`}
        >
            <div className="flex items-center gap-2 mb-2 opacity-60">
                {Icon && <Icon size={12} className="text-[#00e5ff]" />}
                <div className="text-[10px] font-mono uppercase font-bold tracking-[0.2em]">{title}</div>
            </div>
            <div className={`text-2xl font-black font-mono flex items-baseline gap-1 ${textColor}`}>
                {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value}
                <span className="text-[10px] font-normal opacity-40 uppercase tracking-widest ml-1">{unit}</span>
            </div>
        </motion.div>
    );
}

function InfoSection({ title, formulas, desc }: { title: string, formulas?: string[], desc: string }) {
    return (
        <div className="bg-[#00e5ff]/5 border border-[#00e5ff]/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#00e5ff]">
                <BookOpen size={16} />
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Technical Briefing: {title}</h4>
            </div>
            <p className="text-[11px] font-mono text-cyan-50/50 leading-relaxed italic">
                {desc}
            </p>
            {formulas && formulas.map((f, i) => (
                <div key={i} className="bg-[#020408]/80 p-3 flex justify-center rounded-lg border border-[#00e5ff]/20 font-mono text-xs text-center text-[#00e5ff] shadow-inner">
                    {f}
                </div>
            ))}
        </div>
    );
}

// ------------------------------------------------------------------
// ANALYSIS COMPONENTS
// ------------------------------------------------------------------

// --- BEAM ---
function BeamAnalysis() {
    const [type, setType] = useState<BeamType>('simply_supported');
    const [loadType, setLoadType] = useState<LoadType>('point_center');
    const [length, setLength] = useState(1000);
    const [load, setLoad] = useState(1000);
    const [material, setMaterial] = useState(STRENGTH_MATERIALS[0]);
    const [I, setI] = useState(100000);
    const [W, setW] = useState(5000);

    const result = calculateBeam(type, loadType, length, load, material.E, I, W);
    const fos = material.Sy / result.maxStress;
    const status = fos > 2 ? 'safe' : fos > 1.2 ? 'marginal' : 'failure';

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* INPUT PANEL */}
            <div className="space-y-6">
                <MaterialSelector value={material.name} onChange={setMaterial} />

                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="System Configuration">
                            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white">
                                <option value="simply_supported">Simply Supported</option>
                                <option value="cantilever">Cantilever</option>
                                <option value="fixed_both">Fixed Both Ends</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Applied Loading">
                            <select value={loadType} onChange={e => setLoadType(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white">
                                <option value="point_center">Point (Midspan)</option>
                                <option value="point_end">Point (Free End)</option>
                                <option value="distributed">Uniform (UDL)</option>
                            </select>
                        </InputGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Span Length (mm)">
                            <input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-cyan-400" />
                        </InputGroup>
                        <InputGroup label={`Force (${loadType === 'distributed' ? 'N/mm' : 'N'})`}>
                            <input type="number" value={load} onChange={e => setLoad(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-orange-400" />
                        </InputGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Moment of Inertia (I)">
                            <input type="number" value={I} onChange={e => setI(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" />
                        </InputGroup>
                        <InputGroup label="Section Modulus (Z)">
                            <input type="number" value={W} onChange={e => setW(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" />
                        </InputGroup>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <ResultCard title="Deflection" value={result.maxDeflection} unit="mm" icon={Scaling} />
                    <ResultCard title="Stress" value={result.maxStress} unit="MPa" icon={Settings2} />
                    <ResultCard title="Safety" value={fos} status={status} icon={Zap} />
                </div>
            </div>

            {/* VISUALIZER & INFO */}
            <div className="space-y-8">
                {/* CAD VISUALIZER */}
                <div className="relative group rounded-2xl bg-black/50 border border-white/10 p-8 overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
                    <div className="absolute top-4 left-6 flex items-center gap-2 opacity-50">
                        <Scaling size={14} className="text-violet-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Real-time CAD Preview</span>
                    </div>

                    <svg viewBox="0 0 400 200" className="w-full max-w-lg overflow-visible">
                        {/* Dim Lines */}
                        <g opacity="0.3">
                            <line x1="40" y1="120" x2="40" y2="150" stroke="#475569" strokeWidth="1" />
                            <line x1="360" y1="120" x2="360" y2="150" stroke="#475569" strokeWidth="1" />
                            <line x1="40" y1="140" x2="360" y2="140" stroke="#475569" strokeWidth="1" />
                            <text x="200" y="135" textAnchor="middle" fill="#475569" fontSize="10" fontStyle="italic">L = {length}mm</text>
                        </g>

                        {/* Deflected Beam Curve (Dynamic) */}
                        <motion.path
                            d={type === 'cantilever'
                                ? `M 40,100 C 180,100 340,100 360,${100 + Math.min(60, Number(result.maxDeflection) * 2)}`
                                : `M 40,100 Q 200,${100 + Math.min(60, Number(result.maxDeflection) * 2)} 360,100`
                            }
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="5,3"
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Solid Beam */}
                        <motion.rect
                            x="40" y="96" width="320" height="8"
                            fill="#1e293b" stroke="#475569" strokeWidth="1.5" rx="2"
                        />

                        {/* Supports */}
                        {type === 'simply_supported' && (
                            <>
                                <polygon points="40,104 32,120 48,120" fill="#a855f7" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                <polygon points="360,104 352,120 368,120" fill="#a855f7" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            </>
                        )}
                        {type === 'fixed_both' && (
                            <>
                                <rect x="30" y="75" width="10" height="50" fill="#475569" rx="2" />
                                <rect x="360" y="75" width="10" height="50" fill="#475569" rx="2" />
                            </>
                        )}
                        {type === 'cantilever' && (
                            <rect x="30" y="75" width="10" height="50" fill="#475569" rx="2" />
                        )}

                        {/* Load Indicator */}
                        <motion.g
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {loadType === 'distributed' ? (
                                <path d="M 60,70 L 340,70" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                            ) : (
                                <>
                                    <line x1={loadType === 'point_center' ? '200' : '360'} y1="40" x2={loadType === 'point_center' ? '200' : '360'} y2="90" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                                    <polygon points={`${loadType === 'point_center' ? '200' : '360'},90 ${loadType === 'point_center' ? '195' : '355'},82 ${loadType === 'point_center' ? '205' : '365'},82`} fill="#ef4444" />
                                </>
                            )}
                        </motion.g>
                    </svg>
                </div>

                <InfoSection
                    title="Structural Flexure"
                    desc="Beam deflection analysis calculates the displacement of a structural element under lateral load. Euler-Bernoulli beam theory is typically applied for cases where L >> depth."
                    formulas={[`δmax = ${result.formula}`]}
                />
            </div>
        </div>
    );
}

// --- BUCKLING ---
function BucklingAnalysis() {
    const [length, setLength] = useState(1000);
    const [I, setI] = useState(50000);
    const [A, setA] = useState(1000);
    const [load, setLoad] = useState(10000);
    const [material, setMaterial] = useState(STRENGTH_MATERIALS[0]);
    const [endCondition, setEndCondition] = useState<'pinned-pinned' | 'fixed-fixed' | 'fixed-free'>('pinned-pinned');

    const result = calculateBuckling(length, I, A, material, endCondition as any, load);
    const status = result.safe ? 'safe' : 'failure';

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
                <MaterialSelector value={material.name} onChange={setMaterial} />
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <InputGroup label="Column End Conditions">
                        <select value={endCondition} onChange={e => setEndCondition(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white">
                            <option value="pinned-pinned">Pinned-Pinned (K=1.0)</option>
                            <option value="fixed-fixed">Fixed-Fixed (K=0.5)</option>
                            <option value="fixed-free">Fixed-Free (K=2.0)</option>
                        </select>
                    </InputGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Total Length (mm)"><input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-cyan-400" /></InputGroup>
                        <InputGroup label="Axial Force (N)"><input type="number" value={load} onChange={e => setLoad(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-orange-400" /></InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Cross-Section Area (mm²)"><input type="number" value={A} onChange={e => setA(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                        <InputGroup label="Min Moment of Inertia (I)"><input type="number" value={I} onChange={e => setI(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ResultCard title="Critical Load (Pcr)" value={result.Pcr} unit="N" status={status} icon={Zap} />
                    <ResultCard title="Slenderness (λ)" value={result.slendernessRatio} unit="" icon={Ruler} />
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-black/50 rounded-2xl border border-white/10 p-8 h-[300px] flex items-center justify-center">
                    <svg viewBox="0 0 200 300" className="h-full overflow-visible">
                        {/* Floor */}
                        <rect x="50" y="270" width="100" height="4" fill="#334155" />

                        {/* Column Path (Buckled shape) */}
                        <motion.path
                            d={!result.safe
                                ? "M 100,50 Q 150,150 100,265"
                                : "M 100,50 L 100,265"}
                            fill="none"
                            stroke={result.safe ? "#475569" : "#f43f5e"}
                            strokeWidth="10"
                            strokeLinecap="round"
                            animate={!result.safe ? { x: [-2, 2, -2] } : {}}
                            transition={{ duration: 0.1, repeat: Infinity }}
                        />

                        {/* Force Arrow */}
                        <motion.g animate={{ y: [0, 10, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                            <line x1="100" y1="0" x2="100" y2="40" stroke="#ef4444" strokeWidth="4" />
                            <polygon points="100,40 92,30 108,30" fill="#ef4444" />
                        </motion.g>
                    </svg>
                </div>
                <InfoSection
                    title="Euler Buckling Theory"
                    desc="Columns fail either by yielding or by sudden lateral instability known as buckling. The critical load depends on the material stiffness (E) and column geometric slenderness."
                    formulas={["Pcr = (π² * E * I) / (K * L)²"]}
                />
            </div>
        </div>
    );
}

// --- TORSION ---
function TorsionAnalysis() {
    const [torque, setTorque] = useState(100);
    const [length, setLength] = useState(500);
    const [diameter, setDiameter] = useState(20);
    const [material, setMaterial] = useState(STRENGTH_MATERIALS[0]);

    const result = calculateTorsion(torque * 1000, length, diameter, 0, material.G || 26);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
                <MaterialSelector value={material.name} onChange={setMaterial} />
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                    <InputGroup label="Input Torque (Nm)"><input type="number" value={torque} onChange={e => setTorque(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-orange-400" /></InputGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Shaft Length (mm)"><input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-cyan-400" /></InputGroup>
                        <InputGroup label="Diameter (mm)"><input type="number" value={diameter} onChange={e => setDiameter(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ResultCard title="Shear Stress" value={result.maxShearStress} unit="MPa" icon={Settings2} />
                    <ResultCard title="Twist Angle" value={result.angleOfTwistDeg} unit="deg" icon={Activity} />
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-black/50 rounded-2xl border border-white/10 p-8 h-[300px] flex items-center justify-center">
                    <svg viewBox="0 0 300 150" className="w-full overflow-visible">
                        {/* Shaft 3D-ish representation */}
                        <ellipse cx="60" cy="75" rx="10" ry="30" fill="none" stroke="#475569" strokeWidth="2" />
                        <line x1="60" y1="45" x2="240" y2="45" stroke="#475569" strokeWidth="2" />
                        <line x1="60" y1="105" x2="240" y2="105" stroke="#475569" strokeWidth="2" />
                        <ellipse cx="240" cy="75" rx="10" ry="30" fill="#1e293b" stroke="#475569" strokeWidth="2" />

                        {/* Torsion Arrow */}
                        <motion.path
                            d="M 260,55 A 25,25 0 1,1 260,95"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeLinecap="round"
                            animate={{ rotate: [0, 10, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                        <polygon points="260,95 252,95 260,103" fill="#f59e0b" />
                    </svg>
                </div>
                <InfoSection
                    title="Shaft Torsion"
                    desc="Torsional loading induces shear stress in circular members. The stress increases linearly from zero at the center to a maximum at the outer surface."
                    formulas={["τmax = (T * r) / J", "θ = (T * L) / (G * J)"]}
                />
            </div>
        </div>
    );
}

// --- PRESSURE VESSEL ---
function PressureVesselAnalysis() {
    const [pressure, setPressure] = useState(10);
    const [innerRadius, setInnerRadius] = useState(100);
    const [outerRadius, setOuterRadius] = useState(105);

    const result = calculatePressureVessel(pressure, 0, innerRadius, outerRadius);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <InputGroup label="Internal Fluid Pressure (MPa)"><input type="number" value={pressure} onChange={e => setPressure(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-red-400" /></InputGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Inner Radius (Ri)"><input type="number" value={innerRadius} onChange={e => setInnerRadius(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                        <InputGroup label="Outer Radius (Ro)"><input type="number" value={outerRadius} onChange={e => setOuterRadius(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <ResultCard title="Hoop Stress" value={result.hoopStress} unit="MPa" />
                    <ResultCard title="Axial Stress" value={result.axialStress} unit="MPa" />
                    <ResultCard title="Von Mises" value={result.vonMises} unit="MPa" status="marginal" />
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-black/50 rounded-2xl border border-white/10 p-8 h-[300px] flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-[80%] overflow-visible">
                        {/* Tank Cross-Section */}
                        <circle cx="100" cy="100" r={innerRadius / 2} fill="#3b82f610" stroke="#3b82f650" strokeWidth="1" />
                        <circle cx="100" cy="100" r={outerRadius / 2} fill="none" stroke="#64748b" strokeWidth="4" />

                        {/* Internal Pressure Vectors */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                            <motion.g
                                key={deg}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: deg / 360 }}
                                style={{ transformOrigin: '100px 100px', transform: `rotate(${deg}deg)` }}
                            >
                                <line x1="100" y1="100" x2="100" y2={100 - innerRadius / 2.5} stroke="#ef4444" strokeWidth="1" />
                                <polygon points={`100,${100 - innerRadius / 2.5} 97,${105 - innerRadius / 2.5} 103,${105 - innerRadius / 2.5}`} fill="#ef4444" />
                            </motion.g>
                        ))}
                    </svg>
                </div>
                <InfoSection
                    title="Thick/Thin Walled Theory"
                    desc="Pressure vessels are designed considering tri-axial stress states. For thin walls (t < r/10), simplified hoop and longitudinal stress formulas apply."
                    formulas={["σh = (P * r) / t", "σl = (P * r) / (2t)"]}
                />
            </div>
        </div>
    );
}

// --- FATIGUE ---
function FatigueAnalysis() {
    const [sigmaMax, setSigmaMax] = useState(200);
    const [sigmaMin, setSigmaMin] = useState(-200);
    const [material, setMaterial] = useState(STRENGTH_MATERIALS[0]);

    const sigmaA = (sigmaMax - sigmaMin) / 2;
    const sigmaM = (sigmaMax + sigmaMin) / 2;
    const goodman = calculateGoodman(sigmaA, sigmaM, material);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
                <MaterialSelector value={material.name} onChange={setMaterial} />
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Min Cycle Stress (MPa)"><input type="number" value={sigmaMin} onChange={e => setSigmaMin(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-cyan-400" /></InputGroup>
                        <InputGroup label="Max Cycle Stress (MPa)"><input type="number" value={sigmaMax} onChange={e => setSigmaMax(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-orange-400" /></InputGroup>
                    </div>
                </div>
                <ResultCard title="Fatigue Safety Index" value={goodman.safetyCycles} status={goodman.safe ? 'safe' : 'failure'} icon={Zap} />
            </div>

            <div className="space-y-8">
                <div className="bg-black/50 rounded-2xl border border-white/10 p-8 h-[300px] flex items-center justify-center">
                    <svg viewBox="0 0 300 150" className="w-full overflow-visible">
                        {/* Sinusoidal Load Waveform */}
                        <motion.path
                            d={`M 20,75 Q 60,${75 - sigmaMax * 0.2} 100,75 T 180,75 T 260,75`}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            animate={{ pathLength: [0, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <line x1="20" y1="75" x2="280" y2="75" stroke="#475569" strokeWidth="1" strokeDasharray="4,4" />
                        <text x="20" y="20" fill="#slate-500" fontSize="10">Stress Amplitude (σa)</text>
                    </svg>
                </div>
                <InfoSection
                    title="Fatigue Failure Modes"
                    desc="Fatigue occurs when a component is subjected to repetitive loading. Even if stresses are below yielding, micro-cracks can propagate until catastrophic fracture."
                    formulas={["(σa / Se) + (σm / Sut) = 1/fos"]}
                />
            </div>
        </div>
    );
}

// --- COMBINED LOADING ---
function CombinedLoadingAnalysis() {
    const [axial, setAxial] = useState(1000);
    const [moment, setMoment] = useState(500000);
    const [torque, setTorque] = useState(250000);
    const [area, setArea] = useState(1000);
    const [I, setI] = useState(100000);
    const [J, setJ] = useState(200000);
    const [y, setY] = useState(25);
    const [r, setR] = useState(25);
    const [material, setMaterial] = useState(STRENGTH_MATERIALS[0]);

    const result = calculateCombinedLoading(
        axial, moment, torque, area, I, J, y, r, material
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
                <MaterialSelector value={material.name} onChange={setMaterial} />
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Axial Load (N)"><input type="number" value={axial} onChange={e => setAxial(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-cyan-400" /></InputGroup>
                        <InputGroup label="Bending Moment (Nmm)"><input type="number" value={moment} onChange={e => setMoment(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-orange-400" /></InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Torque (Nmm)"><input type="number" value={torque} onChange={e => setTorque(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-violet-400" /></InputGroup>
                        <InputGroup label="Distance from Neutral Axis (y)"><input type="number" value={y} onChange={e => setY(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Inertia I (mm4)"><input type="number" value={I} onChange={e => setI(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                        <InputGroup label="Polar Inertia J (mm4)"><input type="number" value={J} onChange={e => setJ(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Area (mm2)"><input type="number" value={area} onChange={e => setArea(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                        <InputGroup label="Outer Radius r (mm)"><input type="number" value={r} onChange={e => setR(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-white" /></InputGroup>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <ResultCard title="σ Normal" value={result.normalStress} unit="MPa" />
                    <ResultCard title="τ Shear" value={result.shearStress} unit="MPa" />
                    <ResultCard title="Von Mises" value={result.vonMises} unit="MPa" status={result.safetyFactor > 2 ? 'safe' : result.safetyFactor > 1 ? 'marginal' : 'failure'} />
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-black/40 rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={16} className="text-violet-400" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mohr's Circle Visualization</h4>
                    </div>
                    <MohrCircleVisualization
                        sigmaX={result.normalStress}
                        sigmaY={0}
                        tauXY={result.shearStress}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 tracking-tight">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Principal σ₁</div>
                        <div className="text-xl font-black text-emerald-400 font-mono">{result.principal.sigma1.toFixed(2)} MPa</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 tracking-tight">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Principal σ₂</div>
                        <div className="text-xl font-black text-blue-400 font-mono">{result.principal.sigma2.toFixed(2)} MPa</div>
                    </div>
                </div>

                <InfoSection
                    title="Combined Stress Theory"
                    desc="Most structural members experience multiple load types simultaneously. Superposition is used to combine normal and shear stresses into a stress tensor, which is then analyzed using failure theories like Von Mises."
                    formulas={[
                        "σtot = P/A + My/I",
                        "τtot = Tr/J",
                        "σ' = √(σ² + 3τ²)"
                    ]}
                />
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// HELPER COMPONENTS
// ------------------------------------------------------------------

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">
                {label}
            </label>
            {children}
        </div>
    );
}
