#!/usr/bin/env python3
"""v6 visual unification codemod (re-runnable, idempotent).

Removes the leftover "neon" decoration that made every module look like a
different product, and moves interactive chrome onto the theme accent:

  R1  watermark text (huge, ~3 % opacity, pointer-events-none)      → removed
  R2  decorative blur blobs (absolute, blur ≥ 40px, no children)    → removed
  R3  coloured glow shadows, drop-shadow glows, selection tints,
      tinted header washes, mix-blend-plus-lighter                  → removed
  R4  hero readouts text-6xl … text-9xl                             → text-5xl
  R5  selected-state chrome in a module "brand" hue
      (`sel ? 'bg-amber-500 text-black' : …`)                       → accent token
  R6  range-slider accent-{hue}-{n}                                 → accent token
  R7  square icon tiles tinted with a brand hue                     → accent token

Status colours (emerald/amber/red used for pass/warn/fail) are left alone:
R5 skips ternaries whose condition looks like a status check, and nothing
else touches non-chrome colour classes.

Usage: python3 scripts/theme/codemod_unify.py [--dry-run] [--report out.txt] [paths…]
"""
import os, re, sys

HUES = 'amber|orange|red|rose|emerald|green|blue|indigo|violet|purple|fuchsia|pink|teal|sky|lime|yellow|cyan'
STATUS_WORDS = re.compile(r'status|safe|pass|fail|ok\b|valid|error|warn|critical|danger|compliant|verdict|risk|exceed|over|severity|level|health|alarm|limit|good|bad|correct|copied|confirm|clear|delete|remov|destructive|running|recording|heating|cooling|best|cut\b|sketch-cut|sketch-add|subtract|resolvedVal|logic|signal', re.I)

args = [a for a in sys.argv[1:]]
DRY = '--dry-run' in args
REPORT = None
if '--report' in args:
    REPORT = args[args.index('--report') + 1]
    del args[args.index('--report'):args.index('--report') + 2]
args = [a for a in args if not a.startswith('--')]
ROOTS = args or ['src']
SKIP_DIRS = ('/tests', '/node_modules', '/android', '/locales', '/styles')

# ── R1 / R2: whole-element removals ────────────────────────────────────────
WATERMARK_RE = re.compile(
    r'[ \t]*<(div|span|p)\s+className=(["\'])([^"\']*)\2\s*>([^<>{}]{0,40})</\1>[ \t]*\n?')
BLOB_RE = re.compile(r'[ \t]*<div\s+className=(["\'])([^"\']*)\1\s*/>[ \t]*\n?')


def is_watermark(cls: str) -> bool:
    faint = re.search(r'(?<![\w-])opacity-(?:5|\[0\.0\d+\]|\[0\.05\]|\[[1-5]%\])(?![\w-])', cls)
    huge = re.search(r'(?<![\w-])text-(?:6xl|7xl|8xl|9xl|\[(?:[89]\d|\d{3,})px\])(?![\w-])', cls)
    return bool(faint and huge and 'pointer-events-none' in cls)


def is_blob(cls: str) -> bool:
    blur = re.search(r'(?<![\w-])blur-(?:\[(\d+)px\]|3xl|2xl)(?![\w-])', cls)
    if not blur:
        return False
    if blur.group(1) and int(blur.group(1)) < 40:
        return False
    return 'pointer-events-none' in cls and 'absolute' in cls


# ── R3: token removals ─────────────────────────────────────────────────────
V = r'(?:[a-z0-9-]+:)*'  # variant prefixes (hover:, group-hover:, md: …)
TOKEN_REMOVALS = [
    re.compile(V + r'shadow-\[0_0_(?!0_|0px_)[^\]\s"\'`]*\]'),
    re.compile(V + r'shadow-(?:' + HUES + r')-\d{2,3}(?:/\d{1,3})?(?![\w-])'),
    re.compile(V + r'drop-shadow-\[0_0_[^\]\s"\'`]*\]'),
    re.compile(r'selection:(?:bg|text)-[a-z]+-\d{2,3}(?:/\d{1,3})?'),
    re.compile(r'bg-gradient-to-[a-z]{1,2} from-(?:' + HUES + r')-\d{2,3}/(?:[1-9]|1\d|20)(?: via-[^\s"\'`]+)? to-transparent'),
    re.compile(r'(?<![\w-])mix-blend-plus-lighter(?![\w-])'),
]

# ── R4 ─────────────────────────────────────────────────────────────────────
HERO_RE = re.compile(r'(?<![\w\[-])((?:[a-z]+:)?)text-(?:6xl|7xl|8xl|9xl)(?![\w-])')

# ── R5 ─────────────────────────────────────────────────────────────────────
SEL_RE = re.compile(r'\?\s*([\'"`])bg-(?:' + HUES + r')-(?:400|500|600) text-(?:black|white|slate-950|slate-900|neutral-950|zinc-950)(?![\w-])')

# ── R6 ─────────────────────────────────────────────────────────────────────
ACCENT_RE = re.compile(r'(?<![\w-])accent-(?:' + HUES + r')-\d{3}(?![\w-])')

# ── R7 ─────────────────────────────────────────────────────────────────────
TILE_CLASS_RE = re.compile(r'className=(["\'])([^"\']*)\1')


def is_tile(cls: str) -> bool:
    w = re.search(r'(?<![\w-])w-(8|9|10|11|12|14)(?![\w-])', cls)
    h = re.search(r'(?<![\w-])h-(8|9|10|11|12|14)(?![\w-])', cls)
    tint = re.search(r'(?<![\w-])bg-(' + HUES + r')-\d{3}/(\d{1,2})(?![\w-])', cls)
    # red/rose tiles are destructive/error affordances, heavy fills are not tints – keep both
    return bool(w and h and 'items-center' in cls and 'justify-center' in cls and tint
                and tint.group(1) not in ('red', 'rose') and int(tint.group(2)) <= 30)


def tile_fix(cls: str) -> str:
    cls = re.sub(r'(?<![\w-])bg-(?:' + HUES + r')-\d{3}/\d{1,2}(?![\w-])', 'bg-[var(--cyan-glow)]', cls)
    cls = re.sub(r'(?<![\w-])border-(?:' + HUES + r')-\d{3}(?:/\d{1,2})?(?![\w-])', 'border-[var(--cyan)]/40', cls)
    cls = re.sub(r'(?<![\w-])text-(?:' + HUES + r')-\d{3}(?:/\d{1,2})?(?![\w-])', 'text-[var(--cyan)]', cls)
    return cls


stats = {k: 0 for k in ('R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7')}
report = []
changed_files = 0

for root_dir in ROOTS:
    for root, _, files in os.walk(root_dir):
        if any(s in root for s in SKIP_DIRS):
            continue
        for fn in files:
            if not fn.endswith('.tsx'):
                continue
            path = os.path.join(root, fn)
            with open(path, encoding='utf-8', newline='') as fh:
                src = fh.read()
            text = src

            def _wm(m):
                if is_watermark(m.group(3)):
                    stats['R1'] += 1
                    report.append(f'R1 {path}: {m.group(0).strip()[:140]}')
                    return ''
                return m.group(0)
            text = WATERMARK_RE.sub(_wm, text)

            def _blob(m):
                if is_blob(m.group(2)):
                    stats['R2'] += 1
                    report.append(f'R2 {path}: {m.group(0).strip()[:140]}')
                    return ''
                return m.group(0)
            text = BLOB_RE.sub(_blob, text)
            # a removed blob may have been the only child of `{cond && ( … )}`
            text = re.sub(r'\n[ \t]*\{[^{}\n]{1,80}&& \(\s*\)\}[ \t]*(?=\n)', '', text)

            out_lines = []
            for line in text.split('\n'):
                orig = line
                for rx in TOKEN_REMOVALS:
                    line, n = rx.subn('', line)
                    stats['R3'] += n
                line, n = HERO_RE.subn(lambda m: m.group(1) + 'text-5xl', line)
                stats['R4'] += n

                def _sel(m):
                    before = line[max(0, m.start() - 140):m.start()]
                    cond = re.split(r'[{(]|\$\{', before)[-1]
                    if not cond.strip():  # multi-line ternary: condition sits on the previous line(s)
                        prev = ' '.join(l.strip() for l in out_lines[-2:])
                        cond = re.split(r'[{(]|\$\{', prev)[-1] or prev[-140:]
                    if STATUS_WORDS.search(cond):
                        return m.group(0)
                    stats['R5'] += 1
                    report.append(f'R5 {path}: {cond.strip()[-60:]} ? {m.group(0)[2:]}')
                    return '? ' + m.group(1) + 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                sel_hues = set(re.findall(r'\?\s*[\'"`]bg-(' + HUES + r')-\d{3} ', line))
                if len(sel_hues) < 2:  # several hues chained on one line = category colour coding, keep
                    line = SEL_RE.sub(_sel, line)
                line, n = ACCENT_RE.subn('accent-[var(--cyan)]', line)
                stats['R6'] += n

                def _tile(m):
                    cls = m.group(2)
                    if not is_tile(cls):
                        return m.group(0)
                    fixed = tile_fix(cls)
                    if fixed != cls:
                        stats['R7'] += 1
                        report.append(f'R7 {path}: {cls[:110]}')
                    return f'className={m.group(1)}{fixed}{m.group(1)}'
                line = TILE_CLASS_RE.sub(_tile, line)
                if line != orig:
                    line = re.sub(r'(?<=\S) {2,}(?=\S)', ' ', line)
                    line = re.sub(r'(className=["\'`])\s+', r'\1', line)
                out_lines.append(line)
            text = '\n'.join(out_lines)

            if text != src:
                changed_files += 1
                if not DRY:
                    with open(path, 'w', encoding='utf-8', newline='') as fh:
                        fh.write(text)

print(('DRY RUN ' if DRY else '') + f'files changed: {changed_files}', stats)
if REPORT:
    with open(REPORT, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(report))
