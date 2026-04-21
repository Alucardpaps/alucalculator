/**
 * Error Taxonomy & Management
 * Standardizes failure reporting across all layers of the SaaS.
 */

export type ErrorLayer = 'api' | 'service' | 'engine' | 'repository';

export interface AppErrorOptions {
    code: string;
    layer: ErrorLayer;
    message: string;
    context?: string;
    recoverable?: boolean;
    traceId?: string;
    originalError?: any;
}

export class AppError extends Error {
    public readonly code: string;
    public readonly layer: ErrorLayer;
    public readonly context?: string;
    public readonly recoverable: boolean;
    public readonly traceId?: string;
    public readonly originalError?: any;

    constructor(options: AppErrorOptions) {
        super(options.message);
        this.name = 'AppError';
        this.code = options.code;
        this.layer = options.layer;
        this.context = options.context;
        this.recoverable = options.recoverable ?? false;
        this.traceId = options.traceId;
        this.originalError = options.originalError;

        // Ensure proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    public toJSON() {
        return {
            error: true,
            code: this.code,
            layer: this.layer,
            message: this.message,
            recoverable: this.recoverable,
            traceId: this.traceId,
        };
    }
}

/**
 * Common Error Factories
 */
export const Errors = {
    Unauthorized: (traceId?: string) => new AppError({
        code: 'UNAUTHORIZED',
        layer: 'api',
        message: 'Access denied. Please sign in.',
        recoverable: true,
        traceId
    }),
    
    DatabaseError: (message: string, context: string, traceId?: string) => new AppError({
        code: 'DB_OPERATION_FAILED',
        layer: 'repository',
        message,
        context,
        recoverable: true,
        traceId
    }),

    EngineError: (message: string, traceId?: string) => new AppError({
        code: 'ENGINE_COMPUTE_FAILED',
        layer: 'engine',
        message,
        recoverable: false,
        traceId
    })
};
