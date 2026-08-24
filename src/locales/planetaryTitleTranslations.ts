import type { Language } from '@/store/i18nStore';

export type PlanetaryTitleStrings = {
  titleBefore: string;
  titleHighlight: string;
};

const EN: PlanetaryTitleStrings = {
  "titleBefore": "Planetary",
  "titleHighlight": "Multi-Stage"
} as PlanetaryTitleStrings;

const TR: PlanetaryTitleStrings = {
  "titleBefore": "Planer",
  "titleHighlight": "Çok Kademeli"
} as PlanetaryTitleStrings;

const DE: PlanetaryTitleStrings = {
  "titleBefore": "Planeten",
  "titleHighlight": "Mehrstufig"
} as PlanetaryTitleStrings;

const ES: PlanetaryTitleStrings = {
  "titleBefore": "Planetario",
  "titleHighlight": "Multi-Etapa"
} as PlanetaryTitleStrings;

const FR: PlanetaryTitleStrings = {
  "titleBefore": "Planétaire",
  "titleHighlight": "Multi-Étages"
} as PlanetaryTitleStrings;

const IT: PlanetaryTitleStrings = {
  "titleBefore": "Planetario",
  "titleHighlight": "Multi-Stadio"
} as PlanetaryTitleStrings;

const PT: PlanetaryTitleStrings = {
  "titleBefore": "Planetário",
  "titleHighlight": "Multi-Estágio"
} as PlanetaryTitleStrings;

const RU: PlanetaryTitleStrings = {
  "titleBefore": "Планетарный",
  "titleHighlight": "Многоступенчатый"
} as PlanetaryTitleStrings;

const JA: PlanetaryTitleStrings = {
  "titleBefore": "遊星",
  "titleHighlight": "マルチステージ"
} as PlanetaryTitleStrings;

const ZH: PlanetaryTitleStrings = {
  "titleBefore": "行星",
  "titleHighlight": "多级"
} as PlanetaryTitleStrings;

const KO: PlanetaryTitleStrings = {
  "titleBefore": "행성",
  "titleHighlight": "다단"
} as PlanetaryTitleStrings;

const AR: PlanetaryTitleStrings = {
  "titleBefore": "كوكبي",
  "titleHighlight": "متعدد المراحل"
} as PlanetaryTitleStrings;

const BY_LOCALE: Record<Language, PlanetaryTitleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getPlanetaryTitleStrings(locale: string): PlanetaryTitleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
