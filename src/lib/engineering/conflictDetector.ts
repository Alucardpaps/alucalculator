import { ConflictAwareObjective } from './conflictObjectiveSchema';

export interface ConflictPair {
  a: string;
  b: string;
  severity: number;
  reason: string;
}

/**
 * Detects competition between objectives
 */
export const detectConflicts = (
  objectives: ConflictAwareObjective[]
): ConflictPair[] => {
  const conflicts: ConflictPair[] = [];

  for (let i = 0; i < objectives.length; i++) {
    for (let j = i + 1; j < objectives.length; j++) {
      const a = objectives[i];
      const b = objectives[j];

      // 1. exclusivity conflict
      if (
        a.exclusivityGroup &&
        a.exclusivityGroup === b.exclusivityGroup
      ) {
        conflicts.push({
          a: a.id,
          b: b.id,
          severity: 0.9,
          reason: 'shared-exclusivity-group',
        });
      }

      // 2. domain collision
      if (a.domain !== b.domain && Math.abs(a.priority - b.priority) < 0.1) {
        conflicts.push({
          a: a.id,
          b: b.id,
          severity: 0.5,
          reason: 'cross-domain-priority-collision',
        });
      }

      // 3. stability vs aggressiveness tension
      if (a.stability < 0.4 && b.stability > 0.8) {
        conflicts.push({
          a: a.id,
          b: b.id,
          severity: 0.6,
          reason: 'stability-gradient-mismatch',
        });
      }
    }
  }

  return conflicts;
};
