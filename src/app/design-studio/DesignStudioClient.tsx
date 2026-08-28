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
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#05080c] px-4 text-center">
    <div className="max-w-md w-full p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-2xl space-y-4">
      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
        <Box className="w-6 h-6 animate-pulse" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">{sub}</p>
      </div>

      {/* Animated Loading Progress */}
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full w-2/3 animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-slate-300">
        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
          <Box size={14} className="text-cyan-400" />
          <span>WebGL 3D</span>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
          <Pencil size={14} className="text-purple-400" />
          <span>2D Drafting</span>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
          <Sparkles size={14} className="text-amber-400" />
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
    <div className="w-full h-[calc(100dvh-3.5rem)] pb-16 sm:pb-0 flex flex-col overflow-hidden bg-[#05080c] select-none">
      {/* ─── Mode Switcher Header (3D / 2D / Invent) ─── */}
      <div className="flex-none flex items-center justify-center p-1.5 border-b border-white/10 bg-[#070b12] z-30 shadow-md">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/60 border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === '3d'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box size={14} />
            <span>3D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('2d')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === '2d'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pencil size={14} />
            <span>2D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invent')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'invent'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} className="text-cyan-300" />
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
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070b14] space-y-6 overflow-y-auto custom-scrollbar">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
              <Wand2 size={32} className="animate-pulse" />
            </div>

            <div className="max-w-lg space-y-2">
              <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                <span>{tr ? 'AeGiS Yapay Zeka CAD Üretici' : 'AeGiS Generative CAD Engine'}</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
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
                className="w-full p-4 rounded-2xl bg-black/80 border border-cyan-500/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
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
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10px] hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/30 transition-all"
                  >
                    {tr ? item.tr : item.en}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateSolid}
                disabled={!inventPrompt.trim() || inventLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Wand2 size={16} className={inventLoading ? 'animate-spin' : ''} />
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
