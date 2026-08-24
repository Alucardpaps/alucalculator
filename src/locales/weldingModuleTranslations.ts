import type { Language } from '@/store/i18nStore';

export type WeldingModuleStrings = {
  processJoint: string;
  electrode: string;
  powerParams: string;
  weldGeometry: string;
  weldSafe: string;
  weldWarning: string;
  safetyFactor: string;
  minLeg: string;
  filler: string;
  preheat: string;
  weldPreview: string;
};

const EN: WeldingModuleStrings = {
  "processJoint": "Process & Joint",
  "electrode": "Electrode",
  "powerParams": "Power Parameters",
  "weldGeometry": "Weld Geometry",
  "weldSafe": "WELD DESIGN — SAFE",
  "weldWarning": "WARNING: INSUFFICIENT SAFETY",
  "safetyFactor": "Safety Factor",
  "minLeg": "Min Leg",
  "filler": "Filler",
  "preheat": "Preheat",
  "weldPreview": "WELD JOINT PREVIEW"
} as WeldingModuleStrings;

const TR: WeldingModuleStrings = {
  "processJoint": "Yöntem & Birleştirme",
  "electrode": "Elektrot",
  "powerParams": "Güç Parametreleri",
  "weldGeometry": "Kaynak Geometrisi",
  "weldSafe": "KAYNAK BAĞLANTISI — GÜVENLİ",
  "weldWarning": "UYARI: YETERSİZ GÜVENLİK",
  "safetyFactor": "Güvenlik Faktörü",
  "minLeg": "Min Dikiş",
  "filler": "İlave Metal",
  "preheat": "Ön Isıtma",
  "weldPreview": "KAYNAK BAĞLANTISI ÖNİZLEMESİ"
} as WeldingModuleStrings;

const DE: WeldingModuleStrings = {
  "processJoint": "Verfahren & Naht",
  "electrode": "Elektrode",
  "powerParams": "Leistungsparameter",
  "weldGeometry": "Schweißnahtgeometrie",
  "weldSafe": "SCHWEISSNAHT — SICHER",
  "weldWarning": "WARNUNG: UNZUREICHENDE SICHERHEIT",
  "safetyFactor": "Sicherheitsfaktor",
  "minLeg": "Min. Kehlhöhe",
  "filler": "Zusatzwerkstoff",
  "preheat": "Vorwärmen",
  "weldPreview": "SCHWEISSNAHT-VORSCHAU"
} as WeldingModuleStrings;

const ES: WeldingModuleStrings = {
  "processJoint": "Proceso y Junta",
  "electrode": "Electrodo",
  "powerParams": "Parámetros de Potencia",
  "weldGeometry": "Geometría de Soldadura",
  "weldSafe": "DISEÑO DE SOLDADURA — SEGURO",
  "weldWarning": "ADVERTENCIA: SEGURIDAD INSUFICIENTE",
  "safetyFactor": "Factor de Seguridad",
  "minLeg": "Pierna Mín",
  "filler": "Aporte",
  "preheat": "Precalentamiento",
  "weldPreview": "VISTA PREVIA DE JUNTA"
} as WeldingModuleStrings;

const FR: WeldingModuleStrings = {
  "processJoint": "Procédé et Joint",
  "electrode": "Électrode",
  "powerParams": "Paramètres de Puissance",
  "weldGeometry": "Géométrie de Soudure",
  "weldSafe": "SOUDURE — SÛRE",
  "weldWarning": "AVERTISSEMENT: SÉCURITÉ INSUFFISANTE",
  "safetyFactor": "Facteur de Sécurité",
  "minLeg": "Gorge Min",
  "filler": "Apport",
  "preheat": "Préchauffage",
  "weldPreview": "APERÇU DE JOINT"
} as WeldingModuleStrings;

const IT: WeldingModuleStrings = {
  "processJoint": "Processo e Giunto",
  "electrode": "Elettrodo",
  "powerParams": "Parametri di Potenza",
  "weldGeometry": "Geometria Saldatura",
  "weldSafe": "SALDATURA — SICURA",
  "weldWarning": "AVVISO: SICUREZZA INSUFFICIENTE",
  "safetyFactor": "Fattore di Sicurezza",
  "minLeg": "Gola Min",
  "filler": "Apporto",
  "preheat": "Preriscaldamento",
  "weldPreview": "ANTEPRIMA GIUNTO"
} as WeldingModuleStrings;

const PT: WeldingModuleStrings = {
  "processJoint": "Processo e Junta",
  "electrode": "Eletrodo",
  "powerParams": "Parâmetros de Potência",
  "weldGeometry": "Geometria de Solda",
  "weldSafe": "SOLDA — SEGURA",
  "weldWarning": "AVISO: SEGURANÇA INSUFICIENTE",
  "safetyFactor": "Fator de Segurança",
  "minLeg": "Gargalo Mín",
  "filler": "Metal de Aporte",
  "preheat": "Pré-aquecimento",
  "weldPreview": "PRÉ-VISUALIZAÇÃO DA JUNTA"
} as WeldingModuleStrings;

const RU: WeldingModuleStrings = {
  "processJoint": "Процесс и Шов",
  "electrode": "Электрод",
  "powerParams": "Параметры Мощности",
  "weldGeometry": "Геометрия Шва",
  "weldSafe": "ШОВ — БЕЗОПАСНО",
  "weldWarning": "ПРЕДУПРЕЖДЕНИЕ: НЕДОСТАТОЧНАЯ БЕЗОПАСНОСТЬ",
  "safetyFactor": "Запас Прочности",
  "minLeg": "Мин. Катет",
  "filler": "Присадка",
  "preheat": "Подогрев",
  "weldPreview": "ПРЕДПРОСМОТР ШВА"
} as WeldingModuleStrings;

const JA: WeldingModuleStrings = {
  "processJoint": "溶接法 & 継手形状",
  "electrode": "溶接棒",
  "powerParams": "電気パラメータ",
  "weldGeometry": "溶接部形状",
  "weldSafe": "溶接部設計 — 安全領域",
  "weldWarning": "警告: 強度不足",
  "safetyFactor": "安全率",
  "minLeg": "最小脚長",
  "filler": "溶加材",
  "preheat": "予熱",
  "weldPreview": "溶接断面ビジュアライザ"
} as WeldingModuleStrings;

const ZH: WeldingModuleStrings = {
  "processJoint": "工艺与接头",
  "electrode": "焊条",
  "powerParams": "功率参数",
  "weldGeometry": "焊缝几何",
  "weldSafe": "焊缝设计 — 安全",
  "weldWarning": "警告：安全系数不足",
  "safetyFactor": "安全系数",
  "minLeg": "最小焊脚",
  "filler": "填充金属",
  "preheat": "预热",
  "weldPreview": "焊缝接头预览"
} as WeldingModuleStrings;

const KO: WeldingModuleStrings = {
  "processJoint": "공정 및 이음",
  "electrode": "전극",
  "powerParams": "전력 매개변수",
  "weldGeometry": "용접 형상",
  "weldSafe": "용접 설계 — 안전",
  "weldWarning": "경고: 안전 계수 부족",
  "safetyFactor": "안전 계수",
  "minLeg": "최소 각장",
  "filler": "용가재",
  "preheat": "예열",
  "weldPreview": "용접 이음 미리보기"
} as WeldingModuleStrings;

const AR: WeldingModuleStrings = {
  "processJoint": "العملية والوصلة",
  "electrode": "القطب",
  "powerParams": "معاملات القدرة",
  "weldGeometry": "هندسة اللحام",
  "weldSafe": "تصميم اللحام — آمن",
  "weldWarning": "تحذير: أمان غير كافٍ",
  "safetyFactor": "عامل الأمان",
  "minLeg": "الساق الأدنى",
  "filler": "مادة الإضافة",
  "preheat": "التسخين المسبق",
  "weldPreview": "معاينة وصلة اللحام"
} as WeldingModuleStrings;

const BY_LOCALE: Record<Language, WeldingModuleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getWeldingModuleStrings(locale: string): WeldingModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
