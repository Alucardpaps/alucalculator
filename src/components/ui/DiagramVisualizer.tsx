import React, { useMemo } from 'react';

interface DiagramProps {
    data: number[];
    x: number[];
    title: string;
    unit: string;
    color: string;
    fillColor?: string;
    height?: number;
}

export function DiagramVisualizer({ data, x, title, unit, color, fillColor, height = 120 }: DiagramProps) {
    const points = useMemo(() => {
        if (!data || data.length === 0 || !x || x.length === 0) return '';

        const minX = x[0];
        const maxX = x[x.length - 1];
        const rangeX = maxX - minX || 1;

        const minY = Math.min(0, ...data);
        const maxY = Math.max(0, ...data);
        const rangeY = (maxY - minY) || 1;

        // Add 10% padding top and bottom
        const paddedRangeY = rangeY * 1.2;
        const paddedMinY = minY - rangeY * 0.1;

        return data.map((val, i) => {
            const px = ((x[i] - minX) / rangeX) * 100;
            // Invert Y for SVG (0 is top)
            const py = 100 - (((val - paddedMinY) / paddedRangeY) * 100);
            return `${px},${py}`;
        }).join(' ');
    }, [data, x]);

    const { zeroY, maxVal, minVal } = useMemo(() => {
        if (!data || data.length === 0) return { zeroY: 50, maxVal: 0, minVal: 0 };
        const minY = Math.min(0, ...data);
        const maxY = Math.max(0, ...data);
        const rangeY = (maxY - minY) || 1;
        const paddedRangeY = rangeY * 1.2;
        const paddedMinY = minY - rangeY * 0.1;

        const zeroY = 100 - (((0 - paddedMinY) / paddedRangeY) * 100);
        return { zeroY, maxVal: maxY, minVal: minY };
    }, [data]);

    // Format number nicely
    const formatLabel = (val: number) => {
        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(2) + 'M';
        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(2) + 'k';
        if (Math.abs(val) < 1 && val !== 0) return val.toExponential(2);
        return val.toFixed(1);
    };

    return (
        <div className="flex flex-col w-full relative">
            <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
                <span className="text-[10px] font-mono text-slate-500">{unit}</span>
            </div>

            <div
                className="w-full relative rounded-xl border border-white/5 overflow-hidden bg-white/[0.01]"
                style={{ height: `${height}px` }}
            >
                {/* Max/Min Labels */}
                {maxVal > 0 && (
                    <div className="absolute right-2 top-1 text-[9px] font-mono text-white/50 bg-black/50 px-1 rounded backdrop-blur">
                        +{formatLabel(maxVal)}
                    </div>
                )}
                {minVal < 0 && (
                    <div className="absolute right-2 bottom-1 text-[9px] font-mono text-white/50 bg-black/50 px-1 rounded backdrop-blur">
                        {formatLabel(minVal)}
                    </div>
                )}

                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="overflow-visible"
                >
                    {/* Zero Line */}
                    <line
                        x1="0"
                        y1={zeroY}
                        x2="100"
                        y2={zeroY}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                    />

                    {/* Fill Area */}
                    {fillColor && data.length > 0 && (
                        <polygon
                            points={`0,${zeroY} ${points} 100,${zeroY}`}
                            fill={fillColor}
                            opacity={0.2}
                        />
                    )}

                    {/* Line */}
                    {data.length > 0 && (
                        <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                </svg>
            </div>
        </div>
    );
}
