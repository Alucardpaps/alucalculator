# ALUCALC OS — Release Acceptance & Engineering Sign-Off Report

**Document Version:** 2.0  
**Sign-off Date:** 2026-10-30  
**Authority Reference:** `ALUCALC_OS_NIHAI_GELISTIRME_RAPORU_V2_2026-10-30.md`  
**Target Release:** AluCalc OS v6.0.0 (Web, Android APK 6.0, Wear OS)  
**Distribution Model:** Static Web Architecture (`output: 'export'`), Client-Side Web Workers, Hostinger Apache/LiteSpeed  
**Production Verdict:** **READY FOR DEPLOYMENT**

---

## 1. Executive Release Verdict

AluCalc OS v6.0.0 has satisfied the normative engineering criteria and quality gates set forth in the V2 Master Specification:

1. **Deterministic Mathematical Parity (P0 Gate):**
   - Machining milling removal rate $Q = \frac{v_f \cdot a_p \cdot a_e}{1000}$ implemented and verified across documentation, SSR, and production calculation schemas.
   - ISO 281:2007 bearing rating life $L_{10} = (C/P)^p\text{ [}10^6\text{ rev]}$ and $L_{10h} = \frac{10^6 \cdot L_{10}}{60 \cdot n}\text{ [h]}$ normalized without double-multiplier risk.
   - ISO 6336-2:2019 gear safety thresholds enforced ($S_H \ge 1.20$, $S_F \ge 1.40$) for production sign-off.
   - VDI 2230 / ISO 898-1 / ISO 724 fastener truth parameters aligned ($S_p = 580\text{ MPa}$ for M12 8.8, $F_p = 48.89\text{ kN}$, $F_M = 34.23\text{ kN}$, $d_3 = 9.853\text{ mm}$, $W_p = 218.2\text{ mm}^3$).
   - Sample PDF (`public/reports/sample-vdi-2230-bolt-torque.pdf`) rebuilt with genuine ISO 7200 title block formatting and honest attribution (`System-generated sample benchmark · Not independently reviewed by third party`).
2. **Production Regression Hardening:**
   - All acceptance tests in `src/tests/report-p0-acceptance.test.ts` invoke real production solver kernels (`machiningMillingSchema.calculationEngine`, `calculateBearingLifeL10h`, `calculateGearStrength`, `calculateIso6336Mesh`, `computeBoltAssembly`). Zero mock tautologies.
   - Ground truth provenance tests (15/15), Canonical R12 pipeline (8/8), Industrial templates (10/10), and Cross-module bridge (27/27) pass with 100% success.
3. **Single Source of Truth & Brand Parity (P1 Gate):**
   - Canonical catalog synchronized strictly at 86 deterministic tools.
   - Platform version unified at `v6.0.0` (Web) and `v6.0` (APK). Legacy `5.25.x` and `5.2` strings purged.
   - `public/release-manifest.json` dynamically generated at prebuild time.
   - Privacy policy updated to formal `Aydınlatma Metni & Gizlilik Politikası` detailing local-first data processing and explicit telemetry consent.
4. **Connected Engineering (P2 Digital Thread):**
   - Verified end-to-end reducer power transmission loop (Motor $\to$ Torque $\to$ DIN 3960 Gear $\to$ DIN 743 Shaft $\to$ ISO 281 Bearing $\to$ VDI 2230 Bolt $\to$ AutoCAD DXF $\to$ PDF Report).

---

## 2. Quality Gate Verification Audit

| Quality Gate | Requirement | Observed Status | Verification Evidence |
|---|---|---|---|
| **GATE-01: Safety False Pass** | Zero false `SAFE` on non-compliant engineering elements | **PASS** | `src/lib/iso6336.ts`, `src/components/modules/mechanical/GearsModule.tsx` |
| **GATE-02: Normative Alignment** | ISO 898-1 Table 3, ISO 724 Table 1 exact match | **PASS** | `src/lib/fastener/sharedEngine.ts`, `scripts/generate_vdi_sample_pdf.js` |
| **GATE-03: Formula-Code Parity** | Methodology text, worked examples, and engines identical | **PASS** | `src/data/moduleMethodology.ts`, `machining-milling.tsx` |
| **GATE-04: Test Autonomy** | Acceptance tests execute real engines | **PASS** | `src/tests/report-p0-acceptance.test.ts` (9/9 pass) |
| **GATE-05: PDF Honesty** | Disclaimers on sample documents; zero fictitious audit claims | **PASS** | `sample-vdi-2230-bolt-torque.pdf` (5,830 B) |
| **GATE-06: Static Type Safety** | Zero TypeScript compilation errors (`tsc --noEmit`) | **PASS** | `npm run typecheck` exited code 0 |
| **GATE-07: Build Integrity** | Automated release manifest & Next.js static export | **PASS** | `scripts/generate_release_manifest.js`, Next.js build |
| **GATE-08: SSOT Parity** | Tool count = 86, Version = 6.0.0 across all public pages | **PASS** | `public/llms.txt`, `src/app/about/page.tsx`, `calculatorsPageTranslations.ts` |
| **GATE-09: Privacy / KVKK** | Local-first processing explained, explicit opt-in telemetry | **PASS** | `src/app/privacy/page.tsx` |
| **GATE-10: Connected Thread** | Headless graph engine connecting multidisciplinary solvers | **PASS** | `src/flow/templates/industrialTemplates.ts` (10/10 pass) |

---

## 3. List of Modified & Added Files

### Added Files:
1. `src/tests/report-p0-acceptance.test.ts` — Production acceptance test suite directly verifying real engineering kernels.
2. `scripts/generate_release_manifest.js` — Single source of truth generator for `public/release-manifest.json`.
3. `public/release-manifest.json` — Static machine-readable release metadata.
4. `ALUCALC_EXECUTION_EVIDENCE.md` — Detailed technical evidence and formula citations.
5. `ALUCALC_RELEASE_ACCEPTANCE.md` — Formal release acceptance sign-off.

### Modified Files:
1. `src/data/moduleMethodology.ts` — Corrected milling $Q$ formula to $v_f$, and ISO 281 $L_{10} / L_{10h}$ unit definitions.
2. `src/calculators/schemas-v2/machining-milling.tsx` — Added division-by-zero guards for $D \le 0$ and validation warnings.
3. `src/lib/iso6336.ts` — Enforced ISO 6336-2 Method B thresholds ($S_H \ge 1.20, S_F \ge 1.40$).
4. `src/components/modules/mechanical/GearsModule.tsx` — Enforced contact vs bending safety separation in UI status badges.
5. `scripts/generate_vdi_sample_pdf.js` — Corrected M12 8.8 $S_p=580\text{ MPa}$, $d_3=9.853\text{ mm}$, $W_p=218.2\text{ mm}^3$, $F_p=48.89\text{ kN}$, $F_M=34.23\text{ kN}$, and honest ISO 7200 sample attribution.
6. `public/reports/sample-vdi-2230-bolt-torque.pdf` — Regenerated binary PDF with exact engineering values.
7. `package.json` — Prepend release manifest and PDF generation to `prebuild`.
8. `public/llms.txt` — Standardized tool count to canonical 86.
9. `src/app/about/page.tsx` — Bound live tool count to `CANONICAL_TOOL_COUNT`.
10. `src/app/privacy/page.tsx` — Formalized KVKK / GDPR notice, removing draft terminology.
11. `src/locales/appPagesTranslations.ts` — Replaced template string literal with `APP_APK_VERSION` interpolation and standardized version to 6.0.
12. `src/locales/calculatorsPageTranslations.ts` — Replaced legacy `5.25.x` and `Build 5.25.0` with `6.0.x` and `Build 6.0.0` across 12 locales.
13. `src/tests/ground-truth-provenance.test.ts` — Documented ISO 4014 vs DIN 931 across-flats width variation in VDI 2230 test.

---

## 4. Residual Non-Blockers & Forward Roadmap

| Item | Current Status | Mitigation / Planned Phase |
|---|---|---|
| Live Hostinger Cache Synchronization | Code built locally in `out/`; awaiting GitHub Actions / FTP deployment trigger | Deploy via GitHub Actions `.github/workflows/deploy.yml` |
| Advanced 3D Nonlinear FEA | Linear static FEA active; large deformation non-linear out of static scope | Retained in roadmap Phase 7 |
| In-browser ISO 286 tolerance picker | Standard fits and tables operational; graphical deviation visualizer | Phase 6 UX enhancement |

---

## 5. Formal Sign-off

- **Engineering Methodology:** Normative Tier 1 (ISO 281, ISO 6336, VDI 2230, ISO 898-1, ISO 724)
- **Automated Tests:** 69 passing unit and acceptance tests across core suites
- **Build Status:** Next.js static export (`out/`) verified clean with 0 typecheck errors
- **Deployment Readiness:** **APPROVED FOR DEPLOYMENT**
