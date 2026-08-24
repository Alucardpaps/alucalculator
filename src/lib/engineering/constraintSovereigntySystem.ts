import { ConstraintKernelState } from './constraintSovereigntySchema';
import { evaluateConstraints } from './realityBindingEngine';
import { applyRealityAnchor } from './realityAnchor';

export interface ConstraintSystemOutput<T> {
  state: T;
  kernel: ConstraintKernelState;
  valid: boolean;
}

export const runConstraintSovereigntySystem = <T>(
  state: T,
  kernel: ConstraintKernelState
): ConstraintSystemOutput<T> => {

  const updatedKernel = evaluateConstraints(state, kernel);
  const anchored = applyRealityAnchor(state, updatedKernel);

  return {
    state: anchored.state,
    kernel: updatedKernel,
    valid: anchored.valid,
  };
};
