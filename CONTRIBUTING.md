# Contributing to AluCalc OS

Thank you for your interest in contributing to AluCalc OS! Our goal is to build the most comprehensive, fast, and accessible browser-based engineering calculation suite.

This document outlines the architecture, standards, and processes for adding new calculators, fixing bugs, or improving the 3D modules.

## Architecture Overview

AluCalc OS is built on **Next.js 16 (App Router)** and utilizes static site generation (SSG) for lightning-fast performance.
The codebase relies heavily on **TypeScript** and **Tailwind CSS**. 

Key areas:
- `src/app/`: The Next.js routing layer. Calculators are dynamically mapped and exported statically.
- `src/components/`: Reusable React components.
  - `src/components/calculators/`: Logic and UI for specific engineering calculators.
  - `src/components/ui-3d/`: Components that interface with `react-three-fiber` and Three.js.
- `src/data/`: JSON data files containing metadata, SEO information, and formulas.

## Setting Up Your Development Environment

1. Clone the repository.
2. Install dependencies via `npm install`. (Do not use `yarn` or `pnpm` to avoid lockfile conflicts).
3. Run the development server with `npm run dev`.

### Adding a New Calculator

When contributing a new calculator module, follow these rules:

1. **Deterministic Logic:** Ensure all mathematical formulas are cited (ISO, DIN, ASME) and placed inside pure, testable functions.
2. **State Management:** Use localized state hooks. Avoid global stores unless necessary for the `ProjectVault` or cross-calculator data exchange.
3. **No Direct Remote Font Calls:** Do NOT use `@react-three/drei`'s `<Text>` component inside 3D canvases, as it attempts to download `.woff` files and violates our strict Content Security Policy (CSP). Use `<Html>` components to overlay standard DOM text onto the 3D canvas instead.
4. **Lazy Loading 3D:** Any component rendering a `<Canvas>` (Three.js) MUST be dynamically imported with `ssr: false` via `next/dynamic`. This prevents hydration mismatches and maintains our high performance scores.

Example:
```tsx
import dynamic from 'next/dynamic';

const Engineering3DView = dynamic(() => import('@/components/ui-3d/engineering-3d').then(mod => mod.Engineering3DView), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-800 rounded-xl h-64 w-full">Loading 3D Engine...</div>
});
```

## Accessibility (a11y) Standards

We strive for an inclusive platform:
- All icon-only buttons must have an `aria-label` attribute describing their action (e.g., `aria-label="Toggle Theme"`).
- Use semantic HTML (`<main>`, `<article>`, `<nav>`).
- Ensure contrast ratios in Tailwind classes meet WCAG AA standards (especially for text over background colors).

## Pull Request Process

1. Create a feature branch from `main` (e.g., `feature/add-stress-calc`).
2. Implement your changes following the architectural rules.
3. Run `npm run lint` and fix any warnings or errors.
4. Run a local build `npm run build` to ensure the static export and SSG processes succeed.
5. Push your branch and open a Pull Request describing your changes, the formulas utilized, and the visual/UI impacts.

---
*By contributing to AluCalc OS, you agree that your contributions will be licensed under the project's open-source license.*
