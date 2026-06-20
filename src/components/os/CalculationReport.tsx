'use client';

import { useState } from 'react';

export interface CalculationVariable {
  name: string;
  value: number | string;
  unit?: string;
  description?: string;
}

export interface CalculationReportProps {
  title: string;
  formula: string;
  variables: CalculationVariable[];
  result: number | string;
  standards?: string[];
}

/**
 * Transparency Layer: exposes full engineering traceability
 */
export function CalculationReport({
  title,
  formula,
  variables,
  result,
  standards = [],
}: CalculationReportProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 border border-slate-800 rounded-2xl bg-slate-900/60">
      
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Engineering calculation transparency report
          </p>
        </div>
        <span className="text-xs text-slate-400">
          {open ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="p-4 border-t border-slate-800 space-y-4">

          {/* Formula */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-2">
              Formula
            </h4>
            <code className="text-sm text-blue-300 block bg-slate-950 p-3 rounded-lg">
              {formula}
            </code>
          </div>

          {/* Variables */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-2">
              Variables
            </h4>
            <div className="space-y-2">
              {variables.map((v, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs bg-slate-950 p-2 rounded-lg"
                >
                  <span className="text-slate-300">
                    {v.name} {v.unit && `(${v.unit})`}
                  </span>
                  <span className="text-slate-400">
                    {v.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Standards */}
          {standards.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-2">
                Engineering Standards
              </h4>
              <ul className="text-xs text-slate-400 list-disc ml-4">
                {standards.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Result */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 mb-1">
              Result
            </h4>
            <div className="text-lg font-bold text-green-400">
              {result}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
