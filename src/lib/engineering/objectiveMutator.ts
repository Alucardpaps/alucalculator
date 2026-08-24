import { EvolvingObjective } from './objectiveEvolutionSchema';

export interface MutationSignal {
  pressure: number;
  instability: number;
  performanceGap: number;
}

/**
 * Deterministic objective mutation system
 */
export const mutateObjectives = (
  objectives: EvolvingObjective[],
  signal: MutationSignal
): EvolvingObjective[] => {
  const next: EvolvingObjective[] = [];

  for (const obj of objectives) {
    let mutated = { ...obj };

    // 1. Instability → split objective
    if (signal.instability > 0.7 && obj.stability < 0.5) {
      next.push({
        ...obj,
        id: obj.id + '-A',
        generation: obj.generation + 1,
        stability: obj.stability * 0.9,
        mutationHistory: [...obj.mutationHistory, 'split:A'],
      });

      next.push({
        ...obj,
        id: obj.id + '-B',
        generation: obj.generation + 1,
        stability: obj.stability * 0.9,
        mutationHistory: [...obj.mutationHistory, 'split:B'],
      });

      continue;
    }

    // 2. Performance gap → priority shift
    if (signal.performanceGap > 0.6) {
      mutated.priority = Math.min(1, mutated.priority + 0.2);
      mutated.mutationHistory.push('priority-boost');
    }

    // 3. Pressure → decay stability
    if (signal.pressure > 0.5) {
      mutated.stability *= 0.95;
      mutated.mutationHistory.push('stress-decay');
    }

    next.push(mutated);
  }

  return next;
};
