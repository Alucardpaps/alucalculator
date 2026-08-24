import { ConflictAwareObjective } from './conflictObjectiveSchema';
import { ConflictPair } from './conflictDetector';

export interface DominanceResult {
  resolved: ConflictAwareObjective[];
  dominanceMap: Record<string, number>;
}

/**
 * Resolves objective conflicts using deterministic dominance scoring
 */
export const resolveDominance = (
  objectives: ConflictAwareObjective[],
  conflicts: ConflictPair[]
): DominanceResult => {
  const dominance: Record<string, number> = {};

  for (const obj of objectives) {
    dominance[obj.id] = obj.priority;
  }

  for (const conflict of conflicts) {
    const a = objectives.find(o => o.id === conflict.a)!;
    const b = objectives.find(o => o.id === conflict.b)!;

    const scoreA = a.priority * a.stability;
    const scoreB = b.priority * b.stability;

    if (scoreA > scoreB) {
      dominance[a.id] += conflict.severity;
      dominance[b.id] -= conflict.severity;
    } else {
      dominance[b.id] += conflict.severity;
      dominance[a.id] -= conflict.severity;
    }
  }

  const resolved = objectives.map(o => ({
    ...o,
    priority: Math.max(0, Math.min(1, dominance[o.id])),
  }));

  return { resolved, dominanceMap: dominance };
};
