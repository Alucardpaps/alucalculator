"use client";

import React, { useMemo, useState } from 'react';
import { Cog, Zap, Box, ArrowRight, AlertTriangle, CheckCircle2, Info, Thermometer, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CalcNode {
    id: string;
    type: string;
    name: string;
    val: string;
    status: 'verified' | 'error';
    dependencies: { id: string, field: string }[]; 
    raw: any;
}

interface DependencyGraphProps {
    calculations: any[];
    onSelectNode?: (node: any) => void;
}

/**
 * Dependency Graph v2 (Wave 4 - Advanced Engineering Visualization)
 * Interactive navigation and data flow visualization.
 */
export const DependencyGraph = ({ calculations, onSelectNode }: DependencyGraphProps) => {
    const router = useRouter();

    // 1. Build Node & Edge Map
    const nodes: CalcNode[] = useMemo(() => {
        return calculations.map(c => {
            const deps: { id: string, field: string }[] = [];
            const inputStr = JSON.stringify(c.input_json || {});
            
            const matches = inputStr.match(/"\$ref":"(.*?)"/g);
            if (matches) {
                matches.forEach(m => {
                    const refValue = m.split('"')[3];
                    const [id, field] = refValue.split('.');
                    if (id) deps.push({ id, field });
                });
            }

            // Extract primary value
            let primaryVal = 'N/A';
            if (c.result_json) {
                const vals = Object.values(c.result_json);
                primaryVal = vals.length > 0 ? String(vals[0]) : 'N/A';
            }

            return {
                id: c.id,
                type: c.type,
                name: c.name || `${c.type.toUpperCase()}_NODE`,
                val: primaryVal,
                status: c.result_json ? 'verified' : 'error',
                dependencies: deps,
                raw: c
            };
        });
    }, [calculations]);

    if (nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl opacity-40 bg-slate-900/10">
                <Box size={40} className="mb-4 text-slate-700" />
                <p className="text-sm font-mono uppercase tracking-widest text-slate-600">No active assembly nodes detected</p>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-x-auto pb-12 scrollbar-hide">
            <div className="flex flex-wrap gap-12 items-start justify-center min-w-[1000px] py-12 px-8">
                {nodes.map((node) => (
                    <div key={node.id} className="relative flex flex-col items-center group">
                        
                        {/* Dependency Data Pulse Lines */}
                        <div className="absolute -top-16 w-full flex justify-center h-16 pointer-events-none">
                            {node.dependencies.map((dep, dIdx) => (
                                <div key={dIdx} className="absolute inset-0">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 border border-blue-500/30 rounded-md text-[7px] font-mono font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 shadow-2xl backdrop-blur-sm">
                                        $REF::DATA_TRANSIT[{dep.id}]
                                    </div>
                                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                                        <defs>
                                            <filter id="glow">
                                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <path 
                                            d={`M 50% 0 L 50% -30`} 
                                            stroke={node.status === 'error' ? '#f59e0b' : '#3b82f6'} 
                                            strokeWidth="1.5"
                                            strokeDasharray="4 6"
                                            fill="none"
                                            className="animate-[dash_30s_linear_infinite]"
                                            filter="url(#glow)"
                                            opacity="0.4"
                                        />
                                        {/* Data Pulse Dot */}
                                        <circle r="2" fill="#3b82f6" className="animate-[pulse_move_3s_infinite_linear]">
                                            <animateMotion path={`M 50% -30 L 50% 0`} dur="3s" repeatCount="indefinite" />
                                        </circle>
                                    </svg>
                                </div>
                            ))}
                        </div>

                        {/* Node Card v2 */}
                        <div 
                            onClick={() => onSelectNode ? onSelectNode(node.raw) : router.push(`/${node.type}?id=${node.id}`)}
                            className={`
                                w-72 p-6 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer
                                transform hover:-translate-y-2 active:scale-95 relative overflow-hidden
                                ${node.status === 'verified' 
                                    ? 'bg-[#0f172a] border-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(59,130,246,0.1)]' 
                                    : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 shadow-xl shadow-amber-900/5'}
                            `}
                        >
                            {/* Glow Effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-2.5 rounded-xl border ${
                                    node.type === 'gears' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                    node.type === 'bearings' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    node.type === 'bolts' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                    node.type === 'thermal' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                }`}>
                                    {node.type === 'gears' ? <Cog size={18} /> : 
                                     node.type === 'bearings' ? <Zap size={18} /> : 
                                     node.type === 'bolts' ? <ShieldCheck size={18} /> :
                                     node.type === 'thermal' ? <Thermometer size={18} /> :
                                     <Box size={18} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                        node.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                        {node.status}
                                    </div>
                                    <Info size={12} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>

                            <div className="space-y-1 mb-8">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate leading-none">{node.name}</h4>
                                <p className="text-[9px] font-mono text-slate-600 truncate opacity-60">KERNEL_ID::{node.id.split('-')[0]}</p>
                            </div>

                            <div className="flex items-baseline justify-between pt-5 border-t border-slate-800/50">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Output Signal</span>
                                    <span className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase tracking-tighter">{node.type}::RESULT</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-mono font-black text-white tracking-tighter drop-shadow-lg">{node.val}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Bridge Indicator */}
                        <div className="mt-6 flex flex-col items-center group-hover:scale-y-125 transition-transform duration-500">
                            <div className="h-6 w-[2px] bg-gradient-to-b from-blue-500/50 to-transparent"></div>
                            <ArrowRight size={10} className="rotate-90 text-blue-500/40 -mt-1" />
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes dash {
                    to { stroke-dashoffset: -1000; }
                }
                @keyframes pulse_move {
                    0% { opacity: 0; scale: 0.5; }
                    10% { opacity: 1; scale: 1.2; }
                    90% { opacity: 1; scale: 1.2; }
                    100% { opacity: 0; scale: 0.5; }
                }
            `}</style>
        </div>
    );
};
