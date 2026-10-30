'use client';

import { useEffect } from 'react';
import { verifyAiAgentKey } from '@/auth/verify-ai-agent-key';

/**
 * AiAgentGate — Client-side listener & bridge for AI Agents.
 * 
 * When an AI agent accesses AluCAD OS with ?ai_key=... or ?agent_token=...:
 * 1. Verifies the secret code against timing-safe logic.
 * 2. Unlocks unrestricted inspection by suppressing intrusive modals,
 *    cookie banners, and onboarding overlays.
 * 3. Injects semantic metadata into the DOM for optimal DOM scraping and AI vision.
 */
export function AiAgentGate() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      const queryKey = url.searchParams.get('ai_key') || 
                       url.searchParams.get('agent_token') || 
                       url.searchParams.get('ai_agent_key');

      const isAlreadyAuthed = sessionStorage.getItem('alu_ai_agent_authorized') === '1';

      if (queryKey) {
        if (verifyAiAgentKey(queryKey)) {
          // Grant session authorization
          sessionStorage.setItem('alu_ai_agent_authorized', '1');
          sessionStorage.setItem('alu_ai_agent_token', queryKey);

          // Suppress consent & tracking overlays to give AI agent a pure DOM
          localStorage.setItem('alu_consent_telemetry', '0');
          localStorage.setItem('alu_consent_screenshot', '0');

          // Set semantic DOM attributes
          document.documentElement.setAttribute('data-ai-agent', 'authorized');
          document.documentElement.setAttribute('data-ai-readout-mode', 'high-precision');

          // Clean up banners if already mounted
          const banners = document.querySelectorAll('.fixed.bottom-2, .fixed.bottom-4');
          banners.forEach((b) => (b as HTMLElement).style.setProperty('display', 'none', 'important'));

          console.log('[AluCAD OS Kernel] AI Agent Authorized. Full engineering workspace access granted.');
        } else {
          console.warn('[AluCAD OS Kernel] AI Agent Authorization Failed: Invalid key provided.');
        }
      } else if (isAlreadyAuthed) {
        document.documentElement.setAttribute('data-ai-agent', 'authorized');
      }
    } catch {
      // Ignore URL parsing errors in restricted sandbox contexts
    }
  }, []);

  return null;
}
