import { useState, useMemo } from "react";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { CheckCircle, AlertTriangle, Droplets, Activity, Zap, TrendingUp } from 'lucide-react';
import { motion } from "framer-motion";

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
        // P_hyd = rho * g * Q * H
        const hydPower = (density * g * flow * head) / 3600000; // kW
        const shaftPower = hydPower / efficiency;
        
        // Specific Speed Ns (Metric)
        // Ns = n * sqrt(Q) / H^(3/4)  -- using Q in m3/s and H in m
        const Q_s = flow / 3600;
        const ns = (rpm * Math.sqrt(Q_s)) / Math.pow(head, 0.75);

        // Power per stage estimation
        const torque = (shaftPower * 1000) / ((rpm * 2 * Math.PI) / 60);

        return { hydPower, shaftPower, ns, torque };
    }, [flow, head, rpm, efficiency, density]);

    // Helpers
    const toGPM = (m3h: number) => m3h * 4.403;
    const toM3H = (gpm: number) => gpm / 4.403;
    const toFT = (m: number) => m * 3.281;
    const toM = (ft: number) => ft / 3.281;
    const toHP = (kw: number) => kw * 1.341;

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "HI 14.3 / ISO 9906",
        standardTitle: "Rotodynamic Pumps - Hydraulic Performance Acceptance Tests",
        version: "2021",
        assumptions: [
            "Newtonian fluid behavior assumed",
            `Incompressible flow at ${density} kg/m³`,
            "NPSHa must exceed NPSHr (not calculated here)"
        ]
    };

    const status = results.ns > 0 && efficiency > 0 && efficiency <= 1 ? 'valid' : 'invalid';

    return (
        <div className="flex flex-col h-full bg-[#020408] text-slate-200 select-none font-sans">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                            <Droplets size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">HydraNode v2</h1>
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-widest uppercase mt-1">Industrial Hydraulic Solver</p>
                        </div>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setUnit('metric')} className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg ${unit === 'metric' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Metric</button>
                        <button onClick={() => setUnit('imperial')} className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg ${unit === 'imperial' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Imperial</button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Visualizer & Controls */}
                    <div className="space-y-8">
                        <EngineeringVisualization status={status} label="GEOMETRIC CHARACTERISTIC">
                            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[300px] relative bg-[#05080f] rounded-[2.5rem] border border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                                
                                <div className="relative w-48 h-48">
                                    <motion.div 
                                        animate={{ rotate: results.ns > 0 ? 360 : 0 }}
                                        transition={{ duration: 10 / (rpm/1000), repeat: Infinity, ease: "linear" }}
                                        className="w-full h-full rounded-full border-4 border-dashed border-blue-500/20 flex items-center justify-center"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                                        <div className="absolute top-0 w-1 h-12 bg-gradient-to-b from-blue-500 to-transparent" />
                                    </motion.div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Droplets size={64} className="text-blue-500/40" />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-6">
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</div>
                                        <div className="text-sm font-black text-white italic mt-1">{results.ns < 30 ? 'Centrifugal' : results.ns < 100 ? 'Mixed Flow' : 'Axial Flow'}</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">N_s (Metric)</div>
                                        <div className="text-sm font-black text-blue-400 mt-1">{results.ns.toFixed(1)}</div>
                                    </div>
                                </div>
                            </div>
                        </EngineeringVisualization>

                        <div className="grid grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]">
                            <CalculatorInput
                                label={`Flow rate (Q)`}
                                unit={unit === 'metric' ? 'm³/h' : 'GPM'}
                                value={unit === 'metric' ? flow : parseFloat(toGPM(flow).toFixed(1))}
                                onChange={(e) => unit === 'metric' ? setFlow(Number(e.target.value)) : setFlow(toM3H(Number(e.target.value)))}
                            />
                            <CalculatorInput
                                label={`Total Head (H)`}
                                unit={unit === 'metric' ? 'm' : 'ft'}
                                value={unit === 'metric' ? head : parseFloat(toFT(head).toFixed(1))}
                                onChange={(e) => unit === 'metric' ? setHead(Number(e.target.value)) : setHead(toM(Number(e.target.value)))}
                            />
                            <CalculatorInput label="Rotational Speed" unit="RPM" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
                            <CalculatorInput label="Int. Efficiency" unit="η (0-1)" value={efficiency} onChange={(e) => setEfficiency(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Results & Analysis */}
                    <div className="space-y-8">
                        <div className="bg-[#0a0c10] rounded-[3rem] p-10 border border-blue-500/20 shadow-2xl relative overflow-hidden h-full">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                <TrendingUp size={120} />
                            </div>
                            
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12">Performance Summary</h2>

                            <div className="grid grid-cols-1 gap-6">
                                <ResultCard 
                                    label="Hydraulic Output" 
                                    value={unit === 'metric' ? results.hydPower.toFixed(2) : toHP(results.hydPower).toFixed(2)} 
                                    unit={unit === 'metric' ? 'kW' : 'HP'} 
                                    color="#22d3ee"
                                    icon={<Activity size={18}/>}
                                />
                                <ResultCard 
                                    label="Shaft Input (BHP)" 
                                    value={unit === 'metric' ? results.shaftPower.toFixed(2) : toHP(results.shaftPower).toFixed(2)} 
                                    unit={unit === 'metric' ? 'kW' : 'HP'} 
                                    color="#fff"
                                    icon={<Zap size={18}/>}
                                />
                                <ResultCard 
                                    label="Shaft Torque" 
                                    value={results.torque.toFixed(1)} 
                                    unit="N·m" 
                                    color="#60a5fa"
                                    icon={<TrendingUp size={18}/>}
                                />
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5">
                                <AssumptionPanel metadata={metadata} status={status} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResultCard({ label, value, unit, color, icon }: any) {
    return (
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                {icon} {label}
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono tracking-tighter" style={{ color }}>{value}</span>
                <span className="text-sm font-bold text-slate-600 uppercase italic">{unit}</span>
            </div>
        </div>
    );
}
