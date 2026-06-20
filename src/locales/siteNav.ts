import type { Language } from '@/store/i18nStore';

export type SiteNavStrings = {
  calculators: string;
  academy: string;
  launchWorkspace: string;
  tagline: string;
};

const SITE_NAV: Record<Language, SiteNavStrings> = {
  en: {
    calculators: 'Calculators',
    academy: 'Calculations',
    launchWorkspace: 'Launch Workspace',
    tagline: 'Engineering Intelligence v5.0',
  },
  tr: {
    calculators: 'Hesaplay\u0131c\u0131lar',
    academy: 'Hesaplamalar',
    launchWorkspace: '\u00c7al\u0131\u015fma Alan\u0131n\u0131 Ba\u015flat',
    tagline: 'M\u00fchendislik Zekas\u0131 v5.0',
  },
  de: {
    calculators: 'Rechner',
    academy: 'Berechnungen',
    launchWorkspace: 'Workspace starten',
    tagline: 'Engineering Intelligence v5.0',
  },
  es: {
    calculators: 'Calculadoras',
    academy: 'C\u00e1lculos',
    launchWorkspace: 'Iniciar espacio de trabajo',
    tagline: 'Inteligencia de ingenier\u00eda v5.0',
  },
  fr: {
    calculators: 'Calculateurs',
    academy: 'Calculs',
    launchWorkspace: 'Lancer l\'espace de travail',
    tagline: 'Intelligence ing\u00e9nierie v5.0',
  },
  it: {
    calculators: 'Calcolatori',
    academy: 'Calcoli',
    launchWorkspace: 'Avvia workspace',
    tagline: 'Intelligenza ingegneristica v5.0',
  },
  pt: {
    calculators: 'Calculadoras',
    academy: 'C\u00e1lculos',
    launchWorkspace: 'Iniciar workspace',
    tagline: 'Intelig\u00eancia de engenharia v5.0',
  },
  ru: {
    calculators: '\u041a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b',
    academy: '\u0420\u0430\u0441\u0447\u0451\u0442\u044b',
    launchWorkspace: '\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0440\u0430\u0431\u043e\u0447\u0443\u044e \u043e\u0431\u043b\u0430\u0441\u0442\u044c',
    tagline: '\u0418\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0439 \u0438\u043d\u0442\u0435\u043b\u043b\u0435\u043a\u0442 v5.0',
  },
  zh: {
    calculators: '\u8ba1\u7b97\u5668',
    academy: '\u8ba1\u7b97',
    launchWorkspace: '\u542f\u52a8\u5de5\u4f5c\u533a',
    tagline: '\u5de5\u7a0b\u667a\u80fd v5.0',
  },
  ja: {
    calculators: '\u8a08\u7b97\u6a5f',
    academy: '\u8a08\u7b97',
    launchWorkspace: '\u30ef\u30fc\u30af\u30b9\u30da\u30fc\u30b9\u3092\u8d77\u52d5',
    tagline: '\u30a8\u30f3\u30b8\u30cb\u30a2\u30ea\u30f3\u30b0\u30fb\u30a4\u30f3\u30c6\u30ea\u30b8\u30a7\u30f3\u30b9 v5.0',
  },
  ko: {
    calculators: '\uacc4\uc0b0\uae30',
    academy: '\uacc4\uc0b0',
    launchWorkspace: '\uc6cc\ud06c\uc2a4\ud398\uc774\uc2a4 \uc2dc\uc791',
    tagline: '\uc5d4\uc9c0\ub2c8\uc5b4\ub9c1 \uc778\ud15c\ub9ac\uc804\uc2a4 v5.0',
  },
  ar: {
    calculators: '\u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a',
    academy: '\u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a',
    launchWorkspace: '\u062a\u0634\u063a\u064a\u0644 \u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644',
    tagline: '\u0630\u0643\u0627\u0621 \u0647\u0646\u062f\u0633\u064a v5.0',
  },
};

export const LANGUAGE_OPTIONS: Array<{
  id: Language;
  flag: string;
  native: string;
}> = [
  { id: 'en', flag: '\u{1F1FA}\u{1F1F8}', native: 'English' },
  { id: 'tr', flag: '\u{1F1F9}\u{1F1F7}', native: 'T\u00fcrk\u00e7e' },
  { id: 'de', flag: '\u{1F1E9}\u{1F1EA}', native: 'Deutsch' },
  { id: 'es', flag: '\u{1F1EA}\u{1F1F8}', native: 'Espa\u00f1ol' },
  { id: 'fr', flag: '\u{1F1EB}\u{1F1F7}', native: 'Fran\u00e7ais' },
  { id: 'it', flag: '\u{1F1EE}\u{1F1F9}', native: 'Italiano' },
  { id: 'pt', flag: '\u{1F1F5}\u{1F1F9}', native: 'Portugu\u00eas' },
  { id: 'ru', flag: '\u{1F1F7}\u{1F1FA}', native: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  { id: 'zh', flag: '\u{1F1E8}\u{1F1F3}', native: '\u4e2d\u6587' },
  { id: 'ja', flag: '\u{1F1EF}\u{1F1F5}', native: '\u65e5\u672c\u8a9e' },
  { id: 'ko', flag: '\u{1F1F0}\u{1F1F7}', native: '\ud55c\uad6d\uc5b4' },
  { id: 'ar', flag: '\u{1F1E6}\u{1F1EA}', native: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
];

export function getSiteNav(locale: string): SiteNavStrings {
  return SITE_NAV[locale as Language] ?? SITE_NAV.en;
}
