# Mobile Architecture & Offline Execution Truth

> **Authoritative Technical Truth Document**  
> **Last Audited:** 2026-09-13 (Phase 0 / Now milestone)  
> **Target Scope:** Phone Android APK, Wear OS TWA Companion, Service Worker Caching, Play Store Keystores.

---

## 1. APK & Packaging Architecture

AluCalc OS mobile distributions (`android/` and `android-wear/`) are **not native Kotlin/Java applications** and are **not React Native/Flutter wrappers**.

* **Packaging Mechanism:** Google Bubblewrap (`@bubblewrap/cli`) Trusted Web Activity (TWA) wrapper.
* **APK Binary Footprint:** Approximately **1.16 MB** total install size (containing Android shell, splash screen manifest, and Chrome Custom Tabs / TWA delegation logic).
* **Target Launch URL:** `https://www.alucalculator.com/workspace` (delegates full rendering to the live Progressive Web App).
* **Wear OS Companion:** Uses the identical Bubblewrap TWA architecture configured for wearable display constraints in `android-wear/`.

---

## 2. Service Worker & Offline Capability

Offline execution claims must accurately reflect the browser cache configuration in `public/sw.js`:

* **Cache Scope (`alucalc-static-v5.2`):**
  Only a curated set of static navigation routes and manifests are precached during service worker installation:
  - `/` (Landing Page)
  - `/lite` (Quick Hub)
  - `/workspace` (Unified Desk Shell)
  - `/design-studio` (Design Shell)
  - `/cad-editor` (2D/3D Editor Shell)
  - `/bolt-torque` (VDI 2230 Fastener Solver)
  - `/bearings` (ISO 281 SKF Bearing Solver)
  - `/manifest.json` & core application icons (`192x192`, `512x512`)
* **Dynamic Cache (`alucalc-dynamic-v5.2`):**
  Routes visited while online are cached on-demand using a stale-while-revalidate strategy.
* **Heavy CAD & WASM Boundaries:**
  - Heavy binary assets—specifically OpenCASCADE WASM (~30 MB), 3D STEP/IGES kernels, and large procedural CAD geometry—are **NOT precached** in `sw.js`.
  - **First-load requirement:** Any 3D CAD/STEP/WASM feature requires an active network connection on first visit to download and initialize the WASM runtime.
  - **Offline Truth:** Only previously visited or explicitly precached solvers run without an active network connection. Marketing claims must state *"Precached Offline Solvers"*, never *"100% Offline Engine"*.

---

## 3. Version Tracking & Releases

Version synchronization between web and mobile binaries is codified in `public/version.json`:

```json
{
  "webVersion": "5.2.0",
  "apkVersion": "5.0.0",
  "appVersionCode": 1
}
```

Any future mobile build bump must increment both `apkVersion` and `appVersionCode` alongside Bubblewrap `twa-manifest.json`.

---

## 4. Keystore Security & Git Hygiene Incident

* **Incident Status:** Physical keystore files `android/alucalc-release.keystore` and `android-wear/alucalc-release.keystore` were historically committed to git history.
* **Immediate Mitigation (Phase 0a):** Untracked from git index via `git rm --cached` and guarded with explicit `*.keystore` / `*.jks` rules in `.gitignore`.
* **Play Store Invalidation Requirement:**
  Because the signing keys exist in the repository's git commit log, they must be considered compromised.
  **MANDATORY:** Before deploying any updated APK/AAB to Google Play Store production tracks, fresh upload keys must be generated via Google Play App Signing key rotation. Signing keys must be injected strictly via encrypted CI/CD secrets or local hardware keystores—**NEVER committed to git**.
