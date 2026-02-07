'use client';

import { useState, useMemo } from 'react';

// Regex Tester Module
export default function RegexTesterModule() {
    const [pattern, setPattern] = useState('\\b[A-Z][a-z]+\\b');
    const [flags, setFlags] = useState('g');
    const [testString, setTestString] = useState('Hello World, this is a Test String with Multiple Words.');
    const [replaceWith, setReplaceWith] = useState('[$&]');
    const [mode, setMode] = useState<'match' | 'replace'>('match');

    const results = useMemo(() => {
        try {
            const regex = new RegExp(pattern, flags);
            const matches = testString.match(regex) || [];
            const replaced = testString.replace(regex, replaceWith);

            // Find match positions for highlighting
            const positions: { start: number; end: number; text: string }[] = [];
            let match;
            const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
            while ((match = re.exec(testString)) !== null) {
                positions.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
                if (!flags.includes('g')) break;
            }

            return { valid: true, matches, replaced, positions, count: matches.length };
        } catch (e) {
            return { valid: false, error: (e as Error).message, matches: [], replaced: '', positions: [], count: 0 };
        }
    }, [pattern, flags, testString, replaceWith]);

    // Highlight matches in text
    const highlightedText = useMemo(() => {
        if (!results.valid || results.positions.length === 0) return testString;

        let result = '';
        let lastEnd = 0;
        for (const pos of results.positions) {
            result += testString.slice(lastEnd, pos.start);
            result += `<mark>${testString.slice(pos.start, pos.end)}</mark>`;
            lastEnd = pos.end;
        }
        result += testString.slice(lastEnd);
        return result;
    }, [testString, results]);

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Mode Toggle */}
            <div className="flex gap-2">
                {(['match', 'replace'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                        className="flex-1 py-1.5 rounded text-xs font-bold uppercase transition-all"
                        style={{
                            backgroundColor: mode === m ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: mode === m ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Pattern Input */}
            <div>
                <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Pattern
                </label>
                <div className="flex gap-2">
                    <span className="px-2 py-1.5 rounded text-sm font-mono" style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-secondary)' }}>/</span>
                    <input
                        type="text"
                        value={pattern}
                        onChange={e => setPattern(e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded text-sm font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-accent)', border: `1px solid ${results.valid ? 'var(--color-os-border)' : 'var(--color-os-danger)'}` }}
                    />
                    <span className="px-2 py-1.5 rounded text-sm font-mono" style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-secondary)' }}>/</span>
                    <input
                        type="text"
                        value={flags}
                        onChange={e => setFlags(e.target.value)}
                        className="w-12 px-2 py-1.5 rounded text-sm font-mono text-center"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                        placeholder="gi"
                    />
                </div>
                {!results.valid && (
                    <div className="text-[10px] mt-1" style={{ color: 'var(--color-os-danger)' }}>⚠️ {results.error}</div>
                )}
            </div>

            {/* Flags Quick Buttons */}
            <div className="flex gap-1 flex-wrap">
                {[
                    { flag: 'g', label: 'Global' },
                    { flag: 'i', label: 'Case Insensitive' },
                    { flag: 'm', label: 'Multiline' },
                    { flag: 's', label: 'Dotall' },
                ].map(({ flag, label }) => (
                    <button
                        key={flag}
                        onClick={() => setFlags(flags.includes(flag) ? flags.replace(flag, '') : flags + flag)}
                        className="px-2 py-1 rounded text-[9px] font-mono transition-all"
                        style={{
                            backgroundColor: flags.includes(flag) ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: flags.includes(flag) ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {flag} - {label}
                    </button>
                ))}
            </div>

            {/* Test String */}
            <div className="flex-1 flex flex-col">
                <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Test String
                </label>
                <textarea
                    value={testString}
                    onChange={e => setTestString(e.target.value)}
                    className="flex-1 w-full px-2 py-1.5 rounded text-xs font-mono resize-none"
                    style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                />
            </div>

            {/* Replace With (if replace mode) */}
            {mode === 'replace' && (
                <div>
                    <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        Replace With
                    </label>
                    <input
                        type="text"
                        value={replaceWith}
                        onChange={e => setReplaceWith(e.target.value)}
                        className="w-full px-2 py-1.5 rounded text-sm font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
            )}

            {/* Results */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-os-header)', border: '1px solid var(--color-os-accent)' }}>
                <div className="flex justify-between mb-2">
                    <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>
                        {mode === 'match' ? 'Matches' : 'Result'}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-os-accent)' }}>
                        {results.count} match{results.count !== 1 ? 'es' : ''}
                    </span>
                </div>

                {mode === 'match' ? (
                    <div className="text-xs font-mono break-all" style={{ color: 'var(--color-os-text-primary)' }} dangerouslySetInnerHTML={{ __html: highlightedText.replace(/<mark>/g, '<span style="background:var(--color-os-accent);color:var(--color-os-canvas);padding:0 2px;border-radius:2px;">').replace(/<\/mark>/g, '</span>') }} />
                ) : (
                    <div className="text-xs font-mono break-all" style={{ color: 'var(--color-os-text-primary)' }}>
                        {results.replaced}
                    </div>
                )}
            </div>
        </div>
    );
}
