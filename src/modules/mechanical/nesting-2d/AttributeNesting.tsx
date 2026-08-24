'use client';

import React from 'react';
import { useMechanicalStore } from '@/store/useMechanicalStore';
import { Scissors, CornerLeftDown } from 'lucide-react';

export function AttributeNesting() {
    const { remnantSheets, runAttributeNesting } = useMechanicalStore();

    return (
        <div className="flex flex-col gap-4 p-4 border border-slate-700 bg-slate-900 rounded-lg">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                <Scissors /> Attribute-Based AI 2D Nesting
            </h3>
            <p className="text-sm text-slate-300">
                Lantek & SigmaNEST style Remnant-first Utilization & Downstream Grouping (e.g., Bending, Welding)
            </p>

            <button
                onClick={runAttributeNesting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded self-start"
            >
                Execute Remnant-First AI Nesting
            </button>

            {remnantSheets.length > 0 && (
                <div className="mt-3 p-3 bg-slate-800 border border-green-500/30 rounded text-sm text-green-400">
                    <CornerLeftDown className="inline mr-2 w-4 h-4" />
                    Optimized Layout Generated. Utilization Score: {remnantSheets[0].utilizationScore}%
                </div>
            )}
        </div>
    );
}
