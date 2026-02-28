'use client';

import React, { useRef, useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Grid3X3, MousePointer2 } from 'lucide-react';
import { useActiveGeometry } from '@/cad/hooks';

export function Technical2D() {
    const geometry = useActiveGeometry();

    // Auto-center when geometry changes (optional, might be annoying if zooming)
    // const transformRef = useRef<any>(null);
    // useEffect(() => {
    //    if (geometry && transformRef.current) {
    //        transformRef.current.centerView();
    //    }
    // }, [geometry]);

    if (!geometry) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#0b0f14] text-slate-600">
                <div className="flex flex-col items-center gap-2">
                    <MousePointer2 size={32} />
                    <span className="text-xs font-mono uppercase tracking-widest">Select a node to view geometry</span>
                </div>
            </div>
        );
    }

    const { technical2D: tech } = geometry;

    return (
        <div className="w-full h-full relative cursor-crosshair">
            <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={100}
                wheel={{ step: 0.1 }}
                panning={{ velocityDisabled: true }}
                centerOnInit={true}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                            {/* Controls Overlay */}
                            <button onClick={() => resetTransform()} className="bg-[#1a2332] p-1.5 rounded hover:bg-cyan-900/50 text-cyan-400 border border-[#2a3a4a]" title="Reset View">
                                <Grid3X3 size={16} />
                            </button>
                        </div>

                        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                            <svg className="w-full h-full bg-[#05090e]" viewBox="-500 -500 1000 1000">
                                <defs>
                                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e2833" strokeWidth="0.5" />
                                    </pattern>
                                    <pattern id="grid-small" width="10" height="10" patternUnits="userSpaceOnUse">
                                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0f1620" strokeWidth="0.5" />
                                    </pattern>
                                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                        <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                                    </marker>
                                </defs>

                                {/* Background Grid */}
                                <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid-small)" />
                                <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />

                                {/* Axis Lines */}
                                <line x1="-5000" y1="0" x2="5000" y2="0" stroke="#ef4444" strokeWidth="1" opacity="0.3" strokeDasharray="10,5" />
                                <line x1="0" y1="-5000" x2="0" y2="5000" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="10,5" />

                                <g transform="scale(1, -1)"> {/* Cartesian Y-up fix */}

                                    {/* 1. Reference Circles */}
                                    {tech.circles.map((c, i) => (
                                        <circle
                                            key={i}
                                            cx={c.cx}
                                            cy={c.cy}
                                            r={c.r}
                                            fill="none"
                                            stroke={c.style === 'center' ? '#f59e0b' : '#06b6d4'}
                                            strokeWidth={1}
                                            strokeDasharray={c.style !== 'solid' ? "5,5" : undefined}
                                            opacity={c.style === 'center' ? 0.5 : 0.8}
                                        />
                                    ))}

                                    {/* 2. Reference Lines */}
                                    {tech.lines.map((l, i) => (
                                        <line
                                            key={i}
                                            x1={l.x1} y1={l.y1}
                                            x2={l.x2} y2={l.y2}
                                            stroke="#f59e0b"
                                            strokeWidth={1}
                                            strokeDasharray="10,5"
                                            opacity={0.5}
                                        />
                                    ))}

                                    {/* 3. Main Profile (Outline) */}
                                    {tech.outline.length > 0 && (
                                        <polyline
                                            points={tech.outline.map(p => `${p.x},${p.y}`).join(' ')}
                                            fill="none"
                                            stroke="white"
                                            strokeWidth={2}
                                            strokeLinejoin="round"
                                        />
                                    )}

                                </g>

                                {/* 4. Dimensions (Y-up inverted back for text) */}
                                {tech.dimensions.map((d, i) => (
                                    <g key={i}>
                                        <line
                                            x1={d.x1} y1={-d.y1}
                                            x2={d.x2} y2={-d.y2}
                                            stroke="#10b981"
                                            strokeWidth={1}
                                            markerEnd="url(#arrow)"
                                            markerStart="url(#arrow)"
                                        />
                                        <text
                                            x={(d.x1 + d.x2) / 2}
                                            y={-(d.y1 + d.y2) / 2 - (d.offset || 5)}
                                            fill="#10b981"
                                            fontSize="10"
                                            fontFamily="monospace"
                                            textAnchor="middle"
                                        >
                                            {d.label}
                                        </text>
                                    </g>
                                ))}

                            </svg>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
