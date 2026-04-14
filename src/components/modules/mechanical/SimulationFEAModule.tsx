"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, ChevronDown, FileText, Activity, Layers, Shield } from "lucide-react";
import { MATERIALS_DB } from "@/data/materialsData";
import { solveBeam, BeamType, Load, FEAInput } from "@/lib/feaEngine";
import { DiagramVisualizer } from "@/components/ui/DiagramVisualizer";
import { motion, AnimatePresence } from 'framer-motion';
import { PDFReportEngine, ReportMetadata } from "@/lib/pdfReportEngine";
import { ReportSettingsModal } from "@/components/ui/ReportSettingsModal";

export function SimulationFEAModule({ lang, dict }: { lang: string, dict: any }) {
    const [beamType, setBeamType] = useState<BeamType>('simply-supported');
    const [length, setLength] = useState<number>(5.0);
    const [sup1, setSup1] = useState<number>(0.0);
    const [sup2, setSup2] = useState<number>(5.0);
    const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS_DB[0]);
    const [inertia, setInertia] = useState<number>(1.25);
    const [height, setHeight] = useState<number>(50);
    const [loads, setLoads] = useState<Load[]>([{ id: '1', type: 'point', magnitude: 5000, position: 2.5 }]);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>('material');

    useEffect(() => {
        if (beamType === 'cantilever') { setSup1(0); setSup2(0); }
        else if (beamType === 'simply-supported') { setSup1(0); setSup2(length); }
    }, [beamType, length]);

    const addLoad = () => setLoads([...loads, { id: Date.now().toString(), type: 'point', magnitude: 1000, position: length / 2, length: 1 }]);
    const updateLoad = (id: string, field: keyof Load, value: any) => setLoads(loads.map(l => l.id === id ? { ...l, [field]: value } : l));
    const removeLoad = (id: string) => setLoads(loads.filter(l => l.id !== id));

    const results = useMemo(() => {
        const I_m4 = inertia * 1e-8;
        const E_Pa = selectedMaterial.youngsModulus * 1e9;
        try { return solveBeam({ length, supports: [sup1, sup2], type: beamType, loads, E: E_Pa, I: I_m4 }, 500); }
        catch { return null; }
    }, [beamType, length, sup1, sup2, selectedMaterial, inertia, loads]);

    const stressResults = useMemo(() => {
        if (!results) return null;
        const I_m4 = inertia * 1e-8;
        const c_m = (height / 1000) / 2;
        const maxStressMPa = (results.maxM * c_m) / I_m4;
        const sy = selectedMaterial.yield;
        const safetyFactor = Math.abs(maxStressMPa) > 0 ? sy / Math.abs(maxStressMPa) : 999;
        return { maxStressMPa, safetyFactor, sy };
    }, [results, inertia, height, selectedMaterial]);

    const isSafe = stressResults ? stressResults.safetyFactor > 2 : false;
    const activeColor = isSafe ? '#10b981' : stressResults && stressResults.safetyFactor > 1 ? '#f59e0b' : '#ef4444';
    const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

    const generateEnterpriseReport = async (meta: ReportMetadata) => {
        const engine = new PDFReportEngine(meta);
        let yPos = engine.addMetadataSection();
        yPos = engine.addKPIs([{ label: "Material", value: selectedMaterial.name }, { label: "Length", value: `${length} m` }, { label: "SF", value: stressResults?.safetyFactor.toFixed(2) || "ERR" }], yPos);
        engine.save(`FEA_Analysis_${meta.referenceNo}.pdf`);
    };

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-[38%] h-full flex flex-col bg-[#080d14]/80 border-r border-white/5 overflow-hidden">
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                                <Activity size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-gray-100">FEA Solver</h2>
                                <p className="text-[10px] text-red-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Euler-Bernoulli 1D</p>
                            </div>
                        </div>
                        <button onClick={() => setIsReportModalOpen(true)} className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-gray-400 hover:text-white transition-all">
                            <FileText size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    {/* Material & Section */}
                    <PanelSection id="material" title="Material & Section" icon={<Layers size={14} />} isOpen={expandedSection === 'material'} onToggle={() => toggleSection('material')}>
                        <div className="space-y-3">
                            <PanelSelect label="Material" value={selectedMaterial.name} onChange={(v) => setSelectedMaterial(MATERIALS_DB.find(m => m.name === v) || MATERIALS_DB[0])} options={MATERIALS_DB.map(m => ({ value: m.name, label: m.name }))} />
                            <div className="flex items-center justify-between bg-red-900/15 border border-red-500/20 px-4 py-2 rounded-xl text-[10px]">
                                <span className="text-gray-500 font-mono">E: {selectedMaterial.youngsModulus} GPa</span>
                                <span className="text-gray-500 font-mono">Sy: {selectedMaterial.yield} MPa</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <PanelInput label="Inertia (I)" unit="cm⁴" value={inertia} onChange={setInertia} color="#ef4444" />
                                <PanelInput label="Height (h)" unit="mm" value={height} onChange={setHeight} color="#ef4444" />
                            </div>
                        </div>
                    </PanelSection>

                    {/* Beam Topology */}
                    <PanelSection id="beam" title="Beam Topology" icon={<Shield size={14} />} isOpen={expandedSection === 'beam'} onToggle={() => toggleSection('beam')}>
                        <div className="space-y-3">
                            <div className="flex bg-[#0e1622] p-1 rounded-xl border border-white/5">
                                {(['simply-supported', 'cantilever', 'overhanging'] as const).map(bt => (
                                    <button key={bt} onClick={() => setBeamType(bt)}
                                        className={`flex-1 text-[9px] font-black tracking-widest uppercase transition-all py-2.5 rounded-lg ${beamType === bt ? 'bg-red-500/20 text-red-400 shadow-lg' : 'text-gray-600 hover:text-white'}`}>
                                        {bt === 'simply-supported' ? 'Simple' : bt === 'cantilever' ? 'Cantil.' : 'Overhang'}
                                    </button>
                                ))}
                            </div>
                            <PanelInput label="Total Length" unit="m" value={length} onChange={setLength} color="#ef4444" />
                            {beamType === 'overhanging' && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                    <PanelInput label="Sup 1 (x)" unit="m" value={sup1} onChange={setSup1} color="#ef4444" />
                                    <PanelInput label="Sup 2 (x)" unit="m" value={sup2} onChange={setSup2} color="#ef4444" />
                                </div>
                            )}
                        </div>
                    </PanelSection>

                    {/* Load Cases */}
                    <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2.5 text-red-400">
                                <Activity size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Load Cases</span>
                            </div>
                            <button onClick={addLoad} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="px-4 pb-4 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {loads.map((load) => (
                                <div key={load.id} className="bg-[#0e1622] border border-white/5 rounded-xl p-3 relative group">
                                    <button onClick={() => removeLoad(load.id)} className="absolute top-2 right-2 p-1 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={12} />
                                    </button>
                                    <div className="mb-2">
                                        <select value={load.type} onChange={(e) => updateLoad(load.id, 'type', e.target.value)}
                                            className="bg-transparent text-[10px] font-black text-red-400 uppercase tracking-widest focus:outline-none cursor-pointer">
                                            <option value="point" className="bg-[#0a1018]">Point</option>
                                            <option value="distributed" className="bg-[#0a1018]">UDL</option>
                                            <option value="moment" className="bg-[#0a1018]">Moment</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <PanelInput label={load.type === 'moment' ? 'Nm' : load.type === 'distributed' ? 'N/m' : 'Force (N)'} unit="" value={load.magnitude} onChange={(v) => updateLoad(load.id, 'magnitude', v)} color="#ef4444" />
                                        <PanelInput label="Position" unit="m" value={load.position} onChange={(v) => updateLoad(load.id, 'position', v)} color="#ef4444" />
                                    </div>
                                    {load.type === 'distributed' && (
                                        <div className="mt-2"><PanelInput label="Length" unit="m" value={load.length || 0} onChange={(v) => updateLoad(load.id, 'length', v)} color="#ef4444" /></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-[62%] h-full flex flex-col overflow-hidden">
                {/* KPI Header */}
                <div className="flex-none px-8 pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2" animate={{ color: activeColor }}>
                                <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
                                {isSafe ? 'STRUCTURE VERIFIED — SAFE' : 'WARNING: CHECK DESIGN'}
                            </motion.div>
                            <div className="flex items-baseline gap-6">
                                <div className="flex flex-col items-center">
                                    <motion.div className="text-[5rem] font-black italic tracking-tighter leading-none"
                                        animate={{ color: activeColor, textShadow: `0 0 40px ${activeColor}40` }}>
                                        {stressResults?.safetyFactor === 999 ? '∞' : (stressResults?.safetyFactor || 0).toFixed(2)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Safety Factor</span>
                                </div>
                                <div className="text-3xl font-thin text-gray-700 self-center">/</div>
                                <div className="flex flex-col items-center">
                                    <div className="text-[5rem] font-black italic tracking-tighter leading-none text-white" style={{ textShadow: '0 0 30px rgba(255,255,255,0.08)' }}>
                                        {(stressResults?.maxStressMPa || 0).toFixed(0)}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Max Stress (MPa)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 text-right pt-2">
                            <SideStat label="Max Deflect." value={`${((results?.maxY || 0) * 1000).toFixed(2)} mm`} color="#3b82f6" />
                            <SideStat label="R1" value={`${(results?.R1 || 0).toFixed(0)} N`} color="#8b5cf6" />
                            {beamType !== 'cantilever' && <SideStat label="R2" value={`${(results?.R2 || 0).toFixed(0)} N`} color="#8b5cf6" />}
                        </div>
                    </div>
                </div>

                {/* Diagrams */}
                <div className="flex-1 relative mx-6 my-2 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner p-6 flex flex-col gap-4">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} className="text-red-500/30" /> INTERNAL FORCES & KINEMATICS
                    </div>
                    {results && (
                        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                            <DiagramVisualizer title="Shear Force (V)" unit="N" x={results.x} data={results.V} color="#3b82f6" fillColor="rgba(59,130,246,0.1)" height={100} />
                            <DiagramVisualizer title="Bending Moment (M)" unit="Nm" x={results.x} data={results.M} color="#ef4444" fillColor="rgba(239,68,68,0.1)" height={100} />
                            <DiagramVisualizer title="Deflection (y)" unit="m" x={results.x} data={results.y} color="#10b981" fillColor="rgba(16,185,129,0.1)" height={100} />
                        </div>
                    )}
                </div>
            </div>

            <ReportSettingsModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={generateEnterpriseReport} defaultTitle="Linear Structural Evaluation" />
        </div>
    );
}

function SideStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (<div><div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div><div className="text-lg font-mono font-black" style={{ color }}>{value}</div></div>);
}

function PanelSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2.5 text-red-400">{icon}<span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span></div>
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
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-lg overflow-hidden transition-all group-focus-within:border-red-500/40 group-focus-within:shadow-[0_0_12px_rgba(239,68,68,0.08)]">
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
            <select className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all focus:border-red-500/40 appearance-none cursor-pointer"
                value={value} onChange={(e) => onChange(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                {options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0a1018]">{opt.label}</option>)}
            </select>
        </div>
    );
}
