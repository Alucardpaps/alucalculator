import { ConstraintKernelState, ImmutableConstraint, ConstraintViolationRecord } from './constraintSovereigntySchema';

export const evaluateConstraints = (
  state: any,
  kernel: ConstraintKernelState
): ConstraintKernelState => {

  const violations: ConstraintViolationRecord[] = [];

  for (const constraint of kernel.constraints) {
    const valid = constraint.validate(state);

    if (!valid) {
      violations.push({
        constraintId: constraint.id,
        timestamp: Date.now(),
        snapshot: state,
        severity: constraint.severity,
      });
    }
  }

  return {
    ...kernel,
    violationLog: [...kernel.violationLog, ...violations],
  };
};
