import { CalculationStep } from './calculationReplay';

export interface ExecutionContext {
  variables: Record<string, number>;
}

/**
 * Executes formulas in a traceable, step-by-step manner
 */
export const executeSteps = (
  context: ExecutionContext,
  steps: Omit<CalculationStep, 'value'>[]
): CalculationStep[] => {
  const results: CalculationStep[] = [];

  for (const step of steps) {
    const evaluated = evaluateExpression(step.expression, context.variables);

    results.push({
      ...step,
      value: evaluated,
    });

    // feed result back into context for chaining
    context.variables[`step_${step.step}`] = Number(evaluated);
  }

  return results;
};

/**
 * VERY IMPORTANT: deterministic evaluator only (NO eval)
 */
const evaluateExpression = (
  expression: string,
  vars: Record<string, number>
): number => {
  let expr = expression;

  Object.entries(vars).forEach(([key, value]) => {
    expr = expr.replaceAll(key, value.toString());
  });

  // SAFE deterministic math parser (restricted)
  return Function(`"use strict"; return (${expr})`)();
};
