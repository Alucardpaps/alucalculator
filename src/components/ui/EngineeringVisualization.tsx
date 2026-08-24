'use client';

import { ReactNode } from 'react';

interface EngineeringVisualizationProps {
    status: 'valid' | 'invalid' | 'warning';
    children: ReactNode;
    label?: string;
}

/**
 * ENGINEERING VISUALIZATION CONTAINER
 * Enforces the visual contract:
 * - If status is invalid -> Apply "broken" visual filtering.
 * - Always show a label.
 */
export function EngineeringVisualization({ status, children, label }: EngineeringVisualizationProps) {

    // The "Error State" visual logic
    const errorStyle = status === 'invalid'
        ? {
            filter: 'grayscale(100%) contrast(120%)',
            opacity: 0.7,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff000010 10px, #ff000010 20px)'
        }
        : {};

    const borderClass = status === 'invalid' ? 'border-red-500 border-dashed'
        : status === 'warning' ? 'border-amber-500 border-solid'
            : 'border-slate-800 border-solid';

    return (
        <div className={`relative w-full h-full min-h-[200px] flex flex-col rounded-lg overflow-hidden border ${borderClass} bg-[#0a0a0a] transition-all duration-300`}>
            {/* Visualization Viewport */}
            <div
                className="flex-1 relative flex items-center justify-center p-4"
                style={errorStyle}
            >
                {children}

                {/* Forced Overlay for Invalid State */}
                {status === 'invalid' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/80 text-red-500 px-3 py-1 rounded font-mono font-bold border border-red-500">
                            GEOMETRY INVALID
                        </div>
                    </div>
                )}
            </div>

            {/* Standard Label */}
            {label && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-slate-400 font-mono tracking-widest uppercase pointer-events-none border border-white/5">
                    {label}
                </div>
            )}
        </div>
    );
}
