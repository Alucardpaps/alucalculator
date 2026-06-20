import { SovereignWeights } from './sovereignWeightSchema';
import { DecisionSignal, FusedDecision } from './decisionSignalSchema';

export const sovereignFuse = (
  signal: DecisionSignal,
  weights: SovereignWeights
): FusedDecision => {
  const score =
    signal.rewardSignal * weights.reward +
    signal.objectiveScore * weights.objective +
    (1 - signal.conflictPenalty) * weights.conflict +
    signal.metaStability * weights.stability +
    signal.recursionDepth * weights.recursion;

  const confidence = Math.min(
    1,
    Math.abs(score) * weights.stability
  );

  let action = 'NO_OP';
  if (score > 0.65) action = 'EXECUTE';
  else if (score > 0.35) action = 'EVALUATE';
  else if (score < 0.2) action = 'REJECT';

  return { score, confidence, selectedAction: action };
};
