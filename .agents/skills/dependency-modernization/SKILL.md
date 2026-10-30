---
name: dependency-modernization
description: Safe procedure for bumping dependencies, continuing the prior Faz 0-7 modernization pass. Use for routine or major dependency updates.
---

# Dependency Modernization

## When to use this skill
- Any `package.json` dependency bump, routine or major.
- Continuing a previously-started phased ("Faz") modernization pass.

## Context

This project runs bleeding-edge versions (Next.js 16.2, React 19.2, Tailwind CSS v4 as of the last check) and CI already needs `npm install --legacy-peer-deps` to install cleanly — a sign of active peer-dependency friction, not a one-time fluke. Treat every bump as something that can plausibly break the peer-dependency graph again.

## Procedure

1. **Patch/minor bumps:** `npm audit fix` and routine patch/minor updates can be applied automatically per `README.md`'s own stated policy ("only apply minor/patch updates automatically").
2. **Major bumps** (Next.js, React, Three.js, or anything touching the 3D/CAD stack): require a phased plan in the "Faz" format already used elsewhere in this project (a numbered phase brief: what changes, what could break, how it'll be verified) rather than a single unstructured bump commit.
3. After any lockfile change, verify `scripts/patch_planegcs.js` (the `postinstall` hook patching `@salusoft89/planegcs`) still applies cleanly — it's patching a third-party package, so an unrelated version bump elsewhere in the tree can silently break it.
4. Re-run `scripts/copy_calculators.js` (the `prebuild` hook) and a full `npm run build` locally before merging — this project statically exports 300+ routes, so a build-time regression is cheap to catch locally and expensive to discover after a Hostinger deploy.
5. Manually verify the 3D rendering pipeline after any Three.js/React Three Fiber/OpenCascade-adjacent bump — per `README.md`'s own security/hygiene policy, this step is explicitly called out as mandatory and not delegable to automated tests. Use `.agents/skills/qa-verification-protocol/` for what "verified" needs to mean here.
6. Don't silently purge a dependency that looked "legacy" without confirming nothing still imports it — the README claims obsolete TypeORM instances were already purged; don't assume every old-looking package is dead weight without checking.
