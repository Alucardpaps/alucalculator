import { ExecutionAction, ExecutionResult } from './executionSchema';
import { validateExecution } from './executionSafetyGate';
import { ConstraintKernelState } from './constraintSovereigntySchema';

export const executeAction = (
  action: ExecutionAction,
  kernel: ConstraintKernelState
): ExecutionResult => {

  const validation = validateExecution(action, kernel);

  if (!validation.allowed) {
    return {
      actionId: action.id,
      success: false,
      blocked: true,
      reason: validation.reason,
    };
  }

  try {
    let output: any = null;

    switch (action.type) {
      case 'compute':
        output = Function(`"use strict"; return (${action.payload})`)();
        break;

      case 'simulation':
        output = { simulated: true, data: action.payload };
        break;

      case 'ui_update':
        output = { ui: 'updated', payload: action.payload };
        break;

      case 'api_call':
        output = { api: 'called', payload: action.payload };
        break;

      case 'write':
        output = { written: true, payload: action.payload };
        break;

      default:
        throw new Error('Unknown execution type');
    }

    return {
      actionId: action.id,
      success: true,
      output,
    };

  } catch (err: any) {
    return {
      actionId: action.id,
      success: false,
      reason: err.message,
    };
  }
};
