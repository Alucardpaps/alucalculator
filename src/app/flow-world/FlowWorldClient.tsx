'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const FlowWorld = dynamic(
  () => import('@/components/flow-world/FlowWorld').then((mod) => mod.FlowWorld),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)] text-cyan-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="tracking-widest">2D FİZİK DÜNYASI YÜKLENİYOR...</span>
        </div>
      </div>
    ),
  }
);

export function FlowWorldClient() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-[var(--bg-0)] overflow-hidden">
      <FlowWorld />
    </div>
  );
}

export default FlowWorldClient;
