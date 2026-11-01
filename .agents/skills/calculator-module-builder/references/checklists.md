# Calculator Module Builder — Checklists & Background

## A. Why UDA is the default for new modules
Two documented patterns coexist:
- `CONTRIBUTING.md` — simpler pattern: logic/UI in `src/components/calculators/`, pure testable functions, cited formulas.
- `MODULE_AUTHOR_GUIDE.md` — Unified Desk Architecture: `src/modules/<category>/<ModuleName>/` with `manifest.json`, `engine.ts`, `store.ts`, `index.tsx`, registered through `ModuleRegistry.register()`.

Treat UDA as current for any new module (the OS integration — `WindowAPI`, `RibbonAPI`, `UnifiedDeskAPI` — is built around it). When extending a calculator that already lives under `src/components/calculators/`, match its pattern and tell the user about the split.

## B. Constraints that hold for both patterns
- Every engine returns `EngineMetadata` (`ProjectSchema.ts`).
- Every formula has a cited standard (ISO/DIN/VDI/ASME) in a comment or accompanying data — no uncited magic constants.
- 3D content: `dynamic(..., { ssr: false })`; never `@react-three/drei`'s `<Text>` (CSP) — use `<Html>`.
- a11y: icon-only buttons need `aria-label`; semantic HTML; WCAG AA contrast.
- **Engine-Sharing Rule (MANDATORY):** any UI surface performing a calculation already covered by a module `engine.ts` must import and call that engine.

## C. Formula sourcing
Cite the exact standard and clause where practical (e.g. "ISO 281:2007, basic rating life"). Cross-check constants and material properties against the MCP servers configured in this workspace's `.mcp.json` (`math-mcp`, `phys-mcp`, `materials-project-mcp`). If a value can't be found or verified, say so — don't invent a plausible-looking constant.

## D. Don't-forget list
- [ ] 3D preview dynamic-imported with `ssr: false`; `<Html>` overlays instead of drei `<Text>`.
- [ ] Route added to `scripts/generate-sitemap.js` (first-class pages).
- [ ] `i18n` locale entry added if expected (`src/locales`).
- [ ] Index entry in `src/data/calculatorHubData.ts` / `calculators.json` if applicable.
- [ ] Closed out through `.agents/skills/qa-verification-protocol/`.
