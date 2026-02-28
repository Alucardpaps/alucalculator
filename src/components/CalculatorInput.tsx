import { ComponentProps } from "react";

interface CalculatorInputProps extends ComponentProps<"input"> {
    label: string;
    unit: string;
    active?: boolean;
    onFormulaChange?: (formula: string | null) => void;
}

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Variable } from 'lucide-react';

export const CalculatorInput = ({ label, unit, active, className, onChange, value, onFormulaChange, ...props }: CalculatorInputProps) => {
    const { getVariableValue, variables } = useProjectStore();
    const [localValue, setLocalValue] = useState(value?.toString() || '');
    const [isFormula, setIsFormula] = useState(false);
    const [resolvedSource, setResolvedSource] = useState<string | null>(null);

    // Sync from parent
    useEffect(() => {
        if (!isFormula) {
            setLocalValue(value?.toString() || '');
        }
    }, [value, isFormula]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);

        // 1. Formula Mode
        if (val.startsWith('=')) {
            setIsFormula(true);
            const varName = val.substring(1).trim();
            const resolved = getVariableValue(varName);

            if (resolved !== undefined) {
                setResolvedSource(varName);
                if (onFormulaChange) onFormulaChange(val); // Notify parent of formula

                if (onChange) {
                    // Create a compatible event structure
                    const syntheticEvent = {
                        target: { value: resolved.toString(), name: props.name || '' },
                        currentTarget: { value: resolved.toString(), name: props.name || '' }
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    onChange(syntheticEvent);
                }
            } else {
                setResolvedSource(null);
                if (onFormulaChange) onFormulaChange(val); // Still notify even if unresolved (might be typing)
            }
        }
        // 2. Normal Number Mode
        else {
            if (isFormula) {
                setIsFormula(false);
                setResolvedSource(null);
                if (onFormulaChange) onFormulaChange(null); // Clear formula
            }
            if (onChange) onChange(e);
        }
    };

    return (
        <div className={className}>
            <label className="field-label flex justify-between items-center h-6">
                <span className="truncate pr-2">{label}</span>
                <div className="flex items-center gap-1">
                    {resolvedSource && (
                        <div className="flex items-center gap-1 text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            <Variable size={10} />
                            <span>{resolvedSource}</span>
                        </div>
                    )}
                    {active && <span className="text-ind-orange animate-pulse">●</span>}
                </div>
            </label>
            <div className="relative group">
                <input
                    type="text" // Changed to text to allow formulas
                    inputMode="decimal"
                    autoComplete="off"
                    className={`input-tech text-base ${active ? 'border-ind-orange ring-1 ring-ind-orange' : ''} ${isFormula ? 'text-cyan-300 font-bold' : ''}`}
                    placeholder="0"
                    value={localValue}
                    onChange={handleChange}
                    {...props}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none group-hover:opacity-100 transition-opacity">
                    {unit}
                </span>
            </div>
        </div>
    );
};

