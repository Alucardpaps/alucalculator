import { expect, test, describe } from 'vitest';
import { MathEngine } from '../engine/math-core';

describe('MathEngine Core Tests', () => {
  describe('Float Precision (BigNumber handling)', () => {
    test('solves standard IEEE 754 double precision error (0.1 + 0.2)', () => {
      const result = MathEngine.evaluate('0.1 + 0.2');
      expect(result).toBe(0.3); // In standard JS this would fail (0.30000000000000004)
    });

    test('maintains precision in nested engineering calculations', () => {
      // Small variations that usually destroy precision
      const result = MathEngine.evaluate('(a * b) / c', { a: 0.1, b: 0.2, c: 0.3 });
      expect(result).toBeCloseTo(0.06666666666666667, 15); 
    });
  });

  describe('Security & Sandboxing', () => {
    test('blocks assignment operators (=)', () => {
      expect(() => {
        MathEngine.evaluate('a = 5');
      }).toThrow(/Security Error/);
    });

    test('blocks prototype manipulation attacks', () => {
      expect(() => {
        MathEngine.evaluate('constructor("return process.env")()');
      }).toThrow(/Security Error/);
    });
    
    test('blocks disabled functions like math.evaluate() inside payload', () => {
      // Since evaluating an AST node that calls evaluate is blocked
      expect(() => {
        MathEngine.evaluate('evaluate("1+1")');
      }).toThrow();
    });
  });

  describe('Scope & Payload Validation', () => {
    test('correctly maps scope variables to calculation', () => {
      const result = MathEngine.evaluate('yieldStrength * area / safetyFactor', {
        yieldStrength: 275.5,
        area: 10.2,
        safetyFactor: 1.5,
      });
      // 275.5 * 10.2 / 1.5 = 1873.4
      expect(result).toBe(1873.4);
    });

    test('throws structured error on missing scope properties used in expression', () => {
      expect(() => {
        MathEngine.evaluate('a + b', { a: 5 });
      }).toThrow(/Undefined symbol|Unexpected type/);
    });
    
    test('rejects dirty scope inputs (NaN / string formats)', () => {
      expect(() => {
        // @ts-ignore forcing dirty input like from a poor UI binding
        MathEngine.evaluate('a + b', { a: 5, b: '10' });
      }).toThrow(/is not a valid number/);
    });
  });
});
