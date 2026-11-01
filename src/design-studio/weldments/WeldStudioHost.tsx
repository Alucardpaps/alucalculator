'use client';

/**
 * 🧑‍🏭 WELD STUDIO HOST
 * Bridges the WeldStudio into the 3D studio scene.
 */

import React from 'react';
import { WeldStudio } from './WeldStudio';
import { useDesignStore } from '../designStore';

export function WeldStudioHost({ onClose }: { onClose: () => void }) {
  const ds = useDesignStore();

  return (
    <WeldStudio
      onClose={() => {
        ds.setWeldStudioOpen(false);
        ds.setCadMode('assembly');
        onClose();
      }}
      onSendToAssembly={() => {
        ds.setWeldStudioOpen(false);
        ds.setCadMode('assembly');
        onClose();
      }}
    />
  );
}

export default WeldStudioHost;
