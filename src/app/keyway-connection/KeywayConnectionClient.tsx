'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { type MachiningHubTab } from '@/components/modules/mechanical/KeywayConnectionModule';

const KeywayConnectionModule = dynamic(
  () => import('@/components/modules/mechanical/KeywayConnectionModule'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--bg-0)]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

function KeywayConnectionContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as MachiningHubTab | null;
  const validTabs: MachiningHubTab[] = ['keyway', 'circlip', 'undercut', 'centerdrill', 'fasteners'];
  const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'keyway';

  const viewParam = searchParams.get('view') as 'transverse' | 'longitudinal' | 'machining' | null;
  const validViews = ['transverse', 'longitudinal', 'machining'];
  const view = viewParam && validViews.includes(viewParam) ? viewParam : 'transverse';

  return <KeywayConnectionModule initialTab={tab} initialKeywayView={view} />;
}

export function KeywayConnectionClient() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-[var(--bg-0)]" />}>
      <KeywayConnectionContent />
    </Suspense>
  );
}

export default KeywayConnectionClient;
