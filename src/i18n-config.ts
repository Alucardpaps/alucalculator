export const i18n = {
    defaultLocale: 'en',
    locales: ['en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
