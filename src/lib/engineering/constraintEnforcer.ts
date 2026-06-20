import { ConstraintKernelState } from './constraintSovereigntySchema';

export const enforceConstraints = (
  state: any,
  kernel: ConstraintKernelState
): { allowed: boolean; reason?: string } => {

  for (const constraint of kernel.constraints) {
    const ok = constraint.validate(state);

    if (!ok && constraint.severity === 'hard') {
      return {
        allowed: false,
        reason: `HARD_CONSTRAINT_VIOLATION: ${constraint.id}`,
      };
    }
  }

  return { allowed: true };
};
