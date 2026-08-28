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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-lg bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl p-4 md:p-5 text-slate-200 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white tracking-wide">
              Gizlilik & Veri İşleme Tercihleri (KVKK 2026/347)
            </h3>
            <button
              onClick={handleRejectAll}
              className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              aria-label="Kapat ve Reddet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Geometri ve solver hesaplamalarınız tarayıcınızda kalır, sunucuya aktarılmaz. Yalnızca
            sistem kararlılığı ve hata teşhisi için aşağıdaki rızaları yapılandırabilirsiniz:
          </p>

          <div className="space-y-2 py-1">
            <label className="flex items-start space-x-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consentTelemetry}
                onChange={(e) => setConsentTelemetry(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
              />
              <span>
                <strong>Kullanım & Teşhis Telemetrisi:</strong> Hata ve performans analizleri için
                anonim sayfa olaylarının iletilmesini onaylıyorum.
              </span>
            </label>

            <label className="flex items-start space-x-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consentScreenshot}
                onChange={(e) => setConsentScreenshot(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
              />
              <span>
                <strong>Destek Ekran Görüntüsü:</strong> Bildirim gönderildiğinde model görselinin
                hata ayıklama amacıyla iletilmesine açık rıza veriyorum.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleRejectAll}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
            >
              Tümünü Reddet
            </button>
            <button
              type="button"
              onClick={handleAcceptSelected}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            >
              Seçilenleri Kaydet
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow cursor-pointer"
            >
              Tümünü Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
