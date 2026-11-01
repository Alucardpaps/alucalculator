---
name: reverse-engineering-assistant
description: Protocol and best practices for reverse-engineering external engineering/CAD/CAM applications, file formats, and protocols using morluto/rea, Ghidra, and Electron analysis to advance AluCalc OS while preserving Clean Room integrity.
---

# Reverse Engineering Assistant (REA) Protocol

Use this skill when investigating external desktop or web-based engineering software, CAD/CAM file formats, or proprietary calculation engines using **`morluto/rea`** (Reverse Engineer Anything) to improve or extend **AluCalc OS**.

---

## 1. Scope & Primary Use Cases

- **CAD/CAM & Drafting Interoperability:** Deconstructing proprietary or undocumented variants of DXF, DWG, STEP (AP214/242), IGES, STL, and CNC G-code dialects.
- **WASM & Constraint Solver Architecture:** Analyzing how web-based CAD tools orchestrate WebAssembly (OpenCASCADE, PlaneGCS, SolveSpace) memory layouts and constraint graphs.
- **Desktop Engineering Software Inspection:** Inspecting Electron-based or native (`.dll`, `.exe`, Mach-O, ELF) engineering applications with REA + Ghidra/Hopper.
- **Ground Truth & Benchmark Extraction:** Extracting reference calculation input-output datasets to build regression suites in `src/tests/`.

---

## 2. Clean Room Protocol (MANDATORY)

To preserve intellectual property integrity and prevent licensing contamination:

1. **Specification Extraction (Phase 1):**
   - Use REA to extract the **functional specification**, parameter structures, formula flow, or binary schema.
   - Summarize the logic as a mathematical model, flowchart, or state machine in a temporary artifact or scratchpad.
   - **FORBIDDEN:** Copy-pasting decompiled disassembly or decompiled C/C++ directly into `src/`.
2. **Independent Re-implementation (Phase 2):**
   - Write the engine from scratch in TypeScript adhering to AluCalc OS boundaries:
     - Pure mathematical logic goes to `src/mechanical/`.
     - Data exporters go to `src/export/`.
     - Headless node graphs go to `src/flow/core/`.
3. **Traceability & Tier Tagging:**
   - Tag the solver in `EngineMetadata`:
     - `methodologyType: 'heuristic'` or `'numerical'`
     - `methodologyCitation: 'Reverse-Engineered spec validated against <TargetSoftware> v<Version>'`

---

## 3. Operational Workflow with REA

### Step 1: Toolchain Setup
- Ensure Node.js and a disassembler (Ghidra, Hopper, or IDA) are available on the host.
- Initialize REA via:
  ```bash
  npx rea-agents setup
  ```
- Configure REA MCP tools in your assistant configuration (`.gemini/antigravity/mcp/` or MCP settings).

### Step 2: Target Analysis
- **Electron / Web-based CAD Tools:**
  - Unpack `.asar` archives or bundle assets using REA's static analysis features.
  - Trace state management (e.g. Zustand, Redux) and geometric calculation pipelines.
- **Native Binaries (DLL / SO / EXE):**
  - Run Ghidra headless analysis via REA.
  - Locate export tables, symbol signatures, and mathematical routines (e.g. involute gear tooth profiling, FEA stiffness matrices).

### Step 3: Generating Benchmark Tests (Ground Truth)
- Extract 3–5 representative real-world test cases with verified inputs and expected outputs.
- Create an automated test in `src/tests/<module-name>.test.ts`:
  ```typescript
  describe('<ModuleName> - REA Benchmark Parity', () => {
    it('matches target application output within 0.1% tolerance', () => {
      const result = MyEngine.calculate(testInput);
      expect(result.stress).toBeCloseTo(expectedStress, 1);
    });
  });
  ```

---

## 4. Verification Gate

Before merging any reverse-engineered logic into AluCalc OS:
1. `npm test` passes with newly authored regression tests.
2. `npm run typecheck` passes with zero errors.
3. No proprietary binary chunks or decompiled raw code exist in the codebase.
