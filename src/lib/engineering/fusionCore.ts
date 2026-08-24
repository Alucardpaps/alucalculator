import { DecisionSignal, FusedDecision } from './decisionSignalSchema';
import { normalizeSignals } from './signalNormalizer';
import { defaultWeights } from './decisionWeightMatrix';

export const fuseDecisionSignals = (
  signal: DecisionSignal
): FusedDecision => {
  const n = normalizeSignals(signal);
  const w = defaultWeights;

  const score =
    n.reward * w.reward +
    n.objective * w.objective +
    (1 - n.conflict) * w.conflict +
    n.stability * w.stability +
    n.recursion * w.recursion;

  const confidence =
    Math.min(1, Math.abs(score) * n.stability);

  let action = 'NO_OP';

  if (score > 0.6) action = 'EXECUTE';
  else if (score > 0.3) action = 'EVALUATE';
  else if (score < 0.2) action = 'REJECT';

  return {
    score,
    confidence,
    selectedAction: action,
  };
};
