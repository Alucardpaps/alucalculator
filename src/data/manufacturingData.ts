/**
 * Manufacturing Sandbox Data
 * This file contains high-fidelity engineering data for material processing,
 * heat treatments, and surface finishes.
 */

export interface HeatTreatmentEffect {
    id: string;
    method: string;
    temperature: string;
    medium: string;
    description: string;
    bestFor: string; // Added context for industrial usage
    properties: {
        yield: number;      // MPa
        tensile: number;    // MPa
        hardness: string;   // e.g. "45 HRC"
        elongation?: number; // %
        // Visualization parameters (Stress-Strain Curve)
        modulus: number;           // GPa
        strainHardening?: number;  // n
        strengthCoeff?: number;     // K (MPa)
    };
    instructions: string;
    handbookSectionId?: string;    // Reference to HANDBOOK_31_STRUCTURE
}

export interface MachiningProcess {
    name: string;
    raRange: [number, number]; // [min, max] in µm
    toleranceGrade: string;    // e.g. "IT6 - IT9"
    description: string;
    bestFor: string;
}

export interface ProcessingPath {
    materialName: string;
    treatments: HeatTreatmentEffect[];
    machiningNotes: string;
}

export interface SurfaceCoating {
    id: string;
    name: string;
    type: 'Chemical' | 'Electroplating' | 'Thermal' | 'PVD/CVD';
    description: string;
    thicknessRange: string;     // µm
    benefits: string[];
    bestFor: string;            // Added context
    color?: string;
    compatibleMaterials: string[]; // Categories like 'Steel', 'Aluminum'
}

/**
 * Surface Roughness (Ra) Standards
 */
export const SURFACE_FINISH_DB: MachiningProcess[] = [
    { name: 'Sand Casting', raRange: [6.3, 50], toleranceGrade: 'IT11-16', description: 'Rough cast surface', bestFor: 'Low precision bulky parts' },
    { name: 'Forging', raRange: [1.6, 25], toleranceGrade: 'IT9-11', description: 'Impact formed surface', bestFor: 'Structural strength parts' },
    { name: 'Standard Turning', raRange: [1.6, 12.5], toleranceGrade: 'IT10-12', description: 'Basic lathe work', bestFor: 'General mechanical shafts' },
    { name: 'Fine Milling', raRange: [0.8, 3.2], toleranceGrade: 'IT7-9', description: 'Precise surface cutting', bestFor: 'Fitting surfaces' },
    { name: 'Fine Grinding', raRange: [0.1, 1.6], toleranceGrade: 'IT5-7', description: 'Abrasion based finishing', bestFor: 'Precision pins, bearing seats' },
    { name: 'Super Finishing / Honing', raRange: [0.025, 0.4], toleranceGrade: 'IT1-5', description: 'Highest precision finish', bestFor: 'High speed shafts, hydraulics' }
];

export const SURFACE_COATING_DB: SurfaceCoating[] = [
    {
        id: 'galvanize',
        name: 'Galvanize (Zinc)',
        type: 'Electroplating',
        description: 'Common protection for structural steels.',
        thicknessRange: '5-25 µm',
        benefits: ['Corrosion resistance', 'Low cost'],
        bestFor: 'Outdoor structural elements and non-aesthetic fasteners.',
        compatibleMaterials: ['Steel']
    },
    {
        id: 'black-oxide',
        name: 'Black Oxide',
        type: 'Chemical',
        description: 'Does not change dimensions. Provides mild protection.',
        thicknessRange: '0.1-0.2 µm',
        benefits: ['Nonglare', 'Oil retention', 'Dimensional stability'],
        bestFor: 'Precision machine parts and gun components where dimensions are critical.',
        compatibleMaterials: ['Steel', 'Stainless']
    },
    {
        id: 'hard-chrome',
        name: 'Hard Chrome',
        type: 'Electroplating',
        description: 'Extremely hard and low friction. Used for cylinders.',
        thicknessRange: '10-500 µm',
        benefits: ['Wear resistance', 'Low friction', 'Corrosion resistance'],
        bestFor: 'Hydraulic cylinders, piston rods, and heavy-duty wear surfaces.',
        compatibleMaterials: ['Steel']
    },
    {
        id: 'anodizing',
        name: 'Anodizing (Hard)',
        type: 'Chemical',
        description: 'Controlled oxide layer for aluminum.',
        thicknessRange: '20-50 µm',
        benefits: ['Hardness', 'Color options', 'Corrosion resistance'],
        bestFor: 'Aerospace frames, decorative consumer electronics, and kitchenware.',
        compatibleMaterials: ['Aluminum']
    },
    {
        id: 'tin-pvd',
        name: 'TiN (Titanium Nitride)',
        type: 'PVD/CVD',
        description: 'Gold-colored hard film for cutting tools.',
        thicknessRange: '1-4 µm',
        benefits: ['Extreme hardness', 'Heat resistance'],
        bestFor: 'Drill bits, milling cutters, and high-performance automotive trim.',
        compatibleMaterials: ['Steel', 'Tool Steel']
    }
];

/**
 * Material Heat Treatment Paths
 * realistic data for simulation
 */
export const MANUFACTURING_PATHS: ProcessingPath[] = [
    {
        materialName: 'AISI 1045 (Carbon)',
        machiningNotes: 'Excellent machinability in annealed state. Hardness increases significantly with water quenching but risks cracking.',
        treatments: [
            {
                id: 'anneal-st',
                method: 'Full Annealing',
                temperature: '840°C - 870°C',
                medium: 'Furnace Cool',
                description: 'Slow cooling to achieve lowest hardness and highest ductility.',
                bestFor: 'Heavy machining operations and forming.',
                properties: { yield: 310, tensile: 570, hardness: '160 HB', elongation: 25, modulus: 205, strainHardening: 0.26, strengthCoeff: 550 },
                instructions: 'Heat uniformly, hold for 1 hr per inch of thickness, cool slowly in furnace.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: 'norm-st',
                method: 'Normalizing',
                temperature: '850°C - 880°C',
                medium: 'Air Cool',
                description: 'Refining grain structure for better machinability.',
                bestFor: 'General shaft manufacturing and stress relief.',
                properties: { yield: 370, tensile: 640, hardness: '190 HB', elongation: 20, modulus: 205, strainHardening: 0.22, strengthCoeff: 700 },
                instructions: 'Heat to temp, hold for soak time, remove and air cool in still air.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: 'q-water',
                method: 'Water Quench',
                temperature: '820°C - 850°C',
                medium: 'Water',
                description: 'Maximum hardening (Martensite formation). Brittle until tempered.',
                bestFor: 'Maximum surface hardness on simple shapes.',
                properties: { yield: 530, tensile: 820, hardness: '54 HRC', elongation: 8, modulus: 200, strainHardening: 0.08, strengthCoeff: 1300 },
                instructions: 'Quench immediately. Risk of distortion/cracking is high.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: 'temp-400',
                method: 'Tempering (400°C)',
                temperature: '400°C',
                medium: 'Air',
                description: 'Balancing hardness and toughness after quenching.',
                bestFor: 'High strength parts requiring some impact resistance.',
                properties: { yield: 450, tensile: 700, hardness: '32 HRC', elongation: 15, modulus: 205, strainHardening: 0.15, strengthCoeff: 900 },
                instructions: 'Reheat after quenching to relieve stresses.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'AISI 4140 (Cr-Mo)',
        machiningNotes: 'Tough material. Usually machined in annealed or normalized state. Highly responsive to heat treatment.',
        treatments: [
            {
                id: '4140-ann',
                method: 'Annealing',
                temperature: '815°C',
                medium: 'Furnace Cool',
                description: 'Dead soft state for heavy machining.',
                bestFor: 'Precision gear blanks and complex shafts.',
                properties: { yield: 415, tensile: 655, hardness: '197 HB', modulus: 210, strainHardening: 0.24, strengthCoeff: 750 },
                instructions: 'Long soak at 815°C followed by controlled cooling.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '4140-qo',
                method: 'Oil Quench',
                temperature: '845°C',
                medium: 'Agitated Oil',
                description: 'Deep hardening through the section.',
                bestFor: 'Maximum strength on thick sections.',
                properties: { yield: 950, tensile: 1100, hardness: '55 HRC', modulus: 205, strainHardening: 0.06, strengthCoeff: 1800 },
                instructions: 'Agitate in oil bucket to ensure uniform cooling.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '4140-t540',
                method: 'Tempering (540°C)',
                temperature: '540°C',
                medium: 'Air',
                description: 'High strength structural state.',
                bestFor: 'Axles, connecting rods, and drive shafts.',
                properties: { yield: 850, tensile: 950, hardness: '28-32 HRC', modulus: 210, strainHardening: 0.12, strengthCoeff: 1400 },
                instructions: 'Hold for 2 hours minimum.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: '6061-T6 (US Standard)',
        machiningNotes: 'Non-ferrous, precipitation hardening. Machinability is excellent in T6 temper.',
        treatments: [
            {
                id: '6061-t0',
                method: 'Annealing (O-Temper)',
                temperature: '415°C',
                medium: 'Slow Cool',
                description: 'Softest state for severe forming.',
                bestFor: 'Deep drawing and severe cold working of aluminum parts.',
                properties: { yield: 55, tensile: 125, hardness: '30 HB', modulus: 68.9, strainHardening: 0.35, strengthCoeff: 220 },
                instructions: 'Cool at 28°C per hour to 260°C.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '6061-t4',
                method: 'Solution HT (T4)',
                temperature: '530°C',
                medium: 'Water Spray',
                description: 'Naturally aged state.',
                bestFor: 'General purpose moderate strength applications.',
                properties: { yield: 145, tensile: 240, hardness: '65 HB', modulus: 68.9, strainHardening: 0.25, strengthCoeff: 350 },
                instructions: 'Quench rapidly to keep alloying elements in solution.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '6061-t6-aging',
                method: 'Artificial Aging (T6)',
                temperature: '160°C',
                medium: 'Furnace',
                description: 'Maximum strength peak.',
                bestFor: 'Structural aluminum components, bike frames, and marine hardware.',
                properties: { yield: 240, tensile: 310, hardness: '95 HB', modulus: 68.9, strainHardening: 0.1, strengthCoeff: 450 },
                instructions: 'Maintain 160°C for 8-10 hours.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'AISI 1018 (Mild)',
        machiningNotes: 'Excellent weldability and machinability. Used for general parts that do not require high strength.',
        treatments: [
            {
                id: '1018-anneal',
                method: 'Annealing',
                temperature: '870°C',
                medium: 'Slow Cool',
                description: 'Stress relief and softening.',
                bestFor: 'Improving ductility for subsequent bending or cold work.',
                properties: { yield: 280, tensile: 440, hardness: '125 HB', modulus: 205, strainHardening: 0.25, strengthCoeff: 620 },
                instructions: 'Heat to 870°C, hold for 1 hour, slow cool in furnace.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '1018-cr',
                method: 'Cold Rolled (Work Hardened)',
                temperature: '25°C',
                medium: 'Mechanical',
                description: 'Strength increased by cold deformation.',
                bestFor: 'Precision shafts and studs where a smooth finish is needed.',
                properties: { yield: 370, tensile: 440, hardness: '160 HB', modulus: 205, strainHardening: 0.12, strengthCoeff: 700 },
                instructions: 'Deform at room temperature to increase yield strength.',
                handbookSectionId: 'materials-properties'
            }
        ]
    },
    {
        materialName: 'AISI 4340 (High St)',
        machiningNotes: 'Heavy duty alloy. Deep hardening and tough. Best machined in annealed state.',
        treatments: [
            {
                id: '4340-ann',
                method: 'Annealing',
                temperature: '815°C',
                medium: 'Furnace Cool',
                description: 'Ductile state for machining.',
                bestFor: 'Initial machining of heavy-duty aerospace forgings.',
                properties: { yield: 470, tensile: 745, hardness: '220 HB', modulus: 210, strainHardening: 0.20, strengthCoeff: 1100 },
                instructions: 'Heat to 815°C, soak, cool at 10°C/hr in furnace.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '4340-ht',
                method: 'Quench & Temper',
                temperature: '830°C / 430°C',
                medium: 'Oil / Air',
                description: 'High strength structural condition.',
                bestFor: 'Landing gears, power transmission gears, and crankshafts.',
                properties: { yield: 1100, tensile: 1250, hardness: '40 HRC', modulus: 210, strainHardening: 0.09, strengthCoeff: 2200 },
                instructions: 'Oil quench from 830°C, temper at 430°C.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'SS 304 (Std)',
        machiningNotes: 'Gummy and work hardens quickly. Use sharp tools and heavy feeds.',
        treatments: [
            {
                id: '304-ann',
                method: 'Solution Annealing',
                temperature: '1050°C',
                medium: 'Water Quench',
                description: 'Max corrosion resistance and softness.',
                bestFor: 'Kitchen sinks, architectural trim, and chemical storage tanks.',
                properties: { yield: 215, tensile: 505, hardness: '160 HB', modulus: 193, strainHardening: 0.44, strengthCoeff: 1400 },
                instructions: 'Heat rapidly to 1050°C, quench in water immediately to prevent carbide precipitation.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'Alu 7075-T6',
        machiningNotes: 'Aerospace standard. High strength but low corrosion resistance compared to 6 series.',
        treatments: [
            {
                id: '7075-o',
                method: 'Annealed (O-Temper)',
                temperature: '415°C',
                medium: 'Slow Cool',
                description: 'Softest state.',
                bestFor: 'Maximum formability before solution heat treatment.',
                properties: { yield: 105, tensile: 230, hardness: '60 HB', modulus: 71, strainHardening: 0.20, strengthCoeff: 450 },
                instructions: 'Heat to 415°C, cool at 25°C/hr.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '7075-t6',
                method: 'Artificial Aging (T6)',
                temperature: '120°C',
                medium: 'Furnace',
                description: 'Peak aged strength.',
                bestFor: 'Highly stressed structural parts in aircraft and high-end sports equipment.',
                properties: { yield: 505, tensile: 570, hardness: '150 HB', modulus: 71, strainHardening: 0.11, strengthCoeff: 850 },
                instructions: 'Hold at 120°C for 24 hours.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'Titanium Gr5',
        machiningNotes: 'Titanium alloy. Low thermal conductivity means heat builds up at tool tip.',
        treatments: [
            {
                id: 'ti-ann',
                method: 'Annealing',
                temperature: '730°C',
                medium: 'Air Cool',
                description: 'Stress relief.',
                bestFor: 'Removing residual stresses after machining titanium components.',
                properties: { yield: 880, tensile: 950, hardness: '36 HRC', modulus: 114, strainHardening: 0.10, strengthCoeff: 1300 },
                instructions: 'Heat to 730°C, hold for 2 hours, air cool.',
                handbookSectionId: 'materials-properties'
            }
        ]
    },
    {
        materialName: 'AISI D2 (Tool Steel)',
        machiningNotes: 'High carbon, high chrome. Extremely wear resistant. Machining must be done in annealed state (~220 HB).',
        treatments: [
            {
                id: 'd2-ann',
                method: 'Annealing',
                temperature: '870°C',
                medium: 'Slow Cool',
                description: 'Spheroidized annealing for best machinability.',
                bestFor: 'Machining complex dies and molds.',
                properties: { yield: 450, tensile: 750, hardness: '210 HB', modulus: 210, strainHardening: 0.18, strengthCoeff: 1200 },
                instructions: 'Heat to 870°C, hold for 2 hours, cool at 15°C/hr to 540°C.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: 'd2-harden',
                method: 'Hardening',
                temperature: '1020°C',
                medium: 'Air Quench',
                description: 'High temperature hardening to form complex carbides.',
                bestFor: 'Maximum wear resistance for stamping dies and shear blades.',
                properties: { yield: 1580, tensile: 1900, hardness: '60 HRC', modulus: 210, strainHardening: 0.05, strengthCoeff: 2400 },
                instructions: 'Vacuum furnace preferred. Air quench to room temperature.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'Brass (C360)',
        machiningNotes: 'The benchmark for machinability (100%). Forms small, brittle chips. Excellent for high-speed production.',
        treatments: [
            {
                id: 'brass-soft',
                method: 'Annealing',
                temperature: '425°C - 600°C',
                medium: 'Air Cool',
                description: 'Softening for severe cold work.',
                bestFor: 'Restoring ductility in brass parts between drawing stages.',
                properties: { yield: 125, tensile: 330, hardness: '65 HRB', modulus: 97, strainHardening: 0.30, strengthCoeff: 580 },
                instructions: 'Heat to 450°C, hold for 1 hour, cool in still air.',
                handbookSectionId: 'materials-properties'
            }
        ]
    },
    {
        materialName: 'Inconel 625',
        machiningNotes: 'Nickel-based superalloy. Extremely difficult to machine. Tends to work harden instantly. Use low speeds.',
        treatments: [
            {
                id: 'inc625-ann',
                method: 'Solution Annealing',
                temperature: '980°C - 1090°C',
                medium: 'Rapid Quench',
                description: 'Softening for further processing.',
                bestFor: 'Maximizing corrosion resistance and fabricability of Inconel.',
                properties: { yield: 415, tensile: 827, hardness: '180 HB', modulus: 208, strainHardening: 0.40, strengthCoeff: 1500 },
                instructions: 'Heat uniformly, quench rapidly in water or oil.',
                handbookSectionId: 'materials-properties'
            }
        ]
    },
    {
        materialName: 'AISI 4130 (Chromoly)',
        machiningNotes: 'Versatile alloy steel. Excellent strength-to-weight. Good weldability in normalized state.',
        treatments: [
            {
                id: '4130-norm',
                method: 'Normalizing',
                temperature: '870°C',
                medium: 'Air Cool',
                description: 'Standard structural state.',
                bestFor: 'Roll cages, aircraft tubing, and bicycle frames.',
                properties: { yield: 435, tensile: 670, hardness: '200 HB', modulus: 205, strainHardening: 0.16, strengthCoeff: 980 },
                instructions: 'Heat to 870°C, air cool in still air.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'SS 316 (Marine)',
        machiningNotes: 'Higher corrosion resistance than 304. Higher molybdenum content makes it slightly more difficult to machine.',
        treatments: [
            {
                id: '316-ann',
                method: 'Solution Annealing',
                temperature: '1060°C',
                medium: 'Water Quench',
                description: 'Maximum corrosion resistance.',
                bestFor: 'Food grade and marine environment components.',
                properties: { yield: 205, tensile: 515, hardness: '75 HRB', modulus: 193, strainHardening: 0.45, strengthCoeff: 1350 },
                instructions: 'Heat to 1060°C, quench immediately to avoid sensitization.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'St37 (S235JR)',
        machiningNotes: 'Standard structural steel. Excellent for welding and general frames. Does not respond to heat treatment hardening.',
        treatments: [
            {
                id: 'st37-sr',
                method: 'Stress Relieving',
                temperature: '550°C - 600°C',
                medium: 'Air Cool',
                description: 'Relieves internal stresses after heavy welding or machining.',
                bestFor: 'Large welded frames and baseplates.',
                properties: { yield: 235, tensile: 360, hardness: '120 HB', modulus: 210, strainHardening: 0.22, strengthCoeff: 580 },
                instructions: 'Hold for 1 hour per 25mm thickness, cool in still air.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'St52 (S355J2)',
        machiningNotes: 'Enhanced structural steel for load-bearing frames. Superior yield strength compared to St37. Excellent weldability.',
        treatments: [
            {
                id: 'st52-sr',
                method: 'Stress Relieving',
                temperature: '550°C - 600°C',
                medium: 'Air Cool',
                description: 'Prevents dimensional distortion after processing.',
                bestFor: 'Precision welded structures and heavy load-bearing frames.',
                properties: { yield: 355, tensile: 510, hardness: '160 HB', modulus: 210, strainHardening: 0.20, strengthCoeff: 720 },
                instructions: 'Standard stress relief cycle.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: 'C50 (Carbon)',
        machiningNotes: 'Medium carbon steel. Frequently used for induction-hardened shafts and gears. Balanced machinability.',
        treatments: [
            {
                id: 'c50-norm',
                method: 'Normalizing',
                temperature: '840°C - 870°C',
                medium: 'Air Cool',
                description: 'Achieves uniform structure for consistent machining.',
                bestFor: 'Stabilizing dimensions for medium-duty shafts.',
                properties: { yield: 380, tensile: 660, hardness: '190 HB', modulus: 205, strainHardening: 0.22, strengthCoeff: 950 },
                instructions: 'Heat to temp, hold, and air cool.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: 'c50-ind',
                method: 'Induction Hardening',
                temperature: '820°C (Surface)',
                medium: 'Spray Quench',
                description: 'Rapid surface hardening while maintaining a tough core.',
                bestFor: 'Shaft bearing surfaces and gear teeth.',
                properties: { yield: 580, tensile: 850, hardness: '52-56 HRC', modulus: 205, strainHardening: 0.08, strengthCoeff: 1400 },
                instructions: 'Only high-frequency surface heating followed by immediate quench.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: '8620 (Case Hard.)',
        machiningNotes: 'Tough low alloy steel. Designed for carburizing. Best choice for high-performance gears and shafts.',
        treatments: [
            {
                id: '8620-ann',
                method: 'Isothermal Annealing',
                temperature: '860°C',
                medium: 'Furnace',
                description: 'Softest state for gears machining.',
                bestFor: 'Facilitating complex hobbing and shaping of gear teeth.',
                properties: { yield: 360, tensile: 530, hardness: '150 HB', modulus: 205, strainHardening: 0.28, strengthCoeff: 820 },
                instructions: 'Heat to 860°C, cool quickly to 650°C, hold for 2 hours, air cool.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: '8620-carburize',
                method: 'Sementasyon (Carburize)',
                temperature: '900°C - 930°C',
                medium: 'Oil Quench',
                description: 'Diffusing carbon into surface for extreme wear resistance (58-62 HRC).',
                bestFor: 'Transmission gears, pinions, and high-wear sliding shafts.',
                properties: { yield: 550, tensile: 800, hardness: '60 HRC', modulus: 210, strainHardening: 0.05, strengthCoeff: 1800 },
                instructions: 'Hold in carbon-rich environment, oil quench, must be followed by tempering.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    },
    {
        materialName: '1.2344 (H13 Hot)',
        machiningNotes: 'Hot-work tool steel. Retains hardness at elevated temperatures. Common for extrusion and casting dies.',
        treatments: [
            {
                id: 'h13-ann',
                method: 'Annealing',
                temperature: '850°C',
                medium: 'Furnace',
                description: 'Softened state for die machining.',
                bestFor: 'Preparing hot-work tool steel for complex cavity milling.',
                properties: { yield: 450, tensile: 750, hardness: '220 HB', modulus: 215, strainHardening: 0.22, strengthCoeff: 1100 },
                instructions: 'Heat slowly, cool in furnace at 10-20°C/hr.',
                handbookSectionId: 'heat-treatment'
            },
            {
                id: 'h13-harden',
                method: 'Hardening & Tempering',
                temperature: '1030°C / 550°C',
                medium: 'Air / Air',
                description: 'Secondary hardening peak for high temperature stability.',
                bestFor: 'Aluminum die casting molds and extrusion dies.',
                properties: { yield: 1300, tensile: 1600, hardness: '52 HRC', modulus: 215, strainHardening: 0.10, strengthCoeff: 2100 },
                instructions: 'Air quench from 1030°C, double temper at 550°C.',
                handbookSectionId: 'heat-treatment'
            }
        ]
    }
];
