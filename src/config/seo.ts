import { SeoRegistryMap, ModuleSeoRecord } from '@/types/seo';

/**
 * MASTER SEO REGISTRY
 * Sitedeki tüm metadata ve sitemap.ts bu dosyadan beslenir.
 * Bu dosya AluCalc OS'in "Master Parameter Table"ıdır.
 */

export const SEO_REGISTRY: SeoRegistryMap = {
  global: {
    siteName: 'AluCalc OS',
    baseUrl: 'https://www.alucalculator.com',
    defaultDescription: 'Deterministic engineering intelligence platform for mechanical, structural, and electrical designers. 100+ validated solvers and 3D workspace.',
    themeColor: '#00d2ff',
  },
  
  staticRoutes: {
    home: {
      title: 'AluCalc OS | Professional Engineering Intelligence Platform',
      description: 'The browser-based workstation for modern engineers. 88+ validated calculators, 3D assembly workspace, and ISO/ASME/DIN compliant material databases.',
      canonicalSlug: '/',
    },
    workspace: {
      title: '3D Engineering Workspace | Assembly Design & BOM — AluCalc OS',
      description: 'Design, assemble, and analyze mechanical systems in a 3D browser workspace. Component palette, real-time BOM generation, and parametric assembly with engineering-grade precision.',
      canonicalSlug: '/workspace',
    },
    academy: {
      title: 'Engineering Academy | Master Technical Engineering — AluCalc OS',
      description: 'Master core engineering principles with data-integrated learning modules. Bolt torque theory, bearing life derivations, and beam deflection formulas verified against ISO/DIN standards.',
      canonicalSlug: '/academy',
    },
    calculators: {
      title: 'Engineering Calculator Library | 88+ Precision Solvers — AluCalc OS',
      description: 'Browse 88+ free engineering calculators organized by discipline. Mechanical, structural, electrical, and fluid dynamics tools validated against ISO, ASME, and DIN standards.',
      canonicalSlug: '/academy',
    },
    dashboard: {
      title: 'Command Center | Project Intelligence Dashboard — AluCalc OS',
      description: 'Multi-module engineering dashboard for project management, dependency graphs, execution metrics, and truth ledger verification.',
      canonicalSlug: '/dashboard',
    },
    lite: {
      title: 'AluCalc Lite | Mobile-Friendly Engineering Calculators',
      description: 'Simplified, mobile-optimized engineering calculators for quick access to bolt torque, bearing life, and 40+ more precision tools — no desktop required.',
      canonicalSlug: '/lite',
    },
    'shafts-root': {
      title: 'Shaft Analysis & Bearing Reaction Calculator | AluCalc OS',
      description: 'Calculate shaft bearing reactions, bending moments, and support forces for simply supported shafts under point loads.',
      canonicalSlug: '/shafts',
    }
  },

  modules: {
    'aluminum': {
      title: 'Aluminum Profile Weight Calculator | AluCalc OS',
      description: 'Calculate aluminum extrusion profile weight by alloy type, cross-section, and length. Database of 6000-series alloy densities.',
      canonicalSlug: '/aluminum',
      category: 'structural'
    },
    'bearings': {
      title: 'Bearing Life Calculator (ISO 281) | AluCalc OS',
      description: 'Predict rolling element bearing L₁₀ life using ISO 281 dynamic load rating methodology. Includes reliability and lubrication factors.',
      canonicalSlug: '/bearings',
      category: 'mechanical'
    },
    'converter': {
      title: 'Engineering Unit Converter | AluCalc OS',
      description: 'Convert between metric, imperial, and SI engineering units. Length, force, pressure, torque, temperature, and flow rate conversions.',
      canonicalSlug: '/converter',
      category: 'science'
    },
    'fasteners': {
      title: 'Thread Geometry & Clearance Holes (ISO 965 / ISO 273) | AluCalc OS',
      description: 'Production fastener dimensions: thread profile d/d2/d3, tap drill, tensile stress area As, ISO 273 clearance holes, and hex head sizes per ISO 4017.',
      canonicalSlug: '/fasteners',
      category: 'mechanical'
    },
    'gears': {
      title: 'Gear Design & Transmission Calculator | AluCalc OS',
      description: 'Design spur, helical, and worm gear trains. Calculate gear ratio, output speed, torque multiplication, and transmission efficiency.',
      canonicalSlug: '/gears',
      category: 'mechanical'
    },
    'pumps': {
      title: 'Pump Performance & Sizing Calculator | AluCalc OS',
      description: 'Calculate pump flow rate, head loss, NPSH, and system curve. Size centrifugal and positive displacement pumps for industrial applications.',
      canonicalSlug: '/pumps',
      category: 'mechanical'
    },
    'strength': {
      title: 'Stress & Strength Analysis Workstation | AluCalc OS',
      description: 'Calculate von Mises stress, Mohr circle, principal stresses, and safety factors for mechanical components under combined loading.',
      canonicalSlug: '/strength',
      category: 'mechanical'
    },
    'welding': {
      title: 'Weld Strength Calculator (AWS D1.1) | AluCalc OS',
      description: 'Calculate fillet and groove weld strength, heat input, and pre-heat requirements per AWS D1.1 structural welding code.',
      canonicalSlug: '/welding',
      category: 'structural'
    },
    'nesting': {
      title: '2D Nesting & Stock Optimization | AluCalc OS',
      description: 'Optimize material utilization with 2D nesting algorithms. Minimize waste on sheet metal, wood, and composite stock cutting.',
      canonicalSlug: '/nesting',
      category: 'manufacturing'
    },
    'fits': {
      title: 'Fits & Tolerances Calculator (ISO 286) | AluCalc OS',
      description: 'Calculate ISO 286 shaft and hole tolerances, clearance fits, interference fits, and transition fits for precision assemblies.',
      canonicalSlug: '/fits',
      category: 'manufacturing'
    },
    'beam-deflection': {
      title: 'Beam Deflection & Bending Moment Calculator | AluCalc OS',
      description: 'Calculate beam deflection, bending moment, and shear force diagrams using Euler-Bernoulli theory for simply supported and cantilever beams.',
      canonicalSlug: '/beam-deflection',
      category: 'structural'
    },
    'fatigue': {
      title: 'Fatigue Life Analysis & S-N Curves | AluCalc OS',
      description: 'Predict fatigue life using Goodman, Soderberg, and modified Goodman diagrams. Generate S-N curves and calculate endurance limits.',
      canonicalSlug: '/fatigue',
      category: 'mechanical'
    },
    'fatigue-advanced': {
      title: 'Advanced Fatigue Life Analysis | AluCalc OS',
      description: 'Advanced fatigue analysis with Miner cumulative damage, rainflow counting, and variable amplitude loading for complex duty cycles.',
      canonicalSlug: '/fatigue-advanced',
      category: 'mechanical'
    },
    'fluids': {
      title: 'Fluid Dynamics & Pipe Flow Calculator | AluCalc OS',
      description: 'Calculate Reynolds number, friction factor, pressure drop, and flow velocity for pipe systems using Darcy-Weisbach and Moody chart.',
      canonicalSlug: '/fluids',
      category: 'fluid'
    },
    'naval-hydrostatics': {
      title: 'Naval Hydrostatics & Ship Stability | AluCalc OS',
      description: 'Calculate ship displacement, buoyancy, metacentric height (GM), and stability curves for naval architecture applications.',
      canonicalSlug: '/naval-hydrostatics',
      category: 'fluid'
    },
    'bolt-torque': {
      title: 'Bolt Torque & Preload Calculator (VDI 2230) | AluCalc OS',
      description: 'Tightening torque and preload analysis with VDI 2230 nut factor K1+K2+K3. Uses the same ISO production dimensions as the thread geometry module.',
      canonicalSlug: '/bolt-torque',
      category: 'mechanical'
    },
    'three-phase-power': {
      title: '3-Phase Power Calculator | AluCalc OS',
      description: 'Calculate three-phase AC power, line current, phase voltage, and power factor for balanced and unbalanced industrial loads.',
      canonicalSlug: '/three-phase-power',
      category: 'electrical'
    },
    'digital-logic': {
      title: 'Digital Logic Lab | AluCalc OS',
      description: 'Design and simulate digital logic circuits. Truth tables, Karnaugh maps, and combinational/sequential circuit analysis.',
      canonicalSlug: '/digital-logic',
      category: 'software'
    },
    'filter-design': {
      title: 'Electronic Filter Design Calculator | AluCalc OS',
      description: 'Design Butterworth, Chebyshev, and Bessel filters. Calculate component values for low-pass, high-pass, and band-pass configurations.',
      canonicalSlug: '/filter-design',
      category: 'electrical'
    },
    'planetary-gearbox': {
      title: 'Planetary Gearbox Calculator | AluCalc OS',
      description: 'Calculate planetary gear train ratios using Willis equation. Multi-stage analysis with speed, torque, and efficiency calculations.',
      canonicalSlug: '/planetary-gearbox',
      category: 'mechanical'
    },
    'failure-diagnosis': {
      title: 'Failure Diagnosis Workstation | AluCalc OS',
      description: 'Diagnose mechanical fatigue, fracture, and failure modes with safety factor calculations and structural integrity assessment.',
      canonicalSlug: '/failure-diagnosis',
      category: 'manufacturing'
    },
    'handbook': {
      title: 'Engineering Handbook & Technical Reference | AluCalc OS',
      description: 'Digital engineering handbook with material properties, geometric constants, and standardized formula sets for mechanical design.',
      canonicalSlug: '/handbook',
      category: 'science'
    },
    'sheet-metal': {
      title: 'Sheet Metal Design & Bend Calculator | AluCalc OS',
      description: 'Calculate sheet metal k-factor, bend allowance, and flat pattern dimensions for precision fabrication.',
      canonicalSlug: '/sheet-metal',
      category: 'manufacturing'
    },
    'sketch-pad': {
      title: '2D Engineering Sketchpad | Conceptual Design — AluCalc OS',
      description: 'Quick 2D sketching tool for engineering concepts. Integrated with the 3D workspace for seamless transition from concept to assembly.',
      canonicalSlug: '/sketch-pad',
      category: 'software'
    },
    'cad-editor': {
      title: 'Parametric CAD Editor | 3D Modeling — AluCalc OS',
      description: 'Advanced parametric 3D modeling environment. Edit geometries, define constraints, and export engineering-grade CAD files.',
      canonicalSlug: '/cad-editor',
      category: 'software'
    },
    'materials-db': {
      title: 'Engineering Materials Database | ISO & ASME — AluCalc OS',
      description: 'Comprehensive database of metals, polymers, and composites. Validated material properties for structural and thermal analysis.',
      canonicalSlug: '/materials-db',
      category: 'science'
    },
    'calculator': {
      title: 'Scientific Engineering Calculator | AluCalc OS',
      description: 'High-precision scientific calculator for engineering math. Supports complex numbers, matrix operations, and unit integration.',
      canonicalSlug: '/calculator',
      category: 'science'
    },
    'thermal': {
      title: 'Thermal Analysis & Heat Transfer Calculator | AluCalc OS',
      description: 'Calculate conduction, convection, and radiation heat transfer. Analyze steady-state and transient thermal profiles for mechanical systems.',
      canonicalSlug: '/thermal',
      category: 'science'
    }
  },

  academy: {
    'bolt-torque-guide': {
      title: 'How to Calculate Bolt Torque | AluCalc Academy',
      description: 'Master the physics of fastener tightening. Learn K-factors, preload forces, and VDI 2230 standards for secure bolted joints.',
      canonicalSlug: '/academy/how-to-calculate-bolt-torque',
      category: 'mechanical'
    },
    'bearing-life-guide': {
      title: 'Bearing Life Calculation Explained | AluCalc Academy',
      description: 'Deep dive into ISO 281 bearing life equations. Learn how to calculate L10 life, reliability factors, and lubrication effects.',
      canonicalSlug: '/academy/bearing-life-calculation-explained',
      category: 'mechanical'
    },
    'beam-deflection-guide': {
      title: 'Beam Deflection Formula Explained | AluCalc Academy',
      description: 'Step-by-step guide to beam bending formulas. Euler-Bernoulli theory, moment of inertia, and deflection limits for structural design.',
      canonicalSlug: '/academy/beam-deflection-formula-explained',
      category: 'structural'
    }
  }
};

/**
 * HELPER UTILITY: Modül slug'ına göre güvenli metadata döndürür
 */
export const getModuleSeo = (slug: string): ModuleSeoRecord => {
  const mod = SEO_REGISTRY.modules[slug];
  if (mod) return mod;

  // Fallback for missing registry entries
  return {
    title: `${slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} | AluCalc OS`,
    description: SEO_REGISTRY.global.defaultDescription,
    canonicalSlug: `/${slug}`
  };
};

export const getStaticSeo = (route: string) => {
  return SEO_REGISTRY.staticRoutes[route] || SEO_REGISTRY.staticRoutes.home;
};
