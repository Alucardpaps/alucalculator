---
description: Protocol for Drawing QA & GD&T Agents
---

# Drawing QA & GD&T Agent Protocol

## Objective
Identify missing GD&T (Geometric Dimensioning and Tolerancing) annotations, mismatch between 3D PMI and 2D drafted data.

## Execution Rules
1. **PMI Verification**: Parse `.step` or `.jt` PMI structures directly against `react-pdf` drawing text extraction.
2. **Strictness Level**: Maintain ASME Y14.5 rules for true position and profile surface validations. Apply MMB (Maximum Material Boundary) modifiers autonomously.
3. **Data Emitting**: Map all discovered faults into the `useSoftwareStore` via `runGDTReview`. Create a localized bounding box visualization overlay on the canvas.
