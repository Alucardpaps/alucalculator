import { ImmutableConstraint } from './constraintSovereigntySchema';

export const compileDefaultConstraints = (): ImmutableConstraint[] => [
  {
    id: 'no-negative-physical-values',
    description: 'Force, area, mass cannot be negative',
    severity: 'hard',
    validate: (state) =>
      !(state.force < 0 || state.area < 0 || state.mass < 0),
  },
  {
    id: 'finite-stability-bound',
    description: 'Stability must remain within [0,1]',
    severity: 'hard',
    validate: (state) =>
      state.stability === undefined ||
      (state.stability >= 0 && state.stability <= 1),
  },
  {
    id: 'recursion-safety-limit',
    description: 'Recursion depth must not exceed safety bound',
    severity: 'soft',
    validate: (state) =>
      state.recursionDepth === undefined || state.recursionDepth <= 20,
  },
];
