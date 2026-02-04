import { ComponentProps } from "react";

interface CalculatorInputProps extends ComponentProps<"input"> {
    label: string;
    unit: string;
    active?: boolean;
}

export const CalculatorInput = ({ label, unit, active, className, ...props }: CalculatorInputProps) => {
    return (
        <div className={className}>
            <label className="field-label flex justify-between">
                <span>{label}</span>
                {active && <span className="text-ind-orange animate-pulse">●</span>}
            </label>
            <div className="relative">
                <input
                    type="number"
                    step="any"
                    autoComplete="off"
                    className={`input-tech text-base ${active ? 'border-ind-orange ring-1 ring-ind-orange' : ''}`}
                    placeholder="0"
                    {...props}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">
                    {unit}
                </span>
            </div>
        </div>
    );
};

