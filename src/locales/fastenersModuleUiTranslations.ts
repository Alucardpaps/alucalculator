import type { Language } from '@/store/i18nStore';

export type FastenersModuleUiStrings = {
  title: string;
  subtitle: string;
  addToBom: string;
  pdfSpec: string;
  specification: string;
  sizing: string;
  stdFamily: string;
  nomSize: string;
  length: string;
  lengthAdj: string;
  bolt: string;
  nut: string;
  tapDrill: string;
  tensileArea: string;
  clearanceHole: string;
  detailedThreadMetrics: string;
  validGeometry: string;
  outOfBounds: string;
  majorDia: string;
  pitchDia: string;
  minorDia: string;
  nomPitch: string;
  pitch: string;
  engagementDynamics: string;
  clearanceSeries: string;
  headWidth: string;
  headHeight: string;
  openTorque: string;
};

const EN: FastenersModuleUiStrings = {
  "title": "Thread Fasteners",
  "subtitle": "Section J: Thread Geometry & Clearances • AluCalcOS 2.0",
  "addToBom": "ADD TO BOM",
  "pdfSpec": "PDF SPEC",
  "specification": "Specification",
  "sizing": "Sizing",
  "stdFamily": "Standard Family",
  "nomSize": "Nominal Size",
  "length": "Length",
  "lengthAdj": "Length adjustment",
  "bolt": "Bolt",
  "nut": "Nut",
  "tapDrill": "Tap Drill Size (D1)",
  "tensileArea": "Tensile Stress Area",
  "clearanceHole": "Clearance Hole (dh)",
  "detailedThreadMetrics": "Detailed Thread Profile Metrics",
  "validGeometry": "VALID GEOMETRY",
  "outOfBounds": "OUT OF BOUNDS",
  "majorDia": "Major Diameter (D)",
  "pitchDia": "Pitch Diameter (D2)",
  "minorDia": "Minor Diameter (D1)",
  "nomPitch": "Nominal Thread Pitch",
  "pitch": "Pitch",
  "engagementDynamics": "ENGAGEMENT DYNAMICS",
  "clearanceSeries": "ISO 273 Clearance Series",
  "headWidth": "Head Across Flats (s)",
  "headHeight": "Head Height (k)",
  "openTorque": "Calculate tightening torque"
} as FastenersModuleUiStrings;

const TR: FastenersModuleUiStrings = {
  "title": "Dişli Bağlantılar",
  "subtitle": "Bölüm J: Diş Geometrisi ve Toleranslar • AluCalcOS 2.0",
  "addToBom": "PROJEYE EKLE",
  "pdfSpec": "PDF SPEC",
  "specification": "Özellikler",
  "sizing": "Boyutlandırma",
  "stdFamily": "Standart Grubu",
  "nomSize": "Nominal Boyut",
  "length": "Boy",
  "lengthAdj": "Boy ayarı",
  "bolt": "Cıvata",
  "nut": "Somun",
  "tapDrill": "Matkap Çapı (D1)",
  "tensileArea": "Gerilme Alanı (As)",
  "clearanceHole": "Geçiş Deliği (dh)",
  "detailedThreadMetrics": "Detaylı Diş Profili Metrikleri",
  "validGeometry": "UYGUN GEOMETRİ",
  "outOfBounds": "LİMİT DIŞI",
  "majorDia": "Anma Çapı (D)",
  "pitchDia": "Bölüm Dairesi Çapı (D2)",
  "minorDia": "Diş Dibi Çapı (D1)",
  "nomPitch": "Nominal Diş Adımı",
  "pitch": "Diş Adımı",
  "engagementDynamics": "VİDA DİŞ GEÇME ANALİZİ",
  "clearanceSeries": "ISO 273 Gecis Deligi Serisi",
  "headWidth": "Bas Genisligi (s)",
  "headHeight": "Bas Yuksekligi (k)",
  "openTorque": "Sikma torku hesapla"
} as FastenersModuleUiStrings;

const DE: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const ES: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const FR: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const IT: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const PT: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const RU: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const JA: FastenersModuleUiStrings = {
  "title": "ねじ締結要素",
  "subtitle": "セクションJ: ねじの幾学とクリアランス • AluCalcOS 2.0",
  "addToBom": "部品表に追加",
  "pdfSpec": "PDFスペック",
  "specification": "ねじ規格",
  "sizing": "寸法設定",
  "stdFamily": "規格ファミリー",
  "nomSize": "呼び径",
  "length": "長さ",
  "lengthAdj": "長さスライド調整",
  "bolt": "ボルト",
  "nut": "ナット",
  "tapDrill": "下穴径 (D1)",
  "tensileArea": "有効断面積 (As)",
  "clearanceHole": "ボルト通し穴 (dh)",
  "detailedThreadMetrics": "ねじ断面プロファイル詳細",
  "validGeometry": "有効な幾何形状",
  "outOfBounds": "限界値超過",
  "majorDia": "ねじの外径 (D)",
  "pitchDia": "ピッチ径 (D2)",
  "minorDia": "谷の径 (D1)",
  "nomPitch": "基準山ピッチ",
  "pitch": "ピッチ",
  "engagementDynamics": "かみ合い特性ビジュアル",
  "clearanceSeries": "ISO 273 ボルト通し穴系列",
  "headWidth": "頭部二面幅 (s)",
  "headHeight": "頭部高さ (k)",
  "openTorque": "締付トルクを計算"
} as FastenersModuleUiStrings;

const ZH: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const KO: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const AR: FastenersModuleUiStrings = {
  "title": "Gewindebolzen",
  "subtitle": "Sektion J: Gewindegeometrie & Spielräume • AluCalcOS 2.0",
  "addToBom": "ZUR STÜCKLISTE",
  "pdfSpec": "PDF-SPEZIFIKATION",
  "specification": "Spezifikation",
  "sizing": "Dimensionierung",
  "stdFamily": "Standardfamilie",
  "nomSize": "Nennmaß",
  "length": "Länge",
  "lengthAdj": "Längenanpassung",
  "bolt": "Schraube",
  "nut": "Mutter",
  "tapDrill": "Kernlochdurchmesser (D1)",
  "tensileArea": "Spannungsquerschnitt",
  "clearanceHole": "Durchgangsloch (dh)",
  "detailedThreadMetrics": "Detaillierte Gewindeprofil-Metriken",
  "validGeometry": "GÜLTIGE GEOMETRIE",
  "outOfBounds": "AUSSERHALB DER GRENZEN",
  "majorDia": "Außendurchmesser (D)",
  "pitchDia": "Flankendurchmesser (D2)",
  "minorDia": "Kerndurchmesser (D1)",
  "nomPitch": "Nennsteigung",
  "pitch": "Steigung",
  "engagementDynamics": "GEWINDE-EINGRIFF",
  "clearanceSeries": "ISO 273 Durchgangsloch-Serie",
  "headWidth": "Schlüsselweite (s)",
  "headHeight": "Kopfhöhe (k)",
  "openTorque": "Anzugsmoment berechnen"
} as FastenersModuleUiStrings;

const BY_LOCALE: Record<Language, FastenersModuleUiStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getFastenersModuleUiStrings(locale: string): FastenersModuleUiStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
