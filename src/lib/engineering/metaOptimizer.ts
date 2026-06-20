import { MetaLearningState } from './metaLearningState';

export interface OptimizationMetrics {
  improvementRate: number;
  variance: number;
}

/**
 * Adjusts learning behavior based on system performance trends
 */
export const updateMetaLearning = (
  state: MetaLearningState,
  metrics: OptimizationMetrics
): MetaLearningState => {
  const updated = { ...state };

  // If system improves slowly → increase exploration
  if (metrics.improvementRate < 0.2) {
    updated.explorationBias += 0.1;
    updated.stabilityBias -= 0.05;
  }

  // If system is unstable → increase stability
  if (metrics.variance > 0.5) {
    updated.stabilityBias += 0.1;
    updated.explorationBias -= 0.05;
  }

  // Clamp values (deterministic bounds)
  updated.explorationBias = Math.max(0, Math.min(1, updated.explorationBias));
  updated.stabilityBias = Math.max(0, Math.min(1, updated.stabilityBias));

  return updated;
};
