'use client';

/**
 * ChunkErrorBoundary Component
 * 
 * Client component wrapper that activates the chunk error fix hook.
 * Required because layout.tsx is a Server Component.
 */

import { useChunkErrorFix } from '@/hooks/use-chunk-error-fix';

interface ChunkErrorBoundaryProps {
    children: React.ReactNode;
}

export function ChunkErrorBoundary({ children }: ChunkErrorBoundaryProps) {
    // Activate chunk error fix listener
    useChunkErrorFix();

    return <>{children}</>;
}

export default ChunkErrorBoundary;
