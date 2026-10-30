---
name: carbon-factory-engine
description: Protocol for the 3D-driven cost & carbon factory engine — projects should-cost and CO2 footprint from CAD geometry (aPriori-equivalent). Use when a part needs manufacturing cost or carbon estimation from its 3D model.
---

# 3D-Driven Cost & Carbon Engine Protocol

## When to use this skill
- A 3D CAD part needs a Should-Cost or CO2-footprint estimate derived from its actual geometry rather than a manual guess.

## Objective
Analyze 3D CAD geometry to simulate digital factory production, projecting Should-Cost and CO2 footprint (aPriori equivalent).

## Execution Rules
1. **Mass & Volume Computation**: Calculate mathematically exact boundaries from STEP/IGES models.
2. **Carbon Constants**: Use strict $6.6 \text{ kg } CO_2e / \text{kg}$ for primary aluminum material footprints. Evaluate grid energy carbon separately.
3. **Mfg Simulation**: Apply logic spanning cycle times * machine rates for precise `manufacturingCost`. Add secondary setup constraints into `overheadCost`.
4. **State Handling**: Exclusively map generated data via the `analyze3DGeometry` action in `useFinanceStore` to prevent data races.
