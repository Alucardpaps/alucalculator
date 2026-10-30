import type { Language } from '@/store/i18nStore';
import { t12 } from './t12';

const OTHER: Exclude<Language, 'en' | 'tr'>[] = [
  'de',
  'es',
  'fr',
  'it',
  'pt',
  'ru',
  'zh',
  'ja',
  'ko',
  'ar',
];

export type Loc12 = { en: string; tr: string } & Partial<Record<Language, string>>;

/** Fill de/es/fr/it/pt/ru/zh/ja/ko/ar from t12 when they still equal English. */
export function fillLoc12<T extends Loc12>(s: T): T {
  for (const lang of OTHER) {
    if (!s[lang] || s[lang] === s.en) {
      s[lang] = t12(lang, s.en, s.tr);
    }
  }
  return s;
}

export function hydrateTree(x: unknown): void {
  if (!x || typeof x !== 'object') return;
  if (Array.isArray(x)) {
    x.forEach(hydrateTree);
    return;
  }
  const o = x as Record<string, unknown>;
  if (typeof o.en === 'string' && typeof o.tr === 'string' && 'de' in o) {
    fillLoc12(o as unknown as Loc12);
  }
  for (const v of Object.values(o)) hydrateTree(v);
}
