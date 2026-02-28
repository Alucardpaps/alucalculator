'use client';

import React, { useState, useMemo } from 'react';
import { Layers, Search, Activity, ChevronRight } from 'lucide-react';
import { MATERIALS_DB, MaterialProp } from '@/data/materialsData';
import { useI18nStore } from '@/store/i18nStore';

/**
 * MaterialsDatabaseModule - Consolidated Engineering Materials Reference
 * Displays all materials and their detailed properties in a single-page layout.
 */
export function MaterialsDatabaseModule() {
    const { t } = useI18nStore();
    const [search, setSearch] = useState('');
    const [selectedMaterialName, setSelectedMaterialName] = useState<string | null>(MATERIALS_DB[0].name);

    // Filtered materials grouped by category
    const materialsByCategory = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = MATERIALS_DB.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q) ||
            (m.machinability && m.machinability.toLowerCase().includes(q)) ||
            (m.weldability && m.weldability.toLowerCase().includes(q))
        );

        return filtered.reduce((acc, m) => {
            if (!acc[m.category]) acc[m.category] = [];
            acc[m.category].push(m);
            return acc;
        }, {} as Record<string, MaterialProp[]>);
    }, [search]);

    const selected = useMemo(() =>
        MATERIALS_DB.find(m => m.name === selectedMaterialName) || null
        , [selectedMaterialName]);

    return (
        <div className="flex flex-col h-full bg-[#0a0f14] text-slate-200 overflow-hidden font-sans">
            {/* ─── HEADER: SEARCH & TITLE ─── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-b border-slate-800/50 bg-[#0d121aa0] backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <Layers size={22} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase">Material Science</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Unified Engineering Database</p>
                    </div>
                </div>

                <div className="relative group w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search grade, category, or property..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ─── SIDEBAR: NAVIGATION & SELECTION DETAILS ─── */}
                <div className="w-80 border-r border-slate-800/50 bg-[#0d121aa0] backdrop-blur-xl flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2 mb-1">Categories</div>
                        {Object.keys(materialsByCategory).map(cat => (
                            <button
                                key={cat}
                                onClick={() => {
                                    const el = document.getElementById(`cat-${cat}`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group"
                            >
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-colors" />
                                    {cat}
                                </span>
                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-all font-bold">
                                    {materialsByCategory[cat].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {selected && (
                        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 to-transparent border border-blue-500/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-black text-white text-lg tracking-tight mb-0.5">{selected.name}</h3>
                                    <span className="text-[11px] uppercase font-bold text-blue-500 tracking-widest">{selected.category}</span>
                                </div>
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Activity size={16} className="text-blue-400" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <QuickStat label="Density" value={selected.density} unit="g/cm³" />
                                    <QuickStat label="Hardness" value={selected.hardness} unit="" />
                                </div>

                                <div className="space-y-2.5 pt-4 border-t border-slate-800/50">
                                    <DetailedRow label="Young's Moduli (E)" value={selected.youngsModulus} unit="GPa" />
                                    <DetailedRow label="Yield Strength (Sy)" value={selected.yield} unit="MPa" />
                                    <DetailedRow label="Tensile Strength (St)" value={selected.tensile} unit="MPa" />
                                    <DetailedRow label="Poisson's Ratio" value={selected.poissonsRatio} unit="" />
                                    <DetailedRow label="Weldability" value={selected.weldability} unit="" />
                                    <DetailedRow label="Machinability" value={selected.machinability} unit="" />
                                </div>

                                {(selected.thermalCond || selected.meltingPoint) && (
                                    <div className="space-y-2.5 pt-4 border-t border-slate-800/50">
                                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Thermal & Phys.</div>
                                        {selected.thermalCond && <DetailedRow label="Thermal Cond." value={selected.thermalCond} unit="W/mK" />}
                                        {selected.thermalExp && <DetailedRow label="Thermal Exp." value={selected.thermalExp} unit="µm/mK" />}
                                        {selected.specificHeat && <DetailedRow label="Specific Heat" value={selected.specificHeat} unit="J/kgK" />}
                                        {selected.elecResist && <DetailedRow label="Elec. Resist." value={selected.elecResist} unit="µΩcm" />}
                                        {selected.meltingPoint && <DetailedRow label="Melting Point" value={selected.meltingPoint} unit="°C" />}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── MAIN CONTENT: PROPERTY GRID ─── */}
                <div className="flex-1 overflow-y-auto bg-slate-950/20 custom-scrollbar p-8">
                    <div className="space-y-16 max-w-[1400px] mx-auto pb-20">
                        {Object.keys(materialsByCategory).map(cat => (
                            <section key={cat} id={`cat-${cat}`} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex items-center gap-6 mb-8 group/header">
                                    <div className="relative">
                                        <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-2 group-hover/header:text-blue-400 transition-colors">
                                            {cat}
                                        </h2>
                                        <div className="absolute -bottom-2 left-0 w-12 h-1 bg-blue-500 rounded-full group-hover/header:w-full transition-all duration-500" />
                                    </div>
                                    <div className="flex-1 h-px bg-slate-800/50" />
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                    {materialsByCategory[cat].map(m => (
                                        <button
                                            key={m.name}
                                            onClick={() => setSelectedMaterialName(m.name)}
                                            className={`group relative text-left p-6 rounded-[2rem] border transition-all duration-500 ${selectedMaterialName === m.name
                                                ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50 shadow-2xl shadow-blue-500/10 scale-[1.02]'
                                                : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60 shadow-lg'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="font-black text-slate-100 group-hover:text-white transition-colors text-base leading-tight">{m.name}</div>
                                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">Engineering Specifications</div>
                                                </div>
                                                {selectedMaterialName === m.name && (
                                                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse" />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <PropertyCompact label="Yield (Sy)" value={m.yield} unit="MPa" />
                                                    <PropertyCompact label="Tensile (St)" value={m.tensile} unit="MPa" />
                                                    <PropertyCompact label="Young's (E)" value={m.youngsModulus} unit="GPa" />
                                                </div>
                                                <div className="space-y-3">
                                                    <PropertyCompact label="Poissons" value={m.poissonsRatio} unit="" />
                                                    <PropertyCompact label="Density" value={m.density} unit="g/cm³" />
                                                    <PropertyCompact label="Hardness" value={m.hardness} unit="" />
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col gap-3">
                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-tight">
                                                    <span className="text-slate-500">Machinability</span>
                                                    <span className={`px-2 py-0.5 rounded-full ${m.machinability.includes('Excellent') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{m.machinability}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-tight">
                                                    <span className="text-slate-500">Weldability</span>
                                                    <span className={`px-2 py-0.5 rounded-full ${m.weldability.includes('Excellent') ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>{m.weldability}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function QuickStat({ label, value, unit }: { label: string, value: any, unit: string }) {
    if (value === undefined || value === null) return null;
    return (
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/30">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">{label}</div>
            <div className="text-sm font-mono text-white leading-none">
                {value} <span className="text-[8px] text-slate-500">{unit}</span>
            </div>
        </div>
    );
}

function DetailedRow({ label, value, unit }: { label: string, value: any, unit: string }) {
    if (value === undefined || value === null) return null;
    return (
        <div className="flex justify-between items-center group/row">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight group-hover/row:text-slate-400 transition-colors">{label}</span>
            <span className="text-[11px] font-mono text-slate-200 group-hover/row:text-blue-400 transition-colors">
                {value} <span className="text-[8px] text-slate-500 uppercase">{unit}</span>
            </span>
        </div>
    );
}

function PropertyCompact({ label, value, unit }: { label: string, value: any, unit: string }) {
    if (value === undefined || value === null) return null;
    return (
        <div className="flex flex-col gap-0.5">
            <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">{label}</div>
            <div className="text-xs font-mono text-slate-200 leading-none">
                {value} <span className="text-[7px] text-slate-600 uppercase">{unit}</span>
            </div>
        </div>
    );
}

export default MaterialsDatabaseModule;
