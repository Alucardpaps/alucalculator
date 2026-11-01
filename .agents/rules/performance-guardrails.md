---
description: Performance patterns to enforce in React/Three.js/Zustand code, based on a prior profiling audit (OPTIMIZATIONS.md). Apply to state stores and 3D components.
---
# Performance Guardrails

**Suggested activation: Glob — `src/store/**`, `src/components/**/*.tsx`, `src/**/*Store.ts`.**

These are confirmed patterns from a prior audit (`OPTIMIZATIONS.md`, root) — don't reintroduce them.

## Rules

1. **Memoize Three.js geometry.** Never construct `new THREE.ExtrudeGeometry(...)` / `EdgesGeometry(...)` (or similar) inline in JSX or on every render — wrap in `useMemo` keyed on the actual inputs (profile shape, extrude settings). Un-memoized geometry allocation was the single biggest measured cost (`TechnicalDrawing3D.tsx`).
2. **Debounce high-frequency persistence.** Zustand `persist` middleware must not serialize on every drag/pointer-move tick (e.g. `flowStore.ts` node position updates). Debounce writes, or exclude transient fields (live drag position) from the persisted slice.
3. **Avoid O(N) array scans for ID-based updates.** For stores that grow past ~50 items (nodes, windows), prefer a keyed/normalized shape (`Record<string, T>`) or memoized selectors over `.map()`/`.find()` on every update.
4. **Memoize derived graph computations** (e.g. topological sort) — invalidate only when edges actually change, not on every read.
5. **No `console.log` in hot paths** (render loops, store propagation) — measurably slows execution and should never ship.
6. **Dynamic-import anything importing Three.js, OpenCascade/WASM, or the CAD/FEA engines**, with `ssr: false` and a lightweight loading state, so `/` and `/lite` never pull that bundle.

## Validation

Before claiming a performance fix is done: profile a 10-second continuous drag/interaction in Chrome DevTools Performance (target <16ms scripting per frame) and take before/after heap snapshots for anything touching 3D geometry. A memoization diff without a profile is a guess, not a verified fix — see `.agents/skills/qa-verification-protocol/`.
