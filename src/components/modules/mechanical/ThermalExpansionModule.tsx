import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertCircle, Thermometer, FlaskConical, MoveVertical, Zap, ScanLine 
} from 'lucide-react';
import { getMaterialCategories, getMaterialsByCategory } from '@/data/materialsData';

export default function ThermalExpansionModule() {
    const [category, setCategory] = useState('Aluminum');
    const [material, setMaterial] = useState('6061-T6 (US Standard)');

    // Thermal parameters
    const [initialLength, setInitialLength] = useState(1000); // mm
    const [t0, setT0] = useState(20); // Initial Temp °C
    const [t1, setT1] = useState(150); // Target Temp °C

    const categories = getMaterialCategories();
    const availableMaterials = getMaterialsByCategory(category);

    // Auto-update default materials
    useEffect(() => {
        if (availableMaterials.length > 0 && !availableMaterials.find(m => m.name === material)) {
            setMaterial(availableMaterials[0].name);
        }
    }, [category, availableMaterials, material]);

    const materialData = useMemo(() => availableMaterials.find(m => m.name === material), [material, availableMaterials]);
    const alpha = materialData?.thermalExp || 23.6; // μm/(m·K)
    const meltingPoint = materialData?.meltingPoint || 580;

    // Physics Calculations (ΔL = α * L0 * ΔT)
    const result = useMemo(() => {
        const deltaT = t1 - t0;
        const deltaL = initialLength * alpha * deltaT * 1e-6;
        const finalLength = initialLength + deltaL;
        const isExpanding = deltaT > 0;
        const isZero = deltaT === 0;

        // Critical Analysis
        let dangerLevel = 'Safe'; // Safe, Caution, Critical
        let dangerMsg = '';

        if (t1 >= meltingPoint) {
            dangerLevel = 'Critical';
            dangerMsg = `Material exceeds absolute melting point (${meltingPoint}°C). Total structural failure imminent.`;
        } else if (category === 'Aluminum' && t1 > 200) {
            dangerLevel = 'Caution';
            dangerMsg = `Caution: Temper loss risk (>200°C). T6/T4 structural strength will degrade significantly.`;
        } else if (category === 'Plastic' && t1 > (meltingPoint * 0.7)) {
            dangerLevel = 'Caution';
            dangerMsg = `Approaching glass transition or heat deflection limit. Loss of rigidity expected.`;
        } else if (Math.abs(deltaT) > 500) {
            dangerLevel = 'Caution';
            dangerMsg = `Extreme thermal shock. Micro-cracking possible depending on part geometry.`;
        }

        return {
            deltaT,
            deltaL: deltaL,
            finalLength: finalLength,
            isExpanding,
            isZero,
            dangerLevel,
            dangerMsg,
            strain: (deltaL / initialLength * 100) // percentage
        };
    }, [initialLength, t0, t1, alpha, meltingPoint, category]);

    const activeColor = result.isZero ? '#a3a3a3' : result.isExpanding ? '#ef4444' : '#3b82f6';
    const activePulse = result.dangerLevel === 'Critical' ? '#ef4444' : result.dangerLevel === 'Caution' ? '#f59e0b' : '#10b981';

    // Visually exaggerated proportion for UI representation
    const getVisualPercent = () => {
        const pct = (result.deltaL / initialLength) * 100 * 40; // Exaggerate 40x
        if (pct === 0) return 0;
        const maxExaggeration = 30; // max 30% of the bar can be the delta
        return Math.min(Math.max(pct, -maxExaggeration), maxExaggeration);
    };

    const visualDelta = getVisualPercent();
    const barBasePct = result.isExpanding ? 100 - visualDelta : 100 - Math.abs(visualDelta); // for UI aesthetic, base is 100-delta if expanding, so delta takes up the rest

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden p-2">
            {/* LEFT PANEL - Control Center (35%) */}
            <div className="w-[35%] h-full flex flex-col bg-[#080d14]/80 rounded-2xl border border-white/5 backdrop-blur-2xl px-6 py-6 overflow-y-auto custom-scrollbar">
                
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                        <FlaskConical size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-100">Thermal Expansion</h2>
                        <p className="text-[10px] text-red-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Thermodynamic Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-orange-400">
                    <MoveVertical size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Material Database</span>
                </div>

                {/* Intelligent Material Selection */}
                <div className="space-y-4 mb-8">
                    <div className="bg-[#0e1622] border border-white/10 rounded-xl p-3 focus-within:border-white/30 transition-all">
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">Alloy Category</label>
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)} 
                            className="w-full px-2 py-1.5 bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                        >
                            {categories.map(c => <option key={c} value={c} className="bg-[#0e1622]">{c}</option>)}
                        </select>
                    </div>

                    <div className="bg-[#0e1622] border border-white/10 rounded-xl p-3 focus-within:border-white/30 transition-all">
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Exact Alloy</label>
                            <span className="text-[9px] font-mono text-orange-400 font-bold bg-orange-400/10 px-1.5 rounded">α = {alpha}</span>
                        </div>
                        <select 
                            value={material} 
                            onChange={e => setMaterial(e.target.value)} 
                            className="w-full px-2 py-1.5 bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                        >
                            {availableMaterials.map(m => <option key={m.name} value={m.name} className="bg-[#0e1622]">{m.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                    <Thermometer size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Temperature Vectors</span>
                </div>

                <div className="space-y-6 flex-1">
                    <PremiumNumBox
                        label="Initial Length (L0)" unit="mm"
                        value={initialLength} min={10} max={10000} step={10}
                        onChange={setInitialLength}
                        color="#a855f7"
                    />
                    <PremiumNumBox
                        label="Initial Temp (T0)" unit="°C"
                        value={t0} min={-100} max={1000} step={5}
                        onChange={setT0}
                        color="#3b82f6"
                    />
                    <PremiumNumBox
                        label="Target Temp (T1)" unit="°C"
                        value={t1} min={-100} max={1500} step={5}
                        onChange={setT1}
                        color={t1 > t0 ? '#ef4444' : '#3b82f6'}
                    />
                </div>
            </div>

            {/* RIGHT PANEL - Live Visualization & Output (65%) */}
            <div className="w-[65%] h-full flex flex-col px-6">
                
                {/* Math Results Header */}
                <div className="flex-none pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div 
                                className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2" 
                                animate={{ color: activePulse }}
                                transition={{ duration: 0.5 }}
                            >
                                <motion.div 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    animate={{ backgroundColor: activePulse, boxShadow: `0 0 15px ${activePulse}` }} 
                                />
                                {result.dangerLevel === 'Critical' ? 'CRITICAL TEMPERATURE REACHED' : result.dangerLevel === 'Caution' ? 'WARNING: ELEVATED RISK' : 'THERMAL EQUILIBRIUM SAFE'}
                            </motion.div>
                            <div className="flex items-baseline gap-4">
                                <motion.div 
                                    className="text-[9rem] font-black italic tracking-tighter leading-none"
                                    style={{ 
                                        color: activeColor,
                                        textShadow: `0 0 40px ${activeColor}40`,
                                    }}
                                    animate={{ color: activeColor, textShadow: `0 0 40px ${activeColor}40` }}
                                >
                                    {result.deltaT > 0 ? '+' : ''}{result.deltaL.toFixed(4)}
                                </motion.div>
                                <span className="text-4xl font-bold text-gray-500 mb-4">mm</span>
                            </div>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Expansion Delta (ΔL)</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 pt-6 text-right">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                <ScanLine size={12} /> Final Rest Length
                            </span>
                            <span className="text-3xl font-mono font-black text-white">{result.finalLength.toFixed(4)} <span className="text-xl text-gray-500">mm</span></span>
                            
                            <div className="mt-4 pt-4 border-t border-white/5 flex gap-6">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-500/80 uppercase tracking-widest">Δ Temperature</p>
                                    <p className="text-xl font-mono font-bold text-gray-300">{result.deltaT > 0 ? '+' : ''}{result.deltaT}°C</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-500/80 uppercase tracking-widest">Melting Pt</p>
                                    <p className="text-xl font-mono font-bold text-gray-300">~{meltingPoint}°C</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3D/Vectors Canvas Area */}
                <div className="flex-1 relative mt-10 mb-8 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner flex flex-col justify-center px-16">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                    <div className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <Zap size={14} /> LIVE EXPANSION FIELD
                    </div>

                    {/* Exaggerated Bar Graphic */}
                    <div className="w-full relative z-10 flex">
                        
                        {/* Static L0 Block */}
                        <div 
                            className="h-16 relative flex items-center justify-center bg-[#151f2e] border-y border-l border-white/10"
                            style={{ width: `${result.isExpanding ? 100 - visualDelta : 100}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        >
                            <div className="absolute inset-x-0 bottom-[-30px] border-l border-r border-[#151f2e] h-4" />
                            <div className="absolute bottom-[-50px] w-full text-center text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
                                L0 = {initialLength} mm
                            </div>
                            <div className="absolute inset-y-0 left-0 w-1 bg-white/20" />
                        </div>

                        {/* Animated Delta Block */}
                        <AnimatePresence>
                            {!result.isZero && (
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${Math.abs(visualDelta)}%` }}
                                    transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                                    className={`h-16 relative overflow-hidden flex items-center justify-center border-y border-r shadow-2xl ${
                                        result.isExpanding 
                                        ? 'bg-red-500/10 border-red-500 shadow-red-500/20' 
                                        : 'bg-blue-500/10 border-blue-500 shadow-blue-500/20 transform -translate-x-full'
                                    }`}
                                    style={!result.isExpanding ? { left: `-${Math.abs(visualDelta)}%`, position: 'absolute' } : {}}
                                >
                                    {/* Laser scan lines effect */}
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
                                    <div className={`absolute top-0 bottom-0 right-0 w-1 ${result.isExpanding ? 'bg-red-400 shadow-[0_0_20px_rgba(248,113,113,1)]' : 'left-0 bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,1)]'}`} />
                                    
                                    <span className={`text-xs font-black font-mono shrink-0 whitespace-nowrap z-10 px-2 ${result.isExpanding ? 'text-red-400' : 'text-blue-400'}`}>
                                        {result.deltaT > 0 ? '+' : ''}{result.deltaL.toFixed(2)}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Contraction Indicator Base Border */}
                        {!result.isExpanding && !result.isZero && (
                             <motion.div 
                                className="h-16 border-y border-r border-dashed border-white/20"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.abs(visualDelta)}%` }}
                                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                             />
                        )}

                    </div>

                    {/* Threat Indicator glow based on heat */}
                    {result.deltaT > 0 && (
                        <div 
                            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none transition-opacity duration-1000"
                            style={{ 
                                background: `linear-gradient(to top, rgba(239, 68, 68, ${Math.min(result.deltaT / 1000, 0.4)}) , transparent)` 
                            }}
                        />
                    )}
                </div>

                {/* Warning Footer */}
                <AnimatePresence>
                    {result.dangerLevel !== 'Safe' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={`flex-none rounded-2xl p-4 flex items-center gap-4 shadow-2xl border ${
                                result.dangerLevel === 'Critical' 
                                ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                            }`}
                        >
                            <AlertCircle className="shrink-0 animate-pulse" size={32} />
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em]">{result.dangerLevel} THRESHOLD ALERT</p>
                                <p className="text-[11px] opacity-80 mt-1">{result.dangerMsg}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Custom Premium Input Control (Identical logic to Beam module)
function PremiumNumBox({ label, unit, value, min, max, step, onChange, color }: any) {
    return (
        <div className="group relative">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-white transition-colors">{label}</span>
            </div>
            
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-white/30 group-focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-lg font-black font-mono px-4 py-3 text-white outline-none appearance-none"
                    style={{ textShadow: `0 0 10px ${color}40` }}
                />
                <div className="px-4 text-[10px] font-bold text-gray-500 border-l border-white/5 bg-white/[0.02] h-full flex flex-col justify-center items-center">
                    <span style={{ color }}>{unit}</span>
                </div>
            </div>
            
            <div className="mt-3 px-1">
                <input
                    type="range" min={min} max={max} step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}
