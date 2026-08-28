# AluCalc OS — Agent Execution Plan
# For: Antigravity / Cursor / Claude Code / Codex
# Product: https://www.alucalculator.com
# Date: 2026-08-28
# Priority: strengthen the existing web system. If a desktop app does not strengthen it, SKIP the app and ship theme + design system only.

---

## 0. Mission

AluCalc OS is a Next.js App Router engineering platform (100+ deterministic solvers, 3D parametric configurator, 2D AluCAD, FEA, Academy, PWA, thin Android/Wear Capacitor APK).

The homepage looks like a generic 2025 AI-SaaS dark dashboard (Inter + cyan + rounded cards + cute robot). That is the problem.

**Do in this order:**
1. Map the real repo (do not invent structure).
2. Lock an industrial design system in tokens.
3. Restyle shell + homepage + lite catalog + solver chrome. Do not rewrite solvers.
4. Cheap performance wins that stay inside the web app (PWA cache, font strategy, main-thread hygiene).
5. Desktop/Tauri/Electron **only if** Phase 0 audit proves a native shell would actually help. Default = skip.

**Success:** an engineer opening `/` feels “workshop instrument”, not “v0 landing page”. Calculators still return the same numbers.

---

## 1. Hard rules (agents must not violate)

- Do NOT rewrite solver math, standards formulas, or unit conversions.
- Do NOT change URL slugs. All existing routes must keep working.
- Do NOT introduce glassmorphism, aurora blobs, purple-pink AI gradients, floating 3D toruses, or a cuter mascot.
- Do NOT add motionsites.ai landing templates.
- Do NOT start a Java / JavaFX / Electron / Tauri rewrite in this pass unless Phase 0 says GO.
- Do NOT install a new UI kit across the repo (no full shadcn migration unless tokens already wrap it).
- Do NOT break PWA, license gates, PDF/DXF/STEP quotas, or TR KVKK cookie banner.
- Prefer CSS variables + existing components over new dependencies.
- One visual language for app shell. Marketing flourish only on `/` hero preview, never inside solvers.
- If a file is generated / vendor / wasm / solver kernel — restyle the wrapper, not the kernel.
- Commit in small diffs: tokens → shell → homepage → lite → solver chrome → polish.

---

## 2. Observed production facts (verify in repo, do not assume extra)

Stack signals from live site:

- Next.js App Router + React Server Components (`__next._tree.txt`, `_rsc=`)
- Turbopack hashed chunks under `/_next/static/chunks/`
- Fonts: **Inter** (UI) + **JetBrains Mono** (readouts) from Google Fonts
- PWA: service worker registers at `/`, `manifest.json`, `/icons/icon-192.png`
- Cookie / KVKK banner (TR law 2026/347) overlays homepage
- Version strings seen: `v5.0.0` … `v5.2.0`, BUILD 2026-08-23..26
- Android + Wear APK advertised at **1.16 MB** — thin WebView shell, not a full offline engine bundle
- Top nav: Academy, 3D Studio, Lite, Pricing, Import, Feedback, language flag
- Persistent left sidebar `WORKSPACE` with search + Lite Tools Hub
- Persistent AeGiS Copilot dock bottom-left

### 2.1 Route map (keep stable)

**Shell / product**
- `/` homepage (app chrome + marketing hero — this is the main visual problem)
- `/workspace`
- `/design-studio` (3D parametric — CTA “3D PREVIEW & CONFIGURATOR”)
- `/cad-editor` (2D AluCAD)
- `/fea`
- `/lite` calculator catalog
- `/academy` + `/academy/[slug]`
- `/dashboard`
- `/pricing`
- `/license`
- `/download` APK / Wear
- `/field` field suite
- `/verify`

**Top-level tool pages (examples, not exhaustive)**
- `/bolt-torque` `/bearings` `/gears` `/shafts` `/aluminum` `/fasteners`
- `/pumps` `/strength` `/welding` `/nesting` `/fits` `/beam-deflection`
- `/fatigue` `/fatigue-advanced` `/fluids` `/naval-hydrostatics`
- `/three-phase-power` `/digital-logic` `/filter-design` `/planetary-gearbox`
- `/failure-diagnosis` `/handbook` `/sheet-metal` `/sketch-pad`
- `/materials-db` `/calculator` `/thermal` `/converter`

**Also** `/calculators/[slug]` duplicates exist in sitemap (beam-deflection, bolt-torque, …). Treat these as first-class. Do not delete or redirect unless the repo already does.

Sidebar groups visible on `/`:
- CAD & ENGINEERING STUDIOS (6): Parametric Part Configurator, 2D AluCAD Drafting, FEA Linear Static v1, 2D Sheet Nesting, 1D Linear Cut Optimizer, Technical Sketch Pad
- MECHANICAL SOLVERS ISO/DIN (22+): Bolt Torque VDI 2230, Bearing Life ISO 281, Gear Design ISO 6336, Planetary Gearbox, Gearbox Design Engine, Gearbox Thermal & Lube, Roller Chain ISO 606, Belt Drive ISO 5291, Sheet Metal & Bend, Helical Spring, Shaft Sizing, Motor Selection, …

`/lite` categories: Mechanical (38), Manufacturing, Civil, Electrical, Finance, Science & Math, Other.

Solver page pattern observed (`/chemistry-solver`, `/3-phase-power`):
- App shell (nav + sidebar + AeGiS)
- Title + one-liner
- “Loading…” then Formula / Assumptions / Worked example accordion
- Engine version footer

---

## 3. Phase 0 — Repo recon + go/no-go (do this first, 20–40 min)

### 3.1 Find, do not invent

Report back with real paths:

```
package.json / pnpm-lock / bun.lock
app/ or src/app/          → layout.tsx, page.tsx, globals.css
components/               → Sidebar, TopNav, Copilot, CookieBanner, SolverShell
styles/ or app/globals.css
tailwind.config.*         → if present
public/manifest.json
public/sw.js or next-pwa / serwist / workbox config
capacitor.config.*        → Android wrapper
any rust/wasm/solver/engine directories
```

Commands:

```bash
ls -la
find . -maxdepth 3 -type f \( -name "package.json" -o -name "layout.tsx" -o -name "globals.css" -o -name "tailwind.config.*" \)
rg -n "WORKSPACE|AeGiS|INDUSTRIAL ENGINEERING" --glob '!node_modules' --glob '!.next'
rg -n "--background|--cyan|Inter|JetBrains" app src styles --glob '!node_modules'
```

### 3.2 Performance go/no-go for a PC app

A desktop wrapper is **NO-GO** (default) unless ALL of these are true:

1. Heavy work (FEA, nesting, mesh, STEP write) runs on the **main JS thread** and freezes UI > 200 ms on mid PCs.
2. There is already a separable solver kernel (pure TS module or WASM) that a Tauri sidecar could call without a rewrite.
3. The 1.16 MB APK currently **fetches the site over the network** for solvers (confirm in Capacitor start URL + SW cache list).

If any point is false → **skip desktop entirely**. Do theme + tokens + PWA cache only.

If APK is a remote WebView: the real “system strengthen” is **precaching solver chunks in the PWA / bundling assets into the APK**, not a new Windows exe.

Write a short `PHASE0.md` in repo root with: stack, key files, go/no-go, and which phase to run.

---

## 4. Design system — “Instrument”, not “SaaS”

Name internally: **AluCalc Instrument**.

Inspiration: CNC controller panel, Mitutoyo readout, Fluke meter, brushed aluminum rack — **not** Linear/Vercel marketing, not glassmorphism.

### 4.1 Tokens (implement as CSS variables on `:root`, map to Tailwind if the project uses it)

```css
:root {
  /* surfaces — cooler, denser, less “glow card” */
  --bg-0: #07090c;
  --bg-1: #0c1016;
  --bg-2: #121821;
  --bg-3: #18202b;
  --line: #243041;
  --line-strong: #334155;

  /* aluminum + warning amber, keep cyan but shift to instrument cyan */
  --alu: #c5cdd6;
  --alu-dim: #8b96a4;
  --ink: #e7edf4;
  --muted: #8a96a6;

  --cyan: #3ad0e6;
  --cyan-dim: #1a8fa3;
  --cyan-glow: color-mix(in oklab, var(--cyan) 22%, transparent);

  --ok: #3dd68c;
  --warn: #e6b84a;
  --bad: #e85d5d;
  --std: #7aa2ff; /* ISO/DIN chip */

  --radius-s: 4px;   /* controls, chips — tighter than current */
  --radius-m: 8px;   /* cards */
  --radius-l: 12px;  /* shells only */

  --font-ui: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --sidebar-w: 272px;
  --topbar-h: 52px;
}
```

Rules:
- Body text: Inter. Numbers, units, formulas, version tags: JetBrains Mono.
- Default radius 4–8px. Ban 16–24px “pill cards” on tool tiles.
- Borders > shadows. If shadow exists, 1px hairline + 8px faint cyan only on focus/active.
- Cyan is for **state and primary action**, not big filled panels.
- Feature cards on `/` may stay, but they become instrument modules (icon in a 28px well, mono label, no marketing blurb walls).

### 4.2 Anti-patterns to delete when you touch a file

- Soft huge blur glow behind hero title
- Identical 5-column icon-tile graveyard without hierarchy
- Cookie banner covering the primary CTA (reposition bottom or inline under hero)
- Generic “cute robot on infinite grid” as the only product proof — replace preview with a **real solver or 3D part snapshot** (static image or live canvas already in repo). If no asset exists, keep the canvas but drop the kawaii robot or treat AeGiS as a small HUD badge, not the hero subject.
- Gradient text on every heading. One accent line max.

### 4.3 Motion

- Homepage hero preview may have a slow 8–12s loop (gait / part rotate) if the canvas already exists.
- Solver pages: no decorative motion. Input focus ring 120ms. Result numbers tick only if a component already does it.
- Honor `prefers-reduced-motion`.

---

## 5. Phase 1 — Tokens + shell (mandatory)

Touch only global chrome:

1. `globals.css` (or equivalent): write the token block. Replace hardcoded `#0x` / `rgb` cyan/navy that duplicate theme.
2. Root `app/layout.tsx` (or `src/app/layout.tsx`): keep Inter + JetBrains Mono. Self-host fonts if they are currently render-blocking Google CSS (`next/font`). This is a real perf win.
3. Top nav component: height 52px, hairline bottom border, quieter secondary buttons. Primary remains one cyan action max.
4. Sidebar:
   - Keep search and groups.
   - Active item: 2px left cyan bar + `--bg-3`, not a glowing pill.
   - Section labels: 10–11px mono uppercase tracking.
   - Badges (`3D`, `2D`, `V1`, `PLANET`) use `--std` / `--cyan-dim` chips, 4px radius.
5. AeGiS dock: compact. Do not enlarge.
6. KVKK banner: do not remove. Move so it does not eat the hero CTA. Persist consent as today.

Acceptance:
- `/` `/lite` `/bolt-torque` `/pricing` `/download` still render.
- No solver output change.
- Visual density up, glow down.

---

## 6. Phase 2 — Homepage `/` (mandatory)

Homepage is both marketing and app. Do **not** split into a separate marketing site in this pass (too much routing risk). Restyle in place.

Keep:
- Sidebar + top nav + AeGiS
- Headline promise (CAD + engineering intelligence)
- Three CTAs: 3D configurator → `/design-studio`, 2D → `/cad-editor` or labeled 2D AluCAD route, APK → `/download`

Change:
1. Hero left: tighter type scale. Subcopy max 2 sentences. Drop repeated “deterministic” stacking if it appears twice.
2. Hero right: product proof, not mascot. Prefer live miniature of configurator or last-opened solver readout (`NOMINAL` / `100+ SOLVERS ACTIVE` can stay as status HUD).
3. Below fold “Comprehensive Engineering Ecosystem”: 3 modules max, then a dense standards strip (VDI 2230, ISO 281, ISO 6336, DIN 6935…) in mono — this is the brand.
4. Kill duplicate marketing essays if they repeat the hero. One “how engineers use this” block is enough.
5. Mobile: sidebar collapse already exists; ensure hero CTAs stack and banner does not cover them.

Do not add new sections, testimonials, logo clouds, or pricing on `/`.

---

## 7. Phase 3 — `/lite` catalog + solver chrome (mandatory)

`/lite` problem: 40 identical rounded tiles.

Replace tile visual (keep grid and links):
- 8px radius, `--bg-2` fill, `--line` border
- 18–20px line icon, no circular gray well if it looks like Material 2018
- Title 13–14px. Optional mono standard tag when the tool has one (`VDI 2230`)
- Hover: border `--cyan-dim`, no scale bounce
- Category headers stay. Add a sticky search if one exists; do not build a new filter system.

Solver chrome (`Formula · assumptions · example` pages):
- Restyle accordion + “Loading…” skeleton only
- Result/output area: mono, high contrast, unit in `--alu-dim`
- Do not restyle canvas/WebGL/FEA viewports beyond container border

If a shared `SolverLayout` / `ToolPage` exists — that is the only file you should need for 80+ pages. **Find it and change it once.**

---

## 8. Phase 4 — System strengthen without a PC app (do if cheap)

Only after Phase 1–3 compile.

### 4A. Fonts
- `next/font/google` or local files. Stop extra CSS request to fonts.googleapis.com on first paint.

### 4B. PWA cache (this is the real answer to “internet yavaş”)
- Inspect current SW.
- Precache: app shell, sidebar registry, lite index, most-used solver JS chunks, materials subset.
- Runtime cache for `/_next/static/chunks/*` (cache-first).
- Do not precache all academy articles.
- Goal: second visit + airplane mode opens `/` and `/lite` and at least bolt-torque / bearings / converter.

### 4C. Main thread
- If a solver file does nested loops / nest / FEA on the main thread, wrap **that function** in an existing Worker if the repo already has one. Do not invent a new worker framework.
- Dynamic-import 3D / FEA / cad-editor so `/` and `/lite` do not download Three/OCC/whatever.

### 4D. APK
- If Capacitor `server.url` points at production: either bundle `webDir` from `next export` / standalone static, or document that APK cannot be fast until that changes.
- Do not rebuild Play signing in this pass unless the project already has a one-command APK script.

Stop here. This is “strengthen the system”.

---

## 9. Phase 5 — Desktop app (OPTIONAL, default SKIP)

Run only if Phase 0 wrote `DESKTOP=GO`.

Allowed approach: **Tauri 2 wrapper around the same Next standalone build**, or Capacitor Electron if Capacitor is already the mobile path.

Forbidden: Java desktop, full C# rewrite, “port every solver to native”.

Minimum desktop slice:
- Window, icon, local file open/save for project JSON
- Load bundled web build (no remote URL)
- Updater later

If this slice is more than ~1 day of agent work or requires new Rust solver code — **abort Phase 5 and ship Phases 1–4.**

---

## 10. Suggested file edit order

1. `PHASE0.md` (recon notes)
2. global CSS tokens
3. `layout.tsx` fonts
4. Sidebar component
5. Top nav component
6. Cookie banner layout
7. `app/page.tsx` (homepage)
8. Shared solver layout
9. `app/lite/page.tsx` (or whatever the catalog is)
10. PWA / font / dynamic import only if time

Do not spray 80 calculator pages individually.

---

## 11. Acceptance checklist

- [ ] `pnpm dev` / `npm run dev` serves `/` `/lite` `/pricing` `/design-studio` `/bolt-torque`
- [ ] Visual: darker, tighter radius, mono readouts, less glow
- [ ] No new decorative libraries
- [ ] Cookie banner usable and not blocking primary CTA
- [ ] AeGiS still opens
- [ ] License limits still enforced
- [ ] Solver numeric fixtures (if any test exists) still pass
- [ ] Lighthouse contrast on body text AA
- [ ] `prefers-reduced-motion` does not break layout
- [ ] PHASE0.md states DESKTOP=SKIP or GO with evidence

---

## 12. Prompt the user-agent should paste (short)

Use this as the kickoff message inside Antigravity / Cursor:

```
Read ALUCALC_AGENT_PLAN.md at repo root (or paste).

You are implementing AluCalc Instrument theme + cheap system wins on the existing Next.js App Router app.

Start with Phase 0 recon. List real files. Decide DESKTOP=SKIP unless evidence says GO.

Then implement Phase 1 tokens/shell, Phase 2 homepage, Phase 3 lite + shared solver chrome.

Do not rewrite solver math. Do not add glassmorphism or new marketing sections.
Do not start Tauri/Electron/Java.

After each phase, show a diff summary and the files you touched.
Stop and ask if you cannot find a shared SolverLayout and would have to edit 80 pages.
```

---

## 13. Out of scope (ignore unless user says otherwise)

- New calculators
- Academy curriculum content
- Pricing table copy / Stripe
- AeGiS model quality
- iOS app
- 21st.dev component shopping spree
- ui-ux-pro-max auto design system dump (tokens above override any skill output)
- Brand-new marketing microsite

If ui-ux-pro-max-skill is installed, constrain it:

```
Product: industrial CAD / engineering instrument.
Style: precision instrument, dense dark workshop.
Forbidden: glassmorphism, claymorphism, aurora, soft UI, agency landing, cute 3D mascot hero.
Palette: bg #07090c / ink #e7edf4 / cyan #3ad0e6 / warn #e6b84a / mono JetBrains Mono.
```
