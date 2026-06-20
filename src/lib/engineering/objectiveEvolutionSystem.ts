import { runObjectiveEvolution } from './objectiveLifecycle';
import { EvolutionState } from './objectiveLifecycle';

export interface ObjectiveEvolutionOutput {
  state: EvolutionState;
}

export const runObjectiveEvolutionSystem = (
  state: EvolutionState,
  signal: any
): ObjectiveEvolutionOutput => {
  const updated = runObjectiveEvolution(state, signal);
  return { state: updated };
};
