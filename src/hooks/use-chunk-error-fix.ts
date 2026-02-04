'use client';

import { useEffect } from 'react';

/**
 * Silent Auto-Reload Hook for Chunk Load Errors
 * 
 * Handles 404 chunk load errors that occur after new deployments
 * when users have stale JS bundles cached in their browser.
 * 
 * Patterns detected:
 * - "Loading chunk" (webpack chunk failures)
 * - "Loading CSS chunk" (CSS chunk failures)
 * - "minified react error" (React hydration mismatches)
 * 
 * Uses sessionStorage to prevent infinite reload loops:
 * - Max 1 reload per 10 second window
 */

const STORAGE_KEY = 'chunk_error_reload_timestamp';
const RELOAD_COOLDOWN_MS = 10_000; // 10 seconds

/**
 * Check if a reload is allowed based on cooldown period
 */
function canReload(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const lastReload = sessionStorage.getItem(STORAGE_KEY);
        if (!lastReload) return true;

        const lastReloadTime = parseInt(lastReload, 10);
        const now = Date.now();

        // Allow reload if cooldown has passed
        return (now - lastReloadTime) > RELOAD_COOLDOWN_MS;
    } catch {
        // sessionStorage might be blocked in some contexts
        return false;
    }
}

/**
 * Mark that a reload is being performed
 */
function markReload(): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
        // Silently fail if sessionStorage is unavailable
    }
}

/**
 * Check if error message indicates a chunk load failure
 */
function isChunkError(message: string): boolean {
    const patterns = [
        'Loading chunk',
        'Loading CSS chunk',
        'minified react error',
        'ChunkLoadError',
        'Failed to fetch dynamically imported module',
    ];

    return patterns.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
    );
}

/**
 * Hook to handle chunk load errors with silent auto-reload
 */
export function useChunkErrorFix(): void {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleError = (event: ErrorEvent) => {
            const message = event.message || '';
            const errorStr = event.error?.toString() || '';

            if (isChunkError(message) || isChunkError(errorStr)) {
                console.warn('[ChunkErrorFix] Chunk load error detected:', message);

                if (canReload()) {
                    console.warn('[ChunkErrorFix] Performing silent reload...');
                    markReload();
                    window.location.reload();
                } else {
                    console.warn('[ChunkErrorFix] Reload cooldown active, skipping reload');
                }
            }
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason?.message || event.reason?.toString() || '';

            if (isChunkError(reason)) {
                console.warn('[ChunkErrorFix] Chunk load error in promise:', reason);

                if (canReload()) {
                    console.warn('[ChunkErrorFix] Performing silent reload...');
                    markReload();
                    window.location.reload();
                } else {
                    console.warn('[ChunkErrorFix] Reload cooldown active, skipping reload');
                }
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);
}

export default useChunkErrorFix;
