import { DecisionSignal } from './decisionSignalSchema';
import { fuseDecisionSignals } from './fusionCore';

export const runDecisionArbiter = (signal: DecisionSignal) => {
  return fuseDecisionSignals(signal);
};
