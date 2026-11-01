/**
 * AluCAD AI — browser-side provider layer.
 *
 * The site is a static export (Hostinger), so there is no server to hold an API
 * key. Every request goes straight from the user's browser to the provider
 * with the user's own credential (BYOK) or an OpenRouter account login (OAuth
 * PKCE). Nothing is proxied through alucalculator.com and keys never leave the
 * device except to the provider they belong to.
 */

export type ProviderId = 'puter' | 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'ollama';

export interface AIFileAttachment {
  name: string;
  mimeType: string;
  /** Full data URL (e.g. data:image/png;base64,...) */
  dataUrl: string;
  /** Raw base64 payload without data:... prefix */
  base64: string;
  /** Extracted text / dimensions from PDF or technical drawing metadata */
  extractedText?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachments?: AIFileAttachment[];
}

export interface ModelOption {
  id: string;
  label: string;
  /** rough hint shown in the picker */
  tier?: 'fast' | 'balanced' | 'best' | 'free' | 'local';
}

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  /** where users create a key */
  keyUrl?: string;
  keyPlaceholder?: string;
  /** true if the provider supports "sign in" (OAuth) instead of pasting a key */
  supportsLogin?: boolean;
  needsKey: boolean;
  defaultModel: string;
  models: ModelOption[];
  note?: { tr: string; en: string };
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  puter: {
    id: 'puter',
    name: 'Puter (free account)',
    keyUrl: 'https://puter.com',
    supportsLogin: true,
    needsKey: false,
    defaultModel: 'default',
    models: [
      { id: 'default', label: 'Automatic', tier: 'free' },
      { id: 'gpt-5-nano', label: 'GPT-5 nano', tier: 'fast' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', tier: 'fast' },
      { id: 'claude-sonnet-4', label: 'Claude Sonnet 4', tier: 'best' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'fast' },
    ],
    note: {
      tr: 'En kolay yol: anahtar yok, ücretsiz bir Puter hesabıyla açılır pencereden giriş yapılır. Kullanım kotası kullanıcının kendi Puter hesabından düşer; site sahibine maliyet yoktur.',
      en: 'Easiest: no key, sign in with a free Puter account in a popup. Usage counts against the user’s own Puter account, never the site owner.',
    },
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    keyUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-…',
    supportsLogin: true,
    needsKey: true,
    defaultModel: 'openrouter/auto',
    models: [
      { id: 'openrouter/auto', label: 'Auto (best available)', tier: 'balanced' },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'fast' },
      { id: 'anthropic/claude-sonnet-5.5', label: 'Claude Sonnet 5.5', tier: 'best' },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini', tier: 'fast' },
      { id: 'deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek V3 (free)', tier: 'free' },
    ],
    note: {
      tr: 'Tek hesapla yüzlerce modele erişim. "OpenRouter ile giriş yap" ile anahtar kopyalamadan bağlanabilirsin.',
      en: 'One account, hundreds of models. Use "Sign in with OpenRouter" — no key copying needed.',
    },
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyPlaceholder: 'AIza…',
    needsKey: true,
    defaultModel: 'gemini-flash-latest',
    models: [
      { id: 'gemini-flash-latest', label: 'Gemini Flash (latest)', tier: 'fast' },
      { id: 'gemini-pro-latest', label: 'Gemini Pro (latest)', tier: 'best' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'fast' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'best' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', tier: 'fast' },
    ],
    note: {
      tr: 'Google AI Studio’dan ücretsiz kotalı anahtar alınabilir.',
      en: 'Google AI Studio offers keys with a free quota.',
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-…',
    needsKey: true,
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', tier: 'fast' },
      { id: 'gpt-4.1', label: 'GPT-4.1', tier: 'best' },
      { id: 'gpt-4o', label: 'GPT-4o', tier: 'balanced' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-…',
    needsKey: true,
    defaultModel: 'claude-sonnet-5-5',
    models: [
      { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', tier: 'fast' },
      { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', tier: 'balanced' },
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', tier: 'best' },
    ],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (local)',
    needsKey: false,
    defaultModel: 'llama3.1',
    models: [
      { id: 'llama3.1', label: 'Llama 3.1', tier: 'local' },
      { id: 'qwen2.5', label: 'Qwen 2.5', tier: 'local' },
      { id: 'mistral', label: 'Mistral', tier: 'local' },
    ],
    note: {
      tr: 'Bilgisayarında çalışan Ollama’ya bağlanır (OLLAMA_ORIGINS=https://www.alucalculator.com gerekir). Tamamen ücretsiz ve çevrimdışı.',
      en: 'Connects to Ollama on your machine (set OLLAMA_ORIGINS=https://www.alucalculator.com). Free and offline.',
    },
  },
};

export const PROVIDER_ORDER: ProviderId[] = ['puter', 'openrouter', 'gemini', 'openai', 'anthropic', 'ollama'];

export interface ChatRequest {
  provider: ProviderId;
  model: string;
  apiKey?: string;
  baseUrl?: string; // ollama
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  /** called for every streamed text delta */
  onDelta?: (text: string) => void;
}

export class AIError extends Error {
  constructor(message: string, public status?: number, public provider?: ProviderId) {
    super(message);
    this.name = 'AIError';
  }
}

let puterPromise: Promise<any> | null = null;
/** Lazy-load Puter.js only when the user picks it. */
export function loadPuter(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new AIError('Puter requires a browser', 0, 'puter'));
  if ((window as any).puter) return Promise.resolve((window as any).puter);
  if (!puterPromise) {
    puterPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.puter.com/v2/';
      s.async = true;
      s.onload = () => ((window as any).puter ? resolve((window as any).puter) : reject(new AIError('Puter failed to load', 0, 'puter')));
      s.onerror = () => {
        puterPromise = null;
        reject(new AIError('Could not load Puter.js (blocked by network or extension).', 0, 'puter'));
      };
      document.head.appendChild(s);
    });
  }
  return puterPromise;
}

/** Puter sign-in state helpers. */
export async function puterIsSignedIn(): Promise<boolean> {
  try {
    const p = await loadPuter();
    return !!p.auth?.isSignedIn?.();
  } catch {
    return false;
  }
}
export async function puterSignIn(): Promise<boolean> {
  const p = await loadPuter();
  await p.auth.signIn();
  return !!p.auth?.isSignedIn?.();
}
export async function puterSignOut(): Promise<void> {
  const p = await loadPuter();
  await p.auth?.signOut?.();
}

/** Parse a fetch Response body as Server-Sent Events, yielding each `data:` payload. */
async function* sseData(res: Response): AsyncGenerator<string> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
  if (buf.trim().startsWith('data:')) yield buf.trim().slice(5).trim();
}

/** Parse newline-delimited JSON (Ollama). */
async function* ndjson(res: Response): AsyncGenerator<any> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (line) {
        try { yield JSON.parse(line); } catch { /* skip partial */ }
      }
    }
  }
}

async function failFrom(res: Response, provider: ProviderId): Promise<never> {
  let detail = '';
  try {
    const j = await res.json();
    detail = j?.error?.message || j?.error || j?.message || JSON.stringify(j);
  } catch {
    try { detail = await res.text(); } catch { /* ignore */ }
  }
  const hint =
    res.status === 401 || res.status === 403
      ? ' — check your API key / sign-in.'
      : res.status === 429
        ? ' — rate limit or quota reached.'
        : '';
  throw new AIError(`${PROVIDERS[provider].name} ${res.status}: ${String(detail).slice(0, 300)}${hint}`, res.status, provider);
}

function splitSystem(messages: ChatMessage[]) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const rest = messages.filter((m) => m.role !== 'system');
  return { system, rest };
}

/**
 * Extracts readable text, dimension strings (e.g. Ø40, 120x80, M8, R12, tolerances),
 * and title block metadata from a raw PDF ArrayBuffer on the client without external dependencies.
 */
export function extractPdfTechnicalText(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const latin1 = new TextDecoder('latin1').decode(bytes);
    const chunks: string[] = [];

    // 1. Extract literal strings inside PDF text objects (...) Tj / TJ
    const literalRegex = /\(([^()\\]{2,120})\)/g;
    let m: RegExpExecArray | null;
    while ((m = literalRegex.exec(latin1)) !== null) {
      const s = m[1].replace(/\\n|\\r/g, ' ').replace(/\s+/g, ' ').trim();
      // Keep printable engineering strings and dimension tokens
      if (/^[\x20-\x7E\u00A0-\u00FF]+$/.test(s) && !/^(Identity-H|Adobe|PDF|FlateDecode|DeviceRGB|DeviceCMYK|Type1|TrueType|FontDescriptor|BaseFont)$/i.test(s)) {
        chunks.push(s);
      }
      if (chunks.length >= 250) break;
    }

    // 2. Also scan UTF-16BE / hex strings if few literal strings were found
    if (chunks.length < 10) {
      const dimMatches = latin1.match(/(?:Ø|DIA|R|M)?\d+(?:[.,]\d+)?\s*(?:x|X|×|\*)?\s*\d*(?:mm|cm|°)?/g);
      if (dimMatches) {
        chunks.push(...dimMatches.slice(0, 80));
      }
    }

    const unique = Array.from(new Set(chunks)).join(' | ');
    return unique.slice(0, 4000);
  } catch {
    return '';
  }
}

/**
 * Reads an uploaded Image (PNG/JPG/WEBP) or 2D Technical Drawing PDF file into an AIFileAttachment.
 */
export async function readAttachmentFile(file: File): Promise<AIFileAttachment> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Dosya okunamadı: ${file.name}`));
    reader.readAsDataURL(file);
  });

  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');

  let extractedText: string | undefined;
  if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const ab = await file.arrayBuffer();
      extractedText = extractPdfTechnicalText(ab);
    } catch {
      extractedText = undefined;
    }
  }

  return {
    name: file.name,
    mimeType,
    dataUrl,
    base64,
    extractedText,
  };
}

/**
 * Stream a chat completion. Resolves with the full text.
 */
export async function streamChat(req: ChatRequest): Promise<string> {
  const { provider, model, apiKey, messages, signal, onDelta } = req;
  const temperature = req.temperature ?? 0.3;
  const maxTokens = req.maxTokens ?? 2048;
  let full = '';
  const emit = (t: string) => {
    if (!t) return;
    full += t;
    onDelta?.(t);
  };

  if (PROVIDERS[provider].needsKey && !apiKey) {
    throw new AIError('No API key configured for ' + PROVIDERS[provider].name, 401, provider);
  }

  if (provider === 'openai' || provider === 'openrouter') {
    const url =
      provider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = typeof location !== 'undefined' ? location.origin : 'https://www.alucalculator.com';
      headers['X-Title'] = 'AluCAD OS';
    }
    const formattedMessages = messages.map((m) => {
      if (!m.attachments || m.attachments.length === 0) {
        return { role: m.role, content: m.content };
      }
      const contentParts: any[] = [{ type: 'text', text: m.content }];
      for (const att of m.attachments) {
        if (att.mimeType.startsWith('image/')) {
          contentParts.push({
            type: 'image_url',
            image_url: { url: att.dataUrl },
          });
        } else if (att.mimeType === 'application/pdf') {
          if (provider === 'openrouter') {
            contentParts.push({
              type: 'file',
              file: { filename: att.name, file_data: att.dataUrl },
            });
          }
          if (att.extractedText) {
            contentParts.push({
              type: 'text',
              text: `[2D PDF Technical Drawing Extracted Tokens (${att.name})]:\n${att.extractedText}`,
            });
          }
        }
      }
      return { role: m.role, content: contentParts };
    });

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({ model, messages: formattedMessages, temperature, max_tokens: maxTokens, stream: true }),
    });
    if (!res.ok) await failFrom(res, provider);
    for await (const data of sseData(res)) {
      if (data === '[DONE]') break;
      try {
        const j = JSON.parse(data);
        emit(j.choices?.[0]?.delta?.content ?? '');
      } catch { /* keep-alive comments */ }
    }
    return full;
  }

  if (provider === 'anthropic') {
    const { system, rest } = splitSystem(messages);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        system: system || undefined,
        messages: rest.map((m) => {
          if (!m.attachments || m.attachments.length === 0) {
            return { role: m.role, content: m.content };
          }
          const blocks: any[] = [];
          for (const att of m.attachments) {
            if (att.mimeType.startsWith('image/')) {
              blocks.push({
                type: 'image',
                source: { type: 'base64', media_type: att.mimeType, data: att.base64 },
              });
            } else if (att.mimeType === 'application/pdf') {
              blocks.push({
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: att.base64 },
              });
              if (att.extractedText) {
                blocks.push({
                  type: 'text',
                  text: `[2D PDF Technical Drawing Extracted Tokens (${att.name})]:\n${att.extractedText}`,
                });
              }
            }
          }
          blocks.push({ type: 'text', text: m.content });
          return { role: m.role, content: blocks };
        }),
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
    });
    if (!res.ok) await failFrom(res, provider);
    for await (const data of sseData(res)) {
      try {
        const j = JSON.parse(data);
        if (j.type === 'content_block_delta') emit(j.delta?.text ?? '');
        if (j.type === 'error') throw new AIError(j.error?.message || 'Anthropic stream error', 500, provider);
      } catch (e) {
        if (e instanceof AIError) throw e;
      }
    }
    return full;
  }

  if (provider === 'gemini') {
    const { system, rest } = splitSystem(messages);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey! },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: rest.map((m) => {
          const parts: any[] = [{ text: m.content }];
          if (m.attachments && m.attachments.length > 0) {
            for (const att of m.attachments) {
              parts.push({
                inline_data: {
                  mime_type: att.mimeType,
                  data: att.base64,
                },
              });
              if (att.extractedText) {
                parts.push({
                  text: `[2D PDF Technical Drawing Extracted Tokens (${att.name})]:\n${att.extractedText}`,
                });
              }
            }
          }
          return { role: m.role === 'assistant' ? 'model' : 'user', parts };
        }),
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    });
    if (!res.ok) await failFrom(res, provider);
    for await (const data of sseData(res)) {
      try {
        const j = JSON.parse(data);
        const parts = j.candidates?.[0]?.content?.parts ?? [];
        for (const p of parts) emit(p.text ?? '');
      } catch { /* ignore */ }
    }
    return full;
  }

  if (provider === 'puter') {
    const puter = await loadPuter();
    const opts: any = { stream: true, temperature };
    if (model && model !== 'default') opts.model = model;
    const formatted = messages.map((m) => {
      if (!m.attachments || m.attachments.length === 0) return { role: m.role, content: m.content };
      const contentParts: any[] = [{ type: 'text', text: m.content }];
      for (const att of m.attachments) {
        if (att.mimeType.startsWith('image/')) {
          contentParts.push({ type: 'image_url', image_url: { url: att.dataUrl } });
        } else if (att.extractedText) {
          contentParts.push({
            type: 'text',
            text: `[2D PDF Technical Drawing (${att.name})]:\n${att.extractedText}`,
          });
        }
      }
      return { role: m.role, content: contentParts };
    });
    const resp: any = await puter.ai.chat(formatted, opts);
    if (resp && typeof resp[Symbol.asyncIterator] === 'function') {
      for await (const part of resp) {
        if (signal?.aborted) break;
        emit(part?.text ?? '');
      }
    } else {
      emit(typeof resp === 'string' ? resp : resp?.message?.content ?? String(resp ?? ''));
    }
    return full;
  }

  if (provider === 'ollama') {
    const base = (req.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const formatted = messages.map((m) => {
      if (!m.attachments || m.attachments.length === 0) return { role: m.role, content: m.content };
      const images = m.attachments.filter((a) => a.mimeType.startsWith('image/')).map((a) => a.base64);
      const pdfTexts = m.attachments
        .filter((a) => a.extractedText)
        .map((a) => `\n[2D PDF (${a.name})]: ${a.extractedText}`)
        .join('');
      return {
        role: m.role,
        content: m.content + pdfTexts,
        ...(images.length > 0 ? { images } : {}),
      };
    });
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: formatted, stream: true, options: { temperature } }),
    });
    if (!res.ok) await failFrom(res, provider);
    for await (const j of ndjson(res)) {
      emit(j?.message?.content ?? '');
      if (j?.done) break;
    }
    return full;
  }

  throw new AIError('Unknown provider ' + provider);
}

/** Cheap credential check used by the settings panel "Test" button. */
export async function testConnection(req: Omit<ChatRequest, 'messages'>): Promise<{ ok: boolean; message: string; ms: number }> {
  const t0 = performance.now();
  try {
    const text = await streamChat({
      ...req,
      maxTokens: 16,
      temperature: 0,
      messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
    });
    return { ok: true, message: text.trim().slice(0, 40) || 'OK', ms: Math.round(performance.now() - t0) };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e), ms: Math.round(performance.now() - t0) };
  }
}

/**
 * Fetch the provider's live model list so the picker never goes stale.
 * Falls back to the static list on any error.
 */
export async function listModels(provider: ProviderId, apiKey?: string, baseUrl?: string): Promise<ModelOption[]> {
  const fallback = PROVIDERS[provider].models;
  try {
    if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/models');
      const j = await r.json();
      const items: ModelOption[] = (j.data || []).map((m: any) => ({
        id: m.id,
        label: m.name || m.id,
        tier: String(m.id).endsWith(':free') ? 'free' : undefined,
      }));
      return [{ id: 'openrouter/auto', label: 'Auto (best available)', tier: 'balanced' }, ...items];
    }
    if (provider === 'gemini' && apiKey) {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
        headers: { 'x-goog-api-key': apiKey },
      });
      const j = await r.json();
      const items = (j.models || [])
        .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m: any) => ({ id: String(m.name).replace(/^models\//, ''), label: m.displayName || m.name }));
      return items.length ? items : fallback;
    }
    if (provider === 'openai' && apiKey) {
      const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } });
      const j = await r.json();
      const items = (j.data || [])
        .map((m: any) => String(m.id))
        .filter((id: string) => /^(gpt|o\d|chatgpt)/.test(id) && !/(audio|realtime|tts|transcribe|image|search|embedding)/.test(id))
        .sort()
        .reverse()
        .map((id: string) => ({ id, label: id }));
      return items.length ? items : fallback;
    }
    if (provider === 'anthropic' && apiKey) {
      const r = await fetch('https://api.anthropic.com/v1/models?limit=100', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      });
      const j = await r.json();
      const items = (j.data || []).map((m: any) => ({ id: m.id, label: m.display_name || m.id }));
      return items.length ? items : fallback;
    }
    if (provider === 'ollama') {
      const base = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
      const r = await fetch(`${base}/api/tags`);
      const j = await r.json();
      const items = (j.models || []).map((m: any) => ({ id: m.name, label: m.name, tier: 'local' as const }));
      return items.length ? items : fallback;
    }
  } catch {
    /* network / CORS / bad key → static list */
  }
  return fallback;
}
