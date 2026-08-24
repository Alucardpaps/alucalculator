'use client';

/**
 * Dedicated 1D Linear Cutting Optimizer
 * Route: /cutting-optimizer
 */

import React from 'react';
import dynamic from 'next/dynamic';

const CuttingOptimizerModule = dynamic<any>(
  () => import('@/components/modules/mechanical/CuttingOptimizerModule').then((m) => m.CuttingOptimizerModule),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#05080c]">
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

export default function CuttingOptimizerRootPage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#05080c] select-none">
      <CuttingOptimizerModule />
    </div>
  );
}
