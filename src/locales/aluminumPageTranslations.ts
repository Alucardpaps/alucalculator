import type { Language } from '@/store/i18nStore';

export type AluminumPageStrings = {
  manualPrice: string;
};

const EN: AluminumPageStrings = {
  "manualPrice": "Manual Price"
} as AluminumPageStrings;

const TR: AluminumPageStrings = {
  "manualPrice": "Manuel Fiyat"
} as AluminumPageStrings;

const DE: AluminumPageStrings = {
  "manualPrice": "Manueller Preis"
} as AluminumPageStrings;

const ES: AluminumPageStrings = {
  "manualPrice": "Precio manual"
} as AluminumPageStrings;

const FR: AluminumPageStrings = {
  "manualPrice": "Prix manuel"
} as AluminumPageStrings;

const IT: AluminumPageStrings = {
  "manualPrice": "Prezzo manuale"
} as AluminumPageStrings;

const PT: AluminumPageStrings = {
  "manualPrice": "Preço manual"
} as AluminumPageStrings;

const RU: AluminumPageStrings = {
  "manualPrice": "Ручная цена"
} as AluminumPageStrings;

const JA: AluminumPageStrings = {
  "manualPrice": "手動価格"
} as AluminumPageStrings;

const ZH: AluminumPageStrings = {
  "manualPrice": "手动价格"
} as AluminumPageStrings;

const KO: AluminumPageStrings = {
  "manualPrice": "수동 가격"
} as AluminumPageStrings;

const AR: AluminumPageStrings = {
  "manualPrice": "سعر يدوي"
} as AluminumPageStrings;

const BY_LOCALE: Record<Language, AluminumPageStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getAluminumPageStrings(locale: string): AluminumPageStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
