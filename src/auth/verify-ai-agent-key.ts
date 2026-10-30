/**
 * AluCAD OS — AI Agent Key Verification
 * 
 * Provides timing-safe comparison to authorize AI agents, crawlers, and LLM clients.
 * Protects against timing-attack character snooping.
 */

export const DEFAULT_AI_AGENT_KEY = 'ALUCALC-AGENT-2026-X9Q';

export function getAiAgentSecretKey(): string {
  return (process.env.AI_AGENT_KEY || DEFAULT_AI_AGENT_KEY).trim();
}

export function verifyAiAgentKey(providedKey: string | null | undefined): boolean {
  if (!providedKey || typeof providedKey !== 'string') return false;

  const secret = getAiAgentSecretKey();
  const cleanProvided = providedKey.trim().replace(/^Bearer\s+/i, '');

  if (!cleanProvided) return false;

  // Constant-time character comparison (timing-safe & length-safe)
  let mismatch = cleanProvided.length ^ secret.length;
  const maxLen = Math.max(cleanProvided.length, secret.length);

  for (let i = 0; i < maxLen; i++) {
    const charA = i < cleanProvided.length ? cleanProvided.charCodeAt(i) : 0;
    const charB = i < secret.length ? secret.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }

  return mismatch === 0;
}
