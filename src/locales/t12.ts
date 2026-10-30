import type { Language } from '@/store/i18nStore';

/**
 * UI strings in the 12 supported languages.
 *
 * `t12(lang, en, tr)` looks the English text up in the active language's table. Tables are
 * generated per language (src/locales/t12/<lang>.json, from the master t12table.json by
 * scripts/build_t12_chunks.mjs) and loaded on demand, so a page only ships the table of the
 * language being shown. The inline `tr` argument covers Turkish without a table.
 */

type Table = Record<string, string>;
type NonEn = Exclude<Language, 'en'>;

const loaders: Record<NonEn, () => Promise<{ default: Table } | Table>> = {
  tr: () => import(/* webpackChunkName: "t12-tr" */ './t12/tr.json'),
  de: () => import(/* webpackChunkName: "t12-de" */ './t12/de.json'),
  es: () => import(/* webpackChunkName: "t12-es" */ './t12/es.json'),
  fr: () => import(/* webpackChunkName: "t12-fr" */ './t12/fr.json'),
  it: () => import(/* webpackChunkName: "t12-it" */ './t12/it.json'),
  pt: () => import(/* webpackChunkName: "t12-pt" */ './t12/pt.json'),
  ru: () => import(/* webpackChunkName: "t12-ru" */ './t12/ru.json'),
  zh: () => import(/* webpackChunkName: "t12-zh" */ './t12/zh.json'),
  ja: () => import(/* webpackChunkName: "t12-ja" */ './t12/ja.json'),
  ko: () => import(/* webpackChunkName: "t12-ko" */ './t12/ko.json'),
  ar: () => import(/* webpackChunkName: "t12-ar" */ './t12/ar.json'),
};

const tables: Partial<Record<NonEn, Table>> = {};
const lowerIndex: Partial<Record<NonEn, Map<string, string>>> = {};
const pending: Partial<Record<NonEn, Promise<void>>> = {};

const isNonEn = (lang: string): lang is NonEn => lang in loaders;

/** True when `lang` can be rendered without waiting (English, or its table is loaded). */
export function isT12Ready(lang: Language | string | undefined): boolean {
  return !lang || lang === 'en' || !isNonEn(lang) || Boolean(tables[lang]);
}

/** Loads the table of `lang` (once). Resolves even when loading fails (English fallback). */
export function loadT12(lang: Language | string | undefined): Promise<void> {
  if (!lang || !isNonEn(lang) || tables[lang]) return Promise.resolve();
  if (!pending[lang]) {
    pending[lang] = loaders[lang]()
      .then((mod) => {
        tables[lang] = ((mod as { default?: Table }).default ?? mod) as Table;
      })
      .catch(() => {
        delete pending[lang];
      });
  }
  return pending[lang]!;
}

function lowerLookup(lang: NonEn, key: string): string | undefined {
  let idx = lowerIndex[lang];
  if (!idx) {
    idx = new Map();
    for (const [k, v] of Object.entries(tables[lang] ?? {})) idx.set(k.toLowerCase().trim(), v);
    lowerIndex[lang] = idx;
  }
  return idx.get(key.toLowerCase().trim());
}

/**
 * Resolve a UI string for any of the 12 supported languages.
 * `en` is the lookup key; `tr` is used for Turkish (it wins over the table).
 */
export function t12(lang: Language | string | undefined, en: string, tr?: string): string {
  if (!lang || lang === 'en') return en;
  if (lang === 'tr' && tr) return tr;
  if (!isNonEn(lang)) return en;
  const table = tables[lang];
  if (!table) {
    // not loaded yet: start loading, show English meanwhile (the language switch waits for it)
    void loadT12(lang);
    return en;
  }
  return table[en] ?? table[en.trim()] ?? lowerLookup(lang, en) ?? en;
}
