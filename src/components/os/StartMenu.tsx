'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Pin, Clock, Settings, Power,
    ChevronRight, ArrowUpRight, Grid3X3, Layers, Globe, Terminal
} from 'lucide-react';
import { MODULE_REGISTRY, ModuleType, ModuleCategory, getModuleIcon } from '@/config/modules';
import { useOSStore } from '@/store/osStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUtilityStore } from '@/store/utilityStore';
import { useI18nStore } from '@/store/i18nStore';

// Module hints are now pulled from i18nStore t.moduleHints

interface StartMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper component for app grid items (defined outside to avoid re-renders)
const AppGridItem = ({ id, title, hint, icon: Icon, accentColor, onSelect }: {
    id: string;
    title: string;
    hint?: string;
    icon: any; // Using any to bypass complex Lucide type inference in this mixed context
    accentColor: string;
    onSelect: () => void;
}) => (
    <button
        key={id}
        onClick={onSelect}
        className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-white/10 transition-all group text-center"
    >
        <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all overflow-hidden relative"
            style={{
                background: `linear-gradient(145deg, ${accentColor}cc, ${accentColor}40 50%, ${accentColor}20)`,
                border: `1px solid ${accentColor}40`,
                boxShadow: `0 2px 8px ${accentColor}20, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
        >
            {/* Glass reflection */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 50%)' }}
            />
            <Icon size={24} className="text-white relative z-10" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
        </div>
        <span className="text-[9px] uppercase tracking-widest font-bold text-cyan-50/70 group-hover:text-[#00e5ff] leading-tight line-clamp-2 mt-1 transition-colors">
            {title}
        </span>
        {hint && (
            <span className="text-[8px] tracking-wide text-cyan-900/60 leading-tight line-clamp-1">
                {hint}
            </span>
        )}
    </button>
);


export function StartMenu({ isOpen, onClose }: StartMenuProps) {
    const { openWindow } = useOSStore();
    const { t, language, setLanguage } = useI18nStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Define pinned apps (example)
    const pinnedApps = useMemo(() => [
        { id: 'calculator', title: t.modules.calculator?.title || 'Calc', icon: getModuleIcon('Calculator'), accentColor: '#06b6d4' },
        { id: 'unit-converter', title: t.modules['unit-converter']?.title || 'Units', icon: getModuleIcon('RefreshCw'), accentColor: '#8b5cf6' },
        { id: 'ai-copilot', title: t.modules['ai-copilot']?.title || 'AI', icon: getModuleIcon('Bot'), accentColor: '#6366f1' },
        { id: 'file-explorer', title: t.modules['file-explorer']?.title || 'Files', icon: getModuleIcon('Folder'), accentColor: '#f59e0b' },
        { id: 'settings', title: t.modules.settings?.title || 'Settings', icon: getModuleIcon('Settings'), accentColor: '#64748b' },
    ], [t]);

    // Filter modules
    const filteredModules = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return Object.values(MODULE_REGISTRY).filter(m => {
            const title = (t.modules?.[m.type]?.title || m.title).toLowerCase();
            const hint = (t.moduleHints?.[m.type] || '').toLowerCase();
            return title.includes(query) || hint.includes(query);
        });
    }, [searchQuery, t]);

    // Group by category if no search
    const grouped = useMemo(() => {
        if (searchQuery) return { [t.searchResults]: filteredModules };


        const groups: Record<string, typeof filteredModules> = {};
        filteredModules.forEach(m => {
            const cat = m.category || t.categoryOther;
            if (!groups[cat]) groups[cat] = [];

            groups[cat].push(m);
        });
        return groups;
    }, [filteredModules, searchQuery]);

    const handleLaunch = (type: ModuleType) => {
        if (type === 'calculator') {
            useUtilityStore.getState().setCalcOpen(true);
        } else if (type === 'unit-converter') {
            useUtilityStore.getState().setUnitOpen(true);
        } else {
            openWindow(type, true); // Open maximized
        }
        onClose();
    };

    const moduleColors: Record<string, string> = {
        'calculator': '#06b6d4', 'profile-weight': '#3b82f6', 'gears-bearings': '#8b5cf6',
        'welding': '#f59e0b', 'fasteners': '#ef4444', 'materials-db': '#ec4899',
        'cutting-optimizer': '#14b8a6', 'handbook': '#10b981', 'sheet-metal': '#6366f1',
        'bearings': '#f97316', 'fits-tolerances': '#0ea5e9', 'strength-analysis': '#dc2626',
        'pumps': '#0891b2', 'manufacturing': '#7c3aed', 'reducer-lubrication': '#a855f7',
        'nesting-2d': '#2563eb', 'beam-deflection': '#d97706', 'concrete-reinforcement': '#64748b',
        'ohms-law': '#eab308', 'voltage-drop': '#f97316', 'periodic-table': '#06b6d4',
        'unit-converter': '#8b5cf6', 'vat-calculator': '#10b981', 'excel-helper': '#22c55e',
        'json-formatter': '#f59e0b', 'regex-tester': '#ef4444', 'ai-copilot': '#6366f1',
        'box-profile-detector': '#14b8a6', 'cost-estimator': '#10b981',
        'file-explorer': '#f59e0b', 'browser': '#3b82f6', 'paint': '#ec4899',
        'media-player': '#8b5cf6', 'image-viewer': '#06b6d4', 'pdf-viewer': '#ef4444',
        'spreadsheet-viewer': '#22c55e', 'flow-editor': '#06b6d4', 'cad-editor': '#3b82f6',
        'analytics-dashboard': '#8b5cf6', 'simulation-fea': '#f59e0b',
        'sketch-pad': '#ec4899', 'project-variables': '#6366f1',
        'terminal': '#22c55e', 'feedback': '#3b82f6', 'news': '#f59e0b',
    };

    const categories = [
        { id: 'mechanical', name: t.categories.mechanical, color: '#f59e0b' },
        { id: 'structural', name: t.categories.structural, color: '#3b82f6' },
        { id: 'utilities', name: t.categories.utilities, color: '#10b981' },
        { id: 'reference', name: t.categories.reference, color: '#8b5cf6' },
    ];

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
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[640px] h-[500px] bg-[#05090e]/85 backdrop-blur-3xl border border-cyan-900/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                    >
                        {/* Search Bar */}
                        <div className="p-4 border-b border-cyan-900/30 bg-black/20">
                            <div className="flex bg-[#020408]/60 border border-cyan-900/30 rounded-lg overflow-hidden focus-within:border-[#00e5ff]/50 transition-colors shadow-inner">
                                <div className="pl-3 py-2.5 text-cyan-900 flex items-center">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t.searchApps}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-none text-cyan-50 text-[11px] font-mono tracking-widest px-3 py-2.5 outline-none placeholder:text-cyan-900/50"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="pr-3 py-2.5 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* App Grid */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                            {!searchQuery && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">{t.pinned}</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {pinnedApps.map(app => (
                                            <AppGridItem
                                                key={app.id}
                                                id={app.id}
                                                title={app.title}
                                                icon={app.icon}
                                                accentColor={app.accentColor}
                                                onSelect={() => handleLaunch(app.id as ModuleType)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {Object.entries(grouped).map(([category, modules]) => (
                                <div key={category}>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                                        {t.categories?.[category as ModuleCategory] || category}
                                    </h3>

                                    <div className="grid grid-cols-4 gap-2">
                                        {modules.map(mod => {
                                            const Icon = getModuleIcon(mod.iconName);
                                            const title = t.modules?.[mod.type]?.title || mod.title;
                                            const hint = t.moduleHints?.[mod.type];
                                            const accentColor = moduleColors[mod.type] || '#3b82f6';


                                            return (
                                                <AppGridItem
                                                    key={mod.type}
                                                    id={mod.type}
                                                    title={title}
                                                    hint={hint}
                                                    icon={Icon}
                                                    accentColor={accentColor}
                                                    onSelect={() => handleLaunch(mod.type as ModuleType)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom User Bar */}
                        <div className="p-4 border-t border-cyan-900/30 bg-black/40 flex items-center justify-between">
                            {/* User / Settings Profile */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
                                    <span className="text-white font-bold text-xs">ALU</span>
                                </div>
                                <div className="font-sans">
                                    <p className="text-[11px] font-bold text-white tracking-wide">{t.userPro}</p>
                                    <p className="text-[9px] text-slate-500 tracking-wider uppercase">{t.osName} {t.version}</p>
                                </div>

                            </div>

                            {/* OS Controls */}
                            <div className="flex items-center gap-1">

                                {/* Dev Mode Toggle */}
                                <button
                                    onClick={() => useWorkspaceStore.getState().toggleDebugMode()}
                                    className={`p-2 rounded-lg transition-colors border ${useWorkspaceStore.getState().debugMode
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        : 'hover:bg-white/10 text-slate-400 border-transparent'
                                        }`}
                                    title={t.toggleDevMode}
                                >

                                    <Terminal size={16} />
                                </button>
                                <button
                                    onClick={() => { useOSStore.getState().openWindow('settings'); onClose(); }}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
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
