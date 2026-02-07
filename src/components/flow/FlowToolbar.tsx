'use client';

/**
 * AluCalc OS — Flow Toolbar
 * 
 * Toolbar for adding nodes to the flow canvas.
 */

import React, { useState } from 'react';
import {
    Calculator,
    Youtube,
    FileText,
    StickyNote,
    ChevronDown,
    Search,
    Plus
} from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { getAllCalculators, getCalculatorsByDomain, DOMAIN_INFO } from '@/calculators/registry';
import type { CalculatorSchema } from '@/types/calculator-schema';

// ============================================
// Styles
// ============================================

const styles = {
    toolbar: `
        bg-[#0f1419]/95 backdrop-blur-sm border border-[#2a3a4a] 
        rounded-lg p-2 flex items-center gap-2
    `,
    btn: `
        flex items-center gap-2 px-3 py-2 rounded
        bg-[#1a2332] border border-[#2a3a4a]
        text-gray-400 text-xs font-medium
        hover:bg-[#2a3a4a] hover:text-white hover:border-[#00e5ff]
        transition-all cursor-pointer
    `,
    btnActive: `
        !bg-[#00e5ff]/20 !border-[#00e5ff] !text-[#00e5ff]
    `,
    dropdown: `
        absolute top-full left-0 mt-2 min-w-[300px]
        bg-[#0f1419] border border-[#2a3a4a] rounded-lg
        shadow-2xl overflow-hidden z-50
    `,
    search: `
        w-full bg-[#1a2332] border-b border-[#2a3a4a]
        px-3 py-2 text-sm text-white
        focus:outline-none placeholder-gray-600
    `,
    domainGroup: `
        border-b border-[#1e2833] last:border-0
    `,
    domainHeader: `
        px-3 py-2 text-xs font-bold uppercase tracking-wider
        flex items-center gap-2
    `,
    calcItem: `
        px-3 py-2 text-sm text-gray-400 
        hover:bg-[#1a2332] hover:text-white cursor-pointer
        flex items-center justify-between
    `,
};

// ============================================
// Main Component
// ============================================

const FlowToolbar: React.FC = () => {
    const { addCalculatorNode, addMediaNode, addNoteNode } = useFlowStore();
    const [showCalcDropdown, setShowCalcDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const calculators = getAllCalculators();

    // Group calculators by domain
    const groupedCalculators = React.useMemo(() => {
        const groups: Record<string, CalculatorSchema[]> = {};
        calculators.forEach(calc => {
            if (!groups[calc.domain]) groups[calc.domain] = [];
            groups[calc.domain].push(calc);
        });
        return groups;
    }, [calculators]);

    // Filter by search
    const filteredGroups = React.useMemo(() => {
        if (!searchQuery) return groupedCalculators;

        const filtered: Record<string, CalculatorSchema[]> = {};
        Object.entries(groupedCalculators).forEach(([domain, calcs]) => {
            const matching = calcs.filter(c =>
                c.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.metadata.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            if (matching.length > 0) filtered[domain] = matching;
        });
        return filtered;
    }, [groupedCalculators, searchQuery]);

    const handleAddCalculator = (schemaId: string) => {
        // Calculate position based on existing nodes (cascade)
        const offset = Math.random() * 100;
        addCalculatorNode(schemaId, { x: 150 + offset, y: 100 + offset });
        setShowCalcDropdown(false);
        setSearchQuery('');
    };

    const handleAddNote = () => {
        addNoteNode('📌 Engineering Note\n\nClick edit to add your annotation...', {
            x: 150 + Math.random() * 100,
            y: 100 + Math.random() * 100,
        });
    };

    const handleAddMedia = () => {
        // For now, add a sample YouTube node
        addMediaNode('youtube', 'https://www.youtube.com/watch?v=rWEy2xGKAyc', {
            x: 150 + Math.random() * 100,
            y: 100 + Math.random() * 100,
        });
    };

    return (
        <div className={styles.toolbar}>
            {/* Calculator Dropdown */}
            <div className="relative">
                <button
                    className={`${styles.btn} ${showCalcDropdown ? styles.btnActive : ''}`}
                    onClick={() => setShowCalcDropdown(!showCalcDropdown)}
                >
                    <Calculator size={14} />
                    Add Calculator
                    <ChevronDown size={12} />
                </button>

                {showCalcDropdown && (
                    <div className={styles.dropdown}>
                        {/* Search */}
                        <div className="flex items-center px-2 border-b border-[#2a3a4a]">
                            <Search size={14} className="text-gray-600" />
                            <input
                                type="text"
                                placeholder="Search calculators..."
                                className={styles.search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Calculator List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {Object.entries(filteredGroups).map(([domain, calcs]) => {
                                const info = DOMAIN_INFO[domain as keyof typeof DOMAIN_INFO];
                                return (
                                    <div key={domain} className={styles.domainGroup}>
                                        <div
                                            className={styles.domainHeader}
                                            style={{ color: info?.color || '#888' }}
                                        >
                                            {info?.label || domain}
                                        </div>
                                        {calcs.map(calc => (
                                            <div
                                                key={calc.id}
                                                className={styles.calcItem}
                                                onClick={() => handleAddCalculator(calc.id)}
                                            >
                                                <span>{calc.metadata.title}</span>
                                                <Plus size={12} className="opacity-50" />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}

                            {Object.keys(filteredGroups).length === 0 && (
                                <div className="px-4 py-8 text-center text-gray-600 text-sm">
                                    No calculators found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-[#2a3a4a]" />

            {/* Media Button */}
            <button className={styles.btn} onClick={handleAddMedia}>
                <Youtube size={14} />
                Media
            </button>

            {/* Note Button */}
            <button className={styles.btn} onClick={handleAddNote}>
                <StickyNote size={14} />
                Note
            </button>
        </div>
    );
};

export default FlowToolbar;
