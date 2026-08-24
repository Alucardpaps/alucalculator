'use client';

import React, { useEffect, useState } from 'react';
import { useOSStore } from '@/store/osStore';

export function SelfDestructOverlay() {
    const { isSelfDestructing } = useOSStore();
    const [countdown, setCountdown] = useState(10);
    const [crashed, setCrashed] = useState(false);

    useEffect(() => {
        if (!isSelfDestructing) {
            setCountdown(10);
            setCrashed(false);
            return;
        }

        import('@/lib/audioEngine').then(m => m.sysAudio.playAlarm());
        const alarmInterval = setInterval(() => {
            if (!crashed) import('@/lib/audioEngine').then(m => m.sysAudio.playAlarm());
        }, 1000);

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setCrashed(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(alarmInterval);
            clearInterval(countdownInterval);
        };
    }, [isSelfDestructing, crashed]);

    if (!isSelfDestructing) return null;

    if (crashed) {
        return (
            <div className="fixed inset-0 z-[99999] bg-black text-green-500 font-mono p-4 flex flex-col justify-start items-start pointer-events-auto">
                <div>root@alucalc-core:~# ERROR_CRITICAL_OVERLOAD</div>
                <div>INITIATING EMERGENCY KERNEL DUMP...</div>
                <div className="mt-2 opacity-50 text-xs">0x00000008 0x00000000 0x000000F4 0x00000000</div>
                <div className="mt-2 opacity-50 text-xs">MEMORY DUMP COMPLETE.</div>
                <div className="mt-4 animate-pulse">REBOOTING SYSTEM...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[99999] bg-red-900/40 backdrop-blur-md flex items-center justify-center pointer-events-auto overflow-hidden">
            {/* Pulsing warning light effect */}
            <div className="absolute inset-0 bg-red-600 mix-blend-overlay opacity-30 animate-pulse"></div>

            <div className="relative flex flex-col items-center justify-center z-10 animate-shake">
                <h1 className="text-6xl md:text-8xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] uppercase">
                    Critical Failure
                </h1>
                <p className="mt-4 text-xl font-mono text-red-200 tracking-widest bg-black/50 px-6 py-2 border border-red-500/50">
                    SELF-DESTRUCT INITIATED
                </p>
                <div className="mt-12 text-[12rem] leading-none font-black font-mono text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]">
                    {countdown}
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    10% { transform: translate(-5px, -5px) rotate(-1deg); }
                    20% { transform: translate(5px, 5px) rotate(1deg); }
                    30% { transform: translate(-5px, 5px) rotate(0deg); }
                    40% { transform: translate(5px, -5px) rotate(1deg); }
                    50% { transform: translate(-5px, -5px) rotate(-1deg); }
                    60% { transform: translate(5px, 5px) rotate(0deg); }
                    70% { transform: translate(-5px, 5px) rotate(1deg); }
                    80% { transform: translate(-5px, -5px) rotate(-1deg); }
                    90% { transform: translate(5px, -5px) rotate(0deg); }
                }
                .animate-shake {
                    animation: shake 0.5s infinite;
                }
            `}</style>
        </div>
    );
}
