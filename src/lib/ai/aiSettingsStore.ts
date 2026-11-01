'use client';

/**
 * Persisted AI connection settings. Keys are stored only in this browser
 * (localStorage, or sessionStorage when "remember" is off). They are sent only
 * to the provider they belong to — never to alucalculator.com.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PROVIDERS, type ProviderId } from './providers';

export interface AISettingsState {
  provider: ProviderId;
  models: Partial<Record<ProviderId, string>>;
  keys: Partial<Record<ProviderId, string>>;
  ollamaUrl: string;
  /** false → keys live in sessionStorage and vanish when the tab closes */
  rememberKeys: boolean;
  /** user opted in to AI features at all */
  enabled: boolean;
  /** UI language hint for answers */
  answerLanguage: 'auto' | 'tr' | 'en';

  setProvider: (p: ProviderId) => void;
  setModel: (p: ProviderId, model: string) => void;
  setKey: (p: ProviderId, key: string) => void;
  clearKey: (p: ProviderId) => void;
  clearAll: () => void;
  setOllamaUrl: (u: string) => void;
  setRememberKeys: (v: boolean) => void;
  setEnabled: (v: boolean) => void;
  setAnswerLanguage: (v: AISettingsState['answerLanguage']) => void;
}

const SESSION_KEYS = 'alucalc-ai-session-keys';

function readSessionKeys(): Partial<Record<ProviderId, string>> {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEYS) || '{}');
  } catch {
    return {};
  }
}
function writeSessionKeys(keys: Partial<Record<ProviderId, string>>) {
  try {
    sessionStorage.setItem(SESSION_KEYS, JSON.stringify(keys));
  } catch {
    /* private mode */
  }
}

export const useAISettings = create<AISettingsState>()(
  persist(
    (set, get) => ({
      provider: 'puter',
      models: {},
      keys: {},
      ollamaUrl: 'http://localhost:11434',
      rememberKeys: true,
      enabled: true,
      answerLanguage: 'auto',

      setProvider: (provider) => set({ provider }),
      setModel: (p, model) => set({ models: { ...get().models, [p]: model } }),
      setKey: (p, key) => {
        const keys = { ...get().keys, [p]: key.trim() };
        if (!get().rememberKeys) writeSessionKeys(keys);
        set({ keys });
      },
      clearKey: (p) => {
        const keys = { ...get().keys };
        delete keys[p];
        writeSessionKeys(keys);
        set({ keys });
      },
      clearAll: () => {
        writeSessionKeys({});
        set({ keys: {}, models: {} });
      },
      setOllamaUrl: (ollamaUrl) => set({ ollamaUrl }),
      setRememberKeys: (rememberKeys) => {
        if (!rememberKeys) writeSessionKeys(get().keys);
        set({ rememberKeys });
      },
      setEnabled: (enabled) => set({ enabled }),
      setAnswerLanguage: (answerLanguage) => set({ answerLanguage }),
    }),
    {
      name: 'alucalc-ai-settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // keys only persist to localStorage when the user allows it
      partialize: (s) => ({
        provider: s.provider,
        models: s.models,
        ollamaUrl: s.ollamaUrl,
        rememberKeys: s.rememberKeys,
        enabled: s.enabled,
        answerLanguage: s.answerLanguage,
        keys: s.rememberKeys ? s.keys : {},
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.rememberKeys) {
          state.keys = readSessionKeys();
        }
      },
    },
  ),
);

/** Resolved connection for the active provider. */
export function getActiveConnection() {
  const s = useAISettings.getState();
  const info = PROVIDERS[s.provider];
  return {
    provider: s.provider,
    model: s.models[s.provider] || info.defaultModel,
    apiKey: s.keys[s.provider],
    baseUrl: s.provider === 'ollama' ? s.ollamaUrl : undefined,
    ready: s.enabled && (!info.needsKey || !!s.keys[s.provider]),
  };
}

export function useAIReady(): boolean {
  return useAISettings((s) => s.enabled && (!PROVIDERS[s.provider].needsKey || !!s.keys[s.provider]));
}
