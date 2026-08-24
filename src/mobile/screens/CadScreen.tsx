'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Play, Plus, Layers, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { MobileStrings } from '@/locales/mobileTranslations';
import { getMobileStrings } from '@/locales/mobileTranslations';
import { useI18nStore } from '@/store/i18nStore';
import { useProjectStore } from '@/store/projectStore';

function CadLoading() {
  const lang = useI18nStore.getState().language;
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#080c12]">
      <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin" />
      <p className="sr-only">{getMobileStrings(lang).loading3D}</p>
    </div>
  );
}

const AssemblyScene = dynamic(
  () => import('@/components/scene/AssemblyScene').then((m) => ({ default: m.AssemblyScene })),
  { ssr: false, loading: () => <CadLoading /> },
);

const ComponentPalette = dynamic(
  () => import('@/components/ui/workspace/ComponentPalette').then((m) => m.ComponentPalette),
  { ssr: false },
);
const BOMPanel = dynamic(
  () => import('@/components/ui/workspace/BOMPanel').then((m) => m.BOMPanel),
  { ssr: false },
);

type Props = { m: MobileStrings };

export function CadScreen({ m }: Props) {
  const [isCadEngineActive, setIsCadEngineActive] = useState(false);
  const [isBomDrawerOpen, setIsBomDrawerOpen] = useState(false);
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const { items } = useProjectStore();

  return (
    <div className="absolute inset-0 top-0 bottom-0 flex flex-col overflow-hidden bg-black">
      {!isCadEngineActive ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Box size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-white text-md">{m.cadAssemblyTitle}</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{m.cadAssemblyDesc}</p>
          </div>
          <button
            onClick={() => setIsCadEngineActive(true)}
            className="px-8 py-3.5 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2"
          >
            <Play size={14} className="fill-black" />
            {m.start3D}
          </button>
        </div>
      ) : (
        <div className="flex-grow relative w-full h-full">
          <AssemblyScene />
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => setIsAddPartOpen(true)}
              className="p-3.5 rounded-xl bg-black/75 border border-cyan-500/30 text-cyan-400 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase"
            >
              <Plus size={14} />
              {m.addPartShort}
            </button>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsBomDrawerOpen(true)}
              className="p-3.5 rounded-xl bg-black/75 border border-cyan-500/30 text-cyan-400 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase"
            >
              <Layers size={14} />
              {m.bomTitle} ({items.length})
            </button>
          </div>
          <div className="absolute bottom-4 left-4 z-20 px-3 py-2 rounded-lg bg-black/60 border border-white/5 text-[9px] font-mono text-white/40 pointer-events-none">
            {m.cadControlsHelp}
          </div>
        </div>
      )}

      {isBomDrawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsBomDrawerOpen(false)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[65vh] bg-[#070b11] border-t border-cyan-950/80 rounded-t-[2.5rem] flex flex-col"
          >
            <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">{m.bomTitle} ({items.length})</h3>
              <button onClick={() => setIsBomDrawerOpen(false)} className="text-slate-500">
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <BOMPanel />
            </div>
          </motion.div>
        </>
      )}

      {isAddPartOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsAddPartOpen(false)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[60vh] bg-[#070b11] border-t border-cyan-950/80 rounded-t-[2.5rem] flex flex-col"
          >
            <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">{m.compTitle}</h3>
              <button onClick={() => setIsAddPartOpen(false)} className="text-slate-500">
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <ComponentPalette />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
