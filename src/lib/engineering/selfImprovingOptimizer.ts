import { optimizeDesign } from './optimizerEngine';
import { LearningState } from './feedbackMemory';
import { computeAdaptiveFitness } from './adaptiveFitness';

export interface SelfImprovingResult {
  best: any;
  learningState: LearningState;
}

/**
 * Closed-loop optimizer:
 * uses past results to improve future decisions
 */
export const runSelfImprovingOptimization = (
  candidates: any[],
  learning: LearningState
): SelfImprovingResult => {
  const evaluation = (vars: Record<string, number>) => {
    const stress = vars.force / (vars.area || 1);
    const weight = vars.mass || 0;
    const safetyFactor = vars.safetyFactor || 1;

    return { stress, weight, safetyFactor };
  };

  const evaluated = (vars: Record<string, number>) => {
    const base = evaluation(vars);
    return {
      stress: base.stress,
      weight: base.weight,
      safetyFactor: base.safetyFactor,
      score: computeAdaptiveFitness(base, learning),
    };
  };

  const result = optimizeDesign(candidates, (vars) => {
    const r = evaluated(vars);
    return {
      stress: r.stress,
      weight: r.weight,
      safetyFactor: r.safetyFactor,
    };
  });

  return {
    best: result.best,
    learningState: learning,
  };
};
