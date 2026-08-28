'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { GraduationCap } from 'lucide-react';

const DuolingoMainCampus = dynamic(
  () => import('@/components/academy/duolingo/DuolingoMainCampus').then((m) => m.DuolingoMainCampus),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-[#030712]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 animate-pulse text-2xl">
            🦉
          </div>
          <p className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
            Loading AluDuolingo Academy…
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
        <DuolingoMainCampus />
      </Suspense>
    </div>
  );
}

export default AcademyClient;
