import { useState } from "react";
import { useSheetMetalCalculator } from "@/hooks/useSheetMetalCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { Layers } from 'lucide-react';

export function SheetMetalModule({ lang, dict }: { lang: string, dict: any }) {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    const {
        materialIdx, setMaterialIdx,
        thickness, setThickness,
        angle, setAngle,
        radius, setRadius,
        length, setLength,
        vOpening, setVOpening,
        flangeA, setFlangeA,
        flangeB, setFlangeB,
        results,
        materials
    } = useSheetMetalCalculator();

    // Helpers
    const toImp = (mm: number) => parseFloat((mm / 25.4).toFixed(3));
    const toMet = (inch: number) => inch * 25.4;

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "DIN 6935",
        standardTitle: "Cold bending of flat steel products",
        version: "2011",
        assumptions: [
            "K-Factor: 0.33 (R < 2t) / 0.50 (R > 2t) [Air Bending]",
            `Material: ${materials[materialIdx].name} (Yield: ${materials[materialIdx].yield} MPa)`,
            "Forming method: Air Bending assumed"
        ]
    };

    const status = results.forceTon > 0 && thickness > 0 ? 'valid' : 'invalid';

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 1. Visualization */}
                <EngineeringVisualization status={status} label="BEND GEOMETRY">
                    <div className="flex flex-col items-center justify-center p-2 w-full h-full min-h-[200px] relative">
                        <TechnicalDrawing mode="sheetMetal" data={{ angle }} activeField={null} />
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            <span className="text-[10px] font-mono text-slate-500">{unit === 'metric' ? 'METRIC (mm)' : 'IMPERIAL (in)'}</span>
                            <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                                K={results.K}
                            </span>
                        </div>
                    </div>
                </EngineeringVisualization>

                {/* 2. Controls */}
                <div className="space-y-4">
                    {/* Unit Toggle */}
                    <div className="flex bg-[#2a2a2a] p-1 rounded border border-[#333]">
                        <button onClick={() => setUnit('metric')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${unit === 'metric' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Metric</button>
                        <button onClick={() => setUnit('imperial')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${unit === 'imperial' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Imperial</button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Material</label>
                        <select
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                            value={materialIdx}
                            onChange={(e) => setMaterialIdx(Number(e.target.value))}
                        >
                            {materials.map((m, i) => (
                                <option key={i} value={i}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <CalculatorInput
                            label="Thickness"
                            unit={unit === 'metric' ? "mm" : "in"}
                            value={unit === 'metric' ? thickness : toImp(thickness)}
                            onChange={(e) => unit === 'metric' ? setThickness(Number(e.target.value)) : setThickness(toMet(Number(e.target.value)))}
                        />
                        <CalculatorInput label="Bend Angle" unit="deg" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
                        <CalculatorInput
                            label="Inner Radius"
                            unit={unit === 'metric' ? "mm" : "in"}
                            value={unit === 'metric' ? radius : toImp(radius)}
                            onChange={(e) => unit === 'metric' ? setRadius(Number(e.target.value)) : setRadius(toMet(Number(e.target.value)))}
                        />
                        <CalculatorInput
                            label="Bend Length"
                            unit={unit === 'metric' ? "mm" : "in"}
                            value={unit === 'metric' ? length : toImp(length)}
                            onChange={(e) => unit === 'metric' ? setLength(Number(e.target.value)) : setLength(toMet(Number(e.target.value)))}
                        />
                    </div>

                    <div className="p-3 bg-slate-900/30 rounded border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">V-Die Opening</span>
                            <span className="text-[10px] text-blue-500">Rec: {unit === 'metric' ? `${results.recV}mm` : `${toImp(results.recV)}"`}</span>
                        </div>
                        <CalculatorInput
                            label="Opening (V)"
                            unit={unit === 'metric' ? "mm" : "in"}
                            value={unit === 'metric' ? vOpening : toImp(vOpening)}
                            onChange={(e) => unit === 'metric' ? setVOpening(Number(e.target.value)) : setVOpening(toMet(Number(e.target.value)))}
                        />
                    </div>
                </div>

                {/* 3. Results */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333] space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                        <div className="text-xs font-bold text-slate-400 uppercase">Required Force</div>
                        <div className="text-xl font-mono font-bold text-white">
                            {unit === 'metric' ? results.forceTon.toFixed(1) : (results.forceTon * 1.102).toFixed(1)}
                            <span className="text-xs text-slate-500 ml-1">ton</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                        <div className="bg-[#1a1a1a] p-2 rounded">
                            <div className="uppercase mb-1">Bend Deduction (BD)</div>
                            <div className="text-lg font-mono text-blue-400 font-bold">{unit === 'metric' ? results.BD.toFixed(2) : toImp(results.BD).toFixed(3)}</div>
                        </div>
                        <div className="bg-[#1a1a1a] p-2 rounded">
                            <div className="uppercase mb-1">Flat Length</div>
                            <div className="text-lg font-mono text-green-400 font-bold">{unit === 'metric' ? results.flatLength.toFixed(1) : toImp(results.flatLength).toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>
        </div>
    );
}
