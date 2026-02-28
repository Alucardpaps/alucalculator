import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Calculator, Settings, RotateCcw, Copy, Code, Layers, FileCode } from 'lucide-react';
import { calculateNesting, type CutItem, type NestingResult, type NestingOptions } from '@/utils/nestingAlgorithm';
import { NestingVisualization } from '@/components/NestingVisualization';
import { CalculatorInput } from "@/components/CalculatorInput";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { generateGCodeToolpath, type CNCConfig } from './CamToolpathGenerator';
import { motion, AnimatePresence } from 'framer-motion';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

interface PartRow {
    id: string;
    label: string;
    length: number;
    qty: number;
}

const MATERIALS = [
    { id: 'al', label: 'Aluminum 6061', defaultStock: 6000, defaultKerf: 4, feed: 800, plunge: 300 },
    { id: 'st', label: 'Mild Steel', defaultStock: 6000, defaultKerf: 3, feed: 400, plunge: 150 },
    { id: 'wd', label: 'MDF / Wood', defaultStock: 2440, defaultKerf: 3.2, feed: 2000, plunge: 800 },
    { id: 'pl', label: 'Acrylic', defaultStock: 2000, defaultKerf: 2.5, feed: 1000, plunge: 400 },
];

export function CuttingOptimizerModule({ lang, dict }: { lang: string, dict: any }) {
    // State: Parts data grid
    const [parts, setParts] = useState<PartRow[]>([
        { id: generateId(), label: 'Part A', length: 500, qty: 5 },
        { id: generateId(), label: 'Part B', length: 800, qty: 3 },
        { id: generateId(), label: 'Part C', length: 300, qty: 8 },
    ]);

    // Enhanced Settings State
    const [materialId, setMaterialId] = useState('al');
    const [stockLength, setStockLength] = useState(6000);
    const [kerf, setKerf] = useState(4);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [algorithm, setAlgorithm] = useState<'bfd'>('bfd');

    // CNC Settings
    const [feedRate, setFeedRate] = useState(800);
    const [plungeRate, setPlungeRate] = useState(300);
    const [safeZ, setSafeZ] = useState(10);
    const [cutZ, setCutZ] = useState(-2);

    // View State
    const [viewMode, setViewMode] = useState<'input' | 'result'>('input');
    const [resultTab, setResultTab] = useState<'nested' | 'gcode'>('nested');
    const [result, setResult] = useState<NestingResult | null>(null);
    const [gcode, setGcode] = useState<string>('');

    // Handle Material Change
    const handleMaterialChange = (matId: string) => {
        setMaterialId(matId);
        const mat = MATERIALS.find(m => m.id === matId);
        if (mat) {
            setStockLength(mat.defaultStock);
            setKerf(mat.defaultKerf);
            setFeedRate(mat.feed);
            setPlungeRate(mat.plunge);
        }
    };

    // Actions
    const addRow = useCallback(() => setParts(prev => [...prev, { id: generateId(), label: '', length: 0, qty: 1 }]), []);
    const removeRow = useCallback((id: string) => setParts(prev => prev.filter(p => p.id !== id)), []);
    const updateRow = useCallback((id: string, field: keyof PartRow, value: string | number) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }, []);
    const duplicateRow = useCallback((id: string) => {
        setParts(prev => {
            const original = prev.find(p => p.id === id);
            if (!original) return prev;
            return [...prev, { ...original, id: generateId(), label: original.label + ' (Copy)' }];
        });
    }, []);

    const resetAll = useCallback(() => {
        setParts([{ id: generateId(), label: '', length: 0, qty: 1 }]);
        setResult(null);
        setGcode('');
        setViewMode('input');
    }, []);

    const calculate = useCallback(() => {
        const validParts: CutItem[] = parts
            .filter(p => p.length > 0 && p.qty > 0)
            .map(p => ({
                id: p.id,
                label: p.label || `Part ${p.id.slice(0, 4)}`,
                length: p.length,
                qty: p.qty,
            }));

        if (validParts.length === 0) {
            setResult(null);
            return;
        }

        const options: NestingOptions = {
            algorithm,
            bladeWidth: kerf,
            trimming: { start: trimStart, end: trimEnd },
        };

        const nestingResult = calculateNesting(validParts, stockLength, options);
        setResult(nestingResult);

        // Generate G-Code
        const currentMat = MATERIALS.find(m => m.id === materialId)?.label || 'Unknown';
        const cncConfig: CNCConfig = {
            feedRate,
            plungeRate,
            safeZ,
            cutZ,
            material: currentMat,
            bladeWidth: kerf
        };
        const generatedGCode = generateGCodeToolpath(nestingResult, cncConfig);
        setGcode(generatedGCode);

        setViewMode('result');
        setResultTab('nested');
    }, [parts, stockLength, kerf, trimStart, trimEnd, algorithm, materialId, feedRate, plungeRate, safeZ, cutZ]);

    const effectiveLength = stockLength - trimStart - trimEnd;

    return (
        <div className="flex flex-col h-full bg-[#121418] text-slate-200 select-none font-sans">

            {/* Premium Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#2a303c] bg-[#1a1f26] shadow-sm relative z-10">
                <div className="flex gap-2 bg-[#0d1015] p-1 rounded-lg border border-[#2a303c]">
                    <button
                        onClick={() => setViewMode('input')}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${viewMode === 'input' ? 'bg-[#00e5ff]/20 text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Input
                    </button>
                    <button
                        onClick={() => result && setViewMode('result')}
                        disabled={!result}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${viewMode === 'result' ? 'bg-[#ff9500]/20 text-[#ff9500] shadow-[0_0_10px_rgba(255,149,0,0.2)]' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
                    >
                        Results & CAM
                    </button>
                </div>
                <button onClick={resetAll} className="p-2 hover:bg-[#2a303c] rounded-md text-slate-400 transition-colors" title="Reset Workflow">
                    <RotateCcw size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-20">
                <AnimatePresence mode="wait">
                    {viewMode === 'input' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6 max-w-5xl mx-auto"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Configuration Panel */}
                                <div className="bg-[#1a1f26] p-5 rounded-xl border border-[#2a303c] shadow-lg space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#00e5ff] uppercase tracking-wider">
                                            <Settings size={14} /> Output Configuration
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono bg-[#0d1015] px-2 py-1 rounded">
                                            E-LEN: {effectiveLength}mm
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Material Presets</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {MATERIALS.map(mat => (
                                                    <button
                                                        key={mat.id}
                                                        onClick={() => handleMaterialChange(mat.id)}
                                                        className={`py-2 px-1 rounded-md text-[10px] font-semibold transition-all ${materialId === mat.id
                                                                ? 'bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff] border shadow-inner'
                                                                : 'bg-[#0d1015] border-[#2a303c] text-slate-400 border hover:bg-[#2a303c]'
                                                            }`}
                                                    >
                                                        {mat.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2a303c]">
                                            <CalculatorInput label="Stock Length" unit="mm" value={stockLength} onChange={(e) => setStockLength(Number(e.target.value))} />
                                            <CalculatorInput label="Blade Kerf" unit="mm" value={kerf} onChange={(e) => setKerf(Number(e.target.value))} />
                                            <CalculatorInput label="Trim Start" unit="mm" value={trimStart} onChange={(e) => setTrimStart(Number(e.target.value))} />
                                            <CalculatorInput label="Trim End" unit="mm" value={trimEnd} onChange={(e) => setTrimEnd(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                {/* CAM / Toolpath Parameters */}
                                <div className="bg-[#1a1f26] p-5 rounded-xl border border-[#2a303c] shadow-lg space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-sm font-bold text-[#ff9500] uppercase tracking-wider">
                                        <Code size={14} /> Toolpath Gen
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <CalculatorInput label="Feed Rate" unit="mm/min" value={feedRate} onChange={(e) => setFeedRate(Number(e.target.value))} />
                                        <CalculatorInput label="Plunge Rate" unit="mm/min" value={plungeRate} onChange={(e) => setPlungeRate(Number(e.target.value))} />
                                        <CalculatorInput label="Safe Z" unit="mm" value={safeZ} onChange={(e) => setSafeZ(Number(e.target.value))} />
                                        <CalculatorInput label="Cut Depth Z" unit="mm" value={cutZ} onChange={(e) => setCutZ(Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>

                            {/* Parts List */}
                            <div className="bg-[#1a1f26] rounded-xl border border-[#2a303c] shadow-lg overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center p-4 border-b border-[#2a303c] bg-[#161a20]">
                                    <h3 className="text-sm font-bold text-[#f59e0b] uppercase tracking-wider flex items-center gap-2">
                                        <Layers size={14} /> Production Manifest
                                    </h3>
                                    <button onClick={addRow} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-all shadow-sm">
                                        <Plus size={12} strokeWidth={3} /> Add Component
                                    </button>
                                </div>
                                <div className="grid grid-cols-[1fr_120px_100px_80px] gap-4 p-3 bg-[#0d1015] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#2a303c]">
                                    <span className="pl-2">Component Label</span>
                                    <span>Length (mm)</span>
                                    <span className="text-center">Quantity</span>
                                    <span className="text-center">Actions</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto p-1">
                                    <AnimatePresence>
                                        {parts.map((part, i) => (
                                            <motion.div
                                                key={part.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid grid-cols-[1fr_120px_100px_80px] gap-4 p-2 items-center text-sm border-b border-[#2a303c]/50 hover:bg-[#20262e] rounded-md transition-colors group"
                                            >
                                                <input
                                                    type="text"
                                                    value={part.label}
                                                    placeholder={`Part ${i + 1}`}
                                                    onChange={(e) => updateRow(part.id, 'label', e.target.value)}
                                                    className="bg-[#0d1015] border border-[#2a303c] text-slate-200 placeholder-slate-600 focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] rounded-md px-3 py-1.5 outline-none transition-all w-full font-medium"
                                                />
                                                <input
                                                    type="number"
                                                    value={part.length || ''}
                                                    onChange={(e) => updateRow(part.id, 'length', Number(e.target.value))}
                                                    className="bg-[#0d1015] border border-[#2a303c] focus:border-[#00e5ff] text-[#00e5ff] rounded-md px-3 py-1.5 text-right font-mono font-bold outline-none transition-all"
                                                />
                                                <input
                                                    type="number"
                                                    value={part.qty || ''}
                                                    onChange={(e) => updateRow(part.id, 'qty', Number(e.target.value))}
                                                    className="bg-[#0d1015] border border-[#2a303c] focus:border-[#00e5ff] text-slate-200 rounded-md px-3 py-1.5 text-center font-mono font-bold outline-none transition-all"
                                                />
                                                <div className="flex items-center justify-center gap-2 opactiy-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => duplicateRow(part.id)}
                                                        className="p-1.5 text-slate-500 hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 rounded transition-colors"
                                                        title="Duplicate"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeRow(part.id)}
                                                        disabled={parts.length <= 1}
                                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded disabled:opacity-30 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Execute Block */}
                            <div className="pt-4 flex justify-end max-w-5xl mx-auto">
                                <button
                                    onClick={calculate}
                                    className="px-8 py-3 bg-gradient-to-r from-[#00e5ff] to-[#00b3cc] hover:from-[#00f2ff] hover:to-[#00c8e6] text-[#050b14] font-black uppercase tracking-widest rounded-lg flex items-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                                >
                                    <Calculator size={18} strokeWidth={2.5} />
                                    Generate Plan & Toolpath
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'result' && result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-5xl mx-auto space-y-6"
                        >
                            {/* Inner Result Tabs */}
                            <div className="flex justify-center border-b border-[#2a303c] mb-6">
                                <div className="flex gap-8">
                                    <button
                                        onClick={() => setResultTab('nested')}
                                        className={`pb-3 text-[11px] font-bold uppercase tracking-widest transition-colors relative ${resultTab === 'nested' ? 'text-[#00e5ff]' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-2"><Layers size={14} /> Layout Visuals</div>
                                        {resultTab === 'nested' && <motion.div layoutId="resultUnderline" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00e5ff]" />}
                                    </button>
                                    <button
                                        onClick={() => setResultTab('gcode')}
                                        className={`pb-3 text-[11px] font-bold uppercase tracking-widest transition-colors relative ${resultTab === 'gcode' ? 'text-[#ff9500]' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-2"><FileCode size={14} /> G-Code Toolpath</div>
                                        {resultTab === 'gcode' && <motion.div layoutId="resultUnderline" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#ff9500]" />}
                                    </button>
                                </div>
                            </div>

                            {resultTab === 'nested' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    {/* Efficiency Metrics */}
                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            { label: 'Efficiency', value: `${(100 - result.totalWastePct).toFixed(1)}%`, color: 'text-[#00e5ff]' },
                                            { label: 'Bars Required', value: result.totalStockUsed, color: 'text-white' },
                                            { label: 'Total Waste', value: `${result.totalWaste.toFixed(0)}mm`, color: 'text-[#f59e0b]' },
                                            { label: 'Pieces Cut', value: result.stats.totalCuts, color: 'text-slate-300' },
                                        ].map((metric, i) => (
                                            <div key={i} className="bg-[#1a1f26] border border-[#2a303c] rounded-xl p-4 flex flex-col items-center justify-center shadow-md">
                                                <div className={`text-2xl font-black font-mono tracking-tight ${metric.color} drop-shadow-md`}>{metric.value}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{metric.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <EngineeringVisualization status="valid" label="NESTING LAYOUT">
                                        <div className="w-full min-h-[100px] p-2 bg-[#05080a] rounded-lg border border-[#1e2530] overflow-hidden">
                                            <NestingVisualization result={result} compact={false} showLabels={true} bladeWidth={kerf} className="!bg-transparent !border-none !p-2" />
                                        </div>
                                    </EngineeringVisualization>

                                    <div className="bg-[#1a1f26] p-5 rounded-xl border border-[#2a303c] shadow-md">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detailed Cut Manifest</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {result.patterns.map((pat, idx) => (
                                                <div key={idx} className="bg-[#0d1015] p-3 rounded-lg border border-[#2a303c] shadow-sm flex flex-col h-full">
                                                    <div className="flex justify-between font-bold items-center mb-3 pb-2 border-b border-[#2a303c]">
                                                        <span className="text-[#00e5ff] text-xs font-mono tracking-widest">STOCK-{idx + 1}</span>
                                                        <span className="text-[10px] text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">{pat.waste.toFixed(0)}mm WST</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                                                        {pat.cuts.map((cut, ci) => (
                                                            <span key={ci} className="px-2 py-1 bg-[#1a1f26] border border-[#374151] text-slate-300 rounded text-[10px] font-mono shadow-sm hover:border-[#00e5ff] transition-colors cursor-default">
                                                                {cut.length}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {resultTab === 'gcode' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1a1f26] rounded-xl border border-[#2a303c] flex flex-col h-[600px] shadow-2xl overflow-hidden">
                                    <div className="flex justify-between items-center bg-[#0d1015] px-4 py-3 border-b border-[#2a303c]">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#ff9500] uppercase tracking-widest">
                                            <FileCode size={14} /> Generated Post-Processor Code
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(gcode)}
                                            className="px-3 py-1 bg-[#2a303c] hover:bg-[#374151] rounded text-[10px] font-bold text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                        >
                                            <Copy size={12} /> Copy to Clipboard
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4 bg-[#0a0c10]">
                                        <pre className="text-[#A6ACCD] font-mono text-[11px] leading-relaxed">
                                            {gcode.split('\n').map((line, i) => {
                                                let color = 'text-slate-300';
                                                if (line.startsWith('(')) color = 'text-slate-600 italic';
                                                else if (line.startsWith('G00')) color = 'text-[#82AAFF] font-bold';
                                                else if (line.startsWith('G01')) color = 'text-[#C3E88D] font-bold';
                                                else if (line.startsWith('M')) color = 'text-[#F07178] font-bold';
                                                else if (line.match(/[XYZF]/)) color = 'text-[#FFCB6B]';

                                                return <div key={i} className={color}><span className="text-slate-800 select-none mr-4">{String(i + 1).padStart(4, '0')}</span>{line}</div>;
                                            })}
                                        </pre>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
