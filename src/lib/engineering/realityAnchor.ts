import { ConstraintKernelState } from './constraintSovereigntySchema';
import { enforceConstraints } from './constraintEnforcer';

export interface AnchoredState<T> {
  state: T;
  valid: boolean;
  blockedBy?: string;
}

export const applyRealityAnchor = <T>(
  state: T,
  kernel: ConstraintKernelState
): AnchoredState<T> => {

  const result = enforceConstraints(state, kernel);

  if (!result.allowed) {
    return {
      state,
      valid: false,
      blockedBy: result.reason,
    };
  }

  return {
    state,
    valid: true,
  };
};
