'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Camera,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { captureCanvasScreenshot, checkDailyScreenshotQuota } from './capture';
import { submitFeedback } from './submit';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModule?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultModule = 'Genel',
}) => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'calculation' | 'other'>('bug');
  const [email, setEmail] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [screenshotData, setScreenshotData] = useState<{
    dataUrl: string;
    byteLength: number;
    width: number;
    height: number;
  } | null>(null);

  const [consentDiagnostics, setConsentDiagnostics] = useState(true);
  const [consentScreenshot, setConsentScreenshot] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const quota = checkDailyScreenshotQuota();

  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setIncludeScreenshot(false);
      setScreenshotData(null);
      setConsentScreenshot(false);
      setStatusMessage(null);
    }
  }, [isOpen]);

  const handleToggleScreenshot = async (enabled: boolean) => {
    setIncludeScreenshot(enabled);
    if (enabled && !screenshotData) {
      setIsCapturing(true);
      const cap = await captureCanvasScreenshot();
      setIsCapturing(false);
      if (cap) {
        setScreenshotData(cap);
        setConsentScreenshot(true);
      } else {
        setIncludeScreenshot(false);
        setStatusMessage({
          type: 'error',
          text: 'Aktif bir 3D/CAD kanvası bulunamadı.',
        });
      }
    } else if (!enabled) {
      setConsentScreenshot(false);
    }
  };

  const handleRetakeScreenshot = async () => {
    setIsCapturing(true);
    const cap = await captureCanvasScreenshot();
    setIsCapturing(false);
    if (cap) {
      setScreenshotData(cap);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen bir mesaj yazın.' });
      return;
    }

    if (includeScreenshot && !consentScreenshot) {
      setStatusMessage({
        type: 'error',
        text: 'Ekran görüntüsü göndermek için açık rıza onay kutusunu işaretlemelisiniz.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await submitFeedback({
      message,
      category,
      module: defaultModule,
      email,
      consentDiagnostics,
      consentScreenshot: includeScreenshot && consentScreenshot,
      screenshot: includeScreenshot && screenshotData ? screenshotData : undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Başarıyla gönderildi!' });
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Gönderim başarısız.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-white flex items-center gap-2">
                <span>Geri Bildirim & Hata Bildir</span>
              </h2>
              <p className="text-xs text-slate-400">
                Modül: <span className="text-cyan-300 font-medium">{defaultModule}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/50 border border-rose-500/40 text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Kategori</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'bug', label: '🐛 Hata Bildirimi' },
                { id: 'calculation', label: '📐 Hesaplama Hatası' },
                { id: 'feature', label: '✨ Özellik Talebi' },
                { id: 'other', label: '💬 Diğer' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id as any)}
                  className={`p-2 rounded-xl text-left border transition font-medium ${
                    category === c.id
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mandatory Message Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Mesajınız (Zorunlu)</span>
              <span className="text-[11px] text-slate-500">{message.length}/2000</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={2000}
              placeholder="Karşılaştığınız sorunu veya önerinizi detaylandırın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              E-posta (Yanıt ve takip için)
            </label>
            <input
              type="email"
              placeholder="E-posta (isteğe bağlı)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Screenshot Option (Default OFF, Separate Consent) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">
                  3D Görsel / Ekran Görüntüsü Ekle
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeScreenshot}
                  onChange={(e) => handleToggleScreenshot(e.target.checked)}
                  disabled={!quota.allowed}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {includeScreenshot && screenshotData && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Önizleme: {screenshotData.width}x{screenshotData.height} (
                    {Math.round(screenshotData.byteLength / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={handleRetakeScreenshot}
                    disabled={isCapturing}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCapturing ? 'animate-spin' : ''}`} />
                    <span>Yeniden Çek</span>
                  </button>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black max-h-32 flex items-center justify-center">
                  <img
                    src={screenshotData.dataUrl}
                    alt="Canvas Screenshot"
                    className="max-h-32 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Hassas veri alanları otomatik maskelenir.</span>
              <span>Kalan günlük kota: {quota.remainingCount}/10</span>
            </div>
          </div>

          {/* KVKK 2-Box Consent */}
          <div className="space-y-2 pt-1">
            <label className="flex items-start space-x-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consentDiagnostics}
                onChange={(e) => setConsentDiagnostics(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
              />
              <span>
                Kullanım teşhis verilerinin (tarayıcı, çözünürlük, sayfa yolu) hata analizi için
                iletilmesini onaylıyorum.
              </span>
            </label>

            {includeScreenshot && (
              <label className="flex items-start space-x-2 text-[11px] text-cyan-200/90 cursor-pointer">
                <input
                  type="checkbox"
                  required={includeScreenshot}
                  checked={consentScreenshot}
                  onChange={(e) => setConsentScreenshot(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span>
                  <strong>Açık Rıza:</strong> Yakalanan model/çizim ekran görüntüsünün teknik destek
                  ve mühendislik incelemesi amacıyla sunucuya yüklenmesine izin veriyorum.
                </span>
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !message.trim() || (includeScreenshot && !consentScreenshot)}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Geri Bildirimi İlet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
