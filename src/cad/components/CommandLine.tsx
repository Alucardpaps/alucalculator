/**
 * AluCAD Command Line - AutoCAD-style CLI
 * 
 * Floating command input bar with prompts and keyboard shortcuts.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCadStore } from '../store/cadStore';
import { useOSStore } from '../../store/osStore';
import { CAD_COLORS } from '../kernel/constants';

// ═══════════════════════════════════════════════════════════════
// COMMAND ALIASES (AutoCAD Style)
// ═══════════════════════════════════════════════════════════════

const COMMAND_ALIASES: Record<string, string> = {
    'L': 'LINE',
    'LINE': 'LINE',
    'PL': 'PLINE',
    'PLINE': 'PLINE',
    'C': 'CIRCLE',
    'CIRCLE': 'CIRCLE',
    'A': 'ARC',
    'ARC': 'ARC',
    'REC': 'RECTANGLE',
    'RECTANGLE': 'RECTANGLE',
    'E': 'ERASE',
    'ERASE': 'ERASE',
    'TR': 'TRIM',
    'TRIM': 'TRIM',
    'EX': 'EXTEND',
    'EXTEND': 'EXTEND',
    'O': 'OFFSET',
    'OFFSET': 'OFFSET',
    'M': 'MOVE',
    'MOVE': 'MOVE',
    'CO': 'COPY',
    'COPY': 'COPY',
    'RO': 'ROTATE',
    'ROTATE': 'ROTATE',
    'MI': 'MIRROR',
    'MIRROR': 'MIRROR',
    'SC': 'SCALE',
    'SCALE': 'SCALE',
    'F': 'FILLET',
    'FILLET': 'FILLET',
    'CHA': 'CHAMFER',
    'CHAMFER': 'CHAMFER',
    'DIM': 'DIMENSION',
    'DIMENSION': 'DIMENSION',
    'Z': 'ZOOM',
    'ZOOM': 'ZOOM',
    'P': 'PAN',
    'PAN': 'PAN',
    'U': 'UNDO',
    'UNDO': 'UNDO',
    'REDO': 'REDO'
};

// ═══════════════════════════════════════════════════════════════
// COMMAND LINE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CommandLineProps {
    className?: string;
}

export function CommandLine({ className }: CommandLineProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const {
        activeCommand,
        commandPrompt,
        commandState,
        setActiveCommand,
        cancelCommand,
        orthoEnabled,
        snapEnabled,
        gridSnapEnabled,
        cursorWorld,
        undo,
        redo
    } = useCadStore();

    // Keep input focused (AutoCAD style) - but don't hijack other inputs!
    useEffect(() => {
        const focus = (e: KeyboardEvent) => {
            // 1. Don't hijack if we're typing in another input/textarea
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            if (isInput) return;

            // 2. Don't hijack if user is holding modifiers (to allow shortcuts like Ctrl+Shift+P)
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            // 3. Only focus if we are in CAD mode or the window is active
            // Note: workspaceMode is tracked in osStore
            const { workspaceMode } = useOSStore.getState();
            if (workspaceMode !== 'cad' && workspaceMode !== 'desk') return;

            inputRef.current?.focus();
        };
        window.addEventListener('keydown', focus);
        return () => window.removeEventListener('keydown', focus);
    }, []);

    // Process command input
    const processCommand = useCallback((input: string) => {
        const trimmed = input.trim().toUpperCase();

        if (!trimmed) {
            // Empty Enter: finish current command
            if (activeCommand) {
                cancelCommand();
            }
            return;
        }

        // Check for alias
        const command = COMMAND_ALIASES[trimmed];

        if (command) {
            // Handle immediate commands
            if (command === 'UNDO') {
                undo();
                return;
            }
            if (command === 'REDO') {
                redo();
                return;
            }

            // Start command
            setActiveCommand(command);
            setHistory(prev => [...prev, trimmed]);
        } else {
            // Unknown command
            console.warn(`Unknown command: ${trimmed}`);
        }
    }, [activeCommand, cancelCommand, setActiveCommand, undo, redo]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Enter: Execute
        if (e.key === 'Enter') {
            processCommand(inputValue);
            setInputValue('');
            setHistoryIndex(-1);
        }

        // Escape: Cancel
        if (e.key === 'Escape') {
            cancelCommand();
            setInputValue('');
        }

        // Up Arrow: History back
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = historyIndex < history.length - 1
                    ? historyIndex + 1
                    : historyIndex;
                setHistoryIndex(newIndex);
                setInputValue(history[history.length - 1 - newIndex] || '');
            }
        }

        // Down Arrow: History forward
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInputValue(history[history.length - 1 - newIndex] || '');
            } else {
                setHistoryIndex(-1);
                setInputValue('');
            }
        }
    }, [inputValue, historyIndex, history, processCommand, cancelCommand]);

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <div
            className={`bg-[#0a0e12]/95 backdrop-blur-md border-t border-[#2a3a4a] ${className}`}
        >
            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1 text-[10px] uppercase tracking-wider border-b border-[#1a2530]">
                {/* Mode Indicators */}
                <div className="flex items-center gap-4">
                    <StatusIndicator
                        label="ORTHO"
                        active={orthoEnabled}
                        hotkey="F8"
                    />
                    <StatusIndicator
                        label="OSNAP"
                        active={snapEnabled}
                        hotkey="F3"
                    />
                    <StatusIndicator
                        label="GRID"
                        active={gridSnapEnabled}
                        hotkey="F7"
                    />
                </div>

                {/* Cursor Coordinates */}
                <div className="flex items-center gap-2 font-mono text-cyan-400">
                    <span>X: {cursorWorld.x.toFixed(3)}</span>
                    <span>Y: {cursorWorld.y.toFixed(3)}</span>
                </div>
            </div>

            {/* Command Input */}
            <div className="flex items-center px-4 py-2">
                <span className="text-gray-400 text-sm mr-2">
                    {commandPrompt || 'Command:'}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono"
                    placeholder={activeCommand ? '' : 'Type command...'}
                    autoFocus
                />
            </div>

            {/* Quick Help */}
            <div className="px-4 pb-2 text-[10px] text-gray-500">
                L=Line | C=Circle | REC=Rect | TR=Trim | O=Offset | E=Erase | ESC=Cancel | Enter=Finish
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════

interface StatusIndicatorProps {
    label: string;
    active: boolean;
    hotkey: string;
}

function StatusIndicator({ label, active, hotkey }: StatusIndicatorProps) {
    const handleClick = () => {
        const store = useCadStore.getState();
        switch (label) {
            case 'ORTHO': store.toggleOrtho(); break;
            case 'OSNAP': store.toggleSnap(); break;
            case 'GRID': store.toggleGridSnap(); break;
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`
                px-2 py-0.5 rounded transition-all
                ${active
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-500 hover:text-gray-300'
                }
            `}
            title={`${label} [${hotkey}]`}
        >
            {label}
        </button>
    );
}

export default CommandLine;
