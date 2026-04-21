'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Info, Settings, ArrowRight, Layers, Palette, ShieldCheck } from 'lucide-react';

/**
 * OhmsLawModule - High-Fidelity Industrial Electrical Workstation
 */
export default function OhmsLawModule() {
    const [mode, setMode] = useState<'DC' | 'AC'>('DC');
    const [calcTarget, setCalcTarget] = useState<'V' | 'I' | 'R' | 'P' | 'Z'>('V');
    
    // Inputs
    const [v, setV] = useState(12);
    const [i, setI] = useState(2);
    const [r, setR] = useState(6);
    const [p, setP] = useState(24);
    
    // AC Specific
    const [freq, setFreq] = useState(50);
    const [l, setL] = useState(0.1); // Henry
    const [c, setC] = useState(100); // uF
    const [phi, setPhi] = useState(0); // Phase shift

    // Resistor Color Code Decoder State
    const [bands, setBands] = useState<number>(4);
    const [bandColors, setBandColors] = useState<string[]>(['brown', 'black', 'red', 'gold']);

    const COLORS: Record<string, { val: number, mult: number, tol: string, hex: string }> = {
        black: { val: 0, mult: 1, tol: 'N/A', hex: '#000000' },
        brown: { val: 1, mult: 10, tol: '±1%', hex: '#8B4513' },
        red: { val: 2, mult: 100, tol: '±2%', hex: '#FF0000' },
        orange: { val: 3, mult: 1000, tol: 'N/A', hex: '#FFA500' },
        yellow: { val: 4, mult: 10000, tol: 'N/A', hex: '#FFFF00' },
        green: { val: 5, mult: 100000, tol: '±0.5%', hex: '#008000' },
        blue: { val: 6, mult: 1000000, tol: '±0.25%', hex: '#0000FF' },
        violet: { val: 7, mult: 10000000, tol: '±0.1%', hex: '#EE82EE' },
        grey: { val: 8, mult: 100000000, tol: '±0.05%', hex: '#808080' },
        white: { val: 9, mult: 1000000000, tol: 'N/A', hex: '#FFFFFF' },
        gold: { val: -1, mult: 0.1, tol: '±5%', hex: '#FFD700' },
        silver: { val: -1, mult: 0.01, tol: '±10%', hex: '#C0C0C0' },
    };

    const calculatedResistor = useMemo(() => {
        const val1 = COLORS[bandColors[0]].val;
        const val2 = COLORS[bandColors[1]].val;
        
        if (bands === 4) {
            const mult = COLORS[bandColors[2]].mult;
            const tol = COLORS[bandColors[3]].tol;
            const res = (val1 * 10 + val2) * mult;
            return { res, tol };
        } else {
            const val3 = COLORS[bandColors[2]].val;
            const mult = COLORS[bandColors[3]].mult;
            const tol = COLORS[bandColors[4]].tol;
            const res = (val1 * 100 + val2 * 10 + val3) * mult;
            return { res, tol };
        }
    }, [bandColors, bands]);

    const acStats = useMemo(() => {
        if (mode !== 'AC') return null;
        const omega = 2 * Math.PI * freq;
        const XL = omega * l;
        const XC = 1 / (omega * (c / 1000000));
        const X = XL - XC;
        const Z = Math.sqrt(r * r + X * X);
        const current = v / Z;
        const powerFact = r / Z;
        const activePower = v * current * powerFact;
        return { XL, XC, X, Z, current, powerFact, activePower };
    }, [mode, freq, l, c, r, v]);

    const dcStats = useMemo(() => {
        let V = v, I = i, R = r, P = p;
        if (calcTarget === 'V') { V = i * r; P = V * i; }
        else if (calcTarget === 'I') { I = v / r; P = v * I; }
        else if (calcTarget === 'R') { R = v / i; P = v * i; }
        else if (calcTarget === 'P') { P = v * i; }
        return { V, I, R, P };
    }, [calcTarget, v, i, r, p]);

    return (
        <div className="flex flex-col h-full bg-[#08090d] text-slate-200 overflow-hidden font-sans">
            <header className="px-6 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Zap size={20} className="text-amber-400 group-hover:animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black tracking-widest uppercase italic">Ohm&apos;s Law Pro</h1>
                        <p className="text-[9px] text-amber-500/50 font-bold tracking-widest uppercase">Industrial Electrical Workstation</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                    {(['DC', 'AC'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'text-slate-500 hover:text-white'}`}
                        >
                            {m} Mode
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                {/* Circuit Viz */}
                <section className="p-8 bg-black/40 border border-white/5 rounded-[32px] relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
                     <div className="flex flex-col items-center justify-center">
                         <div className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.3em] mb-6">Real-Time Circuit Model</div>
                         
                         <div className="relative w-full max-w-sm h-32 flex items-center justify-center">
                             {/* Simplified Animated Circuit SVG */}
                             <svg viewBox="0 0 200 100" className="w-full h-full opacity-80">
                                 <rect x="20" y="20" width="160" height="60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                                 <circle cx="20" cy="50" r="8" fill="none" stroke="#f59e0b" strokeWidth="2" />
                                 <path d="M 20 42 L 20 30 L 100 30" fill="none" stroke="#f59e0b" strokeWidth="2" />
                                 <path d="M 20 58 L 20 70 L 100 70" fill="none" stroke="#f59e0b" strokeWidth="2" />
                                 
                                 <path d="M 100 30 L 140 30 L 145 25 L 150 35 L 155 25 L 160 35 L 165 25 L 170 35 L 175 30 L 180 30 L 180 70 L 100 70" 
                                    fill="none" stroke="#f59e0b" strokeWidth="2" 
                                    className={mode === 'AC' ? 'animate-[pulse_1s_infinite]' : ''}
                                 />

                                 {/* Electron flow dots */}
                                 <motion.circle 
                                    r="2" fill="#f59e0b"
                                    animate={{ pathOffset: [0, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                 />
                             </svg>

                             <div className="absolute top-2 left-1/4 -translate-x-1/2 p-2 bg-black/80 rounded-lg border border-white/5 text-[10px] font-mono font-bold text-amber-500">
                                 {mode === 'DC' ? dcStats.V.toFixed(1) : v.toFixed(1)}V
                             </div>
                             <div className="absolute top-2 right-1/4 translate-x-1/2 p-2 bg-black/80 rounded-lg border border-white/5 text-[10px] font-mono font-bold text-emerald-500">
                                 {mode === 'DC' ? dcStats.I.toFixed(2) : acStats?.current.toFixed(2)}A
                             </div>
                         </div>
                     </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Main Params */}
                    <div className="space-y-4">
                        <section className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Settings size={14} /> Basic Parameters
                             </h3>
                             <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Voltage (V)" value={v} onChange={setV} />
                                <InputGroup label="Resistance (Ω)" value={r} onChange={setR} />
                                <InputGroup label="Current (I)" value={i} onChange={setI} />
                                <InputGroup label="Power (W)" value={p} onChange={setP} />
                             </div>
                        </section>

                        {mode === 'AC' && (
                            <section className="p-6 bg-white/[0.02] border border-blue-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Activity size={14} /> Inductive & Capacitive Load
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <InputGroup label="Freq (Hz)" value={freq} onChange={setFreq} />
                                    <InputGroup label="Induct. (H)" value={l} onChange={setL} />
                                    <InputGroup label="Capac. (uF)" value={c} onChange={setC} />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Results & Color Code */}
                    <div className="space-y-4">
                         <section className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Calculator Output</h3>
                                <div className="text-[9px] px-2 py-1 rounded bg-amber-500/10 text-amber-500 font-black animate-pulse uppercase tracking-widest">
                                    Real-Time Solver
                                </div>
                            </div>

                            <div className="space-y-2">
                                {mode === 'DC' ? (
                                    <>
                                        <ResultRow label="Resistance" value={dcStats.R.toFixed(2)} unit="Ω" />
                                        <ResultRow label="Potential" value={dcStats.V.toFixed(1)} unit="V" />
                                        <ResultRow label="Flow Rate" value={dcStats.I.toFixed(2)} unit="A" />
                                        <div className="h-px bg-white/5 my-2" />
                                        <ResultRow label="Dissipated Power" value={dcStats.P.toFixed(2)} unit="W" highlight />
                                    </>
                                ) : (
                                    <>
                                        <ResultRow label="Impedance (Z)" value={acStats?.Z.toFixed(2)} unit="Ω" highlight />
                                        <ResultRow label="Reactance (X)" value={acStats?.X.toFixed(2)} unit="Ω" />
                                        <ResultRow label="Power Factor" value={acStats?.powerFact.toFixed(3)} unit="cosφ" />
                                        <ResultRow label="Active Power" value={acStats?.activePower.toFixed(2)} unit="W" />
                                    </>
                                )}
                            </div>
                         </section>

                         <section className="p-6 bg-black/40 border border-white/5 rounded-2xl relative">
                            <div className="flex items-center justify-between mb-4">
                               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Resistor Color Decoder</h3>
                               <div className="flex gap-1">
                                    {[4, 5].map(b => (
                                        <button key={b} onClick={() => setBands(b)} className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-black transition-all ${bands === b ? 'bg-amber-400 text-black' : 'bg-white/5 text-slate-500'}`}>{b}</button>
                                    ))}
                               </div>
                            </div>

                            <div className="flex items-center justify-center p-4 bg-white/[0.02] rounded-xl border border-white/5 mb-4 group cursor-pointer">
                                <div className="relative w-48 h-6 bg-[#d1c4e9] rounded-full border border-black/20 flex items-center px-4 gap-2">
                                    <div className="absolute left-0 w-8 h-1 bg-slate-400 -translate-x-full"></div>
                                    <div className="absolute right-0 w-8 h-1 bg-slate-400 translate-x-full"></div>
                                    
                                    {Array.from({ length: bands }).map((_, i) => (
                                        <select
                                            key={i}
                                            value={bandColors[i]}
                                            onChange={(e) => {
                                                const newColors = [...bandColors];
                                                newColors[i] = e.target.value;
                                                setBandColors(newColors);
                                            }}
                                            className="w-4 h-8 rounded border border-black/10 focus:ring-2 ring-white/20 transition-all cursor-pointer opacity-80 hover:scale-110"
                                            style={{ backgroundColor: COLORS[bandColors[i]].hex }}
                                        >
                                            {Object.keys(COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ))}
                                </div>
                            </div>

                             <div className="text-center">
                                 <div className="text-xl font-mono font-black text-white">{calculatedResistor.res.toLocaleString()} Ω</div>
                                 <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Tolerance: {calculatedResistor.tol}</div>
                             </div>
                         </section>
                    </div>
                </div>
            </main>

            <footer className="px-6 py-4 bg-black/60 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <StatusItem icon={<ShieldCheck size={14}/>} label="Compliance" value="IEC 60038" />
                    <StatusItem icon={<Layers size={14}/>} label="Standard" value="ISO 13448" />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono font-black text-amber-500/40 uppercase tracking-widest">
                    <Activity size={12} className="animate-pulse" /> Live Analysis active
                </div>
            </footer>
        </div>
    );
}

function InputGroup({ label, value, onChange }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
            <input 
                type="number" 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500/40 focus:ring-1 ring-amber-500/20 transition-all"
            />
        </div>
    );
}

function ResultRow({ label, value, unit, highlight }: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${highlight ? 'bg-amber-500/5 border-amber-500/30' : 'bg-white/[0.02] border-white/5'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            <div className="flex items-end gap-1">
                <span className={`text-sm font-mono font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</span>
                <span className="text-[9px] text-slate-500 font-bold mb-0.5">{unit}</span>
            </div>
        </div>
    );
}

function StatusItem({ icon, label, value }: any) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-slate-500">{icon}</span>
            <div>
                <div className="text-[8px] text-slate-600 font-black uppercase tracking-tighter leading-none">{label}</div>
                <div className="text-[10px] text-slate-400 font-bold tracking-tight">{value}</div>
            </div>
        </div>
    );
}
