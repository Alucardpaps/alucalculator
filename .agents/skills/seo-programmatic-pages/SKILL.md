---
name: seo-programmatic-pages
description: Enforces seo/programmatic-content-strategy.md as a build gate for new material/alloy, calculator+alloy, and comparison pages. Use when creating or reviewing programmatic SEO pages.
---

# Programmatic SEO Page Builder

## When to use this skill
- Creating a new alloy/material page, a calculator+alloy combination page, or an alloy comparison page.
- Reviewing an existing programmatic page for doorway-page risk (thin/duplicate content Google's algorithm penalizes).

Full spec: `seo/programmatic-content-strategy.md` (root). This skill is the enforced version of it — treat every item below as a gate, not a suggestion.

## Before publishing any programmatic page, verify

- [ ] Density (and other key properties) is alloy-specific, not a generic default (e.g. not always `2.70` for every aluminum alloy).
- [ ] At least 3 unique properties displayed (yield strength, hardness, thermal expansion, price index vs. a baseline like 6061, etc.).
- [ ] A contextual warning/tip is present where applicable (e.g. 7075 → not weldable, use mechanical fasteners; 5083 → good for marine/H116 temper).
- [ ] Internal links to 2+ related pages (same alloy/different shape, similar alloy, relevant calculator).
- [ ] Unique `<title>` and meta description following the documented pattern (`{Alloy} {Shape} Weight Calculator | Density {X} g/cm³ | AluCalculator`).
- [ ] Correct structured-data schema for the page type: `Dataset` for material pages, `SoftwareApplication` for calculator pages, `FAQPage` for comparison pages.
- [ ] URL matches the documented structure (`/en/materials/{alloy}/`, `/en/calculator/{alloy}/{property}/`, `/en/compare/{alloy1}-vs-{alloy2}/`).
- [ ] Interactive calculator is embedded, not just a static data table.
- [ ] Mobile layout checked, not just desktop.

## If generating many pages at once

Generate a small batch, verify the checklist against 2–3 real examples, then continue — don't template out all pages in the category before confirming the template itself passes the "unique engineering value" bar.
