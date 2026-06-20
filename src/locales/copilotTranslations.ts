import type { Language } from '@/store/i18nStore';

export type CopilotStrings = {
  welcome: string;
  placeholder: string;
  title: string;
  subtitle: string;
  promptsLabel: string;
  playGame: string;
  tellJoke: string;
  clear: string;
  presetS235: string;
  presetDeflection: string;
  presetGuide: string;
  pressEnter: string;
  activeGovernance: string;
  reasoningStream: string;
  openWorkspace: string;
  parseError: string;
  thinkingSteps: string[];
  fallbackQuotaSteps: string[];
  jokes: string[];
};

export const COPILOT_RESPONSE_LANGUAGE: Record<Language, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
};

const EN_JOKES = [
  'Why did the engineer break up with the architect? Too many unresolved constraints.',
  'Hardware is the part you can kick; software is the part you can only swear at.',
  'Rule #1 of engineering: if it works, do not touch it.',
  "An SQL query walks into a bar, approaches two tables and asks: 'Can I join you?'",
];

const TR_JOKES = [
  'Bir m\u00fchendis i\u00e7in cam yar\u0131 dolu veya yar\u0131 bo\u015f de\u011fildir; cam gere\u011finden iki kat b\u00fcy\u00fckt\u00fcr!',
  'M\u00fchendislik kural\u0131 #1: \u00c7al\u0131\u015f\u0131yorsa dokunma!',
  'Yaz\u0131l\u0131mc\u0131n\u0131n en b\u00fcy\u00fck yalan\u0131: "Bende \u00e7al\u0131\u015f\u0131yor!"',
  "SQL sorgusu bir bara girer, iki masaya yana\u015f\u0131r ve sorar: 'Join yapabilir miyim?'",
];

const EN: CopilotStrings = {
  welcome:
    'Hello! I am AeGiS — your Agentic Engineering Intelligence System. Ask me to verify formulas, suggest standard tolerances, or optimize structural materials.',
  placeholder: 'Ask AeGiS or define constraints...',
  title: 'AeGiS',
  subtitle: 'Omnipresent Agentic Engine',
  promptsLabel: 'Prompts:',
  playGame: 'Play Game',
  tellJoke: 'Tell a Joke',
  clear: 'Clear',
  presetS235: 'S235 Load Check',
  presetDeflection: 'Min Deflection',
  presetGuide: 'Page Guide',
  pressEnter: 'Press Enter to send',
  activeGovernance: 'Active Governance',
  reasoningStream: 'Reasoning Stream...',
  openWorkspace: 'Open Workstation',
  parseError:
    'I encountered an ambiguity while parsing parameters. Please define nominal values or standard designations explicitly.',
  thinkingSteps: [
    'Analyzing prompt semantic structure...',
    'Resolving material database variables...',
    'Consulting theoretical knowledge base...',
  ],
  fallbackQuotaSteps: [
    'Cognitive API quota limit hit. Redirecting to local engineering solver...',
    'Executing structural analysis integration...',
  ],
  jokes: EN_JOKES,
};

const TR: CopilotStrings = {
  welcome:
    'Merhaba! Ben AeGiS — Agentic Engineering Intelligence System. Formülleri doğrulamamı, standart toleranslar önermemi veya yapısal malzemeleri optimize etmemi isteyebilirsin.',
  placeholder: 'AeGiS\'e sor veya kısıtları tanımla...',
  title: 'AeGiS',
  subtitle: 'Evrensel Agentic Motor',
  promptsLabel: 'Hızlı:',
  playGame: 'Oyun Oyna',
  tellJoke: 'Şaka Yap',
  clear: 'Temizle',
  presetS235: 'S235 Yük Kontrolü',
  presetDeflection: 'Min Sehim',
  presetGuide: 'Sayfa Rehberi',
  pressEnter: 'Göndermek için Enter',
  activeGovernance: 'Aktif Yönetim',
  reasoningStream: 'Akıl Yürütme...',
  openWorkspace: 'Çalışma İstasyonunu Aç',
  parseError:
    'Parametreleri çözümlerken belirsizlik oluştu. Lütfen nominal değerleri veya standart tanımları açıkça belirtin.',
  thinkingSteps: [
    'İstem anlambilimsel yapısı analiz ediliyor...',
    'Malzeme veritabanı değişkenleri çözümleniyor...',
    'Teorik bilgi tabanına danışılıyor...',
  ],
  fallbackQuotaSteps: [
    'API kotası aşıldı. Yerel mühendislik çözücüsüne yönlendiriliyor...',
    'Yapısal analiz entegrasyonu çalıştırılıyor...',
  ],
  jokes: TR_JOKES,
};

const DE: CopilotStrings = {
  ...EN,
  welcome:
    'Hallo! Ich bin AeGiS — Ihr agentenbasiertes Ingenieur-Intelligenz-System. Fragen Sie mich zu Formeln, Toleranzen oder Materialoptimierung.',
  placeholder: 'AeGiS fragen oder Randbedingungen definieren...',
  title: 'AeGiS',
  subtitle: 'Omnipräsente Agentic Engine',
  promptsLabel: 'Prompts:',
  playGame: 'Spiel spielen',
  tellJoke: 'Witz erzählen',
  clear: 'Leeren',
  presetS235: 'S235 Lastprüfung',
  presetDeflection: 'Min. Durchbiegung',
  presetGuide: 'Seitenführer',
  pressEnter: 'Enter zum Senden',
  activeGovernance: 'Aktive Steuerung',
  reasoningStream: 'Reasoning...',
  openWorkspace: 'Workstation öffnen',
  parseError: 'Unklarheit beim Parsen der Parameter. Bitte Nominalwerte explizit angeben.',
  thinkingSteps: ['Semantische Analyse...', 'Materialvariablen auflösen...', 'Wissensbasis konsultieren...'],
  fallbackQuotaSteps: ['API-Limit erreicht. Lokaler Solver...', 'Strukturanalyse wird ausgeführt...'],
};

const ES: CopilotStrings = {
  ...EN,
  welcome:
    '¡Hola! Soy AeGiS — tu Sistema de Inteligencia de Ingeniería Agente. Pídeme verificar fórmulas, tolerancias o optimizar materiales.',
  placeholder: 'Pregunta a AeGiS o define restricciones...',
  title: 'AeGiS',
  subtitle: 'Motor Agéntico Omnipresente',
  promptsLabel: 'Prompts:',
  playGame: 'Jugar',
  tellJoke: 'Contar un chiste',
  clear: 'Limpiar',
  presetS235: 'Comprobar carga S235',
  presetDeflection: 'Mín. deflexión',
  presetGuide: 'Guía de página',
  pressEnter: 'Enter para enviar',
  activeGovernance: 'Gobernanza activa',
  reasoningStream: 'Razonamiento...',
  openWorkspace: 'Abrir estación de trabajo',
  parseError: 'Ambigüedad al analizar parámetros. Especifique valores nominales.',
  thinkingSteps: ['Analizando estructura semántica...', 'Resolviendo variables...', 'Consultando base de conocimiento...'],
  fallbackQuotaSteps: ['Límite de API. Solver local...', 'Ejecutando análisis estructural...'],
};

const FR: CopilotStrings = {
  ...EN,
  welcome:
    'Bonjour ! Je suis AeGiS — votre Système d\'Intelligence Ingénierie Agentique. Demandez-moi de vérifier des formules, des tolérances ou d\'optimiser des matériaux.',
  placeholder: 'Demandez à AeGiS ou définissez des contraintes...',
  title: 'AeGiS',
  subtitle: 'Moteur agentique omniprésent',
  promptsLabel: 'Prompts :',
  playGame: 'Jouer',
  tellJoke: 'Blague',
  clear: 'Effacer',
  presetS235: 'Contrôle charge S235',
  presetDeflection: 'Flèche min.',
  presetGuide: 'Guide de page',
  pressEnter: 'Entrée pour envoyer',
  activeGovernance: 'Gouvernance active',
  reasoningStream: 'Raisonnement...',
  openWorkspace: 'Ouvrir le poste de travail',
  parseError: 'Ambiguïté lors de l\'analyse des paramètres. Précisez les valeurs nominales.',
  thinkingSteps: ['Analyse sémantique...', 'Résolution des variables...', 'Consultation de la base...'],
  fallbackQuotaSteps: ['Quota API atteint. Solver local...', 'Analyse structurelle en cours...'],
};

const IT: CopilotStrings = {
  ...EN,
  welcome:
    'Ciao! Sono AeGiS — il tuo Sistema di Intelligenza Ingegneristica Agente. Chiedimi di verificare formule, tolleranze o ottimizzare materiali.',
  placeholder: 'Chiedi ad AeGiS o definisci vincoli...',
  title: 'AeGiS',
  subtitle: 'Motore agentico onnipresente',
  promptsLabel: 'Prompt:',
  playGame: 'Gioca',
  tellJoke: 'Barzelletta',
  clear: 'Pulisci',
  presetS235: 'Controllo carico S235',
  presetDeflection: 'Min. freccia',
  presetGuide: 'Guida pagina',
  pressEnter: 'Invio per inviare',
  activeGovernance: 'Governance attiva',
  reasoningStream: 'Ragionamento...',
  openWorkspace: 'Apri workstation',
  parseError: 'Ambiguità nel parsing dei parametri. Specificare valori nominali.',
  thinkingSteps: ['Analisi semantica...', 'Risoluzione variabili...', 'Consultazione knowledge base...'],
  fallbackQuotaSteps: ['Quota API esaurita. Solver locale...', 'Analisi strutturale in esecuzione...'],
};

const PT: CopilotStrings = {
  ...EN,
  welcome:
    'Olá! Sou AeGiS — seu Sistema de Inteligência de Engenharia Agente. Peça para verificar fórmulas, tolerâncias ou otimizar materiais.',
  placeholder: 'Pergunte ao AeGiS ou defina restrições...',
  title: 'AeGiS',
  subtitle: 'Motor agéntico onipresente',
  promptsLabel: 'Prompts:',
  playGame: 'Jogar',
  tellJoke: 'Contar piada',
  clear: 'Limpar',
  presetS235: 'Verificar carga S235',
  presetDeflection: 'Min. deflexão',
  presetGuide: 'Guia da página',
  pressEnter: 'Enter para enviar',
  activeGovernance: 'Governança ativa',
  reasoningStream: 'Raciocínio...',
  openWorkspace: 'Abrir estação de trabalho',
  parseError: 'Ambiguidade ao analisar parâmetros. Especifique valores nominais.',
  thinkingSteps: ['Analisando estrutura semântica...', 'Resolvendo variáveis...', 'Consultando base de conhecimento...'],
  fallbackQuotaSteps: ['Cota da API atingida. Solver local...', 'Executando análise estrutural...'],
};

const RU: CopilotStrings = {
  ...EN,
  welcome:
    'Здравствуйте! Я AeGiS — ваш агентный инженерный интеллект. Попросите проверить формулы, допуски или оптимизировать материалы.',
  placeholder: 'Спросите AeGiS или задайте ограничения...',
  title: 'AeGiS',
  subtitle: 'Вездесущий агентный движок',
  promptsLabel: 'Подсказки:',
  playGame: 'Игра',
  tellJoke: 'Шутка',
  clear: 'Очистить',
  presetS235: 'Проверка нагрузки S235',
  presetDeflection: 'Мин. прогиб',
  presetGuide: 'Справка по странице',
  pressEnter: 'Enter для отправки',
  activeGovernance: 'Активное управление',
  reasoningStream: 'Рассуждение...',
  openWorkspace: 'Открыть рабочую область',
  parseError: 'Неоднозначность при разборе параметров. Укажите номинальные значения.',
  thinkingSteps: ['Семантический анализ...', 'Разрешение переменных...', 'Обращение к базе знаний...'],
  fallbackQuotaSteps: ['Лимит API. Локальный решатель...', 'Выполняется структурный анализ...'],
};

const ZH: CopilotStrings = {
  ...EN,
  welcome: '你好！我是 AeGiS — 您的智能工程代理系统。可以请我验证公式、建议标准公差或优化结构材料。',
  placeholder: '向 AeGiS 提问或定义约束...',
  title: 'AeGiS',
  subtitle: '全域智能引擎',
  promptsLabel: '快捷:',
  playGame: '玩游戏',
  tellJoke: '讲笑话',
  clear: '清空',
  presetS235: 'S235 载荷检查',
  presetDeflection: '最小挠度',
  presetGuide: '页面指南',
  pressEnter: '按 Enter 发送',
  activeGovernance: '活跃治理',
  reasoningStream: '推理中...',
  openWorkspace: '打开工作站',
  parseError: '解析参数时出现歧义。请明确指定标称值。',
  thinkingSteps: ['分析语义结构...', '解析材料变量...', '查询知识库...'],
  fallbackQuotaSteps: ['API 配额已满。转向本地求解器...', '执行结构分析...'],
};

const JA: CopilotStrings = {
  ...EN,
  welcome:
    'こんにちは！AeGiS です — エージェント型エンジニアリング・インテリジェンス・システム。公式の検証、公差の提案、材料の最適化をお手伝いします。',
  placeholder: 'AeGiS に質問または制約を定義...',
  title: 'AeGiS',
  subtitle: '全画面エージェントエンジン',
  promptsLabel: 'プロンプト:',
  playGame: 'ゲーム',
  tellJoke: 'ジョーク',
  clear: 'クリア',
  presetS235: 'S235 荷重チェック',
  presetDeflection: '最小たわみ',
  presetGuide: 'ページガイド',
  pressEnter: 'Enter で送信',
  activeGovernance: 'アクティブガバナンス',
  reasoningStream: '推論中...',
  openWorkspace: 'ワークステーションを開く',
  parseError: 'パラメータ解析で曖昧さが発生しました。公称値を明示してください。',
  thinkingSteps: ['意味構造を分析中...', '材料変数を解決中...', '知識ベースを参照中...'],
  fallbackQuotaSteps: ['API 制限。ローカルソルバーへ...', '構造解析を実行中...'],
};

const KO: CopilotStrings = {
  ...EN,
  welcome:
    '안녕하세요! AeGiS입니다 — 에이전트 엔지니어링 인텔리전스 시스템. 공식 검증, 공차 제안, 재료 최적화를 요청하세요.',
  placeholder: 'AeGiS에 질문하거나 제약 조건을 정의...',
  title: 'AeGiS',
  subtitle: '전역 에이전트 엔진',
  promptsLabel: '프롬프트:',
  playGame: '게임',
  tellJoke: '농담',
  clear: '지우기',
  presetS235: 'S235 하중 검사',
  presetDeflection: '최소 처짐',
  presetGuide: '페이지 가이드',
  pressEnter: 'Enter로 전송',
  activeGovernance: '활성 거버넌스',
  reasoningStream: '추론 중...',
  openWorkspace: '워크스테이션 열기',
  parseError: '매개변수 파싱 중 모호성이 발생했습니다. 공칭값을 명시하세요.',
  thinkingSteps: ['의미 구조 분석 중...', '재료 변수 해석 중...', '지식 베이스 참조 중...'],
  fallbackQuotaSteps: ['API 할당량 초과. 로컬 솔버로...', '구조 분석 실행 중...'],
};

const AR: CopilotStrings = {
  ...EN,
  welcome:
    'مرحباً! أنا AeGiS — نظام الذكاء الهندسي الوكيل. اطلب التحقق من الصيغ أو التفاوتات أو تحسين المواد.',
  placeholder: 'اسأل AeGiS أو حدد القيود...',
  title: 'AeGiS',
  subtitle: 'محرك وكيل شامل',
  promptsLabel: 'اقتراحات:',
  playGame: 'لعبة',
  tellJoke: 'نكتة',
  clear: 'مسح',
  presetS235: 'فحص حمل S235',
  presetDeflection: 'أدنى انحراف',
  presetGuide: 'دليل الصفحة',
  pressEnter: 'Enter للإرسال',
  activeGovernance: 'حوكمة نشطة',
  reasoningStream: 'استدلال...',
  openWorkspace: 'فتح محطة العمل',
  parseError: 'غموض عند تحليل المعاملات. يرجى تحديد القيم الاسمية.',
  thinkingSteps: ['تحليل البنية الدلالية...', 'حل متغيرات المواد...', 'استشارة قاعدة المعرفة...'],
  fallbackQuotaSteps: ['تم تجاوز حصة API. محلل محلي...', 'تنفيذ التحليل الإنشائي...'],
};

const COPILOT_STRINGS: Record<Language, CopilotStrings> = {
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

export function getCopilotStrings(locale: string): CopilotStrings {
  return COPILOT_STRINGS[locale as Language] ?? EN;
}

export function getCopilotResponseLanguage(locale: string): string {
  return COPILOT_RESPONSE_LANGUAGE[locale as Language] ?? 'English';
}

/** Maps UI locale to local offline engine copy (module routes only have en/tr). */
export function getCopilotEngineLocale(locale: string): 'en' | 'tr' {
  return locale === 'tr' ? 'tr' : 'en';
}
