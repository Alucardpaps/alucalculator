'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, ChevronDown, CircleDot, Settings2, List } from 'lucide-react';
import { calculateFit } from '@/lib/engine/iso286';

const PRESET_FITS = {
    Clearance: [
        { id: 'H11/c11', desc: 'Loose Running' },
        { id: 'H9/d9', desc: 'Free Running' },
        { id: 'H8/f7', desc: 'Normal Running' },
        { id: 'H7/g6', desc: 'Sliding Fit' },
        { id: 'H7/h6', desc: 'Locational Clearance' }
    ],
    Transition: [
        { id: 'H7/k6', desc: 'Locational Transition' },
        { id: 'H7/n6', desc: 'Locational Interference' }
    ],
    Interference: [
        { id: 'H7/p6', desc: 'Light Press' },
        { id: 'H7/s6', desc: 'Medium Press' },
        { id: 'H7/u6', desc: 'Heavy Press' }
    ]
};

const HOLE_CLASSES = ['A','B','C','D','E','F','G','H','J','JS','K','M','N','P','R','S','T','U','V','X','Y','Z'];
const SHAFT_CLASSES = ['a','b','c','d','e','f','g','h','j','js','k','m','n','p','r','s','t','u','v','x','y','z'];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

export default function FitsTolerancesModule() {
    const [nominalDia, setNominalDia] = useState(25);
    const [mode, setMode] = useState<'preset' | 'advanced'>('preset');
    
    // Preset State
    const [selectedPreset, setSelectedPreset] = useState('H7/g6');
    
    // Advanced State
    const [holeClass, setHoleClass] = useState('H');
    const [holeGrade, setHoleGrade] = useState(7);
    const [shaftClass, setShaftClass] = useState('g');
    const [shaftGrade, setShaftGrade] = useState(6);

    const [expandedSection, setExpandedSection] = useState<string | null>('fit');

    const results = useMemo(() => {
        let hc = holeClass;
        let hg = holeGrade;
        let sc = shaftClass;
        let sg = shaftGrade;

        if (mode === 'preset') {
            const match = selectedPreset.match(/([A-Z])(\d+)\/([a-z])(\d+)/);
            if (match) {
                hc = match[1];
                hg = parseInt(match[2]);
                sc = match[3];
                sg = parseInt(match[4]);
            }
        }

        return calculateFit(nominalDia, hc, hg, sc, sg);
    }, [nominalDia, mode, selectedPreset, holeClass, holeGrade, shaftClass, shaftGrade]);

    const fitColor = results.fitType === 'Clearance' ? '#10b981' : results.fitType === 'Interference' ? '#ef4444' : '#f59e0b';
    const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden">
            {/* LEFT PANEL — Controls */}
            <div className="w-[38%] h-full flex flex-col bg-[#080d14]/80 border-r border-white/5 overflow-hidden">
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                            <Crosshair size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-gray-100">Fits & Tolerances</h2>
                            <p className="text-[10px] text-indigo-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">ISO 286 Dynamic Engine</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-[#0e1622] rounded-lg p-1 border border-white/10">
                        <button onClick={() => setMode('preset')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'preset' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>
                            <List size={14} /> Presets
                        </button>
                        <button onClick={() => setMode('advanced')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'advanced' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>
                            <Settings2 size={14} /> Advanced
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    {/* Nominal Diameter */}
                    <PanelSection id="diameter" title="Nominal Diameter" icon={<CircleDot size={14} />} isOpen={expandedSection === 'diameter'} onToggle={() => toggleSection('diameter')}>
                        <div className="group">
                            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-lg overflow-hidden transition-all group-focus-within:border-indigo-500/40 group-focus-within:shadow-[0_0_15px_rgba(99,102,241,0.08)]">
                                <input type="number" value={nominalDia} onChange={e => setNominalDia(Number(e.target.value))}
                                    className="w-full bg-transparent text-2xl font-black font-mono px-4 py-3 text-white text-center outline-none appearance-none" />
                                <div className="px-4 text-[10px] font-bold text-indigo-400 border-l border-white/5 bg-white/[0.02]">mm</div>
                            </div>
                            <div className="mt-2 px-0.5">
                                <input type="range" min={3} max={500} step={1} value={nominalDia} onChange={e => setNominalDia(Number(e.target.value))}
                                    className="w-full h-[3px] bg-white/10 rounded-full appearance-none cursor-pointer outline-none" style={{ accentColor: '#6366f1' }} />
                            </div>
                        </div>
                    </PanelSection>

                    {/* Configuration */}
                    <PanelSection id="fit" title={mode === 'preset' ? 'Fit Class' : 'Custom Fit'} icon={<Crosshair size={14} />} isOpen={expandedSection === 'fit'} onToggle={() => toggleSection('fit')}>
                        {mode === 'preset' ? (
                            <div className="space-y-4">
                                {Object.entries(PRESET_FITS).map(([category, fits]) => (
                                    <div key={category}>
                                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">{category}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {fits.map(f => (
                                                <button key={f.id} onClick={() => setSelectedPreset(f.id)}
                                                    className={`py-2 px-3 rounded-xl text-left transition-all border
                                                        ${selectedPreset === f.id
                                                            ? 'bg-indigo-500/15 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                                        }`}
                                                >
                                                    <div className="text-sm font-mono font-black text-indigo-400">{f.id}</div>
                                                    <div className="text-[9px] text-gray-500 mt-0.5 truncate">{f.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-[#0e1622] border border-white/5 rounded-xl p-4">
                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">HOLE (Internal)</div>
                                    <div className="flex gap-2">
                                        <select value={holeClass} onChange={(e) => setHoleClass(e.target.value)} className="flex-1 bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none">
                                            {HOLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select value={holeGrade} onChange={(e) => setHoleGrade(Number(e.target.value))} className="flex-1 bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none">
                                            {GRADES.map(g => <option key={g} value={g}>IT{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-[#0e1622] border border-white/5 rounded-xl p-4">
                                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">SHAFT (External)</div>
                                    <div className="flex gap-2">
                                        <select value={shaftClass} onChange={(e) => setShaftClass(e.target.value)} className="flex-1 bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none">
                                            {SHAFT_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select value={shaftGrade} onChange={(e) => setShaftGrade(Number(e.target.value))} className="flex-1 bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none">
                                            {GRADES.map(g => <option key={g} value={g}>IT{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </PanelSection>
                </div>
            </div>

            {/* RIGHT PANEL — Visualization & Results */}
            <div className="w-[62%] h-full flex flex-col overflow-hidden">
                {/* KPI Header */}
                <div className="flex-none px-8 pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <motion.div className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2" animate={{ color: fitColor }}>
                                <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: fitColor, boxShadow: `0 0 15px ${fitColor}` }} />
                                {results.fitType.toUpperCase()} FIT 
                                {mode === 'preset' ? ` — ${selectedPreset}` : ` — ${holeClass}${holeGrade}/${shaftClass}${shaftGrade}`}
                            </motion.div>
                            <div className="flex items-baseline gap-6">
                                <div className="flex flex-col">
                                    <motion.div key={results.minClearance} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                                        className="text-[4.5rem] font-black italic tracking-tighter leading-none" style={{ color: fitColor, textShadow: `0 0 40px ${fitColor}40` }}>
                                        {results.minClearance >= 0 ? '+' : ''}{(results.minClearance * 1000).toFixed(1)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Min Gap (μm)</span>
                                </div>
                                <div className="text-3xl font-thin text-gray-700 self-center">~</div>
                                <div className="flex flex-col">
                                    <motion.div className="text-[4.5rem] font-black italic tracking-tighter leading-none" style={{ color: fitColor, textShadow: `0 0 40px ${fitColor}40` }}>
                                        {results.maxClearance >= 0 ? '+' : ''}{(results.maxClearance * 1000).toFixed(1)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Max Gap (μm)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 text-right pt-2">
                            <SideStat label="Hole Tol" value={`${(results.holeTol * 1000).toFixed(1)} μm`} color="#6366f1" />
                            <SideStat label="Shaft Tol" value={`${(results.shaftTol * 1000).toFixed(1)} μm`} color="#f59e0b" />
                            <SideStat label="Nominal" value={`Ø${nominalDia} mm`} color="#8b5cf6" />
                        </div>
                    </div>
                </div>

                {/* Tolerance Zone Visualization */}
                <div className="flex-1 relative mx-6 my-4 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    <div className="w-full h-full flex items-center justify-center relative z-10 p-8">
                        <PremiumFitsSVG 
                            holeMax={results.holeMax} holeMin={results.holeMin} 
                            shaftMax={results.shaftMax} shaftMin={results.shaftMin} 
                            nominal={nominalDia} fitColor={fitColor} 
                        />
                    </div>
                </div>

                {/* Dimension Table */}
                <div className="flex-none mx-6 mb-6 rounded-2xl border border-white/5 bg-[#080d14]/60 overflow-hidden">
                    <div className="grid grid-cols-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/5">
                        <div className="px-5 py-2.5"></div>
                        <div className="px-5 py-2.5 text-center">Max (mm)</div>
                        <div className="px-5 py-2.5 text-center">Min (mm)</div>
                        <div className="px-5 py-2.5 text-center">Tol (μm)</div>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                        <div className="grid grid-cols-4 text-xs font-mono bg-indigo-500/5">
                            <div className="px-5 py-3 text-indigo-400 font-bold">Hole ({mode === 'preset' ? selectedPreset.split('/')[0] : holeClass+holeGrade})</div>
                            <div className="px-5 py-3 text-center text-white font-bold">{results.holeMax.toFixed(3)}</div>
                            <div className="px-5 py-3 text-center text-gray-300">{results.holeMin.toFixed(3)}</div>
                            <div className="px-5 py-3 text-center text-indigo-400 font-bold">{(results.holeTol * 1000).toFixed(1)}</div>
                        </div>
                        <div className="grid grid-cols-4 text-xs font-mono">
                            <div className="px-5 py-3 text-amber-400 font-bold">Shaft ({mode === 'preset' ? selectedPreset.split('/')[1] : shaftClass+shaftGrade})</div>
                            <div className="px-5 py-3 text-center text-white font-bold">{results.shaftMax.toFixed(3)}</div>
                            <div className="px-5 py-3 text-center text-gray-300">{results.shaftMin.toFixed(3)}</div>
                            <div className="px-5 py-3 text-center text-amber-400 font-bold">{(results.shaftTol * 1000).toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SideStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div>
            <div className="text-xl font-mono font-black" style={{ color }}>{value}</div>
        </div>
    );
}

function PanelSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2.5 text-indigo-400">{icon}<span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span></div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="text-gray-600" /></motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PremiumFitsSVG({ holeMax, holeMin, shaftMax, shaftMin, nominal, fitColor }: any) {
    const zeroY = 150;
    const hMaxDev = (holeMax - nominal) * 1000;
    const hMinDev = (holeMin - nominal) * 1000;
    const sMaxDev = (shaftMax - nominal) * 1000;
    const sMinDev = (shaftMin - nominal) * 1000;
    const maxDev = Math.max(Math.abs(hMaxDev), Math.abs(sMaxDev), Math.abs(hMinDev), Math.abs(sMinDev), 10);
    const scaleY = 100 / maxDev;

    return (
        <svg viewBox="0 0 500 300" className="w-full h-full max-w-[600px] max-h-[350px]" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id="fitGlow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <line x1="50" y1={zeroY} x2="450" y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="6,4" />
            <text x="30" y={zeroY + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">0</text>

            {/* Hole zone */}
            <g filter="url(#fitGlow)">
                <rect x="100" y={zeroY - hMaxDev * scaleY} width="120" height={Math.max(1, Math.abs(hMaxDev - hMinDev) * scaleY)}
                    fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="2" rx="4" />
            </g>
            <text x="160" y={zeroY - Math.max(hMaxDev, hMinDev) * scaleY - 10} textAnchor="middle" fill="#6366f1" fontSize="12" fontWeight="bold" fontFamily="monospace">HOLE</text>
            <text x="230" y={zeroY - hMaxDev * scaleY + 5} fill="#6366f1" fontSize="10" fontFamily="monospace">{hMaxDev >= 0 ? '+' : ''}{hMaxDev.toFixed(1)}μm</text>
            <text x="230" y={zeroY - hMinDev * scaleY + 5} fill="rgba(99,102,241,0.6)" fontSize="10" fontFamily="monospace">{hMinDev >= 0 ? '+' : ''}{hMinDev.toFixed(1)}μm</text>

            {/* Shaft zone */}
            <g filter="url(#fitGlow)">
                <rect x="280" y={zeroY - sMaxDev * scaleY} width="120" height={Math.max(1, Math.abs(sMaxDev - sMinDev) * scaleY)}
                    fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="2" rx="4" />
            </g>
            <text x="340" y={zeroY - Math.max(sMaxDev, sMinDev) * scaleY - 10} textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace">SHAFT</text>
            <text x="410" y={zeroY - sMaxDev * scaleY + 5} fill="#f59e0b" fontSize="10" fontFamily="monospace">{sMaxDev >= 0 ? '+' : ''}{sMaxDev.toFixed(1)}μm</text>
            <text x="410" y={zeroY - sMinDev * scaleY + 5} fill="rgba(245,158,11,0.6)" fontSize="10" fontFamily="monospace">{sMinDev >= 0 ? '+' : ''}{sMinDev.toFixed(1)}μm</text>
        </svg>
    );
}
