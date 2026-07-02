import type { Language } from '@/store/i18nStore';

export type FatigueModuleStrings = {
  fatigueLife: string;
  enduranceAnalysis: string;
  materialLoad: string;
  ultimateTensile: string;
  yieldStrength: string;
  altStress: string;
  meanStress: string;
  marinFactors: string;
  surfaceKa: string;
  sizeKb: string;
  loadKc: string;
  infiniteLife: string;
  fatigueWarning: string;
  overallFos: string;
  enduranceLimit: string;
  goodmanDiagram: string;
  loadPoint: string;
  envelopeExceeded: string;
  envelopeExceededDesc: string;
};

const EN: FatigueModuleStrings = {
  "fatigueLife": "Fatigue Life",
  "enduranceAnalysis": "Endurance Limit Analysis",
  "materialLoad": "Material & Load Setup",
  "ultimateTensile": "Ultimate Tensile (S_ut)",
  "yieldStrength": "Yield Strength (S_y)",
  "altStress": "Alternating Stress (σ_a)",
  "meanStress": "Mean Stress (σ_m)",
  "marinFactors": "Marin Factors (k_a, k_b, k_c)",
  "surfaceKa": "Surface (k_a)",
  "sizeKb": "Size (k_b)",
  "loadKc": "Load (k_c)",
  "infiniteLife": "INFINITE LIFE CONFIRMED",
  "fatigueWarning": "WARNING: FATIGUE FAILURE PREDICTED",
  "overallFos": "Overall Factor of Safety (min)",
  "enduranceLimit": "Endurance Limit (Se)",
  "goodmanDiagram": "LIVE MODIFIED GOODMAN DIAGRAM",
  "loadPoint": "Load",
  "envelopeExceeded": "Fatigue Envelope Exceeded",
  "envelopeExceededDesc": "Operating stress combination lies outside the Goodman/Langer safe zone. Infinite life cannot be guaranteed."
} as FatigueModuleStrings;

const TR: FatigueModuleStrings = {
  "fatigueLife": "Yorulma Ömrü",
  "enduranceAnalysis": "Yorulma Limiti Analizi",
  "materialLoad": "Malzeme & Yük Ayarları",
  "ultimateTensile": "Çekme Mukavemeti (S_ut)",
  "yieldStrength": "Akma Mukavemeti (S_y)",
  "altStress": "Genlik Gerilmesi (σ_a)",
  "meanStress": "Ortalama Gerilme (σ_m)",
  "marinFactors": "Marin Düzeltme Katsayıları",
  "surfaceKa": "Yüzey Faktörü (k_a)",
  "sizeKb": "Boyut Faktörü (k_b)",
  "loadKc": "Yük Faktörü (k_c)",
  "infiniteLife": "SONSUZ ÖMÜR ONAYLANDI",
  "fatigueWarning": "UYARI: YORULMA HASARI BEKLENİYOR",
  "overallFos": "Genel Güvenlik Faktörü (En Düşük)",
  "enduranceLimit": "Yorulma Sınırı (Se)",
  "goodmanDiagram": "ANLIK MODİFİYE GOODMAN DİYAGRAMI",
  "loadPoint": "Yük",
  "envelopeExceeded": "Yorulma Sınırı Aşıldı",
  "envelopeExceededDesc": "Çalışma gerilme kombinasyonu Goodman/Langer güvenli bölgesinin dışındadır. Sonsuz ömür garanti edilemez."
} as FatigueModuleStrings;

const DE: FatigueModuleStrings = {
  "fatigueLife": "Ermüdungslebensdauer",
  "enduranceAnalysis": "Dauerfestigkeitsanalyse",
  "materialLoad": "Material & Lastaufbau",
  "ultimateTensile": "Zugfestigkeit (S_ut)",
  "yieldStrength": "Streckgrenze (S_y)",
  "altStress": "Wechselspannung (σ_a)",
  "meanStress": "Mittelspannung (σ_m)",
  "marinFactors": "Marin-Faktoren (k_a, k_b, k_c)",
  "surfaceKa": "Oberfläche (k_a)",
  "sizeKb": "Größe (k_b)",
  "loadKc": "Last (k_c)",
  "infiniteLife": "UNENDLICHE LEBENSDAUER BESTÄTIGT",
  "fatigueWarning": "WARNUNG: ERMÜDUNGSBRUCH ERWARTET",
  "overallFos": "Gesamtsicherheitsfaktor (min)",
  "enduranceLimit": "Dauerfestigkeit (Se)",
  "goodmanDiagram": "MODIFIZIERTES GOODMAN-DIAGRAMM (LIVE)",
  "loadPoint": "Last",
  "envelopeExceeded": "Ermüdungsgrenze überschritten",
  "envelopeExceededDesc": "Die Betriebsspannungskombination liegt außerhalb der Goodman/Langer-Sicherheitszone. Unendliche Lebensdauer kann nicht garantiert werden."
} as FatigueModuleStrings;

const ES: FatigueModuleStrings = {
  "fatigueLife": "Vida a Fatiga",
  "enduranceAnalysis": "Análisis de Límite de Resistencia",
  "materialLoad": "Material y Carga",
  "ultimateTensile": "Resistencia Última (S_ut)",
  "yieldStrength": "Límite Elástico (S_y)",
  "altStress": "Esfuerzo Alternante (σ_a)",
  "meanStress": "Esfuerzo Medio (σ_m)",
  "marinFactors": "Factores Marin",
  "surfaceKa": "Superficie (k_a)",
  "sizeKb": "Tamaño (k_b)",
  "loadKc": "Carga (k_c)",
  "infiniteLife": "VIDA INFINITA CONFIRMADA",
  "fatigueWarning": "ADVERTENCIA: FALLO POR FATIGA",
  "overallFos": "Factor de Seguridad Global (mín)",
  "enduranceLimit": "Límite de Resistencia (Se)",
  "goodmanDiagram": "DIAGRAMA DE GOODMAN EN VIVO",
  "loadPoint": "Carga",
  "envelopeExceeded": "Envolvente de Fatiga Excedida",
  "envelopeExceededDesc": "La combinación de esfuerzos está fuera de la zona segura Goodman/Langer."
} as FatigueModuleStrings;

const FR: FatigueModuleStrings = {
  "fatigueLife": "Durée de Fatigue",
  "enduranceAnalysis": "Analyse Limite d'Endurance",
  "materialLoad": "Matériau & Charge",
  "ultimateTensile": "Résistance Ultime (S_ut)",
  "yieldStrength": "Limite Élastique (S_y)",
  "altStress": "Contrainte Alternée (σ_a)",
  "meanStress": "Contrainte Moyenne (σ_m)",
  "marinFactors": "Facteurs Marin",
  "surfaceKa": "Surface (k_a)",
  "sizeKb": "Taille (k_b)",
  "loadKc": "Charge (k_c)",
  "infiniteLife": "DURÉE INFINIE CONFIRMÉE",
  "fatigueWarning": "AVERTISSEMENT: RUPTURE PAR FATIGUE",
  "overallFos": "Facteur de Sécurité Global (min)",
  "enduranceLimit": "Limite d'Endurance (Se)",
  "goodmanDiagram": "DIAGRAMME DE GOODMAN EN DIRECT",
  "loadPoint": "Charge",
  "envelopeExceeded": "Enveloppe de Fatigue Dépassée",
  "envelopeExceededDesc": "La combinaison de contraintes est hors de la zone sûre Goodman/Langer."
} as FatigueModuleStrings;

const IT: FatigueModuleStrings = {
  "fatigueLife": "Vita a Fatica",
  "enduranceAnalysis": "Analisi Limite di Fatica",
  "materialLoad": "Materiale e Carico",
  "ultimateTensile": "Resistenza a Trazione (S_ut)",
  "yieldStrength": "Snervamento (S_y)",
  "altStress": "Tensione Alternata (σ_a)",
  "meanStress": "Tensione Media (σ_m)",
  "marinFactors": "Fattori Marin",
  "surfaceKa": "Superficie (k_a)",
  "sizeKb": "Dimensione (k_b)",
  "loadKc": "Carico (k_c)",
  "infiniteLife": "VITA INFINITA CONFERMATA",
  "fatigueWarning": "AVVISO: ROTTURA A FATICA",
  "overallFos": "Fattore di Sicurezza Globale (min)",
  "enduranceLimit": "Limite di Fatica (Se)",
  "goodmanDiagram": "DIAGRAMMA GOODMAN IN TEMPO REALE",
  "loadPoint": "Carico",
  "envelopeExceeded": "Inviluppo Fatica Superato",
  "envelopeExceededDesc": "La combinazione di sollecitazioni è fuori dalla zona sicura Goodman/Langer."
} as FatigueModuleStrings;

const PT: FatigueModuleStrings = {
  "fatigueLife": "Vida à Fadiga",
  "enduranceAnalysis": "Análise de Limite de Resistência",
  "materialLoad": "Material e Carga",
  "ultimateTensile": "Resistência à Tração (S_ut)",
  "yieldStrength": "Tensão de Escoamento (S_y)",
  "altStress": "Tensão Alternada (σ_a)",
  "meanStress": "Tensão Média (σ_m)",
  "marinFactors": "Fatores Marin",
  "surfaceKa": "Superfície (k_a)",
  "sizeKb": "Tamanho (k_b)",
  "loadKc": "Carga (k_c)",
  "infiniteLife": "VIDA INFINITA CONFIRMADA",
  "fatigueWarning": "AVISO: FALHA POR FADIGA",
  "overallFos": "Fator de Segurança Global (mín)",
  "enduranceLimit": "Limite de Resistência (Se)",
  "goodmanDiagram": "DIAGRAMA DE GOODMAN AO VIVO",
  "loadPoint": "Carga",
  "envelopeExceeded": "Envelope de Fadiga Excedido",
  "envelopeExceededDesc": "A combinação de tensões está fora da zona segura Goodman/Langer."
} as FatigueModuleStrings;

const RU: FatigueModuleStrings = {
  "fatigueLife": "Усталостный Ресурс",
  "enduranceAnalysis": "Анализ Предела Выносливости",
  "materialLoad": "Материал и Нагрузка",
  "ultimateTensile": "Предел Прочности (S_ut)",
  "yieldStrength": "Предел Текучести (S_y)",
  "altStress": "Амплитуда Напряжения (σ_a)",
  "meanStress": "Среднее Напряжение (σ_m)",
  "marinFactors": "Коэффициенты Марина",
  "surfaceKa": "Поверхность (k_a)",
  "sizeKb": "Размер (k_b)",
  "loadKc": "Нагрузка (k_c)",
  "infiniteLife": "БЕСКОНЕЧНЫЙ РЕСУРС ПОДТВЕРЖДЁН",
  "fatigueWarning": "ПРЕДУПРЕЖДЕНИЕ: УСТАЛОСТНОЕ РАЗРУШЕНИЕ",
  "overallFos": "Общий Запас Прочности (мин)",
  "enduranceLimit": "Предел Выносливости (Se)",
  "goodmanDiagram": "ДИАГРАММА ГУДМАНА (LIVE)",
  "loadPoint": "Нагрузка",
  "envelopeExceeded": "Предел Усталости Превышен",
  "envelopeExceededDesc": "Комбинация напряжений вне безопасной зоны Goodman/Langer."
} as FatigueModuleStrings;

const JA: FatigueModuleStrings = {
  "fatigueLife": "疲労寿命",
  "enduranceAnalysis": "耐久限度解析",
  "materialLoad": "材料 & 荷重設定",
  "ultimateTensile": "引張強さ (S_ut)",
  "yieldStrength": "降伏強度 (S_y)",
  "altStress": "応力振幅 (σ_a)",
  "meanStress": "平均応力 (σ_m)",
  "marinFactors": "マリン修正係数",
  "surfaceKa": "表面状態 (k_a)",
  "sizeKb": "寸法効果 (k_b)",
  "loadKc": "荷重の種類 (k_c)",
  "infiniteLife": "無限寿命を確認",
  "fatigueWarning": "警告: 疲労破壊の危険あり",
  "overallFos": "最小安全率 (FOS)",
  "enduranceLimit": "耐久限度 (Se)",
  "goodmanDiagram": "修正グッドマン線図 (リアルタイム)",
  "loadPoint": "荷重",
  "envelopeExceeded": "疲労限界領域超過",
  "envelopeExceededDesc": "動作応力状態がグッドマン/ランガーの安全領域を超えています。無限寿命は保証されません。"
} as FatigueModuleStrings;

const ZH: FatigueModuleStrings = {
  "fatigueLife": "疲劳寿命",
  "enduranceAnalysis": "耐久极限分析",
  "materialLoad": "材料与载荷设置",
  "ultimateTensile": "抗拉强度 (S_ut)",
  "yieldStrength": "屈服强度 (S_y)",
  "altStress": "交变应力 (σ_a)",
  "meanStress": "平均应力 (σ_m)",
  "marinFactors": "Marin修正系数",
  "surfaceKa": "表面 (k_a)",
  "sizeKb": "尺寸 (k_b)",
  "loadKc": "载荷 (k_c)",
  "infiniteLife": "无限寿命已确认",
  "fatigueWarning": "警告：预测疲劳失效",
  "overallFos": "总体安全系数 (最小)",
  "enduranceLimit": "耐久极限 (Se)",
  "goodmanDiagram": "实时修正古德曼图",
  "loadPoint": "载荷",
  "envelopeExceeded": "疲劳包络线超出",
  "envelopeExceededDesc": "工作应力组合超出 Goodman/Langer 安全区，无法保证无限寿命。"
} as FatigueModuleStrings;

const KO: FatigueModuleStrings = {
  "fatigueLife": "피로 수명",
  "enduranceAnalysis": "내구 한계 분석",
  "materialLoad": "재료 및 하중 설정",
  "ultimateTensile": "인장 강도 (S_ut)",
  "yieldStrength": "항복 강도 (S_y)",
  "altStress": "교번 응력 (σ_a)",
  "meanStress": "평균 응력 (σ_m)",
  "marinFactors": "마린 계수",
  "surfaceKa": "표면 (k_a)",
  "sizeKb": "크기 (k_b)",
  "loadKc": "하중 (k_c)",
  "infiniteLife": "무한 수명 확인",
  "fatigueWarning": "경고: 피로 파괴 예측",
  "overallFos": "전체 안전 계수 (최소)",
  "enduranceLimit": "내구 한계 (Se)",
  "goodmanDiagram": "실시간 수정 굿맨 다이어그램",
  "loadPoint": "하중",
  "envelopeExceeded": "피로 한계 초과",
  "envelopeExceededDesc": "작동 응력 조합이 Goodman/Langer 안전 영역을 벗어났습니다."
} as FatigueModuleStrings;

const AR: FatigueModuleStrings = {
  "fatigueLife": "عمر الإجهاد",
  "enduranceAnalysis": "تحليل حد التحمل",
  "materialLoad": "المادة والحمل",
  "ultimateTensile": "مقاومة الشد (S_ut)",
  "yieldStrength": "مقاومة الخضوع (S_y)",
  "altStress": "إجهاد متناوب (σ_a)",
  "meanStress": "إجهاد متوسط (σ_m)",
  "marinFactors": "عوامل مارين",
  "surfaceKa": "السطح (k_a)",
  "sizeKb": "الحجم (k_b)",
  "loadKc": "الحمل (k_c)",
  "infiniteLife": "تم تأكيد العمر اللانهائي",
  "fatigueWarning": "تحذير: فشل إجهاد متوقع",
  "overallFos": "عامل الأمان الإجمالي (الأدنى)",
  "enduranceLimit": "حد التحمل (Se)",
  "goodmanDiagram": "مخطط جودمان المعدل (مباشر)",
  "loadPoint": "الحمل",
  "envelopeExceeded": "تجاوز حد الإجهاد",
  "envelopeExceededDesc": "مزيج الإجهاد التشغيلي خارج المنطقة الآمنة Goodman/Langer."
} as FatigueModuleStrings;

const BY_LOCALE: Record<Language, FatigueModuleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getFatigueModuleStrings(locale: string): FatigueModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
