const fs = require('fs');
const path = require('path');

const calculatorsPath = path.join(__dirname, '../src/data/seo-calculators/calculators.json');
let calculators = JSON.parse(fs.readFileSync(calculatorsPath, 'utf8'));

// Route assignments string rules
function getModuleRoute(slug) {
  if (slug.includes('bolt') || slug.includes('fastener')) return '/en/fasteners';
  if (slug.includes('gear')) return '/en/gears';
  if (slug.includes('bearing')) return '/en/bearings';
  if (slug.includes('beam') || slug.includes('truss') || slug.includes('cantilever')) return '/en/beam-deflection';
  if (slug.includes('weld')) return '/en/welding';
  if (slug.includes('shaft') || slug.includes('keyway') || slug.includes('spline')) return '/en/machine-assembly';
  if (slug.includes('spring')) return '/en/engineering-selection';
  if (slug.includes('buckle') || slug.includes('buckling')) return '/en/strength';
  if (slug.includes('pipe') || slug.includes('pump') || slug.includes('flow') || slug.includes('water') || slug.includes('pneumatic')) return '/en/fluids';
  if (slug.includes('motor') || slug.includes('stepper')) return '/en/motor-selection';
  if (slug.includes('cnc') || slug.includes('mill') || slug.includes('drill')) return '/en/manufacturing';
  if (slug.includes('sheet') || slug.includes('bend')) return '/en/sheet-metal';
  if (slug.includes('thermal') || slug.includes('heat') || slug.includes('temp') || slug.includes('peltier') || slug.includes('cool')) return '/en/thermal';
  if (slug.includes('volt') || slug.includes('amp') || slug.includes('pcb') || slug.includes('rlc') || slug.includes('kvar') || slug.includes('thd') || slug.includes('led') || slug.includes('cable') || slug.includes('react')) return '/en/calculator';
  if (slug.includes('fatigue')) return '/en/fatigue';
  if (slug.includes('concrete')) return '/en/concrete-reinforcement';
  if (slug.includes('corrosion')) return '/en/chemistry-reactions';
  if (slug.includes('stoich')) return '/en/chemistry-reactions';
  if (slug.includes('projectile') || slug.includes('gravity') || slug.includes('sound')) return '/en/physics-solver';
  if (slug.includes('period')) return '/en/periodic-table';

  return '/workspace'; // fallback
}

// 1. Update existing mappings
calculators = calculators.map(calc => {
  calc.cta.link = getModuleRoute(calc.slug);
  calc.cta.label = "Open OS Module";
  return calc;
});

// 2. Add 20 new highly searched SEO modules
const newSEOItems = [
  {
    id: "bernoulli-equation", category: "fluid", title: "Bernoulli Equation Calculator", slug: "bernoulli-equation",
    meta: { title: "Bernoulli Equation Calculator | AluCalc", description: "Calculate fluid pressure, velocity, or elevation using Bernoulli's principle." },
    seo: { h1: "Bernoulli Principle Solver", intro: "Energy conservation in fluid dynamics.", formula: "P + 0.5ρv² + ρgh = constant", variables: { "P": "Pressure", "v": "Velocity", "h": "Elevation" }, practical: "Pipe flow.", example: "Venturi tube." },
    cta: { label: "Open OS Module", link: "/en/fluids" }
  },
  {
    id: "snells-law", category: "science", title: "Snell's Law Calculator", slug: "snells-law",
    meta: { title: "Snell's Law Optics | AluCalc", description: "Calculate refraction angles and indices." },
    seo: { h1: "Optics Snell's Law Calculator", intro: "Light bending across mediums.", formula: "n1*sin(θ1) = n2*sin(θ2)", variables: { "n": "Index", "θ": "Angle" }, practical: "Lens design.", example: "Air path to Glass." },
    cta: { label: "Open OS Module", link: "/en/physics-solver" }
  },
  {
    id: "poiseuille-flow", category: "fluid", title: "Hagen-Poiseuille Flow", slug: "poiseuille-flow",
    meta: { title: "Poiseuille Pipe Flow | AluCalc", description: "Calculate laminar flow pressure drop." },
    seo: { h1: "Hagen-Poiseuille Equation", intro: "Viscous fluid resistance.", formula: "ΔP = 8μLQ/(πR^4)", variables: { "μ": "Viscosity", "Q": "Rate", "R": "Radius" }, practical: "Microfluidics.", example: "Oil pipelines." },
    cta: { label: "Open OS Module", link: "/en/fluids" }
  },
  {
    id: "capacitive-reactance", category: "electrical", title: "Capacitor Energy / Reactance", slug: "capacitive-reactance",
    meta: { title: "Capacitor Engergy | AluCalc", description: "Solve capacitor stored energy." },
    seo: { h1: "Capacitor Stored Energy", intro: "Electric field storage.", formula: "U = 0.5CV²", variables: { "C": "Farads", "V": "Volts" }, practical: "Power supply.", example: "Flash lamps." },
    cta: { label: "Open OS Module", link: "/en/calculator" }
  },
  {
    id: "friction-factor-colebrook", category: "fluid", title: "Colebrook Friction Factor", slug: "friction-factor-colebrook",
    meta: { title: "Colebrook Fricton | AluCalc", description: "Determine pipe friction factor." },
    seo: { h1: "Colebrook-White Estimator", intro: "Turbulent flow pipes friction.", formula: "1/√f = -2log(ε/3.7D + 2.51/Re√f)", variables: { "f": "Friction", "Re": "Reynolds", "ε": "Roughness" }, practical: "HVAC.", example: "Iterative solver." },
    cta: { label: "Open OS Module", link: "/en/fluids" }
  },
  {
    id: "hookes-law", category: "mechanical", title: "Hooke's Law Extension", slug: "hookes-law",
    meta: { title: "Hooke's Law | AluCalc", description: "Calculate elastic force and extension." },
    seo: { h1: "Linear Elastic Spring Force", intro: "Stress vs Strain in elastic limit.", formula: "F = -kx", variables: { "F": "Force", "k": "Stiffness", "x": "Displacement" }, practical: "Materials testing.", example: "Rubber bands." },
    cta: { label: "Open OS Module", link: "/en/strength" }
  },
  {
    id: "coulombs-law", category: "science", title: "Coulomb's Law", slug: "coulombs-law",
    meta: { title: "Coulomb's Law Force | AluCalc", description: "Calculate electrostatic force." },
    seo: { h1: "Electrostatic Force Calculator", intro: "Force between point charges.", formula: "F = k*|q1*q2|/r²", variables: { "q": "Charge", "r": "Distance" }, practical: "Particle physics.", "example": "Electrons." },
    cta: { label: "Open OS Module", link: "/en/physics-solver" }
  },
  {
    id: "mohrs-circle", category: "mechanical", title: "Mohr's Circle Solver", slug: "mohrs-circle",
    meta: { title: "Mohr's Circle | AluCalc", description: "Principal stresses and max shear." },
    seo: { h1: "2D Mohr's Circle Stress", intro: "Transform planar stress tensor.", formula: "σ1,2 = (σx+σy)/2 ± √(...)", variables: { "σx": "Normal X", "τxy": "Shear" }, practical: "Failure theories.", "example": "Von Mises yield." },
    cta: { label: "Open OS Module", link: "/en/strength" }
  },
  {
    id: "mach-number", category: "fluid", title: "Mach Number & Sound Speed", slug: "mach-number",
    meta: { title: "Mach Number | AluCalc", description: "Compressible aerodynamics speed." },
    seo: { h1: "Aerodynamic Mach Calculator", intro: "Determine speed regimes.", formula: "M = v / c", variables: { "v": "Object Spd", "c": "Speed of Sound" }, practical: "Aviation.", "example": "Transonic drag." },
    cta: { label: "Open OS Module", link: "/en/aerospace" }
  },
  {
    id: "drag-force", category: "fluid", title: "Aerodynamic Drag Force", slug: "drag-force",
    meta: { title: "Drag Force | AluCalc", description: "Calculate aerodynamic resistance." },
    seo: { h1: "Fluid Drag Force Calc", "intro": "Losses in motion.", "formula": "Fd = 0.5ρv²CdA", "variables": { "Cd": "Drag Coeff", "A": "Area" }, "practical": "Automotive aero.", "example": "Race cars." },
    cta: { label: "Open OS Module", link: "/en/aerospace" }
  },
  {
    id: "lift-force", category: "fluid", title: "Aero Lift Force", slug: "lift-force",
    meta: { title: "Lift Force | AluCalc", description: "Calculate airfoil lifting capability." },
    seo: { h1: "Airfoil Lift Calculator", "intro": "Lift generation analysis.", "formula": "L = 0.5ρv²ClA", "variables": { "Cl": "Lift Coeff", "v": "Velocity" }, "practical": "UAV Wings.", "example": "NACA Profiles." },
    cta: { label: "Open OS Module", link: "/en/aerospace" }
  },
  {
    id: "gearbox-ratio", category: "mechanical", title: "Complex Gearbox Ratio", slug: "gearbox-ratio",
    meta: { title: "Gear Train Ratio | AluCalc", description: "Multi-stage gearbox ratio resolver." },
    seo: { h1: "Multi-Stage Gear Train", "intro": "Calculate total speed reduction.", "formula": "i = (N2/N1)*(N4/N3)...", "variables": { "N": "Teeth count" }, "practical": "Transmissions.", "example": "3-stage reducer." },
    cta: { label: "Open OS Module", link: "/en/gearbox-design" }
  },
  {
    id: "torque-converter", category: "mechanical", title: "Torque Converter", slug: "torque-converter",
    meta: { title: "Torque Converter | AluCalc", description: "Fluid coupling multiplication." },
    seo: { h1: "Torque Multiplication Finder", "intro": "Hydraulic coupling characteristics.", "formula": "TR = T_turb/T_pump", "variables": { "TR": "Torque Ratio" }, "practical": "Heavy equip.", "example": "Stall phase." },
    cta: { label: "Open OS Module", link: "/en/motor-selection" }
  },
  {
    id: "concrete-volume", category: "civil", title: "Concrete Volume Estimator", slug: "concrete-volume",
    meta: { title: "Concrete Vol | AluCalc", description: "Volume and bags required for slabs." },
    seo: { h1: "Concrete Pour Estimator", "intro": "Construction site materials planning.", "formula": "Vol = L*W*D", "variables": { "L": "Length", "D": "Depth" }, "practical": "Foundations.", "example": "Add 5% waste." },
    cta: { label: "Open OS Module", link: "/en/concrete-reinforcement" }
  },
  {
    id: "steel-weight", category: "structural", title: "Steel Profile Weight", slug: "steel-weight",
    meta: { title: "Steel Weight | AluCalc", description: "Quick estimation of structural steel." },
    seo: { h1: "Structural Steel Estimator", "intro": "Calculate mass of I-beams and tubes.", "formula": "W = Volume * ρ", "variables": { "ρ": "Density (7850 kg/m³)" }, "practical": "Logistics.", "example": "HEA Profiles." },
    cta: { label: "Open OS Module", link: "/en/aluminum" }
  },
  {
    id: "ph-calculator", category: "science", title: "pH & pOH Calculator", slug: "ph-calculator",
    meta: { title: "pH Solver | AluCalc", description: "Calculate pH from ion concentrations." },
    seo: { h1: "Chemical pH / Acid Base", "intro": "Determine acidity and alkalinity.", "formula": "pH = -log[H+]", "variables": { "[H+]": "Hydronium Molarity" }, "practical": "Water treatment.", "example": "Neutral 7.0." },
    cta: { label: "Open OS Module", link: "/en/chemistry-reactions" }
  },
  {
    id: "half-life-decay", category: "science", title: "Radioactive Half-Life", slug: "half-life-decay",
    meta: { title: "Half-Life Decay | AluCalc", description: "Nuclear and chemical decay rates." },
    seo: { h1: "Exponential Decay Solver", "intro": "Material degradation over time.", "formula": "N(t) = N0 * (1/2)^(t/t1/2)", "variables": { "t": "Time", "t1/2": "Half-life" }, "practical": "Isotopes.", "example": "Carbon-14." },
    cta: { label: "Open OS Module", link: "/en/chemistry-reactions" }
  },
  {
    id: "ideal-gas-law", category: "science", title: "Ideal Gas Law", slug: "ideal-gas-law",
    meta: { title: "Ideal Gas PV=nRT | AluCalc", description: "Calculate gas properties." },
    seo: { h1: "Gas State Equation", "intro": "Thermodynamics gas solver.", "formula": "PV = nRT", "variables": { "P": "Pressure", "T": "Temperature (K)" }, "practical": "Compressors.", "example": "Standard STP." },
    cta: { label: "Open OS Module", link: "/en/chemistry-reactions" }
  },
  {
    id: "genetic-cross", category: "science", title: "Punnett Square Probabilities", slug: "genetic-cross",
    meta: { title: "Punnett Gen | AluCalc", description: "Allel inheritance predictor." },
    seo: { h1: "Mendelian Genetic Solver", "intro": "Trait probability across generations.", "formula": "P(phenotype) = %", "variables": { "Aa": "Heterozygous" }, "practical": "Biology.", "example": "Dihybrid crosses." },
    cta: { label: "Open OS Module", link: "/en/biology-genetics" }
  },
  {
    id: "kinematic-equations", category: "science", title: "SUVAT Kinematics", slug: "kinematic-equations",
    meta: { title: "SUVAT Solver | AluCalc", description: "1D Motion kinematics." },
    seo: { h1: "Physics 1D Motion Finder", "intro": "Resolve velocity, acceleration, distance.", "formula": "s = ut + 0.5at²", "variables": { "u": "Init Spd", "a": "Accel" }, "practical": "Vehicle crashing.", "example": "Free fall gravity." },
    cta: { label: "Open OS Module", link: "/en/kinematics" }
  }
];

calculators = [...calculators, ...newSEOItems];

fs.writeFileSync(calculatorsPath, JSON.stringify(calculators, null, 2), 'utf8');

console.log("Updated CTA Links & Added 20 new highly searched SEO modules (Total: " + calculators.length + ")");
