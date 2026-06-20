import { executeAction } from './executionEngine';
import { planExecution } from './executionPlanner';
import { ConstraintKernelState } from './constraintSovereigntySchema';

export interface ExecutionKernelOutput {
  decision: any;
  execution: any;
}

export const runExecutionKernel = (
  decision: any,
  kernel: ConstraintKernelState
): ExecutionKernelOutput => {

  const action = planExecution(decision);
  const execution = executeAction(action, kernel);

  return {
    decision,
    execution,
  };
};
