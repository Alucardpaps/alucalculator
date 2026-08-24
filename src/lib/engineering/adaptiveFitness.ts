import { LearningState } from './feedbackMemory';

export interface AdaptiveFitnessInput {
  stress: number;
  weight: number;
  safetyFactor: number;
}

/**
 * Fitness function that evolves based on system experience
 */
export const computeAdaptiveFitness = (
  input: AdaptiveFitnessInput,
  learning: LearningState
): number => {
  const w = learning.weightAdjustments;

  const stressPenalty = input.stress * w.stress;
  const weightPenalty = input.weight * w.weight;
  const safetyBonus = input.safetyFactor * 120 * w.safety;

  return safetyBonus - stressPenalty - weightPenalty;
};
