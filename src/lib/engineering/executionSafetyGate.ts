import { ExecutionAction } from './executionSchema';
import { ConstraintKernelState } from './constraintSovereigntySchema';
import { enforceConstraints } from './constraintEnforcer';

export const validateExecution = (
  action: ExecutionAction,
  kernel: ConstraintKernelState
): { allowed: boolean; reason?: string } => {

  // High-risk actions require stricter validation
  if (action.riskLevel === 'high') {
    const result = enforceConstraints(action.payload, kernel);
    if (!result.allowed) {
      return { allowed: false, reason: result.reason };
    }
  }

  // Medium risk always checked lightly
  if (action.riskLevel === 'medium') {
    const result = enforceConstraints(action.payload, kernel);
    if (!result.allowed) {
      return { allowed: false, reason: result.reason };
    }
  }

  return { allowed: true };
};
