/**
 * DFM (Design for Manufacturing) Types & Rule Identifiers
 *
 * Grounded in VDI 2230, EN 12020, ISO 965, and ISO 2768 standards.
 */

export type DfmSeverity = 'CRITICAL' | 'WARNING' | 'NOTICE';

export type DfmRuleId =
  | 'HOLE_HOLE_OVERLAP'
  | 'HOLE_HOLE_WALL'
  | 'HOLE_EDGE_CUT'
  | 'HOLE_EDGE_CLEARANCE'
  | 'TAP_ENGAGEMENT'
  | 'TAP_BLIND_CHIP'
  | 'TAP_THIN_PLATE'
  | 'TSLOT_CHANNEL_INTERSECT'
  | 'TSLOT_LIP_NICK'
  | 'TSLOT_LIP_REMAIN'
  | 'WALL_MIN_ABS';

export interface DfmIssue {
  id: string;
  ruleId: DfmRuleId;
  severity: DfmSeverity;
  partId: string;
  partName: string;
  title: string;
  titleTr: string;
  message: string;
  messageTr: string;
  measured: number;
  required: number;
  unit: string;
  standard: string;
}

export interface DfmReport {
  score: number; // 0 to 100
  passed: boolean; // true if criticalCount === 0
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  issues: DfmIssue[];
  timestamp: number;
}
