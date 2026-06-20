import type { Language } from '@/store/i18nStore';

export type SeoPageStrings = {
  calculators: string;
  engineeringWorkspace: string;
  mathematicalDefinition: string;
  relatedCalculators: string;
  analyzeNow: string;
  relatedAcademyGuides: string;
  readTheory: string;
  home: string;
  allCalculators: string;
  academy: string;
  footerTagline: string;
  calculationHistory: string;
  load: string;
  result: string;
  realTimeSolver: string;
  calculationProcedure: string;
  practicalApplication: string;
  workedReferenceExample: string;
  designChecklist: string;
  commonPitfalls: string;
  faq: string;
  engineeringSuite: string;
  workspaceShortcuts: string;
};

const EN: SeoPageStrings = {
  calculators: 'Calculators',
  engineeringWorkspace: 'Engineering Workspace',
  mathematicalDefinition: 'Mathematical Definition',
  relatedCalculators: 'Related Engineering Calculators',
  analyzeNow: 'Analyze Now',
  relatedAcademyGuides: 'Related Engineering Academy Guides',
  readTheory: 'Read the Theory',
  home: 'Home',
  allCalculators: 'All Calculators',
  academy: 'Academy',
  footerTagline: 'Engineering Intelligence Platform',
  calculationHistory: 'Calculation History',
  load: 'Load',
  result: 'Result',
  realTimeSolver: 'Real-Time Solver',
  calculationProcedure: 'Calculation Procedure',
  practicalApplication: 'Practical Engineering Application',
  workedReferenceExample: 'Worked Reference Example',
  designChecklist: 'Design Checklist',
  commonPitfalls: 'Common Pitfalls',
  faq: 'Frequently Asked Questions',
  engineeringSuite: 'Engineering Suite',
  workspaceShortcuts: 'Workspace Shortcuts',
};

const TR: Partial<SeoPageStrings> = {
  calculators: 'Hesaplayıcılar',
  engineeringWorkspace: 'Mühendislik Çalışma Alanı',
  mathematicalDefinition: 'Matematiksel Tanım',
  relatedCalculators: 'İlgili Mühendislik Hesaplayıcıları',
  analyzeNow: 'Şimdi Analiz Et',
  relatedAcademyGuides: 'İlgili Akademi Kılavuzları',
  readTheory: 'Teoriyi Oku',
  home: 'Ana Sayfa',
  allCalculators: 'Tüm Hesaplayıcılar',
  academy: 'Akademi',
  footerTagline: 'Mühendislik Zekası Platformu',
  calculationHistory: 'Hesaplama Geçmişi',
  load: 'Yükle',
  result: 'Sonuç',
};

const DE: Partial<SeoPageStrings> = {
  calculators: 'Rechner',
  engineeringWorkspace: 'Engineering-Arbeitsbereich',
  mathematicalDefinition: 'Mathematische Definition',
  relatedCalculators: 'Verwandte Ingenieur-Rechner',
  analyzeNow: 'Jetzt analysieren',
  relatedAcademyGuides: 'Verwandte Akademie-Leitfäden',
  readTheory: 'Theorie lesen',
  home: 'Startseite',
  allCalculators: 'Alle Rechner',
  academy: 'Akademie',
  footerTagline: 'Engineering Intelligence Plattform',
  calculationHistory: 'Berechnungsverlauf',
  load: 'Laden',
  result: 'Ergebnis',
};

const ES: Partial<SeoPageStrings> = {
  calculators: 'Calculadoras',
  engineeringWorkspace: 'Espacio de trabajo de ingeniería',
  mathematicalDefinition: 'Definición matemática',
  relatedCalculators: 'Calculadoras de ingeniería relacionadas',
  analyzeNow: 'Analizar ahora',
  relatedAcademyGuides: 'Guías de academia relacionadas',
  readTheory: 'Leer la teoría',
  home: 'Inicio',
  allCalculators: 'Todas las calculadoras',
  academy: 'Academia',
  footerTagline: 'Plataforma de inteligencia de ingeniería',
  calculationHistory: 'Historial de cálculos',
  load: 'Cargar',
  result: 'Resultado',
};

const FR: Partial<SeoPageStrings> = {
  calculators: 'Calculateurs',
  engineeringWorkspace: 'Espace de travail ingénierie',
  mathematicalDefinition: 'Définition mathématique',
  relatedCalculators: 'Calculateurs d\'ingénierie associés',
  analyzeNow: 'Analyser maintenant',
  relatedAcademyGuides: 'Guides académiques associés',
  readTheory: 'Lire la théorie',
  home: 'Accueil',
  allCalculators: 'Tous les calculateurs',
  academy: 'Académie',
  footerTagline: 'Plateforme d\'intelligence ingénierie',
  calculationHistory: 'Historique des calculs',
  load: 'Charger',
  result: 'Résultat',
};

const IT: Partial<SeoPageStrings> = {
  calculators: 'Calcolatori',
  engineeringWorkspace: 'Workspace ingegneristico',
  mathematicalDefinition: 'Definizione matematica',
  relatedCalculators: 'Calcolatori ingegneristici correlati',
  analyzeNow: 'Analizza ora',
  relatedAcademyGuides: 'Guide accademiche correlate',
  readTheory: 'Leggi la teoria',
  home: 'Home',
  allCalculators: 'Tutti i calcolatori',
  academy: 'Accademia',
  footerTagline: 'Piattaforma di intelligenza ingegneristica',
  calculationHistory: 'Cronologia calcoli',
  load: 'Carica',
  result: 'Risultato',
};

const PT: Partial<SeoPageStrings> = {
  calculators: 'Calculadoras',
  engineeringWorkspace: 'Workspace de engenharia',
  mathematicalDefinition: 'Definição matemática',
  relatedCalculators: 'Calculadoras de engenharia relacionadas',
  analyzeNow: 'Analisar agora',
  relatedAcademyGuides: 'Guias acadêmicos relacionados',
  readTheory: 'Ler a teoria',
  home: 'Início',
  allCalculators: 'Todas as calculadoras',
  academy: 'Academia',
  footerTagline: 'Plataforma de inteligência de engenharia',
  calculationHistory: 'Histórico de cálculos',
  load: 'Carregar',
  result: 'Resultado',
};

const RU: Partial<SeoPageStrings> = {
  calculators: 'Калькуляторы',
  engineeringWorkspace: 'Инженерная рабочая область',
  mathematicalDefinition: 'Математическое определение',
  relatedCalculators: 'Связанные инженерные калькуляторы',
  analyzeNow: 'Анализировать',
  relatedAcademyGuides: 'Связанные академические руководства',
  readTheory: 'Читать теорию',
  home: 'Главная',
  allCalculators: 'Все калькуляторы',
  academy: 'Академия',
  footerTagline: 'Платформа инженерного интеллекта',
  calculationHistory: 'История расчётов',
  load: 'Загрузить',
  result: 'Результат',
};

const ZH: Partial<SeoPageStrings> = {
  calculators: '计算器',
  engineeringWorkspace: '工程工作区',
  mathematicalDefinition: '数学定义',
  relatedCalculators: '相关工程计算器',
  analyzeNow: '立即分析',
  relatedAcademyGuides: '相关学院指南',
  readTheory: '阅读理论',
  home: '首页',
  allCalculators: '所有计算器',
  academy: '学院',
  footerTagline: '工程智能平台',
  calculationHistory: '计算历史',
  load: '加载',
  result: '结果',
};

const JA: Partial<SeoPageStrings> = {
  calculators: '計算機',
  engineeringWorkspace: 'エンジニアリングワークスペース',
  mathematicalDefinition: '数学的定義',
  relatedCalculators: '関連エンジニアリング計算機',
  analyzeNow: '今すぐ分析',
  relatedAcademyGuides: '関連アカデミーガイド',
  readTheory: '理論を読む',
  home: 'ホーム',
  allCalculators: 'すべての計算機',
  academy: 'アカデミー',
  footerTagline: 'エンジニアリング・インテリジェンス・プラットフォーム',
  calculationHistory: '計算履歴',
  load: '読み込み',
  result: '結果',
};

const KO: Partial<SeoPageStrings> = {
  calculators: '계산기',
  engineeringWorkspace: '엔지니어링 워크스페이스',
  mathematicalDefinition: '수학적 정의',
  relatedCalculators: '관련 엔지니어링 계산기',
  analyzeNow: '지금 분석',
  relatedAcademyGuides: '관련 아카데미 가이드',
  readTheory: '이론 읽기',
  home: '홈',
  allCalculators: '모든 계산기',
  academy: '아카데미',
  footerTagline: '엔지니어링 인텔리전스 플랫폼',
  calculationHistory: '계산 기록',
  load: '불러오기',
  result: '결과',
};

const AR: Partial<SeoPageStrings> = {
  calculators: 'الحاسبات',
  engineeringWorkspace: 'مساحة عمل هندسية',
  mathematicalDefinition: 'التعريف الرياضي',
  relatedCalculators: 'حاسبات هندسية ذات صلة',
  analyzeNow: 'حلل الآن',
  relatedAcademyGuides: 'أدلة أكاديمية ذات صلة',
  readTheory: 'اقرأ النظرية',
  home: 'الرئيسية',
  allCalculators: 'جميع الحاسبات',
  academy: 'الأكاديمية',
  footerTagline: 'منصة الذكاء الهندسي',
  calculationHistory: 'سجل الحسابات',
  load: 'تحميل',
  result: 'النتيجة',
};

const SEO_PAGE: Record<Language, SeoPageStrings> = {
  en: EN,
  tr: TR as SeoPageStrings,
  de: DE as SeoPageStrings,
  es: ES as SeoPageStrings,
  fr: FR as SeoPageStrings,
  it: IT as SeoPageStrings,
  pt: PT as SeoPageStrings,
  ru: RU as SeoPageStrings,
  zh: ZH as SeoPageStrings,
  ja: JA as SeoPageStrings,
  ko: KO as SeoPageStrings,
  ar: AR as SeoPageStrings,
};

export function getSeoPage(locale: string): SeoPageStrings {
  return SEO_PAGE[locale as Language] ?? EN;
}

const EXTRA_EN: Partial<SeoPageStrings> = {
  realTimeSolver: 'Real-Time Solver',
  calculationProcedure: 'Calculation Procedure',
  practicalApplication: 'Practical Engineering Application',
  workedReferenceExample: 'Worked Reference Example',
  designChecklist: 'Design Checklist',
  commonPitfalls: 'Common Pitfalls',
  faq: 'Frequently Asked Questions',
  engineeringSuite: 'Engineering Suite',
  workspaceShortcuts: 'Workspace Shortcuts',
};

const EXTRA_TR: Partial<SeoPageStrings> = {
  realTimeSolver: 'Gerçek Zamanlı Çözücü',
  calculationProcedure: 'Hesaplama Prosedürü',
  practicalApplication: 'Pratik Mühendislik Uygulaması',
  workedReferenceExample: 'Örnek Referans Çözümü',
  designChecklist: 'Tasarım Kontrol Listesi',
  commonPitfalls: 'Yaygın Hatalar',
  faq: 'Sık Sorulan Sorular',
  engineeringSuite: 'Mühendislik Paketi',
  workspaceShortcuts: 'Çalışma Alanı Kısayolları',
};

const EXTRA_BY_LOCALE: Partial<Record<Language, Partial<SeoPageStrings>>> = {
  en: EXTRA_EN,
  tr: EXTRA_TR,
  de: {
    realTimeSolver: 'Echtzeit-Löser',
    calculationProcedure: 'Berechnungsverfahren',
    practicalApplication: 'Praktische Ingenieuranwendung',
    workedReferenceExample: 'Ausgearbeitetes Referenzbeispiel',
    designChecklist: 'Design-Checkliste',
    commonPitfalls: 'Häufige Fehler',
    faq: 'Häufig gestellte Fragen',
    engineeringSuite: 'Engineering-Suite',
    workspaceShortcuts: 'Workspace-Verknüpfungen',
  },
  es: {
    realTimeSolver: 'Solucionador en tiempo real',
    calculationProcedure: 'Procedimiento de cálculo',
    practicalApplication: 'Aplicación práctica de ingeniería',
    workedReferenceExample: 'Ejemplo de referencia resuelto',
    designChecklist: 'Lista de verificación de diseño',
    commonPitfalls: 'Errores comunes',
    faq: 'Preguntas frecuentes',
    engineeringSuite: 'Suite de ingeniería',
    workspaceShortcuts: 'Accesos directos del workspace',
  },
  fr: {
    realTimeSolver: 'Solveur en temps réel',
    calculationProcedure: 'Procédure de calcul',
    practicalApplication: 'Application ingénierie pratique',
    workedReferenceExample: 'Exemple de référence résolu',
    designChecklist: 'Liste de contrôle de conception',
    commonPitfalls: 'Pièges courants',
    faq: 'Questions fréquentes',
    engineeringSuite: 'Suite ingénierie',
    workspaceShortcuts: 'Raccourcis workspace',
  },
  it: {
    realTimeSolver: 'Solver in tempo reale',
    calculationProcedure: 'Procedura di calcolo',
    practicalApplication: 'Applicazione ingegneristica pratica',
    workedReferenceExample: 'Esempio di riferimento svolto',
    designChecklist: 'Checklist di progettazione',
    commonPitfalls: 'Errori comuni',
    faq: 'Domande frequenti',
    engineeringSuite: 'Suite ingegneristica',
    workspaceShortcuts: 'Scorciatoie workspace',
  },
  pt: {
    realTimeSolver: 'Solucionador em tempo real',
    calculationProcedure: 'Procedimento de cálculo',
    practicalApplication: 'Aplicação prática de engenharia',
    workedReferenceExample: 'Exemplo de referência resolvido',
    designChecklist: 'Checklist de projeto',
    commonPitfalls: 'Erros comuns',
    faq: 'Perguntas frequentes',
    engineeringSuite: 'Suite de engenharia',
    workspaceShortcuts: 'Atalhos do workspace',
  },
  ru: {
    realTimeSolver: 'Решатель в реальном времени',
    calculationProcedure: 'Процедура расчёта',
    practicalApplication: 'Практическое инженерное применение',
    workedReferenceExample: 'Разобранный эталонный пример',
    designChecklist: 'Контрольный список проектирования',
    commonPitfalls: 'Частые ошибки',
    faq: 'Часто задаваемые вопросы',
    engineeringSuite: 'Инженерный пакет',
    workspaceShortcuts: 'Ярлыки рабочей области',
  },
  zh: {
    realTimeSolver: '实时求解器',
    calculationProcedure: '计算步骤',
    practicalApplication: '实际工程应用',
    workedReferenceExample: '参考算例',
    designChecklist: '设计检查清单',
    commonPitfalls: '常见错误',
    faq: '常见问题',
    engineeringSuite: '工程套件',
    workspaceShortcuts: '工作区快捷方式',
  },
  ja: {
    realTimeSolver: 'リアルタイムソルバー',
    calculationProcedure: '計算手順',
    practicalApplication: '実践的エンジニアリング応用',
    workedReferenceExample: '参考例題',
    designChecklist: '設計チェックリスト',
    commonPitfalls: 'よくある落とし穴',
    faq: 'よくある質問',
    engineeringSuite: 'エンジニアリングスイート',
    workspaceShortcuts: 'ワークスペースショートカット',
  },
  ko: {
    realTimeSolver: '실시간 솔버',
    calculationProcedure: '계산 절차',
    practicalApplication: '실용 엔지니어링 응용',
    workedReferenceExample: '참고 예제',
    designChecklist: '설계 체크리스트',
    commonPitfalls: '흔한 실수',
    faq: '자주 묻는 질문',
    engineeringSuite: '엔지니어링 스위트',
    workspaceShortcuts: '워크스페이스 바로가기',
  },
  ar: {
    realTimeSolver: 'حلّال فوري',
    calculationProcedure: 'إجراء الحساب',
    practicalApplication: 'تطبيق هندسي عملي',
    workedReferenceExample: 'مثال مرجعي محلول',
    designChecklist: 'قائمة التحقق من التصميم',
    commonPitfalls: 'أخطاء شائعة',
    faq: 'الأسئلة الشائعة',
    engineeringSuite: 'مجموعة الهندسة',
    workspaceShortcuts: 'اختصارات مساحة العمل',
  },
};

for (const locale of Object.keys(SEO_PAGE) as Language[]) {
  const extra = EXTRA_BY_LOCALE[locale] ?? EXTRA_EN;
  SEO_PAGE[locale] = { ...SEO_PAGE[locale], ...extra };
}
