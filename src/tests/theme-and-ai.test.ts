import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { THEMES, THEME_IDS, resolveTheme, getTheme, THEME_INIT_SCRIPT, DEFAULT_THEME } from '@/lib/theme/themes';
import { parseCopilotJson, buildSystemPrompt } from '@/lib/ai/copilotEngine';
import { PROVIDERS, PROVIDER_ORDER, streamChat, extractPdfTechnicalText } from '@/lib/ai/providers';
import { generateSolidWithAI } from '@/engines/cad/AegisGenerativeEngine';
import { useAISettings } from '@/lib/ai/aiSettingsStore';

describe('theme registry', () => {
  it('has a dark default and both kinds', () => {
    expect(DEFAULT_THEME).toBe('graphite');
    expect(getTheme(DEFAULT_THEME).kind).toBe('dark');
    expect(THEMES.some((t) => t.kind === 'light')).toBe(true);
  });

  it('resolves system preference', () => {
    expect(resolveTheme('system', true)).toBe('graphite');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('paper', true)).toBe('paper');
    expect(resolveTheme('bogus' as any, true)).toBe('graphite');
  });

  it('every theme id has a CSS block with the full token set', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../styles/themes.css'), 'utf8');
    const required = ['--bg-0', '--bg-1', '--bg-2', '--bg-3', '--line', '--ink', '--alu', '--alu-dim', '--muted', '--cyan', '--accent-ink', '--ok', '--warn', '--bad'];
    for (const id of THEME_IDS) {
      const start = css.indexOf(`[data-theme="${id}"]`);
      expect(start, id).toBeGreaterThan(-1);
      const block = css.slice(start, css.indexOf('}', start));
      for (const tok of required) expect(block, `${id} ${tok}`).toContain(`${tok}:`);
    }
  });

  it('init script is valid JS and applies data-theme', () => {
    const attrs: Record<string, string> = {};
    const classes = new Set<string>();
    const fakeDoc = {
      documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v), classList: { add: (c: string) => classes.add(c) } },
      querySelector: () => null,
    };
    const store: Record<string, string> = { 'alucalc-theme': 'paper' };
    const fn = new Function('document', 'localStorage', 'matchMedia', THEME_INIT_SCRIPT);
    fn(fakeDoc, { getItem: (k: string) => store[k] ?? null }, () => ({ matches: false }));
    expect(attrs['data-theme']).toBe('paper');
    expect(classes.has('dark')).toBe(true);
  });

  it('palette maps neutral scales to tokens', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../styles/palette.css'), 'utf8');
    expect(css).toContain('--color-white: var(--ink);');
    expect(css).toContain('--color-slate-900: var(--bg-1);');
    expect(css).toMatch(/\[data-theme="light"\][\s\S]*--color-emerald-400:/);
  });
});

describe('copilot JSON parsing', () => {
  it('parses a clean object', () => {
    const r = parseCopilotJson('{"answer":"Hi","actionUrl":"/bolt-torque/","actionLabel":"Open","showSupportButton":false}');
    expect(r).toEqual({ answer: 'Hi', actionUrl: '/bolt-torque/', actionLabel: 'Open', showSupportButton: false });
  });

  it('strips code fences and ignores external URLs', () => {
    const r = parseCopilotJson('```json\n{"answer":"x","actionUrl":"https://evil.example","actionLabel":"Go"}\n```');
    expect(r.answer).toBe('x');
    expect(r.actionUrl).toBeNull();
    expect(r.actionLabel).toBeNull();
  });

  it('falls back to plain text', () => {
    expect(parseCopilotJson('Just text').answer).toBe('Just text');
  });

  it('system prompt lists tools and language', () => {
    const p = buildSystemPrompt('tr', '/bolt-torque/', 'M12 8.8, 85 Nm');
    expect(p).toContain('Turkish');
    expect(p).toContain('/bolt-torque');
    expect(p).toContain('M12 8.8, 85 Nm');
  });
});

describe('AI providers', () => {
  it('order covers every provider', () => {
    expect(new Set(PROVIDER_ORDER)).toEqual(new Set(Object.keys(PROVIDERS)));
  });

  it('refuses keyed providers without a key', async () => {
    await expect(streamChat({ provider: 'openai', model: 'x', messages: [] })).rejects.toThrow(/No API key/);
  });

  it('streams OpenAI-style SSE', async () => {
    const body = new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        c.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n'));
        c.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n\n'));
        c.close();
      },
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const deltas: string[] = [];
    const out = await streamChat({ provider: 'openrouter', model: 'm', apiKey: 'k', messages: [{ role: 'user', content: 'hi' }], onDelta: (d) => deltas.push(d) });
    expect(out).toBe('Hello');
    expect(deltas).toEqual(['Hel', 'lo']);
    expect(String(fetchMock.mock.calls[0][0])).toContain('openrouter.ai');
    vi.unstubAllGlobals();
  });

  it('streams Anthropic SSE', async () => {
    const body = new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        c.enqueue(enc.encode('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"text":"OK"}}\n\n'));
        c.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })));
    const out = await streamChat({ provider: 'anthropic', model: 'm', apiKey: 'k', messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'hi' }] });
    expect(out).toBe('OK');
    vi.unstubAllGlobals();
  });

  it('surfaces HTTP errors with a hint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'bad key' } }), { status: 401 })));
    await expect(streamChat({ provider: 'gemini', model: 'm', apiKey: 'k', messages: [{ role: 'user', content: 'x' }] })).rejects.toThrow(/401.*bad key.*API key/);
    vi.unstubAllGlobals();
  });

  it('extracts dimension tokens from 2D PDF technical drawing bytes', () => {
    const fakePdf = '%PDF-1.7\n1 0 obj\n(ISO 2768-mK) Tj\n(160x100x20mm) Tj\n(4xM8 Counterbore) Tj\nendobj';
    const buf = new TextEncoder().encode(fakePdf).buffer;
    const extracted = extractPdfTechnicalText(buf);
    expect(extracted).toContain('ISO 2768-mK');
    expect(extracted).toContain('160x100x20mm');
    expect(extracted).toContain('4xM8 Counterbore');
  });

  it('synthesizes custom 3D profile solid via generateSolidWithAI with multimodal attachments', async () => {
    useAISettings.getState().setProvider('gemini');
    useAISettings.getState().setKey('gemini', 'test-gemini-key');

    const aiJson = JSON.stringify({
      name: 'Özel Kamalı Mil Yatağı (2D PDF)',
      kind: 'profile',
      solidOp: 'extrude',
      outer: [
        { x: -60, y: -40 },
        { x: 60, y: -40 },
        { x: 60, y: 20 },
        { x: 25, y: 45 },
        { x: -25, y: 45 },
        { x: -60, y: 20 },
      ],
      params: { extrudeDepth: 25, width: 120, height: 85, depth: 25 },
      materialId: 'al-7075-t6',
      holes: [{ id: 'h1', size: 'M10', x: -40, y: -20, type: 'counterbore' }],
      standards: ['ISO 2768-mK', 'DIN 912'],
      explanation: { tr: '2D PDF teknik resimden 6 köşeli özel kontur ve M10 imbus delik okundu.', en: 'Synthesized from 2D PDF.' },
      features: ['2D PDF Kontur Sentezi', 'Al 7075-T6'],
    });

    const body = new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: aiJson }] } }] })}\n\n`));
        c.close();
      },
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const solid = await generateSolidWithAI('2D PDF teknik resimden çiz', [
      {
        name: 'yatak-teknik-resim.pdf',
        mimeType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjc=',
        base64: 'JVBERi0xLjc=',
        extractedText: '120x85x25mm | M10 | Al 7075-T6',
      },
    ]);

    expect(solid.aiSynthesized).toBe(true);
    expect(solid.kind).toBe('profile');
    expect(solid.outer?.length).toBe(6);
    expect(solid.materialId).toBe('al-7075-t6');
    expect(solid.holes.length).toBe(1);
    expect(solid.holes[0].size).toBe('M10');
    // Shoelace area of the hexagon: 120×60 rect (7200) + trapezoid (120+50)/2×25 (2125) = 9325 mm²
    // mass = 9325 × 25 mm³ = 233.125 cm³ × 2.81 g/cm³ = 655.08 g → 0.655 kg
    expect(solid.estimatedMassKg).toBeCloseTo(0.655, 3);
    expect(solid.methodology?.tier).toBe('heuristic');
    vi.unstubAllGlobals();
  });
});
