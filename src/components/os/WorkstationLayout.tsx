'use client';

import React from 'react';
import { UserMenu } from '@/components/auth/UserMenu';
import { Settings, ChevronLeft, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';
import { useI18nStore } from '@/store/i18nStore';
import { getWorkstationPage } from '@/locales/workstationPageTranslations';

interface WorkstationLayoutProps {
    children: React.ReactNode;
    title: string;
    id: string;
    status: 'idle' | 'stable' | 'error';
    onCalculate?: () => void;
    onSave?: () => void;
    isSaving?: boolean;
}

/**
 * 🛠️ Global Workstation Layout (AluCalc Instrument OS Standard)
 * Unifies all engineering modules under an industrial CNC control panel / Fluke meter aesthetic.
 */
export const WorkstationLayout = ({
    children,
    title,
    id,
    status,
    onCalculate,
    onSave,
    isSaving
}: WorkstationLayoutProps) => {
    const { language } = useI18nStore();
    const t = getWorkstationPage(language).layout;
    const statusLabel = status === 'stable' ? t.statusStable : status === 'error' ? t.statusError : t.statusIdle;

    return (
        <div className="min-h-screen bg-[var(--bg-0)] text-[var(--ink)] selection:bg-[var(--cyan)]/20 font-sans">
            {/* Corner Registration Crosshairs (+) */}
            <div className="pointer-events-none fixed top-16 left-3 font-mono text-[10px] text-[var(--line-strong)] select-none">
                +
            </div>
            <div className="pointer-events-none fixed top-16 right-3 font-mono text-[10px] text-[var(--line-strong)] select-none">
                +
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-8">
                {/* ─── WORKSTATION TOP INSTRUMENT CONSOLE ─── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
                    <div className="space-y-2">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[var(--alu-dim)] hover:text-[var(--cyan)] transition-colors uppercase tracking-wider group"
                        >
                            <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                            {t.returnToCommandCenter}
                        </Link>
                        
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-bold font-tech tracking-tight text-[var(--ink)] flex items-center gap-3">
                                <span>{title}</span>
                                <span className="text-[10px] font-mono font-bold text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded-[var(--radius-s)] border border-[var(--std)]/30 tracking-widest uppercase">
                                    {id}
                                </span>
                            </h1>

                            <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <span 
                                        className={`w-2 h-2 rounded-full ${
                                            status === 'stable' 
                                                ? 'bg-[var(--ok)] ' 
                                                : status === 'error' 
                                                ? 'bg-[var(--bad)] ' 
                                                : 'bg-[var(--warn)]'
                                        }`} 
                                    />
                                    <span>{t.status}: <span className="text-[var(--ink)] font-bold">{statusLabel}</span></span>
                                </span>
                                <span className="text-[var(--line-strong)]">|</span>
                                <span className="flex items-center gap-1 text-[var(--alu-dim)]">
                                    <ShieldCheck size={12} className="text-[var(--cyan)]" />
                                    <span>64-bit IEEE 754 Deterministic</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ─── INSTRUMENT ACTION WELL ─── */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[var(--bg-1)] p-1.5 rounded-[var(--radius-m)] border border-[var(--line)]">
                            {onCalculate && (
                                <button
                                    type="button"
                                    onClick={onCalculate}
                                    className="px-4 py-2 bg-[var(--cyan)] hover:bg-[var(--cyan)] text-slate-950 text-[11px] font-mono font-bold uppercase tracking-wider rounded-[var(--radius-s)] transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                                >
                                    <Activity size={13} className="text-slate-950" />
                                    <span>{t.executeAnalysis}</span>
                                </button>
                            )}
                            {onSave && (
                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--ok)] text-[11px] font-mono font-semibold uppercase tracking-wider rounded-[var(--radius-s)] transition-all border border-[var(--ok)]/30 active:scale-98 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? '...' : t.saveToWorkspace}
                                </button>
                            )}
                            <div className="h-6 w-px bg-[var(--line)] mx-1" />
                            <button 
                                type="button" 
                                className="p-2 rounded-[var(--radius-s)] hover:bg-[var(--bg-2)] transition-colors text-[var(--alu-dim)] hover:text-[var(--ink)]"
                                aria-label="Settings"
                            >
                                <Settings size={15} />
                            </button>
                        </div>
                        <UserMenu />
                    </div>
                </div>

                {/* ─── WORKSTATION GRID ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default WorkstationLayout;
