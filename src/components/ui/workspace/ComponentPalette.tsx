'use client';

/**
 * AluCalc OS v5.0 — Component Palette
 *
 * Left sidebar with draggable component cards.
 * Click to add a component to the workspace center.
 */

import { useCallback } from 'react';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import type { ComponentType, Vec3 } from '@/lib/types/v5-types';

// ════════════════════════════════════════════
// Component Definitions
// ════════════════════════════════════════════

interface PaletteItem {
  type: ComponentType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'profile',
    label: 'Profile',
    description: 'Aluminum extrusion',
    icon: '▬',
    color: '#60a5fa',
  },
  {
    type: 'bracket',
    label: 'Bracket',
    description: 'L-shaped connector',
    icon: '⌐',
    color: '#a78bfa',
  },
  {
    type: 'bolt',
    label: 'Bolt',
    description: 'Hex head fastener',
    icon: '⏣',
    color: '#f472b6',
  },
];

// ════════════════════════════════════════════
// Palette Card
// ════════════════════════════════════════════

const PaletteCard = ({ item }: { item: PaletteItem }) => {
  const addComponent = useAssemblyStore((s) => s.addComponent);

  const handleClick = useCallback(() => {
    // Add at a slightly randomized position so components don't stack
    const offset: Vec3 = [
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2,
    ];
    addComponent(item.type, offset);
  }, [addComponent, item.type]);

  return (
    <button
      onClick={handleClick}
      className="group w-full p-3 rounded-lg border transition-all duration-200 text-left"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${item.color}10`;
        e.currentTarget.style.borderColor = `${item.color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold shrink-0"
          style={{
            background: `${item.color}15`,
            color: item.color,
            border: `1px solid ${item.color}30`,
          }}
        >
          {item.icon}
        </div>

        {/* Text */}
        <div className="min-w-0">
          <div className="text-xs font-bold text-white/90 tracking-wide uppercase">
            {item.label}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5 font-mono">
            {item.description}
          </div>
        </div>
      </div>

      {/* Add indicator */}
      <div
        className="mt-2 text-center text-[9px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: item.color }}
      >
        + Click to Add
      </div>
    </button>
  );
};

// ════════════════════════════════════════════
// Exported Component
// ════════════════════════════════════════════

export const ComponentPalette = () => {
  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0e14' }}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] font-mono">
          Components
        </h2>
      </div>

      {/* Palette Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {PALETTE_ITEMS.map((item) => (
          <PaletteCard key={item.type} item={item} />
        ))}
      </div>

      {/* Footer hint */}
      <div
        className="px-4 py-3 border-t text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <span className="text-[9px] text-white/25 font-mono">
          Click to add • Drag in scene to move
        </span>
      </div>
    </div>
  );
};
