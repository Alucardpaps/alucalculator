import type { Language } from '@/store/i18nStore';

export type PlanetaryCalculatorStrings = {
  title: string;
  subtitle: string;
  systemRatio: string;
  outputRpm: string;
  totalTorque: string;
  systemAdvantage: string;
  lastStageRpm: string;
  module: string;
  sunTeeth: string;
  ringTeeth: string;
  planetCount: string;
  inputRpm: string;
  inputPower: string;
  stageParams: string;
  fixedComponent: string;
  ring: string;
  sun: string;
  carrier: string;
  characteristic: string;
  infoText: string;
  totalRatio: string;
  outputSpeed: string;
  stage: string;
};

const EN: PlanetaryCalculatorStrings = {
  "title": "Planetary Multi-Stage",
  "subtitle": "Engineering Intelligence • Stages Attached: {stagesLength}",
  "systemRatio": "System Ratio",
  "outputRpm": "Output RPM",
  "totalTorque": "Total Torque",
  "systemAdvantage": "System Advantage",
  "lastStageRpm": "Last Stage RPM",
  "module": "Module (m)",
  "sunTeeth": "Sun Teeth (zs)",
  "ringTeeth": "Ring Teeth (zr)",
  "planetCount": "Planet Count",
  "inputRpm": "System Input RPM",
  "inputPower": "System Input Power",
  "stageParams": "Stage {stage} Params",
  "fixedComponent": "Fixed Component",
  "ring": "RING",
  "sun": "SUN",
  "carrier": "CARRIER",
  "characteristic": "Total System Characteristic",
  "infoText": "Multi-stage calculations assume direct coupling (no intermediate slip). Module (m) determines absolute geometric diameter D=m*Z.",
  "totalRatio": "Total Ratio",
  "outputSpeed": "OUTPUT SPEED",
  "stage": "Stage"
} as PlanetaryCalculatorStrings;

const TR: PlanetaryCalculatorStrings = {
  "title": "Planer Çok Kademeli",
  "subtitle": "Mühendislik Zekası • Ekli Kademe Sayısı: {stagesLength}",
  "systemRatio": "Sistem Oranı",
  "outputRpm": "Çıkış Devri",
  "totalTorque": "Toplam Tork",
  "systemAdvantage": "Sistem Avantajı",
  "lastStageRpm": "Son Kademe Devri",
  "module": "Modül (m)",
  "sunTeeth": "Güneş Diş Sayısı (zs)",
  "ringTeeth": "Çember Diş Sayısı (zr)",
  "planetCount": "Planet Sayısı",
  "inputRpm": "Sistem Giriş Devri",
  "inputPower": "Sistem Giriş Gücü",
  "stageParams": "Kademe {stage} Parametreleri",
  "fixedComponent": "Sabit Eleman",
  "ring": "ÇEMBER",
  "sun": "GÜNEŞ",
  "carrier": "TAŞIYICI",
  "characteristic": "Toplam Sistem Karakteristiği",
  "infoText": "Çok kademeli hesaplamalar doğrudan kaplini (kayma olmadan) varsayar. Modül (m) mutlak geometrik çapı belirler D=m*Z.",
  "totalRatio": "Toplam Oran",
  "outputSpeed": "ÇIKIŞ HIZI",
  "stage": "Kademe"
} as PlanetaryCalculatorStrings;

const DE: PlanetaryCalculatorStrings = {
  "title": "Planetengetriebe Mehrstufig",
  "subtitle": "Engineering-Intelligenz • Angeschlossene Stufen: {stagesLength}",
  "systemRatio": "Systemübersetzung",
  "outputRpm": "Ausgangsdrehzahl",
  "totalTorque": "Gesamtdrehmoment",
  "systemAdvantage": "Systemvorteil",
  "lastStageRpm": "Drehzahl Letzte Stufe",
  "module": "Modul (m)",
  "sunTeeth": "Sonnenzähne (zs)",
  "ringTeeth": "Hohlradzähne (zr)",
  "planetCount": "Planetenanzahl",
  "inputRpm": "System-Eingangsdrehzahl",
  "inputPower": "System-Eingangsleistung",
  "stageParams": "Parameter Stufe {stage}",
  "fixedComponent": "Festes Bauteil",
  "ring": "HOHLRAD",
  "sun": "SONNE",
  "carrier": "TRÄGER",
  "characteristic": "Gesamtsystem-Charakteristik",
  "infoText": "Mehrstufige Berechnungen setzen eine direkte Kopplung (kein Schlupf) voraus. Modul (m) bestimmt den absoluten geometrischen Durchmesser D=m*Z.",
  "totalRatio": "Gesamtübersetzung",
  "outputSpeed": "AUSGANGSDREHZAHL",
  "stage": "Stufe"
} as PlanetaryCalculatorStrings;

const ES: PlanetaryCalculatorStrings = {
  "title": "Planetario Multietapa",
  "subtitle": "Inteligencia de Ingeniería • Etapas: {stagesLength}",
  "systemRatio": "Relación del Sistema",
  "outputRpm": "RPM de Salida",
  "totalTorque": "Par Total",
  "systemAdvantage": "Ventaja del Sistema",
  "lastStageRpm": "RPM Última Etapa",
  "module": "Módulo (m)",
  "sunTeeth": "Dientes Sol (zs)",
  "ringTeeth": "Dientes Anillo (zr)",
  "planetCount": "Nº Planetas",
  "inputRpm": "RPM de Entrada",
  "inputPower": "Potencia de Entrada",
  "stageParams": "Parámetros Etapa {stage}",
  "fixedComponent": "Componente Fijo",
  "ring": "ANILLO",
  "sun": "SOL",
  "carrier": "PORTADOR",
  "characteristic": "Característica del Sistema",
  "infoText": "Los cálculos multietapa asumen acoplamiento directo. El módulo (m) determina D=m*Z.",
  "totalRatio": "Relación Total",
  "outputSpeed": "VELOCIDAD DE SALIDA",
  "stage": "Etapa"
} as PlanetaryCalculatorStrings;

const FR: PlanetaryCalculatorStrings = {
  "title": "Planétaire Multistage",
  "subtitle": "Intelligence Ingénierie • Étapes: {stagesLength}",
  "systemRatio": "Rapport Système",
  "outputRpm": "RPM Sortie",
  "totalTorque": "Couple Total",
  "systemAdvantage": "Avantage Système",
  "lastStageRpm": "RPM Dernière Étape",
  "module": "Module (m)",
  "sunTeeth": "Dents Soleil (zs)",
  "ringTeeth": "Dents Couronne (zr)",
  "planetCount": "Nb Planètes",
  "inputRpm": "RPM Entrée",
  "inputPower": "Puissance Entrée",
  "stageParams": "Paramètres Étape {stage}",
  "fixedComponent": "Composant Fixe",
  "ring": "COURONNE",
  "sun": "SOLEIL",
  "carrier": "PORTE-PLANÈTES",
  "characteristic": "Caractéristique Système",
  "infoText": "Calculs multistages avec couplage direct. Module (m) détermine D=m*Z.",
  "totalRatio": "Rapport Total",
  "outputSpeed": "VITESSE SORTIE",
  "stage": "Étape"
} as PlanetaryCalculatorStrings;

const IT: PlanetaryCalculatorStrings = {
  "title": "Planetario Multistadio",
  "subtitle": "Intelligenza Ingegneristica • Stadi: {stagesLength}",
  "systemRatio": "Rapporto Sistema",
  "outputRpm": "RPM Uscita",
  "totalTorque": "Coppia Totale",
  "systemAdvantage": "Vantaggio Sistema",
  "lastStageRpm": "RPM Ultimo Stadio",
  "module": "Modulo (m)",
  "sunTeeth": "Denti Sole (zs)",
  "ringTeeth": "Denti Corona (zr)",
  "planetCount": "N. Pianeti",
  "inputRpm": "RPM Ingresso",
  "inputPower": "Potenza Ingresso",
  "stageParams": "Parametri Stadio {stage}",
  "fixedComponent": "Componente Fisso",
  "ring": "CORONA",
  "sun": "SOLE",
  "carrier": "PORTA-PIANETI",
  "characteristic": "Caratteristica Sistema",
  "infoText": "Calcoli multistadio con accoppiamento diretto. Modulo (m) determina D=m*Z.",
  "totalRatio": "Rapporto Totale",
  "outputSpeed": "VELOCITÀ USCITA",
  "stage": "Stadio"
} as PlanetaryCalculatorStrings;

const PT: PlanetaryCalculatorStrings = {
  "title": "Planetário Multiestágio",
  "subtitle": "Inteligência de Engenharia • Estágios: {stagesLength}",
  "systemRatio": "Relação do Sistema",
  "outputRpm": "RPM Saída",
  "totalTorque": "Torque Total",
  "systemAdvantage": "Vantagem do Sistema",
  "lastStageRpm": "RPM Último Estágio",
  "module": "Módulo (m)",
  "sunTeeth": "Dentes Sol (zs)",
  "ringTeeth": "Dentes Anel (zr)",
  "planetCount": "Nº Planetas",
  "inputRpm": "RPM Entrada",
  "inputPower": "Potência Entrada",
  "stageParams": "Parâmetros Estágio {stage}",
  "fixedComponent": "Componente Fixo",
  "ring": "ANEL",
  "sun": "SOL",
  "carrier": "PORTADOR",
  "characteristic": "Característica do Sistema",
  "infoText": "Cálculos multiestágio assumem acoplamento direto. Módulo (m) determina D=m*Z.",
  "totalRatio": "Relação Total",
  "outputSpeed": "VELOCIDADE SAÍDA",
  "stage": "Estágio"
} as PlanetaryCalculatorStrings;

const RU: PlanetaryCalculatorStrings = {
  "title": "Планетарный Многоступенчатый",
  "subtitle": "Инженерный интеллект • Ступени: {stagesLength}",
  "systemRatio": "Передаточное Отношение",
  "outputRpm": "Выходные об/мин",
  "totalTorque": "Суммарный Момент",
  "systemAdvantage": "Преимущество Системы",
  "lastStageRpm": "об/мин Последней Ступени",
  "module": "Модуль (m)",
  "sunTeeth": "Зубья Солнца (zs)",
  "ringTeeth": "Зубья Кольца (zr)",
  "planetCount": "Число Планет",
  "inputRpm": "Входные об/мин",
  "inputPower": "Входная Мощность",
  "stageParams": "Параметры Ступени {stage}",
  "fixedComponent": "Фиксированный Элемент",
  "ring": "КОЛЬЦО",
  "sun": "СОЛНЦЕ",
  "carrier": "ВОДИЛО",
  "characteristic": "Характеристика Системы",
  "infoText": "Многоступенчатые расчёты с прямой связью. Модуль (m) определяет D=m*Z.",
  "totalRatio": "Общее Передаточное Число",
  "outputSpeed": "ВЫХОДНАЯ СКОРОСТЬ",
  "stage": "Ступень"
} as PlanetaryCalculatorStrings;

const JA: PlanetaryCalculatorStrings = {
  "title": "遊星マルチステージ",
  "subtitle": "エンジニアリングインテリジェンス • 接続されたステージ: {stagesLength}",
  "systemRatio": "システム比",
  "outputRpm": "出力回転数",
  "totalTorque": "総トルク",
  "systemAdvantage": "システムアドバンテージ",
  "lastStageRpm": "最終ステージ回転数",
  "module": "モジュール (m)",
  "sunTeeth": "太陽歯車歯数 (zs)",
  "ringTeeth": "内歯車歯数 (zr)",
  "planetCount": "遊星ギヤ数",
  "inputRpm": "システム入力回転数",
  "inputPower": "システム入力電力",
  "stageParams": "ステージ {stage} パラメータ",
  "fixedComponent": "固定要素",
  "ring": "リング",
  "sun": "サン",
  "carrier": "キャリア",
  "characteristic": "トータルシステム特性",
  "infoText": "多段計算は直接結合（中間スリップなし）を前提としています。モジュール（m）は絶対幾何直径D=m*Zを決定します。",
  "totalRatio": "総比",
  "outputSpeed": "出力速度",
  "stage": "ステージ"
} as PlanetaryCalculatorStrings;

const ZH: PlanetaryCalculatorStrings = {
  "title": "行星多级传动",
  "subtitle": "工程智能 • 级数: {stagesLength}",
  "systemRatio": "系统传动比",
  "outputRpm": "输出转速",
  "totalTorque": "总扭矩",
  "systemAdvantage": "系统优势",
  "lastStageRpm": "末级转速",
  "module": "模数 (m)",
  "sunTeeth": "太阳轮齿数 (zs)",
  "ringTeeth": "齿圈齿数 (zr)",
  "planetCount": "行星轮数量",
  "inputRpm": "输入转速",
  "inputPower": "输入功率",
  "stageParams": "第 {stage} 级参数",
  "fixedComponent": "固定件",
  "ring": "齿圈",
  "sun": "太阳轮",
  "carrier": "行星架",
  "characteristic": "系统总特性",
  "infoText": "多级计算假设直接耦合。模数 (m) 决定 D=m*Z。",
  "totalRatio": "总传动比",
  "outputSpeed": "输出速度",
  "stage": "级"
} as PlanetaryCalculatorStrings;

const KO: PlanetaryCalculatorStrings = {
  "title": "행성 다단 기어",
  "subtitle": "엔지니어링 인텔리전스 • 단수: {stagesLength}",
  "systemRatio": "시스템 기어비",
  "outputRpm": "출력 RPM",
  "totalTorque": "총 토크",
  "systemAdvantage": "시스템 이점",
  "lastStageRpm": "최종 단 RPM",
  "module": "모듈 (m)",
  "sunTeeth": "태양 기어 잇수 (zs)",
  "ringTeeth": "링 기어 잇수 (zr)",
  "planetCount": "행성 기어 수",
  "inputRpm": "입력 RPM",
  "inputPower": "입력 전력",
  "stageParams": "단계 {stage} 매개변수",
  "fixedComponent": "고정 부품",
  "ring": "링",
  "sun": "태양",
  "carrier": "캐리어",
  "characteristic": "시스템 특성",
  "infoText": "다단 계산은 직접 결합을 가정합니다. 모듈 (m)이 D=m*Z를 결정합니다.",
  "totalRatio": "총 기어비",
  "outputSpeed": "출력 속도",
  "stage": "단계"
} as PlanetaryCalculatorStrings;

const AR: PlanetaryCalculatorStrings = {
  "title": "تروس كوكبية متعددة المراحل",
  "subtitle": "ذكاء هندسي • المراحل: {stagesLength}",
  "systemRatio": "نسبة النظام",
  "outputRpm": "دورة الخرج",
  "totalTorque": "عزم الدوران الكلي",
  "systemAdvantage": "ميزة النظام",
  "lastStageRpm": "دورة المرحلة الأخيرة",
  "module": "الوحدة (m)",
  "sunTeeth": "أسنان الشمس (zs)",
  "ringTeeth": "أسنان الحلقة (zr)",
  "planetCount": "عدد الكواكب",
  "inputRpm": "دورة الدخل",
  "inputPower": "قدرة الدخل",
  "stageParams": "معاملات المرحلة {stage}",
  "fixedComponent": "المكون الثابت",
  "ring": "الحلقة",
  "sun": "الشمس",
  "carrier": "الحامل",
  "characteristic": "خصائص النظام",
  "infoText": "حسابات متعددة المراحل تفترض اقترانًا مباشرًا. الوحدة (m) تحدد D=m*Z.",
  "totalRatio": "النسبة الكلية",
  "outputSpeed": "سرعة الخرج",
  "stage": "مرحلة"
} as PlanetaryCalculatorStrings;

const BY_LOCALE: Record<Language, PlanetaryCalculatorStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getPlanetaryCalculatorStrings(locale: string): PlanetaryCalculatorStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
