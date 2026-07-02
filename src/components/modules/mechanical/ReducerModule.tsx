'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Thermometer, Droplets, Gauge, 
    Zap, Shield, Clock, Database, Info, Settings,
    FileText, AlertTriangle
} from 'lucide-react';
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { CalculatorInput } from "@/components/CalculatorInput";

import { getReducerModuleStrings, formatReducerMaintenance } from '@/locales/reducerModuleTranslations';

export default function ReducerModule({ lang, dict }: { lang: string, dict: any }) {
    const s = getReducerModuleStrings(lang);
    const reducerDict = dict?.reducer || {};
    // Technical State
    const [power, setPower] = useState(7.5); // kW
    const [ratio, setRatio] = useState(31.5);
    const [ambientTemp, setAmbientTemp] = useState(25); // °C
    const [oilType, setOilType] = useState('synthetic'); // mineral | synthetic
    const [hasFan, setHasFan] = useState(true);

    // Advanced ISO TR 14179 Thermal Engine
    const results = useMemo(() => {
        // Output speed & torque
        const n1 = 1450;
        const n2 = n1 / ratio;
        const T2 = (9550 * power) / n2;

        // Effective cooling area estimation (based on torque class)
        const area = Math.pow(T2 / 50, 0.4) * 0.5; // m²
        
        // Heat dissipation coefficient (W/m²K)
        const alpha = hasFan ? 45 : 18;
        
        // Max permissible oil temperature
        const T_oil_limit = oilType === 'synthetic' ? 95 : 80;
        
        // Thermal Power Limit (kW) - Pt = (alpha * A * (T_oil - T_amb)) / 1000
        const Pt = (alpha * area * (T_oil_limit - ambientTemp)) / 1000;
        
        // Estimated Operating Temperature
        const operatingTemp = ambientTemp + (power / (alpha * area)) * 80; // Scaled factor
        
        // Lube Interval Factor (Hours)
        let hours = oilType === 'synthetic' ? 18000 : 6000;
        if (operatingTemp > 80) {
            hours = hours / Math.pow(2, (operatingTemp - 80) / 10);
        }

        return {
            T2,
            Pt,
            operatingTemp,
            oilQuantity: Math.pow(T2 / 100, 0.5) * 2, // Liters approx
            interval: Math.max(1000, Math.round(hours)),
            isCritical: power > Pt
        };
    }, [power, ratio, ambientTemp, oilType, hasFan]);

    return (
        <div className="flex flex-col h-full bg-[#020408] text-slate-200 select-none font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Header Side */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Droplets size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">LubePulse</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">ISO TR 14179 Thermal Monitor</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Visualizer & Configuration */}
                    <div className="space-y-8">
                        <EngineeringVisualization status={results.isCritical ? 'warning' : 'valid'} label={s.thermalCharacteristic}>
                            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[400px] relative bg-[#05080f] rounded-[3rem] border border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]" />
                                
                                <motion.div 
                                    animate={{ scale: [1, 1.02, 1], borderColor: results.isCritical ? ['#ef444433', '#ef444488', '#ef444433'] : [] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-48 h-48 bg-[#0a0f18] border border-white/10 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
                                    <div className="relative flex flex-col items-center">
                                        <Thermometer size={48} className={results.isCritical ? 'text-red-500' : 'text-cyan-400'} />
                                        <span className="text-2xl font-black font-mono mt-4 tabular-nums">{results.operatingTemp.toFixed(0)}°C</span>
                                    </div>
                                    {/* Procedural Oil Level Animation */}
                                    <motion.div 
                                        animate={{ y: [4, 0, 4] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute bottom-0 left-0 w-full h-12 bg-cyan-500/10 backdrop-blur-md" 
                                    />
                                </motion.div>

                                <div className="mt-12 flex gap-8">
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">{s.thermalLimit}</div>
                                        <div className="text-2xl font-black text-white tabular-nums">{results.Pt.toFixed(1)} <span className="text-[10px] text-slate-600">kW</span></div>
                                    </div>
                                    <div className="w-px h-10 bg-white/10" />
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">{s.oilInterval}</div>
                                        <div className="text-2xl font-black text-cyan-400 tabular-nums">{results.interval} <span className="text-[10px] text-slate-600">{s.hr}</span></div>
                                    </div>
                                </div>
                            </div>
                        </EngineeringVisualization>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]">
                            <CalculatorInput label={reducerDict.inputPower || "Transmitted Power"} unit="kW" value={power} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPower(Number(e.target.value))} />
                            <CalculatorInput label={reducerDict.ambientTemp || "Ambient Air Temp"} unit="°C" value={ambientTemp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmbientTemp(Number(e.target.value))} />
                            
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">{s.coolingConfig}</span>
                                <button 
                                    onClick={() => setHasFan(!hasFan)}
                                    className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${hasFan ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
                                >
                                    {hasFan ? s.forcedFan : s.naturalConv}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">{s.lubeStandard}</span>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none"
                                    value={oilType}
                                    onChange={(e) => setOilType(e.target.value)}
                                >
                                    <option value="mineral" className="bg-[#0b121d]">{s.mineralOil}</option>
                                    <option value="synthetic" className="bg-[#0b121d]">{s.syntheticOil}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Summary */}
                    <div className="space-y-8">
                        <div className="bg-[#0a0c10] rounded-[3rem] p-10 border border-cyan-500/20 shadow-2xl relative overflow-hidden min-h-full">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-700 mb-12">{s.transmissionAnalytics}</h2>

                            <div className="grid grid-cols-1 gap-6">
                                <KPIBlock label={s.outputTorque} value={results.T2.toFixed(0)} unit="Nm" color="#fff" />
                                <KPIBlock label={s.estimatedTemp} value={results.operatingTemp.toFixed(1)} unit="°C" color={results.operatingTemp > 85 ? '#ef4444' : '#22d3ee'} />
                                <KPIBlock label={s.lubricantVolume} value={results.oilQuantity.toFixed(2)} unit={s.liters} color="#f59e0b" />
                            </div>

                            <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none"><Gauge size={60}/></div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{s.isoMaintenance}</div>
                                <div className="text-sm font-medium text-slate-400 leading-relaxed">
                                    {formatReducerMaintenance(s, oilType as 'mineral' | 'synthetic', results.operatingTemp, results.interval)}
                                </div>
                            </div>

                            <AnimatePresence>
                                {results.isCritical && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4"
                                    >
                                        <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none">
                                            {s.thermalSaturation}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPIBlock({ label, value, unit, color }: any) {
    return (
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl group hover:bg-white/[0.05] transition-all">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono tracking-tighter transition-colors" style={{ color }}>{value}</span>
                <span className="text-sm font-bold text-slate-600 uppercase italic font-sans">{unit}</span>
            </div>
        </div>
    );
}
