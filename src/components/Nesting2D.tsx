"use client";

import { useState, useCallback } from 'react';
import { 
    Settings, Play, Download, AlertCircle, CheckCircle2, 
    Loader2, Grid2x2, Layers, Cpu, Maximize2, RotateCcw, Activity, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { NestingCanvas } from './NestingCanvas';
import { PartUploader } from './DxfUploader';
import { useNestingWorker } from '@/hooks/useNestingWorker';
import { exportToDXF, downloadDXF } from '@/utils/dxfExporter';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import type { Part2D, Sheet2D, NestingOptions } from '@/types/nesting2d.types';

interface Nesting2DProps {
    dict?: Record<string, unknown>;
    lang?: string;
}

const SHEET_PRESETS = [
    { label: '2500 × 1250', width: 2500, height: 1250 },
    { label: '3000 × 1500', width: 3000, height: 1500 },
    { label: '2440 × 1220', width: 2440, height: 1220 },
    { label: '2000 × 1000', width: 2000, height: 1000 },
];

export function Nesting2D({ dict = {}, lang = 'en' }: Nesting2DProps) {
    // State
    const [parts, setParts] = useState<Part2D[]>([]);
    const [sheet, setSheet] = useState<Sheet2D>({ width: 2500, height: 1250, kerf: 3 });
    const [options, setOptions] = useState<NestingOptions>({
        rotationStep: 90,
        spacing: 5,
        algorithm: 'guillotine',
        heuristic: 'best-area-fit',
        multiSheet: true,
        maxSheets: 10
    });
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
    const [materialCostPerM2, setMaterialCostPerM2] = useState(12);

    // Worker hook
    const { run, progress, result, error, isRunning, reset } = useNestingWorker();

    const importFromAssembly = useCallback(() => {
        const componentsObj = useAssemblyStore.getState().components;
        const brackets = Object.values(componentsObj).filter(c => c.type === 'bracket');
        if (brackets.length === 0) {
            alert('No brackets found in 3D Assembly. Please add brackets in the 3D Assembly tab first.');
            return;
        }

        // Standard brackets represented as 150mm x 150mm square plates for nesting
        const width = 150;
        const height = 150;
        const points = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height }
        ];

        const importedPart: Part2D = {
            id: `assembly-bracket-${Date.now()}`,
            label: `L-Bracket (${brackets.length} Qty)`,
            polygon: {
                points,
                bounds: { x: 0, y: 0, width, height },
                area: width * height
            },
            quantity: brackets.length,
            allowedRotations: [0, 90, 180, 270],
            source: '3D Assembly'
        };

        setParts(prev => [...prev, importedPart]);
        if (result) reset();
    }, [result, reset]);

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = dict;
        for (const k of keys) { value = value?.[k]; }
        return value || key;
    };

    const handleOptimize = useCallback(() => {
        if (parts.length === 0) return;
        reset();
        setCurrentSheetIndex(0);
        run({ parts, sheet, options });
    }, [parts, sheet, options, run, reset]);

    const handleExportDXF = useCallback(() => {
        if (!result || result.sheets.length === 0) return;
        result.sheets.forEach((sheetResult, index) => {
            const dxfContent = exportToDXF(sheetResult, sheet);
            const filename = result.sheets.length > 1 ? `nested_sheet_${index + 1}.dxf` : 'nested_parts.dxf';
            downloadDXF(dxfContent, filename);
        });
    }, [result, sheet]);

    const handlePartsChange = useCallback((newParts: Part2D[]) => {
        setParts(newParts);
        if (result) reset();
    }, [result, reset]);

    const totalPartsCount = parts.reduce((sum, p) => sum + p.quantity, 0);
    const sheetAreaM2 = (sheet.width * sheet.height) / 1_000_000;
    const estimatedMaterialCost = result
        ? result.totalSheets * sheetAreaM2 * materialCostPerM2
        : 0;

    const handleReset = useCallback(() => {
        setParts([]);
        reset();
        setCurrentSheetIndex(0);
    }, [reset]);

    return (
        <div className="flex flex-col lg:flex-row w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Visual Grid Layer */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL: Controls */}
            <div className="w-full lg:w-[400px] bg-[#05080f]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                            <Grid2x2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Nesting Engine</h1>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mt-1">Geometric Optimization</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    {/* Part Uploader Area */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Layers size={12} /> Resource Loading
                        </h2>
                        <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden p-1">
                             <PartUploader parts={parts} onPartsChange={handlePartsChange} />
                        </div>
                        <button
                            type="button"
                            onClick={importFromAssembly}
                            className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                            📥 Import Brackets from 3D Assembly
                        </button>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Stock & Algorithm Settings */}
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings size={12} /> Compute Parameters
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <ParameterInput label="Sheet Width" unit="mm" value={sheet.width} onChange={(v: any) => setSheet(s => ({ ...s, width: v }))} icon={<Maximize2 size={12}/>} />
                             <ParameterInput label="Sheet Height" unit="mm" value={sheet.height} onChange={(v: any) => setSheet(s => ({ ...s, height: v }))} icon={<Maximize2 size={12}/>} />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {SHEET_PRESETS.map(p => (
                                <button key={p.label} type="button"
                                    onClick={() => setSheet(s => ({ ...s, width: p.width, height: p.height }))}
                                    className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 hover:text-cyan-400 text-slate-500 transition-all">
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <ParameterInput label="Kerf Width" unit="mm" value={sheet.kerf} onChange={(v: any) => setSheet(s => ({ ...s, kerf: v }))} icon={<Cpu size={12}/>} />
                             <ParameterInput label="Min Spacing" unit="mm" value={options.spacing} onChange={(v: any) => setOptions(o => ({ ...o, spacing: v }))} icon={<Layers size={12}/>} />
                        </div>

                        <div className="space-y-2">
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Solver Algorithm</div>
                             <select
                                value={options.algorithm}
                                onChange={(e) => setOptions(o => ({ ...o, algorithm: e.target.value as NestingOptions['algorithm'] }))}
                                className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
                            >
                                <option value="guillotine">Guillotine (Nesting)</option>
                                <option value="maxrects">MaxRects (Dense Pack)</option>
                                <option value="shelf">Shelf (Strip Pack)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Placement Heuristic</div>
                             <select
                                value={options.heuristic}
                                onChange={(e) => setOptions(o => ({ ...o, heuristic: e.target.value as NestingOptions['heuristic'] }))}
                                className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
                            >
                                <option value="best-area-fit">Best Area Fit</option>
                                <option value="best-short-side-fit">Best Short Side Fit</option>
                                <option value="best-long-side-fit">Best Long Side Fit</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Optimization Rotation</div>
                             <select
                                value={options.rotationStep}
                                onChange={(e) => setOptions(o => ({ ...o, rotationStep: parseInt(e.target.value) }))}
                                className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
                            >
                                <option value={0}>Fixed (0° Degree)</option>
                                <option value={90}>Ortho (90° Step)</option>
                                <option value={45}>Precision (45° Step)</option>
                                <option value={15}>Hyper (15° Step)</option>
                            </select>
                        </div>

                        <ParameterInput label="Material Cost" unit="€/m²" value={materialCostPerM2} onChange={setMaterialCostPerM2} icon={<FileText size={12}/>} max={500} />
                    </div>

                    {/* Action Panel */}
                    <div className="pt-4 flex gap-3">
                         <button onClick={handleOptimize} disabled={parts.length === 0 || isRunning}
                            className={`flex-[2] py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${parts.length === 0 || isRunning ? 'bg-white/5 text-slate-600' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20'}`}>
                            {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                            {isRunning ? `Solving: ${progress?.percent || 0}%` : `Run Solver (${totalPartsCount})`}
                         </button>
                         <button onClick={handleReset} title="Reset" className="w-14 h-14 bg-white/5 border border-white/10 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:text-white transition-all">
                            <RotateCcw size={18} />
                         </button>
                         {result && (
                             <button onClick={handleExportDXF} className="w-16 h-14 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all">
                                <Download size={20} />
                             </button>
                         )}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-cyan-500/[0.02]">
                    <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Activity size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Worker Thread</div>
                            <div className="text-xs font-bold text-white italic">{isRunning ? 'COMPUTING TOPOLOGY' : 'READY TO ANALYZE'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-hidden z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />

                {/* Results Widget */}
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-20">
                            <ValueCard label="Sheet Usage" value={String(result.totalSheets)} unit="QTY" color="#00e5ff" />
                            <ValueCard label="Efficiency" value={result.totalEfficiency.toFixed(1)} unit="%" sub="NESTED AREA" color="#10b981" />
                            <ValueCard label="Waste Produced" value={(result.totalWaste / 1000000).toFixed(3)} unit="m²" color="#f59e0b" />
                            <ValueCard label="Material Cost" value={estimatedMaterialCost.toFixed(0)} unit="€" sub={`@ ${materialCostPerM2} €/m²`} color="#3b82f6" />
                            <ValueCard label="Compute Time" value={String(result.computeTimeMs.toFixed(0))} unit="ms" sub="HEURISTIC" color="#94a3b8" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Simulation Canvas Viewport */}
                <div className="flex-1 bg-black/40 border border-white/10 rounded-[3rem] p-8 flex flex-col relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 z-30 flex gap-2">
                        {result && result.sheets.length > 1 && result.sheets.map((_, i) => (
                             <button key={i} onClick={() => setCurrentSheetIndex(i)} 
                                className={`w-8 h-8 rounded-lg text-[10px] font-black border transition-all ${currentSheetIndex === i ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                {i+1}
                             </button>
                        ))}
                    </div>

                    <div className="flex-1 flex items-center justify-center relative">
                        {/* The Custom Nesting Canvas */}
                        <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-white/5 bg-[#080d14]/40 shadow-inner">
                             <NestingCanvas
                                sheet={sheet}
                                result={result?.sheets[currentSheetIndex] || null}
                                currentSheetIndex={currentSheetIndex}
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    {result?.unplacedParts?.length ? (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                             <AlertCircle size={12} /> {result.unplacedParts.length} Critical Overflow Parts Detected
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, onChange, icon, max = 1000 }: any) {
    const sliderMax = label.includes('Width') && label.length > 5 ? 5000 : label.includes('Cost') ? (max || 500) : 1000;
    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-cyan-400">{value} {unit}</span>
            </div>
            <input type="range" min="1" max={sliderMax} step={label.includes('Cost') ? 1 : 1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan-500" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Layers size={64}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase italic">{unit}</span>}
            </div>
            {sub && <div className="text-[9px] font-bold mt-1 uppercase tracking-widest text-slate-600">{sub}</div>}
        </div>
    );
}
