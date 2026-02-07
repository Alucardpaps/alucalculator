# Engineering Accuracy Report

## The 2.70 g/cm³ Myth

The assumption that "aluminum density = 2.70 g/cm³" is a dangerous oversimplification taught in freshman physics. In production environments, this single value causes systematic errors in:

- Weight quotations
- Structural calculations
- Shipping cost estimates
- Inventory accounting

---

## Alloy Family Density Analysis

### Measured Densities by Series

| Series | Primary Alloying | Density Range (g/cm³) | Representative Alloys |
|--------|------------------|----------------------|----------------------|
| 1xxx | Pure Al (≥99%) | 2.70–2.71 | 1050, 1100 |
| 2xxx | Copper | 2.75–2.84 | 2014, 2024, 2219 |
| 3xxx | Manganese | 2.72–2.73 | 3003, 3105 |
| 5xxx | Magnesium | 2.64–2.69 | 5052, 5083, 5754 |
| 6xxx | Mg + Si | 2.68–2.71 | 6061, 6063, 6082 |
| 7xxx | Zinc | 2.79–2.85 | 7005, 7075, 7178 |

### Critical Observation

> **5083-H116 (2.66 g/cm³) and 7075-T6 (2.81 g/cm³) differ by 5.6%**  
> Using 2.70 creates a 2.9% overestimate for 5083 and a 4.1% underestimate for 7075.

---

## Standards Compliance

### ASTM B209 (Aluminum Sheet/Plate)

| Alloy-Temper | Specified Density | Yield Strength (MPa) | Elongation (%) |
|--------------|-------------------|---------------------|----------------|
| 2024-T3 | 2.78 | 290 | 15 |
| 5052-H32 | 2.68 | 195 | 12 |
| 6061-T6 | 2.70 | 275 | 12 |
| 7075-T6 | 2.81 | 505 | 11 |

### EN 573-3 (European Standard)

| Alloy | EN Designation | Density (kg/m³) |
|-------|---------------|-----------------|
| 2024 | EN AW-2024 | 2780 |
| 5083 | EN AW-5083 | 2660 |
| 6082 | EN AW-6082 | 2700 |
| 7075 | EN AW-7075 | 2810 |

---

## Decision Parameters Beyond Density

### Yield Strength Comparison

```
                    Yield Strength (MPa)
   ┌────────────────────────────────────────────┐
   │ 7075-T6  ████████████████████████████  505 │
   │ 2024-T4  █████████████████             310 │
   │ 6061-T6  ███████████████               275 │
   │ 5052-H32 ███████████                   195 │
   │ 3003-H14 █████                         145 │
   │ 1100-O   ██                             35 │
   └────────────────────────────────────────────┘
```

### Machinability & Weldability Matrix

| Alloy | Machinability | Weldability | Corrosion Resistance |
|-------|---------------|-------------|---------------------|
| 1100 | Excellent | Excellent | Excellent |
| 2024 | Good | Poor | Fair |
| 5052 | Good | Excellent | Excellent |
| 6061 | Good | Good | Good |
| 7075 | Fair | Poor | Fair |

> **Selection Rule:**  
> High-strength (7075) for aerospace, but not weldable.  
> Marine applications (5083) prioritize corrosion and weldability.  
> General fabrication (6061) balances all factors.

---

## Production Loss Factors

### Kerf Loss Reality

| Cutting Method | Kerf Width (mm) | Loss per 1m Cut (cm²) |
|----------------|-----------------|----------------------|
| Laser (CO2, 6mm plate) | 0.3–0.5 | 3–5 |
| Plasma (12mm plate) | 2.0–3.0 | 20–30 |
| Waterjet (any) | 0.8–1.2 | 8–12 |
| Saw (band) | 1.5–3.0 | 15–30 |

### Scrap Factor by Nesting Efficiency

| Part Complexity | Typical Nesting Efficiency | Scrap Factor |
|-----------------|---------------------------|--------------|
| Rectangular | 85–92% | 1.08–1.18 |
| Complex cutouts | 70–80% | 1.25–1.43 |
| Circular/rings | 60–70% | 1.43–1.67 |

### Total Gross Weight Formula

```
GrossWeight = NetWeight × KerfFactor × ScrapFactor × ThermalFactor
```

Where:
- `KerfFactor` = 1 + (kerfWidth × cutLength) / sheetArea
- `ScrapFactor` = 1 / nestingEfficiency
- `ThermalFactor` = 1 + (α × ΔT × 3) for volumetric expansion

---

## Thermal Expansion Coefficients

| Alloy | α (×10⁻⁶ /°C) | ΔL for 1m @ ΔT=50°C |
|-------|---------------|---------------------|
| 1100 | 23.6 | 1.18 mm |
| 2024 | 22.9 | 1.15 mm |
| 5052 | 23.8 | 1.19 mm |
| 6061 | 23.6 | 1.18 mm |
| 7075 | 23.4 | 1.17 mm |

> **Engineering Note:**  
> Precision assemblies (CNC fixtures, jigs) must account for thermal expansion.  
> A 2-meter 6061 rail expands **2.36 mm** from 20°C to 70°C.

---

## Conclusion

Any calculation engine claiming "aluminum weight" without alloy selection is engineering malpractice. This report establishes the technical foundation for alloy-aware calculations that respect:

1. **Material science** (density is composition-dependent)
2. **Manufacturing reality** (cutting creates loss)
3. **Thermodynamics** (dimensions change with temperature)
4. **Standards compliance** (ASTM/EN specifications are authoritative)
