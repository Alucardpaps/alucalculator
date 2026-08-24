import { CognitiveRuleSet } from './cognitiveRuleSchema';
import { evolveRuleSet } from './selfModifyingRuleEngine';
import { executeCognitiveRules } from './cognitiveExecutionEngine';

export interface SelfConstructingState {
  coreState: any;
  rules: CognitiveRuleSet;
}

/**
 * Highest abstraction:
 * system modifies its own cognition rules and immediately executes them
 */
export const runSelfConstructingSystem = (
  state: SelfConstructingState,
  signal: any
): SelfConstructingState => {
  const evolvedRules = evolveRuleSet(state.rules, signal);

  const newState = executeCognitiveRules(state.coreState, evolvedRules);

  return {
    coreState: newState,
    rules: evolvedRules,
  };
};
