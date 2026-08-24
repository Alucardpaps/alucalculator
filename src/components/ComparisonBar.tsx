import { ArrowRight, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';

interface ComparisonData {
    weight: number;
    cost: number;
    description: string;
}

interface ComparisonBarProps {
    baseline: ComparisonData | null;
    current: { weight: number; cost: number; description: string };
    unit: 'metric' | 'imperial';
    currency: string;
    onClear: () => void;
}

export const ComparisonBar = ({ baseline, current, unit, currency, onClear }: ComparisonBarProps) => {
    if (!baseline) return null;

    const weightDiff = current.weight - baseline.weight;
    const weightDiffPercent = baseline.weight > 0 ? (weightDiff / baseline.weight) * 100 : 0;

    const costDiff = current.cost - baseline.cost; // Use current price for both? Or frozen price? 
    // Ideally frozen price for A, current for B.

    const isLighter = weightDiff < 0;
    const isCheaper = costDiff < 0;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t-2 border-slate-900 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-20 duration-500">
            <div className="max-w-7xl mx-auto p-4 lg:p-6 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* HEADLINE */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-slate-900 text-white px-3 py-1 text-xs font-bold uppercase rounded">VS Mode</div>
                    <div className="text-sm font-medium text-slate-500 hidden md:block">Comparing concepts</div>
                    <button onClick={onClear} className="ml-auto md:hidden p-2 text-slate-400"><X size={18} /></button>
                </div>

                {/* THE COMPARISON GRID */}
                <div className="flex-1 w-full grid grid-cols-3 gap-2 md:gap-8 items-center">

                    {/* BASELINE (A) */}
                    <div className="text-right opacity-60">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Baseline (A)</div>
                        <div className="font-mono font-bold text-slate-700">{baseline.weight.toFixed(3)} <span className="text-xs">{unit === 'metric' ? 'kg' : 'lbs'}</span></div>
                        <div className="text-xs text-slate-500 truncate max-w-[120px] ml-auto">{baseline.description}</div>
                    </div>

                    {/* DELTA ARROW */}
                    <div className="flex flex-col items-center justify-center">
                        <div className={`flex items-center gap-1 font-bold text-lg ${isLighter ? 'text-green-500' : 'text-red-500'}`}>
                            {isLighter ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                            {Math.abs(weightDiffPercent).toFixed(1)}%
                        </div>
                        <div className={`text-[10px] uppercase font-bold ${isLighter ? 'text-green-600' : 'text-red-400'}`}>
                            {isLighter ? 'Weight Saving' : 'Heavier'}
                        </div>
                    </div>

                    {/* CURRENT (B) */}
                    <div className="text-left">
                        <div className="text-[10px] font-bold uppercase text-brand-orange">Current (B)</div>
                        <div className="font-mono font-bold text-slate-900 text-xl">{current.weight.toFixed(3)} <span className="text-sm text-slate-400">{unit === 'metric' ? 'kg' : 'lbs'}</span></div>
                        <div className="text-xs text-ind-orange font-bold">
                            {currency}{current.cost.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <button onClick={onClear} className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};
