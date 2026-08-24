'use client';

/**
 * AluCalc OS — Keyboard Shortcuts Manager
 * 
 * Global keyboard shortcuts for power users.
 * Shows help modal with all available shortcuts.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Keyboard, X, Command } from 'lucide-react';

// ============================================
// Types
// ============================================

export interface Shortcut {
    key: string;
    modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
    description: string;
    action: () => void;
    category: 'navigation' | 'editing' | 'tools' | 'view';
}

export interface KeyboardShortcutsProps {
    shortcuts: Shortcut[];
    children?: React.ReactNode;
}

// ============================================
// Styles
// ============================================

const styles = {
    modal: `
        fixed inset-0 z-50 flex items-center justify-center 
        bg-black/80 backdrop-blur-sm
    `,
    content: `
        bg-[#0f1419] rounded-xl border border-[#2a3a4a] 
        w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden
    `,
    header: `
        flex items-center justify-between px-6 py-4 
        bg-[#1a2332] border-b border-[#2a3a4a]
    `,
    title: `
        flex items-center gap-2 text-lg font-bold text-white
    `,
    body: `
        p-6 overflow-y-auto max-h-[60vh]
    `,
    category: `
        mb-6 last:mb-0
    `,
    categoryTitle: `
        text-xs font-semibold text-gray-500 uppercase mb-3
    `,
    shortcutList: `
        space-y-2
    `,
    shortcutItem: `
        flex items-center justify-between p-3 
        bg-[#0a0e14] rounded-lg border border-[#2a3a4a]
    `,
    description: `
        text-sm text-gray-300
    `,
    keys: `
        flex items-center gap-1
    `,
    key: `
        px-2 py-1 min-w-[28px] text-center
        bg-[#1a2332] border border-[#3a4a5a] rounded
        text-xs text-white font-mono
    `,
    plus: `
        text-gray-500 text-xs
    `,
    footer: `
        px-6 py-3 bg-[#1a2332] border-t border-[#2a3a4a]
        text-xs text-gray-500 text-center
    `,
};

// ============================================
// Key Display Component
// ============================================

const KeyCombo: React.FC<{ shortcut: Shortcut }> = ({ shortcut }) => {
    const modifierLabels: Record<string, string> = {
        ctrl: 'Ctrl',
        shift: 'Shift',
        alt: 'Alt',
        meta: '⌘',
    };

    const keys = [
        ...shortcut.modifiers.map(m => modifierLabels[m]),
        shortcut.key.toUpperCase(),
    ];

    return (
        <div className={styles.keys}>
            {keys.map((key, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className={styles.plus}>+</span>}
                    <span className={styles.key}>{key}</span>
                </React.Fragment>
            ))}
        </div>
    );
};

// ============================================
// Help Modal Component
// ============================================

export const ShortcutsHelpModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    shortcuts: Shortcut[];
}> = ({ isOpen, onClose, shortcuts }) => {
    if (!isOpen) return null;

    // Group by category
    const grouped = shortcuts.reduce((acc, shortcut) => {
        if (!acc[shortcut.category]) acc[shortcut.category] = [];
        acc[shortcut.category].push(shortcut);
        return acc;
    }, {} as Record<string, Shortcut[]>);

    const categoryOrder = ['navigation', 'editing', 'tools', 'view'];
    const categoryLabels: Record<string, string> = {
        navigation: 'Navigation',
        editing: 'Editing',
        tools: 'Tools',
        view: 'View',
    };

    return (
        <div className={styles.modal} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>
                        <Keyboard size={20} className="text-[#00e5ff]" />
                        Keyboard Shortcuts
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className={styles.body}>
                    {categoryOrder.map(category => {
                        const items = grouped[category];
                        if (!items?.length) return null;

                        return (
                            <div key={category} className={styles.category}>
                                <div className={styles.categoryTitle}>
                                    {categoryLabels[category]}
                                </div>
                                <div className={styles.shortcutList}>
                                    {items.map((shortcut, i) => (
                                        <div key={i} className={styles.shortcutItem}>
                                            <span className={styles.description}>
                                                {shortcut.description}
                                            </span>
                                            <KeyCombo shortcut={shortcut} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footer}>
                    Press <span className={styles.key}>?</span> to toggle this help
                </div>
            </div>
        </div>
    );
};

// ============================================
// Main Provider Component
// ============================================

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProps> = ({
    shortcuts,
    children,
}) => {
    const [showHelp, setShowHelp] = useState(false);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Skip if typing in input
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
        ) {
            return;
        }

        // Help shortcut
        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
            e.preventDefault();
            setShowHelp(prev => !prev);
            return;
        }

        // Check registered shortcuts
        for (const shortcut of shortcuts) {
            const modifiersMatch =
                shortcut.modifiers.includes('ctrl') === e.ctrlKey &&
                shortcut.modifiers.includes('shift') === e.shiftKey &&
                shortcut.modifiers.includes('alt') === e.altKey &&
                shortcut.modifiers.includes('meta') === e.metaKey;

            if (modifiersMatch && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
                e.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            {children}
            <ShortcutsHelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                shortcuts={shortcuts}
            />
        </>
    );
};

// ============================================
// Default Shortcuts
// ============================================

export const createDefaultShortcuts = (handlers: {
    newProject?: () => void;
    save?: () => void;
    undo?: () => void;
    redo?: () => void;
    zoomIn?: () => void;
    zoomOut?: () => void;
    resetZoom?: () => void;
    toggleSidebar?: () => void;
    search?: () => void;
}): Shortcut[] => [
        {
            key: 'n',
            modifiers: ['ctrl'],
            description: 'New Project',
            action: handlers.newProject || (() => { }),
            category: 'navigation',
        },
        {
            key: 's',
            modifiers: ['ctrl'],
            description: 'Save Project',
            action: handlers.save || (() => { }),
            category: 'editing',
        },
        {
            key: 'z',
            modifiers: ['ctrl'],
            description: 'Undo',
            action: handlers.undo || (() => { }),
            category: 'editing',
        },
        {
            key: 'z',
            modifiers: ['ctrl', 'shift'],
            description: 'Redo',
            action: handlers.redo || (() => { }),
            category: 'editing',
        },
        {
            key: '=',
            modifiers: ['ctrl'],
            description: 'Zoom In',
            action: handlers.zoomIn || (() => { }),
            category: 'view',
        },
        {
            key: '-',
            modifiers: ['ctrl'],
            description: 'Zoom Out',
            action: handlers.zoomOut || (() => { }),
            category: 'view',
        },
        {
            key: '0',
            modifiers: ['ctrl'],
            description: 'Reset Zoom',
            action: handlers.resetZoom || (() => { }),
            category: 'view',
        },
        {
            key: 'b',
            modifiers: ['ctrl'],
            description: 'Toggle Sidebar',
            action: handlers.toggleSidebar || (() => { }),
            category: 'view',
        },
        {
            key: 'k',
            modifiers: ['ctrl'],
            description: 'Quick Search',
            action: handlers.search || (() => { }),
            category: 'navigation',
        },
    ];

export default KeyboardShortcutsProvider;
