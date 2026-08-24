'use client';

import { ScrollText, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

export interface AssumptionMetadata {
    standardId: string; // e.g., "ISO 10042:2018"
    standardTitle: string;
    version: string;     // e.g., "v2.1.0"
    assumptions: string[];
    safetyFactor?: number;
}


export type CalculationMetadata = AssumptionMetadata;

interface AssumptionPanelProps {
    metadata: AssumptionMetadata;
    status: 'valid' | 'invalid' | 'warning';
}

export function AssumptionPanel({ metadata, status }: AssumptionPanelProps) {
    const [expanded, setExpanded] = useState(false);

    // Color logic based on status
    const statusColor = status === 'valid' ? 'text-green-500'
        : status === 'warning' ? 'text-amber-500'
            : 'text-red-500';

    const StatusIcon = status === 'valid' ? ShieldCheck
        : status === 'warning' ? AlertTriangle
            : AlertTriangle;

    return (
        <div className="border-t border-slate-800 bg-[#151515] p-2 mt-auto">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <ScrollText size={12} />
                    <span className="font-mono" title={metadata.standardTitle}>{metadata.standardId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono opacity-50">v{metadata.version}</span>
                    <StatusIcon size={12} className={statusColor} />
                </div>
            </button>

            {expanded && (
                <div className="mt-2 text-xs space-y-2 animate-in slide-in-from-bottom-2">
                    <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                        <h4 className="font-bold text-slate-400 mb-1 flex items-center gap-1">
                            <Info size={10} /> Active Assumptions
                        </h4>
                        <ul className="list-disc pl-4 space-y-1 text-slate-500">
                            {metadata.assumptions.map((asm, i) => (
                                <li key={i}>{asm}</li>
                            ))}
                            {metadata.safetyFactor && (
                                <li>Safety Factor: <b>{metadata.safetyFactor.toFixed(2)}</b></li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
