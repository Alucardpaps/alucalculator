import type { Language } from '@/store/i18nStore';

export type FastenerAssemblyModuleStrings = {
  highStressWarning: string;
  yieldExceeded: string;
  safeUtilization: string;
  chartsAnalytics: string;
  hdBlueprint: string;
};

const EN: FastenerAssemblyModuleStrings = {
  "highStressWarning": "High Preload Stress Warning",
  "yieldExceeded": "Yield capacity exceeded!",
  "safeUtilization": "Safe utilization limits",
  "chartsAnalytics": "Charts & Analytics",
  "hdBlueprint": "HD Technical Blueprint"
} as FastenerAssemblyModuleStrings;

const TR: FastenerAssemblyModuleStrings = {
  "highStressWarning": "Aşırı Gerilme Uyarısı",
  "yieldExceeded": "Akma sınırı aşıldı!",
  "safeUtilization": "Akma sınırı güvenli bölgede",
  "chartsAnalytics": "Grafikler ve Analiz",
  "hdBlueprint": "HD Teknik Resim (PDF)"
} as FastenerAssemblyModuleStrings;

const DE: FastenerAssemblyModuleStrings = {
  "highStressWarning": "Warnung: Hohe Vorspannspannung",
  "yieldExceeded": "Streckgrenze überschritten!",
  "safeUtilization": "Sichere Ausnutzungsgrenzen",
  "chartsAnalytics": "Diagramme & Analyse",
  "hdBlueprint": "HD Technische Zeichnung"
} as FastenerAssemblyModuleStrings;

const ES: FastenerAssemblyModuleStrings = {
  "highStressWarning": "Advertencia de Precarga Alta",
  "yieldExceeded": "¡Capacidad de fluencia excedida!",
  "safeUtilization": "Límites de utilización seguros",
  "chartsAnalytics": "Gráficos y Análisis",
  "hdBlueprint": "Plano Técnico HD"
} as FastenerAssemblyModuleStrings;

const FR: FastenerAssemblyModuleStrings = {
  "highStressWarning": "Avertissement Précharge Élevée",
  "yieldExceeded": "Limite élastique dépassée !",
  "safeUtilization": "Limites d'utilisation sûres",
  "chartsAnalytics": "Graphiques & Analytique",
  "hdBlueprint": "Plan Technique HD"
} as FastenerAssemblyModuleStrings;

const IT: FastenerAssemblyModuleStrings = {
  "highStressWarning": "Avviso Precarico Elevato",
  "yieldExceeded": "Capacità di snervamento superata!",
  "safeUtilization": "Limiti di utilizzo sicuri",
  "chartsAnalytics": "Grafici e Analisi",
  "hdBlueprint": "Blueprint Tecnico HD"
} as FastenerAssemblyModuleStrings;

const PT: FastenerAssemblyModuleStrings = {
  "highStressWarning": "Aviso de Pré-carga Elevada",
  "yieldExceeded": "Capacidade de escoamento excedida!",
  "safeUtilization": "Limites de utilização seguros",
  "chartsAnalytics": "Gráficos e Análise",
  "hdBlueprint": "Desenho Técnico HD"
} as FastenerAssemblyModuleStrings;

const RU: FastenerAssemblyModuleStrings = {
  "highStressWarning": "Предупреждение о Преднагрузке",
  "yieldExceeded": "Предел текучести превышен!",
  "safeUtilization": "Безопасные пределы использования",
  "chartsAnalytics": "Графики и Аналитика",
  "hdBlueprint": "HD Технический Чертёж"
} as FastenerAssemblyModuleStrings;

const JA: FastenerAssemblyModuleStrings = {
  "highStressWarning": "高プリロード応力警告",
  "yieldExceeded": "降伏容量を超過！",
  "safeUtilization": "安全な利用率範囲内",
  "chartsAnalytics": "グラフと分析",
  "hdBlueprint": "HD技術図面 (PDF)"
} as FastenerAssemblyModuleStrings;

const ZH: FastenerAssemblyModuleStrings = {
  "highStressWarning": "高预紧应力警告",
  "yieldExceeded": "已超过屈服容量！",
  "safeUtilization": "安全利用率范围内",
  "chartsAnalytics": "图表与分析",
  "hdBlueprint": "高清技术蓝图 (PDF)"
} as FastenerAssemblyModuleStrings;

const KO: FastenerAssemblyModuleStrings = {
  "highStressWarning": "높은 예압 응력 경고",
  "yieldExceeded": "항복 용량 초과!",
  "safeUtilization": "안전한 이용률 한계",
  "chartsAnalytics": "차트 및 분석",
  "hdBlueprint": "HD 기술 도면 (PDF)"
} as FastenerAssemblyModuleStrings;

const AR: FastenerAssemblyModuleStrings = {
  "highStressWarning": "تحذير إجهاد التحميل المسبق",
  "yieldExceeded": "تم تجاوز سعة الخضوع!",
  "safeUtilization": "حدود استخدام آمنة",
  "chartsAnalytics": "الرسوم البيانية والتحليل",
  "hdBlueprint": "مخطط تقني عالي الدقة"
} as FastenerAssemblyModuleStrings;

const BY_LOCALE: Record<Language, FastenerAssemblyModuleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getFastenerAssemblyModuleStrings(locale: string): FastenerAssemblyModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
