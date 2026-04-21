import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Pin, Clock, Settings, Power,
    ChevronRight, ArrowUpRight, Grid3X3, Layers, Globe, Terminal, Briefcase, Zap, Calculator, Database, Folder, Hexagon
} from 'lucide-react';
import { MODULE_REGISTRY, ModuleType, ModuleCategory, getModuleIcon } from '@/config/modules';
import { useOSStore } from '@/store/osStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUtilityStore } from '@/store/utilityStore';
import { useI18nStore } from '@/store/i18nStore';

interface StartMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const AppGridItem = ({ id, title, hint, icon: Icon, accentColor, onSelect }: {
    id: string;
    title: string;
    hint?: string;
    icon: any;
    accentColor: string;
    onSelect: () => void;
}) => (
    <button
        key={id}
        onClick={onSelect}
        role="menuitem"
        aria-label={title}
        className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl hover:bg-white/10 transition-all group text-center relative overflow-hidden"
    >
        <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 relative shrink-0"
            style={{
                background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}40 50%, ${accentColor}10)`,
                border: `1px solid ${accentColor}40`,
                boxShadow: `0 4px 12px ${accentColor}20, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
        >
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 40%)' }}
            />
            <Icon size={28} className="text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
        </div>
        <div className="flex flex-col flex-1 min-w-0 items-center justify-start mt-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-[#e2e8f0] group-hover:text-white leading-tight line-clamp-2 transition-colors w-full">
                {title}
            </span>
            {hint && (
                <span className="text-[9px] tracking-wide text-slate-400 group-hover:text-cyan-200/80 leading-tight line-clamp-2 mt-1 transition-colors w-full px-1">
                    {hint}
                </span>
            )}
        </div>
    </button>
);

export function StartMenu({ isOpen, onClose }: StartMenuProps) {
    const { openWindow } = useOSStore();
    const { t } = useI18nStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setActiveCategory('all');
        }
    }, [isOpen]);

    const pinnedApps = useMemo(() => [
        { id: 'settings', title: t.modules.settings?.title || 'Settings', icon: getModuleIcon('Settings'), accentColor: '#64748b' },
        { id: 'calculator', title: t.modules.calculator?.title || 'Calc', icon: getModuleIcon('Calculator'), accentColor: '#06b6d4' },
    ], [t]);

    const filteredModules = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return Object.values(MODULE_REGISTRY).filter(m => {
            const title = (t.modules?.[m.type as keyof typeof t.modules]?.title || m.title).toLowerCase();
            const hint = (t.moduleHints?.[m.type as keyof typeof t.moduleHints] || '').toLowerCase();
            return (title.includes(query) || hint.includes(query)) && m.type !== 'settings';
        });
    }, [searchQuery, t]);

    const moduleColors: Record<string, string> = {
        'calculator': '#06b6d4', 'profile-weight': '#3b82f6', 'gears-bearings': '#8b5cf6',
        'welding': '#f59e0b', 'fasteners': '#ef4444', 'materials-db': '#ec4899',
        'cutting-optimizer': '#14b8a6', 'handbook': '#10b981', 'sheet-metal': '#6366f1',
        'bearings': '#f97316', 'fits-tolerances': '#0ea5e9', 'strength-analysis': '#dc2626',
        'pumps': '#0891b2', 'manufacturing': '#7c3aed', 'reducer-lubrication': '#a855f7',
        'nesting-2d': '#2563eb', 'beam-deflection': '#d97706', 'concrete-reinforcement': '#64748b',
        'ohms-law': '#eab308', 'voltage-drop': '#f97316', 'periodic-table': '#06b6d4',
        'unit-converter': '#8b5cf6', 'cad-editor': '#3b82f6', 'simulation-fea': '#f59e0b',
        'sketch-pad': '#ec4899', 'physics-kinematics': '#8b5cf6', 'chemistry-reactions': '#10b981',
        'biology-genetics': '#ec4899', 'cs-algorithms': '#14b8a6', 'aerospace-dynamics': '#f97316', 
        'naval-hydrostatics': '#06b6d4', 'three-phase-power': '#f59e0b',
        'digital-logic': '#10b981', 'filter-design': '#3b82f6',
        'failure-diagnosis': '#ef4444', 'fatigue-advanced': '#dc2626',
        'planetary-gearbox': '#8b5cf6', 'material-selector-ai': '#ec4899',
        'materials-explorer': '#14b8a6', 'physics-solver': '#0ea5e9',
        'gearbox-design': '#7c3aed', 'motor-selection-std': '#f97316'
    };

    const categories = useMemo(() => {
        const cats = Array.from(new Set(Object.values(MODULE_REGISTRY).map(m => m.category)))
            .filter(c => c !== 'utilities'); // Completely drop utilities category
        return cats.map(c => ({
            id: c,
            name: t.categories?.[c as keyof typeof t.categories] || c
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [t]);

    const handleLaunch = (type: ModuleType | string) => {
        if (type === 'calculator') {
            useUtilityStore.getState().setCalcOpen(true);
        } else if (type === 'unit-converter') {
            useUtilityStore.getState().setUnitOpen(true);
        } else {
            openWindow(type as ModuleType, true);
        }
        onClose();
    };

    const displayedModules = useMemo(() => {
        if (searchQuery) return filteredModules;
        if (activeCategory === 'all') return filteredModules;
        return filteredModules.filter(m => m.category === activeCategory);
    }, [searchQuery, activeCategory, filteredModules]);


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-[60px] sm:bottom-[80px] left-1/2 -translate-x-1/2 z-50 w-[98vw] sm:w-[500px] md:w-[760px] lg:w-[940px] xl:w-[1100px] h-[85vh] max-h-[750px] bg-[#0c1017]/95 backdrop-blur-3xl border border-cyan-500/30 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] flex overflow-hidden ring-1 ring-black/50"
                        role="menu"
                        aria-label="Start Menu"
                    >
                        <div className="w-[180px] sm:w-[220px] shrink-0 bg-black/40 border-r border-white/5 flex flex-col pt-4">
                            <div className="px-4 mb-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="relative w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-500/30">
                                        <Hexagon size={16} className="text-cyan-400" />
                                    </div>
                                    <h2 className="text-sm font-black text-white italic tracking-widest">{t.osName}</h2>
                                </div>
                                <p className="text-[9px] text-cyan-500/70 font-mono tracking-widest uppercase pl-8">{t.version}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-none px-3 space-y-1">
                                <button
                                    onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center gap-2 ${activeCategory === 'all' && !searchQuery ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                >
                                    <Grid3X3 size={15} className={activeCategory === 'all' && !searchQuery ? 'text-cyan-400' : 'text-slate-500'} />
                                    {t.allApps || 'All Apps'}
                                </button>

                                <div className="h-px w-full bg-white/5 my-2" />
                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-3 mt-4">Disciplines</div>

                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all flex items-center justify-between group ${activeCategory === cat.id && !searchQuery ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        {activeCategory === cat.id && !searchQuery && <ChevronRight size={12} className="text-cyan-400 opacity-60" />}
                                    </button>
                                ))}
                            </div>

                            <div className="p-3 border-t border-white/5 bg-black/20 space-y-1">
                                <button
                                    onClick={() => handleLaunch('settings')}
                                    className="w-full text-left px-3 py-2 rounded-md text-[11px] font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <Settings size={14} /> {t.modules.settings?.title || 'Settings'}
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full text-left px-3 py-2 rounded-md text-[11px] font-semibold tracking-wide text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 group"
                                >
                                    <Power size={14} className="group-hover:animate-pulse" /> Shut Down
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col bg-gradient-to-br from-transparent to-black/40">
                            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01] sticky top-0 z-10 backdrop-blur-md flex items-center gap-4">
                                <div className="flex-1 flex items-center bg-black/40 border border-cyan-500/20 rounded-xl overflow-hidden focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all h-11">
                                    <div className="pl-4 pr-2 text-cyan-600">
                                        <Search size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={t.searchApps}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-full bg-transparent border-none text-white text-sm font-sans tracking-wide px-2 outline-none placeholder:text-slate-600"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="px-4 text-slate-500 hover:text-white transition-colors h-full"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => useWorkspaceStore.getState().toggleDebugMode()}
                                    className={`w-11 h-11 shrink-0 rounded-xl transition-all border flex items-center justify-center ${useWorkspaceStore.getState().debugMode
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                        : 'bg-black/40 hover:bg-white/10 text-slate-500 border-white/5'
                                        }`}
                                    title={t.toggleDevMode}
                                >
                                    <Terminal size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {displayedModules.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center pt-20 pb-10 text-center opacity-60">
                                        <Search size={48} className="text-slate-600 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-400 mb-1">No modules found</h3>
                                        <p className="text-sm text-slate-500">Try adjusting your search query.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-2 gap-y-6">
                                        {displayedModules.map((mod: any) => {
                                            const Icon = getModuleIcon(mod.iconName);
                                            const title = t.modules?.[mod.type as keyof typeof t.modules]?.title || mod.title;
                                            const hint = t.moduleHints?.[mod.type as keyof typeof t.moduleHints];
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
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}
