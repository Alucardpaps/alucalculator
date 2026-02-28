'use client';

/**
 * AluCalc OS — Terminal Module
 * Engineering CLI for rapid calculations
 * 
 * Ctrl+Shift+P to open | Supports calc, kerf, thermal, material commands
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { parseCommand, getCommandHelp, CommandResult } from '@/utils/commandParser';
import { usePersistedState } from '@/hooks/useUserPreferences';
import { useI18nStore } from '@/store/i18nStore';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface HistoryEntry {
    id: number;
    input: string;
    result: CommandResult;
    timestamp: number;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function TerminalModule() {
    const { t } = useI18nStore();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = usePersistedState('terminalHistory', [] as string[]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const idRef = useRef(0);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Show welcome message
    useEffect(() => {
        const welcome = getCommandHelp();
        setHistory([{
            id: idRef.current++,
            input: '',
            result: welcome,
            timestamp: Date.now()
        }]);
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;

        const result = parseCommand(trimmed);

        // Handle clear
        if (result.type === 'clear') {
            setHistory([]);
            setInput('');
            setCommandHistory([trimmed, ...commandHistory]);
            setHistoryIndex(-1);
            return;
        }

        setHistory(prev => [...prev, {
            id: idRef.current++,
            input: trimmed,
            result,
            timestamp: Date.now()
        }]);

        setCommandHistory([trimmed, ...commandHistory.slice(0, 49)]);
        setHistoryIndex(-1);
        setInput('');
    }, [input]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // History navigation
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            if (nextIndex >= 0 && commandHistory[nextIndex]) {
                setHistoryIndex(nextIndex);
                setInput(commandHistory[nextIndex]);
            }
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = historyIndex - 1;
            if (nextIndex < 0) {
                setHistoryIndex(-1);
                setInput('');
            } else {
                setHistoryIndex(nextIndex);
                setInput(commandHistory[nextIndex]);
            }
        }
    }, [historyIndex, commandHistory]);

    // Result color mapping
    const getResultColor = (type: CommandResult['type']) => {
        switch (type) {
            case 'success': return '#00e5ff';
            case 'error': return '#ff5252';
            case 'info': return '#b0bec5';
            default: return '#78909c';
        }
    };

    return (
        <div
            className="flex flex-col h-full w-full font-mono text-sm select-text"
            style={{
                backgroundColor: '#0a0e14',
                color: '#b0bec5',
            }}
            onClick={() => inputRef.current?.focus()}
        >
            {/* Scrollable History */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#1e2734 transparent',
                }}
            >
                {history.map((entry) => (
                    <div key={entry.id}>
                        {/* Input Line */}
                        {entry.input && (
                            <div className="flex items-start gap-2">
                                <span style={{ color: '#00e5ff' }}>❯</span>
                                <span style={{ color: '#e0e0e0' }}>{entry.input}</span>
                            </div>
                        )}
                        {/* Output */}
                        {entry.result.output && (
                            <pre
                                className="mt-1 whitespace-pre-wrap leading-relaxed text-xs"
                                style={{ color: getResultColor(entry.result.type) }}
                            >
                                {entry.result.output}
                            </pre>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Bar */}
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 px-4 py-3 border-t"
                style={{
                    borderColor: '#1e2734',
                    backgroundColor: '#0d1117',
                }}
            >
                <span
                    className="text-xs font-bold shrink-0"
                    style={{ color: '#00e5ff' }}
                >
                    {t.termPrefix}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#e0e0e0', caretColor: '#00e5ff' }}
                    placeholder={t.termPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                />
            </form>
        </div>
    );
}
