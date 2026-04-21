'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { evaluate } from 'mathjs';



interface InteractiveFormulaProps {
  formula: string;
  variables: Record<string, string>;
}

/**
 * Interactive Formula Engine
 * Automatically parses equations (e.g. "T = K * F * d") and renders
 * an interactive calculator for the SEO landing pages.
 */
export const InteractiveFormula: React.FC<InteractiveFormulaProps> = ({ formula, variables }) => {
  // Parsing the formula: Left side (result), Right side (expression)
  const [resultVar, expressionStr] = useMemo(() => {
    let eq = formula.trim()
      .replace(/×/g, '*')
      .replace(/÷/g, '/');
      
    if (eq.includes('=')) {
      const parts = eq.split('=');
      return [parts[0].trim(), parts[1].trim()];
    }
    return ['Result', eq];
  }, [formula]);

  // Identify independent variables
  const independentVars = useMemo(() => {
    return Object.keys(variables).filter(v => v !== resultVar);
  }, [variables, resultVar]);

  // State to hold input values
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const defaultVals: Record<string, string> = {};
    independentVars.forEach(v => { defaultVals[v] = ''; });
    return defaultVals;
  });

  const [result, setResult] = useState<number | null>(null);
  const [errorChart, setErrorChart] = useState<string | null>(null);


  // Re-calculate when inputs change
  useEffect(() => {
    try {
      const scope: Record<string, number> = {};
      let allFilled = true;

      for (const v of independentVars) {
        if (!inputs[v] || isNaN(Number(inputs[v]))) {
          allFilled = false;
          break;
        }
        scope[v] = Number(inputs[v]);
      }

      if (allFilled) {
        // Evaluate via mathjs
        const finalVal = evaluate(expressionStr, scope);
        setResult(finalVal);
        setErrorChart(null);
      } else {
        setResult(null);
      }
    } catch (e: any) {
      setResult(null);
      setErrorChart("Formula parse error. " + e.message);
    }
  }, [inputs, expressionStr, independentVars]);

  return (
    <div className="space-y-6">
      {/* Target Formula Overlay */}
      <div className="bg-[#050914] p-6 rounded-lg font-mono text-xl text-blue-300 border border-slate-800/80 shadow-inner flex items-center justify-between">
        <div>{formula}</div>
        {result !== null && (
          <div className="text-emerald-400 font-bold bg-emerald-900/20 px-3 py-1 rounded">
             {resultVar} = {Number.isInteger(result) ? result : result.toFixed(4)}
          </div>
        )}
      </div>

      {errorChart && (
        <div className="text-red-400 text-xs font-mono px-2">{errorChart}</div>
      )}

      {/* Input Grid */}
      <div className="mt-4">
        <h3 className="text-white/80 font-medium mb-3 text-sm font-mono uppercase tracking-widest">Interactive Calculator:</h3>
        <div className="grid gap-3 p-5 border border-slate-800 rounded-xl bg-slate-900/30">
          {independentVars.map((v) => (
            <div key={v} className="flex items-center gap-4">
              <label className="font-mono text-blue-400 w-12 text-right shrink-0 font-bold">{v}</label>
              <input
                type="number"
                value={inputs[v]}
                onChange={(e) => setInputs({ ...inputs, [v]: e.target.value })}
                placeholder={variables[v] || v}
                className="flex-1 bg-[#020408] border border-slate-700 rounded p-2.5 text-white font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
              <div className="text-xs text-slate-500 w-1/3 truncate">{variables[v]}</div>
            </div>
          ))}

          {/* Readonly Output Field */}
          <div className="flex items-center gap-4 mt-2 pt-4 border-t border-slate-800">
             <label className="font-mono text-emerald-400 w-12 text-right shrink-0 font-bold">{resultVar}</label>
             <div className="flex-1 bg-emerald-900/10 border border-emerald-900/50 rounded p-2.5 text-emerald-300 font-mono text-sm font-bold shadow-inner">
               {result !== null ? (Number.isInteger(result) ? result : result.toFixed(6)) : '-- waiting for inputs --'}
             </div>
             <div className="text-xs text-emerald-500/50 w-1/3 truncate">{variables[resultVar] || "Result"}</div>
          </div>
        </div>


      </div>
    </div>
  );
};
