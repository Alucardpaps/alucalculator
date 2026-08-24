'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Cpu, Play, Square, Layers, Activity,
    Zap, Info, Target, ChevronDown,
    Database, Boxes
} from 'lucide-react';

// --- VOXEL TYPE ---
interface Voxel {
    id: number;
    x: number;
    y: number;
    density: number; // 0 to 1
    stress: number;   // normalized 0 to 1
}

const GRID_SIZE = 24;

// --- LOAD CASE DEFINITIONS ---

type LoadCaseType = 'cantilever' | 'bridge' | 'mbb';

interface LoadCaseConfig {
    label: string;
    description: string;
}

const LOAD_CASES: Record<LoadCaseType, LoadCaseConfig> = {
    cantilever: {
        label: 'Cantilever Beam',
        description: 'Fixed left edge, point load at bottom-right',
    },
    bridge: {
        label: 'Bridge / Michell Arch',
        description: 'Supported at bottom corners, load at top-center',
    },
    mbb: {
        label: 'MBB Beam',
        description: 'Supported bottom-left corner & bottom-right edge, distributed top load',
    },
};

/**
 * Computes a physics-based stress field for the given load case.
 * Uses distance-based stress distribution formulas — not exact FEA,
 * but physically meaningful for topology optimization visualization.
 */
function computeStressField(loadCase: LoadCaseType, gridSize: number): number[][] {
    const field: number[][] = [];
    const maxCoord = gridSize - 1;

    for (let y = 0; y < gridSize; y++) {
        const row: number[] = [];
        for (let x = 0; x < gridSize; x++) {
            let stress = 0;
            const nx = x / maxCoord; // normalized 0..1
            const ny = y / maxCoord;

            switch (loadCase) {
                case 'cantilever': {
                    // Fixed at left edge (x=0). Point load at bottom-right (1, 1).
                    // Stress is highest near the fixed support and decreases with distance.
                    // Bending stress ∝ distance from neutral axis * moment / I
                    const distFromFixed = nx; // 0 at support, 1 at tip
                    const momentArm = 1 - distFromFixed; // moment decreases toward tip
                    const distFromNeutral = Math.abs(ny - 0.5) * 2; // 0 at center, 1 at edges
                    stress = momentArm * (0.3 + 0.7 * distFromNeutral);
                    // Add load path concentration near bottom-right
                    const distToLoad = Math.sqrt((nx - 1) ** 2 + (ny - 1) ** 2);
                    stress += Math.max(0, 0.4 - distToLoad * 0.5);
                    break;
                }
                case 'bridge': {
                    // Supported at bottom-left (0, 1) and bottom-right (1, 1).
                    // Point load at top-center (0.5, 0).
                    // Stress radiates from load point in an arch pattern.
                    const distToLoad = Math.sqrt((nx - 0.5) ** 2 + ny ** 2);
                    const distToLeftSupport = Math.sqrt(nx ** 2 + (ny - 1) ** 2);
                    const distToRightSupport = Math.sqrt((nx - 1) ** 2 + (ny - 1) ** 2);
                    stress = Math.max(0, 1 - distToLoad * 1.2)
                           + Math.max(0, 0.6 - distToLeftSupport * 0.8)
                           + Math.max(0, 0.6 - distToRightSupport * 0.8);
                    // Arch path stress concentration
                    const archY = 0.5 * (2 * Math.abs(nx - 0.5)) ** 1.5;
                    const distToArch = Math.abs(ny - archY);
                    stress += Math.max(0, 0.3 - distToArch * 0.6);
                    break;
                }
                case 'mbb': {
                    // MBB beam: pin support at bottom-left, roller at bottom-right edge.
                    // Distributed load along top. Classic benchmark.
                    const distFromTop = ny; // 0 at top (load), 1 at bottom
                    const momentAtX = nx * (1 - nx); // parabolic moment distribution
                    const distFromNeutral = Math.abs(ny - 0.5) * 2;
                    stress = momentAtX * 2 * (0.3 + 0.7 * distFromNeutral);
                    // Support reactions
                    const distToPin = Math.sqrt(nx ** 2 + (ny - 1) ** 2);
                    stress += Math.max(0, 0.5 - distToPin * 0.6);
                    const distToRoller = Math.sqrt((nx - 1) ** 2 + (ny - 1) ** 2);
                    stress += Math.max(0, 0.3 - distToRoller * 0.5);
                    break;
                }
            }
            row.push(Math.min(1, Math.max(0, stress)));
        }
        field.push(row);
    }

    // Normalize to [0, 1] range
    let maxStress = 0;
    for (const row of field) {
        for (const val of row) {
            if (val > maxStress) maxStress = val;
        }
    }
    if (maxStress > 0) {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                field[y][x] /= maxStress;
            }
        }
    }

    return field;
}

/**
 * Returns boundary-condition locked densities for a load case.
 * Elements at fixed supports must remain at density 1.0.
 */
function getLockedCells(loadCase: LoadCaseType, gridSize: number): Set<number> {
    const locked = new Set<number>();
    const maxCoord = gridSize - 1;

    switch (loadCase) {
        case 'cantilever':
            // Lock entire left column
            for (let y = 0; y < gridSize; y++) {
                locked.add(y * gridSize + 0);
            }
            break;
        case 'bridge':
            // Lock bottom-left and bottom-right corners (2x2 each)
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    locked.add((maxCoord - dy) * gridSize + dx);
                    locked.add((maxCoord - dy) * gridSize + (maxCoord - dx));
                }
            }
            break;
        case 'mbb':
            // Lock bottom-left corner (2x2) and bottom-right edge (2 cells)
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    locked.add((maxCoord - dy) * gridSize + dx);
                }
                locked.add((maxCoord - dy) * gridSize + maxCoord);
            }
            break;
    }

    return locked;
}

export default function GenerativeLite() {
    // Optimization State
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [iteration, setIteration] = useState(0);
    const [targetVolume, setTargetVolume] = useState(0.4);
    const [loadCase, setLoadCase] = useState<LoadCaseType>('cantilever');
    const [voxels, setVoxels] = useState<Voxel[]>([]);

    // Precompute stress field and locked cells when load case changes
    const stressField = useMemo(() => computeStressField(loadCase, GRID_SIZE), [loadCase]);
    const lockedCells = useMemo(() => getLockedCells(loadCase, GRID_SIZE), [loadCase]);

    // Initialize / reset voxels when load case changes
    const initializeVoxels = useCallback(() => {
        const initial: Voxel[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                initial.push({
                    id: y * GRID_SIZE + x,
                    x, y,
                    density: 1.0,
                    stress: stressField[y][x],
                });
            }
        }
        return initial;
    }, [stressField]);

    useEffect(() => {
        setVoxels(initializeVoxels());
        setIteration(0);
        setProgress(0);
        setIsRunning(false);
    }, [initializeVoxels]);

    // Optimization Loop (SIMP-like density evolution)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && iteration < 40) {
            interval = setInterval(() => {
                setIteration(prev => prev + 1);
                setProgress(prev => Math.min(100, (iteration / 40) * 100));

                setVoxels(prev => {
                    const currentVolume = prev.filter(v => v.density > 0.1).length / (GRID_SIZE * GRID_SIZE);
                    const shouldRemove = currentVolume > targetVolume;

                    return prev.map(v => {
                        // Never remove locked (boundary) cells
                        if (lockedCells.has(v.id)) {
                            return v;
                        }
                        // SIMP-like removal: if stress is low and volume is high, reduce density
                        if (shouldRemove && v.stress < (0.2 + iteration * 0.01) && v.density > 0) {
                            return { ...v, density: Math.max(0, v.density - 0.2) };
                        }
                        return v;
                    });
                });
            }, 100);
        } else if (iteration >= 40) {
            setIsRunning(false);
        }
        return () => clearInterval(interval);
    }, [isRunning, iteration, targetVolume, lockedCells]);

    const handleReset = () => {
        setIsRunning(false);
        setIteration(0);
        setProgress(0);
        setVoxels(initializeVoxels());
    };

    const stats = useMemo(() => {
        const totalCells = GRID_SIZE * GRID_SIZE;
        const activeCount = voxels.filter(v => v.density > 0.1).length;
        const volumeFraction = activeCount / totalCells;
        const massSavingPct = (1 - volumeFraction) * 100;

        // Compliance = sum(stress_i * density_i) — real objective function
        const compliance = voxels.reduce((sum, v) => sum + v.stress * v.density, 0);

        return { volumeFraction, massSavingPct, compliance };
    }, [voxels]);

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Visual Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />

            {/* LEFT PANEL */}
            <div className="w-[340px] bg-[#05080f]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Boxes size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Generative Lite</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">Topology Optimizer v2</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Load Case Selector */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Cpu size={12} /> Load Case
                        </h2>
                        <div className="relative">
                            <select
                                value={loadCase}
                                onChange={(e) => setLoadCase(e.target.value as LoadCaseType)}
                                className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium cursor-pointer hover:border-cyan-500/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                            >
                                {(Object.entries(LOAD_CASES) as [LoadCaseType, LoadCaseConfig][]).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 px-1">
                            <Info size={10} className="mt-0.5 flex-shrink-0 text-cyan-500/50" />
                            <span>{LOAD_CASES[loadCase].description}</span>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Constraints */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Target size={12} /> Optimization Target
                        </h2>
                        <ParameterInput label="Volume Fraction" unit="VF" value={targetVolume} min={0.1} max={0.9} step={0.05} onChange={setTargetVolume} icon={<Layers size={12}/>} />
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Solver Control */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Activity size={12} /> Optimization Kernel
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            {isRunning ? (
                                <button onClick={() => setIsRunning(false)} className="col-span-2 py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
                                    <Square size={16} fill="currentColor" /> Stop
                                </button>
                            ) : (
                                <button onClick={() => setIsRunning(true)} className="col-span-2 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                    <Play size={16} fill="currentColor" /> Solve Loop
                                </button>
                            )}
                            <button onClick={handleReset} className="col-span-2 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                                Reset Lattice
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Telemetry */}
                    <div className="space-y-4 pb-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Database size={12} /> Live Metrics
                        </h2>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                             <div className="flex justify-between text-[10px] font-mono">
                                 <span className="text-slate-500 uppercase font-black">Iteration</span>
                                 <span className="text-cyan-400">{iteration} / 40</span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div className="h-full bg-cyan-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                             </div>
                             <div className="flex justify-between text-[10px] font-mono">
                                 <span className="text-slate-500 uppercase font-black">Live Volume</span>
                                 <span className="text-amber-400">{(stats.volumeFraction * 100).toFixed(1)}%</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label="Weight Optimization" value={(100 - stats.volumeFraction * 100).toFixed(1)} unit="%" sub="REMOVAL RATIO" color="#22d3ee" />
                    <ValueCard label="Estimated Mass Saving" value={stats.massSavingPct.toFixed(1)} unit="%" sub="VOLUME REDUCTION" color="#10b981" />
                    <ValueCard label="Compliance (Obj.)" value={stats.compliance.toFixed(1)} unit="" sub={`VOL FRAC: ${(stats.volumeFraction * 100).toFixed(1)}%`} color="#8b5cf6" />
                </div>

                {/* Voxel Canvas Viewport */}
                <div className="flex-1 bg-black/40 border border-white/10 rounded-[3rem] p-12 flex items-center justify-center relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="grid grid-cols-24 gap-px w-full h-full max-w-[600px] max-h-[600px] p-4 bg-white/5 rounded-xl border border-white/10" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
                        {voxels.map((v) => (
                            <motion.div
                                key={v.id}
                                initial={false}
                                animate={{
                                    opacity: v.density,
                                    scale: 0.1 + v.density * 0.9,
                                    backgroundColor: v.density < 0.1 ? 'transparent' : (v.stress > 0.6 ? '#f87171' : v.stress > 0.3 ? '#22d3ee' : '#1e293b')
                                }}
                                className="aspect-square rounded-sm"
                                style={{
                                    border: v.density > 0.1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                }}
                            />
                        ))}
                    </div>

                    <div className="absolute bottom-8 right-12 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] pointer-events-none">
                        SIMP Density Evolution Matrix
                    </div>

                    <div className="absolute top-8 left-12 flex gap-4">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">High Stress Load</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-slate-800" />
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vacuum Potential</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, min, max, step, onChange, icon }: any) {
    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-cyan-400">{Math.round(value * 100)}%</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan-600" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Zap size={64}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase italic leading-none">{unit}</span>}
            </div>
            {sub && <div className="text-[9px] font-bold mt-2 uppercase tracking-widest text-[#64748b]">{sub}</div>}
        </div>
    );
}
