# SEO Authority Roadmap

## 90-Day Execution Plan

### Phase 1: Foundation (Days 1-30)

| Week | Action | Deliverable |
|------|--------|-------------|
| 1 | Implement alloy-specific calculator | `/calculator/[alloy]/weight` |
| 1 | Deploy SoftwareApplication schema | `schema-software.jsonld` |
| 2 | Create 10 alloy datasheet pages | `/materials/7075-t6`, etc. |
| 2 | Deploy Dataset schema | `schema-dataset.jsonld` |
| 3 | Build comparison tool | `/compare/6061-vs-7075` |
| 3 | Internal linking structure | Hub-and-spoke model |
| 4 | Technical blog: "Why 2.70 is Wrong" | `/blog/aluminum-density-myth` |
| 4 | Submit sitemap, request indexing | GSC actions |

### Phase 2: Programmatic Scale (Days 31-60)

| Week | Action | Deliverable |
|------|--------|-------------|
| 5-6 | Generate 150+ alloy/temper pages | Programmatic templates |
| 5-6 | Implement FAQ schema per page | Question/Answer markup |
| 7-8 | Comparison matrix (all vs all) | 50+ comparison pages |
| 7-8 | Thermal expansion calculator | `/calculator/thermal-expansion` |

### Phase 3: Authority Building (Days 61-90)

| Week | Action | Deliverable |
|------|--------|-------------|
| 9-10 | Guest posts on engineering blogs | 3-5 backlinks |
| 9-10 | YouTube: "Aluminum Selection Guide" | Embedded video |
| 11-12 | API documentation page | `/developers/api` |
| 11-12 | Case studies: real weight savings | `/case-studies/` |

---

## Long-Tail Keyword Clusters

### Cluster 1: Alloy-Specific Density
```
7075-T6 density g/cm3          → /materials/7075-t6
2024-T3 aluminum density       → /materials/2024-t3
5083-H116 density kg/m3        → /materials/5083-h116
aluminum 6061 density          → /materials/6061-t6
```

### Cluster 2: Comparison Intent
```
6061 vs 7075 aluminum          → /compare/6061-vs-7075
5052 vs 5083 marine aluminum   → /compare/5052-vs-5083
2024 vs 7075 aerospace         → /compare/2024-vs-7075
aluminum vs steel weight       → /compare/aluminum-vs-steel
```

### Cluster 3: Calculation Queries
```
aluminum weight calculator     → /calculator/weight
aluminum plate weight formula  → /calculator/plate/weight
aluminum thermal expansion     → /calculator/thermal-expansion
kerf loss calculator          → /calculator/kerf-loss
```

### Cluster 4: Engineering Properties
```
7075-T6 yield strength         → /materials/7075-t6#mechanical
6061 weldability               → /materials/6061-t6#weldability
aluminum machinability rating  → /guides/machinability
aluminum hardness Brinell      → /guides/hardness-testing
```

### Cluster 5: CNC/Fabrication
```
aluminum laser cutting kerf    → /guides/laser-cutting-aluminum
waterjet cutting aluminum      → /guides/waterjet-cutting
aluminum nesting optimization  → /nesting2d
CNC aluminum feed rate         → /guides/cnc-parameters
```

---

## Internal Linking Architecture

```
                    ┌─────────────────┐
                    │   HOMEPAGE      │
                    │  /en/           │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │CALCULATORS│       │MATERIALS │       │ GUIDES  │
    │  /calc/   │       │/materials│       │/guides/ │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
    ┌────┴────┐        ┌────┴────┐        ┌────┴────┐
    │• Weight │◄──────►│• 7075-T6 │◄──────►│• Cutting│
    │• Thermal│        │• 6061-T6 │        │• Welding│
    │• Kerf   │        │• 5083    │        │• Machining
    └─────────┘        └─────────┘        └─────────┘

    LINKING RULES:
    1. Every calculator links to relevant material pages
    2. Every material page links to applicable calculators
    3. Guides link to both calculators and materials
    4. Comparison pages link to both compared materials
```

---

## Programmatic SEO: Why It's Mandatory

### The Math

| Content Type | Manual Pages Feasible | Programmatic Pages Possible |
|--------------|----------------------|----------------------------|
| Alloy datasheets | 15-20 | 200+ (alloy × temper) |
| Comparison pages | 10-15 | 300+ (N × N-1 / 2) |
| Calculator variants | 5-8 | 500+ (alloy × shape × intent) |

### URL Pattern Strategy

**Template:** `/{lang}/calculator/{alloy}/{intent}`

Examples:
- `/en/calculator/7075-t6/weight`
- `/en/calculator/6061-t6/thermal-expansion`
- `/en/calculator/5083-h116/plate-weight`

**Template:** `/{lang}/compare/{alloy1}-vs-{alloy2}`

Examples:
- `/en/compare/6061-vs-7075`
- `/en/compare/5052-vs-5083`
- `/en/compare/2024-vs-2014`

### Implementation Requirements

1. **Dynamic `<title>` tags**
   ```
   {Alloy} Weight Calculator | AluCalculator
   {Alloy1} vs {Alloy2} Comparison | AluCalculator
   ```

2. **Auto-generated meta descriptions**
   ```
   Calculate {alloy} weight with {density} g/cm³ density.
   Accurate for {temper} temper. Includes kerf loss.
   ```

3. **Structured data injection**
   - Each page gets FAQPage schema
   - Calculator pages get SoftwareApplication schema
   - Material pages get Dataset schema

---

## Competitive Moat

| Competitor | Weakness | Our Advantage |
|------------|----------|---------------|
| OnlineMetals | Catalog-locked | Alloy-agnostic |
| Engineering Toolbox | Static PDFs | Interactive calculators |
| MatWeb | Paywall for full data | Free comprehensive access |
| Wolfram Alpha | Generic, not specialized | Domain expertise |

---

## KPI Tracking

| Metric | Tool | Frequency |
|--------|------|-----------|
| Organic impressions | GSC | Weekly |
| Indexed pages | GSC | Weekly |
| Keyword positions | Ahrefs/SEMrush | Bi-weekly |
| Backlinks acquired | Ahrefs | Monthly |
| Core Web Vitals | PageSpeed Insights | Monthly |
| Session duration | GA4 | Weekly |
