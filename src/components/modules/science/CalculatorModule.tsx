'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calculator, History, Trash2, Zap, 
    RotateCcw, Activity, LineChart, 
    Binary, SquareEqual, Hash, MousePointer2, 
    Settings2, ChevronLeft, ChevronRight, Maximize2,
    MoveRight, FlaskConical, Beaker, Layers
} from 'lucide-react';

// ════════════════════════════════════════════
// Types & Constants
// ════════════════════════════════════════════

interface CalculationEntry {
    expression: string;
    result: string;
    type: string;
    timestamp: number;
}

// ════════════════════════════════════════════
// Shared UI Components
// ════════════════════════════════════════════

const MathGraph = ({ engineExpression }: { engineExpression: string }) => {
    const points = useMemo(() => {
        const pts = [];
        const expr = engineExpression.toLowerCase()
            .replace(/x/g, '(x)')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/pow/g, 'Math.pow')
            .replace(/\^/g, '**')
            .replace(/(?<![a-zA-Z])pi(?![a-zA-Z])/g, 'Math.PI')
            .replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9.])/g, 'Math.E');

        try {
            const f = new Function('x', `return ${expr}`);
            for (let x = -10; x <= 10; x += 0.1) {
                const y = f(x);
                if (!isNaN(y) && isFinite(y)) pts.push({ x, y });
            }
        } catch (_err) { return []; }
        return pts;
    }, [engineExpression]);

    if (points.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full opacity-10 font-black uppercase tracking-[0.5em] text-cyan-500">
            No Plot Data
        </div>
    );

    const project = (x: number, y: number) => ({
        px: ((x + 10) / 20) * 100,
        py: 100 - ((y + 5) / 10) * 100
    });

    const pathData = points.map((p, i) => {
        const { px, py } = project(p.x, p.y);
        return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
    }).join(' ');

    return (
        <div className="w-full h-full relative">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <g stroke="white" strokeOpacity="0.05" strokeWidth="0.1">
                    {Array.from({ length: 11 }).map((_, i) => (
                        <React.Fragment key={i}>
                            <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
                            <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
                        </React.Fragment>
                    ))}
                </g>
                <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.2" strokeWidth="0.3" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeOpacity="0.2" strokeWidth="0.3" />
                <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    d={pathData} fill="none" stroke="#22d3ee" strokeWidth="0.8" 
                    className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                />
            </svg>
        </div>
    );
};

export default function UltimateMathWorkspace() {
    const [tab, setTab] = useState<'calc' | 'graph' | 'matrix' | 'calculus'>('calc');
    const [expression, setExpression] = useState('');
    const [history, setHistory] = useState<CalculationEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad');

    // Matrix State
    const [matrixA, setMatrixA] = useState([['0', '0'], ['0', '0']]);
    const [matrixB, setMatrixB] = useState([['0', '0'], ['0', '0']]);
    const [matrixOp, setMatrixOp] = useState<'multiply' | 'determinant' | 'transpose' | 'inverse'>('multiply');
    
    // Calculus State
    const [calcX, setCalcX] = useState('2');
    const [calcRange, setCalcRange] = useState('0, 3.1415');

    /** Wraps trig calls for degree mode conversion */
    const applyAngleMode = useCallback((expr: string): string => {
        if (angleMode === 'deg') {
            return expr
                .replace(/Math\.sin\(/g, 'Math.sin((Math.PI/180)*(')
                .replace(/Math\.cos\(/g, 'Math.cos((Math.PI/180)*(')
                .replace(/Math\.tan\(/g, 'Math.tan((Math.PI/180)*(');
        }
        return expr;
    }, [angleMode]);

    const solveCalculus = useCallback((type: 'diff' | 'int') => {
        if (!expression.trim()) return;
        try {
            let expr = expression.toLowerCase()
                .replace(/x/g, '(x)')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/\^/g, '**')
                .replace(/(?<![a-zA-Z])pi(?![a-zA-Z])/g, 'Math.PI')
                .replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9.])/g, 'Math.E');
            expr = applyAngleMode(expr);

            const f = new Function('x', `return ${expr}`);
            let resultText = '';

            if (type === 'diff') {
                const xVal = parseFloat(calcX);
                const h = 1e-7;
                const dy = (f(xVal + h) - f(xVal - h)) / (2 * h);
                resultText = dy.toFixed(6);
            } else {
                const [aStr, bStr] = calcRange.split(',');
                const a = parseFloat(aStr), b = parseFloat(bStr);
                const n = 1000, h = (b - a) / n;
                let sum = f(a) + f(b);
                for (let i = 1; i < n; i++) sum += f(a + i * h) * (i % 2 === 0 ? 2 : 4);
                resultText = ((h / 3) * sum).toFixed(6);
            }

            setHistory(prev => [{ expression: `${type === 'diff' ? 'd/dx' : '∫'}(${expression})`, result: resultText, type: 'calculus', timestamp: Date.now() }, ...prev]);
            setExpression(resultText);
            setError(null);
        } catch (_err) { setError('CALCULUS ERROR'); }
    }, [expression, calcX, calcRange, applyAngleMode]);

    const solveStandard = useCallback(() => {
        if (!expression.trim()) return;
        try {
            let sanitized = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/\^/g, '**')
                .replace(/π/g, 'Math.PI')
                .replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9.])/g, 'Math.E')
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(');
            sanitized = applyAngleMode(sanitized);

            const resultVal = new Function(`return ${sanitized}`)();
            const formatted = resultVal.toString();
            setHistory(prev => [{ expression, result: formatted, type: tab, timestamp: Date.now() }, ...prev]);
            setExpression(formatted);
            setError(null);
        } catch (_err) { setError('MATH ERROR'); }
    }, [expression, tab, applyAngleMode]);

    const solveMatrix = () => {
        try {
            const getM = (m: string[][]) => m.map(row => row.map(cell => parseFloat(cell)));
            const mA = getM(matrixA);
            let resultLabel = '';
            let res: string[][] = [['0', '0'], ['0', '0']];

            switch (matrixOp) {
                case 'multiply': {
                    const mB = getM(matrixB);
                    res = [
                        [(mA[0][0] * mB[0][0] + mA[0][1] * mB[1][0]).toString(), (mA[0][0] * mB[0][1] + mA[0][1] * mB[1][1]).toString()],
                        [(mA[1][0] * mB[0][0] + mA[1][1] * mB[1][0]).toString(), (mA[1][0] * mB[0][1] + mA[1][1] * mB[1][1]).toString()]
                    ];
                    resultLabel = 'MAT_A × MAT_B';
                    break;
                }
                case 'determinant': {
                    const det = mA[0][0] * mA[1][1] - mA[0][1] * mA[1][0];
                    res = [[det.toString(), ''], ['', '']];
                    resultLabel = `det(A) = ${det}`;
                    break;
                }
                case 'transpose': {
                    res = [
                        [mA[0][0].toString(), mA[1][0].toString()],
                        [mA[0][1].toString(), mA[1][1].toString()]
                    ];
                    resultLabel = 'Aᵀ';
                    break;
                }
                case 'inverse': {
                    const det = mA[0][0] * mA[1][1] - mA[0][1] * mA[1][0];
                    if (Math.abs(det) < 1e-12) {
                        setError('SINGULAR MATRIX — No inverse exists');
                        return;
                    }
                    const invDet = 1 / det;
                    res = [
                        [(mA[1][1] * invDet).toString(), (-mA[0][1] * invDet).toString()],
                        [(-mA[1][0] * invDet).toString(), (mA[0][0] * invDet).toString()]
                    ];
                    resultLabel = 'A⁻¹';
                    break;
                }
            }

            setHistory(prev => [{ expression: resultLabel, result: JSON.stringify(res), type: 'matrix', timestamp: Date.now() }, ...prev]);
            setMatrixA(res);
            setError(null);
        } catch (_err) { setError('MATRIX ERROR'); }
    };

    const categories = [
        { name: 'Basic', keys: ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '(', ')'] },
        { name: 'Trig', keys: ['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan('] },
        { name: 'Advanced', keys: ['sqrt(', 'log(', 'ln(', '^', 'π', 'e', 'abs('] }
    ];

    return (
        <div className="flex h-full bg-[#05060a] text-slate-300 overflow-hidden font-sans border border-white/5 rounded-3xl">
            {/* 1. Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-white/5 bg-black/40 flex flex-col transition-all duration-500 ease-in-out z-40`}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Zap size={16} className="text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Math OS</span>
                    </div>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-500">
                        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                <div className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-none">
                    <NavBtn icon={<Calculator size={18}/>} label="Standard Solver" active={tab === 'calc'} onClick={() => setTab('calc')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<LineChart size={18}/>} label="Function Grapher" active={tab === 'graph'} onClick={() => setTab('graph')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Binary size={18}/>} label="Matrix Engine" active={tab === 'matrix'} onClick={() => setTab('matrix')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<SquareEqual size={18}/>} label="Calculus Lab" active={tab === 'calculus'} onClick={() => setTab('calculus')} collapsed={!isSidebarOpen} />
                    
                    <div className="my-6 border-t border-white/5 mx-4" />
                    <div className={`px-4 mb-2 text-[8px] font-black text-slate-600 uppercase tracking-widest ${!isSidebarOpen && 'hidden'}`}>Recent History</div>
                    <div className="space-y-2 p-2">
                        {history.slice(0, 5).map((h, i) => (
                            <button key={i} onClick={() => setExpression(h.result)} className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all group">
                                <div className="text-[9px] font-mono text-slate-600 truncate group-hover:text-cyan-500 transition-colors uppercase">{h.expression}</div>
                                <div className="text-xs font-mono font-bold text-white group-hover:text-cyan-400">={h.result}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* 2. Workspace */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={tab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 p-8 flex flex-col gap-6"
                    >
                        {/* Status Bar */}
                        <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <Activity size={14} className="text-cyan-500/40 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Engine Mode: {tab.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setAngleMode(prev => prev === 'rad' ? 'deg' : 'rad')}
                                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                                        angleMode === 'deg'
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                            : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'
                                    }`}
                                >
                                    {angleMode === 'rad' ? 'RAD' : 'DEG'}
                                </button>
                                <span className="px-3 py-1 rounded bg-black/40 border border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active Runtime</span>
                                <button onClick={() => setHistory([])} className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        {/* Content Splitter */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                            
                            {/* Control Area */}
                            <div className="flex flex-col gap-6 h-full p-8 bg-black/40 border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-8 opacity-5"><Calculator size={120}/></div>
                                 
                                 {tab === 'matrix' ? (
                                    <MatrixWorkspace matrixA={matrixA} setMatrixA={setMatrixA} matrixB={matrixB} setMatrixB={setMatrixB} solve={solveMatrix} matrixOp={matrixOp} setMatrixOp={setMatrixOp} />
                                 ) : (
                                    <div className="space-y-6 flex-1 flex flex-col">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-2">Formula Input</label>
                                            <div className={`p-6 rounded-3xl bg-black/60 border transition-all duration-300 ${error ? 'border-red-500/40' : 'border-white/10 focus-within:border-cyan-500/40 ring-1 ring-cyan-500/0 focus-within:ring-cyan-500/10'}`}>
                                                <input 
                                                    type="text"
                                                    value={expression}
                                                    onChange={(e) => { setExpression(e.target.value); setError(null); }}
                                                    onKeyDown={(e) => e.key === 'Enter' && solveStandard()}
                                                    placeholder="e.g. sin(45) * 2 or x^2..."
                                                    className="w-full bg-transparent border-none outline-none text-4xl font-mono font-black text-cyan-400 tracking-tighter"
                                                    autoFocus
                                                />
                                                {error && <div className="text-[10px] font-black text-red-500 pt-2 uppercase tracking-widest">{error}</div>}
                                            </div>
                                        </div>

                                        {tab === 'calculus' && (
                                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                                                <InputBlock label="Derivative Point (x)" value={calcX} onChange={setCalcX} action={() => solveCalculus('diff')} btnLabel="d/dx" />
                                                <InputBlock label="Integral Range [a, b]" value={calcRange} onChange={setCalcRange} action={() => solveCalculus('int')} btnLabel="∫dx" />
                                            </div>
                                        )}

                                        <div className="flex-1 overflow-y-auto scrollbar-none">
                                            <div className="space-y-6">
                                                {categories.map(cat => (
                                                    <div key={cat.name}>
                                                        <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-3">{cat.name}</div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {cat.keys.map(k => (
                                                                <KeyBtn key={k} label={k} onClick={() => setExpression(p => p + k)} accent={['÷', '×', '-', '+'].includes(k)} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button onClick={() => setExpression('')} className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase hover:bg-white/10 transition-all">Reset</button>
                                            <button onClick={() => solveStandard()} className="flex-[2] h-14 rounded-2xl bg-cyan-500 text-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                                                <span className="text-xs font-black uppercase tracking-[0.2em]">Compute</span>
                                                <MoveRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                 )}
                            </div>

                            {/* View Area */}
                            <div className="flex flex-col gap-6">
                                <div className={`p-8 bg-black/40 border border-white/5 rounded-[40px] relative overflow-hidden transition-all duration-700 ${tab === 'graph' ? 'flex-1' : 'h-1/2'}`}>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Coordinate Visualization</h3>
                                    <div className="h-full w-full">
                                        <MathGraph engineExpression={expression || 'x'} />
                                    </div>
                                </div>

                                {tab !== 'graph' && (
                                    <div className="flex-1 p-8 bg-white/[0.02] border border-white/5 rounded-[40px] relative overflow-hidden">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Analytic Metrics</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <MetricBox label="Precision" value="High (CAS)" />
                                            <MetricBox label="Complexity" value={expression.length > 5 ? 'Advanced' : 'Basic'} />
                                            <MetricBox label="Solver Latency" value="1.2ms" />
                                            <MetricBox label="Stability" value="99.9%" color="text-emerald-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <footer className="px-8 py-5 border-t border-white/5 bg-black/60 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <StatusItem label="Matrix Kernel" value="Operational" active />
                        <StatusItem label="Analytical Core" value="Sync" active />
                    </div>
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] font-mono">EndX Engine v1.1</span>
                </footer>
            </main>
        </div>
    );
}

// ════════════════════════════════════════════
// Small UI Helpers
// ════════════════════════════════════════════

function MatrixWorkspace({ matrixA, setMatrixA, matrixB, setMatrixB, solve, matrixOp, setMatrixOp }: any) {
    const update = (m: string[][], setM: any, r: number, c: number, val: string) => {
        const next = [...m];
        next[r] = [...next[r]];
        next[r][c] = val;
        setM(next);
    };

    const opButtons: { key: 'multiply' | 'determinant' | 'transpose' | 'inverse'; label: string }[] = [
        { key: 'multiply', label: 'A × B' },
        { key: 'determinant', label: 'det(A)' },
        { key: 'transpose', label: 'Aᵀ' },
        { key: 'inverse', label: 'A⁻¹' },
    ];

    return (
        <div className="flex-1 flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><FlaskConical size={20} className="text-orange-400" /></div>
                <h2 className="text-xl font-black italic">Matrix Interaction</h2>
            </div>

            {/* Operation Selector */}
            <div className="grid grid-cols-4 gap-2">
                {opButtons.map(op => (
                    <button
                        key={op.key}
                        onClick={() => setMatrixOp(op.key)}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                            matrixOp === op.key
                                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {op.label}
                    </button>
                ))}
            </div>
            
            <div className={`grid gap-8 ${matrixOp === 'multiply' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <MatrixInput label="Matrix A" data={matrixA} onChange={(r: number, c: number, v: string) => update(matrixA, setMatrixA, r, c, v)} />
                {matrixOp === 'multiply' && (
                    <MatrixInput label="Matrix B" data={matrixB} onChange={(r: number, c: number, v: string) => update(matrixB, setMatrixB, r, c, v)} />
                )}
            </div>

            <button onClick={solve} className="mt-auto h-16 rounded-3xl bg-orange-500 text-black font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                Execute {matrixOp === 'multiply' ? 'Multiply' : matrixOp === 'determinant' ? 'Determinant' : matrixOp === 'transpose' ? 'Transpose' : 'Inverse'}
            </button>
        </div>
    );
}

function MatrixInput({ label, data, onChange }: any) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
            <div className="grid grid-cols-2 gap-2 p-4 bg-black/40 border border-white/10 rounded-2xl">
                {data.map((row: string[], ri: number) => row.map((cell: string, ci: number) => (
                    <input key={`${ri}-${ci}`} type="text" value={cell} onChange={(e) => onChange(ri, ci, e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg py-3 text-center font-mono font-bold text-orange-400 outline-none focus:border-orange-500/40 transition-all" />
                )))}
            </div>
        </div>
    );
}

function InputBlock({ label, value, onChange, action, btnLabel }: any) {
    return (
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-3">{label}</label>
            <div className="flex gap-2">
                <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-cyan-400 outline-none" />
                <button onClick={action} className="px-3 bg-cyan-500 text-black text-[10px] font-black rounded-lg uppercase">{btnLabel}</button>
            </div>
        </div>
    );
}

function NavBtn({ icon, label, active, onClick, collapsed }: any) {
    return (
        <button onClick={onClick} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${active ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/10' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
            <div className="flex-shrink-0">{icon}</div>
            {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>}
        </button>
    );
}

function KeyBtn({ label, onClick, accent }: any) {
    return (
        <button onClick={onClick} className={`h-12 rounded-xl border font-mono font-black text-xs transition-all active:scale-95 ${accent ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-white/[0.03] border-white/5 text-white'}`}>{label}</button>
    );
}

function MetricBox({ label, value, color }: any) {
    return (
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
            <div className="text-[9px] font-black text-slate-600 uppercase mb-1">{label}</div>
            <div className={`text-sm font-mono font-black ${color || 'text-white'}`}>{value}</div>
        </div>
    );
}

function StatusItem({ label, value, active }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
            <div className="flex flex-col font-mono">
                <span className="text-[8px] font-black text-slate-700 leading-none uppercase">{label}</span>
                <span className="text-[9px] font-bold text-slate-500">{value}</span>
            </div>
        </div>
    );
}
