/**
 * AluCAD OS — Canonical Calculator & Module Registry
 * 
 * Non-Negotiable Canonical Count Rule:
 * Source of truth = generated registry of modules that have:
 *   (a) an engine.ts or equivalent solver function
 *   (b) a verified, reachable route
 *   (c) listed in the hub registry
 * 
 * Marketing number = that exact integer. No "+", no rounding up.
 * Field tools, Academy units, and CAD editors are SEPARATE counters.
 */

import {
  CANONICAL_TOOLS,
  CANONICAL_TOOL_COUNT,
  CANONICAL_FIELD_TOOL_COUNT,
  CANONICAL_ACADEMY_UNIT_COUNT,
  type CanonicalToolEntry,
} from '@/data/canonicalInventory';
import {
  computeVerificationMetrics,
  SOLVER_VERIFICATION_LEDGER,
  getVerificationTierBadge,
  type VerificationTier,
  type VerificationMetrics,
  type SolverVerificationMeta,
} from '@/data/verificationRegistry';

export interface SolverRegistryEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly engine: string;
  readonly route: string;
  readonly group: string;
}

/**
 * Mapped list of solvers derived from CANONICAL_TOOLS (Single Source of Truth).
 */
export const solvers: ReadonlyArray<SolverRegistryEntry> = CANONICAL_TOOLS.map((tool: CanonicalToolEntry) => {
  const slug = tool.route.replace(/^\//, '');
  return {
    id: tool.id,
    slug,
    title: tool.titleEn,
    engine: `engine-${tool.id}`,
    route: tool.route,
    group: tool.pillar,
  };
});

/**
 * Canonical solver count — Exact integer count of active solvers.
 */
export const solverCount: number = CANONICAL_TOOL_COUNT;

/**
 * Separate counters — Never summed into "solvers"
 */
export const fieldToolCount: number = CANONICAL_FIELD_TOOL_COUNT; // Exact count of mobile & field sensor tools in FIELD_TOOLS (34)
export const academyUnitCount: number = CANONICAL_ACADEMY_UNIT_COUNT; // Exact count of interactive curriculum units in academy (15)

/**
 * Dynamic Verification Metrics
 */
export const verificationMetrics: VerificationMetrics = computeVerificationMetrics(solverCount);
export const standardReferencedCount: number = verificationMetrics.standardReferencedSolvers;
export const formulaVerifiedCount: number = verificationMetrics.formulaVerifiedSolvers;
export const groundTruthVerifiedCount: number = verificationMetrics.groundTruthVerifiedSolvers;
export const independentlyAuditedCount: number = verificationMetrics.independentlyAuditedSolvers;

/**
 * Formatted canonical string helpers — Grounded in Single Source of Truth
 */
export const CANONICAL_SOLVERS_LABEL = `${solverCount} solvers`;
export const CANONICAL_MODULES_LABEL = `${solverCount} modules`;
export const CANONICAL_STANDARD_REFERENCED_LABEL = `${solverCount} Standard-Referenced Solvers`;
export const CANONICAL_FIELD_TOOLS_LABEL = `${fieldToolCount} field tools`;
export const CANONICAL_ACADEMY_UNITS_LABEL = `${academyUnitCount} academy units`;

export {
  SOLVER_VERIFICATION_LEDGER,
  getVerificationTierBadge,
  type VerificationTier,
  type VerificationMetrics,
  type SolverVerificationMeta,
};
