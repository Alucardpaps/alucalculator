'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const FitsTolerancesModule = dynamic(
  () => import('@/components/modules/mechanical/FitsTolerancesModule'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[500px] flex items-center justify-center bg-[var(--bg-0)]">
        <div className="text-center space-y-3 font-mono">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-cyan-400/70 uppercase tracking-widest">Loading ISO 286 Engine...</p>
        </div>
      </div>
    ),
  }
);

function FitsClientContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const isPress = tabParam === 'press' || tabParam === 'press-fit';

  return <FitsTolerancesModule initialTab={isPress ? 'press-fit' : 'fits'} initialPreset="H7/h6" />;
}

export function FitsClient() {
  return (
    <Suspense fallback={<div className="w-full min-h-[500px] bg-[var(--bg-0)]" />}>
      <FitsClientContent />
    </Suspense>
  );
}

export default FitsClient;
