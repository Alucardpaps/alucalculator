---
description: Which calculator/module architecture pattern applies, and the constraints that hold for both. Apply before adding or restructuring a calculator.
---
# Module Architecture — resolve before you build

**Suggested activation: Glob — `src/modules/**`, `src/components/calculators/**`, `src/engine/**`.**

## Known doc conflict — pick deliberately, don't invent a third pattern

Two documented patterns currently coexist and describe different things:

- **`CONTRIBUTING.md`** describes a simpler pattern: calculator logic/UI in `src/components/calculators/`, pure testable functions, formulas cited (ISO/DIN/ASME).
- **`MODULE_AUTHOR_GUIDE.md`** describes the newer **Unified Desk Architecture (UDA)**: `src/modules/<category>/<ModuleName>/` with `manifest.json` (validated against the `ModuleManifest` schema), `engine.ts` (DOM-free, worker-compatible), `store.ts` (Zustand), `index.tsx`, registered via `ModuleRegistry.register()` — never by editing `osStore.ts` directly.

Treat **UDA / `ModuleRegistry` as current** for any new module — it's the pattern the OS-level integration (`WindowAPI`, `RibbonAPI`, `UnifiedDeskAPI`) is built around. If you're extending an existing calculator that already lives under `src/components/calculators/`, match its existing pattern rather than force-migrating it mid-task; flag the split to the user instead of silently standardizing everything in one pass. See `.agents/skills/calculator-module-builder/` for the full build procedure either way.

## Constraints that hold regardless of pattern

- Every engine returns the `EngineMetadata` interface (`ProjectSchema.ts`) for traceability/SHA-256 validation.
- Every formula or algorithm needs a cited methodology tier (Normative ISO/DIN standard, Scientific paper/handbook, or benchmarked Heuristic/REA spec) in a comment or accompanying data — no uncited "magic number" constants.
- 3D content: dynamic-import with `ssr: false`; never `@react-three/drei`'s `<Text>` (CSP) — use `<Html>` overlays.
- a11y: icon-only buttons need `aria-label`; semantic HTML; WCAG AA contrast.
- **Engine-Sharing Rule (MANDATORY):** Any UI surface that performs a calculation already covered by a module `engine.ts` must import and call that engine. Inline reimplementation is a defect.

