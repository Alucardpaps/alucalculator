'use client';

/**
 * AluCalc OS v5.0 — Workspace Header
 *
 * Minimal top bar with snap controls, tool selector, and workspace actions.
 */

import { useCallback } from 'react';
import Link from 'next/link';
import { useAssemblyStore, selectComponentCount } from '@/lib/store/assemblyStore';
import { useI18nStore } from '@/store/i18nStore';
import { UI_TRANSLATIONS } from '@/locales/uiTranslations';
import { useCopilotStore } from '@/store/copilotStore';
import { AegisIcon } from '@/components/copilot/AegisIcon';

// ════════════════════════════════════════════
// Tool Button
// ════════════════════════════════════════════

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
    className="px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center"
    style={{
      background: isActive ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
      color: isActive ? '#00e5ff' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${isActive ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255,255,255,0.06)'}`,
    }}
    title={label}
  >
    <span className="md:mr-1">{icon}</span>
    <span className="hidden md:inline">{label}</span>
  </button>
);

// ════════════════════════════════════════════
// Exported Component
// ════════════════════════════════════════════

import { useWorkspaceTabStore, WorkspaceTab } from '@/lib/store/workspaceTabStore';

const TabButton = ({
  id,
  label,
  icon,
  active,
  onClick,
}: {
  id: WorkspaceTab;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
    style={{
      background: active ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
      color: active ? '#00e5ff' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${active ? 'rgba(0, 229, 255, 0.2)' : 'transparent'}`,
    }}
  >
    <span>{icon}</span>
    <span className="hidden lg:inline">{label}</span>
  </button>
);

// ════════════════════════════════════════════
// Exported Component
// ════════════════════════════════════════════

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
    if (window.confirm(ui.clearWorkspacePrompt)) {
      clearWorkspace();
    }
  }, [componentCount, clearWorkspace, ui.clearWorkspacePrompt]);

  return (
    <div
      className="h-12 flex items-center px-4 gap-2 md:gap-4 shrink-0 relative z-50 overflow-x-auto no-scrollbar"
      style={{
        background: 'rgba(10, 14, 20, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo / Title */}
      <a href="/" className="flex items-center gap-2 mr-2 md:mr-4 hover:opacity-80 transition-opacity shrink-0">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-[9px] font-black">AC</span>
        </div>
        <span className="text-xs font-bold text-white/70 tracking-wide hidden xs:inline">
          {ui.workspaceLabel}
        </span>
      </a>

      {/* Divider */}
      <div className="w-px h-6 shrink-0 hidden xs:block" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Workspace Tabs */}
      <div className="flex items-center bg-white/[0.02] border border-white/5 rounded-lg p-0.5 gap-0.5 overflow-x-auto no-scrollbar max-w-[130px] xs:max-w-[200px] sm:max-w-none shrink-0">
        <TabButton id="3d-assembly" label="3D Assembly" icon="🧊" active={activeTab === '3d-assembly'} onClick={() => setActiveTab('3d-assembly')} />
        <TabButton id="machine-assembly" label="Machine Builder" icon="🤖" active={activeTab === 'machine-assembly'} onClick={() => setActiveTab('machine-assembly')} />
        <TabButton id="cad-editor" label="CAD Editor" icon="📐" active={activeTab === 'cad-editor'} onClick={() => setActiveTab('cad-editor')} />
        <TabButton id="sketch-pad" label="Sketch Pad" icon="📝" active={activeTab === 'sketch-pad'} onClick={() => setActiveTab('sketch-pad')} />
        <TabButton id="simulation-fea" label="FEA Simulator" icon="⚡" active={activeTab === 'simulation-fea'} onClick={() => setActiveTab('simulation-fea')} />
        <TabButton id="nesting-2d" label="2D Nesting" icon="🔲" active={activeTab === 'nesting-2d'} onClick={() => setActiveTab('nesting-2d')} />
        <TabButton id="cutting-optimizer" label="Cut Optimizer" icon="📏" active={activeTab === 'cutting-optimizer'} onClick={() => setActiveTab('cutting-optimizer')} />
      </div>

      {/* 3D Assembly Specific Toolbar */}
      {activeTab === '3d-assembly' && (
        <>
          {/* Divider */}
          <div className="w-px h-6 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Tool Selector */}
          <div className="flex items-center gap-1 shrink-0">
            <ToolButton
              label={ui.selectTool}
              icon="⬚"
              isActive={toolMode === 'select'}
              onClick={() => setToolMode('select')}
            />
            <ToolButton
              label={ui.translateTool}
              icon="✥"
              isActive={toolMode === 'translate'}
              onClick={() => setToolMode('translate')}
            />
            <ToolButton
              label={ui.rotateTool}
              icon="↻"
              isActive={toolMode === 'rotate'}
              onClick={() => setToolMode('rotate')}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-6 shrink-0 hidden sm:block" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Snap Toggle */}
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
            style={{
              background: snapEnabled ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
              color: snapEnabled ? '#34d399' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${snapEnabled ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <span className="text-sm">🧲</span>
            <span className="hidden sm:inline">{snapEnabled ? ui.snapOn : ui.snapOff}</span>
          </button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-[8px]" />

      {/* Component count */}
      {activeTab === '3d-assembly' && (
        <div className="text-[10px] font-mono text-white/25 shrink-0 hidden sm:block">
          {componentCount} {componentCount === 1 ? ui.componentLabel : ui.componentsLabel}
        </div>
      )}

      {/* AeGiS Toggle Button */}
      <button
        onClick={() => useCopilotStore.getState().setIsOpen(!useCopilotStore.getState().isOpen)}
        className="flex items-center gap-1 px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
        style={{
          background: 'rgba(0, 229, 255, 0.06)',
          color: '#00e5ff',
          border: '1px solid rgba(0, 229, 255, 0.18)',
          boxShadow: '0 0 12px rgba(0,229,255,0.08)',
        }}
        title="Toggle AeGiS (Alt+C)"
      >
        <AegisIcon size={16} mode="idle" />
        <span className="hidden xs:inline">AeGiS</span>
      </button>

      {/* Clear */}
      {activeTab === '3d-assembly' && (
        <button
          onClick={handleClear}
          disabled={componentCount === 0}
          className="px-2 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-20 cursor-pointer shrink-0"
          style={{
            color: 'rgba(239, 68, 68, 0.6)',
            border: '1px solid rgba(239, 68, 68, 0.1)',
          }}
        >
          <span className="hidden sm:inline">{ui.clearWorkspaceBtn}</span>
          <span className="sm:hidden">❌</span>
        </button>
      )}
    </div>
  );
};
