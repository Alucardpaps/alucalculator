import { runScenarioSimulation } from './simulationEngine';
import { generateEngineeringInsight } from './reasoningEngine';

export interface DigitalTwinResult {
  scenarios: any[];
  insight: any;
}

/**
 * Core Digital Twin Engine:
 * combines simulation + reasoning + scenario comparison
 */
export const runDigitalTwin = (
  scenarios: any[],
  compute: (vars: Record<string, number>) => number,
  baseInputs: Record<string, number>
): DigitalTwinResult => {
  const simulation = runScenarioSimulation(scenarios, compute);

  const insight = generateEngineeringInsight(baseInputs);

  return {
    scenarios: simulation,
    insight,
  };
};
