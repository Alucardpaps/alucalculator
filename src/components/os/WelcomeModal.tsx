'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { Grid3X3, MousePointer2, Cpu, Activity, Terminal, ArrowRight, Sparkles } from 'lucide-react';

export function WelcomeModal() {
    const { showWelcomeModal, completeWelcome, hasSeenWelcome, openWelcome, setWorkspaceMode } = useOSStore();
    const { t } = useI18nStore();
    const [bootState, setBootState] = useState<'init' | 'select' | 'complete'>('init');
    const [showSkip, setShowSkip] = useState(false);

    // Skip timer (Fail-safe)
    useEffect(() => {
        if (bootState === 'init' && showWelcomeModal) {
            const skipTimer = setTimeout(() => setShowSkip(true), 5000);
            return () => clearTimeout(skipTimer);
        } else {
            setShowSkip(false);
        }
    }, [bootState, showWelcomeModal]);

    // Boot Sequence Timer
    useEffect(() => {
        if (showWelcomeModal) {
            setBootState('init');
            const timer = setTimeout(() => {
                setBootState('select');
            }, 2800);
            return () => clearTimeout(timer);
        }
    }, [showWelcomeModal]);

    // Initial check for first-time visitors
    useEffect(() => {
        if (!hasSeenWelcome && !showWelcomeModal) {
            openWelcome();
        }
    }, [hasSeenWelcome, showWelcomeModal, openWelcome]);

    const handleSelect = (mode: 'cad' | 'flow' | 'desk') => {
        setWorkspaceMode(mode);
        completeWelcome();
    };

    if (!showWelcomeModal) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0e18 40%, #0d1020 100%)' }}>

                {/* Animated gradient orb */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />

                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* STAGE 1: BOOT SEQUENCE */}
                {bootState === 'init' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center p-8 max-w-lg mx-auto"
                    >
                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mb-12 relative"
                        >
                            <div className="w-20 h-20 rounded-3xl flex items-center justify-center relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(6,182,212,0.8), rgba(59,130,246,0.4) 50%, rgba(139,92,246,0.2))',
                                    boxShadow: '0 0 60px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                }}
                            >
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
                                <Cpu size={36} className="text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                            </div>
                        </motion.div>

                        {/* Boot text */}
                        <div className="w-full space-y-3 mb-10 font-mono">
                            <BootLine delay={0.3} text={t.bootInit} />
                            <BootLine delay={0.8} text={t.bootLoading} />
                            <BootLine delay={1.4} text={t.bootMounting} />
                            <BootLine delay={2.0} text={t.bootReady} accent />
                        </div>


                        {/* Premium loading bar */}
                        <div className="w-72 h-1 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                                className="h-full rounded-full relative"
                                style={{
                                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)',
                                    boxShadow: '0 0 16px rgba(6,182,212,0.5)',
                                }}
                            />
                        </div>

                        {/* Emergency Skip Button */}
                        <AnimatePresence>
                            {showSkip && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setBootState('select')}
                                    className="mt-8 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-white/40 hover:bg-white/10 hover:text-white transition-all uppercase tracking-[0.2em]"
                                >
                                    Skip Boot Sequence
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* STAGE 2: WORKSPACE SELECTOR */}
                {bootState === 'select' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full flex flex-col items-center justify-center p-8"
                    >
                        <div className="text-center mb-14">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium"
                                style={{
                                    background: 'rgba(6,182,212,0.08)',
                                    border: '1px solid rgba(6,182,212,0.15)',
                                    color: 'rgba(6,182,212,0.9)',
                                }}
                            >
                                <Sparkles size={12} />
                                {t.systemInit}
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3"
                            >
                                {t.welcomeTitle} <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' }}>{t.welcomeHighlight}</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-white/30 max-w-md mx-auto"
                            >
                                {t.welcomeDesc}
                            </motion.p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
                            <BootCard
                                title={t.flowTitle}
                                desc={t.flowDesc}
                                icon={Grid3X3}
                                color="#06b6d4"
                                delay={0.3}
                                onClick={() => handleSelect('flow')}
                            />
                            <BootCard
                                title={t.cadTitle}
                                desc={t.cadDesc}
                                icon={MousePointer2}
                                color="#10b981"
                                delay={0.4}
                                onClick={() => handleSelect('cad')}
                            />
                            <BootCard
                                title={t.deskTitle}
                                desc={t.deskDesc}
                                icon={Terminal}
                                color="#8b5cf6"
                                delay={0.5}
                                onClick={() => handleSelect('desk')}
                            />
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="fixed bottom-6 text-[10px] text-white/15 font-mono tracking-wider uppercase"
                        >
                            {t.osName} {t.version} — BUILD 2026.02
                        </motion.div>
                    </motion.div>
                )}

            </div>
        </AnimatePresence>
    );
}

// ── Sub-components ──

function BootLine({ text, delay, accent = false }: { text: string; delay: number; accent?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={`flex items-center gap-2 text-xs ${accent ? 'text-cyan-400' : 'text-white/25'}`}
        >
            <span className="text-white/10">›</span> {text}
        </motion.div>
    );
}

function BootCard({ title, desc, icon: Icon, color, delay, onClick }: {
    title: string; desc: string; icon: any; color: string; delay: number; onClick: () => void;
}) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClick}
            className="group relative p-8 h-56 text-left rounded-2xl overflow-hidden transition-all duration-300"
            style={{
                background: `linear-gradient(160deg, ${color}10, rgba(255,255,255,0.02) 50%, transparent)`,
                border: `1px solid ${color}18`,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${color}50`;
                (e.currentTarget as HTMLElement).style.background = `linear-gradient(160deg, ${color}18, rgba(255,255,255,0.03) 50%, transparent)`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${color}15, inset 0 1px 0 rgba(255,255,255,0.03)`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${color}18`;
                (e.currentTarget as HTMLElement).style.background = `linear-gradient(160deg, ${color}10, rgba(255,255,255,0.02) 50%, transparent)`;
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
        >
            {/* Gradient orb */}
            <div className="absolute top-0 right-0 w-40 h-40 -translate-y-12 translate-x-12 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${color}, transparent)`, filter: 'blur(40px)' }}
            />

            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 overflow-hidden relative"
                style={{
                    background: `linear-gradient(145deg, ${color}cc, ${color}40 50%, ${color}20)`,
                    border: `1px solid ${color}30`,
                    boxShadow: `0 4px 12px ${color}20, inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}
            >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
                <Icon size={22} className="text-white relative z-10" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
            </div>

            <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{title}</h3>
            <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors leading-relaxed">{desc}</p>

            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0" style={{ color }}>
                <ArrowRight size={18} />
            </div>
        </motion.button>
    );
}
