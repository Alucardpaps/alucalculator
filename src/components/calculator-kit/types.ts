/**
 * AluCAD OS — Calculator-Kit Core Types
 * Standardized primitives for engineering inputs, progressive disclosure,
 * limit state diagnostics, and verification telemetry.
 */

export interface UnitOption {
  label: string;
  symbol: string;
  toSiRatio: number; // Multiplier to get SI base unit (e.g., kN -> N is 1000)
  decimals?: number;
}

export type VerdictStatus = 'INCOMPLETE' | 'PASS' | 'WARN' | 'FAIL';

export interface LimitStateMetric {
  id: string;
  name: string;
  symbol: string;
  demand: number; // Actual operating stress/force/deflection
  capacity: number; // Maximum permissible limit
  unit: string;
  utilization: number; // eta = demand / capacity
  standardCitation?: string;
  isCritical?: boolean;
}

export interface SmartInputFieldProps {
  id: string;
  label: string;
  sublabel?: string;
  valueSi: number; // Canonical SI base value
  onChangeSi: (newValSi: number) => void;
  units: UnitOption[];
  defaultUnitSymbol?: string;
  min?: number;
  max?: number;
  step?: number;
  maxDecimals?: number;
  disabled?: boolean;
  onFocusFieldId?: (fieldId: string) => void;
  onBlurFieldId?: (fieldId: string) => void;
  className?: string;
  tooltip?: string;
  required?: boolean;
}

export interface DisclosureLevelSection {
  id: 'basic' | 'assembly' | 'advanced';
  title: string;
  kicker: string;
  badge?: string;
  isDirty?: boolean; // True when non-default values are active in this level
  activeSummary?: string[]; // Summary chips shown on collapsed header
  onResetToDefaults?: () => void;
  children: React.ReactNode;
}

export interface ProgressiveDisclosureProps {
  sections: DisclosureLevelSection[];
  activeSections?: string[];
  onToggleSection?: (sectionId: string) => void;
  className?: string;
}

export interface VerdictBadgeProps {
  status: VerdictStatus;
  primaryMetricLabel?: string;
  maxUtilization?: number; // e.g. 0.85
  weakestLinkText?: string;
  standardCitation?: string; // e.g. VDI 2230 §5.3
  onWeakestLinkClick?: () => void;
  className?: string;
}

export interface SafetyMarginBarProps {
  metric: LimitStateMetric;
  showDetails?: boolean;
  onFocusClick?: () => void;
  className?: string;
  demandLabel?: string;
  capacityLabel?: string;
  precision?: number;
}
