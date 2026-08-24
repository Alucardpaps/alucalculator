import { SovereignWeights, WeightMemory } from './sovereignWeightSchema';
import { DecisionSignal } from './decisionSignalSchema';

export const evolveWeights = (
  current: SovereignWeights,
  signal: DecisionSignal,
  memory: WeightMemory
): SovereignWeights => {
  const instability = signal.conflictPenalty * signal.recursionDepth;

  const delta = memory.adaptationRate * instability;

  const updated: SovereignWeights = {
    reward: clamp(current.reward + (signal.rewardSignal * delta * 0.1)),
    objective: clamp(current.objective + (signal.objectiveScore * delta * 0.1)),
    conflict: clamp(current.conflict + (signal.conflictPenalty * delta)),
    stability: clamp(current.stability + (signal.metaStability * delta * 0.5)),
    recursion: clamp(current.recursion + (signal.recursionDepth * 0.01)),
    volatility: clamp(instability * 0.1),
  };

  return updated;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
