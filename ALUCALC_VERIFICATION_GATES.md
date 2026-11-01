# AluCalc OS — Engineering Verification Gates & Quality Protocol (Gate G0 Baseline)

> **Document ID:** `ALUCALC_VERIFICATION_GATES.md`  
> **Target System:** Engineering Verification Harness & Reducer Acceptance  
> **Date:** November 1, 2026  
> **Status:** APPROVED VERIFICATION SPECIFICATION  
> **Core Principle:** "No Blind Completion — Evidence Precedes Sign-Off"  

---

## 1. Universal Quality Requirements (Q-01 – Q-20)

Every engineering module in AluCalc OS must pass the 20 mandatory Quality Gates before being marked as production-ready:

| ID | Domain | Requirement & Rule | Minimum Acceptable Evidence | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Q-01** | **Mathematics** | Exact formula citation and dimensionally correct unit transformation. | Independent scientific/normative citation; relative tolerance $< 0.1\%$. | **P0** |
| **Q-02** | **Methodology** | Active standard version citation (e.g., ISO 6336:2019, DIN 743:2012). | Specific standard code, year, and clause cited in docstrings and UI. | **P0** |
| **Q-03** | **Input Domain** | Strict input boundary validation; reject NaN, Infinity, negative values. | Zero false SAFE states; immediate error response on invalid inputs. | **P0** |
| **Q-04** | **Result State** | Strict separation of calculation status vs design acceptance. | Tri-state output: `CALCULATED` $\to$ `TARGET_MET` $\to$ `VERIFIED`. | **P0** |
| **Q-05** | **Independent Test** | Production kernel executed directly by Vitest (no mock wrappers). | Golden test vector matching published benchmark data. | **P0** |
| **Q-06** | **Deterministic** | Pure function execution: identical inputs produce identical outputs. | Repeatability test; SHA-256 state hash equality. | **P0** |
| **Q-07** | **Performance** | Execution time $P_{95} < 10\text{ ms}$; zero UI main-thread blocking. | Benchmark logs on standard mobile/desktop hardware. | **P1** |
| **Q-08** | **Accessibility** | Semantic HTML, ARIA tags, keyboard navigation, high contrast. | Lighthouse Accessibility score $\ge 95$; WCAG 2.1 AA compliance. | **P1** |
| **Q-09** | **Localization** | Multi-language fidelity across 11 supported languages. | Technical terms and engineering units preserved across locales. | **P1** |
| **Q-10** | **PDF Layout** | Vector typography; zero text clipping outside page boundaries. | Strict font width assertion: $x_{\text{right}} \le 567.28\text{ pt}$ on A4. | **P0** |
| **Q-11** | **DXF Export** | 1:1 scale R12 ASCII DXF export; valid closed polylines. | Round-trip import/export test in CAD viewers. | **P0** |
| **Q-12** | **CAD Interop** | Standard 3D geometry export (STEP AP203/AP214 / STL). | Successful B-Rep solid generation without non-manifold edges. | **P1** |
| **Q-13** | **FEA Accuracy** | Linear-elastic finite element mesh convergence check. | Analytical error bound $< 8\%$ against theoretical benchmarks. | **P0** |
| **Q-14** | **CAM Safety** | CNC toolpath generation with conservative feed/speed limits. | G-code preview with collision and spindle limit warnings. | **P0** |
| **Q-15** | **Thermal/Nesting** | Closed 2D contours; kerf width and lead-in/lead-out compensation. | 0 overlapping parts; remnant utilization tracked. | **P0** |
| **Q-16** | **Data Privacy** | Zero telemetry leaks; zero unauthorized external network requests. | Client-side only; zero secrets or analytics in calculation loops. | **P0** |
| **Q-17** | **Security** | Zero exposed keystores or hardcoded API keys. | Clean repository audit; `.gitignore` enforcement. | **P0** |
| **Q-18** | **SEO & SSG** | Pre-rendered static HTML content for all 86 tools. | Valid canonical links, metadata, and zero broken internal links. | **P1** |
| **Q-19** | **Release Gate** | Full clean build verification prior to live deployment. | `npm run typecheck` (0 errors), `npm run build` (Exit code 0). | **P0** |
| **Q-20** | **SSOT Inventory** | Public tool count strictly audited against canonical inventory. | 86 tools declared; zero hand-typed discrepancies. | **P0** |

---

## 2. Methodology Tier & Status Classification

To protect engineering credibility, every calculation result in AluCalc OS must display its exact tier and status:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Methodology Tier                                │
├────────────────────────────┬─────────────────────────────┬─────────────┤
│   Normative (Tier 1)       │   Scientific (Tier 2)       │ Screening   │
│   Official ISO/DIN/VDI     │   Peer-reviewed paper or    │ (Tier 3)    │
│   standard clause          │   manufacturer handbook     │ Simplified  │
└────────────────────────────┴─────────────────────────────┴─────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Result Verification State                       │
├──────────────────┬──────────────────────┬──────────────────────────────┤
│   INVALID        │   CALCULATED         │   TARGET_MET                 │
│   Inputs out of  │   Math completed;    │   Exceeds minimum design     │
│   physical scope │   threshold unev.    │   safety threshold           │
└──────────────────┴──────────────────────┴──────────────────────────────┘
```

> [!IMPORTANT]
> The label **"VERIFIED"** or **"CERTIFIED"** is **FORBIDDEN** unless the output has been validated against an independent physical test, certified commercial software benchmark (e.g. KISSsoft, ANSYS), or signed by a licensed Professional Engineer (PE / Eur Ing).

---

## 3. Golden Test Vectors: Connected Reducer (15 kW, 1450 rpm $\to$ 60 rpm)

The following benchmark values represent the immutable golden test vector for `WF-11`. Automated integration tests in `src/tests/connected-reducer-wf11.test.ts` must assert these values within the specified tolerances:

### 3.1. Kinematics & Motor Sizing (IEC 60034)
* **Motor Power:** $P = 15.0\text{ kW}$
* **Input Speed:** $n_1 = 1450\text{ rpm}$
* **Nominal Input Torque:** $T_1 = 98.793\text{ N}\cdot\text{m} \pm 0.05\%$
* **Application Factor:** $K_A = 1.25$
* **Design Torque:** $T_{1,\text{design}} = 123.491\text{ N}\cdot\text{m} \pm 0.05\%$

### 3.2. Stage 1 Helical Gear Mesh (ISO 6336 Method B Screening)
* **Input Teeth:** $z_1 = 20$, **Gear Teeth:** $z_2 = 104$ $\implies i_1 = 5.200$
* **Normal Module:** $m_n = 2.5\text{ mm}$, **Helix Angle:** $\beta = 14.0^\circ$
* **Transverse Module:** $m_t = 2.5765\text{ mm} \pm 0.02\%$
* **Pitch Diameters:** $d_1 = 51.530\text{ mm} \pm 0.02\%$, $d_2 = 267.956\text{ mm} \pm 0.02\%$
* **Center Distance:** $a_1 = 159.743\text{ mm} \pm 0.02\%$
* **Tooth Action Forces:**
  * Tangential: $F_{t1} = 4793.0\text{ N} \pm 0.1\%$
  * Radial: $F_{r1} = 1797.9\text{ N} \pm 0.1\%$
  * Axial: $F_{a1} = 1195.0\text{ N} \pm 0.1\%$
* **Safety Factors:** $S_H \ge 1.20$, $S_F \ge 1.40$ $\implies$ **TARGET MET**

### 3.3. Stage 2 Helical Gear Mesh (ISO 6336 Method B Screening)
* **Intermediate Torque:** $T_2 = 503.453\text{ N}\cdot\text{m} \pm 0.1\%$
* **Input Teeth:** $z_3 = 21$, **Gear Teeth:** $z_4 = 98$ $\implies i_2 = 4.6667$
* **Normal Module:** $m_n = 4.0\text{ mm}$, **Helix Angle:** $\beta = 12.0^\circ$
* **Transverse Module:** $m_t = 4.0894\text{ mm} \pm 0.02\%$
* **Pitch Diameters:** $d_3 = 85.877\text{ mm} \pm 0.02\%$, $d_4 = 400.757\text{ mm} \pm 0.02\%$
* **Center Distance:** $a_2 = 243.317\text{ mm} \pm 0.02\%$
* **Tooth Action Forces:**
  * Tangential: $F_{t2} = 14\,656.3\text{ N} \pm 0.1\%$
  * Radial: $F_{r2} = 5454.7\text{ N} \pm 0.1\%$
  * Axial: $F_{a2} = 3115.3\text{ N} \pm 0.1\%$
* **Safety Factors:** $S_H \ge 1.20$, $S_F \ge 1.40$ $\implies$ **TARGET MET**

### 3.4. Output Kinematics
* **Actual Output Speed:** $n_3 = 59.753\text{ rpm} \approx 60\text{ rpm}$ (Deviation: $-0.41\%$)
* **Design Output Torque:** $T_{3,\text{design}} = 2877.99\text{ N}\cdot\text{m} \pm 0.1\%$

### 3.5. Shaft Fatigue Safeties (DIN 743:2012 Engine `din743Check`)
* **Shaft 1 (Input, $d=30\text{ mm}$):**
  - Shoulder notch ($D=36, d=30, r=2\text{ mm}$): $S_D = \mathbf{3.29} \ge 1.50$, $S_F = 10.37$ $\implies$ **PASS**
  - DIN 6885 Keyway notch ($d=30\text{ mm}$): $S_D = \mathbf{2.01} \ge 1.50$, $S_F = 10.37$ $\implies$ **PASS**
  - Simplified unnotched reference equation: $S = \frac{1}{\sqrt{(1/3.09)^2 + (1/6.65)^2}} = \mathbf{2.802} \ge 1.50 \implies \textbf{PASS}$
* **Shaft 2 (Intermediate, $d=50\text{ mm}$):** Combined fatigue safety $S_D = \mathbf{3.79} \ge 1.50$, $S_F = 10.88$ $\implies$ **PASS**
* **Shaft 3 (Output, $d=75\text{ mm}$):** Combined fatigue safety $S_D = \mathbf{7.79} \ge 1.50$, $S_F = 10.81$ $\implies$ **PASS**

### 3.6. Bearing Life Safeties (ISO 281:2007)
* **Target Rating Life:** $L_{10h} \ge 25\,000\text{ hours}$
* **Shaft 1 Locating (SKF 32206 J2/Q Standard Catalog, $C=50.1\text{ kN}, P=2.85\text{ kN}, p=10/3$):**
  - $L_{10} = (50.1/2.85)^{10/3} = \mathbf{14\,124.6 \times 10^6\text{ rev}} \implies L_{10h} = \mathbf{162\,352\text{ h}} \ge 25\,000\text{ h} \implies$ **PASS**
* **Shaft 2 Locating (SKF 32210 J2/Q Standard Catalog, $C=82.5\text{ kN}, Y=1.40, n=278.85\text{ rpm}, p=10/3$):**
  - Induced thrust equilibrium: $F_{aI} = F_{aII,\text{ind}} + K_a = 3.196 + 1.920 = 5.116\text{ kN}$.
  - Ratio: $F_{aI}/F_{rI} = 5.116/10.20 = 0.502 > e = 0.43$.
  - Equivalent dynamic load: $P = 0.40(10.20) + 1.40(5.116) = \mathbf{11.243\text{ kN}}$.
  - Rating life: $L_{10} = (82.5/11.243)^{10/3} = \mathbf{767.89 \times 10^6\text{ rev}} \implies L_{10h} = \mathbf{45\,891\text{ h}} \ge 25\,000\text{ h} \implies$ **PASS**
* **Shaft 3 Locating (SKF 32215 J2/Q Standard Catalog, $C=161.0\text{ kN}, P=11.80\text{ kN}, n=59.75\text{ rpm}, p=10/3$):**
  - Ratio: $F_a / F_r = 3.115 / 11.80 = 0.264 \le e = 0.43 \implies P = F_r = 11.80\text{ kN}$.
  - Rating life: $L_{10} = (161.0/11.80)^{10/3} = \mathbf{6069.4 \times 10^6\text{ rev}} \implies L_{10h} = \mathbf{1\,692\,915\text{ h}} \ge 25\,000\text{ h} \implies$ **PASS**

### 3.7. Housing Bolting (VDI 2230:2015 Systematic Model)
* **Bolt:** 14 $\times$ M12 $\times 1.75$ Grade 8.8 (Tensile stress area $A_s = 84.3\text{ mm}^2$)
* **Material Limits:** Proof strength $S_p = 580\text{ MPa}$, Nominal yield strength $R_{p0.2} = 640\text{ MPa}$
* **Proof Load:** $F_p = A_s \cdot S_p = 84.3 \times 580 \times 10^{-3} = 48.894\text{ kN}$
* **Local Peak Separating Load:** $F_{A,\text{local}} = 2.728\text{ kN}$ per pair of flanking bolts
* **Joint Resilience Ratio:** $\Phi_K = 0.20$
* **Gasket Clamping Pressure Area:** $p_{\text{clamp}} \ge 8.0\text{ MPa} \implies F_{Kerf} = 9.60\text{ kN}$
* **Minimum Assembly Preload Required:** $F_{M,\text{req}} = 14.28\text{ kN}$
* **Nominal Assembly Preload:** $F_M = 0.70 \cdot F_p = \mathbf{34.226\text{ kN}}$ (strictly $70\%$ of proof load $S_p$, or $63.4\%$ of yield strength $R_{p0.2}$)
* **Minimum Preload Under Tool Dispersion ($\alpha_A = 1.20$):** $F_{M,\min} = 34.226 / 1.20 = \mathbf{28.52\text{ kN}} > F_{M,\text{req}} \implies \textbf{PASS}$
* **Tightening Torque:** $M_A = \mathbf{65.08\text{ N}\cdot\text{m}}$ ($D_{Km} = 14.425\text{ mm}$ for standard ISO 4762 cylindrical head cap screw, $\mu_G = \mu_K = 0.12$)
  *(Parametric note: $M_A \approx 71.40\text{ Nm}$ if only $D_{Km}=17.5\text{ mm}$; $M_A \approx 74.33\text{ Nm}$ if only $\mu=0.14$. The previous $76.80\text{ Nm}$ required simultaneous upper bounds of both parameters).*
* **Safety Against Joint Opening:** $S_K = \mathbf{3.08} \ge 1.20 \implies \textbf{PASS}$
* **Yield Safety:** $S_y = \frac{R_{p0.2}}{\sigma_{\text{red}}} = \frac{640}{458.7} = \mathbf{1.39} \ge 1.10 \implies \textbf{PASS}$

---

## 4. Deterministic Replay & SHA-256 Provenance Protocol

To guarantee mathematical auditability, every project state must generate a deterministic canonical hash:

```typescript
import { createHash } from 'crypto';

export function computeProjectProvenanceHash(state: ConnectedReducerProjectState): string {
  // Extract strictly canonical calculation numbers, sorted alphabetically
  const canonicalPayload = {
    Ka: state.operatingRequirements.service_factor_Ka,
    Pin: state.operatingRequirements.power_kw,
    a1: state.stages[0].center_distance_mm,
    a2: state.stages[1].center_distance_mm,
    d1: state.shafts.shaft1.diameter_mm,
    d2: state.shafts.shaft2.diameter_mm,
    d3: state.shafts.shaft3.diameter_mm,
    nin: state.operatingRequirements.input_rpm,
    nout: state.operatingRequirements.target_output_rpm,
    z1: state.stages[0].z1,
    z2: state.stages[0].z2,
    z3: state.stages[1].z1,
    z4: state.stages[1].z2,
  };

  const serialized = JSON.stringify(canonicalPayload);
  return createHash('sha256').update(serialized).digest('hex');
}
```

* Any manual tampering or parameter drift between stages invalidates the hash.
* The PDF generator and STEP exporter embed this SHA-256 hash directly into the output metadata.

---

## 5. Gate Exit Checklist (Sign-Off Gate DoD)

Before any Approval Gate (`G0` through `G9`) is proposed for closure, the agent must present the following evidence:
1. **Automated Test Report:** Exit code 0 from Vitest running targeted tests directly against production files.
2. **Golden Vector Match:** Actual calculated values compared against Section 3 golden numbers with relative error.
3. **Typographic Border Compliance:** Rendered PDF inspected; zero text extends beyond $x = 567.28\text{ pt}$.
4. **Clean Git State:** Zero uncommitted secrets, keystores, or untracked temporary files.
5. **Written User Sign-off:** Gate status moves from `LOCKED` to `OPEN` only when the user explicitly responds with approval.
