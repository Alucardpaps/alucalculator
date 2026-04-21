import { AppError } from "./errors";
import { TelemetryMode } from "./timeline";

/**
 * Execution Result Contract v1
 * The Unified Response Model for the entire AluCalc platform.
 */

export interface ExecutionResult<T = any> {
    success: boolean;
    traceId: string;
    data: T | null;
    error: {
        code: string;
        layer: string;
        message: string;
        recoverable: boolean;
    } | null;
    performance: {
        totalMs: number;
        status: 'healthy' | 'latency_warning';
    };
    telemetry: {
        mode: TelemetryMode;
        timeline: any;
    };
}

/**
 * Contract Builder Utility
 */
export const buildExecutionResult = <T>(
    success: boolean,
    traceId: string,
    data: T | null = null,
    error: AppError | null = null,
    totalMs: number = 0,
    telemetryMode: TelemetryMode = 'summary',
    timeline: any = null
): ExecutionResult<T> => {
    return {
        success,
        traceId,
        data,
        error: error ? {
            code: error.code,
            layer: error.layer,
            message: error.message,
            recoverable: error.recoverable
        } : null,
        performance: {
            totalMs: parseFloat(totalMs.toFixed(2)),
            status: totalMs > 200 ? 'latency_warning' : 'healthy'
        },
        telemetry: {
            mode: telemetryMode,
            timeline
        }
    };
};
