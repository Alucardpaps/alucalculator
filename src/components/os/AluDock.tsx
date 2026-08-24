'use client';

/**
 * 🚀 ALU DOCK — Premium macOS-style Dock
 * 
 * A custom-built floating dock with:
 * - Gaussian magnification effect (icons scale based on cursor distance)
 * - Quick Launch apps for core modules
 * - Workspace mode switcher (Desk / Flow / CAD / CAM)
 * - Running app indicators (glowing dots)
 * - Glass morphism backdrop
 * - Animated tooltips
 * 
 *
 * Zero external dependencies. Pure React + CSS.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import {
    Calculator, Settings, Layers, Grid3X3, Pencil, Layout,
    Scissors, Wrench, BookOpen, Atom, Zap, Receipt,
    MessageSquare, Folder, Palette, Globe, Cpu, CircleDot,
    MousePointer2, Play, BarChart3, Waves,
    LucideIcon, LayoutGrid, Activity, Terminal, Database, Thermometer,
    FileText, PowerOff, Gamepad2, Hammer, Scan, Shield
} from 'lucide-react';
import { NeonIcon } from '@/components/ui/NeonIcon';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DockItem {
    id: string;
    label: string;
    icon: LucideIcon;
    action: () => void;
    color: string;
    isRunning?: boolean;
    badge?: number;
}

interface AluDockProps {
    currentMode: 'cad' | 'cam' | 'desk' | 'fea';
    onSwitchMode: (mode: 'cad' | 'cam' | 'desk' | 'fea') => void;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const BASE_ICON_SIZE = 52;        // px — default icon size
const MAX_ICON_SIZE = 80;         // px — max magnified size
const MAGNIFICATION_RANGE = 180;  // px — gaussian spread in pixels
const DOCK_PADDING = 10;          // px

// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AluDock({ currentMode, onSwitchMode }: AluDockProps) {
    const { windows, activeWindowId, openWindow, startMenuOpen, toggleStartMenu, closeAllWindows } = useOSStore();
    const { t, language, setLanguage } = useI18nStore();
    const [isHovered, setIsHovered] = useState(false);
    const [mouseX, setMouseX] = useState<number | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const dockRef = useRef<HTMLDivElement>(null);

    // ─── DOCK ITEMS ───
    const quickLaunchItems: DockItem[] = [
        {
            id: 'calculator', label: t.modules.calculator.title, icon: Calculator,
            action: () => openWindow('calculator'), color: '#06b6d4',
            isRunning: windows.some(w => w.type === 'calculator')
        },
        {
            id: 'profile-weight', label: t.modules['profile-weight'].title, icon: Layers,
            action: () => openWindow('profile-weight'), color: '#3b82f6',
            isRunning: windows.some(w => w.type === 'profile-weight')
        },
        {
            id: 'project-manager', label: t.modules['project-manager']?.title || 'Project BOM', icon: FileText,
            action: () => openWindow('project-manager'), color: '#10b981',
            isRunning: windows.some(w => w.type === 'project-manager')
        },
        {
            id: 'gears', label: t.modules['gears-bearings'].title, icon: Settings,
            action: () => openWindow('gears-bearings'), color: '#8b5cf6',
            isRunning: windows.some(w => w.type === 'gears-bearings')
        },
        {
            id: 'welding', label: t.modules.welding.title, icon: Zap,
            action: () => openWindow('welding'), color: '#f59e0b',
            isRunning: windows.some(w => w.type === 'welding')
        },
        {
            id: 'fasteners', label: t.modules.fasteners.title, icon: Wrench,
            action: () => openWindow('fasteners'), color: '#ef4444',
            isRunning: windows.some(w => w.type === 'fasteners')
        },
        {
            id: 'bearings', label: t.modules.bearings.title, icon: CircleDot,
            action: () => openWindow('bearings'), color: '#0ea5e9',
            isRunning: windows.some(w => w.type === 'bearings')
        },

        {
            id: 'materials', label: t.modules['materials-db'].title, icon: Atom,
            action: () => openWindow('materials-db'), color: '#ec4899',
            isRunning: windows.some(w => w.type === 'materials-db')
        },
        {
            id: 'materials-explorer', label: 'AI Materials Intelligence', icon: Scan,
            action: () => openWindow('materials-explorer'), color: '#00e5ff',
            isRunning: windows.some(w => w.type === 'materials-explorer')
        },
        {
            id: 'cutting', label: t.modules['cutting-optimizer'].title, icon: Scissors,
            action: () => openWindow('cutting-optimizer'), color: '#14b8a6',
            isRunning: windows.some(w => w.type === 'cutting-optimizer')
        },
        {
            id: 'thermal-expansion', label: t.modules['thermal-expansion'].title, icon: Thermometer,
            action: () => openWindow('thermal-expansion'), color: '#f97316',
            isRunning: windows.some(w => w.type === 'thermal-expansion')
        },
    ];

    const workspaceItems = [
        { id: 'cad', label: t.viewCad, icon: MousePointer2, action: () => onSwitchMode('cad'), color: '#3b82f6', isActiveMode: currentMode === 'cad' },
        {
            id: 'engineering-selection',
            label: t.modules?.['engineering-selection']?.title || 'Engineering Database',
            icon: Database,
            action: () => openWindow('engineering-selection'),
            color: '#f59e0b',
            isRunning: windows.some(w => w.type === 'engineering-selection')
        },
        { id: 'fea', label: t.viewFea, icon: Activity, action: () => onSwitchMode('fea'), color: '#f59e0b', isActiveMode: currentMode === 'fea' },
        {
            id: 'physics-solver', label: 'Physics CAS Solver', icon: Activity,
            action: () => openWindow('physics-solver'), color: '#22c55e',
            isRunning: windows.some(w => w.type === 'physics-solver')
        },
        { id: 'desk', label: t.viewDesk, icon: Terminal, action: () => onSwitchMode('desk'), color: '#a855f7', isActiveMode: currentMode === 'desk' },
    ];

    const systemItems: DockItem[] = [
        {
            id: 'file-explorer', label: t.modules['file-explorer'].title, icon: Folder,
            action: () => openWindow('file-explorer'), color: '#f59e0b',
            isRunning: windows.some(w => w.type === 'file-explorer')
        },
        {
            id: 'project-vault', label: 'Engineering Vault', icon: Shield,
            action: () => openWindow('project-vault'), color: '#3b82f6',
            isRunning: windows.some(w => w.type === 'project-vault')
        },

        {
            id: 'browser', label: t.modules['browser'].title, icon: Globe,
            action: () => openWindow('browser'), color: '#3b82f6',
            isRunning: windows.some(w => w.type === 'browser')
        },

        {
            id: 'paint', label: t.modules['paint'].title, icon: Palette,
            action: () => openWindow('paint'), color: '#ec4899',
            isRunning: windows.some(w => w.type === 'paint')
        },
        {
            id: 'close-all', label: t.closeAll || 'Close All Apps', icon: PowerOff,
            action: () => closeAllWindows(), color: '#ef4444',
            isRunning: false
        }
    ];

    // ─── MAGNIFICATION CALCULATION ───
    const getScale = useCallback((itemIndex: number, section: DockItem[]) => {
        if (mouseX === null || !dockRef.current) return 1;

        const dockRect = dockRef.current.getBoundingClientRect();
        const itemCenter = getItemCenterX(itemIndex, section, dockRect);
        const distance = Math.abs(mouseX - itemCenter);

        // Gaussian falloff
        const scale = 1 + (MAX_ICON_SIZE / BASE_ICON_SIZE - 1) *
            Math.max(0, 1 - (distance / MAGNIFICATION_RANGE) ** 2);

        return scale;
    }, [mouseX]);

    // Calculate the center X position of an item relative to the viewport
    const getItemCenterX = (index: number, section: DockItem[], dockRect: DOMRect) => {
        // Approximate: each item is BASE_ICON_SIZE + gap
        const totalItems = quickLaunchItems.length + workspaceItems.length + systemItems.length + 2; // +2 separators
        const totalWidth = totalItems * (BASE_ICON_SIZE + 8);
        const startX = dockRect.left + (dockRect.width - totalWidth) / 2;

        let offset = 0;
        // Count previous sections
        if (section === workspaceItems) {
            offset = quickLaunchItems.length * (BASE_ICON_SIZE + 8) + 20; // +separator
        } else if (section === systemItems) {
            offset = (quickLaunchItems.length + workspaceItems.length) * (BASE_ICON_SIZE + 8) + 40;
        }

        return startX + offset + index * (BASE_ICON_SIZE + 8) + BASE_ICON_SIZE / 2;
    };

    // ─── MOUSE HANDLERS ───
    const handleMouseMove = (e: React.MouseEvent) => {
        setMouseX(e.clientX);
    };

    const handleMouseLeave = () => {
        setMouseX(null);
        setActiveTooltip(null);
    };

    return (
        <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={dockRef}
        >
            <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.5 }}
                className="relative flex items-end gap-1 px-3 pb-2 pt-2 rounded-2xl border border-white/10 shadow-2xl"
                style={{
                    background: 'linear-gradient(180deg, rgba(15, 20, 25, 0.85) 0%, rgba(10, 14, 18, 0.95) 100%)',
                    backdropFilter: 'blur(24px) saturate(1.8)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            >
                {/* Ambient Glow */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 100%, rgba(0, 229, 255, 0.06) 0%, transparent 70%)',
                    }}
                />

                {/* Quick Launch Section */}
                {quickLaunchItems.map((item, i) => (
                    <DockIconButton
                        key={item.id}
                        item={item}
                        scale={getScale(i, quickLaunchItems)}
                        isActiveMode={false}
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                    />
                ))}

                {/* Separator */}
                <DockSeparator />

                {/* Workspace Section */}
                {workspaceItems.map((item, i) => (
                    <DockIconButton
                        key={item.id}
                        item={item}
                        scale={getScale(i, workspaceItems)}
                        isActiveMode={currentMode === item.id}
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                    />
                ))}

                {/* Separator */}
                <DockSeparator />

                {/* System Section */}
                {systemItems.map((item, i) => (
                    <DockIconButton
                        key={item.id}
                        item={item}
                        scale={getScale(i, systemItems)}
                        isActiveMode={false}
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                    />
                ))}
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function DockIconButton({
    item,
    scale,
    isActiveMode,
    activeTooltip,
    setActiveTooltip,
}: {
    item: DockItem;
    scale: number;
    isActiveMode: boolean;
    activeTooltip: string | null;
    setActiveTooltip: (id: string | null) => void;
}) {
    const Icon = item.icon;
    const size = BASE_ICON_SIZE * scale;
    const isHovered = activeTooltip === item.id;
    const iconSize = Math.round(size * 0.42);
    const iconColor = '#ffffff';

    return (
        <div className="relative flex flex-col items-center">
            {/* Tooltip */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute -top-10 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold text-white z-50 pointer-events-none"
                        style={{
                            background: 'rgba(0, 0, 0, 0.92)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        {item.label}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                            style={{ background: 'rgba(0, 0, 0, 0.92)', borderRight: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Badge */}
            {item.badge && (
                <div className="absolute -top-1 -right-1 z-50 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg"
                    style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}
                >
                    {item.badge}
                </div>
            )}

            {/* Icon Button — Premium Gradient App Icon */}
            <button
                onClick={item.action}
                onMouseEnter={() => setActiveTooltip(item.id)}
                onMouseLeave={() => setActiveTooltip(null)}
                className="relative flex items-center justify-center rounded-2xl active:scale-90 overflow-hidden"
                style={{
                    width: size,
                    height: size,
                    transition: 'width 0.15s ease, height 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease, filter 0.2s ease',
                    background: `linear-gradient(145deg, ${item.color}cc, ${item.color}40 50%, ${item.color}20)`,
                    border: `1px solid ${isActiveMode ? item.color : isHovered ? `${item.color}80` : `${item.color}30`}`,
                    boxShadow: isActiveMode
                        ? `0 0 24px ${item.color}50, 0 8px 20px ${item.color}20, inset 0 1px 0 rgba(255,255,255,0.25)`
                        : isHovered
                            ? `0 6px 20px ${item.color}30, 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`
                            : `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
                    filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
                }}
            >
                {/* Glass reflection overlay */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 50%)',
                        borderRadius: 'inherit',
                    }}
                />
                <NeonIcon
                    icon={Icon}
                    size={iconSize}
                    color={isActiveMode ? item.color : '#00e5ff'}
                    strokeWidth={isActiveMode ? 2.5 : 2}
                    animated={true}
                />
            </button>

            {/* Running Indicator Dot */}
            {(item.isRunning || isActiveMode) && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-1 rounded-full"
                    style={{
                        width: isActiveMode ? 6 : 4,
                        height: isActiveMode ? 6 : 4,
                        backgroundColor: isActiveMode ? item.color : 'rgba(255,255,255,0.4)',
                        boxShadow: isActiveMode ? `0 0 8px ${item.color}` : 'none',
                    }}
                />
            )}
        </div>
    );
}

function DockSeparator() {
    return (
        <div className="flex items-center justify-center px-1 self-center" style={{ height: BASE_ICON_SIZE }}>
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/15 to-transparent rounded-full" />
        </div>
    );
}
