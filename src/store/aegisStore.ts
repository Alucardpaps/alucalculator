'use client';
/**
 * AeGiS — one conversation, one engine, every surface.
 *
 * The sidebar bubble, the main AeGiS panel (header button / Ctrl+Space) and the
 * mobile tab all read and write THIS store, so a question asked in one place is
 * answered and visible in the other. Generation requests ("çiz", "modelle",
 * "/3d …") are routed to the Text-to-CAD engines via `cadRequest`, which the
 * 3D studio, 2D CAD editor and Flow canvas pick up with `useAegisCadHost`.
 */
import { create } from 'zustand';
import { useEffect } from 'react';
import { EngineeringCopilot, type CopilotIntent } from '@/engine/copilot/copilot';
import { askCopilot, CopilotNotConnectedError } from '@/lib/ai/copilotEngine';
import { getCopilotEngineLocale } from '@/locales/copilotTranslations';
import { useCopilotStore } from '@/store/copilotStore';
import {
  detectAegisCadIntent,
  AEGIS_CAD_ROUTES,
  AEGIS_CAD_LABELS,
  type AegisCadTarget,
} from '@/lib/ai/aegisIntent';

export interface AegisGameOption {
  label: string;
  value: string;
}

export interface AegisMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  intent?: CopilotIntent;
  gameOptions?: AegisGameOption[];
  /** set when the message handed work to a Text-to-CAD engine */
  cadTarget?: AegisCadTarget;
}

export interface AegisCadRequest {
  id: number;
  target: AegisCadTarget;
  prompt: string;
}

export interface AegisSendOptions {
  language: string;
  pathname: string;
  /** animated reasoning lines shown while waiting */
  thinkingSteps?: string[];
  /** called when the request must open another page (client-side navigation) */
  navigate?: (href: string) => void;
}

type Updater<T> = T | ((prev: T) => T);

interface AegisState {
  messages: AegisMessage[];
  isThinking: boolean;
  thinkingSteps: string[];
  cadRequest: AegisCadRequest | null;
  setMessages: (u: Updater<AegisMessage[]>) => void;
  setThinking: (v: boolean) => void;
  send: (text: string, opts: AegisSendOptions) => Promise<void>;
  reset: () => void;
  requestCad: (target: AegisCadTarget, prompt: string) => void;
  clearCadRequest: (id: number) => void;
}

const engine = typeof window !== 'undefined' ? new EngineeringCopilot() : null;
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let seq = 0;
const uid = (p: string) => `${p}-${Date.now()}-${++seq}`;

function localReply(intent: CopilotIntent, isTr: boolean): string {
  if (intent.replyOverride) return intent.replyOverride;
  let t = isTr ? 'Parametreleri analiz ettim. ' : 'I analyzed your parameters. ';
  if (intent.materialType && intent.materialType !== 'unknown') {
    t += `${isTr ? 'Malzeme' : 'Material'}: **${String(intent.materialType).toUpperCase()}**${intent.alloyOrGrade ? ` (${intent.alloyOrGrade})` : ''}. `;
  }
  if (intent.forceApplied) t += `${isTr ? 'Yük' : 'Load'}: **${intent.forceApplied} N**. `;
  if (intent.assumptionsMade?.length) {
    t += `\n\n**${isTr ? 'Uygulanan varsayımlar' : 'Assumptions applied'}:**\n` + intent.assumptionsMade.map((a) => `• ${a}`).join('\n');
  }
  return t;
}

export const useAegisStore = create<AegisState>((set, get) => ({
  messages: [],
  isThinking: false,
  thinkingSteps: [],
  cadRequest: null,

  setMessages: (u) => set((s) => ({ messages: typeof u === 'function' ? (u as (p: AegisMessage[]) => AegisMessage[])(s.messages) : u })),
  setThinking: (isThinking) => set({ isThinking }),

  reset: () => {
    engine?.resetState();
    set({ messages: [], isThinking: false, thinkingSteps: [] });
  },

  requestCad: (target, prompt) => set({ cadRequest: { id: Date.now(), target, prompt } }),
  clearCadRequest: (id) => set((s) => (s.cadRequest?.id === id ? { cadRequest: null } : s)),

  send: async (text, { language, pathname, thinkingSteps = [], navigate }) => {
    const userText = text.trim();
    if (!userText || get().isThinking) return;
    const isTr = language === 'tr';
    const push = (m: AegisMessage) => set((s) => ({ messages: [...s.messages, m] }));

    push({ id: uid('user'), sender: 'user', text: userText, timestamp: now() });

    // 1 ── Text-to-CAD routing (3D / 2D / Flow) — deterministic, works offline.
    const cad = detectAegisCadIntent(userText, pathname);
    if (cad) {
      const href = AEGIS_CAD_ROUTES[cad.target];
      const label = AEGIS_CAD_LABELS[cad.target][isTr ? 'tr' : 'en'];
      get().requestCad(cad.target, cad.prompt);
      const onPage = pathname.startsWith(href.replace(/\/$/, ''));
      push({
        id: uid('ai-cad'),
        sender: 'ai',
        cadTarget: cad.target,
        timestamp: now(),
        text: isTr
          ? `🛠️ **${label}** motoruna gönderdim:\n«${cad.prompt}»\n\n${onPage ? 'Üretim penceresi bu sayfada açılıyor.' : 'İlgili stüdyo açılıyor; üretim penceresi otomatik başlar.'} Sonucu kontrol edip sahneye/çizime ekleyebilirsin.`
          : `🛠️ Sent to **${label}**:\n“${cad.prompt}”\n\n${onPage ? 'The generator opens on this page.' : 'Opening the studio; the generator starts automatically.'} Review the result, then add it to the scene/drawing.`,
        intent: { actionUrl: href, actionLabel: isTr ? 'Stüdyoya git' : 'Open studio', assumptionsMade: [] } as unknown as CopilotIntent,
      });
      if (!onPage) navigate?.(href);
      // Step aside so the generator window is visible; the thread keeps the hand-off note.
      window.setTimeout(() => useCopilotStore.getState().setIsOpen(false), 900);
      return;
    }

    // 2 ── Chat: user's own AI connection, streamed; local engine as fallback.
    set({ isThinking: true, thinkingSteps: [] });
    let i = 0;
    const timer = setInterval(() => {
      if (i < thinkingSteps.length) set((s) => ({ thinkingSteps: [...s.thinkingSteps, thinkingSteps[i++]] }));
      else clearInterval(timer);
    }, 400);

    const history = get()
      .messages.filter((m) => !m.gameOptions && !m.cadTarget)
      .slice(0, -1)
      .map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text }));

    const streamId = uid('ai');
    let started = false;
    try {
      const data = await askCopilot({
        query: userText,
        history,
        language,
        pathname,
        onDelta: (partial) => {
          if (!partial) return;
          if (!started) {
            started = true;
            clearInterval(timer);
            set({ isThinking: false });
            push({ id: streamId, sender: 'ai', text: partial, timestamp: now() });
          } else {
            set((s) => ({ messages: s.messages.map((m) => (m.id === streamId ? { ...m, text: partial } : m)) }));
          }
        },
      });
      const final: AegisMessage = {
        id: streamId,
        sender: 'ai',
        text: data.answer,
        timestamp: now(),
        intent: { actionUrl: data.actionUrl, actionLabel: data.actionLabel, showSupportButton: data.showSupportButton, assumptionsMade: [] } as unknown as CopilotIntent,
      };
      set((s) => ({
        messages: s.messages.some((m) => m.id === streamId) ? s.messages.map((m) => (m.id === streamId ? final : m)) : [...s.messages, final],
      }));
    } catch (err) {
      if (err instanceof CopilotNotConnectedError) {
        // Not connected: answer with the deterministic engine and point to /ai-connect.
        let intent: CopilotIntent | undefined;
        try {
          intent = engine?.parseAndAssume(userText, pathname, getCopilotEngineLocale(language));
        } catch {
          /* ignore */
        }
        const hasLocal = !!intent?.replyOverride || !!intent?.actionUrl;
        push({
          id: uid('ai-local'),
          sender: 'ai',
          timestamp: now(),
          text:
            (hasLocal && intent ? localReply(intent, isTr) + '\n\n' : '') +
            (isTr
              ? '💡 Serbest sohbet için bir yapay zekâ hesabı bağla (en kolayı ücretsiz **Puter** girişi). Çizim/model üretimi ("/3d …", "/2d …", "/flow …") bağlantısız da çalışır.'
              : '💡 Connect an AI account for free-form chat (easiest: free **Puter** sign-in). Generation ("/3d …", "/2d …", "/flow …") works offline too.'),
          intent: hasLocal && intent?.actionUrl ? intent : ({ actionUrl: '/ai-connect/', actionLabel: isTr ? 'AI bağlantısını aç' : 'Open AI connection', assumptionsMade: [] } as unknown as CopilotIntent),
        });
      } else {
        try {
          const intent = engine!.parseAndAssume(userText, pathname, getCopilotEngineLocale(language));
          push({ id: uid('ai-fb'), sender: 'ai', text: localReply(intent, isTr), timestamp: now(), intent });
        } catch {
          push({ id: uid('ai-err'), sender: 'ai', text: isTr ? 'İstek işlenirken bir hata oluştu.' : 'Error processing request.', timestamp: now() });
        }
      }
    } finally {
      clearInterval(timer);
      set({ isThinking: false, thinkingSteps: [] });
    }
  },
}));

/**
 * Host hook for a Text-to-CAD surface. When AeGiS routes a request to `target`,
 * `open(prompt)` is called once (the host opens its generator modal with it).
 */
export function useAegisCadHost(target: AegisCadTarget, open: (prompt: string) => void) {
  const req = useAegisStore((s) => s.cadRequest);
  const clear = useAegisStore((s) => s.clearCadRequest);
  useEffect(() => {
    if (!req || req.target !== target) return;
    open(req.prompt);
    clear(req.id);
    // `open` is usually an inline closure; react to new requests only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req, target, clear]);
}

/** Open the main AeGiS panel from anywhere (optionally with a prompt). */
export function openAegis(prompt?: string, send = false) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('alucalc:open-copilot', prompt ? { detail: { prompt, send } } : undefined));
}
