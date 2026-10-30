'use client';

/**
 * Dedicated 1D Linear Cutting Optimizer Client Component
 * Route: /cutting-optimizer
 */

import React from 'react';
import dynamic from 'next/dynamic';

const CuttingOptimizerModule = dynamic<any>(
  () => import('@/components/modules/mechanical/CuttingOptimizerModule').then((m) => m.CuttingOptimizerModule),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            Loading Cut Optimizer...
          </p>
        </div>
      </div>
    ),
  }
);

export function CuttingOptimizerClient() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--bg-0)] select-none">
      <CuttingOptimizerModule />
    </div>
  );
}

export default CuttingOptimizerClient;
