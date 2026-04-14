'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useOSStore } from '@/store/osStore';
import {
    Calculator, ArrowLeftRight, MessageSquare, Settings, Globe,
    Network, Hexagon, Bot, Dna, Blocks, DraftingCompass, Scissors, Palette, FoldHorizontal,
    FlaskConical, Activity, Factory, ShieldCheck, Landmark, Hammer, Database, SlidersHorizontal, Library,
    Eye, Focus, Zap, Code, Volume2, VolumeX, Terminal, AlertTriangle, Cpu,
    CircleSlash, Droplets, Ruler, Flame, Wrench, CircleDot
} from 'lucide-react';
import { useUtilityStore } from '@/store/utilityStore';
import { useI18nStore } from '@/store/i18nStore';
import { motion, AnimatePresence } from 'framer-motion';

const DOCK_GROUPS = [
    {
        id: 'design',
        label: 'Design & CAD',
        icon: <DraftingCompass size={22} strokeWidth={1.5} />,
        color: 'sky',
        items: [
            { id: 'parametric-cad', label: 'CAD 3D', icon: <Hexagon size={22} strokeWidth={1.5} />, color: 'indigo' },
            { id: 'cad-editor', label: 'Drafting', icon: <DraftingCompass size={22} strokeWidth={1.5} />, color: 'sky' },
            { id: 'sketch-pad', label: 'Sketch', icon: <Palette size={22} strokeWidth={1.5} />, color: 'pink' }
        ]
    },
    {
        id: 'manufacturing',
        label: 'Manufacturing',
        icon: <Factory size={22} strokeWidth={1.5} />,
        color: 'yellow',
        items: [
            { id: 'cutting-optimizer', label: 'Nesting', icon: <Scissors size={22} strokeWidth={1.5} />, color: 'emerald' },
            { id: 'sheet-metal', label: 'Sheet', icon: <FoldHorizontal size={22} strokeWidth={1.5} />, color: 'teal' },
            { id: 'manufacturing-sandbox', label: 'Mfg Sandbox', icon: <Factory size={22} strokeWidth={1.5} />, color: 'yellow' },
            { id: 'manufacturing-readiness', label: 'Readiness', icon: <ShieldCheck size={22} strokeWidth={1.5} />, color: 'emerald' },
            { id: 'engineering-selection', label: 'Selection', icon: <SlidersHorizontal size={22} strokeWidth={1.5} />, color: 'lime' },
            { id: 'fits-tolerances', label: 'Fits & Tol.', icon: <CircleSlash size={22} strokeWidth={1.5} />, color: 'cyan' },
            { id: 'welding', label: 'Welding Calc', icon: <Network size={22} strokeWidth={1.5} />, color: 'orange' }
        ]
    },
    {
        id: 'engineering',
        label: 'Engineering',
        icon: <Database size={22} strokeWidth={1.5} />,
        color: 'purple',
        items: [
            { id: 'beam-deflection', label: 'Beam Defl.', icon: <Blocks size={22} strokeWidth={1.5} />, color: 'indigo' },
            { id: 'thermal-expansion', label: 'Thermal', icon: <FlaskConical size={22} strokeWidth={1.5} />, color: 'red' },
            { id: 'bearings', label: 'Bearings', icon: <CircleDot size={22} strokeWidth={1.5} />, color: 'cyan' },
            { id: 'gears-bearings', label: 'Gears & Brg', icon: <Settings size={22} strokeWidth={1.5} />, color: 'gray' },
            { id: 'gearbox-design', label: 'Gearbox Engine', icon: <Settings size={22} strokeWidth={1.5} />, color: 'orange' },
            { id: 'motor-selection-std', label: 'Motor Select', icon: <Zap size={22} strokeWidth={1.5} />, color: 'yellow' },
            { id: 'bolt-torque', label: 'Bolt Torque', icon: <Wrench size={22} strokeWidth={1.5} />, color: 'amber' },
            { id: 'fatigue-advanced', label: 'Adv. Fatigue', icon: <Activity size={22} strokeWidth={1.5} />, color: 'fuchsia' },
            { id: 'profile-weight', label: 'Profile Wgt', icon: <Database size={22} strokeWidth={1.5} />, color: 'teal' },
            { id: 'machine-assembly', label: 'Assembly', icon: <Blocks size={22} strokeWidth={1.5} />, color: 'amber' },
            { id: 'materials-db', label: 'Materials', icon: <Database size={22} strokeWidth={1.5} />, color: 'purple' },
            { id: 'handbook', label: 'Handbook', icon: <Library size={22} strokeWidth={1.5} />, color: 'blue' },
            { id: 'cost-estimator', label: 'Cost Est.', icon: <Landmark size={22} strokeWidth={1.5} />, color: 'green' }
        ]
    },
    {
        id: 'simulation',
        label: 'Simul. & AI',
        icon: <Activity size={22} strokeWidth={1.5} />,
        color: 'rose',
        items: [
            { id: 'topology-optimization', label: 'Topology', icon: <Dna size={22} strokeWidth={1.5} />, color: 'rose' },
            { id: 'simulation-fea', label: 'FEA', icon: <Activity size={22} strokeWidth={1.5} />, color: 'red' },
            { id: 'failure-diagnosis', label: 'Failure AI', icon: <ShieldCheck size={22} strokeWidth={1.5} />, color: 'rose' },
            { id: 'material-selector-ai', label: 'Material AI', icon: <Database size={22} strokeWidth={1.5} />, color: 'purple' },
            { id: 'fluid-dynamics', label: 'Fluid Dyn.', icon: <Droplets size={22} strokeWidth={1.5} />, color: 'blue' }
        ]
    }
];

export function UnifiedDock() {
    const {
        openWindow, windows, activeWindowId, setActiveSettingsTab,
        isChaosMode, toggleChaosMode,
        isFocusMode, toggleFocusMode,
        isAudioEnabled, toggleAudio,
        initiateSelfDestruct,
        setTheme, theme,
        closeAllWindows,
    } = useOSStore();

    const {
        isCalcOpen, isUnitOpen, isSettingsOpen, isFeedbackOpen,
        toggleCalc, toggleUnit, toggleSettings, toggleFeedback
    } = useUtilityStore();
    const { t } = useI18nStore();

    const dockRef = useRef<HTMLDivElement>(null);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [isDockVisible, setIsDockVisible] = useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const getModTitle = (id: string, fallback: string) => t.modules?.[id]?.title || fallback;

    // Auto-hide: mouse proximity to bottom edge
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const threshold = 60; // pixels from bottom edge
            const nearBottom = e.clientY > window.innerHeight - threshold;

            if (nearBottom) {
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                    hideTimeoutRef.current = null;
                }
                setIsDockVisible(true);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Keep visible while a group menu is open
    useEffect(() => {
        if (activeGroup) setIsDockVisible(true);
    }, [activeGroup]);

    const handleDockMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsDockVisible(true);
    };

    const handleDockMouseLeave = () => {
        if (activeGroup) return; // don't hide while a sub-menu is open
        hideTimeoutRef.current = setTimeout(() => {
            setIsDockVisible(false);
        }, 800);
    };

    // Horizontal scroll capability for mouse wheel
    useEffect(() => {
        const el = dockRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // Close sub-menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
                setActiveGroup(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isSystemGroupActive = activeGroup === 'system-actions';
    const isAnySystemToolActive = isCalcOpen || isUnitOpen || isSettingsOpen || isFocusMode || isChaosMode;

    // ═══════════════════════ MOBILE TAB BAR ═══════════════════════
    if (isMobile) {
        return (
            <nav
                role="navigation"
                aria-label="Mobile Navigation"
                className="fixed bottom-0 left-0 right-0 z-[99999] bg-[#0a0e14]/98 border-t border-white/10 backdrop-blur-xl safe-area-inset-bottom"
            >
                <div className="flex items-stretch justify-around h-16 px-1">
                    {DOCK_GROUPS.map((group) => {
                        const isGroupActive = activeGroup === group.id;
                        const hasActiveApp = group.items.some(m => windows.some(w => w.type === m.id && w.id === activeWindowId));
                        return (
                            <div key={group.id} className="relative flex-1 flex flex-col items-center">
                                <button
                                    onClick={() => setActiveGroup(isGroupActive ? null : group.id)}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 w-full transition-colors ${
                                        hasActiveApp || isGroupActive ? 'text-blue-400' : 'text-gray-500 active:text-gray-300'
                                    }`}
                                >
                                    {group.icon}
                                    <span className="text-[10px] font-medium leading-none">
                                        {group.label.length > 10 ? group.label.substring(0, 9) + '.' : group.label}
                                    </span>
                                    {hasActiveApp && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                                </button>

                                {/* Mobile sub-menu: slides up as a sheet */}
                                <AnimatePresence>
                                    {isGroupActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            className="fixed bottom-[68px] left-2 right-2 p-4 rounded-2xl bg-[#0d1117]/98 border border-white/10 backdrop-blur-2xl shadow-2xl z-[100000] max-h-[60vh] overflow-y-auto"
                                        >
                                            <div className="grid grid-cols-3 gap-3">
                                                {group.items.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            openWindow(item.id as any, true);
                                                            setActiveGroup(null);
                                                        }}
                                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95 ${
                                                            windows.some(w => w.type === item.id && w.id === activeWindowId)
                                                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                                                : 'bg-white/5 text-gray-400 border border-transparent'
                                                        }`}
                                                    >
                                                        {item.icon}
                                                        <span className="text-[10px] font-medium text-center leading-tight">
                                                            {getModTitle(item.id, item.label)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                    {/* System tools tab */}
                    <div className="relative flex-1 flex flex-col items-center">
                        <button
                            onClick={() => setActiveGroup(isSystemGroupActive ? null : 'system-actions')}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 w-full transition-colors ${
                                isAnySystemToolActive || isSystemGroupActive ? 'text-fuchsia-400' : 'text-gray-500 active:text-gray-300'
                            }`}
                        >
                            <Cpu size={22} strokeWidth={1.5} />
                            <span className="text-[10px] font-medium leading-none">System</span>
                            {isAnySystemToolActive && <div className="w-1 h-1 rounded-full bg-fuchsia-400" />}
                        </button>
                    </div>
                </div>
            </nav>
        );
    }

    // ═══════════════════════ DESKTOP DOCK (unchanged) ═══════════════════════
    return (
        <>
            {/* Invisible hover-trigger zone at screen bottom */}
            <div
                className="fixed bottom-0 left-0 right-0 h-[8px] z-[99998] pointer-events-auto"
                onMouseEnter={handleDockMouseEnter}
            />

            <div
                className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center justify-center pointer-events-none max-w-[96vw]"
                onMouseEnter={handleDockMouseEnter}
                onMouseLeave={handleDockMouseLeave}
            >
                <motion.div
                    initial={false}
                    animate={{
                        y: isDockVisible ? 0 : 120,
                        opacity: isDockVisible ? 1 : 0,
                        scale: isDockVisible ? 1 : 0.92,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 220,
                        damping: 28,
                        mass: 0.8
                    }}
                    className="flex items-center gap-2 sm:gap-4 pointer-events-auto"
                >
                    <nav
                        ref={dockRef}
                        role="navigation"
                        aria-label="Application Dock"
                        className="relative flex items-start gap-1 p-3 rounded-[2rem] border border-[#2a3a4a]/40 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_80px_rgba(0,229,255,0.03)] backdrop-blur-3xl overflow-visible"
                        style={{ backgroundColor: 'rgba(5, 9, 14, 0.92)', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                    >
                        <div className="flex items-start gap-2 pr-4 border-r border-white/10 shrink-0">
                            {DOCK_GROUPS.map((group) => {
                                const isGroupActive = activeGroup === group.id;
                                const hasActiveApp = group.items.some(m => windows.some(w => w.type === m.id && w.id === activeWindowId));

                                return (
                                    <div key={group.id} className="relative">
                                        <DockItem
                                            label={group.label}
                                            icon={group.icon}
                                            onClick={() => setActiveGroup(isGroupActive ? null : group.id)}
                                            color={group.color}
                                            isActive={hasActiveApp || isGroupActive}
                                            hasIndicator={hasActiveApp}
                                        />

                                        <AnimatePresence>
                                            {isGroupActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                    className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 p-2 rounded-[2rem] border border-[#2a3a4a]/50 bg-[#0a1018]/98 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col-reverse items-center justify-end gap-2 w-max"
                                                    style={{ transformOrigin: "bottom center" }}
                                                >
                                                    {group.items.map((item) => (
                                                        <DockItem
                                                            key={item.id}
                                                            label={getModTitle(item.id, item.label)}
                                                            icon={item.icon}
                                                            onClick={() => {
                                                                openWindow(item.id as any, true);
                                                                setActiveGroup(null);
                                                            }}
                                                            color={item.color}
                                                            isActive={windows.some(w => w.type === item.id && w.id === activeWindowId)}
                                                        />
                                                    ))}
                                                    <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#0a1018] border-b border-r border-[#2a3a4a]/50 rotate-45 pointer-events-none" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>

                        {/* System Tools Group */}
                        <div className="flex items-start gap-2 pl-2 shrink-0">
                            <div className="relative">
                                <DockItem
                                    label="System Tools"
                                    icon={<Cpu size={22} strokeWidth={1.5} />}
                                    onClick={() => setActiveGroup(isSystemGroupActive ? null : 'system-actions')}
                                    color="fuchsia"
                                    isActive={isAnySystemToolActive || isSystemGroupActive}
                                    hasIndicator={isAnySystemToolActive}
                                />

                                <AnimatePresence>
                                    {isSystemGroupActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className="absolute bottom-[calc(100%+16px)] right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 p-3 rounded-[2rem] border border-[#2a3a4a]/50 bg-[#0a1018]/98 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-max max-w-[95vw] sm:max-w-none"
                                            style={{ transformOrigin: "bottom center" }}
                                        >
                                            <div className="grid grid-cols-2 gap-2 justify-items-center">
                                                {/* UTILITIES */}
                                                <DockItem
                                                    label={getModTitle('calculator', 'Scientific Calc')}
                                                    icon={<Calculator size={20} strokeWidth={1.5} />}
                                                    onClick={() => { toggleCalc(); setActiveGroup(null); }}
                                                    isActive={isCalcOpen} color="sky"
                                                />
                                                <DockItem
                                                    label={getModTitle('unit-converter', 'Unit Converter')}
                                                    icon={<ArrowLeftRight size={20} strokeWidth={1.5} />}
                                                    onClick={() => { toggleUnit(); setActiveGroup(null); }}
                                                    isActive={isUnitOpen} color="emerald"
                                                />
                                                <DockItem
                                                    label={t.language}
                                                    icon={<Globe size={20} strokeWidth={1.5} />}
                                                    onClick={() => { setActiveSettingsTab('language'); toggleSettings(); setActiveGroup(null); }}
                                                    isActive={isSettingsOpen && useOSStore.getState().activeSettingsTab === 'language'} color="default"
                                                />
                                                <DockItem
                                                    label={t.settings}
                                                    icon={<Settings size={20} strokeWidth={1.5} />}
                                                    onClick={() => { toggleSettings(); setActiveGroup(null); }}
                                                    isActive={isSettingsOpen} color="default"
                                                />

                                                {/* SYSTEM ACTIONS */}
                                                <DockItem
                                                    label="AI Copilot"
                                                    icon={<Bot size={20} strokeWidth={1.5} />}
                                                    onClick={() => { openWindow('ai-copilot', true); setActiveGroup(null); }}
                                                    isActive={windows.some(w => w.type === 'ai-copilot')} color="indigo"
                                                />
                                                <DockItem
                                                    label="Focus Mode"
                                                    icon={<Focus size={20} strokeWidth={1.5} />}
                                                    onClick={() => { toggleFocusMode(); setActiveGroup(null); }}
                                                    isActive={isFocusMode} color="purple"
                                                />
                                                <DockItem
                                                    label="Chaos Mode"
                                                    icon={<Zap size={20} strokeWidth={1.5} />}
                                                    onClick={() => { toggleChaosMode(); setActiveGroup(null); }}
                                                    isActive={isChaosMode} color="yellow"
                                                />
                                                <DockItem
                                                    label="Holographic"
                                                    icon={<Eye size={20} strokeWidth={1.5} />}
                                                    onClick={() => { openWindow('holographic-viewer', true); setActiveGroup(null); }}
                                                    isActive={windows.some(w => w.type === 'holographic-viewer')} color="emerald"
                                                />
                                                <DockItem
                                                    label="Matrix Screen"
                                                    icon={<Code size={20} strokeWidth={1.5} />}
                                                    onClick={() => { openWindow('matrix-screensaver', true); setActiveGroup(null); }}
                                                    isActive={windows.some(w => w.type === 'matrix-screensaver')} color="green"
                                                />
                                                <DockItem
                                                    label="Audio Feedback"
                                                    icon={isAudioEnabled ? <Volume2 size={20} strokeWidth={1.5} /> : <VolumeX size={20} strokeWidth={1.5} />}
                                                    onClick={() => { toggleAudio(); setActiveGroup(null); }}
                                                    isActive={isAudioEnabled} color="blue"
                                                />
                                                <DockItem
                                                    label="Toggle Theme"
                                                    icon={<Settings size={20} strokeWidth={1.5} />}
                                                    onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setActiveGroup(null); }}
                                                    isActive={false} color="default"
                                                />
                                                <DockItem
                                                    label="Close All"
                                                    icon={<Terminal size={20} strokeWidth={1.5} />}
                                                    onClick={() => { closeAllWindows(); setActiveGroup(null); }}
                                                    isActive={false} color="red"
                                                />
                                                <DockItem
                                                    label="Self Destruct"
                                                    icon={<AlertTriangle size={20} strokeWidth={1.5} />}
                                                    onClick={() => { initiateSelfDestruct(); setActiveGroup(null); }}
                                                    isActive={false} color="rose"
                                                />
                                            </div>
                                            <div className="absolute -bottom-[7px] right-12 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-3.5 h-3.5 bg-[#0a1018] border-b border-r border-[#2a3a4a]/50 rotate-45 pointer-events-none" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </nav>

                    <motion.button
                        onClick={toggleFeedback}
                        className={`group flex shrink-0 items-center justify-center w-14 h-14 rounded-[1.5rem] border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 active:scale-95 ${isFeedbackOpen
                            ? 'bg-blue-500/20 border-blue-500/50 scale-110 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                            : 'bg-[#05090e]/85 border-[#2a3a4a]/60 hover:bg-white/10 hover:scale-110 hover:border-blue-500/50'
                            }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title={t.feedbackTitle}
                    >
                        <div className="absolute inset-0 rounded-[inherit] mix-blend-overlay opacity-20 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                        <motion.div
                            animate={{
                                y: isFeedbackOpen ? 0 : [0, -2, 0],
                                opacity: isFeedbackOpen ? 1 : [0.8, 1, 0.8]
                            }}
                            transition={{
                                duration: 3,
                                repeat: isFeedbackOpen ? 0 : Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <MessageSquare size={24} strokeWidth={1.5} className={isFeedbackOpen ? 'text-blue-300' : 'text-blue-400 group-hover:text-blue-300'} />
                        </motion.div>
                    </motion.button>
                </motion.div>
            </div>
        </>
    );
}

interface DockItemProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
    hasIndicator?: boolean; // To forcibly show the active dot even if the group bubble isn't active
    color?: string;
}

function DockItem({ label, icon, onClick, isActive, hasIndicator, color }: DockItemProps) {
    const colorColors: Record<string, string> = {
        cyan: 'rgba(34,211,238,1)',
        green: 'rgba(74,222,128,1)',
        amber: 'rgba(251,191,36,1)',
        purple: 'rgba(192,132,252,1)',
        pink: 'rgba(236,72,153,1)',
        indigo: 'rgba(129,140,248,1)',
        rose: 'rgba(251,113,133,1)',
        teal: 'rgba(45,212,191,1)',
        orange: 'rgba(251,146,60,1)',
        blue: 'rgba(96,165,250,1)',
        yellow: 'rgba(250,204,21,1)',
        lime: 'rgba(163,230,53,1)',
        fuchsia: 'rgba(232,121,249,1)',
        sky: 'rgba(56,189,248,1)',
        emerald: 'rgba(52,211,153,1)',
        red: 'rgba(248,113,113,1)',
        gray: 'rgba(156,163,175,1)',
        default: 'rgba(255,255,255,1)'
    };

    const colorClasses: Record<string, string> = {
        cyan: 'text-cyan-400 group-hover:bg-cyan-400/10 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:border-cyan-400/30',
        green: 'text-green-400 group-hover:bg-green-400/10 group-hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] group-hover:border-green-400/30',
        amber: 'text-amber-400 group-hover:bg-amber-400/10 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] group-hover:border-amber-400/30',
        purple: 'text-purple-400 group-hover:bg-purple-400/10 group-hover:shadow-[0_0_20px_rgba(192,132,252,0.3)] group-hover:border-purple-400/30',
        pink: 'text-pink-400 group-hover:bg-pink-400/10 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] group-hover:border-pink-400/30',
        indigo: 'text-indigo-400 group-hover:bg-indigo-400/10 group-hover:shadow-[0_0_20px_rgba(129,140,248,0.3)] group-hover:border-indigo-400/30',
        rose: 'text-rose-400 group-hover:bg-rose-400/10 group-hover:shadow-[0_0_20px_rgba(251,113,133,0.3)] group-hover:border-rose-400/30',
        teal: 'text-teal-400 group-hover:bg-teal-400/10 group-hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] group-hover:border-teal-400/30',
        orange: 'text-orange-400 group-hover:bg-orange-400/10 group-hover:shadow-[0_0_20px_rgba(251,146,60,0.3)] group-hover:border-orange-400/30',
        blue: 'text-blue-400 group-hover:bg-blue-400/10 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.3)] group-hover:border-blue-400/30',
        yellow: 'text-yellow-400 group-hover:bg-yellow-400/10 group-hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] group-hover:border-yellow-400/30',
        lime: 'text-lime-400 group-hover:bg-lime-400/10 group-hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] group-hover:border-lime-400/30',
        fuchsia: 'text-fuchsia-400 group-hover:bg-fuchsia-400/10 group-hover:shadow-[0_0_20px_rgba(232,121,249,0.3)] group-hover:border-fuchsia-400/30',
        sky: 'text-sky-400 group-hover:bg-sky-400/10 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:border-sky-400/30',
        emerald: 'text-emerald-400 group-hover:bg-emerald-400/10 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] group-hover:border-emerald-400/30',
        red: 'text-red-400 group-hover:bg-red-400/10 group-hover:shadow-[0_0_20px_rgba(248,113,113,0.3)] group-hover:border-red-400/30',
        gray: 'text-gray-400 group-hover:bg-gray-400/10 group-hover:shadow-[0_0_20px_rgba(156,163,175,0.3)] group-hover:border-gray-400/30',
        default: 'text-gray-400 group-hover:bg-white/5 group-hover:text-white group-hover:border-white/20'
    };

    const activeColor = color ? (colorColors[color] || colorColors.default) : colorColors.default;
    const selectedColorClass = color ? (colorClasses[color] || colorClasses.default) : colorClasses.default;

    const showIndicator = isActive || hasIndicator;

    return (
        <div className="relative group p-1 flex flex-col items-center gap-1.5" key={label}>
            <button
                onClick={onClick}
                aria-label={label}
                className={`
                    relative w-12 h-12 flex items-center justify-center transition-all duration-[400ms] ease-out shrink-0 overflow-hidden
                    ${isActive ? 'bg-white/5 text-white scale-[1.15] rounded-[1rem] border border-white/20' : 'rounded-[1.25rem] hover:scale-[1.25] hover:-translate-y-1 hover:z-50 hover:shadow-2xl bg-transparent border border-transparent'}
                    ${!isActive ? selectedColorClass : ''}
                `}
                style={isActive ? {
                    boxShadow: `0 10px 30px ${activeColor.replace('1)', '0.4)')}, inset 0 0 20px ${activeColor.replace('1)', '0.2)')}`,
                    color: activeColor,
                    borderColor: activeColor.replace('1)', '0.5)')
                } : {}}
                title={label}
            >
                <div className="absolute inset-0 rounded-[inherit] mix-blend-overlay opacity-30 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                <motion.div
                    animate={isActive ? {} : {
                        y: [0, -1.5, 0],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 3 + Math.random(),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 2
                    }}
                    className="relative z-10"
                >
                    {icon}
                </motion.div>
            </button>

            <div className="text-[10px] text-center px-1 opacity-70 pointer-events-none z-[1000] font-sans tracking-[0.05em] leading-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-1" style={{ color: isActive ? activeColor : 'rgba(255,255,255,0.6)', minWidth: '48px', textShadow: isActive ? `0 0 10px ${activeColor.replace('1)', '0.5)')}` : 'none' }}>
                {label.length > 10 ? label.substring(0, 9) + '.' : label}
            </div>

            {showIndicator && (
                <div
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full transition-all duration-300"
                    style={{
                        backgroundColor: activeColor,
                        boxShadow: `0 0 12px ${activeColor}, 0 0 4px ${activeColor}`
                    }}
                />
            )}

            <style jsx>{`
                @media (max-width: 640px) {
                    button {
                        width: 40px !important;
                        height: 40px !important;
                    }
                    :global(.lucide) {
                        width: 18px !important;
                        height: 18px !important;
                    }
                }
            `}</style>
        </div>
    );
}
