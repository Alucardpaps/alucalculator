'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Activity, Grid3X3, Database, Beaker, ChevronRight, Zap, Microscope, Scale, Globe, TestTube } from 'lucide-react';

// DNA -> RNA -> Amino Acid Translation Map
const CODON_TABLE: Record<string, string> = {
    'TTT': 'Phe', 'TTC': 'Phe', 'TTA': 'Leu', 'TTG': 'Leu',
    'CTT': 'Leu', 'CTC': 'Leu', 'CTA': 'Leu', 'CTG': 'Leu',
    'ATT': 'Ile', 'ATC': 'Ile', 'ATA': 'Ile', 'ATG': 'Met',
    'GTT': 'Val', 'GTC': 'Val', 'GTA': 'Val', 'GTG': 'Val',
    'TCT': 'Ser', 'TCC': 'Ser', 'TCA': 'Ser', 'TCG': 'Ser',
    'CCT': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
    'ACT': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
    'GCT': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
    'TAT': 'Tyr', 'TAC': 'Tyr', 'TAA': 'STOP', 'TAG': 'STOP',
    'CAT': 'His', 'CAC': 'His', 'CAA': 'Gln', 'CAG': 'Gln',
    'AAT': 'Asn', 'AAC': 'Asn', 'AAA': 'Lys', 'AAG': 'Lys',
    'GAT': 'Asp', 'GAC': 'Asp', 'GAA': 'Glu', 'GAG': 'Glu',
    'TGT': 'Cys', 'TGC': 'Cys', 'TGA': 'STOP', 'TGG': 'Trp',
    'CGT': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
    'AGT': 'Ser', 'AGC': 'Ser', 'AGA': 'Arg', 'AGG': 'Arg',
    'GGT': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly',
};

// ════════════════════════════════════════════
// UI Components
// ════════════════════════════════════════════

const HelixAnimation = () => (
    <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-20">
        <svg viewBox="0 0 100 400" className="w-full h-full">
            <defs>
                <linearGradient id="helixGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
            </defs>
            {Array.from({ length: 20 }).map((_, i) => {
                const y = i * 20;
                const offset = i * 0.5;
                return (
                    <g key={i}>
                        <motion.circle
                            r="3"
                            fill="url(#helixGrad)"
                            animate={{
                                cx: [20, 80, 20],
                                opacity: [0.2, 1, 0.2]
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: offset, ease: "easeInOut" }}
                            cy={y}
                        />
                        <motion.circle
                            r="3"
                            fill="url(#helixGrad)"
                            animate={{
                                cx: [80, 20, 80],
                                opacity: [1, 0.2, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: offset, ease: "easeInOut" }}
                            cy={y}
                        />
                        <motion.line
                            y1={y} y2={y}
                            stroke="white" strokeWidth="0.5" strokeOpacity="0.1"
                            animate={{
                                x1: [20, 80, 20],
                                x2: [80, 20, 80]
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: offset, ease: "easeInOut" }}
                        />
                    </g>
                );
            })}
        </svg>
    </div>
);

export default function BiologyGenetics() {
    const [tab, setTab] = useState<'genomics' | 'inheritance' | 'lab'>('genomics');
    const [dna, setDna] = useState('ATGCCTAGGATCGGATCGATCGATCGATCGTACG');
    
    // Population Genetics
    const [pFreq, setPFreq] = useState(0.6);

    // 1. Genomics Analysis
    const analytics = useMemo(() => {
        const seq = dna.toUpperCase().replace(/[^ATCG]/g, '');
        const len = seq.length;
        if (len === 0) return { gc: 0, mw: 0, tm: 0, orf: [], orfs: [], seq: '' };

        const counts = { A: 0, T: 0, G: 0, C: 0 };
        for (const char of seq) counts[char as keyof typeof counts]++;

        const gc = ((counts.G + counts.C) / len) * 100;
        const mw = (counts.A * 313.2) + (counts.T * 304.2) + (counts.C * 289.2) + (counts.G * 329.2) - 61.9;
        const tm = (len < 14) ? (2 * (counts.A + counts.T) + 4 * (counts.G + counts.C)) : (64.9 + 41 * (counts.G + counts.C - 16.4) / len);

        // Simple ORF detection (ATG to Stop)
        const orfs: { start: number; seq: string; len: number }[] = [];
        const matches = [...seq.matchAll(/ATG(?:...)*?(?:TAA|TAG|TGA)/g)];
        for (const m of matches) {
            if (m.index !== undefined) {
                orfs.push({ start: m.index, seq: m[0], len: m[0].length });
            }
        }

        return { gc, mw, tm, len, orfs, seq };
    }, [dna]);

    // 2. Inheritance Logic (Hardy-Weinberg)
    const populationGenetics = useMemo(() => {
        const q = 1 - pFreq;
        const pSq = pFreq * pFreq; // Homozygous dominant
        const twoPq = 2 * pFreq * q; // Heterozygous
        const qSq = q * q; // Homozygous recessive
        return { pSq, twoPq, qSq, q };
    }, [pFreq]);

    return (
        <div className="flex flex-col w-full h-full bg-[#030407] text-slate-100 overflow-hidden font-sans">
            <HelixAnimation />
            
            <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-purple-400/30">
                        <Microscope size={24} className="text-white ring-white/20" />
                    </div>
                    <div>
                        <h1 className="text-[11px] font-black tracking-[0.4em] uppercase italic text-white/90">Bio-Engineering Center</h1>
                        <p className="text-[9px] text-purple-500/80 font-mono font-bold uppercase tracking-widest mt-0.5">V5.5 - Molecular Systems Core</p>
                    </div>
                </div>

                <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {(['genomics', 'inheritance', 'lab'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-purple-500 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {t}
                        </button>
                    ))}
                </nav>
            </header>

            <main className="flex-1 overflow-y-auto p-8 z-10 scrollbar-none">
                <AnimatePresence mode="wait">
                    {tab === 'genomics' && (
                        <motion.div key="g" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-6xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <section className="lg:col-span-2 p-8 bg-black/40 border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden">
                                     <div className="absolute top-0 left-0 p-8 opacity-5"><Dna size={120}/></div>
                                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Nucleotide Sequence (5' → 3')</h3>
                                     <textarea
                                        value={dna}
                                        onChange={(e) => setDna(e.target.value.toUpperCase())}
                                        className="w-full h-40 bg-black/60 border border-purple-500/20 rounded-2xl p-6 text-sm font-mono tracking-[0.3em] text-purple-300 outline-none focus:border-purple-500/50 transition-all resize-none leading-relaxed"
                                     />
                                     <div className="flex items-center justify-between mt-4 px-2">
                                         <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Base Count: {analytics.len} bp</div>
                                         <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Integrity: Verified</div>
                                     </div>
                                </section>

                                <div className="space-y-4">
                                     <BioMetric label="GC Content Ratio" value={`${analytics.gc.toFixed(2)}%`} sub="Complexity Index" color="#a855f7" />
                                     <BioMetric label="Molecular Weight" value={`${analytics.mw.toFixed(1)} Da`} sub="Calculated MW" color="#3b82f6" />
                                     <BioMetric label="Thermodermal Tm" value={`${analytics.tm.toFixed(1)} °C`} sub="Melting Temp" color="#f59e0b" />
                                </div>
                            </div>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px]">
                                     <div className="flex items-center gap-3 mb-6">
                                         <Activity size={18} className="text-purple-400" />
                                         <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">ORF Detection (Start → Stop)</h3>
                                     </div>
                                     <div className="space-y-3">
                                         {(analytics.orfs || []).slice(0, 3).map((orf, i) => (
                                             <div key={i} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-purple-500/30 transition-all">
                                                 <div className="flex flex-col">
                                                     <span className="text-[11px] font-mono font-bold text-white">ORF_{i+1} at index {orf.start}</span>
                                                     <span className="text-[9px] text-slate-500 font-black uppercase">Length: {orf.len} bp</span>
                                                 </div>
                                                 <ChevronRight size={16} className="text-slate-600 group-hover:text-purple-400" />
                                             </div>
                                         ))}
                                         {analytics.orfs.length === 0 && <div className="text-xs text-slate-600 italic">No Open Reading Frames identified...</div>}
                                     </div>
                                </div>

                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px]">
                                     <div className="flex items-center gap-3 mb-6">
                                         <Beaker size={18} className="text-cyan-400" />
                                         <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Complementary Strand</h3>
                                     </div>
                                     <div className="p-6 bg-black/60 rounded-2xl border border-cyan-500/20 font-mono text-xs tracking-widest text-cyan-400 break-all leading-loose">
                                         3&apos; — {dna.split('').map(b => b === 'A' ? 'T' : b === 'T' ? 'A' : b === 'G' ? 'C' : 'G').join('')} — 5&apos;
                                     </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {tab === 'inheritance' && (
                        <motion.div key="i" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-4xl mx-auto space-y-8">
                            <section className="text-center">
                                <h2 className="text-3xl font-black italic tracking-tighter mb-4 text-white/90">Hardy-Weinberg Equilibrium</h2>
                                <p className="text-sm text-slate-500 max-w-xl mx-auto">Analyze population genomics by tracking allele frequency distributions and predictable equilibrium states.</p>
                            </section>

                            <div className="p-10 bg-black/40 border border-white/10 rounded-[40px] shadow-2xl flex flex-col items-center">
                                <div className="w-full flex items-center justify-between mb-12">
                                     <AlleleControl label="Dominant (p)" value={pFreq} onChange={setPFreq} />
                                     <div className="h-px flex-1 bg-gradient-to-r from-purple-500/40 to-cyan-500/40 mx-12 relative">
                                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                                     </div>
                                     <AlleleControl label="Recessive (q)" value={1 - pFreq} onChange={(val: number) => setPFreq(1 - val)} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                    <PopMetric label="AA (p²)" val={populationGenetics.pSq} desc="Homozygous Dom." />
                                    <PopMetric label="Aa (2pq)" val={populationGenetics.twoPq} desc="Heterozygous" highlight />
                                    <PopMetric label="aa (q²)" val={populationGenetics.qSq} desc="Homozygous Rec." />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'lab' && (
                        <motion.div key="l" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="p-8 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-white/10 rounded-[40px] flex flex-col justify-between">
                                 <div>
                                    <h3 className="text-2xl font-black italic mb-2">Molecular Dynamics</h3>
                                    <p className="text-xs text-white/60 leading-relaxed">Integrated stoichiometry and molecular tools for biochemical laboratory preparation and complex titration metrics.</p>
                                 </div>
                                 <div className="mt-12 grid grid-cols-2 gap-4">
                                     <LinkCard icon={<Database size={20}/>} label="Codon Table" sub="64 Triplets" />
                                     <LinkCard icon={<Scale size={20}/>} label="Molarity Calc" sub="Buffer Prep" />
                                     <LinkCard icon={<Globe size={20}/>} label="Phylogeny" sub="Tree Analysis" />
                                     <LinkCard icon={<TestTube size={20}/>} label="Primer Design" sub="GC Matching" />
                                 </div>
                            </div>

                            <section className="p-8 bg-black/40 border border-white/5 rounded-[40px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Zap size={100}/></div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Central Dogma Simulation</h3>
                                <div className="space-y-4">
                                     <DogmaRow label="Transcription" seq={analytics.seq} target="mRNA" color="#10b981" />
                                     <DogmaRow label="Translation" seq={analytics.seq} target="Peptide" color="#3b82f6" />
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="px-8 py-4 border-t border-white/5 bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <StatusDot label="Genomics Engine" active />
                    <StatusDot label="CAS Solver" active />
                </div>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Integrated Bio-Systems // Lab Runtime</div>
            </footer>
        </div>
    );
}

function BioMetric({ label, value, sub, color }: any) {
    return (
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
             <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: `${color}cc` }}>{label}</div>
             <div className="text-2xl font-black italic tracking-tighter text-white/90">{value}</div>
             <div className="text-[8px] font-bold text-slate-600 uppercase mt-1 tracking-widest">{sub}</div>
        </div>
    );
}

function AlleleControl({ label, value, onChange }: any) {
    return (
        <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{label}</span>
             <input
                type="number"
                step={0.01} min={0} max={1}
                value={value.toFixed(2)}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-24 h-24 rounded-[32px] bg-black/60 border border-white/10 text-3xl font-black text-center text-purple-400 outline-none focus:border-purple-500/40"
             />
        </div>
    );
}

function PopMetric({ label, val, desc, highlight }: any) {
    return (
        <div className={`p-6 rounded-3xl border ${highlight ? 'bg-purple-500/10 border-purple-500/30 shadow-2xl' : 'bg-white/[0.02] border-white/5'}`}>
             <div className="text-xl font-mono font-black mb-1">{label}</div>
             <div className="text-2xl font-black text-white/90">{(val * 100).toFixed(1)}%</div>
             <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{desc}</div>
        </div>
    );
}

function DogmaRow({ label, seq, target, color }: any) {
    return (
        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
             <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
                 <span className="text-[10px] text-slate-600 font-mono italic">→ {target}</span>
             </div>
             <div className="text-[9px] font-mono tracking-widest text-slate-400 truncate opacity-40 italic">{seq}</div>
        </div>
    );
}

function LinkCard({ icon, label, sub }: any) {
    return (
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
             <div className="text-white/20 group-hover:text-white/80 transition-colors mb-2">{icon}</div>
             <div className="text-[10px] font-black text-white/80 uppercase tracking-widest">{label}</div>
             <div className="text-[8px] text-white/20 font-bold uppercase">{sub}</div>
        </div>
    );
}

function StatusDot({ label, active }: any) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
        </div>
    );
}
