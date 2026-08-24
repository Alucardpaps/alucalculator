import type { Language } from '@/store/i18nStore';

export type PumpsModuleStrings = {
  subtitle: string;
  metric: string;
  imperial: string;
  geometricCharacteristic: string;
  type: string;
  centrifugal: string;
  mixedFlow: string;
  axialFlow: string;
  flowRate: string;
  totalHead: string;
  rotationalSpeed: string;
  intEfficiency: string;
  performanceSummary: string;
  hydraulicOutput: string;
  shaftInput: string;
  shaftTorque: string;
};

const EN: PumpsModuleStrings = {
  "subtitle": "Industrial Hydraulic Solver",
  "metric": "Metric",
  "imperial": "Imperial",
  "geometricCharacteristic": "GEOMETRIC CHARACTERISTIC",
  "type": "Type",
  "centrifugal": "Centrifugal",
  "mixedFlow": "Mixed Flow",
  "axialFlow": "Axial Flow",
  "flowRate": "Flow rate (Q)",
  "totalHead": "Total Head (H)",
  "rotationalSpeed": "Rotational Speed",
  "intEfficiency": "Int. Efficiency",
  "performanceSummary": "Performance Summary",
  "hydraulicOutput": "Hydraulic Output",
  "shaftInput": "Shaft Input (BHP)",
  "shaftTorque": "Shaft Torque"
} as PumpsModuleStrings;

const TR: PumpsModuleStrings = {
  "subtitle": "Endüstriyel Hidrolik Çözücü",
  "metric": "Metrik",
  "imperial": "İnç/Libre",
  "geometricCharacteristic": "GEOMETRİK KARAKTERİSTİK",
  "type": "Tip",
  "centrifugal": "Santrifüj",
  "mixedFlow": "Karışık Akışlı",
  "axialFlow": "Eksenel Akışlı",
  "flowRate": "Debi (Q)",
  "totalHead": "Toplam Basma Yüksekliği (H)",
  "rotationalSpeed": "Dönüş Hızı",
  "intEfficiency": "İç Verim",
  "performanceSummary": "Performans Özeti",
  "hydraulicOutput": "Hidrolik Çıkış",
  "shaftInput": "Mil Gücü (BHP)",
  "shaftTorque": "Mil Torku"
} as PumpsModuleStrings;

const DE: PumpsModuleStrings = {
  "subtitle": "Industrieller Hydraulik-Rechner",
  "metric": "Metrisch",
  "imperial": "Imperial",
  "geometricCharacteristic": "GEOMETRISCHE KENNLINIE",
  "type": "Typ",
  "centrifugal": "Kreiselpumpe",
  "mixedFlow": "Diagonalpumpe",
  "axialFlow": "Axialpumpe",
  "flowRate": "Volumenstrom (Q)",
  "totalHead": "Gesamtförderhöhe (H)",
  "rotationalSpeed": "Drehzahl",
  "intEfficiency": "Wirkungsgrad",
  "performanceSummary": "Leistungsübersicht",
  "hydraulicOutput": "Hydraulische Leistung",
  "shaftInput": "Wellenleistung (BHP)",
  "shaftTorque": "Wellendrehmoment"
} as PumpsModuleStrings;

const ES: PumpsModuleStrings = {
  "subtitle": "Solucionador Hidráulico Industrial",
  "metric": "Métrico",
  "imperial": "Imperial",
  "geometricCharacteristic": "CARACTERÍSTICA GEOMÉTRICA",
  "type": "Tipo",
  "centrifugal": "Centrífuga",
  "mixedFlow": "Flujo Mixto",
  "axialFlow": "Flujo Axial",
  "flowRate": "Caudal (Q)",
  "totalHead": "Altura Total (H)",
  "rotationalSpeed": "Velocidad de Rotación",
  "intEfficiency": "Eficiencia Int.",
  "performanceSummary": "Resumen de Rendimiento",
  "hydraulicOutput": "Potencia Hidráulica",
  "shaftInput": "Potencia de Eje (BHP)",
  "shaftTorque": "Par del Eje"
} as PumpsModuleStrings;

const FR: PumpsModuleStrings = {
  "subtitle": "Solveur Hydraulique Industriel",
  "metric": "Métrique",
  "imperial": "Impérial",
  "geometricCharacteristic": "CARACTÉRISTIQUE GÉOMÉTRIQUE",
  "type": "Type",
  "centrifugal": "Centrifuge",
  "mixedFlow": "Flux Mixte",
  "axialFlow": "Flux Axial",
  "flowRate": "Débit (Q)",
  "totalHead": "Hauteur Manométrique (H)",
  "rotationalSpeed": "Vitesse de Rotation",
  "intEfficiency": "Rendement Int.",
  "performanceSummary": "Résumé des Performances",
  "hydraulicOutput": "Puissance Hydraulique",
  "shaftInput": "Puissance Arbre (BHP)",
  "shaftTorque": "Couple Arbre"
} as PumpsModuleStrings;

const IT: PumpsModuleStrings = {
  "subtitle": "Solutore Idraulico Industriale",
  "metric": "Metrico",
  "imperial": "Imperiale",
  "geometricCharacteristic": "CARATTERISTICA GEOMETRICA",
  "type": "Tipo",
  "centrifugal": "Centrifuga",
  "mixedFlow": "Flusso Misto",
  "axialFlow": "Flusso Assiale",
  "flowRate": "Portata (Q)",
  "totalHead": "Prevalenza Totale (H)",
  "rotationalSpeed": "Velocità di Rotazione",
  "intEfficiency": "Efficienza Int.",
  "performanceSummary": "Riepilogo Prestazioni",
  "hydraulicOutput": "Potenza Idraulica",
  "shaftInput": "Potenza Albero (BHP)",
  "shaftTorque": "Coppia Albero"
} as PumpsModuleStrings;

const PT: PumpsModuleStrings = {
  "subtitle": "Solucionador Hidráulico Industrial",
  "metric": "Métrico",
  "imperial": "Imperial",
  "geometricCharacteristic": "CARACTERÍSTICA GEOMÉTRICA",
  "type": "Tipo",
  "centrifugal": "Centrífuga",
  "mixedFlow": "Fluxo Misto",
  "axialFlow": "Fluxo Axial",
  "flowRate": "Vazão (Q)",
  "totalHead": "Altura Manométrica (H)",
  "rotationalSpeed": "Velocidade de Rotação",
  "intEfficiency": "Eficiência Int.",
  "performanceSummary": "Resumo de Desempenho",
  "hydraulicOutput": "Potência Hidráulica",
  "shaftInput": "Potência do Eixo (BHP)",
  "shaftTorque": "Torque do Eixo"
} as PumpsModuleStrings;

const RU: PumpsModuleStrings = {
  "subtitle": "Промышленный гидравлический расчёт",
  "metric": "Метрическая",
  "imperial": "Имперская",
  "geometricCharacteristic": "ГЕОМЕТРИЧЕСКАЯ ХАРАКТЕРИСТИКА",
  "type": "Тип",
  "centrifugal": "Центробежный",
  "mixedFlow": "Диагональный",
  "axialFlow": "Осевой",
  "flowRate": "Расход (Q)",
  "totalHead": "Напор (H)",
  "rotationalSpeed": "Частота вращения",
  "intEfficiency": "КПД",
  "performanceSummary": "Сводка характеристик",
  "hydraulicOutput": "Гидравлическая мощность",
  "shaftInput": "Мощность вала (BHP)",
  "shaftTorque": "Крутящий момент вала"
} as PumpsModuleStrings;

const JA: PumpsModuleStrings = {
  "subtitle": "産業用油圧ソルバー",
  "metric": "メートル法",
  "imperial": "ヤード・ポンド法",
  "geometricCharacteristic": "幾何特性",
  "type": "形式",
  "centrifugal": "遠心ポンプ",
  "mixedFlow": "斜流ポンプ",
  "axialFlow": "軸流ポンプ",
  "flowRate": "流量 (Q)",
  "totalHead": "全揚程 (H)",
  "rotationalSpeed": "回転数",
  "intEfficiency": "内部効率",
  "performanceSummary": "性能評価サマリー",
  "hydraulicOutput": "水力出力",
  "shaftInput": "軸入力 (BHP)",
  "shaftTorque": "軸トルク"
} as PumpsModuleStrings;

const ZH: PumpsModuleStrings = {
  "subtitle": "工业液压求解器",
  "metric": "公制",
  "imperial": "英制",
  "geometricCharacteristic": "几何特性",
  "type": "类型",
  "centrifugal": "离心泵",
  "mixedFlow": "混流泵",
  "axialFlow": "轴流泵",
  "flowRate": "流量 (Q)",
  "totalHead": "总扬程 (H)",
  "rotationalSpeed": "转速",
  "intEfficiency": "内部效率",
  "performanceSummary": "性能摘要",
  "hydraulicOutput": "水力输出",
  "shaftInput": "轴输入 (BHP)",
  "shaftTorque": "轴扭矩"
} as PumpsModuleStrings;

const KO: PumpsModuleStrings = {
  "subtitle": "산업용 유압 솔버",
  "metric": "미터법",
  "imperial": "야드파운드법",
  "geometricCharacteristic": "기하 특성",
  "type": "유형",
  "centrifugal": "원심 펌프",
  "mixedFlow": "혼합류 펌프",
  "axialFlow": "축류 펌프",
  "flowRate": "유량 (Q)",
  "totalHead": "전양정 (H)",
  "rotationalSpeed": "회전 속도",
  "intEfficiency": "내부 효율",
  "performanceSummary": "성능 요약",
  "hydraulicOutput": "수력 출력",
  "shaftInput": "축 입력 (BHP)",
  "shaftTorque": "축 토크"
} as PumpsModuleStrings;

const AR: PumpsModuleStrings = {
  "subtitle": "حاسبة هيدروليكية صناعية",
  "metric": "متري",
  "imperial": "إمبراطوري",
  "geometricCharacteristic": "الخاصية الهندسية",
  "type": "النوع",
  "centrifugal": "طرد مركزي",
  "mixedFlow": "تدفق مختلط",
  "axialFlow": "تدفق محوري",
  "flowRate": "معدل التدفق (Q)",
  "totalHead": "الارتفاع الكلي (H)",
  "rotationalSpeed": "سرعة الدوران",
  "intEfficiency": "الكفاءة الداخلية",
  "performanceSummary": "ملخص الأداء",
  "hydraulicOutput": "القدرة الهيدروليكية",
  "shaftInput": "قدرة العمود (BHP)",
  "shaftTorque": "عزم العمود"
} as PumpsModuleStrings;

const BY_LOCALE: Record<Language, PumpsModuleStrings> = {
  en: EN,
  tr: TR,
  de: DE,
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  ru: RU,
  ja: JA,
  zh: ZH,
  ko: KO,
  ar: AR,
};

export function getPumpsModuleStrings(locale: string): PumpsModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
