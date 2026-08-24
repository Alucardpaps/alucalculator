import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const trUrl = pathToFileURL(path.join(__dirname, '..', 'langs', 'tr-academy-extras.mjs')).href;
const tr = await import(trUrl);

// EN walkthroughs from source (hardcoded from academyEngineWalkthroughs.ts)
const walkthroughs = {
  'engineering-units-and-standards': {
    engineName: 'Unit Converter Kernel',
    sourceFile: 'schemas-v2/unit-converter',
    inputs: ['Source value', 'Source unit', 'Target unit category'],
    outputs: ['Converted value', 'SI-normalized value'],
    steps: [
      { title: 'Normalize to SI base', detail: 'Every input is converted to an SI base quantity (m, kg, s, A, K, mol, cd) before any math runs.', formula: 'value_SI = value × factor' },
      { title: 'Apply category guard', detail: 'Length cannot convert to force — the engine validates dimensional homogeneity and rejects mixed categories.' },
      { title: 'Precision rounding', detail: 'Output is rounded to significant figures based on input precision, matching workshop drawing conventions.' },
    ],
  },
  'fundamentals-of-statics': {
    engineName: 'Equilibrium Solver',
    sourceFile: 'schemas/truss-analysis',
    inputs: ['Joint coordinates', 'Member stiffness', 'Applied loads', 'Support types'],
    outputs: ['Reaction forces', 'Member axial forces', 'Equilibrium check (ΣF, ΣM)'],
    steps: [
      { title: 'Build FBD matrix', detail: 'Each joint becomes a node; applied loads and unknown reactions are assembled into a force vector.' },
      { title: 'Solve equilibrium', detail: 'The engine enforces ΣFx = 0, ΣFy = 0 at every free joint — the same rules you derive by hand.', formula: 'ΣF = 0, ΣM = 0' },
      { title: 'Flag unstable systems', detail: 'Mechanisms (zero determinant) are detected and reported instead of returning meaningless numbers.' },
    ],
  },
  'introduction-to-machine-elements': {
    engineName: 'Machine Elements Map',
    sourceFile: 'schemas-v2/fasteners',
    inputs: ['Element type', 'Load path', 'Operating speed'],
    outputs: ['Recommended calculator module', 'Design check summary'],
    steps: [
      { title: 'Classify the element', detail: 'Screws, bearings, gears, and shafts each route to a dedicated ISO/DIN calculation kernel in AluCalc OS.' },
      { title: 'Trace the load path', detail: 'Power flows Motor → Transmission → Bearing → Housing. Each interface uses a different element calculator.' },
      { title: 'Cross-link standards', detail: 'Thread geometry from ISO 965 feeds directly into the VDI 2230 preload engine — no manual re-entry.' },
    ],
  },
  'thread-geometry-standards': {
    engineName: 'Thread Geometry Engine',
    sourceFile: 'schemas/thread-geometry',
    inputs: ['Thread standard (M, UN, Tr)', 'Nominal diameter', 'Pitch', 'Tolerance class'],
    outputs: ['Pitch diameter d2', 'Minor diameter d1', 'Stress area As', 'Tap drill size'],
    steps: [
      { title: 'Resolve profile angles', detail: 'Metric (60°), Whitworth (55°), and ACME (29°) use different height and truncation formulas — the engine selects by standard.', formula: 'd2 = d − 0.6495P' },
      { title: 'Compute stress area', detail: 'Tensile stress area As uses ISO 898 pitch-diameter definition, not the physical minor diameter.', formula: 'As = π/4 × (d − 0.9382P)²' },
      { title: 'Feed fastener engine', detail: 'd2, As, and pitch are passed to the VDI 2230 torque kernel without manual copy-paste.' },
    ],
  },
  'how-to-calculate-bolt-torque': {
    engineName: 'VDI 2230 Fastener Engine',
    sourceFile: 'schemas-v2/fasteners + lib/fastener/sharedEngine.ts',
    inputs: ['Diameter d', 'Pitch P', 'Property class', 'Friction μ_thread, μ_head', 'Utilization v'],
    outputs: ['Pitch diameter d2', 'Stress area As', 'Preload F_M', 'Tightening torque M_A'],
    steps: [
      { title: 'Geometry from thread tables', detail: 'Pitch diameter and stress area are derived from ISO metric thread formulas, not nominal diameter alone.', formula: 'd2 = d − 0.6495P' },
      { title: 'Preload from yield utilization', detail: 'Allowable preload is a fraction v of proof stress × stress area — same as VDI 2230 simplified method.', formula: 'F_M = v × Rp0.2 × A_s' },
      { title: 'Torque with friction split', detail: 'Thread and head friction are separated. Head diameter D_km comes from ISO 4017 head-width tables.', formula: 'M_A = F_M × (0.16P + 0.58·d2·μ_t + D_km/2·μ_h)' },
      { title: 'Validate K-factor shortcut', detail: 'The simplified T = K·F·d is shown for comparison; the engine always uses the full VDI friction model.' },
    ],
  },
  'bearing-life-calculation-explained': {
    engineName: 'ISO 281 Bearing Life Engine',
    sourceFile: 'schemas-v2/bearings.tsx',
    inputs: ['Dynamic rating C', 'Radial load Fr', 'Axial load Fa', 'Speed rpm', 'Bearing type (ball/roller)'],
    outputs: ['Equivalent load P', 'Basic life L10 (Mrev)', 'Life L10h (hours)'],
    steps: [
      { title: 'Equivalent load P', detail: 'Radial and axial loads combine using X and Y factors from Fa/Fr ratio and Fa/C0 — SKF methodology.', formula: 'P = X·Fr + Y·Fa' },
      { title: 'Basic rating life', detail: 'Ball bearings use p = 3, roller bearings p = 10/3 per ISO 281.', formula: 'L10 = (C/P)^p' },
      { title: 'Convert to hours', detail: 'Revolutions are converted using operating speed.', formula: 'L10h = 10⁶ / (60 × n) × L10' },
      { title: 'Safety warnings', detail: 'P > C triggers a critical warning; L10h < 1000 h suggests upsizing the bearing.' },
    ],
  },
  'motor-power-calculation': {
    engineName: 'Power Transmission Engine',
    sourceFile: 'schemas-v2/belt-drive.tsx',
    inputs: ['Torque T', 'Speed n', 'Efficiency η', 'Service factor'],
    outputs: ['Shaft power P', 'Required motor kW', 'Belt tension'],
    steps: [
      { title: 'Mechanical power', detail: 'Rotational power links torque and angular speed.', formula: 'P = T × ω = T × 2πn/60' },
      { title: 'Apply losses', detail: 'Belt, gearbox, and bearing efficiencies multiply into a total η — the engine applies each stage sequentially.' },
      { title: 'Service factor margin', detail: 'Intermittent vs continuous duty adds a safety multiplier before motor catalog selection.' },
    ],
  },
  'mechanics-of-materials-fundamentals': {
    engineName: 'Stress–Strain Engine',
    sourceFile: 'schemas/strength-analysis',
    inputs: ['Force F', 'Cross-section area A', 'Elastic modulus E', 'Length L'],
    outputs: ['Normal stress σ', 'Strain ε', 'Elongation δ'],
    steps: [
      { title: 'Normal stress', detail: 'Axial load divided by area — the foundation of all failure criteria.', formula: 'σ = F/A' },
      { title: "Hooke's law strain", detail: 'Elastic deformation stays linear until yield.', formula: 'ε = σ/E' },
      { title: 'Deformation', detail: 'Total elongation integrates strain over gauge length.', formula: 'δ = F·L / (A·E)' },
    ],
  },
  'mohrs-circle-stress-analysis': {
    engineName: 'Mohr Circle Kernel',
    sourceFile: 'schemas/mohrs-circle',
    inputs: ['σx', 'σy', 'τxy', 'Rotation angle θ'],
    outputs: ['Principal stresses σ1, σ2', 'Max shear τ_max', 'Plane stress at θ'],
    steps: [
      { title: 'Center and radius', detail: 'The circle center is the average normal stress; radius comes from shear and normal stress difference.', formula: 'C = (σx+σy)/2, R = √[(σx−σy)/2)² + τxy²]' },
      { title: 'Principal stresses', detail: 'Maximum and minimum normal stresses occur where shear is zero.', formula: 'σ1,2 = C ± R' },
      { title: 'Interactive rotation', detail: 'The academy lab rotates θ in real time — the same transform the OS kernel uses for plane-stress probes.' },
    ],
  },
  'torsion-and-buckling-mechanics': {
    engineName: 'Stability Engine',
    sourceFile: 'schemas/column-buckling',
    inputs: ['Length L', 'Elastic modulus E', 'Second moment I', 'End fixity K', 'Applied load P'],
    outputs: ['Critical buckling load Pcr', 'Slenderness ratio λ', 'Safety factor'],
    steps: [
      { title: 'Euler critical load', detail: 'Slender columns fail by instability, not material yield.', formula: 'Pcr = π²EI / (KL)²' },
      { title: 'Effective length K', detail: 'Pinned-pinned K=1, fixed-free K=2 — the engine maps end conditions to K automatically.' },
      { title: 'Torsion check', detail: 'For shafts, max shear from torsion is computed separately: τ = T·r/J.' },
    ],
  },
  'beam-deflection-formula-explained': {
    engineName: 'Beam Deflection Engine',
    sourceFile: 'schemas-v2/beam-deflection.tsx',
    inputs: ['Span L', 'Point load P', 'Modulus E', 'Profile type & dimensions', 'Support condition'],
    outputs: ['Moment of inertia Ix', 'Deflection δ', 'Bending stress σ', 'Stiffness k'],
    steps: [
      { title: 'Section property Ix', detail: 'I-beam, box, and channel profiles each use composite rectangle formulas — not a single table lookup.', formula: 'Ix = Σ(I_rect + A·d²)' },
      { title: 'Support-specific deflection', detail: 'Simply supported center load vs cantilever end load use different coefficients.', formula: 'δ = PL³/(48EI) or PL³/(3EI)' },
      { title: 'Bending stress', detail: 'Maximum moment maps to fiber stress at the outer fiber.', formula: 'σ = M·y/I' },
      { title: 'Stiffness output', detail: 'Force per unit deflection helps spring-rate and vibration checks.', formula: 'k = P/δ' },
    ],
  },
  'pressure-drop-calculation-guide': {
    engineName: 'Darcy-Weisbach Flow Engine',
    sourceFile: 'schemas-v2/fluid-flow.tsx',
    inputs: ['Pipe diameter D', 'Length L', 'Flow rate Q', 'Fluid density ρ', 'Viscosity μ', 'Roughness ε'],
    outputs: ['Velocity V', 'Reynolds number Re', 'Friction factor f', 'Pressure drop ΔP'],
    steps: [
      { title: 'Velocity from flow rate', detail: 'Continuity converts volumetric flow to mean pipe velocity.', formula: 'V = Q / A' },
      { title: 'Reynolds number', detail: 'Laminar vs turbulent regime determines friction model.', formula: 'Re = ρVD/μ' },
      { title: 'Friction factor f', detail: 'Swamee–Jain explicit approximation solves Colebrook for turbulent pipe flow.' },
      { title: 'Darcy-Weisbach head loss', detail: 'The engine returns ΔP in Pa — same formula used for pump sizing.', formula: 'ΔP = f · (L/D) · (ρV²/2)' },
    ],
  },
  'chip-breaker-logic': {
    engineName: 'Machining Parameter Engine',
    sourceFile: 'schemas/machining-grinding',
    inputs: ['Insert geometry', 'Feed f', 'Depth of cut ap', 'Workpiece material'],
    outputs: ['Chip thickness h', 'Recommended breaker type', 'Surface finish estimate'],
    steps: [
      { title: 'Chip thickness estimate', detail: 'Uncut chip thickness drives breaker selection — too thin causes rubbing, too thick causes nesting.', formula: 'h ≈ f · sin(κ)' },
      { title: 'Breaker geometry match', detail: 'J-section, T-section, and W-section breakers map to feed/speed envelopes from Kyocera catalogs.' },
      { title: 'Finish correlation', detail: 'Feed and nose radius feed a theoretical Ra estimate for QC planning.' },
    ],
  },
};

fs.writeFileSync(path.join(__dirname, 'en-walkthroughs.json'), JSON.stringify(walkthroughs, null, 2));
console.log('Wrote en-walkthroughs.json, tr walkthroughs', Object.keys(tr.walkthroughs).length);
