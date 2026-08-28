'use client';

import React from 'react';
import { AegisMascot, type AegisPose } from './AegisMascot';
import { AegisIcon } from './AegisIcon';

type Props = {
  size?: number;
  thinking?: boolean;
  hovered?: boolean;
  kind?: 'mascot' | 'icon';
  className?: string;
};

export function AegisAura({
  size = 46,
  thinking = false,
  hovered = false,
  kind = 'mascot',
  className = '',
}: Props) {
  const pose: AegisPose = thinking ? 'thinking' : hovered ? 'wave' : 'idle';
  const iconMode = thinking ? 'thinking' : hovered ? 'active' : 'idle';

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size + 18, height: size + 18 }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full border border-cyan-400/25 aegis-orbit" />
      <span
        className="pointer-events-none absolute inset-[5px] rounded-full border border-dashed border-cyan-300/30 aegis-orbit-rev"
        style={{ borderTopColor: 'rgba(0,229,255,0.7)' }}
      />
      <span
        className={`pointer-events-none absolute inset-[10px] rounded-full bg-cyan-400/15 blur-md aegis-bloom ${
          thinking ? 'opacity-90' : ''
        }`}
      />
      <span className="pointer-events-none absolute -inset-1 rounded-[22px] bg-cyan-500/10 blur-lg aegis-ring-pulse" />

      <div className="relative z-10 transition-transform duration-500 ease-out" style={{ transform: thinking ? 'scale(1.04)' : hovered ? 'scale(1.06)' : 'scale(1)' }}>
        {kind === 'icon' ? (
          <AegisIcon size={size} mode={iconMode} />
        ) : (
          <AegisMascot size={size} variant="face" pose={pose} isHovered={hovered} interactive={false} />
        )}
      </div>
    </div>
  );
}
