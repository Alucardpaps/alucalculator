import { CognitiveRuleSet } from './cognitiveRuleSchema';

export interface RuleEvolutionSignal {
  instability: number;
  redundancy: number;
  performanceDrop: number;
}

/**
 * System modifies its own reasoning rules based on behavior signals
 */
export const evolveRuleSet = (
  ruleSet: CognitiveRuleSet,
  signal: RuleEvolutionSignal
): CognitiveRuleSet => {
  let updatedRules = [...ruleSet.rules];

  // Remove redundant rules
  if (signal.redundancy > 0.5) {
    updatedRules = updatedRules.filter(r => r.priority > 0.3);
  }

  // Boost adaptive rules when instability is high
  if (signal.instability > 0.6) {
    updatedRules = updatedRules.map(r => ({
      ...r,
      priority: Math.min(1, r.priority + 0.1),
    }));
  }

  // Inject new stabilizing rule when performance drops
  if (signal.performanceDrop > 0.5) {
    updatedRules.push({
      id: `auto-stabilize-${Date.now()}`,
      priority: 1,
      condition: () => true,
      action: (state) => ({
        ...state,
        stabilizationMode: true,
      }),
    });
  }

  return {
    rules: updatedRules,
    version: ruleSet.version + 1,
  };
};
