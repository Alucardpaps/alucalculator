'use client';

import { useOSStore } from '@/store/osStore';

export const ChaosOverlay = () => {
    const { isChaosMode } = useOSStore();

    if (!isChaosMode) return null;

    return (
        <div className="fixed inset-0 z-[99999] pointer-events-none mix-blend-difference overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>
            <div className="absolute inset-0 bg-rose-500/5 mix-blend-overlay"></div>
            <div className="absolute w-full h-[2px] bg-emerald-400/30 animate-[scan_8s_linear_infinite]" style={{ boxShadow: '0 0 20px rgba(52, 211, 153, 0.5)' }}></div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
                :global(body) {
                    filter: contrast(1.1) saturate(1.2);
                }
            `}</style>
        </div>
    );
};
