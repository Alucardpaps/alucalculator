import { MetaLearningState } from './metaLearningState';
import { runMetaEvolutionCycle } from './metaEvolutionLoop';

export interface MetaSystemOutput {
  state: MetaLearningState;
}

/**
 * Highest-level system controller:
 * evolves how the system learns and optimizes itself
 */
export const runMetaIntelligenceSystem = (
  state: MetaLearningState,
  metrics: any,
  successRate: number
): MetaSystemOutput => {
  const updatedState = runMetaEvolutionCycle(state, metrics, successRate);

  return {
    state: updatedState.state,
  };
};
