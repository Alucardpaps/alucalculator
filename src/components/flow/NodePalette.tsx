'use client';

/**
 * Visual Node Palette — registry-first engineering catalog.
 */

import React, { useState, useMemo } from 'react';
import {
    Search,
    ChevronRight,
    Cpu,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
    FLOW_CATEGORIES,
    getFlowCatalog,
    FlowCatalogItem,
    spawnCatalogItem,
} from '@/flow/catalog/flowCatalog';

interface NodePaletteProps {
    onClose?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onClose }) => {
    const { t, language } = useI18nStore();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        input: true,
        mechanical: true,
        geometry: true,
        physics: false,
        chemical: false,
        material: false,
        utility: false,
        validation: true,
        visual: false,
        export: true,
        legacy: false,
    });

    const catalog = useMemo(() => getFlowCatalog(), []);

    const toggle = (cat: string) => setExpanded((p) => ({ ...p, [cat]: !p[cat] }));

    const onDragStart = (event: React.DragEvent, item: FlowCatalogItem) => {
        event.dataTransfer.setData('application/reactflow', item.type);
        event.dataTransfer.setData('application/payload', JSON.stringify(item.payload ?? {}));
        event.dataTransfer.effectAllowed = 'move';
    };

    const filteredNodes = useMemo(() => {
        let list = catalog;
        if (selectedCategory !== 'all') {
            list = list.filter((n) => n.category === selectedCategory);
        }
        if (!search) return list;
        const q = search.toLowerCase();
        return list.filter((n) =>
            n.label.toLowerCase().includes(q) ||
            n.id.toLowerCase().includes(q) ||
            (n.iso && n.iso.toLowerCase().includes(q))
        );
    }, [search, catalog, selectedCategory]);

    const groupedNodes = useMemo(() => {
        const acc: Record<string, FlowCatalogItem[]> = {};
        for (const cat of FLOW_CATEGORIES) {
            acc[cat.id] = [];
        }
        for (const node of filteredNodes) {
            const cat = node.category;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(node);
        }
        return acc;
    }, [filteredNodes]);

    const dropNode = (node: FlowCatalogItem) => {
        const position = { x: 300 + Math.random() * 80, y: 150 + Math.random() * 80 };
        spawnCatalogItem(node, position);
    };

    return (
        <aside className="w-72 bg-[var(--bg-0)] border-r border-cyan-500/20 flex flex-col h-full select-none z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] shrink-0">
            {/* Header */}
            <div className="p-3.5 border-b border-cyan-500/20 bg-[var(--bg-1)]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 ">
                            <Cpu size={14} />
                        </div>
                        <div>
                            <div className="text-[11px] font-black tracking-wider text-slate-100 uppercase">
                                {t12(language, 'Node Library', 'Düğüm Kütüphanesi')}
                            </div>
                            <div className="text-[9px] font-mono text-cyan-400/70">
                                {catalog.length} {t12(language, 'engineering components', 'hazır bileşen')}
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all"
                            title={t12(language, 'Close Palette', 'Paleti Gizle')}
                        >
                            <span className="text-xs">✕</span>
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder={t.palette?.searchPlaceholder || t12(language, 'Search nodes (gear, column, bolt…)', 'Düğüm ara (dişli, kolon, cıvata…)')}
                        className="w-full bg-[var(--bg-1)] border border-cyan-900/40 rounded-lg text-xs py-1.5 pl-8 pr-7 text-slate-100 focus:border-cyan-400/60 focus:bg-[var(--bg-2)] outline-none placeholder:text-slate-500 transition-all font-mono"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Quick Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pt-2.5 pb-0.5 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                            selectedCategory === 'all'
                                ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-200'
                                : 'bg-[var(--bg-1)] border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {t12(language, 'All', 'Tümü')}
                    </button>
                    {FLOW_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                                selectedCategory === cat.id
                                    ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-200'
                                    : 'bg-[var(--bg-1)] border border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {t12(language, cat.labelEn.split(' ')[0], cat.labelTr.split(' ')[0])}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-cyan-900/40">
                {FLOW_CATEGORIES.map((cat) => {
                    const nodes = groupedNodes[cat.id];
                    if (!nodes || nodes.length === 0) return null;
                    const isOpen = expanded[cat.id] || !!search || selectedCategory !== 'all';
                    const CatIcon = cat.icon;

                    return (
                        <div key={cat.id} className="rounded-lg border border-slate-800/80 bg-[var(--bg-1)]/50 overflow-hidden">
                            <button
                                onClick={() => toggle(cat.id)}
                                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/20 transition-all uppercase tracking-wider cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <CatIcon size={12} style={{ color: cat.color }} />
                                    <span>{t12(language, cat.labelEn, cat.labelTr)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-black/40 border border-slate-800">
                                        {nodes.length}
                                    </span>
                                    <ChevronRight size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-90 text-cyan-400' : 'text-slate-600'}`} />
                                </div>
                            </button>

                            {isOpen && (
                                <div className="p-1.5 space-y-1 bg-black/20 border-t border-slate-800/60">
                                    {nodes.map((node) => {
                                        const ItemIcon = node.icon;
                                        return (
                                            <div
                                                key={node.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, node)}
                                                onClick={() => dropNode(node)}
                                                className="group flex items-center justify-between p-2 rounded-lg bg-[var(--bg-1)]/60 border border-slate-800/60 hover:border-cyan-500/40 hover:bg-[var(--bg-2)] cursor-grab active:cursor-grabbing transition-all select-none"
                                                title={t12(language, "Click to add or drag to canvas", "Tıkla tuvale ekle veya sürükle")}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                    <div className="w-6 h-6 rounded bg-black/40 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-cyan-500/40 group-hover:text-cyan-300 text-slate-400 transition-colors">
                                                        <ItemIcon size={12} style={{ color: node.color }} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-200 truncate">
                                                            {node.title}
                                                        </div>
                                                        <div className="text-[8px] font-mono text-slate-500 truncate flex items-center gap-1">
                                                            <span>{node.id}</span>
                                                            {node.iso && <span className="text-cyan-500/80">· {node.iso}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 text-cyan-400">
                                                    <span className="text-[9px] font-mono bg-cyan-950/80 border border-cyan-500/40 px-1 py-0.5 rounded font-bold">
                                                        + EKLE
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-cyan-500/20 bg-[var(--bg-1)]/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
                <span>FLOW ENGINE LOCKED</span>
                <span className="text-cyan-500/80 font-bold">AC1009 R12</span>
            </div>
        </aside>
    );
};
