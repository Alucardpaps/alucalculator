'use client';

/**
 * Unified 3D CAD & 2D Drafting Studio (Responsive Desktop & Mobile)
 * Route: /design-studio
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Pencil, Sparkles, Wand2 } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

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

// Desktop 3D Studio
const DesktopDesignStudio = dynamic(
  () => import('@/design-studio/DesignStudio').then((m) => m.default),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="3D Parametric CAD Studio" sub="Initializing WebGL viewport, shaders & STL kernel..." />,
  }
);

// Mobile 3D Studio
const MobileDesignStudio = dynamic(
  () => import('@/design-studio/MobileDesignStudio').then((m) => m.MobileDesignStudio),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="Mobile 3D CAD Studio" sub="Optimizing touch viewport & assembly renderer..." />,
  }
);

// Desktop 2D CAD
const DesktopAluCAD = dynamic(
  () => import('@/cad/components/AluCAD').then((m) => m.AluCAD),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="2D AluCAD Drafting Engine" sub="Loading parametric geometry constraints & DXF canvas..." />,
  }
);

// Mobile 2D CAD
const Mobile2DCad = dynamic(
  () => import('@/cad/components/Mobile2DCad').then((m) => m.Mobile2DCad),
  {
    ssr: false,
    loading: () => <StudioLoadingFallback title="Mobile 2D CAD Drafting" sub="Setting up vector canvas & snap grid..." />,
  }
);

export default function DesignStudioPage() {
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const [activeTab, setActiveTab] = useState<'3d' | '2d' | 'invent'>('3d');
  const [inventPrompt, setInventPrompt] = useState('');
  const [inventLoading, setInventLoading] = useState(false);

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
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070b14] space-y-6 overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
              <Wand2 size={32} className="animate-pulse" />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-black text-white">
                {tr ? 'AeGiS Yapay Zeka CAD Üretici' : 'AeGiS Generative CAD Engine'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {tr
                  ? 'Doğal dilde istediğiniz mekanik parçayı tarif edin (Örn: "4 delikli M12 flanş" veya "50x50 L braket").'
                  : 'Describe the mechanical part in natural language (e.g. "4-hole M12 flange" or "50x50 L-bracket").'}
              </p>
            </div>

            <div className="w-full max-w-md space-y-3 font-mono">
              <input
                type="text"
                value={inventPrompt}
                onChange={(e) => setInventPrompt(e.target.value)}
                placeholder={tr ? 'Parça veya montaj tarif edin...' : 'Describe part or assembly...'}
                className="w-full p-3.5 rounded-2xl bg-black/80 border border-cyan-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />

              <button
                type="button"
                onClick={() => {
                  setInventLoading(true);
                  setTimeout(() => {
                    setInventLoading(false);
                    setActiveTab('3d');
                  }, 1200);
                }}
                disabled={!inventPrompt.trim() || inventLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-opacity"
              >
                {inventLoading ? (tr ? 'Model Üretiliyor...' : 'Generating 3D Solid...') : (tr ? '✨ 3D Katı Model Üret' : '✨ Generate 3D Solid')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
