'use client';

import React from 'react';
import { AegisIcon } from './AegisIcon';
import type { AegisPose } from './AegisMascot';

type Props = {
  size?: number;
  thinking?: boolean;
  hovered?: boolean;
  kind?: 'mascot' | 'icon';
  className?: string;
};

export function AegisAura({
  size = 28,
  thinking = false,
  hovered = false,
  className = '',
}: Props) {
  const iconMode = thinking ? 'thinking' : hovered ? 'active' : 'idle';

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <AegisIcon size={size} mode={iconMode} pure />
    </div>
  );
}

export type { AegisPose };
