'use client';

import React from 'react';
import MathJaxModule from 'react-mathjax2';
const MathJax = MathJaxModule as any;

export interface Step {
  title: string;
  description: string;
  latexEquation: string;
  result?: string;
}

interface StepGeneratorProps {
  steps: Step[];
}

/**
 * Renders mathematical steps in LaTeX format using react-mathjax2.
 * Explains "How It Was Solved" to the user step-by-step.
 */
export const StepGenerator: React.FC<StepGeneratorProps> = ({ steps }) => {
  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 mb-6">
        Step-by-Step Solution
      </h3>
      
      <MathJax.Context input="tex">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step counter line */}
              {index !== steps.length - 1 && (
                <div className="absolute left-4 top-10 bottom-[-2rem] w-px bg-slate-200 dark:bg-slate-700"></div>
              )}
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 z-10 border border-blue-200 dark:border-blue-800">
                  {index + 1}
                </div>
                
                <div className="flex-1 pb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    {step.description}
                  </p>
                  
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700/50 overflow-x-auto">
                    <div className="text-lg text-slate-800 dark:text-slate-200 flex flex-col items-center">
                      <MathJax.Node>{step.latexEquation}</MathJax.Node>
                      
                      {step.result && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 w-full text-center font-bold text-blue-600 dark:text-blue-400">
                          <MathJax.Node>{step.result}</MathJax.Node>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </MathJax.Context>
    </div>
  );
};
