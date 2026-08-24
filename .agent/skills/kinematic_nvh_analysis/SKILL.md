---
description: Protocol for Kinematic NVH & Gearbox Analysis
---

# Kinematic NVH & Gearbox Analysis Protocol

## Objective
Identify torsional and lateral resonance frequencies (NVH) within electric vehicle (EV) or industrial spur/helical gearboxes mimicking KISSsoft diagnostics.

## Execution Rules
1. **Data Model**: Assemble the stiffness matrices ($K$) and mass matrices ($M$) for all parallel shafts and meshing gears.
2. **Eigenvalue Extraction**: Solve $\det(K - \omega^2 M) = 0$ to find natural frequencies ($\omega_n$).
3. **Harmonic Excitation**: Analyze gear mesh frequencies against $\omega_n$ to identify dangerous resonances.
4. **State Export**: Map frequency outputs and critical mode texts into `gearboxNVHData` inside `useMechanicalStore`.
