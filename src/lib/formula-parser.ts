/**
 * AluCalc OS — Safe Formula Parser
 * AST-based expression evaluator - NO eval()
 * 
 * Supports: +, -, *, /, ^, sqrt, sin, cos, tan, log, ln, abs, PI, E
 * Also supports: ==, !=, <, >, <=, >=, ?: (ternary)
 */

// ============================================
// Token Types
// ============================================

type TokenType =
    | 'NUMBER'
    | 'IDENTIFIER'
    | 'OPERATOR'
    | 'COMPARISON'
    | 'QUESTION'
    | 'COLON'
    | 'LPAREN'
    | 'RPAREN'
    | 'COMMA'
    | 'EOF';

interface Token {
    type: TokenType;
    value: string | number;
}

// ============================================
// AST Node Types
// ============================================

type ASTNode =
    | NumberNode
    | IdentifierNode
    | BinaryOpNode
    | UnaryOpNode
    | FunctionCallNode
    | TernaryNode;

interface NumberNode {
    type: 'Number';
    value: number;
}

interface IdentifierNode {
    type: 'Identifier';
    name: string;
}

interface BinaryOpNode {
    type: 'BinaryOp';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

interface UnaryOpNode {
    type: 'UnaryOp';
    operator: string;
    operand: ASTNode;
}

interface FunctionCallNode {
    type: 'FunctionCall';
    name: string;
    args: ASTNode[];
}

interface TernaryNode {
    type: 'Ternary';
    condition: ASTNode;
    ifTrue: ASTNode;
    ifFalse: ASTNode;
}

// ============================================
// Built-in Constants
// ============================================

const CONSTANTS: Record<string, number> = {
    PI: Math.PI,
    E: Math.E,
    G: 9.80665,          // Standard gravity (m/s²)
};

// ============================================
// Built-in Functions
// ============================================

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
    sqrt: Math.sqrt,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    log: Math.log10,
    ln: Math.log,
    log2: Math.log2,
    exp: Math.exp,
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    min: Math.min,
    max: Math.max,
    pow: Math.pow,
    // Engineering functions
    rad: (deg: number) => deg * Math.PI / 180,
    deg: (rad: number) => rad * 180 / Math.PI,
    // Conditional helpers
    iif: (cond: number, ifTrue: number, ifFalse: number) => cond ? ifTrue : ifFalse,
};

// ============================================
// Lexer
// ============================================

class Lexer {
    private pos = 0;
    private readonly input: string;

    constructor(input: string) {
        this.input = input.replace(/\s+/g, ''); // Remove whitespace
    }

    private peek(offset = 0): string {
        return this.input[this.pos + offset] || '';
    }

    private advance(): string {
        return this.input[this.pos++] || '';
    }

    private isDigit(char: string): boolean {
        return /[0-9.]/.test(char);
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z_]/.test(char);
    }

    private isAlphaNum(char: string): boolean {
        return /[a-zA-Z0-9_]/.test(char);
    }

    private readNumber(): Token {
        let num = '';
        let hasDot = false;

        while (this.isDigit(this.peek())) {
            const char = this.advance();
            if (char === '.') {
                if (hasDot) throw new FormulaError(`Invalid number: multiple decimal points`);
                hasDot = true;
            }
            num += char;
        }

        // Handle scientific notation
        if (this.peek().toLowerCase() === 'e') {
            num += this.advance();
            if (this.peek() === '+' || this.peek() === '-') {
                num += this.advance();
            }
            while (/[0-9]/.test(this.peek())) {
                num += this.advance();
            }
        }

        return { type: 'NUMBER', value: parseFloat(num) };
    }

    private readIdentifier(): Token {
        let id = '';
        while (this.isAlphaNum(this.peek())) {
            id += this.advance();
        }
        return { type: 'IDENTIFIER', value: id };
    }

    getNextToken(): Token {
        if (this.pos >= this.input.length) {
            return { type: 'EOF', value: '' };
        }

        const char = this.peek();

        if (this.isDigit(char)) {
            return this.readNumber();
        }

        if (this.isAlpha(char)) {
            return this.readIdentifier();
        }

        // Comparison operators (two-char first)
        if (char === '=' && this.peek(1) === '=') {
            this.advance(); this.advance();
            return { type: 'COMPARISON', value: '==' };
        }
        if (char === '!' && this.peek(1) === '=') {
            this.advance(); this.advance();
            return { type: 'COMPARISON', value: '!=' };
        }
        if (char === '<' && this.peek(1) === '=') {
            this.advance(); this.advance();
            return { type: 'COMPARISON', value: '<=' };
        }
        if (char === '>' && this.peek(1) === '=') {
            this.advance(); this.advance();
            return { type: 'COMPARISON', value: '>=' };
        }
        if (char === '<') {
            this.advance();
            return { type: 'COMPARISON', value: '<' };
        }
        if (char === '>') {
            this.advance();
            return { type: 'COMPARISON', value: '>' };
        }

        // Ternary operator
        if (char === '?') {
            this.advance();
            return { type: 'QUESTION', value: '?' };
        }
        if (char === ':') {
            this.advance();
            return { type: 'COLON', value: ':' };
        }

        if (['+', '-', '*', '/', '^'].includes(char)) {
            this.advance();
            return { type: 'OPERATOR', value: char };
        }

        if (char === '(') {
            this.advance();
            return { type: 'LPAREN', value: '(' };
        }

        if (char === ')') {
            this.advance();
            return { type: 'RPAREN', value: ')' };
        }

        if (char === ',') {
            this.advance();
            return { type: 'COMMA', value: ',' };
        }

        throw new FormulaError(`Unknown character: '${char}'`);
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];
        let token: Token;

        while ((token = this.getNextToken()).type !== 'EOF') {
            tokens.push(token);
        }
        tokens.push(token); // EOF

        return tokens;
    }
}

// ============================================
// Parser (Recursive Descent)
// ============================================

class Parser {
    private tokens: Token[];
    private pos = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private current(): Token {
        return this.tokens[this.pos] || { type: 'EOF', value: '' };
    }

    private consume(type?: TokenType): Token {
        const token = this.current();
        if (type && token.type !== type) {
            throw new FormulaError(`Expected ${type}, got ${token.type}`);
        }
        this.pos++;
        return token;
    }

    parse(): ASTNode {
        const result = this.parseTernary();
        if (this.current().type !== 'EOF') {
            throw new FormulaError(`Unexpected token: ${this.current().value}`);
        }
        return result;
    }

    // Ternary: Comparison ('?' Ternary ':' Ternary)?
    private parseTernary(): ASTNode {
        const condition = this.parseComparison();

        if (this.current().type === 'QUESTION') {
            this.consume(); // ?
            const ifTrue = this.parseTernary();
            this.consume('COLON'); // :
            const ifFalse = this.parseTernary();
            return { type: 'Ternary', condition, ifTrue, ifFalse };
        }

        return condition;
    }

    // Comparison: Expression (('==' | '!=' | '<' | '>' | '<=' | '>=') Expression)?
    private parseComparison(): ASTNode {
        let left = this.parseExpression();

        while (this.current().type === 'COMPARISON') {
            const op = this.consume().value as string;
            const right = this.parseExpression();
            left = { type: 'BinaryOp', operator: op, left, right };
        }

        return left;
    }

    // Expression: Term (('+' | '-') Term)*
    private parseExpression(): ASTNode {
        let left = this.parseTerm();

        while (this.current().type === 'OPERATOR' &&
            (this.current().value === '+' || this.current().value === '-')) {
            const op = this.consume().value as string;
            const right = this.parseTerm();
            left = { type: 'BinaryOp', operator: op, left, right };
        }

        return left;
    }

    // Term: Power (('*' | '/') Power)*
    private parseTerm(): ASTNode {
        let left = this.parsePower();

        while (this.current().type === 'OPERATOR' &&
            (this.current().value === '*' || this.current().value === '/')) {
            const op = this.consume().value as string;
            const right = this.parsePower();
            left = { type: 'BinaryOp', operator: op, left, right };
        }

        return left;
    }

    // Power: Unary ('^' Power)?  (right-associative)
    private parsePower(): ASTNode {
        const left = this.parseUnary();

        if (this.current().type === 'OPERATOR' && this.current().value === '^') {
            this.consume();
            const right = this.parsePower(); // Right associative
            return { type: 'BinaryOp', operator: '^', left, right };
        }

        return left;
    }

    // Unary: ('-' | '+')? Primary
    private parseUnary(): ASTNode {
        if (this.current().type === 'OPERATOR' &&
            (this.current().value === '-' || this.current().value === '+')) {
            const op = this.consume().value as string;
            const operand = this.parseUnary();
            return { type: 'UnaryOp', operator: op, operand };
        }
        return this.parsePrimary();
    }

    // Primary: NUMBER | IDENTIFIER | FunctionCall | '(' Ternary ')'
    private parsePrimary(): ASTNode {
        const token = this.current();

        if (token.type === 'NUMBER') {
            this.consume();
            return { type: 'Number', value: token.value as number };
        }

        if (token.type === 'IDENTIFIER') {
            this.consume();
            const name = token.value as string;

            // Check if function call
            if (this.current().type === 'LPAREN') {
                return this.parseFunctionCall(name);
            }

            return { type: 'Identifier', name };
        }

        if (token.type === 'LPAREN') {
            this.consume();
            const expr = this.parseTernary();
            this.consume('RPAREN');
            return expr;
        }

        throw new FormulaError(`Unexpected token: ${token.type} (${token.value})`);
    }

    private parseFunctionCall(name: string): FunctionCallNode {
        this.consume('LPAREN');
        const args: ASTNode[] = [];

        if (this.current().type !== 'RPAREN') {
            args.push(this.parseTernary());

            while (this.current().type === 'COMMA') {
                this.consume();
                args.push(this.parseTernary());
            }
        }

        this.consume('RPAREN');
        return { type: 'FunctionCall', name, args };
    }
}

// ============================================
// Evaluator
// ============================================

class Evaluator {
    private variables: Record<string, number>;

    constructor(variables: Record<string, number> = {}) {
        this.variables = { ...CONSTANTS, ...variables };
    }

    evaluate(node: ASTNode): number {
        switch (node.type) {
            case 'Number':
                return node.value;

            case 'Identifier': {
                const val = this.variables[node.name];
                if (val === undefined) {
                    throw new FormulaError(`Unknown variable: '${node.name}'`);
                }
                return val;
            }

            case 'BinaryOp': {
                const left = this.evaluate(node.left);
                const right = this.evaluate(node.right);

                switch (node.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/':
                        if (right === 0) throw new FormulaError('Division by zero');
                        return left / right;
                    case '^': return Math.pow(left, right);
                    // Comparison operators return 1 (true) or 0 (false)
                    case '==': return left === right ? 1 : 0;
                    case '!=': return left !== right ? 1 : 0;
                    case '<': return left < right ? 1 : 0;
                    case '>': return left > right ? 1 : 0;
                    case '<=': return left <= right ? 1 : 0;
                    case '>=': return left >= right ? 1 : 0;
                    default:
                        throw new FormulaError(`Unknown operator: ${node.operator}`);
                }
            }

            case 'UnaryOp': {
                const operand = this.evaluate(node.operand);
                switch (node.operator) {
                    case '-': return -operand;
                    case '+': return operand;
                    default:
                        throw new FormulaError(`Unknown unary operator: ${node.operator}`);
                }
            }

            case 'FunctionCall': {
                const func = FUNCTIONS[node.name];
                if (!func) {
                    throw new FormulaError(`Unknown function: '${node.name}'`);
                }
                const args = node.args.map(arg => this.evaluate(arg));
                return func(...args);
            }

            case 'Ternary': {
                const cond = this.evaluate(node.condition);
                // Treat any non-zero value as true
                return cond !== 0 ? this.evaluate(node.ifTrue) : this.evaluate(node.ifFalse);
            }
        }
    }
}

// ============================================
// Error Type
// ============================================

export class FormulaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FormulaError';
    }
}

// ============================================
// Public API
// ============================================

/**
 * Parse and evaluate a formula string with given variables
 * 
 * @example
 * evaluateFormula("PI * diameter^2 / 4", { diameter: 10 }) // 78.54
 * evaluateFormula("sqrt(a^2 + b^2)", { a: 3, b: 4 }) // 5
 * evaluateFormula("x > 10 ? 1 : 0", { x: 15 }) // 1
 */
export function evaluateFormula(
    formula: string,
    variables: Record<string, number> = {}
): number {
    const lexer = new Lexer(formula);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const evaluator = new Evaluator(variables);
    return evaluator.evaluate(ast);
}

/**
 * Check if a formula is syntactically valid
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
    try {
        const lexer = new Lexer(formula);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        parser.parse();
        return { valid: true };
    } catch (e) {
        return {
            valid: false,
            error: e instanceof Error ? e.message : 'Unknown error'
        };
    }
}

/**
 * Extract variable names from a formula
 */
export function extractVariables(formula: string): string[] {
    const variables: Set<string> = new Set();
    try {
        const lexer = new Lexer(formula);
        const tokens = lexer.tokenize();

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === 'IDENTIFIER') {
                const name = token.value as string;
                // Skip if it's a constant or function
                if (!CONSTANTS[name] && !FUNCTIONS[name]) {
                    // Skip if followed by ( - it's a function call
                    if (tokens[i + 1]?.type !== 'LPAREN') {
                        variables.add(name);
                    }
                }
            }
        }
    } catch {
        // Return empty if parsing fails
    }

    return Array.from(variables);
}

/**
 * Get list of available functions
 */
export function getAvailableFunctions(): string[] {
    return Object.keys(FUNCTIONS);
}

/**
 * Get list of available constants
 */
export function getAvailableConstants(): Record<string, number> {
    return { ...CONSTANTS };
}

