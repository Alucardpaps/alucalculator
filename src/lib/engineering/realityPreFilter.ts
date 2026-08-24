import { ConstraintKernelState } from './constraintSovereigntySchema';
import { enforceConstraints } from './constraintEnforcer';

/**
 * Pre-filters state before it enters the intelligence processing cycle
 */
export const preFilterState = <T>(
  state: T,
  kernel: ConstraintKernelState
): { allowedState: T | null; reason?: string } => {

  const result = enforceConstraints(state, kernel);

  if (!result.allowed) {
    return {
      allowedState: null,
      reason: result.reason,
    };
  }

  return { allowedState: state };
};
