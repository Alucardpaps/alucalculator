import { SystemObjective } from './objectiveSchema';

export interface SystemSignal {
  instability: number;
  inefficiency: number;
  stagnation: number;
}

/**
 * Generates bounded system-level objectives
 * (NOT free-form goals — strictly constrained templates)
 */
export const generateObjectives = (signal: SystemSignal): SystemObjective[] => {
  const objectives: SystemObjective[] = [];

  if (signal.stagnation > 0.6) {
    objectives.push({
      id: 'increase-diversity',
      description: 'Increase exploration diversity in design space',
      priority: 0.8,
      constraints: ['no-breaking-changes', 'preserve-core-stability'],
      rewardSignal: (state) => state.diversityScore || 0,
    });
  }

  if (signal.inefficiency > 0.5) {
    objectives.push({
      id: 'optimize-throughput',
      description: 'Improve system computational efficiency',
      priority: 0.9,
      constraints: ['maintain-determinism'],
      rewardSignal: (state) => 1 - (state.latency || 1),
    });
  }

  if (signal.instability > 0.7) {
    objectives.push({
      id: 'stabilize-system',
      description: 'Reduce structural and computational instability',
      priority: 1.0,
      constraints: ['disable-high-risk-mutations'],
      rewardSignal: (state) => state.stability || 0,
    });
  }

  return objectives;
};
