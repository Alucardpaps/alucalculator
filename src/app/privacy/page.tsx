'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  Clock,
  Send,
  Mail,
  FileText,
  UserCheck,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState<'delete' | 'info' | 'rectify'>('delete');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDeletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Lütfen geçerli bir e-posta adresi girin.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[KVKK VERİ TALEBİ] Tür: ${requestType.toUpperCase()} | E-posta: ${email} | Detay: ${details || 'Belirtilmedi'}`,
          category: 'other',
          module: 'privacy-request',
          email,
          consentDiagnostics: false,
          consentScreenshot: false,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (res.ok && data?.success) {
        setStatus({
          type: 'success',
          message: 'Talebiniz başarıyla alındı. İlgili kayıtlar incelenerek tarafınıza bilgi verilecektir.',
        });
        setEmail('');
        setDetails('');
      } else {
        setStatus({
          type: 'error',
          message: (data && data.error) || 'Talep iletilemedi. Lütfen privacy@alucalculator.com adresine doğrudan e-posta gönderin.',
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Bağlantı hatası oluştu. Lütfen privacy@alucalculator.com adresine doğrudan e-posta iletin.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>AluCalc Ana Sayfasına Dön</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-500">Aydınlatma Taslağı</span>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Aydınlatma Taslağı & Gizlilik Bilgilendirmesi</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Kişisel Verilerin Korunması ve Gizlilik (Aydınlatma Taslağı)
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            AluCalc Mühendislik Sistemleri olarak gizliliğinize ve fikri mülkiyetinize en üst düzeyde
            saygı gösteriyoruz. İşbu metin 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) m. 10
            kapsamında hazırlanan aydınlatma taslağı mahiyetindedir.
          </p>
        </div>

        {/* Key Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Local-First İlkesi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mühendislik modelleriniz, dişli geometriniz ve hesaplama girdileriniz tarayıcınızda işlenir.
              Sunucularımızda hiçbir CAD veya geometri verisi saklanmaz.
            </p>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Açık Rıza Tabanlı</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anonim kullanım telemetrisi ve hata ekran görüntüleri yalnızca açık rızanız onaylandığında
              işleme alınır. Onay verilmediğinde kod modülleri dahi yüklenmez.
            </p>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">90 Gün Saklama</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hata teşhisi ve geri bildirim kayıtları azami 90 gün boyunca e-posta kutumuzda tutulur ve
              ardından güvenli şekilde imha edilir.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>1. Veri Sorumlusu</span>
            </h2>
            <p>
              6698 sayılı KVKK uyarınca, AluCalc OS web ve mobil platformu üzerinden sağlanan hizmetler
              kapsamında kişisel verileriniz <strong>AluCalc Mühendislik Sistemleri</strong> tarafından
              veri sorumlusu sıfatıyla işlenmektedir. İletişim e-posta: 
              <a href="mailto:privacy@alucalculator.com" className="text-cyan-400 hover:underline ml-1">
                privacy@alucalculator.com
              </a>
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>2. Toplanan Veri Kategorileri ve Toplama Yöntemi</span>
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>
                <strong className="text-slate-200">Anonim Sayfa Olayları (Telemetri):</strong> Sayfa yolu
                (URL hash ve parametreler hariç tutularak), modül aksiyonu ve istemci tarafı hata teşhisi.
                Yalnızca <code>alu_consent_telemetry === '1'</code> açık rızası varsa iletilir.
              </li>
              <li>
                <strong className="text-slate-200">Geri Bildirim İçeriği:</strong> Kullanıcının serbest
                metin alanına yazdığı hata açıklaması veya öneri.
              </li>
              <li>
                <strong className="text-slate-200">Opsiyonel Model Ekran Görüntüsü:</strong> Kullanıcının
                onayıyla WebP formatında yeniden kodlanan görsel. Hassas veri alanları otomatik maskelenir.
              </li>
              <li>
                <strong className="text-slate-200">İsteğe Bağlı E-posta Adresi:</strong> Bildirime yanıt
                verilmesi amacıyla kullanıcının isteğiyle paylaştığı iletişim adresi.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>3. Veri İşleme Amaçları ve Aktarım</span>
            </h2>
            <p>
              Toplanan veriler yalnızca teknik kararlılık sağlama, platform hatalarını çözme ve mühendislik
              hesaplama doğruluğunu denetleme amacıyla işlenir. Veriler doğrudan güvenli e-posta altyapısı
              üzerinden teknik ekibe iletilir; sunucu diskinde veya veritabanında saklanmaz. Üçüncü taraflara
              ticari amaçla satılmaz veya pazarlama faaliyetlerinde kullanılmaz.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>4. KVKK Madde 11 Kapsamındaki Haklarınız</span>
            </h2>
            <p>
              KVKK m. 11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,
              işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, verilerinizin silinmesini
              veya yok edilmesini isteme ve düzeltilmesini talep etme haklarına sahipsiniz.
            </p>
          </section>
        </div>

        {/* Data Deletion / Subject Access Request Form */}
        <div className="p-8 bg-slate-900 border border-cyan-500/30 rounded-3xl space-y-6">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Veri Silme ve Bilgi Edinme Talebi (KVKK m. 11)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                İlettiğiniz bir geri bildirimin, ekran görüntüsünün veya e-posta adresinizin silinmesini talep etmek
                için aşağıdaki formu doldurabilir veya doğrudan{' '}
                <a href="mailto:privacy@alucalculator.com" className="text-cyan-400 hover:underline">
                  privacy@alucalculator.com
                </a>{' '}
                adresine yazabilirsiniz.
              </p>
            </div>
          </div>

          {status && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                status.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleDeletionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Kayıtlı E-Posta Adresiniz (Zorunlu)
                </label>
                <input
                  type="email"
                  required
                  placeholder="ornek@alanadi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Talep Türü</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="delete">Kayıtların Tamamen Silinmesi (Unutulma Hakkı)</option>
                  <option value="info">İşlenen Veriler Hakkında Bilgi Talebi</option>
                  <option value="rectify">Kayıt Düzeltme Talebi</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Ek Açıklama / Talep Detayı (İsteğe bağlı)
              </label>
              <textarea
                rows={3}
                placeholder="Varsa gönderilen geri bildirim tarihi, konusu veya spesifik talebiniz..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>İletiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Silme / Bilgi Talebini İlet</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 AluCalc Gelişmiş Mühendislik Sistemleri. Tüm hakları saklıdır.</p>
          <div className="flex items-center space-x-4">
            <a href="mailto:privacy@alucalculator.com" className="text-cyan-400 hover:underline">
              privacy@alucalculator.com
            </a>
            <Link href="/" className="hover:text-slate-300">
              Ana Sayfa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
