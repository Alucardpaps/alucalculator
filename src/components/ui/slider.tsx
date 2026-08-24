import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
    value?: number[];
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (value: number[]) => void;
    className?: string;
}

export function Slider({ value, min, max, step, onValueChange, className }: SliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onValueChange) {
            onValueChange([parseFloat(e.target.value)]);
        }
    };

    const val = value ? value[0] : 0;

    return (
        <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={val}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
            />
        </div>
    );
}
