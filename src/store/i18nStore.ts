import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDictionary } from '../get-dictionary';
import { useOSStore } from './osStore';
import en from '../locales/en';
import tr from '../locales/tr';
import de from '../locales/de';
import es from '../locales/es';
import fr from '../locales/fr';
import it from '../locales/it';
import pt from '../locales/pt';
import ru from '../locales/ru';
import zh from '../locales/zh';
import ja from '../locales/ja';
import ko from '../locales/ko';
import ar from '../locales/ar';
import { getModuleHints } from '../locales/moduleHintsTranslations';
import { isT12Ready, loadT12 } from '../locales/t12';

export type Language = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar';

type Translations = typeof en;

function mergeLocaleWithFallback(locale: any, lang: Language): typeof en {
    return {
        ...en,
        ...locale,
        modules: { ...en.modules, ...(locale?.modules ?? {}) },
        moduleHints: { ...en.moduleHints, ...(locale?.moduleHints ?? {}), ...getModuleHints(lang) },
        categories: { ...en.categories, ...(locale?.categories ?? {}) },
        ribbon: { ...en.ribbon, ...(locale?.ribbon ?? {}) },
        handbook: locale?.handbook ? { ...en.handbook, ...locale.handbook, shortcuts: { ...en.handbook?.shortcuts, ...(locale.handbook?.shortcuts ?? {}) } } : en.handbook,
        variables: { ...en.variables, ...(locale?.variables ?? {}) },
        palette: locale?.palette
            ? {
                ...en.palette,
                ...locale.palette,
                categories: { ...en.palette?.categories, ...(locale.palette?.categories ?? {}) },
            }
            : en.palette,
    };
}

const translations: Record<Language, any> = {
    en,
    tr: mergeLocaleWithFallback(tr, 'tr'),
    de: mergeLocaleWithFallback(de, 'de'),
    es: mergeLocaleWithFallback(es, 'es'),
    fr: mergeLocaleWithFallback(fr, 'fr'),
    it: mergeLocaleWithFallback(it, 'it'),
    pt: mergeLocaleWithFallback(pt, 'pt'),
    ru: mergeLocaleWithFallback(ru, 'ru'),
    zh: mergeLocaleWithFallback(zh, 'zh'),
    ja: mergeLocaleWithFallback(ja, 'ja'),
    ko: mergeLocaleWithFallback(ko, 'ko'),
    ar: mergeLocaleWithFallback(ar, 'ar'),
};

interface I18nState {
    language: Language;
    t: any;
    setLanguage: (lang: Language) => void;
}

function syncLanguageAcrossStores(lang: Language) {
    const os = useOSStore.getState();
    os.setLanguage(lang);
    getDictionary(lang)
        .then((dict) => os.setDictionary(dict))
        .catch((err) => console.error(`Failed to load dictionary for ${lang}`, err));
}

const STORAGE_KEY = 'alucalc-i18n-storage';
const LANGUAGES: Language[] = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

/** Persisted language read before hydration, so its string table starts loading at once. */
let deferredLanguage: Language | null = null;
if (typeof window !== 'undefined') {
    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')?.state?.language;
        if (LANGUAGES.includes(saved)) void loadT12(saved);
    } catch {
        // storage unavailable: English until the user picks a language
    }
}

let languageRequest = 0;

/** Turkish renders at once: nearly every string carries its Turkish text inline. */
const canApplyNow = (lang: Language) => lang === 'tr' || isT12Ready(lang);

export const useI18nStore = create<I18nState>()(
    persist(
        (set) => ({
            language: 'en', // Default to English as international fallback
            t: translations.en,
            setLanguage: (lang: Language) => {
                const request = ++languageRequest;
                const apply = () => {
                    if (request !== languageRequest) return; // a newer choice won
                    set({ language: lang, t: translations[lang] });
                    syncLanguageAcrossStores(lang);
                };
                // switch once the language's UI string table is loaded (no flash of English)
                if (canApplyNow(lang)) {
                    apply();
                    void loadT12(lang);
                } else {
                    loadT12(lang).then(apply, apply);
                }
            },
        }),
        {
            name: STORAGE_KEY,
            partialize: (state) => ({ language: state.language }), // Only persist the language preference
            merge: (persisted, current) => {
                const lang = (persisted as { language?: Language } | undefined)?.language;
                if (lang && LANGUAGES.includes(lang) && !canApplyNow(lang)) {
                    // keep English until the table is in, then switch (see onRehydrateStorage)
                    deferredLanguage = lang;
                    return current;
                }
                return { ...current, ...(persisted as object) };
            },
            onRehydrateStorage: () => (state) => {
                const lang = deferredLanguage ?? state?.language;
                deferredLanguage = null;
                if (state && lang) state.setLanguage(lang);
            }
        }
    )
);
