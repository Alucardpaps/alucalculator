import { ExecutionAction } from './executionSchema';

export const planExecution = (decision: any): ExecutionAction => {
  if (decision.selectedAction === 'EXECUTE') {
    return {
      id: `exec-${Date.now()}`,
      type: 'compute',
      payload: decision.score * 100,
      riskLevel: 'low',
      requiresApproval: false,
    };
  }

  if (decision.selectedAction === 'EVALUATE') {
    return {
      id: `eval-${Date.now()}`,
      type: 'simulation',
      payload: decision,
      riskLevel: 'medium',
      requiresApproval: false,
    };
  }

  return {
    id: `noop-${Date.now()}`,
    type: 'simulation',
    payload: {},
    riskLevel: 'low',
    requiresApproval: false,
  };
};
