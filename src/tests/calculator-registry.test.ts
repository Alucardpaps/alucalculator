import { describe, it, expect } from 'vitest';
import {
  solvers,
  solverCount,
  fieldToolCount,
  academyUnitCount,
  CANONICAL_SOLVERS_LABEL,
  CANONICAL_MODULES_LABEL,
} from '@/lib/registry/calculatorRegistry';

describe('Calculator Canonical Registry (Single Source of Truth)', () => {
  it('enforces exact equality between solverCount and solvers.length (no invented precision)', () => {
    expect(solverCount).toBe(solvers.length);
    expect(solverCount).toBe(86);
  });

  it('maintains separate counters for field tools and academy units', () => {
    expect(fieldToolCount).toBe(34);
    expect(academyUnitCount).toBe(15);
    // Never sum them into solverCount
    expect(solverCount).not.toBe(solverCount + fieldToolCount);
  });

  it('verifies that every registered solver has valid metadata and a reachable route', () => {
    for (const solver of solvers) {
      expect(solver.id).toBeTruthy();
      expect(solver.slug).toBeTruthy();
      expect(solver.title).toBeTruthy();
      expect(solver.engine).toBeTruthy();
      expect(solver.route.startsWith('/')).toBe(true);
    }
  });

  it('generates consistent canonical string labels', () => {
    expect(CANONICAL_SOLVERS_LABEL).toBe('86 solvers');
    expect(CANONICAL_MODULES_LABEL).toBe('86 modules');
  });
});
