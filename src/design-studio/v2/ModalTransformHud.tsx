'use client';

/**
 * ⚡ BLENDER MODAL TRANSFORM HUD (CNC / INSTRUMENT STYLE)
 * 
 * Floating precision readout displayed during modal Grab (G), Rotate (R), or Scale (S).
 * Displays real-time axis lock, numeric entry buffer, units, and operator controls.
 */

import React from 'react';
import {
  Move,
  RotateCw,
  Maximize2,
  Check,
  X,
  CornerDownLeft,
  Lock,
} from 'lucide-react';
import type { ModalTransformState } from './modalTransformTypes';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface ModalTransformHudProps {
  state: ModalTransformState;
  onCommit: () => void;
  onCancel: () => void;
  onSelectAxis: (axis: 'x' | 'y' | 'z') => void;
}

export function ModalTransformHud({
  state,
  onCommit,
  onCancel,
  onSelectAxis,
}: ModalTransformHudProps) {
  const { language } = useI18nStore();

  if (!state.active || !state.mode) return null;

  // Unit and label by mode
  const modeInfo = {
    translate: {
      labelEn: 'MODAL GRAB / TRANSLATE',
      labelTr: 'MODAL TAŞIMA (GRAB)',
      icon: Move,
      unit: 'mm',
      color: 'var(--cyan)',
    },
    rotate: {
      labelEn: 'MODAL ROTATE',
      labelTr: 'MODAL DÖNDÜRME',
      icon: RotateCw,
      unit: '°',
      color: '#f59e0b',
    },
    scale: {
      labelEn: 'MODAL SCALE',
      labelTr: 'MODAL ÖLÇEKLEME',
      icon: Maximize2,
      unit: 'x',
      color: '#a855f7',
    },
  }[state.mode];

  const Icon = modeInfo.icon;

  // Determine current display value
  const displayVal = state.numericBuffer !== ''
    ? state.numericBuffer
    : state.mode === 'scale'
    ? state.currentDelta.toFixed(2)
    : (state.currentDelta >= 0 ? `+${state.currentDelta.toFixed(2)}` : state.currentDelta.toFixed(2));

  return (
    <div
      data-testid="modal-transform-hud"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 select-none pointer-events-auto"
      style={{
        filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.75))',
      }}
    >
      {/* Main Fluke / CNC Instrument Readout Bar */}
      <div
        className="flex items-center gap-3 px-3 py-1.5 rounded border bg-[var(--bg-0)] text-[var(--ink)] shadow-2xl"
        style={{
          borderColor: 'var(--line)',
          borderTopColor: modeInfo.color,
          borderTopWidth: '2px',
        }}
      >
        {/* Mode Icon & Title */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-[var(--line)]">
          <Icon className="w-4 h-4" style={{ color: modeInfo.color }} />
          <div className="flex flex-col">
            <span
              className="text-[10px] font-mono tracking-wider uppercase font-bold"
              style={{ color: modeInfo.color }}
            >
              {t12(language, modeInfo.labelEn, modeInfo.labelTr)}
            </span>
            <span className="text-[11px] font-mono text-[var(--alu)] truncate max-w-[140px]">
              {state.partName || 'Selected Part'}
            </span>
          </div>
        </div>

        {/* Axis Lock Badges */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-[var(--alu)] uppercase flex items-center gap-1 pr-1">
            <Lock className="w-3 h-3 text-[var(--alu)]" />
            {t12(language, 'Axis:', 'Eksen:')}
          </span>
          <button
            type="button"
            onClick={() => onSelectAxis('x')}
            className={`px-1.5 py-0.5 text-[11px] font-mono font-bold rounded transition-colors border ${
              state.axisLock === 'x'
                ? 'bg-[var(--bad)] text-white border-[var(--bad)]'
                : 'bg-[var(--bg-1)] text-[var(--alu)] border-[var(--line)] hover:border-[var(--bad)] hover:text-[var(--bad)]'
            }`}
            title="Lock to X axis [X]"
          >
            X
          </button>
          <button
            type="button"
            onClick={() => onSelectAxis('y')}
            className={`px-1.5 py-0.5 text-[11px] font-mono font-bold rounded transition-colors border ${
              state.axisLock === 'y'
                ? 'bg-[var(--ok)] text-white border-[var(--ok)]'
                : 'bg-[var(--bg-1)] text-[var(--alu)] border-[var(--line)] hover:border-[var(--ok)] hover:text-[var(--ok)]'
            }`}
            title="Lock to Y axis [Y]"
          >
            Y
          </button>
          <button
            type="button"
            onClick={() => onSelectAxis('z')}
            className={`px-1.5 py-0.5 text-[11px] font-mono font-bold rounded transition-colors border ${
              state.axisLock === 'z'
                ? 'bg-[var(--std)] text-white border-[var(--std)]'
                : 'bg-[var(--bg-1)] text-[var(--alu)] border-[var(--line)] hover:border-[var(--std)] hover:text-[var(--std)]'
            }`}
            title="Lock to Z axis [Z]"
          >
            Z
          </button>
          {state.axisLock && (state.axisLock === 'xy' || state.axisLock === 'xz' || state.axisLock === 'yz') && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded">
              {state.axisLock.toUpperCase()} PLANE
            </span>
          )}
        </div>

        {/* Digital Numeric Display (Fluke Multimeter / CNC DRO look) */}
        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-[var(--bg-1)] rounded border border-[var(--line)] min-w-[110px] justify-end">
          <span className="font-mono text-sm font-semibold tracking-wider text-[var(--cyan)]">
            {displayVal}
          </span>
          <span className="font-mono text-[11px] text-[var(--alu)] font-medium">
            {modeInfo.unit}
          </span>
          {state.numericBuffer !== '' && (
            <span className="w-1.5 h-3.5 bg-[var(--cyan)] animate-pulse inline-block ml-0.5" />
          )}
        </div>

        {/* Action Buttons: Confirm & Cancel */}
        <div className="flex items-center gap-1 pl-1">
          <button
            type="button"
            onClick={onCommit}
            className="flex items-center gap-1 px-2 py-1 bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ok)] border border-[var(--ok)]/50 rounded text-xs font-mono font-bold transition-colors"
            title="Confirm transform [Enter]"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase">{t12(language, 'Commit', 'Onayla')}</span>
            <span className="text-[9px] text-[var(--ok)]/70">[↵]</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-2 py-1 bg-[var(--bad)]/20 hover:bg-[var(--bad)]/30 text-[var(--bad)] border border-[var(--bad)]/50 rounded text-xs font-mono font-bold transition-colors"
            title="Cancel transform [Esc]"
          >
            <X className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase">{t12(language, 'Cancel', 'İptal')}</span>
            <span className="text-[9px] text-[var(--bad)]/70">[Esc]</span>
          </button>
        </div>
      </div>

      {/* Operator Shortcut Hint Legend */}
      <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--bg-0)]/90 border border-[var(--line)] text-[10px] font-mono text-[var(--alu)]">
        <span><strong className="text-[var(--ink)]">X / Y / Z:</strong> {t12(language, 'Lock Axis', 'Eksen Kilitle')}</span>
        <span>•</span>
        <span><strong className="text-[var(--ink)]">Shift+Z:</strong> {t12(language, 'XY Plane', 'XY Düzlem')}</span>
        <span>•</span>
        <span><strong className="text-[var(--ink)]">0-9:</strong> {t12(language, 'Type Value', 'Değer Gir')}</span>
        <span>•</span>
        <span><strong className="text-[var(--ink)]">Enter:</strong> {t12(language, 'Apply', 'Uygula')}</span>
        <span>•</span>
        <span><strong className="text-[var(--ink)]">Esc:</strong> {t12(language, 'Abort', 'Vazgeç')}</span>
      </div>
    </div>
  );
}
