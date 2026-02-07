'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Power, User, Grid3X3, ArrowRight, Settings } from 'lucide-react';
import { MODULE_REGISTRY, ModuleType, getModuleIcon } from '@/config/modules';
import { useOSStore } from '@/store/osStore';

interface StartMenuProps {
    isOpen: boolean;
    onClose: () => void;
    dict: any;
}

export function StartMenu({ isOpen, onClose, dict }: StartMenuProps) {
    const { openWindow } = useOSStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Filter modules
    const filteredModules = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return Object.values(MODULE_REGISTRY).filter(m => {
            const title = (dict?.modules?.[m.type]?.title || dict?.[m.type]?.title || m.title).toLowerCase();
            return title.includes(query);
        });
    }, [searchQuery, dict]);

    // Group by category if no search
    const grouped = useMemo(() => {
        if (searchQuery) return { 'Search Results': filteredModules };

        const groups: Record<string, typeof filteredModules> = {};
        filteredModules.forEach(m => {
            const cat = m.category || 'Other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(m);
        });
        return groups;
    }, [filteredModules, searchQuery]);

    const handleLaunch = (type: ModuleType) => {
        openWindow(type);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/5"
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", duration: 0.2 }}
                        className="fixed bottom-14 left-4 z-50 w-[640px] h-[500px] bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Search Bar */}
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    autoFocus
                                    placeholder="Search engineering tools..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* App Grid */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                            {Object.entries(grouped).map(([category, modules]) => (
                                <div key={category}>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                                        {dict?.nav?.[category] || category}
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {modules.map(module => {
                                            const Icon = getModuleIcon(module.iconName);
                                            // Title lookup
                                            const key = module.type === 'profile-weight' ? 'aluminum' : module.type;
                                            const title = dict?.modules?.[key]?.title || dict?.[key]?.title || module.title;

                                            return (
                                                <button
                                                    key={module.type}
                                                    onClick={() => handleLaunch(module.type as ModuleType)}
                                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group text-center"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-blue-500/10 group-hover:border-blue-500/30">
                                                        <Icon size={20} className="text-blue-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white leading-tight line-clamp-2">
                                                        {title}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom User Bar */}
                        <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
                                    <User size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">Engineer</span>
                                    <span className="text-[10px] text-slate-400">Pro License</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <Settings size={16} />
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
                                >
                                    <Power size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
