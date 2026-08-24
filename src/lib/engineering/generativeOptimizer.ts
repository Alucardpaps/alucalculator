import { optimizeDesign } from './optimizerEngine';
import { expandDesignSpace } from './designSpaceExplorer';

export interface GenerativeOptimizationResult {
  bestDesign: any;
  generatedCount: number;
  score: number;
}

/**
 * Full pipeline:
 * TEMPLATE → GENERATION → OPTIMIZATION → SELECTION
 */
export const runGenerativeOptimization = (
  template: any,
  depth: number,
  evaluate: (vars: Record<string, number>) => any
): GenerativeOptimizationResult => {
  const space = expandDesignSpace(template, depth);

  const optimization = optimizeDesign(space.candidates, evaluate);

  return {
    bestDesign: optimization.best,
    generatedCount: space.spaceSize,
    score: optimization.score,
  };
};
