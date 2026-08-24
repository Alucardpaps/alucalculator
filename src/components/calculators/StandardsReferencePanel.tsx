'use client';

/**
 * AluCalc OS — Standards Reference Panel
 * 
 * Context-aware panel showing relevant engineering standards,
 * formulas, and reference materials for the active calculator.
 */

import React, { useState, useMemo } from 'react';
import {
    BookOpen,
    FileText,
    ExternalLink,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Info,
    Scale,
    Beaker
} from 'lucide-react';
import type { CalculatorSchema, Reference, Assumption } from '@/types/calculator-schema';

// ============================================
// Types
// ============================================

export interface StandardsReferencePanelProps {
    schema: CalculatorSchema | null;
    className?: string;
    isOpen?: boolean;
    onToggle?: () => void;
}

// ============================================
// Styles
// ============================================

const styles = {
    container: `
        bg-[#0f1419] border border-[#2a3a4a] rounded-lg overflow-hidden
    `,
    header: `
        flex items-center justify-between px-4 py-3 bg-[#1a2332] 
        border-b border-[#2a3a4a] cursor-pointer hover:bg-[#1a2332]/80
    `,
    title: `
        flex items-center gap-2 text-sm font-bold text-white
    `,
    content: `
        max-h-[400px] overflow-y-auto
    `,
    section: `
        border-b border-[#2a3a4a] last:border-b-0
    `,
    sectionHeader: `
        flex items-center justify-between px-4 py-2 
        bg-[#0f1419] cursor-pointer hover:bg-[#1a2332]/50
    `,
    sectionTitle: `
        flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase
    `,
    sectionContent: `
        px-4 py-3 space-y-3
    `,
    refItem: `
        p-3 bg-[#0a0e14] rounded-lg border border-[#2a3a4a] hover:border-[#00e5ff]/30
        transition-colors
    `,
    refTitle: `
        flex items-center justify-between text-sm font-medium text-white mb-1
    `,
    refDetails: `
        text-xs text-gray-500
    `,
    refLink: `
        flex items-center gap-1 text-[#00e5ff] hover:underline text-xs mt-2
    `,
    assumption: `
        flex gap-3 p-3 rounded-lg
    `,
    assumptionIcon: `
        flex-shrink-0 mt-0.5
    `,
    assumptionContent: `
        flex-1
    `,
    assumptionTitle: `
        text-sm font-medium text-white mb-1
    `,
    assumptionText: `
        text-xs text-gray-400
    `,
    badge: `
        px-2 py-0.5 rounded text-xs font-medium
    `,
    empty: `
        flex flex-col items-center justify-center py-8 text-gray-500
    `,
};

// ============================================
// Helper Components
// ============================================

const ReferenceItem: React.FC<{ ref: Reference }> = ({ ref }) => {
    // Map standard type to display type
    const getDisplayType = () => {
        if (ref.standard.toLowerCase().includes('iso') || ref.standard.toLowerCase().includes('din')) return 'standard';
        if (ref.standard.toLowerCase().includes('eurocode')) return 'standard';
        return 'handbook';
    };

    const displayType = getDisplayType();

    const getTypeIcon = () => {
        switch (displayType) {
            case 'standard': return <Scale size={14} className="text-[#00e5ff]" />;
            default: return <BookOpen size={14} className="text-purple-400" />;
        }
    };

    const getTypeBadge = () => {
        const colors: Record<string, string> = {
            standard: 'bg-[#00e5ff]/20 text-[#00e5ff]',
            handbook: 'bg-amber-500/20 text-amber-400',
        };
        return colors[displayType] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className={styles.refItem}>
            <div className={styles.refTitle}>
                <span className="flex items-center gap-2">
                    {getTypeIcon()}
                    {ref.standard}
                </span>
                <span className={`${styles.badge} ${getTypeBadge()}`}>
                    {displayType}
                </span>
            </div>
            <div className="text-sm text-gray-300 mb-1">{ref.title}</div>
            {ref.section && (
                <div className={styles.refDetails}>
                    Section: {ref.section}
                </div>
            )}
            {ref.url && (
                <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.refLink}
                >
                    <ExternalLink size={12} />
                    View Reference
                </a>
            )}
        </div>
    );
};

const AssumptionItem: React.FC<{ assumption: Assumption }> = ({ assumption }) => {
    const getImpactColor = () => {
        switch (assumption.impact) {
            case 'high': return 'bg-red-500/20 border-red-500/30';
            case 'medium': return 'bg-amber-500/20 border-amber-500/30';
            case 'low': return 'bg-blue-500/20 border-blue-500/30';
            default: return 'bg-gray-500/20 border-gray-500/30';
        }
    };

    const getImpactIcon = () => {
        switch (assumption.impact) {
            case 'high': return <AlertTriangle size={16} className="text-red-400" />;
            case 'medium': return <Info size={16} className="text-amber-400" />;
            case 'low': return <Info size={16} className="text-blue-400" />;
            default: return <Info size={16} className="text-gray-400" />;
        }
    };

    return (
        <div className={`${styles.assumption} ${getImpactColor()} border rounded-lg`}>
            <div className={styles.assumptionIcon}>
                {getImpactIcon()}
            </div>
            <div className={styles.assumptionContent}>
                <div className={styles.assumptionTitle}>
                    {assumption.id}
                </div>
                <div className={styles.assumptionText}>
                    {assumption.text}
                </div>
            </div>
        </div>
    );
};

// ============================================
// Main Component
// ============================================

export const StandardsReferencePanel: React.FC<StandardsReferencePanelProps> = ({
    schema,
    className = '',
    isOpen: controlledIsOpen,
    onToggle,
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['references', 'assumptions'])
    );

    const isOpen = controlledIsOpen ?? internalIsOpen;
    const handleToggle = onToggle ?? (() => setInternalIsOpen(!internalIsOpen));

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    };

    // References are no longer grouped by type since Reference interface doesn't have type
    // We just iterate over all references directly in the render

    // Group assumptions by impact
    const groupedAssumptions = useMemo(() => {
        if (!schema?.assumptions) return {};
        return schema.assumptions.reduce((acc, assumption) => {
            const impact = assumption.impact;
            if (!acc[impact]) acc[impact] = [];
            acc[impact].push(assumption);
            return acc;
        }, {} as Record<string, Assumption[]>);
    }, [schema?.assumptions]);

    if (!schema) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.header}>
                    <span className={styles.title}>
                        <BookOpen size={16} className="text-[#00e5ff]" />
                        Standards & References
                    </span>
                </div>
                <div className={styles.empty}>
                    <BookOpen size={32} className="mb-2 opacity-50" />
                    <span className="text-sm">No calculator selected</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${className}`}>
            {/* Header */}
            <div className={styles.header} onClick={handleToggle}>
                <span className={styles.title}>
                    <BookOpen size={16} className="text-[#00e5ff]" />
                    Standards & References
                </span>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {/* Content */}
            {isOpen && (
                <div className={styles.content}>
                    {/* References Section */}
                    <div className={styles.section}>
                        <div
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('references')}
                        >
                            <span className={styles.sectionTitle}>
                                <FileText size={14} />
                                References ({schema.references?.length || 0})
                            </span>
                            {expandedSections.has('references')
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />
                            }
                        </div>

                        {expandedSections.has('references') && (
                            <div className={styles.sectionContent}>
                                {schema.references?.length ? (
                                    schema.references.map((ref, i) => (
                                        <ReferenceItem key={i} ref={ref} />
                                    ))
                                ) : (
                                    <div className="text-xs text-gray-500 italic">
                                        No references documented
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Assumptions Section */}
                    <div className={styles.section}>
                        <div
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('assumptions')}
                        >
                            <span className={styles.sectionTitle}>
                                <AlertTriangle size={14} />
                                Assumptions ({schema.assumptions?.length || 0})
                            </span>
                            {expandedSections.has('assumptions')
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />
                            }
                        </div>

                        {expandedSections.has('assumptions') && (
                            <div className={styles.sectionContent}>
                                {/* High impact first */}
                                {groupedAssumptions.high?.map((a, i) => (
                                    <AssumptionItem key={`high-${i}`} assumption={a} />
                                ))}
                                {groupedAssumptions.medium?.map((a, i) => (
                                    <AssumptionItem key={`medium-${i}`} assumption={a} />
                                ))}
                                {groupedAssumptions.low?.map((a, i) => (
                                    <AssumptionItem key={`low-${i}`} assumption={a} />
                                ))}

                                {!schema.assumptions?.length && (
                                    <div className="text-xs text-gray-500 italic">
                                        No assumptions documented
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Formulas Section */}
                    <div className={styles.section}>
                        <div
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('formulas')}
                        >
                            <span className={styles.sectionTitle}>
                                <Beaker size={14} />
                                Formulas ({schema.outputs?.length || 0})
                            </span>
                            {expandedSections.has('formulas')
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />
                            }
                        </div>

                        {expandedSections.has('formulas') && (
                            <div className={styles.sectionContent}>
                                {schema.outputs?.map((output, i) => (
                                    <div key={i} className={styles.refItem}>
                                        <div className="text-sm font-medium text-white mb-2">
                                            {output.name}
                                        </div>
                                        <code className="block px-3 py-2 bg-[#1a2332] rounded text-xs text-[#00e5ff] font-mono overflow-x-auto">
                                            {output.formula}
                                        </code>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StandardsReferencePanel;
