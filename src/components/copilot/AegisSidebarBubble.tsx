'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Maximize2, Send, ChevronRight, RotateCcw, Bot, User, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { AegisMascot } from './AegisMascot';
import { useCopilotStore } from '@/store/copilotStore';
import { useI18nStore, type Language } from '@/store/i18nStore';
import { EngineeringCopilot, type CopilotIntent } from '@/engine/copilot/copilot';
import { getCopilotEngineLocale } from '@/locales/copilotTranslations';
import { motion, AnimatePresence } from 'framer-motion';

interface AegisSidebarBubbleProps {
  collapsed?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  intent?: CopilotIntent;
}

const BUBBLE_TEXTS: Record<Language, {
  title: string;
  subtitle: string;
  greeting: string;
  quickActions: string;
  askPlaceholder: string;
  askBtn: string;
  expandTooltip: string;
  closeTooltip: string;
  resetTooltip: string;
  thinking: string;
  actions: Array<{ label: string; prompt: string }>;
}> = {
  tr: {
    title: 'AeGiS Copilot',
    subtitle: 'Mühendislik Asistanı',
    greeting: 'Merhaba Mühendis! Hangi formül, malzeme veya CAD işleminde yardımcı olabilirim?',
    quickActions: 'Hızlı Mühendislik Konuları:',
    askPlaceholder: 'Soru veya formül yazın...',
    askBtn: 'Sor',
    expandTooltip: 'Tam Ekran Moduna Geç',
    closeTooltip: 'Kapat',
    resetTooltip: 'Sohbeti Sıfırla',
    thinking: 'AeGiS analiz ediyor...',
    actions: [
      { label: '🔩 Cıvata Torku (VDI 2230)', prompt: 'M12 cıvata için 8.8 kalitede sıkma torku nasıl hesaplanır?' },
      { label: '⚙️ Rulman Ömrü (ISO 281)', prompt: 'ISO 281 L10h rulman ömrü hesabı nasıl yapılır?' },
      { label: '📐 Kiriş Eğilmesi (Euler)', prompt: 'Konsol kiriş ucundaki tekil yük sehim formülü nedir?' },
      { label: '🧪 6061-T6 Alüminyum', prompt: 'Alüminyum 6061-T6 akma dayanımı ve özellikleri nelerdir?' },
    ],
  },
  en: {
    title: 'AeGiS Copilot',
    subtitle: 'Engineering Assistant',
    greeting: 'Hello Engineer! Which formula, material, or 3D CAD modeling task can I assist with?',
    quickActions: 'Quick Engineering Topics:',
    askPlaceholder: 'Ask a formula or question...',
    askBtn: 'Ask',
    expandTooltip: 'Open Fullscreen Mode',
    closeTooltip: 'Close',
    resetTooltip: 'Reset Chat',
    thinking: 'AeGiS is analyzing...',
    actions: [
      { label: '🔩 Bolt Torque (VDI 2230)', prompt: 'How is tightening torque calculated for M12 grade 8.8?' },
      { label: '⚙️ Bearing Life (ISO 281)', prompt: 'How is ISO 281 L10h bearing rated life calculated?' },
      { label: '📐 Beam Deflection', prompt: 'What is the cantilever beam end-load deflection formula?' },
      { label: '🧪 6061-T6 Aluminum', prompt: 'What are the yield strength and modulus of 6061-T6 aluminum?' },
    ],
  },
  zh: {
    title: 'AeGiS Copilot',
    subtitle: '工程智能副驾驶',
    greeting: '您好，工程师！需要进行哪项力学求解、公差核对或 3D CAD 建模？',
    quickActions: '快速工程推导与求解：',
    askPlaceholder: '输入公式或工程问题...',
    askBtn: '发送',
    expandTooltip: '展开全屏模式',
    closeTooltip: '关闭',
    resetTooltip: '清空会话',
    thinking: 'AeGiS 正在计算与解析...',
    actions: [
      { label: '🔩 螺栓预紧力矩 (VDI 2230)', prompt: '请给出 M12 8.8 级螺栓的标准拧紧力矩计算过程。' },
      { label: '⚙️ 轴承额定寿命 (ISO 281)', prompt: '如何根据 ISO 281 标准计算滚动轴承的 L10h 寿命？' },
      { label: '📐 悬臂梁弯曲挠度计算', prompt: '悬臂梁末端集中载荷下的最大挠度与应力公式是什么？' },
      { label: '🧪 6061-T6 铝合金参数', prompt: '请列出 6061-T6 铝合金的屈服强度与弹性模量。' },
    ],
  },
  ar: {
    title: 'مساعد AeGiS الهندسي',
    subtitle: 'الذكاء الاصطناعي للمهندسين',
    greeting: 'مرحباً أيها المهندس! ما هي الحسابات الميكانيكية أو نمذجة CAD التي تود تحليلها اليوم؟',
    quickActions: 'موضوعات هندسية سريعة:',
    askPlaceholder: 'اكتب سؤالك الهندسي...',
    askBtn: 'إرسال',
    expandTooltip: 'فتح ملء الشاشة',
    closeTooltip: 'إغلاق',
    resetTooltip: 'إعادة ضبط المحادثة',
    thinking: 'جاري التحليل والمعالجة...',
    actions: [
      { label: '🔩 عزم ربط المسامير (VDI 2230)', prompt: 'كيف يتم حساب عزم الربط لمسمار M12 برتبة 8.8؟' },
      { label: '⚙️ عمر المحامل (ISO 281)', prompt: 'ما هي معادلة حساب عمر المحمل L10h وفق ISO 281؟' },
      { label: '📐 انحناء العوارض (Euler)', prompt: 'ما هي معادلة انحناء العارضة الكابولية تحت حمل نقطي؟' },
      { label: '🧪 ألومنيوم 6061-T6', prompt: 'ما هي مواصفات وقوة الخضوع للألومنيوم 6061-T6؟' },
    ],
  },
  de: {
    title: 'AeGiS Copilot',
    subtitle: 'Ingenieur-Assistent',
    greeting: 'Hallo Ingenieur! Bei welcher Berechnung oder CAD-Modellierung kann ich helfen?',
    quickActions: 'Schnelle Themen:',
    askPlaceholder: 'Frage eingeben...',
    askBtn: 'Senden',
    expandTooltip: 'Vollbildmodus',
    closeTooltip: 'Schließen',
    resetTooltip: 'Chat zurücksetzen',
    thinking: 'AeGiS analysiert...',
    actions: [
      { label: '🔩 Anziehdrehmoment (VDI 2230)', prompt: 'Wie berechnet man das Anziehdrehmoment für M12 8.8?' },
      { label: '⚙️ Lagerlebensdauer (ISO 281)', prompt: 'Wie wird die L10h Lebensdauer nach ISO 281 berechnet?' },
      { label: '📐 Balkendurchbiegung', prompt: 'Wie lautet die Durchbiegungsformel für Kragträger?' },
      { label: '🧪 6061-T6 Aluminium', prompt: 'Was sind Streckgrenze und E-Modul von 6061-T6?' },
    ],
  },
  es: {
    title: 'AeGiS Copilot',
    subtitle: 'Asistente de Ingeniería',
    greeting: '¡Hola Ingeniero! ¿En qué cálculo o modelado 3D CAD puedo ayudarte hoy?',
    quickActions: 'Temas Rápidos:',
    askPlaceholder: 'Escribe una pregunta...',
    askBtn: 'Enviar',
    expandTooltip: 'Pantalla completa',
    closeTooltip: 'Cerrar',
    resetTooltip: 'Reiniciar chat',
    thinking: 'AeGiS está analizando...',
    actions: [
      { label: '🔩 Par de Apriete (VDI 2230)', prompt: '¿Cómo calcular el par de apriete para tornillo M12 8.8?' },
      { label: '⚙️ Vida de Rodamientos (ISO 281)', prompt: '¿Cómo se calcula la vida L10h según ISO 281?' },
      { label: '📐 Deflexión de Vigas', prompt: '¿Cuál es la fórmula de deflexión para viga en voladizo?' },
      { label: '🧪 Aluminio 6061-T6', prompt: '¿Cuáles son el límite elástico y módulo de 6061-T6?' },
    ],
  },
  fr: {
    title: 'AeGiS Copilot',
    subtitle: "Assistant d'Ingénierie",
    greeting: 'Bonjour Ingénieur ! Quel calcul ou modélisation 3D puis-je vous aider à réaliser ?',
    quickActions: 'Sujets Rapides :',
    askPlaceholder: 'Posez une question...',
    askBtn: 'Envoyer',
    expandTooltip: 'Plein écran',
    closeTooltip: 'Fermer',
    resetTooltip: 'Réinitialiser',
    thinking: 'AeGiS analyse...',
    actions: [
      { label: '🔩 Couple de Serrage (VDI 2230)', prompt: 'Comment calculer le couple de serrage pour M12 8.8 ?' },
      { label: '⚙️ Durée de Roulement (ISO 281)', prompt: 'Comment calculer la durée L10h selon ISO 281 ?' },
      { label: '📐 Flèche de Poutre', prompt: 'Quelle est la formule de flèche pour une poutre en porte-à-faux ?' },
      { label: '🧪 Aluminium 6061-T6', prompt: 'Quelles sont les caractéristiques de l\'aluminium 6061-T6 ?' },
    ],
  },
  it: {
    title: 'AeGiS Copilot',
    subtitle: 'Assistente di Ingegneria',
    greeting: 'Ciao Ingegnere! In quale calcolo o modellazione 3D posso assisterti oggi?',
    quickActions: 'Argomenti Rapidi:',
    askPlaceholder: 'Fai una domanda...',
    askBtn: 'Invia',
    expandTooltip: 'Schermo intero',
    closeTooltip: 'Chiudi',
    resetTooltip: 'Reimposta',
    thinking: 'AeGiS sta analizzando...',
    actions: [
      { label: '🔩 Coppia Serraggio (VDI 2230)', prompt: 'Come si calcola la coppia di serraggio per vite M12 8.8?' },
      { label: '⚙️ Vita Cuscinetti (ISO 281)', prompt: 'Come si calcola la durata L10h secondo ISO 281?' },
      { label: '📐 Flessione Trave', prompt: 'Qual è la formula della freccia per trave a sbalzo?' },
      { label: '🧪 Alluminio 6061-T6', prompt: 'Quali sono il carico di snervamento e modulo per 6061-T6?' },
    ],
  },
  pt: {
    title: 'AeGiS Copilot',
    subtitle: 'Assistente de Engenharia',
    greeting: 'Olá Engenheiro! Em qual cálculo ou modelagem 3D posso ajudar hoje?',
    quickActions: 'Tópicos Rápidos:',
    askPlaceholder: 'Faça uma pergunta...',
    askBtn: 'Enviar',
    expandTooltip: 'Tela cheia',
    closeTooltip: 'Fechar',
    resetTooltip: 'Reiniciar',
    thinking: 'AeGiS está analisando...',
    actions: [
      { label: '🔩 Torque de Aperto (VDI 2230)', prompt: 'Como calcular torque de aperto para parafuso M12 8.8?' },
      { label: '⚙️ Vida de Rolamentos (ISO 281)', prompt: 'Como calcular vida L10h segundo ISO 281?' },
      { label: '📐 Deflexão de Vigas', prompt: 'Qual a fórmula de deflexão para viga em balanço?' },
      { label: '🧪 Alumínio 6061-T6', prompt: 'Quais são o limite de escoamento e módulo do 6061-T6?' },
    ],
  },
  ru: {
    title: 'AeGiS Copilot',
    subtitle: 'Инженерный ассистент',
    greeting: 'Здравствуйте, инженер! В каких расчетах или 3D CAD моделировании вам помочь?',
    quickActions: 'Быстрые темы:',
    askPlaceholder: 'Задайте вопрос...',
    askBtn: 'Спросить',
    expandTooltip: 'Полный экран',
    closeTooltip: 'Закрыть',
    resetTooltip: 'Сбросить чат',
    thinking: 'AeGiS анализирует...',
    actions: [
      { label: '🔩 Момент затяжки (VDI 2230)', prompt: 'Как рассчитать момент затяжки для болта M12 класса 8.8?' },
      { label: '⚙️ Ресурс подшипников (ISO 281)', prompt: 'Как рассчитать ресурс подшипника L10h по ISO 281?' },
      { label: '📐 Прогиб консольной балки', prompt: 'Какова формула прогиба консольной балки при точечной нагрузке?' },
      { label: '🧪 Алюминий 6061-T6', prompt: 'Каковы предел текучести и модуль упругости сплава 6061-T6?' },
    ],
  },
  ja: {
    title: 'AeGiS Copilot',
    subtitle: 'エンジニアリングアシスタント',
    greeting: 'エンジニアさん、こんにちは！計算や 3D CAD モデリングでお手伝いできることはありますか？',
    quickActions: 'クイック項目：',
    askPlaceholder: '質問を入力...',
    askBtn: '送信',
    expandTooltip: '全画面モード',
    closeTooltip: '閉じる',
    resetTooltip: 'リセット',
    thinking: 'AeGiS 解析中...',
    actions: [
      { label: '🔩 ボルト締付トルク (VDI 2230)', prompt: 'M12 強度区分 8.8 ボルトの適正締付トルクの求め方は？' },
      { label: '⚙️ 軸受定格寿命 (ISO 281)', prompt: 'ISO 281 に基づく軸受 L10h 寿命計算式は？' },
      { label: '📐 片持ち梁のたわみ計算', prompt: '集中荷重を受ける片持ち梁の最大たわみ公式は？' },
      { label: '🧪 6061-T6 アルミニウム', prompt: '6061-T6 アルミニウムの降伏強度とヤング率は？' },
    ],
  },
  ko: {
    title: 'AeGiS Copilot',
    subtitle: '엔지니어링 코파일럿',
    greeting: '엔지니어님, 안녕하세요! 어떤 계산이나 3D CAD 모델링을 도와드릴까요?',
    quickActions: '빠른 질문:',
    askPlaceholder: '질문 입력...',
    askBtn: '질문',
    expandTooltip: '전체화면',
    closeTooltip: '닫기',
    resetTooltip: '대화 초기화',
    thinking: 'AeGiS 분석 중...',
    actions: [
      { label: '🔩 볼트 조임 토크 (VDI 2230)', prompt: 'M12 8.8 등급 볼트의 적정 체결 토크 계산 방법은?' },
      { label: '⚙️ 베어링 수명 (ISO 281)', prompt: 'ISO 281에 따른 L10h 베어링 수명 계산식은?' },
      { label: '📐 캔틸레버 보 처짐 계산', prompt: '집중 하중을 받는 외팔보의 최대 처짐 공식은?' },
      { label: '🧪 6061-T6 알루미늄', prompt: '6061-T6 알루미늄의 항복강도 및 탄성계수는?' },
    ],
  },
};

export function AegisSidebarBubble({ collapsed = false }: AegisSidebarBubbleProps) {
  const { language } = useI18nStore();
  const { setIsOpen } = useCopilotStore();
  const [isOpenLocal, setIsOpenLocal] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const copilotEngine = useRef<EngineeringCopilot>(new EngineeringCopilot());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = BUBBLE_TEXTS[language] || BUBBLE_TEXTS.en;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'ai',
      text: t.greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Sync initial greeting when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'init-1') {
        return [
          {
            id: 'init-1',
            sender: 'ai',
            text: t.greeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language, t.greeting]);

  // Auto-scroll inside chat messages
  useEffect(() => {
    if (isOpenLocal) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpenLocal]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenLocal(false);
      }
    }
    if (isOpenLocal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpenLocal]);

  const handleSendMessage = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsThinking(true);

    setTimeout(() => {
      try {
        const intent = copilotEngine.current.parseAndAssume(
          userText,
          typeof window !== 'undefined' ? window.location.pathname : '/',
          getCopilotEngineLocale(language),
        );

        let replyText = intent.replyOverride || '';
        if (!replyText) {
          replyText = `Mühendislik hesaplama parametreleri analiz edildi.`;
          if (intent.assumptionsMade && intent.assumptionsMade.length > 0) {
            replyText += `\n\n📌 **Uygulanan Varsayımlar:**\n` + intent.assumptionsMade.map((a) => `• ${a}`).join('\n');
          }
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intent,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: 'ai',
            text: 'Hesaplama analizi sırasında bir hata oluştu.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    }, 450);
  };

  const handleResetChat = () => {
    copilotEngine.current.resetState();
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'ai',
        text: t.greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ─── UNIFIED GROWING & ELONGATING CARD CONTAINER ─── */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 27,
          mass: 0.8,
        }}
        className={`w-full rounded-2xl border transition-colors overflow-hidden ${
          isOpenLocal
            ? 'bg-[#090e18]/98 border-cyan-400 shadow-[0_0_35px_rgba(0,229,255,0.25)] ring-1 ring-cyan-400/40'
            : 'bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border-cyan-500/30 hover:border-cyan-400 hover:from-cyan-950/60'
        }`}
      >
        {/* ─── HEADER BAR (Slides up smoothly when expanding) ─── */}
        <div
          onClick={() => !isOpenLocal && setIsOpenLocal(true)}
          className={`flex items-center justify-between p-2.5 transition-all select-none ${
            !isOpenLocal ? 'cursor-pointer' : 'border-b border-white/10 bg-[#060a12]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AegisMascot size={isOpenLocal ? 30 : 34} variant="face" pose={isThinking ? 'thinking' : 'auto'} />
            <div className="min-w-0 truncate">
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 truncate">
                <span>{t.title}</span>
                <Sparkles size={11} className="text-cyan-400 animate-pulse shrink-0" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
              </div>
              <div className="text-[8.5px] font-mono text-slate-400 truncate">
                {t.subtitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {isOpenLocal ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetChat();
                  }}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t.resetTooltip}
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenLocal(false);
                    setIsOpen(true);
                  }}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white transition-colors"
                  title={t.expandTooltip}
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenLocal(false);
                  }}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t.closeTooltip}
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <div className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20">
                ASK
              </div>
            )}
          </div>
        </div>

        {/* ─── LIVE EXPANDED CHAT CONVERSATION STREAM ─── */}
        <AnimatePresence>
          {isOpenLocal && (
            <motion.div
              key="sidebar-live-chat"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col overflow-hidden"
            >
              {/* Message History List */}
              <div className="max-h-56 overflow-y-auto p-3 space-y-2.5 custom-scrollbar text-xs font-mono">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-xl p-2.5 text-[11px] leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-cyan-600 text-slate-950 font-bold rounded-br-xs'
                          : 'bg-[#0f1726] border border-cyan-500/20 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Action Link (if any detected intent has solver URL) */}
                      {msg.intent?.actionUrl && (
                        <div className="mt-2 pt-1.5 border-t border-white/10">
                          <Link
                            href={msg.intent.actionUrl}
                            onClick={() => setIsOpenLocal(false)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/30 transition-colors"
                          >
                            <span>{msg.intent.actionLabel || 'Modüle Git'}</span>
                            <ArrowUpRight size={11} />
                          </Link>
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-500 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Thinking Indicator */}
                {isThinking && (
                  <div className="flex items-center gap-2 text-cyan-400 text-[10.5px] p-2 bg-cyan-950/30 rounded-xl border border-cyan-500/20 animate-pulse">
                    <Sparkles size={13} className="animate-spin" />
                    <span>{t.thinking}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Topics Pill Bar (when conversation is fresh) */}
              {messages.length <= 2 && (
                <div className="px-3 pb-2 pt-1 border-t border-white/5 space-y-1">
                  <p className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    {t.quickActions}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {t.actions.map((act, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(act.prompt)}
                        className="flex items-center justify-between w-full px-2 py-1 rounded-lg bg-white/[0.02] hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200 text-[9.5px] font-mono transition-all text-left group min-w-0"
                      >
                        <span className="truncate flex-1 min-w-0">{act.label}</span>
                        <ChevronRight size={10} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form at Bottom of Expanded Card */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputVal);
                }}
                className="flex items-center gap-1.5 p-2.5 border-t border-white/10 bg-[#060a12]"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={t.askPlaceholder}
                  className="min-w-0 flex-1 rounded-xl bg-black/70 border border-white/15 px-2.5 py-1.5 text-[10.5px] text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all truncate"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isThinking}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black font-mono text-[9.5px] uppercase hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20 shrink-0 disabled:opacity-40"
                >
                  <Send size={10} className="stroke-[2.5]" />
                  <span>{t.askBtn}</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default AegisSidebarBubble;
