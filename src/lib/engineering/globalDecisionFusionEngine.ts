import { runDecisionArbiter } from './decisionArbiter';
import { DecisionSignal } from './decisionSignalSchema';

export interface DecisionEngineOutput {
  score: number;
  confidence: number;
  selectedAction: string;
}

export const runGlobalDecisionFusionEngine = (
  signal: DecisionSignal
): DecisionEngineOutput => {
  return runDecisionArbiter(signal);
};
