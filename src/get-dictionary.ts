// import 'server-only'
import type { Locale } from './i18n-config';
import { dictionary } from './locales/dictionary';
import { extractLocale, type SupportedLocale } from './locales/types';

// Legacy dictionaries for sections not yet migrated to colocated system
const legacyDictionaries = {
    en: () => import('./dictionaries/en.json').then((module) => module.default),
    tr: () => import('./dictionaries/tr.json').then((module) => module.default),
    de: () => import('./dictionaries/de.json').then((module) => module.default),
    fr: () => import('./dictionaries/fr.json').then((module) => module.default),
    es: () => import('./dictionaries/es.json').then((module) => module.default),
    it: () => import('./dictionaries/it.json').then((module) => module.default),
    pt: () => import('./dictionaries/pt.json').then((module) => module.default),
    ru: () => import('./dictionaries/ru.json').then((module) => module.default),
    ja: () => import('./dictionaries/ja.json').then((module) => module.default),
    zh: () => import('./dictionaries/zh.json').then((module) => module.default),
};

const deepMerge = (target: any, source: any): any => {
    if (typeof target !== 'object' || target === null) {
        return source ?? target;
    }

    if (typeof source !== 'object' || source === null) {
        return target;
    }

    const output = { ...target };

    Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            if (key in target && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        } else {
            output[key] = source[key];
        }
    });

    return output;
}

/**
 * Get dictionary for a specific locale.
 * 
 * Uses the new colocated dictionary system for type-safe translations.
 * Falls back to legacy JSON for any unmigrated sections.
 */
export const getDictionary = async (locale: string) => {
    const safeLocale = (
        ['en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'].includes(locale)
            ? locale
            : 'en'
    ) as SupportedLocale;

    // Extract the locale-specific values from the colocated dictionary
    const colocatedDict = extractLocale(dictionary, safeLocale);

    // Load legacy dictionaries for full coverage during migration
    const loadEn = legacyDictionaries.en;
    const loadLocale = legacyDictionaries[safeLocale] ?? legacyDictionaries.en;

    try {
        const enDict = await loadEn();
        const localeDict = locale === 'en' ? enDict : await loadLocale();

        // Merge: Legacy English → Legacy Locale → Colocated (highest priority)
        const mergedLegacy = locale === 'en' ? enDict : deepMerge(enDict, localeDict);

        // Colocated dictionary takes precedence over legacy
        return deepMerge(mergedLegacy, colocatedDict);
    } catch (error) {
        console.error(`Could not load dictionary for locale: ${locale}`, error);
        // Even if legacy fails, return colocated dictionary
        return colocatedDict;
    }
}

/**
 * Type-safe dictionary getter (synchronous).
 * 
 * Use this for components that need compile-time type checking.
 * Returns the fully-typed colocated dictionary extracted for a locale.
 */
export const getTypedDictionary = (locale: SupportedLocale) => {
    return extractLocale(dictionary, locale);
}

export type AppDictionary = ReturnType<typeof getTypedDictionary>;
