import type { Language } from '@/store/i18nStore';

export type LiteCategoryKey =
  | 'mechanical'
  | 'manufacturing'
  | 'civil'
  | 'electrical'
  | 'finance'
  | 'science'
  | 'software'
  | 'other';

export type LitePageStrings = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyState: string;
  categories: Record<LiteCategoryKey, string>;
};

const EN: LitePageStrings = {
  title: 'Calculators',
  subtitle: 'Select a tool below to begin your calculations.',
  searchPlaceholder: 'Search calculators...',
  emptyState: 'No calculators found matching your search.',
  categories: {
    mechanical: 'Mechanical Engineering',
    manufacturing: 'Manufacturing & Production',
    civil: 'Civil Engineering',
    electrical: 'Electrical',
    finance: 'Finance & Costing',
    science: 'Science & Math',
    software: 'Software Utilities',
    other: 'Other Tools',
  },
};

const TR: LitePageStrings = {
  title: 'Hesaplayıcılar',
  subtitle: 'Hesaplamalarınıza başlamak için aşağıdan bir araç seçin.',
  searchPlaceholder: 'Hesaplayıcı ara...',
  emptyState: 'Aramanızla eşleşen hesaplayıcı bulunamadı.',
  categories: {
    mechanical: 'Makine Mühendisliği',
    manufacturing: 'Üretim ve İmalat',
    civil: 'İnşaat Mühendisliği',
    electrical: 'Elektrik',
    finance: 'Finans ve Maliyet',
    science: 'Bilim ve Matematik',
    software: 'Yazılım Araçları',
    other: 'Diğer Araçlar',
  },
};

const DE: LitePageStrings = {
  title: 'Rechner',
  subtitle: 'Wählen Sie unten ein Tool, um mit Ihren Berechnungen zu beginnen.',
  searchPlaceholder: 'Rechner suchen...',
  emptyState: 'Keine Rechner für Ihre Suche gefunden.',
  categories: {
    mechanical: 'Maschinenbau',
    manufacturing: 'Fertigung & Produktion',
    civil: 'Bauingenieurwesen',
    electrical: 'Elektrotechnik',
    finance: 'Finanzen & Kosten',
    science: 'Naturwissenschaft & Mathematik',
    software: 'Software-Tools',
    other: 'Sonstige Tools',
  },
};

const ES: LitePageStrings = {
  title: 'Calculadoras',
  subtitle: 'Seleccione una herramienta abajo para comenzar sus cálculos.',
  searchPlaceholder: 'Buscar calculadoras...',
  emptyState: 'No se encontraron calculadoras para su búsqueda.',
  categories: {
    mechanical: 'Ingeniería Mecánica',
    manufacturing: 'Manufactura y Producción',
    civil: 'Ingeniería Civil',
    electrical: 'Eléctrica',
    finance: 'Finanzas y Costos',
    science: 'Ciencia y Matemáticas',
    software: 'Utilidades de Software',
    other: 'Otras Herramientas',
  },
};

const FR: LitePageStrings = {
  title: 'Calculateurs',
  subtitle: 'Sélectionnez un outil ci-dessous pour commencer vos calculs.',
  searchPlaceholder: 'Rechercher des calculateurs...',
  emptyState: 'Aucun calculateur ne correspond à votre recherche.',
  categories: {
    mechanical: 'Génie Mécanique',
    manufacturing: 'Fabrication & Production',
    civil: 'Génie Civil',
    electrical: 'Électrique',
    finance: 'Finance & Coûts',
    science: 'Sciences & Mathématiques',
    software: 'Utilitaires Logiciels',
    other: 'Autres Outils',
  },
};

const IT: LitePageStrings = {
  title: 'Calcolatori',
  subtitle: 'Seleziona uno strumento qui sotto per iniziare i calcoli.',
  searchPlaceholder: 'Cerca calcolatori...',
  emptyState: 'Nessun calcolatore trovato per la ricerca.',
  categories: {
    mechanical: 'Ingegneria Meccanica',
    manufacturing: 'Produzione e Manufacturing',
    civil: 'Ingegneria Civile',
    electrical: 'Elettrica',
    finance: 'Finanza e Costi',
    science: 'Scienza e Matematica',
    software: 'Utilità Software',
    other: 'Altri Strumenti',
  },
};

const PT: LitePageStrings = {
  title: 'Calculadoras',
  subtitle: 'Selecione uma ferramenta abaixo para iniciar os cálculos.',
  searchPlaceholder: 'Pesquisar calculadoras...',
  emptyState: 'Nenhuma calculadora encontrada para a pesquisa.',
  categories: {
    mechanical: 'Engenharia Mecânica',
    manufacturing: 'Manufatura e Produção',
    civil: 'Engenharia Civil',
    electrical: 'Elétrica',
    finance: 'Finanças e Custos',
    science: 'Ciência e Matemática',
    software: 'Utilitários de Software',
    other: 'Outras Ferramentas',
  },
};

const RU: LitePageStrings = {
  title: 'Калькуляторы',
  subtitle: 'Выберите инструмент ниже, чтобы начать расчёты.',
  searchPlaceholder: 'Поиск калькуляторов...',
  emptyState: 'Калькуляторы по вашему запросу не найдены.',
  categories: {
    mechanical: 'Машиностроение',
    manufacturing: 'Производство',
    civil: 'Гражданское строительство',
    electrical: 'Электротехника',
    finance: 'Финансы и стоимость',
    science: 'Наука и математика',
    software: 'Программные утилиты',
    other: 'Другие инструменты',
  },
};

const JA: LitePageStrings = {
  title: '計算ツール',
  subtitle: '下からツールを選んで計算を開始してください。',
  searchPlaceholder: '計算ツールを検索...',
  emptyState: '検索に一致する計算ツールが見つかりません。',
  categories: {
    mechanical: '機械工学',
    manufacturing: '製造・生産',
    civil: '土木工学',
    electrical: '電気',
    finance: '財務・コスト',
    science: '科学・数学',
    software: 'ソフトウェアユーティリティ',
    other: 'その他のツール',
  },
};

const ZH: LitePageStrings = {
  title: '计算器',
  subtitle: '请在下方选择工具开始计算。',
  searchPlaceholder: '搜索计算器...',
  emptyState: '未找到匹配的计算器。',
  categories: {
    mechanical: '机械工程',
    manufacturing: '制造与生产',
    civil: '土木工程',
    electrical: '电气',
    finance: '财务与成本',
    science: '科学与数学',
    software: '软件工具',
    other: '其他工具',
  },
};

const KO: LitePageStrings = {
  title: '계산기',
  subtitle: '아래에서 도구를 선택해 계산을 시작하세요.',
  searchPlaceholder: '계산기 검색...',
  emptyState: '검색과 일치하는 계산기가 없습니다.',
  categories: {
    mechanical: '기계 공학',
    manufacturing: '제조 및 생산',
    civil: '토목 공학',
    electrical: '전기',
    finance: '재무 및 비용',
    science: '과학 및 수학',
    software: '소프트웨어 유틸리티',
    other: '기타 도구',
  },
};

const AR: LitePageStrings = {
  title: 'الحاسبات',
  subtitle: 'اختر أداة أدناه لبدء حساباتك.',
  searchPlaceholder: 'البحث عن حاسبات...',
  emptyState: 'لم يتم العثور على حاسبات مطابقة لبحثك.',
  categories: {
    mechanical: 'الهندسة الميكانيكية',
    manufacturing: 'التصنيع والإنتاج',
    civil: 'الهندسة المدنية',
    electrical: 'الكهرباء',
    finance: 'المالية والتكلفة',
    science: 'العلوم والرياضيات',
    software: 'أدوات البرمجيات',
    other: 'أدوات أخرى',
  },
};

const MAP: Record<Language, LitePageStrings> = {
  en: EN,
  tr: TR,
  de: DE,
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  ru: RU,
  zh: ZH,
  ja: JA,
  ko: KO,
  ar: AR,
};

export function getLitePage(locale: string): LitePageStrings {
  return MAP[locale as Language] ?? EN;
}
