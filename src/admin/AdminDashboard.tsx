'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Mail,
  Activity,
  Layers,
  Server,
  Lock,
  CheckCircle2,
  LogOut,
  KeyRound,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { FeatureCounter } from './inbox-store';

const EXPECTED_HASH = 'a6d0f37d30dcb01dd0653553c6264bcf9943c9df9925e929c7867a47f600da01';
const SESSION_KEY = 'alu_admin_active_session';

async function computeSha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const digestBuf = await window.crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(digestBuf));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AdminDashboard: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'features'>('status');
  const [featureCounters, setFeatureCounters] = useState<FeatureCounter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Stealth 404 & Secret Key Dialog State
  const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [secretError, setSecretError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Check Authorization (URL param, SessionStorage, or Cookie)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function checkAuth() {
      // Check active tab session first
      const session = sessionStorage.getItem(SESSION_KEY);
      if (session === 'authorized_session_v12') {
        setIsAuthorized(true);
        return;
      }

      // Check URL query parameter (Passed by special .exe)
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('key');

      if (urlKey) {
        try {
          const hashHex = await computeSha256(urlKey);
          if (hashHex === EXPECTED_HASH) {
            // Authorized via .exe!
            sessionStorage.setItem(SESSION_KEY, 'authorized_session_v12');
            document.cookie = `alu_admin_key=${urlKey}; path=/; max-age=86400; SameSite=Strict; secure`;

            // IMMEDIATELY clean the key from browser address bar & history
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            setIsAuthorized(true);
            return;
          }
        } catch {
          // Ignore
        }
      }

      // If no valid key or session, fail closed
      setIsAuthorized(false);
    }

    checkAuth();
  }, []);

  // 2. Keyboard Shortcut for Stealth Unlock (Ctrl+Shift+A or Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsSecretDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3. Handle 5-click easter egg on "404" text
  const handleEasterEggClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      if (next >= 5) {
        setIsSecretDialogOpen(true);
        return 0;
      }

      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);

      return next;
    });
  };

  // 4. Verify manual Master Key in secret dialog
  const handleSecretKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKeyInput.trim() || isVerifying) return;

    setIsVerifying(true);
    setSecretError('');

    try {
      const hashHex = await computeSha256(secretKeyInput.trim());
      if (hashHex === EXPECTED_HASH) {
        sessionStorage.setItem(SESSION_KEY, 'authorized_session_v12');
        setIsSecretDialogOpen(false);
        setSecretKeyInput('');
        setIsAuthorized(true);
      } else {
        setSecretError('Yetkisiz anahtar. Erişim engellendi.');
      }
    } catch {
      setSecretError('Kriptografik doğrulama hatası.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 5. Logout & Lock
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    document.cookie = 'alu_admin_key=; path=/; max-age=0; SameSite=Strict; secure';
    setIsAuthorized(false);
  };

  // 6. Fetch Telemetry Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const telRes = await fetch('/api/telemetry');
      if (telRes.ok) {
        const telData = await telRes.json();
        setFeatureCounters(telData.counters || []);
      }
    } catch (err) {
      console.error('Admin data fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  // Loading State
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[var(--bg-0)] flex items-center justify-center text-slate-500 font-mono text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // ─── 404 CLOAKING PAGE (UNAUTHORIZED VISITORS ONLY SEE THIS) ───
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[var(--bg-0)] flex flex-col items-center justify-center p-6 text-center font-sans select-none relative overflow-hidden">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6 shadow-2xl relative z-10">
          
          {/* 404 Title (5 clicks opens stealth dialog) */}
          <div
            onClick={handleEasterEggClick}
            className="cursor-default select-none group"
            title="404"
          >
            <span className="text-5xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 group-hover:from-cyan-400 group-hover:to-blue-600 transition-all">
              404
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sayfa Bulunamadı
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Aradığınız sayfa silinmiş, adı değiştirilmiş veya geçici olarak kullanım dışı kalmış olabilir.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs transition-all active:scale-[0.98]"
            >
              <ArrowLeft size={14} />
              <span>Ana Sayfaya Dön</span>
            </Link>
          </div>
        </div>

        {/* ─── STEALTH MASTER KEY DIALOG (CTRL+SHIFT+A or 5-CLICKS) ─── */}
        {isSecretDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-150">
            <div className="max-w-md w-full rounded-3xl bg-[var(--bg-1)] border border-cyan-500/40 p-6 sm:p-8 space-y-5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-cyan-400">
                  <KeyRound size={20} />
                  <span className="text-sm font-bold font-mono uppercase tracking-wider">
                    Yönetici Doğrulaması
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSecretDialogOpen(false)}
                  className="text-xs text-slate-500 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Bu alana yalnızca masaüstünüzdeki özel <strong className="text-white">AluCalcAdmin.exe</strong> veya geçerli <strong className="text-cyan-300">Master Secret Key</strong> ile erişilebilir.
              </p>

              <form onSubmit={handleSecretKeySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wide">
                    Master Cryptographic Key
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    placeholder="ALU_SEC_V12_..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {secretError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{secretError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSecretDialogOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 text-xs font-semibold transition"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    disabled={isVerifying || !secretKeyInput.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50"
                  >
                    {isVerifying ? 'Doğrulanıyor...' : 'Giriş Yap'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── AUTHORIZED ADMIN DASHBOARD (ONLY SEEN BY YOU & THE SPECIAL EXE) ───
  const totalTelemetryCalls = featureCounters.reduce((acc, c) => acc + c.totalCalls, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-0)] text-slate-100 p-4 sm:p-8 md:p-10 font-sans select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>AluCAD Admin Portal</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                  ÖZEL EXE ERİŞİMİ // AKTİF
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-normal">
              Yalnızca yetkili yönetici ve onaylı masaüstü başlatıcı (<strong className="text-slate-200">AluCalcAdmin.exe</strong>) ile görüntülenebilir.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
              title="Oturumu Kapat ve Kilitle"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Güvenli Çıkış</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Geri Bildirim Kanalı</span>
              <Mail className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white">E-Posta (FEEDBACK_TO)</div>
            <div className="text-[11px] text-cyan-300 font-mono">
              Kayıt mail kutunda • Diskte inbox tutulmaz
            </div>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Telemetri Olay Sayısı</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalTelemetryCalls}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {featureCounters.length} kayıtlı modül/özellik
            </div>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Gizlilik & Güvenlik</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-300">404 Cloaking Mühürlü</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Harici ziyaretçilere gizli 404 • SHA-256 korumalı
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'status'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Operasyonel Durum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`pb-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'features'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Özellik Kullanım Sayacı ({featureCounters.length})</span>
          </button>
        </div>

        {/* Tab 1: Operational Status */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Geri Bildirim & İletişim Durumu
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    AluCAD v1 stateless mimarisinde kullanıcı geri bildirimleri sunucu diskinde veya veritabanında saklanmaz.
                    İletilen hata bildirimleri, hesaplama uyuşmazlıkları ve kullanıcı mesajları doğrudan sunucu ortamında yapılandırılmış olan{' '}
                    <strong className="text-cyan-300 font-mono">FEEDBACK_TO</strong> e-posta kutusuna iletilir.
                  </p>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Stateless Mail İletimi: Aktif</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      Gelen mesajları görüntülemek ve yanıtlamak için yapılandırdığınız e-posta gelen kutusunu kontrol edin.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sistem Güvenlik Kontrolleri</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <div className="font-bold text-white">404 Cloaking & Stealth Shield</div>
                  <div className="text-slate-400 text-[11px]">Yetkisiz web ziyaretçilerine admin varlığı gizlenir, doğrudan 404 döner</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <div className="font-bold text-white">Özel EXE Kriptografik Giriş</div>
                  <div className="text-slate-400 text-[11px]">AluCalcAdmin.exe ile tek tıkla otomatik oturum açma ve URL temizleme</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <div className="font-bold text-white">Local-First Geometri</div>
                  <div className="text-slate-400 text-[11px]">0 sunucu geometrisi, istemci taraflı RFC 8785 bütünlük mührü</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <div className="font-bold text-white">Robots & Sitemap İzolasyonu</div>
                  <div className="text-slate-400 text-[11px]">Arama motorları için /admin tamamen engellendi (Disallow + noindex)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Feature Usage Counters */}
        {activeTab === 'features' && (
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Özellik Kullanım Sayaçları (Rızalı Anonim Telemetri)</span>
            </h3>
            {featureCounters.length === 0 ? (
              <div className="p-8 text-center bg-black/40 border border-white/5 rounded-xl text-slate-500 text-xs">
                Henüz kaydedilmiş telemetri olayı bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featureCounters.map((cnt) => (
                  <div
                    key={cnt.feature}
                    className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-1.5"
                  >
                    <div className="text-xs font-mono font-bold text-cyan-300">{cnt.feature}</div>
                    <div className="text-xl font-extrabold text-white">{cnt.totalCalls} çağrı</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Son işlem: {new Date(cnt.lastCalledAt).toLocaleTimeString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
