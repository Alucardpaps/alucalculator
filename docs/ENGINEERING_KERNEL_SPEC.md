# 🏗️ ALUCALCULATOR ENGINEERING CONSTITUTION
## Version 1.0 — Grand Architect Final Specification

---

## 🔒 EXECUTION CONTRACT (ABSOLUTE RULES)

This project operates as a **Browser-Based Engineering Kernel**, not a website.

**MANDATORY RULES:**

1. **NO MOCK LOGIC** – All geometry must be mathematically valid
2. **NO HARDCODED CALCULATORS** – Everything uses universal schema
3. **NO MESH-TO-CAD EXPORT** – Manufacturing data from math, not triangles
4. **PERFORMANCE FIRST** – Heavy systems (WebGL, CAD) lazy-loaded
5. **ENGINEERING SAFETY** – Invalid inputs MUST warn or block export
6. **CAD IS TRUTH** – Visuals are secondary to manufacturing accuracy

---

## 🧬 CORE IDENTITY

| Property | Value |
|----------|-------|
| **Name** | AluCalculator |
| **Meaning** | Alucard Calculator (NOT aluminum-only) |
| **Mission** | Visual Engineering OS producing manufacturing-grade CAD (DXF/STEP) |
| **Target Users** | Mechanical engineers, CNC operators, fabrication engineers |

---

## 🧠 SYSTEM LAYERS (Strictly Separated)

1. **Mathematical Core** — Truth Layer
2. **Engineering Validation** — Safety Layer  
3. **Visualization & UX** — Interface Layer

> ⚠️ The UI must NEVER influence math.

---

## 📁 PROJECT STRUCTURE

```
/alucalc-engineering-os
├── /docs
│   └── ENGINEERING_KERNEL_SPEC.md
├── /src
│   ├── core/schema/CalculatorSchema.ts
│   ├── core/validation/EngineeringValidator.ts
│   ├── core/registry/calculatorRegistry.ts
│   ├── engines/math/involute.ts
│   ├── engines/math/gear.geometry.ts
│   ├── engines/export/dxf.exporter.ts
│   ├── engines/export/step.exporter.ts
│   └── visualizers/Scene3D.tsx
```

---

## ⚙️ INVOLUTE GEAR ENGINE (CRITICAL)

### Absolute Requirements

- True involute curve from **base circle**
- DIN 3960 compliant geometry
- Undercut detection (z < 17 @ 20°)
- Profile shift support
- Single-tooth generation → angular replication

### Mathematical Foundation

```
x(t) = r_b * (cos(t) + t * sin(t))
y(t) = r_b * (sin(t) - t * cos(t))

where:
  r_b = (m * z / 2) * cos(α)  // Base circle radius
  α = pressure angle (typically 20°)
  t = involute parameter [0, t_max]
```

---

## 🏭 MANUFACTURING EXPORT

### DXF Requirements
- Generated from math points ONLY
- AutoCAD R12 compatible
- Clean polylines (CNC friendly)
- Layered: `PART_CONTOUR`, `DIMENSIONS`, `REFERENCE`
- **Export blocked if validation fails**

### STEP Requirements (Phase 2)
- ISO-10303-21 text format
- Linear extrusion from involute profile
- SolidWorks / Fusion compatible

---

## 🧪 VALIDATION ENGINE

Must detect and handle:
- Undercut risk (z < 17 @ α=20°, x=0)
- Invalid K-Factor usage
- Impossible geometry
- Critical errors → block export

---

## 🚨 COMPLIANCE CHECKLIST

| Requirement | Status |
|-------------|--------|
| CalculatorSchema | ✅ Implemented |
| Universal Registry | ✅ Implemented |
| Material Database | ✅ Implemented |
| Engineering Validation | ✅ Implemented |
| True Involute Math | 🔄 In Progress |
| CNC-Grade DXF | 🔄 In Progress |
| STEP Export | ⏳ Planned |
| Undercut Detection | 🔄 In Progress |

---

*This document is the constitutional reference for all code in this repository.*
*Any code violating these principles must be refactored or rejected.*
