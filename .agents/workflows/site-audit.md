# /site-audit

Runs the audit skills in sequence and produces one consolidated report instead of three scattered ones.

1. `.agents/skills/content-integrity-audit/` — inconsistent numbers and stale docs.
2. `.agents/skills/repo-hygiene-cleanup/` — bloat and stray files. Read-only pass first; list candidates, don't delete anything without approval.
3. Security pass — dispatch to the `security-auditor` persona (`.agents/agents/security-auditor/agent.md`) if available, or apply `.agents/rules/security-hardening.md` directly otherwise.

Output: one Markdown report grouped by severity (security first), each item with its exact file path and, where relevant, the exact command that would fix it. This workflow reports; it does not apply fixes automatically — that's a separate, explicit follow-up once the report is reviewed.
