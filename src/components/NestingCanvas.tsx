/**
 * NestingCanvas Component
 * SVG-based canvas for visualizing 2D nesting results
 * Clean, professional design with minimal clutter
 */

"use client";

import { useMemo, useState } from 'react';
import type { SheetResult, Sheet2D, PlacedPart } from '@/types/nesting2d.types';
import { Eye, EyeOff, Maximize2 } from 'lucide-react';

// Clean color for all part outlines
const PART_STROKE_COLOR = '#10B981'; // Emerald green
const PART_FILL_COLOR = 'rgba(16, 185, 129, 0.15)'; // Light emerald fill

interface NestingCanvasProps {
    sheet: Sheet2D;
    result: SheetResult | null;
    currentSheetIndex?: number;
    className?: string;
}

export function NestingCanvas({
    sheet,
    result,
    currentSheetIndex = 0,
    className = ''
}: NestingCanvasProps) {
    const [showLabels, setShowLabels] = useState(false);
    const [showWaste, setShowWaste] = useState(false);

    // Calculate viewBox with padding
    const padding = 20;
    const viewBox = useMemo(() => {
        return `-${padding} -${padding} ${sheet.width + padding * 2} ${sheet.height + padding * 2}`;
    }, [sheet.width, sheet.height]);

    // Render polygon path with position offset applied
    const renderPolygonPath = (part: PlacedPart): string => {
        const points = part.polygon.points;
        if (points.length < 2) return '';

        const bounds = part.polygon.bounds;
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const offsetX = part.position.x - bounds.x;
        const offsetY = part.position.y - bounds.y;

        return points
            .map((p, i) => {
                let x = p.x;
                let y = p.y;

                if (part.rotation !== 0) {
                    const radians = (part.rotation * Math.PI) / 180;
                    const cos = Math.cos(radians);
                    const sin = Math.sin(radians);
                    const dx = p.x - cx;
                    const dy = p.y - cy;
                    x = cx + dx * cos - dy * sin;
                    y = cy + dx * sin + dy * cos;
                }

                x += offsetX;
                y += offsetY;

                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(' ') + ' Z';
    };

    // Count unique part types
    const partStats = useMemo(() => {
        if (!result) return { unique: 0, total: 0 };
        const uniqueIds = new Set(result.placedParts.map(p => p.partId));
        return {
            unique: uniqueIds.size,
            total: result.placedParts.length
        };
    }, [result]);

    return (
        <div className={`relative bg-slate-900 rounded-xl overflow-hidden ${className}`}>
            {/* Top Stats Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-slate-900/95 to-transparent">
                {/* Sheet Size */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400">
                        {sheet.width} × {sheet.height} mm
                    </span>
                    {result && (
                        <span className={`text-sm font-bold ${result.efficiency > 70 ? 'text-emerald-400' :
                                result.efficiency > 50 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                            {result.efficiency.toFixed(1)}%
                        </span>
                    )}
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowLabels(!showLabels)}
                        className={`p-1.5 rounded transition-colors ${showLabels ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        title={showLabels ? 'Hide Labels' : 'Show Labels'}
                    >
                        {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                        onClick={() => setShowWaste(!showWaste)}
                        className={`p-1.5 rounded transition-colors ${showWaste ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        title={showWaste ? 'Hide Waste' : 'Show Waste'}
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* SVG Canvas */}
            <svg
                viewBox={viewBox}
                className="w-full h-full"
                style={{ minHeight: '400px' }}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Grid pattern */}
                <defs>
                    <pattern
                        id="grid-clean"
                        width="100"
                        height="100"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 100 0 L 0 0 0 100"
                            fill="none"
                            stroke="rgba(100, 116, 139, 0.2)"
                            strokeWidth="0.5"
                        />
                    </pattern>
                </defs>

                {/* Sheet background */}
                <rect
                    x={0}
                    y={0}
                    width={sheet.width}
                    height={sheet.height}
                    fill="url(#grid-clean)"
                    stroke="rgba(100, 116, 139, 0.5)"
                    strokeWidth="2"
                />

                {/* Sheet border */}
                <rect
                    x={0}
                    y={0}
                    width={sheet.width}
                    height={sheet.height}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                />

                {/* Placed parts - clean outline style */}
                {result?.placedParts.map((part) => (
                    <g key={`${part.partId}-${part.instanceIndex}`}>
                        <path
                            d={renderPolygonPath(part)}
                            fill={PART_FILL_COLOR}
                            stroke={PART_STROKE_COLOR}
                            strokeWidth="2"
                        />
                        {/* Optional label */}
                        {showLabels && (
                            <text
                                x={part.position.x + part.polygon.bounds.width / 2}
                                y={part.position.y + part.polygon.bounds.height / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize={Math.max(8, Math.min(part.polygon.bounds.width, part.polygon.bounds.height) / 5)}
                                fontWeight="500"
                                opacity={0.8}
                            >
                                {part.instanceIndex + 1}
                            </text>
                        )}
                    </g>
                ))}

                {/* Waste areas - optional */}
                {showWaste && result?.freeRectangles.map((rect, index) => (
                    <rect
                        key={`free-${index}`}
                        x={rect.x}
                        y={rect.y}
                        width={rect.width}
                        height={rect.height}
                        fill="rgba(239, 68, 68, 0.1)"
                        stroke="rgba(239, 68, 68, 0.3)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Empty state */}
                {!result && (
                    <g>
                        <rect
                            x={sheet.width / 2 - 100}
                            y={sheet.height / 2 - 30}
                            width={200}
                            height={60}
                            rx={8}
                            fill="rgba(30, 41, 59, 0.8)"
                        />
                        <text
                            x={sheet.width / 2}
                            y={sheet.height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#94A3B8"
                            fontSize="14"
                        >
                            DXF veya SVG yükleyin
                        </text>
                    </g>
                )}
            </svg>

            {/* Bottom Stats - Compact */}
            {result && result.placedParts.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-t from-slate-900/95 to-transparent">
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded border-2" style={{ borderColor: PART_STROKE_COLOR, backgroundColor: PART_FILL_COLOR }} />
                            <span className="text-slate-400">
                                <span className="font-medium text-white">{partStats.total}</span> parça
                                {partStats.unique > 1 && (
                                    <span className="text-slate-500"> ({partStats.unique} farklı)</span>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        Sheet {currentSheetIndex + 1}
                    </div>
                </div>
            )}
        </div>
    );
}
