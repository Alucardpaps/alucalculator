export interface ScenarioInput {
  name: string;
  variables: Record<string, number>;
}

export interface ScenarioResult {
  name: string;
  result: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Runs multiple engineering scenarios in parallel
 * (digital twin comparative analysis layer)
 */
export const runScenarioSimulation = (
  scenarios: ScenarioInput[],
  compute: (vars: Record<string, number>) => number
): ScenarioResult[] => {
  return scenarios.map((scenario) => {
    const result = compute(scenario.variables);

    const riskLevel =
      result > 250
        ? 'high'
        : result > 150
        ? 'medium'
        : 'low';

    return {
      name: scenario.name,
      result,
      riskLevel,
    };
  });
};
