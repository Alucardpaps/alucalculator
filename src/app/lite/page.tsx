'use client';

import { useState } from 'react';
import { MODULE_REGISTRY, ModuleType, getModuleIcon } from '@/config/modules';
import { WindowContent } from '@/components/os/WindowContent';
import { X, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Order of categories for display
const CATEGORY_ORDER = ['mechanical', 'manufacturing', 'civil', 'electrical', 'finance', 'science', 'software', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
    'mechanical': 'Mechanical Engineering',
    'manufacturing': 'Manufacturing & Production',
    'civil': 'Civil Engineering',
    'electrical': 'Electrical',
    'finance': 'Finance & Costing',
    'science': 'Science & Math',
    'software': 'Software Utilities',
    'other': 'Other Tools'
};

export default function LiteDashboard() {
    const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const modules = Object.values(MODULE_REGISTRY).filter(mod => 
        // Filter out highly OS-specific tools or those that require the window manager to function natively
        !['settings', 'terminal', 'browser', 'media-player', 'image-viewer', 'pdf-viewer', 'spreadsheet-viewer', 'file-explorer'].includes(mod.type)
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
        <div className="flex flex-col gap-8 pb-20">
            {/* Header / Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Calculators</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a tool below to begin your calculations.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <input 
                        type="text" 
                        placeholder="Search calculators..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a212d] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Grid display by category */}
            <div className="flex flex-col gap-10">
                {grouped.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <LayoutGrid className="mx-auto h-12 w-12 opacity-20 mb-4" />
                        <p>No calculators found matching your search.</p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.category} className="flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                {CATEGORY_LABELS[group.category] || group.category}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                                {group.items.map(mod => {
                                    const IconNode = getModuleIcon(mod.iconName);
                                    return (
                                        <button
                                            key={mod.type}
                                            onClick={() => setActiveModule(mod.type)}
                                            className="group flex flex-col items-start p-4 bg-white dark:bg-[#161c24] border border-slate-200 dark:border-white/5 rounded-2xl hover:border-cyan-500 hover:shadow-[0_10px_40px_-10px_rgba(6,182,212,0.15)] transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 group-hover:bg-cyan-500/10 transition-colors mb-3">
                                                <IconNode size={20} strokeWidth={2} />
                                            </div>
                                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                                                {mod.title}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Full Screen Slide-Over for Active Module */}
            <AnimatePresence>
                {activeModule && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50, transition: { duration: 0.2 } }}
                        className="fixed inset-0 z-[100] bg-white dark:bg-[#0a0e14] flex flex-col"
                    >
                        <header className="flex-none h-14 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 bg-slate-50 dark:bg-[#12161e]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                                    {(() => {
                                        const mod = MODULE_REGISTRY[activeModule];
                                        const DynamicIcon = getModuleIcon(mod.iconName);
                                        return <DynamicIcon size={16} />;
                                    })()}
                                </div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {MODULE_REGISTRY[activeModule].title}
                                </span>
                            </div>
                            <button 
                                onClick={() => setActiveModule(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </header>
                        
                        <div className="flex-1 w-full relative overflow-y-auto bg-white dark:bg-transparent">
                            {/* We wrap WindowContent in a div that mimics a large window to satisfy any specific CSS expectations inside modules */}
                            <div className="min-h-full w-full relative">
                                <WindowContent type={activeModule} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
