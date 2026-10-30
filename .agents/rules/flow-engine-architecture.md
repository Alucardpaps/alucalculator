---
description: Layering and determinism laws for the Flow Engine (src/flow, src/mechanical, src/validation, src/export, src/viewers). Apply when touching any of those directories.
---
# Flow Engine Architecture

**Suggested activation: Glob — `src/flow/**`, `src/mechanical/**`, `src/validation/**`, `src/export/**`, `src/viewers/**`, `src/os/**`.**

This condenses `FLOW_ENGINE_MASTER_LOCK.md` (repo root) into an always-applied rule instead of a doc that has to be pasted in manually. Read the full file for the complete spec (spur gear node contract, DXF/STEP export requirements) — this is the part that must never be silently violated.

## Layer boundaries — one-way dependency: OS → Flow → Mechanical → Validation → Export → Viewers

- `mechanical/` MUST NOT import React, `window`, or `document`.
- `flow/core` MUST NOT contain UI code.
- `viewers/` MUST NOT compute geometry.
- `export/` MUST NOT recompute math — it consumes already-validated results only.
- `os/` MUST NOT contain engineering formulas.
- Never reverse this direction.

## Node contract

Every node implements `EngineeringNode<TInput, TOutput>` (see the lock file for the full interface). `deterministic: true` is non-negotiable — a node that can't guarantee reproducible output for identical input is rejected, not shipped with a caveat.

## Ports

Ports are semantically typed (`module_mm`, `torque_nm`, `stress_result`, etc.), never generic. No implicit unit casting — a unit mismatch blocks the connection instead of silently converting.

## Execution & workers

Topological sort, dirty-node tracking, and hash-based result caching are required. Heavy nodes (nesting, strength analysis, future FEA) run in a Web Worker — never on the main thread.

## Export guarantee

Export nodes only consume validated geometry. If validation fails, export is blocked — don't add an "export anyway" bypass.

## If a request would violate this architecture

Say so and propose the compliant alternative instead of quietly doing the simpler-but-wrong thing (e.g. computing geometry inside a viewer component because it's faster to wire up).
