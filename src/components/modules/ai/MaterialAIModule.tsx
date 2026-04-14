'use client';

import React, { useState, useMemo } from 'react';
import { Search, Zap, Activity, Thermometer, Weight, DollarSign, Database, Bot, ChevronRight, Info } from 'lucide-react';
import { selectMaterials, parseNaturalQuery } from '@/services/material-selector';

export default function MaterialAIModule() {
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    // Hard constraints toggle
    const [constraints, setConstraints] = useState({
        minYield: 0,
        maxDensity: 10000,
        maxTemp: 1000,
        lowCost: false
    });

    const results = useMemo(() => {
        const parsed = parseNaturalQuery(query);
        // Merge natural language parsed criteria with manual constraints if needed
        // For now, let natural query drive the primary search
        return selectMaterials(parsed, 5);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 800);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f18] text-slate-200 overflow-hidden font-mono">
            {/* Header / Search Bar */}
            <div className="p-6 border-b border-cyan-900/30 bg-[#0d1421]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                        <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-widest uppercase">Material Intelligence AI</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Search engine for high-performance engineering materials</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 group-hover:text-purple-400 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. 'high strength lightweight for aerospace' or 'cheap steel for structural'..."
                        className="w-full bg-[#111620] border border-purple-900/30 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all shadow-inner placeholder-slate-600"
                    />
                    {isThinking && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                        </div>
                    )}
                </form>
            </div>

            {/* Main Content Split */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Results */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Database size={12} /> AI Recommended Candidates
                        </h3>
                        <span className="text-[9px] text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {results.length} Matches Found
                        </span>
                    </div>

                    {results.length > 0 ? (
                        results.map((mat, idx) => (
                            <div 
                                key={mat.name} 
                                className="group relative bg-[#0d1421] border border-slate-800 hover:border-purple-500/50 rounded-xl p-5 transition-all cursor-pointer overflow-hidden shadow-lg"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                {/* Background Glow Layer */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">{mat.category}</div>
                                        <div className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{mat.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 uppercase mb-1">Match Score</div>
                                        <div className="text-xl font-black text-purple-500 tabular-nums">{mat.score}</div>
                                    </div>
                                </div>

                                {/* Property Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="p-3 bg-black/40 rounded-lg border border-slate-800/50">
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase mb-1"><Activity size={10} className="text-blue-400" /> Yield</div>
                                        <div className="text-sm font-bold text-slate-200">{mat.yieldStrength} <span className="text-[10px] text-slate-500 font-normal">MPa</span></div>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-lg border border-slate-800/50">
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase mb-1"><Weight size={10} className="text-emerald-400" /> Density</div>
                                        <div className="text-sm font-bold text-slate-200">{mat.density} <span className="text-[10px] text-slate-500 font-normal">kg/m³</span></div>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-lg border border-slate-800/50">
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase mb-1"><Thermometer size={10} className="text-orange-400" /> Max Temp</div>
                                        <div className="text-sm font-bold text-slate-200">{mat.maxServiceTemp} <span className="text-[10px] text-slate-500 font-normal">°C</span></div>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-lg border border-slate-800/50">
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase mb-1"><DollarSign size={10} className="text-yellow-400" /> Cost Index</div>
                                        <div className="flex gap-1 items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={`w-1.5 h-3 rounded-sm ${i < (mat.costIndex / 2) ? 'bg-yellow-500' : 'bg-slate-800'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-purple-400/80 italic">
                                    <Info size={12} /> {mat.reasoning}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">
                            <Zap size={48} className="mb-4 opacity-10" />
                            <p className="text-sm uppercase tracking-widest">Awaiting Engineering Query...</p>
                        </div>
                    )}
                </div>

                {/* Right: Quick Insights Sidebar */}
                <div className="w-80 bg-[#0d1421] border-l border-cyan-900/30 p-6 hidden xl:block overflow-y-auto">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Engine Insights</h3>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                            <h4 className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-2">
                                <Zap size={14} /> Optimization Target
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Our AI ranks materials by applying weighted scoring to physical properties. Multi-objective optimization favors high Specific Strength (Strength/Density).
                            </p>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Trending Materials</h4>
                            <div className="space-y-2">
                                {['Titanium Gr5', 'PEEK', 'AISI 4140'].map(m => (
                                    <div key={m} className="flex items-center justify-between p-2 bg-black/20 rounded-lg hover:bg-black/40 transition-colors cursor-pointer group">
                                        <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{m}</span>
                                        <ChevronRight size={14} className="text-slate-600 group-hover:text-purple-500 transition-all group-hover:translate-x-1" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-6 border-t border-slate-800">
                            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                Export Material Spec
                            </button>
                            <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20">
                                Open FEA Property Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
