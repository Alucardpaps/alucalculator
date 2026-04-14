'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Database, Settings2, Ruler, ShieldAlert, Cpu, 
    Layers, PenTool, Box, Info, AlertCircle, Wrench, Zap, RotateCcw
} from 'lucide-react';
import { 
    BOLT_PROPERTY_CLASSES, 
    THREAD_STANDARDS, 
    getFastenerGeometry,
    ThreadStandard,
    NUT_DIMENSIONS
} from '@/data/boltNutStandards';
import { calculateConnection } from '@/lib/structural/connectionEngine';
import { TechnicalDrawing3D } from '@/components/TechnicalDrawing3D';
import ClientOnly from '@/components/ClientOnly';

export default function FastenerAssemblyModule() {
    const [selectedStandard, setSelectedStandard] = useState<'Metric Coarse' | 'Metric Fine' | 'UNC' | 'UNF' | 'Trapezoidal'>('Metric Coarse');
    const [selectedSize, setSelectedSize] = useState('M12');
    const [selectedGrade, setSelectedGrade] = useState('8.8');
    const [plateFU, setPlateFU] = useState(400);
    const [plateThick, setPlateThick] = useState(10);
    const [edgeDist, setEdgeDist] = useState(30);
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
    const [safetyMethod, setSafetyMethod] = useState<'LRFD' | 'ASD'>('LRFD');
    const [threadCond, setThreadCond] = useState<'N' | 'X'>('N');
    const [torquePercent, setTorquePercent] = useState(75);

    // 1. Filter Threads based on Standard
    const availableThreads = useMemo(() => 
        THREAD_STANDARDS.filter(t => t.type === selectedStandard),
    [selectedStandard]);

    // 2. Auto-select size if current size not in list
    React.useEffect(() => {
        if (!availableThreads.find(t => t.size === selectedSize)) {
            setSelectedSize(availableThreads[0]?.size || '');
        }
    }, [availableThreads]);

    const activeThread = useMemo(() => 
        availableThreads.find(t => t.size === selectedSize) || availableThreads[0],
    [availableThreads, selectedSize]);

    const activeGrade = useMemo(() => 
        BOLT_PROPERTY_CLASSES.find(g => g.class === selectedGrade) || BOLT_PROPERTY_CLASSES[2],
    [selectedGrade]);

    // 3. Manufacturing Geometry
    const geometry = useMemo(() => getFastenerGeometry(selectedSize), [selectedSize]);

    // 4. Structural Calculation
    const results = useMemo(() => {
        if (!activeThread) return null;
        const baseResults = calculateConnection({
            thread: activeThread,
            boltClass: activeGrade,
            materialF_u: plateFU,
            plateThickness: plateThick,
            edgeDistance: edgeDist,
            frictionFactor: 0.20,
            threadCondition: threadCond,
            safetyMethod: safetyMethod
        });

        // Add Pretension & Torque
        const proofForce = activeThread.area_tensile * (activeGrade.yieldStrengthMin || 0.7 * activeGrade.tensileStrengthMin) / 1000;
        const pretensionForce = (torquePercent / 100) * proofForce;
        const requiredTorque = 0.2 * (activeThread.diameter / 1000) * (pretensionForce * 1000); // N-m (K=0.2 factor, D in meters)

        return {
            ...baseResults,
            proofForce,
            pretensionForce,
            requiredTorque
        };
    }, [activeThread, activeGrade, plateFU, plateThick, edgeDist, threadCond, safetyMethod, torquePercent]);

    // 5. Nut Geometry
    const nutGeometry = useMemo(() => 
        NUT_DIMENSIONS.find(n => n.size === selectedSize) || { height: activeThread.diameter * 0.8 },
    [selectedSize, activeThread]);

    if (!activeThread) return null;

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden p-2">
            {/* LEFT SIDEBAR - Configuration (38%) */}
            <div className="w-[38%] h-full flex flex-col bg-[#0b121d]/80 rounded-2xl border border-white/5 backdrop-blur-3xl px-6 py-6 overflow-y-auto custom-scrollbar shadow-2xl">
                
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <Database size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-100">Bölüm J Suite</h2>
                        <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Fastener Assembly & Structural Analysis</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Standard & Grade */}
                    <ControlGroup label="Standard Specification" icon={<Settings2 size={14} />}>
                        <div className="grid grid-cols-1 gap-4">
                           <Dropdown 
                                label="Standard / Thread Type" 
                                value={selectedStandard} 
                                options={['Metric Coarse', 'Metric Fine', 'UNC', 'UNF', 'Trapezoidal']} 
                                onChange={(v: any) => setSelectedStandard(v)} 
                           />
                           <Dropdown 
                                label="Property Class / Grade" 
                                value={selectedGrade} 
                                options={BOLT_PROPERTY_CLASSES.map(g => g.class)} 
                                onChange={(v: any) => setSelectedGrade(v)} 
                           />
                        </div>
                    </ControlGroup>

                    {/* Size & Thread */}
                    <ControlGroup label="Geometry & Layout" icon={<Ruler size={14} />}>
                        <div className="grid grid-cols-2 gap-4">
                            <Dropdown 
                                label="Nominal Size" 
                                value={selectedSize} 
                                options={availableThreads.map(t => t.size)} 
                                onChange={(v: any) => setSelectedSize(v)} 
                            />
                             <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Pitch / TPI</span>
                                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm">
                                    {activeThread.pitch ? `${activeThread.pitch} mm` : `${activeThread.tpi} TPI`}
                                </div>
                            </div>
                        </div>
                    </ControlGroup>

                    {/* Joint Conditions */}
                    <ControlGroup label="Joint & Structural Params" icon={<Layers size={14} />}>
                        <div className="flex flex-col gap-6">
                            <PremiumNumBox label="Plate Ult. Strength (Fu)" unit="MPa" value={plateFU} min={300} max={800} step={10} onChange={setPlateFU} color="#10b981" />
                            <div className="grid grid-cols-2 gap-4">
                                <PremiumNumBox label="Plate Thick." unit="mm" value={plateThick} min={2} max={100} step={1} onChange={setPlateThick} color="#3b82f6" />
                                <PremiumNumBox label="Edge Dist. (Lc)" unit="mm" value={edgeDist} min={5} max={200} step={1} onChange={setEdgeDist} color="#f59e0b" />
                            </div>
                        </div>
                    </ControlGroup>

                    {/* Pretensioning & Torque */}
                    <ControlGroup label="Pretensioning & Torque" icon={<RotateCcw size={14} />}>
                        <div className="flex flex-col gap-4">
                            <PremiumNumBox 
                                label="Tightening Torque %" 
                                unit="% of Proof" 
                                value={torquePercent} 
                                min={1} max={100} step={1} 
                                onChange={setTorquePercent} 
                                color="#a855f7" 
                            />
                            <div className="flex items-center gap-3 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                                <Box size={14} className="text-purple-400" />
                                <span className="text-[10px] font-bold text-purple-200/50 uppercase tracking-tighter">Recommended: 70% - 90%</span>
                            </div>
                        </div>
                    </ControlGroup>

                    {/* Advanced Structural Settings */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-2">Shear Plane</span>
                            <div className="flex gap-2">
                                <button onClick={() => setThreadCond('N')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${threadCond === 'N' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>THREADS INCL. (N)</button>
                                <button onClick={() => setThreadCond('X')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${threadCond === 'X' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>THREADS EXCL. (X)</button>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-2">Design Method</span>
                            <button onClick={() => setSafetyMethod(s => s === 'LRFD' ? 'ASD' : 'LRFD')} className="px-4 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 transition-all uppercase tracking-widest">{safetyMethod}</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT - Results & Viz (62%) */}
            <div className="w-[62%] h-full flex flex-col pl-4 gap-4 overflow-y-auto custom-scrollbar">
                
                {/* KPI HEADER DASHBOARD */}
                <div className="grid grid-cols-4 gap-4 mb-6 mt-2">
                    <KPICard label="Design Tension" value={results?.tensionCapacity_phi.toFixed(1) || '0'} unit="kN" color="#10b981" sub={`Capacity (${safetyMethod})`} />
                    <KPICard label="Design Shear" value={results?.shearCapacity_phi.toFixed(1) || '0'} unit="kN" color="#3b82f6" sub={`${threadCond} Condition`} />
                    <KPICard label="Bolt Pretension" value={results?.pretensionForce.toFixed(1) || '0'} unit="kN" color="#a855f7" sub={`${torquePercent}% Proof`} />
                    <KPICard label="Required Torque" value={results?.requiredTorque.toFixed(1) || '0'} unit="N-m" color="#f59e0b" sub="K=0.2 (Dry)" />
                </div>

                {/* MAIN CONTENT - Results & Viz (62%) - GEAR STYLE UPGRADE */}
                <div className="flex-1 relative flex flex-col mx-4 my-2 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-2xl">
                    {/* CSS Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    
                    <div className="absolute top-6 left-6 z-10">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                            <Box size={14} className="text-blue-500" />
                            {viewMode} CAD Analysis (Exploded)
                        </div>
                    </div>

                    {/* View Selection Toggle - Gear Style */}
                    <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
                        <button 
                            onClick={() => setViewMode('3D')} 
                            className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border backdrop-blur-md ${viewMode === '3D' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}
                        >
                            3D
                        </button>
                        <button 
                            onClick={() => setViewMode('2D')} 
                            className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border backdrop-blur-md ${viewMode === '2D' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}
                        >
                            2D
                        </button>
                    </div>
                    
                    <div className="w-full h-full">
                        {viewMode === '3D' ? (
                            <TechnicalDrawing3D 
                                shape="fastener" 
                                inputs={{ 
                                    diameter: activeThread.diameter, 
                                    length: 60, 
                                    pitch: activeThread.pitch || (25.4 / (activeThread.tpi || 20)),
                                    type: 'bolt',
                                    standard: activeThread.type,
                                    exploded: true
                                }}
                                activeField={null}
                            />
                        ) : (
                            <BoltNutSVG2D 
                                d={activeThread.diameter} 
                                L={60} 
                                s={geometry.s} 
                                k={geometry.k} 
                                m={(nutGeometry as any).height} 
                                pitch={activeThread.pitch || 1.5}
                                type={selectedStandard}
                            />
                        )}
                    </div>

                    {/* Manufacturing Specs Overlay */}
                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="absolute bottom-6 right-6 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[28px] z-10 w-64 shadow-2xl"
                    >
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <PenTool size={12} className="text-blue-400" /> Manufacturing Spec
                        </h4>
                        <div className="space-y-4">
                            <SpecRow label="Across Flats (s)" value={`${geometry.s} mm`} />
                            <SpecRow label="Head Height (k)" value={`${geometry.k} mm`} />
                            <SpecRow label="Nominal Dia (d)" value={`${activeThread.diameter} mm`} />
                            <SpecRow label="Stress Area (As)" value={`${activeThread.area_tensile} mm²`} />
                           {activeThread.minorDiameter && <SpecRow label="Minor Dia (d3)" value={`${activeThread.minorDiameter} mm`} />}
                            <SpecRow label="Tap Drill" value={`${activeThread.tapDrill} mm`} color="#10b981" />
                        </div>
                    </motion.div>
                </div>

                {/* BOTTOM INFO BAR */}
                <div className="bg-[#0b121d]/50 p-4 rounded-2xl border border-white/5 flex items-start gap-4">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                        <ShieldAlert size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Structural Bearing Check</h4>
                            <span className="text-[10px] font-mono text-gray-500">Bölüm J3.10 Compliance</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                            Bearing capacity φRn = {results?.bearingCapacity_phi.toFixed(2)} kN calculated for plate {plateThick}mm with edge distance {edgeDist}mm. 
                            Ensure bolt holes are standard clearance (D+2mm) for these values to be valid.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

function ControlGroup({ label, icon, children }: { label: string, icon: any, children: any }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white/30">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
            </div>
            {children}
        </div>
    );
}

function Dropdown({ label, value, options, onChange }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">{label}</span>
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
            >
                {options.map((opt: any) => <option key={opt} value={opt} className="bg-[#0b121d]">{opt}</option>)}
            </select>
        </div>
    );
}

function KPICard({ label, value, unit, color, sub }: any) {
    return (
        <div className="bg-[#0b121d]/80 rounded-2xl border border-white/5 p-5 flex flex-col gap-1 shadow-lg backdrop-blur-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tighter" style={{ color }}>{value}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">{unit}</span>
            </div>
            <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.1em] mt-1">{sub}</div>
        </div>
    );
}

function SpecRow({ label, value, color }: any) {
    return (
        <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <span className="text-[9px] font-black text-white/30 uppercase">{label}</span>
            <span className="text-xs font-mono font-bold" style={{ color: color || '#e2e8f0' }}>{value}</span>
        </div>
    );
}

function PremiumNumBox({ label, unit, value, min, max, step, onChange, color }: any) {
    return (
        <div className="group relative">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-white transition-colors">{label}</span>
                <span className="text-[9px] font-black font-mono" style={{ color }}>{unit}</span>
            </div>
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                <input
                    type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-sm font-black font-mono px-4 py-2 text-white outline-none appearance-none"
                    style={{ textShadow: `0 0 10px ${color}40` }}
                />
            </div>
            <div className="mt-3 px-1 opacity-40 hover:opacity-100 transition-opacity">
                <input
                    type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}

function BoltNutSVG2D({ d, L, s, k, m, pitch, type }: any) {
    const scale = 3; // Zoom in for detail
    const cx = 300;
    const cy = 200;
    
    // Derived dims
    const threadLen = L * 0.75;
    const shankLen = L - threadLen;

    return (
        <div className="w-full h-full flex items-center justify-center p-8">
            <svg viewBox="0 0 600 400" className="w-full h-full max-w-2xl drop-shadow-2xl overflow-visible">
                {/* ═══ AXIS ═══ */}
                <line x1="50" y1={cy} x2="550" y2={cy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="10,10" />

                <g transform={`translate(${cx - (L * scale) / 2}, ${cy})`}>
                    {/* BOLT SHANK (Unthreaded) */}
                    <rect x={0} y={-(d * scale) / 2} width={shankLen * scale} height={d * scale} fill="none" stroke="#60a5fa" strokeWidth="2" />
                    
                    {/* THREADED PORTION (Double line style) */}
                    <rect x={shankLen * scale} y={-(d * scale) / 2} width={threadLen * scale} height={d * scale} fill="none" stroke="#60a5fa" strokeWidth="2" />
                    <line x1={shankLen * scale} y1={-(d * scale) / 2 + 2} x2={(shankLen + threadLen) * scale} y2={-(d * scale) / 2 + 2} stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
                    <line x1={shankLen * scale} y1={(d * scale) / 2 - 2} x2={(shankLen + threadLen) * scale} y2={(d * scale) / 2 - 2} stroke="#60a5fa" strokeWidth="1" opacity="0.5" />

                    {/* HEX HEAD */}
                    <rect x={-(k * scale)} y={-(s * scale) / 2} width={k * scale} height={s * scale} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                    
                    {/* NUT (Exploded) */}
                    <g transform={`translate(${(L + 20) * scale}, 0)`}>
                        <rect x={0} y={-(s * scale) / 2} width={m * scale} height={s * scale} fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                        <line x1={0} y1={-(d * scale) / 2} x2={m * scale} y2={-(d * scale) / 2} stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,2" />
                        <line x1={0} y1={(d * scale) / 2} x2={m * scale} y2={(d * scale) / 2} stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,2" />
                    </g>

                    {/* ═══ DIMENSION LINES ═══ */}
                    
                    {/* L - Total Length */}
                    <DimLine x1={0} y1={60} x2={L * scale} y2={60} label={`L=${L}mm`} color="#94a3b8" />
                    
                    {/* d - Diameter */}
                    <DimLine x1={L * scale + 10} y1={-(d * scale) / 2} x2={L * scale + 10} y2={(d * scale) / 2} label={`d=${d}`} vertical color="#60a5fa" />
                    
                    {/* s - Across Flats */}
                    <DimLine x1={-(k * scale) - 20} y1={-(s * scale) / 2} x2={-(k * scale) - 20} y2={(s * scale) / 2} label={`s=${s}`} vertical color="#3b82f6" />
                    
                    {/* k - Head Height */}
                    <DimLine x1={-(k * scale)} y1={-(s * scale) / 2 - 20} x2={0} y2={-(s * scale) / 2 - 20} label={`k=${k}`} color="#3b82f6" />

                    {/* m - Nut Height */}
                    <DimLine x1={(L + 20) * scale} y1={-(s * scale) / 2 - 20} x2={(L + 20 + m) * scale} y2={-(s * scale) / 2 - 20} label={`m=${m}`} color="#fbbf24" />
                </g>
            </svg>
        </div>
    );
}

function DimLine({ x1, y1, x2, y2, label, vertical = false, color = "white" }: any) {
    return (
        <g stroke={color}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" />
            <line x1={x1 - (vertical ? 4 : 0)} y1={y1 - (vertical ? 0 : 4)} x2={x1 + (vertical ? 4 : 0)} y2={y1 + (vertical ? 0 : 4)} strokeWidth="1" />
            <line x1={x2 - (vertical ? 4 : 0)} y1={y2 - (vertical ? 0 : 4)} x2={x2 + (vertical ? 4 : 0)} y2={y2 + (vertical ? 0 : 4)} strokeWidth="1" />
            <text 
                x={(x1 + x2) / 2} 
                y={(y1 + y2) / 2 - (vertical ? 0 : 8)} 
                transform={vertical ? `rotate(-90 ${(x1 + x2) / 2} ${(y1 + y2) / 2}) translate(0, -10)` : ''}
                textAnchor="middle" 
                fill={color} 
                fontSize="10" 
                fontWeight="black" 
                fontFamily="monospace"
                stroke="none"
            >
                {label}
            </text>
        </g>
    );
}
