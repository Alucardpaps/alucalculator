# 🧠 ALUCALCULATOR OS

# 🚀 ENGINEERING FLOW SYSTEM — MASTER LOCK PROMPT (FINAL)

You are operating inside **AluCalculator OS**.

This is NOT a website.
This is NOT a UI experiment.
This is a **Deterministic Engineering Operating System**.

You are building a hybrid system:

> Node-RED style visual flow
>
> * Siemens NX level engineering determinism

The Flow System is the CORE of the platform.

You must obey the following architectural laws.

---

# 1️⃣ SYSTEM IDENTITY LOCK

This system is:

* Deterministic
* Engineering-grade
* ISO-aware
* Layer-isolated
* Type-safe
* Export-ready (DXF / STEP / PDF)

It is NOT:

* A low-code toy
* A visual demo
* A UI-first system
* A loose scripting playground

Every node must produce reproducible engineering results.

---

# 2️⃣ LAYER ARCHITECTURE (STRICT)

src/
├── flow/               # Graph engine only
│   ├── core/
│   ├── execution/
│   ├── types/
│   └── registry/
├── mechanical/         # Pure engineering math
├── validation/         # ISO & engineering checks
├── viewers/            # Rendering only
├── export/             # DXF / STEP / PDF
└── os/                 # UI layer

STRICT RULES:

• mechanical/ MUST NOT import React, window, document
• flow/core MUST NOT contain UI code
• viewers MUST NOT compute geometry
• export MUST NOT recompute math
• os MUST NOT contain engineering formulas

Dependency direction:

OS → Flow → Mechanical → Validation → Export → Viewers

Never reverse this direction.

---

# 3️⃣ ENGINEERING NODE CONTRACT (MANDATORY)

Every node must implement:

```ts
interface EngineeringNode<TInput, TOutput> {
  id: string
  type: string
  version: string
  deterministic: true
  isoStandard?: string
  inputSchema: TInput
  validate(input: TInput): ValidationResult[]
  compute(input: TInput): TOutput
}
```

No exceptions.

If a node cannot be deterministic → it is rejected.

---

# 4️⃣ STRONG TYPE PORT SYSTEM (NO GENERIC PORTS)

Ports MUST use engineering semantic types.

Allowed example types:

```ts
type EngineeringPort =
  | "module_mm"
  | "tooth_count"
  | "pressure_angle_deg"
  | "torque_nm"
  | "material_mpa"
  | "length_mm"
  | "gear_geometry"
  | "stress_result"
  | "dxf_file"
  | "step_file"
  | "validation_report"
```

Connection rules:

• Ports must match exactly
• Implicit casting is forbidden
• Unit mismatch blocks connection

This is an engineering system, not JavaScript.

---

# 5️⃣ EXECUTION ENGINE (NX-GRADE)

Execution must:

1. Build graph
2. Detect circular dependencies
3. Topologically sort nodes
4. Execute in deterministic order
5. Cache results by hash
6. Mark dirty nodes on input change
7. Recompute only affected subtree

Pseudo:

```ts
const graph = buildGraph()
validateGraph(graph)
const order = topoSort(graph)

for (node of order) {
   const errors = node.validate(node.input)
   if (errors.length) blockExecution()
   const result = node.compute(node.input)
   storeResult(node.id, result)
}
```

Graph failure = hard stop.

---

# 6️⃣ NODE CATEGORIES (LOCKED)

Input Nodes:
• Constant
• Material Selector
• ISO Selector

Mechanical Nodes:
• Spur Gear Engine (DIN 3960)
• Bearing Selector
• Sheet Metal Bend
• Nesting Optimizer

Validation Nodes:
• Undercut Detector
• ISO 6336 Preliminary
• Safety Factor Calculator

Visualization Nodes:
• 2D Technical Drawing (SVG)
• 3D Preview (dynamic import only)

Export Nodes:
• DXF (R12 compliant)
• STEP (ISO-10303-21)
• PDF Report

Each category must be isolated in registry.

---

# 7️⃣ SPUR GEAR NODE — INDUSTRIAL SPEC

Inputs:

* module_mm
* pinion_teeth
* gear_teeth
* pressure_angle_deg
* profile_shift
* face_width_mm
* torque_nm

Outputs:

* pitch_diameter_mm
* base_circle_mm
* addendum_circle_mm
* dedendum_circle_mm
* center_distance_mm
* contact_ratio
* gear_geometry
* validation_report

Mandatory checks:

* Undercut detection
* Minimum teeth threshold
* ISO geometry compliance
* Profile shift validity

Geometry must use true involute:

x(t) = r_b (cos t + t sin t)
y(t) = r_b (sin t − t cos t)

Polyline simplification allowed.
Mesh forbidden in export layer.

---

# 8️⃣ WORKER ENFORCEMENT

Heavy nodes MUST run in Web Worker:

• Nesting
• Strength analysis
• Future FEA

Main thread must never freeze.

---

# 9️⃣ VERSION LOCK SYSTEM

Every node must include:

```ts
metadata: {
  version: "x.y.z"
  deterministic: true
  isoStandard?: string
}
```

If logic changes → version increments.

Flows store node version snapshot.

---

# 🔟 UX RULES (Node-RED + NX Hybrid)

• Grid snapping mandatory
• Port hover shows type + unit
• Execution status indicator per node
• Error nodes glow red
• ISO badge visible
• Node collapse mode
• Live engineering data preview

UI must feel industrial, not playful.

---

# 11️⃣ EXPORT CHAIN GUARANTEE

Export nodes can only consume validated geometry.

If validation fails:
Export = blocked.

DXF:
• Polyline only
• Layered structure
• PART_CONTOUR
• PITCH_CIRCLE
• DIMENSIONS

STEP:
• ISO-10303-21 compliant
• Clean BREP
• No triangulated mesh

---

# 12️⃣ AI RESTRICTIONS

AI must:

• Respect layer boundaries
• Output file paths before generating code
• Declare affected layers
• Never mix UI with mechanical
• Never create implicit unit conversions

If a request violates architecture → refuse.

---

# 13️⃣ SYSTEM GOAL

The Flow System must:

• Replace manual calculator pages
• Allow chained engineering logic
• Allow export pipelines
• Be scalable to full digital twin workflows

This is the core of AluCalculator OS.

---

# END OF MASTER LOCK

This architecture is now frozen.

No deviations.
No shortcuts.
No UI-math mixing.
No generic ports.
No unstable graph execution.

You are building an Engineering Operating System.
