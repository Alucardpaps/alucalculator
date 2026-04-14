import * as math from 'mathjs';

export class Evaluator {
  static evaluate(formula: string, scope: Record<string, number>): number {
    try {
      const compiled = math.compile(formula);
      const result = compiled.evaluate(scope);
      return Number(result);
    } catch (error) {
      throw new Error(`Failed to evaluate formula: ${formula}. Error: ${error}`);
    }
  }
}
