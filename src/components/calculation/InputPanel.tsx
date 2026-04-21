import React from 'react';
import { CalculatorInput } from "@/components/CalculatorInput";

/**
 * InputPanel Component
 * Standardized input container for engineering calculators.
 */

interface InputPanelProps {
    title: string;
    children: React.ReactNode;
}

export function InputPanel({ title, children }: InputPanelProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {title}
            </h3>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
