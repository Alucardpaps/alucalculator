'use client';

/**
 * "Sign in with OpenRouter" — OAuth PKCE, fully client-side.
 * https://openrouter.ai/docs/use-cases/oauth-pkce
 *
 * Flow: startOpenRouterLogin() → user approves on openrouter.ai → redirected
 * back to /ai-connect/?code=… → completeOpenRouterLogin() exchanges the code
 * for a user-scoped key, stored locally via the AI settings store.
 * The user pays OpenRouter directly (credits / free models); the site owner
 * carries no cost and runs no server.
 */
import { useAISettings } from './aiSettingsStore';

const VERIFIER_KEY = 'alucalc-or-pkce-verifier';
const STATE_KEY = 'alucalc-or-pkce-state';
const RETURN_KEY = 'alucalc-or-return-to';

function base64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(len = 64) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64url(bytes).slice(0, len);
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest('SHA-256', data);
}

export function openRouterCallbackUrl() {
  return `${location.origin}/ai-connect/`;
}

export async function startOpenRouterLogin(returnTo?: string) {
  const verifier = randomString(64);
  const state = randomString(24);
  const challenge = base64url(await sha256(verifier));
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(RETURN_KEY, returnTo || location.pathname + location.search);
  const url = new URL('https://openrouter.ai/auth');
  url.searchParams.set('callback_url', openRouterCallbackUrl());
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('key_label', 'AluCAD OS');
  location.assign(url.toString());
}

export async function completeOpenRouterLogin(params: URLSearchParams): Promise<{ ok: boolean; error?: string; returnTo: string }> {
  const returnTo = sessionStorage.getItem(RETURN_KEY) || '/';
  const code = params.get('code');
  const state = params.get('state');
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const expected = sessionStorage.getItem(STATE_KEY);
  if (!code) return { ok: false, error: 'missing_code', returnTo };
  if (!verifier) return { ok: false, error: 'missing_verifier', returnTo };
  if (expected && state && expected !== state) return { ok: false, error: 'state_mismatch', returnTo };
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}`, returnTo };
    const { key } = await res.json();
    if (!key) return { ok: false, error: 'no_key', returnTo };
    const st = useAISettings.getState();
    st.setKey('openrouter', key);
    st.setProvider('openrouter');
    st.setEnabled(true);
    return { ok: true, returnTo };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network', returnTo };
  } finally {
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(RETURN_KEY);
  }
}
