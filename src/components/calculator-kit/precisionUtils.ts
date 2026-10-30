/**
 * AluCAD OS — Engineering Precision & Safe Arithmetic Utilities
 * Prevents floating point display bloat and evaluates inline arithmetic securely.
 */

import { useOSStore } from '@/store/osStore';

/**
 * Returns the active global decimal precision setting from osStore (defaults to 4).
 */
export function getGlobalDecimalPrecision(): number {
  try {
    const p = useOSStore.getState()?.decimalPrecision;
    if (typeof p === 'number' && p >= 1 && p <= 8) return p;
  } catch {}
  return 2;
}

/**
 * React hook to reactively subscribe to the global precision setting.
 */
export function useGlobalPrecision(): number {
  return useOSStore((state) => state.decimalPrecision ?? 2);
}

/**
 * Strips IEEE 754 precision artifacts while preserving exact significant digits.
 * e.g. 0.30000000000000004 -> "0.3"
 * e.g. 3.937007874015748 with maxDecimals=3 -> "3.937"
 * e.g. 15000 -> "15000"
 */
export function formatEngineeringValue(
  val: number | null | undefined,
  maxDecimals?: number,
  trimTrailingZeros: boolean = true
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '';
  }

  const effectiveDecimals =
    maxDecimals !== undefined ? maxDecimals : getGlobalDecimalPrecision();

  if (!isFinite(val)) {
    return val > 0 ? '∞' : '-∞';
  }

  // Handle near-zero epsilon
  if (Math.abs(val) < 1e-12) {
    return trimTrailingZeros ? '0' : (0).toFixed(effectiveDecimals);
  }

  // Engineering scientific notation for extreme magnitudes
  const abs = Math.abs(val);
  if (abs >= 1e7 || (abs < 1e-4 && abs > 0)) {
    const expDecimals = maxDecimals !== undefined ? Math.min(3, maxDecimals) : 3;
    return val.toExponential(expDecimals).replace('e+', 'e');
  }

  // Round to effectiveDecimals cleanly
  const factor = Math.pow(10, effectiveDecimals);
  const rounded = Math.round((val + Number.EPSILON) * factor) / factor;

  // Format and optionally strip unnecessary trailing zeros
  const str = rounded.toFixed(effectiveDecimals);
  // Only trim zeros that follow a decimal point: "50.00" → "50", "1.750" → "1.75".
  // (Without the '.' guard integers lost their own zeros: 50 → "5", 360 → "36".)
  if (!trimTrailingZeros || !str.includes('.')) return str;
  return str.replace(/\.?0+$/, '');
}

/**
 * Safe token-based arithmetic evaluator for inline inputs (supports +, -, *, /, ^, parentheses).
 * Zero eval/Function constructor; strictly deterministic parser.
 */
export function evaluateArithmeticExpression(rawExpr: string): { success: boolean; value?: number; error?: string } {
  if (!rawExpr || typeof rawExpr !== 'string') {
    return { success: false, error: 'Empty expression' };
  }

  // Normalize: replace comma decimal separators if used in European locale, trim
  const expr = rawExpr.trim().replace(/,/g, '.');

  // If already a clean standard number, return directly
  const directNum = Number(expr);
  if (!isNaN(directNum) && isFinite(directNum)) {
    return { success: true, value: directNum };
  }

  // Tokenize
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }

    if ('+-*/^()'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }

    // Invalid character detected
    return { success: false, error: `Invalid character: "${ch}"` };
  }

  if (tokens.length === 0) {
    return { success: false, error: 'No tokens found' };
  }

  // Simple recursive descent parser
  let tokenIdx = 0;

  function peek(): string | undefined {
    return tokens[tokenIdx];
  }

  function consume(): string {
    return tokens[tokenIdx++];
  }

  // Expression: Term (('+' | '-') Term)*
  function parseExpression(): number {
    let result = parseTerm();

    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const nextTerm = parseTerm();
      if (op === '+') result += nextTerm;
      else result -= nextTerm;
    }

    return result;
  }

  // Term: Factor (('*' | '/') Factor)*
  function parseTerm(): number {
    let result = parseFactor();

    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const nextFactor = parseFactor();
      if (op === '*') {
        result *= nextFactor;
      } else {
        if (Math.abs(nextFactor) < 1e-15) {
          throw new Error('Division by zero');
        }
        result /= nextFactor;
      }
    }

    return result;
  }

  // Factor: Power ('^' Power)*
  function parseFactor(): number {
    let result = parseUnary();

    if (peek() === '^') {
      consume();
      const exp = parseFactor(); // Right-associative
      result = Math.pow(result, exp);
    }

    return result;
  }

  // Unary: ('+' | '-')? Primary
  function parseUnary(): number {
    if (peek() === '+') {
      consume();
      return parsePrimary();
    }
    if (peek() === '-') {
      consume();
      return -parsePrimary();
    }
    return parsePrimary();
  }

  // Primary: Number | '(' Expression ')'
  function parsePrimary(): number {
    const t = peek();

    if (t === '(') {
      consume(); // '('
      const val = parseExpression();
      if (consume() !== ')') {
        throw new Error('Mismatched parentheses');
      }
      return val;
    }

    if (t && /^[0-9.]+$/.test(t)) {
      consume();
      const num = parseFloat(t);
      if (isNaN(num)) throw new Error(`Invalid number: ${t}`);
      return num;
    }

    throw new Error(`Unexpected token: ${t || 'END'}`);
  }

  try {
    const result = parseExpression();
    if (tokenIdx < tokens.length) {
      return { success: false, error: 'Unexpected trailing characters' };
    }
    if (!isFinite(result)) {
      return { success: false, error: 'Result is infinite or not a number' };
    }
    return { success: true, value: result };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Syntax error' };
  }
}
