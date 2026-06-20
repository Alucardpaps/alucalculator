import { MetaLearningState } from './metaLearningState';

/**
 * Dynamically adjusts system learning speed
 */
export const adjustLearningRate = (
  state: MetaLearningState,
  successRate: number
): MetaLearningState => {
  const updated = { ...state };

  if (successRate > 0.8) {
    updated.learningRate *= 0.95; // stabilize
  } else if (successRate < 0.5) {
    updated.learningRate *= 1.1; // accelerate adaptation
  }

  updated.learningRate = Math.max(0.1, Math.min(2, updated.learningRate));

  return updated;
};
