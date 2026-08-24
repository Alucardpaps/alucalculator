export interface FitnessInput {
  stress: number;
  weight: number;
  safetyFactor: number;
}

/**
 * Unified fitness function for optimization ranking
 */
export const computeFitness = (input: FitnessInput): number => {
  const stressPenalty = input.stress * 0.5;
  const weightPenalty = input.weight * 0.3;
  const safetyBonus = input.safetyFactor * 120;

  return safetyBonus - stressPenalty - weightPenalty;
};
