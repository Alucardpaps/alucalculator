import { mutateObjectives } from './objectiveMutator';
import { EvolvingObjective } from './objectiveEvolutionSchema';

export interface EvolutionState {
  objectives: EvolvingObjective[];
}

/**
 * Controls objective evolution cycle
 */
export const runObjectiveEvolution = (
  state: EvolutionState,
  signal: any
): EvolutionState => {
  const evolved = mutateObjectives(state.objectives, signal);

  return {
    objectives: evolved,
  };
};
