#!/usr/bin/env python3
"""Material property consistency audit.

Finds object literals that mention a known material designation and extracts
numeric properties (density, E, yield, UTS, Poisson, thermal expansion), then
normalises units and reports materials whose values disagree across files.

Usage: python3 scripts/audit/material_consistency.py src [--json out.json]
"""
import os, re, sys, json, collections

SRC = sys.argv[1] if len(sys.argv) > 1 else 'src'

MATERIALS = {
    '6061-T6': r'6061[\s-]?T6(?!\d)', '6063-T5': r'6063[\s-]?T5(?!\d)', '6063-T6': r'6063[\s-]?T6(?!\d)',
    '6082-T6': r'6082[\s-]?T6(?!\d)', '7075-T6': r'7075[\s-]?T6(?!\d)', '7075-T651': r'7075[\s-]?T651',
    '2024-T3': r'2024[\s-]?T3(?!\d)', '2024-T351': r'2024[\s-]?T351', '2024-T4': r'2024[\s-]?T4',
    '5083-H111': r'5083[\s-]?H111', '5083-H116': r'5083[\s-]?H116', '5052-H32': r'5052[\s-]?H32',
    'S235': r'S235(?:JR|J0|J2)?(?![0-9])', 'S275': r'S275(?:JR|J0|J2)?', 'S355': r'S355(?:JR|J0|J2|K2)?',
    'C45': r'\bC45(?:E|R)?\b', '42CrMo4': r'42CrMo4', '304': r'(?:AISI\s?304|\b1\.4301\b|SS\s?304|X5CrNi18-?10)', '316': r'(?:AISI\s?316(?!L)|\b1\.4401\b|SS\s?316(?!L))',
    'Ti-6Al-4V': r'Ti-?6Al-?4V', 'CuZn39Pb3': r'CuZn39Pb3',
}

PROPS = {
    'density': r'(?:density|rho|dens|yogunluk|yoğunluk)',
    'E': r'(?:\bE\b|elasticModulus|youngsModulus|youngModulus|modulus|E_GPa|E_MPa|emod|eModulus)',
    'yield': r'(?:yield(?:Strength)?(?:_?MPa)?|Rp0?2|Rp02|\bRe\b|\bfy\b|\bsy\b|sigmaY|ys)',
    'uts': r'(?:uts|ultimate(?:Strength)?|tensile(?:Strength)?(?:_?MPa)?|\bRm\b|\bfu\b|\bsu\b)',
    'poisson': r'(?:poisson(?:Ratio)?|\bnu\b|\bv\b)',
    'alpha': r'(?:alpha|thermalExpansion|cte|expansion)',
}
NUM = r'(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)'
PROP_RE = {k: re.compile(v + r'["\']?\s*[:=]\s*' + NUM, re.I) for k, v in PROPS.items()}


def normalise(prop, v):
    """Return value in canonical units or None if implausible."""
    if prop == 'density':  # → g/cm³
        if 1.0 < v < 25: return round(v, 3)
        if 1000 < v < 25000: return round(v / 1000, 3)
        return None
    if prop == 'E':  # → GPa
        if 30 < v < 450: return round(v, 1)
        if 30e3 < v < 450e3: return round(v / 1000, 1)
        if 30e9 < v < 450e9: return round(v / 1e9, 1)
        return None
    if prop in ('yield', 'uts'):  # → MPa
        if 20 < v < 2500: return round(v, 0)
        if 20e6 < v < 2500e6: return round(v / 1e6, 0)
        return None
    if prop == 'poisson':
        return round(v, 3) if 0.1 < v < 0.5 else None
    if prop == 'alpha':  # → µm/m·K
        if 1 < v < 40: return round(v, 1)
        if 1e-6 < v < 40e-6: return round(v * 1e6, 1)
        return None
    return None


rows = collections.defaultdict(lambda: collections.defaultdict(list))
for root, _, files in os.walk(SRC):
    if '/tests' in root or 'node_modules' in root or '/locales' in root:
        continue
    for fn in files:
        if not fn.endswith(('.ts', '.tsx', '.json')):
            continue
        path = os.path.join(root, fn)
        try:
            text = open(path, encoding='utf-8').read()
        except Exception:
            continue
        lines = text.split('\n')
        for mat, pat in MATERIALS.items():
            for m in re.finditer(pat, text):
                # object literal window: from the match back to the previous '{' and forward to the next '}'
                # `'6061-T6': { ... }` — the object follows the key; otherwise the name sits inside the object
                after = re.match(r'["\']?\s*:\s*\{', text[m.end():m.end() + 12])
                if after:
                    start = m.end() + after.end() - 1
                else:
                    start = text.rfind('{', 0, m.start())
                end = text.find('}', start + 1 if start >= 0 else m.end())
                if start < 0 or end < 0 or end - start > 900:
                    continue
                window = text[start:end]
                # skip windows that mention several different materials (tables in one line)
                if sum(1 for p in MATERIALS.values() if re.search(p, window)) > 1:
                    continue
                for prop, rx in PROP_RE.items():
                    for pm in rx.finditer(window):
                        v = normalise(prop, float(pm.group(1)))
                        if v is not None:
                            line_no = text.count('\n', 0, start) + 1
                            rows[mat][prop].append((v, os.path.relpath(path, SRC), line_no))

report = []
for mat in sorted(rows):
    for prop in sorted(rows[mat]):
        vals = rows[mat][prop]
        distinct = sorted({v for v, _, _ in vals})
        if len(distinct) > 1:
            lo, hi = distinct[0], distinct[-1]
            spread = (hi - lo) / hi * 100 if hi else 0
            report.append({'material': mat, 'property': prop, 'values': distinct, 'spread_pct': round(spread, 1),
                           'sites': [{'value': v, 'file': f, 'line': l} for v, f, l in vals]})

report.sort(key=lambda r: -r['spread_pct'])
if '--json' in sys.argv:
    json.dump(report, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1)
for r in report:
    if r['spread_pct'] >= 3:
        counts = collections.Counter(v for v, _, _ in [(s['value'], 0, 0) for s in r['sites']])
        print(f"{r['material']:10s} {r['property']:8s} spread {r['spread_pct']:5.1f}%  values: {dict(sorted(counts.items()))}")
