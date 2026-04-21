'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Cpu, Activity, Zap, Play, RotateCcw, 
    Layers, Settings, Info, Box, Plus, 
    Trash2, ChevronRight, Terminal
} from 'lucide-react';

type GateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'BUFFER';

interface Gate {
    id: string;
    type: GateType;
    inputs: (boolean | string)[]; // boolean for static, string for gate link
    output: boolean;
    x: number;
    y: number;
}

export default function DigitalLogicModule() {
    const [gates, setGates] = useState<Gate[]>([
        { id: 'g1', type: 'AND', inputs: [true, false], output: false, x: 100, y: 100 },
        { id: 'g2', type: 'NOT', inputs: ['g1'], output: false, x: 300, y: 100 }
    ]);
    const [history, setHistory] = useState<boolean[][]>([]); // For Oscilloscope

    const [dragId, setDragId] = useState<string | null>(null);

    // Live Logic Resolution
    const resolvedGates = useMemo(() => {
        const temp = [...gates];
        
        // Simple iterative solver (for small non-cyclic circuits)
        for(let iter=0; iter<5; iter++) {
            temp.forEach(g => {
                const inputVals = g.inputs.map(inp => {
                    if (typeof inp === 'boolean') return inp;
                    const source = temp.find(s => s.id === inp);
                    return source ? source.output : false;
                });

                if (g.type === 'AND') g.output = inputVals[0] && inputVals[1];
                else if (g.type === 'OR') g.output = inputVals[0] || inputVals[1];
                else if (g.type === 'NOT') g.output = !inputVals[0];
                else if (g.type === 'XOR') g.output = (inputVals[0] || inputVals[1]) && !(inputVals[0] && inputVals[1]);
                else if (g.type === 'NAND') g.output = !(inputVals[0] && inputVals[1]);
                else if (g.type === 'BUFFER') g.output = !!inputVals[0];
            });
        }
        return temp;
    }, [gates]);

    // Update history for Oscilloscope
    useEffect(() => {
        setHistory(prev => {
            const currentStates = resolvedGates.map(g => g.output);
            const newHistory = [...prev, currentStates].slice(-50); // Keep last 50 ticks
            return newHistory;
        });
    }, [resolvedGates]);

    const handleDrag = (id: string, x: number, y: number) => {
        setGates(prev => prev.map(g => g.id === id ? { ...g, x, y } : g));
    };

    const addGate = (type: GateType) => {
        const newGate: Gate = {
            id: `g${gates.length + 1}`,
            type,
            inputs: type === 'NOT' || type === 'BUFFER' ? [false] : [false, false],
            output: false,
            x: 100 + Math.random() * 50,
            y: 300 + Math.random() * 50
        };
        setGates([...gates, newGate]);
    };

    const toggleInput = (gateId: string, index: number) => {
        setGates(gates.map(g => {
            if (g.id === gateId) {
                const newInp = [...g.inputs];
                newInp[index] = !newInp[index];
                return { ...g, inputs: newInp };
            }
            return g;
        }));
    };

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-emerald-500/30 font-sans">
            {/* Background Data Stream Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />

            {/* SIDEBAR: Components & Registry */}
            <div className="w-[320px] bg-[#05080f]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-emerald-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none text-white">Logic Lab</h1>
                            <p className="text-[10px] text-emerald-500/60 font-mono tracking-widest uppercase mt-1">Binary Systems v2.8</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <PaletteBtn label="AND" onClick={() => addGate('AND')} />
                        <PaletteBtn label="OR" onClick={() => addGate('OR')} />
                        <PaletteBtn label="NOT" onClick={() => addGate('NOT')} />
                        <PaletteBtn label="XOR" onClick={() => addGate('XOR')} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Terminal size={14} /> Truth Analysis
                        </h3>
                        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                             <table className="w-full text-left text-[10px] font-mono">
                                 <thead className="bg-white/5">
                                     <tr>
                                         <th className="px-4 py-2 text-slate-500">Node ID</th>
                                         <th className="px-4 py-2 text-slate-500">Type</th>
                                         <th className="px-4 py-2 text-slate-500">Output</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                     {resolvedGates.map(g => (
                                         <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                                             <td className="px-4 py-2 font-black text-slate-300">{g.id}</td>
                                             <td className="px-4 py-2 text-emerald-500 font-bold">{g.type}</td>
                                             <td className="px-4 py-2">
                                                 <span className={`px-2 py-0.5 rounded font-black ${g.output ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                                                     {g.output ? 'HIGH' : 'LOW'}
                                                 </span>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        </div>
                    </section>
                    
                    {/* Oscilloscope View */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} /> Signal Timing
                        </h3>
                        <div className="h-40 bg-black/60 border border-white/10 rounded-2xl overflow-hidden p-4 flex gap-1 items-end">
                            {history.map((tick, i) => (
                                <div key={i} className="flex-1 flex flex-col gap-[2px]">
                                    {tick.slice(0, 4).map((state, si) => (
                                        <div 
                                            key={si} 
                                            className={`w-full transition-all ${state ? 'h-4 bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'h-1 bg-white/5'}`} 
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                         <div className="flex items-center gap-2 mb-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Clocking: Continuous</span>
                         </div>
                         <p className="text-[9px] text-slate-500 leading-relaxed italic">Click inputs on gates to toggle signal state.</p>
                    </div>
                </div>
            </div>

            {/* MAIN CANVAS: Visualization */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-12">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
                
                <div className="w-full h-full relative z-10 cursor-crosshair">
                     {resolvedGates.map((gate) => (
                         <div 
                            key={gate.id} 
                            className="absolute group select-none"
                            style={{ left: gate.x, top: gate.y }}
                         >
                            <div className={`p-6 bg-[#0a0f18]/90 backdrop-blur-xl border-2 rounded-2xl flex flex-col items-center gap-4 shadow-2xl transition-all ${gate.output ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-105' : 'border-white/10 opacity-80'}`}>
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest absolute -top-3 left-4 bg-[#0a0f18] px-2">{gate.id}</div>
                                <div className="text-xl font-black italic tracking-tighter text-white">{gate.type}</div>
                                
                                <div className="flex gap-4 items-center">
                                    <div className="flex flex-col gap-2">
                                        {gate.inputs.map((inp, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => toggleInput(gate.id, idx)}
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${inp ? 'bg-emerald-500 text-black shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                                            >
                                                {inp ? '1' : '0'}
                                            </button>
                                        ))}
                                    </div>
                                    <ChevronRight className="text-slate-700" size={16} />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${gate.output ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-black/40 border-white/5'}`}>
                                        <div className={`w-3 h-3 rounded-full ${gate.output ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-800'}`} />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setGates(gates.filter(g => g.id !== gate.id))}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            {/* Signal Traces (Simplified Visual) */}
                            {gate.output && (
                                <motion.div 
                                    layoutId={`${gate.id}-trace`}
                                    className="absolute left-full top-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent shadow-[0_0_10px_#14b8a6]" 
                                />
                            )}
                         </div>
                     ))}
                </div>

                <div className="absolute bottom-8 right-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] pointer-events-none">
                    Real-Time Logic Propagation Plane
                </div>
            </div>
        </div>
    );
}

function PaletteBtn({ label, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center justify-center gap-2 p-3 bg-white/[0.03] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group"
        >
            <Plus size={12} className="text-slate-500 group-hover:text-emerald-400" />
            {label}
        </button>
    );
}
