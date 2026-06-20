import { MetaLearningState } from './metaLearningState';
import { updateMetaLearning, OptimizationMetrics } from './metaOptimizer';
import { adjustLearningRate } from './learningRateController';

export interface MetaEvolutionResult {
  state: MetaLearningState;
}

/**
 * System that evolves its own learning behavior
 */
export const runMetaEvolutionCycle = (
  state: MetaLearningState,
  metrics: OptimizationMetrics,
  successRate: number
): MetaEvolutionResult => {
  let updated = updateMetaLearning(state, metrics);
  updated = adjustLearningRate(updated, successRate);

  updated.history.push({
    iteration: updated.history.length + 1,
    avgScore: 1 - metrics.variance,
  });

  return {
    state: updated,
  };
};
