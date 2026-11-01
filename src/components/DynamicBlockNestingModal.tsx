'use client';

import React, { useState, useMemo } from 'react';
import {
    Search,
    X,
    Plus,
    Check,
    Layers,
    Sliders,
    Maximize2,
    Sparkles,
    ShieldCheck,
    Info,
    Flame
} from 'lucide-react';
import { DynamicBlockRegistry, DYNAMIC_BLOCKS } from '@/cad/blocks/dynamic/registry';
import { DynamicBlockDef } from '@/cad/blocks/dynamic/types';
import { DynamicBlockAnimatedIcon } from '@/cad/components/DynamicBlockAnimatedIcon';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import type { Part2D } from '@/types/nesting2d.types';

interface DynamicBlockNestingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddPart: (part: Part2D) => void;
}

export function DynamicBlockNestingModal({
    isOpen,
    onClose,
    onAddPart
}: DynamicBlockNestingModalProps) {
    const [selectedBlockId, setSelectedBlockId] = useState<string>('dyn_sheet_metal_plate');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [quantity, setQuantity] = useState<number>(1);

    // Selected block definition
    const activeBlock = useMemo(() => {
        return DynamicBlockRegistry.getById(selectedBlockId) || DYNAMIC_BLOCKS[0];
    }, [selectedBlockId]);

    // Dynamic parameters state
    const [paramValues, setParamValues] = useState<Record<string, any>>(() => {
        const initial = DynamicBlockRegistry.getById('dyn_sheet_metal_plate');
        return initial ? { ...initial.defaultValues } : {};
    });

    // When block changes, initialize default values
    const handleSelectBlock = (block: DynamicBlockDef) => {
        setSelectedBlockId(block.id);
        setParamValues({ ...block.defaultValues });
    };

    // Filter categories
    const categories = useMemo(() => {
        const cats = Array.from(new Set(DYNAMIC_BLOCKS.map(b => b.category)));
        return ['All', ...cats];
    }, []);

    // Filter blocks by search and category
    const filteredBlocks = useMemo(() => {
        return DYNAMIC_BLOCKS.filter(b => {
            const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                b.name.toLowerCase().includes(q) ||
                (b.nameTr && b.nameTr.toLowerCase().includes(q)) ||
                b.citation.standard.toLowerCase().includes(q) ||
                b.subcategory.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    // Handle parameter change
    const handleParamChange = (paramId: string, val: any) => {
        setParamValues(prev => ({ ...prev, [paramId]: val }));
    };

    // Handle Add to Nesting
    const handleAddToNesting = () => {
        const res = CrossModuleBridge.exportDynamicBlockToNesting(
            activeBlock.id,
            paramValues,
            { quantity, switchWindow: false }
        );

        if (res.part) {
            onAddPart(res.part);
            onClose();
        } else {
            alert('Bu blok için 2D kesim konturu oluşturulamadı.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[85vh] bg-[var(--bg-0)] border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col divide-y divide-[var(--line)]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--bg-1)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                <span>Dinamik Blok Kütüphanesinden Parça Ekle</span>
                                <span className="text-[10px] font-mono text-cyan-400 font-normal px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                                    {DYNAMIC_BLOCKS.length} Parametrik Model
                                </span>
                            </h2>
                            <p className="text-[11px] text-slate-400">
                                AutoCAD normlarında 2D & 3D dinamik blokları doğrudan sac yerleşimi ve plazma CAM takım yoluna aktarın.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="px-5 py-2.5 bg-[var(--bg-1)] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm font-black'
                                        : 'bg-[var(--bg-2)] text-slate-400 hover:text-white border border-[var(--line)]'
                                }`}
                            >
                                {cat === 'All' ? 'Tümü' : cat}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-64 shrink-0">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Dinamik blok ara..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-2)] border border-[var(--line)] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                    </div>
                </div>

                {/* Content: Left Block Grid, Right Parameter Inspector & Preview */}
                <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-[var(--line)]">
                    {/* Left: Dynamic Blocks Grid (7 cols) */}
                    <div className="col-span-7 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[var(--bg-0)]">
                        <div className="grid grid-cols-2 gap-2">
                            {filteredBlocks.map(block => {
                                const isSelected = block.id === selectedBlockId;
                                return (
                                    <div
                                        key={block.id}
                                        onClick={() => handleSelectBlock(block)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-md '
                                                : 'bg-[var(--bg-1)] border-[var(--line)] text-slate-400 hover:border-slate-700 hover:bg-[var(--bg-2)]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className="shrink-0 p-1.5 bg-[var(--bg-2)] rounded-lg border border-[var(--line)] flex items-center justify-center">
                                                <DynamicBlockAnimatedIcon blockId={block.id} isSelected={isSelected} size={28} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                                                        {block.nameTr || block.name}
                                                    </h4>
                                                </div>
                                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                                    {block.subcategoryTr || block.subcategory}
                                                </p>
                                                <div className="mt-1 flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                                                    <span className="bg-[var(--bg-2)] px-1 py-0.5 rounded text-slate-300 border border-[var(--line)]">
                                                        {block.citation.standard.split('/')[0]}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{block.linearParams.length} Boyut</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Parameter Configurator & Insertion (5 cols) */}
                    <div className="col-span-5 flex flex-col min-h-0 bg-[var(--bg-1)] divide-y divide-[var(--line)]">
                        {/* Block Header info */}
                        <div className="p-4 bg-[var(--bg-1)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--bg-2)] rounded-xl border border-cyan-500/30">
                                    <DynamicBlockAnimatedIcon blockId={activeBlock.id} isSelected={true} size={32} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xs font-bold text-white truncate">
                                        {activeBlock.nameTr || activeBlock.name}
                                    </h3>
                                    <span className="text-[10px] font-mono text-cyan-400 block truncate">
                                        {activeBlock.citation.standard}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                                {activeBlock.descriptionTr || activeBlock.description}
                            </p>
                        </div>

                        {/* Parameter Inputs Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {/* Lookups / Presets */}
                            {activeBlock.lookupParams && activeBlock.lookupParams.length > 0 && (
                                <div className="space-y-3">
                                    {activeBlock.lookupParams.map(lookup => (
                                        <div key={lookup.id} className="space-y-1">
                                            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                                                {lookup.labelTr || lookup.label}
                                            </label>
                                            <select
                                                value={paramValues[lookup.id] || lookup.default}
                                                onChange={(e) => handleParamChange(lookup.id, e.target.value)}
                                                className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                                            >
                                                {lookup.options.map(opt => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Linear Dimensions */}
                            {activeBlock.linearParams && activeBlock.linearParams.length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                                        Boyutsal Parametreler ({activeBlock.linearParams.length})
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {activeBlock.linearParams.map(lp => (
                                            <div key={lp.id} className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                                    <span>{lp.labelTr || lp.label}:</span>
                                                    <span className="text-cyan-400 font-bold">
                                                        {paramValues[lp.id] ?? lp.default} {lp.unit}
                                                    </span>
                                                </div>
                                                <input
                                                    type="number"
                                                    min={lp.min}
                                                    max={lp.max}
                                                    step={lp.step}
                                                    value={paramValues[lp.id] ?? lp.default}
                                                    onChange={(e) => handleParamChange(lp.id, Number(e.target.value) || lp.default)}
                                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="space-y-1 pt-2 border-t border-[var(--line)]">
                                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                                    <span>Yerleşime Eklenecek Adet:</span>
                                    <span className="text-cyan-400 font-black">{quantity} Adet</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-9 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] text-white flex items-center justify-center hover:bg-[var(--bg-3)] font-bold"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={1000}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="flex-1 bg-[var(--bg-2)] border border-[var(--line)] rounded-lg text-center py-1 text-xs text-white font-mono font-bold outline-none focus:border-cyan-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="w-9 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] text-white flex items-center justify-center hover:bg-[var(--bg-3)] font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-4 bg-[var(--bg-1)] space-y-2">
                            <button
                                type="button"
                                onClick={handleAddToNesting}
                                className="w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <Plus size={16} />
                                <span>Bu Parçayı Yerleşime Ekle ({quantity} Adet)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
