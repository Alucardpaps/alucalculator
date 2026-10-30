'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { AIConnectPanel } from '@/components/settings/AIConnectPanel';
import { completeOpenRouterLogin } from '@/lib/ai/openrouterAuth';

/**
 * /ai-connect — settings page and OAuth callback target for
 * "Sign in with OpenRouter". When ?code= is present the code is exchanged
 * for a key and the user is sent back to where they started.
 */
export default function AIConnectClient() {
  const [status, setStatus] = useState<'idle' | 'working' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.get('code')) return;
    setStatus('working');
    completeOpenRouterLogin(params).then((r) => {
      history.replaceState(null, '', location.pathname);
      if (r.ok) {
        setStatus('ok');
        window.setTimeout(() => location.assign(r.returnTo && r.returnTo !== '/ai-connect/' ? r.returnTo : '/'), 1200);
      } else {
        setStatus('error');
        setError(r.error || 'unknown');
      }
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      {status !== 'idle' && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-[var(--radius-m)] border p-3 text-sm ${
            status === 'ok'
              ? 'border-[var(--ok)] bg-[var(--ok-soft)] text-[var(--ink)]'
              : status === 'error'
                ? 'border-[var(--bad)] bg-[var(--bad-soft)] text-[var(--ink)]'
                : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)]'
          }`}
        >
          {status === 'working' && <Loader2 size={16} className="animate-spin" />}
          {status === 'ok' && <CheckCircle2 size={16} className="text-[var(--ok)]" />}
          {status === 'error' && <XCircle size={16} className="text-[var(--bad)]" />}
          {status === 'working' && 'Connecting your OpenRouter account…'}
          {status === 'ok' && 'OpenRouter connected. Returning…'}
          {status === 'error' && `Sign-in failed (${error}). Please try again.`}
        </div>
      )}
      <div className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-7">
        <AIConnectPanel />
      </div>
    </main>
  );
}
