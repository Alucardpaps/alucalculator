import { useState, useMemo } from "react";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { CheckCircle, AlertTriangle, Droplets } from 'lucide-react';
import { TechnicalDrawing } from "@/components/TechnicalDrawing"; // Reusing technical drawing if generic mode allows, or creating inline SVG

export function PumpsModule({ lang, dict }: { lang: string, dict: any }) {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    // Inputs (Metric Internal)
    const [flow, setFlow] = useState(100); // m3/h
    const [head, setHead] = useState(50); // m
    const [rpm, setRpm] = useState(1450);
    const [efficiency, setEfficiency] = useState(0.75);
    const [density, setDensity] = useState(1000); // kg/m3

    // Calculations
    const results = useMemo(() => {
        const g = 9.81;
        const hydPower = (density * g * flow * head) / 3600000; // kW
        const shaftPower = hydPower / efficiency;
        const Q_s = flow / 3600;
        const ns = rpm * Math.sqrt(Q_s) / Math.pow(g * head, 0.75);

        return { hydPower, shaftPower, ns };
    }, [flow, head, rpm, efficiency, density]);

    // Helpers
    const toGPM = (m3h: number) => m3h * 4.403;
    const toM3H = (gpm: number) => gpm / 4.403;
    const toFT = (m: number) => m * 3.281;
    const toM = (ft: number) => ft / 3.281;
    const toHP = (kw: number) => kw * 1.341;

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "HI 14.3",
        standardTitle: "Rotodynamic Pumps - Design and Application",
        version: "2019",
        assumptions: [
            "Affinity Laws apply",
            `Fluid Density: ${density} kg/m³ (Water-like assumed)`,
            "Viscosity effects ignored (assumed Newtonian)"
        ]
    };

    const status = results.ns > 0 && efficiency > 0 && efficiency <= 1 ? 'valid' : 'invalid';

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 1. Visualization */}
                <EngineeringVisualization status={status} label="HYDRAULIC PUMP">
                    <div className="flex flex-col items-center justify-center p-2 w-full h-full min-h-[180px] relative">
                        {/* Simple Pump Diagram using TechnicalDrawing or Inline SVG */}
                        <div className="bg-[#111] border border-slate-700/50 rounded-full w-32 h-32 flex items-center justify-center relative">
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-pulse"></div>
                            <Droplets size={48} className="text-blue-500" />
                            {/* Impeller Hint */}
                            <div className="absolute w-full h-1 bg-transparent border-t border-dashed border-slate-600 rotate-45"></div>
                            <div className="absolute w-full h-1 bg-transparent border-t border-dashed border-slate-600 -rotate-45"></div>
                        </div>
                        <div className="absolute bottom-2 right-2 text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                            ns = {results.ns.toFixed(1)}
                        </div>
                        <div className="absolute bottom-2 left-2 text-[10px] uppercase font-bold text-slate-500">
                            {results.ns < 20 ? 'Radial' : results.ns < 80 ? 'Mixed' : 'Axial'} Flow
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

                    <div className="grid grid-cols-2 gap-4">
                        <CalculatorInput
                            label={`Flow (${unit === 'metric' ? 'm³/h' : 'GPM'})`}
                            unit=""
                            value={unit === 'metric' ? flow : parseFloat(toGPM(flow).toFixed(1))}
                            onChange={(e) => unit === 'metric' ? setFlow(Number(e.target.value)) : setFlow(toM3H(Number(e.target.value)))}
                        />
                        <CalculatorInput
                            label={`Head (${unit === 'metric' ? 'm' : 'ft'})`}
                            unit=""
                            value={unit === 'metric' ? head : parseFloat(toFT(head).toFixed(1))}
                            onChange={(e) => unit === 'metric' ? setHead(Number(e.target.value)) : setHead(toM(Number(e.target.value)))}
                        />
                        <CalculatorInput label="Speed" unit="RPM" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
                        <CalculatorInput label="Efficiency" unit="0-1" value={efficiency} onChange={(e) => setEfficiency(Number(e.target.value))} />
                    </div>
                </div>

                {/* 3. Results */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333] space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                        <div className="text-xs font-bold text-slate-400 uppercase">Power Requirements</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#1a1a1a] p-2 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase">Hydraulic</div>
                            <div className="text-lg font-mono font-bold text-blue-400">
                                {unit === 'metric' ? results.hydPower.toFixed(2) : toHP(results.hydPower).toFixed(2)}
                                <span className="text-[10px] ml-1">{unit === 'metric' ? 'kW' : 'HP'}</span>
                            </div>
                        </div>
                        <div className="bg-[#1a1a1a] p-2 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase">Shaft</div>
                            <div className="text-lg font-mono font-bold text-white">
                                {unit === 'metric' ? results.shaftPower.toFixed(2) : toHP(results.shaftPower).toFixed(2)}
                                <span className="text-[10px] ml-1">{unit === 'metric' ? 'kW' : 'HP'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>
        </div>
    );
}
