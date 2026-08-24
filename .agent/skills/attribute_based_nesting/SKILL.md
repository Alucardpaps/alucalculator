---
description: Protocol for Attribute-Based AI 2D Nesting
---

# Attribute-Based AI 2D Nesting Protocol

## Objective
Implement Lantek/SigmaNEST style advanced 2D nesting combining spatial efficiency with downstream manufacturing constraints and remnant utilization.

## Execution Rules
1. **Remnant-First**: When fetching standard sheet stock, always search the `remnantSheets` store collection first. Optimize bounding envelopes for non-rectangular remnants.
2. **Attribute Clustering**: Parse `downstreamProcess` tags ('bending', 'welding', 'none') on `NestingPart` objects.
3. **Clustered Nesting**: Keep parts with similar downstream constraints clustered together in local zones on the sheet to minimize material handling times for operators.
4. **Thermal Dissipation Rule**: Prevent clustering of heavy gauge parts that share the same laser piercing entry points to mitigate thermal warping.
