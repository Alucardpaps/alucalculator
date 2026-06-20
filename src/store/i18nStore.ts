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

export type Language = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar';

type Translations = typeof en;

function mergeLocaleWithFallback(locale: any): typeof en {
    return {
        ...en,
        ...locale,
        modules: { ...en.modules, ...(locale?.modules ?? {}) },
        moduleHints: { ...en.moduleHints, ...(locale?.moduleHints ?? {}) },
    };
}

const translations: Record<Language, any> = {
    en,
    tr: mergeLocaleWithFallback(tr),
    de: mergeLocaleWithFallback(de),
    es: mergeLocaleWithFallback(es),
    fr: mergeLocaleWithFallback(fr),
    it: mergeLocaleWithFallback(it),
    pt: mergeLocaleWithFallback(pt),
    ru: mergeLocaleWithFallback(ru),
    zh: mergeLocaleWithFallback(zh),
    ja: mergeLocaleWithFallback(ja),
    ko: mergeLocaleWithFallback(ko),
    ar: mergeLocaleWithFallback(ar),
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
