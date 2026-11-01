# /new-calculator

Streamlined workflow for scaffolding and building new engineering calculators:

1. **Specification & Planning**: Identify the cited standard (ISO/DIN/VDI/ASME), input/output parameters, and module target (`src/modules/<category>/<ModuleName>/`).
2. **Build & Register**: Follow `.agents/skills/calculator-module-builder/` to scaffold `manifest.json`, `engine.ts`, `store.ts`, and `index.tsx`, registering via `ModuleRegistry`.
3. **Verification**: Verify calculations, syntax, and types via unit tests (`vitest`) or `npm run build`.
