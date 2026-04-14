import { HeadlessEngine, EngineResult } from './engine';

export interface OptimizationTarget {
  variable: string;    // e.g. "D" (diameter)
  min: number;
  max: number;
  step: number;        // e.g. 1
  maximize?: boolean;  // whether to find the highest value of a resulting variable (default false, meaning find lowest/cheapest)
}

export interface Constraint {
  outputVariable: string; // e.g. "n_Goodman" or "L10h"
  condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: number;
}

export interface OptimizationResult {
  success: boolean;
  optimalInput?: number;     // The optimal variable value found (e.g. D = 32mm)
  optimalOutput?: Record<string, number>;
  iterationsRan: number;
  error?: string;
}

export class ParametricOptimizer {
  private engine: HeadlessEngine;

  constructor() {
    this.engine = new HeadlessEngine();
  }

  /**
   * Bulk iteration over a single parameter to find the optimal result that satisfies constraints.
   * Runs natively on the headless engine without blocking the main event loops excessively.
   */
  optimize(
    calculatorId: string,
    baseInputs: Record<string, number>,
    target: OptimizationTarget,
    constraints: Constraint[]
  ): OptimizationResult {
    
    let optimalVarVal: number | undefined = undefined;
    let optimalOutResult: Record<string, number> | undefined = undefined;
    let iterations = 0;

    // Based on whether we want to maximize or minimize the 'target.variable' (often min size = cheaper)
    // We'll just collect passing ones and pick the edge
    let currentBest = target.maximize ? -Infinity : Infinity;

    for (let currentVal = target.min; currentVal <= target.max; currentVal += target.step) {
      iterations++;
      
      const trialInputs = { ...baseInputs, [target.variable]: currentVal };
      
      const calcRes = this.engine.execute(calculatorId, trialInputs);
      if (!calcRes.success) continue;

      const outputs = calcRes.result;
      
      // Validation Check
      let passesAll = true;
      for (const constraint of constraints) {
        const val = outputs[constraint.outputVariable];
        if (val === undefined) { passesAll = false; continue; }
        
        if (constraint.condition === 'gt' && !(val > constraint.value)) passesAll = false;
        if (constraint.condition === 'gte' && !(val >= constraint.value)) passesAll = false;
        if (constraint.condition === 'lt' && !(val < constraint.value)) passesAll = false;
        if (constraint.condition === 'lte' && !(val <= constraint.value)) passesAll = false;
      }

      // If it passes all safety limits, check if it's the optimal size/factor
      if (passesAll) {
         if (target.maximize) {
            if (currentVal > currentBest) {
               currentBest = currentVal;
               optimalVarVal = currentVal;
               optimalOutResult = outputs;
            }
         } else {
            if (currentVal < currentBest) {
               currentBest = currentVal;
               optimalVarVal = currentVal;
               optimalOutResult = outputs;
            }
         }
      }
    }

    if (optimalVarVal !== undefined) {
       return {
          success: true,
          optimalInput: optimalVarVal,
          optimalOutput: optimalOutResult,
          iterationsRan: iterations
       };
    }

    return {
       success: false,
       iterationsRan: iterations,
       error: "Could not find any parameter that satisfies constraints within the given bounds."
    };
  }
}
