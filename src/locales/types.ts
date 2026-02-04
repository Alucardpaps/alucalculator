/**
 * Type-Safe Colocated Translation System
 * 
 * This ensures compile-time enforcement that ALL locales are defined
 * for every translation key. Missing a locale = TypeScript error.
 */

import { i18n } from '@/i18n-config';

// Supported locales derived from config
export type SupportedLocale = (typeof i18n.locales)[number];

/**
 * Every translation entry MUST have all supported locales.
 * TypeScript will error if any locale is missing.
 */
export type TranslationEntry = {
    [K in SupportedLocale]: string;
};

/**
 * Helper to create a translation entry with type safety.
 * Usage: t({ en: "Hello", tr: "Merhaba", ... })
 */
export function t(entry: TranslationEntry): TranslationEntry {
    return entry;
}

/**
 * Recursively extracts a single locale from a nested dictionary.
 * Converts { title: { en: "X", tr: "Y" } } → { title: "X" } for locale 'en'
 */
export type ExtractLocale<T, L extends SupportedLocale> =
    T extends TranslationEntry
    ? T[L]
    : T extends readonly (infer U)[]
    ? ExtractLocale<U, L>[]
    : T extends object
    ? { [K in keyof T]: ExtractLocale<T[K], L> }
    : T;

/**
 * Runtime function to extract a specific locale from the colocated dictionary.
 * This recursively walks the dictionary and extracts the value for the given locale.
 */
export function extractLocale<T, L extends SupportedLocale>(
    dict: T,
    locale: L
): ExtractLocale<T, L> {
    if (dict === null || dict === undefined) {
        return dict as ExtractLocale<T, L>;
    }

    // Check if this is a TranslationEntry (has all locale keys)
    if (
        typeof dict === 'object' &&
        !Array.isArray(dict) &&
        'en' in dict && 'tr' in dict && 'de' in dict &&
        'fr' in dict && 'es' in dict && 'it' in dict &&
        'pt' in dict && 'ru' in dict && 'ja' in dict && 'zh' in dict &&
        typeof (dict as any).en === 'string'
    ) {
        return (dict as any)[locale] as ExtractLocale<T, L>;
    }

    // Handle arrays
    if (Array.isArray(dict)) {
        return dict.map(item => extractLocale(item, locale)) as ExtractLocale<T, L>;
    }

    // Handle nested objects
    if (typeof dict === 'object') {
        const result: Record<string, any> = {};
        for (const key of Object.keys(dict)) {
            result[key] = extractLocale((dict as any)[key], locale);
        }
        return result as ExtractLocale<T, L>;
    }

    // Primitive values pass through
    return dict as ExtractLocale<T, L>;
}

/**
 * Type for the flattened dictionary (what components receive)
 */
export type FlattenedDictionary<T> = ExtractLocale<T, 'en'>; // Base shape matches English

