'use client';

/**
 * Client Page wrapper for 3D Factory Simulation
 */

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Cpu, Box } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

const FactorySimulation = dynamic(
  () => import('@/components/factory/FactorySimulation').then((m) => m.FactorySimulation),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-0)] p-6 space-y-3 font-mono">
        <div className="w-10 h-10 border-2 border-t-[var(--cyan)] border-white/10 rounded-full animate-spin" />
        <span className="text-xs text-[var(--cyan)] uppercase tracking-wider">
          Initializing 3D Factory Floor & Kinematics Engine...
        </span>
      </div>
    ),
  }
);

export function FactoryClient() {
  const { language } = useI18nStore();

  return (
    <div className="w-full h-[calc(100dvh-3.5rem)] flex flex-col bg-[var(--bg-0)] overflow-hidden">
      {/* Breadcrumb Navigation Header */}
      <div className="flex-none flex items-center justify-between px-4 py-1.5 bg-[var(--bg-1)] border-b border-[var(--line)] font-mono text-xs z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-[var(--alu-dim)] hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>{t12(language, 'Command Center', 'Komuta Merkezi')}</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Cpu size={13} className="text-[var(--cyan)]" />
            <span>{t12(language, 'Factory Digital Twin Simulation', 'Fabrika Dijital İkiz Simülasyonu')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/design-studio"
            className="px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[10px] text-[var(--alu-dim)] hover:text-white transition-colors flex items-center gap-1"
          >
            <Box size={11} className="text-[var(--cyan)]" />
            <span>3D CAD Studio</span>
          </Link>
        </div>
      </div>

      {/* 3D Viewport Content */}
      <div className="flex-1 min-h-0 relative">
        <FactorySimulation />
      </div>
    </div>
  );
}

export default FactoryClient;
