'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Sparkles, Check } from 'lucide-react';
import {
    FLOW_CATEGORIES,
    getFlowCatalog,
    FlowCatalogItem,
    spawnCatalogItem,
} from '@/flow/catalog/flowCatalog';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    spawnPosition: { x: number; y: number };
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, spawnPosition }) => {
    const { language } = useI18nStore();

    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const allCatalog = useMemo(() => getFlowCatalog(), []);

    // Filter by category and search query across the complete catalog (all 102 items)
    const filteredNodes = useMemo(() => {
        let list = allCatalog;
        if (selectedCategory !== 'all') {
            list = list.filter((item) => item.category === selectedCategory);
        }
        if (!query.trim()) return list;

        const q = query.toLowerCase().trim();
        return list.filter(
            (n) =>
                n.title.toLowerCase().includes(q) ||
                n.id.toLowerCase().includes(q) ||
                n.description.toLowerCase().includes(q) ||
                (n.iso && n.iso.toLowerCase().includes(q)) ||
                n.categoryTitle.toLowerCase().includes(q)
        );
    }, [allCatalog, selectedCategory, query]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query, selectedCategory]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedCategory('all');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 60);
        }
    }, [isOpen]);

    // Keep selected item visible in scroll view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    const handleSelectNode = (node: FlowCatalogItem) => {
        spawnCatalogItem(node, spawnPosition);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredNodes.length));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredNodes.length) % Math.max(1, filteredNodes.length));
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredNodes[selectedIndex]) {
                handleSelectNode(filteredNodes[selectedIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/65 animate-in fade-in duration-100"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={containerRef}
                className="w-[580px] max-w-[95vw] bg-[var(--bg-1)] border border-cyan-500/40 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
                onKeyDown={handleKeyDown}
            >
                {/* Search Bar & Header */}
                <div className="p-3.5 border-b border-cyan-900/40 bg-[var(--bg-2)]">
                    <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                                <Sparkles size={13} />
                            </div>
                            <span className="text-xs font-black tracking-wider text-slate-100 uppercase">
                                {t12(language, 'Quick Add Node (Library)', 'Hızlı Düğüm Ekle (Kütüphane)')}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                {allCatalog.length} {t12(language, 'Nodes', 'Düğüm')}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2.5 px-3 py-2 border border-cyan-900/60 focus-within:border-cyan-400/80 bg-[var(--bg-1)] rounded-xl transition-all">
                        <Search size={15} className="text-cyan-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t12(
                                language,
                                'Search all nodes (gear, beam, profile, vibration, pH, bolt, vector)...',
                                'Düğüm ara (dişli, kiriş, profil, rezonans, pH, cıvata, vektör)...'
                            )}
                            className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 outline-none font-mono"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="text-slate-500 hover:text-slate-300 p-0.5 text-xs"
                            >
                                ✕
                            </button>
                        )}
                        <div className="text-[9px] font-mono text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">
                            ESC
                        </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pt-2.5 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-2 py-0.8 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                                selectedCategory === 'all'
                                    ? 'bg-cyan-500/25 border border-cyan-400/70 text-cyan-200 '
                                    : 'bg-[var(--bg-1)] border border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            `${t12(language, 'All', 'Tümü')} (${allCatalog.length})`
                        </button>
                        {FLOW_CATEGORIES.map((cat) => {
                            const count = allCatalog.filter((item) => item.category === cat.id).length;
                            const isSelected = selectedCategory === cat.id;
                            const Icon = cat.icon;

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-2 py-0.8 rounded-md text-[10px] font-semibold transition-all shrink-0 cursor-pointer border ${
                                        isSelected
                                            ? 'text-white shadow-md'
                                            : 'bg-[var(--bg-1)] border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                    style={{
                                        borderColor: isSelected ? cat.color : undefined,
                                        backgroundColor: isSelected ? cat.bg : undefined,
                                    }}
                                >
                                    <Icon size={11} style={{ color: cat.color }} />
                                    <span>{t12(language, cat.labelEn.split(' ')[0], cat.labelTr.split(' ')[0])}</span>
                                    <span className="text-[9px] opacity-75 font-mono">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Node List (Scrollable, full catalog) */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[380px] scrollbar-thin scrollbar-thumb-cyan-900/40"
                >
                    {filteredNodes.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500 font-mono">
                            {t12(
                                language,
                                `No engineering node found matching "${query}".`,
                                `"${query}" aramasıyla eşleşen mühendislik düğümü bulunamadı.`
                            )}
                        </div>
                    ) : (
                        filteredNodes.map((node, index) => {
                            const isSelected = index === selectedIndex;
                            const Icon = node.icon;

                            return (
                                <button
                                    key={node.id}
                                    type="button"
                                    onClick={() => handleSelectNode(node)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full text-left p-2.5 rounded-xl flex items-start justify-between gap-3 transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-cyan-950/40 border-cyan-400/80 '
                                            : 'bg-[var(--bg-1)]/60 hover:bg-[var(--bg-2)] border-slate-800/80'
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5"
                                            style={{
                                                backgroundColor: `${node.color}18`,
                                                borderColor: `${node.color}50`,
                                            }}
                                        >
                                            <Icon size={16} style={{ color: node.color }} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`text-xs font-bold transition-colors ${
                                                        isSelected ? 'text-cyan-200' : 'text-slate-100'
                                                    }`}
                                                >
                                                    {node.title}
                                                </span>

                                                {node.iso && (
                                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                                                        {node.iso}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                {node.description}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span
                                            className="text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase"
                                            style={{
                                                color: node.color,
                                                borderColor: `${node.color}40`,
                                                backgroundColor: `${node.color}10`,
                                            }}
                                        >
                                            {node.categoryTitle}
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-600">
                                            {node.id}
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer Tip */}
                <div className="px-3.5 py-2 border-t border-slate-800/80 bg-[var(--bg-0)] flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-2">
                        <span>↑↓ {t12(language, 'Navigate', 'Gezin')}</span>
                        <span>·</span>
                        <span className="text-cyan-400 font-bold">Enter {t12(language, 'Add Node', 'Düğümü Ekle')}</span>
                    </span>
                    <span className="text-slate-500">
                        {filteredNodes.length} / {allCatalog.length} {t12(language, 'Nodes', 'Düğüm')}
                    </span>
                </div>
            </div>
        </div>
    );
};
