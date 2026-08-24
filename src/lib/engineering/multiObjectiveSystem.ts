import { runConflictResolution } from './conflictArbitrator';
import { ConflictSystemState } from './conflictArbitrator';

export interface MultiObjectiveOutput {
  state: ConflictSystemState;
}

/**
 * Top-level multi-objective intelligence system
 */
export const runMultiObjectiveSystem = (
  state: ConflictSystemState
): MultiObjectiveOutput => {
  const updated = runConflictResolution(state);

  return { state: updated };
};
