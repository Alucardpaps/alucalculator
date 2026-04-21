'use client';

/**
 * AluCalc OS v5.0 — BOM Panel
 *
 * Right sidebar showing real-time Bill of Materials.
 * Auto-updates from Zustand derived selectors.
 */

import { useMemo, useState } from 'react';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import type { ComponentType, WorkspaceComponent, BOMEntry, BOMSummary, StructureHealth, ValidationMessage } from '@/lib/types/v5-types';
import { QRModal } from './QRModal';

// ════════════════════════════════════════════
// Component Type Config
// ════════════════════════════════════════════

const TYPE_CONFIG: Record<ComponentType, { label: string; icon: string; color: string }> = {
  profile: { label: 'Profiles', icon: '▬', color: '#60a5fa' },
  bracket: { label: 'Brackets', icon: '⌐', color: '#a78bfa' },
  bolt: { label: 'Bolts', icon: '⏣', color: '#f472b6' },
};

// ════════════════════════════════════════════
// BOM Row
// ════════════════════════════════════════════

const BOMRow = ({
  type,
  count,
  weight,
  cost,
}: {
  type: ComponentType;
  count: number;
  weight: number;
  cost: number;
}) => {
  const config = TYPE_CONFIG[type];

  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg"
      style={{ background: `${config.color}08`, border: `1px solid ${config.color}15` }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold shrink-0"
        style={{ color: config.color, background: `${config.color}15` }}
      >
        {config.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white/80">{config.label}</div>
        <div className="text-[10px] text-white/35 font-mono mt-0.5">
          {weight.toFixed(2)} kg • ${cost.toFixed(2)}
        </div>
      </div>

      {/* Count badge */}
      <div
        className="text-sm font-black tabular-nums min-w-[28px] text-center"
        style={{ color: config.color }}
      >
        {count}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// Health Indicator
// ════════════════════════════════════════════

const HealthBar = () => {
  const components = useAssemblyStore((s) => s.components);

  const health = useMemo((): StructureHealth => {
    const comps = Object.values(components);
    if (comps.length === 0) return { isStable: true, warnings: [], errors: [], connectedRatio: 1 };

    const warnings: ValidationMessage[] = [];
    const errors: ValidationMessage[] = [];
    let connected = 0;

    for (const c of comps) {
      if (c.connections.length === 0) {
        warnings.push({ componentId: c.id, severity: 'warning', message: `${c.type} is floating` });
      } else {
        connected++;
      }
    }

    const ratio = comps.length > 0 ? connected / comps.length : 1;
    return { isStable: errors.length === 0 && ratio >= 0.5, warnings, errors, connectedRatio: ratio };
  }, [components]);

  const statusColor = health.isStable ? '#34d399' : '#f59e0b';
  const statusText = health.isStable ? 'Stable' : 'Unstable';
  const percentage = Math.round(health.connectedRatio * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
          Structure Health
        </span>
        <span
          className="text-[10px] font-bold font-mono"
          style={{ color: statusColor }}
        >
          {statusText}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${statusColor}80, ${statusColor})`,
          }}
        />
      </div>

      {/* Warnings */}
      {health.warnings.length > 0 && (
        <div className="space-y-1 mt-2">
          {health.warnings.slice(0, 3).map((w, i) => (
            <div
              key={i}
              className="text-[9px] font-mono text-amber-400/60 flex items-start gap-1.5"
            >
              <span className="text-amber-400 mt-0.5">⚠</span>
              <span className="leading-tight">{w.message}</span>
            </div>
          ))}
          {health.warnings.length > 3 && (
            <div className="text-[9px] font-mono text-white/25">
              +{health.warnings.length - 3} more warnings
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// Exported Component
// ════════════════════════════════════════════

export const BOMPanel = () => {
  const components = useAssemblyStore((s) => s.components);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const bom = useMemo((): BOMSummary => {
    const comps = Object.values(components);
    if (comps.length === 0) return { entries: [], totalComponents: 0, totalWeight: 0, totalCost: 0 };

    const map = new Map<ComponentType, BOMEntry>();
    for (const c of comps) {
      const e = map.get(c.type);
      if (e) {
        e.count += 1;
        e.totalWeight += c.metadata.weight ?? 0;
        e.totalCost += c.metadata.unitCost ?? 0;
      } else {
        map.set(c.type, { type: c.type, count: 1, totalWeight: c.metadata.weight ?? 0, totalCost: c.metadata.unitCost ?? 0 });
      }
    }
    const entries = Array.from(map.values());
    return {
      entries,
      totalComponents: comps.length,
      totalWeight: entries.reduce((s, e) => s + e.totalWeight, 0),
      totalCost: entries.reduce((s, e) => s + e.totalCost, 0),
    };
  }, [components]);

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0e14' }}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] font-mono">
          Bill of Materials
        </h2>
      </div>

      {/* BOM Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {bom.entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2 opacity-20">📦</div>
            <p className="text-[10px] text-white/25 font-mono">
              No components yet
            </p>
            <p className="text-[9px] text-white/15 font-mono mt-1">
              Add from the palette →
            </p>
          </div>
        ) : (
          bom.entries.map((entry) => (
            <BOMRow
              key={entry.type}
              type={entry.type}
              count={entry.count}
              weight={entry.totalWeight}
              cost={entry.totalCost}
            />
          ))
        )}
      </div>

      {/* Totals */}
      {bom.totalComponents > 0 && (
        <div
          className="px-4 py-3 border-t space-y-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Total row */}
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">
              Total
            </span>
            <div className="text-right">
              <span className="text-sm font-black text-white/80 tabular-nums">
                {bom.totalComponents}
              </span>
              <span className="text-[10px] text-white/30 ml-1 font-mono">parts</span>
            </div>
          </div>

          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/30">Weight</span>
            <span className="text-white/60 tabular-nums">{bom.totalWeight.toFixed(2)} kg</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/30">Est. Cost</span>
            <span className="text-emerald-400/70 tabular-nums">${bom.totalCost.toFixed(2)}</span>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Health */}
          <HealthBar />

          {/* Production QR Button */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="w-full mt-4 py-3 px-4 rounded-xl border border-[#66FCF1]/20 bg-[#66FCF1]/5 text-[#66FCF1] text-[9px] font-bold uppercase tracking-[0.2em] font-mono hover:bg-[#66FCF1]/10 hover:border-[#66FCF1]/40 transition-all group flex items-center justify-center gap-2"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
              <rect x="9" y="9" width="1" height="1" /><rect x="14" y="9" width="1" height="1" />
              <rect x="9" y="14" width="1" height="1" />
            </svg>
            Generate Production QR
          </button>

          <QRModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
            title="BOM_V50_EXPORT"
            data={{
              timestamp: new Date().toISOString(),
              summary: {
                parts: bom.totalComponents,
                weight: bom.totalWeight.toFixed(2),
                cost: bom.totalCost.toFixed(2)
              },
              entries: bom.entries.map(e => ({ type: e.type, count: e.count }))
            }}
          />
        </div>
      )}
    </div>
  );
};
