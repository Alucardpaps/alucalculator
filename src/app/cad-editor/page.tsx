'use client';

/**
 * Dedicated 2D AluCAD Drafting Page
 * Route: /cad-editor
 */

import React from 'react';
import dynamic from 'next/dynamic';

const AluCAD = dynamic(
  () => import('@/cad/components/AluCAD').then((m) => m.AluCAD),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#05080c]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            Loading 2D AluCAD Engine...
          </p>
        </div>
      </div>
    ),
  }
);

export default function CadEditorPage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#05080c] select-none">
      <AluCAD className="w-full h-full" />
    </div>
  );
}
