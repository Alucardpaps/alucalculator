import { ObjectiveState } from './objectiveSchema';

/**
 * Selects the most critical active objective
 * based on deterministic priority scoring
 */
export const selectActiveObjective = (
  state: ObjectiveState
): ObjectiveState => {
  if (state.objectives.length === 0) {
    return { ...state, activeObjectiveId: null };
  }

  const sorted = [...state.objectives].sort(
    (a, b) => b.priority - a.priority
  );

  return {
    ...state,
    activeObjectiveId: sorted[0].id,
  };
};
