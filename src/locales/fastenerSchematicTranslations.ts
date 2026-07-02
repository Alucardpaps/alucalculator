import type { Language } from '@/store/i18nStore';

export type FastenerSchematicStrings = {
  pipeNotSupported: string;
  selectMetricUnc: string;
  hoverHint: string;
  headDesc: string;
  hexSize: string;
  headHeight: string;
  bearingDia: string;
  shankDesc: string;
  nominalDia: string;
  shankLength: string;
  threadDesc: string;
  minorDia: string;
  pitchDia: string;
  pitch: string;
  stressArea: string;
  platesTitle: string;
  platesDesc: string;
  gripLength: string;
  clearanceHole: string;
  nutDesc: string;
  nutHeight: string;
  threadClass: string;
  washerDesc: string;
  washerDia: string;
};

const EN: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "HOVER PARTS TO DEEP-DIVE DIMENSIONS",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const TR: FastenerSchematicStrings = {
  "pipeNotSupported": "Boru dişi görseli desteklenmemektedir.",
  "selectMetricUnc": "Lütfen metrik veya UNC cıvata boyutlarını seçin.",
  "hoverHint": "ÖLÇÜLER İÇİN CIVATA ÜZERİNE GELİN",
  "headDesc": "Kafa anahtar ağzı ve kalınlığı",
  "hexSize": "Anahtar Ağzı (s)",
  "headHeight": "Kafa Yüksekliği (k)",
  "bearingDia": "Kafa Fatura Çapı (dw)",
  "shankDesc": "Cıvatanın pürüzsüz dişsiz gövdesi",
  "nominalDia": "Nominal Çap (d)",
  "shankLength": "Gövde Boyu",
  "threadDesc": "Gerilmeye maruz kalan dişli bölge",
  "minorDia": "Diş Dibi Çapı (d3)",
  "pitchDia": "Bölüm Çapı (d2)",
  "pitch": "Adım (P)",
  "stressArea": "Gerilme Alanı (As)",
  "platesTitle": "Sıkıştırılan Plakalar",
  "platesDesc": "Birleştirilen parça kalınlıkları",
  "gripLength": "Sıkma Boyu (LG)",
  "clearanceHole": "Geçiş Deliği (dh)",
  "nutDesc": "İç dişli somun elemanı",
  "nutHeight": "Somun Yüksekliği (m)",
  "threadClass": "Diş Standardı",
  "washerDesc": "Basınç dağıtıcı rondelalar",
  "washerDia": "Rondela Çapı (dw)"
} as FastenerSchematicStrings;

const DE: FastenerSchematicStrings = {
  "pipeNotSupported": "Rohrgewinde-Darstellung nicht unterstützt.",
  "selectMetricUnc": "Bitte metrische oder UNC-Schraubengrößen wählen.",
  "hoverHint": "TEILE ANFAHREN FÜR ABMESSUNGEN",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const ES: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "PASE EL CURSOR PARA VER DIMENSIONES",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const FR: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "SURVOLEZ POUR LES COTES",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const IT: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "PASSA IL MOUSE PER LE QUOTE",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const PT: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "PASSE O MOUSE PARA DIMENSÕES",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const RU: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "НАВЕДИТЕ ДЛЯ РАЗМЕРОВ",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const JA: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "部品にホバーして寸法を表示",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const ZH: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "悬停查看尺寸",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const KO: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "치수를 보려면 위에 올리세요",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const AR: FastenerSchematicStrings = {
  "pipeNotSupported": "Pipe thread model illustration not supported.",
  "selectMetricUnc": "Please select metric or UNC bolt sizes for interactive diagram.",
  "hoverHint": "مرر للأبعاد",
  "headDesc": "Head width and thickness",
  "hexSize": "Hex Size (s)",
  "headHeight": "Head Height (k)",
  "bearingDia": "Bearing Dia (dw)",
  "shankDesc": "Smooth unthreaded body section",
  "nominalDia": "Nominal Dia (d)",
  "shankLength": "Shank Length",
  "threadDesc": "Threaded zone subject to tensile load",
  "minorDia": "Minor Dia (d3)",
  "pitchDia": "Pitch Dia (d2)",
  "pitch": "Pitch (P)",
  "stressArea": "Stress Area (As)",
  "platesTitle": "Clamped Joint Plates",
  "platesDesc": "Total thickness of clamped materials",
  "gripLength": "Grip Length (LG)",
  "clearanceHole": "Clearance Hole (dh)",
  "nutDesc": "Threaded female locking element",
  "nutHeight": "Nut Height (m)",
  "threadClass": "Thread Class",
  "washerDesc": "Load distributing washers",
  "washerDia": "Washer Dia (dw)"
} as FastenerSchematicStrings;

const BY_LOCALE: Record<Language, FastenerSchematicStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getFastenerSchematicStrings(locale: string): FastenerSchematicStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
