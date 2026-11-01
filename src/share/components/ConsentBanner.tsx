'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const CONSENT_TELEMETRY_KEY = 'alu_consent_telemetry';
const CONSENT_SCREENSHOT_KEY = 'alu_consent_screenshot';

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [consentTelemetry, setConsentTelemetry] = useState(false);
  const [consentScreenshot, setConsentScreenshot] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.navigator?.webdriver || window.location.search.includes('headless=1')) return;
    if (window.location.pathname.includes('/widget')) return;
    // Don't obstruct mobile touch drafting workspaces
    if ((window.location.pathname.startsWith('/cad-editor') || window.location.pathname.startsWith('/design-studio')) && window.innerWidth < 640) {
      return;
    }
    const telConsent = localStorage.getItem(CONSENT_TELEMETRY_KEY);
    const ssConsent = localStorage.getItem(CONSENT_SCREENSHOT_KEY);

    // If neither has been decided, show banner
    if (telConsent === null && ssConsent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleSavePreferences = (telemetryChoice: boolean, screenshotChoice: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSENT_TELEMETRY_KEY, telemetryChoice ? '1' : '0');
      localStorage.setItem(CONSENT_SCREENSHOT_KEY, screenshotChoice ? '1' : '0');

      if (telemetryChoice) {
        import('@/telemetry/queue').then(({ telemetry }) => {
          telemetry.setConsent(true);
        });
      }
    }
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    handleSavePreferences(false, false);
  };

  const handleAcceptSelected = () => {
    handleSavePreferences(consentTelemetry, consentScreenshot);
  };

  const handleAcceptAll = () => {
    handleSavePreferences(true, true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 md:left-auto md:right-4 z-50 max-w-lg bg-[var(--bg-1)] border border-[var(--line-strong)] rounded-[var(--radius-m)] shadow-2xl p-3 sm:p-4 md:p-5 text-[var(--ink)] animate-in slide-in-from-bottom-3 duration-300 max-h-[88vh] overflow-y-auto">
      <div className="flex items-start space-x-2.5 sm:space-x-3">
        <div className="p-1.5 sm:p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan-dim)] text-[var(--cyan)] shrink-0 hidden xs:block">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-[11px] sm:text-xs font-bold text-white tracking-wide font-mono uppercase truncate">
              Privacy & Diagnostics (GDPR / KVKK)
            </h3>
            <button
              onClick={handleRejectAll}
              className="text-[var(--muted)] hover:text-white p-1 cursor-pointer transition-colors shrink-0"
              aria-label="Dismiss and Reject"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[var(--muted)] leading-relaxed">
            All CAD geometry and engineering solver calculations execute client-side.
            Optional telemetry aids system stability:
          </p>

          <div className="space-y-1.5 sm:space-y-2 py-0.5 sm:py-1">
            <label className="flex items-start space-x-2 text-[10.5px] sm:text-[11px] text-[var(--alu)] cursor-pointer">
              <input
                type="checkbox"
                checked={consentTelemetry}
                onChange={(e) => setConsentTelemetry(e.target.checked)}
                className="mt-0.5 rounded-[var(--radius-s)] border-[var(--line)] bg-[var(--bg-3)] text-[var(--cyan)] focus:ring-0 shrink-0"
              />
              <span>
                <strong className="text-white">Diagnostic Telemetry:</strong> Anonymized error traces and client performance metrics.
              </span>
            </label>

            <label className="flex items-start space-x-2 text-[10.5px] sm:text-[11px] text-[var(--alu)] cursor-pointer">
              <input
                type="checkbox"
                checked={consentScreenshot}
                onChange={(e) => setConsentScreenshot(e.target.checked)}
                className="mt-0.5 rounded-[var(--radius-s)] border-[var(--line)] bg-[var(--bg-3)] text-[var(--cyan)] focus:ring-0 shrink-0"
              />
              <span>
                <strong className="text-white">Support Canvas Capture:</strong> Allow attaching canvas snapshots when reporting bugs.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2 pt-2 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={handleRejectAll}
              className="px-2 sm:px-3 py-1.5 rounded-[var(--radius-s)] text-[11px] sm:text-xs font-semibold text-[var(--muted)] hover:text-white bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--line-strong)] transition cursor-pointer text-center truncate"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={handleAcceptSelected}
              className="px-2 sm:px-3 py-1.5 rounded-[var(--radius-s)] text-[11px] sm:text-xs font-semibold text-[var(--alu)] bg-[var(--bg-3)] hover:bg-[var(--bg-2)] border border-[var(--line-strong)] transition cursor-pointer text-center truncate"
            >
              Save Choices
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-2 sm:px-3.5 py-1.5 rounded-[var(--radius-s)] text-[11px] sm:text-xs font-bold text-[var(--bg-0)] bg-[var(--cyan)] hover:bg-[var(--cyan)] transition shadow cursor-pointer font-mono uppercase text-center truncate"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
