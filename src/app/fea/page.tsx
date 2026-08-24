'use client';

/**
 * Dedicated FEA Stress Simulator
 * Route: /fea
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';

const SimulationFEAModule = dynamic(
  () => import('@/components/modules/mechanical/SimulationFEAModule').then((m) => m.SimulationFEAModule as any),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#05080c] px-4 text-center">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <span>3D Finite Element Analysis (FEA)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">BETA</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">Initializing WebGL stiffness solver & approximate mesh matrix...</p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-slate-300">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
              <Cpu size={14} className="text-cyan-400" />
              <span>von Mises</span>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
              <Activity size={14} className="text-emerald-400" />
              <span>Displacements</span>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
              <ShieldCheck size={14} className="text-purple-400" />
              <span>Safety Factor</span>
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export default function FeaRootPage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#05080c] select-none">
      <SimulationFEAModule />
    </div>
  );
}
