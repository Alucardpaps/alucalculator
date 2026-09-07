'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Sparkles, Zap, ShieldCheck, ArrowRight, Building2, Users, UserCheck, FileText } from 'lucide-react';
import { useLicenseStore } from '@/store/licenseStore';
import { APP_MODULE_COUNT } from '@/config/app';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { getAppPages } from '@/locales/appPagesTranslations';
import { BorderBeam } from '@/components/21st/BorderBeam';

export function PricingClient() {
  const plan = useLicenseStore((s) => s.plan);
  const language = useI18nStore((s) => s.language);
  const t = getAppPages(language).pricing;
  const isTr = language === 'tr';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Dynamic, mathematically sound plan specifications
  const plans = [
    {
      id: 'free',
      name: t12(language, 'Free', 'Ücretsiz'),
      badge: null,
      price: '$0',
      period: t12(language, '/ mo', '/ ay'),
      billedNote: t12(language, 'Free forever', 'Sonsuza kadar ücretsiz'),
      discount: null,
      blurb: t12(language, 'Daily core engineering math in your browser', 'Tarayıcıda günlük temel mühendislik matematiği'),
      cta: plan === 'free' ? (t12(language, 'Current Plan', 'Mevcut Planınız')) : (t12(language, 'Get Started', 'Başlayın')),
      featured: false,
      icon: UserCheck,
      items: isTr
        ? [
            `${APP_MODULE_COUNT} mühendislik modülü`,
            'Gerçek alaşım yoğunlukları ve malzeme kütüphanesi',
            'Günde 3 PDF raporu (filigranlı) · Günde 1 DXF',
            'İnternetsiz çalışan PWA atölye desteği',
          ]
        : [
            `${APP_MODULE_COUNT} modules`,
            'Alloy-true materials & density library',
            '3 PDF reports / day (watermarked) · 1 DXF / day',
            'Offline PWA ready for machine shop floor',
          ],
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: t12(language, 'Most Popular', 'En Popüler'),
      price: billingCycle === 'yearly' ? '$15.80' : '$19',
      period: t12(language, '/ mo', '/ ay'),
      billedNote:
        billingCycle === 'yearly'
          ? t12(language, 'Billed $190 annually', 'Yıllık $190 olarak faturalandırılır')
          : t12(language, 'Billed monthly', 'Aylık olarak faturalandırılır'),
      discount: billingCycle === 'yearly' ? (t12(language, 'Save 17%', '%17 İndirim')) : null,
      blurb: t12(language, 'For independent engineers, designers & consultants', 'Bağımsız mühendisler, tasarımcılar ve serbest çalışanlar için'),
      cta: plan === 'pro' ? (t12(language, 'Current Plan', 'Mevcut Planınız')) : (t12(language, 'Upgrade to Pro', 'Pro’ya Yükselt')),
      featured: true,
      icon: Zap,
      items: isTr
        ? [
            'Sınırsız STEP, DXF, STL ve PDF üretimi',
            'Müşteriye hazır, filigransız temiz PDF raporları',
            'Sınırsız 1D kesim ve 2D plaka yerleşim optimizasyonu',
            'Yerel proje malzeme listesi (BOM) & öncelikli destek',
          ]
        : [
            'Unlimited STEP, DXF, STL & PDF exports',
            'Clean, unwatermarked client-ready PDFs',
            'Unlimited 1D cut & 2D sheet nesting optimizer',
            'Local project BOM & priority engineering support',
          ],
    },
    {
      id: 'team',
      name: t12(language, 'Team', 'Ekip (Team)'),
      badge: t12(language, 'Design Offices', 'Ofisler İçin'),
      price: billingCycle === 'yearly' ? '$40.80' : '$49',
      period: t12(language, '/ mo', '/ ay'),
      billedNote:
        billingCycle === 'yearly'
          ? t12(language, 'Billed $490 annually for up to 10 seats', '10 koltuk için yıllık $490 faturalandırılır')
          : t12(language, 'Billed $49 monthly for up to 10 seats', '10 koltuk için aylık $49 faturalandırılır'),
      discount: billingCycle === 'yearly' ? (t12(language, 'Save 17%', '%17 İndirim')) : null,
      blurb: t12(language, 'Shared team access for design offices and R&D groups', 'Tasarım ofisleri ve Ar-Ge mühendislik departmanları için'),
      cta: t12(language, 'Get Team Access', 'Ekip Erişimi Al'),
      featured: false,
      icon: Users,
      items: isTr
        ? [
            '10 kullanıcıya kadar ortak lisans anahtarı',
            'Toplu Hesaplama REST API’si (istek başına 500 satır)',
            'Özel kurumsal rapor başlığı ve şirket logosu',
            'Pro planındaki tüm özellikler dahil',
          ]
        : [
            'Up to 10 shared user seats per license',
            'Bulk Calculation REST API (500 rows/request)',
            'Custom report company header & branding',
            'Includes everything in Pro tier',
          ],
    },
    {
      id: 'enterprise',
      name: t12(language, 'Enterprise', 'Kurumsal'),
      badge: t12(language, 'OEM / Factories', 'Fabrikalar'),
      price: t12(language, 'Custom', 'Özel'),
      period: '',
      billedNote: t12(language, 'Contract-based billing & SLA', 'Özel sözleşme & faturalandırma'),
      discount: null,
      blurb: t12(language, 'Factories, OEM manufacturers and academic institutions', 'Fabrikalar, OEM üreticileri ve üniversiteler için özel çözüm'),
      cta: t12(language, 'Contact Sales', 'Satış ile İletişime Geç'),
      featured: false,
      icon: Building2,
      items: isTr
        ? [
            'Sınırsız koltuk sayısı ve limitsiz API işlem hacmi',
            'Kurumsal SSO / SAML entegrasyonu ve sözleşmeli SLA',
            'Özel endüstriyel norm ve standart paketleri',
            'Yerinde veya uzaktan eğitim ve devreye alma',
          ]
        : [
            'Unlimited seats & unrestricted API volume',
            'Enterprise SSO / SAML integration & contractual SLA',
            'Custom standards packs on request',
            'On-site or remote engineering onboarding',
          ],
    },
  ];

  // Comprehensive Comparison Matrix
  const matrix = [
    {
      feature: t12(language, `${APP_MODULE_COUNT} modules`, `${APP_MODULE_COUNT} mühendislik modülü`),
      free: true, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'Alloy-true density & materials DB', 'Gerçek alaşım yoğunlukları & malzeme veritabanı'),
      free: true, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'PDF engineering reports', 'PDF mühendislik raporları'),
      free: true, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'Unwatermarked client-ready PDFs', 'Filigransız profesyonel PDF çıktıları'),
      free: false, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'DXF manufacturing export (Free: 1/day, Pro: Unlimited)', 'DXF imalat ihracı (Ücretsiz: 1/gün, Pro: Sınırsız)'),
      free: '1/day', pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'STL 3D mesh export (High-res binary)', 'Yüksek çözünürlüklü STL 3D örgü ihracı'),
      free: false, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'STEP 3D B-Rep export (STABLE ISO 10303)', 'STEP 3D B-Rep katı model ihracı (ISO 10303)'),
      free: false, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'Unlimited nesting & cutting optimizer', 'Sınırsız 1D profil kesim & 2D sac yerleşim'),
      free: false, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'AeGiS AI engineering copilot (daily quota)', 'AeGiS AI mühendislik copilotu (günlük kota)'),
      free: true, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'Bulk Calculation API (500 rows/request)', 'Toplu Hesaplama REST API (500 satır/istek)'),
      free: false, pro: false, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'Team seats (shared license keys)', 'Ekip koltukları (ortak lisans anahtarı)'),
      free: false, pro: false, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'Local project BOM (browser storage)', 'Yerel proje malzeme listesi (BOM) kaydı'),
      free: false, pro: true, team: true, enterprise: true,
    },
    {
      feature: t12(language, 'Priority engineering email support', 'Öncelikli mühendislik e-posta desteği'),
      free: false, pro: true, team: true, enterprise: true,
    },
  ];

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans select-none">
      
      {/* ─── HEADER ─── */}
      <header className="mb-10 text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-tech text-xs uppercase tracking-wider font-semibold">
          <Sparkles size={13} />
          <span>{t.kicker}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-tech text-white tracking-tight leading-tight">
          {t.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
          {t.lead}
        </p>

        {/* ─── BILLING CYCLE TOGGLE (MONTHLY / YEARLY) ─── */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-lg">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full font-tech text-xs font-semibold transition-all duration-200 cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white/15 text-white border border-white/20 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t12(language, 'Monthly Billing', 'Aylık Faturalama')}
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-tech text-xs font-semibold transition-all duration-200 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white/15 text-white border border-white/20 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{t12(language, 'Annual Billing', 'Yıllık Faturalama')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {t12(language, 'Save 17%', '%17 İndirim')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── 4 PRICING CARDS ─── */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-16">
        {plans.map((p) => {
          const IconComponent = p.icon;
          return (
            <article
              key={p.id}
              className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 ${
                p.featured
                  ? 'bg-gradient-to-b from-[#0e172a] to-[#040812] border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.18)] scale-[1.02]'
                  : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
              }`}
            >
              {p.featured && (
                <BorderBeam
                  size={200}
                  duration={8}
                  colorFrom="#00e5ff"
                  colorTo="#3b82f6"
                  rx={16}
                />
              )}

              <div className="space-y-4">
                {/* Header title & badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${
                      p.featured ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-white/5 text-slate-300 border-white/10'
                    }`}>
                      <IconComponent size={18} />
                    </div>
                    <h2 className="text-xl font-bold font-tech text-white">{p.name}</h2>
                  </div>

                  {p.badge && (
                    <span className="text-[10px] font-bold font-tech uppercase tracking-wider rounded-full bg-cyan-400 text-slate-950 px-2.5 py-0.5 shadow-sm">
                      {p.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">{p.blurb}</p>

                {/* Price Display */}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black font-tech text-white tracking-tight">
                      {p.price}
                    </span>
                    {p.period && <span className="text-xs text-slate-400 font-mono">{p.period}</span>}
                    {p.discount && (
                      <span className="ml-auto text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                        {p.discount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">{p.billedNote}</p>
                </div>

                {/* Feature Bullet Items */}
                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-white/5">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {p.featured ? (
                  <Link href="/sales/" className="group w-full block">
                    <div className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:via-sky-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                      <span>{p.cta}</span>
                      <ArrowRight size={14} className="text-slate-950 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>
                ) : p.id === 'free' && plan === 'free' ? (
                  <div className="w-full py-3.5 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 font-tech font-semibold text-xs uppercase tracking-wider text-center cursor-default">
                    <span>{p.cta}</span>
                  </div>
                ) : (
                  <Link
                    href={p.id === 'free' ? '/license/' : '/sales/'}
                    className="group w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 text-slate-200 hover:text-white font-tech font-semibold text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] text-center cursor-pointer"
                  >
                    <span>{p.cta}</span>
                    <ArrowRight size={13} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all duration-200" />
                  </Link>
                )}

                {p.id === 'pro' && plan === 'free' && (
                  <Link
                    href="/license/"
                    className="block text-[11px] text-center text-slate-400 hover:text-cyan-300 mt-2.5 font-mono transition-colors"
                  >
                    {t.haveKey}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ─── DETAILED FEATURE COMPARISON TABLE ─── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md mb-12 overflow-hidden">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold font-tech text-white">
              {t12(language, 'Detailed Feature Matrix', 'Ayrıntılı Özellik Karşılaştırması')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t12(language, 'Functional capabilities, export formats, and quota allocations across tiers', 'Tüm planların sunduğu fonksiyonel yetenekler ve imalat formatı destekleri')}
            </p>
          </div>
          <a
            href="/reports/sample-vdi-2230-bolt-torque.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs transition-all shrink-0 active:scale-[0.98]"
          >
            <FileText size={14} className="text-cyan-400" />
            <span>Sample VDI 2230 report (PDF)</span>
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-tech uppercase tracking-wider text-[11px]">
                <th className="py-3 pr-4">{t12(language, 'Feature', 'Özellik')}</th>
                <th className="py-3 px-3 text-center">{t12(language, 'Free', 'Ücretsiz')}</th>
                <th className="py-3 px-3 text-center text-cyan-400 font-bold">Pro</th>
                <th className="py-3 px-3 text-center">{t12(language, 'Team', 'Ekip')}</th>
                <th className="py-3 px-3 text-center">{t12(language, 'Enterprise', 'Kurumsal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matrix.map((row) => (
                <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 text-slate-200 font-medium">{row.feature}</td>
                  
                  <td className="py-3 px-3 text-center">
                    {typeof row.free === 'string' ? (
                      <span className="font-mono text-[11px] font-bold text-cyan-400">{row.free}</span>
                    ) : row.free ? (
                      <Check size={16} className="text-emerald-400 mx-auto" />
                    ) : (
                      <Minus size={16} className="text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-3 text-center bg-cyan-500/[0.03]">
                    {row.pro ? (
                      <Check size={16} className="text-cyan-400 mx-auto" />
                    ) : (
                      <Minus size={16} className="text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {row.team ? (
                      <Check size={16} className="text-emerald-400 mx-auto" />
                    ) : (
                      <Minus size={16} className="text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {row.enterprise ? (
                      <Check size={16} className="text-emerald-400 mx-auto" />
                    ) : (
                      <Minus size={16} className="text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── LICENSING & ENTERPRISE INFO ─── */}
      <section className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck size={18} />
            <h2 className="text-base font-bold font-tech text-white">{t.licensingTitle}</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {t.licensingBody}{' '}
            <Link href="/license/" className="text-cyan-400 hover:text-cyan-300 underline font-mono">
              /license
            </Link>.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Building2 size={18} />
              <h2 className="text-base font-bold font-tech text-white">{t.enterpriseTitle}</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {t.enterpriseBody}
            </p>
          </div>

          <a
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider transition-all w-fit shadow-md active:scale-[0.98]"
            href="mailto:sales@alucalculator.com?subject=AluCalc%20Enterprise"
          >
            <span>sales@alucalculator.com</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </section>

      {/* ─── LEGAL DISCLAIMER ─── */}
      <p className="text-[11px] text-slate-500 leading-relaxed text-center font-mono max-w-4xl mx-auto">
        {t.legal}
      </p>

    </main>
  );
}

export default PricingClient;
