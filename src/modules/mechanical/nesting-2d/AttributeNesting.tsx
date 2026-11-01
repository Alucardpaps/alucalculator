'use client';

import React from 'react';
import { useMechanicalStore } from '@/store/useMechanicalStore';
import { Scissors, CornerLeftDown } from 'lucide-react';

export function AttributeNesting() {
    const { remnantSheets, runAttributeNesting } = useMechanicalStore();

    return (
        <div className="flex flex-col gap-4 p-4 border border-[var(--line)] bg-[var(--bg-1)] rounded-[var(--radius-m)]">
            <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--cyan)] font-mono uppercase">
                <Scissors /> Attribute-Based AI 2D Nesting
            </h3>
            <p className="text-sm text-[var(--muted)]">
                Lantek & SigmaNEST style Remnant-first Utilization & Downstream Grouping (e.g., Bending, Welding)
            </p>

            <button
                onClick={runAttributeNesting}
                className="px-4 py-2 bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] font-bold rounded-[var(--radius-s)] self-start font-mono uppercase text-xs cursor-pointer transition-colors"
            >
                Execute Remnant-First AI Nesting
            </button>

            {remnantSheets.length > 0 && (
                <div className="mt-3 p-3 bg-[var(--bg-2)] border border-[var(--ok)]/30 rounded-[var(--radius-s)] text-sm text-[var(--ok)] font-mono">
                    <CornerLeftDown className="inline mr-2 w-4 h-4" />
                    Optimized Layout Generated. Utilization Score: {remnantSheets[0].utilizationScore}%
                </div>
            )}
        </div>
    );
}
