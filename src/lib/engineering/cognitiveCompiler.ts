import { CognitiveRule } from './cognitiveRuleSchema';

export interface PatternSignal {
  instabilityZones: string[];
  efficiencyGaps: string[];
}

/**
 * Converts system behavior patterns into executable cognitive rules
 */
export const compileCognitiveRules = (signal: PatternSignal): CognitiveRule[] => {
  const rules: CognitiveRule[] = [];

  if (signal.instabilityZones.length > 0) {
    rules.push({
      id: 'stabilize-instability',
      priority: 0.9,
      condition: (state) => state.instability > 0.5,
      action: (state) => ({ ...state, dampingFactor: 0.8 }),
    });
  }

  if (signal.efficiencyGaps.length > 0) {
    rules.push({
      id: 'optimize-efficiency',
      priority: 0.8,
      condition: (state) => state.efficiency < 0.7,
      action: (state) => ({ ...state, optimizationBoost: true }),
    });
  }

  return rules;
};
