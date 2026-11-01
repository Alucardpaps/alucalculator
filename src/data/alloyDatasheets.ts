export interface AlloyChemicalComposition {
  Al: string;
  Cu: string;
  Mg: string;
  Mn: string;
  Si: string;
  Zn: string;
  Cr: string;
  Fe: string;
}

export interface AlloyDatasheet {
  slug: string;
  name: string;
  family: string;
  temper: string;
  standard: string;
  density: number;
  yieldMPa: number;
  tensileMPa: number;
  shearMPa?: number;
  fatigueLimitMPa?: number;
  bearingYieldMPa?: number;
  elongationPct: number;
  modulusGPa: number;
  hardness: string;
  thermalExp: number;
  thermalCond: number;
  electricalConductivityIACS?: number;
  meltingRangeC?: string;
  minBendRadiusRatio?: number;
  cncVcMMin?: number;
  weldability: string;
  machinability: string;
  corrosion: string;
  blurb: string;
  applications: string[];
  pitfalls: string[];
  composition?: AlloyChemicalComposition;
}

export const ALLOY_DATASHEETS: AlloyDatasheet[] = [
  {
    slug: '1100',
    name: '1100 Aluminum',
    family: '1xxx',
    temper: 'O / H14',
    standard: 'ASTM B209 / EN AW-1100',
    density: 2.71,
    yieldMPa: 35,
    tensileMPa: 90,
    shearMPa: 62,
    fatigueLimitMPa: 34,
    bearingYieldMPa: 75,
    elongationPct: 35,
    modulusGPa: 69,
    hardness: '23 HB',
    thermalExp: 23.6,
    thermalCond: 222,
    electricalConductivityIACS: 59,
    meltingRangeC: '643 – 657 °C',
    minBendRadiusRatio: 0.5,
    cncVcMMin: 220,
    weldability: 'Excellent',
    machinability: 'Poor',
    corrosion: 'Excellent',
    blurb: 'Commercially pure aluminum (99.0% min Al). Exceptional corrosion resistance, thermal/electrical conductivity, and deep-drawing formability.',
    applications: ['Chemical tanks', 'Heat exchangers & fins', 'Busbars & nameplates', 'Food & brewing equipment'],
    pitfalls: ['Too soft for structural frames', 'Gummy machining — use polished carbide tools with high rake angle (45° helix)'],
    composition: { Al: '≥ 99.0%', Cu: '0.05–0.20%', Mg: '≤ 0.05%', Mn: '≤ 0.05%', Si: '≤ 0.95% (Si+Fe)', Zn: '≤ 0.10%', Cr: '—', Fe: '≤ 0.95% (Si+Fe)' },
  },
  {
    slug: '2014-t6',
    name: '2014-T6 Aluminum',
    family: '2xxx',
    temper: 'T6',
    standard: 'ASTM B209 / EN AW-2014A',
    density: 2.80,
    yieldMPa: 414,
    tensileMPa: 483,
    shearMPa: 290,
    fatigueLimitMPa: 124,
    bearingYieldMPa: 660,
    elongationPct: 13,
    modulusGPa: 72.4,
    hardness: '135 HB',
    thermalExp: 23.0,
    thermalCond: 154,
    electricalConductivityIACS: 40,
    meltingRangeC: '507 – 638 °C',
    minBendRadiusRatio: 5.0,
    cncVcMMin: 380,
    weldability: 'Poor',
    machinability: 'Excellent',
    corrosion: 'Fair',
    blurb: 'High-strength aerospace and heavy-duty forging Al-Cu-Si alloy. Higher yield than 2024-T3 with density 2.80 g/cm³.',
    applications: ['Aerospace primary forgings', 'Military vehicle frames', 'Rocket booster rings', 'Heavy hydraulic manifolds'],
    pitfalls: ['Prone to hot cracking if fusion welded', 'Requires anodizing or Alclad protection in marine/outdoor exposure'],
    composition: { Al: '90.4–95.0%', Cu: '3.9–5.0%', Mg: '0.20–0.80%', Mn: '0.40–1.2%', Si: '0.50–1.2%', Zn: '≤ 0.25%', Cr: '≤ 0.10%', Fe: '≤ 0.70%' },
  },
  {
    slug: '2024-t3',
    name: '2024-T3 Aluminum',
    family: '2xxx',
    temper: 'T3',
    standard: 'ASTM B209 / AMS-QQ-A-250/4 / EN AW-2024',
    density: 2.78,
    yieldMPa: 345,
    tensileMPa: 483,
    shearMPa: 283,
    fatigueLimitMPa: 138,
    bearingYieldMPa: 607,
    elongationPct: 18,
    modulusGPa: 73.1,
    hardness: '120 HB',
    thermalExp: 23.2,
    thermalCond: 121,
    electricalConductivityIACS: 30,
    meltingRangeC: '502 – 638 °C',
    minBendRadiusRatio: 4.0,
    cncVcMMin: 400,
    weldability: 'Poor',
    machinability: 'Good',
    corrosion: 'Fair',
    blurb: 'Benchmark high-strength Al-Cu-Mg alloy for aircraft skins and riveted tension structures. True density is 2.78 g/cm³ — assuming 2.70 underestimates weight by 2.96%.',
    applications: ['Aircraft fuselage skins & wing ribs', 'Riveted shear webs & spars', 'Orthopedic braces & aerospace fittings', 'High-fatigue tension members'],
    pitfalls: ['Do NOT fusion weld structural joints (join with 2117-T4 AD rivets or Hi-Lok fasteners)', 'Needs Alclad 2024 or chromate/anodize coating in corrosive environments'],
    composition: { Al: '90.7–94.7%', Cu: '3.8–4.9%', Mg: '1.2–1.8%', Mn: '0.30–0.90%', Si: '≤ 0.50%', Zn: '≤ 0.25%', Cr: '≤ 0.10%', Fe: '≤ 0.50%' },
  },
  {
    slug: '3003',
    name: '3003 Aluminum',
    family: '3xxx',
    temper: 'H14',
    standard: 'ASTM B209 / EN AW-3003',
    density: 2.73,
    yieldMPa: 145,
    tensileMPa: 180,
    shearMPa: 110,
    fatigueLimitMPa: 62,
    bearingYieldMPa: 210,
    elongationPct: 8,
    modulusGPa: 69,
    hardness: '40 HB',
    thermalExp: 23.2,
    thermalCond: 193,
    electricalConductivityIACS: 46,
    meltingRangeC: '643 – 654 °C',
    minBendRadiusRatio: 1.0,
    cncVcMMin: 260,
    weldability: 'Excellent',
    machinability: 'Fair',
    corrosion: 'Excellent',
    blurb: 'General-purpose Al-Mn sheet alloy. 20% stronger than 1100 with excellent formability and atmospheric corrosion resistance.',
    applications: ['HVAC ductwork & roofing', 'Brazed heat exchangers', 'Storage tanks & pressure vessels', 'Architectural sheet & signage'],
    pitfalls: ['Not a load-bearing structural frame alloy', 'H14 work-hardened temper locally anneals in the weld HAZ'],
    composition: { Al: '96.7–99.0%', Cu: '0.05–0.20%', Mg: '—', Mn: '1.0–1.5%', Si: '≤ 0.60%', Zn: '≤ 0.10%', Cr: '—', Fe: '≤ 0.70%' },
  },
  {
    slug: '5005-h34',
    name: '5005-H34 Aluminum',
    family: '5xxx',
    temper: 'H34',
    standard: 'ASTM B209 / EN AW-5005A',
    density: 2.70,
    yieldMPa: 140,
    tensileMPa: 160,
    shearMPa: 96,
    fatigueLimitMPa: 60,
    bearingYieldMPa: 205,
    elongationPct: 8,
    modulusGPa: 69,
    hardness: '41 HB',
    thermalExp: 23.8,
    thermalCond: 200,
    electricalConductivityIACS: 52,
    meltingRangeC: '632 – 654 °C',
    minBendRadiusRatio: 1.5,
    cncVcMMin: 280,
    weldability: 'Excellent',
    machinability: 'Fair',
    corrosion: 'Excellent',
    blurb: 'Premier architectural anodizing sheet alloy. Matches 6063 extrusion color tone after clear or architectural anodizing.',
    applications: ['Anodized building facades & curtain walls', 'Appliance trim & control panels', 'HVAC cladding', 'Electrical enclosures'],
    pitfalls: ['Specify Anodizing Quality (AQ) coil lot to avoidtiger-striping', 'Non-heat-treatable — strength comes from H34 strain hardening'],
    composition: { Al: '97.7–99.5%', Cu: '≤ 0.20%', Mg: '0.50–1.1%', Mn: '≤ 0.20%', Si: '≤ 0.30%', Zn: '≤ 0.25%', Cr: '≤ 0.10%', Fe: '≤ 0.70%' },
  },
  {
    slug: '5052-h32',
    name: '5052-H32 Aluminum',
    family: '5xxx',
    temper: 'H32',
    standard: 'ASTM B209 / EN AW-5052',
    density: 2.68,
    yieldMPa: 193,
    tensileMPa: 228,
    shearMPa: 138,
    fatigueLimitMPa: 117,
    bearingYieldMPa: 310,
    elongationPct: 12,
    modulusGPa: 70.3,
    hardness: '60 HB',
    thermalExp: 23.8,
    thermalCond: 138,
    electricalConductivityIACS: 35,
    meltingRangeC: '607 – 649 °C',
    minBendRadiusRatio: 1.5,
    cncVcMMin: 310,
    weldability: 'Excellent',
    machinability: 'Fair',
    corrosion: 'Excellent',
    blurb: 'Workhorse precision sheet metal & marine alloy. Tight bend radii without cracking, superior fatigue strength among medium-strength sheets.',
    applications: ['Precision sheet metal enclosures', 'Marine fuel & water tanks', 'Electronic chassis & server racks', 'Hydraulic tubing'],
    pitfalls: ['Not heat-treatable — strength comes from strain hardening', 'Weld HAZ locally softens H32 temper to ~O-temper yield (90 MPa)'],
    composition: { Al: '95.7–97.7%', Cu: '≤ 0.10%', Mg: '2.2–2.8%', Mn: '≤ 0.10%', Si: '≤ 0.25%', Zn: '≤ 0.10%', Cr: '0.15–0.35%', Fe: '≤ 0.40%' },
  },
  {
    slug: '5083-h116',
    name: '5083-H116 Aluminum',
    family: '5xxx',
    temper: 'H116',
    standard: 'ASTM B928 / EN AW-5083',
    density: 2.66,
    yieldMPa: 228,
    tensileMPa: 317,
    shearMPa: 190,
    fatigueLimitMPa: 160,
    bearingYieldMPa: 390,
    elongationPct: 16,
    modulusGPa: 71,
    hardness: '75 HB',
    thermalExp: 24.2,
    thermalCond: 117,
    electricalConductivityIACS: 29,
    meltingRangeC: '591 – 638 °C',
    minBendRadiusRatio: 2.5,
    cncVcMMin: 320,
    weldability: 'Excellent',
    machinability: 'Fair',
    corrosion: 'Excellent',
    blurb: 'Highest-strength non-heat-treatable marine plate alloy. Density 2.66 g/cm³ — using 2.70 overestimates hull mass by ~1.5%. Retains high strength after welding with ER5183.',
    applications: ['Ship hulls & catamarans', 'Cryogenic LNG storage tanks (-165 °C)', 'Offshore superstructures', 'Armored vehicle hulls'],
    pitfalls: ['H116 or H321 temper is mandatory for marine exfoliation resistance (ASTM B928)', 'Do not use in continuous service above 65 °C (intergranular sensitization risk)'],
    composition: { Al: '92.4–95.6%', Cu: '≤ 0.10%', Mg: '4.0–4.9%', Mn: '0.40–1.0%', Si: '≤ 0.40%', Zn: '≤ 0.25%', Cr: '0.05–0.25%', Fe: '≤ 0.40%' },
  },
  {
    slug: '5754',
    name: '5754 Aluminum',
    family: '5xxx',
    temper: 'H22 / H111',
    standard: 'EN 485 / EN AW-5754',
    density: 2.67,
    yieldMPa: 130,
    tensileMPa: 220,
    shearMPa: 140,
    fatigueLimitMPa: 100,
    bearingYieldMPa: 250,
    elongationPct: 17,
    modulusGPa: 70,
    hardness: '55 HB',
    thermalExp: 23.7,
    thermalCond: 132,
    electricalConductivityIACS: 34,
    meltingRangeC: '600 – 645 °C',
    minBendRadiusRatio: 1.5,
    cncVcMMin: 300,
    weldability: 'Excellent',
    machinability: 'Fair',
    corrosion: 'Excellent',
    blurb: 'European automotive body, tread plate, and marine sheet. ~3% Mg content makes it immune to elevated-temperature sensitization unlike 5083.',
    applications: ['Automotive inner body panels', '5-bar checker tread plate', 'Pressure vessels & silos', 'Welded chemical tanks'],
    pitfalls: ['Check temper carefully — H111 yield (80 MPa) vs H22 yield (130 MPa) differs substantially', 'Not a substitute for 6082-T6 structural extrusions'],
    composition: { Al: '94.2–97.4%', Cu: '≤ 0.10%', Mg: '2.6–3.6%', Mn: '≤ 0.50%', Si: '≤ 0.40%', Zn: '≤ 0.20%', Cr: '≤ 0.30%', Fe: '≤ 0.40%' },
  },
  {
    slug: '6005a-t6',
    name: '6005A-T6 Aluminum',
    family: '6xxx',
    temper: 'T6',
    standard: 'EN 755-2 / EN AW-6005A',
    density: 2.70,
    yieldMPa: 225,
    tensileMPa: 270,
    shearMPa: 165,
    fatigueLimitMPa: 95,
    bearingYieldMPa: 360,
    elongationPct: 8,
    modulusGPa: 69.5,
    hardness: '85 HB',
    thermalExp: 23.4,
    thermalCond: 188,
    electricalConductivityIACS: 49,
    meltingRangeC: '605 – 654 °C',
    minBendRadiusRatio: 2.5,
    cncVcMMin: 420,
    weldability: 'Good',
    machinability: 'Good',
    corrosion: 'Good',
    blurb: 'High-extrudability structural alloy bridging 6063 and 6082. Ideal for thin-walled hollow railcar profiles, solar mounting rails, and ladders.',
    applications: ['High-speed railcar extrusions', 'Solar PV mounting rails', 'Industrial ladders & scaffolding', 'Bus & trailer body profiles'],
    pitfalls: ['Eurocode 9 HAZ reduction factor ρ_haz = 0.53 in MIG welding', 'Slightly lower toughness than 6082-T6 in thick sections (>10 mm)'],
    composition: { Al: '96.7–98.5%', Cu: '≤ 0.30%', Mg: '0.40–0.70%', Mn: '≤ 0.50%', Si: '0.50–0.90%', Zn: '≤ 0.20%', Cr: '≤ 0.30%', Fe: '≤ 0.35%' },
  },
  {
    slug: '6060-t6',
    name: '6060-T6 Aluminum',
    family: '6xxx',
    temper: 'T6',
    standard: 'EN 755 / EN AW-6060',
    density: 2.70,
    yieldMPa: 150,
    tensileMPa: 190,
    shearMPa: 115,
    fatigueLimitMPa: 65,
    bearingYieldMPa: 240,
    elongationPct: 8,
    modulusGPa: 69,
    hardness: '70 HB',
    thermalExp: 23.4,
    thermalCond: 200,
    electricalConductivityIACS: 53,
    meltingRangeC: '615 – 655 °C',
    minBendRadiusRatio: 2.0,
    cncVcMMin: 440,
    weldability: 'Good',
    machinability: 'Fair',
    corrosion: 'Good',
    blurb: 'European architectural and T-slot extrusion alloy. Intricate multi-hollow cross sections with superior surface finish and decorative anodizing.',
    applications: ['Window & door thermal-break profiles', 'T-slot automation framing (Sigma profiles)', 'LED & electronics heat sinks', 'Architectural louvres'],
    pitfalls: ['Lower yield (150 MPa) than 6061/6082 — do not use as a drop-in heavy structural substitute', 'Weld HAZ loses T6 properties locally'],
    composition: { Al: '97.9–99.3%', Cu: '≤ 0.10%', Mg: '0.35–0.60%', Mn: '≤ 0.10%', Si: '0.30–0.60%', Zn: '≤ 0.15%', Cr: '≤ 0.05%', Fe: '0.10–0.30%' },
  },
  {
    slug: '6061-t6',
    name: '6061-T6 Aluminum',
    family: '6xxx',
    temper: 'T6',
    standard: 'ASTM B209 / ASTM B221 / EN AW-6061',
    density: 2.70,
    yieldMPa: 275,
    tensileMPa: 310,
    shearMPa: 207,
    fatigueLimitMPa: 96,
    bearingYieldMPa: 386,
    elongationPct: 12,
    modulusGPa: 68.9,
    hardness: '95 HB',
    thermalExp: 23.6,
    thermalCond: 167,
    electricalConductivityIACS: 43,
    meltingRangeC: '582 – 652 °C',
    minBendRadiusRatio: 2.5,
    cncVcMMin: 480,
    weldability: 'Good',
    machinability: 'Good',
    corrosion: 'Good',
    blurb: 'The global reference structural aluminum alloy. Balanced yield strength (275 MPa), CNC machinability, and weldability. True density 2.70 g/cm³.',
    applications: ['CNC machined manifolds & fixtures', 'Structural frames & robotics', 'Aerospace secondary brackets', 'Scuba cylinders & bicycle frames'],
    pitfalls: ['Weld heat-affected zone (HAZ) drops to ~115 MPa yield (EN 1999 ρ_haz = 0.48) unless post-weld T6 aged', 'Sharp 90° cold bends crack in T6 — use generous bend radius (≥ 2.5t)'],
    composition: { Al: '95.8–98.6%', Cu: '0.15–0.40%', Mg: '0.8–1.2%', Mn: '≤ 0.15%', Si: '0.40–0.80%', Zn: '≤ 0.25%', Cr: '0.04–0.35%', Fe: '≤ 0.70%' },
  },
  {
    slug: '6063-t5',
    name: '6063-T5 Aluminum',
    family: '6xxx',
    temper: 'T5',
    standard: 'ASTM B221 / EN AW-6063',
    density: 2.70,
    yieldMPa: 145,
    tensileMPa: 185,
    shearMPa: 117,
    fatigueLimitMPa: 69,
    bearingYieldMPa: 235,
    elongationPct: 8,
    modulusGPa: 68.9,
    hardness: '60 HB',
    thermalExp: 23.4,
    thermalCond: 209,
    electricalConductivityIACS: 55,
    meltingRangeC: '615 – 654 °C',
    minBendRadiusRatio: 2.0,
    cncVcMMin: 450,
    weldability: 'Good',
    machinability: 'Good',
    corrosion: 'Excellent',
    blurb: 'Architectural extrusion and thermal management specialist. Smoother surface finish and 25% higher thermal conductivity than 6061-T6.',
    applications: ['Architectural window & curtain wall extrusions', 'Extruded CPU/IGBT heat sinks', 'Handrails & balustrades', 'Pneumatic cylinder barrels'],
    pitfalls: ['Do not specify 6063-T5 where 6061-T6 yield strength (275 MPa) is required', 'T5 press-quenched temper is ~20% weaker than T6 water-quenched'],
    composition: { Al: '97.5–99.3%', Cu: '≤ 0.10%', Mg: '0.45–0.90%', Mn: '≤ 0.10%', Si: '0.20–0.60%', Zn: '≤ 0.10%', Cr: '≤ 0.10%', Fe: '≤ 0.35%' },
  },
  {
    slug: '6082-t6',
    name: '6082-T6 Aluminum',
    family: '6xxx',
    temper: 'T6',
    standard: 'EN 755 / EN 485 / EN AW-6082',
    density: 2.71,
    yieldMPa: 260,
    tensileMPa: 310,
    shearMPa: 190,
    fatigueLimitMPa: 95,
    bearingYieldMPa: 410,
    elongationPct: 10,
    modulusGPa: 70,
    hardness: '95 HB',
    thermalExp: 24.0,
    thermalCond: 180,
    electricalConductivityIACS: 44,
    meltingRangeC: '575 – 650 °C',
    minBendRadiusRatio: 3.0,
    cncVcMMin: 460,
    weldability: 'Good',
    machinability: 'Good',
    corrosion: 'Good',
    blurb: 'Primary European structural Al-Si-Mg-Mn alloy (Eurocode 9). Manganese refines grain structure for superior toughness in bridges, trusses, and cranes.',
    applications: ['Stage trusses & pedestrian bridges', 'Crane booms & transport chassis', 'CNC machined tooling plates', 'Offshore helidecks'],
    pitfalls: ['Weld HAZ loses T6 strength (use ER5356 for shear strength or ER4043 for crack resistance)', 'Thin walls (<2 mm) are harder to extrude than 6060/6005A'],
    composition: { Al: '95.2–98.3%', Cu: '≤ 0.10%', Mg: '0.6–1.2%', Mn: '0.40–1.0%', Si: '0.7–1.3%', Zn: '≤ 0.20%', Cr: '≤ 0.25%', Fe: '≤ 0.50%' },
  },
  {
    slug: '7005-t6',
    name: '7005-T6 Aluminum',
    family: '7xxx',
    temper: 'T6',
    standard: 'ASTM B221 / EN AW-7005',
    density: 2.78,
    yieldMPa: 290,
    tensileMPa: 350,
    shearMPa: 215,
    fatigueLimitMPa: 120,
    bearingYieldMPa: 450,
    elongationPct: 10,
    modulusGPa: 72,
    hardness: '100 HB',
    thermalExp: 23.5,
    thermalCond: 140,
    electricalConductivityIACS: 35,
    meltingRangeC: '604 – 643 °C',
    minBendRadiusRatio: 3.5,
    cncVcMMin: 430,
    weldability: 'Fair',
    machinability: 'Good',
    corrosion: 'Good',
    blurb: 'Weldable Al-Zn-Mg 7xxx alloy. Unlike 7075, 7005 air-quenches and naturally recovers strength in the HAZ after welding with ER5356.',
    applications: ['High-end bicycle & motorcycle frames', 'Lightweight defense bridges', 'Motorsport subframes', 'Athletic equipment'],
    pitfalls: ['Requires natural aging (30 days) or artificial post-weld aging after TIG welding', 'Density 2.78 g/cm³ — 2.70 assumption underestimates mass by ~3%'],
    composition: { Al: '91.5–94.7%', Cu: '≤ 0.10%', Mg: '1.0–1.8%', Mn: '0.20–0.70%', Si: '≤ 0.35%', Zn: '4.0–5.0%', Cr: '0.06–0.20%', Fe: '≤ 0.40%' },
  },
  {
    slug: '7050-t7451',
    name: '7050-T7451 Aluminum',
    family: '7xxx',
    temper: 'T7451',
    standard: 'AMS 4050 / ASTM B209 / EN AW-7050',
    density: 2.83,
    yieldMPa: 469,
    tensileMPa: 524,
    shearMPa: 303,
    fatigueLimitMPa: 165,
    bearingYieldMPa: 710,
    elongationPct: 11,
    modulusGPa: 71.7,
    hardness: '140 HB',
    thermalExp: 23.5,
    thermalCond: 157,
    electricalConductivityIACS: 41,
    meltingRangeC: '488 – 629 °C',
    minBendRadiusRatio: 6.0,
    cncVcMMin: 420,
    weldability: 'Poor',
    machinability: 'Excellent',
    corrosion: 'Good',
    blurb: 'Thick-plate aerospace structural alloy (Al-Zn-Mg-Cu-Zr). Overaged T7451 temper eliminates Stress Corrosion Cracking (SCC) while preserving high fracture toughness in 50–150 mm hog-out plates.',
    applications: ['Monolithic CNC wing bulkheads & fuselage frames', 'Fighter jet structural ribs', 'High-precision injection molds', 'Semiconductor vacuum chambers'],
    pitfalls: ['Highest common aluminum density (2.83 g/cm³ — +4.8% heavier than 2.70)', 'Never fusion weld; join with aerospace interference-fit fasteners'],
    composition: { Al: '87.3–90.3%', Cu: '2.0–2.6%', Mg: '1.9–2.6%', Mn: '≤ 0.10%', Si: '≤ 0.12%', Zn: '5.7–6.7%', Cr: '≤ 0.04%', Fe: '≤ 0.15%' },
  },
  {
    slug: '7075-t6',
    name: '7075-T6 Aluminum',
    family: '7xxx',
    temper: 'T6',
    standard: 'ASTM B209 / AMS-QQ-A-250/12 / EN AW-7075',
    density: 2.81,
    yieldMPa: 505,
    tensileMPa: 570,
    shearMPa: 331,
    fatigueLimitMPa: 159,
    bearingYieldMPa: 786,
    elongationPct: 11,
    modulusGPa: 71.7,
    hardness: '150 HB',
    thermalExp: 23.4,
    thermalCond: 130,
    electricalConductivityIACS: 33,
    meltingRangeC: '477 – 635 °C',
    minBendRadiusRatio: 6.0,
    cncVcMMin: 450,
    weldability: 'Poor',
    machinability: 'Good',
    corrosion: 'Fair',
    blurb: 'Ultra-high-strength Al-Zn-Mg-Cu alloy rivaling structural steels in yield strength (505 MPa). Density 2.81 g/cm³ — assuming 2.70 underestimates mass by 4.07%.',
    applications: ['Aerospace wing spars & landing gear links', 'Motorsport uprights & CNC sprockets', 'Blow molds & ultrasonic horns', 'Defense receivers & Ordnance'],
    pitfalls: ['Do NOT arc weld (severe micro-cracking)', 'T6 temper is susceptible to Stress Corrosion Cracking (SCC) in short-transverse direction — specify 7075-T7351 or 7050-T7451 if exposed to salt/moisture'],
    composition: { Al: '87.1–91.4%', Cu: '1.2–2.0%', Mg: '2.1–2.9%', Mn: '≤ 0.30%', Si: '≤ 0.40%', Zn: '5.1–6.1%', Cr: '0.18–0.28%', Fe: '≤ 0.50%' },
  },
];

export const COMPARE_PAIRS: [string, string][] = [
  ['6061-t6', '6063-t5'],
  ['1100', '3003'],
  ['6061-t6', '7075-t6'],
  ['2024-t3', '7075-t6'],
  ['2024-t3', '6061-t6'],
  ['6063-t5', '6082-t6'],
  ['5083-h116', '6061-t6'],
  ['6061-t6', '6082-t6'],
  ['5052-h32', '5083-h116'],
];

export function getAlloy(slug: string): AlloyDatasheet | undefined {
  return ALLOY_DATASHEETS.find((a) => a.slug === slug);
}

export function plateMassKg(density: number, areaM2 = 1, thicknessMm = 10): number {
  return density * 1000 * areaM2 * (thicknessMm / 1000);
}

export function densityErrorPct(density: number, assumed = 2.7): number {
  return ((density - assumed) / assumed) * 100;
}

export type AluminumStockShape =
  | 'plate'
  | 'round_bar'
  | 'hex_bar'
  | 'octagonal_bar'
  | 'round_tube'
  | 'rect_tube'
  | 't_bar'
  | 'wire_coil'
  | 'sphere'
  | 'ring_flange';

export interface ShapeDimensionInputs {
  shape: AluminumStockShape;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  outerDiaMm: number;
  innerDiaMm: number;
  wallMm: number;
  acrossFlatsMm: number;
  quantity: number;
  densityGcm3: number;
  pricePerKgUsd: number;
}

/**
 * Deterministic 10-Shape Aluminum Volume, True Weight vs 2.70 Myth & Cost Engine
 * Reference: EN 573 / ASTM B209 / OmniCalculator Aluminum Weight Geometry
 */
export function calculateAlloyShapeWeight(input: ShapeDimensionInputs) {
  const L = Math.max(0, input.lengthMm);
  const W = Math.max(0, input.widthMm);
  const t = Math.max(0, input.thicknessMm);
  const OD = Math.max(0, input.outerDiaMm);
  const wall = Math.max(0, Math.min(OD / 2, input.wallMm));
  const ID = input.shape === 'ring_flange' ? Math.max(0, Math.min(OD, input.innerDiaMm)) : Math.max(0, OD - 2 * wall);
  const AF = Math.max(0, input.acrossFlatsMm);
  const qty = Math.max(1, Math.round(input.quantity));

  let crossAreaMm2 = 0;
  let singleVolumeMm3 = 0;

  switch (input.shape) {
    case 'plate':
      crossAreaMm2 = W * t;
      singleVolumeMm3 = L * W * t;
      break;
    case 'round_bar':
    case 'wire_coil':
      crossAreaMm2 = (Math.PI * OD * OD) / 4;
      singleVolumeMm3 = crossAreaMm2 * L;
      break;
    case 'hex_bar':
      // Regular hexagon area from across-flats s (AF): A = (sqrt(3)/2) * AF^2
      crossAreaMm2 = (Math.sqrt(3) / 2) * AF * AF;
      singleVolumeMm3 = crossAreaMm2 * L;
      break;
    case 'octagonal_bar':
      // Regular octagon area from across-flats AF: A = 2 * (sqrt(2) - 1) * AF^2
      crossAreaMm2 = 2 * (Math.SQRT2 - 1) * AF * AF;
      singleVolumeMm3 = crossAreaMm2 * L;
      break;
    case 'round_tube':
      crossAreaMm2 = (Math.PI * (OD * OD - ID * ID)) / 4;
      singleVolumeMm3 = crossAreaMm2 * L;
      break;
    case 'rect_tube': {
      const innerW = Math.max(0, W - 2 * wall);
      const innerH = Math.max(0, t - 2 * wall);
      crossAreaMm2 = W * t - innerW * innerH;
      singleVolumeMm3 = crossAreaMm2 * L;
      break;
    }
    case 't_bar': {
      // Flange width W, total height t, web/flange thickness wall
      const flangeArea = W * wall;
      const webArea = Math.max(0, t - wall) * wall;
      crossAreaMm2 = flangeArea + webArea;
      singleVolumeMm3 = crossAreaMm2 * L;
      break;
    }
    case 'sphere':
      crossAreaMm2 = (Math.PI * OD * OD) / 4;
      singleVolumeMm3 = (Math.PI * Math.pow(OD, 3)) / 6;
      break;
    case 'ring_flange':
      crossAreaMm2 = (Math.PI * (OD * OD - ID * ID)) / 4;
      singleVolumeMm3 = crossAreaMm2 * t;
      break;
  }

  const singleVolumeCm3 = singleVolumeMm3 / 1000;
  const totalVolumeCm3 = singleVolumeCm3 * qty;
  const singleMassKg = (singleVolumeCm3 * input.densityGcm3) / 1000;
  const totalMassKg = singleMassKg * qty;
  const totalMassLb = totalMassKg * 2.20462262;
  const assumed270MassKg = ((singleVolumeCm3 * 2.70) / 1000) * qty;
  const massDeltaKg = totalMassKg - assumed270MassKg;
  const massErrorPct = assumed270MassKg > 0 ? ((totalMassKg - assumed270MassKg) / assumed270MassKg) * 100 : 0;
  const totalCostUsd = totalMassKg * Math.max(0, input.pricePerKgUsd);

  return {
    crossAreaMm2,
    singleVolumeCm3,
    totalVolumeCm3,
    singleMassKg,
    totalMassKg,
    totalMassLb,
    assumed270MassKg,
    massDeltaKg,
    massErrorPct,
    totalCostUsd,
  };
}
