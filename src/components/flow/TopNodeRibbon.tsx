'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    ChevronDown,
    Search,
    X,
    Sparkles,
    Check,
    Wand2,
} from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { AegisFlowAiModal } from './AegisFlowAiModal';
import {
    FLOW_CATEGORIES,
    getFlowCatalog,
    FlowCatalogItem,
    spawnCatalogItem,
} from '@/flow/catalog/flowCatalog';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useAegisCadHost } from '@/store/aegisStore';

interface TopNodeRibbonProps {
    onNodeAdded?: (nodeId: string) => void;
}

export const TopNodeRibbon: React.FC<TopNodeRibbonProps> = ({ onNodeAdded }) => {
    const { language } = useI18nStore();
    const reactFlowInstance = useReactFlow();

    const [activeCategory, setActiveCategory] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('ribbonCat') || null;
        }
        return null;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [justAddedId, setJustAddedId] = useState<string | null>(null);
    const [aiFlowOpen, setAiFlowOpen] = useState(false);
  const [aegisHandover, setAegisHandover] = useState<{ prompt: string; key: number } | null>(null);
  useAegisCadHost('flow', (prompt) => {
    setAegisHandover({ prompt, key: Date.now() });
    setAiFlowOpen(true);
  });
    const [menuPosition, setMenuPosition] = useState<{ left: number; top: number }>({ left: 100, top: 42 });

    const ribbonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const searchInputRef = useRef<HTMLInputElement>(null);

    const allCatalog = useMemo(() => getFlowCatalog(), []);

    // Count items per category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const cat of FLOW_CATEGORIES) {
            counts[cat.id] = allCatalog.filter((item) => item.category === cat.id).length;
        }
        return counts;
    }, [allCatalog]);

    // Active category metadata
    const activeMeta = useMemo(() => {
        if (!activeCategory) return null;
        return FLOW_CATEGORIES.find((c) => c.id === activeCategory) || null;
    }, [activeCategory]);

    // Nodes for active category with search filtering
    const activeNodes = useMemo(() => {
        if (!activeCategory) return [];
        let items = allCatalog.filter((item) => item.category === activeCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            items = items.filter(
                (item) =>
                    item.title.toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q) ||
                    (item.iso && item.iso.toLowerCase().includes(q))
            );
        }
        return items;
    }, [allCatalog, activeCategory, searchQuery]);

    // Update dropdown anchor position
    const updatePosition = useCallback((catId: string) => {
        const btn = buttonRefs.current[catId];
        const ribbon = ribbonRef.current;
        if (btn && ribbon) {
            const btnRect = btn.getBoundingClientRect();
            const ribbonRect = ribbon.getBoundingClientRect();
            const menuWidth = 340;
            let left = btnRect.left - ribbonRect.left;

            if (left + menuWidth > ribbonRect.width) {
                left = Math.max(8, ribbonRect.width - menuWidth - 12);
            }

            setMenuPosition({
                left: Math.max(8, left),
                top: btnRect.bottom - ribbonRect.top + 4,
            });
        }
    }, []);

    // Initialize position for activeCategory on mount or change
    useEffect(() => {
        if (activeCategory) {
            setSearchQuery('');
            updatePosition(activeCategory);
            setTimeout(() => {
                updatePosition(activeCategory);
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [activeCategory, updatePosition]);

    // Close on Escape or click outside
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && activeCategory) {
                setActiveCategory(null);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (!activeCategory) return;
            const target = e.target as Node;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                ribbonRef.current &&
                !ribbonRef.current.contains(target)
            ) {
                setActiveCategory(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeCategory]);

    const handleToggleCategory = (catId: string) => {
        if (activeCategory === catId) {
            setActiveCategory(null);
        } else {
            updatePosition(catId);
            setActiveCategory(catId);
        }
    };

    // Calculate smart spawn position (center of current viewport with small random offset)
    const getSpawnPosition = () => {
        try {
            const windowW = window.innerWidth || 1200;
            const windowH = window.innerHeight || 800;
            const flowPos = reactFlowInstance.screenToFlowPosition({
                x: windowW * 0.45 + (Math.random() * 80 - 40),
                y: windowH * 0.4 + (Math.random() * 80 - 40),
            });
            return flowPos;
        } catch {
            return { x: 350 + Math.random() * 60, y: 200 + Math.random() * 60 };
        }
    };

    const handleAddNode = (item: FlowCatalogItem, keepOpen = false) => {
        const pos = getSpawnPosition();
        const nodeId = spawnCatalogItem(item, pos);

        setJustAddedId(item.id);
        setTimeout(() => setJustAddedId(null), 1200);

        if (nodeId && onNodeAdded) {
            onNodeAdded(nodeId);
        }

        if (!keepOpen) {
            setActiveCategory(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, item: FlowCatalogItem) => {
        e.dataTransfer.setData('application/reactflow', item.type);
        e.dataTransfer.setData('application/payload', JSON.stringify(item.payload ?? {}));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="relative w-full z-30 select-none" ref={ribbonRef}>
            {/* Horizontal Category Ribbon Bar */}
            <div className="h-10 bg-[var(--bg-1)] border-b border-[var(--line)] px-3 flex items-center justify-between text-xs overflow-x-auto scrollbar-none shadow-md">
                <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-1 border-r border-[var(--line)]">
                        <Sparkles size={12} className="text-cyan-400" />
                        <span className="hidden sm:inline">{t12(language, 'NODES:', 'DÜĞÜMLER:')}</span>
                    </div>

                    {FLOW_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const count = categoryCounts[cat.id] || 0;
                        const isActive = activeCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                ref={(el) => {
                                    buttonRefs.current[cat.id] = el;
                                }}
                                type="button"
                                onClick={() => handleToggleCategory(cat.id)}
                                style={{
                                    borderColor: isActive ? cat.color : undefined,
                                    backgroundColor: isActive ? cat.bg : undefined,
                                    color: isActive ? '#ffffff' : undefined,
                                    boxShadow: isActive ? `0 0 12px ${cat.border}` : undefined,
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
                                    isActive
                                        ? 'border-opacity-80'
                                        : 'bg-[var(--bg-2)]/60 border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-[var(--bg-2)]'
                                }`}
                                title={`${t12(language, cat.labelEn, cat.labelTr)} (${count} ${t12(language, 'Nodes', 'Düğüm')})`}
                            >
                                <Icon
                                    size={13}
                                    style={{ color: cat.color }}
                                    className="shrink-0"
                                />
                                <span className="whitespace-nowrap font-medium">
                                    {t12(language, cat.labelEn.split(' ')[0], cat.labelTr.split(' ')[0])}
                                </span>
                                <span
                                    className="text-[9px] font-mono px-1 py-0.2 rounded-full font-bold"
                                    style={{
                                        backgroundColor: isActive ? cat.color : 'rgba(255,255,255,0.08)',
                                        color: isActive ? '#000000' : '#94a3b8',
                                    }}
                                >
                                    {count}
                                </span>
                                <ChevronDown
                                    size={11}
                                    className={`transition-transform duration-200 text-slate-400 ${
                                        isActive ? 'rotate-180 text-white' : ''
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 pl-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => setAiFlowOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-[10px] font-bold font-mono uppercase tracking-wider transition-all shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                        title={t12(language, 'AeGiS AI Flow & Calculation Generator', 'AeGiS AI Akış & Hesap Motoru')}
                    >
                        <Wand2 size={11} className="text-amber-400" />
                        <span>AI FLOW</span>
                    </button>
                    <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 border-l border-[var(--line)] pl-2">
                        <span className="text-cyan-400 font-bold">{allCatalog.length}</span>
                        <span>{t12(language, 'Nodes', 'Düğüm')}</span>
                    </div>
                </div>
            </div>

            <AegisFlowAiModal
                isOpen={aiFlowOpen}
        initialPrompt={aegisHandover?.prompt}
        autoRunKey={aegisHandover?.key}
                onClose={() => setAiFlowOpen(false)}
            />

            {/* Compact Context Dropdown Menu (Sayfayı Kaplamayan Kompakt Çekmece) */}
            {activeCategory && activeMeta && (
                <div
                    ref={dropdownRef}
                    style={{
                        left: `${menuPosition.left}px`,
                        top: `${menuPosition.top}px`,
                        borderColor: activeMeta.border,
                        boxShadow: `0 20px 45px rgba(0,0,0,0.85), 0 0 15px ${activeMeta.bg}`,
                    }}
                    className="absolute w-[330px] max-w-[92vw] bg-[var(--bg-1)] border border-[var(--line)] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                    {/* Compact Dropdown Header */}
                    <div className="px-3 py-2 border-b border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-5 h-5 rounded flex items-center justify-center shrink-0 border"
                                style={{
                                    backgroundColor: activeMeta.bg,
                                    borderColor: activeMeta.border,
                                }}
                            >
                                <activeMeta.icon size={12} style={{ color: activeMeta.color }} />
                            </div>
                            <span className="text-xs font-bold text-slate-100 uppercase tracking-wide truncate">
                                {t12(language, activeMeta.labelEn, activeMeta.labelTr)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <span
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold"
                                style={{
                                    backgroundColor: activeMeta.bg,
                                    color: activeMeta.color,
                                    border: `1px solid ${activeMeta.border}`,
                                }}
                            >
                                {activeNodes.length}
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveCategory(null)}
                                className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Search Filter (if > 4 items) */}
                    {categoryCounts[activeCategory] > 4 && (
                        <div className="p-2 border-b border-[var(--line)]/80 bg-[var(--bg-1)]">
                            <div className="relative">
                                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t12(language, 'Filter in type...', 'Bu türde filtrele...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[var(--bg-0)] border border-slate-700/60 rounded-md text-[11px] py-1 pl-7 pr-6 text-slate-200 placeholder:text-slate-500 outline-none font-mono focus:border-cyan-500/80"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Vertical Compact List of Nodes */}
                    <div className="max-h-[340px] overflow-y-auto p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
                        {activeNodes.length === 0 ? (
                            <div className="py-6 text-center text-slate-500 text-[11px] font-mono">
                                {t12(language, 'No matching nodes found.', 'Eşleşen düğüm bulunamadı.')}
                            </div>
                        ) : (
                            activeNodes.map((item) => {
                                const ItemIcon = item.icon;
                                const isJustAdded = justAddedId === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        onClick={(e) => handleAddNode(item, e.shiftKey)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors group cursor-pointer border ${
                                            isJustAdded
                                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                                                : 'bg-transparent border-transparent hover:bg-[var(--bg-3)] hover:border-slate-700/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <div
                                                className="w-5 h-5 rounded flex items-center justify-center shrink-0 border"
                                                style={{
                                                    backgroundColor: `${item.color}15`,
                                                    borderColor: `${item.color}35`,
                                                }}
                                            >
                                                <ItemIcon size={11} style={{ color: item.color }} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-200 truncate">
                                                    {item.title}
                                                </div>
                                                <div className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate">
                                                    {item.description}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {isJustAdded ? (
                                                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold">
                                                    <Check size={11} /> {t12(language, 'Added', 'Eklendi')}
                                                </span>
                                            ) : item.iso ? (
                                                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
                                                    {item.iso}
                                                </span>
                                            ) : (
                                                <span className="opacity-0 group-hover:opacity-100 text-cyan-400 text-xs font-bold transition-opacity">
                                                    + Ekle
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Compact Footer */}
                    <div className="px-2.5 py-1.5 border-t border-[var(--line)] bg-[var(--bg-1)] flex items-center justify-between text-[9px] font-mono text-slate-500 shrink-0">
                        <span>{t12(language, 'Click to add · Drag', 'Tıkla: Ekle · Sürükle')}</span>
                        <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-400">ESC</span>
                    </div>
                </div>
            )}
        </div>
    );
};
