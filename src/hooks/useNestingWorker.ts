/**
 * useNestingWorker Hook
 * React hook for managing 2D nesting Web Worker lifecycle
 */

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import type { NestingJob, NestingResult } from '@/types/nesting2d.types';

export interface NestingProgress {
    currentPart: number;
    totalParts: number;
    currentSheet: number;
    percent: number;
}

export interface UseNestingWorkerReturn {
    /** Start nesting computation */
    run: (job: NestingJob) => void;
    /** Cancel current computation */
    cancel: () => void;
    /** Current progress */
    progress: NestingProgress | null;
    /** Final result when complete */
    result: NestingResult | null;
    /** Error message if failed */
    error: string | null;
    /** Is worker currently running */
    isRunning: boolean;
    /** Reset state */
    reset: () => void;
}

export function useNestingWorker(): UseNestingWorkerReturn {
    const workerRef = useRef<Worker | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState<NestingProgress | null>(null);
    const [result, setResult] = useState<NestingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize worker
    const initWorker = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        // Create worker from URL
        const worker = new Worker(
            new URL('../workers/nesting.worker.ts', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = (event: MessageEvent) => {
            const { type, payload } = event.data;

            switch (type) {
                case 'progress':
                    setProgress(payload as NestingProgress);
                    break;
                case 'complete':
                    setResult(payload as NestingResult);
                    setIsRunning(false);
                    break;
                case 'error':
                    setError(payload as string);
                    setIsRunning(false);
                    break;
                case 'cancelled':
                    setIsRunning(false);
                    break;
            }
        };

        worker.onerror = (event) => {
            setError(`Worker error: ${event.message}`);
            setIsRunning(false);
        };

        workerRef.current = worker;
        return worker;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    // Run nesting
    const run = useCallback((job: NestingJob) => {
        setError(null);
        setResult(null);
        setProgress(null);
        setIsRunning(true);

        const worker = initWorker();
        worker.postMessage({ type: 'start', payload: job });
    }, [initWorker]);

    // Cancel current computation
    const cancel = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.postMessage({ type: 'cancel' });
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setIsRunning(false);
    }, []);

    // Reset state
    const reset = useCallback(() => {
        cancel();
        setProgress(null);
        setResult(null);
        setError(null);
    }, [cancel]);

    return {
        run,
        cancel,
        progress,
        result,
        error,
        isRunning,
        reset
    };
}
