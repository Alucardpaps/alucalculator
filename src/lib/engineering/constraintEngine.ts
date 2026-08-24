export interface ConstraintViolation {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ConstraintResult {
  valid: boolean;
  violations: ConstraintViolation[];
}

/**
 * Hard engineering constraint validator
 * (acts like ISO / structural rule gatekeeper)
 */
export const validateConstraints = (
  inputs: Record<string, number>
): ConstraintResult => {
  const violations: ConstraintViolation[] = [];

  if (inputs.force < 0) {
    violations.push({
      field: 'force',
      message: 'Force cannot be negative in structural load models',
      severity: 'high',
    });
  }

  if (inputs.area <= 0) {
    violations.push({
      field: 'area',
      message: 'Cross-sectional area must be greater than zero',
      severity: 'high',
    });
  }

  if (inputs.safetyFactor && inputs.safetyFactor < 1.2) {
    violations.push({
      field: 'safetyFactor',
      message: 'Safety factor below minimum engineering threshold',
      severity: 'high',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
};
