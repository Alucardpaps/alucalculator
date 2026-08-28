'use client';

/**
 * Unified 3D CAD & 2D Drafting Studio (Responsive Desktop & Mobile)
 * Client component for /design-studio
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Pencil, Sparkles, Wand2, ArrowRight } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useDesignStore } from '@/design-studio/designStore';
import { generateSolidFromPrompt } from '@/engines/cad/AegisGenerativeEngine';

const StudioLoadingFallback = ({ title, sub }: { title: string; sub: string }) => (
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[var(--bg-0)] px-4 text-center">
    <div className="max-w-md w-full p-6 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-2xl space-y-4">
      <div className="w-12 h-12 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 flex items-center justify-center mx-auto text-[var(--cyan)]">
        <Box className="w-6 h-6 animate-pulse" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[var(--ink)] tracking-tight uppercase font-mono">{title}</h2>
        <p className="text-xs text-[var(--alu-dim)] mt-1 font-mono">{sub}</p>
      </div>

      {/* Animated Loading Progress */}
      <div className="w-full bg-[var(--bg-2)] rounded-[var(--radius-s)] h-1.5 overflow-hidden border border-[var(--line)]">
        <div className="bg-[var(--cyan)] h-full w-2/3 animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--line)] text-[11px] font-mono text-[var(--alu)]">
        <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] flex flex-col items-center gap-1">
          <Box size={14} className="text-[var(--cyan)]" />
          <span>WebGL 3D</span>
        </div>
        <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] flex flex-col items-center gap-1">
          <Pencil size={14} className="text-[var(--std)]" />
          <span>2D Drafting</span>
        </div>
        <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] flex flex-col items-center gap-1">
          <Sparkles size={14} className="text-[var(--warn)]" />
          <span>Parametric</span>
        </div>
      </div>
    </div>
  </div>
);

// Desktop 3D Configurator
const DesktopDesignStudio = dynamic(
  () => import('@/design-studio/DesignStudio').then((m) => m.DesignStudio || m.default),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="Parametric Part Configurator (3D Preview)" sub="Initializing WebGL viewport, shaders & STL preview..." />,
  }
);

// Mobile 3D Configurator
const MobileDesignStudio = dynamic(
  () => import('@/design-studio/MobileDesignStudio').then((m) => m.MobileDesignStudio || m.default),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="Mobile 3D Part Configurator" sub="Optimizing touch viewport & 3D preview..." />,
  }
);

// Desktop 2D CAD
const DesktopAluCAD = dynamic(
  () => import('@/cad/components/AluCAD').then((m) => m.AluCAD || m.default),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="2D AluCAD Drafting Engine" sub="Loading parametric geometry constraints & DXF canvas..." />,
  }
);

// Mobile 2D CAD
const Mobile2DCad = dynamic(
  () => import('@/cad/components/Mobile2DCad').then((m) => m.Mobile2DCad || m.default),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="Mobile 2D CAD Drafting" sub="Setting up vector canvas & snap grid..." />,
  }
);

export function DesignStudioClient() {
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const [activeTab, setActiveTab] = useState<'3d' | '2d' | 'invent'>('3d');
  const [inventPrompt, setInventPrompt] = useState('');
  const [inventLoading, setInventLoading] = useState(false);

  const handleGenerateSolid = () => {
    if (!inventPrompt.trim()) return;
    setInventLoading(true);

    try {
      const generated = generateSolidFromPrompt(inventPrompt);
      const store = useDesignStore.getState();

      const newPartId = `solid-${Date.now().toString(36)}`;
      const newPart = {
        id: newPartId,
        name: generated.name,
        kind: generated.kind,
        params: generated.params,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: generated.color,
        visible: true,
        locked: false,
        parentId: null,
        holes: generated.holes || [],
      };

      store.pushHistory();
      useDesignStore.setState((s) => ({ parts: [...s.parts, newPart], selectedId: newPartId }));

      if (generated.holes && generated.holes.length > 0) {
        store.clearHoles();
        generated.holes.forEach((h) => store.addHole(h));
      }

      if (generated.materialId) {
        store.setSelectedMaterialId(generated.materialId);
      }

      setTimeout(() => {
        setInventLoading(false);
        setActiveTab('3d');
      }, 500);
    } catch (err) {
      console.error('Error generating 3D solid:', err);
      setInventLoading(false);
    }
  };

  return (
    <div className="w-full h-[calc(100dvh-3.5rem)] pb-16 sm:pb-0 flex flex-col overflow-hidden bg-[var(--bg-0)] select-none">
      {/* ─── Mode Switcher Header (3D / 2D / Invent) ─── */}
      <div className="flex-none flex items-center justify-center p-1.5 border-b border-[var(--line)] bg-[var(--bg-1)] z-30">
        <div className="flex items-center gap-1 p-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] text-xs font-bold transition-colors ${
              activeTab === '3d'
                ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Box size={13} />
            <span>3D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] text-xs font-bold transition-colors ${
              activeTab === '2d'
                ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Pencil size={13} />
            <span>2D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] text-xs font-bold transition-colors ${
              activeTab === 'invent'
                ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Sparkles size={13} className={activeTab === 'invent' ? 'text-[var(--bg-0)]' : 'text-[var(--cyan)]'} />
            <span>Invent</span>
          </button>
        </div>
      </div>

      {/* ─── Active Viewports (Responsive Switch) ─── */}
      <div className="flex-1 min-h-0 relative w-full">
        {/* 3D Tab */}
        {activeTab === '3d' && (
          <>
            {/* Mobile View */}
            <div className="sm:hidden w-full h-full">
              <MobileDesignStudio />
            </div>
            {/* Desktop View */}
            <div className="hidden sm:block w-full h-full">
              <DesktopDesignStudio embedded />
            </div>
          </>
        )}

        {/* 2D Tab */}
        {activeTab === '2d' && (
          <>
            {/* Mobile View */}
            <div className="sm:hidden w-full h-full">
              <Mobile2DCad onTransferTo3D={() => setActiveTab('3d')} />
            </div>
            {/* Desktop View */}
            <div className="hidden sm:block w-full h-full">
              <DesktopAluCAD />
            </div>
          </>
        )}

        {/* Invent AI Tab */}
        {activeTab === 'invent' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-0)] space-y-6 overflow-y-auto custom-scrollbar">
            <div className="w-14 h-14 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 flex items-center justify-center text-[var(--cyan)]">
              <Wand2 size={28} className="animate-pulse" />
            </div>

            <div className="max-w-lg space-y-2">
              <h2 className="text-lg font-mono font-bold text-[var(--ink)] flex items-center justify-center gap-2 uppercase">
                <span>{tr ? 'AeGiS Yapay Zeka CAD Üretici' : 'AeGiS Generative CAD Engine'}</span>
              </h2>
              <p className="text-xs text-[var(--alu-dim)] leading-relaxed font-sans">
                {tr
                  ? 'Doğal dilde istediğiniz her türlü mekanik parçayı tarif edin. Sistem ölçüleri, metrik delikleri, federleri ve malzemeyi otomatik çözümler ve 3D katı modelini oluşturur.'
                  : 'Describe any mechanical part in natural language. The engine calculates geometry, metric hole patterns, and material to synthesize a full 3D solid.'}
              </p>
            </div>

            <div className="w-full max-w-lg space-y-3 font-mono">
              <input
                type="text"
                value={inventPrompt}
                onChange={(e) => setInventPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inventPrompt.trim()) {
                    handleGenerateSolid();
                  }
                }}
                placeholder={tr ? 'Örn: 4 delikli M12 flanş, 50x50 L braket, Ø25x120 kamalı mil...' : 'e.g., 4-hole M12 flange, 50x50 L-bracket, Ø25x120 keyway shaft...'}
                className="w-full p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] text-[var(--ink)] text-xs placeholder-[var(--alu-dim)]/50 focus:outline-none focus:border-[var(--cyan)]"
              />

              {/* Quick Preset Prompts */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {[
                  { tr: '⭕ 4 Delikli M12 Flanş', en: '⭕ 4-Hole M12 Flange', prompt: '4 delikli M12 flanş' },
                  { tr: '📐 50x50 L-Braket', en: '📐 50x50 L-Bracket', prompt: '50x50 L braket' },
                  { tr: '⚡ Ø25x120 Kamalı Mil', en: '⚡ Ø25x120 Keyway Shaft', prompt: 'Ø25x120 kamalı transmisyon mili' },
                  { tr: '⚙️ 24 Dişli Çark', en: '⚙️ 24T Spur Gear', prompt: '24 dişli modül 2 düz dişli' },
                  { tr: '🔲 80x60 Delikli Plaka', en: '🔲 80x60 Hole Plate', prompt: '80x60x15 M6 delikli montaj plakası' },
                  { tr: '🔩 M10 Altıköşe Cıvata', en: '🔩 M10 Hex Bolt', prompt: 'M10 altıköşe cıvata' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInventPrompt(item.prompt);
                    }}
                    className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)] text-[10px] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] hover:border-[var(--cyan)]/30 transition-colors"
                  >
                    {tr ? item.tr : item.en}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateSolid}
                disabled={!inventPrompt.trim() || inventLoading}
                className="w-full py-3 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] text-[var(--bg-0)] hover:text-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                <Wand2 size={15} className={inventLoading ? 'animate-spin' : ''} />
                <span>{inventLoading ? (tr ? '3D Katı Model Çözümleniyor...' : 'Synthesizing 3D Solid...') : (tr ? '✨ 3D Katı Modeli Çiz & Aç' : '✨ Generate & Open 3D Solid')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignStudioClient;
