/**
 * 🏛️ ALUCALCULATOR KERNEL - ERRORS
 * "The Judicial System"
 */

export class KernelError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'KernelError';
    }
}

export class UnitMismatchError extends KernelError {
    constructor(expected: string, got: string) {
        super(`Unit Mismatch: Expected type '${expected}', got '${got}'`);
        this.name = 'UnitMismatchError';
    }
}

export class CircularDependencyError extends KernelError {
    constructor(cyclePath: string) {
        super(`Circular Dependency Detected: ${cyclePath}`);
        this.name = 'CircularDependencyError';
    }
}

export class ValidationError extends KernelError {
    constructor(message: string) {
        super(`Validation Failed: ${message}`);
        this.name = 'ValidationError';
    }
}

export class ComplianceError extends KernelError {
    constructor(message: string) {
        super(`Compliance Violation: ${message}`);
        this.name = 'ComplianceError';
    }
}
