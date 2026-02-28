'use client';

import React, { useRef, useEffect } from 'react';
import { useOSStore } from '@/store/osStore';
import {
    Calculator, ArrowLeftRight, MessageSquare, Settings, Globe,
    Layout, Box, Move3d, PenTool, Activity, BookOpen, Layers, Atom, Sparkles, Database
} from 'lucide-react';
import { useUtilityStore } from '@/store/utilityStore';
import { useI18nStore } from '@/store/i18nStore';
import { motion } from 'framer-motion';

/**
 * 🛠️ UNIFIED DOCK (OS Controls)
 */
export function UnifiedDock() {
    const { openWindow, windows, activeWindowId, setActiveSettingsTab } = useOSStore();
    const {
        isCalcOpen, isUnitOpen, isSettingsOpen, isFeedbackOpen,
        toggleCalc, toggleUnit, toggleSettings, toggleFeedback
    } = useUtilityStore();
    const { t } = useI18nStore();

    const dockRef = useRef<HTMLDivElement>(null);

    // Defensive access helpers
    const getModTitle = (id: string, fallback: string) => t.modules?.[id]?.title || fallback;

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

    return (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2 sm:gap-4 pointer-events-auto max-w-[96vw]">
            <div
                ref={dockRef}
                className="flex items-center gap-1 p-2 rounded-2xl border border-[#2a3a4a] shadow-2xl backdrop-blur-xl overflow-x-auto [&::-webkit-scrollbar]:hidden"
                style={{ backgroundColor: 'rgba(15, 20, 25, 0.95)', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
                <div className="flex items-center gap-1 pr-2 border-r border-white/10 shrink-0">
                    <DockItem
                        label={getModTitle('flow-editor', 'Flow Editor')}
                        icon={<Layout size={20} />}
                        onClick={() => openWindow('flow-editor', true)}
                        color="cyan"
                        isActive={windows.some(w => w.type === 'flow-editor' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('parametric-cad', 'Parametric CAD')}
                        icon={<Box size={20} />}
                        onClick={() => openWindow('parametric-cad', true)}
                        color="purple"
                        isActive={windows.some(w => w.type === 'parametric-cad' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('cad-editor', 'CAD Editor')}
                        icon={<Move3d size={20} />}
                        onClick={() => openWindow('cad-editor', true)}
                        color="green"
                        isActive={windows.some(w => w.type === 'cad-editor' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('cutting-optimizer', 'Cutting Optimizer')}
                        icon={<Box size={20} />}
                        onClick={() => openWindow('cutting-optimizer', true)}
                        color="amber"
                        isActive={windows.some(w => w.type === 'cutting-optimizer' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('sketch-pad', 'Sketch Pad')}
                        icon={<PenTool size={20} />}
                        onClick={() => openWindow('sketch-pad', true)}
                        color="pink"
                        isActive={windows.some(w => w.type === 'sketch-pad' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('sheet-metal', 'Sheet Metal')}
                        icon={<Layers size={20} />}
                        onClick={() => openWindow('sheet-metal', true)}
                        color="cyan"
                        isActive={windows.some(w => w.type === 'sheet-metal' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('periodic-table', 'Periodic Table')}
                        icon={<Atom size={20} />}
                        onClick={() => openWindow('periodic-table', true)}
                        color="amber"
                        isActive={windows.some(w => w.type === 'periodic-table' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('simulation-fea', 'FEA Simulation')}
                        icon={<Activity size={20} />}
                        onClick={() => openWindow('simulation-fea', true)}
                        color="purple"
                        isActive={windows.some(w => w.type === 'simulation-fea' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('manufacturing-sandbox', 'Mfg. Sandbox')}
                        icon={<Sparkles size={20} />}
                        onClick={() => openWindow('manufacturing-sandbox', true)}
                        color="cyan"
                        isActive={windows.some(w => w.type === 'manufacturing-sandbox' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('materials-db', 'Materials DB')}
                        icon={<Database size={20} />}
                        onClick={() => openWindow('materials-db', true)}
                        color="purple"
                        isActive={windows.some(w => w.type === 'materials-db' && w.id === activeWindowId)}
                    />
                    <DockItem
                        label={getModTitle('handbook', t.handbookTitle)}
                        icon={<BookOpen size={20} />}
                        onClick={() => openWindow('handbook', true)}
                        color="green"
                        isActive={windows.some(w => w.type === 'handbook' && w.id === activeWindowId)}
                    />
                </div>

                <div className="flex items-center gap-1 pl-1 shrink-0">
                    <DockItem
                        label={getModTitle('calculator', 'Scientific Calc')}
                        icon={<Calculator size={18} />}
                        onClick={toggleCalc}
                        color="default"
                        isActive={isCalcOpen}
                    />
                    <DockItem
                        label={getModTitle('unit-converter', 'Unit Converter')}
                        icon={<ArrowLeftRight size={18} />}
                        onClick={toggleUnit}
                        color="default"
                        isActive={isUnitOpen}
                    />
                    <DockItem
                        label={t.language}
                        icon={<Globe size={18} />}
                        onClick={() => { setActiveSettingsTab('language'); toggleSettings(); }}
                        color="default"
                        isActive={isSettingsOpen && useOSStore.getState().activeSettingsTab === 'language'}
                    />
                    <DockItem
                        label={t.settings}
                        icon={<Settings size={18} />}
                        onClick={toggleSettings}
                        color="default"
                        isActive={isSettingsOpen}
                    />
                </div>
            </div>

            <motion.button
                onClick={toggleFeedback}
                className={`group flex shrink-0 items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 active:scale-95 ${isFeedbackOpen
                    ? 'bg-white/20 border-blue-500/50 scale-110'
                    : 'bg-[#0f1419]/90 border-[#2a3a4a] hover:bg-white/10 hover:scale-110 hover:border-blue-500/50'
                    }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={t.feedbackTitle}
            >
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
                    <MessageSquare size={22} className={isFeedbackOpen ? 'text-blue-300' : 'text-blue-400 group-hover:text-blue-300'} />
                </motion.div>
            </motion.button>
        </div>
    );
}

interface DockItemProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
    color?: string;
}

function DockItem({ label, icon, onClick, isActive, color }: DockItemProps) {
    const colorColors: Record<string, string> = {
        cyan: 'rgba(34,211,238,1)',
        green: 'rgba(74,222,128,1)',
        amber: 'rgba(251,191,36,1)',
        purple: 'rgba(192,132,252,1)',
        pink: 'rgba(236,72,153,1)',
        default: 'rgba(255,255,255,1)'
    };

    const colorClasses: Record<string, string> = {
        cyan: 'text-cyan-400 group-hover:bg-cyan-400/20 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        green: 'text-green-400 group-hover:bg-green-400/20 group-hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]',
        amber: 'text-amber-400 group-hover:bg-amber-400/20 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.4)]',
        purple: 'text-purple-400 group-hover:bg-purple-400/20 group-hover:shadow-[0_0_15px_rgba(192,132,252,0.4)]',
        pink: 'text-pink-400 group-hover:bg-pink-400/20 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]',
        default: 'text-gray-400 group-hover:bg-white/10 group-hover:text-white'
    };

    const activeColor = color ? colorColors[color] : colorColors.default;
    const selectedColorClass = color ? colorClasses[color] : colorClasses.default;

    return (
        <div className="relative group p-0.5" key={label}>
            <button
                onClick={onClick}
                className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ease-out
                    ${isActive ? 'bg-white/20 text-white scale-110 shadow-lg' : 'hover:scale-110'}
                    ${!isActive ? selectedColorClass : ''}
                `}
                style={isActive ? {
                    boxShadow: `0 0 20px ${activeColor.replace('1)', '0.3)')}`,
                    color: activeColor
                } : {}}
                title={label}
            >
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
                >
                    {icon}
                </motion.div>
            </button>

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100000]">
                {label}
            </div>

            {isActive && (
                <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full"
                    style={{
                        backgroundColor: activeColor,
                        boxShadow: `0 0 8px ${activeColor}`
                    }}
                />
            )}

            <style jsx>{`
                @media (max-width: 640px) {
                    button {
                        width: 32px !important;
                        height: 32px !important;
                    }
                    :global(.lucide) {
                        width: 16px !important;
                        height: 16px !important;
                    }
                }
            `}</style>
        </div>
    );
}
