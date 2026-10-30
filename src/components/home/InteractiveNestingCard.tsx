'use client';

import React, { useState } from 'react';
import { Scissors, Scale, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function InteractiveNestingCard() {
  const [stockLength, setStockLength] = useState(6000); // mm

  return (
    <div className="flex flex-col h-full justify-between space-y-4 font-sans select-none">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] border border-[var(--cyan)]/40">
            <Scissors size={20} />
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 font-semibold">
            Optimized Stock Yield
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold font-tech text-white group-hover:text-amber-400 transition-colors">
            1D & 2D Cutting Optimizer
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal mt-1">
            Algorithmic linear cut nesting with kerf compensation, remnant re-use, and stock optimization.
          </p>
        </div>
      </div>

      {/* Visual Stock Bar Representation */}
      <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-[10px]">
        <div className="flex justify-between text-slate-400">
          <span>Standard Stock: {stockLength}mm</span>
          <span className="text-emerald-400 font-bold">Scrap: 216mm (3.6%)</span>
        </div>

        {/* Multi-segment nested bar */}
        <div className="h-4 w-full rounded-md bg-slate-800/80 overflow-hidden flex p-0.5 gap-0.5 border border-white/10">
          <div className="h-full bg-cyan-500 rounded-sm" style={{ width: '28%' }} title="Part A: 1680mm" />
          <div className="h-full bg-sky-500 rounded-sm" style={{ width: '24%' }} title="Part B: 1440mm" />
          <div className="h-full bg-blue-500 rounded-sm" style={{ width: '22%' }} title="Part C: 1320mm" />
          <div className="h-full bg-indigo-500 rounded-sm" style={{ width: '22%' }} title="Part D: 1320mm" />
          <div className="h-full bg-red-500/40 rounded-sm border border-red-500/50" style={{ width: '4%' }} title="Kerf Scrap" />
        </div>

        <div className="flex justify-between text-[9px] text-slate-500">
          <span className="text-cyan-400">Part A (1680mm)</span>
          <span className="text-sky-400">Part B (1440mm)</span>
          <span className="text-blue-400">Part C (1320mm)</span>
          <span className="text-red-400">Kerf</span>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between">
        <Link
          href="/cutting-optimizer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <span>Run Cut Optimizer</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export default InteractiveNestingCard;
