export type LessonEnrichment = {
  learningObjectives: string[];
  keyTakeaways: string[];
  supplementalParagraph?: string;
};

export const ACADEMY_LESSON_ENRICHMENT: Record<string, LessonEnrichment> = {
  'engineering-units-and-standards': {
    learningObjectives: [
      'Convert between SI and Imperial length, mass, and force units without ambiguity',
      'Identify when mass (kg) must not be substituted for force (N) in equilibrium equations',
      'Apply ISO/DIN rounding rules for manufacturing tolerances expressed in microns',
    ],
    keyTakeaways: [
      'Always carry SI internally; convert only at presentation boundaries',
      '1 in = 25.4 mm exactly — never approximate for precision fits',
      'Unit errors propagate silently until they cause field failures',
    ],
    supplementalParagraph:
      'Every AluCalc kernel assumes SI internally. This lesson trains you to spot mixed-unit traps before they reach a drawing or BOM — the same discipline NASA mandates after the Mars Orbiter loss.',
  },
  'fundamentals-of-statics': {
    learningObjectives: [
      'Draw complete free-body diagrams with correct force directions',
      'Apply ΣF = 0 and ΣM = 0 to solve for unknown reactions',
      'Decompose inclined forces into orthogonal components',
    ],
    keyTakeaways: [
      'A missing force on the FBD invalidates every downstream result',
      'Choose the moment center with the most unknowns to simplify algebra',
      'Statics is prerequisite to every structural and machine design check',
    ],
    supplementalParagraph:
      'Before you size a beam or a bolt, you must know the reactions at supports. The truss and beam engines in AluCalc assume you have already established equilibrium — this module teaches that foundation.',
  },
  'introduction-to-machine-elements': {
    learningObjectives: [
      'Classify machine elements by function: power transmission, support, and joining',
      'Map design requirements to standard catalog components (ISO, DIN)',
      'Recognize when a custom element is justified versus over-engineering',
    ],
    keyTakeaways: [
      'Standard elements enable interchangeability and lower lifecycle cost',
      'Environment (corrosion, temperature, vibration) drives element selection',
      'Design for disassembly unless the joint is intentionally permanent',
    ],
    supplementalParagraph:
      'Machine design is not inventing new parts — it is composing proven elements into a reliable system. This overview connects each element family to the specialized lessons and calculators that follow.',
  },
  'thread-geometry-standards': {
    learningObjectives: [
      'Distinguish 60° metric/UN threads from 55° Whitworth and 30° trapezoidal profiles',
      'Read tolerance designations (6g/6H, 4h) and their assembly implications',
      'Estimate stress area from pitch and major diameter for fastener sizing',
    ],
    keyTakeaways: [
      'Profile angle mismatch destroys threads on first assembly',
      'Tolerance class controls fit — 4h is tighter than 6g for critical joints',
      'Partial-profile tools trade flexibility for crest sharpness',
    ],
    supplementalParagraph:
      'Thread geometry is the DNA of every bolted joint. CNC programmers and fastener designers share the same ISO tables — this lesson aligns your vocabulary with the Thread Geometry engine.',
  },
  'how-to-calculate-bolt-torque': {
    learningObjectives: [
      'Relate applied torque to bolt preload via friction coefficients (K or μ)',
      'Apply VDI 2230 concepts: yield utilization and thread stripping checks',
      'Select lubrication strategy and its effect on required tightening torque',
    ],
    keyTakeaways: [
      'Torque is an indirect measure of preload — friction dominates scatter',
      'Over-torquing can yield the bolt and reduce clamp force after relaxation',
      'Always verify both internal and external thread capacity',
    ],
    supplementalParagraph:
      'A torque wrench reading is not the design output — clamp force is. This lesson bridges shop-floor tightening to the VDI 2230 kernel used in AluCalc Fastener Lab.',
  },
  'bearing-life-calculation-explained': {
    learningObjectives: [
      'Compute L10 life using ISO 281 dynamic rating and equivalent load P',
      'Apply life exponent p = 3 for ball bearings and 10/3 for rollers',
      'Interpret catalog C versus operating P and reliability targets',
    ],
    keyTakeaways: [
      'L10 means 10% of bearings fail before that life at 90% reliability',
      'P > C is a critical overspeed/overload condition — resize immediately',
      'Equivalent load combines radial and axial components per ISO rules',
    ],
    supplementalParagraph:
      'Bearing selection is a fatigue problem, not a static one. The ISO 281 engine in AluCalc uses the same C/P exponent you will apply in this lesson.',
  },
  'motor-power-calculation': {
    learningObjectives: [
      'Convert torque and speed to shaft power using P = T·n/9550 (kW)',
      'Account for transmission efficiency when sizing the motor nameplate',
      'Distinguish continuous duty from peak starting torque requirements',
    ],
    keyTakeaways: [
      'Undersized motors overheat; oversized motors waste capital and efficiency',
      'Always include gearbox losses in the motor power calculation',
      'Add 15–20% margin for production variability and aging',
    ],
    supplementalParagraph:
      'Drive sizing connects mechanical load to electrical supply. The belt and motor calculators in AluCalc expect power in kW derived from the same torque–speed relationship taught here.',
  },
  'mechanics-of-materials-fundamentals': {
    learningObjectives: [
      'Compute normal stress σ = F/A and interpret tension vs compression',
      'Apply Hooke\'s law to relate stress, strain, and elastic modulus',
      'Identify stress concentrations at holes, fillets, and sudden section changes',
    ],
    keyTakeaways: [
      'Stress is internal resistance; pressure acts on external surfaces',
      'Stay below yield with an appropriate factor of safety (1.5–3.0)',
      'Shear area lies in the plane of the shear force — not the normal area',
    ],
    supplementalParagraph:
      'Statics gives external reactions; strength of materials tells you whether the material survives inside. Every stress calculator in AluCalc builds on σ = F/A and ε = σ/E.',
  },
  'mohrs-circle-stress-analysis': {
    learningObjectives: [
      'Transform plane-stress components to find principal stresses σ1, σ2',
      'Compute maximum shear τ_max from Mohr circle geometry',
      'Explain why principal values are invariant while σ(θ) and τ(θ) rotate',
    ],
    keyTakeaways: [
      'Principal planes have zero shear — design checks often use σ1',
      'τ_max = Mohr circle radius — drives yielding in ductile materials',
      'Combined loading requires plane-stress analysis before failure criteria',
    ],
    supplementalParagraph:
      'Uniaxial σ = F/A is not enough when bending and torsion coexist. The Mohr Circle Lab visualizes the same transformation the OS kernel evaluates analytically.',
  },
  'torsion-and-buckling-mechanics': {
    learningObjectives: [
      'Calculate shear stress in shafts under torsion using τ = Tr/J',
      'Determine Euler critical load Pcr for slender columns',
      'Select effective length factor K from end support conditions',
    ],
    keyTakeaways: [
      'Buckling fails on the weakest axis — always use minimum I',
      'Slenderness ratio L/r determines whether Euler theory applies',
      'Combined torsion and bending require interaction checks beyond this lesson',
    ],
    supplementalParagraph:
      'Sudden buckling collapse can occur below material yield stress. The column stability engine applies the same π²EI/(KL)² formula with your actual end conditions.',
  },
  'beam-deflection-formula-explained': {
    learningObjectives: [
      'Apply Euler–Bernoulli deflection formulas for common support cases',
      'Explain why deflection scales with L⁴ for center-loaded simply supported beams',
      'Relate serviceability limits (e.g. L/360) to user comfort and gasket integrity',
    ],
    keyTakeaways: [
      'Deflection often governs design before stress reaches yield',
      'Stiffness scales with E·I — doubling I halves deflection',
      'Self-weight and creep may matter for long-span or polymer beams',
    ],
    supplementalParagraph:
      'Strength without serviceability is a failed design. Roark and AISC deflection limits are enforced in the Beam Deflection Engine using the same PL³/(48EI) backbone.',
  },
  'pressure-drop-calculation-guide': {
    learningObjectives: [
      'Apply Darcy–Weisbach to relate friction factor, geometry, and velocity head',
      'Estimate Reynolds number to select laminar vs turbulent friction correlations',
      'Size pumps using pressure drop and required flow rate',
    ],
    keyTakeaways: [
      'ΔP scales with f·(L/D)·ρV²/2 — velocity dominates in small pipes',
      'Larger diameter cuts velocity quadratically for the same flow',
      'Always verify NPSH after calculating line losses',
    ],
    supplementalParagraph:
      'Fluid systems are sized on flow and pressure, not just pipe schedule. The Darcy–Weisbach kernel in AluCalc uses the identical friction–geometry relationship derived here.',
  },
  'chip-breaker-logic': {
    learningObjectives: [
      'Select chip breaker geometry (TF, TQ) based on material and operation',
      'Compare radial infeed vs modified flank infeed for threading stability',
      'Relate depth of cut, feed, and specific cutting force to tool load',
    ],
    keyTakeaways: [
      'Uncontrolled chips cause bird-nesting — the primary threading failure mode',
      'Modified flank feed reduces heat load on one insert edge',
      'Minimum depth of cut is required to activate the chip breaker groove',
    ],
    supplementalParagraph:
      'Threading is a metal-cutting problem disguised as a geometry problem. Kyocera TQ data in this lesson feeds the same specific-force model used in the Machining Time engine.',
  },
};

export function getLessonEnrichment(slug: string): LessonEnrichment | undefined {
  return ACADEMY_LESSON_ENRICHMENT[slug];
}
