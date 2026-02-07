'use client';

import { useState } from 'react';

// Excel Formula Helper - Common formulas reference
const FORMULA_CATEGORIES = {
    math: {
        label: 'Math',
        formulas: [
            { name: 'SUM', syntax: 'SUM(range)', desc: 'Adds all numbers in a range', example: '=SUM(A1:A10)' },
            { name: 'AVERAGE', syntax: 'AVERAGE(range)', desc: 'Returns the average of numbers', example: '=AVERAGE(A1:A10)' },
            { name: 'MAX', syntax: 'MAX(range)', desc: 'Returns the largest value', example: '=MAX(A1:A10)' },
            { name: 'MIN', syntax: 'MIN(range)', desc: 'Returns the smallest value', example: '=MIN(A1:A10)' },
            { name: 'ROUND', syntax: 'ROUND(number, digits)', desc: 'Rounds to specified digits', example: '=ROUND(3.14159, 2)' },
            { name: 'ABS', syntax: 'ABS(number)', desc: 'Returns absolute value', example: '=ABS(-5)' },
            { name: 'POWER', syntax: 'POWER(base, exp)', desc: 'Returns power of number', example: '=POWER(2, 8)' },
            { name: 'SQRT', syntax: 'SQRT(number)', desc: 'Returns square root', example: '=SQRT(16)' },
        ]
    },
    text: {
        label: 'Text',
        formulas: [
            { name: 'CONCATENATE', syntax: 'CONCATENATE(text1, ...)', desc: 'Joins text strings', example: '=CONCATENATE(A1, " ", B1)' },
            { name: 'LEFT', syntax: 'LEFT(text, chars)', desc: 'Returns leftmost characters', example: '=LEFT("Hello", 2)' },
            { name: 'RIGHT', syntax: 'RIGHT(text, chars)', desc: 'Returns rightmost characters', example: '=RIGHT("Hello", 2)' },
            { name: 'MID', syntax: 'MID(text, start, chars)', desc: 'Returns middle characters', example: '=MID("Hello", 2, 3)' },
            { name: 'LEN', syntax: 'LEN(text)', desc: 'Returns text length', example: '=LEN("Hello")' },
            { name: 'TRIM', syntax: 'TRIM(text)', desc: 'Removes extra spaces', example: '=TRIM("  Hello  ")' },
            { name: 'UPPER', syntax: 'UPPER(text)', desc: 'Converts to uppercase', example: '=UPPER("hello")' },
            { name: 'LOWER', syntax: 'LOWER(text)', desc: 'Converts to lowercase', example: '=LOWER("HELLO")' },
        ]
    },
    lookup: {
        label: 'Lookup',
        formulas: [
            { name: 'VLOOKUP', syntax: 'VLOOKUP(value, range, col, match)', desc: 'Vertical lookup', example: '=VLOOKUP(A1, B:D, 2, FALSE)' },
            { name: 'HLOOKUP', syntax: 'HLOOKUP(value, range, row, match)', desc: 'Horizontal lookup', example: '=HLOOKUP(A1, 1:3, 2, FALSE)' },
            { name: 'INDEX', syntax: 'INDEX(range, row, col)', desc: 'Returns value at position', example: '=INDEX(A1:C10, 5, 2)' },
            { name: 'MATCH', syntax: 'MATCH(value, range, type)', desc: 'Returns position of value', example: '=MATCH("X", A1:A10, 0)' },
            { name: 'XLOOKUP', syntax: 'XLOOKUP(value, lookup, return)', desc: 'Modern lookup function', example: '=XLOOKUP(A1, B:B, C:C)' },
        ]
    },
    logic: {
        label: 'Logic',
        formulas: [
            { name: 'IF', syntax: 'IF(condition, true, false)', desc: 'Conditional result', example: '=IF(A1>10, "Yes", "No")' },
            { name: 'AND', syntax: 'AND(cond1, cond2, ...)', desc: 'Returns TRUE if all true', example: '=AND(A1>0, B1>0)' },
            { name: 'OR', syntax: 'OR(cond1, cond2, ...)', desc: 'Returns TRUE if any true', example: '=OR(A1>0, B1>0)' },
            { name: 'NOT', syntax: 'NOT(condition)', desc: 'Reverses logic', example: '=NOT(A1>10)' },
            { name: 'IFS', syntax: 'IFS(cond1, val1, ...)', desc: 'Multiple conditions', example: '=IFS(A1>90,"A",A1>80,"B")' },
            { name: 'IFERROR', syntax: 'IFERROR(formula, error_val)', desc: 'Error handling', example: '=IFERROR(A1/B1, 0)' },
        ]
    },
    date: {
        label: 'Date',
        formulas: [
            { name: 'TODAY', syntax: 'TODAY()', desc: 'Current date', example: '=TODAY()' },
            { name: 'NOW', syntax: 'NOW()', desc: 'Current date & time', example: '=NOW()' },
            { name: 'DATE', syntax: 'DATE(year, month, day)', desc: 'Creates date', example: '=DATE(2024, 1, 15)' },
            { name: 'DATEDIF', syntax: 'DATEDIF(start, end, unit)', desc: 'Date difference', example: '=DATEDIF(A1, B1, "D")' },
            { name: 'YEAR', syntax: 'YEAR(date)', desc: 'Extracts year', example: '=YEAR(A1)' },
            { name: 'MONTH', syntax: 'MONTH(date)', desc: 'Extracts month', example: '=MONTH(A1)' },
        ]
    },
};

type CategoryKey = keyof typeof FORMULA_CATEGORIES;

export default function ExcelHelperModule() {
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('math');
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const category = FORMULA_CATEGORIES[activeCategory];

    const filteredFormulas = search
        ? Object.values(FORMULA_CATEGORIES).flatMap(c => c.formulas).filter(f =>
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.desc.toLowerCase().includes(search.toLowerCase())
        )
        : category.formulas;

    const copyToClipboard = (text: string, name: string) => {
        navigator.clipboard.writeText(text);
        setCopied(name);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Search */}
            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search formulas..."
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
            />

            {/* Categories */}
            {!search && (
                <div className="flex gap-1 flex-wrap">
                    {(Object.keys(FORMULA_CATEGORIES) as CategoryKey[]).map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key)}
                            className="px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
                            style={{
                                backgroundColor: activeCategory === key ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                                color: activeCategory === key ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                            }}
                        >
                            {FORMULA_CATEGORIES[key].label}
                        </button>
                    ))}
                </div>
            )}

            {/* Formula List */}
            <div className="flex-1 overflow-auto space-y-2">
                {filteredFormulas.map(formula => (
                    <div
                        key={formula.name}
                        className="p-2 rounded-lg transition-all hover:opacity-90"
                        style={{ backgroundColor: 'var(--color-os-header)' }}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-sm" style={{ color: 'var(--color-os-accent)' }}>
                                {formula.name}
                            </span>
                            <button
                                onClick={() => copyToClipboard(formula.example, formula.name)}
                                className="px-2 py-0.5 rounded text-[9px] transition-all"
                                style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-secondary)' }}
                            >
                                {copied === formula.name ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="text-[10px] mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                            {formula.desc}
                        </div>
                        <div className="font-mono text-[10px] p-1 rounded" style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-primary)' }}>
                            {formula.syntax}
                        </div>
                        <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--color-os-success)' }}>
                            {formula.example}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick tip */}
            <div className="p-2 rounded-lg text-[9px] text-center" style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-secondary)' }}>
                💡 Click &quot;Copy&quot; to copy the example formula
            </div>
        </div>
    );
}
