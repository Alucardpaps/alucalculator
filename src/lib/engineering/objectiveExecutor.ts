import { ObjectiveState, SystemObjective } from './objectiveSchema';

/**
 * Executes active system objective against system state
 */
export const executeObjective = (
  state: any,
  objectiveState: ObjectiveState
): any => {
  const active = objectiveState.objectives.find(
    o => o.id === objectiveState.activeObjectiveId
  );

  if (!active) return state;

  const reward = active.rewardSignal(state);

  return {
    ...state,
    lastObjective: active.id,
    objectiveReward: reward,
  };
};
