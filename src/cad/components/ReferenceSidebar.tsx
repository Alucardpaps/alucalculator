'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Search,
    Scale,
    Calculator,
    HelpCircle,
    ChevronRight,
    ExternalLink
} from 'lucide-react';

interface ReferenceItem {
    title: string;
    content: string;
    category: 'Material' | 'Formula' | 'Shortcut';
}

const REFERENCES: ReferenceItem[] = [
    { title: 'Aluminum 6061-T6', content: 'Density: 2.70 g/cm³, Young\'s Modulus: 68.9 GPa, Poisson\'s Ratio: 0.33', category: 'Material' },
    { title: 'Steel AISI 1018', content: 'Density: 7.87 g/cm³, Young\'s Modulus: 200 GPa, Yield Strength: 370 MPa', category: 'Material' },
    { title: 'Area of Circle', content: 'A = π * r²', category: 'Formula' },
    { title: 'Volume of Cylinder', content: 'V = π * r² * h', category: 'Formula' },
    { title: 'Line Tool', content: 'Draw a single line. Shortcut: L', category: 'Shortcut' },
    { title: 'Smart Dimension', content: 'Add parametric constraints. Shortcut: D', category: 'Shortcut' },
];

export function ReferenceSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = REFERENCES.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-4 bottom-20 z-50 p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 backdrop-blur-xl transition-all shadow-[0_0_20px_rgba(0,229,255,0.1)] group"
            >
                <Book size={20} className="group-hover:rotate-12 transition-transform" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        className="fixed right-0 top-0 h-full w-80 z-[60] bg-[#05090e]/90 backdrop-blur-2xl border-l border-white/5 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase flex items-center gap-2">
                                <Book size={16} /> Engineering Ref
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 bg-white/[0.01]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search references..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-md py-2 pl-9 pr-4 text-xs text-slate-300 outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {['Material', 'Formula', 'Shortcut'].map(cat => {
                                const items = filtered.filter(f => f.category === cat);
                                if (items.length === 0) return null;

                                return (
                                    <div key={cat} className="space-y-2">
                                        <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2">{cat}s</h3>
                                        <div className="space-y-1">
                                            {items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:border-cyan-500/30 transition-all cursor-default group"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                                                        <ExternalLink size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 leading-relaxed">{item.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Quick Links */}
                        <div className="p-4 border-t border-white/5 grid grid-cols-3 gap-2">
                            <button className="flex flex-col items-center gap-1 p-2 bg-white/[0.02] rounded-md hover:bg-white/[0.05] transition-colors">
                                <Calculator size={14} className="text-cyan-500" />
                                <span className="text-[8px] text-slate-500 uppercase">Calc</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-2 bg-white/[0.02] rounded-md hover:bg-white/[0.05] transition-colors">
                                <Scale size={14} className="text-cyan-500" />
                                <span className="text-[8px] text-slate-500 uppercase">Mass</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-2 bg-white/[0.02] rounded-md hover:bg-white/[0.05] transition-colors">
                                <HelpCircle size={14} className="text-cyan-500" />
                                <span className="text-[8px] text-slate-500 uppercase">Docs</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
