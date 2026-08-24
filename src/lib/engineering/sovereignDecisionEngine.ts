import { DecisionSignal } from './decisionSignalSchema';
import { sovereignFuse } from './sovereignFusionCore';
import { evolveWeights } from './weightEvolutionEngine';
import { updateMemory } from './sovereignMemory';
import { SovereignWeights, WeightMemory } from './sovereignWeightSchema';

export interface SovereignState {
  weights: SovereignWeights;
  memory: WeightMemory;
}

export interface SovereignOutput {
  decision: any;
  state: SovereignState;
}

export const runSovereignDecisionEngine = (
  signal: DecisionSignal,
  state: SovereignState
): SovereignOutput => {
  const newWeights = evolveWeights(state.weights, signal, state.memory);
  const decision = sovereignFuse(signal, newWeights);
  const newMemory = updateMemory(state.memory, newWeights);

  return {
    decision,
    state: {
      weights: newWeights,
      memory: newMemory,
    },
  };
};
