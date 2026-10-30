# GEMINI.md — AluCalc OS (Gemini 4 Argon & Agent Execution Matrix)

> **PRIMARY DIRECTIVE FOR GEMINI 4 ARGON / NEXT-GEN REASONING AGENTS:**
> This repository is **AluCalc OS** (`alucalculator.com`) — an industrial-grade **Engineering Operating System**, NOT a generic calculator web app.
> All code must satisfy deterministic engineering contracts, verifiable methodologies (Normative standards, scientific formulations, or benchmarked numerical/heuristic models), and strict architectural boundaries.

---

## 1. System Identity & Technology Stack

- **Core Shell:** Windowed Desktop Architecture (Unified Desk Architecture / UDA) hosting 89+ deterministic ISO/DIN/VDI solvers.
- **CAD & Drafting:** 
  - 3D Parametric CAD: Three.js + React Three Fiber + OpenCascade WASM.
  - 2D AluCAD Drafting: `@salusoft89/planegcs` geometric constraint solver.
- **Flow Engine:** Node-RED-style deterministic computation graph (`EngineeringNode<TInput, TOutput>`).
- **Copilot & PWA:** AeGiS engineering copilot; Android & Wear OS TWA packages generated via `@bubblewrap/cli`.
- **Runtime & Deployment:**
  - Next.js 16 (App Router, Turbopack, static export `output: 'export'`, `trailingSlash: true`).
  - React 19, strict TypeScript, Tailwind CSS v4, Zustand v5.
  - Deployment: GitHub Actions → FTP → Hostinger Apache/LiteSpeed (`.github/workflows/deploy.yml`).

---

## 2. Hard Architectural Boundaries (One-Way Dependency Chain)

```
OS → Flow Engine → Mechanical Solvers → Validation → Export → Viewers
```

1. **`src/mechanical/` (Pure Math & Physics):**
   - **FORBIDDEN:** React imports, JSX, `window`, `document`, browser APIs.
   - **MANDATORY:** Pure deterministic functions citing their methodology (Normative standard, Scientific paper, or Heuristic/Reverse-engineered spec).
2. **`src/flow/core/` (Headless Engine):**
   - **FORBIDDEN:** UI, CSS, JSX. Must be 100% headless graph computation.
3. **`src/viewers/` (Rendering Viewports):**
   - **FORBIDDEN:** Calculating engineering geometry or physics equations inside viewer loops. Consumes pre-computed data.
4. **`src/export/` (DXF, STL, PDF Exporters):**
   - **FORBIDDEN:** Recomputing engineering formulas. Consumes validated solver results only.
5. **`src/os/` (Window Shell & Desktop Manager):**
   - **FORBIDDEN:** Hardcoding solver logic. Solvers are encapsulated modules.
6. **New Modules:**
   - Scaffolding: `src/modules/<category>/<ModuleName>/` (`manifest.json`, `engine.ts`, `store.ts`, `index.tsx`).
   - Registration: Call `ModuleRegistry.register()`. **FORBIDDEN:** Editing `osStore.ts` directly to register modules.

---

## 3. Design System — "AluCalc Instrument" v6 (multi-theme)

- Themes: `graphite` (default dark), `midnight`, `oled`, `light`, `paper`, plus `system`. Selected by `<html data-theme>`; engine `src/lib/theme/`, tokens `src/styles/themes.css`.
- Colours ONLY via tokens: `--bg-0…3`, `--line`, `--ink`, `--alu`, `--alu-dim`, `--muted`, `--cyan` (accent), `--accent-ink`, `--ok/--warn/--bad`, `--std`.
- ❌ hex colours in UI classes/inline styles · ❌ glassmorphism/backdrop-blur · ❌ aurora / purple-pink gradients · ❌ radius > 12px · ❌ italic+font-black headings · ❌ toggling `light`/`dark` classes on `<html>`.
- AI runs client-side only (`src/lib/ai/`); never add server AI routes or hard-coded keys.
- Full rules: `.agents/rules/design-system-instrument.md`. Verify UI in one dark and one light theme.

---

## 4. Performance & 3D Guardrails

- **Geometry Caching:** Wrap Three.js geometry in `useMemo` keyed strictly to dimension inputs. Never instantiate `ExtrudeGeometry`, `CylinderGeometry`, or `EdgesGeometry` inline in render loops or JSX.
- **Font & CSP Compliance:** **FORBIDDEN:** `@react-three/drei` `<Text>` (it fetches external `.woff` files, triggering CSP violations). Use `<Html>` overlays or canvas-rendered textures.
- **Dynamic Imports:** Any component importing Three.js, OpenCascade WASM, or heavy solvers must be loaded using `dynamic(() => import(...), { ssr: false })` to protect initial bundle size.
- **Zero Console Spam:** **FORBIDDEN:** `console.log` inside render hooks, requestAnimationFrame loops, or store dispatch paths.

---

## 5. Automated Verification Harness (Test Before Declaring Complete)

Gemini 4 Argon must run and verify tests before concluding any task:

```bash
# 1. Run unit & regression tests
npm test
# Or target specific test:
npx vitest run src/tests/<test-name>.test.ts

# 2. Type-check entire project
npm run typecheck

# 3. Verify Next.js production static build & sitemap
npx next build --webpack
```

---

## 6. Single Source of Truth (SSOT) Reference Map

| Component / Scope | File Location |
|---|---|
| **Canonical Solvers Count** | `src/data/canonicalInventory.ts` & `src/config/app.ts` |
| **Module Registry** | `src/lib/registry/ModuleRegistry.ts` |
| **SEO & Sitemap Registry** | `src/config/seo.ts` & `src/app/sitemap.ts` |
| **Material Properties DB** | `src/data/alloyDatasheets.ts` & `src/materials/canonical.ts` |
| **Flow Engine Core** | `src/flow/core/` & `src/flow/engine/` |
| **Agent Skills & Workflows** | `.agents/skills/` & `.agents/rules/` |

---

## 7. Golden Rule: No Blind Completion & Verifiable Methodology Matrix

Never assume code works without running verification. To ensure engineering integrity without blocking innovation, every equation, solver, or reverse-engineered feature must declare its methodology tier in code comments and `EngineMetadata`:

1. **Tier 1: Normative (Standard-based):**
   - *Scope:* Official standards (ISO, DIN, VDI, ASME, Eurocode, AISC).
   - *Requirement:* Cite standard code, year, and clause (e.g. `ISO 6336-2:2019 Clause 5.3`). Used for certified production reports and official sign-offs.
2. **Tier 2: Scientific & Numerical (Peer-Reviewed / Physical Models):**
   - *Scope:* Finite Element Analysis (FEA), SIMP topology optimization, Runge-Kutta numerical integration, PlaneGCS geometric constraint solvers, and manufacturer engineering handbooks (SKF, Timken, Festo).
   - *Requirement:* Cite paper DOI, author/year, textbook, or manufacturer technical documentation.
3. **Tier 3: Heuristic & Reverse-Engineered (Algorithmic / REA Assisted):**
   - *Scope:* Advanced nesting (No-Fit Polygon, genetic heuristics), reverse-engineered CAD export/import formats, proprietary protocol adapters, and AI-assisted drafting heuristics.
   - *Requirement:* Documented algorithm specification, accompanied by black-box regression benchmarks in `src/tests/`. Must never be an undocumented "magic box".
