'use client';

import { useState, useMemo } from 'react';

// 2D Nesting Algorithm - Simple First Fit Decreasing Height
interface Part {
    id: number;
    width: number;
    height: number;
    x?: number;
    y?: number;
    placed?: boolean;
}

function nestParts(parts: Part[], stockWidth: number, stockHeight: number): { placedParts: Part[]; efficiency: number } {
    const sorted = [...parts].sort((a, b) => b.height - a.height);
    const placed: Part[] = [];

    // Simple shelf algorithm
    let shelfY = 0;
    let shelfHeight = 0;
    let currentX = 0;

    for (const part of sorted) {
        if (currentX + part.width > stockWidth) {
            // Move to next shelf
            shelfY += shelfHeight;
            shelfHeight = 0;
            currentX = 0;
        }

        if (shelfY + part.height <= stockHeight) {
            placed.push({
                ...part,
                x: currentX,
                y: shelfY,
                placed: true,
            });
            currentX += part.width;
            shelfHeight = Math.max(shelfHeight, part.height);
        }
    }

    const usedArea = placed.reduce((sum, p) => sum + p.width * p.height, 0);
    const totalArea = stockWidth * stockHeight;
    const efficiency = (usedArea / totalArea) * 100;

    return { placedParts: placed, efficiency };
}

/**
 * Nesting2DModule - 2D part nesting optimization
 */
export default function Nesting2DModule() {
    const [stockWidth, setStockWidth] = useState(1000);
    const [stockHeight, setStockHeight] = useState(500);
    const [parts, setParts] = useState<Part[]>([
        { id: 1, width: 200, height: 150 },
        { id: 2, width: 180, height: 120 },
        { id: 3, width: 150, height: 100 },
        { id: 4, width: 120, height: 80 },
        { id: 5, width: 100, height: 100 },
    ]);
    const [newWidth, setNewWidth] = useState(100);
    const [newHeight, setNewHeight] = useState(80);

    // Run nesting
    const { placedParts, efficiency } = useMemo(() =>
        nestParts(parts, stockWidth, stockHeight),
        [parts, stockWidth, stockHeight]
    );

    const addPart = () => {
        if (newWidth > 0 && newHeight > 0) {
            setParts([...parts, { id: Date.now(), width: newWidth, height: newHeight }]);
        }
    };

    const removePart = (id: number) => {
        setParts(parts.filter(p => p.id !== id));
    };

    // Scale for visualization
    const scale = Math.min(280 / stockWidth, 160 / stockHeight);

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Stock Size */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        Stock Width
                    </label>
                    <input
                        type="number"
                        value={stockWidth}
                        onChange={e => setStockWidth(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        Stock Height
                    </label>
                    <input
                        type="number"
                        value={stockHeight}
                        onChange={e => setStockHeight(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
            </div>

            {/* SVG Visualization */}
            <div
                className="flex-1 rounded-lg p-2 flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-os-canvas)' }}
            >
                <svg
                    viewBox={`-5 -5 ${stockWidth * scale + 10} ${stockHeight * scale + 10}`}
                    className="w-full h-full max-h-[180px]"
                >
                    {/* Stock outline */}
                    <rect
                        x="0" y="0"
                        width={stockWidth * scale}
                        height={stockHeight * scale}
                        fill="var(--color-os-header)"
                        stroke="var(--color-os-border)"
                        strokeWidth="2"
                    />

                    {/* Placed parts */}
                    {placedParts.map((part, i) => (
                        <g key={part.id}>
                            <rect
                                x={(part.x || 0) * scale}
                                y={(part.y || 0) * scale}
                                width={part.width * scale}
                                height={part.height * scale}
                                fill={`hsl(${(i * 50) % 360}, 70%, 50%)`}
                                fillOpacity={0.7}
                                stroke="var(--color-os-accent)"
                                strokeWidth="1"
                            />
                            <text
                                x={(part.x || 0) * scale + (part.width * scale) / 2}
                                y={(part.y || 0) * scale + (part.height * scale) / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="8"
                            >
                                {part.width}×{part.height}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Add Part */}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        Width
                    </label>
                    <input
                        type="number"
                        value={newWidth}
                        onChange={e => setNewWidth(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        Height
                    </label>
                    <input
                        type="number"
                        value={newHeight}
                        onChange={e => setNewHeight(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
                <button
                    onClick={addPart}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ backgroundColor: 'var(--color-os-accent)', color: 'var(--color-os-canvas)' }}
                >
                    Add
                </button>
            </div>

            {/* Parts List */}
            <div
                className="flex flex-wrap gap-1 p-2 rounded-lg max-h-20 overflow-auto"
                style={{ backgroundColor: 'var(--color-os-header)' }}
            >
                {parts.map(part => (
                    <span
                        key={part.id}
                        onClick={() => removePart(part.id)}
                        className="px-2 py-0.5 rounded text-[10px] cursor-pointer hover:opacity-70"
                        style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-primary)' }}
                    >
                        {part.width}×{part.height} ✕
                    </span>
                ))}
            </div>

            {/* Results */}
            <div
                className="p-3 rounded-lg flex justify-between items-center"
                style={{ backgroundColor: 'var(--color-os-header)', border: '1px solid var(--color-os-accent)' }}
            >
                <div>
                    <div className="text-[10px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>Parts Placed</div>
                    <div className="font-mono font-bold" style={{ color: 'var(--color-os-text-primary)' }}>
                        {placedParts.length} / {parts.length}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>Efficiency</div>
                    <div className="font-mono font-bold text-xl" style={{ color: 'var(--color-os-accent)' }}>
                        {efficiency.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
}
