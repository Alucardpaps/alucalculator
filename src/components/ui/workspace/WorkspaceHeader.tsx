'use client';

/**
 * AluCalc OS v5.0 — Workspace Header
 *
 * Minimal top bar with snap controls, tool selector, and workspace actions.
 */

import { useCallback } from 'react';
import { useAssemblyStore, selectComponentCount } from '@/lib/store/assemblyStore';

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
    className="px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
    style={{
      background: isActive ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
      color: isActive ? '#00e5ff' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${isActive ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255,255,255,0.06)'}`,
    }}
    title={label}
  >
    <span className="mr-1">{icon}</span>
    {label}
  </button>
);

// ════════════════════════════════════════════
// Exported Component
// ════════════════════════════════════════════

export const WorkspaceHeader = () => {
  const toolMode = useAssemblyStore((s) => s.toolMode);
  const setToolMode = useAssemblyStore((s) => s.setToolMode);
  const snapEnabled = useAssemblyStore((s) => s.snapConfig.enabled);
  const setSnapEnabled = useAssemblyStore((s) => s.setSnapEnabled);
  const clearWorkspace = useAssemblyStore((s) => s.clearWorkspace);
  const componentCount = useAssemblyStore(selectComponentCount);

  const handleClear = useCallback(() => {
    if (componentCount === 0) return;
    if (window.confirm('Clear all components from workspace?')) {
      clearWorkspace();
    }
  }, [componentCount, clearWorkspace]);

  return (
    <div
      className="h-12 flex items-center px-4 gap-4 shrink-0"
      style={{
        background: 'rgba(10, 14, 20, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo / Title */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-[9px] font-black">AC</span>
        </div>
        <span className="text-xs font-bold text-white/70 tracking-wide">
          WORKSPACE
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Tool Selector */}
      <div className="flex items-center gap-1.5">
        <ToolButton
          label="Select"
          icon="⬚"
          isActive={toolMode === 'select'}
          onClick={() => setToolMode('select')}
        />
        <ToolButton
          label="Move"
          icon="✥"
          isActive={toolMode === 'move'}
          onClick={() => setToolMode('move')}
        />
        <ToolButton
          label="Connect"
          icon="⟗"
          isActive={toolMode === 'connect'}
          onClick={() => setToolMode('connect')}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Snap Toggle */}
      <button
        onClick={() => setSnapEnabled(!snapEnabled)}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
        style={{
          background: snapEnabled ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
          color: snapEnabled ? '#34d399' : 'rgba(255,255,255,0.3)',
          border: `1px solid ${snapEnabled ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <span className="text-sm">🧲</span>
        Snap {snapEnabled ? 'ON' : 'OFF'}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Component count */}
      <div className="text-[10px] font-mono text-white/25">
        {componentCount} {componentCount === 1 ? 'component' : 'components'}
      </div>

      {/* Clear */}
      <button
        onClick={handleClear}
        disabled={componentCount === 0}
        className="px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-20"
        style={{
          color: 'rgba(239, 68, 68, 0.6)',
          border: '1px solid rgba(239, 68, 68, 0.1)',
        }}
      >
        Clear
      </button>
    </div>
  );
};
