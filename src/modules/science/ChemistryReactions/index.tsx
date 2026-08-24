'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FlaskConical, Beaker, Atom, Activity, 
    Thermometer, Droplets, Info, Search, 
    Database, Save, Play, RefreshCcw, X, AlertTriangle, Zap
} from 'lucide-react';

type Reagent = {
    id: string;
    name: string;
    formula: string;
    stability: number;
    temp: number;
    color: string;
};

const REAGENTS: Reagent[] = [
    { id: 'h2so4', name: 'Sulfuric Acid', formula: 'H2SO4', stability: 0.98, temp: 22, color: '#fb923c' },
    { id: 'naoh', name: 'Sodium Hydroxide', formula: 'NaOH', stability: 0.94, temp: 24, color: '#38bdf8' },
    { id: 'hno3', name: 'Nitric Acid', formula: 'HNO3', stability: 0.85, temp: 18, color: '#f472b6' },
    { id: 'hcl', name: 'Hydrochloric Acid', formula: 'HCl', stability: 0.99, temp: 21, color: '#a3e635' },
    { id: 'h2o', name: 'Water', formula: 'H2O', stability: 1.0, temp: 20, color: '#60a5fa' },
    { id: 'na', name: 'Sodium Metal', formula: 'Na', stability: 0.45, temp: 20, color: '#94a3b8' },
    { id: 'ch4', name: 'Methane', formula: 'CH4', stability: 0.95, temp: -162, color: '#c084fc' },
    { id: 'o2', name: 'Oxygen', formula: 'O2', stability: 1.0, temp: -183, color: '#818cf8' },
];

type ReactionResult = {
    products: string[];
    equation?: string;
    type: string;
    enthalpy: number;
    description: string;
    chartData: number[];
    isSafe: boolean;
};

import { ReactionEngine } from '@/engine/science/ReactionEngine';

const REACTION_DB: Record<string, ReactionResult> = {
    "hcl,naoh": {
        products: ["NaCl", "H2O"],
        type: "Neutralization",
        enthalpy: -57.1,
        description: "Strong acid and strong base react to form salt and water. Exothermic reaction.",
        chartData: [40, 80, 75, 70, 65, 60, 50, 45, 40, 40],
        isSafe: true
    },
    "h2so4,naoh": {
        products: ["Na2SO4", "H2O"],
        type: "Neutralization",
        enthalpy: -114.2,
        description: "Diprotic acid neutralization. Highly exothermic.",
        chartData: [40, 95, 90, 80, 70, 60, 50, 45, 40, 40],
        isSafe: true
    },
    "h2o,na": {
        products: ["NaOH", "H2"],
        type: "Single Displacement / Violent",
        enthalpy: -368.6,
        description: "Violent exothermic reaction of sodium metal with water, releasing hydrogen gas.",
        chartData: [40, 100, 100, 95, 80, 60, 40, 30, 25, 20],
        isSafe: false
    },
    "ch4,o2": {
        products: ["CO2", "H2O"],
        type: "Combustion",
        enthalpy: -890.4,
        description: "Methane burns in oxygen producing CO2, water, and significant heat energy.",
        chartData: [20, 100, 100, 90, 70, 50, 30, 20, 10, 10],
        isSafe: false
    }
};

export default function ChemistryReactions() {
    const [activeTab, setActiveTab] = useState('synthesizer');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Core state
    const [selectedReagentIds, setSelectedReagentIds] = useState<string[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [result, setResult] = useState<ReactionResult | null>(null);

    const filteredReagents = REAGENTS.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.formula.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeReagents = selectedReagentIds.map(id => REAGENTS.find(r => r.id === id)!);

    const toggleReagent = (id: string) => {
        if (isSimulating) return; // Lock while simulating
        
        setSelectedReagentIds(prev => {
            if (prev.includes(id)) {
                setResult(null); // Clear result if removing a reagent
                return prev.filter(r => r !== id);
            }
            if (prev.length >= 2) {
                // Max 2 reagents for now
                setResult(null);
                return [prev[1], id];
            }
            return [...prev, id];
        });
    };

    const runSimulation = () => {
        if (selectedReagentIds.length === 0) return;
        
        setIsSimulating(true);
        setResult(null);

        // Sort IDs conceptually to match dictionary keys
        const sortedKey = [...selectedReagentIds].sort().join(',');
        
        setTimeout(() => {
            const reactionData = REACTION_DB[sortedKey];
            if (reactionData) {
                // Dynamically balance the reaction
                const reactantsFormulas = activeReagents.map(r => r.formula);
                const coeffs = ReactionEngine.balance(reactantsFormulas, reactionData.products);
                
                let eqStr = "Balancing failed...";
                if (coeffs) {
                    eqStr = ReactionEngine.formatEquation(reactantsFormulas, reactionData.products, coeffs);
                }

                setResult({
                    ...reactionData,
                    equation: eqStr
                });
            } else {
                setResult({
                    products: [],
                    equation: "No Reaction Occurs",
                    type: "Inert",
                    enthalpy: 0,
                    description: "These reagents do not react under standard conditions (STP).",
                    chartData: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
                    isSafe: true
                });
            }
            setIsSimulating(false);
        }, 1500); // 1.5s simulation delay
    };

    const clearCore = () => {
        setSelectedReagentIds([]);
        setResult(null);
        setIsSimulating(false);
    };

    // Default chart data when no result
    const chartData = result ? result.chartData : [40, 60, 45, 70, 90, 65, 50, 80, 55, 40];

    return (
        <div className="flex w-full h-full bg-[#050608] text-white overflow-hidden relative">
            {/* LEFT SIDEBAR: Inventory & Controls */}
            <div className="w-[320px] bg-[#0c1017]/80 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-20">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                            <FlaskConical className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-widest uppercase italic">Lab Workstation</h1>
                            <div className="text-[10px] text-emerald-500/60 font-mono tracking-widest leading-none mt-1">CHEM-REACT V2.2</div>
                        </div>
                    </div>

                    <div className="relative group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search compounds..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-xs font-medium focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <div className="px-2">
                        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Reagent Inventory</h3>
                        <div className="space-y-2">
                            {filteredReagents.map(rg => {
                                const isSelected = selectedReagentIds.includes(rg.id);
                                return (
                                    <div 
                                        key={rg.id} 
                                        onClick={() => toggleReagent(rg.id)}
                                        className={`p-3 border rounded-xl transition-all group cursor-pointer relative overflow-hidden
                                            ${isSelected ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/30'}
                                        `}
                                    >
                                        {isSelected && <div className="absolute inset-0 bg-emerald-500/5" />}
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className={`text-[11px] font-bold transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-300 group-hover:text-emerald-400'}`}>
                                                {rg.name}
                                            </div>
                                            <div className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/10 text-emerald-500/60'}`}>
                                                {ReactionEngine.formatHTMLSubscripts(rg.formula)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="flex items-center gap-1.5 flex-1">
                                                <div className={`h-1 rounded-full flex-1 overflow-hidden ${isSelected ? 'bg-emerald-900/40' : 'bg-slate-800'}`}>
                                                    <div 
                                                        className="h-full transition-all duration-1000" 
                                                        style={{ width: `${rg.stability * 100}%`, backgroundColor: rg.color }} 
                                                    />
                                                </div>
                                                <span className="text-[8px] font-mono text-slate-600">{(rg.stability * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Thermometer size={10} />
                                                <span className="text-[9px] font-mono">{rg.temp}°C</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 flex gap-2">
                    <button 
                        onClick={clearCore}
                        className="flex-1 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-[10px] font-black tracking-widest uppercase rounded-lg border border-rose-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={12} /> Reset Core
                    </button>
                </div>
            </div>

            {/* MAIN AREA: Canvas & Detailed View */}
            <div className="flex-1 flex flex-col relative z-10">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                <div className="h-16 border-b border-white/5 bg-[#080b11]/80 backdrop-blur-md px-8 flex items-center justify-between relative z-20">
                    <div className="flex items-center gap-6">
                        {['synthesizer', 'spectroscopy', 'thermodynamic'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-5 ${activeTab === tab ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab}
                                {activeTab === tab && <motion.div layoutId="chemtab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <Save size={16} />
                        </button>
                        <button 
                            onClick={runSimulation}
                            disabled={selectedReagentIds.length === 0 || isSimulating}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-xl transition-all
                                ${selectedReagentIds.length > 0 && !isSimulating 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20 active:scale-95' 
                                    : 'bg-emerald-900/30 text-emerald-700 cursor-not-allowed border border-emerald-900/50'
                                }
                            `}
                        >
                            {isSimulating ? (
                                <RefreshCcw size={14} className="animate-spin" />
                            ) : (
                                <Play size={14} fill="currentColor" />
                            )}
                            {isSimulating ? 'Computing...' : 'Run Simulation'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-hidden flex items-center justify-center relative z-10">
                    <div className="w-full max-w-5xl h-full flex flex-col relative">
                        
                        <div className="flex-1 grid grid-cols-12 gap-6 mb-6">
                            {/* Synthesis Area */}
                            <div className={`col-span-8 bg-white/[0.01] border rounded-[32px] relative overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-all duration-700
                                ${result && !result.isSafe ? 'border-rose-500/40 shadow-rose-900/20' : result ? 'border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.05)]' : 'border-white/10'}
                            `}>
                                {/* Background glow reacting to simulation */}
                                <div className={`absolute inset-0 transition-opacity duration-1000 
                                    ${isSimulating ? 'bg-emerald-500/5 opacity-100 animate-pulse' : 
                                      result ? (result.isSafe ? 'bg-emerald-500/[0.02] opacity-100' : 'bg-rose-500/[0.05] opacity-100') : 
                                      'opacity-0'}
                                `} />
                                
                                <div className="relative z-10 flex flex-col items-center w-full px-12">
                                    <div className="w-32 h-32 border border-emerald-500/20 rounded-full flex items-center justify-center p-4 mb-8 relative">
                                        <div className={`absolute inset-0 rounded-full opacity-20 ${isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500/10'}`} />
                                        <div className={`w-full h-full bg-[#0c1017] rounded-full border flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.1)] transition-colors duration-500
                                            ${isSimulating ? 'border-emerald-400 text-emerald-300' : 
                                              result && !result.isSafe ? 'border-rose-500/50 text-rose-500' : 
                                              'border-emerald-500/30 text-emerald-400'}
                                        `}>
                                            <Atom size={48} className={isSimulating ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_10s_linear_infinite]'} />
                                        </div>
                                    </div>
                                    
                                    {/* Active Reagents Display */}
                                    <div className="flex items-center justify-center gap-6 mb-8 w-full h-16">
                                        <AnimatePresence>
                                            {activeReagents.length === 0 && !result && (
                                                <motion.p 
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="text-slate-500 text-xs font-medium max-w-xs text-center leading-relaxed absolute"
                                                >
                                                    Select compounds from inventory to begin stochiometric balancing and enthalpy calculation.
                                                </motion.p>
                                            )}
                                        </AnimatePresence>

                                        {!result && activeReagents.map((rg, index) => (
                                            <React.Fragment key={`active-${rg.id}`}>
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 backdrop-blur-md"
                                                >
                                                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: rg.color, color: rg.color }} />
                                                    <span className="font-mono font-bold text-lg text-white">{ReactionEngine.formatHTMLSubscripts(rg.formula)}</span>
                                                    <button 
                                                        onClick={() => toggleReagent(rg.id)}
                                                        className="ml-2 text-slate-500 hover:text-rose-400 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </motion.div>
                                                {index < activeReagents.length - 1 && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500/50 font-black text-xl">+</motion.div>
                                                )}
                                            </React.Fragment>
                                        ))}

                                        {/* Result Display */}
                                        {result && !isSimulating && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                                className="w-full flex justify-center"
                                            >
                                                <div className={`px-8 py-4 rounded-2xl border backdrop-blur-xl
                                                    ${result.isSafe ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-rose-900/20 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]'}
                                                `}>
                                                    <div className="text-2xl font-mono font-bold text-white tracking-wider flex items-center gap-4">
                                                        {result.equation}
                                                        {!result.isSafe && <AlertTriangle className="text-rose-500" size={24} />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                    
                                    {/* Subtext info for result */}
                                    <div className="h-10 text-center flex items-end justify-center">
                                        {result && !isSimulating && (
                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm font-medium ${result.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {result.description}
                                            </motion.p>
                                        )}
                                        {isSimulating && (
                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-sm font-mono tracking-widest uppercase animate-pulse">
                                                Calculating Stochiometry...
                                            </motion.p>
                                        )}
                                    </div>
                                </div>

                                {/* Corner Decos */}
                                <div className="absolute top-8 left-8 text-[8px] font-mono text-emerald-500/30 uppercase tracking-[0.3em]">Module: Synthesis_01</div>
                                <div className="absolute bottom-8 right-8 flex gap-3 text-emerald-500/20">
                                    {result && !result.isSafe ? <AlertTriangle size={24} className="text-rose-500/20" /> : <Beaker size={24} />}
                                    <Droplets size={24} />
                                </div>
                            </div>

                            {/* Secondary Metrics */}
                            <div className="col-span-4 flex flex-col gap-6">
                                {/* Enthalpy Chart */}
                                <div className="flex-1 bg-white/[0.01] border border-white/10 rounded-3xl p-6 relative group overflow-hidden flex flex-col justify-between">
                                     <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Enthalpy Curve</h3>
                                        <Activity size={14} className={isSimulating ? 'text-emerald-400 animate-spin' : 'text-emerald-500/50'} />
                                     </div>
                                     <div className="h-24 flex items-end gap-1 px-1 relative">
                                        {result && !isSimulating && (
                                            <div className="absolute top-0 left-2 text-[10px] font-mono text-emerald-400/80 bg-emerald-900/30 px-2 py-1 rounded">
                                                ΔH: {result.enthalpy} kJ
                                            </div>
                                        )}
                                        {chartData.map((h, i) => (
                                             <motion.div 
                                                key={`bar-${i}-${result ? 'res' : 'emp'}`}
                                                initial={{ height: '0%' }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.05, type: 'spring' }}
                                                className={`flex-1 rounded-t-sm ${isSimulating ? 'bg-emerald-500/20 animate-pulse' : (result && !result.isSafe ? 'bg-rose-500/40' : 'bg-emerald-500/40')}`} 
                                            />
                                        ))}
                                     </div>
                                </div>
                                
                                {/* Parameters */}
                                <div className="flex-1 bg-white/[0.01] border border-white/10 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Safety Parameters</h3>
                                        {result && !result.isSafe && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-slate-500">Pressure</span>
                                            <span className="text-slate-300">{result ? (result.isSafe ? '1.02 bar' : '18.4 bar (CRITICAL)') : '1.00 bar'}</span>
                                        </div>
                                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                            <motion.div 
                                                className={`h-full ${result && !result.isSafe ? 'bg-rose-500' : 'bg-emerald-500/60'}`} 
                                                initial={{ width: '35%' }}
                                                animate={{ width: result ? (result.isSafe ? '45%' : '95%') : '35%' }}
                                                transition={{ duration: 1 }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold mt-2 pt-2 border-t border-white/5">
                                            <span className="text-slate-500">Thermodynamic State</span>
                                            <span className={result && result.enthalpy < 0 ? 'text-amber-500' : 'text-slate-400'}>
                                                {result ? (result.enthalpy < 0 ? 'Highly Exothermic' : 'Endothermic/Inert') : 'Stable'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Bar */}
                        <div className={`border rounded-2xl px-6 py-4 flex items-center justify-between transition-colors
                            ${result && !result.isSafe ? 'bg-rose-500/10 border-rose-500/20' : 'bg-[#05a5a5]/10 border-emerald-500/20'}
                        `}>
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]
                                    ${result && !result.isSafe ? 'bg-rose-500 text-rose-500' : 'bg-emerald-500 text-emerald-500'}
                                `} />
                                <span className={`text-[10px] font-black uppercase tracking-widest
                                    ${result && !result.isSafe ? 'text-rose-400' : 'text-emerald-400'}
                                `}>
                                    {isSimulating ? 'SYSTEM BUSY: RUNNING KINETICS...' : 
                                     result ? `REACTION COMPLETE: ${result.type.toUpperCase()}` : 
                                     'System Ready: Waiting for input reagents...'}
                                </span>
                            </div>
                            <div className="flex gap-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                <span className={result && !result.isSafe ? 'text-rose-500' : ''}>PID-CTRL: {result && !result.isSafe ? 'OVERRIDE' : 'ACTIVE'}</span>
                                <span>SPECTRA: STANDBY</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

