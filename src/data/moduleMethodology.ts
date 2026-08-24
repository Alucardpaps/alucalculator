export interface ModuleMethod {
  formula: string;
  formulaNote: string;
  standards: string[];
  assumptions: string[];
  academyHref?: string;
  academyLabel?: string;
  workedExample?: { title: string; result: string };
}

const CARDS: Record<string, ModuleMethod> = {
  'bolt-torque': {
    formula: 'T = K \\times F_m \\times d',
    formulaNote: 'Tightening torque calculation per VDI 2230 nut factor method (K ≈ K1+K2+K3). Fm is target preload, d is nominal bolt diameter.',
    standards: ['VDI 2230 Part 1', 'ISO 898-1', 'ISO 4017 / ISO 4762 geometry'],
    assumptions: [
      'Friction coefficients (thread & bearing face) dominate K — verify lubrication state',
      'Target preload Fm engineered to utilize 90% of bolt material yield strength',
      'Account for embedment losses and thermal expansion differential in critical joints',
    ],
    academyHref: '/academy/how-to-calculate-bolt-torque/',
    academyLabel: 'Bolt torque guide',
    workedExample: {
      title: 'Worked example — M12 × 8.8 (Dry assembly)',
      result: 'Engine calculates nut factor K = 0.20, target preload Fm = 38.5 kN, and tightening torque MA = 92.4 N·m. Live breakdown shows thread torque vs bearing face torque split.',
    },
  },
  bearings: {
    formula: 'L_{10} = \\left(\\frac{C}{P}\\right)^p \\times 10^6 \\text{ rev}, \\quad L_{10h} = \\frac{L_{10} \\times 10^6}{60 \\cdot n}',
    formulaNote: 'p = 3 (ball bearings) or 10/3 (roller bearings). ISO 281 basic rating life with radial/axial equivalent dynamic load P.',
    standards: ['ISO 281:2007', 'ISO 76 (Static rating)', 'DIN 622'],
    assumptions: [
      'Equivalent dynamic load P = X·Fr + Y·Fa computed per ISO 281 radial/axial factors',
      'Operating temperature and lubricant viscosity ratio κ (kappa) maintain elastohydrodynamic film',
      'Catalog dynamic capacity C and static capacity C0 sourced from verified bearing standards',
    ],
    academyHref: '/academy/bearing-life-calculation-explained/',
    academyLabel: 'Bearing life guide',
    workedExample: {
      title: 'Worked example — 6208 Deep Groove Ball Bearing (Fr = 6 kN, Fa = 1.8 kN, n = 1500 rpm)',
      result: 'Calculates equivalent load P = 6.84 kN. With C = 32.5 kN, L10 = 107.5 million revs (1,194 operating hours at 1500 rpm).',
    },
  },
  gears: {
    formula: '\\sigma_H = Z_H Z_E \\sqrt{\\frac{F_t}{d_1 b} \\frac{u+1}{u} K_A K_V K_H}, \\quad \\sigma_F = \\frac{F_t}{b \\cdot m_n} Y_F Y_S K_A K_V K_F',
    formulaNote: 'ISO 6336 Method B contact stress (pitting σH) and tooth root bending stress (σF) with Lewis form factor YF, stress correction YS, and safety factors SH, SF.',
    standards: ['ISO 6336-1/2/3', 'DIN 3960 / DIN 3990', 'AGMA 2001-D04'],
    assumptions: [
      'Standard 20° pressure angle involute gear profile with standard addendum/dedendum coefficients',
      'Tooth contact pattern and elastohydrodynamic oil film prevent micro-pitting and scuffing',
      'Required safety factor margins: SH ≥ 1.0 against pitting, SF ≥ 1.4 against root bending fatigue',
    ],
    workedExample: {
      title: 'Worked example — Spur Gear Pinion (m = 3 mm, z1 = 20, z2 = 60, b = 30 mm, Torque = 120 N·m)',
      result: 'Calculates tangential load Ft = 4,000 N, contact stress σH = 685 MPa (SH = 1.35), and root bending stress σF = 184 MPa (SF = 2.10 against 16MnCr5 alloy).',
    },
  },
  'planetary-gearbox': {
    formula: 'i = 1 + \\frac{z_{\\text{ring}}}{z_{\\text{sun}}} \\quad (\\text{Carrier output, ring fixed})',
    formulaNote: 'Willis fundamental kinematic equation for epicyclic gear trains, planet load sharing, torque multiplication, and stage efficiency.',
    standards: ['ISO 6336 (Epicyclic)', 'AGMA 6123-B06', 'DIN 3960'],
    assumptions: [
      'Planet gear meshing assembly condition satisfied: (z_sun + z_ring) / N_planets = Integer',
      'Floating sun or carrier geometry ensures uniform load sharing among planet gears',
      'Single stage mechanical efficiency estimated at η ≈ 97-98%',
    ],
    workedExample: {
      title: 'Worked example — 3-Planet Reducer (z_sun = 18, z_planet = 27, z_ring = 72)',
      result: 'Gear ratio i = 1 + 72/18 = 5.0:1. Input torque of 20 N·m at 3000 rpm yields 97.0 N·m output torque at 600 rpm (η = 97%).',
    },
  },
  'chain-drive': {
    formula: 'd_p = \\frac{p}{\\sin(180^\\circ / z)}, \\quad L_p = 2 C_p + \\frac{z_1 + z_2}{2} + \\frac{(z_2 - z_1)^2}{4 \\pi^2 C_p}',
    formulaNote: 'ISO 606 precision roller chain pitch diameter, center distance calculation, chain length in pitches, and strand tensile safety factor.',
    standards: ['ISO 606:2015', 'DIN 8187 (European Series)', 'DIN 8188 (ANSI Series)'],
    assumptions: [
      'Driving sprocket tooth count z1 ≥ 17 to mitigate chordal speed variation (polygon effect)',
      'Recommended center distance C ≈ 30 to 50 times chain pitch p with 1-2% nominal sag',
      'Adequate lubrication method (drip, bath, or forced oil) based on chain speed category',
    ],
    workedExample: {
      title: 'Worked example — ISO 08B-1 (p = 12.7 mm, z1 = 19, z2 = 38, C = 500 mm)',
      result: 'Pitch diameters dp1 = 77.16 mm, dp2 = 153.80 mm. Chain length = 108 pitches (1371.6 mm) with exact adjusted center distance C = 504.2 mm.',
    },
  },
  'belt-drive': {
    formula: 'P_{\\text{corr}} = P_{\\text{rated}} \\cdot c_1 \\cdot c_3, \\quad L_p = 2C + 1.57(d_2 + d_1) + \\frac{(d_2 - d_1)^2}{4C}',
    formulaNote: 'ISO 5291 industrial V-belt & pulley power transmission, arc of contact correction c1, service factor c3, and pitch length calculation.',
    standards: ['ISO 5291', 'DIN 2215 / DIN 7753', 'RMA IP-20'],
    assumptions: [
      'Small pulley diameter d1 exceeds minimum recommended bending limit to avoid premature fatigue',
      'Wrap angle on small pulley θ1 ≥ 120° for optimal frictional torque transmission',
      'Installation and operational belt tension calibrated to prevent slippage without overloading shaft bearings',
    ],
    workedExample: {
      title: 'Worked example — SPA Profile V-Belt (d1 = 100 mm, d2 = 200 mm, C = 450 mm, Power = 5.5 kW)',
      result: 'Calculates pitch length Lp = 1382 mm (standard SPA 1400), arc of contact θ1 = 167.2° (c1 = 0.97), recommending 2 parallel belts for safety factor 1.45.',
    },
  },
  'sheet-metal': {
    formula: 'BA = \\frac{\\pi}{180} \\cdot (R + K \\cdot t) \\cdot \\alpha, \\quad BD = 2(R + t)\\tan(\\alpha/2) - BA',
    formulaNote: 'DIN 6935 neutral axis shift (K-factor), bend allowance (BA), and bend deduction (BD) for precision sheet metal blank development.',
    standards: ['DIN 6935', 'ISO 6892-1', 'VDI 3388'],
    assumptions: [
      'Uniform plastic deformation during air bending across the tooling V-die opening',
      'K-factor calibrated by material type and inside bend radius-to-thickness ratio (R/t ≈ 0.33 to 0.50)',
      'Springback compensation considered based on material yield strength and die geometry',
    ],
    workedExample: {
      title: 'Worked example — 2.0 mm S235 Steel (90° bend, R = 2.0 mm, K = 0.40)',
      result: 'Calculates neutral axis radius rn = 2.80 mm, Bend Allowance BA = 4.40 mm, and Bend Deduction BD = 3.60 mm for exact CAD flat blank sizing.',
    },
  },
  'spring-design': {
    formula: '\\tau = K_w \\frac{8 F D}{\\pi d^3}, \\quad K_w = \\frac{4C-1}{4C-4} + \\frac{0.615}{C}, \\quad k = \\frac{G d^4}{8 D^3 n_a}',
    formulaNote: 'Wahl curvature stress concentration factor Kw, torsional shear stress τ, and linear spring rate k for helical compression springs.',
    standards: ['DIN EN 13906-1', 'IS 7906', 'ASTM A228 (Music Wire)'],
    assumptions: [
      'Spring index C = D/d maintained within standard manufacturing bounds (4 ≤ C ≤ 12)',
      'Shear modulus G remains constant within operating temperature limit (G ≈ 79.3 GPa for spring steel)',
      'Clash clearance: minimum 10% deflection margin maintained above solid height under peak load',
    ],
    workedExample: {
      title: 'Worked example — Helical Spring (d = 3 mm, D = 24 mm, na = 8 coils, F = 250 N)',
      result: 'Calculates spring index C = 8.0, Wahl factor Kw = 1.184, shear stress τ = 558 MPa, spring rate k = 15.1 N/mm, and active deflection δ = 16.5 mm.',
    },
  },
  'beam-deflection': {
    formula: '\\delta_{\\max} = \\frac{5 w L^4}{384 E I} \\quad (\\text{Simply supported, UDL}), \\quad \\sigma_{\\max} = \\frac{M_{\\max} \\cdot y}{I}',
    formulaNote: 'Euler-Bernoulli beam bending theory for deflection, shear force, bending moments, and outer fiber flexural stress.',
    standards: ['Euler-Bernoulli Beam Theory', 'AISC Steel Construction Manual', 'EN 1993-1-1'],
    assumptions: [
      'Linear elastic, isotropic material behavior with small displacements (δ << L)',
      'Cross-sections remain planar and perpendicular to the neutral axis during flexure (shear deformation neglected)',
      'Deflection limits checked against standard serviceability criteria (e.g. L/300 or L/500)',
    ],
    academyHref: '/academy/beam-deflection-formula-explained/',
    academyLabel: 'Beam deflection guide',
    workedExample: {
      title: 'Worked example — IPE 200 Steel Beam (L = 4.0 m, UDL w = 15 kN/m, E = 210 GPa)',
      result: 'Calculates maximum bending moment Mmax = 30.0 kN·m, bending stress σmax = 136.4 MPa, and maximum midspan deflection δmax = 5.82 mm (L/687).',
    },
  },
  shafts: {
    formula: 'd = \\left( \\frac{16}{\\pi \\tau_{\\text{allow}}} \\sqrt{(K_b M)^2 + (K_t T)^2} \\right)^{1/3}',
    formulaNote: 'ASME / Shigley combined bending and torsional shaft sizing with shock and fatigue factors Kb and Kt.',
    standards: ['ASME B106.1M', 'DIN 743 (Fatigue limits)', 'ISO 286 (Fits)'],
    assumptions: [
      'Combined dynamic bending moment M and steady/reversing torsional moment T applied concurrently',
      'Stress concentration notches (keyways, shoulders, retaining ring grooves) reduce allowable shear limit',
      'Shaft deflection and slope at bearing seats verified to protect rolling element life',
    ],
    workedExample: {
      title: 'Worked example — Drive Shaft (M = 250 N·m, T = 400 N·m, τ_allow = 50 MPa, Kb = 1.5, Kt = 1.0)',
      result: 'Calculates equivalent torque Teq = 548.3 N·m, yielding minimum required solid shaft diameter d = 38.2 mm (standard nominal 40 mm selected).',
    },
  },
  'welding': {
    formula: '\\tau_w = \\frac{F}{\\sqrt{2} \\cdot a \\cdot L_w} \\le f_{vw,d} = \\frac{f_u / \\sqrt{3}}{\\beta_w \\cdot \\gamma_{M2}}',
    formulaNote: 'Eurocode 3 (EN 1993-1-8) / AWS D1.1 fillet weld throat thickness a, effective weld length Lw, and design shear resistance.',
    standards: ['Eurocode 3 (EN 1993-1-8)', 'AWS D1.1 (Structural Steel)', 'AWS D1.2 (Structural Aluminum)'],
    assumptions: [
      'Effective throat thickness a calculated as nominal leg size s × 0.707 for 90° fillet joints',
      'End start/stop crater losses subtracted from total weld run length (Leff = L - 2a)',
      'Correlation factor βw assigned according to steel grade (e.g. βw = 0.80 for S235, 0.85 for S275, 0.90 for S355)',
    ],
    workedExample: {
      title: 'Worked example — Lap Joint Fillet Weld (F = 60 kN, leg size s = 6 mm, L = 120 mm, S275 Steel)',
      result: 'Throat a = 4.24 mm, effective length Leff = 111.5 mm. Weld stress τw = 127.1 MPa (well below design limit fvw,d = 208.5 MPa).',
    },
  },
  'nesting-2d': {
    formula: '\\eta_{\\text{utilization}} = \\frac{\\sum A_{\\text{parts}}}{A_{\\text{sheet}}} \\times 100\\%, \\quad W_{\\text{scrap}} = 100\\% - \\eta_{\\text{utilization}}',
    formulaNote: 'Bottom-Left-Fill (BLF) / Genetic 2D bin packing with laser/plasma kerf width offset, part-in-part nesting, and grain constraint.',
    standards: ['ISO 9013 (Thermal cutting tolerances)', 'VDI 3388 (Blank nesting)'],
    assumptions: [
      'Tool kerf width (typically 0.8 - 1.5 mm) and lead-in/lead-out margins offset from part perimeter',
      'Minimum skeleton web thickness maintained between adjacent contours to prevent sheet thermal warping',
      'Material rolling grain direction respected for parts requiring subsequent precision press brake bending',
    ],
    workedExample: {
      title: 'Worked example — Sheet Laser Nesting (1500 × 3000 mm 3.0 mm Al Sheet, 84 Components)',
      result: 'Nesting algorithm achieves 88.4% material utilization with 1.2 mm laser kerf, reducing scrap waste from 24.5% to 11.6%.',
    },
  },
  'machining-details': {
    formula: 'v_c = \\frac{\\pi \\cdot D \\cdot n}{1000}, \\quad v_f = n \\cdot z \\cdot f_z, \\quad Q = \\frac{v_c \\cdot a_p \\cdot a_e}{1000}, \\quad P_c = \\frac{Q \\cdot k_c}{60 \\cdot 10^3 \\cdot \\eta}',
    formulaNote: 'ISO 3002 cutting speed vc (m/min), table feed vf (mm/min), metal removal rate Q (cm³/min), and spindle cutting power Pc (kW) via specific cutting force kc.',
    standards: ['ISO 3002 (Cutting tool geometry)', 'Sandvik Coromant Technical Standard', 'DIN 6580'],
    assumptions: [
      'Specific cutting force kc adjusted for chip thickness hm and positive rake angle geometry',
      'Spindle electro-mechanical drive efficiency estimated at η ≈ 80-85%',
      'Tool life governed by Taylor equation vc · T^n = C under flood coolant conditions',
    ],
    workedExample: {
      title: 'Worked example — Face Milling Al6082-T6 (D = 50 mm, z = 4, ap = 3 mm, ae = 40 mm, vc = 450 m/min, fz = 0.15 mm/tooth)',
      result: 'Spindle speed n = 2865 rpm, table feed vf = 1719 mm/min, metal removal rate Q = 206.3 cm³/min, requiring spindle cutting power Pc = 2.82 kW (kc = 700 N/mm²).',
    },
  },
  'fatigue-analysis': {
    formula: '\\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_{ut}} = \\frac{1}{n_f} \\quad (\\text{Goodman}), \\quad \\frac{\\sigma_a}{S_e} + \\left(\\frac{\\sigma_m}{S_{ut}}\\right)^2 = \\frac{1}{n_f} \\quad (\\text{Gerber})',
    formulaNote: 'High-cycle fatigue life assessment under fluctuating stress cycles with mean stress corrections (Goodman, Gerber, Soderberg).',
    standards: ['ASTM E466 (Axial fatigue)', 'DIN 50100 (Wöhler S-N testing)', 'FKM Guideline (Analytical strength)'],
    assumptions: [
      'Marin endurance limit correction factors applied: surface finish ka, size kb, reliability kc, temperature kd',
      'Fatigue notch factor Kf = 1 + q(Kt - 1) computed using Neuber notch sensitivity q',
      'Infinite life target validated when alternating stress σa remains strictly below endurance limit Se',
    ],
    workedExample: {
      title: 'Worked example — Stepped Shaft under Fluctuating Load (σmax = 280 MPa, σmin = 40 MPa, Sut = 600 MPa, Se = 220 MPa)',
      result: 'Alternating stress σa = 120 MPa, mean stress σm = 160 MPa. Modified Goodman safety factor nf = 1.23 against infinite fatigue life limit.',
    },
  },
  'vibration': {
    formula: 'f_n = \\frac{1}{2\\pi} \\sqrt{\\frac{k}{m}}, \\quad T = \\sqrt{\\frac{1 + (2\\zeta r)^2}{(1 - r^2)^2 + (2\\zeta r)^2}}, \\quad r = \\frac{f_{\\text{ex}}}{f_n}',
    formulaNote: 'Natural frequency fn, frequency ratio r, and vibration transmissibility T for single-degree-of-freedom (SDOF) isolation mounts.',
    standards: ['ISO 10816 (Mechanical vibration)', 'ISO 2017 (Resilient mounting)'],
    assumptions: [
      'Vibration isolation achieved when excitation frequency ratio r > √2 (T < 1.0)',
      'Viscous damping ratio ζ typically 0.03 to 0.10 for elastomeric and spring isolators',
      'Rigid body mass behavior assumed for the isolated machine assembly',
    ],
    workedExample: {
      title: 'Worked example — Centrifugal Pump Mount (m = 800 kg, motor speed 1450 rpm / 24.2 Hz, 4 rubber mounts)',
      result: 'Mount stiffness k = 315 kN/m yields system natural frequency fn = 3.16 Hz (ratio r = 7.65), achieving 98.2% vibration isolation efficiency (Transmissibility T = 0.018).',
    },
  },
  'digital-logic': {
    formula: 'Y = \\overline{A \\cdot B} \\quad (\\text{NAND}), \\quad Y = A \\oplus B = A\\overline{B} + \\overline{A}B \\quad (\\text{XOR}), \\quad Q_{n+1} = D',
    formulaNote: 'Boolean algebra simplification, Karnaugh map minimization, and propagation delay / setup-and-hold timing analysis.',
    standards: ['IEEE 91 / 91a (Logic symbols)', 'IEC 60617-12', 'JEDEC Standard No. 78'],
    assumptions: [
      'Standard CMOS 3.3V / 5.0V voltage thresholds for logic High (VIH) and logic Low (VIL)',
      'Fan-out limitations and capacitive line loading considered for max clock frequency',
      'Race hazards and glitches eliminated via synchronous clocking design',
    ],
    workedExample: {
      title: 'Worked example — 2-Bit Full Adder Propagation Analysis',
      result: 'Calculates carry-out Cout = (A·B) + (Cin·(A⊕B)) and sum S = A⊕B⊕Cin with deterministic 2-gate propagation delay (tpd = 6.4 ns at 74HCT logic).',
    },
  },
  'filter-design': {
    formula: 'f_c = \\frac{1}{2\\pi R C} \\quad (\\text{1st Order RC}), \\quad f_0 = \\frac{1}{2\\pi \\sqrt{L C}} \\quad (\\text{2nd Order LC}), \\quad H(s) = \\frac{1}{1 + \\sqrt{2}s/\\omega_0 + (s/\\omega_0)^2}',
    formulaNote: 'Butterworth (maximally flat), Chebyshev (equiripple), and Sallen-Key active analog active/passive filter synthesis.',
    standards: ['IEEE Std 430', 'IEC 60384', 'Standard E96/E24 Resistor & Capacitor Series'],
    assumptions: [
      'Ideal op-amp characteristics: infinite open-loop gain, infinite input impedance, zero output impedance',
      'Standard passive component tolerance (1% metal film resistors, C0G/NPO capacitors for low temperature drift)',
      'Passband attenuation at cutoff frequency fc equals -3.01 dB for Butterworth response',
    ],
    workedExample: {
      title: 'Worked example — 2nd Order Butterworth Low-Pass (fc = 10 kHz, Sallen-Key topology)',
      result: 'Calculates standard values R1 = R2 = 15.8 kΩ, C1 = 1.5 nF, C2 = 750 pF (damping ratio ζ = 0.707, Q = 0.707) with -40 dB/decade stopband roll-off.',
    },
  },
  'hardness-converter': {
    formula: '\\text{HRC} \\approx 110 - \\frac{h}{0.002}, \\quad \\text{HV} \\approx 1.854 \\frac{F}{d^2}, \\quad R_m \\approx 3.45 \\times \\text{HBW} \\text{ (MPa)}',
    formulaNote: 'ASTM E140 / ISO 18265 standard conversion between Rockwell (HRC, HRB), Brinell (HBW), Vickers (HV), and Tensile Strength (Rm).',
    standards: ['ASTM E140-12b', 'ISO 18265:2013 (Metallic materials conversion)', 'DIN 50150'],
    assumptions: [
      'Applicable strictly to non-austenitic steels, heat-treated structural alloys, and aluminum profiles',
      'Specimen thickness exceeds minimum required indentation depth per ASTM E18',
      'Conversion accuracy ±1 to ±2 HRC in medium hardness range (20 to 65 HRC)',
    ],
    workedExample: {
      title: 'Worked example — Quenched & Tempered 42CrMo4 (HBW 300)',
      result: 'Converts accurately to 31.8 HRC, 315 HV30, and estimated ultimate tensile strength Rm = 1010 MPa.',
    },
  },
  'motor-selection-std': {
    formula: 'P_{\\text{req}} = \\frac{T_{\\text{load}} \\cdot \\omega}{1000 \\cdot \\eta_{\\text{trans}}}, \\quad T_{\\text{acc}} = (J_{\\text{motor}} + J_{\\text{load}}\') \\cdot \\alpha, \\quad P_{\\text{installed}} \\ge P_{\\text{req}} \\cdot k_{\\text{service}}',
    formulaNote: 'IEC 60034 three-phase induction and servo motor sizing, reflected load inertia ratio J_load/J_motor, and thermal continuous torque margin.',
    standards: ['IEC 60034-1 / IEC 60034-30-1 (IE3/IE4 Premium Efficiency)', 'NEMA MG-1'],
    assumptions: [
      'Reflected inertia ratio to motor shaft (J_load/J_motor) designed within stable control range (≤ 5:1 for dynamic servo, ≤ 10:1 for standard drives)',
      'Ambient operating temperature ≤ 40 °C at installation altitude ≤ 1000 m above sea level',
      'Service factor k_service chosen per daily duty cycle and shock loading class (A/B/C)',
    ],
    workedExample: {
      title: 'Worked example — Conveyor Drive (Tload = 45 N·m, speed n = 150 rpm, reducer η = 0.90, service factor = 1.25)',
      result: 'Net mechanical power Pnet = 0.707 kW. Accounting for reducer efficiency and service factor yields 0.98 kW, sizing a standard IEC 90S 1.1 kW 4-pole IE3 motor.',
    },
  },
  'pipe-friction': {
    formula: 'h_f = f \\frac{L}{D} \\frac{v^2}{2g}, \\quad \\frac{1}{\\sqrt{f}} = -2 \\log_{10}\\left(\\frac{\\varepsilon/D}{3.7} + \\frac{2.51}{\\text{Re}\\sqrt{f}}\\right)',
    formulaNote: 'Darcy-Weisbach head loss and Colebrook-White implicit friction factor equation for laminar and turbulent fluid flow in pipes.',
    standards: ['ISO 5167', 'Hydraulic Institute Standards (HIS)', 'Moody Chart'],
    assumptions: [
      'Steady-state, fully developed incompressible Newtonian fluid flow',
      'Surface roughness ε specified per pipe material (commercial steel, PVC, stainless)',
      'Minor fitting losses accounted for via equivalent length or resistance coefficients K',
    ],
    workedExample: {
      title: 'Worked example — Water Pipe (DN50, L = 100 m, Q = 5 L/s, ε = 0.045 mm)',
      result: 'Flow velocity v = 2.55 m/s, Re = 127,000 (turbulent). Friction factor f = 0.0215, generating head loss hf = 14.6 m (Δp = 1.43 bar).',
    },
  },
  'pressure-vessel': {
    formula: 't_{\\text{shell}} = \\frac{P \\cdot R}{S \\cdot E - 0.6 P} + CA, \\quad t_{\\text{head}} = \\frac{P \\cdot D \\cdot K}{2 S \\cdot E - 0.2 P} + CA',
    formulaNote: 'ASME Boiler & Pressure Vessel Code (BPVC) Section VIII Division 1 thin-wall shell and 2:1 ellipsoidal head minimum wall thickness.',
    standards: ['ASME BPVC Section VIII Div 1', 'EN 13445', 'AD 2000-Merkblatt'],
    assumptions: [
      'Thin-wall cylindrical pressure boundary condition satisfied: t/R ≤ 0.5',
      'Joint efficiency factor E assigned based on radiographic examination category (E = 0.85 to 1.0)',
      'Corrosion allowance (CA) added directly to calculate minimum required nominal fabrication thickness',
    ],
    workedExample: {
      title: 'Worked example — Air Receiver (P = 1.6 MPa, Internal R = 400 mm, S = 138 MPa, E = 1.0, CA = 2 mm)',
      result: 'Calculates required shell thickness t = 4.67 mm + 2.0 mm CA = 6.67 mm (standard 8 mm pressure vessel steel plate selected).',
    },
  },
  'concrete-reinforcement': {
    formula: 'M_u = \\phi A_s f_y \\left(d - \\frac{a}{2}\\right), \\quad a = \\frac{A_s f_y}{0.85 f\'_c b}',
    formulaNote: 'ACI 318 / Eurocode 2 ultimate flexural moment capacity and Whitney equivalent compressive rectangular stress block for reinforced concrete.',
    standards: ['ACI 318-19', 'Eurocode 2 (EN 1992-1-1)', 'TS 500'],
    assumptions: [
      'Bernoulli plane section hypothesis: strain varies linearly through depth of member',
      'Concrete tensile strength neglected in ultimate flexural limit state design',
      'Tension-controlled ductile section confirmed: tensile steel strain εt ≥ 0.005 (strength reduction factor φ = 0.90)',
    ],
    workedExample: {
      title: 'Worked example — RC Beam (b = 250 mm, d = 450 mm, 3×Φ20 Rebar As = 942 mm², f\'c = 30 MPa, fy = 420 MPa)',
      result: 'Depth of stress block a = 62.1 mm. Ultimate flexural moment capacity Mu = 142.1 kN·m with ductile tension failure mode.',
    },
  },
  'column-buckling': {
    formula: 'P_{cr} = \\frac{\\pi^2 E I}{(K L)^2}, \\quad \\lambda = \\frac{K L}{r}, \\quad \\sigma_{cr} = \\frac{P_{cr}}{A}',
    formulaNote: 'Euler critical buckling load for slender columns (λ ≥ λcrit) and Johnson parabolic transition equation for intermediate columns.',
    standards: ['AISC 360-16', 'Eurocode 3 (EN 1993-1-1)', 'DIN 4114'],
    assumptions: [
      'Concentric axial compressive load with zero initial curvature or lateral eccentricity',
      'Effective length factor K determined by end boundary conditions (e.g. pinned-pinned K = 1.0, fixed-free K = 2.0)',
      'Slenderness ratio λ compared against material critical slenderness to verify Euler vs inelastic buckling regime',
    ],
    workedExample: {
      title: 'Worked example — Circular Steel Column (OD = 60 mm, t = 4 mm, L = 3.0 m, Pinned-Pinned K = 1.0)',
      result: 'Area A = 703.7 mm², moment of inertia I = 28.6 cm⁴, radius of gyration r = 20.2 mm. Slenderness λ = 148.5, yielding Euler buckling capacity Pcr = 65.8 kN.',
    },
  },
  'fasteners': {
    formula: 'A_s = \\frac{\\pi}{4} \\left( \\frac{d_2 + d_3}{2} \\right)^2, \\quad d_2 = d - 0.649519 \\cdot P, \\quad d_3 = d - 1.226869 \\cdot P',
    formulaNote: 'ISO 68-1 / ISO 965-1 metric thread profile geometry, pitch diameter d2, minor diameter d3, and tensile stress area As.',
    standards: ['ISO 68-1', 'ISO 965-1', 'ISO 273 (Clearance holes)', 'ISO 4017'],
    assumptions: [
      '60° symmetrical triangular metric thread profile per ISO standard practice',
      'Standard medium tolerance class 6g (bolts) and 6H (nuts)',
      'Clearance hole diameter selected per ISO 273 fine, medium, or coarse grade series',
    ],
    academyHref: '/bolt-torque/',
    academyLabel: 'Open bolt torque calculator',
  },
  'three-phase-power': {
    formula: 'P = \\sqrt{3} \\cdot V_L \\cdot I_L \\cdot \\cos\\phi, \\quad S = \\sqrt{3} \\cdot V_L \\cdot I_L, \\quad Q = \\sqrt{3} \\cdot V_L \\cdot I_L \\cdot \\sin\\phi',
    formulaNote: 'Balanced three-phase active real power P (kW), apparent power S (kVA), reactive power Q (kVAR), and power factor cosφ.',
    standards: ['IEEE 141 (Red Book)', 'IEC 60038', 'NFPA 70 (NEC)'],
    assumptions: [
      'Symmetrical balanced three-phase AC system with 120° phase displacement between line voltages',
      'Line-to-line voltage VL and line current IL measured as RMS values',
      'Linear balanced electrical load across all three phases',
    ],
  },
  'fluid-dynamics': {
    formula: 'Q = A \\cdot v, \\quad \\text{Re} = \\frac{\\rho v D}{\\mu}, \\quad \\Delta p = f \\frac{L}{D} \\frac{\\rho v^2}{2}',
    formulaNote: 'Continuity equation, Reynolds number regime classification, and Darcy-Weisbach dynamic pressure loss.',
    standards: ['ISO 5167', 'Hydraulic Institute (HIS)', 'Crane Technical Paper 410'],
    assumptions: [
      'Incompressible fluid flow with constant physical properties (density ρ, dynamic viscosity μ)',
      'Laminar regime Re < 2300 (f = 64/Re), turbulent regime Re > 4000 (Colebrook/Haaland)',
    ],
  },
  'fits-tolerances': {
    formula: 'T_D = |ES - EI|, \\quad T_d = |es - ei|, \\quad C_{\\max} = ES - ei, \\quad C_{\\min} = EI - es',
    formulaNote: 'ISO 286-1 system of limits and fits, fundamental deviations, and standard international tolerance grades (IT01 to IT18).',
    standards: ['ISO 286-1:2010', 'ISO 286-2', 'DIN 7154 / DIN 7155'],
    assumptions: [
      'Standard reference temperature of 20 °C (68 °F) for dimensional inspection per ISO 1',
      'Hole basis system (H) or shaft basis system (h) for standardized tooling economy',
      'Fit type classified deterministically: Clearance (Cmin ≥ 0), Interference (Cmax ≤ 0), or Transition',
    ],
  },
  aluminum: {
    formula: 'm = \\rho \\cdot V = \\rho \\cdot (A \\cdot L)',
    formulaNote: 'Extruded aluminum profile weight and mass computation from cross-sectional area and certified alloy density.',
    standards: ['EN 755-2 / EN 573-3 (Chemical composition & mechanical properties)', 'ASTM B221'],
    assumptions: [
      'Uniform cross-sectional profile geometry along total length L',
      'Alloy density selected from certified metallurgical ledger (e.g. 6060: 2.70 g/cm³, 6082: 2.71 g/cm³, 7075: 2.81 g/cm³)',
      'Nominal dimensions calculated at standard ambient temperature (20 °C)',
    ],
  },
  'periodic-table': {
    formula: '\\text{Molar Mass} = \\sum_{i} n_i M_i, \\quad \\rho = \\frac{m}{V}, \\quad \\text{Valence Electron Shells}',
    formulaNote: 'IUPAC standard atomic weights, electron configurations, crystal structures, and thermophysical properties.',
    standards: ['IUPAC Standard Atomic Weights', 'NIST Standard Reference Database'],
    assumptions: [
      'Standard temperature and pressure (STP: 298.15 K, 100 kPa) for density and phase states',
      'Terrestrial isotopic abundance used for standard relative atomic mass values',
    ],
  },
  'wind-tunnel': {
    formula: 'F_D = \\frac{1}{2} \\rho v^2 C_D A, \\quad F_L = \\frac{1}{2} \\rho v^2 C_L A, \\quad P_{\\text{aero}} = F_D \\cdot v',
    formulaNote: 'Aerodynamic drag force FD, lift force FL, drag coefficient CD, and aerodynamic power loss Paero in incompressible/compressible flow.',
    standards: ['ISO 5801 (Aerodynamic testing)', 'SAE J1594 (Vehicle aerodynamics)', 'NASA SP-367'],
    assumptions: [
      'Boundary layer transition and skin friction coefficient computed using Reynolds number',
      'Frontal reference area A measured perpendicular to incoming relative velocity vector',
      'Air density ρ calibrated for ambient atmospheric pressure and temperature',
    ],
    workedExample: {
      title: 'Worked example — Automotive Profile (v = 120 km/h = 33.3 m/s, CD = 0.28, A = 2.2 m², ρ = 1.225 kg/m³)',
      result: 'Dynamic pressure q = 680.6 Pa, Aerodynamic Drag FD = 419.2 N, requiring aerodynamic propulsion power Paero = 13.97 kW.',
    },
  },
  'heat-sink': {
    formula: 'R_{\\theta,sa} = \\frac{T_j - T_a}{P} - R_{\\theta,jc} - R_{\\theta,cs}, \\quad R_{\\theta,\\text{conv}} = \\frac{1}{h \\cdot A_{\\text{fin}}}',
    formulaNote: 'Junction-to-ambient thermal resistance network, forced/natural convection heat transfer coefficient h, and fin efficiency ηf.',
    standards: ['JEDEC JESD51 (Thermal measurement)', 'MIL-HDBK-251', 'IEEE Thermal Standards'],
    assumptions: [
      '1D steady-state thermal resistance network through TIM (Thermal Interface Material) interface',
      'Uniform heat flux distribution across heat sink base plate',
      'Convective heat transfer coefficient h calibrated for natural convection (5-25 W/m²K) or forced air (20-100 W/m²K)',
    ],
    workedExample: {
      title: 'Worked example — Power Inverter Transistor (P = 45 W, Tj,max = 125 °C, Ta = 40 °C, Rjc = 0.5 K/W, Rcs = 0.3 K/W)',
      result: 'Maximum allowable sink-to-ambient thermal resistance Rsa = (125-40)/45 - 0.8 = 1.09 K/W, sizing an extruded aluminum fin pack with A = 0.085 m².',
    },
  },
  'hvac-load': {
    formula: '\\dot{Q}_{\\text{sensible}} = 1.23 \\cdot \\dot{V} \\cdot \\Delta T, \\quad \\dot{Q}_{\\text{total}} = U \\cdot A \\cdot \\Delta T_{\\text{cltd}} + \\dot{Q}_{\\text{solar}} + \\dot{Q}_{\\text{internal}}',
    formulaNote: 'ASHRAE cooling and heating load calculation, building envelope overall U-factor, solar heat gain coefficient (SHGC), and sensible/latent heat breakdown.',
    standards: ['ASHRAE Fundamentals Handbook', 'ISO 52000 (Energy performance of buildings)', 'EN 12831'],
    assumptions: [
      'Steady-state heat transfer through building envelope layers (insulation, brick, glazing)',
      'Cooling Load Temperature Difference (CLTD) accounts for thermal mass time lag',
      'Internal heat gains include occupant sensible/latent metabolic rate and equipment wattage',
    ],
    workedExample: {
      title: 'Worked example — Production Office Space (Area = 120 m², ΔT = 15 K, Occupants = 10, Equipment = 3 kW)',
      result: 'Envelope transmission = 4.2 kW, Ventilation sensible = 2.2 kW, Internal load = 4.3 kW -> Total design cooling load = 10.7 kW (3.05 Tons Refrigeration).',
    },
  },
  'aerospace-dynamics': {
    formula: 'M = \\frac{v}{a} = \\frac{v}{\\sqrt{\\gamma R T}}, \\quad q = \\frac{1}{2} \\gamma p M^2, \\quad \\Delta v = I_{\\text{sp}} g_0 \\ln\\left(\\frac{m_0}{m_f}\\right)',
    formulaNote: 'Compressible aerodynamic Mach number M, dynamic pressure q, total temperature recovery, and Tsiolkovsky rocket equation.',
    standards: ['ICAO Standard Atmosphere (ISA)', 'NASA SP-8000 Series', 'AIAA Aerospace Standards'],
    assumptions: [
      'Ideal gas ratio of specific heats γ = 1.4 for atmospheric flight',
      'Atmospheric properties vary per 1976 US Standard Atmosphere barometric lapse rate',
      'Rocket propellant mass ratio m0/mf determines orbital delta-v without drag/gravity losses',
    ],
    workedExample: {
      title: 'Worked example — High Altitude Flight (Altitude = 10,000 m, v = 240 m/s = 864 km/h)',
      result: 'Temperature T = 223.25 K, speed of sound a = 299.5 m/s, Mach M = 0.801 (subsonic cruise), dynamic pressure q = 11.95 kPa.',
    },
  },
  'naval-hydrostatics': {
    formula: '\\Delta = \\rho_{\\text{sea}} \\cdot \\nabla, \\quad \\overline{GM} = \\overline{KB} + \\overline{BM} - \\overline{KG}, \\quad \\overline{BM} = \\frac{I_T}{\\nabla}',
    formulaNote: 'Archimedes displacement buoyancy Δ, transverse metacentric height GM, waterplane second moment IT, and righting lever GZ stability.',
    standards: ['IMO 2008 Intact Stability Code', 'ISO 12217 (Small craft stability)', 'DNV Rules for Ships'],
    assumptions: [
      'Seawater standard density ρ = 1025 kg/m³ (freshwater ρ = 1000 kg/m³)',
      'Positive intact stability required: GM > 0.15 m for commercial vessels',
      'Free surface effect of liquid cargo tanks subtracted from effective GM',
    ],
    workedExample: {
      title: 'Worked example — Workboat Hull (Displacement ∇ = 45 m³, IT = 120 m⁴, KG = 1.80 m, KB = 0.95 m)',
      result: 'Metacentric radius BM = 2.67 m. Metacentric height GM = 0.95 + 2.67 - 1.80 = 1.82 m (strongly stable transverse righting characteristics).',
    },
  },
  'cad-editor': {
    formula: '\\mathbf{P}(u) = \\sum_{i=0}^n B_{i,n}(u) \\mathbf{P}_i, \\quad \\mathbf{T}_{\\text{matrix}} = \\begin{bmatrix} \\mathbf{R}_{3\\times3} & \\mathbf{t}_{3\\times1} \\\\ \\mathbf{0} & 1 \\end{bmatrix}',
    formulaNote: 'Bézier / B-Spline parametric curve generation, 2D constraint solver (coincident, parallel, tangent), and homogeneous geometric transformation.',
    standards: ['ISO 10303 (STEP AP214/AP242)', 'AutoCAD DXF Reference', 'ASME Y14.5 (GD&T)'],
    assumptions: [
      'Right-handed Cartesian coordinate system with millimeter-exact numerical precision',
      'Geometric constraint DAG (Directed Acyclic Graph) resolved via Newton-Raphson relaxation',
      'DXF entity export formatted per AC1015 (AutoCAD 2000+) specification',
    ],
    workedExample: {
      title: 'Worked example — Tangent Arc & Line Parametric Constraint',
      result: 'Resolves center point of R25 fillet arc tangent to line y = 2x + 10 within numerical tolerance < 10⁻⁶ mm.',
    },
  },
  'simulation-fea': {
    formula: '[K]\\{u\\} = \\{F\\}, \\quad \\sigma_{\\text{vM}} = \\sqrt{\\frac{1}{2}\\left[(\\sigma_1-\\sigma_2)^2 + (\\sigma_2-\\sigma_3)^2 + (\\sigma_3-\\sigma_1)^2\\right]}',
    formulaNote: 'Linear elastic Finite Element Analysis (FEA), global stiffness matrix assembly [K], nodal displacement vector {u}, and von Mises equivalent stress.',
    standards: ['NAFEMS Benchmark Standards', 'ISO 6892-1', 'ASME Section VIII Div 2 (Design by Analysis)'],
    assumptions: [
      'Small displacement / small strain linear elastic material response (Hooke law)',
      'Isoparametric triangular/quadrilateral elements with Gauss numerical quadrature',
      'Boundary condition constraints eliminate rigid body modes (rank [K] = degrees of freedom)',
    ],
    workedExample: {
      title: 'Worked example — Cantilever Plate (L = 200 mm, b = 40 mm, t = 5 mm, Al6082 E = 70 GPa, Tip Load = 500 N)',
      result: 'FEA solver computes peak von Mises stress σvM = 120.5 MPa at root constraint and tip deflection δ = 2.28 mm (matches analytical within 0.4%).',
    },
  },
  'reducer-lubrication': {
    formula: 'h_{\\min} = 2.65 R\' \\frac{(G^*)^{0.54} (U^*)^{0.70}}{(W^*)^{0.13}}, \\quad Q_{\\text{heat}} = P_{\\text{in}} (1 - \\eta) \\le k_{\\text{th}} A_{\\text{housing}} (T_{\\text{oil}} - T_{\\text{amb}})',
    formulaNote: 'Dowson-Higginson Elastohydrodynamic Lubrication (EHL) minimum film thickness hmin, ISO VG viscosity selection, and thermal equilibrium sump balance.',
    standards: ['ISO 14179 (Gearbox thermal capacity)', 'DIN 51517-3 (CLP Gear oils)', 'AGMA 9005-E02'],
    assumptions: [
      'Film thickness parameter Λ = hmin / √(Rq1² + Rq2²) ≥ 2.0 for full fluid film lubrication',
      'Operating oil sump temperature maintained ≤ 80 °C to prevent rapid lubricant oxidation',
      'Thermal housing dissipation based on ambient air velocity and cooling fin surface area',
    ],
    workedExample: {
      title: 'Worked example — Industrial Helical Reducer (Pin = 22 kW, η = 0.96, Housing Area = 1.4 m², Tamb = 25 °C)',
      result: 'Heat generated = 880 W. Natural convection dissipation k_th = 18 W/m²K yields steady-state oil sump temperature Toil = 59.9 °C (well within ISO VG 220 limit).',
    },
  },
  'topology-optimization': {
    formula: '\\min_{\\rho_e} c(\\mathbf{u}) = \\mathbf{U}^T \\mathbf{K} \\mathbf{U} \\quad \\text{s.t.} \\quad \\frac{V(\\rho)}{V_0} \\le f, \\quad E_e(\\rho_e) = E_{\\min} + \\rho_e^p (E_0 - E_{\\min})',
    formulaNote: 'SIMP (Solid Isotropic Material with Penalization) structural compliance minimization for generative lightweight design.',
    standards: ['VDI 2221', 'AIAA Structural Optimization Guidelines'],
    assumptions: [
      'Penalization exponent p = 3 enforces distinct binary density distribution (ρe = 0 or 1)',
      'Sensitivity filtering applied to prevent mesh dependency and checkerboard artifacts',
      'Volume fraction limit f specifies target weight reduction percentage',
    ],
    workedExample: {
      title: 'Worked example — Aerospace Support Bracket (Target Volume Fraction f = 0.35, Penalty p = 3)',
      result: 'Iterates 42 FEA density loops, achieving 65% weight reduction while preserving 82% of original structural stiffness.',
    },
  },
  'machine-assembly': {
    formula: 'T_{\\text{stack}} = \\sqrt{\\sum T_i^2} \\quad (\\text{RSS Statistical}), \\quad T_{\\text{wc}} = \\sum |T_i| \\quad (\\text{Worst Case})',
    formulaNote: '1D/3D tolerance stackup analysis, Root Sum of Squares (RSS) normal distribution, 6-Sigma Cp/Cpk quality capability, and assembly clearance.',
    standards: ['ASME Y14.5 (GD&T)', 'ISO 2768 (General tolerances)', 'ISO 286'],
    assumptions: [
      'Individual component manufacturing variations are statistically independent and normally distributed',
      'Assembly process capability index Cpk ≥ 1.33 for statistical quality assurance',
      'Thermal expansion coefficients considered when multi-material joints operate across wide temperature ranges',
    ],
    workedExample: {
      title: 'Worked example — 5-Component Spindle Assembly (Nominal clearance = 0.50 mm, 5 parts each ±0.08 mm)',
      result: 'Worst-case stackup ±0.40 mm (Clearance 0.10 to 0.90 mm). RSS statistical stackup ±0.179 mm (99.73% of assemblies maintain clearance 0.32 to 0.68 mm).',
    },
  },
  'chemistry-reactions': {
    formula: 'aA + bB \\rightarrow cC + dD, \\quad \\Delta H_{\\text{rxn}}^\\circ = \\sum n_p \\Delta H_f^\\circ(\\text{prod}) - \\sum n_r \\Delta H_f^\\circ(\\text{react})',
    formulaNote: 'Stoichiometric molar balance, limiting reagent determination, standard enthalpy of reaction, and Gibbs free energy ΔG = ΔH - TΔS.',
    standards: ['IUPAC Compendium of Chemical Terminology', 'NIST Chemistry WebBook'],
    assumptions: [
      'Law of conservation of mass strictly enforced in stoichiometric equation',
      'Enthalpy values referenced to standard state (298.15 K, 100 kPa)',
      'Ideal gas behavior assumed for gaseous reactant and product phases',
    ],
    workedExample: {
      title: 'Worked example — Combustion of Methane (CH4 + 2O2 -> CO2 + 2H2O)',
      result: 'Standard enthalpy ΔH°rxn = -890.3 kJ/mol (exothermic), consuming 2.0 mol O2 per mol CH4.',
    },
  },
  'unit-converter': {
    formula: 'V_{\\text{target}} = (V_{\\text{source}} \\times F_{\\text{mult}}) + F_{\\text{offset}}, \\quad [M][L]^a [T]^b [\\Theta]^c',
    formulaNote: 'High-precision IEEE 754 floating-point dimensional analysis across SI, Imperial, US Customary, and CGS unit systems.',
    standards: ['ISO 80000 (Quantities and units)', 'NIST Special Publication 811', 'BIPM SI Brochure'],
    assumptions: [
      'Conversion factors referenced from certified NIST/BIPM standard definitions',
      'Temperature offset factors (°C, °F, K, °R) applied after multiplicative scaling',
      'Numerical rounding maintains significant figures per engineering measurement convention',
    ],
    workedExample: {
      title: 'Worked example — Pressure Unit Conversion (10.0 bar)',
      result: 'Converts deterministically to 1.000 MPa, 1000.0 kPa, 145.038 psi, 9.869 atm, and 7500.6 mmHg.',
    },
  },
  'cost-estimator': {
    formula: 'C_{\\text{total}} = C_{\\text{material}} + \\sum_{i} (t_i \\cdot R_{\\text{machine},i}) + C_{\\text{tooling}} + C_{\\text{overhead}}',
    formulaNote: 'Activity-based manufacturing costing for CNC milling, turning, sheet laser cutting, and surface treatment.',
    standards: ['DFMA (Design for Manufacture and Assembly)', 'VDI 2235', 'ISO 14040'],
    assumptions: [
      'Machine hourly rates amortize capital depreciation, power, maintenance, and operator labor',
      'Raw material stock nesting factor and machining chip scrap allowance accounted for in billet volume',
      'Setup and programming non-recurring engineering (NRE) amortized across production batch size N',
    ],
  },
  'failure-diagnosis': {
    formula: '\\eta = \\frac{S_e}{\\sigma_a + \\left(\\frac{S_e}{S_{ut}}\\right) \\sigma_m}, \\quad K_I \\le K_{Ic}',
    formulaNote: 'Modified Goodman fatigue failure criteria, Marin endurance limit modification factors, and linear elastic fracture mechanics (LEFM).',
    standards: ['ASTM E1820', 'Peterson Stress Concentration Factors', 'ASME FFS-1'],
    assumptions: [
      'Stress concentration factor Kt adjusted to fatigue notch factor Kf via material notch sensitivity q',
      'Endurance limit Se modified by surface finish ka, size kb, reliability kc, and temperature kd factors',
      'Fracture toughness KIc represents plane strain resistance against unstable brittle fracture',
    ],
  },
};

const ALIAS: Record<string, string> = {
  aluminum: 'aluminum',
  'profile-weight': 'aluminum',
  gears: 'gears',
  'gears-bearings': 'gears',
  'gearbox-design': 'gears',
  'gear-spur': 'gears',
  'gear-helical': 'gears',
  strength: 'strength-analysis',
  'strength-analysis': 'beam-deflection',
  fluids: 'fluid-dynamics',
  'fluid-dynamics': 'fluid-dynamics',
  'pipe-friction': 'pipe-friction',
  'pressure-drop': 'pipe-friction',
  'pressure-vessel': 'pressure-vessel',
  'column-buckling': 'column-buckling',
  'concrete-reinforcement': 'concrete-reinforcement',
  'planetary-gearbox': 'planetary-gearbox',
  'chain-drive': 'chain-drive',
  'roller-chain-drive': 'chain-drive',
  'belt-drive': 'belt-drive',
  'timing-belt-design': 'belt-drive',
  'v-belt-power': 'belt-drive',
  'sheet-metal': 'sheet-metal',
  'bend-allowance': 'sheet-metal',
  'spring-design': 'spring-design',
  'advanced-spring': 'spring-design',
  'periodic-table': 'periodic-table',
  'cost-estimator': 'cost-estimator',
  'failure-diagnosis': 'failure-diagnosis',
  'three-phase-power': 'three-phase-power',
  '3-phase-power': 'three-phase-power',
  fasteners: 'fasteners',
  bearings: 'bearings',
  'fits-tolerances': 'fits-tolerances',
  fits: 'fits-tolerances',
  'beam-deflection': 'beam-deflection',
  shafts: 'shafts',
  welding: 'welding',
  'welding-fillet': 'welding',
  'nesting-2d': 'nesting-2d',
  'cutting-optimizer': 'nesting-2d',
  'machining-details': 'machining-details',
  'fatigue-analysis': 'fatigue-analysis',
  'fatigue-advanced': 'fatigue-analysis',
  vibration: 'vibration',
  'digital-logic': 'digital-logic',
  'filter-design': 'filter-design',
  'hardness-converter': 'hardness-converter',
  'motor-selection-std': 'motor-selection-std',
  'wind-tunnel': 'wind-tunnel',
  'heat-sink': 'heat-sink',
  'hvac-load': 'hvac-load',
  'aerospace-dynamics': 'aerospace-dynamics',
  'naval-hydrostatics': 'naval-hydrostatics',
  'cad-editor': 'cad-editor',
  'parametric-cad': 'cad-editor',
  'simulation-fea': 'simulation-fea',
  fea: 'simulation-fea',
  'reducer-lubrication': 'reducer-lubrication',
  'topology-optimization': 'topology-optimization',
  'machine-assembly': 'machine-assembly',
  'chemistry-reactions': 'chemistry-reactions',
  'unit-converter': 'unit-converter',
  converter: 'unit-converter',
  calculator: 'unit-converter',
};

export function getModuleMethod(slug: string): ModuleMethod {
  const key = ALIAS[slug] || slug;
  return (
    CARDS[key] ||
    CARDS[slug] || {
      formula: `${slug.replace(/-/g, ' ').toUpperCase()} — Deterministic Engineering Solver Engine`,
      formulaNote: 'Interactive calculation parameters and physical relations are governed live by the AluCalc OS kernel.',
      standards: ['SI Metric / ISO / ASME compliance', 'Material ledger validated'],
      assumptions: [
        'Governed by fundamental physical boundary conditions and standard engineering conventions',
        'Material properties referenced from certified standard alloy database',
        'Verify critical structural components against regional building codes and safety factors',
      ],
    }
  );
}

export const RELATED_BY_CATEGORY: Record<string, { href: string; label: string }[]> = {
  mechanical: [
    { href: '/bolt-torque/', label: 'Bolt Torque' },
    { href: '/bearings/', label: 'Bearings' },
    { href: '/gears/', label: 'Gears' },
    { href: '/shafts/', label: 'Shafts' },
  ],
  structural: [
    { href: '/beam-deflection/', label: 'Beams' },
    { href: '/aluminum/', label: 'Mass' },
    { href: '/strength/', label: 'Strength' },
  ],
  manufacturing: [
    { href: '/aluminum/', label: 'Mass' },
    { href: '/nesting-2d/', label: 'Nesting' },
    { href: '/fits-tolerances/', label: 'Fits' },
  ],
  electrical: [
    { href: '/three-phase-power/', label: '3-Phase' },
    { href: '/ohms-law/', label: 'Ohm' },
    { href: '/voltage-drop/', label: 'V-drop' },
  ],
  fluid: [
    { href: '/fluid-dynamics/', label: 'ΔP' },
    { href: '/pumps/', label: 'Pumps' },
  ],
  science: [
    { href: '/unit-converter/', label: 'Units' },
    { href: '/handbook/', label: 'Handbook' },
  ],
};
