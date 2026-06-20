import { generateObjectives } from './objectiveGenerator';
import { selectActiveObjective } from './objectiveSelector';
import { executeObjective } from './objectiveExecutor';
import { ObjectiveState } from './objectiveSchema';

export interface AutonomySystemState {
  systemState: any;
  objectiveState: ObjectiveState;
}

/**
 * System-level autonomy loop:
 * perceives → generates objectives → selects → executes
 */
export const runAutonomySystem = (
  state: AutonomySystemState,
  signal: any
): AutonomySystemState => {
  const newObjectives = generateObjectives(signal);

  const updatedObjectiveState: ObjectiveState = {
    ...state.objectiveState,
    objectives: newObjectives,
  };

  const selected = selectActiveObjective(updatedObjectiveState);

  const updatedSystem = executeObjective(
    state.systemState,
    selected
  );

  return {
    systemState: updatedSystem,
    objectiveState: selected,
  };
};
