import React from 'react';
import { LatexRenderer } from './latex-renderer';
import { ChartEngine } from './chart-engine';

interface GraphRendererProps {
  engineOutput?: {
    success: boolean;
    result: Record<string, number>;
    steps: Array<{ description: string; latex: string }>;
    chart?: any; // Optional chart payload included from advanced schemas
  };
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({ engineOutput }) => {
  if (!engineOutput || !engineOutput.success) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-500 font-mono text-sm">
        [Drafting Canvas Ready - Awaiting Calculation...]
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto p-6 graph-renderer-container">
      {/* FINAL RESULT HIGHLIGHT */}
      <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl mb-8 shadow-lg shadow-emerald-500/5">
         <h2 className="text-emerald-400 text-sm tracking-wider uppercase font-semibold mb-3">Computed Results</h2>
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(engineOutput.result).map(([key, val]) => (
                <div key={key} className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                    <span className="text-gray-400 text-xs uppercase tracking-widest mb-1">{key}</span>
                    <span className="text-2xl font-mono text-emerald-300 font-bold">{Number(val).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                </div>
            ))}
         </div>
      </div>

      {/* CHART RENDERING IF AVAILABLE */}
      {engineOutput.chart && (
          <div className="mb-8">
             <h3 className="text-lg font-semibold text-blue-400 mb-2 border-b border-white/10 pb-2">Engineering Diagram</h3>
             <ChartEngine payload={engineOutput.chart} />
          </div>
      )}

      {/* LATEX EXPLANATION RENDERING */}
      <LatexRenderer steps={engineOutput.steps} />
    </div>
  );
};
