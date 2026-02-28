import { useState } from "react";
import { useSheetMetalCalculator } from "@/hooks/useSheetMetalCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { Layers, Maximize, Activity, ChevronsRight, Settings2 } from 'lucide-react';

export function SheetMetalModule({ lang, dict }: { lang: string, dict: any }) {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    const {
        materialIdx, setMaterialIdx,
        thickness, setThickness,
        angle, setAngle,
        radius, setRadius,
        length, setLength,
        vOpening, setVOpening,
        results,
        materials
    } = useSheetMetalCalculator();

    // Helpers
    const toImp = (mm: number) => parseFloat((mm / 25.4).toFixed(3));
    const toMet = (inch: number) => inch * 25.4;

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "DIN 6935 / VDI 3389",
        standardTitle: "Cold bending of flat steel products",
        version: "2024.1",
        assumptions: [
            "K-Factor: 0.33 (R < 2t) / 0.50 (R > 2t) [Air Bending]",
            `Material: ${materials[materialIdx].name} (Yield: ${materials[materialIdx].yield} MPa)`,
            "Forming method: Air Bending assumed"
        ]
    };

    const status = results.forceTon > 0 && thickness > 0 ? 'valid' : 'invalid';
    const isImp = unit === 'imperial';

    return (
        <div className="flex flex-col h-full bg-[#05070a] text-slate-200 select-none overflow-y-auto custom-scrollbar font-sans relative">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="p-5 space-y-5 relative z-10 w-full max-w-4xl mx-auto">

                {/* Header & Unit Toggle */}
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                            <Layers className="text-blue-500" /> SHEET METAL <span className="text-slate-500">BENDING</span>
                        </h2>
                        <div className="text-[10px] font-mono text-blue-400 uppercase tracking-[2px] mt-1">
                            Force & Allowance Calculator
                        </div>
                    </div>

                    <div className="flex bg-[#0a0e14] p-1 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <button onClick={() => setUnit('metric')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-md transition-all ${!isImp ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-white'}`}>Metric</button>
                        <button onClick={() => setUnit('imperial')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-md transition-all ${isImp ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-white'}`}>Imperial</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* LEFT COLUMN: Inputs */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="p-4 bg-[#0a0e14]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">
                                <Settings2 size={14} className="text-slate-400" /> Parameters
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Material Selection</label>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                                        <select
                                            className="w-full relative bg-[#05070a] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white outline-none cursor-pointer appearance-none font-medium"
                                            value={materialIdx}
                                            onChange={(e) => setMaterialIdx(Number(e.target.value))}
                                        >
                                            {materials.map((m, i) => (
                                                <option key={i} value={i} className="bg-[#05070a]">{m.name}</option>
                                            ))}
                                        </select>
                                        <ChevronsRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
                                    </div>
                                    <div className="text-[9px] font-mono text-cyan-500/60 pl-1 text-right">
                                        Yield: {materials[materialIdx].yield} MPa
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <PremiumInput label="Thickness (t)" unit={isImp ? "in" : "mm"} val={isImp ? toImp(thickness) : thickness} setVal={(v: number) => setThickness(isImp ? toMet(v) : v)} />
                                    <PremiumInput label="Bend Angle" unit="deg" val={angle} setVal={setAngle} highlight />
                                    <PremiumInput label="Inner Radius" unit={isImp ? "in" : "mm"} val={isImp ? toImp(radius) : radius} setVal={(v: number) => setRadius(isImp ? toMet(v) : v)} />
                                    <PremiumInput label="Bend Length" unit={isImp ? "in" : "mm"} val={isImp ? toImp(length) : length} setVal={(v: number) => setLength(isImp ? toMet(v) : v)} />
                                </div>
                            </div>
                        </div>

                        {/* V-Die Opening */}
                        <div className="p-4 bg-[#0a0e14]/80 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[40px] pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[2px] flex items-center gap-2">
                                    <Maximize size={12} /> V-Die Opening
                                </span>
                                <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                    REC: {isImp ? toImp(results.recV).toFixed(3) : results.recV.toFixed(1)} {isImp ? 'in' : 'mm'}
                                </span>
                            </div>
                            <PremiumInput label="Actual V-Opening" unit={isImp ? "in" : "mm"} val={isImp ? toImp(vOpening) : vOpening} setVal={(v: number) => setVOpening(isImp ? toMet(v) : v)} accent="blue" />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Geometry & Results */}
                    <div className="lg:col-span-3 flex flex-col gap-5">

                        {/* 1. Visualization */}
                        <div className="flex-1 bg-[#0a0e14]/50 border border-white/5 rounded-2xl p-4 flex flex-col relative overflow-hidden min-h-[250px] shadow-inner">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-2 z-10">Bend Geometry</div>

                            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                                <TechnicalDrawing mode="sheetMetal" data={{ angle }} activeField={null} />

                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
                                    <span className="text-[9px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-lg">
                                        K-Factor: <span className="text-blue-400">{results.K.toFixed(3)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Primary Results */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Required Force */}
                            <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-red-950/30 to-black border border-red-500/20 relative overflow-hidden group">
                                <div className="absolute -inset-2 bg-red-600/10 blur-[30px] opacity-0 group-hover:opacity-100 transition duration-1000"></div>

                                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-[2px] mb-3 relative z-10">
                                    <Activity size={14} /> Required Press Force
                                </div>
                                <div className="flex items-baseline gap-2 relative z-10">
                                    <span className="text-4xl font-black font-mono text-white tracking-tighter" style={{ textShadow: '0 0 20px rgba(220,38,38,0.5)' }}>
                                        {isImp ? (results.forceTon * 1.102).toFixed(1) : results.forceTon.toFixed(1)}
                                    </span>
                                    <span className="text-sm font-bold text-red-500 uppercase tracking-widest">{isImp ? 'US Ton' : 'Ton'}</span>
                                </div>
                            </div>

                            {/* Flat Length & BD */}
                            <div className="col-span-2 sm:col-span-1 grid grid-rows-2 gap-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-green-950/20 border border-green-500/20">
                                    <div className="text-[10px] font-bold text-green-500/70 uppercase tracking-[1px] leading-tight">Flat Pattern<br />Length</div>
                                    <div className="text-xl font-black font-mono text-green-400">
                                        {isImp ? toImp(results.flatLength).toFixed(3) : results.flatLength.toFixed(2)}
                                        <span className="text-[10px] ml-1 opacity-50">{isImp ? 'in' : 'mm'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-950/20 border border-orange-500/20">
                                    <div className="text-[10px] font-bold text-orange-500/70 uppercase tracking-[1px] leading-tight">Bend<br />Deduction (BD)</div>
                                    <div className="text-xl font-black font-mono text-orange-400">
                                        {isImp ? toImp(results.BD).toFixed(3) : results.BD.toFixed(2)}
                                        <span className="text-[10px] ml-1 opacity-50">{isImp ? 'in' : 'mm'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="mt-6 opacity-80">
                    <AssumptionPanel metadata={metadata} status={status} />
                </div>
            </div>
        </div>
    );
}

// Custom Input for the form
function PremiumInput({ label, unit, val, setVal, highlight = false, accent = 'white' }: any) {
    const accentColors = {
        white: 'focus-within:border-white/40',
        blue: 'focus-within:border-blue-500/50',
    };

    return (
        <div className="space-y-1.5">
            <label className={`text-[9px] font-bold uppercase tracking-widest pl-1 ${highlight ? 'text-blue-400' : 'text-slate-400'}`}>{label}</label>
            <div className={`flex items-center bg-[#05070a] border border-white/10 rounded-lg overflow-hidden transition-colors ${accentColors[accent as keyof typeof accentColors]}`}>
                <input
                    type="number"
                    value={val}
                    onChange={(e) => setVal(Number(e.target.value))}
                    className="w-full bg-transparent px-3 py-2 text-xs font-mono font-bold text-white outline-none min-w-0"
                />
                <div className="px-2.5 py-2 bg-white/5 border-l border-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-wider shrink-0 w-11 text-center">
                    {unit}
                </div>
            </div>
        </div>
    );
}
