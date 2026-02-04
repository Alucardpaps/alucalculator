"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, Maximize2, Minimize2 } from 'lucide-react';

interface SavedVar {
    id: string;
    name: string;
    value: number;
}

type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export const AdvancedCalculator = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    // Core State
    const [display, setDisplay] = useState('');
    const [result, setResult] = useState<string>('');
    const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
    const [isShift, setIsShift] = useState(false);
    const [isAlpha, setIsAlpha] = useState(false);
    const [isHyp, setIsHyp] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    // Display State
    const [showFrac, setShowFrac] = useState(false); // Toggle for S<=>D

    // Memory State
    const [savedVars, setSavedVars] = useState<SavedVar[]>([]);
    const [varName, setVarName] = useState('');

    // Responsive State
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Responsive Scale Logic
    useEffect(() => {
        if (!isOpen) return;

        const handleResize = () => {
            if (containerRef.current) {
                const vw = window.innerWidth;
                const vh = window.innerHeight;

                // Target width for the calculator container (approx 1000px + padding)
                const targetWidth = 1050;
                // Available height minus padding
                const availableHeight = vh - 40;

                // Calculate scale needed to fit width
                let scaleX = 1;
                if (vw < targetWidth) {
                    scaleX = (vw - 20) / targetWidth; // 20px buffer
                }

                // Calculate scale needed to fit height (vertical constraint)
                // Base height 800px. Available height = vh - 40 (padding)
                let scaleY = 1;
                const targetHeight = 840; // 800px + some breathing room
                if (vh < targetHeight) {
                    scaleY = (vh - 40) / 800;
                }

                // Use the smaller scale to ensure it fits completely
                setScale(Math.min(scaleX, scaleY));
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);


    // Load vars
    useEffect(() => {
        const saved = localStorage.getItem('alu_calc_vars');
        if (saved) {
            try { setSavedVars(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
    }, []);

    // Save vars
    useEffect(() => {
        localStorage.setItem('alu_calc_vars', JSON.stringify(savedVars));
    }, [savedVars]);

    // --- Math Engine ---

    const factorial = (n: number): number => {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    };

    const nPr = (n: number, r: number): number => factorial(n) / factorial(n - r);
    const nCr = (n: number, r: number): number => factorial(n) / (factorial(r) * factorial(n - r));

    const toFraction = (n: number): string => {
        if (!Number.isFinite(n)) return n.toString();
        if (Number.isInteger(n)) return n.toString();
        const tolerance = 1.0E-9;
        let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
        let b = n;
        do {
            let a = Math.floor(b);
            let aux = h1; h1 = a * h1 + h2; h2 = aux;
            aux = k1; k1 = a * k1 + k2; k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(n - h1 / k1) > n * tolerance);
        if (k1 > 10000) return n.toString();
        return `${h1}/${k1}`;
    };

    const toDMS = (deg: number): string => {
        const d = Math.floor(deg);
        const minFloat = (deg - d) * 60;
        const m = Math.floor(minFloat);
        const s = ((minFloat - m) * 60).toFixed(2);
        return `${d}°${m}'${s}"`;
    };

    const handleCalculate = useCallback(() => {
        if (!display) return;
        try {
            let expr = display;
            expr = expr.replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');

            const toRad = (deg: number) => angleMode === 'DEG' ? deg * Math.PI / 180 : (angleMode === 'GRAD' ? deg * Math.PI / 200 : deg);
            const fromRad = (rad: number) => angleMode === 'DEG' ? rad * 180 / Math.PI : (angleMode === 'GRAD' ? rad * 200 / Math.PI : rad);

            const context = {
                sin: (x: number) => Math.sin(toRad(x)),
                cos: (x: number) => Math.cos(toRad(x)),
                tan: (x: number) => Math.tan(toRad(x)),
                asin: (x: number) => fromRad(Math.asin(x)),
                acos: (x: number) => fromRad(Math.acos(x)),
                atan: (x: number) => fromRad(Math.atan(x)),
                sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
                asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
                log: Math.log10, ln: Math.log,
                sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, pow: Math.pow,
                fact: factorial, nPr: nPr, nCr: nCr,
                Pol: (x: number, y: number) => Math.hypot(x, y),
                Rec: (r: number, t: number) => r * Math.cos(toRad(t))
            };

            expr = expr.replace(/([\d.]+)!/g, 'fact($1)');
            expr = expr.replace(/([\d.]+)P([\d.]+)/g, 'nPr($1,$2)');
            expr = expr.replace(/([\d.]+)C([\d.]+)/g, 'nCr($1,$2)');
            expr = expr.replace(/\^/g, '**');
            expr = expr.replace(/²/g, '**2').replace(/³/g, '**3');
            expr = expr.replace(/√\(/g, 'sqrt(');
            expr = expr.replace(/(\d+)%/g, '($1/100)');

            const keys = Object.keys(context);
            const values = Object.values(context);
            // eslint-disable-next-line no-new-func
            const func = new Function(...keys, `return ${expr};`);
            const val = func(...values);

            if (isNaN(val) || !isFinite(val)) throw new Error("Math Error");
            const cleanVal = parseFloat(val.toPrecision(12));
            setResult(cleanVal.toString());
            setHistory(prev => [`${display} = ${cleanVal}`, ...prev].slice(0, 20));
            setIsShift(false); setIsAlpha(false);

        } catch (e: any) {
            setResult('Syntax ERROR');
        }
    }, [display, angleMode]);

    const insert = (val: string) => {
        if (result && result !== 'Syntax ERROR') {
            if (['+', '-', '*', '/', '^'].includes(val)) {
                setDisplay(result + val);
            } else {
                setDisplay(val);
            }
            setResult('');
        } else {
            setDisplay(prev => prev + val);
        }
        setIsShift(false); setIsAlpha(false);
    };

    const clearAll = () => { setDisplay(''); setResult(''); setIsShift(false); setIsAlpha(false); };
    const backspace = () => { setDisplay(prev => prev.slice(0, -1)); };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const k = e.key;
            if (k === 'Enter') { e.preventDefault(); handleCalculate(); }
            if (k === 'Escape') onClose();
            if (k === 'Backspace') backspace();
            if (k === 'Delete') clearAll();
            if ("0123456789+-*/().^%".includes(k)) insert(k);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleCalculate]);

    const handleSaveVar = () => {
        if (!result || result === 'Syntax ERROR' || !varName.trim()) return;
        const newVar: SavedVar = { id: Date.now().toString(), name: varName.trim(), value: parseFloat(result) };
        setSavedVars([...savedVars, newVar]);
        setVarName('');
    };

    if (!isOpen) return null;

    type CalcButton = {
        label: React.ReactNode;
        val: string;
        shift?: { label: string, val: string };
        alpha?: { label: string, val: string };
        type?: 'func' | 'num' | 'accent' | 'action';
        width?: number;
    };

    const handleKey = (btn: CalcButton) => {
        if (btn.val === 'SHIFT') { setIsShift(!isShift); setIsAlpha(false); return; }
        if (btn.val === 'ALPHA') { setIsAlpha(!isAlpha); setIsShift(false); return; }
        if (btn.val === 'MODE') { setAngleMode(m => m === 'DEG' ? 'RAD' : (m === 'RAD' ? 'GRAD' : 'DEG')); return; }

        let valToInsert = btn.val;
        if (isShift && btn.shift) valToInsert = btn.shift.val;
        else if (isAlpha && btn.alpha) valToInsert = btn.alpha.val;

        if (valToInsert === 'hyp') { setIsHyp(!isHyp); return; }
        if (isHyp) {
            if (valToInsert === 'sin(') valToInsert = 'sinh(';
            if (valToInsert === 'cos(') valToInsert = 'cosh(';
            if (valToInsert === 'tan(') valToInsert = 'tanh(';
            if (valToInsert === 'asin(') valToInsert = 'asinh(';
            if (valToInsert === 'acos(') valToInsert = 'acosh(';
            if (valToInsert === 'atan(') valToInsert = 'atanh(';
        }

        if (valToInsert === 'AC') { clearAll(); return; }
        if (valToInsert === 'DEL') { backspace(); return; }
        if (valToInsert === '=') { handleCalculate(); return; }

        if (valToInsert === 'SD') {
            if (!result || result === 'Syntax ERROR') return;
            const val = parseFloat(result);
            if (isNaN(val)) return;
            if (showFrac) { setResult(parseFloat(val.toPrecision(12)).toString()); setShowFrac(false); }
            else { setResult(toFraction(val)); setShowFrac(true); }
            return;
        }

        if (valToInsert === 'dms') {
            if (!result || result === 'Syntax ERROR') return;
            const val = parseFloat(result);
            if (isNaN(val)) return;
            setResult(toDMS(val));
            return;
        }

        if (valToInsert === 'Ans') {
            if (history.length > 0) insert(history[0].split('=')[1].trim());
            return;
        }

        insert(valToInsert);
        if (!['hyp', 'SHIFT', 'ALPHA'].includes(btn.val)) setIsHyp(false);
    };

    // Button Groups
    const funcButtons: CalcButton[] = [
        { label: 'SHIFT', val: 'SHIFT', type: 'accent' },
        { label: 'ALPHA', val: 'ALPHA', type: 'accent' }, // Changed to accent for unified look, or keep distinct? Let's use accent but maybe different hue if needed. For now orange/red.
        { label: 'MODE', val: 'MODE', type: 'func' },
        { label: 'ON', val: 'ON', type: 'func' },

        { label: 'x⁻¹', val: '^(-1)', shift: { label: 'x!', val: '!' }, type: 'func' },
        { label: 'nCr', val: 'C', shift: { label: 'nPr', val: 'P' }, type: 'func' },
        { label: 'Pol', val: 'Pol(', shift: { label: 'Rec', val: 'Rec(' }, type: 'func' },
        { label: 'x³', val: '³', shift: { label: '³√', val: 'cbrt(' }, type: 'func' },

        { label: 'ab/c', val: 'abc', type: 'func' },
        { label: '√', val: 'sqrt(', type: 'func' },
        { label: 'x²', val: '²', type: 'func' },
        { label: '^', val: '^', shift: { label: 'x√', val: 'xsqrt' }, type: 'func' },

        { label: 'log', val: 'log(', shift: { label: '10^x', val: '10^(' }, type: 'func' },
        { label: 'ln', val: 'ln(', shift: { label: 'e^x', val: 'e^(' }, type: 'func' },
        { label: '(-)', val: '-', type: 'func' },
        { label: '°\'"', val: 'dms', type: 'func' },

        { label: 'hyp', val: 'hyp', type: 'func' },
        { label: 'sin', val: 'sin(', shift: { label: 'sin⁻¹', val: 'asin(' }, alpha: { label: 'D', val: 'D' }, type: 'func' },
        { label: 'cos', val: 'cos(', shift: { label: 'cos⁻¹', val: 'acos(' }, alpha: { label: 'E', val: 'E' }, type: 'func' },
        { label: 'tan', val: 'tan(', shift: { label: 'tan⁻¹', val: 'atan(' }, alpha: { label: 'F', val: 'F' }, type: 'func' },

        { label: 'STO', val: 'STO', type: 'func' },
        { label: 'ENG', val: 'ENG', type: 'func' },
        { label: '(', val: '(', alpha: { label: 'X', val: 'X' }, type: 'func' },
        { label: ')', val: ')', alpha: { label: 'Y', val: 'Y' }, type: 'func' },

        { label: 'S<=>D', val: 'SD', type: 'func' },
        { label: 'M+', val: 'M+', shift: { label: 'M-', val: 'M-' }, type: 'func' },
    ];

    const numButtons: CalcButton[] = [
        { label: '7', val: '7', type: 'num' },
        { label: '8', val: '8', type: 'num' },
        { label: '9', val: '9', type: 'num' },
        { label: 'DEL', val: 'DEL', shift: { label: 'INS', val: 'INS' }, type: 'accent' },
        { label: 'AC', val: 'AC', shift: { label: 'OFF', val: 'OFF' }, type: 'accent' },

        { label: '4', val: '4', type: 'num' },
        { label: '5', val: '5', type: 'num' },
        { label: '6', val: '6', type: 'num' },
        { label: '×', val: '*', type: 'num' },
        { label: '÷', val: '/', type: 'num' },

        { label: '1', val: '1', type: 'num' },
        { label: '2', val: '2', type: 'num' },
        { label: '3', val: '3', type: 'num' },
        { label: '+', val: '+', type: 'num' },
        { label: '-', val: '-', type: 'num' },

        { label: '0', val: '0', type: 'num' },
        { label: '.', val: '.', type: 'num' },
        { label: '×10ˣ', val: '*10^', shift: { label: 'π', val: 'π' }, type: 'num' },
        { label: 'Ans', val: 'Ans', type: 'num' },
        { label: '=', val: '=', type: 'num' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">

            {/* Click outside closer wrapper */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Container for responsive scaling */}
            <div
                ref={containerRef}
                className="relative z-[101] shadow-2xl transition-transform origin-center will-change-transform"
                style={{
                    transform: `scale(${scale})`,
                    width: '1000px', // Fixed base width for layout stability
                    height: '920px'  // Increased height to accommodate larger LCD
                }}
            >
                <div className="w-full h-full bg-surface-100 dark:bg-surface-900 rounded-[32px] overflow-hidden flex shadow-2xl border-4 border-surface-300 dark:border-surface-700">

                    {/* --- Left Panel: Calculator Face --- */}
                    <div className="flex-[2] bg-[#22252b] flex flex-col p-6 relative select-none">

                        {/* Brand & Solar */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-white font-bold tracking-widest text-lg flex items-baseline gap-2">
                                CASIO <span className="font-normal text-sm opacity-80 text-surface-300">fx-991EX</span>
                                <span className="text-brand-orange text-[10px] uppercase tracking-widest bg-brand-orange/10 px-2 py-0.5 rounded-full border border-brand-orange/20">Advanced</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-6 bg-[#353941] border border-surface-600 rounded mb-1 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:4px_4px]"></div>
                                <span className="text-[9px] text-surface-400 font-bold tracking-widest">TWO WAY POWER</span>
                            </div>
                        </div>

                        {/* LCD Container - Flex Column Layout for Fixed Sections */}
                        <div className="bg-[#eff1f0] rounded-xl border-4 border-[#353941] h-96 mb-4 p-5 flex flex-col shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] relative overflow-hidden">

                            {/* 1. Status Bar (Fixed Top) */}
                            <div className="flex-none flex gap-3 text-xs font-bold text-slate-900 border-b border-black/10 pb-2 mb-2">
                                <span className={isShift ? "bg-black text-white px-1" : "opacity-30"}>S</span>
                                <span className={isAlpha ? "bg-black text-white px-1" : "opacity-30"}>A</span>
                                <span className={isHyp ? "bg-black text-white px-1" : "opacity-30"}>hyp</span>
                                <span>{angleMode}</span>
                                <span className="ml-auto opacity-50">FIX SCI</span>
                            </div>

                            {/* 2. Input/Expression Area (Flex Grow - Top Half) */}
                            <div className="flex-1 w-full text-5xl font-mono text-slate-800 leading-tight break-all tracking-tight font-medium overflow-hidden text-left font-casio flex items-start">
                                {display}<span className="animate-pulse w-[4px] h-10 bg-slate-800 inline-block ml-0.5 mt-1"></span>
                            </div>

                            {/* 3. Result Area (Fixed Bottom Right) */}
                            <div className="flex-none w-full text-right text-6xl font-bold text-black tracking-tighter shadow-black drop-shadow-sm truncate pl-4">
                                {result || '0'}
                            </div>
                        </div>

                        {/* Keypad Container */}
                        <div className="flex-1 flex flex-col gap-5">

                            {/* Function Zone */}
                            <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                                {funcButtons.map((btn, i) => (
                                    <div key={i} className="relative flex flex-col items-center justify-end h-10">
                                        <div className="flex w-full justify-between items-end px-1 mb-0.5 h-3">
                                            {btn.shift && <span className="text-[9px] text-brand-yellow font-bold leading-none">{btn.shift.label}</span>}
                                            {btn.alpha && <span className="text-[9px] text-brand-orange font-bold ml-auto leading-none">{btn.alpha.label}</span>}
                                        </div>
                                        <button
                                            onClick={() => handleKey(btn)}
                                            className={`
                                                calc-btn calc-btn-func text-sm ring-1 ring-white/5 h-8
                                                ${btn.val === 'SHIFT' ? 'text-brand-yellow border-b-2 border-brand-yellow/30' : ''}
                                                ${btn.val === 'ALPHA' ? 'text-brand-orange border-b-2 border-brand-orange/30' : ''}
                                                ${btn.val === 'AC' || btn.val === 'DEL' ? 'calc-btn-accent text-white' : ''}
                                            `}
                                        >
                                            {btn.label}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Numpad Zone */}
                            <div className="grid grid-cols-5 gap-2 bg-surface-800 p-3 rounded-xl mt-auto shadow-inner border border-surface-700">
                                {numButtons.map((btn, i) => (
                                    <div key={i} className="relative flex flex-col items-center">
                                        {btn.shift && <div className="text-[8px] text-brand-yellow font-bold mb-0.5 w-full text-center leading-none">{btn.shift.label}</div>}
                                        <button
                                            onClick={() => handleKey(btn)}
                                            className={`
                                                calc-btn h-9 text-lg
                                                ${btn.type === 'accent' ? 'calc-btn-accent' : 'calc-btn-num'}
                                                ${btn.val === 'AC' || btn.val === 'DEL' ? 'font-black tracking-widest text-xs' : ''}
                                            `}
                                        >
                                            {btn.label}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- Right Panel: Memory & History --- */}
                    <div className="flex-1 bg-surface-50 dark:bg-surface-950 border-l border-surface-200 dark:border-surface-800 flex flex-col min-w-[300px]">
                        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-white dark:bg-surface-900 z-10">
                            <h3 className="font-bold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                                Memory Bank
                            </h3>
                            <button onClick={onClose} className="p-2 bg-surface-100 dark:bg-surface-800 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                            {/* Current Result Save */}
                            <div className="bg-blue-50 dark:bg-brand-blue/10 p-4 rounded-xl border border-blue-100 dark:border-brand-blue/30">
                                <div className="text-[10px] font-bold tracking-wider text-brand-blue dark:text-blue-300 mb-2 uppercase">Current Value</div>
                                <div className="flex gap-2">
                                    <input
                                        value={varName} onChange={e => setVarName(e.target.value)}
                                        placeholder="Name..."
                                        className="input-tech py-2 text-sm"
                                    />
                                    <button onClick={handleSaveVar} className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 rounded-lg font-bold text-xs transition-colors shadow-lg shadow-brand-blue/20">SAVE</button>
                                </div>
                            </div>

                            {/* Variables */}
                            <div>
                                <div className="text-[10px] font-bold tracking-wider text-surface-400 mb-3 uppercase flex justify-between items-center">
                                    <span>Saved Variables</span>
                                    {savedVars.length > 0 && <span className="bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400 px-1.5 py-0.5 rounded text-[9px]">{savedVars.length}</span>}
                                </div>
                                {savedVars.length === 0 ? (
                                    <div className="text-sm text-surface-400 italic text-center py-8 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-xl">
                                        No variables saved
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {savedVars.map(v => (
                                            <div key={v.id} onClick={() => insert(v.value.toString())} className="group bg-white dark:bg-surface-800 p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-brand-blue cursor-pointer flex justify-between items-center transition-all hover:shadow-md active:scale-[0.98]">
                                                <div>
                                                    <div className="text-[10px] font-bold text-surface-500 uppercase">{v.name}</div>
                                                    <div className="font-mono font-bold text-surface-800 dark:text-surface-200">{v.value}</div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setSavedVars(prev => prev.filter(p => p.id !== v.id)) }} className="text-surface-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* History */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px]">
                                <div className="text-[10px] font-bold tracking-wider text-surface-400 mb-2 uppercase sticky top-0 bg-surface-50 dark:bg-surface-950 py-2">Calculation History</div>
                                <div className="space-y-1 pb-4">
                                    {history.map((h, i) => (
                                        <div key={i} className="text-sm font-mono text-surface-700 dark:text-surface-200 p-3 bg-white dark:bg-surface-800/50 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg cursor-pointer truncate transition-all border border-surface-200 dark:border-surface-800 hover:border-brand-blue shadow-sm" title={h} onClick={() => insert(h.split('=')[1].trim())}>
                                            {h}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Helper Text */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold md:hidden pointer-events-none">
                Pinch to zoom / rotate for best view
            </div>
        </div>
    );
};
