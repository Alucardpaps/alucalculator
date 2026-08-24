import type { Language } from '@/store/i18nStore';

export type FitsModuleStrings = {
  hole: string;
  shaft: string;
  fitClass: string;
  customFit: string;
  clearanceFits: string;
  transitionFits: string;
  interferenceFits: string;
  holeInternal: string;
  shaftExternal: string;
  clearanceFit: string;
  interferenceFit: string;
  transitionFit: string;
  minGap: string;
  maxInterference: string;
  maxGap: string;
  minInterference: string;
  holeTol: string;
  shaftTol: string;
  nominal: string;
  maxMm: string;
  minMm: string;
  tolUm: string;
  holeLabel: string;
  shaftLabel: string;
};

const EN: FitsModuleStrings = {
  "hole": "HOLE",
  "shaft": "SHAFT",
  "fitClass": "Fit Class",
  "customFit": "Custom Fit",
  "clearanceFits": "Clearance Fits",
  "transitionFits": "Transition Fits",
  "interferenceFits": "Interference Fits",
  "holeInternal": "HOLE (Internal)",
  "shaftExternal": "SHAFT (External)",
  "clearanceFit": "CLEARANCE FIT",
  "interferenceFit": "INTERFERENCE FIT",
  "transitionFit": "TRANSITION FIT",
  "minGap": "Min Gap (μm)",
  "maxInterference": "Max Interference (μm)",
  "maxGap": "Max Gap (μm)",
  "minInterference": "Min Interference (μm)",
  "holeTol": "Hole Tol",
  "shaftTol": "Shaft Tol",
  "nominal": "Nominal",
  "maxMm": "Max (mm)",
  "minMm": "Min (mm)",
  "tolUm": "Tol (μm)",
  "holeLabel": "Hole",
  "shaftLabel": "Shaft"
} as FitsModuleStrings;

const TR: FitsModuleStrings = {
  "hole": "DELİK",
  "shaft": "MİL",
  "fitClass": "Geçme Sınıfı",
  "customFit": "Özel Geçme",
  "clearanceFits": "Boşluklu Geçmeler",
  "transitionFits": "Ara Geçmeler",
  "interferenceFits": "Sıkı Geçmeler",
  "holeInternal": "DELİK (İç Çap)",
  "shaftExternal": "MİL (Dış Çap)",
  "clearanceFit": "BOŞLUKLU GEÇME",
  "interferenceFit": "SIKI GEÇME",
  "transitionFit": "ARA GEÇME",
  "minGap": "Min Boşluk (μm)",
  "maxInterference": "Maks Sıkılık (μm)",
  "maxGap": "Maks Boşluk (μm)",
  "minInterference": "Min Sıkılık (μm)",
  "holeTol": "Delik Tol.",
  "shaftTol": "Mil Tol.",
  "nominal": "Nominal",
  "maxMm": "Maks (mm)",
  "minMm": "Min (mm)",
  "tolUm": "Tol (μm)",
  "holeLabel": "Delik",
  "shaftLabel": "Mil"
} as FitsModuleStrings;

const DE: FitsModuleStrings = {
  "hole": "BOHRUNG",
  "shaft": "WELLE",
  "fitClass": "Passungsklasse",
  "customFit": "Benutzerdefinierte Passung",
  "clearanceFits": "Spielpassungen",
  "transitionFits": "Übergangspassungen",
  "interferenceFits": "Presspassungen",
  "holeInternal": "BOHRUNG (Innen)",
  "shaftExternal": "WELLE (Außen)",
  "clearanceFit": "SPIELPASSUNG",
  "interferenceFit": "PRESSPASSUNG",
  "transitionFit": "ÜBERGANGSPASSUNG",
  "minGap": "Min. Spiel (μm)",
  "maxInterference": "Max. Pressung (μm)",
  "maxGap": "Max. Spiel (μm)",
  "minInterference": "Min. Pressung (μm)",
  "holeTol": "Bohrung Tol.",
  "shaftTol": "Welle Tol.",
  "nominal": "Nennmaß",
  "maxMm": "Max (mm)",
  "minMm": "Min (mm)",
  "tolUm": "Tol (μm)",
  "holeLabel": "Bohrung",
  "shaftLabel": "Welle"
} as FitsModuleStrings;

const ES: FitsModuleStrings = {
  "hole": "AGUJERO",
  "shaft": "EJE",
  "fitClass": "Clase de ajuste",
  "customFit": "Ajuste personalizado",
  "clearanceFits": "Ajustes con holgura",
  "transitionFits": "Ajustes de transición",
  "interferenceFits": "Ajustes con interferencia",
  "holeInternal": "AGUJERO (Interno)",
  "shaftExternal": "EJE (Externo)",
  "clearanceFit": "AJUSTE CON HOLGURA",
  "interferenceFit": "AJUSTE CON INTERFERENCIA",
  "transitionFit": "AJUSTE DE TRANSICIÓN",
  "minGap": "Holgura mín (μm)",
  "maxInterference": "Interferencia máx (μm)",
  "maxGap": "Holgura máx (μm)",
  "minInterference": "Interferencia mín (μm)",
  "holeTol": "Tol. agujero",
  "shaftTol": "Tol. eje",
  "nominal": "Nominal",
  "maxMm": "Máx (mm)",
  "minMm": "Mín (mm)",
  "tolUm": "Tol (μm)",
  "holeLabel": "Agujero",
  "shaftLabel": "Eje"
} as FitsModuleStrings;

const FR: FitsModuleStrings = {
  "hole": "TROU",
  "shaft": "ARBRE",
  "fitClass": "Classe d'ajustement",
  "customFit": "Ajustement personnalisé",
  "clearanceFits": "Ajustements avec jeu",
  "transitionFits": "Ajustements de transition",
  "interferenceFits": "Ajustements serrés",
  "holeInternal": "TROU (Interne)",
  "shaftExternal": "ARBRE (Externe)",
  "clearanceFit": "AJUSTEMENT AVEC JEU",
  "interferenceFit": "AJUSTEMENT SERRÉ",
  "transitionFit": "AJUSTEMENT DE TRANSITION",
  "minGap": "Jeu min (μm)",
  "maxInterference": "Serrage max (μm)",
  "maxGap": "Jeu max (μm)",
  "minInterference": "Serrage min (μm)",
  "holeTol": "Tol. trou",
  "shaftTol": "Tol. arbre",
  "nominal": "Nominale",
  "maxMm": "Max (mm)",
  "minMm": "Min (mm)",
  "tolUm": "Tol (μm)",
  "holeLabel": "Trou",
  "shaftLabel": "Arbre"
} as FitsModuleStrings;

const IT: FitsModuleStrings = {
  "hole": "FORO",
  "shaft": "ALBERO",
  "fitClass": "Classe di accoppiamento",
  "customFit": "Accoppiamento personalizzato",
  "clearanceFits": "Accoppiamenti con gioco",
  "transitionFits": "Accoppiamenti di transizione",
  "interferenceFits": "Accoppiamenti forzati",
  "holeInternal": "FORO (Interno)",
  "shaftExternal": "ALBERO (Esterno)",
  "clearanceFit": "ACCOPIAMENTO CON GIOCO",
  "interferenceFit": "ACCOPIAMENTO FORZATO",
  "transitionFit": "ACCOPIAMENTO DI TRANSIZIONE",
  "minGap": "Gioco min (μm)",
  "maxInterference": "Serraggio max (μm)",
  "maxGap": "Gioco max (μm)",
  "minInterference": "Serraggio min (μm)",
  "holeTol": "Tol. foro",
  "shaftTol": "Tol. albero",
  "nominal": "Nominale",
  "maxMm": "Max (mm)",
  "minMm": "Min (mm)",
  "tolUm": "Tol (μm)",
  "holeLabel": "Foro",
  "shaftLabel": "Albero"
} as FitsModuleStrings;

const PT: FitsModuleStrings = {
  "hole": "FURO",
  "shaft": "EIXO",
  "fitClass": "Classe de ajuste",
  "customFit": "Ajuste personalizado",
  "clearanceFits": "Ajustes com folga",
  "transitionFits": "Ajustes de transição",
  "interferenceFits": "Ajustes com interferência",
  "holeInternal": "FURO (Interno)",
  "shaftExternal": "EIXO (Externo)",
  "clearanceFit": "AJUSTE COM FOLGA",
  "interferenceFit": "AJUSTE COM INTERFERÊNCIA",
  "transitionFit": "AJUSTE DE TRANSIÇÃO",
  "minGap": "Folga mín (μm)",
  "maxInterference": "Interferência máx (μm)",
  "maxGap": "Folga máx (μm)",
  "minInterference": "Interferência mín (μm)",
  "holeTol": "Tol. furo",
  "shaftTol": "Tol. eixo",
  "nominal": "Nominal",
  "maxMm": "Máx (mm)",
  "minMm": "Mín (mm)",
  "tolUm": "Tol (μm)",
  "holeLabel": "Furo",
  "shaftLabel": "Eixo"
} as FitsModuleStrings;

const RU: FitsModuleStrings = {
  "hole": "ОТВЕРСТИЕ",
  "shaft": "ВАЛ",
  "fitClass": "Класс посадки",
  "customFit": "Пользовательская посадка",
  "clearanceFits": "Посадки с зазором",
  "transitionFits": "Переходные посадки",
  "interferenceFits": "Натяжные посадки",
  "holeInternal": "ОТВЕРСТИЕ (Внутр.)",
  "shaftExternal": "ВАЛ (Наруж.)",
  "clearanceFit": "ПОСАДКА С ЗАЗОРОМ",
  "interferenceFit": "НАТЯЖНАЯ ПОСАДКА",
  "transitionFit": "ПЕРЕХОДНАЯ ПОСАДКА",
  "minGap": "Мин. зазор (μm)",
  "maxInterference": "Макс. натяг (μm)",
  "maxGap": "Макс. зазор (μm)",
  "minInterference": "Мин. натяг (μm)",
  "holeTol": "Доп. отв.",
  "shaftTol": "Доп. вал",
  "nominal": "Номинал",
  "maxMm": "Макс (mm)",
  "minMm": "Мин (mm)",
  "tolUm": "Доп (μm)",
  "holeLabel": "Отверстие",
  "shaftLabel": "Вал"
} as FitsModuleStrings;

const JA: FitsModuleStrings = {
  "hole": "穴",
  "shaft": "軸",
  "fitClass": "はめあいクラス",
  "customFit": "カスタムはめあい",
  "clearanceFits": "すきまばめ",
  "transitionFits": "中間ばめ",
  "interferenceFits": "しまりばめ",
  "holeInternal": "穴公差 (内径)",
  "shaftExternal": "軸公差 (外径)",
  "clearanceFit": "すきまばめ",
  "interferenceFit": "しまりばめ",
  "transitionFit": "中間ばめ",
  "minGap": "最小すきま (μm)",
  "maxInterference": "最大しめしろ (μm)",
  "maxGap": "最大すきま (μm)",
  "minInterference": "最小しめしろ (μm)",
  "holeTol": "穴公差",
  "shaftTol": "軸公差",
  "nominal": "基準寸法",
  "maxMm": "最大 (mm)",
  "minMm": "最小 (mm)",
  "tolUm": "公差 (μm)",
  "holeLabel": "穴",
  "shaftLabel": "軸"
} as FitsModuleStrings;

const ZH: FitsModuleStrings = {
  "hole": "孔",
  "shaft": "轴",
  "fitClass": "配合等级",
  "customFit": "自定义配合",
  "clearanceFits": "间隙配合",
  "transitionFits": "过渡配合",
  "interferenceFits": "过盈配合",
  "holeInternal": "孔 (内径)",
  "shaftExternal": "轴 (外径)",
  "clearanceFit": "间隙配合",
  "interferenceFit": "过盈配合",
  "transitionFit": "过渡配合",
  "minGap": "最小间隙 (μm)",
  "maxInterference": "最大过盈 (μm)",
  "maxGap": "最大间隙 (μm)",
  "minInterference": "最小过盈 (μm)",
  "holeTol": "孔公差",
  "shaftTol": "轴公差",
  "nominal": "公称尺寸",
  "maxMm": "最大 (mm)",
  "minMm": "最小 (mm)",
  "tolUm": "公差 (μm)",
  "holeLabel": "孔",
  "shaftLabel": "轴"
} as FitsModuleStrings;

const KO: FitsModuleStrings = {
  "hole": "구멍",
  "shaft": "축",
  "fitClass": "끼움 등급",
  "customFit": "사용자 정의 끼움",
  "clearanceFits": "여유 끼움",
  "transitionFits": "과도 끼움",
  "interferenceFits": "압입 끼움",
  "holeInternal": "구멍 (내경)",
  "shaftExternal": "축 (외경)",
  "clearanceFit": "여유 끼움",
  "interferenceFit": "압입 끼움",
  "transitionFit": "과도 끼움",
  "minGap": "최소 간격 (μm)",
  "maxInterference": "최대 압입 (μm)",
  "maxGap": "최대 간격 (μm)",
  "minInterference": "최소 압입 (μm)",
  "holeTol": "구멍 공차",
  "shaftTol": "축 공차",
  "nominal": "공칭",
  "maxMm": "최대 (mm)",
  "minMm": "최소 (mm)",
  "tolUm": "공차 (μm)",
  "holeLabel": "구멍",
  "shaftLabel": "축"
} as FitsModuleStrings;

const AR: FitsModuleStrings = {
  "hole": "الثقب",
  "shaft": "العمود",
  "fitClass": "فئة المطابقة",
  "customFit": "مطابقة مخصصة",
  "clearanceFits": "مطابقات بفجوة",
  "transitionFits": "مطابقات انتقالية",
  "interferenceFits": "مطابقات ضغط",
  "holeInternal": "الثقب (داخلي)",
  "shaftExternal": "العمود (خارجي)",
  "clearanceFit": "مطابقة بفجوة",
  "interferenceFit": "مطابقة ضغط",
  "transitionFit": "مطابقة انتقالية",
  "minGap": "أدنى فجوة (μm)",
  "maxInterference": "أقصى ضغط (μm)",
  "maxGap": "أقصى فجوة (μm)",
  "minInterference": "أدنى ضغط (μm)",
  "holeTol": "تسامح الثقب",
  "shaftTol": "تسامح العمود",
  "nominal": "الاسمي",
  "maxMm": "الأقصى (mm)",
  "minMm": "الأدنى (mm)",
  "tolUm": "التسامح (μm)",
  "holeLabel": "الثقب",
  "shaftLabel": "العمود"
} as FitsModuleStrings;

const BY_LOCALE: Record<Language, FitsModuleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getFitsModuleStrings(locale: string): FitsModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
