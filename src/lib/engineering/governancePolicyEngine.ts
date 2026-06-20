import { RewardSystemState } from './rewardSystemController';
import { analyzeRewardDrift } from './rewardDriftAnalyzer';
import { stabilizeRewards } from './rewardStabilizer';
import { RewardGovernanceState } from './adaptiveRewardGovernanceSchema';

export interface GovernedRewardState extends RewardSystemState {
  governance: RewardGovernanceState;
}

export const applyRewardGovernance = (
  state: GovernedRewardState
): GovernedRewardState => {
  const drift = analyzeRewardDrift(state.rewards);

  const instability = drift.instabilityIndex;

  let stabilizationStrength = state.governance.stabilizationStrength;

  // Adaptive stabilization response
  if (instability > 1.0) stabilizationStrength += 0.2;
  else if (instability < 0.3) stabilizationStrength *= 0.95;

  stabilizationStrength = Math.max(0, Math.min(1, stabilizationStrength));

  const stabilizedRewards = stabilizeRewards(
    state.rewards,
    state.governance.limits,
    stabilizationStrength
  );

  return {
    ...state,
    rewards: stabilizedRewards,
    governance: {
      ...state.governance,
      stabilizationStrength,
      driftHistory: [...state.governance.driftHistory, drift],
    },
  };
};
