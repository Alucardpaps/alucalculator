'use client';

import React from 'react';
import { useBackdrop, type BackdropId } from '@/lib/theme/backgroundPref';

/** CSS for each backdrop; all colours are theme tokens so every theme gets its own tint. */
export function backdropLayers(id: BackdropId): React.CSSProperties[] {
  const wash = 'radial-gradient(ellipse 90% 55% at 50% -15%, color-mix(in oklab, var(--cyan) 9%, transparent), transparent 60%)';
  switch (id) {
    case 'plain':
      return [];
    case 'dots':
      return [
        { backgroundImage: wash },
        { backgroundImage: 'radial-gradient(color-mix(in oklab, var(--line-strong) 70%, transparent) 1px, transparent 1.3px)', backgroundSize: '22px 22px', opacity: 0.55 },
      ];
    case 'blueprint':
      return [
        { backgroundImage: wash },
        {
          backgroundImage:
            'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          opacity: 0.22,
        },
        {
          backgroundImage:
            'linear-gradient(to right, var(--line-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--line-strong) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: 0.35,
        },
      ];
    case 'grid':
    default:
      return [
        { backgroundImage: wash },
        {
          backgroundImage:
            'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          opacity: 0.45,
        },
      ];
  }
}

/**
 * Quiet chassis backdrop: solid canvas + the pattern chosen in Settings → Appearance.
 */
export function AmbientBackground() {
  const id = useBackdrop();
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[var(--bg-0)] select-none" aria-hidden="true">
      {backdropLayers(id).map((st, i) => (
        <div key={i} className="absolute inset-0" style={st} />
      ))}
    </div>
  );
}

export default AmbientBackground;
