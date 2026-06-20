/**
 * AluCalculator V2 — Dynamic Calculator Registry
 * 
 * NO STATIC IMPORTS. All calculators are lazy-loaded.
 * 
 * Structure:
 * - Metadata is PRELOADED (for fast search/filter)
 * - Schema is LAZY LOADED (on calculator open)
 * 
 * NOTE: During migration period, this registry accepts both V1 and V2 schemas.
 */

import type { CalculatorCategory } from '@/types/calculator-schema-v2';

// Mixed registry type for migration period (accepts V1 or V2 schemas)
interface MixedCalculatorRegistryEntry {
    loader: () => Promise<{ default: unknown }>;
    metadata: {
        title: string;
        description: string;
        category: CalculatorCategory;
        icon?: string;
    };
}

type MixedCalculatorRegistry = Record<string, MixedCalculatorRegistryEntry>;

// ============================================
// V2 REGISTRY (LAZY LOADED)
// ============================================

export const CALCULATOR_REGISTRY_V2: MixedCalculatorRegistry = {
    // ==========================================
    // MECHANICAL
    // ==========================================
    'gear-spur': {
        loader: () => import('./schemas-v2/gear-spur'),
        metadata: {
            title: 'Spur Gear Calculator',
            description: 'Geometry, bending stress, and contact stress per ISO 6336',
            category: 'mechanical',
            icon: 'Cog',
        },
    },

    'bolt-stress': {
        loader: () => import('./schemas-v2/bolt-stress'),
        metadata: {
            title: 'Bolt Stress Calculator',
            description: 'Tensile stress and safety factor per ISO 898-1',
            category: 'mechanical',
            icon: 'Wrench',
        },
    },

    'beam-deflection': {
        loader: () => import('./schemas-v2/beam-deflection'),
        metadata: {
            title: 'Beam Deflection Calculator',
            description: 'Simply supported and cantilever beam analysis',
            category: 'mechanical',
            icon: 'ArrowDownToLine',
        },
    },

    'bearings': {
        loader: () => import('./schemas-v2/bearings'),
        metadata: {
            title: 'Bearings (SKF/ISO)',
            description: 'Static & dynamic load ratings for deep groove ball bearings',
            category: 'mechanical',
            icon: 'Circle',
        },
    },

    'shaft-design': {
        loader: () => import('./schemas-v2/shaft-design'),
        metadata: {
            title: 'Advanced Shaft Design',
            description: 'Fatigue design using Goodman, Soderberg, and Gerber theories',
            category: 'mechanical',
            icon: 'Settings2',
        },
    },

    'agma-gear-analysis': {
        loader: () => import('./schemas-v2/agma-gear-analysis'),
        metadata: {
            title: 'AGMA Gear Analysis',
            description: 'Bending & Pitting stresses for standard spur gears',
            category: 'mechanical',
            icon: 'Settings',
        },
    },

    'spring-design': {
        loader: () => import('./schemas-v2/spring-design'),
        metadata: {
            title: 'Spring Design',
            description: 'Helical compression spring analysis (Wahl factor, stiffness)',
            category: 'mechanical',
            icon: 'Navigation', // Placeholder icon
        },
    },

    'mohr-circle-3d': {
        loader: () => import('./schemas-v2/mohr-circle-3d'),
        metadata: {
            title: '3D Mohr\'s Circle',
            description: 'Principal stresses from 3D tensor',
            category: 'mechanical',
            icon: 'Activity', // Placeholder icon
        },
    },

    'hookes-law-3d': {
        loader: () => import('./schemas-v2/hookes-law-3d'),
        metadata: {
            title: '3D Hooke\'s Law',
            description: 'Triaxial stress-strain relationships, volumetric analysis.',
            category: 'mechanical',
            icon: 'Activity',
        },
    },

    'pressure-vessel': {
        loader: () => import('./schemas-v2/pressure-vessel'),
        metadata: {
            title: 'Pressure Vessel',
            description: 'Thick & Thin walled cylinders (Lame\'s Equations)',
            category: 'mechanical',
            icon: 'Settings', // Placeholder
        },
    },

    'torsion-non-circular': {
        loader: () => import('./schemas-v2/torsion-non-circular'),
        metadata: {
            title: 'Non-Circular Torsion',
            description: 'Torsion in Rectangular, Elliptical, Triangular shafts',
            category: 'mechanical',
            icon: 'RefreshCw', // Placeholder
        },
    },

    'chemistry-element': {
        loader: () => import('./schemas-v2/periodic-element'),
        metadata: {
            title: 'Periodic Element',
            description: 'Interactive lookup for periodic element properties',
            category: 'mechanical',
            icon: 'Activity',
        },
    },

    'gas-laws': {
        loader: () => import('./schemas-v2/gas-laws'),
        metadata: {
            title: 'Ideal & Real Gas Laws',
            description: 'Van der Waals gas properties calculator',
            category: 'mechanical',
            icon: 'Activity', // Placeholder
        },
    },

    'thermodynamics': {
        loader: () => import('./schemas-v2/thermodynamics'),
        metadata: {
            title: 'Thermodynamics',
            description: 'Gibbs Free Energy & Spontaneity',
            category: 'mechanical',
            icon: 'Zap',
        },
    },

    'stoichiometry': {
        loader: () => import('./schemas-v2/stoichiometry'),
        metadata: {
            title: 'Solution Concentration',
            description: 'Molarity, Molality, Mass Percent',
            category: 'mechanical',
            icon: 'Activity', // Placeholder
        },
    },

    'area-moment-inertia': {
        loader: () => import('./schemas-v2/area-moment-inertia'),
        metadata: {
            title: 'Area Moment of Inertia',
            description: 'I-Beams & Rectangles Properties',
            category: 'mechanical',
            icon: 'Activity',
        },
    },

    'castigliano-energy': {
        loader: () => import('./schemas-v2/castigliano-strain-energy'),
        metadata: {
            title: 'Castigliano\'s Energy',
            description: 'Strain energy & deflection using Castigliano\'s theorem',
            category: 'mechanical',
            icon: 'Activity', // Placeholder
        },
    },

    'fasteners': {
        loader: () => import('./schemas-v2/fasteners'),
        metadata: {
            title: 'Fastener Calculator',
            description: 'Thread geometry and torque specifications',
            category: 'mechanical',
            icon: 'Anchor',
        },
    },

    'belt-drive': {
        loader: () => import('./schemas-v2/belt-drive'),
        metadata: {
            title: 'Belt Drive',
            description: 'Speed ratio, belt length, and tension analysis',
            category: 'mechanical',
            icon: 'Activity',
        },
    },

    'chain-drive': {
        loader: () => import('./schemas-v2/chain-drive'),
        metadata: {
            title: 'Roller Chain Drive',
            description: 'Sprocket ratio, chain length, velocity, and tension (ISO 606)',
            category: 'mechanical',
            icon: 'Link',
        },
    },

    'brakes-clutches': {
        loader: () => import('./schemas-v2/brakes-clutches'),
        metadata: {
            title: 'Brakes & Clutches',
            description: 'Torque capacity for disk clutches (Uniform Wear/Pressure)',
            category: 'mechanical',
            icon: 'Circle',
        },
    },

    'sfd-bmd-academic': {
        loader: () => import('./schemas-v2/sfd-bmd-academic'),
        metadata: {
            title: 'SFD / BMD Academic',
            description: 'Shear Force and Bending Moment Diagrams for simply supported beams',
            category: 'mechanical',
            icon: 'Activity',
        },
    },

    'mohrs-circle': {
        loader: () => import('./schemas-v2/mohrs-circle'),
        metadata: {
            title: 'Mohr\'s Circle (2D)',
            description: 'Principal stresses and orientation from stress transformation',
            category: 'mechanical',
            icon: 'Circle',
        },
    },

    'column-buckling': {
        loader: () => import('./schemas-v2/column-buckling' as any),
        metadata: {
            title: 'Column Buckling',
            description: 'Euler and Johnson buckling theories for structural members',
            category: 'mechanical',
            icon: 'ArrowDownToLine',
        },
    },

    'thread-geometry': {
        loader: () => import('./schemas-v2/thread-geometry' as any),
        metadata: {
            title: 'Thread Geometry',
            description: 'ISO Metric and Unified thread series technical details',
            category: 'mechanical',
            icon: 'Settings',
        },
    },

    'vat-calculator': {
        loader: () => import('./schemas-v2/vat-calculator' as any),
        metadata: {
            title: 'VAT / Tax Calculator',
            description: 'Professional financial tax and margin calculator',
            category: 'math',
            icon: 'Calculator',
        },
    },

    'torque_calculation': {
        loader: () => import('./schemas-v2/torque_calculation'),
        metadata: {
            title: 'Torque Calculation',
            description: 'Determine shaft torque from motor power and speed.',
            category: 'mechanical',
            icon: 'Zap',
        },
    },

    'failure-analysis': {
        loader: () => import('./schemas-v2/failure-analysis'),
        metadata: {
            title: 'Failure Analysis & Safety',
            description: 'Yield, fatigue, and overload failure mode analysis (ASME B15.1)',
            category: 'mechanical',
            icon: 'AlertTriangle',
        },
    },

    'fatigue-life-sn': {
        loader: () => import('./schemas-v2/fatigue-life-sn'),
        metadata: {
            title: 'Fatigue Life S-N (Basquin)',
            description: 'Cycle life prediction under fluctuating loads (ASTM E606)',
            category: 'mechanical',
            icon: 'TrendingDown',
        },
    },

    'motor-selection': {
        loader: () => import('./schemas-v2/motor-selection'),
        metadata: {
            title: 'Motor Selection Engine',
            description: 'Required power & nearest IEC standard motor sizing (IEC 60034-1)',
            category: 'mechanical',
            icon: 'Cpu',
        },
    },

    'torsion-shaft': {
        loader: () => import('./schemas-v2/torsion-shaft'),
        metadata: {
            title: 'Torsion of Shafts',
            description: 'Shear stress and angle of twist for circular shafts',
            category: 'mechanical',
            icon: 'RotateCcw',
        },
    },

    'bearings-advanced': {
        loader: () => import('./schemas-v2/bearings' as any),
        metadata: {
            title: 'Advanced Bearing Analysis',
            description: 'Extended bearing life with visualizations and advanced parameters',
            category: 'mechanical',
            icon: 'Target',
        },
    },

    // ==========================================
    // FABRICATION
    // ==========================================
    'welding-heat': {
        loader: () => import('./schemas-v2/welding-heat'),
        metadata: {
            title: 'Welding Heat Input',
            description: 'Heat input calculation per EN 1011-1 with process efficiency',
            category: 'fabrication',
            icon: 'Flame',
        },
    },

    'welding-fillet': {
        loader: () => import('./schemas-v2/welding-fillet'),
        metadata: {
            title: 'Fillet Weld Calculator',
            description: 'Weld capacity and stress per EN 1993-1-8',
            category: 'fabrication',
            icon: 'Triangle',
        },
    },

    'sheet-metal': {
        loader: () => import('./schemas-v2/sheet-metal'),
        metadata: {
            title: 'Sheet Metal Bending',
            description: 'K-Factor, bend allowance, and flat pattern',
            category: 'fabrication',
            icon: 'Square',
        },
    },

    'machining-milling': {
        loader: () => import('./schemas-v2/machining-milling'),
        metadata: {
            title: 'Milling Feeds & Speeds',
            description: 'Spindle RPM, Feed Rate, and MRR calculations',
            category: 'fabrication',
            icon: 'Crosshair',
        },
    },

    'machining-grinding': {
        loader: () => import('./schemas-v2/machining-grinding'),
        metadata: {
            title: 'Grinding Wheel Speeds',
            description: 'Peripheral cutting speed for abrasives',
            category: 'fabrication',
            icon: 'Circle',
        },
    },

    'profile-weight': {
        loader: () => import('./schemas-v2/profile-weight'),
        metadata: {
            title: 'Profile Weight Calculator',
            description: 'Weight calculation for standard profiles',
            category: 'fabrication',
            icon: 'Box',
        },
    },

    // ==========================================
    // MATERIALS
    // ==========================================
    'strength-analysis': {
        loader: () => import('./schemas-v2/strength-analysis'),
        metadata: {
            title: 'Strength Analysis',
            description: 'Yield, ultimate, and safety factor calculations',
            category: 'materials',
            icon: 'Shield',
        },
    },

    'fits-tolerances': {
        loader: () => import('./schemas-v2/fits-tolerances'),
        metadata: {
            title: 'Fits & Tolerances',
            description: 'ISO fits and interference calculations',
            category: 'materials',
            icon: 'Ruler',
        },
    },

    // ==========================================
    // FLUID
    // ==========================================
    'fluid-flow': {
        loader: () => import('./schemas-v2/fluid-flow'),
        metadata: {
            title: 'Fluid Flow Calculator',
            description: 'Pipe flow and pressure drop calculations',
            category: 'fluid',
            icon: 'Droplets',
        },
    },

    'pumps': {
        loader: () => import('./schemas-v2/pumps'),
        metadata: {
            title: 'Pump Sizing Calculator',
            description: 'Head, power, and NPSH calculations',
            category: 'fluid',
            icon: 'Activity',
        },
    },

    'aerodynamics': {
        loader: () => import('./schemas-v2/aerodynamics'),
        metadata: {
            title: 'Aerodynamics (Drag)',
            description: 'Drag force and required power analysis',
            category: 'fluid',
            icon: 'Wind' as any,
        },
    },

    // ==========================================
    // ELECTRICAL
    // ==========================================
    'ohms-law': {
        loader: () => import('./schemas-v2/ohms-law'),
        metadata: {
            title: 'Ohm\'s Law Calculator',
            description: 'Voltage, current, resistance, and power',
            category: 'electrical',
            icon: 'Zap',
        },
    },

    'voltage-drop': {
        loader: () => import('./schemas-v2/voltage-drop'),
        metadata: {
            title: 'Voltage Drop Calculator',
            description: 'Cable sizing and voltage drop per NEC',
            category: 'electrical',
            icon: 'Cable',
        },
    },

    // ==========================================
    // THERMAL
    // ==========================================
    'heat-transfer': {
        loader: () => import('./schemas-v2/heat-transfer'),
        metadata: {
            title: 'Heat Transfer',
            description: 'Conduction and convection heat flow metrics',
            category: 'thermal',
            icon: 'Thermometer',
        },
    },

    // ==========================================
    // MATH/UTILITY
    // ==========================================
    'golden-ratio': {
        loader: () => import('./schemas-v2/golden-ratio'),
        metadata: {
            title: 'Golden Ratio Generator',
            description: 'Calculate perfect proportions (Φ = 1.618)',
            category: 'math',
            icon: 'Layout',
        },
    },

    'unit-converter': {
        loader: () => import('./schemas-v2/unit-converter'),
        metadata: {
            title: 'Unit Converter',
            description: 'Engineering unit conversions',
            category: 'math',
            icon: 'RefreshCw',
        },
    },
};

// ============================================
// CATEGORY METADATA
// ============================================

export const CATEGORY_INFO = {
    mechanical: {
        label: 'Mechanical',
        color: '#00e5ff',
        icon: 'Wrench',
        description: 'Gears, bearings, fasteners, and stress analysis'
    },
    fabrication: {
        label: 'Fabrication',
        color: '#ff6b35',
        icon: 'Flame',
        description: 'Welding, sheet metal, and manufacturing'
    },
    materials: {
        label: 'Materials',
        color: '#9c27b0',
        icon: 'Layers',
        description: 'Material properties and tolerances'
    },
    fluid: {
        label: 'Fluid Mechanics',
        color: '#2196f3',
        icon: 'Droplets',
        description: 'Pipe flow, pumps, and hydraulics'
    },
    electrical: {
        label: 'Electrical',
        color: '#ffeb3b',
        icon: 'Zap',
        description: 'Circuits, cables, and power'
    },
    thermal: {
        label: 'Thermal',
        color: '#f44336',
        icon: 'Thermometer',
        description: 'Heat transfer and thermal expansion'
    },
    civil: {
        label: 'Civil/Structural',
        color: '#795548',
        icon: 'Building',
        description: 'Beams, columns, and foundations'
    },
    math: {
        label: 'Math/Utility',
        color: '#607d8b',
        icon: 'Calculator',
        description: 'Unit conversion and math tools'
    },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getCalculatorCount(): number {
    return Object.keys(CALCULATOR_REGISTRY_V2).length;
}

export function getCalculatorsByCategory(category: string): string[] {
    return Object.entries(CALCULATOR_REGISTRY_V2)
        .filter(([, entry]) => entry.metadata.category === category)
        .map(([id]) => id);
}

export function searchCalculators(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    return Object.entries(CALCULATOR_REGISTRY_V2)
        .filter(([id, entry]) =>
            id.includes(lowerQuery) ||
            entry.metadata.title.toLowerCase().includes(lowerQuery) ||
            entry.metadata.description.toLowerCase().includes(lowerQuery)
        )
        .map(([id]) => id);
}
