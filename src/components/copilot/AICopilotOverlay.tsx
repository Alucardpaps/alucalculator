"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, ChevronLeft, ChevronRight, Layers, AlertTriangle, CheckCircle } from 'lucide-react';
import { EngineeringCopilot, CopilotIntent } from '@/engine/copilot/copilot';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';
import { useCopilotStore } from '@/store/copilotStore';
import { usePathname } from 'next/navigation';
import { getCopilotStrings, getCopilotEngineLocale, getCopilotResponseLanguage } from '@/locales/copilotTranslations';
import { getCopilotGameStrings, getTriviaQuestions } from '@/locales/copilotGameTranslations';
import { AegisIcon } from './AegisIcon';

interface GameOption {
  label: string;
  value: string;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  intent?: CopilotIntent;
  gameOptions?: GameOption[];
}

const LOCALIZED_GREETINGS: Record<string, string[]> = {
  en: ["Need some help, engineer?", "Let's build something!", "Ask me anything!", "I can solve formulas!", "Let's check tolerances!"],
  tr: ["Yardım lazım mı mühendis?", "Hadi bir şeyler inşa edelim!", "Bana istediğini sor!", "Formülleri çözebilirim!", "Toleransları kontrol edelim!"],
  de: ["Brauchen Sie Hilfe, Ingenieur?", "Lass uns etwas bauen!", "Fragen Sie mich alles!", "Ich kann Formeln lösen!", "Toleranzen prüfen!"],
  es: ["¿Necesitas ayuda, ingeniero?", "¡Construyamos algo!", "¡Pregúntame lo que sea!", "¡Puedo resolver fórmulas!", "¡Ajustemos tolerancias!"],
  fr: ["Besoin d'aide, ingénieur?", "Bâtissons quelque chose!", "Demandez-moi n'importe quoi!", "Je résous vos formules!", "Vérifions les tolérances!"],
  it: ["Serve aiuto, ingegnere?", "Costruiamo qualcosa!", "Chiedimi qualsiasi cosa!", "Posso risolvere formule!", "Controlliamo le tolleranze!"],
  pt: ["Precisa de ajuda, engenheiro?", "Vamos construir algo!", "Pergunte-me qualquer coisa!", "Posso resolver fórmulas!", "Vamos testar tolerâncias!"],
  ru: ["Нужна помощь, инженер?", "Давайте что-нибудь построим!", "Спросите меня о чем угодно!", "Я умею решать формулы!", "Проверим допуски!"],
  zh: ["需要帮助吗，工程师？", "让我们建造点什么！", "问我任何问题！", "我能解析公式！", "来检查一下公差吧！"],
  ja: ["エンジニアさん、お手伝いしましょうか？", "何か作りましょう！", "何でも聞いてください！", "公式の計算もできますよ！", "公差を確認しましょう！"],
  ko: ["도움이 필요하신가요, 엔지니어님?", "함께 무언가를 만들어봐요!", "무엇이든 물어보세요!", "공식을 계산할 수 있어요!", "공차를 확인해볼까요?"],
  ar: ["هل تحتاج إلى مساعدة، أيها المهندس؟", "دعنا نبني شيئاً!", "اسألني عن أي شيء!", "يمكنني حل المعادلات!", "دعنا نتحقق من التفاوتات!"]
};

const hexagonsData = [
  { id: 1, size: 28, baseLeft: 12, baseTop: '42%', delay: 0, xRange: [0, 8, -6, 0], yRange: [0, -12, 10, 0], duration: 6 },
  { id: 2, size: 22, baseLeft: 28, baseTop: '46%', delay: 0.4, xRange: [0, -6, 8, 0], yRange: [0, 10, -6, 0], duration: 8 },
  { id: 3, size: 34, baseLeft: 8, baseTop: '52%', delay: 0.8, xRange: [0, 10, -10, 0], yRange: [0, -6, 12, 0], duration: 7 },
  { id: 4, size: 26, baseLeft: 32, baseTop: '58%', delay: 1.2, xRange: [0, -8, 6, 0], yRange: [0, 12, -10, 0], duration: 9 },
  { id: 5, size: 30, baseLeft: 16, baseTop: '64%', delay: 1.6, xRange: [0, 6, -8, 0], yRange: [0, -10, 6, 0], duration: 5 }
];

export const AICopilotOverlay: React.FC = () => {
  const { language } = useI18nStore();
  const strings = getCopilotStrings(language);
  const { isOpen, setIsOpen, greetingText, setGreetingText, mousePos } = useCopilotStore();
  const pathname = usePathname();
  const isWorkspace = pathname?.startsWith('/workspace');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

  const [gameState, setGameState] = useState<{
    type: 'none' | 'trivia' | 'rps';
    score: number;
    triviaIndex: number;
  }>({ type: 'none', score: 0, triviaIndex: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const copilotEngine = useRef(new EngineeringCopilot());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome-1',
        sender: 'ai',
        text: getCopilotStrings(language).welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [language]);

  useEffect(() => {
    if (isOpen) {
      setGreetingText(null);
      return;
    }

    const triggerGreeting = () => {
      const activeLang = language || 'en';
      const localeStrings = getCopilotStrings(activeLang);
      const isJoke = Math.random() < 0.6;

      if (isJoke && localeStrings.jokes.length > 0) {
        const randomJoke = localeStrings.jokes[Math.floor(Math.random() * localeStrings.jokes.length)];
        setGreetingText(`🎭 ${randomJoke}`);
      } else {
        const greetingList = LOCALIZED_GREETINGS[activeLang] || LOCALIZED_GREETINGS['en'];
        const randomGreeting = greetingList[Math.floor(Math.random() * greetingList.length)];
        setGreetingText(`🤖 ${randomGreeting}`);
      }

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
  }, [isOpen, language, setGreetingText]);

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setThinkingSteps([]);

    const steps = strings.thinkingSteps;
    
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setThinkingSteps(prev => [...prev, steps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    try {
      const historyPayload = messages
        .filter(m => m.id !== 'welcome-1')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      let response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: userText,
          context: window.location.pathname,
          history: historyPayload,
          language,
        })
      }).catch(async (err) => {
        console.warn("[Copilot Overlay] Primary API route failed, trying PHP fallback:", err);
        return await fetch('/api/ai/copilot/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: userText,
            context: window.location.pathname,
            history: historyPayload,
            language,
          })
        });
      });

      if (response.status === 404) {
        console.warn("[Copilot Overlay] Primary API route returned 404, trying PHP fallback.");
        response = await fetch('/api/ai/copilot/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: userText,
            context: window.location.pathname,
            history: historyPayload,
            language,
          })
        });
      }

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      
      clearInterval(interval);
      setThinkingSteps(prev => [...prev, "Generative content resolved successfully."]);
      
      setTimeout(() => {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intent: {
            actionUrl: data.actionUrl,
            actionLabel: data.actionLabel,
            showSupportButton: data.showSupportButton,
            assumptionsMade: []
          }
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 400);

    } catch (err) {
      clearInterval(interval);
      setThinkingSteps((prev) => [...prev, strings.fallbackQuotaSteps[0]]);

      setTimeout(() => {
        try {
          const parsedIntent = copilotEngine.current.parseAndAssume(
            userText,
            window.location.pathname,
            getCopilotEngineLocale(language),
          );
          
          let replyText = '';
          if (parsedIntent.replyOverride) {
            replyText = parsedIntent.replyOverride;
          } else {
            replyText = `I analyzed your parameters. `;
            if (parsedIntent.materialType && parsedIntent.materialType !== 'unknown') {
              replyText += `Detected Material: **${parsedIntent.materialType.toUpperCase()}** `;
              if (parsedIntent.alloyOrGrade) {
                replyText += `(${parsedIntent.alloyOrGrade}). `;
              } else {
                replyText += `. `;
              }
            }
            
            if (parsedIntent.forceApplied) {
              replyText += `Target Load: **${parsedIntent.forceApplied} N**. `;
            }
            
            if (parsedIntent.assumptionsMade && parsedIntent.assumptionsMade.length > 0) {
              replyText += `\n\n**Smart Assumptions Applied:**\n` + parsedIntent.assumptionsMade.map(a => `• ${a}`).join('\n');
            } else {
          replyText += `\n\nMethodology adheres strictly to established structural boundary conditions. Ready for solver mapping.`;
            }
          }

          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            intent: parsedIntent
          };

          setMessages(prev => [...prev, aiMsg]);
        } catch (localErr) {
          const errorMsg: Message = {
            id: `ai-err-${Date.now()}`,
            sender: 'ai',
            text: strings.fallbackQuotaSteps[strings.fallbackQuotaSteps.length - 1] || "Error processing request.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, errorMsg]);
        } finally {
          setIsTyping(false);
        }
      }, 1000);
    }
  };

  const handlePreset = (promptText: string) => {
    setInput(promptText);
  };

  useEffect(() => {
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
  }, [isOpen, setIsOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && !isWorkspace && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-14 right-4 z-[9990] w-12 h-12 rounded-full bg-gradient-to-br from-slate-950 to-[#0a1628] hover:from-[#051020] hover:to-[#0a1a30] flex items-center justify-center shadow-[0_0_24px_rgba(0,229,255,0.35)] hover:shadow-[0_0_32px_rgba(0,229,255,0.55)] hover:scale-110 active:scale-95 transition-all cursor-pointer border border-[#00e5ff]/20"
          title="Open AeGiS (Alt+C)"
        >
          <AegisIcon size={30} mode="idle" />
        </motion.button>
      )}

      {/* ═══ CLICK-OUTSIDE BACKDROP TO DISPERSE ═══ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] bg-black/20 backdrop-blur-[2px] cursor-default"
          aria-hidden="true"
          onPointerDown={() => setIsOpen(false)}
        />
      )}

      {/* ═══ IDLE GREETING / JOKE BUBBLE NEAR CURSOR ═══ */}
      <AnimatePresence>
        {!isOpen && greetingText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[10000] bg-slate-950/95 border border-[#00e5ff]/40 text-[#00e5ff] px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.4)] text-[12px] font-mono select-none max-w-xs whitespace-pre-wrap leading-relaxed pointer-events-none"
            style={{
              left: Math.max(20, Math.min(window.innerWidth - 300, mousePos.x + 20)),
              top: Math.max(20, Math.min(window.innerHeight - 150, mousePos.y - 60)),
            }}
          >
            {/* Small speech bubble arrow tail */}
            <div className="absolute right-full top-6 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-slate-950 border-b-[6px] border-b-transparent" />
            {greetingText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CHAT SPEECH BUBBLE PANEL (LEFT SIDE) ═══ */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className={`fixed left-24 top-1/2 -translate-y-1/2 w-[380px] max-w-[90vw] h-[550px] z-[9991] glass-hud-panel border border-[#00e5ff]/30 shadow-2xl flex flex-col rounded-2xl transition-all duration-400 ease-out transform ${isOpen ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-10 opacity-0 scale-95 pointer-events-none'}`}
      >
        {/* Speech Bubble Arrow Tail */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-[#00e5ff]/30 border-b-[8px] border-b-transparent filter drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <AegisIcon size={34} mode="active" />
            <div>
              <h3 className="text-xs font-mono font-black text-white tracking-[0.15em] uppercase">{strings.title}</h3>
              <p className="text-[9px] text-[#00e5ff]/60 font-mono tracking-widest">{strings.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets Carousel with Games & Jokes */}
        <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.01] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0">{strings.promptsLabel}</span>
          <button
            onClick={() => handleGameAction('game_menu')}
            className="text-[9px] font-mono bg-cyan-950/40 hover:bg-cyan-900/60 text-[#00e5ff] px-2.5 py-1 rounded-full whitespace-nowrap border border-[#00e5ff]/20 transition-colors flex items-center gap-1 shrink-0"
          >
            🎮 {strings.playGame}
          </button>
          <button
            onClick={handleJoke}
            className="text-[9px] font-mono bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-purple-500/20 transition-colors shrink-0"
          >
            🎭 {strings.tellJoke}
          </button>
          <button
            onClick={() => setMessages([
              {
                id: 'welcome-1',
                sender: 'ai',
                text: strings.welcome,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ])}
            className="text-[9px] font-mono bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-rose-500/20 transition-colors shrink-0"
          >
            🗑️ {strings.clear}
          </button>
          <div className="h-4 w-[1px] bg-white/10 shrink-0" />
          <button
            onClick={() => handlePreset("Verify safety factor for S235 steel under 5000N load")}
            className="text-[9px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-white/5 transition-colors shrink-0"
          >
            {strings.presetS235}
          </button>
          <button
            onClick={() => handlePreset("Optimize dimensions for minimum deflection")}
            className="text-[9px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-white/5 transition-colors shrink-0"
          >
            {strings.presetDeflection}
          </button>
          <button
            onClick={() => handlePreset("What is this page and how does it work?")}
            className="text-[9px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-white/5 transition-colors shrink-0"
          >
            {strings.presetGuide}
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0 mt-0.5">
                  <Bot size={12} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-[#00e5ff] text-slate-950 font-medium rounded-tr-none' : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none font-mono'}`}
              >
                {/* Basic pseudo markdown formatting support */}
                <div className="whitespace-pre-wrap word-break">
                  {msg.text.split('**').map((part, index) => 
                    index % 2 === 1 ? <strong key={index} className={msg.sender === 'user' ? 'font-black' : (msg.intent?.showSupportButton ? 'text-red-400' : 'text-[#00e5ff]')}>{part}</strong> : part
                  )}
                </div>

                {/* Optional Action Button / Routing Link */}
                {msg.intent?.actionUrl && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <a
                      href={msg.intent.actionUrl}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md ${msg.intent.showSupportButton ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00e5ff] text-slate-950 hover:bg-[#00e5ff]/90'}`}
                    >
                      {msg.intent.showSupportButton && <AlertTriangle size={12} />}
                      <span>{msg.intent.actionLabel || strings.openWorkspace}</span>
                      <span className="text-[10px]">→</span>
                    </a>
                  </div>
                )}

                {/* Optional Intent Payload Visualizer */}
                {msg.intent && !msg.intent.replyOverride && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                    {msg.intent.materialType && (
                      <span className="text-[8px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                        Mat: {msg.intent.materialType}
                      </span>
                    )}
                    {msg.intent.forceApplied && (
                      <span className="text-[8px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                        Load: {msg.intent.forceApplied}N
                      </span>
                    )}
                  </div>
                )}

                {/* Interactive Game Options inside message */}
                {msg.gameOptions && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-2">
                    {msg.gameOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleGameAction(opt.value)}
                        className="px-2.5 py-1.5 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/25 text-[#00e5ff] border border-[#00e5ff]/20 rounded-lg text-[10px] font-mono transition-all active:scale-95 flex items-center gap-1"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div suppressHydrationWarning className={`text-[8px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-slate-950/60' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </div>
              </div>
              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User size={12} />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start items-start">
              <div className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0 mt-0.5 animate-pulse">
                <Sparkles size={12} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-[10px] font-mono text-[#00e5ff]/70 max-w-[85%] rounded-tl-none space-y-1.5 flex flex-col shadow-lg">
                <div className="flex items-center gap-1.5 text-xs text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
                  <span>{strings.reasoningStream}</span>
                </div>
                {thinkingSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 opacity-80 animate-fade-in">
                    <span className="text-[#00e5ff]">›</span>
                    <span>{step}</span>
                  </div>
                ))}
                {thinkingSteps.length === 0 && (
                  <div className="flex gap-1 items-center mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/40 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={strings.placeholder}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00e5ff]/50 font-mono transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-[#00e5ff] hover:bg-[#00e5ff]/80 disabled:opacity-40 disabled:hover:bg-[#00e5ff] text-slate-950 rounded-xl px-3.5 flex items-center justify-center transition-all active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[8px] font-mono text-slate-500">{strings.pressEnter}</span>
            <span className="text-[8px] font-mono text-[#00e5ff]/60 flex items-center gap-1">
              <CheckCircle size={8} /> {strings.activeGovernance}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
