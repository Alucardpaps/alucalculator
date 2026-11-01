---
name: design-code-verification
description: Protocol for automated structural design-code verification against AISC 360-16 and Eurocode 3. Use when a modelled steel/aluminum beam needs a compliance check.
---

# Design Code Verification Protocol

## When to use this skill
- A 3D-modelled steel or aluminum structural beam needs to be checked against AISC 360-16 and/or Eurocode 3.

## Objective
Autonomously calculate and verify 3D modelled steel/aluminum structural beams against AISC 360-16 and Eurocode 3 standards.

## Execution Rules
1. **Extraction**: Identify span lengths ($L$), unbraced lengths ($L_b$), and section properties ($I_x, S_x, Z_x$) from raw geometry bounds.
2. **Deflection Constraint**: Validate Serviceability Limit State (SLS). E.g., Live Load deflection must remain $\le L/360$.
3. **Strength Verification**: Validate Ultimate Limit State (ULS) spanning local buckling and lateral-torsional buckling (LTB).
4. **Reporting**: Flag all critical warnings into the `useCivilStore` violations array natively via `runComplianceCheck`.
