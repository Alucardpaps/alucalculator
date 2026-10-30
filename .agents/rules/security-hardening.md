---
description: Security constraints for AluCalc OS — secrets, signing keys, CSP, and dependency hygiene. Apply on every task.
---
# Security Hardening

**Suggested activation: Always On.**

## Open incident — read before touching `android/` or `android-wear/`

`android/alucalc-release.keystore` and `android-wear/alucalc-release.keystore` are committed to this **public** repository (confirmed in git history, not just the working tree). A committed release-signing keystore must be treated as compromised the moment it's public, regardless of how strong its password is. Don't add anything further under these paths without flagging this first. Remediation the user needs to action (an agent shouldn't do this unattended):

1. Generate a **new** keystore and re-sign future releases with it — the exposed key can never be trusted again, even after deletion.
2. `git rm --cached` both keystore files and add `*.keystore` / `*.jks` to `.gitignore` (currently absent — the existing Android/Gradle section ignores build output, not the signing key itself).
3. Purge the blobs from git history (e.g. `git filter-repo`) — removing the file in a new commit does not remove it from history or from anyone who already cloned it.
4. Rotate anything the old fingerprint could impersonate (Play Console listing, TWA `assetlinks.json` digital asset links).

## Standing rules

- Never hardcode API keys, license/entitlement keys, DB connection strings, or OAuth secrets in source. Use environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` per `DEPLOYMENT_GUIDE.md`) and keep `.env*` gitignored (it currently is).
- Before adding any new committed file that is a build artifact, archive, or extracted site snapshot, stop — see `.agents/skills/repo-hygiene-cleanup/`. (`_zip_extracted/`, `_live_extract/`, `deploy-out.zip`, and `reference_archive/faculty-resources/` are already in this state; don't add a fifth.)
- `@react-three/drei`'s `<Text>` fetches external `.woff` files at runtime and violates this project's CSP — use `<Html>` DOM overlays inside `<Canvas>` instead (per `CONTRIBUTING.md`).
- Run `npm audit` as part of any dependency change; auto-apply patch/minor only. Major bumps (Next.js, React, Three.js) need manual verification of the 3D rendering pipeline before merge — see `.agents/skills/dependency-modernization/`.
- Never print, log, or echo a secret's actual value back into chat, a PR description, or a generated report — reference the variable or file name only.
