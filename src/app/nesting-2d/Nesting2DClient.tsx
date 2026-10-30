'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Nesting2D = dynamic(
  () => import('@/components/Nesting2D').then((m) => m.Nesting2D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            2D Nesting & CAM Motoru Yükleniyor...
          </p>
        </div>
      </div>
    ),
  }
);

export function Nesting2DClient() {
  return (
    <div className="w-full h-full overflow-hidden bg-[var(--bg-0)]">
      <Nesting2D />
    </div>
  );
}

export default Nesting2DClient;
