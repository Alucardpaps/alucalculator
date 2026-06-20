export interface CalculationStep {
  step: number;
  label: string;
  expression: string;
  value: number | string;
}

export interface CalculationTrace {
  id: string;
  input: Record<string, any>;
  steps: CalculationStep[];
  finalResult: number | string;
}

/**
 * Deterministic replay engine:
 * reconstructs how a result was produced step-by-step
 */
export const buildCalculationTrace = (
  id: string,
  input: Record<string, any>,
  compute: () => { steps: CalculationStep[]; result: number | string }
): CalculationTrace => {
  const { steps, result } = compute();

  return {
    id,
    input,
    steps,
    finalResult: result,
  };
};
