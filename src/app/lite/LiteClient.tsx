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
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            {/* Header / Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t.title}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            {TOTAL_CALCULATORS_LABEL} {language === 'tr' ? 'Modül' : 'Solvers'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a212d] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-900 dark:text-white font-mono"
                    />
                </div>
            </div>

            {/* Grid display by category */}
            <div className="flex flex-col gap-10">
                {grouped.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <LayoutGrid className="mx-auto h-12 w-12 opacity-20 mb-4" />
                        <p>{t.emptyState}</p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.category} className="flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                <span>{t.categories[group.category as LiteCategoryKey] || group.category}</span>
                                <span className="text-xs font-mono text-slate-500 font-normal">({group.items.length})</span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                                {group.items.map(mod => {
                                    const IconNode = getModuleIcon(mod.iconName);
                                    return (
                                        <Link
                                            key={mod.type}
                                            href={`/${mod.type}`}
                                            onClick={(e) => {
                                                // On desktop or click, allow instant modal or direct route
                                                if (window.innerWidth < 768) {
                                                    e.preventDefault();
                                                    setActiveModule(mod.type);
                                                }
                                            }}
                                            className="group relative flex flex-col items-start p-4 bg-white dark:bg-[#161c24] border border-slate-200 dark:border-white/5 rounded-2xl hover:border-cyan-500 hover:shadow-[0_10px_40px_-10px_rgba(6,182,212,0.15)] transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 group-hover:bg-cyan-500/10 transition-colors mb-3">
                                                <IconNode size={20} strokeWidth={2} />
                                            </div>
                                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                                                {mod.title}
                                            </span>
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity">
                                                <ArrowUpRight size={14} />
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
                        className="fixed inset-0 z-[100] bg-white dark:bg-[#0a0e14] flex flex-col"
                    >
                        {/* Slide-over header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111620]">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-800 dark:text-white">
                                    {MODULE_REGISTRY[activeModule]?.title || activeModule}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/${activeModule}`}
                                    className="px-3 py-1 text-xs font-mono rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                                >
                                    {language === 'tr' ? 'Tam Sayfa ↗' : 'Full Page ↗'}
                                </Link>
                                <button 
                                    onClick={() => setActiveModule(null)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content viewport */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-[#06080c]">
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
