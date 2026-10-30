'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Maximize2, Send, ChevronRight, RotateCcw, Bot, User, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { AegisMascot, playMascotChirp } from './AegisMascot';
import { useCopilotStore } from '@/store/copilotStore';
import { useI18nStore, type Language } from '@/store/i18nStore';
import { useRouter } from 'next/navigation';
import { useAegisStore, type AegisMessage } from '@/store/aegisStore';
import { getCopilotStrings } from '@/locales/copilotTranslations';
import { t12 } from '@/locales/t12';
import { motion, AnimatePresence } from 'framer-motion';

interface AegisSidebarBubbleProps {
  collapsed?: boolean;
}

type ChatMessage = AegisMessage;

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
    title: 'AeGiS · Baş Araştırma Mühendisi',
    subtitle: 'Bilim Danışmanı & Çözüm Ortağı',
    greeting: 'Merhaba Mühendis! AluCAD OS Laboratuvarına hoş geldiniz. Hangi formül, malzeme veya CAD tasarımını analiz etmemi istersiniz?',
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
    title: 'AeGiS · Chief Research Engineer',
    subtitle: 'Scientific Advisor & Copilot',
    greeting: 'Hello Engineer! Welcome to the AluCAD OS Lab. Which formula, material property, or 3D CAD design should we analyze today?',
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
  const { setIsOpen, isOpen: mainPanelOpen } = useCopilotStore();
  const router = useRouter();
  const [isOpenLocal, setIsOpenLocal] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [lookAt, setLookAt] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Same conversation + engine as the main AeGiS panel.
  const stored = useAegisStore((s) => s.messages);
  const isThinking = useAegisStore((s) => s.isThinking);
  const sendToAegis = useAegisStore((s) => s.send);
  const resetAegis = useAegisStore((s) => s.reset);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = BUBBLE_TEXTS[language] || BUBBLE_TEXTS.en;

  const messages: ChatMessage[] = stored.length
    ? stored
    : [{ id: 'init-1', sender: 'ai', text: t.greeting, timestamp: '' }];

  // Only one AeGiS surface open at a time: the main panel takes over the thread.
  useEffect(() => {
    if (mainPanelOpen) setIsOpenLocal(false);
  }, [mainPanelOpen]);

  // Auto-scroll inside chat messages
  useEffect(() => {
    if (isOpenLocal) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isThinking, isOpenLocal]);

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
    playMascotChirp();
    setInputVal('');
    void sendToAegis(userText, {
      language,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
      thinkingSteps: getCopilotStrings(language).thinkingSteps,
      navigate: (href) => {
        setIsOpenLocal(false);
        router.push(href);
      },
    });
  };

  const handleResetChat = () => {
    playMascotChirp();
    resetAegis();
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    setLookAt({ x: nx, y: ny });
  };

  return (
    <div
      className="relative w-full"
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setLookAt(null);
      }}
    >
      {/* ─── HOVER SPEECH BALLOON (Active when closed) ─── */}
      <AnimatePresence>
        {!isOpenLocal && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="absolute bottom-full mb-2 left-0 right-0 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] p-2.5 z-50 pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-[var(--line)] pb-1">
              <span className="text-[9px] font-mono font-semibold text-[var(--cyan)] truncate">AeGiS Copilot</span>
              <span className="text-[8px] font-mono text-[var(--alu-dim)] shrink-0">ISO / DIN / VDI</span>
            </div>

            <p className="text-[10px] text-[var(--alu)] leading-snug mb-2">
              {t12(language, 'Ask a standard, formula, or solver.', 'Standart, formül veya solver için tıklayın.')}
            </p>

            {/* Quick Prompt Chips */}
            <div className="flex flex-col gap-1 font-mono">
              {t.actions.slice(0, 3).map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playMascotChirp();
                    setIsOpenLocal(true);
                    handleSendMessage(act.prompt);
                  }}
                  className="flex items-center justify-between w-full px-2 py-1 rounded bg-[var(--bg-2)] hover:bg-cyan-500/20 border border-[var(--line)] hover:border-cyan-400/50 text-left text-[9px] text-[var(--alu)] hover:text-[var(--cyan)] transition-colors group cursor-pointer"
                >
                  <span className="truncate">{act.label}</span>
                  <ChevronRight size={10} className="text-[var(--muted)] group-hover:text-[var(--cyan)] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UNIFIED GROWING & ELONGATING CARD CONTAINER ─── */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 27,
          mass: 0.8,
        }}
        className={`w-full rounded-[var(--radius-m)] border transition-colors overflow-hidden ${
          isOpenLocal
            ? 'bg-[var(--bg-1)] border-[var(--cyan-dim)]'
            : 'bg-[var(--bg-1)] border-[var(--line)] hover:border-[var(--cyan-dim)]'
        }`}
      >
        {/* ─── HEADER BAR (Slides up smoothly when expanding) ─── */}
        <div
          onClick={() => {
            if (!isOpenLocal) {
              playMascotChirp();
              setIsOpenLocal(true);
            }
          }}
          className={`flex items-center justify-between p-2.5 transition-all select-none ${
            !isOpenLocal ? 'cursor-pointer' : 'border-b border-[var(--line)] bg-[var(--bg-0)]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AegisMascot
              size={32}
              variant="face"
              pose={isThinking ? 'thinking' : 'idle'}
              isHovered={isHovered}
              lookAt={lookAt}
            />
            <div className="min-w-0 truncate">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cyan)] truncate">
                AeGiS
              </div>
              <div className="text-[8.5px] font-mono text-[var(--alu-dim)] truncate">
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
                  className="p-1 rounded-lg bg-[var(--bg-2)] hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
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
                  className="p-1 rounded-lg bg-[var(--bg-2)] hover:bg-[var(--hover)] text-[var(--cyan)] hover:text-[var(--ink)] transition-colors"
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
                  className="p-1 rounded-lg bg-[var(--bg-2)] hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                  title={t.closeTooltip}
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <div className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md text-[var(--cyan)] bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20">
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
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold rounded-br-xs'
                          : 'bg-[var(--bg-2)] border border-cyan-500/20 text-[var(--ink)] rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Action Link (if any detected intent has solver URL) */}
                      {msg.intent?.actionUrl && (
                        <div className="mt-2 pt-1.5 border-t border-[var(--line)]">
                          <Link
                            href={msg.intent.actionUrl}
                            onClick={() => setIsOpenLocal(false)}
                            prefetch={false}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-[var(--cyan)] text-[10px] font-bold hover:bg-cyan-500/30 transition-colors"
                          >
                            <span>{msg.intent.actionLabel || (language === 'tr' ? 'Modüle git' : 'Open module')}</span>
                            <ArrowUpRight size={11} />
                          </Link>
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] text-[var(--muted)] px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Thinking Indicator */}
                {isThinking && (
                  <div className="flex items-center gap-2 text-[var(--cyan)] text-[10.5px] p-2 bg-[var(--cyan)]/10 rounded-xl border border-cyan-500/20 animate-pulse">
                    <Sparkles size={13} className="animate-spin" />
                    <span>{t.thinking}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Topics Pill Bar (when conversation is fresh) */}
              {messages.length <= 2 && (
                <div className="px-3 pb-2 pt-1 border-t border-[var(--line)] space-y-1">
                  <p className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
                    {t.quickActions}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {t.actions.map((act, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(act.prompt)}
                        className="flex items-center justify-between w-full px-2 py-1 rounded-lg bg-[var(--bg-2)] hover:bg-cyan-500/15 border border-[var(--line)] hover:border-cyan-500/30 text-[var(--alu)] hover:text-[var(--cyan)] text-[9.5px] font-mono transition-all text-left group min-w-0"
                      >
                        <span className="truncate flex-1 min-w-0">{act.label}</span>
                        <ChevronRight size={10} className="text-[var(--muted)] group-hover:text-[var(--cyan)] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text-to-CAD shortcuts — routed to the 3D / 2D / Flow generators */}
              <div className="flex items-center gap-1 px-2.5 pt-2 border-t border-[var(--line)]">
                {([
                  ['/3d ', '🧊 3D'],
                  ['/2d ', '📐 2D'],
                  ['/flow ', '🔀 Flow'],
                ] as const).map(([cmd, label]) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => setInputVal((v) => (v.startsWith('/') ? cmd + v.replace(/^\/\S*\s*/, '') : cmd + v))}
                    title={language === 'tr' ? `"${cmd.trim()} …" ile yaz: AeGiS Text-to-CAD motoruna gönderir` : `Type "${cmd.trim()} …" to send it to the Text-to-CAD generator`}
                    className="flex-1 rounded-[var(--radius-s)] border border-[var(--cyan)]/30 bg-[var(--cyan)]/10 px-1.5 py-1 text-[9px] font-mono text-[var(--cyan)] hover:bg-[var(--cyan)]/20 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Input Form at Bottom of Expanded Card */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputVal);
                }}
                className="flex items-center gap-1.5 p-2.5 border-t border-[var(--line)] bg-[var(--bg-0)]"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={language === 'tr' ? 'Soru ya da “/2d DN50 flanş”…' : language === 'en' ? 'Ask, or “/2d DN50 flange”…' : t.askPlaceholder}
                  className="min-w-0 flex-1 rounded-xl bg-[var(--bg-2)] border border-[var(--line)] px-2.5 py-1.5 text-[10.5px] text-[var(--ink)] placeholder-[var(--muted)] font-mono outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all truncate"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isThinking}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--cyan)] text-[var(--accent-ink)] font-black font-mono text-[9.5px] uppercase hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0 disabled:opacity-40"
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
