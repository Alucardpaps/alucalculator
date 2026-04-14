# AluCalc UDA Module Author Guide

Welcome to the AluCalculator Unified Desk Architecture (UDA). This guide explains how to add new calculators, editors, and tools to the platform without breaking core system architecture.

## 1. Core Principles
- **No Direct Core Modification**: Never modify `osStore.ts` or internal UDA loops to register your module. Use the `ModuleRegistry` API.
- **Engine Metadata**: All calculation engines must return the `EngineMetadata` interface defined in `ProjectSchema.ts`. This ensures traceability and SHA-256 validation for engineering reports.
- **Project Phoenix UX**: Use the system dark theme variables (`var(--color-os-canvas)`, `var(--color-os-ribbon)`).

## 2. Creating a Module
1. Create a directory in `src/modules/<category>/<ModuleName>`.
2. Define a `manifest.json` using the `ModuleManifest` schema.
3. Write your `engine.ts` logic securely without DOM dependencies (for future WebWorker compatibility).
4. Create a `store.ts` using `zustand` for local state.
5. Create an `index.tsx` as your primary View.

## 3. Registering Your Module
Create a bootstrapper or hook that calls:
```typescript
import { ModuleRegistry } from '@/engine/module/ModuleRegistry';
import manifest from './manifest.json';
import MyModuleUI from './index.tsx';

ModuleRegistry.register(manifest, MyModuleUI);
```

## 4. Interacting with the OS
Do not call `useOSStore` directly for generic actions. Instead:
- **Window Mgmt:** Use `new WindowAPI(myWindowId)` to focus, close, or minimize.
- **Ribbon Integration:** Use `RibbonAPI.registerCommands(...)` to inject tools dynamically.
- **Desktop Awareness:** Use `UnifiedDeskAPI.getWorkspaceMode()` to understand the user's current environment.
