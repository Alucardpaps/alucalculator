'use client';
import React from 'react';
import { Check } from 'lucide-react';
import { BACKDROPS, setBackdrop, useBackdrop } from '@/lib/theme/backgroundPref';
import { backdropLayers } from '@/components/ui/AmbientBackground';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export function BackdropPicker() {
  const cur = useBackdrop();
  const { language } = useI18nStore();
  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold text-[var(--ink)]">{t12(language, 'Background', 'Arka plan')}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BACKDROPS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBackdrop(b.id)}
            aria-pressed={cur === b.id}
            className={`group overflow-hidden rounded-[var(--radius-m)] border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] ${
              cur === b.id ? 'border-[var(--accent-line)]' : 'border-[var(--line)] hover:border-[var(--line-strong)]'
            }`}
          >
            <div className="relative h-16 bg-[var(--bg-0)]">
              {backdropLayers(b.id).map((st, i) => <div key={i} className="absolute inset-0" style={{ ...st, opacity: Math.min(1, ((st.opacity as number) ?? 1) * 1.6) }} />)}
              {cur === b.id && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cyan)] text-[var(--accent-ink)]"><Check size={12} /></span>
              )}
            </div>
            <div className="border-t border-[var(--line)] bg-[var(--bg-2)] px-2 py-1.5 text-[12px] text-[var(--alu)]">{t12(language, b.en, b.tr)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BackdropPicker;
