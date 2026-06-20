import { PlasticReward } from './adaptiveRewardSchema';
import { GovernanceLimits } from './adaptiveRewardGovernanceSchema';

export const stabilizeRewards = (
  rewards: PlasticReward[],
  limits: GovernanceLimits,
  stabilizationStrength: number
): PlasticReward[] => {
  return rewards.map(r => ({
    ...r,
    coefficients: r.coefficients.map((c: any) => ({
      ...c,
      weight: Math.min(
        limits.maxWeight,
        Math.max(
          limits.minWeight,
          c.weight + (limits.maxWeight - c.weight) * stabilizationStrength * 0.1
        )
      ),
    })),
  }));
};
