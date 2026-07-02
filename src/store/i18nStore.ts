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

export type Language = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar';

type Translations = typeof en;

function mergeLocaleWithFallback(locale: any, lang: Language): typeof en {
    return {
        ...en,
        ...locale,
        modules: { ...en.modules, ...(locale?.modules ?? {}) },
        moduleHints: { ...getModuleHints(lang), ...(locale?.moduleHints ?? {}) },
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

export const useI18nStore = create<I18nState>()(
    persist(
        (set) => ({
            language: 'en', // Default to English as international fallback
            t: translations.en,
            setLanguage: (lang: Language) => {
                set({ language: lang, t: translations[lang] });
                syncLanguageAcrossStores(lang);
            },
        }),
        {
            name: 'alucalc-i18n-storage',
            partialize: (state) => ({ language: state.language }), // Only persist the language preference
            onRehydrateStorage: () => (state) => {
                // Ensure translations are loaded after rehydration reactively
                if (state && state.language) {
                    state.setLanguage(state.language);
                }
            }
        }
    )
);
