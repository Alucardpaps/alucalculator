"""Codemod: calm down per-module visual outliers so every page shares one visual language.

- Oversized arbitrary radii (>= 14px) -> rounded-xl (theme caps it at 8px)
- `italic` dropped from class strings that also use `font-black` (shouty italic headings/readouts)
- `backdrop-blur-*` removed from class strings (glassmorphism is not part of the design system;
  panels already have a solid token background)

Usage: python3 codemod_calm.py <src_dir> [--dry]
"""
import os, re, sys, json, collections

SRC = sys.argv[1]
DRY = '--dry' in sys.argv
stats = collections.Counter()
changed = 0

RADIUS_RE = re.compile(r'\brounded(-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee))?-\[([0-9.]+)(px|rem)\]')
CLASS_STR_RE = re.compile(r'(className\s*=\s*(?:"[^"]*"|\'[^\']*\'|\{`[^`]*`\}|`[^`]*`))')
BLUR_RE = re.compile(r'\s*\b(?:[a-z]+:)*backdrop-blur(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|\[[^\]]+\]))?\b')

def fix_radius(m):
    side, val, unit = m.group(1) or '', float(m.group(2)), m.group(3)
    px = val * 16 if unit == 'rem' else val
    if px >= 14:
        stats['radius'] += 1
        return f'rounded{side}-xl'
    return m.group(0)

def fix_class(m):
    s = m.group(1)
    o = s
    s = RADIUS_RE.sub(fix_radius, s)
    if 'font-black' in s and re.search(r'(?<![\w-])italic(?![\w-])', s):
        s = re.sub(r'\s(?<![\w-])italic(?![\w-])', '', s)
        stats['italic'] += 1
    if 'backdrop-blur' in s:
        s2 = BLUR_RE.sub('', s)
        if s2 != s:
            stats['blur'] += 1
            s = s2
    return s

for root, _, files in os.walk(SRC):
    for fn in files:
        if not fn.endswith('.tsx'):
            continue
        p = os.path.join(root, fn)
        t = open(p, encoding='utf-8', newline='').read()
        n = CLASS_STR_RE.sub(fix_class, t)
        # radii also appear in cn()/clsx() string arguments outside className=
        n = RADIUS_RE.sub(fix_radius, n)
        if n != t:
            changed += 1
            if not DRY:
                open(p, 'w', encoding='utf-8', newline='').write(n)

print(json.dumps({'files_changed': changed, **stats}))
