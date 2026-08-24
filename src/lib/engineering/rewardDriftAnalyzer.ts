import { PlasticReward } from './adaptiveRewardSchema';
import { RewardDriftMetrics } from './adaptiveRewardGovernanceSchema';

export const analyzeRewardDrift = (rewards: PlasticReward[]): RewardDriftMetrics => {
  const weights = rewards.flatMap(r => r.coefficients.map((c: any) => c.weight));

  const avg = weights.reduce((a, b) => a + b, 0) / (weights.length || 1);
  const variance =
    weights.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / (weights.length || 1);

  const entropy = -weights.reduce((sum, w) => {
    const p = w / (weights.reduce((a, b) => a + b, 0) || 1);
    return sum + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);

  return {
    variance,
    entropy,
    instabilityIndex: variance * entropy,
  };
};
