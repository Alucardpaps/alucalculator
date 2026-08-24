export interface DesignCandidate {
  name: string;
  variables: Record<string, number>;
}

export interface OptimizationResult {
  best: DesignCandidate;
  score: number;
  breakdown: {
    stressScore: number;
    weightScore: number;
    safetyScore: number;
  };
}

/**
 * Deterministic multi-objective optimizer (no randomness)
 * Goal: minimize stress, maximize safety, minimize material load
 */
export const optimizeDesign = (
  candidates: DesignCandidate[],
  evaluate: (vars: Record<string, number>) => {
    stress: number;
    weight: number;
    safetyFactor: number;
  }
): OptimizationResult => {
  let best: DesignCandidate | null = null;
  let bestScore = -Infinity;
  let bestBreakdown = { stressScore: 0, weightScore: 0, safetyScore: 0 };

  for (const candidate of candidates) {
    const metrics = evaluate(candidate.variables);

    const stressScore = Math.max(0, 300 - metrics.stress);
    const weightScore = Math.max(0, 200 - metrics.weight);
    const safetyScore = metrics.safetyFactor * 100;

    const totalScore =
      stressScore * 0.4 +
      weightScore * 0.3 +
      safetyScore * 0.3;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      best = candidate;
      bestBreakdown = {
        stressScore,
        weightScore,
        safetyScore,
      };
    }
  }

  if (!best) {
    throw new Error('No valid design candidates provided');
  }

  return {
    best,
    score: bestScore,
    breakdown: bestBreakdown,
  };
};
