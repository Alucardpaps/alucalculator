import { useState, useMemo, useEffect } from "react";
import { WeldingVisualization2D } from "./WeldingVisualization2D";
import {
    WELDING_METHODS, JOINT_TYPES, ELECTRODE_CATALOG, WeldingProcess, WeldJointType,
    getMinWeldSize, calculateThroatArea, calculateHeatInput, evaluateHeatInput,
    calculatePreheat, estimateFillerConsumption
} from "@/data/weldingData";
import { ShapeType } from "@/utils/sectionProperties";
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Settings, Layers, ChevronDown, Shield } from 'lucide-react';
import { useI18nStore } from "@/store/i18nStore";

export function WeldingModule() {
    const { t } = useI18nStore();
    const [process, setProcess] = useState<WeldingProcess>('mig');
    const [jointType, setJointType] = useState<WeldJointType>('fillet');
    const [current, setCurrent] = useState(180);
    const [voltage, setVoltage] = useState(26);
    const [speed, setSpeed] = useState(350);
    const [legSize, setLegSize] = useState(6);
    const [thickness, setThickness] = useState(12);
    const [length, setLength] = useState(200);
    const [load, setLoad] = useState(15000);
    const [grooveAngle, setGrooveAngle] = useState(60);
    const [carbonContent, setCarbonContent] = useState(0.2);
    const [selectedElectrode, setSelectedElectrode] = useState(ELECTRODE_CATALOG[7]);
    const [expandedSection, setExpandedSection] = useState<string | null>('process');

    const [material1Profile] = useState<ShapeType>('sheet');
    const [material2Profile] = useState<ShapeType>('sheet');
    const [material1Color] = useState('#94a3b8');
    const [material2Color] = useState('#64748b');
    const [material1Name] = useState(t.welding.materialSteel);
    const [material2Name] = useState(t.welding.materialSteel);
    const defaultDims = { width: 60, height: 80, thickness: 12, wallThickness: 4, diameter: 50, flangeWidth: 40, flangeThickness: 6, webThickness: 4, legWidth: 40, legThickness: 5 };
    const [material1Dims] = useState<any>(defaultDims);
    const [material2Dims] = useState<any>(defaultDims);

    useEffect(() => { if (material1Profile === 'sheet') setThickness(material1Dims.thickness); }, [material1Dims, material1Profile]);

    const results = useMemo(() => {
        const method = WELDING_METHODS[process];
        const joint = JOINT_TYPES[jointType];
        const heatInput = calculateHeatInput(current, voltage, speed, method.efficiency);
        const heatStatus = evaluateHeatInput(heatInput);
        const throatArea = calculateThroatArea(jointType, legSize, length, thickness);
        const stress = load / throatArea;
        const minWeldSize = getMinWeldSize(thickness);
        const weldSizeOk = legSize >= minWeldSize;
        const preheat = calculatePreheat(carbonContent, thickness);
        const filler = estimateFillerConsumption(jointType, legSize, length, thickness);
        const jointStrength = joint.jointEfficiency * selectedElectrode.tensileStrength;
        const safetyFactor = jointStrength / stress;
        return { heatInput, heatStatus, throatArea, stress, minWeldSize, weldSizeOk, preheat, filler, jointStrength, safetyFactor, efficiency: method.efficiency };
    }, [process, jointType, current, voltage, speed, legSize, thickness, length, load, carbonContent, selectedElectrode]);

    const isSafe = results.weldSizeOk && results.safetyFactor > 1.5;
    const activeColor = isSafe ? '#f59e0b' : '#ef4444';
    const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-y-auto lg:overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full bg-[#080d14]/80 border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                            <Flame size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-gray-100">Weld Design</h2>
                            <p className="text-[10px] text-orange-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">AWS D1.1 / EN 1090</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    <PanelSection id="process" title="Process & Joint" icon={<Settings size={14} />} isOpen={expandedSection === 'process'} onToggle={() => toggleSection('process')} accent="orange">
                        <div className="space-y-3">
                            <PanelSelect label="Welding Process" value={process} onChange={(v) => setProcess(v as WeldingProcess)}
                                options={Object.values(WELDING_METHODS).map(m => ({ value: m.id, label: (t.welding.processes as any)?.[m.id] || m.name }))} />
                            <PanelSelect label="Joint Type" value={jointType} onChange={(v) => setJointType(v as WeldJointType)}
                                options={(['fillet', 'doubleFillet', 'butt', 'vGroove', 'tee', 'lap'] as WeldJointType[]).map(j => ({ value: j, label: (t.welding.joints as any)?.[j] || JOINT_TYPES[j].name }))} />
                            <PanelSelect label="Electrode" value={selectedElectrode.code} onChange={(v) => setSelectedElectrode(ELECTRODE_CATALOG.find(e => e.code === v) || ELECTRODE_CATALOG[0])}
                                options={ELECTRODE_CATALOG.map(e => ({ value: e.code, label: `${e.code} (${e.tensileStrength} MPa)` }))} />
                        </div>
                    </PanelSection>

                    <PanelSection id="power" title="Power Parameters" icon={<Zap size={14} />} isOpen={expandedSection === 'power'} onToggle={() => toggleSection('power')} accent="orange">
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <PanelInput label="Current" unit="A" value={current} onChange={setCurrent} color="#f59e0b" />
                                <PanelInput label="Voltage" unit="V" value={voltage} onChange={setVoltage} color="#f59e0b" />
                            </div>
                            <PanelInput label="Travel Speed" unit="mm/min" value={speed} onChange={setSpeed} color="#f59e0b" />
                        </div>
                    </PanelSection>

                    <PanelSection id="geometry" title="Weld Geometry" icon={<Layers size={14} />} isOpen={expandedSection === 'geometry'} onToggle={() => toggleSection('geometry')} accent="orange">
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <PanelInput label="Leg Size (a)" unit="mm" value={legSize} onChange={setLegSize} color="#f59e0b" />
                                <PanelInput label="Thickness (t)" unit="mm" value={thickness} onChange={setThickness} color="#f59e0b" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <PanelInput label="Weld Length" unit="mm" value={length} onChange={setLength} color="#f59e0b" />
                                <PanelInput label="Applied Load" unit="N" value={load} onChange={setLoad} color="#ef4444" />
                            </div>
                        </div>
                    </PanelSection>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 h-auto lg:h-full flex flex-col overflow-hidden min-w-0">
                {/* Safety Factor Header */}
                <div className="flex-none px-8 pt-8 pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2" animate={{ color: activeColor }}>
                                <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
                                {isSafe ? 'WELD DESIGN — SAFE' : 'WARNING: INSUFFICIENT SAFETY'}
                            </motion.div>
                            <div className="flex items-baseline gap-6">
                                <div className="flex flex-col items-center">
                                    <motion.div className="text-[5.5rem] font-black italic tracking-tighter leading-none"
                                        animate={{ color: results.safetyFactor > 1.5 ? '#f59e0b' : '#ef4444', textShadow: `0 0 40px ${results.safetyFactor > 1.5 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                        {results.safetyFactor.toFixed(2)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Safety Factor</span>
                                </div>
                                <div className="text-3xl font-thin text-gray-700 self-center">/</div>
                                <div className="flex flex-col items-center">
                                    <motion.div className="text-[5.5rem] font-black italic tracking-tighter leading-none text-white" style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
                                        {results.stress.toFixed(0)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Stress (MPa)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 text-right pt-2">
                            <SideStat label="Heat Input" value={`${results.heatInput.toFixed(2)} kJ/mm`} color={results.heatStatus.color} />
                            <SideStat label="Min Leg" value={`${results.minWeldSize} mm`} color={results.weldSizeOk ? '#10b981' : '#ef4444'} />
                            <SideStat label="Filler" value={`${results.filler.weight.toFixed(1)} g`} color="#8b5cf6" />
                            <SideStat label="Preheat" value={`${results.preheat.temperature}°C`} color="#06b6d4" />
                        </div>
                    </div>
                </div>

                {/* 3D Visualization */}
                <div className="flex-1 relative mx-6 my-4 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    <div className="absolute top-5 left-5 z-20 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Flame size={14} className="text-orange-500/30" /> WELD JOINT PREVIEW
                    </div>
                    <div className="w-full h-full relative z-10">
                        <WeldingVisualization2D
                            jointType={jointType === 'doubleFillet' ? 'fillet' : jointType === 'vGroove' ? 'vgroove' : jointType as any}
                            legSize={legSize} thickness={thickness} grooveAngle={grooveAngle} length={length}
                            material1={{ color: material1Color, name: material1Name, shape: material1Profile, dimensions: material1Dims }}
                            material2={{ color: material2Color, name: material2Name, shape: material2Profile, dimensions: material2Dims }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ Shared Sub-Components ═══
function SideStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (<div><div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div><div className="text-lg font-mono font-black" style={{ color }}>{value}</div></div>);
}

function PanelSection({ id, title, icon, isOpen, onToggle, children, accent = 'orange' }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode; accent?: string }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2.5 text-orange-400">{icon}<span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span></div>
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
            <div className="mb-1.5"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-white transition-colors">{label}</span></div>
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-lg overflow-hidden transition-all group-focus-within:border-orange-500/40 group-focus-within:shadow-[0_0_15px_rgba(249,115,22,0.08)]">
                <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} step="any" className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none appearance-none" />
                {unit && <div className="px-3 text-[9px] font-bold text-gray-600 border-l border-white/5 bg-white/[0.02]"><span style={{ color }}>{unit}</span></div>}
            </div>
        </div>
    );
}

function PanelSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div className="group">
            <div className="mb-1.5"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</span></div>
            <select className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all focus:border-orange-500/40 appearance-none cursor-pointer"
                value={value} onChange={(e) => onChange(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                {options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0a1018]">{opt.label}</option>)}
            </select>
        </div>
    );
}
