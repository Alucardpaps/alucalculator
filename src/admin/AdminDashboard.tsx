'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { FeatureCounter } from './inbox-store';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'features'>('status');
  const [featureCounters, setFeatureCounters] = useState<FeatureCounter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    fetchData();
  }, []);

  const totalTelemetryCalls = featureCounters.reduce((acc, c) => acc + c.totalCalls, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>AluCalc Admin Portal</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                  v1.2
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Operasyonel Durum, Güvenlik Mührü & Telemetri Sayaçları
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
            <div className="text-xs px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auth Duvarı Aktif</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Geri Bildirim Kanalı</span>
              <Mail className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white">E-Posta (FEEDBACK_TO)</div>
            <div className="text-[11px] text-cyan-300 font-mono">
              Kayıt mail kutunda • Diskte inbox tutulmaz
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Telemetri Olay Sayısı</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalTelemetryCalls}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {featureCounters.length} kayıtlı modül/özellik
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Gizlilik & Güvenlik</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-300">Local-First Mühürlü</div>
            <div className="text-[11px] text-slate-400">
              0 sunucu geometrisi • timingSafeEqual hash korumalı
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-4">
          <button
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
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Geri Bildirim & İletişim Durumu
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    AluCalc v1 stateless mimarisinde kullanıcı geri bildirimleri sunucu diskinde veya veritabanında saklanmaz.
                    İletilen hata bildirimleri, hesaplama uyuşmazlıkları ve kullanıcı mesajları doğrudan sunucu ortamında yapılandırılmış olan{' '}
                    <strong className="text-cyan-300 font-mono">FEEDBACK_TO</strong> e-posta kutusuna iletilir.
                  </p>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
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

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sistem Güvenlik Kontrolleri</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-white">Admin Üç Kapı Koruması</div>
                  <div className="text-slate-400 text-[11px]">Edge Middleware + layout.tsx Server Guard + API Guard</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-white">Kriptografik Doğrulama</div>
                  <div className="text-slate-400 text-[11px]">SHA-256 Digest + timingSafeEqual (Fail-closed)</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-white">Local-First Geometri</div>
                  <div className="text-slate-400 text-[11px]">0 sunucu geometrisi, istemci taraflı RFC 8785 bütünlük mührü</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-white">KVKK & Telemetri Rıza Kapısı</div>
                  <div className="text-slate-400 text-[11px]">Açık rıza olmadan telemetri chunk'ı import edilmez</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Feature Usage Counters */}
        {activeTab === 'features' && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Özellik Kullanım Sayaçları (Rızalı Anonim Telemetri)</span>
            </h3>
            {featureCounters.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-xs">
                Henüz kaydedilmiş telemetri olayı bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featureCounters.map((cnt) => (
                  <div
                    key={cnt.feature}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5"
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
