'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SmartInputFieldProps, UnitOption } from './types';
import { formatEngineeringValue, evaluateArithmeticExpression, useGlobalPrecision } from './precisionUtils';

export const SmartInputField: React.FC<SmartInputFieldProps> = ({
  id,
  label,
  sublabel,
  valueSi,
  onChangeSi,
  units,
  defaultUnitSymbol,
  min,
  max,
  step,
  maxDecimals,
  disabled = false,
  onFocusFieldId,
  onBlurFieldId,
  className = '',
  tooltip,
  required = false,
}) => {
  const globalPrecision = useGlobalPrecision();
  const effectiveMaxDecimals = maxDecimals !== undefined ? maxDecimals : globalPrecision;

  // Resolve current active unit
  const [selectedUnit, setSelectedUnit] = useState<UnitOption>(() => {
    if (defaultUnitSymbol) {
      const match = units.find((u) => u.symbol === defaultUnitSymbol);
      if (match) return match;
    }
    return units[0] || { label: 'Unit', symbol: '', toSiRatio: 1 };
  });

  // Calculate formatted display value from canonical SI
  const getFormattedValue = useCallback(
    (siVal: number, unit: UnitOption) => {
      const displayVal = siVal / unit.toSiRatio;
      const dec = unit.decimals !== undefined ? unit.decimals : effectiveMaxDecimals;
      return formatEngineeringValue(displayVal, dec);
    },
    [effectiveMaxDecimals]
  );

  const [displayStr, setDisplayStr] = useState<string>(() => getFormattedValue(valueSi, selectedUnit));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display string when external valueSi changes and user is not editing
  useEffect(() => {
    if (!isFocused) {
      setDisplayStr(getFormattedValue(valueSi, selectedUnit));
      setError(null);
    }
  }, [valueSi, selectedUnit, isFocused, getFormattedValue]);

  // Handle unit selection change — scales display number automatically without altering SI truth
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSymbol = e.target.value;
    const nextUnit = units.find((u) => u.symbol === nextSymbol);
    if (!nextUnit) return;

    setSelectedUnit(nextUnit);
    setDisplayStr(getFormattedValue(valueSi, nextUnit));
    setError(null);
  };

  // Commit text input: evaluate inline arithmetic and clamp
  const commitValue = () => {
    const trimmed = displayStr.trim();
    if (!trimmed) {
      // Empty input fallback to 0 or min
      const fallback = min !== undefined ? min : 0;
      setDisplayStr(formatEngineeringValue(fallback, selectedUnit.decimals ?? maxDecimals));
      onChangeSi(fallback * selectedUnit.toSiRatio);
      setError(null);
      return;
    }

    const res = evaluateArithmeticExpression(trimmed);
    if (res.success && typeof res.value === 'number') {
      let val = res.value;

      // Min/Max bounds validation & clamping
      if (min !== undefined && val < min) val = min;
      if (max !== undefined && val > max) val = max;

      const newSi = val * selectedUnit.toSiRatio;
      onChangeSi(newSi);

      const formatted = formatEngineeringValue(val, selectedUnit.decimals ?? effectiveMaxDecimals);
      setDisplayStr(formatted);
      setError(null);
    } else {
      setError(res.error || 'Geçersiz formül');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Triggers onBlur and commits
    } else if (e.key === 'Escape') {
      // Revert to current valueSi
      setDisplayStr(getFormattedValue(valueSi, selectedUnit));
      setError(null);
      e.currentTarget.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusFieldId?.(id);
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue();
    onBlurFieldId?.(id);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and telemetry row */}
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="flex items-center gap-1.5 font-medium text-[var(--alu)]">
          <span>{label}</span>
          {sublabel && !label.includes(`(${sublabel})`) && (
            <span className="font-mono text-[11px] text-[var(--alu-dim)]">({sublabel})</span>
          )}
          {required && <span className="text-[var(--cyan)]">*</span>}
        </label>
        {tooltip && (
          <span className="text-[10px] text-[var(--alu-dim)] cursor-help" title={tooltip}>
            ⓘ
          </span>
        )}
      </div>

      {/* Input chassis box */}
      <div
        className={`group relative flex items-center rounded-lg border bg-[var(--bg-1)] transition-all duration-150 ${
          error
            ? 'border-[var(--bad)] ring-1 ring-[var(--bad)]/30'
            : isFocused
            ? 'border-[var(--cyan)] ring-1 ring-[var(--cyan)]/40 '
            : 'border-[var(--line)] hover:border-[var(--line-strong)]'
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={displayStr}
          disabled={disabled}
          onChange={(e) => setDisplayStr(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          step={step}
          placeholder="0.00"
          className="w-full min-w-0 bg-transparent px-3 py-2 text-sm font-mono text-[var(--ink)] placeholder-[#475569] outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* Unit Dropdown or Static Symbol */}
        {units.length > 1 ? (
          <div className="relative shrink-0 border-l border-[var(--line)]">
            <select
              value={selectedUnit.symbol}
              onChange={handleUnitChange}
              disabled={disabled}
              className="appearance-none bg-transparent py-2 pl-2.5 pr-6 text-xs font-mono font-semibold text-[var(--cyan)] outline-none hover:text-[var(--ink)] transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Birim değiştir (Değer otomatik ölçeklenir)"
            >
              {units.map((u) => (
                <option key={u.symbol} value={u.symbol} className="bg-[var(--bg-1)] text-[var(--ink)]">
                  {u.symbol}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--alu-dim)]">
              ▼
            </span>
          </div>
        ) : units.length === 1 ? (
          <span className="shrink-0 border-l border-[var(--line)] px-2.5 py-2 text-xs font-mono font-semibold text-[var(--alu-dim)]">
            {units[0].symbol}
          </span>
        ) : null}
      </div>

      {/* Error notification or helper */}
      {error && (
        <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--bad)]">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
