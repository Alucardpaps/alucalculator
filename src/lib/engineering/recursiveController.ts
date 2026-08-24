import { expandRecursiveGraph, RecursiveGraphState } from './recursiveLearningGraph';
import { adaptRecursiveSystem } from './recursiveAdaptationEngine';

export interface RecursiveSystemState {
  graph: RecursiveGraphState;
  mutationRate: number;
}

/**
 * Highest recursion layer:
 * system modifies structure → evaluates → modifies itself again
 */
export const runRecursiveIntelligenceCycle = (
  state: RecursiveSystemState
): RecursiveSystemState => {
  const expanded = expandRecursiveGraph(
    state.graph,
    Math.floor(state.mutationRate * 2)
  );

  const adapted = adaptRecursiveSystem({
    graph: expanded,
    mutationRate: state.mutationRate,
  });

  return {
    graph: adapted.graph,
    mutationRate: adapted.mutationRate,
  };
};
