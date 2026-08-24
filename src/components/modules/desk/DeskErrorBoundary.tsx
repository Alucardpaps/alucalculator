'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class DeskErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Desk System Crash:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleReset = () => {
        if (confirm('Are you sure you want to maintain system integrity by purging corrupt Desk data? This action is irreversible.')) {
            // Nuke all desk-related local storage
            localStorage.removeItem('alucalc-desk-v1'); // Legacy
            localStorage.removeItem('alucalc-desk-v2'); // Current
            this.setState({ hasError: false, error: null });
            window.location.reload();
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0e14] text-white p-8 font-mono">
                    <div className="max-w-md w-full bg-[#131b26] border border-red-500/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                        {/* Accessorizer */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />

                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertTriangle size={32} />
                            <h2 className="text-xl font-bold tracking-wider">SYSTEM FAILURE</h2>
                        </div>

                        <p className="text-gray-400 text-sm mb-4">
                            The Desk module encountered a critical rendering error. This is likely due to corrupted local persistence data or a browser memory limit.
                        </p>

                        <div className="bg-black/50 rounded p-3 mb-6 border border-[#2a3a4a] text-xs font-mono text-red-400 overflow-x-auto">
                            {this.state.error?.message || 'Unknown Error'}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e2833] hover:bg-[#2a3a4a] rounded-lg transition-colors text-xs font-bold uppercase tracking-widest text-[#00e5ff]"
                            >
                                <RefreshCw size={14} />
                                Restart
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest text-red-400"
                            >
                                <Trash2 size={14} />
                                Purge Data
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
