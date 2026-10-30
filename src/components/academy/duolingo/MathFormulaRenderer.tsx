'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaRendererProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export function MathFormulaRenderer({ formula, displayMode = true, className = '' }: MathFormulaRendererProps) {
  const html = useMemo(() => {
    if (!formula) return '';
    try {
      // Clean up common issues (e.g. double slashes or missing math brackets)
      let clean = formula.trim();
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
    return (
      <div className={`font-mono text-cyan-300 font-bold text-sm tracking-wide ${className}`}>
        {formula}
      </div>
    );
  }

  return (
    <div
      className={`inline-block text-cyan-300 select-all overflow-x-auto max-w-full py-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
