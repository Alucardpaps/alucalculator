'use client';

/**
 * NestingVisualization Component
 * 
 * Visual representation of 1D bin packing results showing:
 * - Stock bars with cut segments
 * - Waste visualization
 * - Color-coded parts
 * - Efficiency metrics
 */

import React, { useMemo } from 'react';
import { Scissors, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import type { NestingResult, CutPattern, CutItem } from '@/utils/nestingAlgorithm';

interface NestingVisualizationProps {
    result: NestingResult;
    onPatternClick?: (patternIndex: number) => void;
    showLabels?: boolean;
    compact?: boolean;
    className?: string;
}

// Generate consistent colors for parts based on label
function getPartColor(label: string): string {
    const colors = [
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#ec4899', // Pink
        '#14b8a6', // Teal
    ];

    // Hash the label to get consistent color
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function NestingVisualization({
    result,
    onPatternClick,
    showLabels = true,
    compact = false,
    className = '',
}: NestingVisualizationProps) {
    // Calculate unique parts for legend
    const uniqueParts = useMemo(() => {
        const partsMap = new Map<string, { label: string; color: string; count: number }>();
        result.patterns.forEach(pattern => {
            pattern.cuts.forEach(cut => {
                const existing = partsMap.get(cut.label);
                if (existing) {
                    existing.count++;
                } else {
                    partsMap.set(cut.label, {
                        label: cut.label,
                        color: getPartColor(cut.label),
                        count: 1,
                    });
                }
            });
        });
        return Array.from(partsMap.values());
    }, [result.patterns]);

    // Efficiency status
    const efficiencyStatus = useMemo(() => {
        if (result.totalWastePct <= 5) return 'excellent';
        if (result.totalWastePct <= 15) return 'good';
        if (result.totalWastePct <= 25) return 'fair';
        return 'poor';
    }, [result.totalWastePct]);

    return (
        <div className={`nesting-visualization ${className}`}>
            {/* Summary Header */}
            <div className="nesting-summary">
                <div className="summary-stat">
                    <span className="stat-icon">
                        <Scissors size={16} />
                    </span>
                    <div className="stat-content">
                        <span className="stat-value">{result.totalStockUsed}</span>
                        <span className="stat-label">Bars Used</span>
                    </div>
                </div>

                <div className="summary-stat">
                    <span className="stat-icon">
                        <BarChart3 size={16} />
                    </span>
                    <div className="stat-content">
                        <span className={`stat-value efficiency-${efficiencyStatus}`}>
                            {(100 - result.totalWastePct).toFixed(1)}%
                        </span>
                        <span className="stat-label">Efficiency</span>
                    </div>
                </div>

                <div className="summary-stat">
                    <span className="stat-icon">
                        {result.totalWastePct <= 15 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    </span>
                    <div className="stat-content">
                        <span className="stat-value">{result.totalWaste.toFixed(0)} mm</span>
                        <span className="stat-label">Total Waste</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            {showLabels && uniqueParts.length > 0 && (
                <div className="nesting-legend">
                    {uniqueParts.map(part => (
                        <div key={part.label} className="legend-item">
                            <span
                                className="legend-color"
                                style={{ backgroundColor: part.color }}
                            />
                            <span className="legend-label">{part.label}</span>
                            <span className="legend-count">×{part.count}</span>
                        </div>
                    ))}
                    <div className="legend-item waste">
                        <span className="legend-color waste" />
                        <span className="legend-label">Waste</span>
                    </div>
                </div>
            )}

            {/* Stock Bars */}
            <div className="stock-bars">
                {result.patterns.map((pattern, patternIdx) => (
                    <StockBar
                        key={patternIdx}
                        pattern={pattern}
                        index={patternIdx}
                        compact={compact}
                        onClick={() => onPatternClick?.(patternIdx)}
                    />
                ))}
            </div>

            <style jsx>{`
                .nesting-visualization {
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 12px;
                    padding: 16px;
                }
                
                .nesting-summary {
                    display: flex;
                    gap: 24px;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-dim, #1a1a30);
                }
                
                .summary-stat {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .stat-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 8px;
                    color: var(--accent, #6366f1);
                }
                
                .stat-content {
                    display: flex;
                    flex-direction: column;
                }
                
                .stat-value {
                    font-family: var(--font-mono, 'JetBrains Mono', monospace);
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                }
                
                .stat-label {
                    font-size: 11px;
                    color: var(--text-dim, #666);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .efficiency-excellent { color: #10b981; }
                .efficiency-good { color: #22d3ee; }
                .efficiency-fair { color: #f59e0b; }
                .efficiency-poor { color: #ef4444; }
                
                .nesting-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 16px;
                    padding: 10px 12px;
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 8px;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                }
                
                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }
                
                .legend-color.waste {
                    background: repeating-linear-gradient(
                        45deg,
                        #333,
                        #333 2px,
                        #222 2px,
                        #222 4px
                    );
                }
                
                .legend-label {
                    color: var(--text-secondary, #a0a0b8);
                }
                
                .legend-count {
                    color: var(--text-dim, #666);
                    font-family: var(--font-mono, monospace);
                }
                
                .stock-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
            `}</style>
        </div>
    );
}

// Individual Stock Bar Component
function StockBar({
    pattern,
    index,
    compact,
    onClick,
}: {
    pattern: CutPattern;
    index: number;
    compact: boolean;
    onClick?: () => void;
}) {
    const barHeight = compact ? 28 : 40;

    // Calculate positions
    let currentX = 0;
    const segments = pattern.cuts.map((cut, cutIdx) => {
        const width = (cut.length / pattern.stockLength) * 100;
        const x = currentX;
        currentX += width;
        return { cut, x, width, cutIdx };
    });

    const wasteWidth = (pattern.waste / pattern.stockLength) * 100;

    return (
        <div
            className="stock-bar-wrapper"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="bar-label">
                <span className="bar-index">#{index + 1}</span>
                <span className="bar-info">{pattern.stockLength}mm</span>
            </div>

            <div className="bar-container" style={{ height: barHeight }}>
                <svg width="100%" height={barHeight} preserveAspectRatio="none">
                    {/* Background (total stock) */}
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height={barHeight}
                        fill="#1a1a2e"
                        rx="4"
                    />

                    {/* Cut segments */}
                    {segments.map(({ cut, x, width, cutIdx }) => (
                        <g key={cutIdx}>
                            <rect
                                x={`${x}%`}
                                y="2"
                                width={`${width}%`}
                                height={barHeight - 4}
                                fill={getPartColor(cut.label)}
                                rx="3"
                            />
                            {/* Label text */}
                            {!compact && width > 8 && (
                                <text
                                    x={`${x + width / 2}%`}
                                    y={barHeight / 2 + 4}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="10"
                                    fontWeight="600"
                                    fontFamily="var(--font-mono, monospace)"
                                >
                                    {cut.length}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Waste segment */}
                    {wasteWidth > 0.5 && (
                        <rect
                            x={`${100 - wasteWidth}%`}
                            y="2"
                            width={`${wasteWidth}%`}
                            height={barHeight - 4}
                            fill="url(#wastePattern)"
                            rx="3"
                        />
                    )}

                    {/* Waste pattern definition */}
                    <defs>
                        <pattern
                            id="wastePattern"
                            patternUnits="userSpaceOnUse"
                            width="6"
                            height="6"
                        >
                            <rect width="6" height="6" fill="#252545" />
                            <path d="M0 6L6 0" stroke="#333" strokeWidth="1" />
                        </pattern>
                    </defs>
                </svg>
            </div>

            <div className="bar-waste">
                <span className={`waste-value ${pattern.wastePct > 20 ? 'high' : ''}`}>
                    {pattern.waste.toFixed(0)}mm
                </span>
                <span className="waste-pct">({pattern.wastePct.toFixed(1)}%)</span>
            </div>

            <style jsx>{`
                .stock-bar-wrapper {
                    display: grid;
                    grid-template-columns: 80px 1fr 90px;
                    align-items: center;
                    gap: 12px;
                    padding: 6px;
                    border-radius: 6px;
                    transition: background 0.15s;
                }
                
                .stock-bar-wrapper:hover {
                    background: var(--surface-2, #1a1a2e);
                }
                
                .bar-label {
                    display: flex;
                    flex-direction: column;
                }
                
                .bar-index {
                    font-family: var(--font-mono, monospace);
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--accent, #6366f1);
                }
                
                .bar-info {
                    font-size: 10px;
                    color: var(--text-dim, #666);
                }
                
                .bar-container {
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .bar-waste {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                
                .waste-value {
                    font-family: var(--font-mono, monospace);
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-secondary, #a0a0b8);
                }
                
                .waste-value.high {
                    color: var(--warning, #f59e0b);
                }
                
                .waste-pct {
                    font-size: 10px;
                    color: var(--text-dim, #666);
                }
            `}</style>
        </div>
    );
}

export default NestingVisualization;
