"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, X, Send, User, ChevronLeft, ChevronRight, Layers, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';
import { useCopilotStore } from '@/store/copilotStore';
import { useOSStore } from '@/store/osStore';
import { MODULE_REGISTRY, MODULE_ALIASES } from '@/config/modules';

import { getCopilotStrings, getCopilotEngineLocale, getCopilotResponseLanguage } from '@/locales/copilotTranslations';
import { getCopilotGameStrings, getTriviaQuestions } from '@/locales/copilotGameTranslations';
import { AegisMascot, playMascotChirp } from './AegisMascot';
import { useAegisStore, type AegisMessage } from '@/store/aegisStore';

interface GameOption {
  label: string;
  value: string;
}

type Message = AegisMessage;

const LOCALIZED_GREETINGS: Record<string, string[]> = {
  en: [
    "Welcome to AluCAD OS R&D Lab. How may I assist your engineering design today?",
    "Ready to solve and verify across deterministic ISO/DIN standards.",
    "Let's audit tolerances, gear geometry, or structural stress.",
    "Would you like to analyze a CAD assembly or flow calculation?",
    "Chief Research Engineer on standby. What engineering problem shall we solve?",
  ],
  tr: [
    "AluCAD OS AR-GE Laboratuvarına hoş geldiniz. Tasarımınızda nasıl yardımcı olabilirim?",
    "ISO/DIN standartları ve 3D CAD üzerinde doğrulamaya hazırım.",
    "Toleransları, dişli geometrisini veya yapısal gerilmeleri denetleyebiliriz.",
    "Bir CAD montajı veya akış grafiği analiz etmek ister misiniz?",
    "Baş Araştırma Mühendisi devrede. Hangi mühendislik problemini ele alalım?",
  ],
  de: [
    "Willkommen im AluCAD OS F&E-Labor. Wie kann ich Ihre Konstruktion heute unterstützen?",
    "Bereit zur Verifikation nach ISO/DIN-Standards.",
    "Lassen Sie uns Toleranzen, Zahnradgeometrien oder Spannungen prüfen.",
    "Möchten Sie eine CAD-Baugruppe oder einen Flow-Graphen analysieren?",
    "Leitender Forschungsingenieur bereit. Welches technische Problem lösen wir?",
  ],
  es: [
    "Bienvenido al Laboratorio I+D de AluCAD OS. ¿Cómo puedo asistirle en su diseño hoy?",
    "Listo para verificar bajo normas ISO/DIN.",
    "Revisemos tolerancias, geometría de engranajes o tensiones estructurales.",
    "¿Desea analizar un ensamblaje CAD o un grafo de cálculo Flow?",
    "Ingeniero Jefe de Investigación listo. ¿Qué desafío de ingeniería abordamos?",
  ],
  fr: [
    "Bienvenue au Laboratoire R&D AluCAD OS. Comment puis-je vous assister aujourd'hui ?",
    "Prêt à valider selon les normes ISO/DIN.",
    "Vérifions les tolérances, la géométrie d'engrenages ou les contraintes.",
    "Souhaitez-vous analyser un assemblage CAD ou un graphe Flow Engine ?",
    "Ingénieur en Chef de Recherche en veille. Quel problème d'ingénierie traitons-nous ?",
  ],
  it: [
    "Benvenuti nel Laboratorio R&S AluCAD OS. Come posso assistere il vostro progetto?",
    "Pronto per la verifica secondo gli standard ISO/DIN.",
    "Verifichiamo le tolleranze, la geometria degli ingranaggi o le sollecitazioni.",
    "Desidera analizzare un assieme CAD o un grafo di calcolo Flow?",
    "Ingegnere Capo della Ricerca a disposizione. Quale analisi vogliamo avviare?",
  ],
  pt: [
    "Bem-vindo ao Laboratório de P&D AluCAD OS. Como posso apoiar seu projeto hoje?",
    "Pronto para certificar conforme normas ISO/DIN.",
    "Vamos inspecionar tolerâncias, geometria de engrenagens ou tensões.",
    "Deseja analisar uma montagem CAD ou um fluxo de cálculo?",
    "Engenheiro Chefe de Pesquisa a postos. Qual desafio técnico resolveremos?",
  ],
  ru: [
    "Добро пожаловать в лабораторию НИОКР AluCAD OS. Чем могу помочь вашему проекту?",
    "Готов верифицировать расчеты по стандартам ISO/DIN.",
    "Проведем аудит допусков, геометрии зубчатых передач или напряжений.",
    "Хотите проанализировать CAD-сборку или граф Flow Engine?",
    "Главный инженер-исследователь на связи. Какую задачу решаем?",
  ],
  zh: [
    "欢迎访问 AluCAD OS 工程研发实验室。今天能为您的工程设计提供什么协助？",
    "已就绪根据 ISO/DIN 标准进行求解与验证。",
    "让我们对公差匹配、齿轮啮合几何或结构应力进行合规审计。",
    "您希望分析 3D CAD 装配体还是 Flow Engine 计算逻辑流？",
    "首席研发工程师已上线。我们来解决哪项工程挑战？",
  ],
  ja: [
    "AluCAD OS R&D研究所へようこそ。どのような設計課題をサポートいたしましょうか？",
    "ISO/DIN規格に準拠した計算・検証が可能です。",
    "公差、歯車幾何諸元、構造応力の適合性チェックを行いましょう。",
    "3D CADアセンブリまたはFlowグラフの解析を開始しますか？",
    "主任研究エンジニアが待機しています。どの工学課題を解決しましょうか？",
  ],
  ko: [
    "AluCAD OS R&D 연구소에 오신 것을 환영합니다. 엔지니어링 설계를 어떻게 도와드릴까요?",
    "ISO/DIN 표준에 따른 엄격한 검증이 준비되어 있습니다。",
    "공차, 기어 형상 치수, 구조 응력 해석을 검토해 드립니다.",
    "CAD 어셈블리 또는 Flow Engine 계산 그래프를 분석하시겠습니까?",
    "수석 연구 엔지니어 대기 중입니다. 어떤 공학 과제를 해결할까요?",
  ],
  ar: [
    "مرحباً بكم في مختبر الأبحاث والتطوير AluCAD OS. كيف يمكنني مساعدة تصميمكم اليوم؟",
    "جاهز للتحقق والحل الحسابي وفق معايير ISO/DIN.",
    "دعنا ندقق التفاوتات، هندسة التروس، أو الإجهادات الإنشائية.",
    "هل ترغب في تحليل تجميع CAD ثلاثي الأبعاد أو مخطط Flow Engine؟",
    "كبير مهندسي الأبحاث في الخدمة. ما المسألة الهندسية التي سنحلها؟",
  ],
};

const hexagonsData = [
  { id: 1, size: 28, baseLeft: 12, baseTop: '42%', delay: 0, xRange: [0, 8, -6, 0], yRange: [0, -12, 10, 0], duration: 6 },
  { id: 2, size: 22, baseLeft: 28, baseTop: '46%', delay: 0.4, xRange: [0, -6, 8, 0], yRange: [0, 10, -6, 0], duration: 8 },
  { id: 3, size: 34, baseLeft: 8, baseTop: '52%', delay: 0.8, xRange: [0, 10, -10, 0], yRange: [0, -6, 12, 0], duration: 7 },
  { id: 4, size: 26, baseLeft: 32, baseTop: '58%', delay: 1.2, xRange: [0, -8, 6, 0], yRange: [0, 12, -10, 0], duration: 9 },
  { id: 5, size: 30, baseLeft: 16, baseTop: '64%', delay: 1.6, xRange: [0, 6, -8, 0], yRange: [0, -10, 6, 0], duration: 5 }
];

export type AICopilotOverlayProps = {
  /** Full-screen embedded panel for mobile APK tab (not floating overlay). */
  embedded?: boolean;
};

export const AICopilotOverlay: React.FC<AICopilotOverlayProps> = ({ embedded = false }) => {
  const { language } = useI18nStore();
  const strings = getCopilotStrings(language);
  const { isOpen, setIsOpen, greetingText, setGreetingText } = useCopilotStore();
  const pathname = usePathname() || '';
  const windows = useOSStore((s) => s.windows);
  const activeWindowId = useOSStore((s) => s.activeWindowId);

  const isEngineeringSolver = useMemo(() => {
    const labSlugs = [
      'biology-genetics',
      'stem-codex',
      'chemistry-reactions',
      'chemistry-lab',
      'periodic-table',
      'matrix-screensaver',
      'screensaver',
    ];

    const cleanPath = pathname.replace(/^\/|\/$/g, '');
    const pathParts = cleanPath.split('/');
    const firstSegment = pathParts[0] || '';
    const slugFromCalculators = (firstSegment === 'calculators' || firstSegment === 'calculator') ? pathParts[1] : null;
    const targetSlug = slugFromCalculators || firstSegment;

    const activeWin = windows.find((w) => w.id === activeWindowId);
    const activeType = activeWin?.type;

    if (
      labSlugs.includes(targetSlug) ||
      (activeType && labSlugs.includes(activeType)) ||
      pathname.includes('biology') ||
      pathname.includes('screensaver')
    ) {
      return false;
    }

    const resolvedModuleKey = (MODULE_ALIASES as Record<string, string>)[targetSlug] || targetSlug;
    const moduleDef = MODULE_REGISTRY[resolvedModuleKey];
    if (moduleDef) {
      return ['mechanical', 'manufacturing', 'civil', 'electrical'].includes(moduleDef.category);
    }

    if (activeType) {
      const activeDef = MODULE_REGISTRY[activeType];
      if (activeDef && ['mechanical', 'manufacturing', 'civil', 'electrical'].includes(activeDef.category)) {
        return true;
      }
    }

    const engineeringKeywords = [
      'mechanical', 'manufacturing', 'civil', 'electrical',
      'beam', 'bolt', 'torque', 'bearing', 'gear', 'welding', 'weld', 'stress', 'strain',
      'deflection', 'shaft', 'keyway', 'press-fit', 'oring', 'o-ring', 'tolerance', 'thermal',
      'fluid', 'pump', 'fatigue', 'buckling', 'spring', 'vibration', 'hvac', 'pipe',
      'profile', 'sheet-metal', 'concrete', 'ohms-law', 'voltage-drop', 'hydrostatic', 'aerospace'
    ];
    return engineeringKeywords.some((kw) => targetSlug.toLowerCase().includes(kw));
  }, [pathname, windows, activeWindowId]);

  // Conversation lives in the shared AeGiS store (same thread as the sidebar bubble).
  const router = useRouter();
  const storedMessages = useAegisStore((s) => s.messages);
  const setMessages = useAegisStore((s) => s.setMessages);
  const isTyping = useAegisStore((s) => s.isThinking);
  const setIsTyping = useAegisStore((s) => s.setThinking);
  const thinkingSteps = useAegisStore((s) => s.thinkingSteps);
  const sendToAegis = useAegisStore((s) => s.send);
  const resetAegis = useAegisStore((s) => s.reset);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);

  // Keep the legacy copilot flag (mascot animations elsewhere) in sync.
  const setIsThinking = useCopilotStore((s) => s.setIsThinking);
  useEffect(() => {
    setIsThinking(isTyping);
  }, [isTyping, setIsThinking]);

  const [gameState, setGameState] = useState<{
    type: 'none' | 'trivia' | 'rps';
    score: number;
    triviaIndex: number;
  }>({ type: 'none', score: 0, triviaIndex: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Welcome line is virtual (not stored) so it follows the UI language.
  const messages: Message[] = storedMessages.length
    ? storedMessages
    : [{ id: 'welcome-1', sender: 'ai', text: getCopilotStrings(language).welcome, timestamp: '' }];

  useEffect(() => {
    if (embedded || isOpen) {
      setGreetingText(null);
      return;
    }

    const triggerGreeting = () => {
      const activeLang = language || 'en';
      const greetingList = LOCALIZED_GREETINGS[activeLang] || LOCALIZED_GREETINGS['en'];
      const randomGreeting = greetingList[Math.floor(Math.random() * greetingList.length)];
      setGreetingText(randomGreeting);

      setTimeout(() => {
        setGreetingText(null);
      }, 7000);
    };

    const initialTimeout = setTimeout(triggerGreeting, 5000);
    const interval = setInterval(triggerGreeting, 25000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [embedded, isOpen, language, setGreetingText, isEngineeringSolver]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);



  const handleGameAction = (value: string) => {
    const g = getCopilotGameStrings(language);
    const trivia = getTriviaQuestions(language);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rpsChoices: Record<string, string> = {
      rps_rock: `\u270a ${g.rpsRock}`,
      rps_paper: `\u270b ${g.rpsPaper}`,
      rps_scissors: `\u270c\ufe0f ${g.rpsScissors}`,
    };

    if (value === 'start_trivia') {
      setMessages(prev => [...prev, { id: `user-game-${Date.now()}`, sender: 'user', text: g.triviaStartLabel, timestamp: timeStr }]);
      setGameState({ type: 'trivia', score: 0, triviaIndex: 0 });
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const firstQ = trivia[0];
        setMessages(prev => [...prev, {
          id: `ai-game-${Date.now()}`,
          sender: 'ai',
          text: `**${g.questionN} 1:** ${firstQ.q}`,
          timestamp: timeStr,
          gameOptions: firstQ.options,
        }]);
      }, 600);
      return;
    }

    if (value === 'start_rps') {
      setMessages(prev => [...prev, { id: `user-game-${Date.now()}`, sender: 'user', text: g.rpsStartLabel, timestamp: timeStr }]);
      setGameState({ type: 'rps', score: 0, triviaIndex: 0 });
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `ai-game-${Date.now()}`,
          sender: 'ai',
          text: g.rpsPrompt,
          timestamp: timeStr,
          gameOptions: [
            { label: `\u270a ${g.rpsRock}`, value: 'rps_rock' },
            { label: `\u270b ${g.rpsPaper}`, value: 'rps_paper' },
            { label: `\u270c\ufe0f ${g.rpsScissors}`, value: 'rps_scissors' },
          ],
        }]);
      }, 600);
      return;
    }

    if (gameState.type === 'trivia') {
      const currentQ = trivia[gameState.triviaIndex];
      const selectedOption = currentQ.options.find(o => o.value === value);
      setMessages(prev => [...prev, {
        id: `user-game-${Date.now()}`,
        sender: 'user',
        text: selectedOption ? selectedOption.label : value,
        timestamp: timeStr,
      }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const isCorrect = value === currentQ.correct;
        const newScore = isCorrect ? gameState.score + 1 : gameState.score;
        const nextIndex = gameState.triviaIndex + 1;
        const correctLabel = currentQ.options.find(o => o.value === currentQ.correct)?.label;
        const feedback = isCorrect
          ? `\ud83c\udf89 **${g.triviaCorrect}**\n\n${currentQ.explanation}`
          : `\u274c **${g.triviaWrong}**\n\n${g.triviaCorrectWas}: **${correctLabel}**\n\n${currentQ.explanation}`;

        if (nextIndex < trivia.length) {
          const nextQ = trivia[nextIndex];
          setGameState(prev => ({ ...prev, score: newScore, triviaIndex: nextIndex }));
          setMessages(prev => [...prev, {
            id: `ai-game-${Date.now()}`,
            sender: 'ai',
            text: `${feedback}\n\n---\n\n**${g.questionN} ${nextIndex + 1}:** ${nextQ.q}`,
            timestamp: timeStr,
            gameOptions: nextQ.options,
          }]);
        } else {
          setGameState({ type: 'none', score: 0, triviaIndex: 0 });
          setMessages(prev => [...prev, {
            id: `ai-game-${Date.now()}`,
            sender: 'ai',
            text: `${feedback}\n\n\ud83c\udfc6 **${g.gameOver}:** **${newScore} / ${trivia.length}**\n\n${g.playAgainPrompt}`,
            timestamp: timeStr,
            gameOptions: [
              { label: `\ud83c\udfae ${g.newGame}`, value: 'game_menu' },
              { label: `\ud83c\udfad ${strings.tellJoke}`, value: 'joke' },
            ],
          }]);
        }
      }, 800);
      return;
    }

    if (gameState.type === 'rps') {
      setMessages(prev => [...prev, {
        id: `user-game-${Date.now()}`,
        sender: 'user',
        text: rpsChoices[value] || value,
        timestamp: timeStr,
      }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const options = ['rps_rock', 'rps_paper', 'rps_scissors'];
        const aiChoice = options[Math.floor(Math.random() * options.length)]!;
        let result = g.rpsLose;
        let newScore = gameState.score;
        if (value === aiChoice) result = g.rpsTie;
        else if (
          (value === 'rps_rock' && aiChoice === 'rps_scissors') ||
          (value === 'rps_paper' && aiChoice === 'rps_rock') ||
          (value === 'rps_scissors' && aiChoice === 'rps_paper')
        ) {
          result = g.rpsWin;
          newScore += 1;
        }
        setGameState(prev => ({ ...prev, score: newScore }));
        setMessages(prev => [...prev, {
          id: `ai-game-${Date.now()}`,
          sender: 'ai',
          text: `${g.rpsYourMove}: **${rpsChoices[value]}**\n${g.rpsMyMove}: **${rpsChoices[aiChoice]}**\n\n${result}\n\n${g.rpsScore}: **${newScore}**\n${g.rpsPlayAgain}`,
          timestamp: timeStr,
          gameOptions: [
            { label: `\u270a ${g.rpsRock}`, value: 'rps_rock' },
            { label: `\u270b ${g.rpsPaper}`, value: 'rps_paper' },
            { label: `\u270c\ufe0f ${g.rpsScissors}`, value: 'rps_scissors' },
            { label: `\ud83d\udd19 ${g.mainMenu}`, value: 'game_menu' },
          ],
        }]);
      }, 800);
      return;
    }

    if (value === 'game_menu') {
      setMessages(prev => [...prev, { id: `user-game-${Date.now()}`, sender: 'user', text: g.gameMenuUser, timestamp: timeStr }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `ai-game-${Date.now()}`,
          sender: 'ai',
          text: g.gameMenuPrompt,
          timestamp: timeStr,
          gameOptions: [
            { label: `\ud83c\udfae ${g.startTrivia}`, value: 'start_trivia' },
            { label: `\u270a ${g.startRps}`, value: 'start_rps' },
          ],
        }]);
      }, 500);
      return;
    }

    if (value === 'joke') handleJoke();
  };

  const handleJoke = () => {
    const g = getCopilotGameStrings(language);
    const localeStrings = getCopilotStrings(language);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, {
      id: `user-joke-${Date.now()}`,
      sender: 'user',
      text: g.jokeUserPrompt,
      timestamp: timeStr,
    }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const jokes = localeStrings.jokes;
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)] ?? jokes[0] ?? '';
      setMessages(prev => [...prev, {
        id: `ai-joke-${Date.now()}`,
        sender: 'ai',
        text: randomJoke,
        timestamp: timeStr,
        gameOptions: [
          { label: `\ud83c\udfad ${g.anotherJoke}`, value: 'joke' },
          { label: `\ud83c\udfae ${localeStrings.playGame}`, value: 'game_menu' },
        ],
      }]);
    }, 600);
  };

  const handleSend = async (override?: string) => {
    // `override` lets other surfaces (home ask box, open-copilot event) send a prompt
    // directly; click handlers may pass an event object, so only accept strings.
    const raw = typeof override === 'string' ? override : input;
    if (!raw.trim()) return;
    setInput('');
    playMascotChirp();
    await sendToAegis(raw, {
      language,
      pathname: window.location.pathname,
      thinkingSteps: strings.thinkingSteps,
      navigate: (href) => router.push(href),
    });
  };

  const handlePreset = (promptText: string) => {
    setInput(promptText);
  };

  // `alucalc:open-copilot` may carry { prompt, send }: prefill the input, or send it
  // once the panel is open (handled by the pending-prompt effect below).
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (embedded) return;
    const onOpen = (e: Event) => {
      setIsOpen(true);
      const detail = (e as CustomEvent<{ prompt?: unknown; send?: unknown } | null>).detail;
      const prompt = typeof detail?.prompt === 'string' ? detail.prompt.trim().slice(0, 2000) : '';
      if (!prompt) return;
      if (detail?.send === true) setPendingPrompt(prompt);
      else setInput(prompt);
    };
    window.addEventListener('alucalc:open-copilot', onOpen);
    return () => window.removeEventListener('alucalc:open-copilot', onOpen);
  }, [embedded, setIsOpen]);

  useEffect(() => {
    if (!pendingPrompt || !isOpen || isTyping) return;
    const text = pendingPrompt;
    setPendingPrompt(null);
    void handleSend(text);
    // handleSend is recreated every render; this effect only reacts to a new prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, isOpen, isTyping]);

  useEffect(() => {
    if (embedded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      // Ctrl + Space or Alt + C to toggle copilot
      if ((e.ctrlKey && e.key === ' ') || (e.altKey && e.key?.toLowerCase() === 'c')) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [embedded, isOpen, setIsOpen]);

  if (!mounted) return null;
  if (!embedded && pathname.includes('/widget')) return null;

  const panelClass = embedded
    ? 'relative w-full h-full z-0 border-0 shadow-none flex flex-col rounded-none'
    : `fixed inset-x-3 bottom-20 top-16 sm:top-auto sm:inset-x-auto sm:right-6 sm:bottom-[100px] sm:w-[400px] sm:h-[540px] sm:max-h-[calc(100dvh-120px)] z-[9991] bg-[var(--bg-1)] border border-[var(--line)] flex flex-col rounded-[var(--radius-m)] transition-all duration-300 ease-out transform ${
        isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
      }`;

  const chatPanel = (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className={panelClass}
    >
      {!embedded && (
        <div className="hidden sm:block absolute bottom-[-10px] right-[86px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[var(--cyan)]/30 filter drop-shadow-[0_4px_6px_rgba(0,229,255,0.25)]" />
      )}

      <div className={`flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--bg-0)] ${embedded ? '' : 'rounded-t-[var(--radius-m)]'}`}>
        <div className="flex items-center gap-2.5">
          <AegisMascot size={40} variant="face" pose={isTyping ? 'thinking' : 'idle'} />
          <div>
            <h3 className="text-xs font-mono font-black text-[var(--ink)] tracking-[0.15em] uppercase">{strings.title}</h3>
            <p className="text-[9px] text-[var(--muted)] font-mono tracking-wide">
              {language === 'tr' ? 'Baş Araştırma Mühendisi · Text-to-CAD' : language === 'en' ? 'Chief Research Engineer · Text-to-CAD' : strings.subtitle}
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--hover)] transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Quick Presets Carousel with Games & Jokes */}
      <div className="px-4 py-2.5 border-b border-[var(--line)] bg-[var(--bg-1)] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        <span className="text-[8px] font-mono font-bold text-[var(--muted)] uppercase tracking-wider shrink-0">{strings.promptsLabel}</span>
        {([
          ['/3d ', '🧊', language === 'tr' ? '3D model' : '3D model'],
          ['/2d ', '📐', language === 'tr' ? '2D çizim' : '2D drawing'],
          ['/flow ', '🔀', language === 'tr' ? 'Flow akışı' : 'Flow graph'],
        ] as const).map(([cmd, icon, label]) => (
          <button
            key={cmd}
            type="button"
            onClick={() => setInput((v) => (v.startsWith('/') ? cmd + v.replace(/^\/\S*\s*/, '') : cmd + v))}
            title={language === 'tr' ? `Text-to-CAD: "${cmd.trim()} …" ile yaz, AeGiS ilgili motora gönderir` : `Text-to-CAD: type "${cmd.trim()} …" and AeGiS routes it to the generator`}
            className="text-[9px] font-mono bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 text-[var(--cyan)] px-2.5 py-1 rounded-full whitespace-nowrap border border-[var(--cyan)]/30 transition-colors shrink-0"
          >
            {icon} {label}
          </button>
        ))}
        <div className="h-4 w-[1px] bg-white/10 shrink-0" />
        {isEngineeringSolver ? (
          <>
            <button
              onClick={() => handlePreset("Explain this standard")}
              className="text-[9px] font-mono bg-cyan-950/40 hover:bg-cyan-900/60 text-[var(--cyan)] px-2.5 py-1 rounded-full whitespace-nowrap border border-[var(--cyan)]/20 transition-colors shrink-0"
            >
              📐 Explain this standard
            </button>
            <button
              onClick={() => handlePreset("Check limits")}
              className="text-[9px] font-mono bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-amber-500/20 transition-colors shrink-0"
            >
              ⚠️ Check limits
            </button>
            <button
              onClick={() => handlePreset("PASS/FAIL rationale")}
              className="text-[9px] font-mono bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-emerald-500/20 transition-colors shrink-0"
            >
              ✅ PASS/FAIL rationale
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handlePreset("Explain standard")}
              className="text-[9px] font-mono bg-cyan-950/40 hover:bg-cyan-900/60 text-[var(--cyan)] px-2.5 py-1 rounded-full whitespace-nowrap border border-[var(--cyan)]/20 transition-colors shrink-0"
            >
              📐 Explain standard
            </button>
            <button
              onClick={() => handlePreset("Audit calculation")}
              className="text-[9px] font-mono bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-purple-500/20 transition-colors shrink-0"
            >
              🔍 Audit calculation
            </button>
            <button
              onClick={() => handlePreset("Check limits")}
              className="text-[9px] font-mono bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-amber-500/20 transition-colors shrink-0"
            >
              ⚠️ Check limits
            </button>
          </>
        )}
        <button
          onClick={() => resetAegis()}
          className="text-[9px] font-mono bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-rose-500/20 transition-colors shrink-0"
        >
          🗑️ {strings.clear}
        </button>
        <div className="h-4 w-[1px] bg-white/10 shrink-0" />
        <button
          onClick={() => handlePreset("Verify safety factor for S235 steel under 5000N load")}
          className="text-[9px] font-mono bg-[var(--bg-2)] hover:bg-[var(--hover)] text-[var(--alu)] px-2.5 py-1 rounded-full whitespace-nowrap border border-[var(--line)] transition-colors shrink-0"
        >
          {strings.presetS235}
        </button>
        <button
          onClick={() => handlePreset("Optimize dimensions for minimum deflection")}
          className="text-[9px] font-mono bg-[var(--bg-2)] hover:bg-[var(--hover)] text-[var(--alu)] px-2.5 py-1 rounded-full whitespace-nowrap border border-[var(--line)] transition-colors shrink-0"
        >
          {strings.presetDeflection}
        </button>
        <button
          onClick={() => handlePreset("What is this page and how does it work?")}
          className="text-[9px] font-mono bg-[var(--bg-2)] hover:bg-[var(--hover)] text-[var(--alu)] px-2.5 py-1 rounded-full whitespace-nowrap border border-[var(--line)] transition-colors shrink-0"
        >
          {strings.presetGuide}
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 flex items-center justify-center text-[var(--cyan)] shrink-0 mt-0.5 overflow-hidden">
                <AegisMascot size={24} variant="face" pose="idle" interactive={false} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-medium rounded-tr-none' : 'bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] rounded-tl-none font-mono'}`}
            >
              <div className="whitespace-pre-wrap word-break">
                {msg.text.split('**').map((part, index) => 
                  index % 2 === 1 ? <strong key={index} className={msg.sender === 'user' ? 'font-black' : (msg.intent?.showSupportButton ? 'text-red-400' : 'text-[var(--cyan)]')}>{part}</strong> : part
                )}
              </div>

              {msg.intent?.actionUrl && (
                <div className="mt-3 pt-2 border-t border-[var(--line)]">
                  <a
                    href={msg.intent.actionUrl}
                    onClick={(e) => {
                      const href = msg.intent?.actionUrl;
                      if (href && href.startsWith('/')) {
                        e.preventDefault();
                        router.push(href);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md ${msg.intent.showSupportButton ? 'bg-[var(--cyan)] text-[var(--accent-ink)] hover:bg-red-600' : 'bg-[var(--cyan)] text-[var(--accent-ink)] hover:bg-[var(--cyan)]/90'}`}
                  >
                    {msg.intent.showSupportButton && <AlertTriangle size={12} />}
                    <span>{msg.intent.actionLabel || strings.openWorkspace}</span>
                    <span className="text-[10px]">→</span>
                  </a>
                </div>
              )}

              {msg.intent && !msg.intent.replyOverride && (
                <div className="mt-2 pt-2 border-t border-[var(--line)] flex flex-wrap gap-1">
                  {msg.intent.materialType && (
                    <span className="text-[8px] bg-[var(--bg-2)] text-[var(--muted)] px-1.5 py-0.5 rounded border border-[var(--line)] uppercase">
                      Mat: {msg.intent.materialType}
                    </span>
                  )}
                  {msg.intent.forceApplied && (
                    <span className="text-[8px] bg-[var(--bg-2)] text-[var(--muted)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                      Load: {msg.intent.forceApplied}N
                    </span>
                  )}
                </div>
              )}

              {msg.gameOptions && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-2">
                  {msg.gameOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleGameAction(opt.value)}
                      className="px-2.5 py-1.5 bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/20 rounded-lg text-[10px] font-mono transition-all active:scale-95 flex items-center gap-1"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div suppressHydrationWarning className={`text-[8px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-[var(--accent-ink)]/60' : 'text-[var(--muted)]'}`}>
                {msg.timestamp}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-md bg-[var(--bg-3)] border border-[var(--line)] flex items-center justify-center text-[var(--alu)] shrink-0 mt-0.5">
                <User size={12} />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start items-start">
            <div className="w-7 h-7 rounded-lg bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 flex items-center justify-center text-[var(--cyan)] shrink-0 mt-0.5 overflow-hidden">
              <AegisMascot size={24} variant="face" pose="thinking" interactive={false} />
            </div>
            <div className="bg-[var(--bg-2)] border border-[var(--line)] rounded-xl px-3.5 py-3 text-[10px] font-mono text-[var(--cyan)]/70 max-w-[85%] rounded-tl-none space-y-1.5 flex flex-col shadow-lg">
              <div className="flex items-center gap-1.5 text-xs text-[var(--ink)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-ping" />
                <span>{strings.reasoningStream}</span>
              </div>
              {thinkingSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-1.5 opacity-80 animate-fade-in">
                  <span className="text-[var(--cyan)]">›</span>
                  <span>{step}</span>
                </div>
              ))}
              {thinkingSteps.length === 0 && (
                <div className="flex gap-1 items-center mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t border-[var(--line)] bg-[var(--bg-0)] safe-area-pb ${embedded ? '' : 'rounded-b-[var(--radius-m)]'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'tr' ? 'Soru sor ya da “/3d 80x80 braket” yaz…' : language === 'en' ? 'Ask, or type “/3d 80x80 bracket”…' : strings.placeholder}
            className="flex-1 bg-[var(--bg-2)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)]/50 font-mono transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="bg-[var(--cyan)] hover:bg-[var(--cyan)]/80 disabled:opacity-40 disabled:hover:bg-[var(--cyan)] text-[var(--accent-ink)] rounded-xl px-3.5 flex items-center justify-center transition-all active:scale-95"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[8px] font-mono text-[var(--muted)]">{strings.pressEnter}</span>
          <span className="text-[8px] font-mono text-[var(--cyan)]/60 flex items-center gap-1">
            <CheckCircle size={8} /> {strings.activeGovernance}
          </span>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="absolute inset-0 flex flex-col bg-[var(--bg-0)] overflow-hidden">
        {chatPanel}
      </div>
    );
  }

  return (
    <>
      {/* ═══ CLICK-OUTSIDE BACKDROP TO DISPERSE ═══ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] bg-black/40 sm:bg-transparent cursor-default"
          aria-hidden="true"
          onPointerDown={() => setIsOpen(false)}
        />
      )}

      {/* ═══ CHAT SPEECH BUBBLE PANEL (BOTTOM RIGHT) ═══ */}
      {chatPanel}
    </>
  );
};
