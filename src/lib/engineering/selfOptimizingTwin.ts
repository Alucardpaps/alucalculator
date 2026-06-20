import { optimizeDesign } from './optimizerEngine';
import { validateConstraints } from './constraintEngine';

export interface SelfOptimizingResult {
  bestDesign: any;
  optimizationScore: number;
  constraintCheck: any;
}

/**
 * Full system: constraints → simulation → optimization → selection
 */
export const runSelfOptimizingTwin = (
  candidates: any[],
  evaluate: (vars: Record<string, number>) => any,
  baseInputs: Record<string, number>
): SelfOptimizingResult => {
  const constraintCheck = validateConstraints(baseInputs);

  if (!constraintCheck.valid) {
    return {
      bestDesign: null,
      optimizationScore: 0,
      constraintCheck,
    };
  }

  const optimization = optimizeDesign(candidates, evaluate);

  return {
    bestDesign: optimization.best,
    optimizationScore: optimization.score,
    constraintCheck,
  };
};
