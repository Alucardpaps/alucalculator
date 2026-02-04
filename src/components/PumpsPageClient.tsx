"use client";

import { useState } from "react";
import { CalculatorInput } from "@/components/CalculatorInput";
// import { TechnicalDrawing } from "@/components/TechnicalDrawing"; // Not used currently but kept if needed
import { TheorySection } from "@/components/TheorySection";

export default function PumpsPageClient({ dict, lang }: { dict: any, lang: string }) {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
    // Inputs state
    const [flow, setFlow] = useState(100); // m3/h
    const [head, setHead] = useState(50); // m
    const [rpm, setRpm] = useState(1450);
    const [efficiency, setEfficiency] = useState(0.75);
    const [density, setDensity] = useState(1000); // kg/m3

    // Calculations (Metric Internal)
    // P_hyd (kW) = (rho * g * Q * H) / 3.6e6
    const g = 9.81;
    const hydPower = (density * g * flow * head) / 3600000; // kW
    const shaftPower = hydPower / efficiency;

    // Specific speed needs Q in m3/s
    const Q_s = flow / 3600;
    const ns = rpm * Math.sqrt(Q_s) / Math.pow(g * head, 0.75);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-12 font-sans overflow-hidden">

            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xl">P</div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{dict.pump.title}</h1>
                        <p className="text-xs text-slate-500">{dict.pump.subtitle}</p>
                    </div>
                </div>
                <div className="flex bg-slate-200 rounded p-1">
                    <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'metric' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>METRIC</button>
                    <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'imperial' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>IMPERIAL</button>
                </div>
            </header>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: INPUTS */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="card-tech">
                        <h2 className="text-lg font-bold text-tech-blue mb-4 border-b border-slate-100 pb-2">Operating Conditions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <CalculatorInput label={`${dict.pump.inputs.flow} ${unit === 'metric' ? '(m³/h)' : '(GPM)'}`} unit="" value={unit === 'metric' ? flow : parseFloat((flow * 4.403).toFixed(1))} onChange={(e) => unit === 'metric' ? setFlow(Number(e.target.value)) : setFlow(Number(e.target.value) / 4.403)} />
                            <CalculatorInput label={`${dict.pump.inputs.head} ${unit === 'metric' ? '(m)' : '(ft)'}`} unit="" value={unit === 'metric' ? head : parseFloat((head * 3.281).toFixed(1))} onChange={(e) => unit === 'metric' ? setHead(Number(e.target.value)) : setHead(Number(e.target.value) / 3.281)} />
                            <CalculatorInput label={dict.pump.inputs.rpm} unit="rpm" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
                            <CalculatorInput label={dict.pump.inputs.eff} unit="0-1" value={efficiency} onChange={(e) => setEfficiency(Number(e.target.value))} />
                            <CalculatorInput label={dict.pump.inputs.density} unit="kg/m³" value={density} onChange={(e) => setDensity(Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                {/* RIGHT: RESULTS */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900 text-white rounded-xl p-8 shadow-xl relative overflow-hidden">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{dict.pump.results.hydPower}</div>
                                <div className="text-3xl font-mono font-bold text-blue-400">
                                    {unit === 'metric' ? `${hydPower.toFixed(2)} kW` : `${(hydPower * 1.341).toFixed(2)} HP`}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{dict.pump.results.shaftPower}</div>
                                <div className="text-3xl font-mono font-bold text-white">
                                    {unit === 'metric' ? `${shaftPower.toFixed(2)} kW` : `${(shaftPower * 1.341).toFixed(2)} HP`}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">Specific Speed (ns)</div>
                                <div className="font-mono text-lg">{ns.toFixed(1)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">Pump Type Hint</div>
                                <div className="font-mono text-lg text-green-400">{ns < 20 ? 'Radial' : ns < 80 ? 'Mixed' : 'Axial'}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <TheorySection title="Hydraulic Pump Mechanics">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Hydraulic Power Equation</h4>
                        <code className="block bg-slate-100 p-2 rounded text-sm mb-2">Ph = (ρ × g × Q × H) / η</code>
                        <p className="text-sm text-slate-600">
                            Power is proportional to Flow (Q) and Head (H). If you double the speed, Flow doubles, Head quadruples, and Power increases by factor of 8 (Affinity Laws).
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">NPSH & Cavitation</h4>
                        <p className="text-sm text-slate-600 mb-2">
                            <strong>Net Positive Suction Head (NPSH)</strong> is critical to prevent cavitation.
                        </p>
                        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                            <li>NPSHa (Available) must be {'>'} NPSHr (Required).</li>
                            <li>Avoid sharp bends at suction.</li>
                            <li>Keep suction pipe short and large diameter.</li>
                        </ul>
                    </div>
                </div>
            </TheorySection>
        </main>
    );
}
