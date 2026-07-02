import type { Language } from '@/store/i18nStore';

const BCP47: Record<Language, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ar: 'ar-SA',
};

export function getLocaleBcp47(locale: string): string {
  return BCP47[locale as Language] ?? 'en-US';
}

export function formatShortDate(locale: string, date: Date): string {
  return date.toLocaleDateString(getLocaleBcp47(locale), { month: 'short', day: 'numeric' });
}

export function formatDateTime(locale: string, timestamp: number): string {
  return new Date(timestamp).toLocaleString(getLocaleBcp47(locale), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
