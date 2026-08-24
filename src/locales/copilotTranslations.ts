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
  'Bir mühendis için cam yarı dolu veya yarı boş değildir; cam gereğinden iki kat büyüktür!',
  'Mühendislik kuralı #1: Çalışıyorsa dokunma!',
  'Yazılımcının en büyük yalanı: "Bende çalışıyor!"',
  "SQL sorgusu bir bara girer, iki masaya yanaşır ve sorar: 'Join yapabilir miyim?'",
];

const DE_JOKES = [
  'Warum ging der Ingenieur nicht in die Bar? Zu viele Randbedingungen.',
  'Hardware kann man treten; Software nur beschimpfen.',
  'Ingenieursregel #1: Wenn es funktioniert, nicht anfassen.',
  'Ein SQL-Query geht in eine Bar und fragt zwei Tabellen: „Darf ich joinen?“',
];

const ES_JOKES = [
  '¿Por qué el ingeniero rompió con el arquitecto? Demasiadas restricciones sin resolver.',
  'El hardware es lo que puedes patear; el software solo insultar.',
  'Regla #1: si funciona, no lo toques.',
  'Una consulta SQL entra en un bar y pregunta a dos tablas: «¿Puedo hacer join?»',
];

const FR_JOKES = [
  'Pourquoi l’ingénieur a quitté l’architecte ? Trop de contraintes non résolues.',
  'Le matériel, on peut le donner un coup de pied ; le logiciel, on peut seulement l’insulter.',
  'Règle n°1 : si ça marche, ne touchez à rien.',
  'Une requête SQL entre dans un bar et demande à deux tables : « Puis-je faire un join ? »',
];

const IT_JOKES = [
  'Perché l\'ingegnere ha lasciato l\'architetto? Troppe vincoli irrisolti.',
  'L\'hardware si può prendere a calci; il software solo insultare.',
  'Regola n.1: se funziona, non toccarlo.',
  'Una query SQL entra in un bar e chiede a due tavoli: «Posso fare join?»',
];

const PT_JOKES = [
  'Por que o engenheiro terminou com o arquiteto? Muitas restrições não resolvidas.',
  'Hardware você chuta; software você só xinga.',
  'Regra nº1: se funciona, não mexa.',
  'Uma query SQL entra num bar e pergunta a duas mesas: «Posso fazer join?»',
];

const RU_JOKES = [
  'Почему инженер расстался с архитектором? Слишком много неразрешённых ограничений.',
  'В железо можно пнуть; в софт — только материться.',
  'Правило №1: если работает — не трогай.',
  'SQL-запрос заходит в бар и спрашивает два стола: «Можно join?»',
];

const ZH_JOKES = [
  '工程师为什么和建筑师分手？约束条件太多解不完。',
  '硬件可以踢，软件只能骂。',
  '工程法则第一条：能用就别动。',
  '一条 SQL 走进酒吧，问两张表：「能 join 吗？」',
];

const JA_JOKES = [
  'エンジニアが建築家と別れた理由？未解決の制約が多すぎるから。',
  'ハードは蹴れる。ソフトは罵るだけ。',
  '鉄則その1：動いていたら触るな。',
  'SQLクエリがバーに入り、2つのテーブルに「JOINしていい？」',
];

const KO_JOKES = [
  '엔지니어가 건축가와 헤어진 이유? 미해결 제약이 너무 많아서.',
  '하드웨어는 발로 차고, 소프트웨어는 욕만 한다.',
  '규칙 1: 작동하면 건드리지 마라.',
  'SQL 쿼리가 바에 들어가 두 테이블에 묻는다: «조인해도 될까요?»',
];

const AR_JOKES = [
  'لماذا انفصل المهندس عن المهندس المعماري؟ قيود كثيرة غير محلولة.',
  'العتاد يمكن ركله؛ البرمجيات يمكن فقط شتمها.',
  'القاعدة 1: إذا كان يعمل فلا تلمسه.',
  'استعلام SQL يدخل حانة ويسأل جدولين: «هل يمكنني الانضمام؟»',
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
  jokes: DE_JOKES,
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
  jokes: ES_JOKES,
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
  jokes: FR_JOKES,
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
  jokes: IT_JOKES,
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
  jokes: PT_JOKES,
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
  jokes: RU_JOKES,
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
  jokes: ZH_JOKES,
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
  jokes: JA_JOKES,
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
  jokes: KO_JOKES,
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
  jokes: AR_JOKES,
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

/** Pass through full UI locale for copilot engine strings (12 languages). */
export function getCopilotEngineLocale(locale: string): Language {
  const supported: Language[] = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];
  return supported.includes(locale as Language) ? (locale as Language) : 'en';
}
