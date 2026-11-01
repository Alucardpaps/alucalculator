import { describe, it, expect } from 'vitest';
import {
  formatEngineeringValue,
  evaluateArithmeticExpression,
} from '../components/calculator-kit/precisionUtils';
import type { LimitStateMetric, VerdictStatus } from '../components/calculator-kit/types';

describe('Calculator-Kit: Precision & Formatting Utilities', () => {
  it('strips IEEE 754 floating point artifacts cleanly', () => {
    expect(formatEngineeringValue(0.1 + 0.2)).toBe('0.3');
    expect(formatEngineeringValue(0.30000000000000004)).toBe('0.3');
    expect(formatEngineeringValue(1.0000000000000002)).toBe('1');
  });

  it('respects maxDecimals and trims trailing zeros', () => {
    expect(formatEngineeringValue(3.937007874, 3)).toBe('3.937');
    expect(formatEngineeringValue(15.0, 4)).toBe('15');
    expect(formatEngineeringValue(15.5, 4)).toBe('15.5');
    expect(formatEngineeringValue(12.34567, 2)).toBe('12.35');
  });

  it('handles zero and near-zero epsilon gracefully', () => {
    expect(formatEngineeringValue(0)).toBe('0');
    expect(formatEngineeringValue(1e-15)).toBe('0');
  });

  it('handles extreme scientific magnitudes', () => {
    expect(formatEngineeringValue(1.5e7)).toBe('1.500e7');
    expect(formatEngineeringValue(2.5e-5)).toBe('2.500e-5');
  });

  it('handles null, undefined, NaN and infinite values', () => {
    expect(formatEngineeringValue(null)).toBe('');
    expect(formatEngineeringValue(undefined)).toBe('');
    expect(formatEngineeringValue(NaN)).toBe('');
    expect(formatEngineeringValue(Infinity)).toBe('∞');
    expect(formatEngineeringValue(-Infinity)).toBe('-∞');
  });
});

describe('Calculator-Kit: Safe Arithmetic Parser (evaluateArithmeticExpression)', () => {
  it('evaluates clean standard numbers', () => {
    expect(evaluateArithmeticExpression('42')).toEqual({ success: true, value: 42 });
    expect(evaluateArithmeticExpression('3.1415')).toEqual({ success: true, value: 3.1415 });
  });

  it('normalizes European decimal commas', () => {
    const res = evaluateArithmeticExpression('12,5 + 7,5');
    expect(res.success).toBe(true);
    expect(res.value).toBe(20);
  });

  it('correctly follows operator precedence (* and / before + and -)', () => {
    const res1 = evaluateArithmeticExpression('10 + 20 * 3');
    expect(res1.success).toBe(true);
    expect(res1.value).toBe(70);

    const res2 = evaluateArithmeticExpression('100 - 40 / 4');
    expect(res2.success).toBe(true);
    expect(res2.value).toBe(90);
  });

  it('evaluates nested parentheses properly', () => {
    const res = evaluateArithmeticExpression('(10 + 20) * (5 - 2)');
    expect(res.success).toBe(true);
    expect(res.value).toBe(90);
  });

  it('evaluates power expressions (^)', () => {
    const res = evaluateArithmeticExpression('2 ^ 3 + 1');
    expect(res.success).toBe(true);
    expect(res.value).toBe(9);
  });

  it('handles unary plus and minus', () => {
    const res = evaluateArithmeticExpression('-15 + 5');
    expect(res.success).toBe(true);
    expect(res.value).toBe(-10);
  });

  it('safely catches division by zero', () => {
    const res = evaluateArithmeticExpression('100 / 0');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Division by zero');
  });

  it('catches invalid characters and syntax errors without using eval', () => {
    expect(evaluateArithmeticExpression('150 + foo').success).toBe(false);
    expect(evaluateArithmeticExpression('alert("xss")').success).toBe(false);
    expect(evaluateArithmeticExpression('(10 + 5').success).toBe(false);
    expect(evaluateArithmeticExpression('').success).toBe(false);
  });
});

describe('Calculator-Kit: Limit State Metric & Utilization Contract', () => {
  it('correctly maps capacity utilization eta to verdict status thresholds', () => {
    function computeVerdict(eta: number): VerdictStatus {
      if (eta <= 0.8) return 'PASS';
      if (eta <= 1.0) return 'WARN';
      return 'FAIL';
    }

    const metricPass: LimitStateMetric = {
      id: 'stress-yield',
      name: 'Yield Stress',
      symbol: 'σeq',
      demand: 480,
      capacity: 640,
      unit: 'MPa',
      utilization: 480 / 640, // 0.75
    };
    expect(computeVerdict(metricPass.utilization)).toBe('PASS');

    const metricWarn: LimitStateMetric = {
      id: 'stress-yield',
      name: 'Yield Stress',
      symbol: 'σeq',
      demand: 580,
      capacity: 640,
      unit: 'MPa',
      utilization: 580 / 640, // 0.90625
    };
    expect(computeVerdict(metricWarn.utilization)).toBe('WARN');

    const metricFail: LimitStateMetric = {
      id: 'stress-yield',
      name: 'Yield Stress',
      symbol: 'σeq',
      demand: 700,
      capacity: 640,
      unit: 'MPa',
      utilization: 700 / 640, // 1.09375
    };
    expect(computeVerdict(metricFail.utilization)).toBe('FAIL');
  });
});

describe('Calculator-Kit: Global Decimal Precision Setting', () => {
  it('respects useOSStore decimal precision and clamps out-of-range values', async () => {
    const { useOSStore } = await import('../store/osStore');
    const { getGlobalDecimalPrecision, formatEngineeringValue } = await import('../components/calculator-kit/precisionUtils');

    // Test setting to 2
    useOSStore.getState().setDecimalPrecision(2);
    expect(useOSStore.getState().decimalPrecision).toBe(2);
    expect(getGlobalDecimalPrecision()).toBe(2);
    expect(formatEngineeringValue(12.34567)).toBe('12.35');

    // Test setting to 5
    useOSStore.getState().setDecimalPrecision(5);
    expect(useOSStore.getState().decimalPrecision).toBe(5);
    expect(getGlobalDecimalPrecision()).toBe(5);
    expect(formatEngineeringValue(12.345678)).toBe('12.34568');

    // Test clamping bounds [1, 8]
    useOSStore.getState().setDecimalPrecision(0);
    expect(useOSStore.getState().decimalPrecision).toBe(1);

    useOSStore.getState().setDecimalPrecision(15);
    expect(useOSStore.getState().decimalPrecision).toBe(8);

    // Reset to default 4
    useOSStore.getState().setDecimalPrecision(4);
    expect(useOSStore.getState().decimalPrecision).toBe(4);
    expect(formatEngineeringValue(12.34567)).toBe('12.3457');
  });

  it('formats with trimTrailingZeros=false keeping exact precision', async () => {
    const { useOSStore } = await import('../store/osStore');
    const { formatEngineeringValue } = await import('../components/calculator-kit/precisionUtils');

    useOSStore.getState().setDecimalPrecision(3);
    expect(formatEngineeringValue(15, 3, false)).toBe('15.000');
    expect(formatEngineeringValue(15.2, 3, false)).toBe('15.200');
    expect(formatEngineeringValue(15.2456, 3, false)).toBe('15.246');

    useOSStore.getState().setDecimalPrecision(5);
    expect(formatEngineeringValue(15, 5, false)).toBe('15.00000');
    expect(formatEngineeringValue(15.123456, 5, false)).toBe('15.12346');

    // Default trimTrailingZeros is true:
    expect(formatEngineeringValue(15, 3, true)).toBe('15');
    expect(formatEngineeringValue(15.2, 3, true)).toBe('15.2');
  });
});
