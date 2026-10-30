---
name: repo-hygiene-cleanup
description: Procedure for removing generated/extracted artifacts and one-off scripts that have accumulated at repo root and bloated the repository. Use for a cleanup pass or when the repo feels slow to clone or build.
---

# Repo Hygiene Cleanup

## When to use this skill
- The repo is slow to clone, CI checkout is slow, or before onboarding a new contributor/agent to a fresh machine.
- Periodically — one-off scripts and extracted snapshots accumulate quietly over time.

## Confirmed current offenders (re-check sizes, they'll have grown)

All of the following are **git-tracked**, not just present locally (confirmed via `git ls-files`):

- `_zip_extracted/` — ~106 MB, looks like a full extracted build/zip snapshot.
- `_live_extract/` — ~3 MB, an extracted crawl of the live site, already stale (its `index.html` has an older, thinner `<title>`/meta than the current live site).
- `deploy-out.zip` — ~56 MB, a build output archive.
- `reference_archive/faculty-resources/` — ~147 MB of third-party reference material.
- Root-level one-off migration scripts that already did their job: `rebuild_countersink.js`, `rebuild_svg.js`, `replace_beam.js`/`replace_beam.py`, `upgrade_gearbox.js`, `tmp-fix-json.js`, `test-gemini.js`.
- Committed compiler-error dumps: `ts-errors.txt`, `tsc-errors.txt`, `eslint_errors_utf8.txt` — these are point-in-time debug output, not documentation.

## Procedure

1. **Confirm nothing at runtime reads from a path before removing it.** `grep -rn "_zip_extracted\|_live_extract\|reference_archive" src scripts` — if a build or runtime script depends on one of these, don't remove it blindly; flag it instead.
2. `git rm -r --cached <path>` for anything confirmed safe, then add the path to `.gitignore` so it doesn't silently come back.
3. For `reference_archive/faculty-resources/` specifically: before deciding whether it belongs in version control at all, check whether the material has redistribution rights — third-party academic/faculty resources bundled wholesale into a public repo is a separate concern from repo size. If it needs to stay accessible, consider external storage (a CDN bucket, Git LFS) instead of the main tree.
4. **The two `alucalc-release.keystore` files are a security incident, not a hygiene item** — don't just `git rm --cached` them and move on; follow `.agents/rules/security-hardening.md`'s remediation steps (new keystore, history purge) instead.
5. Batch the removal into a single, clearly-labeled commit ("chore: remove generated artifacts and stale scratch scripts from version control") rather than mixing it into an unrelated feature diff.
