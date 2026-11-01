'use client';

/**
 * AluCAD OS v5.0 — Workspace Header
 *
 * Minimal top bar with snap controls, tool selector, workspace tabs, and actions.
 */

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useAssemblyStore, selectComponentCount } from '@/lib/store/assemblyStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { UI_TRANSLATIONS } from '@/locales/uiTranslations';
import { useCopilotStore } from '@/store/copilotStore';
import { AegisIcon } from '@/components/copilot/AegisIcon';
import { useWorkspaceTabStore, WorkspaceTab } from '@/lib/store/workspaceTabStore';
import {
  Columns2, PenTool, Box, Cog, Zap, Pencil, Grid3X3, Scissors,
  Wrench, Activity, Magnet, Trash2
} from 'lucide-react';

const ToolButton = ({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center"
    style={{
      background: isActive ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
      color: isActive ? '#00e5ff' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${isActive ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255,255,255,0.06)'}`,
    }}
    title={label}
  >
    <span className="sm:mr-1">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const TabButton = ({
  id,
  label,
  Icon,
  active,
  onClick,
}: {
  id: WorkspaceTab;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
      active
        ? 'bg-[var(--std)]/20 text-[var(--std)] border border-[var(--std)]/40 shadow-sm'
        : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
    title={label}
  >
    <Icon size={13} className={active ? 'text-[var(--std)]' : 'text-white/40'} />
    <span className="hidden md:inline">{label}</span>
  </button>
);

export const WorkspaceHeader = () => {
  const { language } = useI18nStore();
  const ui = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const toolMode = useAssemblyStore((s) => s.toolMode);
  const setToolMode = useAssemblyStore((s) => s.setToolMode);
  const snapEnabled = useAssemblyStore((s) => s.snapConfig.enabled);
  const setSnapEnabled = useAssemblyStore((s) => s.setSnapEnabled);
  const clearWorkspace = useAssemblyStore((s) => s.clearWorkspace);
  const componentCount = useAssemblyStore(selectComponentCount);
  const { activeTab, setActiveTab } = useWorkspaceTabStore();

  const handleClear = useCallback(() => {
    if (componentCount === 0) return;
    if (window.confirm(ui.clearWorkspacePrompt || t12(language, 'Are you sure you want to clear the entire workspace?', 'Tüm çalışma alanını temizlemek istediğinizden emin misiniz?'))) {
      clearWorkspace();
    }
  }, [componentCount, clearWorkspace, ui.clearWorkspacePrompt, language]);

  return (
    <div
      className="h-12 flex items-center px-2 sm:px-3 md:px-4 gap-1.5 sm:gap-2 md:gap-3 shrink-0 relative z-50 overflow-x-auto no-scrollbar bg-[var(--bg-1)]/95 border-b border-white/[0.07]"
    >
      {/* Logo / Title */}
      <Link href="/" className="flex items-center gap-2 mr-0.5 hover:opacity-90 transition-opacity shrink-0" title="Home">
        <img src="/icons/icon-72.png" alt="" width="28" height="28" className="h-7 w-7 rounded-md border border-white/10" />
        <div className="hidden sm:flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-tight text-white">AluCAD OS</span>
          <span className="text-[8px] font-medium tracking-wide text-white/35 mt-0.5">Workspace</span>
        </div>
      </Link>

      <div className="w-px h-6 shrink-0 hidden sm:block bg-white/10" />

      {/* Workspace Tabs - Matching out/workspace 1:1 */}
      <div className="flex items-center bg-white/[0.02] border border-white/5 rounded-lg p-0.5 gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
        <TabButton id="design-studio" label={t12(language, 'Design Studio', 'Tasarım Stüdyosu')} Icon={Box} active={activeTab === 'design-studio'} onClick={() => setActiveTab('design-studio')} />
        <TabButton id="cad-editor" label={t12(language, 'CAD Editor', 'CAD Editörü')} Icon={PenTool} active={activeTab === 'cad-editor'} onClick={() => setActiveTab('cad-editor')} />
        <TabButton id="sketch-pad" label={t12(language, 'Sketch Pad', 'Eskiz Defteri')} Icon={Pencil} active={activeTab === 'sketch-pad'} onClick={() => setActiveTab('sketch-pad')} />
        <TabButton id="simulation-fea" label={t12(language, 'FEA Simulator', 'FEA Simülatörü')} Icon={Zap} active={activeTab === 'simulation-fea'} onClick={() => setActiveTab('simulation-fea')} />
        <TabButton id="nesting-2d" label={t12(language, '2D Nesting', '2D Yerleşim')} Icon={Grid3X3} active={activeTab === 'nesting-2d'} onClick={() => setActiveTab('nesting-2d')} />
        <TabButton id="cutting-optimizer" label={t12(language, 'Cut Optimizer', 'Kesim Optimizasyonu')} Icon={Scissors} active={activeTab === 'cutting-optimizer'} onClick={() => setActiveTab('cutting-optimizer')} />
      </div>

      {/* Navigation Quick Links */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Link href="/" className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all hidden md:flex" title={t12(language, 'Home', 'Ana Sayfa')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </Link>
        <Link href="/bolt-torque/" className="p-1.5 rounded-lg text-white/30 hover:text-[var(--std)] hover:bg-[var(--std)]/10 transition-all hidden md:flex" title={t12(language, 'Engineering Calculators', 'Mühendislik Hesaplayıcıları')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
        </Link>
        <Link href="/academy/" className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all hidden lg:flex" title={t12(language, 'Academy Guides', 'Akademi Kılavuzları')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
        </Link>
      </div>

      {/* Right Controls: AeGiS & Clear */}
      <div className="flex items-center gap-1.5 shrink-0 ml-1">
        {(activeTab === 'design-studio' || activeTab === '3d-assembly') && componentCount > 0 && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all"
            title={t12(language, 'Clear Workspace', 'Temizle')}
          >
            <Trash2 size={13} />
          </button>
        )}

        <button
          type="button"
          onClick={() => useCopilotStore.getState().setIsOpen(!useCopilotStore.getState().isOpen)}
          className="relative z-[60] pointer-events-auto flex items-center gap-1 px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: 'rgba(107, 159, 255, 0.14)', color: 'var(--std)', border: '1px solid rgba(107, 159, 255, 0.32)' }}
          title={t12(language, 'AeGiS engineering assistant (Alt+C)', 'AeGiS mühendislik asistanı (Alt+C)')}
        >
          <AegisIcon size={16} mode="idle" />
          <span className="hidden sm:inline">AeGiS</span>
          <span className="hidden lg:inline text-[8px] font-normal opacity-60 normal-case tracking-normal">AI</span>
        </button>
      </div>
    </div>
  );
};
