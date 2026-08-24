import { detectConflicts } from './conflictDetector';
import { resolveDominance } from './dominanceResolver';
import { ConflictAwareObjective } from './conflictObjectiveSchema';

export interface ConflictSystemState {
  objectives: ConflictAwareObjective[];
  dominanceMap: Record<string, number>;
}

/**
 * Central arbitration system for competing objectives
 */
export const runConflictResolution = (
  state: ConflictSystemState
): ConflictSystemState => {
  const conflicts = detectConflicts(state.objectives);
  const resolved = resolveDominance(state.objectives, conflicts);

  return {
    objectives: resolved.resolved,
    dominanceMap: resolved.dominanceMap,
  };
};
