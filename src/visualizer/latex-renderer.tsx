import React from 'react';
import MathJax from 'react-mathjax2';

interface LatexRendererProps {
  steps: Array<{ description: string; latex: string }>;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 p-4 text-white">
      <h3 className="text-lg font-semibold text-emerald-400 mb-2 border-b border-white/10 pb-2">Calculation Steps</h3>
      <MathJax.Context>
        <div className="flex flex-col gap-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col bg-white/5 p-3 rounded-lg border border-white/10">
              <span className="text-sm text-gray-400 mb-1">{idx + 1}. {step.description}</span>
              <div className="text-lg font-mono text-white overflow-x-auto text-center py-2">
                 <MathJax.Node inline>{step.latex}</MathJax.Node>
              </div>
            </div>
          ))}
        </div>
      </MathJax.Context>
    </div>
  );
};
