import { useState } from "react";
import { useSheetMetalCalculator } from "@/hooks/useSheetMetalCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Activity, Maximize, Settings2 } from 'lucide-react';

export function SheetMetalModule({ lang, dict }: { lang: string, dict: any }) {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
    const [expandedSection, setExpandedSection] = useState<string | null>('params');
    const { materialIdx, setMaterialIdx, thickness, setThickness, angle, setAngle, radius, setRadius, length, setLength, vOpening, setVOpening, results, materials } = useSheetMetalCalculator();

    const toImp = (mm: number) => parseFloat((mm / 25.4).toFixed(3));
    const toMet = (inch: number) => inch * 25.4;
    const isImp = unit === 'imperial';
    const status = results.forceTon > 0 && thickness > 0;
    const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-[38%] h-full flex flex-col bg-[#080d14]/80 border-r border-white/5 overflow-hidden">
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                <Layers size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-gray-100">Sheet Metal</h2>
                                <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">DIN 6935 / VDI 3389</p>
                            </div>
                        </div>
                        <div className="flex bg-[#0e1622] p-0.5 rounded-lg border border-white/5">
                            <button onClick={() => setUnit('metric')} className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest rounded-md transition-all ${!isImp ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600'}`}>MM</button>
                            <button onClick={() => setUnit('imperial')} className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest rounded-md transition-all ${isImp ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600'}`}>IN</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    <PanelSection id="params" title="Parameters" icon={<Settings2 size={14} />} isOpen={expandedSection === 'params'} onToggle={() => toggleSection('params')}>
                        <div className="space-y-3">
                            <PanelSelect label="Material" value={String(materialIdx)} onChange={(v) => setMaterialIdx(Number(v))} options={materials.map((m, i) => ({ value: String(i), label: m.name }))} />
                            <div className="flex items-center justify-between bg-blue-900/15 border border-blue-500/20 px-4 py-2 rounded-xl text-[10px]">
                                <span className="text-gray-500 font-mono">Yield: {materials[materialIdx].yield} MPa</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <PanelInput label="Thickness (t)" unit={isImp ? 'in' : 'mm'} value={isImp ? toImp(thickness) : thickness} onChange={(v) => setThickness(isImp ? toMet(v) : v)} color="#3b82f6" />
                                <PanelInput label="Bend Angle" unit="deg" value={angle} onChange={setAngle} color="#3b82f6" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <PanelInput label="Inner Radius" unit={isImp ? 'in' : 'mm'} value={isImp ? toImp(radius) : radius} onChange={(v) => setRadius(isImp ? toMet(v) : v)} color="#3b82f6" />
                                <PanelInput label="Bend Length" unit={isImp ? 'in' : 'mm'} value={isImp ? toImp(length) : length} onChange={(v) => setLength(isImp ? toMet(v) : v)} color="#3b82f6" />
                            </div>
                        </div>
                    </PanelSection>

                    <PanelSection id="vdie" title="V-Die Opening" icon={<Maximize size={14} />} isOpen={expandedSection === 'vdie'} onToggle={() => toggleSection('vdie')}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-blue-900/15 border border-blue-500/20 px-4 py-2 rounded-xl text-[10px]">
                                <span className="text-gray-500 font-bold uppercase tracking-widest">Recommended</span>
                                <span className="text-blue-400 font-mono font-bold">{isImp ? toImp(results.recV).toFixed(3) : results.recV.toFixed(1)} {isImp ? 'in' : 'mm'}</span>
                            </div>
                            <PanelInput label="Actual V-Opening" unit={isImp ? 'in' : 'mm'} value={isImp ? toImp(vOpening) : vOpening} onChange={(v) => setVOpening(isImp ? toMet(v) : v)} color="#3b82f6" />
                        </div>
                    </PanelSection>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-[62%] h-full flex flex-col overflow-hidden">
                {/* KPI Header */}
                <div className="flex-none px-8 pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 text-blue-400/60 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                                {materials[materialIdx].name} — {isImp ? 'IMPERIAL' : 'METRIC'}
                            </div>
                            <div className="flex items-baseline gap-8">
                                <div className="flex flex-col items-center">
                                    <motion.div key={results.forceTon} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                                        className="text-[5.5rem] font-black italic tracking-tighter leading-none text-white" style={{ textShadow: '0 0 40px rgba(239,68,68,0.2)' }}>
                                        {isImp ? (results.forceTon * 1.102).toFixed(1) : results.forceTon.toFixed(1)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{isImp ? 'US Ton' : 'Metric Ton'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 text-right pt-2">
                            <SideStat label="Flat Pattern" value={`${isImp ? toImp(results.flatLength).toFixed(3) : results.flatLength.toFixed(2)} ${isImp ? 'in' : 'mm'}`} color="#10b981" />
                            <SideStat label="Bend Deduction" value={`${isImp ? toImp(results.BD).toFixed(3) : results.BD.toFixed(2)} ${isImp ? 'in' : 'mm'}`} color="#f59e0b" />
                            <SideStat label="K-Factor" value={results.K.toFixed(3)} color="#8b5cf6" />
                        </div>
                    </div>
                </div>

                {/* Bend Geometry */}
                <div className="flex-1 relative mx-6 my-4 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    <div className="absolute top-5 left-5 z-20 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Layers size={14} className="text-blue-500/30" /> BEND GEOMETRY
                    </div>
                    <div className="w-full h-full flex items-center justify-center relative z-10 p-8">
                        <TechnicalDrawing mode="sheetMetal" data={{ angle }} activeField={null} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SideStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (<div><div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div><div className="text-xl font-mono font-black" style={{ color }}>{value}</div></div>);
}

function PanelSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2.5 text-blue-400">{icon}<span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span></div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="text-gray-600" /></motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"><div className="px-4 pb-4 pt-1">{children}</div></motion.div>)}
            </AnimatePresence>
        </div>
    );
}

function PanelInput({ label, unit, value, onChange, color }: { label: string; unit: string; value: number; onChange: (v: number) => void; color: string }) {
    return (
        <div className="group">
            <div className="mb-1"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</span></div>
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-lg overflow-hidden transition-all group-focus-within:border-blue-500/40 group-focus-within:shadow-[0_0_12px_rgba(59,130,246,0.08)]">
                <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} step="any" className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none appearance-none" />
                {unit && <div className="px-2.5 text-[9px] font-bold text-gray-600 border-l border-white/5 bg-white/[0.02]"><span style={{ color }}>{unit}</span></div>}
            </div>
        </div>
    );
}

function PanelSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div>
            <div className="mb-1"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</span></div>
            <select className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all focus:border-blue-500/40 appearance-none cursor-pointer"
                value={value} onChange={(e) => onChange(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                {options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0a1018]">{opt.label}</option>)}
            </select>
        </div>
    );
}
