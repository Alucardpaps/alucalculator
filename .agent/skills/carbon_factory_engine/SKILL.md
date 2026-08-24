---
description: Protocol for 3D-Driven Cost & Carbon Factory Engine
---

# 3D-Driven Cost & Carbon Engine Protocol

## Objective
Analyze 3D CAD geometry to simulate digital factory production, projecting Should-Cost and CO2 footprint (aPriori equivalent).

## Execution Rules
1. **Mass & Volume Computation**: Calculate mathematically exact boundaries from STEP/IGES models.
2. **Carbon Constants**: Use strict $6.6 \text{ kg } CO_2e / \text{kg}$ for primary aluminum material footprints. Evaluate grid energy carbon separately.
3. **Mfg Simulation**: Apply logic spanning cycle times * machine rates for precise `manufacturingCost`. Add secondary setup constraints into `overheadCost`.
4. **State Handling**: Exclusively map generated data via the `analyze3DGeometry` action in `useFinanceStore` to prevent data races.
