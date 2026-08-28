'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MODULE_REGISTRY, ModuleType, getModuleIcon, TOTAL_CALCULATORS_LABEL } from '@/config/modules';
import { WindowContent } from '@/components/os/WindowContent';
import { X, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';
import { getLitePage, type LiteCategoryKey } from '@/locales/liteTranslations';
import { HIDDEN_LITE_TYPES } from '@/config/retiredModules';

// Order of categories for display
const CATEGORY_ORDER: LiteCategoryKey[] = ['mechanical', 'manufacturing', 'civil', 'electrical', 'finance', 'science', 'software', 'other'];

export function LiteClient() {
    const { language } = useI18nStore();
    const t = getLitePage(language);
    const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const modules = Object.values(MODULE_REGISTRY).filter(mod =>
        !HIDDEN_LITE_TYPES.has(mod.type)
    );

    const filteredModules = modules.filter(mod => 
        mod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        mod.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping
    const grouped = CATEGORY_ORDER.map(cat => ({
        category: cat,
        items: filteredModules.filter(m => m.category === cat)
    })).filter(g => g.items.length > 0);

    return (
        <div className="flex flex-col gap-6 pb-20 max-w-[1400px] mx-auto px-3 sm:px-6 pt-4 font-mono select-none">
            {/* Header / Search Instrument Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] uppercase">{t.title}</h1>
                        <span className="px-2 py-0.5 rounded-[var(--radius-s)] text-[10px] font-mono font-bold bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/30">
                            {TOTAL_CALCULATORS_LABEL} {language === 'tr' ? 'MODÜL' : 'SOLVERS'}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--alu-dim)] font-sans mt-0.5">{t.subtitle}</p>
                </div>
                <div className="relative w-full sm:w-80">
                    <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-[var(--radius-s)] px-3 py-2 text-xs outline-none focus:border-[var(--cyan)] transition-colors text-[var(--ink)] placeholder-[var(--alu-dim)]/50 font-mono"
                    />
                </div>
            </div>

            {/* Grid display by category */}
            <div className="flex flex-col gap-6">
                {grouped.length === 0 ? (
                    <div className="text-center py-16 text-[var(--alu-dim)] border border-[var(--line)] rounded-[var(--radius-m)] bg-[var(--bg-1)]">
                        <LayoutGrid className="mx-auto h-10 w-10 opacity-20 mb-3 text-[var(--cyan)]" />
                        <p className="text-xs">{t.emptyState}</p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.category} className="flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-[var(--cyan)] rounded-[1px]"></span>
                                    <span>{t.categories[group.category as LiteCategoryKey] || group.category}</span>
                                </h2>
                                <span className="text-[10px] text-[var(--alu-dim)] font-normal">({group.items.length})</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                                {group.items.map(mod => {
                                    const IconNode = getModuleIcon(mod.iconName);
                                    return (
                                        <Link
                                            key={mod.type}
                                            href={`/${mod.type}`}
                                            onClick={(e) => {
                                                // On mobile, allow instant modal preview or direct route
                                                if (window.innerWidth < 768) {
                                                    e.preventDefault();
                                                    setActiveModule(mod.type);
                                                }
                                            }}
                                            className="group relative flex flex-col items-start p-3 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] hover:border-[var(--cyan)] hover:bg-[var(--bg-2)] transition-colors text-left"
                                        >
                                            <div className="w-7 h-7 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center text-[var(--cyan)] group-hover:border-[var(--cyan)]/40 transition-colors mb-2">
                                                <IconNode size={16} strokeWidth={2} />
                                            </div>
                                            <span className="font-bold text-xs text-[var(--ink)] line-clamp-2 leading-tight uppercase group-hover:text-[var(--cyan)] transition-colors font-mono">
                                                {mod.title}
                                            </span>
                                            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 text-[var(--cyan)] transition-opacity">
                                                <ArrowUpRight size={12} />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Full Screen Slide-Over for Mobile Active Module */}
            <AnimatePresence>
                {activeModule && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50, transition: { duration: 0.2 } }}
                        className="fixed inset-0 z-[100] bg-[var(--bg-0)] flex flex-col"
                    >
                        {/* Slide-over header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-1)]">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-[var(--ink)] uppercase">
                                    {MODULE_REGISTRY[activeModule]?.title || activeModule}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <Link
                                    href={`/${activeModule}`}
                                    className="px-2.5 py-1 text-[11px] font-bold rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)]"
                                >
                                    {language === 'tr' ? 'Tam Sayfa ↗' : 'Full Page ↗'}
                                </Link>
                                <button 
                                    onClick={() => setActiveModule(null)}
                                    className="p-1.5 rounded-[var(--radius-s)] text-[var(--alu-dim)] hover:bg-[var(--bg-2)] hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content viewport */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[var(--bg-0)]">
                            <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
                                <WindowContent type={activeModule} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LiteClient;

