---
name: qa-verification-protocol
description: Mandatory verification steps before reporting any interactive feature (auth, 3D workspace, Flow Engine, AeGiS copilot, calculator output) as complete. Use before closing out any task, especially one a closure report would otherwise mark done from static analysis alone.
---

# QA Verification Protocol

## When to use this skill
- Before writing "done", "complete", or a closure report for any task touching an interactive surface.
- This is not optional for auth, the 3D workspace, or the Flow Engine — a prior closure report on this project was flagged as needing manual re-verification for exactly these surfaces because they weren't actually exercised, only read.

## Why this exists

Static analysis (reading the code, confirming types compile, confirming the diff looks right) tells you the code is *plausible*. It does not tell you the login flow actually redirects correctly, that the 3D canvas actually renders without a WebGL context error, or that a Flow graph actually executes end to end. Those require actually running the thing.

## How

Verify features using the most direct and reliable tool available:
- **Unit / Math verification**: Run `npx vitest run` or automated unit tests.
- **Static & Type verification**: Run `npx tsc --noEmit` and `npm run build`.
- **Browser & UI verification**: Use Playwright MCP (if active) or local dev server testing to confirm user flows.

## Checklist by surface

- **Auth (next-auth / Google OAuth):** complete a real login round trip; confirm the session persists across a reload; confirm the `users` table write happened if you have DB access, not just that the redirect fired.
- **3D workspace / design-studio:** open it, confirm the canvas mounts without a `WebGL context lost` error, and exercise at least one tool per category touched by the change — not just the one you edited.
- **Flow Engine:** build a small 2–3 node graph and execute it; confirm topological order and that a dirty-node change actually recomputes only the affected subtree, not the whole graph.
- **Calculator output:** enter real numbers and compare the result to a hand-checked or standards-referenced value — not just "it renders a number without throwing."
- **AeGiS copilot:** if a change touches its output, actually ask it something the change affects; don't assume a prompt-level change works from reading the prompt.

## Reporting format

State the exact action taken and the exact observed result, per surface:

> Verified via Playwright: logged in with test account → session persisted after reload → `users` row confirmed.

Never write "should work" or "this should now be fixed" as a substitute for the above. If something couldn't be verified (no test credentials, environment not running), say exactly that — "not verified: <reason>" — rather than rounding up to "looks correct."
