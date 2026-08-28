'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  Copy,
  Download,
  QrCode,
  Check,
  ShieldCheck,
  X,
  FileCode,
  Link2,
  Info,
} from 'lucide-react';
import { ExportResult } from '../export-package';
import { buildHashUrl, downloadJsonFile } from '../channels';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: ExportResult | null;
  moduleTitle?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  exportData,
  moduleTitle = 'Hesaplama',
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'file'>('link');
  const [copied, setCopied] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen || !exportData) return null;

  const { pkg, jsonString, channels, base64Url } = exportData;
  const hashUrl = channels.hash.available ? buildHashUrl(base64Url) : '';

  const handleCopyLink = async () => {
    if (!hashUrl) return;
    try {
      await navigator.clipboard.writeText(hashUrl);
      setCopied(true);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = hashUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
    }
  };

  const handleDownload = () => {
    downloadJsonFile(channels.file.filename, jsonString);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white flex items-center gap-2">
                <span>AluShare v1</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                  Local-First
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {moduleTitle} • {pkg.meta.name || pkg.module}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product philosophy banner */}
        <div className="px-6 py-3 bg-cyan-950/30 border-b border-cyan-500/20 text-xs text-cyan-200/90 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-cyan-300">
              Bağlantıyı biz kurmuyoruz. Paketi sen gönderiyorsun.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Geometri ve solver sunucuya gitmez. Sayılar kanonik kuantize edilmiş olup SHA-256 bütünlük mührü içerir.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Checksum Badge */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-cyan-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> RFC 8785 SHA-256 Checksum
              </span>
              <span className="font-mono">{pkg.created_at}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300 break-all select-all bg-slate-900/90 p-2 rounded border border-slate-800/80">
              {pkg.checksum}
            </div>
          </div>

          {/* Channels Tabs */}
          <div className="flex border-b border-slate-800 space-x-2">
            <button
              onClick={() => setActiveTab('link')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'link'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>URL Hash (#lz)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {channels.hash.size} B / 2 KB
              </span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              disabled={!channels.qr.available}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'qr'
                  ? 'border-cyan-400 text-cyan-300'
                  : !channels.qr.available
                  ? 'border-transparent text-slate-600 cursor-not-allowed'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Kod</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {channels.qr.size} B / 400 B
              </span>
            </button>

            <button
              onClick={() => setActiveTab('file')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'file'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Dosya (.alucalc.json)</span>
            </button>
          </div>

          {/* Tab 1: URL Hash */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              {channels.hash.available ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">
                      Paylaşım Bağlantısı (Fragment sunucuya iletilmez)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={hashUrl}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 select-all"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Kopyala</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    URL fragmenti (#lz=...) tarayıcıda kalır; veriler sunucuya gönderilmez.
                  </p>
                </>
              ) : (
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-1">
                  <p className="font-semibold">URL Hash sınırı (2 KB) aşıldı.</p>
                  <p className="text-slate-400">
                    Hesaplama modeli çok fazla parametre içeriyor. Lütfen Dosya (.alucalc.json) kanalını kullanarak dışa aktarın.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: QR Code */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              {channels.qr.available && channels.qr.payload ? (
                <>
                  <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/40">
                    <QRCodeSVG
                      value={buildHashUrl(channels.qr.payload)}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center max-w-xs">
                    Mobil AluCalc ile tara veya doğrudan tarayıcı kamerasıyla aç.
                  </p>
                </>
              ) : (
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-center space-y-1">
                  <p className="font-semibold">QR Sınırı (400 B) Aşıldı</p>
                  <p className="text-slate-400">
                    Paket {channels.qr.size} Bayt olduğundan QR ile güvenle taranamayabilir. Bağlantı veya Dosya kanalını tercih edin.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: JSON File */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    {channels.file.filename}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    UTF-8 JSON • İnsan tarafından okunabilir & e-posta ile iletilebilir.
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Dosyayı İndir</span>
                </button>
              </div>

              {/* JSON text preview */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{showJsonPreview ? 'JSON Önizlemeyi Gizle' : 'JSON İçeriğini Önizle'}</span>
                </button>

                {showJsonPreview && (
                  <pre className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44 select-all">
                    {jsonString}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">v{pkg.v} • {pkg.solver_build}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
