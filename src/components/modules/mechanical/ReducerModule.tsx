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

import { SidebarAnimatedIcon } from '@/components/ui/SidebarAnimatedIcon';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export default function ReducerModule({ lang, dict }: { lang: string, dict: any }) {
    const precision = useGlobalPrecision();
    const s = getReducerModuleStrings(lang);
    const reducerDict = dict?.reducer || {};

    // Technical State
    const [power, setPower] = useState(7.5); // kW
    const [ratio, setRatio] = useState(31.5);
    const [ambientTemp, setAmbientTemp] = useState(25); // °C
    const [oilType, setOilType] = useState('synthetic'); // mineral | synthetic
    const [hasFan, setHasFan] = useState(true);

    // Deterministic ISO/TR 14179 Thermal Engine
    const results = useMemo(() => {
        // Output speed & torque
        const n1 = 1450; // Standard 4-pole motor speed (rpm)
        const safeRatio = Math.max(ratio, 0.5);
        const n2 = n1 / safeRatio;
        const T2 = n2 > 0 ? (9550 * power) / n2 : 0; // Nm

        // Gearbox stages determined by ratio (ISO standard sizing)
        const stages = safeRatio <= 6 ? 1 : safeRatio <= 45 ? 2 : 3;

        // 1. Gear mesh friction loss (ISO/TR 14179-1: eta_mesh ~ 0.985 per helical stage)
        const eta_mesh = Math.pow(0.985, stages);
        const Pv_mesh = power * (1 - eta_mesh); // kW

        // 2. Rolling bearing friction losses (2 bearings per shaft)
        const Pv_bearing = 0.005 * power * (stages + 1); // kW

        // 3. Radial shaft seal friction loss (DIN 3760)
        const Pv_seal = 0.03 * (stages + 1); // kW

        // 4. Lubricant churning & windage losses (viscosity dependent)
        const churningFactor = oilType === 'synthetic' ? 0.008 : 0.012;
        const Pv_churn = power * churningFactor; // kW

        // Total power loss Pv (kW) per ISO/TR 14179
        const Pv_total = Pv_mesh + Pv_bearing + Pv_seal + Pv_churn;
        const lossFraction = power > 0 ? Math.min(0.30, Math.max(0.01, Pv_total / power)) : 0.03;
        const totalEfficiency = Math.max(0.70, 1 - lossFraction);

        // Effective cooling surface area estimation (based on torque class & housing size)
        const area = Math.max(0.2, Math.pow(Math.max(T2, 10) / 50, 0.4) * 0.5); // m²
        
        // Heat dissipation coefficient alpha (W/m²K) per ISO/TR 14179
        // Natural convection: 18 W/m²K, forced fan cooling: 45 W/m²K
        const alpha = hasFan ? 45 : 18;
        
        // Max permissible oil sump temperature per ISO/TR 14179
        const T_oil_limit = oilType === 'synthetic' ? 95 : 80; // °C
        
        // Maximum convective heat dissipation capacity at limit temperature (kW)
        const Q_max = (alpha * area * Math.max(0, T_oil_limit - ambientTemp)) / 1000;
        
        // Thermal Power Limit (kW) - Mechanical input power where Pv equals Q_max
        const Pt = lossFraction > 0 ? Q_max / lossFraction : 0;
        
        // Steady-state Operating Temperature (°C) from heat balance:
        // Pv * 1000 = alpha * area * (T_operating - T_amb)
        const deltaT = (Pv_total * 1000) / (alpha * area);
        const operatingTemp = ambientTemp + deltaT;
        
        // Lubricant Interval Factor (Hours) based on Arrhenius rate (half-life per 10°C over 80°C)
        let hours = oilType === 'synthetic' ? 18000 : 6000;
        if (operatingTemp > 80) {
            hours = hours / Math.pow(2, (operatingTemp - 80) / 10);
        }

        return {
            T2,
            Pt,
            Pv_total,
            totalEfficiency,
            operatingTemp,
            oilQuantity: Math.pow(Math.max(T2, 10) / 100, 0.5) * 2, // Liters approx
            interval: Math.max(1000, Math.round(hours)),
            isCritical: power > Pt || operatingTemp > T_oil_limit
        };
    }, [power, ratio, ambientTemp, oilType, hasFan]);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-0)] text-slate-200 select-none font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Header Side */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5 group cursor-default">
                        <SidebarAnimatedIcon itemId="reducer-lubrication" size={36} color="#00e5ff" />
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-white group-hover:text-cyan-300 transition-colors">LubePulse</h1>
                            <p className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase mt-1">ISO/TR 14179 Thermal Engine</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Visualizer & Configuration */}
                    <div className="space-y-8">
                        <EngineeringVisualization status={results.isCritical ? 'warning' : 'valid'} label={s.thermalCharacteristic}>
                            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[400px] relative bg-[var(--bg-0)] rounded-xl border border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.04)_0%,transparent_70%)]" />
                                
                                <motion.div 
                                    animate={{ scale: [1, 1.02, 1], borderColor: results.isCritical ? ['#ef444444', '#ef444499', '#ef444444'] : ['#00e5ff33', '#00e5ff66', '#00e5ff33'] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-52 h-52 bg-[var(--bg-1)] border rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/5" />
                                    
                                    <div className="relative flex flex-col items-center z-10">
                                        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-inner">
                                            <Thermometer size={42} className={results.isCritical ? 'text-rose-500 animate-pulse' : 'text-cyan-400'} />
                                        </div>
                                        <span className="text-3xl font-black font-mono mt-3 tabular-nums text-white tracking-tight">
                                            {formatEngineeringValue(results.operatingTemp, precision, false)}°C
                                        </span>
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                                            {results.isCritical ? 'OVERHEAT' : 'STABLE TEMP'}
                                        </span>
                                    </div>
                                    
                                    {/* Procedural Oil Wave Level Animation */}
                                    <motion.div 
                                        animate={{ y: [6, 0, 6] }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute bottom-0 left-0 w-full h-16 " 
                                    />
                                </motion.div>

                                <div className="mt-10 flex gap-8">
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">{s.thermalLimit}</div>
                                        <div className="text-2xl font-black text-white tabular-nums">{formatEngineeringValue(results.Pt, precision, false)} <span className="text-[10px] text-slate-600">kW</span></div>
                                    </div>
                                    <div className="w-px h-10 bg-white/10" />
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">{s.oilInterval}</div>
                                        <div className="text-2xl font-black text-cyan-400 tabular-nums">{results.interval} <span className="text-[10px] text-slate-600">{s.hr}</span></div>
                                    </div>
                                </div>
                            </div>
                        </EngineeringVisualization>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-xl">
                            <CalculatorInput label={reducerDict.inputPower || "Transmitted Power"} unit="kW" value={power} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPower(Number(e.target.value))} />
                            <CalculatorInput label={reducerDict.ambientTemp || "Ambient Air Temp"} unit="°C" value={ambientTemp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmbientTemp(Number(e.target.value))} />
                            <CalculatorInput label={reducerDict.ratio || "Gear Ratio (i)"} unit="" value={ratio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRatio(Math.max(1, Number(e.target.value)))} />
                            
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">{s.coolingConfig}</span>
                                <button 
                                    onClick={() => setHasFan(!hasFan)}
                                    className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${hasFan ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
                                >
                                    {hasFan ? s.forcedFan : s.naturalConv}
                                </button>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">{s.lubeStandard}</span>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none"
                                    value={oilType}
                                    onChange={(e) => setOilType(e.target.value)}
                                >
                                    <option value="mineral" className="bg-[var(--bg-1)]">{s.mineralOil}</option>
                                    <option value="synthetic" className="bg-[var(--bg-1)]">{s.syntheticOil}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Summary */}
                    <div className="space-y-8">
                        <div className="bg-[var(--bg-1)] rounded-xl p-10 border border-cyan-500/20 shadow-2xl relative overflow-hidden min-h-full">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-700 mb-8">{s.transmissionAnalytics}</h2>

                            <div className="grid grid-cols-1 gap-5">
                                <KPIBlock label={s.outputTorque} value={formatEngineeringValue(results.T2, precision, false)} unit="Nm" color="#fff" />
                                <KPIBlock label={s.estimatedTemp} value={formatEngineeringValue(results.operatingTemp, precision, false)} unit="°C" color={results.operatingTemp > 85 ? '#ef4444' : '#22d3ee'} />
                                <KPIBlock label="Total Power Loss (Pv)" value={formatEngineeringValue(results.Pv_total, precision, false)} unit="kW" color="#38bdf8" />
                                <KPIBlock label={s.lubricantVolume} value={formatEngineeringValue(results.oilQuantity, precision, false)} unit={s.liters} color="#f59e0b" />
                            </div>

                            <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none"><Gauge size={60}/></div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.isoMaintenance} (ISO/TR 14179)</div>
                                <div className="text-xs font-medium text-slate-400 leading-relaxed">
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
        <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl group hover:bg-white/[0.05] transition-all">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tighter transition-colors" style={{ color }}>{value}</span>
                <span className="text-xs font-bold text-slate-600 uppercase italic font-sans">{unit}</span>
            </div>
        </div>
    );
}
