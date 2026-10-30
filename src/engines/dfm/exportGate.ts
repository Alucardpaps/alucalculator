/**
 * DFM Export Quality Gate
 *
 * Controls export of manufacturing outputs (STL, STEP, Technical Drawings):
 * - Blocks export when CRITICAL issues exist unless explicitly overridden.
 * - Allows export with WARNINGs, appending DFM quality notes.
 * - Records an audit feature branch in useManufacturingStore when an override is authorized.
 */

import { DfmReport, DfmIssue } from './dfmTypes';
import { useManufacturingStore } from '@/store/useManufacturingStore';

export interface ExportGateResult {
  allowed: boolean;
  blockers: DfmIssue[];
  warnings: DfmIssue[];
  overridden: boolean;
  overrideBranch?: string;
  message: string;
}

export function canExport(
  report: DfmReport,
  options?: {
    allowOverride?: boolean;
    overrideReason?: string;
  }
): ExportGateResult {
  const blockers = report.issues.filter((i) => i.severity === 'CRITICAL');
  const warnings = report.issues.filter((i) => i.severity === 'WARNING');

  if (blockers.length === 0) {
    return {
      allowed: true,
      blockers: [],
      warnings,
      overridden: false,
      message: warnings.length > 0
        ? `Export allowed with ${warnings.length} DFM warnings stamped into manufacturing notes.`
        : 'All DFM checks passed. Safe to export.',
    };
  }

  // Critical issues exist
  if (options?.allowOverride) {
    const branchName = `dfm-override-${Date.now().toString(36)}`;
    try {
      useManufacturingStore.getState().createBranch(branchName);
    } catch {
      // Ignored if in server / test context
    }

    return {
      allowed: true,
      blockers: [],
      warnings: [...blockers, ...warnings],
      overridden: true,
      overrideBranch: branchName,
      message: `Export permitted under engineering override (${options.overrideReason || 'Authorized by engineer'}). Logged to branch ${branchName}.`,
    };
  }

  return {
    allowed: false,
    blockers,
    warnings,
    overridden: false,
    message: `Export blocked: ${blockers.length} CRITICAL DFM issues detected. Resolve warnings or authorize engineering override.`,
  };
}
