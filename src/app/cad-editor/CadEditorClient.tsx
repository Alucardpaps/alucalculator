'use client';

/**
 * Dedicated 2D AluCAD Drafting Client Component
 * Route: /cad-editor
 * 
 * Supports responsive layout modes with unified edge-to-edge industrial header:
 * - Desktop: Complete AluCAD Studio multi-panel drafting suite with parametric solver & section analysis
 * - Mobile: Touch-optimized Mobile2DCad canvas with quick presets, precision loupe and 3D sync
 */

import React from 'react';
import dynamic from 'next/dynamic';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CadErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CAD Engine Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)] p-6 text-center text-slate-300 font-mono">
          <div className="max-w-md p-6 bg-[var(--bg-1)] border border-[var(--line)] rounded-lg shadow-2xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] text-xl font-bold">
              CAD
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
              CAD Workspace Recovered
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Çizim motoru güvenli modda sıfırlandı. Çiziminizi yeniden yüklemek veya devam etmek için aşağıdaki butona basabilirsiniz.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-2 px-4 rounded bg-cyan-500 hover:bg-cyan-400 text-[var(--bg-0)] font-bold text-xs uppercase transition-all shadow"
              >
                Çizim Masasını Yeniden Başlat
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.href = '/design-studio/';
                }}
                className="w-full py-2 px-4 rounded bg-[var(--bg-3)] hover:bg-[var(--line-strong)] border border-[var(--line)] text-xs text-slate-300 font-bold uppercase transition-all"
              >
                3D Design Studio&apos;ya Geç
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AluCAD = dynamic(
  () => import('@/cad/components/AluCAD').then((m) => m.AluCAD),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            Loading 2D AluCAD Desktop Engine...
          </p>
        </div>
      </div>
    ),
  }
);

const Mobile2DCad = dynamic(
  () => import('@/cad/components/Mobile2DCad').then((m) => m.Mobile2DCad),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            Loading Mobile 2D CAD...
          </p>
        </div>
      </div>
    ),
  }
);

export function CadEditorClient() {
  const [viewMode, setViewMode] = React.useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [isMobileScreen, setIsMobileScreen] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const updateSize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && isMobileScreen);

  return (
    <CadErrorBoundary>
      <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--bg-0)] select-none font-mono touch-none overscroll-none">
        {/* ─── Unified Viewport (Single Top Bar Managed by CAD Views) ─── */}
        <div className="flex-1 min-h-0 relative w-full overflow-hidden">
          {!isClient ? (
            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)]">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
                  Loading 2D AluCAD Engine...
                </p>
              </div>
            </div>
          ) : isMobile ? (
            <div className="w-full h-full">
              <Mobile2DCad
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                onTransferTo3D={() => {
                  if (typeof window !== 'undefined') window.location.href = '/design-studio/';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full">
              <AluCAD
                className="w-full h-full"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            </div>
          )}
        </div>
      </div>
    </CadErrorBoundary>
  );
}

export default CadEditorClient;
