# Programmatic SEO Strategy

## Avoiding Doorway Page Penalties

Google's algorithm detects thin, duplicative content. Each programmatic page must provide **unique engineering value**.

---

## Content Differentiation Requirements

### 1. Unique Data Per Page

Each alloy page must display:
- Specific density value (not generic 2.70)
- Yield strength, hardness, thermal expansion
- Price index relative to 6061 baseline
- Standard reference (ASTM/EN)

### 2. Contextual Warnings & Tips

| Alloy | Warning/Tip |
|-------|-------------|
| 7075 | ⚠️ "Not recommended for welding. Use mechanical fasteners." |
| 2024 | ⚠️ "Heat treatable. Weld with 2319 filler only." |
| 5083 | ✅ "Excellent for marine environments. H116 temper for hulls." |
| 6061 | ✅ "General purpose. Good balance of properties." |
| 6063 | ✅ "Best for extrusions and architectural applications." |

### 3. Internal Linking Structure

Each page links to:
1. **Same alloy, different shapes** → "Looking for 6061 Round Bar instead of Plate?"
2. **Similar alloys** → "Compare 6061 vs 6082 →"
3. **Relevant calculators** → "Calculate 6061 thermal expansion →"

---

## URL Structure

### Single Alloy Pages
```
/en/materials/{alloy}/
/en/materials/7075-t6/
/en/materials/5083-h116/
```

### Calculator + Alloy Pages
```
/en/calculator/{alloy}/weight/
/en/calculator/{alloy}/thermal-expansion/
/en/calculator/{alloy}/cost/
```

### Comparison Pages
```
/en/compare/{alloy1}-vs-{alloy2}/
/en/compare/6061-vs-7075/
/en/compare/5052-vs-5083/
```

---

## Dynamic Meta Tags

### Title Pattern
```
{Alloy} {Shape} Weight Calculator | Density {X} g/cm³ | AluCalculator
```

### Description Pattern
```
Calculate {alloy} {shape} weight with accurate {density} g/cm³ density.
Includes {property1}, {property2}. {Warning if applicable}.
```

### Example: 7075-T6
```html
<title>7075-T6 Plate Weight Calculator | Density 2.81 g/cm³ | AluCalculator</title>
<meta name="description" content="Calculate 7075-T6 aluminum plate weight with accurate 2.81 g/cm³ density. Aerospace grade, 505 MPa yield strength. Not recommended for welding." />
```

---

## Structured Data Per Page Type

### Material Pages → Dataset Schema
```json
{
  "@type": "Dataset",
  "name": "7075-T6 Aluminum Properties",
  "variableMeasured": ["density", "yieldStrength", "hardness"]
}
```

### Calculator Pages → SoftwareApplication Schema
```json
{
  "@type": "SoftwareApplication",
  "name": "7075-T6 Weight Calculator",
  "applicationCategory": "EngineeringApplication"
}
```

### Comparison Pages → FAQ Schema
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Is 7075 stronger than 6061?" }
  ]
}
```

---

## Content Quality Checklist

Before publishing any programmatic page, verify:

- [ ] Density value is alloy-specific (not 2.70 default)
- [ ] At least 3 unique properties displayed
- [ ] Contextual warning/tip present if applicable
- [ ] Internal links to 2+ related pages
- [ ] Unique title and meta description
- [ ] Appropriate structured data schema
- [ ] Interactive calculator embedded
- [ ] Mobile-responsive layout verified
