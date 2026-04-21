'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Code, Play, RotateCcw, Activity, 
    BarChart3, Binary, Zap, Cpu,
    ChevronRight, Info, Settings,
    Maximize2, Shield
} from 'lucide-react';

type AlgorithmMode = 'sorting' | 'complexity' | 'data-structures';

export default function CSAlgorithms() {
    const [mode, setMode] = useState<AlgorithmMode>('sorting');
    const [array, setArray] = useState<number[]>([]);
    const [isSorting, setIsSorting] = useState(false);
    const [sortSpeed, setSortSpeed] = useState(50);
    const [activeIndices, setActiveIndices] = useState<number[]>([]);
    const [comparisonCount, setComparisonCount] = useState(0);
    const [algoType, setAlgoType] = useState<'bubble' | 'quick' | 'merge'>('bubble');

    // Initialize array
    const resetArray = useCallback(() => {
        const newArr = Array.from({ length: 40 }, () => Math.floor(Math.random() * 90) + 5);
        setArray(newArr);
        setActiveIndices([]);
        setComparisonCount(0);
    }, []);

    useEffect(() => {
        resetArray();
    }, [resetArray]);

    // --- SORTING LOGIC ---
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const bubbleSort = async () => {
        setIsSorting(true);
        let arr = [...array];
        let comps = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                setActiveIndices([j, j + 1]);
                comps++;
                setComparisonCount(comps);
                if (arr[j] > arr[j + 1]) {
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    setArray([...arr]);
                }
                await sleep(101 - sortSpeed);
            }
        }
        setIsSorting(false);
        setActiveIndices([]);
    };

    const runSort = () => {
        if (algoType === 'bubble') bubbleSort();
        // Placeholder for quick/merge sort as they are complex to animate stepwise without refactoring
    };

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* SIDEBAR */}
            <div className="w-[320px] h-full bg-[#080b11]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-teal-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                            <Code size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Algo Engine</h1>
                            <p className="text-[10px] text-teal-500/60 font-mono tracking-widest uppercase italic">Algorithmic Optimization</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 flex-1 space-y-8">
                    {/* Mode Selector */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operation Mode</h2>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'sorting', label: 'Sorting Visualizer', icon: BarChart3 },
                                { id: 'complexity', label: 'Big-O Analysis', icon: Activity },
                                { id: 'data-structures', label: 'Graph / Tree', icon: Binary }
                            ].map((m) => (
                                <button key={m.id} onClick={() => setMode(m.id as any)}
                                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${mode === m.id ? 'bg-teal-500/15 border-teal-500/40 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white hover:bg-white/5'}`}>
                                    <m.icon size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sorting Config */}
                    <AnimatePresence mode="wait">
                        {mode === 'sorting' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Algorithm</h3>
                                    <select value={algoType} onChange={(e) => setAlgoType(e.target.value as any)} 
                                        className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-teal-500/50">
                                        <option value="bubble">Bubble Sort (O[n²])</option>
                                        <option value="quick" disabled>Quick Sort (O[n log n])</option>
                                        <option value="merge" disabled>Merge Sort (O[n log n])</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span>Animation Speed</span>
                                        <span className="text-teal-400">{sortSpeed}%</span>
                                    </div>
                                    <input type="range" min="1" max="100" value={sortSpeed} onChange={(e) => setSortSpeed(e.target.valueAsNumber)} className="w-full accent-teal-500" />
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={resetArray} className="flex-1 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Reset</button>
                                    <button onClick={runSort} disabled={isSorting} className="flex-[2] py-3 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/30 transition-all disabled:opacity-50">Sort Now</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-6 border-t border-white/5 bg-teal-500/[0.02]">
                    <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                            <Shield size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node Status</div>
                            <div className="text-xs font-bold text-white">Computation Live</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN VISUALIZER */}
            <div className="flex-1 flex flex-col p-12 overflow-hidden z-10">
                <AnimatePresence mode="wait">
                    {mode === 'sorting' ? (
                        <motion.div key="sort" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                            <div className="mb-10 flex items-end justify-between">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500/60 mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_#14b8a6]" />
                                        Sorting Visualization — {algoType.toUpperCase()}
                                    </div>
                                    <h2 className="text-4xl font-black italic tracking-tighter text-white">Complexity: O(n²)</h2>
                                </div>
                                <div className="flex gap-8 text-right">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Comparisons</div>
                                        <div className="text-3xl font-black font-mono text-teal-400">{comparisonCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Items</div>
                                        <div className="text-3xl font-black font-mono text-white">{array.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-black/40 border border-white/5 rounded-[2.5rem] p-12 flex items-end justify-between gap-1 relative overflow-hidden backdrop-blur-md shadow-2xl">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.05)_0%,transparent_70%)]" />
                                
                                {array.map((val, idx) => (
                                    <motion.div
                                        key={idx}
                                        layout
                                        className="flex-1 rounded-t-lg relative"
                                        style={{ 
                                            height: `${val}%`,
                                            backgroundColor: activeIndices.includes(idx) ? '#14b8a6' : 'rgba(255,255,255,0.05)',
                                            border: activeIndices.includes(idx) ? '1px solid rgba(20,184,166,0.5)' : '1px solid rgba(255,255,255,0.02)',
                                            boxShadow: activeIndices.includes(idx) ? '0 0 20px rgba(20,184,166,0.3)' : 'none'
                                        }}
                                    >
                                        {activeIndices.includes(idx) && (
                                            <motion.div 
                                                layoutId="pointer"
                                                className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
                                            >
                                                <div className="text-[8px] font-black text-teal-400 mb-1">{val}</div>
                                                <Zap size={10} className="text-teal-400 fill-teal-400/20" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="other" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Cpu size={64} className="text-white/5 mx-auto mb-6" strokeWidth={1} />
                                <h3 className="text-2xl font-black italic text-white/20 uppercase tracking-tighter">Module expansion...</h3>
                                <p className="text-xs text-slate-700 font-bold uppercase tracking-widest mt-2">{mode.replace('-', ' ')} coming soon</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
