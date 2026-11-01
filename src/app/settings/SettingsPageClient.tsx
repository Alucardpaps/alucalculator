'use client';
import React, { useEffect, useState } from 'react';
import { Palette, FileText } from 'lucide-react';
import { ThemeGrid } from '@/components/settings/ThemePicker';
import { BackdropPicker } from '@/components/settings/BackdropPicker';
import { ReportBrandingPanel } from '@/components/settings/ReportBrandingPanel';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

type Tab = 'appearance' | 'reports';

export default function SettingsPageClient() {
  const { language } = useI18nStore();
  const tr = (en: string, trk: string) => t12(language, en, trk);
  const [tab, setTab] = useState<Tab>('appearance');
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (h === 'reports' || h === 'appearance') setTab(h);
  }, []);
  const go = (t: Tab) => { setTab(t); try { history.replaceState(null, '', `#${t}`); } catch { /* ignore */ } };
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: tr('Appearance', 'Görünüm'), icon: <Palette size={15} /> },
    { id: 'reports', label: tr('Reports & branding', 'Raporlar & kurumsal kimlik'), icon: <FileText size={15} /> },
  ];
  return (
    <div className="relative z-10 mx-auto w-full max-w-[1100px] px-3 py-6 sm:px-6">
      <h1 className="text-xl font-semibold text-[var(--ink)]">{tr('Settings', 'Ayarlar')}</h1>
      <p className="mt-1 text-[13px] text-[var(--alu-dim)]">{tr('Stored in this browser.', 'Bu tarayıcıda saklanır.')}</p>
      <div className="mt-4 flex flex-wrap gap-1.5 border-b border-[var(--line)] pb-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => go(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-[var(--radius-s)] border px-3 py-1.5 text-[13px] cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] ${
              tab === t.id ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--ink)]' : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tab === 'appearance' ? (
          <div className="space-y-6">
            <ThemeGrid />
            <BackdropPicker />
          </div>
        ) : (
          <ReportBrandingPanel />
        )}
      </div>
    </div>
  );
}
