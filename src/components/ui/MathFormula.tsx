'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

export interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
  fallbackMono?: boolean;
}

export function MathFormula({
  formula,
  displayMode = true,
  className = '',
  fallbackMono = true,
}: MathFormulaProps) {
  const html = useMemo(() => {
    if (!formula) return '';
    try {
      const clean = formula.trim();
      return katex.renderToString(clean, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return '';
    }
  }, [formula, displayMode]);

  if (!html) {
    if (!fallbackMono) return null;
    return (
      <code className={`font-mono text-[var(--ink)] text-xs ${className}`}>
        {formula}
      </code>
    );
  }

  return (
    <div
      className={`math-formula select-all overflow-x-auto max-w-full text-[var(--ink)] ${displayMode ? 'block py-1' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathFormula;
