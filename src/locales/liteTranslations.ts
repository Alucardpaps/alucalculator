import type { Language } from '@/store/i18nStore';

export type LiteCategoryKey =
  | 'mechanical'
  | 'manufacturing'
  | 'civil'
  | 'electrical'
  | 'finance'
  | 'science'
  | 'software'
  | 'other';

export type LitePageStrings = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyState: string;
  categories: Record<LiteCategoryKey, string>;
};

const EN: LitePageStrings = {
  title: 'Calculators',
  subtitle: 'Select a tool below to begin your calculations.',
  searchPlaceholder: 'Search calculators...',
  emptyState: 'No calculators found matching your search.',
  categories: {
    mechanical: 'Mechanical Engineering',
    manufacturing: 'Manufacturing & Production',
    civil: 'Civil Engineering',
    electrical: 'Electrical',
    finance: 'Finance & Costing',
    science: 'Science & Math',
    software: 'Software Utilities',
    other: 'Other Tools',
  },
};

const TR: LitePageStrings = {
  title: 'Hesaplay\u0131c\u0131lar',
  subtitle: 'Hesaplamalar\u0131n\u0131za ba\u015flamak i\u00e7in a\u015fa\u011f\u0131dan bir ara\u00e7 se\u00e7in.',
  searchPlaceholder: 'Hesaplay\u0131c\u0131 ara...',
  emptyState: 'Araman\u0131zla e\u015fle\u015fen hesaplay\u0131c\u0131 bulunamad\u0131.',
  categories: {
    mechanical: 'Makine M\u00fchendisli\u011fi',
    manufacturing: '\u00dcretim ve \u0130malat',
    civil: '\u0130n\u015faat M\u00fchendisli\u011fi',
    electrical: 'Elektrik',
    finance: 'Finans ve Maliyet',
    science: 'Bilim ve Matematik',
    software: 'Yaz\u0131l\u0131m Ara\u00e7lar\u0131',
    other: 'Di\u011fer Ara\u00e7lar',
  },
};

const MAP: Record<Language, LitePageStrings> = {
  en: EN,
  tr: TR,
  de: EN,
  es: EN,
  fr: EN,
  it: EN,
  pt: EN,
  ru: EN,
  zh: EN,
  ja: EN,
  ko: EN,
  ar: EN,
};

export function getLitePage(locale: string): LitePageStrings {
  return MAP[locale as Language] ?? EN;
}
