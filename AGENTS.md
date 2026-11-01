# AGENTS.md — AluCAD OS (Agent Execution Core)

> This file is injected into every agent context (Antigravity, Claude Code, Cursor, Codex), so it stays short. Items marked **FORBIDDEN** / **MANDATORY** are hard constraints. Details live in `.agents/rules/` (laws), `.agents/skills/` (procedures) and `.agents/agents/` (personas) — see the map in §7.

---

## 1. Product Identity & Tech Stack

AluCAD OS (`alucalculator.com`) is **not** a generic calculator website. It is an industrial-grade **Engineering Operating System**:
- **Core shell:** windowed desktop architecture (Unified Desk Architecture / UDA) hosting deterministic ISO/DIN/VDI solvers. **Never hand-type the solver/module count** (see §6.2).
- **CAD & drafting:** 3D parametric CAD (Three.js + React Three Fiber + OpenCascade WASM) and 2D AluCAD (`@salusoft89/planegcs`).
- **Flow Engine:** Node-RED-style deterministic computation graph.
- **Copilot & PWA:** AeGiS engineering copilot; thin Android/Wear OS TWA wrappers via `@bubblewrap/cli`.
- **Runtime:** Next.js 16 (App Router, Turbopack, SSG via `generateStaticParams`), React 19, strict TypeScript, Tailwind CSS v4, Zustand, next-auth + Postgres (`@auth/pg-adapter`).
- **Deployment:** GitHub Actions → FTP → Hostinger (`.github/workflows/deploy.yml`) — **NOT** Vercel.

---

## 2. Mandatory Architectural Boundaries

One-way dependency chain, never reversed:
`OS → Flow → Mechanical → Validation → Export → Viewers`

- `src/mechanical/` — pure math/physics. **FORBIDDEN:** React, `window`, `document`.
- `src/flow/core/` — headless engine. **FORBIDDEN:** UI/JSX.
- `src/viewers/` — rendering only. **FORBIDDEN:** computing engineering geometry.
- `src/export/` — consumes validated data only. **FORBIDDEN:** recomputing formulas.
- `src/os/` — window/desktop shell only. **FORBIDDEN:** hardcoded solver math.
- **Node contract:** every node implements `EngineeringNode<TInput, TOutput>` with `deterministic: true`.
- **Ports:** semantically typed (`module_mm`, `torque_nm`, `stress_mpa`). **FORBIDDEN:** implicit unit conversion, generic `any`/`number` ports.
- **New modules:** `src/modules/<category>/<ModuleName>/` (`manifest.json`, `engine.ts`, `store.ts`, `index.tsx`), registered via `ModuleRegistry.register()`. **FORBIDDEN:** editing `osStore.ts` to add modules.
- **Traceability:** every engine returns `EngineMetadata` (`ProjectSchema.ts`) for SHA-256 validation.
- **Legacy tools** in `src/components/calculators/`: keep their pattern, don't force-migrate mid-task, still cite standards.

Full spec: `.agents/rules/flow-engine-architecture.md`, `.agents/rules/module-architecture.md`.

---

## 3. Design System — "AluCalc Instrument" v6, multi-theme (summary)

5 themes (`graphite` default dark, `midnight`, `oled`, `light`, `paper`) + system, selected via `<html data-theme>`; engine in `src/lib/theme/`, tokens in `src/styles/themes.css`.
**MANDATORY:** colours only through tokens (`--bg-0…3`, `--line`, `--ink`, `--alu`, `--alu-dim`, `--muted`, `--cyan`, `--accent-ink`, `--ok/--warn/--bad`, `--std`). **FORBIDDEN:** hex colours in UI class names/inline styles, glassmorphism (`backdrop-blur`), aurora/purple-pink gradients, radii > 12px, italic+font-black headings, toggling `light`/`dark` classes on `<html>`.
Verify every UI change in one dark and one light theme. **Before any UI/styling work read `.agents/rules/design-system-instrument.md`.**

## 3b. AI features

The site is a static export — there is no server for AI. All AI runs in the browser on the user's own connection: `src/lib/ai/providers.ts` (Puter free account, OpenRouter login/key, Gemini, OpenAI, Anthropic, Ollama), settings in `src/lib/ai/aiSettingsStore.ts`, UI `/ai-connect`. **FORBIDDEN:** new `/api/*` AI routes, hard-coded API keys, `NEXT_PUBLIC_*_API_KEY`. Use `askCopilot()` / `useAIChat()`; pages can feed live inputs/results to AeGiS with `registerPageContext()`.

## 4. Performance & 3D Guardrails (summary)

- **MANDATORY:** wrap Three.js geometry in `useMemo` keyed to inputs — never build `ExtrudeGeometry`/`EdgesGeometry` inline in JSX or render loops.
- **FORBIDDEN:** `@react-three/drei` `<Text>` (fetches external `.woff`, violates CSP) — use `<Html>` overlays or canvas textures.
- **MANDATORY:** anything importing Three.js, OpenCascade/WASM or heavy CAD/FEA solvers loads via `dynamic(() => import(...), { ssr: false })` so `/` and `/lite` stay light.
- Debounce high-frequency Zustand persistence (e.g. drag moves in `flowStore.ts`); use `Record<string, T>` for collections > 50 items.
- **FORBIDDEN:** `console.log` in render hooks, rAF loops or store dispatch paths.

Details and profiling requirements: `.agents/rules/performance-guardrails.md`.

---

## 5. Security & Credentials

- **ACTIVE INCIDENT:** `android/alucalc-release.keystore` and `android-wear/alucalc-release.keystore` were committed to a public repo — treat as compromised. **FORBIDDEN:** committing `*.keystore` / `*.jks`. Remediation steps (new keystore, history purge, rotation) are in `.agents/rules/security-hardening.md`; an agent must not do them unattended.
- **Zero hardcoded secrets** — environment variables only (`.env*` is gitignored).
- **Zero secret echoing** — never print, log or summarize a secret's value in chat, PRs or artifacts; name the variable/file only.
- `android/` and `android-wear/` are generated by `@bubblewrap/cli` — don't hand-edit unless the task is TWA configuration (`.agents/rules/android-pwa-protection.md`).

---

## 6. Verification Gate (before declaring ANY task complete)

1. **Methodology citation:** every engineering formula or solver added or changed declares its tier and source in the diff and in `EngineMetadata`:
   - **Normative Tier:** Recognized standard (ISO/DIN/VDI/ASME/Eurocode) for production-certified modules.
   - **Scientific Tier:** Peer-reviewed paper, numerical formulation (FEA, PlaneGCS), or manufacturer handbook (SKF, Festo).
   - **Heuristic Tier:** Documented algorithm spec or reverse-engineered interface (REA), verified by regression tests in `src/tests/`.
2. **Deterministic data:** never hand-type public calculator/module counts in copy or docs; compute them or audit with `.agents/skills/content-integrity-audit/`.
3. **No blind completion:** interactive surfaces (auth, 3D viewport, Flow Engine nodes, AeGiS copilot) cannot be verified by static review. `tsc --noEmit` / `npm run build` are *necessary but not sufficient* — follow `.agents/skills/qa-verification-protocol/` and report either `Verified: <action> → <observed result>` or `not verified: <reason>`. Never write "should work".

---

## 7. Map of Rules, Skills, Agents

| Scope / Task | Reference |
|---|---|
| Flow Engine nodes & math contracts | `.agents/rules/flow-engine-architecture.md` |
| UI, styles & theme tokens | `.agents/rules/design-system-instrument.md` |
| Three.js, R3F & store performance | `.agents/rules/performance-guardrails.md` |
| New calculator / module scaffolding | `.agents/rules/module-architecture.md` + `.agents/skills/calculator-module-builder/` |
| Phaser game modules (AluForge) | `.agents/skills/phaser-react-integration/` |
| Keystore, secrets & CSP | `.agents/rules/security-hardening.md` + `.agents/rules/android-pwa-protection.md` |
| Mandatory QA & verification | `.agents/skills/qa-verification-protocol/` |
| GD&T QA & drawing mismatches | `.agents/skills/drawing-qa-agent/` |
| Gearbox & NVH resonances | `.agents/skills/kinematic-nvh-analysis/` |
| 2D sheet nesting | `.agents/skills/attribute-based-nesting/` |
| Structural design codes (AISC / Eurocode) | `.agents/skills/design-code-verification/` |
| 3D cost & carbon factory | `.agents/skills/carbon-factory-engine/` |
| AI-assisted assembly (fasteners) | `.agents/skills/ai-assisted-assembly/` |
| Programmatic SEO pages | `.agents/skills/seo-programmatic-pages/` |
| Counts / stale docs audit | `.agents/skills/content-integrity-audit/` |
| Repo bloat & artifact cleanup | `.agents/skills/repo-hygiene-cleanup/` |
| Dependency updates | `.agents/skills/dependency-modernization/` |
| Reverse engineering & protocol analysis (REA) | `.agents/skills/reverse-engineering-assistant/` |
| Personas | `.agents/agents/` (`calculator-engineer`, `performance-engineer`, `qa-verifier`, `security-auditor`) |
| Workflows | `.agents/workflows/` (`/new-calculator`, `/site-audit`) |

## 8. Language

Code, comments, commit messages and engineering docs are written in **English**. CI workflows and legacy scripts may keep Turkish step names — match the language of the file you are editing.
