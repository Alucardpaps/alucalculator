'use client';

/**
 * ⚠️ Canvas Error Boundary
 * 
 * Catches runtime errors in canvas components (AluDrawCanvas, FlowCanvas)
 * and displays a recovery UI instead of crashing the entire OS shell.
 * 
 * Common failure modes this catches:
 * - WebGL context loss (GPU memory pressure)
 * - Component logic error (State crash)
 * - Module load failures on poor connections
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackMode?: string;
    onSwitchMode?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: string;
}

export class CanvasErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: error.message || 'An unexpected error occurred in the canvas renderer.'
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[CanvasErrorBoundary] Caught:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: '' });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14]">
                    <div className="flex flex-col items-center gap-6 max-w-md text-center p-8">
                        {/* Error Icon */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle size={36} className="text-red-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                        </div>

                        {/* Title */}
                        <div>
                            <h2 className="text-lg font-bold text-white mb-2">Canvas Renderer Error</h2>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                The canvas component encountered an error and could not render.
                                This usually happens due to a GPU context loss or a module loading failure.
                            </p>
                        </div>

                        {/* Error Detail (collapsed) */}
                        <div className="w-full bg-red-950/30 border border-red-900/30 rounded-lg p-3">
                            <code className="text-xs text-red-300 font-mono break-all">
                                {this.state.errorInfo}
                            </code>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/20"
                            >
                                <RefreshCw size={14} />
                                Retry
                            </button>
                            {this.props.onSwitchMode && (
                                <button
                                    onClick={this.props.onSwitchMode}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-white/10 transition-all"
                                >
                                    Switch to {this.props.fallbackMode || 'Flow'}
                                    <ArrowRight size={14} />
                                </button>
                            )}
                        </div>

                        {/* Help text */}
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                            If this persists, try refreshing the page or clearing your browser cache.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
