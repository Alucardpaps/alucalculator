'use client';

/**
 * Dedicated Parametric 3D CAD Page
 * Route: /parametric-cad
 */

import React from 'react';
import dynamic from 'next/dynamic';

const ParametricCadModule = dynamic(
  () => import('@/components/modules/parametric/ParametricCadModule').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#05080c]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            Loading Parametric 3D Modeler...
          </p>
        </div>
      </div>
    ),
  }
);

export default function ParametricCadPage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#05080c] select-none">
      <ParametricCadModule />
    </div>
  );
}
