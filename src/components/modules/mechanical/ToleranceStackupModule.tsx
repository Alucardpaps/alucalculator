'use client';

import React, { useState, useMemo } from 'react';
import { Settings, Layers, Plus, Trash2 } from 'lucide-react';

interface Dimension {
    id: string;
    name: string;
    mean: number;
    tolerance: number; // symmetric +/- for simplicity
    direction: 1 | -1; // 1 for addition, -1 for subtraction
}

export default function ToleranceStackupModule() {
    const [dimensions, setDimensions] = useState<Dimension[]>([
        { id: '1', name: 'Part A', mean: 50.00, tolerance: 0.10, direction: 1 },
        { id: '2', name: 'Part B', mean: 25.00, tolerance: 0.05, direction: 1 },
        { id: '3', name: 'Gap C', mean: 10.00, tolerance: 0.05, direction: -1 },
    ]);

    const addDimension = () => {
        setDimensions([...dimensions, {
            id: Date.now().toString(),
            name: `Part ${String.fromCharCode(65 + dimensions.length)}`,
            mean: 10.00,
            tolerance: 0.05,
            direction: 1
        }]);
    };

    const updateDim = (id: string, field: keyof Dimension, value: any) => {
        setDimensions(dimensions.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const removeDim = (id: string) => {
        setDimensions(dimensions.filter(d => d.id !== id));
    };

    const results = useMemo(() => {
        let nominal = 0;
        let worstCaseTol = 0;
        let rssVariance = 0;

        dimensions.forEach(d => {
            nominal += d.mean * d.direction;
            worstCaseTol += d.tolerance; // tolerances always add
            rssVariance += Math.pow(d.tolerance, 2);
        });

        const rssTol = Math.sqrt(rssVariance);

        return {
            nominal,
            worstCaseMax: nominal + worstCaseTol,
            worstCaseMin: nominal - worstCaseTol,
            worstCaseTol,
            rssMax: nominal + rssTol,
            rssMin: nominal - rssTol,
            rssTol
        };
    }, [dimensions]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            <div className="w-full lg:w-[450px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-indigo-500/10 to-transparent">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black italic tracking-tighter uppercase">Stackup</h1>
                                <p className="text-[10px] text-indigo-500/60 font-mono tracking-widest uppercase">1D Tolerance Analysis</p>
                            </div>
                        </div>
                        <button onClick={addDimension} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {dimensions.map((dim, idx) => (
                        <div key={dim.id} className="bg-white/5 border border-white/10 rounded-xl p-4 relative group">
                            <button onClick={() => removeDim(dim.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                            </button>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-[10px] font-black uppercase text-gray-500">#{idx + 1}</div>
                                <input type="text" value={dim.name} onChange={e => updateDim(dim.id, 'name', e.target.value)} className="bg-transparent border-b border-white/10 text-sm outline-none font-bold text-indigo-300 w-24" />
                                <div className="flex-1" />
                                <button onClick={() => updateDim(dim.id, 'direction', dim.direction === 1 ? -1 : 1)} className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest ${dim.direction === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {dim.direction === 1 ? '+ Add' : '- Sub'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Mean (mm)</label>
                                    <input type="number" step="0.01" value={dim.mean} onChange={e => updateDim(dim.id, 'mean', Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Tol (± mm)</label>
                                    <input type="number" step="0.01" value={dim.tolerance} onChange={e => updateDim(dim.id, 'tolerance', Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-indigo-500/10" />
                
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[250px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 overflow-hidden">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-indigo-400">Nominal Dimension</div>
                    <div className="text-7xl font-mono font-black tracking-tighter text-white">
                        {results.nominal.toFixed(3)}<span className="text-3xl text-gray-500 font-sans ml-2">mm</span>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Worst Case */}
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-4 border-b border-white/5 pb-2">Worst Case (WC) Analysis</div>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">WC Tolerance (±)</div>
                                <div className="text-3xl font-mono font-black text-rose-400">
                                    {results.worstCaseTol.toFixed(3)} <span className="text-sm font-sans text-rose-400/50">mm</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">WC Min</div>
                                    <div className="text-lg font-mono text-white">{results.worstCaseMin.toFixed(3)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">WC Max</div>
                                    <div className="text-lg font-mono text-white">{results.worstCaseMax.toFixed(3)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RSS */}
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-4 border-b border-white/5 pb-2">Root Sum Square (RSS)</div>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">RSS Tolerance (±)</div>
                                <div className="text-3xl font-mono font-black text-emerald-400">
                                    {results.rssTol.toFixed(3)} <span className="text-sm font-sans text-emerald-400/50">mm</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">RSS Min</div>
                                    <div className="text-lg font-mono text-white">{results.rssMin.toFixed(3)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">RSS Max</div>
                                    <div className="text-lg font-mono text-white">{results.rssMax.toFixed(3)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
