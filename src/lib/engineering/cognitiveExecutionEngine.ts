import { CognitiveRuleSet } from './cognitiveRuleSchema';

export const executeCognitiveRules = (state: any, ruleSet: CognitiveRuleSet) => {
  let currentState = { ...state };

  const sortedRules = [...ruleSet.rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.condition(currentState)) {
      currentState = rule.action(currentState);
    }
  }

  return currentState;
};
