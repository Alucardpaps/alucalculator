import React from 'react';
import { Html } from '@react-three/drei';
import { useFinanceStore } from '@/lib/store/financeStore';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

export const FinanceHUD = () => {
  const { totalCost, breakEvenQuantity, netProfit, roi } = useFinanceStore();

  return (
    <Html
      position={[0, 2, 0]}
      center
      zIndexRange={[100, 0]}
      distanceFactor={8}
      occlude="blending"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pointer-events-none select-none bg-black/70 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col gap-3 min-w-[200px]"
        style={{ transform: 'translate3d(0,0,0)' }}
      >
        <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">Live Finance</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Total Cost (CT)</span>
            <span className="text-sm font-mono text-white font-bold flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-500" />
              {totalCost.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Net Profit</span>
            <span className={`text-sm font-mono font-bold flex items-center gap-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <Activity size={12} />
              {netProfit.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col col-span-2 pt-2 border-t border-white/5">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Break-Even Qty</span>
                <span className="text-xs font-mono text-slate-300 font-bold">{breakEvenQuantity} units</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-slate-500 uppercase">ROI</span>
                <span className={`text-xs font-mono font-bold flex items-center gap-1 ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <TrendingUp size={12} />
                  {roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Html>
  );
};
