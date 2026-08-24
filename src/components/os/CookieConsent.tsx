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
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.95 }}
                    className="fixed bottom-24 left-6 z-[10001] max-w-sm"
                >
                    <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-blue-500/30 p-6 rounded-2xl shadow-2xl shadow-black/50">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-1">System Personalization</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    We use industrial-standard telemetry to optimize your workstation performance and analyze engineering workflows.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleAccept}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all active:scale-95"
                            >
                                OPTIMIZE SYSTEM
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-all"
                            >
                                DECLINE
                            </button>
                        </div>
                        {/* Technical Metadata */}
                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center opacity-30">
                            <span className="text-[8px] font-mono uppercase tracking-tighter text-slate-500">COOKIE_POLICY_V1.0</span>
                            <span className="text-[8px] font-mono text-slate-500">SECURE_TRANSIT</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
