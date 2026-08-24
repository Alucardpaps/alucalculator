'use client';

import { useState } from 'react';

/**
 * JsonFormatterModule - JSON formatter and validator
 */
export default function JsonFormatterModule() {
    const [input, setInput] = useState('{"name":"AluCalc","version":1.0,"features":["weight","nesting","thermal"]}');
    const [indentSize, setIndentSize] = useState(2);
    const [error, setError] = useState<string | null>(null);
    const [formatted, setFormatted] = useState('');

    const formatJson = () => {
        try {
            const parsed = JSON.parse(input);
            const result = JSON.stringify(parsed, null, indentSize);
            setFormatted(result);
            setError(null);
        } catch (e) {
            setError((e as Error).message);
            setFormatted('');
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(input);
            const result = JSON.stringify(parsed);
            setFormatted(result);
            setError(null);
        } catch (e) {
            setError((e as Error).message);
            setFormatted('');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(formatted || input);
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
                <button
                    onClick={formatJson}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                    style={{
                        backgroundColor: 'var(--color-os-accent)',
                        color: 'var(--color-os-canvas)',
                    }}
                >
                    Format
                </button>
                <button
                    onClick={minifyJson}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                    style={{
                        backgroundColor: 'var(--color-os-header)',
                        color: 'var(--color-os-text-primary)',
                        border: '1px solid var(--color-os-border)',
                    }}
                >
                    Minify
                </button>
                <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                    style={{
                        backgroundColor: 'var(--color-os-header)',
                        color: 'var(--color-os-text-primary)',
                        border: '1px solid var(--color-os-border)',
                    }}
                >
                    Copy
                </button>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--color-os-text-secondary)' }}>Indent:</span>
                    <select
                        value={indentSize}
                        onChange={e => setIndentSize(Number(e.target.value))}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                            backgroundColor: 'var(--color-os-header)',
                            color: 'var(--color-os-text-primary)',
                            border: '1px solid var(--color-os-border)',
                        }}
                    >
                        <option value={2}>2</option>
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                    </select>
                </div>
            </div>

            {/* Input */}
            <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Input JSON
                </label>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 p-3 rounded font-mono text-xs resize-none"
                    style={{
                        backgroundColor: 'var(--color-os-header)',
                        color: 'var(--color-os-text-primary)',
                        border: '1px solid var(--color-os-border)',
                    }}
                    placeholder="Paste JSON here..."
                />
            </div>

            {/* Error */}
            {error && (
                <div
                    className="p-2 rounded text-xs"
                    style={{
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        color: 'var(--color-os-danger)',
                        border: '1px solid var(--color-os-danger)',
                    }}
                >
                    ❌ {error}
                </div>
            )}

            {/* Output */}
            {formatted && !error && (
                <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        Output
                    </label>
                    <textarea
                        value={formatted}
                        readOnly
                        className="flex-1 p-3 rounded font-mono text-xs resize-none"
                        style={{
                            backgroundColor: 'var(--color-os-panel)',
                            color: 'var(--color-os-accent)',
                            border: '1px solid var(--color-os-accent)',
                        }}
                    />
                </div>
            )}
        </div>
    );
}
