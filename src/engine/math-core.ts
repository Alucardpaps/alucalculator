import { create, all } from 'mathjs';

// Create an isolated mathjs instance configured for BigNumber to avoid IEEE 754 float precision errors.
const math = create(all, {
  number: 'BigNumber',
  precision: 64, // Sufficient for high-end engineering
});

// Hardening: Disable dangerous functions that modify the parser state or allow execution
math.import({
  import: function () {
    throw new Error('Security: math.import is disabled');
  },
  createUnit: function () {
    throw new Error('Security: math.createUnit is disabled');
  },
  evaluate: function () {
    throw new Error('Security: math.evaluate is disabled, use MathEngine.evaluate.');
  }
}, { override: true });

export class MathEngine {
  /**
   * Safely evaluates a mathematical expression.
   * Internally runs on BigNumbers to prevent 0.1 + 0.2 = 0.3000... vulnerabilities,
   * then strictly returns a canonical JavaScript Number.
   *
   * @param expression e.g. "P * r^2"
   * @param scope e.g. { P: 3.14, r: 5 }
   */
  public static evaluate(expression: string, scope: Record<string, number> = {}): number {
    try {
      if (!expression || typeof expression !== 'string') {
        throw new Error('Expression must be a non-empty string.');
      }

      // 1. Prototype and specific payload checks
      if (expression.includes('constructor') || expression.includes('__proto__') || expression.includes('=')) {
        throw new Error('Security Error: Invalid expression syntax. Assignments or prototype access not allowed.');
      }

      // 2. Cast scope variables to BigNumber to guarantee high precision computation
      const bigScope = Object.entries(scope).reduce((acc, [key, val]) => {
        // Handle cases where undefined or null could leak in JS context
        if (typeof val !== 'number' || isNaN(val)) {
            throw new Error(`Invalid variable in scope: ${key} is not a valid number`);
        }
        acc[key] = math.bignumber!(val);
        return acc;
      }, {} as Record<string, any>);

      // 3. Compile & Execute
      const compiled = math.compile!(expression);
      const result = compiled.evaluate(bigScope);

      // 4. Return canonical JS primitive
      if (math.typeOf!(result) === 'BigNumber') {
        return Number(result.toString());
      }
      
      return Number(result);

    } catch (error: any) {
      // Clean up the error message for the validation systems
      throw new Error(`MathEngine Error: ${error.message}`);
    }
  }
}
