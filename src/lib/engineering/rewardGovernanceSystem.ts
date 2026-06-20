import { applyRewardGovernance, GovernedRewardState } from './governancePolicyEngine';

export interface RewardGovernanceOutput {
  state: GovernedRewardState;
}

export const runRewardGovernanceSystem = (
  state: GovernedRewardState
): RewardGovernanceOutput => {
  const updated = applyRewardGovernance(state);
  return { state: updated };
};
