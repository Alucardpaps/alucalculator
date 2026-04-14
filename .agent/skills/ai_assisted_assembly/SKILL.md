---
description: Protocol for AI-Assisted Assembly & Fastener Auto-Detection
---

# AI-Assisted Assembly & Cloud Collaboration Protocol

## Objective
To autonomously detect mating surfaces and automatically assemble standard fasteners (bolts, nuts, washers) mimicking Solidworks 2026 heuristics.

## Execution Rules
1. **Geometry Analysis**: When invoking CAD auto-assembly, traverse the full topological graph to identify cylindrical holes spanning entirely through 2+ parallel solid bodies.
2. **Fastener Sizing**: Calculate hole diameter $D$ and total span length $L$. Retrieve the standard ISO/DIN fastener matching $M_D \times L$.
3. **Branching State**: Always push this assembly delta into a dedicated feature branch using `useManufacturingStore`'s `createBranch`.
4. **Collision Avoidance**: Ensure no bounding box overlap between newly inserted fasteners and existing geometry.
