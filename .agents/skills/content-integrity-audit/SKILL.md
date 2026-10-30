---
name: content-integrity-audit
description: Reconciles inconsistent public-facing numbers and stale documentation across AluCalc OS (calculator counts, deployment target, architecture docs). Use for a periodic accuracy pass or before a marketing/launch push.
---

# Content Integrity Audit

## When to use this skill
- Before a marketing push, launch announcement, or press mention that will quote a feature count.
- Periodically, since new calculators keep getting added and every hardcoded count silently goes stale again.

## Known inconsistencies as of the last audit (re-check, don't assume still true)

- **Calculator/module count** — five different numbers currently exist: homepage hero copy says "91 modules" (and "Search 91 Modules"), `src/data/seo-calculators/calculators.json` has 44 entries, `src/data/calculatorHubData.ts` has roughly 48 `id:` entries, `README.md` says "250+ engineering routes and calculators", `ALUCALC_AGENT_PLAN.md` says "100+ deterministic solvers". The sidebar category counts (7+16+8+5=36, labelled "WORKSPACE 36") are internally consistent with each other but don't match any of the above either.
- **Deployment target** — `DEPLOYMENT_GUIDE.md` describes Vercel + Supabase with specific env-var setup instructions. The actual pipeline (`.github/workflows/deploy.yml`) builds statically and FTP-deploys to Hostinger (`srv2070.hstgr.io`). The guide is stale.
- **Module authoring pattern** — `CONTRIBUTING.md` (`src/components/calculators/`) and `MODULE_AUTHOR_GUIDE.md` (UDA / `src/modules/` / `ModuleRegistry`) describe two different architectures without cross-referencing each other. See `.agents/rules/module-architecture.md`.

## Procedure

1. Pick ONE canonical source for "how many calculators/modules exist" — recommend `calculatorHubData.ts` (or a build-time generated registry derived from the actual `src/modules/` + `src/components/calculators/` directories) since it's closest to the actual shipped surface.
2. Grep the repo for hardcoded `\d+\+?\s*(modules|solvers|calculators|routes)` style strings across `src/app`, `README.md`, and any root-level planning docs.
3. Replace each hardcoded figure with a value derived from the canonical source at build or render time, so it can't drift again.
4. For stale docs (like `DEPLOYMENT_GUIDE.md`), either update them to match reality or add a one-line header pointing to whichever doc/workflow is actually authoritative now — don't silently delete history that another agent session might still reference.
5. Report every inconsistency found with its exact file path and current value, before proposing which number is "correct" — the point is surfacing the drift, not guessing a winner.
