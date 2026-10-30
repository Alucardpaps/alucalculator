# NotebookLM Deep Research & Synthesis Report — AluCalc OS v4.2

> **Methodology:** Source-Grounded Multi-Document RAG Synthesis & Audio/Briefing Studio Architecture
> **Corpus Analyzed:** `graphify-out/graph.json` (20,112 AST/dependency nodes), `ALUCALC_5_AI_JURY_AUDIT_REPORT.md`, `ALUCALC_EXECUTIVE_AUDIT_SUMMARY.md`, `ALUCALC_AGENT_PLAN.md`, `NOW_WORKLOG.md`, `src/data/canonicalInventory.ts`, and 2026 Industrial CAE/CAD Workbench Standards (VDI 2230, ISO 6336, ISO 281, DIN 743, ISO 7200).

---

## 1. Executive Synthesis & Source Inventory

This research synthesis consolidates internal architectural telemetry (`graphify` knowledge graph + 5-AI Jury Audit) with 2026 industrial engineering software benchmarks (ANSYS Discovery, KISSsoft, MITCalc, FVA Workbench, and Google NotebookLM's source-grounded workspace paradigm).

### Grounded Source Registry
- **`[SRC-01]`** `src/data/canonicalInventory.ts` & `src/lib/registry/calculatorRegistry.ts` — Canonical Single Source of Truth (SSOT) defining `solverCount` (86), `fieldToolCount` (34), `academyUnitCount` (15), and `calculators.json` metadata.
- **`[SRC-02]`** `.agents/rules/design-system-instrument.md` — "AluCalc Instrument" Design Law (Fluke / Mitutoyo / Heidenhain CNC control panel aesthetic; strict prohibition of `backdrop-blur` glassmorphism, purple-pink AI gradients, and `>12px` pill cards).
- **`[SRC-03]`** `alucalc_audit_bundle/ALUCALC_5_AI_JURY_AUDIT_REPORT.md` — 5-AI Jury Audit identifying static export (`output: 'export'`) friction with `/api/ai/copilot`, UI density gaps, and trust/verification requirements.
- **`[SRC-04]`** `src/components/os/HeadlessCalculatorWindow.tsx` — Legacy fallback component that previously routed ~24 `calculators.json` slugs to an LLM text box instead of deterministic IEEE 754 math.
- **`[SRC-05]`** `src/components/calculators/UniversalCalcRenderer.tsx` — Shared V2 schema workbench wrapper that previously used `backdrop-blur-3xl` and `rounded-[28px]`/`rounded-[32px]` pill containers.
- **`[SRC-06]`** `src/components/home/HomeBentoMatrix.tsx` & `HomePageContent.tsx` — Homepage Bento preview cards and telemetry bar where `89+` was hardcoded instead of binding to `solverCount` (`AGENTS.md §6.2`).
- **`[SRC-07]`** `VDI 2230 Blatt 1:2015` / `ISO 6336:2019` / `ISO 281:2007` / `DIN 743:2012` — Normative mechanical engineering standards requiring explicit boundary conditions, safety factor thresholds ($S_F, S_H, S_y$), and unit invariant execution.
- **`[SRC-08]`** `ISO 7200:2004` — Technical Product Documentation (Data fields in title blocks and document headers, revision hashes, sign-off blocks).
- **`[SRC-09]`** Google NotebookLM Architecture (2025–2026) — Source-grounded synthesis with inline `[SRC]` citation badges, structured Briefing Docs, interactive Knowledge Graphs, and Dual-Host Audio Overviews (*Deep Dive*, *Executive Brief*, *Red-Team Critique*).

---

## 2. Critical Diagnostic Findings ("Siteyi Toparla" Remediation Matrix)

| ID | Defect / Gap Identified | Source Citation | Root Cause | Remediation Applied |
|---|---|---|---|---|
| **REM-01** | Non-deterministic LLM fallback in `HeadlessCalculatorWindow.tsx` for 24 routes | `[SRC-03]`, `[SRC-04]` | Slugs in `calculators.json` without a custom workbench fell back to `fetch('/api/ai/copilot')`, failing on static hosting and violating `AGENTS.md §2` | Replaced with a **100% Deterministic IEEE 754 Multi-Physics Workbench** covering all 24 formulas (`hooke-law`, `ideal-gas-law`, `reynolds-number`, `v-belt-power`, `gear-contact-stress`, `truss-analysis`, `machining-time`, `bend-allowance`, etc.) + mapped existing V2 schemas in `WindowContent.tsx`. |
| **REM-02** | Forbidden glassmorphism & oversized pill radii in `UniversalCalcRenderer.tsx` | `[SRC-02]`, `[SRC-05]` | Legacy `backdrop-blur-3xl`, `rounded-[28px]`, `rounded-[32px]` classes in the shared calculator shell | Converted to strict **AluCalc Instrument** tokens (`var(--bg-1)`, `var(--bg-2)`, `var(--line)`, `var(--radius-s)`, `var(--radius-m)`) with CNC status readouts. |
| **REM-03** | Hardcoded `89+` solver count drift on Homepage & `/calculators` | `[SRC-01]`, `[SRC-06]` | Static strings in `EngineeringTelemetryBar.tsx`, `HomePageContent.tsx`, `HomeBentoMatrix.tsx`, and `calculators/page.tsx` | Dynamically bound all public counts to `solverCount`, `fieldToolCount`, and `academyUnitCount` from `calculatorRegistry.ts`. |
| **REM-04** | Static homepage Bento cards & canned M12 AeGiS response | `[SRC-06]` | `HomeBentoMatrix.tsx` had non-interactive VDI 2230 / ISO 281 cards and a hardcoded M12 string | Upgraded to live interactive micro-instruments (M8–M20 × 8.8/10.9/12.9 VDI 2230 selector, live ISO 281 $L_{10h}$ slider, and real deterministic AeGiS parser). |
| **REM-05** | Bloated, low-contrast marketing prose in `HomeFooterSection.tsx` | `[SRC-02]` | Repetitive SEO essay blocks with `text-slate-600` low-contrast links | Consolidated into a high-contrast CNC Standards Compliance Matrix & Instrument Footer. |

---

## 3. Architecture of the 12 Major Features & 15 Sub-Features

### Major Feature 1: NotebookLM Engineering Research & Audio Briefing Studio (`NotebookLMStudioModal.tsx`)
- **Sub-Feature 1.1:** **Dual-Host Audio Overview Synthesizer** — Generates natural 2-host technical dialogues (*Host A: Lead Mechanical Auditor*, *Host B: Standards Verification Engineer*) in 3 modes (*Deep Dive*, *Executive Brief*, *Red-Team Critique*) with bilingual TR/EN support, Web Speech API synthesis, live canvas oscilloscope waveform, and synchronized transcript highlighting.
- **Sub-Feature 1.2:** **Source-Grounded Briefing Doc & Study Guide** — Synthesizes normative equations, boundary conditions, failure modes, and inline `[SRC]` citations for any active solver or the entire AluCalc OS platform.
- **Sub-Feature 1.3:** **Interactive Cross-Module Knowledge Graph** — Visualizes upstream/downstream engineering couplings (e.g., Motor Torque → ISO 6336 Gear → DIN 743 Shaft → DIN 6885 Keyway → ISO 281 Bearing) with 1-click navigation.
- **Sub-Feature 1.4:** **1-Click NotebookLM Source Pack Exporter (`.md` / `.json`)** — Exports a structured markdown/JSON bundle of standards, formulas, and current solver state ready to drop directly into Google NotebookLM.

### Major Feature 2: Deterministic Multi-Physics Solver Engine for All 24 `calculators.json` Routes (`HeadlessCalculatorWindow.tsx`)
- **Sub-Feature 2.1:** **Interactive Parameter Sliders, Numeric Readouts & Engineering Presets** for all 24 scientific/mechanical formulas.
- **Sub-Feature 2.2:** **Live SVG Parametric Sensitivity Curve & Safety Verdict Badge** (`PASS` / `WARNING` / `CRITICAL`).
- **Sub-Feature 2.3:** **Symbolic Formula Substitution Trace & JSON/CSV Data Export**.

### Major Feature 3: Strict "AluCalc Instrument" Workbench Chrome (`UniversalCalcRenderer.tsx`)
- **Sub-Feature 3.1:** **Zero-Glassmorphism CNC Control Panel UI** using `:root` CSS tokens (`--bg-0..3`, `--line`, `--cyan`, `--ok`, `--warn`, `--bad`, `--std`, `4px/8px` radii).
- **Sub-Feature 3.2:** **Live Execution Telemetry Header** displaying execution latency (ms), IEEE 754 precision status, and methodology tier badge.

### Major Feature 4: Multi-Variable Parametric Sensitivity & Tornado Analysis (`UniversalCalcRenderer.tsx`)
- **Sub-Feature 4.1:** **$\pm 20\%$ Parametric Sweep Curve** plotting primary output response across a 9-point sweep of any selected input variable.
- **Sub-Feature 4.2:** **Normalized Elasticity Tornado Ranking** identifying which input dimension has the highest leverage on stress/safety factor.

### Major Feature 5: Deterministic Monte Carlo Tolerance & Six-Sigma ($C_{pk}$) Simulator (`UniversalCalcRenderer.tsx`)
- **Sub-Feature 5.1:** **Seeded Box-Muller Gaussian Simulation ($N = 500$ runs)** applying configurable manufacturing tolerance ($\pm 1\%$ to $\pm 10\%$) across all numeric inputs.
- **Sub-Feature 5.2:** **Statistical Distribution Histogram & Process Capability Readout** ($\mu$, $\sigma$, $P_{5}$, $P_{95}$, $\pm 3\sigma$ bounds, and $C_{pk}$ index).

### Major Feature 6: Global Unit System Scaling & Dimensional Reference Bar (`UniversalCalcRenderer.tsx`)
- **Sub-Feature 6.1:** **SI (`mm·N·MPa`) / Metric (`m·kN·GPa`) / Imperial (`in·lbf·psi`) Display Converter** dynamically showing converted secondary readouts on every output card without mutating underlying deterministic SI math.

### Major Feature 7: What-If Scenario Snapshot & A/B Baseline Delta Comparator (`UniversalCalcRenderer.tsx`)
- **Sub-Feature 7.1:** **Freeze Baseline & Live $\Delta\%$ Comparison** allowing engineers to snapshot a design configuration and immediately see absolute and percentage deltas ($\Delta\%$) as they tweak inputs.

### Major Feature 8: ISO 7200 Engineering Calculation Sheet & SHA-256 Audit Hash (`CalculationReport.tsx`)
- **Sub-Feature 8.1:** **Deterministic SHA-256-style Verification Signature & Revision Block** with customizable Project ID, Part Number, Engineer Name, and Markdown/CSV/Print export.

### Major Feature 9: Interactive Live Micro-Solvers in Homepage Bento Matrix (`HomeBentoMatrix.tsx`)
- **Sub-Feature 9.1:** **Live VDI 2230 Bolt Preload & Torque Micro-Instrument** (interactive M8–M20 × Grade 8.8/10.9/12.9 selector computing real $F_{M,\text{zul}}$, $M_A$, and utilization bar).
- **Sub-Feature 9.2:** **Live ISO 281 Bearing $L_{10h}$ Fatigue Life Micro-Instrument** (interactive radial load $F_r$ and RPM controls updating $L_{10h}$ life hours and Weibull bar).
- **Sub-Feature 9.3:** **Deterministic AeGiS Engineering Command Parser** on the homepage (evaluates bolts `M6`–`M36`, bearings, beam bending, alloys `6061`/`7075`/`S355`/`42CrMo4`, and unit conversions in real time).

### Major Feature 10: End-to-End Engineering Workflow Pipelines on Homepage (`HomePageContent.tsx`)
- **Sub-Feature 10.1:** **Interactive Multi-Stage Design Chains** (*Mechanical Powertrain Chain*, *Pressurized Fluid & Thermal Chain*, *Sheet Metal & Structural Frame Chain*) with stage-by-stage input/output port badges and direct launch links.

### Major Feature 11: Advanced `/calculators` & `/lite` Workbench Directory (`CalculatorsDirectoryClient.tsx`, `LiteClient.tsx`)
- **Sub-Feature 11.1:** **Engine Type & Normative Standard Filter Matrix + Pinned Favorites (`localStorage`)**.
- **Sub-Feature 11.2:** **Grid Card View vs. High-Density CNC Data Table View Toggle** in `/calculators`.

### Major Feature 12: Persistent Quick-Pin Favorites & Recent Solvers Telemetry Strip (`NavigationHeader.tsx`, `HomePageContent.tsx`)
- **Sub-Feature 12.1:** **One-Click NotebookLM Studio Launcher (`Alt+N`)** in the global navigation header and per-module SEO shell.
