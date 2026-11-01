# NOW_WORKLOG.md — AluCalc OS Now-Gate Inventory & Audit

**Date:** 2026-09-13  
**Status:** Completed (Phase 0a / Now Scope Fully Executed)  
**Author:** Antigravity Engineering Agent

---

## 1. Hardcoded Calculator / Module / Solver Counts

| File:Line | Extracted String / Pattern | Current Context & Disposition |
|---|---|---|
| `README.md:47` | `250+ engineering routes and calculators` | Marketing inflation. Replace with exact canonical count. |
| `ALUCALC_AGENT_PLAN.md:11` | `100+ deterministic solvers` | Roadmap rounding. Replace with canonical integer. |
| `ALUCALC_AGENT_PLAN.md:242` | `100+ SOLVERS ACTIVE` | Status HUD mockup. Standardize to canonical count. |
| `src/config/app.ts:13` | `APP_MODULE_COUNT = 91` | Stale frozen count. Rebind to `solverCount` from `calculatorRegistry.ts`. |
| `public/manifest.json:5` | `91 modules, 3D CAD assembly...` | Replace with canonical solver count. |
| `public/manifest.json:85` | `91 modules for mechanical, structural...` | Replace with canonical solver count. |
| `src/components/os/GlobalCommandPalette.tsx:229` | `Search 120+ tools or evaluate math...` | Replace with canonical module count. |
| `src/locales/t12table.json:1` | `Search 120+ tools or evaluate math...` | Locale table entry matching command palette. |
| `src/app/field/page.tsx:5` | `Field Engineering Suite (24+ Offline Mobile Tools)` | Inconsistent count. `FIELD_TOOLS` array contains 34 tools. Update to 34. |
| `src/app/field/FieldClient.tsx:8` | `Integrates all 24 hardware & empirical field modules` | Update to 34 tools. |
| `src/app/field/FieldClient.tsx:1012` | `{/* ─── TOOLS GRID (24 TOOLS) ─── */}` | Update comment to 34 tools. |
| `src/app/field/FieldClient.tsx:1077` | `{/* ─── INTERACTIVE MODALS FOR ALL 24 TOOLS ─── */}` | Update comment to 34 tools. |
| `src/components/layout/DesktopSidebar.tsx:129` | `Field Engineering Suite (24 Tools)` / `24 TOOL` | Update badge and label to 34 Tools. |
| `src/locales/sidebarTranslations.ts:1002` | `Field Engineering Suite (24 Tools)` | Update translations to 34 Tools. |
| `src/app/pricing/PricingClient.tsx:37, 43, 138` | `${APP_MODULE_COUNT} modules` | Automatically inherits locked canonical solver count. |
| `src/app/changelog/page.tsx:40, 84, 86` | `${APP_MODULE_COUNT}` | Automatically inherits locked canonical solver count. |
| `src/config/modules.ts:737-739` | `TOTAL_MODULES = APP_MODULE_COUNT` | Directly bound to canonical count. |

---

## 2. Claim Freeze Inventory (User-Facing Copy)

| Item / Claim | File:Line | Exact Snippet | Planned Resolution |
|---|---|---|---|
| **Zero Hallucination** | `src/components/home/HomePageContent.tsx:122` | `<CheckCircle2 size={12} /> Zero Hallucination` | Replace with deterministic solver badge. |
| **Zero Hallucination** | `src/locales/homeTranslations.ts:61` | `statsVerifiedDesc: 'Zero hallucination engineering math'` | Replace with `Deterministic engineering solver math`. |
| **Zero Hallucination** | `src/locales/homeTranslations.ts:71` | `cardSolversDesc: 'Guaranteed mathematical accuracy with zero hallucinations...'` | Replace with `Deterministic mathematical verification across VDI 2230, ISO 281...`. |
| **Zero Hallucination** | `src/locales/homeTranslations.ts:243` | `cardSolversDesc: 'Précision mathématique garantie sans hallucination...'` | French translation update to deterministic solver copy. |
| **96.4% Yield** | `src/components/home/InteractiveNestingCard.tsx:18` | `96.4% Yield` | Replace with `Optimized Stock Yield` (no unmeasured precision). |
| **100% Offline Engine** | `src/app/download/DownloadClientPage.tsx:199` | `{t12(language, '100% Offline Engine', '100% Çevrimdışı Motor')}` | Replace with `Precached Offline Solvers` to align with `MOBILE_TRUTH.md`. |
| **Offline Claims** | `src/app/download/page.tsx:7` | `...for offline engineering calculation, 2D AluCAD, and 3D design workstation.` | Qualify: Core listed solvers work offline once precached. |
| **Offline Claims** | `src/app/field/FieldClient.tsx:2983` | `Tap "Add to Home Screen" in your browser to install as an instant offline widget.` | Keep (describes PWA standard). |
| **FEA Kernel** | `src/engine/workers/feaWorker.ts` | Production 3D Truss FEA solver via WebWorker. | No overstatement found in public copy. Retain worker implementation without advertising full continuum 3D FEA. |
| **PlaneGCS Badge** | `src/components/home/HomeHeroSection.tsx:156` | `PlaneGCS` placed in VDI/ISO/DIN standard norm chip row. | Move/replace chip with recognized standard `ISO 286 (Limits & Fits)`. |
| **STABLE ISO 10303** | `src/app/pricing/PricingClient.tsx:162` | `STEP 3D B-Rep export (STABLE ISO 10303)` | Change to `STEP 3D B-Rep export (AP214 / AP203)`. |
| **RSA-2048** | `src/app/download/DownloadClientPage.tsx:100` | `RSA-2048 (SHA-256 Validated)` | Delete string completely. |

---

## 3. Keystore & Credential Exposure Status

- **Tracking Status in Git:**
  - `android/alucalc-release.keystore`: **TRACKED** (Present in `git ls-files`)
  - `android-wear/alucalc-release.keystore`: **TRACKED** (Present in `git ls-files`)
- **Gitignore Status:**
  - `*.keystore` and `*.jks` are **ABSENT** from `.gitignore`.
- **Mitigation Strategy (Phase 0a):**
  - Execute `git rm --cached android/alucalc-release.keystore android-wear/alucalc-release.keystore`.
  - Preserve local files on disk (prevent developer build breakage).
  - Append rules to `.gitignore`.
  - Do NOT rewrite git history or force-push (reserved for Phase 0b scheduled cutover).
- **Replacement Keytool Command (For Human Execution):**
  ```bash
  keytool -genkeypair -v -keystore android/alucalc-release.NEW.keystore -alias alucalc -keyalg RSA -keysize 2048 -validity 10000
  keytool -genkeypair -v -keystore android-wear/alucalc-release.NEW.keystore -alias alucalc -keyalg RSA -keysize 2048 -validity 10000
  ```

---

## 4. Secret Scan Results (Working Tree & Recent Docs)

Scanned patterns: `sk-`, `AIza`, `postgres://`, `ghp_`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`.

| Pattern | Finding | Assessment |
|---|---|---|
| `AIza` | 0 hits | Clean. |
| `ghp_` | 0 hits | Clean. |
| `postgres://` | 0 hits in code (1 example string in `DEPLOYMENT_GUIDE.md:24`) | Safe documentation placeholder. |
| `sk-` | `src/app/api/analyze/route.ts:9` (`apiKey === 'sk-ant-...'`) | Safe placeholder validation check. |
| `NEXTAUTH_SECRET` | `src/lib/auth.ts:124` (`process.env.NEXTAUTH_SECRET`), `DEPLOYMENT_GUIDE.md:25` | Clean env-var reference. |
| `DATABASE_URL` | `src/lib/db.ts:9` (`process.env.DATABASE_URL`), `DEPLOYMENT_GUIDE.md:24` | Clean env-var reference. |
| `GOOGLE_CLIENT_SECRET` | `src/lib/auth.ts:23` (`process.env.GOOGLE_CLIENT_SECRET!`), `DEPLOYMENT_GUIDE.md:28` | Clean env-var reference. |

**Verdict:** Zero active production secrets or hardcoded tokens are committed in source code.

---

## 5. Android Manifest Reality (`android/twa-manifest.json`)

- **Package ID:** `com.alucard.alucalcos`
- **Host:** `www.alucalculator.com`
- **Application Name:** `AluCalc OS` (Launcher: `AluCalc`)
- **Start URL:** `/workspace`
- **Display:** `standalone`
- **Type:** Google Bubblewrap Trusted Web Activity (TWA) wrapper (~1.16 MB APK).
- **Contents:** Native Android WebView shell delegating rendering to Chrome/Chromium Custom Tabs. No bundled offline 3D CAD or solver binaries.

---

## 6. Module & Engine Ecosystem Distribution

- **`src/modules/`:** 20 directories containing `index.tsx` (UDA pattern).
- **`src/components/calculators/`:** 10 component files (legacy pattern).
- **`src/data/calculatorHubData.ts`:** 48 registered modules in `CALCULATOR_HUB_MODULES`. All 48 verified to have reachable routes in `src/app/` or dynamic `[module]` maps.
- **`src/data/seo-calculators/calculators.json`:** 44 SEO calculator records.
- **`src/config/modules.ts`:** 104 registered module types (77 initial base registry + 27 distinct imported from `calculatorsDB`).
- **Canonical Lock Choice:** `calculatorHubData.ts` contains **48 verified modules** with reachable routes. Locking `solverCount = 48`.

---

## 7. Hero Quick-Solvers & Engine Sharing

- **Component:** `src/components/home/InteractiveSolverPreview.tsx`
- **Engine-Sharing Compliance:** RESOLVED.
- **Implementation:**
  - Bolt torque tab → calls `computeBoltAssembly` from `@/lib/fastener/sharedEngine` (VDI 2230).
  - Bearing life tab → calls `calculateBearingLifeL10h` from `@/utils/mathEngines/bearingLife` (ISO 281).
  - Beam deflection tab → calls `simplySupportedCenterPoint` from `@/utils/mathEngines/beamDeflection` (Euler-Bernoulli / Roark).

---

## 8. Verification & Execution Sign-Off

1. **Keystore Exposure Check:**
   - Command: `git ls-files | Select-String "keystore"`
   - Result: 0 matches (untracked, ignored via `.gitignore`).
2. **Deterministic Solver Registry & Vitest:**
   - Registry: `src/lib/registry/calculatorRegistry.ts` (48 verified solvers, 34 field tools, 15 academy units).
   - Test File: `src/tests/calculator-registry.test.ts` (4/4 tests passed).
   - Full Test Suite: `npx vitest run` → **53 test files passed, 448 tests passed, 0 failures**.
3. **Static Type Checking:**
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** across entire codebase.
4. **Claim Freeze Verification:**
   - `250+`: 0 occurrences remaining in `src/` and `README.md`.
   - `Zero Hallucination`: 0 occurrences remaining in `src/`.
   - `96.4% Yield`: 0 occurrences remaining in `src/`.
   - `RSA-2048`: 0 occurrences remaining in `src/`.
5. **Mobile Truth & Version Manifest:**
   - `docs/MOBILE_TRUTH.md` created with accurate 1.16MB TWA wrapper, precache scope, and keystore security guidance.
   - `public/version.json` created (`webVersion: 5.2.0`, `apkVersion: 5.0.0`, `appVersionCode: 1`).
6. **Architecture Guidelines:**
   - `.agents/rules/module-architecture.md` updated with mandatory Engine-Sharing Rule.
   - `DEPLOYMENT_GUIDE.md` updated with Hostinger FTP CI/CD banner.
   - `CONTRIBUTING.md` and `MODULE_AUTHOR_GUIDE.md` updated to enforce UDA/ModuleRegistry for new modules.
