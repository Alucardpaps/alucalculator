'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Loader2, LogIn, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { PROVIDERS, PROVIDER_ORDER, listModels, testConnection, puterIsSignedIn, puterSignIn, puterSignOut, type ModelOption, type ProviderId } from '@/lib/ai/providers';
import { useAISettings } from '@/lib/ai/aiSettingsStore';
import { startOpenRouterLogin } from '@/lib/ai/openrouterAuth';

type Lang = 'tr' | 'en';

const T = {
  title: { tr: 'Yapay Zekâ Bağlantısı', en: 'AI Connection' },
  lead: {
    tr: 'AeGiS asistanı ve AI özellikleri kendi hesabınla çalışır. Anahtarın yalnızca bu tarayıcıda saklanır ve sadece seçtiğin sağlayıcıya gönderilir.',
    en: 'AeGiS and the AI features run on your own account. Your key is stored only in this browser and sent only to the provider you pick.',
  },
  provider: { tr: 'Sağlayıcı', en: 'Provider' },
  model: { tr: 'Model', en: 'Model' },
  key: { tr: 'API anahtarı', en: 'API key' },
  getKey: { tr: 'Anahtar al', en: 'Get a key' },
  login: { tr: 'OpenRouter ile giriş yap', en: 'Sign in with OpenRouter' },
  puterIn: { tr: 'Puter hesabıyla giriş yap', en: 'Sign in with Puter' },
  puterOut: { tr: 'Çıkış yap', en: 'Sign out' },
  puterOk: { tr: 'Puter hesabı bağlı', en: 'Puter account connected' },
  or: { tr: 'veya anahtarı yapıştır', en: 'or paste a key' },
  connected: { tr: 'Bağlı', en: 'Connected' },
  test: { tr: 'Bağlantıyı test et', en: 'Test connection' },
  remove: { tr: 'Anahtarı sil', en: 'Remove key' },
  remember: { tr: 'Bu cihazda hatırla', en: 'Remember on this device' },
  rememberHint: {
    tr: 'Kapalıysa anahtar sekme kapanınca silinir.',
    en: 'When off, the key is forgotten when the tab closes.',
  },
  ollamaUrl: { tr: 'Ollama adresi', en: 'Ollama URL' },
  privacy: {
    tr: 'alucalculator.com sunucusu anahtarını hiç görmez; istekler tarayıcından doğrudan sağlayıcıya gider.',
    en: 'alucalculator.com never sees your key; requests go straight from your browser to the provider.',
  },
  custom: { tr: 'Özel model kimliği…', en: 'Custom model id…' },
} as const;

function useLang(): Lang {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    const l = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
    setLang(l.startsWith('tr') ? 'tr' : 'en');
  }, []);
  return lang;
}

export function AIConnectPanel({ compact = false }: { compact?: boolean }) {
  const lang = useLang();
  const s = useAISettings();
  const info = PROVIDERS[s.provider];
  const key = s.keys[s.provider] || '';
  const [draft, setDraft] = useState(key);
  const [show, setShow] = useState(false);
  const [models, setModels] = useState<ModelOption[]>(info.models);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; ms: number } | null>(null);
  const model = s.models[s.provider] || info.defaultModel;
  const [puterOn, setPuterOn] = useState<boolean | null>(null);
  useEffect(() => {
    if (s.provider !== 'puter') return;
    let alive = true;
    puterIsSignedIn().then((v) => alive && setPuterOn(v));
    return () => {
      alive = false;
    };
  }, [s.provider]);

  useEffect(() => {
    setDraft(s.keys[s.provider] || '');
    setResult(null);
    setModels(PROVIDERS[s.provider].models);
  }, [s.provider]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    if (info.needsKey && !key && s.provider !== 'openrouter') return;
    setLoadingModels(true);
    listModels(s.provider, key, s.ollamaUrl)
      .then((m) => alive && setModels(m))
      .finally(() => alive && setLoadingModels(false));
    return () => {
      alive = false;
    };
  }, [s.provider, key, s.ollamaUrl, info.needsKey]);

  const modelInList = useMemo(() => models.some((m) => m.id === model), [models, model]);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const r = await testConnection({
      provider: s.provider,
      model,
      apiKey: s.keys[s.provider],
      baseUrl: s.ollamaUrl,
    });
    setResult(r);
    setTesting(false);
  };

  const label = 'mb-1.5 block text-xs font-medium text-[var(--alu-dim)]';
  const input =
    'h-9 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent-line)] focus:outline-none focus:[box-shadow:var(--focus-ring)]';

  return (
    <section className="space-y-5">
      {!compact && (
        <header>
          <h2 className="text-lg font-semibold text-[var(--ink)]">{T.title[lang]}</h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--alu-dim)]">{T.lead[lang]}</p>
        </header>
      )}

      <div>
        <span className={label}>{T.provider[lang]}</span>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {PROVIDER_ORDER.map((p) => {
            const active = s.provider === p;
            const hasKey = !PROVIDERS[p].needsKey || !!s.keys[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => s.setProvider(p)}
                className={`relative rounded-[var(--radius-s)] border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  active
                    ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--ink)]'
                    : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)] hover:border-[var(--line-strong)]'
                }`}
              >
                {PROVIDERS[p].name}
                {hasKey && PROVIDERS[p].needsKey && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--ok)]" title={T.connected[lang]} />
                )}
              </button>
            );
          })}
        </div>
        {info.note && <p className="mt-2 text-xs text-[var(--alu-dim)]">{info.note[lang]}</p>}
      </div>

      {s.provider === 'puter' && (
        <div className="flex flex-wrap items-center gap-3">
          {puterOn ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--ok)]">
                <CheckCircle2 size={16} /> {T.puterOk[lang]}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await puterSignOut();
                  setPuterOn(false);
                }}
                className="h-8 rounded-[var(--radius-s)] border border-[var(--line)] px-3 text-xs text-[var(--alu)] hover:border-[var(--line-strong)]"
              >
                {T.puterOut[lang]}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  setPuterOn(await puterSignIn());
                } catch (e: any) {
                  setResult({ ok: false, message: e?.message || String(e), ms: 0 });
                }
              }}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-s)] bg-[var(--cyan)] px-4 text-sm font-semibold text-[var(--accent-ink)] hover:opacity-90"
            >
              <LogIn size={16} /> {T.puterIn[lang]}
            </button>
          )}
        </div>
      )}

      {info.supportsLogin && s.provider === 'openrouter' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => startOpenRouterLogin()}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-s)] bg-[var(--cyan)] px-4 text-sm font-semibold text-[var(--accent-ink)] hover:opacity-90"
          >
            <LogIn size={16} /> {T.login[lang]}
          </button>
          <div className="text-xs text-[var(--muted)]">{T.or[lang]}</div>
        </div>
      )}

      {info.needsKey && (
        <div>
          <label className={label} htmlFor="ai-key">
            {T.key[lang]}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="ai-key"
                type={show ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder={info.keyPlaceholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => draft !== key && s.setKey(s.provider, draft)}
                className={`${input} pl-8 pr-9 font-mono`}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label={show ? 'Hide' : 'Show'}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {key && (
              <button
                type="button"
                onClick={() => {
                  s.clearKey(s.provider);
                  setDraft('');
                  setResult(null);
                }}
                title={T.remove[lang]}
                className="grid h-9 w-9 place-items-center rounded-[var(--radius-s)] border border-[var(--line)] text-[var(--alu-dim)] hover:border-[var(--bad)] hover:text-[var(--bad)]"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {info.keyUrl && (
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--cyan)] hover:underline"
            >
              {T.getKey[lang]} <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      {s.provider === 'ollama' && (
        <div>
          <label className={label} htmlFor="ai-ollama">
            {T.ollamaUrl[lang]}
          </label>
          <input id="ai-ollama" className={`${input} font-mono`} value={s.ollamaUrl} onChange={(e) => s.setOllamaUrl(e.target.value)} />
        </div>
      )}

      <div>
        <label className={label} htmlFor="ai-model">
          {T.model[lang]} {loadingModels && <Loader2 size={11} className="ml-1 inline animate-spin" />}
        </label>
        <select id="ai-model" className={input} value={modelInList ? model : '__custom'} onChange={(e) => e.target.value !== '__custom' && s.setModel(s.provider, e.target.value)}>
          {!modelInList && <option value="__custom">{model}</option>}
          {models.slice(0, 400).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
              {m.tier === 'free' ? ' · free' : m.tier === 'local' ? ' · local' : ''}
            </option>
          ))}
        </select>
        <input
          className={`${input} mt-1.5 font-mono text-xs`}
          placeholder={T.custom[lang]}
          defaultValue=""
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value.trim();
              if (v) s.setModel(s.provider, v);
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runTest}
          disabled={testing || (info.needsKey && !key)}
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-3 text-sm text-[var(--ink)] hover:border-[var(--line-strong)] disabled:opacity-50"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {T.test[lang]}
        </button>
        {result && (
          <span className={`inline-flex items-center gap-1.5 text-xs ${result.ok ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
            {result.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {result.ok ? `${T.connected[lang]} · ${result.ms} ms` : result.message}
          </span>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--alu)]">
        <input type="checkbox" className="mt-0.5 accent-[var(--cyan)]" checked={s.rememberKeys} onChange={(e) => s.setRememberKeys(e.target.checked)} />
        <span>
          {T.remember[lang]}
          <span className="block text-xs text-[var(--muted)]">{T.rememberHint[lang]}</span>
        </span>
      </label>

      <p className="flex items-start gap-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-xs text-[var(--alu-dim)]">
        <ShieldCheck size={14} className="mt-px shrink-0 text-[var(--ok)]" /> {T.privacy[lang]}
      </p>
    </section>
  );
}

export default AIConnectPanel;
