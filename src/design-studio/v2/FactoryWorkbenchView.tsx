'use client';

/**
 * 🏭 FACTORY WORKBENCH DIGITAL TWIN VIEW (V2)
 * Embeds the full industrial factory floor simulation within the 3D studio,
 * automatically fixturing the active 3D assembly onto the 5-axis CNC pallet.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { Factory, Cpu, Layers, CheckCircle2, Box } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useDesignStore } from '@/design-studio/designStore';

const FactorySimulation = dynamic(
  () => import('@/components/factory/FactorySimulation').then((m) => m.FactorySimulation),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-0)] p-6 space-y-3 font-mono">
        <div className="w-8 h-8 border-2 border-t-[var(--cyan)] border-white/10 rounded-full animate-spin" />
        <span className="text-xs text-[var(--cyan)] uppercase tracking-wider">
          Initializing 3D Factory Floor & Kinematics Engine...
        </span>
      </div>
    ),
  }
);

export function FactoryWorkbenchView() {
  const { language } = useI18nStore();
  const selected = useDesignStore((s) => s.getSelected());
  const parts = useDesignStore((s) => s.parts);

  const activePartName = selected ? selected.name : (parts[0]?.name || '3D Assembly Fixture');

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[var(--bg-0)]">
      {/* Factory Fixturing HUD Ribbon */}
      <div className="absolute top-2 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-0)]/90 border border-[var(--line)] shadow-lg font-mono text-[10px]">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <Factory size={13} />
          <span>PLANT FLOOR DIGITAL TWIN</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1 text-[var(--alu-dim)]">
          <span>Active Machining Part:</span>
          <strong className="text-white flex items-center gap-1">
            <Box size={11} className="text-cyan-400" />
            <span>{activePartName}</span>
          </strong>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
          DMG Mori 5-Axis #01 Fixtured
        </span>
      </div>

      {/* 3D Factory Simulation Viewport */}
      <div className="flex-1 w-full h-full">
        <FactorySimulation />
      </div>
    </div>
  );
}
