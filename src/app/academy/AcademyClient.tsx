'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { GraduationCap } from 'lucide-react';

const AcademyMvpHub = dynamic(
  () => import('@/components/academy/AcademyMvpHub').then((m) => m.AcademyMvpHub),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-[#05080c]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 animate-pulse">
            <GraduationCap size={22} />
          </div>
          <p className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
            Loading Engineering Academy…
          </p>
        </div>
      </div>
    ),
  }
);

export function AcademyClient() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#030712] overflow-y-auto">
      <Suspense fallback={<div className="min-h-screen bg-[#030712]" />}>
        <AcademyMvpHub />
      </Suspense>
    </div>
  );
}

export default AcademyClient;
