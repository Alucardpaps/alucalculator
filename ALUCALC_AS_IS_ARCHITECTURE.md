# AluCalc OS — AS-IS Architecture & Infrastructure Audit (Gate G0 Baseline)

> **Document ID:** `ALUCALC_AS_IS_ARCHITECTURE.md`  
> **Target Release:** AluCalc OS v6.x $\to$ NextGen Connected Engineering Platform  
> **Date:** November 1, 2026  
> **Status:** APPROVED AS BASELINE (G0 Live Matching)  
> **Reference Standards:** ISO 6336:2019, DIN 743:2012, ISO 281:2007, DIN 6892, VDI 2230:2015, IEC 60034  

---

## 1. Executive Architecture Overview

AluCalc OS (`alucalculator.com`) is an industrial-grade **Engineering Operating System** engineered for deterministic multi-disciplinary engineering computations, parametric CAD, and production documentation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AluCalc OS Desktop Shell (UDA)                      │
│       Window Manager, Multi-Theme (Graphite/Paper/Midnight/OLED),      │
│                   AeGiS Copilot, Project State Store                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Event & Action Dispatch)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Flow Engine (Directed Graph)                        │
│      EngineeringNode<TInput, TOutput>, Semantically Typed Ports        │
│          Acyclic Topological Execution, SHA-256 State Hashing          │
└──────────────────┬─────────────────┬──────────────────┬────────────────┘
                   │                 │                  │
┌──────────────────▼──────┐   ┌──────▼──────────┐   ┌───▼────────────────┐
│   Mechanical Solvers    │   │  CAD & Drafting │   │   FEA Simulation   │
│  ISO 6336 Method B (Gears)   Three.js + R3F    │   Linear-Elastic 3D/2D │
│  DIN 743 (Shaft Fatigue)│   │ OpenCascade WASM│   │ 6 Benchmark Plates │
│  ISO 281 (Bearing Life) │   │ PlaneGCS (2D)   │   │ St. Venant Torsion │
│  VDI 2230 (Bolted Joint)│   │ StepBRepExporter│   │ Analytical Heatmap │
└──────────────────┬──────┘   └──────┬──────────┘   └───┬────────────────┘
                   │                 │                  │
                   └─────────────────┼──────────────────┘
                                     │ (Validated Geometry & Numbers)
┌────────────────────────────────────▼───────────────────────────────────┐
│                    Validation & Export Pipeline                        │
│   Client-Side PDF Generator (pdf-lib, strict typography x ≤ 567.28 pt)  │
│   DXF Exporter (R12 ASCII, Polylines), STEP Exporter (AP203/AP214)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Runtime Topology

| Layer | Technology | Version | Architectural Constraints |
| :--- | :--- | :--- | :--- |
| **Runtime & Framework** | Next.js (App Router, Turbopack) | 16.2.10 | Static export (`output: 'export'`), 389 SSG pages, `trailingSlash: true`. |
| **UI Library** | React | 19.0.0 | Pure components, StrictMode, client-side hydration. |
| **Language & Typings** | TypeScript | 5.9.3 | Strict mode (`strict: true`), zero implicit `any`, no casting `as any` in solver cores. |
| **State Management** | Zustand | 5.0.3 | Atomic slices, debounced persistence, decoupled headless computation. |
| **Styling & Theme** | Tailwind CSS + CSS Tokens | 4.x | Token-only CSS (`--bg-0…3`, `--alu`, `--cyan`, `--ok/--warn/--bad`), zero inline hex. |
| **3D CAD Viewers** | Three.js + React Three Fiber | 0.174 / 9.x | `useMemo` cached geometries; no inline `ExtrudeGeometry` in render loops. |
| **2D Geometric Solver** | PlaneGCS (`@salusoft89/planegcs`) | 0.1.x | C++ constraint solver compiled to WASM; runs in Web Worker. |
| **Solid CAD Kernel** | OpenCascade.js | WASM | Asynchronous dynamic import (`dynamic(..., { ssr: false })`). |
| **Engineering PDF** | `pdf-lib` | 1.17.1 | Strict coordinate boundary checking ($x \le 567.28\text{ pt}$). Pure client-side. |
| **CI / CD Pipeline** | GitHub Actions $\to$ FTP $\to$ Hostinger | `.github/workflows/deploy.yml` | Automated build on `push` to `master`/`main`; deploys `./out/` to `./public_html/`. |

---

## 3. Inventory of Core Engineering Solvers (As-Is Status)

According to `src/data/canonicalInventory.ts` and `public/release-manifest.json`, the repository contains **86 canonical engineering tools**. The mechanical solvers directly applicable to powertrain and gearbox design include:

### 3.1. Power & Kinematics (`src/flow/nodes/Mechanical/mech-power-torque.ts`)
* **Standard:** IEC 60034
* **Formula:** $T = 9550 \cdot \frac{P}{n}$ (Industrial convention) and $T_{\text{exact}} = \frac{P \cdot 10^3}{2\pi n / 60}$.
* **Status:** Fully functional, deterministic, validated input domain ($P > 0, n > 0$).

### 3.2. Gear Mesh & Rating (`src/lib/iso6336.ts`, `src/lib/gearStrength.ts`, `src/flow/nodes/Mechanical/mech-gear-helical.ts`)
* **Standard:** ISO 6336:2019 (Simplified Method B Screening) & DIN 3960
* **Capabilities:**
  * Transverse module: $m_t = m_n / \cos\beta$.
  * Pitch, base, tip, and root diameters ($d, d_b, d_a, d_f$).
  * Contact ratios: transverse $\varepsilon_\alpha$, overlap $\varepsilon_\beta$, total $\varepsilon_\gamma = \varepsilon_\alpha + \varepsilon_\beta$.
  * Transverse tooth forces: Tangential force $F_t = \frac{2000 \cdot T}{d_1}$, Radial force $F_r = \frac{F_t \cdot \tan\alpha_n}{\cos\beta}$, Axial force $F_a = F_t \cdot \tan\beta$.
  * Contact stress $\sigma_H$ and bending stress $\sigma_F$.
  * Separate safety factors: $S_{H1} = \sigma_{H\lim,1} / \sigma_H$, $S_{H2} = \sigma_{H\lim,2} / \sigma_H$, $S_H = \min(S_{H1}, S_{H2})$.
* **Status:** Verified in Sprint 0; classified as **Screening / Target Met**. Rejects invalid geometries ($z < 5, m_n \le 0, T \le 0$).

### 3.3. Shaft Fatigue & Static Capacity (`src/modules/mechanical/ShaftDesign/din743.ts`)
* **Standard:** DIN 743:2012 (Parts 1–3)
* **Capabilities:**
  * Technological size factor $K_1(d_{\text{eff}})$, geometric size factor $K_2(d)$, surface roughness factor $K_{F\sigma}$.
  * Stress concentration factors $\alpha_k$ and notch sensitivity $\beta_\sigma$ for shoulders, DIN 509 relief grooves, DIN 471 circlip grooves, DIN 6885 keyways, and press fits.
  * Combined safety factor against fatigue $S$ and static yielding $S_{\text{stat}}$.
* **Status:** High-fidelity pure TypeScript implementation; decoupled from UI.

### 3.4. Rolling Bearing Life (`src/lib/bearingLife.ts`, `src/flow/nodes/Mechanical/EngineeringNodes.ts`)
* **Standard:** ISO 281:2007
* **Capabilities:**
  * Radial load $F_r$, axial load $F_a$, shaft speed $n$.
  * Deep-groove ball bearings ($p=3$) and cylindrical/taper roller bearings ($p=10/3$).
  * Equivalent dynamic load $P = \max(F_r, X \cdot F_r + Y \cdot F_a)$ derived from $F_a / C_0$ and limit factor $e$.
  * Rating life $L_{10} = (C/P)^p$ in $10^6$ revolutions; $L_{10h} = \frac{10^6}{60 \cdot n} L_{10}$ in operational hours.
  * Static safety factor $s_0 = C_0 / P_0$.
* **Status:** Fully functional, exports DXF schematic representation.

### 3.5. Bolted Joint Analysis (`src/lib/vdi2230.ts`, `scripts/generate_vdi_sample_pdf.js`)
* **Standard:** VDI 2230:2015 (Systematic calculation of high-duty bolted joints)
* **Capabilities:**
  * Thread geometry: nominal diameter $d$, pitch $P$, stress area $A_s$, pitch diameter $d_2$.
  * Proof load $F_p = A_s \cdot S_p$, maximum assembly preload $F_M = \nu \cdot F_p$.
  * Tightening torque $M_A = F_M \cdot [0.16 \cdot P + 0.58 \cdot d_2 \cdot \mu_{\text{th}} + 0.5 \cdot D_{\text{km}} \cdot \mu_b]$.
  * Combined equivalent stress $\sigma_{\text{red}} = \sqrt{\sigma_z^2 + 3 \cdot \tau_t^2}$ and yield safety $S_y$.
* **Status:** Fully verified with layout-checked PDF export ($x \le 567.28\text{ pt}$).

### 3.6. Finite Element Analysis (FEA) Engine (`src/engines/fea/FeaTemplateSolver.ts`)
* **Standard / Formulation:** Linear-elastic stiffness matrix $[K]\{u\} = \{F\}$, St. Venant torsion, Euler-Bernoulli/Timoshenko beam.
* **Capabilities:**
  * 6 benchmarked analytical templates with error bounds $< 8\%$.
  * Pure torsion template calculates shear stress distribution across circular/annular cross-sections.
  * Jet colormap stress heatmap output.
* **Status:** Verified analytical benchmarks; client-side execution.

---

## 4. Architectural Gaps & Disconnects (Pre-Connected State)

While individual calculation engines are mathematically sound, the audit identified three major structural gaps that prevent end-to-end automated workflow:

1. **State Isolation ("Island Solvers"):**
   * Currently, `/gears`, `/shafts`, `/bearings`, and `/bolt-torque` operate as standalone pages with disconnected Zustand stores.
   * If an engineer changes the motor power from 15 kW to 22 kW on the motor page, the gear tangential force $F_t$ on `/gears` does not automatically update; the user must manually copy numbers.
2. **Missing Transverse Force Propagation to Shafts:**
   * `HelicalGearNode` calculates $F_t, F_r, F_a$, but there is no automated bridge that places these forces at specific axial coordinates $x_i$ along the intermediate shaft to generate bending moment diagrams $M_y(x), M_z(x)$.
3. **Parametric 3D Assembly Disconnection:**
   * 3D viewers display individual parts (a gear mesh or a shaft), but do not yet bind to a unified multi-body assembly graph where gear pitch diameters determine shaft center distances $a = (d_1 + d_2)/2$ dynamically in 3D space.

---

## 5. Reusable Building Blocks vs Required Modifications

| Subsystem | Existing File(s) | Reusable Components | Required Modifications for Connected Reducer |
| :--- | :--- | :--- | :--- |
| **Motor & Torque** | `src/flow/nodes/Mechanical/mech-power-torque.ts` | Complete formula $T = 9550 \cdot P / n$ & validation. | Expose standard motor catalog lookup (IEC frame sizes 160M, 180M). |
| **Gear Meshes** | `src/lib/iso6336.ts`, `mech-gear-helical.ts` | Involute geometry, force vectors ($F_t, F_r, F_a$), $S_H/S_F$. | Multi-stage cascading ($i_{\text{total}} = i_1 \times i_2$), center distance lock. |
| **Shaft Analysis** | `src/modules/mechanical/ShaftDesign/din743.ts` | DIN 743 fatigue and static safety checks, notch factors. | Multi-station shaft beam solver: compute spatial $M(x)$ from gear forces. |
| **Bearing Life** | `src/lib/bearingLife.ts`, `EngineeringNodes.ts` | ISO 281 $L_{10h}$ calculation, deep-groove & taper roller. | Dual-bearing reaction solver: calculate radial reactions $F_{rA}, F_{rB}$ from moment balance. |
| **Keyway Joints** | `src/lib/keywayDin6892.ts` (or math solver) | Surface pressure $p \le p_{\text{perm}}$. | Standard DIN 6885 dimensions keyed to shaft diameter $d$. |
| **Housing Bolting**| `src/lib/vdi2230.ts`, `generate_vdi_sample_pdf.js` | VDI 2230 Step 1–7 preload and tightening torque. | Parameterized input from gear separating force $F_r$ to calculate joint clamping. |
| **Flow Engine** | `src/flow/engine/AegisFlowEngine.ts` | Acyclic graph execution, typed ports, topological sort. | Add Reducer Template with pre-wired nodes: Motor $\to$ G1 $\to$ Sh1 $\to$ G2 $\to$ Sh2 $\to$ Brg. |
| **3D CAD Viewer** | `src/cad/`, `src/viewers/dxf-preview.ts` | Three.js rendering, parametric geometries, DXF export. | Assemble multi-shaft 3D model with correct center distance offsets. |
| **Report Engine** | `src/lib/pdfReportEngine.ts`, `pdf-lib` | High-precision vector typography, tabular layout. | Multi-page comprehensive Reducer Design Verification Report. |

---

## 6. Architectural Guardrails (Hard Constraints)

1. **Client-Side Only (Zero New Server Backends):**  
   AluCalc OS must remain a 100% static client-side application. No Node.js microservices, Python backends, or cloud calculation APIs. Everything executes in browser memory (Web Workers + WASM).
2. **One-Way Dependency Flow:**  
   $$\text{OS / UI} \longrightarrow \text{Flow Engine} \longrightarrow \text{Mechanical Kernels} \longrightarrow \text{Validation} \longrightarrow \text{Export / Viewers}$$
   Mechanical solvers must **never** import React components, hooks, or DOM objects.
3. **Explicit Verification Tiers:**  
   Calculators must state their methodology tier:
   * **Normative (Tier 1):** Official ISO/DIN/VDI standard.
   * **Scientific (Tier 2):** Peer-reviewed literature or manufacturer engineering handbook.
   * **Screening / Heuristic (Tier 3):** Preliminary design filter with explicit disclaimer.
