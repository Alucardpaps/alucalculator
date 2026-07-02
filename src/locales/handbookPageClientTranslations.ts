import type { Language } from '@/store/i18nStore';

export type HandbookPageClientStrings = {
  filterPlaceholder: string;
  type: string;
  width: string;
  fitGrade: string;
  application: string;
  tableInProgress: string;
  gCodesTitle: string;
  material: string;
  category: string;
  density: string;
  yield: string;
  tensile: string;
  hardness: string;
};

const EN: HandbookPageClientStrings = {
  "filterPlaceholder": "Filter...",
  "type": "Type",
  "width": "Width",
  "fitGrade": "Fit / Grade",
  "application": "Application",
  "tableInProgress": "Table construction in progress...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const TR: HandbookPageClientStrings = {
  "filterPlaceholder": "Ara...",
  "type": "Tip",
  "width": "Genişlik",
  "fitGrade": "Tolerans",
  "application": "Uygulama",
  "tableInProgress": "Bu tablo hazırlanıyor...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const DE: HandbookPageClientStrings = {
  "filterPlaceholder": "Filtern...",
  "type": "Typ",
  "width": "Breite",
  "fitGrade": "Passung / Güte",
  "application": "Anwendung",
  "tableInProgress": "Tabelle wird erstellt...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const ES: HandbookPageClientStrings = {
  "filterPlaceholder": "Filtrar...",
  "type": "Tipo",
  "width": "Ancho",
  "fitGrade": "Ajuste / Grado",
  "application": "Aplicación",
  "tableInProgress": "Tabla en construcción...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const FR: HandbookPageClientStrings = {
  "filterPlaceholder": "Filtrer...",
  "type": "Type",
  "width": "Largeur",
  "fitGrade": "Ajustement / Classe",
  "application": "Application",
  "tableInProgress": "Table en cours de construction...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const IT: HandbookPageClientStrings = {
  "filterPlaceholder": "Filtra...",
  "type": "Tipo",
  "width": "Larghezza",
  "fitGrade": "Accoppiamento / Classe",
  "application": "Applicazione",
  "tableInProgress": "Tabella in costruzione...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const PT: HandbookPageClientStrings = {
  "filterPlaceholder": "Filtrar...",
  "type": "Tipo",
  "width": "Largura",
  "fitGrade": "Ajuste / Classe",
  "application": "Aplicação",
  "tableInProgress": "Tabela em construção...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const RU: HandbookPageClientStrings = {
  "filterPlaceholder": "Фильтр...",
  "type": "Тип",
  "width": "Ширина",
  "fitGrade": "Посадка / Класс",
  "application": "Применение",
  "tableInProgress": "Таблица в разработке...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const JA: HandbookPageClientStrings = {
  "filterPlaceholder": "フィルター...",
  "type": "形式",
  "width": "幅",
  "fitGrade": "はめあい / 等級",
  "application": "用途",
  "tableInProgress": "テーブル準備中...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const ZH: HandbookPageClientStrings = {
  "filterPlaceholder": "筛选...",
  "type": "类型",
  "width": "宽度",
  "fitGrade": "配合 / 等级",
  "application": "应用",
  "tableInProgress": "表格建设中...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const KO: HandbookPageClientStrings = {
  "filterPlaceholder": "필터...",
  "type": "유형",
  "width": "폭",
  "fitGrade": "끼움 / 등급",
  "application": "적용",
  "tableInProgress": "표 구성 중...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const AR: HandbookPageClientStrings = {
  "filterPlaceholder": "تصفية...",
  "type": "النوع",
  "width": "العرض",
  "fitGrade": "المطابقة / الدرجة",
  "application": "التطبيق",
  "tableInProgress": "الجدول قيد الإنشاء...",
  "gCodesTitle": "G & M Codes",
  "material": "Material",
  "category": "Category",
  "density": "Density (g/cm³)",
  "yield": "Yield (MPa)",
  "tensile": "Tensile (MPa)",
  "hardness": "Hardness"
} as HandbookPageClientStrings;

const BY_LOCALE: Record<Language, HandbookPageClientStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getHandbookPageClientStrings(locale: string): HandbookPageClientStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
