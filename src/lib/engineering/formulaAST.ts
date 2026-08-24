export interface FormulaNode {
  type: 'operator' | 'variable' | 'constant';
  value: string | number;
  left?: FormulaNode;
  right?: FormulaNode;
}

/**
 * Converts formula string into a simplified AST
 * (deterministic, no external dependencies)
 */
export const parseFormulaToAST = (formula: string): FormulaNode => {
  const tokens = formula.match(/[a-zA-Z_]+|\d+|\+|\-|\*|\/|\(|\)/g) || [];

  const outputStack: FormulaNode[] = [];
  const operatorStack: string[] = [];

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  const applyOperator = () => {
    const operator = operatorStack.pop()!;
    const right = outputStack.pop()!;
    const left = outputStack.pop()!;

    outputStack.push({
      type: 'operator',
      value: operator,
      left,
      right,
    });
  };

  for (const token of tokens) {
    if (/\d/.test(token)) {
      outputStack.push({ type: 'constant', value: Number(token) });
    } else if (/[a-zA-Z_]/.test(token)) {
      outputStack.push({ type: 'variable', value: token });
    } else if (['+', '-', '*', '/'].includes(token)) {
      while (
        operatorStack.length &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        applyOperator();
      }
      operatorStack.push(token);
    }
  }

  while (operatorStack.length) applyOperator();

  return outputStack[0];
};
