import { DecisionSignal } from './decisionSignalSchema';

export const normalizeSignals = (signal: DecisionSignal) => {
  return {
    reward: Math.tanh(signal.rewardSignal),
    objective: Math.tanh(signal.objectiveScore),
    conflict: Math.tanh(signal.conflictPenalty),
    stability: Math.tanh(signal.metaStability),
    recursion: Math.min(1, signal.recursionDepth / 10),
  };
};
