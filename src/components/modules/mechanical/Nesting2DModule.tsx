'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamic import for the heavy Nesting2D component
const Nesting2D = dynamic(() => import('@/components/Nesting2D').then(mod => mod.Nesting2D), {
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="text-sm font-medium">Loading Nesting Engine...</span>
        </div>
    ),
    ssr: false // Client-side only (worker dependency)
});

interface Nesting2DModuleProps {
    lang?: string;
    dict?: any;
}

/**
 * Nesting2DModule - Wrapper for the 2D Nesting System
 * Connects the OS window to the actual Nesting2D component
 */
export default function Nesting2DModule({ lang = 'en', dict = {} }: Nesting2DModuleProps) {
    // Memoize props to prevent unnecessary re-renders
    const props = useMemo(() => ({ lang, dict }), [lang, dict]);

    return (
        <div className="h-full w-full overflow-hidden bg-white dark:bg-slate-950">
            <Nesting2D {...props} />
        </div>
    );
}
