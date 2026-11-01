import { describe, it, expect } from 'vitest';
import { verifyAiAgentKey, DEFAULT_AI_AGENT_KEY } from '@/auth/verify-ai-agent-key';
import fs from 'fs';
import path from 'path';

describe('AI Agent Authorization Gateway', () => {
  it('correctly validates the canonical AI Agent key', () => {
    expect(verifyAiAgentKey(DEFAULT_AI_AGENT_KEY)).toBe(true);
    expect(verifyAiAgentKey('ALUCALC-AGENT-2026-X9Q')).toBe(true);
    expect(verifyAiAgentKey('Bearer ALUCALC-AGENT-2026-X9Q')).toBe(true);
    expect(verifyAiAgentKey('  ALUCALC-AGENT-2026-X9Q  ')).toBe(true);
  });

  it('strictly rejects unauthorized or malformed keys', () => {
    expect(verifyAiAgentKey('wrong-agent-key')).toBe(false);
    expect(verifyAiAgentKey('ALUCALC-AGENT-2026-X9')).toBe(false); // short
    expect(verifyAiAgentKey('ALUCALC-AGENT-2026-X9Q-EXTRA')).toBe(false); // long
    expect(verifyAiAgentKey('')).toBe(false);
    expect(verifyAiAgentKey(null as any)).toBe(false);
    expect(verifyAiAgentKey(undefined as any)).toBe(false);
  });

  it('verifies llms.txt contains authentication instructions and solver mapping', () => {
    const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
    expect(fs.existsSync(llmsPath)).toBe(true);

    const content = fs.readFileSync(llmsPath, 'utf8');
    expect(content).toContain('# AluCalc OS');
    expect(content).toContain('/api/ai-agent');
    expect(content).toContain('/.well-known/mcp/server-card.json');
    expect(content).toContain('bolt-torque');
  });

  it('verifies robots.txt configures AI crawler directives', () => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);

    const content = fs.readFileSync(robotsPath, 'utf8');
    expect(content).toContain('User-agent: GPTBot');
    expect(content).toContain('User-agent: ClaudeBot');
    expect(content).toContain('Allow: /llms.txt');
    expect(content).toContain('Allow: /api/ai-agent/');
  });

  it('verifies .htaccess enforces the AI agent authorization gate', () => {
    const htaccessPath = path.join(process.cwd(), 'public', '.htaccess');
    expect(fs.existsSync(htaccessPath)).toBe(true);

    const content = fs.readFileSync(htaccessPath, 'utf8');
    expect(content).toContain('AI AGENTS, MCP DISCOVERY & CONTENT NEGOTIATION');
    expect(content).toContain('api/ai/agent/index.php');
  });
});
