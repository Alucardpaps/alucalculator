---
description: AluCalc visual system (v6, multi-theme) — tokens, themes and anti-patterns for any UI/styling work. Apply for shell, homepage, solver pages, modals and new components.
---
# Design System — "AluCalc Instrument" v6 (multi-theme)

**Suggested activation: Model Decision (UI/styling/CSS/component work), or Glob — `src/app/**/*.tsx`, `src/components/**/*.tsx`, `**/*.css`.**

Target feel: a precise engineering instrument (CNC panel, Mitutoyo readout) — calm, legible, information-dense. Not an AI-SaaS landing page.

## Themes (v6)

The site has 5 themes + "system". **Default is `graphite` (dark).** A theme is chosen with `<html data-theme="…">`.

| id | kind | feel |
|---|---|---|
| `graphite` | dark | default; neutral graphite, cyan accent |
| `midnight` | dark | navy, blue accent |
| `oled` | dark | true black, classic neon cyan |
| `light` | light | clean office white |
| `paper` | light | warm drafting paper, blue ink |

- Registry: `src/lib/theme/themes.ts` (names, swatches, pre-paint init script).
- State: `src/lib/theme/themeStore.ts` (`useTheme()`, `setThemePreference()`, `toggleThemeKind()`).
- CSS tokens: `src/styles/themes.css`. Tailwind palette remap: `src/styles/palette.css` (generated — run `python3 scripts/theme/gen_palette.py node_modules/tailwindcss/theme.css src/styles/palette.css`).
- UI: `ThemePicker` / `ThemeGrid` in `src/components/settings/ThemePicker.tsx`.
- `osStore.setTheme()` still works but only forwards to the theme engine. **Never** add/remove `light`/`dark`/`paper` classes on `<html>` yourself; `.dark` is always present on purpose.

### Adding a theme
1. Add a `:root[data-theme="<id>"]` block to `themes.css` with **every** token below.
2. Add an entry to `THEMES` in `themes.ts`.
3. If it is a light theme, add its selector next to `light`/`paper` in `gen_palette.py` and regenerate `palette.css`.
4. `npx vitest run src/tests/theme-and-ai.test.ts` must pass (it checks the token set per theme).

## Tokens — the only colours components may use

```
surfaces : --bg-0 (page)  --bg-1 (header/sidebar)  --bg-2 (card/panel)  --bg-3 (inset/well)
lines    : --line  --line-strong  --line-faint
text     : --ink (primary)  --alu (secondary)  --alu-dim (labels)  --muted (hints)
accent   : --cyan (primary accent; name kept for compatibility)  --cyan-dim  --accent-ink (text ON accent fill)
           --accent-soft (tinted bg)  --accent-line (tinted border)  --cyan-glow
status   : --ok --warn --bad --std  (+ --ok-soft --warn-soft --bad-soft)
states   : --hover  --active  --focus-ring  --scrim (modal backdrop)
elevation: --shadow-1  --shadow-2
radii    : --radius-s 4px  --radius-m 6px  --radius-l 8px
fonts    : --font-ui (Inter)  --font-mono (JetBrains Mono)
```

Write them as Tailwind arbitrary values: `bg-[var(--bg-2)] border-[var(--line)] text-[var(--ink)]`, or the exposed colours `bg-bg-2 text-ink border-line text-accent`.

## Hard rules

- **FORBIDDEN:** hex/rgb colours in class names or inline styles for UI chrome (`bg-[#0a0e14]`, `text-[#00e5ff]`, `style={{background:'#111'}}`). Use tokens. (Exceptions: SVG technical drawings, Three.js materials, chart series colours, brand logos.)
- **FORBIDDEN:** glassmorphism (`backdrop-blur` panels), aurora/blob gradients, purple-pink AI gradients, gradient heading text, floating 3D decorations.
- **FORBIDDEN:** radii above 12px on cards/panels (`rounded-[2.5rem]`, `rounded-[32px]`). `rounded-2xl`/`3xl` are capped by the theme.
- **FORBIDDEN:** `italic` + `font-black` shouty headings; uppercase micro-labels with `tracking-[0.3em]` for body copy.
- Legacy dark-authored classes (`text-white`, `bg-white/5`, `border-white/10`, `slate-*`, `cyan-*`) still work in every theme because `palette.css` re-points them to tokens — but new code should use tokens directly.
- Text on an accent fill uses `text-[var(--accent-ink)]` (never `text-white`/`text-black`).
- Printable reports that must stay black-on-white: wrap them in `.palette-literal`.
- Body text → Inter. Numbers, units, formulas, standard codes → JetBrains Mono with `tabular-nums`.
- Borders over shadows. Accent is for state and the single primary action per view.
- Solver pages: no decorative motion. Always honour `prefers-reduced-motion` (globally enforced in `globals.css`).
- Every interactive element needs a visible focus state (`focus-visible:[box-shadow:var(--focus-ring)]`).
- Check every UI change in at least one dark **and** one light theme before declaring it done.

## Codemods (re-runnable, idempotent)

- `python3 scripts/theme/codemod_colors.py src` — hex colours in classes/inline styles → tokens.
- `python3 scripts/theme/codemod_calm.py src` — oversized radii, italic-black, backdrop-blur → calm defaults.
