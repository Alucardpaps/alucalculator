"use client";
import { useState, useMemo } from "react";
import { useDriveTrainCalculator } from "@/hooks/useDriveTrainCalculator";
import { IEC_MOTORS } from "@/data/motorData";
import { GEAR_MATERIALS } from "@/data/gearsData";
import { Canvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import { Gear3D } from "@/components/3d/Gear3D";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, ShieldCheck, ShieldAlert, Zap, Layers, Cog, Gauge, Wrench, ChevronDown
} from 'lucide-react';

export function GearsModule({ lang, dict }: { lang: string, dict: any }) {
    const {
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,
        gearModule, setGearModule,
        z1, setZ1,
        z2, setZ2,
        helixAngle, setHelixAngle,
        faceWidth, setFaceWidth,
        materialName, setMaterialName,
        results,
        x1, setX1, x2, setX2,
        pinDia1, setPinDia1, pinDia2, setPinDia2,
        loadClass, setLoadClass,
        dailyHours, setDailyHours,
        startsPerHour, setStartsPerHour,
        connectionType, setConnectionType,
    } = useDriveTrainCalculator();

    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
    const [expandedSection, setExpandedSection] = useState<string | null>('geometry');

    const isSafe = results.SF_bending > 1.4 && results.SF_contact > 1.0;
    const activeColor = isSafe ? '#a855f7' : '#ef4444';

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden">
            {/* ═══ LEFT PANEL — Control Center (38%) ═══ */}
            <div className="w-[38%] h-full flex flex-col bg-[#080d14]/80 border-r border-white/5 overflow-hidden">
                
                {/* Header */}
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <Cog size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-gray-100">Gear Design</h2>
                            <p className="text-[10px] text-purple-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">ISO 6336 Spur & Helical</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Sections */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    
                    {/* Section: Geometry */}
                    <CollapsibleSection 
                        id="geometry" title="Tooth Geometry" icon={<Settings size={14} />} 
                        isOpen={expandedSection === 'geometry'} onToggle={() => toggleSection('geometry')}
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <GearInput label="Module (m)" unit="mm" value={gearModule} min={0.5} max={20} step={0.5} onChange={(v: number) => setGearModule(v)} color="#a855f7" />
                                <GearInput label="Face Width (b)" unit="mm" value={faceWidth} min={5} max={500} step={1} onChange={(v: number) => setFaceWidth(v)} color="#8b5cf6" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <GearInput label="Pinion Teeth (z₁)" unit="" value={z1} min={8} max={200} step={1} onChange={(v: number) => setZ1(v)} color="#6366f1" />
                                <GearInput label="Gear Teeth (z₂)" unit="" value={z2} min={8} max={500} step={1} onChange={(v: number) => setZ2(v)} color="#818cf8" />
                            </div>
                            <GearInput label="Helix Angle (β)" unit="°" value={helixAngle} min={0} max={45} step={1} onChange={(v: number) => setHelixAngle(v)} color="#c084fc" />
                        </div>
                    </CollapsibleSection>

                    {/* Section: Power & Material */}
                    <CollapsibleSection 
                        id="power" title="Motor & Material" icon={<Zap size={14} />}
                        isOpen={expandedSection === 'power'} onToggle={() => toggleSection('power')}
                    >
                        <div className="space-y-4">
                            <GearSelect label="Motor Power" value={String(selectedPower)} onChange={(v: string) => setSelectedPower(Number(v))} options={IEC_MOTORS.map(m => ({ value: String(m.power), label: `${m.power} kW` }))} color="#f59e0b" />
                            <GearSelect label="Gear Material" value={materialName} onChange={(v: string) => setMaterialName(v)} options={GEAR_MATERIALS.map(m => ({ value: m.name, label: m.name }))} color="#10b981" />
                        </div>
                    </CollapsibleSection>

                    {/* Section: Service Conditions */}
                    <CollapsibleSection 
                        id="conditions" title="Service Conditions" icon={<Gauge size={14} />}
                        isOpen={expandedSection === 'conditions'} onToggle={() => toggleSection('conditions')}
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <GearSelect label="Load Class" value={loadClass} onChange={(v: string) => setLoadClass(v as any)} options={[
                                    { value: 'U', label: 'Uniform (U)' },
                                    { value: 'M', label: 'Moderate (M)' },
                                    { value: 'H', label: 'Heavy Shock (H)' }
                                ]} color="#f59e0b" />
                                <GearSelect label="Daily Hours" value={String(dailyHours)} onChange={(v: string) => setDailyHours(Number(v))} options={[
                                    { value: '2', label: '< 3 Hours' },
                                    { value: '8', label: '3 – 10 Hours' },
                                    { value: '12', label: '> 10 Hours' }
                                ]} color="#f59e0b" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <GearInput label="Starts / Hour" unit="" value={startsPerHour} min={0} max={100} step={1} onChange={(v: number) => setStartsPerHour(v)} color="#f59e0b" />
                                <GearSelect label="Output Connect" value={connectionType} onChange={(v: string) => setConnectionType(v as any)} options={[
                                    { value: 'coupling', label: 'Direct (1.0)' },
                                    { value: 'sprocket', label: 'Chain (1.25)' },
                                    { value: 'v_belt', label: 'V-Belt (1.5)' },
                                    { value: 'flat_belt', label: 'Flat Belt (2.5)' }
                                ]} color="#f59e0b" />
                            </div>
                            <div className="flex items-center justify-between bg-purple-900/20 border border-purple-500/30 px-4 py-3 rounded-xl">
                                <span className="text-[10px] font-black tracking-widest uppercase text-purple-300">Service Factor (fs)</span>
                                <span className="text-2xl font-black text-purple-400 font-mono tracking-tighter">{results.requiredFs.toFixed(2)}</span>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Section: Profile Shift */}
                    <CollapsibleSection 
                        id="shift" title="Profile Shift" icon={<Wrench size={14} />}
                        isOpen={expandedSection === 'shift'} onToggle={() => toggleSection('shift')}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <GearInput label="Shift x₁" unit="" value={x1} min={-1} max={1} step={0.05} onChange={(v: number) => setX1(v)} color="#a855f7" />
                            <GearInput label="Shift x₂" unit="" value={x2} min={-1} max={1} step={0.05} onChange={(v: number) => setX2(v)} color="#a855f7" />
                        </div>
                    </CollapsibleSection>
                </div>
            </div>

            {/* ═══ RIGHT PANEL — Live Visualization & Results (62%) ═══ */}
            <div className="w-[62%] h-full flex flex-col overflow-hidden">
                
                {/* Safety Factor Header */}
                <div className="flex-none px-8 pt-8 pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div 
                                className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2" 
                                animate={{ color: activeColor }}
                            >
                                <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
                                {isSafe ? 'DESIGN VERIFIED — SAFE' : 'WARNING: INSUFFICIENT SAFETY FACTOR'}
                            </motion.div>
                            <div className="flex items-baseline gap-6">
                                <div className="flex flex-col items-center">
                                    <motion.div 
                                        className="text-[5.5rem] font-black italic tracking-tighter leading-none"
                                        animate={{ color: results.SF_bending > 1.4 ? '#a855f7' : '#ef4444', textShadow: `0 0 40px ${results.SF_bending > 1.4 ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.3)'}` }}
                                    >
                                        {results.SF_bending.toFixed(2)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Root Bending</span>
                                </div>
                                <div className="text-3xl font-thin text-gray-700 self-center">/</div>
                                <div className="flex flex-col items-center">
                                    <motion.div 
                                        className="text-[5.5rem] font-black italic tracking-tighter leading-none"
                                        animate={{ color: results.SF_contact > 1.0 ? '#a855f7' : '#ef4444', textShadow: `0 0 40px ${results.SF_contact > 1.0 ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.3)'}` }}
                                    >
                                        {results.SF_contact.toFixed(2)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Flank Contact</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex flex-col gap-2 text-right pt-2">
                            <QuickStat label="Ratio" value={`${results.ratio.toFixed(2)}:1`} color="#a855f7" />
                            <QuickStat label="Center Dist" value={`${results.a.toFixed(1)} mm`} color="#6366f1" />
                            <QuickStat label="Circ. Pitch" value={`${(Math.PI * gearModule).toFixed(2)} mm`} color="#818cf8" />
                        </div>
                    </div>
                </div>

                {/* 3D / 2D Visualization Area */}
                <div className="flex-1 relative mx-6 my-4 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    
                    {/* View Toggle */}
                    <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
                        <button onClick={() => setViewMode('3D')} className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border backdrop-blur-md ${viewMode === '3D' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}>3D</button>
                        <button onClick={() => setViewMode('2D')} className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border backdrop-blur-md ${viewMode === '2D' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}>2D</button>
                    </div>

                    <div className="absolute top-5 right-5 z-20 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Cog size={14} className="animate-spin" style={{ animationDuration: '8s' }} /> LIVE MESH PREVIEW
                    </div>

                    <div className="w-full h-full relative z-10">
                        {viewMode === '3D' ? (
                            <Canvas gl={{ preserveDrawingBuffer: true }} shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 45 }}>
                                <ambientLight intensity={0.4} />
                                <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} intensity={1} castShadow />
                                <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
                                    <Stage environment="city" intensity={0.5}>
                                        <Gear3D gearModule={gearModule} teeth={z1} faceWidth={faceWidth} profileShift={x1} color="#6366f1" position={[-(results.a) / 2, 0, 0]} />
                                        <Gear3D gearModule={gearModule} teeth={z2} faceWidth={faceWidth} profileShift={x2} color="#a855f7" position={[(results.a) / 2, 0, 0]} rotation={[0, 0, Math.PI / z2]} />
                                    </Stage>
                                </PresentationControls>
                            </Canvas>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <GearSVG2D z1={z1} z2={z2} m={gearModule} a={results.a} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Manufacturing Dimensions Table (Compact) */}
                <div className="flex-none mx-6 mb-6 rounded-2xl border border-white/5 bg-[#080d14]/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Manufacturing Dimensions (mm)</span>
                        <span className="text-[9px] text-purple-400/50 font-mono">ISO 6336:2019</span>
                    </div>
                    <div className="grid grid-cols-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/5">
                        <div className="px-5 py-2">Parameter</div>
                        <div className="px-5 py-2 text-center">Pinion (z₁)</div>
                        <div className="px-5 py-2 text-center">Gear (z₂)</div>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                        <DimRow label="Tip Dia (da)" v1={results.da1} v2={results.da2} highlight />
                        <DimRow label="Ref Dia (d)" v1={gearModule * z1} v2={gearModule * z2} />
                        <DimRow label="Root Dia (df)" v1={results.df1} v2={results.df2} />
                        <DimRow label="Over Pins (M)" v1={results.M1} v2={results.M2} precision={3} />
                    </div>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                    {!isSafe && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="flex-none mx-6 mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                        >
                            <ShieldAlert className="shrink-0 animate-pulse" size={28} />
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em]">Safety Factor Below Threshold</p>
                                <p className="text-[11px] opacity-80 mt-1">Root bending requires SF &gt; 1.4, flank contact requires SF &gt; 1.0. Increase module, face width, or select stronger material.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div>
            <div className="text-xl font-mono font-black" style={{ color }}>{value}</div>
        </div>
    );
}

function DimRow({ label, v1, v2, highlight, precision = 2 }: { label: string; v1: number; v2: number; highlight?: boolean; precision?: number }) {
    return (
        <div className={`grid grid-cols-3 text-xs font-mono ${highlight ? 'bg-purple-500/5' : ''}`}>
            <div className={`px-5 py-2.5 ${highlight ? 'text-white font-bold' : 'text-gray-500'}`}>{label}</div>
            <div className={`px-5 py-2.5 text-center ${highlight ? 'text-purple-400 font-bold' : 'text-gray-300'}`}>{v1.toFixed(precision)}</div>
            <div className={`px-5 py-2.5 text-center ${highlight ? 'text-purple-400 font-bold' : 'text-gray-300'}`}>{v2.toFixed(precision)}</div>
        </div>
    );
}

function CollapsibleSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-2.5 text-purple-400">
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="text-gray-600" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function GearInput({ label, unit, value, min, max, step, onChange, color }: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; color: string }) {
    return (
        <div className="group">
            <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-white transition-colors">{label}</span>
            </div>
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-lg overflow-hidden transition-all duration-300 group-focus-within:border-purple-500/40 group-focus-within:shadow-[0_0_15px_rgba(168,85,247,0.08)]">
                <input
                    type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none appearance-none"
                />
                {unit && (
                    <div className="px-3 text-[9px] font-bold text-gray-600 border-l border-white/5 bg-white/[0.02]">
                        <span style={{ color }}>{unit}</span>
                    </div>
                )}
            </div>
            <div className="mt-2 px-0.5">
                <input
                    type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-[3px] bg-white/10 rounded-full appearance-none cursor-pointer outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}

function GearSelect({ label, value, onChange, options, color }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; color: string }) {
    return (
        <div className="group">
            <div className="mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
            </div>
            <select
                className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all focus:border-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.08)] appearance-none cursor-pointer"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a1018]">{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function GearSVG2D({ z1, z2, m, a }: { z1: number; z2: number; m: number; a: number }) {
    const r1 = (m * z1) / 2;
    const r2 = (m * z2) / 2;
    const cx1 = 250 - a / 2;
    const cx2 = 250 + a / 2;

    return (
        <svg viewBox="0 0 500 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Pinion */}
            <circle cx={cx1} cy={150} r={r1} fill="none" stroke="#6366f1" strokeWidth="3" opacity="0.6" />
            <circle cx={cx1} cy={150} r={r1 + m} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.3" />
            <circle cx={cx1} cy={150} r={2} fill="#6366f1" />
            
            {/* Gear */}
            <circle cx={cx2} cy={150} r={r2} fill="none" stroke="#a855f7" strokeWidth="3" opacity="0.6" />
            <circle cx={cx2} cy={150} r={r2 + m} fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.3" />
            <circle cx={cx2} cy={150} r={2} fill="#a855f7" />

            {/* Center distance line */}
            <line x1={cx1} y1={150} x2={cx2} y2={150} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="6,6" />
            
            {/* Labels */}
            <text x={cx1} y={150 + r1 + 20} textAnchor="middle" fill="#6366f1" fontSize="12" fontWeight="bold" fontFamily="monospace">z₁={z1}</text>
            <text x={cx2} y={150 + r2 + 20} textAnchor="middle" fill="#a855f7" fontSize="12" fontWeight="bold" fontFamily="monospace">z₂={z2}</text>
            <text x={250} y={138} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">a={a.toFixed(1)}</text>
        </svg>
    );
}
