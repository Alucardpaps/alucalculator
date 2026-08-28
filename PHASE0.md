# AluCalc OS — Phase 0 Reconnaissance & Audit Report

**Date:** 2026-08-28  
**Author:** Antigravity Engineering Agent  
**Target:** AluCalc OS (https://www.alucalculator.com)

---

## 1. Verified Architecture & File Mapping

| Component | Verified Path | Notes |
|---|---|---|
| **Package & Config** | `package.json`, `next.config.ts`, `tsconfig.json` | Next.js 16.2 (App Router), React 19.2, Tailwind CSS v4 |
| **Root Layout & Global CSS** | `src/app/layout.tsx`, `src/app/globals.css` | Uses Inter & JetBrains Mono; contains HUD primitives & tokens |
| **Top Navigation** | `src/components/os/NavigationHeader.tsx` | Sticky header with locale dropdown, AluShare import/feedback |
| **Sidebar Workspace** | `src/components/layout/DesktopSidebar.tsx` | Collapsible sidebar with category navigation & search |
| **Copilot & Mascots** | `src/components/copilot/AegisHeroStage.tsx`, `AICopilotOverlay.tsx` | Hero stage mascot + omnipresent assistant dock |
| **Cookie / KVKK Banner** | `src/components/os/CookieConsent.tsx` | Floating consent modal |
| **Homepage** | `src/app/page.tsx`, `src/components/home/HomePageContent.tsx` | Marketing hero + 3 pillars + standards strip + APK download |
| **Lite Catalog** | `src/app/lite/page.tsx`, `src/app/lite/LiteClient.tsx` | Dynamic module catalog with 8 category groups |
| **Shared Solver Engines** | `src/app/[module]/page.tsx`, `src/components/os/WindowContent.tsx` | Centralized router for 80+ dynamic module solvers |
| **SEO Calculator Suite** | `src/app/calculators/[slug]/page.tsx`, `src/components/os/SEOPage.tsx` | Slug-driven parametric formula solver layout |
| **Solver Methodology Chrome** | `src/components/solvers/SolverTransparencyDrawer.tsx`, `[module]/page.tsx` | Shared "Formula · Assumptions · Example" accordion |
| **PWA & Offline** | `public/sw.js`, `public/manifest.json`, `ServiceWorkerRegistration.tsx` | Cache-first static, stale-while-revalidate for solvers |
| **Android APK Shell** | `android/twa-manifest.json` (`@bubblewrap/cli`) | Trusted Web Activity (TWA) pointing to `https://www.alucalculator.com` |

---

## 2. Desktop Go / No-Go Decision

### Verdict: **`DESKTOP=SKIP`**

### Evidence & Rationale:
1. **APK is a Thin TWA Remote Wrapper:** `android/twa-manifest.json` confirms package `com.alucard.alucalcos` is a Google Bubblewrap TWA wrapper whose `startUrl` is `https://www.alucalculator.com/workspace`. Slowness is caused by network roundtrips for un-cached assets, not local JS engine limits.
2. **Client-Side Solver Execution:** Solvers are already deterministic pure TypeScript modules (`mathjs`, `decimal.js`, `nerdamer`) running client-side with low latency.
3. **No Heavy WASM/Rust Native Requirement:** The system does not have an external standalone Rust/C++ engine requiring a Tauri sidecar; introducing one would be an unmaintainable duplicate rewrite.
4. **Optimal Path:** The real performance and robustness win is **PWA caching (pre-caching core solver bundles and materials)** and **font self-hosting via `next/font/google`**, which eliminates external render-blocking network requests for both web users and the Android APK.

---

## 3. Execution Sequence

- [x] **Phase 0:** Reconnaissance & Desktop Decision (`DESKTOP=SKIP`).
- [ ] **Phase 1:** CSS Tokens (`:root` AluCalc Instrument palette) + Shell (NavigationHeader, DesktopSidebar, CookieConsent).
- [ ] **Phase 2:** Homepage `/` (CNC panel aesthetic, tight type scale, status HUD, standards strip, remove glow blobs).
- [ ] **Phase 3:** `/lite` Catalog + Shared Solver Chrome (`LiteClient`, `[module]/page.tsx`, `SolverTransparencyDrawer`, `SEOPage`).
- [ ] **Phase 4:** System Optimization (`next/font/google` font self-hosting, Service Worker precache expansion).
