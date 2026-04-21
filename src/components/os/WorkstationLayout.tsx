"use client";

import React from 'react';
import { UserMenu } from '@/components/auth/UserMenu';
import { Settings, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

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
 * Global Workstation Layout (OS Standard)
 * Unifies all engineering modules under a single premium architecture.
 */
export const WorkstationLayout = ({ children, title, id, status, onCalculate, onSave, isSaving }: WorkstationLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#020408] text-slate-200 selection:bg-blue-500/30">
            {/* Ambient OS Lighting */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-8 lg:px-12 space-y-12">
                
                {/* Unified Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-900 pb-10">
                    <div className="space-y-4">
                        <Link 
                            href="/dashboard" 
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-blue-500 transition-colors uppercase tracking-[0.2em] group"
                        >
                            <ChevronLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                            Return to Command Center
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tight text-white flex items-baseline gap-4">
                                {title}
                                <span className="text-[10px] font-mono text-slate-600 font-medium bg-slate-900/50 px-2 py-1 rounded border border-slate-800 tracking-widest">
                                    {id}
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                <span className={status === 'stable' ? 'text-emerald-500' : 'text-amber-500'}>●</span>
                                Status: {status}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-900/30 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                            <button 
                                onClick={onCalculate}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                Execute Analysis
                            </button>
                            {onSave && (
                                <button 
                                    onClick={onSave}
                                    className="px-6 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-600/20 active:scale-95"
                                >
                                    Save to Workspace
                                </button>
                            )}
                            <div className="h-8 w-[1px] bg-slate-800 mx-1"></div>
                            <button className="p-2 rounded-lg hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-300">
                                <Settings size={18} />
                            </button>
                        </div>
                        <UserMenu />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {children}
                </div>
            </div>
        </div>
    );
};
