'use client';

import { useCallback, useRef, useState } from 'react';
import { streamChat, type ChatMessage } from './providers';
import { getActiveConnection, useAISettings } from './aiSettingsStore';

export interface UseAIChatOptions {
  /** system prompt prepended to every request */
  system?: string | (() => string);
  /** extra context (current calculator inputs/results) added as a system message */
  context?: () => string | null | undefined;
  temperature?: number;
  maxTokens?: number;
}

export interface AIChatTurn extends ChatMessage {
  id: string;
  pending?: boolean;
  error?: string;
}

let idSeq = 0;
const nid = () => `m${Date.now().toString(36)}${(idSeq++).toString(36)}`;

/**
 * Minimal streaming chat hook bound to the user's AI connection.
 * Throws nothing; errors are surfaced on the assistant turn.
 */
export function useAIChat(opts: UseAIChatOptions = {}) {
  const [turns, setTurns] = useState<AIChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const answerLanguage = useAISettings((s) => s.answerLanguage);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      const conn = getActiveConnection();
      const user: AIChatTurn = { id: nid(), role: 'user', content };
      const bot: AIChatTurn = { id: nid(), role: 'assistant', content: '', pending: true };
      const history = [...turns, user];
      setTurns([...history, bot]);

      if (!conn.ready) {
        setTurns((t) => t.map((x) => (x.id === bot.id ? { ...x, pending: false, error: 'not_connected' } : x)));
        return;
      }

      const sys: ChatMessage[] = [];
      const s = typeof opts.system === 'function' ? opts.system() : opts.system;
      if (s) sys.push({ role: 'system', content: s });
      const ctx = opts.context?.();
      if (ctx) sys.push({ role: 'system', content: `Current workspace context:\n${ctx}` });
      if (answerLanguage !== 'auto') {
        sys.push({ role: 'system', content: `Answer in ${answerLanguage === 'tr' ? 'Turkish' : 'English'}.` });
      }

      const ac = new AbortController();
      abortRef.current = ac;
      setBusy(true);
      try {
        await streamChat({
          ...conn,
          temperature: opts.temperature,
          maxTokens: opts.maxTokens,
          signal: ac.signal,
          messages: [...sys, ...history.slice(-16).map(({ role, content }) => ({ role, content }))],
          onDelta: (d) => setTurns((t) => t.map((x) => (x.id === bot.id ? { ...x, content: x.content + d } : x))),
        });
        setTurns((t) => t.map((x) => (x.id === bot.id ? { ...x, pending: false } : x)));
      } catch (e: any) {
        const aborted = e?.name === 'AbortError';
        setTurns((t) =>
          t.map((x) => (x.id === bot.id ? { ...x, pending: false, error: aborted ? undefined : e?.message || String(e) } : x)),
        );
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, turns, opts, answerLanguage],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
  }, []);

  return { turns, busy, send, stop, reset, setTurns };
}
