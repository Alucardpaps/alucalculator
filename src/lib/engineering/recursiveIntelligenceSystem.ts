import { runRecursiveIntelligenceCycle } from './recursiveController';

export interface RecursiveSystemOutput {
  state: any;
}

/**
 * Top-level recursive intelligence system
 * Controls its own structural evolution loop
 */
export const runRecursiveIntelligenceSystem = (
  state: any
): RecursiveSystemOutput => {
  const updatedState = runRecursiveIntelligenceCycle(state);

  return {
    state: updatedState,
  };
};
