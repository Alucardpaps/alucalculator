'use client';

import { useEffect, useState } from 'react';
import { useChunkErrorFix } from '@/hooks/use-chunk-error-fix';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface DeploymentGuardProps {
    children: React.ReactNode;
}

export function DeploymentGuard({ children }: DeploymentGuardProps) {
    useChunkErrorFix(); // Hook that handles global module loading errors

    const [isCompatible, setIsCompatible] = useState<boolean | null>(null);
    const [serverBuildId, setServerBuildId] = useState<string | null>(null);
    const [clientBuildId, setClientBuildId] = useState<string | null>(null);

    useEffect(() => {
        // Hydration check for build ID match
        const metaBuildId = document.querySelector('meta[name="build-id"]')?.getAttribute('content');
        setServerBuildId(metaBuildId || 'unknown');

        // In a real scenario, we might fetch a manifest or check a cookie
        // For now, we assume if we rendered, we are okay unless a chunk fails
        setIsCompatible(true);
    }, []);

    if (isCompatible === false) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-[#1e1e1e] text-slate-300 gap-4">
                <AlertTriangle size={48} className="text-amber-500" />
                <h2 className="text-xl font-bold text-white">System Update Detected</h2>
                <p className="text-sm text-center max-w-md text-slate-400">
                    A new version of the engineering engine has been deployed.
                    <br />
                    Synchronizing local kernel...
                </p>
                <div className="flex gap-4 text-xs font-mono mt-2 opacity-50">
                    <span>Client: {clientBuildId}</span>
                    <span>Server: {serverBuildId}</span>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold mt-4"
                >
                    <RefreshCw size={16} />
                    Force Reload
                </button>
            </div>
        );
    }

    if (isCompatible === null) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-[#1e1e1e] text-slate-500">
                <Loader2 size={32} className="animate-spin mb-4" />
                <span className="text-xs tracking-widest uppercase font-bold text-slate-600">Initializing Kernel...</span>
            </div>
        );
    }

    return <>{children}</>;
}
