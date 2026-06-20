export interface ImmutableConstraint {
  id: string;
  description: string;
  validate: (state: any) => boolean;
  severity: 'hard' | 'soft';
}

export interface ConstraintKernelState {
  constraints: ImmutableConstraint[];
  violationLog: ConstraintViolationRecord[];
}

export interface ConstraintViolationRecord {
  constraintId: string;
  timestamp: number;
  snapshot: any;
  severity: 'hard' | 'soft';
}
