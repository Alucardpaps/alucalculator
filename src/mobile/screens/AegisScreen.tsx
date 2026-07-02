'use client';

import dynamic from 'next/dynamic';

const AICopilotOverlay = dynamic(
  () => import('@/components/copilot/AICopilotOverlay').then((m) => m.AICopilotOverlay),
  { ssr: false },
);

export function AegisScreen() {
  return <AICopilotOverlay embedded />;
}
