import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

const translations: Record<Language, any> = {
    en,
    tr,
    de,
    es,
    fr,
    it,
    pt,
    ru,
    zh,
    ja,
    ko,
    ar,
};

interface I18nState {
    language: Language;
    t: any;
    setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>()(
    persist(
        (set) => ({
            language: 'tr', // Default to Turkish per user request context
            t: translations.tr,
            setLanguage: (lang: Language) => set({ language: lang, t: translations[lang] }),
        }),
        {
            name: 'alucalc-i18n-storage',
            partialize: (state) => ({ language: state.language }), // Only persist the language preference
            onRehydrateStorage: () => (state) => {
                // Ensure translations are loaded after rehydration
                if (state && state.language) {
                    state.t = translations[state.language];
                }
            }
        }
    )
);
