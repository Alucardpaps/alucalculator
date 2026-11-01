---
name: calculator-module-builder
description: Step-by-step procedure for adding, porting or scaffolding an engineering calculator/solver module in AluCalc OS (UDA / ModuleRegistry, or extending a legacy src/components/calculators tool). Use when asked to "add a calculator", "new module", "port this calculator", "scaffold a solver", or to expand a whole category (e.g. "add the remaining Science calculators").
---

# Calculator Module Builder

## When to use this skill
- Adding a brand-new calculator/solver.
- Porting a legacy calculator into the UDA pattern.
- Expanding a whole category (use the two-message flow in §4, not one giant pass).

## 1. Decide the pattern (before writing code)
- **New module → UDA:** `src/modules/<category>/<ModuleName>/`.
- **Modifying a tool that already lives in `src/components/calculators/` → keep its pattern**, cite standards, and flag the split to the user instead of force-migrating.
- Never invent a third pattern. Rationale and the two docs that conflict: `references/checklists.md`.

## 2. Workflow
1. **Discovery:** identify the governing standard (ISO/DIN/VDI/ASME) and verify the formula; note whether `src/data/calculatorHubData.ts` or `calculators.json` needs an entry.
2. **Implementation:** scaffold and build (steps below). For a request about a single module, proceed without pausing for confirmation and hand back the formula citation and verification result together with the code. (Whole-category requests use the two-message flow in §4 instead.)
3. **Verification:** follow `.agents/skills/qa-verification-protocol/` → "Calculator output": enter real numbers and compare with a hand-checked or standards-referenced value. "Renders without error" is not verification.

## 3. Build steps (UDA / ModuleRegistry)
1. Create `src/modules/<category>/<ModuleName>/`.
2. `manifest.json` — valid against the `ModuleManifest` schema.
3. `engine.ts` — pure, DOM-free, worker-compatible; returns `EngineMetadata` (`ProjectSchema.ts`) for SHA-256 traceability.
4. `store.ts` — isolated Zustand slice.
5. `index.tsx` — the view; any UI that calculates must import and call `engine.ts` (inline reimplementation is a defect).
6. Register with `ModuleRegistry.register(manifest, MyModuleUI)` — never edit `osStore.ts` directly.
7. Use `WindowAPI` / `RibbonAPI` / `UnifiedDeskAPI` for OS integration, not raw `useOSStore` calls.

## 4. Expanding a whole category (two-message flow)
Do not generate a whole category in one shot.
1. **Message 1 — discovery report only, no code:** list the calculators to add, the governing standard/formula for each, the pattern (UDA vs legacy), the files that would be touched (`calculatorHubData.ts`, `calculators.json`, sitemap, locales) and any formula you could not verify. Then stop for the user's review.
2. **Message 2 — generation:** build the approved list in small batches, running the verification from §2 on each module before the next batch.
This deliberate stop applies only to category-wide work; a single-module request does not pause (§2).

## 5. Before you close the task
- Formula cites exact standard + clause; constants cross-checked against the workspace MCP servers (`math-mcp`, `phys-mcp`, `materials-project-mcp`), not memory.
- 3D preview: dynamic import with `ssr: false`; `<Html>` overlays, never drei `<Text>`.
- Route added to `scripts/generate-sitemap.js` if it is a first-class page; `i18n` entry added if the pipeline expects one (`src/locales`).
- Full list and background: `references/checklists.md`.
