"""Codemod: replace hard-coded hex colours in Tailwind class names and inline
style objects with theme tokens, so pages follow the active theme.

Usage: python3 codemod_colors.py <src_dir> [--dry]
Prints a summary; writes files unless --dry.
"""
import os, re, sys, json, math, collections

SRC = sys.argv[1]
DRY = '--dry' in sys.argv

def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) in (3, 4):
        h = ''.join(c * 2 for c in h[:3])
    h = h[:6]
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def oklab(rgb):
    r, g, b = (lin(c) for c in rgb)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (x ** (1 / 3) for x in (l, m, s))
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    C = math.hypot(A, B)
    H = (math.degrees(math.atan2(B, A)) + 360) % 360
    return L, C, H

SURFACE_PROPS = {'bg', 'from', 'to', 'via'}
LINE_PROPS = {'border', 'divide', 'ring', 'outline', 'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y'}
TEXT_PROPS = {'text', 'fill', 'stroke', 'placeholder', 'caret', 'decoration', 'accent'}

def token_for(prop, hx):
    L, C, H = oklab(hex_to_rgb(hx))
    # brand accent (cyan / teal-cyan family)
    if C > 0.08 and 180 <= H <= 235 and L > 0.6:
        return 'var(--cyan)'
    if C > 0.08 and 180 <= H <= 235 and 0.45 < L <= 0.6:
        return 'var(--cyan-dim)'
    # status hues
    if C > 0.09:
        if 135 <= H < 180 and L > 0.55:
            return 'var(--ok)'
        if 60 <= H < 95 and L > 0.6:
            return 'var(--warn)'
        if (H < 40 or H >= 350) and L > 0.5:
            return 'var(--bad)'
        if 240 <= H < 275 and L > 0.6:
            return 'var(--std)'
        return None  # decorative hue: leave as-is
    # neutrals (and very dark tinted surfaces)
    if C <= 0.09:
        if prop in SURFACE_PROPS:
            if L < 0.15: return 'var(--bg-0)'
            if L < 0.19: return 'var(--bg-1)'
            if L < 0.23: return 'var(--bg-2)'
            if L < 0.29: return 'var(--bg-3)'
            if L < 0.40: return 'var(--line-strong)'
            if L > 0.96: return None  # pure white surfaces (print/report) — leave
            if L > 0.9: return 'var(--ink)'
            return None
        if prop in LINE_PROPS:
            if L < 0.33: return 'var(--line)'
            if L < 0.46: return 'var(--line-strong)'
            if L < 0.7: return 'var(--alu-dim)'
            return None
        if prop in TEXT_PROPS:
            if L > 0.93: return 'var(--ink)'
            if L > 0.80: return 'var(--alu)'
            if L > 0.66: return 'var(--alu-dim)'
            if L > 0.45: return 'var(--muted)'
            if L < 0.2: return 'var(--bg-0)'
            return None
    return None

CLASS_RE = re.compile(
    r'(?<![\w-])((?:[a-z0-9]+:)*)(bg|from|to|via|text|fill|stroke|placeholder|caret|decoration|accent|border(?:-[trblxy])?|divide|ring|outline)-\[#([0-9a-fA-F]{3,8})\]'
)
STYLE_RE = re.compile(
    r"\b(background|backgroundColor|borderColor|color|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor)\s*:\s*(['\"])#([0-9a-fA-F]{3,8})\2"
)
STYLE_PROP = {
    'background': 'bg', 'backgroundColor': 'bg', 'borderColor': 'border', 'color': 'text',
    'borderTopColor': 'border', 'borderBottomColor': 'border', 'borderLeftColor': 'border', 'borderRightColor': 'border',
}

# Never touch generated data, vendor code, 3D/WASM kernels or printable report templates.
SKIP_DIRS = ('/node_modules/', '/locales/', '/dictionaries/', '/tests/', '/kernel/', '/cad/kernel')
# src/mechanical/ is pure math (no UI). Anchored on purpose: the old substring '/mechanical/'
# also skipped src/components/modules/mechanical/, i.e. most calculator UIs.
PURE_MATH_PREFIX = SRC.rstrip('/').replace('\\', '/') + '/mechanical/'
SKIP_FILES = ('pdfGenerator', 'pdfReportEngine', 'CalculationReport', 'ReportSettings', 'Certificate', 'export-utils')

stats = collections.Counter()
changed_files = []
left = collections.Counter()

for root, _, files in os.walk(SRC):
    for fn in files:
        if not fn.endswith(('.tsx', '.ts', '.jsx')):
            continue
        path = os.path.join(root, fn)
        norm = path.replace('\\', '/')
        if any(d in norm for d in SKIP_DIRS) or norm.startswith(PURE_MATH_PREFIX) or any(k in fn for k in SKIP_FILES):
            continue
        try:
            text = open(path, encoding='utf-8', newline='').read()
        except Exception:
            continue
        orig = text

        def repl_class(m):
            variants, prop, hx = m.group(1), m.group(2), m.group(3)
            tok = token_for(prop, hx)
            if not tok:
                left[f'{prop}-#{hx.lower()}'] += 1
                return m.group(0)
            stats[f'class {prop}'] += 1
            return f'{variants}{prop}-[{tok}]'

        text = CLASS_RE.sub(repl_class, text)

        def repl_style(m):
            key, q, hx = m.group(1), m.group(2), m.group(3)
            tok = token_for(STYLE_PROP[key], hx)
            if not tok:
                return m.group(0)
            stats[f'style {key}'] += 1
            return f'{key}: {q}{tok}{q}'

        # Inline styles only in UI files, not in drawing/visualizer/3D scene code.
        lower = path.lower()
        if not any(k in lower for k in ('visualiz', 'blueprint', 'drawing', 'svg', '3d', 'mesh', 'scene', 'canvas', 'schematic', 'section')):
            text = re.sub(r'style=\{\{(.*?)\}\}', lambda b: 'style={{' + STYLE_RE.sub(repl_style, b.group(1)) + '}}', text, flags=re.S)

        if text != orig:
            changed_files.append(os.path.relpath(path, SRC))
            if not DRY:
                open(path, 'w', encoding='utf-8', newline='').write(text)

print(json.dumps({'files_changed': len(changed_files), 'replacements': dict(stats.most_common()), 'top_left_untouched': left.most_common(25)}, indent=1))
