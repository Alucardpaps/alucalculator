import type { Language } from '@/store/i18nStore';

export type FastenerMetadataStrings = {
  isoStandardTitle: string;
  uncStandardTitle: string;
  assumption1: string;
  assumption2: string;
  assumption3: string;
};

const EN: FastenerMetadataStrings = {
  "isoStandardTitle": "General purpose metric screw threads",
  "uncStandardTitle": "Unified Inch Screw Threads (UN/UNR)",
  "assumption1": "Tolerance Class: 6g (Bolt) / 6H (Nut)",
  "assumption2": "Standard Coarse/Fine Pitches only",
  "assumption3": "Tensile Area calculation based on nominal diameter"
} as FastenerMetadataStrings;

const TR: FastenerMetadataStrings = {
  "isoStandardTitle": "Genel amaçlı metrik cıvata dişleri",
  "uncStandardTitle": "Unifiye İnç Vida Dişleri (UN/UNR)",
  "assumption1": "Tolerans Sınıfı: 6g (Cıvata) / 6H (Somun)",
  "assumption2": "Yalnızca Standart Kaba/İnce Adımlar",
  "assumption3": "Gerilme alanı hesabı nominal çapa dayanmaktadır"
} as FastenerMetadataStrings;

const DE: FastenerMetadataStrings = {
  "isoStandardTitle": "Metrisches ISO-Gewinde allgemeiner Anwendung",
  "uncStandardTitle": "Einheitliches Zoll-Gewinde (UN/UNR)",
  "assumption1": "Toleranzklasse: 6g (Schraube) / 6H (Mutter)",
  "assumption2": "Nur Standard-Regel-/Feingewinde",
  "assumption3": "Spannungsquerschnitts-Berechnung basiert auf Nenndurchmesser"
} as FastenerMetadataStrings;

const ES: FastenerMetadataStrings = {
  "isoStandardTitle": "Roscas métricas de uso general",
  "uncStandardTitle": "Roscas UN pulgadas unificadas",
  "assumption1": "Clase tolerancia: 6g (Perno) / 6H (Tuerca)",
  "assumption2": "Solo pasos estándar grueso/fino",
  "assumption3": "Área de tensión basada en diámetro nominal"
} as FastenerMetadataStrings;

const FR: FastenerMetadataStrings = {
  "isoStandardTitle": "Filetages métriques usage général",
  "uncStandardTitle": "Filetages UN pouces unifiés",
  "assumption1": "Classe: 6g (Boulon) / 6H (Écrou)",
  "assumption2": "Pas standard gros/fin uniquement",
  "assumption3": "Section basée sur diamètre nominal"
} as FastenerMetadataStrings;

const IT: FastenerMetadataStrings = {
  "isoStandardTitle": "Filettature metriche uso generale",
  "uncStandardTitle": "Filettature UN pollici unificate",
  "assumption1": "Classe: 6g (Bullone) / 6H (Dado)",
  "assumption2": "Solo passi standard",
  "assumption3": "Area tensione su diametro nominale"
} as FastenerMetadataStrings;

const PT: FastenerMetadataStrings = {
  "isoStandardTitle": "Rosca métrica uso geral",
  "uncStandardTitle": "Rosca UN polegadas unificada",
  "assumption1": "Classe: 6g (Parafuso) / 6H (Porca)",
  "assumption2": "Apenas passos padrão",
  "assumption3": "Área de tensão no diâmetro nominal"
} as FastenerMetadataStrings;

const RU: FastenerMetadataStrings = {
  "isoStandardTitle": "Метрическая резьба общего назначения",
  "uncStandardTitle": "Дюймовая резьба UN (UN/UNR)",
  "assumption1": "Класс: 6g (Болт) / 6H (Гайка)",
  "assumption2": "Только стандартные шаги",
  "assumption3": "Площадь сечения по номинальному диаметру"
} as FastenerMetadataStrings;

const JA: FastenerMetadataStrings = {
  "isoStandardTitle": "一般用メートルねじ規格",
  "uncStandardTitle": "ユニファイねじ規格 (UN/UNR)",
  "assumption1": "公差等級: 6g (ボルト) / 6H (ナット)",
  "assumption2": "標準の並目・細目ピッチのみ",
  "assumption3": "有効断面積は基準寸法(呼び径)に基づいて算出"
} as FastenerMetadataStrings;

const ZH: FastenerMetadataStrings = {
  "isoStandardTitle": "通用公制螺纹",
  "uncStandardTitle": "统一英制螺纹 (UN/UNR)",
  "assumption1": "公差等级: 6g (螺栓) / 6H (螺母)",
  "assumption2": "仅标准粗/细牙距",
  "assumption3": "应力面积按公称直径计算"
} as FastenerMetadataStrings;

const KO: FastenerMetadataStrings = {
  "isoStandardTitle": "범용 미터 나사",
  "uncStandardTitle": "통일 인치 나사 (UN/UNR)",
  "assumption1": "공차 등급: 6g (볼트) / 6H (너트)",
  "assumption2": "표준 조/세 피치만",
  "assumption3": "응력 단면적은 공칭 직경 기준"
} as FastenerMetadataStrings;

const AR: FastenerMetadataStrings = {
  "isoStandardTitle": "خيوط مترية للأغراض العامة",
  "uncStandardTitle": "خيوط بوصة موحدة (UN/UNR)",
  "assumption1": "فئة التسامح: 6g (برغي) / 6H (صمولة)",
  "assumption2": "خطوات قياسية فقط",
  "assumption3": "مساحة الإجهاد على القطر الاسمي"
} as FastenerMetadataStrings;

const BY_LOCALE: Record<Language, FastenerMetadataStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getFastenerMetadataStrings(locale: string): FastenerMetadataStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
