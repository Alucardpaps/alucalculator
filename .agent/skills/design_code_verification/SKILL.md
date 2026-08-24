---
description: Protocol for Automated Design Code Verification
---

# Design Code Verification Protocol

## Objective
Autonomously calculate and verify 3D modelled steel/aluminum structural beams against AISC 360-16 and Eurocode 3 standards.

## Execution Rules
1. **Extraction**: Identify span lengths ($L$), unbraced lengths ($L_b$), and section properties ($I_x, S_x, Z_x$) from raw geometry bounds.
2. **Deflection Constraint**: Validate Serviceability Limit State (SLS). E.g., Live Load deflection must remain $\le L/360$.
3. **Strength Verification**: Validate Ultimate Limit State (ULS) spanning local buckling and lateral-torsional buckling (LTB).
4. **Reporting**: Flag all critical warnings into the `useCivilStore` violations array natively via `runComplianceCheck`.
