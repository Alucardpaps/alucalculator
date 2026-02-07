'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOSStore } from '@/store/osStore';
import { MODULE_REGISTRY, getModuleIcon, ModuleType } from '@/config/modules';
import {
    Cpu, MessageSquare, Wrench, Building2, Zap, FlaskConical, Calculator, Code2, Pencil, LucideIcon, Bot
} from 'lucide-react';

type TabId = 'drawing' | 'mechanical' | 'civil' | 'electrical' | 'science' | 'finance' | 'software' | 'ai' | 'other';

interface Tab {
    id: TabId;
    label: string;
    Icon: LucideIcon;
}

const TABS: Tab[] = [
    { id: 'drawing', label: 'Drawing', Icon: Pencil },
    { id: 'mechanical', label: 'Mechanical', Icon: Wrench },
    { id: 'civil', label: 'Civil', Icon: Building2 },
    { id: 'electrical', label: 'Electrical', Icon: Zap },
    { id: 'science', label: 'Science', Icon: FlaskConical },
    { id: 'finance', label: 'Finance', Icon: Calculator },
    { id: 'software', label: 'Software', Icon: Code2 },
    { id: 'ai', label: 'AI Tools', Icon: Bot },
    { id: 'other', label: 'Other', Icon: MessageSquare },
];

/**
 * RibbonBar - Top navigation with tabbed tool selection
 * Office/AutoCAD-style ribbon interface
 */
export function RibbonBar() {
    const [activeTab, setActiveTab] = useState<TabId>('mechanical');
    const { openWindow, dictionary } = useOSStore();

    // Get modules for current tab
    const tabModules = Object.values(MODULE_REGISTRY).filter(
        m => m.category === activeTab
    );

    // Map ModuleType to Dictionary Key (keep local or move to config? Local is fine for UI logic)
    const MODULE_KEY_MAP: Record<string, string> = {
        'profile-weight': 'aluminum',
        'fits-tolerances': 'fits',
        'gears-bearings': 'gears',
        'mohr-stress': 'strength',
        'bearings': 'bearings',
        'welding': 'welding',
        'sheet-metal': 'sheetMetal',
        'pumps': 'pumps',
        'fasteners': 'fasteners',
        'unit-converter': 'converter',
        'handbook': 'handbook',
        // Civil
        'beam-deflection': 'simulation',
        // Finance
        'vat-calculator': 'vat',
        // Software
        'json-formatter': 'json',
        // Nesting
        'nesting-2d': 'nesting2d',
        'cutting-optimizer': 'nesting'
    };

    return (
        <div
            className="flex flex-col shrink-0"
            style={{ backgroundColor: 'var(--color-os-header)' }}
        >
            {/* Tab Row */}
            <div
                className="flex items-center h-10 px-2 gap-1 border-b"
                style={{ borderColor: 'var(--color-os-border)' }}
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-2 px-3 mr-4"
                    style={{ color: 'var(--color-os-accent)' }}
                >
                    <Cpu size={18} />
                    <span className="text-xs font-bold tracking-wider">AluCalc OS</span>
                </div>

                {/* Tabs */}
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    const TabIcon = tab.Icon;
                    // Try to translate tab label
                    const label = dictionary?.nav?.[tab.id] || dictionary?.common?.[tab.id] || tab.label;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2 px-4 h-full text-xs font-medium uppercase tracking-wider transition-colors relative"
                            style={{
                                color: isActive ? 'var(--color-os-accent)' : 'var(--color-os-text-secondary)',
                            }}
                        >
                            <TabIcon size={14} />
                            {label}

                            {/* Active indicator */}
                            {isActive && (
                                <div
                                    className="absolute bottom-0 left-2 right-2 h-0.5"
                                    style={{ backgroundColor: 'var(--color-os-accent)' }}
                                />
                            )}
                        </button>
                    );
                })}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Feedback Button */}
                <button
                    onClick={() => window.location.href = "mailto:abdulsametyildirim95@gmail.com"}
                    className="flex items-center gap-2 px-3 py-1 mr-2 rounded text-xs transition-all hover:bg-white/5"
                    style={{ color: 'var(--color-os-text-secondary)' }}
                    title="Send Feedback"
                >
                    <MessageSquare size={14} />
                    <span className="hidden sm:inline">Feedback</span>
                </button>

                {/* Language Selector */}
                <LanguageSelector />
            </div>

            {/* Tool Ribbon */}
            <div
                className="flex items-center h-16 px-4 gap-2 border-b"
                style={{
                    borderColor: 'var(--color-os-border)',
                    backgroundColor: 'var(--color-os-panel)'
                }}
            >
                {tabModules.map(module => {
                    const ModuleIcon = getModuleIcon(module.iconName);

                    // Smart title lookup
                    const key = MODULE_KEY_MAP[module.type] || module.type;

                    // Look in multiple possible locations:
                    let title = dictionary?.modules?.[key]?.title
                        || dictionary?.[key]?.title
                        || module.title;

                    // Special case for Beam Deflection if nested
                    if (module.type === 'beam-deflection' && dictionary?.aluminum?.simulation?.title) {
                        title = dictionary.aluminum.simulation.title;
                    }

                    return (
                        <button
                            key={module.type}
                            onClick={() => openWindow(module.type as ModuleType)}
                            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all hover:bg-white/5 active:bg-white/10 group min-w-[72px]"
                            style={{ color: 'var(--color-os-text-primary)' }}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
                                style={{
                                    backgroundColor: 'var(--color-os-header)',
                                    border: '1px solid var(--color-os-border)',
                                }}
                            >
                                <span style={{ color: 'var(--color-os-accent)' }}>
                                    <ModuleIcon size={16} />
                                </span>
                            </div>
                            <span
                                className="text-[10px] font-medium text-center leading-tight"
                                style={{ color: 'var(--color-os-text-secondary)' }}
                            >
                                {String(title).split(' ').slice(0, 2).join(' ')}
                            </span>
                        </button>
                    );
                })}

                {tabModules.length === 0 && activeTab !== 'drawing' && (
                    <div
                        className="text-xs italic"
                        style={{ color: 'var(--color-os-text-secondary)' }}
                    >
                        No tools in this category yet
                    </div>
                )}

                {activeTab === 'drawing' && (
                    <div
                        className="flex items-center gap-4 text-xs"
                        style={{ color: 'var(--color-os-text-secondary)' }}
                    >
                        <span className="text-cyan-400">✏️ CAD Drawing Mode Active</span>
                        <span>Use the toolbar on the left for drawing tools • Grid snap enabled • mm precision</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Language Selector Component
function LanguageSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { currentLanguage } = useOSStore();
    const router = useRouter();

    const LANGUAGES = [
        { code: 'en', label: 'English' },
        { code: 'tr', label: 'Türkçe' },
        { code: 'de', label: 'Deutsch' },
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' },
        { code: 'it', label: 'Italiano' },
        { code: 'pt', label: 'Português' },
        { code: 'ru', label: 'Русский' },
        { code: 'zh', label: '中文' },
        { code: 'ja', label: '日本語' },
    ];

    const handleLanguageChange = (code: string) => {
        setIsOpen(false);
        // Navigate to new language route
        router.push(`/${code}/os`);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-80"
                style={{ color: 'var(--color-os-text-secondary)' }}
            >
                🌐 {currentLanguage.toUpperCase()}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[120px]"
                    style={{ backgroundColor: 'var(--color-os-header)', border: '1px solid var(--color-os-border)' }}
                >
                    {LANGUAGES.map(l => (
                        <button
                            key={l.code}
                            onClick={() => handleLanguageChange(l.code)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors"
                            style={{ color: currentLanguage === l.code ? 'var(--color-os-accent)' : 'var(--color-os-text-primary)' }}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
