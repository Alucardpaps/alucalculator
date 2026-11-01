'use client';

import React from 'react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { SafetyMarginBarProps } from './types';
import { formatEngineeringValue, useGlobalPrecision } from './precisionUtils';

export const SafetyMarginBar: React.FC<SafetyMarginBarProps> = ({
  metric,
  showDetails = true,
  onFocusClick,
  className = '',
  demandLabel,
  capacityLabel,
  precision,
}) => {
  const { language } = useI18nStore();
  const globalPrecision = useGlobalPrecision();
  const activePrecision = precision ?? globalPrecision;

  const { name, symbol, demand, capacity, unit, utilization, standardCitation, isCritical } =
    metric;

  const validUtilization = !isNaN(utilization) && isFinite(utilization) ? utilization : 0;
  const percentage = validUtilization * 100;

  // Color & pattern decision based on Eurocode/FEA limit state criteria
  const isPass = validUtilization <= 0.8;
  const isWarn = validUtilization > 0.8 && validUtilization <= 1.0;
  const isFail = validUtilization > 1.0;

  const barColor = isPass
    ? 'bg-[var(--ok)]'
    : isWarn
    ? 'bg-[var(--warn)]'
    : 'bg-[var(--bad)]';

  const barGlow = isPass
    ? ''
    : isWarn
    ? ''
    : '';

  // Cap bar width display at 100%
  const displayWidth = Math.min(100, Math.max(0, percentage));

  return (
    <div
      onClick={onFocusClick}
      className={`rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3 space-y-2 transition-all ${
        onFocusClick ? 'cursor-pointer hover:border-[var(--cyan)]/50 hover:bg-[var(--bg-2)]' : ''
      } ${isCritical ? 'ring-1 ring-[var(--warn)]/30' : ''} ${className}`}
    >
      {/* Title & Standard Citation Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-[var(--alu)]">
          {isCritical && (
            <span
              className="w-2 h-2 rounded-full bg-[var(--warn)] animate-pulse"
              title={t12(language, 'Most critical limit state', 'En kritik sınır durumu')}
            />
          )}
          <span>{name}</span>
          {symbol && <span className="font-mono text-[11px] text-[var(--alu-dim)]">({symbol})</span>}
        </div>

        <div className="flex items-center gap-2">
          {standardCitation && (
            <span className="font-mono text-[10px] text-[var(--std)] bg-[var(--std)]/10 px-1.5 py-0.5 rounded border border-[var(--std)]/20">
              {standardCitation}
            </span>
          )}
          <span
            className={`font-mono text-xs font-bold ${
              isPass ? 'text-[var(--ok)]' : isWarn ? 'text-[var(--warn)]' : 'text-[var(--bad)]'
            }`}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Capacity Utilization Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--bg-2)] border border-[var(--line)]">
        {/* 80% and 100% safety markers */}
        <div
          className="absolute top-0 bottom-0 left-[80%] w-[1px] bg-white/20 z-10"
          title={t12(language, 'Safety threshold limit (80%)', 'Güvenli eşik sınırı (80%)')}
        />
        <div
          className="absolute top-0 bottom-0 left-[100%] w-[1px] bg-[var(--bad)]/50 z-10"
          title={t12(language, 'Capacity limit (100%)', 'Kapasite sınırı (100%)')}
        />

        {/* Progress Fill */}
        <div
          className={`h-full transition-all duration-300 rounded-full ${barColor} ${barGlow} ${
            isFail
              ? 'bg-[repeating-linear-gradient(45deg,#e85d5d,#e85d5d_6px,#b91c1c_6px,#b91c1c_12px)]'
              : ''
          }`}
          style={{ width: `${displayWidth}%` }}
        />
      </div>

      {/* Demand vs Capacity Detail Readout */}
      {showDetails && (
        <div className="flex items-center justify-between font-mono text-[11px] text-[var(--alu-dim)] pt-0.5">
          <div>
            <span>{demandLabel ?? t12(language, 'Demand: ', 'Talep: ')}</span>
            <span className="text-[var(--ink)] font-semibold">
              {formatEngineeringValue(demand, activePrecision, true)}
            </span>
            <span> {unit}</span>
          </div>

          <div>
            <span>{capacityLabel ?? t12(language, 'Capacity: ', 'Kapasite: ')}</span>
            <span className="text-[var(--ink)] font-semibold">
              {formatEngineeringValue(capacity, activePrecision, true)}
            </span>
            <span> {unit}</span>
          </div>
        </div>
      )}
    </div>
  );
};
