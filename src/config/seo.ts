import { SeoRegistryMap, ModuleSeoRecord } from '@/types/seo';
import { TOTAL_CALCULATORS_LABEL } from '@/config/modules';

/**
 * MASTER SEO REGISTRY
 * Sitedeki tüm metadata ve sitemap.ts bu dosyadan beslenir.
 * Başlıklar sade tutulur; root layout şablonu (%s | AluCalc OS) otomatik eklenir.
 */

export const SEO_REGISTRY: SeoRegistryMap = {
  global: {
    siteName: 'AluCalc OS',
    baseUrl: 'https://www.alucalculator.com',
    defaultDescription: `Deterministic engineering intelligence platform for mechanical, structural, and electrical designers. ${TOTAL_CALCULATORS_LABEL} validated solvers, 3D CAD workspace, and ISO/DIN standards compliance.`,
    themeColor: '#00d2ff',
  },
  
  staticRoutes: {
    home: {
      title: 'Professional Engineering Intelligence Platform',
      description: `The browser-based workstation for modern engineers. ${TOTAL_CALCULATORS_LABEL} validated calculators, 3D assembly workspace, and ISO/ASME/DIN compliant material databases.`,
      canonicalSlug: '/',
    },
    workspace: {
      title: '3D Engineering Workspace & Assembly Design',
      description: 'Design, assemble, and analyze mechanical systems in a 3D browser workspace. Component palette, real-time BOM generation, and parametric assembly with engineering-grade precision.',
      canonicalSlug: '/workspace',
    },
    'design-studio': {
      title: 'Parametric Part Configurator & 3D Preview',
      description: 'Instant browser-based 3D parametric preview, section inspection, and binary STL export for mechanical components.',
      canonicalSlug: '/design-studio',
    },
    fea: {
      title: 'FEA Linear Static v1 — Validated Structural Templates',
      description: 'Validated 3-template linear-elastic FEA stress analysis in WebGL. Real-time analytical benchmarks (< 8% error) for cantilever beams, plates with holes, and L-brackets.',
      canonicalSlug: '/fea',
    },
    pricing: {
      title: 'Pricing & Licensing Plans',
      description: 'Deterministic engineering tools remain free. Upgrade to Pro or Team for unlimited DXF/STL exports, unwatermarked client reports, and bulk API access.',
      canonicalSlug: '/pricing',
    },
    academy: {
      title: 'Engineering Academy & Technical Learning',
      description: 'Master core engineering principles with 15 verified interactive units. Bolt torque (VDI 2230), bearing life (ISO 281), gear strength (ISO 6336), FEA static analysis, and verified PDF certifications.',
      canonicalSlug: '/academy',
    },
    calculators: {
      title: `Engineering Calculator Library & ${TOTAL_CALCULATORS_LABEL} Solvers`,
      description: `Browse ${TOTAL_CALCULATORS_LABEL} free engineering calculators organized by discipline. Mechanical, structural, electrical, and fluid dynamics tools validated against ISO, ASME, and DIN standards.`,
      canonicalSlug: '/lite',
    },
    dashboard: {
      title: 'Command Center & Project Intelligence Dashboard',
      description: 'Multi-module engineering dashboard for project management, dependency graphs, execution metrics, and truth ledger verification.',
      canonicalSlug: '/dashboard',
    },
    lite: {
      title: 'AluCalc Lite | Mobile-Friendly Engineering Calculators',
      description: `Fast, mobile-optimized engineering calculators for immediate access to bolt torque, bearing life, beam deflection, and ${TOTAL_CALCULATORS_LABEL} precision tools.`,
      canonicalSlug: '/lite',
    },
    'shafts-root': {
      title: 'Shaft Sizing & Bearing Reaction Calculator',
      description: 'Calculate shaft bearing reaction forces, shear-moment diagrams, combined torsion-bending equivalent stresses, and minimum shaft diameters per ASME standards.',
      canonicalSlug: '/shafts',
    },
    verify: {
      title: 'Certificate & Technical Report Verification Ledger',
      description: 'Verify official AluCalc Academy Technical Mastery Certificates and certified engineering calculation reports with cryptographic checksums.',
      canonicalSlug: '/verify',
    }
  },

  modules: {
    'aluminum': {
      title: 'Aluminum Profile Weight Calculator',
      description: 'Calculate aluminum extrusion profile weight by alloy type, cross-section, and length. Certified database of 6000 and 7000 series alloy densities.',
      canonicalSlug: '/aluminum',
      category: 'structural'
    },
    'bearings': {
      title: 'Bearing Life Calculator (ISO 281)',
      description: 'Predict rolling element bearing L₁₀ life and L₁₀h operating hours using ISO 281 dynamic load rating methodology. Includes reliability and lubrication viscosity factors.',
      canonicalSlug: '/bearings',
      category: 'mechanical'
    },
    'converter': {
      title: 'Engineering Unit Converter',
      description: 'Convert between metric, imperial, and SI engineering units. High-precision length, force, pressure, torque, temperature, and fluid flow conversions.',
      canonicalSlug: '/converter',
      category: 'science'
    },
    'fasteners': {
      title: 'Thread Geometry & Clearance Holes (ISO 965 / ISO 273)',
      description: 'Production fastener dimensions: thread profile d/d2/d3, tap drill sizes, tensile stress area As, ISO 273 clearance holes, and hex head dimensions.',
      canonicalSlug: '/fasteners',
      category: 'mechanical'
    },
    'gears': {
      title: 'Gear Design & Transmission Calculator (ISO 6336)',
      description: 'Design spur and helical gear trains. Calculate gear ratio, speed, torque, contact stress (pitting σH), and tooth root bending safety factor (σF).',
      canonicalSlug: '/gears',
      category: 'mechanical'
    },
    'pumps': {
      title: 'Pump Performance & Sizing Calculator',
      description: 'Calculate pump flow rate, total dynamic head (TDH), NPSH available/required, and system curve. Size centrifugal pumps for industrial fluid applications.',
      canonicalSlug: '/pumps',
      category: 'mechanical'
    },
    'strength': {
      title: 'Stress & Strength Analysis Workstation',
      description: 'Calculate von Mises equivalent stress, Mohr circle transformation, principal stresses, and structural safety factors under combined loading states.',
      canonicalSlug: '/strength',
      category: 'mechanical'
    },
    'welding': {
      title: 'Weld Strength Calculator (Eurocode 3 / AWS D1.1)',
      description: 'Calculate fillet and groove weld throat shear stress, effective weld length, and design resistance per Eurocode 3 (EN 1993-1-8) and AWS D1.1.',
      canonicalSlug: '/welding',
      category: 'structural'
    },
    'nesting': {
      title: '2D Nesting & Stock Optimization',
      description: 'Optimize sheet metal utilization with 2D nesting algorithms. Minimize scrap waste with kerf compensation, part-in-part nesting, and grain constraints.',
      canonicalSlug: '/nesting',
      category: 'manufacturing'
    },
    'fits': {
      title: 'Fits & Tolerances Calculator (ISO 286)',
      description: 'Calculate ISO 286 shaft and hole tolerance limits, fundamental deviations, clearance fits, interference fits, and transition fits for precision tooling.',
      canonicalSlug: '/fits',
      category: 'manufacturing'
    },
    'beam-deflection': {
      title: 'Beam Deflection & Bending Moment Calculator',
      description: 'Calculate beam deflection, bending moment, and shear force diagrams using Euler-Bernoulli theory for simply supported, cantilever, and fixed beams.',
      canonicalSlug: '/beam-deflection',
      category: 'structural'
    },
    'fatigue': {
      title: 'Fatigue Life Analysis & S-N Curves',
      description: 'Predict high-cycle fatigue life using Goodman, Gerber, and Soderberg diagrams. Generate Wöhler S-N curves and calculate component endurance limits.',
      canonicalSlug: '/fatigue',
      category: 'mechanical'
    },
    'fatigue-advanced': {
      title: 'Advanced Fatigue Life Analysis',
      description: 'Advanced fatigue analysis with Palmgren-Miner cumulative damage, rainflow cycle counting, and variable amplitude duty cycles.',
      canonicalSlug: '/fatigue-advanced',
      category: 'mechanical'
    },
    'fluids': {
      title: 'Fluid Dynamics & Pipe Flow Calculator',
      description: 'Calculate Reynolds number, Darcy friction factor, pressure loss, and flow velocity for pipe systems using Darcy-Weisbach and Colebrook equations.',
      canonicalSlug: '/fluids',
      category: 'fluid'
    },
    'naval-hydrostatics': {
      title: 'Naval Hydrostatics & Ship Stability',
      description: 'Calculate hull displacement buoyancy, transverse metacentric height (GM), waterplane second moment, and righting stability curves per IMO criteria.',
      canonicalSlug: '/naval-hydrostatics',
      category: 'fluid'
    },
    'bolt-torque': {
      title: 'Bolt Torque & Preload Calculator (VDI 2230)',
      description: 'Tightening torque and preload analysis with VDI 2230 nut factor K1+K2+K3. Computes thread vs bearing face torque split and yield utilization margin.',
      canonicalSlug: '/bolt-torque',
      category: 'mechanical'
    },
    'three-phase-power': {
      title: '3-Phase Power Calculator',
      description: 'Calculate balanced three-phase AC real power (kW), apparent power (kVA), reactive power (kVAR), line current, and power factor correction.',
      canonicalSlug: '/three-phase-power',
      category: 'electrical'
    },
    'digital-logic': {
      title: 'Digital Logic Lab & Simulator',
      description: 'Interactive digital logic circuit simulator. Build truth tables, Karnaugh maps, combinational gates, flip-flops, and propagation delay timing.',
      canonicalSlug: '/digital-logic',
      category: 'software'
    },
    'filter-design': {
      title: 'Electronic Filter Design Calculator',
      description: 'Design Butterworth, Chebyshev, and Sallen-Key active/passive filters. Calculate component values for low-pass, high-pass, and band-pass topologies.',
      canonicalSlug: '/filter-design',
      category: 'electrical'
    },
    'planetary-gearbox': {
      title: 'Planetary Gearbox Calculator',
      description: 'Calculate planetary gear train ratios using the Willis equation. Multi-stage epicyclic analysis with speed, torque, load sharing, and efficiency.',
      canonicalSlug: '/planetary-gearbox',
      category: 'mechanical'
    },
    'failure-diagnosis': {
      title: 'Failure Diagnosis Workstation',
      description: 'Diagnose mechanical fatigue, brittle fracture, and ductile failure modes with safety factor verification and structural integrity assessment.',
      canonicalSlug: '/failure-diagnosis',
      category: 'manufacturing'
    },
    'handbook': {
      title: 'Engineering Handbook & Technical Reference',
      description: 'Digital engineering handbook with material properties, geometric formulas, tolerance tables, and standardized equations for mechanical design.',
      canonicalSlug: '/handbook',
      category: 'science'
    },
    'sheet-metal': {
      title: 'Sheet Metal Bend Allowance & K-Factor (DIN 6935)',
      description: 'Calculate sheet metal neutral axis K-factor, bend allowance (BA), bend deduction (BD), and flat pattern blank development per DIN 6935.',
      canonicalSlug: '/sheet-metal',
      category: 'manufacturing'
    },
    'sketch-pad': {
      title: '2D Engineering Sketchpad & Conceptual Design',
      description: 'Technical 2D sketching environment for engineering concepts. Integrated with the 3D workspace for seamless transition from concept to assembly.',
      canonicalSlug: '/sketch-pad',
      category: 'software'
    },
    'cad-editor': {
      title: 'Parametric CAD Editor & 3D Modeling',
      description: 'Parametric CAD modeling environment. Construct geometric constraints, edit technical drawings, and export DXF / STEP files.',
      canonicalSlug: '/cad-editor',
      category: 'software'
    },
    'materials-db': {
      title: 'Engineering Materials Database (ISO & ASME)',
      description: 'Comprehensive database of aluminum alloys, structural steels, stainless grades, polymers, and composites with certified physical properties.',
      canonicalSlug: '/materials-db',
      category: 'science'
    },
    'calculator': {
      title: 'Scientific Engineering Calculator (CAS)',
      description: 'High-precision scientific CAS calculator for engineering math. Supports complex numbers, matrix algebra, and integrated physical units.',
      canonicalSlug: '/calculator',
      category: 'science'
    },
    'thermal': {
      title: 'Thermal Analysis & Heat Transfer Calculator',
      description: 'Calculate conduction, convection, and radiation heat transfer. Analyze steady-state temperature profiles and thermal expansion in mechanical systems.',
      canonicalSlug: '/thermal',
      category: 'science'
    }
  },

  academy: {
    'bolt-torque-guide': {
      title: 'How to Calculate Bolt Torque (VDI 2230 Guide)',
      description: 'Master the physics of fastener tightening. Learn K-factors, preload forces, and VDI 2230 standards for secure bolted joints.',
      canonicalSlug: '/academy/how-to-calculate-bolt-torque',
      category: 'mechanical'
    },
    'bearing-life-guide': {
      title: 'Bearing Life Calculation Explained (ISO 281 Guide)',
      description: 'Deep dive into ISO 281 bearing life equations. Learn how to calculate L10 life, reliability factors, and lubrication effects.',
      canonicalSlug: '/academy/bearing-life-calculation-explained',
      category: 'mechanical'
    },
    'beam-deflection-guide': {
      title: 'Beam Deflection Formula Explained (Euler-Bernoulli Guide)',
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

  // Clean fallback without duplicate brand suffix
  return {
    title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: SEO_REGISTRY.global.defaultDescription,
    canonicalSlug: `/${slug}`
  };
};

export const getStaticSeo = (route: string) => {
  return SEO_REGISTRY.staticRoutes[route] || SEO_REGISTRY.staticRoutes.home;
};
