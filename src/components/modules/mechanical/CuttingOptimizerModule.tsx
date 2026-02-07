import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Calculator, Settings, RotateCcw } from 'lucide-react';
import { calculateNesting, type CutItem, type NestingResult, type NestingOptions } from '@/utils/nestingAlgorithm';
import { NestingVisualization } from '@/components/NestingVisualization';
import { CalculatorInput } from "@/components/CalculatorInput";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

interface PartRow {
    id: string;
    label: string;
    length: number;
    qty: number;
}

export function CuttingOptimizerModule({ lang, dict }: { lang: string, dict: any }) {
    // State: Parts data grid
    const [parts, setParts] = useState<PartRow[]>([
        { id: generateId(), label: 'Part A', length: 500, qty: 5 },
        { id: generateId(), label: 'Part B', length: 800, qty: 3 },
        { id: generateId(), label: 'Part C', length: 300, qty: 8 },
    ]);

    // State: Optimization settings
    const [stockLength, setStockLength] = useState(6000);
    const [kerf, setKerf] = useState(4);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [algorithm, setAlgorithm] = useState<'bfd' | 'ffd'>('bfd');
    const [viewMode, setViewMode] = useState<'input' | 'result'>('input');
    const [result, setResult] = useState<NestingResult | null>(null);

    // Actions
    const addRow = useCallback(() => setParts(prev => [...prev, { id: generateId(), label: '', length: 0, qty: 1 }]), []);
    const removeRow = useCallback((id: string) => setParts(prev => prev.filter(p => p.id !== id)), []);
    const updateRow = useCallback((id: string, field: keyof PartRow, value: string | number) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }, []);
    const resetAll = useCallback(() => {
        setParts([{ id: generateId(), label: '', length: 0, qty: 1 }]);
        setResult(null);
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
        setViewMode('result');
    }, [parts, stockLength, kerf, trimStart, trimEnd, algorithm]);

    // Effective length
    const effectiveLength = stockLength - trimStart - trimEnd;

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">

            {/* Toolbar/Header */}
            <div className="flex items-center justify-between p-2 border-b border-[#333] bg-[#252525]">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('input')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${viewMode === 'input' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#333]'}`}
                    >
                        Input
                    </button>
                    <button
                        onClick={() => result && setViewMode('result')}
                        disabled={!result}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${viewMode === 'result' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#333] disabled:opacity-30'}`}
                    >
                        Results
                    </button>
                </div>
                <button onClick={resetAll} className="p-1 hover:bg-[#333] rounded text-slate-400" title="Reset">
                    <RotateCcw size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">

                {viewMode === 'input' && (
                    <div className="space-y-6">
                        {/* Settings */}
                        <div className="bg-[#252525] p-3 rounded-lg border border-[#333] space-y-3">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase">
                                <Settings size={12} />
                                Configuration
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <CalculatorInput label="Stock Length" unit="mm" value={stockLength} onChange={(e) => setStockLength(Number(e.target.value))} />
                                <CalculatorInput label="Blade Kerf" unit="mm" value={kerf} onChange={(e) => setKerf(Number(e.target.value))} />
                                <CalculatorInput label="Trim Start" unit="mm" value={trimStart} onChange={(e) => setTrimStart(Number(e.target.value))} />
                                <CalculatorInput label="Trim End" unit="mm" value={trimEnd} onChange={(e) => setTrimEnd(Number(e.target.value))} />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-[#333]">
                                <span>Algorithm: <span className="text-blue-400 uppercase">{algorithm}</span></span>
                                <span>Effective: <span className="text-white font-mono">{effectiveLength}mm</span></span>
                            </div>
                        </div>

                        {/* Parts List */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Parts List</h3>
                                <button onClick={addRow} className="flex items-center gap-1 text-[10px] bg-[#333] hover:bg-[#444] px-2 py-1 rounded text-white transition-colors">
                                    <Plus size={12} /> Add Part
                                </button>
                            </div>
                            <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333]">
                                <div className="grid grid-cols-[1fr_80px_60px_30px] gap-2 p-2 bg-[#252525] text-[10px] font-bold text-slate-500 uppercase">
                                    <span>Label</span>
                                    <span>Len (mm)</span>
                                    <span className="text-center">Qty</span>
                                    <span></span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {parts.map((part, i) => (
                                        <div key={part.id} className="grid grid-cols-[1fr_80px_60px_30px] gap-2 p-2 border-b border-[#2a2a2a] items-center text-xs hover:bg-[#222]">
                                            <input
                                                type="text"
                                                value={part.label}
                                                placeholder={`Part ${i + 1}`}
                                                onChange={(e) => updateRow(part.id, 'label', e.target.value)}
                                                className="bg-transparent border-none text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                            />
                                            <input
                                                type="number"
                                                value={part.length || ''}
                                                onChange={(e) => updateRow(part.id, 'length', Number(e.target.value))}
                                                className="bg-[#111] border border-[#333] rounded px-1 py-0.5 text-right text-blue-400 font-mono"
                                            />
                                            <input
                                                type="number"
                                                value={part.qty || ''}
                                                onChange={(e) => updateRow(part.id, 'qty', Number(e.target.value))}
                                                className="bg-[#111] border border-[#333] rounded px-1 py-0.5 text-center text-white font-mono"
                                            />
                                            <button
                                                onClick={() => removeRow(part.id)}
                                                disabled={parts.length <= 1}
                                                className="flex items-center justify-center text-slate-600 hover:text-red-400 disabled:opacity-20"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Calculate Action */}
                        <button
                            onClick={calculate}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <Calculator size={16} />
                            OPTIMIZE CUTS
                        </button>
                    </div>
                )}

                {viewMode === 'result' && result && (
                    <div className="space-y-4">
                        <EngineeringVisualization status="valid" label="CUTTING PLAN">
                            <div className="w-full min-h-[100px] p-2">
                                {/* We wrap the existing component but might need to adjust styles via CSS injection if needed */}
                                <div className="text-[10px] text-center mb-2 text-slate-500 uppercase tracking-widest">
                                    Efficiency: {(100 - result.totalWastePct).toFixed(1)}% | Bars: {result.totalStockUsed}
                                </div>
                                <NestingVisualization result={result} compact={true} showLabels={false} className="!bg-transparent !border-none !p-0" />
                            </div>
                        </EngineeringVisualization>

                        <div className="bg-[#252525] p-3 rounded-lg border border-[#333]">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Cut List</h3>
                            <div className="space-y-2">
                                {result.patterns.map((pat, idx) => (
                                    <div key={idx} className="text-xs bg-[#1a1a1a] p-2 rounded border border-[#333]">
                                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                                            <span>Bar #{idx + 1}</span>
                                            <span className="text-slate-500">{pat.waste.toFixed(0)}mm waste</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {pat.cuts.map((cut, ci) => (
                                                <span key={ci} className="px-1.5 py-0.5 bg-blue-900/30 border border-blue-800 text-blue-300 rounded text-[10px] font-mono">
                                                    {cut.length}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
