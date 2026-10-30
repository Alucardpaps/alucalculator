'use client';

/**
 * AluCalculator OS — Flow Studio & Engineering Sandbox Client
 *
 * Provides a dual-mode engineering workstation:
 * 1. [Flow Graph Canvas] — Visual Node-RED / NX DAG pipeline with strict port typing.
 * 2. [Interactive Sandbox] — High-tier virtual test bench with live parameter sliders,
 *    SVG cross-section visualizer, beam deflection oscilloscope, and metallurgical gauges.
 *
 * Layer: app/flow (Next.js client view).
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass, Sliders, Beaker } from 'lucide-react';

const FlowCanvas = dynamic(
  () => import('@/components/flow/FlowCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full flex flex-col bg-[var(--bg-0)] font-mono text-xs overflow-hidden select-none">
        <div className="h-12 border-b border-[var(--line)] bg-[var(--bg-1)] px-4 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-[var(--cyan)] font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            <span>ENGINEERING FLOW ENGINE</span>
            <span className="text-[var(--line-strong)]">|</span>
            <span className="text-[var(--alu-dim)] font-normal">Node-RED / NX Visual Pipeline</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
            <span className="px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ok)]">
              DETERMINISTIC
            </span>
            <span>Initializing Engine…</span>
          </div>
        </div>
        <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] p-6">
          <div className="max-w-md w-full p-6 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-[var(--cyan)]">
              <div className="w-5 h-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
              <span className="font-bold tracking-wider uppercase text-xs">Loading Workspace</span>
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

const FlowSandbox = dynamic(
  () => import('@/components/flow/sandbox/FlowSandbox'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)] text-[var(--cyan)] font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING ENGINEERING SANDBOX INSTRUMENTS…</span>
        </div>
      </div>
    ),
  }
);

export function FlowClient() {
  const [viewMode, setViewMode] = useState<'canvas' | 'sandbox'>('canvas');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'sandbox') {
        setViewMode('sandbox');
      }
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-0)] overflow-hidden">
      {/* Studio Global Mode Switcher Bar */}
      <div className="h-9 border-b border-[var(--line)] bg-[var(--bg-0)] px-4 flex items-center justify-between text-xs select-none shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-s)] font-mono text-[11px] font-bold transition-all ${
              viewMode === 'canvas'
                ? 'bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--line)] '
                : 'text-[var(--alu-dim)] hover:text-[var(--alu)]'
            }`}
          >
            <Compass size={13} />
            <span>NODE GRAPH CANVAS</span>
          </button>

          <button
            onClick={() => setViewMode('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-s)] font-mono text-[11px] font-bold transition-all ${
              viewMode === 'sandbox'
                ? 'bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--line)] '
                : 'text-[var(--alu-dim)] hover:text-[var(--alu)]'
            }`}
          >
            <Sliders size={13} />
            <span>INTERACTIVE SANDBOX</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--alu-dim)]">
          <span className="flex items-center gap-1 text-[var(--ok)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
            <span>70+ DETERMINISTIC NODES</span>
          </span>
          <span className="text-[var(--line)]">|</span>
          <span className="hidden sm:inline">ISO/DIN/EN FORMULA CITATIONS</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'canvas' ? (
          <FlowCanvas className="w-full h-full" />
        ) : (
          <FlowSandbox onSwitchToCanvas={() => setViewMode('canvas')} />
        )}
      </div>
    </div>
  );
}

export default FlowClient;
