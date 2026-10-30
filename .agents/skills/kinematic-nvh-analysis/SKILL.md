---
name: kinematic-nvh-analysis
description: Protocol for kinematic NVH (Noise, Vibration, Harshness) and gearbox resonance analysis, mimicking KISSsoft diagnostics. Use when analyzing gearbox or drivetrain resonance behavior.
---

# Kinematic NVH & Gearbox Analysis Protocol

## When to use this skill
- Identifying torsional or lateral resonance frequencies in an EV or industrial spur/helical gearbox model.

## Objective
Identify torsional and lateral resonance frequencies (NVH) within electric vehicle (EV) or industrial spur/helical gearboxes mimicking KISSsoft diagnostics.

## Execution Rules
1. **Data Model**: Assemble the stiffness matrices ($K$) and mass matrices ($M$) for all parallel shafts and meshing gears.
2. **Eigenvalue Extraction**: Solve $\det(K - \omega^2 M) = 0$ to find natural frequencies ($\omega_n$).
3. **Harmonic Excitation**: Analyze gear mesh frequencies against $\omega_n$ to identify dangerous resonances.
4. **State Export**: Map frequency outputs and critical mode texts into `gearboxNVHData` inside `useMechanicalStore`.
