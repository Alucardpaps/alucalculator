"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Terminal, Shield } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global Error Boundary (Wave 5.0)
 * Prevents White Screen of Death with a premium industrial fallback.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ALUCALC_OS_CRITICAL_FAULT:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020408] flex items-center justify-center p-6 text-slate-200">
          <div className="max-w-md w-full p-8 bg-[#0f172a] border border-red-500/20 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
            
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-black text-white uppercase tracking-tight">System Interruption</h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                    A kernel-level fault was detected in the workstation. Your project data is persisted and safe in the cloud.
                </p>
            </div>

            <div className="space-y-3">
                <div className="p-4 bg-black/40 rounded-xl border border-slate-800 flex items-center gap-3">
                    <Terminal size={14} className="text-slate-600" />
                    <span className="text-[10px] font-mono text-red-400 uppercase truncate">
                        {this.state.error?.name || "CORE_FAULT"}: {this.state.error?.message}
                    </span>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-slate-800 flex items-center gap-3">
                    <Shield size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Data Protection Active</span>
                </div>
            </div>

            <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
            >
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                Re-initialize Core
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
