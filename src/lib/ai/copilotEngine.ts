'use client';

/**
 * AeGiS copilot engine — runs entirely in the browser on the user's own AI
 * connection (see aiSettingsStore). Knows every canonical tool so it can route
 * users, and receives the current page + optional live calculator context.
 */
import { CANONICAL_TOOLS, CANONICAL_PILLARS } from '@/data/canonicalInventory';
import { streamChat, type ChatMessage } from './providers';
import { getActiveConnection } from './aiSettingsStore';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', tr: 'Turkish', de: 'German', es: 'Spanish', fr: 'French', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', zh: 'Chinese (Simplified)', ja: 'Japanese', ko: 'Korean', ar: 'Arabic',
};

export interface CopilotAnswer {
  answer: string;
  actionUrl: string | null;
  actionLabel: string | null;
  showSupportButton: boolean;
}

export interface CopilotRequest {
  query: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  language: string;
  pathname: string;
  /** optional live context published by the current calculator */
  pageContext?: string | null;
  signal?: AbortSignal;
  onDelta?: (partialAnswer: string) => void;
}

let toolCatalog: string | null = null;
function catalog(): string {
  if (toolCatalog) return toolCatalog;
  const byPillar = new Map<string, string[]>();
  for (const t of CANONICAL_TOOLS) {
    const p = CANONICAL_PILLARS[t.pillar]?.titleEn || t.pillar;
    const std = t.standards?.length ? ` [${t.standards.slice(0, 3).join(', ')}]` : '';
    const line = `${t.route} — ${t.titleEn}${std}`;
    byPillar.set(p, [...(byPillar.get(p) || []), line]);
  }
  toolCatalog = [...byPillar.entries()].map(([p, lines]) => `## ${p}\n${lines.join('\n')}`).join('\n\n');
  return toolCatalog;
}

/** Live page context registry: calculators can publish their inputs/results. */
const pageContextProviders = new Set<() => string | null>();
export function registerPageContext(fn: () => string | null) {
  pageContextProviders.add(fn);
  return () => pageContextProviders.delete(fn);
}
export function collectPageContext(): string | null {
  const parts: string[] = [];
  pageContextProviders.forEach((fn) => {
    try {
      const v = fn();
      if (v) parts.push(v);
    } catch {
      /* ignore broken provider */
    }
  });
  return parts.length ? parts.join('\n\n') : null;
}

export function buildSystemPrompt(language: string, pathname: string, pageContext?: string | null) {
  const lang = LANGUAGE_NAMES[language] || 'English';
  const current = CANONICAL_TOOLS.find((t) => pathname === t.route || pathname.startsWith(t.route + '/'));
  return `You are AeGiS, the engineering copilot inside AluCAD OS (alucalculator.com) — a browser workstation with deterministic ISO/DIN/VDI/ASME solvers, 3D/2D CAD, FEA and a Flow Engine.

VOICE: a senior mechanical design engineer sitting next to the user. Warm, direct, concise. Short replies to greetings. No filler lists.

ENGINEERING RULES:
- Show formulas with units, state assumptions, and cite the governing standard (e.g. VDI 2230, ISO 281, DIN 743, ISO 286) when relevant.
- When you compute numbers, show the key steps so they can be checked. If an input is missing, state a sensible typical value and say it is an assumption.
- Never claim a design is safe without a safety factor against a named limit. Flag anything outside a standard's validity range.
- Prefer pointing the user to the matching AluCalc solver for a verified result; your mental arithmetic is a sanity check, not a certificate.

LANGUAGE: Write the "answer" field entirely in ${lang}.

CURRENT PAGE: ${pathname}${current ? ` (${current.titleEn})` : ''}
${pageContext ? `\nLIVE PAGE DATA (inputs/results the user sees right now):\n${pageContext}\n` : ''}
AVAILABLE TOOLS (route — name [standards]):
${catalog()}

ROUTING: If the user wants to open/do something a tool covers, set actionUrl to that route (with trailing slash) and actionLabel to a short button text in ${lang}. If they are already on it, actionUrl = null.
SUPPORT: If the user reports a bug or wrong result, set showSupportButton = true.

OUTPUT: Reply ONLY with one JSON object, no code fences:
{"answer": "markdown text", "actionUrl": "/route/ or null", "actionLabel": "text or null", "showSupportButton": false}`;
}

/** Extract the "answer" string from a partially streamed JSON object. */
function partialAnswer(raw: string): string {
  const m = raw.match(/"answer"\s*:\s*"((?:[^"\\]|\\[\s\S])*)/);
  if (!m) return raw.trim().startsWith('{') ? '' : raw;
  try {
    return JSON.parse(`"${m[1].replace(/\\$/, '')}"`);
  } catch {
    return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
}

export function parseCopilotJson(raw: string): CopilotAnswer {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(text.slice(start, end + 1));
      const url = typeof j.actionUrl === 'string' && j.actionUrl.startsWith('/') ? j.actionUrl : null;
      return {
        answer: String(j.answer ?? ''),
        actionUrl: url,
        actionLabel: url ? (j.actionLabel ?? null) : null,
        showSupportButton: !!j.showSupportButton,
      };
    } catch {
      /* fall through */
    }
  }
  return { answer: partialAnswer(text) || text, actionUrl: null, actionLabel: null, showSupportButton: false };
}

export class CopilotNotConnectedError extends Error {
  constructor() {
    super('not_connected');
    this.name = 'CopilotNotConnectedError';
  }
}

export async function askCopilot(req: CopilotRequest): Promise<CopilotAnswer> {
  const conn = getActiveConnection();
  if (!conn.ready) throw new CopilotNotConnectedError();
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(req.language, req.pathname, req.pageContext ?? collectPageContext()) },
    ...req.history.slice(-12),
    { role: 'user', content: req.query },
  ];
  let raw = '';
  await streamChat({
    ...conn,
    messages,
    temperature: 0.4,
    maxTokens: 1500,
    signal: req.signal,
    onDelta: (d) => {
      raw += d;
      req.onDelta?.(partialAnswer(raw));
    },
  });
  return parseCopilotJson(raw);
}
