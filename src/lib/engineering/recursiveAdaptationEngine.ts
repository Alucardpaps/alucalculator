import { RecursiveGraphState } from './recursiveLearningGraph';
import { evaluateRecursiveSystem } from './recursiveEvaluator';

export interface RecursiveAdaptationState {
  graph: RecursiveGraphState;
  mutationRate: number;
}

/**
 * System modifies its own structural learning topology
 */
export const adaptRecursiveSystem = (
  state: RecursiveAdaptationState
): RecursiveAdaptationState => {
  const metrics = evaluateRecursiveSystem(state.graph);

  let newMutationRate = state.mutationRate;

  // Instability → increase exploration of structure
  if (metrics.stability < 0.5) {
    newMutationRate *= 1.1;
  }

  // Low adaptability → deepen recursion
  if (metrics.adaptability < 3) {
    state.graph.maxDepth += 1;
  }

  // Too much depth inefficiency → reduce exploration pressure
  if (metrics.depthEfficiency > 10) {
    newMutationRate *= 0.9;
  }

  return {
    graph: state.graph,
    mutationRate: Math.max(0.1, Math.min(2, newMutationRate)),
  };
};
