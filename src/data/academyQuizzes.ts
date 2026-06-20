export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const ACADEMY_QUIZZES: Record<string, QuizQuestion[]> = {
  'engineering-units-and-standards': [
    {
      id: 'u1',
      question: 'How many millimeters equal 1 inch per ISO definition?',
      options: ['25.0 mm', '25.4 mm', '26.0 mm', '2.54 mm'],
      correctIndex: 1,
      explanation: 'The exact conversion is 25.4 mm/in — AluCalc uses this constant in the Unit Converter kernel.',
    },
    {
      id: 'u2',
      question: 'Which mistake caused the Mars Climate Orbiter failure?',
      options: ['Wrong bolt torque', 'Imperial vs metric unit mix-up', 'Incorrect bearing life', 'Euler buckling'],
      correctIndex: 1,
      explanation: 'Navigation software used metric newtons while thruster data was in pound-force.',
    },
    {
      id: 'u3',
      question: 'SI base unit of force is:',
      options: ['Kilogram (kg)', 'Newton (N)', 'Pound (lb)', 'Joule (J)'],
      correctIndex: 1,
      explanation: 'N = kg·m/s². Mass (kg) and force (N) must never be swapped in calculations.',
    },
  ],
  'fundamentals-of-statics': [
    {
      id: 's1',
      question: 'Static equilibrium requires:',
      options: ['ΣF ≠ 0 only', 'ΣM ≠ 0 only', 'ΣF = 0 and ΣM = 0', 'Zero velocity only'],
      correctIndex: 2,
      explanation: 'Both force and moment balance are required for a rigid body at rest.',
    },
    {
      id: 's2',
      question: 'First step in any statics problem:',
      options: ['Apply Euler buckling', 'Draw a Free Body Diagram', 'Calculate L10 life', 'Select bolt grade'],
      correctIndex: 1,
      explanation: 'The FBD isolates the body and shows all external forces and moments.',
    },
    {
      id: 's3',
      question: 'A 100 N upward load balanced by reaction R downward means R equals:',
      options: ['50 N', '100 N', '200 N', '0 N'],
      correctIndex: 1,
      explanation: 'ΣFy = 100 − R = 0 → R = 100 N. Same logic the truss solver uses.',
    },
  ],
  'how-to-calculate-bolt-torque': [
    {
      id: 'b1',
      question: 'What does the K factor represent in T = K·F·d?',
      options: ['Bolt grade', 'Combined friction/nut factor', 'Thread pitch', 'Safety factor'],
      correctIndex: 1,
      explanation: 'K lumps thread and head friction. AluCalc splits them explicitly in the VDI engine.',
    },
    {
      id: 'b2',
      question: 'Over-torquing a bolt typically causes:',
      options: ['Higher fatigue life', 'Yield or thread stripping', 'Lower preload', 'Better sealing only'],
      correctIndex: 1,
      explanation: 'Exceeding yield causes plastic deformation — preload may actually drop after overtightening.',
    },
    {
      id: 'b3',
      question: 'Lubrication on threads generally:',
      options: ['Increases required torque for same preload', 'Decreases required torque', 'Has no effect', 'Doubles stress area'],
      correctIndex: 1,
      explanation: 'Lower friction μ means less torque needed for the same clamp force F.',
    },
  ],
  'bearing-life-calculation-explained': [
    {
      id: 'br1',
      question: 'L10 life means:',
      options: ['10% fail before this life', '90% fail before this life', '100% survival', '10 hours minimum'],
      correctIndex: 0,
      explanation: 'ISO 281: 90% reliability — 10% of bearings fail before L10 under equivalent load P.',
    },
    {
      id: 'br2',
      question: 'For ball bearings, life exponent p in L10 = (C/P)^p is:',
      options: ['3', '10/3', '2', '1.5'],
      correctIndex: 0,
      explanation: 'Ball bearings use p = 3; roller bearings use p = 10/3 per ISO 281.',
    },
    {
      id: 'br3',
      question: 'When P > C (dynamic rating), the bearing:',
      options: ['Is oversized', 'Will fail rapidly — critical warning', 'Has infinite life', 'Needs lubrication only'],
      correctIndex: 1,
      explanation: 'AluCalc flags P > C as critical — equivalent load exceeds catalog rating.',
    },
  ],
  'beam-deflection-formula-explained': [
    {
      id: 'bm1',
      question: 'For center-loaded simply supported beam, deflection scales with L as:',
      options: ['L', 'L²', 'L³', 'L⁴'],
      correctIndex: 3,
      explanation: 'δ = PL³/(48EI) — span is the most sensitive variable in serviceability checks.',
    },
    {
      id: 'bm2',
      question: 'Doubling the moment of inertia I:',
      options: ['Doubles deflection', 'Halves deflection', 'Quarters deflection', 'No change'],
      correctIndex: 1,
      explanation: 'δ ∝ 1/I — stiffer section (larger I) reduces deflection proportionally.',
    },
    {
      id: 'bm3',
      question: 'Euler-Bernoulli beam theory assumes:',
      options: ['Large deformations', 'Linear elastic, slender beams', 'Plastic collapse', 'Torsion only'],
      correctIndex: 1,
      explanation: 'Small rotations, elastic material — the basis of Roark and AISC deflection limits.',
    },
  ],
  'pressure-drop-calculation-guide': [
    {
      id: 'p1',
      question: 'Darcy-Weisbach equation relates ΔP to:',
      options: ['Voltage and current', 'Friction factor, L/D, and velocity head', 'Bolt preload', 'Gear ratio'],
      correctIndex: 1,
      explanation: 'ΔP = f·(L/D)·(ρV²/2) — used by the fluid-flow engine for pump sizing.',
    },
    {
      id: 'p2',
      question: 'Reynolds number Re > 4000 generally indicates:',
      options: ['Laminar flow', 'Turbulent flow', 'Static fluid', 'Vacuum'],
      correctIndex: 1,
      explanation: 'Re = ρVD/μ — regime determines which friction factor correlation applies.',
    },
    {
      id: 'p3',
      question: 'Doubling pipe diameter at same flow rate:',
      options: ['Increases velocity 4×', 'Decreases velocity 4×', 'No velocity change', 'Doubles ΔP'],
      correctIndex: 1,
      explanation: 'V = Q/A and A ∝ D² — larger pipe dramatically cuts velocity and usually ΔP.',
    },
  ],
  'mohrs-circle-stress-analysis': [
    {
      id: 'm1',
      question: 'Principal stresses occur on planes where:',
      options: ['Shear is maximum', 'Shear is zero', 'Normal stress is zero', 'Torsion is zero'],
      correctIndex: 1,
      explanation: 'On principal planes τ = 0 — Mohr circle radius gives σ1, σ2 from center ± R.',
    },
    {
      id: 'm2',
      question: 'Maximum shear stress equals:',
      options: ['σ1 + σ2', 'Radius of Mohr circle', 'σ1 only', 'Zero always'],
      correctIndex: 1,
      explanation: 'τ_max = R = √[(σx−σy)/2)² + τxy²] — same formula in the OS Mohr kernel.',
    },
    {
      id: 'm3',
      question: 'Rotating the stress element changes:',
      options: ['Principal stresses', 'Plane stress components σ, τ at that angle', 'Elastic modulus', 'Yield strength'],
      correctIndex: 1,
      explanation: 'σ1, σ2 are invariant; only σ(θ) and τ(θ) change with orientation.',
    },
  ],
  'introduction-to-machine-elements': [
    {
      id: 'me1',
      question: 'Which element primarily transmits rotational power between shafts?',
      options: ['Bearing', 'Gear or belt drive', 'Washer', 'Keyway only'],
      correctIndex: 1,
      explanation: 'Power transmission elements (gears, belts, chains) convert torque and speed between shafts.',
    },
    {
      id: 'me2',
      question: 'Why use standardized machine elements?',
      options: ['Higher cost', 'Interchangeability and catalog sourcing', 'Eliminates all analysis', 'Prevents maintenance'],
      correctIndex: 1,
      explanation: 'ISO/DIN standard elements can be replaced from global catalogs without custom manufacturing.',
    },
    {
      id: 'me3',
      question: 'Design for disassembly is important because:',
      options: ['Joints should never be serviced', 'Maintenance and inspection require separable assemblies', 'Welds are always weaker', 'Bolts are obsolete'],
      correctIndex: 1,
      explanation: 'Unless a joint is intentionally permanent, engineers plan for future disassembly and replacement.',
    },
  ],
  'thread-geometry-standards': [
    {
      id: 'tg1',
      question: 'ISO metric and UN threads use a profile angle of:',
      options: ['55°', '60°', '30°', '90°'],
      correctIndex: 1,
      explanation: 'Metric (M) and Unified National (UN) threads both use 60° — Whitworth uses 55°.',
    },
    {
      id: 'tg2',
      question: 'Tolerance 4h compared to 6g is:',
      options: ['Looser fit', 'Tighter precision fit', 'Same fit', 'Only for pipe threads'],
      correctIndex: 1,
      explanation: '4h is a tighter tolerance used in high-vibration or precision assemblies.',
    },
    {
      id: 'tg3',
      question: 'Mixing a UN bolt into a metric M hole typically:',
      options: ['Works fine', 'Destroys threads on assembly', 'Improves preload', 'Lowers friction only'],
      correctIndex: 1,
      explanation: 'Profile and pitch mismatches gall or strip threads — always match thread systems.',
    },
  ],
  'chip-breaker-logic': [
    {
      id: 'cb1',
      question: 'TQ chip breaker geometry primarily reduces:',
      options: ['Thread pitch', 'Cutting forces and vibration', 'Coolant pressure', 'Spindle RPM only'],
      correctIndex: 1,
      explanation: 'Asymmetric TQ points control chip flow and can reduce cutting forces by 15–21%.',
    },
    {
      id: 'cb2',
      question: 'Modified flank infeed (3°–5°) helps by:',
      options: ['Increasing heat on both edges', 'Loading one insert edge to reduce chatter', 'Eliminating coolant', 'Doubling depth of cut'],
      correctIndex: 1,
      explanation: 'Flank infeed distributes heat and stabilizes the cut versus pure radial infeed.',
    },
    {
      id: 'cb3',
      question: 'Bird-nesting chips in threading cause:',
      options: ['Better surface finish', 'Tool failure and scrapped parts', 'Lower cutting force', 'Longer tool life always'],
      correctIndex: 1,
      explanation: 'Uncontrolled chips wrap the tool — the #1 cause of threading insert failure.',
    },
  ],
  'motor-power-calculation': [
    {
      id: 'mp1',
      question: 'Motor power from torque T (Nm) and speed n (rpm) in kW:',
      options: ['P = T × n', 'P = (T × n) / 9550', 'P = T / n', 'P = 9550 × T × n'],
      correctIndex: 1,
      explanation: 'P[kW] = T[Nm] × n[rpm] / 9550 — the standard drive-sizing shortcut.',
    },
    {
      id: 'mp2',
      question: 'Gearbox efficiency η < 1 means:',
      options: ['Motor needs less power', 'Motor must supply more power than the load', 'Torque is unchanged always', 'Speed increases efficiency'],
      correctIndex: 1,
      explanation: 'Losses in the transmission require a larger motor nameplate than the shaft power alone.',
    },
    {
      id: 'mp3',
      question: 'A typical motor sizing safety margin is:',
      options: ['0%', '15–20% above calculated power', '50% below calculated', 'None — exact match only'],
      correctIndex: 1,
      explanation: 'Margin covers production variability, aging, and peak duty beyond continuous rating.',
    },
  ],
  'mechanics-of-materials-fundamentals': [
    {
      id: 'mom1',
      question: 'Normal stress σ is defined as:',
      options: ['F × A', 'F / A', 'A / F', 'E × L'],
      correctIndex: 1,
      explanation: 'σ = F/A — internal force per unit area on a section perpendicular to the load.',
    },
    {
      id: 'mom2',
      question: 'Hooke\'s law in elastic range:',
      options: ['σ = E / ε', 'ε = σ / E', 'ε = E × σ²', 'σ = constant'],
      correctIndex: 1,
      explanation: 'Strain ε = σ/E links stress to deformation before yield.',
    },
    {
      id: 'mom3',
      question: 'Stress concentration at a hole:',
      options: ['Lowers peak stress', 'Raises local stress above nominal σ', 'Has no effect', 'Only in compression'],
      correctIndex: 1,
      explanation: 'Geometric discontinuities amplify local stress — Kt factors are applied in design.',
    },
  ],
  'torsion-and-buckling-mechanics': [
    {
      id: 'tb1',
      question: 'Euler critical buckling load Pcr scales with L as:',
      options: ['L', 'L²', '1/L²', 'L³'],
      correctIndex: 2,
      explanation: 'Pcr = π²EI/(KL)² — doubling length quarters the critical load.',
    },
    {
      id: 'tb2',
      question: 'For buckling, which moment of inertia governs failure?',
      options: ['Maximum I', 'Minimum I (weak axis)', 'Polar J only', 'Average of Ix and Iy always'],
      correctIndex: 1,
      explanation: 'Columns buckle about the weakest bending axis — always use minimum I.',
    },
    {
      id: 'tb3',
      question: 'Polar moment J is used for:',
      options: ['Column buckling', 'Torsional shear in shafts', 'Beam deflection only', 'Pressure vessels only'],
      correctIndex: 1,
      explanation: 'τ = Tr/J — J resists twist; I resists bending/buckling.',
    },
  ],
};

/** Fallback quiz built from FAQ when no dedicated quiz exists. */
export function getLessonQuiz(slug: string, faq?: Array<{ question: string; answer: string }>): QuizQuestion[] {
  if (ACADEMY_QUIZZES[slug]?.length) return ACADEMY_QUIZZES[slug];
  if (!faq?.length) return [];
  return faq.slice(0, 2).map((f, i) => ({
    id: `faq-${i}`,
    question: f.question,
    options: [f.answer.slice(0, 80), 'None of the above', 'Depends on material only', 'Not applicable'],
    correctIndex: 0,
    explanation: f.answer,
  }));
}
