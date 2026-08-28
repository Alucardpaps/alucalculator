'use client';

/**
 * Dedicated FEA Stress Simulator Client Component
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
              <span>FEA Linear Static v1</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">v1.0</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">Loading validated 3-template linear static solver & WebGL canvas...</p>
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

export function FeaClient() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#05080c] select-none">
      <SimulationFEAModule />
    </div>
  );
}

export default FeaClient;
