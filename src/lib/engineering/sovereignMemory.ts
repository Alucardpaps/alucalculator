import { SovereignWeights, WeightMemory } from './sovereignWeightSchema';

export const updateMemory = (
  memory: WeightMemory,
  weights: SovereignWeights
): WeightMemory => {
  const updated = {
    ...memory,
    history: [...memory.history.slice(-20), weights],
  };

  return updated;
};
