'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CookieConsent - A premium, OS-style floating notification for GDPR compliance.
 * Integration with AluCalc dark technical theme.
 */
export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('alucalc-cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('alucalc-cookie-consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[10001] max-w-sm"
                >
                    <div className="bg-[var(--bg-1)] border border-[var(--line)] p-4 rounded-[var(--radius-m)] shadow-2xl font-mono text-xs">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="bg-[var(--cyan)]/10 p-1.5 rounded-[var(--radius-s)] text-[var(--cyan)] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-0.5">Telemetry & KVKK</h4>
                                <p className="text-[11px] font-sans text-[var(--alu-dim)] leading-normal">
                                    Industrial-grade local telemetry is used to maintain solver cache state and optimize calculation workflows.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAccept}
                                className="flex-1 bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] text-[var(--bg-0)] hover:text-white font-bold py-2 rounded-[var(--radius-s)] text-[11px] transition-colors"
                            >
                                ACCEPT
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="px-3 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu)] hover:text-white font-bold py-2 rounded-[var(--radius-s)] text-[11px] border border-[var(--line)] transition-colors"
                            >
                                CLOSE
                            </button>
                        </div>
                        {/* Technical Metadata */}
                        <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex justify-between items-center text-[9px] text-[var(--alu-dim)]/60">
                            <span>KVKK_COMPLIANT_2026</span>
                            <span>LOCAL_STORAGE_ONLY</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
