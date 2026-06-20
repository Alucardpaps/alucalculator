import { updateLearningState, LearningState, FeedbackEntry } from './feedbackMemory';
import { runSelfImprovingOptimization } from './selfImprovingOptimizer';

export interface EvolutionResult {
  bestDesign: any;
  learningState: LearningState;
}

/**
 * Main evolutionary cycle:
 * generate → evaluate → feedback → update → re-optimize
 */
export const runEvolutionCycle = (
  candidates: any[],
  learningState: LearningState,
  feedback: FeedbackEntry[]
): EvolutionResult => {
  const updatedLearning = updateLearningState(learningState, feedback);

  const optimization = runSelfImprovingOptimization(
    candidates,
    updatedLearning
  );

  return {
    bestDesign: optimization.best,
    learningState: updatedLearning,
  };
};
