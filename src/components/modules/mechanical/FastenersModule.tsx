import { useState } from "react";
import { useFastenerCalculator } from "@/hooks/useFastenerCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { ArrowLeftRight, CheckCircle, AlertTriangle } from 'lucide-react';

export function FastenersModule({ lang, dict }: { lang: string, dict: any }) {
    const {
        standard, setStandard,
        size, setSize,
        availableSizes,
        results,
        manualUnit, setManualUnit
    } = useFastenerCalculator();

    const [length, setLength] = useState(50);
    const [fastenerType, setFastenerType] = useState<'bolt' | 'nut'>('bolt');

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: standard.includes('ISO') ? "ISO 965-1" : "ASME B1.1",
        standardTitle: standard.includes('ISO') ? "General purpose metric screw threads" : "Unified Inch Screw Threads (UN/UNR)",
        version: "2013",
        assumptions: [
            "Tolerance Class: 6g (Bolt) / 6H (Nut)",
            "Standard Coarse/Fine Pitches only",
            "Tensile Area calculation based on nominal diameter"
        ]
    };

    const status = Number(results.stressArea) > 0 ? 'valid' : 'invalid';

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 1. Visualization */}
                <EngineeringVisualization status={status} label="THREAD GEOMETRY">
                    <div className="flex flex-col items-center justify-center p-2 w-full h-full min-h-[220px] relative">
                        <TechnicalDrawing
                            mode="fastener"
                            activeField={null}
                            data={{ ...results, diameter: results.majorDia, length, type: fastenerType }}
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            <span className="text-[10px] font-mono text-slate-500">{standard}</span>
                            <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">{size}</span>
                        </div>
                    </div>
                </EngineeringVisualization>

                {/* 2. Controls */}
                <div className="space-y-4">
                    {/* Type & Unit Toggle */}
                    <div className="flex gap-2">
                        <div className="flex-1 bg-[#2a2a2a] p-1 rounded border border-[#333] flex">
                            <button onClick={() => setFastenerType('bolt')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${fastenerType === 'bolt' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Bolt</button>
                            <button onClick={() => setFastenerType('nut')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${fastenerType === 'nut' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Nut</button>
                        </div>
                        <div className="flex-1 bg-[#2a2a2a] p-1 rounded border border-[#333] flex">
                            <button onClick={() => setManualUnit('mm')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${manualUnit === 'mm' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>MM</button>
                            <button onClick={() => setManualUnit('inch')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${manualUnit === 'inch' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>INCH</button>
                        </div>
                    </div>

                    {/* Standard Select */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Standard</label>
                        <select
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white mb-2"
                            value={standard}
                            onChange={(e) => setStandard(e.target.value as any)}
                        >
                            {/* Filtered list for compact view */}
                            {(['ISO Metric', 'ISO Metric Fine', 'UNC', 'UNF', 'BSPP (G)', 'NPT']).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Size</label>
                            <select className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono" value={size} onChange={(e) => setSize(e.target.value)}>
                                {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Length</label>
                            <input type="number" className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono" value={length} onChange={(e) => setLength(Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                {/* 3. Results */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333] space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                        <span className="text-xs text-slate-400 uppercase">Calculated Geometry</span>
                        <div className="text-[10px] text-slate-500">Pitch: <span className="text-white">{results.displayPitch}</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#1a1a1a] p-2 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase">Tap Drill</div>
                            <div className="text-lg font-mono font-bold text-blue-400">{results.tapDrill} <span className="text-[10px]">{results.unit}</span></div>
                        </div>
                        <div className="bg-[#1a1a1a] p-2 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase">Stress Area</div>
                            <div className="text-lg font-mono font-bold text-orange-400">{results.stressArea} <span className="text-[10px]">{results.unit}²</span></div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] p-2 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Clearance Drill</div>
                        <div className="text-lg font-mono font-bold text-slate-200">{results.clearance} <span className="text-[10px]">{results.unit}</span></div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>
        </div>
    );
}
