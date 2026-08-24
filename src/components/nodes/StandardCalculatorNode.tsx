import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useFlowStore, StandardCalculatorNodeData } from '@/store/flowStore';
import { X, Delete, ChevronRight, Calculator, Activity, Sigma, Variable, LineChart, History, Trash2, Save } from 'lucide-react';
import nerdamer from 'nerdamer';
import functionPlot from 'function-plot';

// Load nerdamer plugins
try {
    // Dynamic imports for Nerdamer (Client-side only)
    import('nerdamer/Algebra');
    import('nerdamer/Calculus');
    import('nerdamer/Solve');
    import('nerdamer/Extra');
} catch (e) {
    console.warn('Nerdamer plugins failed to load', e);
}

type Tab = 'CALC' | 'GRAPH' | 'VARS' | 'HIST';

interface HistoryItem {
    expr: string;
    res: string;
}

interface VariableItem {
    name: string;
    value: string;
}

export default function StandardCalculatorNode({ id, data, selected }: NodeProps<StandardCalculatorNodeData>) {
    const { removeNode, updateNodeData } = useFlowStore();
    const [display, setDisplay] = useState(data.result || '');
    const [expr, setExpr] = useState(data.expression || '');
    const [activeTab, setActiveTab] = useState<Tab>('CALC');
    const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('RAD');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [variables, setVariables] = useState<VariableItem[]>([]);

    // Refs for Graph
    const graphRef = useRef<HTMLDivElement>(null);

    // Sync data
    useEffect(() => {
        if (data.result && data.result !== display) setDisplay(data.result);
    }, [data.result]);

    // Graph Effect
    useEffect(() => {
        if (activeTab === 'GRAPH' && graphRef.current) {
            try {
                // Default graph or plotted expression
                const fn = expr || 'x^2';

                functionPlot({
                    target: graphRef.current,
                    width: 320,
                    height: 250,
                    yAxis: { domain: [-10, 10] },
                    xAxis: { domain: [-10, 10] },
                    grid: true,
                    data: [
                        {
                            fn: fn.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '^'),
                            color: '#06b6d4' // Cyan
                        }
                    ]
                });
            } catch (e) {
                console.warn('Graph error', e);
            }
        }
    }, [activeTab, expr]); // Re-render graph when tab opens or expr changes

    const addToHistory = (expression: string, result: string) => {
        setHistory(prev => [{ expr: expression, res: result }, ...prev].slice(0, 10));
    };

    const handleEval = () => {
        try {
            let evalExpr = expr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/√/g, 'sqrt')
                .replace(/π/g, 'PI');

            // Set variables context if needed (nerdamer is global, but we can manage scope manually if needed)
            // For now, assume global scope which is fine for single user session

            const res = nerdamer(evalExpr).evaluate().text();
            setDisplay(res);
            updateNodeData(id, { expression: expr, result: res });
            addToHistory(expr, res);

            // Check if assignment (e.g. x=5)
            if (evalExpr.includes('=')) {
                // Refresh variables
                // Nerdamer doesn't easily expose list of vars, so we manually track common ones or parse
                // For this UI, we'll just parse basic assignments manually for the list
                const parts = evalExpr.split('=');
                if (parts.length === 2) {
                    const varName = parts[0].trim();
                    const varVal = parts[1].trim();
                    setVariables(prev => {
                        const filtered = prev.filter(v => v.name !== varName);
                        return [...filtered, { name: varName, value: varVal }];
                    });
                }
            }
        } catch (e) {
            setDisplay('Error');
        }
    };

    const handleCalculus = (op: 'diff' | 'integrate') => {
        try {
            let evalExpr = expr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/\^/g, '^');

            const res = op === 'diff'
                ? nerdamer(`diff(${evalExpr}, x)`).text()
                : nerdamer(`integrate(${evalExpr}, x)`).text();

            setDisplay(res);
            updateNodeData(id, { expression: expr, result: res });
            addToHistory(`${op}(${expr})`, res);
        } catch (e) {
            setDisplay('Error (Use x)');
        }
    };

    const handleBtnClick = (val: string) => {
        if (val === 'C') {
            setDisplay('');
            setExpr('');
            return;
        }
        if (val === 'DEL') {
            setExpr(prev => prev.slice(0, -1));
            return;
        }
        if (val === '=') {
            handleEval();
            return;
        }
        setExpr(prev => prev + val);
    };

    const Btn = ({ v, label, wide, color, onClick }: { v: string, label?: React.ReactNode, wide?: boolean, color?: string, onClick?: () => void }) => (
        <button
            className={`
                nodrag h-8 text-xs font-medium rounded items-center justify-center flex transition-all active:scale-95
                ${wide ? 'col-span-2' : ''}
                ${color === 'cyan' ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20' :
                    color === 'amber' ? 'bg-amber-900/20 text-amber-500 border border-amber-900/40 hover:bg-amber-900/30' :
                        color === 'purple' ? 'bg-purple-900/20 text-purple-400 border border-purple-900/40 hover:bg-purple-900/30' :
                            color === 'red' ? 'bg-red-900/20 text-red-400 border border-red-900/40 hover:bg-red-900/30' :
                                color === 'slate' ? 'bg-[#1e293b] text-slate-200 border border-slate-700 hover:bg-slate-700' :
                                    'bg-[#0f1419] text-gray-400 border border-[#1e293b] hover:bg-[#1e293b] hover:text-white'
                }
            `}
            onClick={(e) => { e.stopPropagation(); onClick ? onClick() : handleBtnClick(v); }}
        >
            {label || v}
        </button>
    );

    return (
        <div className={`
            relative flex flex-col w-[350px] bg-[#05080a] border rounded-xl shadow-2xl overflow-hidden backdrop-blur-md transition-shadow duration-300
            ${selected ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'border-[#1e293b]'}
        `}>
            {/* Header Tabs */}
            <div className="flex items-center bg-[#0f1419] border-b border-[#1e293b]">
                <button onClick={() => setActiveTab('CALC')} className={`flex-1 flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'CALC' ? 'text-cyan-400 bg-[#1e293b]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Calculator size={14} className="mr-1" /> Calc
                </button>
                <button onClick={() => setActiveTab('GRAPH')} className={`flex-1 flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'GRAPH' ? 'text-cyan-400 bg-[#1e293b]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <LineChart size={14} className="mr-1" /> Graph
                </button>
                <button onClick={() => setActiveTab('VARS')} className={`flex-1 flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'VARS' ? 'text-cyan-400 bg-[#1e293b]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Variable size={14} className="mr-1" /> Vars
                </button>
                <button onClick={() => setActiveTab('HIST')} className={`flex-1 flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'HIST' ? 'text-cyan-400 bg-[#1e293b]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <History size={14} className="mr-1" /> History
                </button>
                <button onClick={() => removeNode(id)} className="w-8 flex items-center justify-center text-slate-600 hover:text-red-400 border-l border-[#1e293b]">
                    <X size={14} />
                </button>
            </div>

            {/* TAB CONTENT */}

            {/* CALC TAB */}
            {activeTab === 'CALC' && (
                <>
                    {/* Display */}
                    <div className="p-4 bg-[#020405] border-b border-[#1e293b]">
                        <input
                            className="nodrag w-full bg-transparent text-right text-sm text-slate-300 font-mono focus:outline-none placeholder:text-slate-700"
                            value={expr}
                            onChange={(e) => setExpr(e.target.value)}
                            placeholder="Enter expression..."
                        />
                        <div className="mt-2 text-right text-2xl font-bold text-white font-mono tracking-wider text-shadow-cyan overflow-x-auto scrollbar-hide">
                            {display || '0'}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex bg-[#1e293b] p-0.5 justify-between px-2">
                        <div className="flex gap-0.5">
                            <button onClick={() => setAngleMode('DEG')} className={`text-[9px] px-2 py-0.5 rounded ${angleMode === 'DEG' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>DEG</button>
                            <button onClick={() => setAngleMode('RAD')} className={`text-[9px] px-2 py-0.5 rounded ${angleMode === 'RAD' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>RAD</button>
                        </div>
                    </div>

                    {/* Keypad */}
                    <div className="p-3 grid grid-cols-5 gap-1.5 bg-[#05080a]">
                        <Btn v="diff" label="d/dx" color="purple" onClick={() => handleCalculus('diff')} />
                        <Btn v="int" label="∫" color="purple" onClick={() => handleCalculus('integrate')} />
                        <Btn v="solve" label="Solve" color="amber" />
                        <Btn v="x" label="x" color="amber" />
                        <Btn v="C" color="red" />

                        <div className="col-span-5 h-px bg-[#1e293b] my-0.5" />

                        <Btn v="sin(" label="sin" />
                        <Btn v="cos(" label="cos" />
                        <Btn v="tan(" label="tan" />
                        <Btn v="(" />
                        <Btn v=")" />

                        <Btn v="log(" label="log" />
                        <Btn v="ln(" label="ln" />
                        <Btn v="sqrt(" label="√" />
                        <Btn v="^" label="^" />
                        <Btn v="PI" label="π" />

                        <div className="col-span-5 h-px bg-[#1e293b] my-0.5" />

                        <Btn v="7" />
                        <Btn v="8" />
                        <Btn v="9" />
                        <Btn v="DEL" label={<Delete size={14} />} color="slate" />
                        <Btn v="÷" color="slate" />

                        <Btn v="4" />
                        <Btn v="5" />
                        <Btn v="6" />
                        <Btn v="×" color="slate" />
                        <Btn v="-" color="slate" />

                        <Btn v="1" />
                        <Btn v="2" />
                        <Btn v="3" />
                        <Btn v="+" color="slate" />
                        <Btn v="=" color="cyan" />

                        <Btn v="0" wide />
                        <Btn v="." />
                        {/* Empty slots for alignment if needed, or expand 0 */}
                    </div>
                </>
            )}

            {/* GRAPH TAB */}
            {activeTab === 'GRAPH' && (
                <div className="p-2 bg-[#05080a] flex flex-col items-center">
                    <div className="w-full mb-2 flex gap-2">
                        <input
                            className="nodrag flex-1 bg-[#1e293b] border border-[#2a3a4a] rounded px-2 py-1 text-xs text-white"
                            value={expr}
                            onChange={(e) => setExpr(e.target.value)}
                            placeholder="y = x^2"
                        />
                        <button className="nodrag bg-cyan-600 text-white px-3 rounded text-xs" onClick={() => setActiveTab('GRAPH')}>Plot</button>
                    </div>
                    <div ref={graphRef} className="nodrag bg-[#000] rounded overflow-hidden" />
                    <div className="text-[10px] text-gray-500 mt-2 text-center">
                        Drag to pan • Scroll to zoom
                    </div>
                </div>
            )}

            {/* VARS TAB */}
            {activeTab === 'VARS' && (
                <div className="p-2 bg-[#05080a] min-h-[300px] relative">
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Defined Variables (Connectable)</h3>
                    {variables.length === 0 ? (
                        <div className="text-gray-600 text-xs italic text-center mt-10">No variables defined.<br />Try: a = 10</div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {variables.map((v, i) => (
                                <div key={i} className="relative flex items-center justify-between bg-[#1e293b] p-2 rounded border border-[#2a3a4a] group">
                                    <span className="text-amber-400 font-bold text-xs">{v.name}</span>
                                    <span className="text-white text-xs mr-4">{v.value}</span>

                                    {/* Connection Point */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                                        <div className="text-[9px] text-gray-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">Connect</div>
                                        <Handle
                                            type="source"
                                            position={Position.Right}
                                            id={v.name}
                                            className="!bg-amber-500 !w-3 !h-3 !static !translate-x-0"
                                            style={{ right: -6 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'HIST' && (
                <div className="p-2 bg-[#05080a] min-h-[300px] overflow-y-auto custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-gray-600 text-xs italic text-center mt-10">History is empty</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {history.map((h, i) => (
                                <div key={i} className="bg-[#1e293b]/50 p-2 rounded border border-[#2a3a4a] hover:bg-[#1e293b] transition-colors cursor-pointer"
                                    onClick={() => { setExpr(h.expr); setActiveTab('CALC'); }}
                                >
                                    <div className="text-xs text-gray-400 mb-1">{h.expr}</div>
                                    <div className="text-sm font-bold text-cyan-400 text-right">= {h.res}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {history.length > 0 && (
                        <button
                            onClick={() => setHistory([])}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:bg-red-900/20 rounded border border-red-900/40"
                        >
                            <Trash2 size={12} /> Clear History
                        </button>
                    )}
                </div>
            )}

            <Handle type="source" position={Position.Right} id="res" className="!bg-cyan-500 !w-3 !h-3" />
            <Handle type="target" position={Position.Left} id="input" className="!bg-amber-500 !w-3 !h-3" />
        </div>
    );
}
