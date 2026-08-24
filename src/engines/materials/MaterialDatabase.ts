// ============================================
// MATERIAL DATABASE ENGINE
// ============================================

export type MaterialCategory = 'Aluminum' | 'Steel' | 'Tool Steel' | 'Stainless Steel' | 'Copper Alloy' | 'Titanium' | 'Polymer (Plastic)' | 'Ceramic' | 'Composite' | 'Other';

export interface HeatTreatment {
    id: string;
    name: string; // e.g., "T6", "Annealed", "Quenched & Tempered", "Carburized (Cementation)"
    yieldStrengthMod: number; // MPa
    tensileStrengthMod: number; // MPa
    hardnessHv: number; // Vickers Hardness
    description: string;
}

export interface Coating {
    id: string;
    name: string; // e.g., "Anodized Type II", "Galvanized", "Powder Coat"
    thickness: number; // microns
    corrosionResistance: 'Low' | 'Medium' | 'High' | 'Extreme';
    frictionCoeff: number;
    color: string;
}

export interface BaseMaterial {
    id: string;
    name: string; // e.g., "6061"
    category: MaterialCategory;
    density: number; // kg/m^3
    E: number; // Young's Modulus (MPa)
    G: number; // Shear Modulus (MPa)
    nu: number; // Poisson's Ratio
    alpha: number; // Thermal Expansion (1/C)
    baseCost: number; // Relative cost index

    // Default properties (Annealed/Base state)
    yieldStrength: number; // MPa
    ultimateStrength: number; // MPa

    treatments: HeatTreatment[];
    compatibleCoatings: string[]; // IDs of coatings
}

// ============================================
// DATA LIBRARY
// ============================================

export const COATINGS: Record<string, Coating> = {
    'anodize_ii': { id: 'anodize_ii', name: 'Anodized Type II (Clear)', thickness: 15, corrosionResistance: 'High', frictionCoeff: 0.5, color: '#e0e0e0' },
    'anodize_iii': { id: 'anodize_iii', name: 'Anodized Type III (Hard)', thickness: 50, corrosionResistance: 'Extreme', frictionCoeff: 0.3, color: '#333333' },
    'galvanized': { id: 'galvanized', name: 'Hot Dip Galvanized', thickness: 85, corrosionResistance: 'High', frictionCoeff: 0.6, color: '#8899ac' },
    'powder_black': { id: 'powder_black', name: 'Powder Coat (Matte Black)', thickness: 100, corrosionResistance: 'Medium', frictionCoeff: 0.4, color: '#1a1a1a' },
    'none': { id: 'none', name: 'None / Raw', thickness: 0, corrosionResistance: 'Low', frictionCoeff: 0.8, color: '#ffffff' }
};

export const MATERIALS: BaseMaterial[] = [
    // --- ALUMINUM ALLOYS ---
    {
        id: 'alu_6061',
        name: 'Aluminum 6061',
        category: 'Aluminum',
        density: 2700,
        E: 68900,
        G: 26000,
        nu: 0.33,
        alpha: 23.6e-6,
        baseCost: 1.0,
        yieldStrength: 55, // O-Temper
        ultimateStrength: 124,
        treatments: [
            { id: 't0', name: 'O (Annealed)', yieldStrengthMod: 55, tensileStrengthMod: 124, hardnessHv: 30, description: 'Soft, max formability.' },
            { id: 't4', name: 'T4 (Naturally Aged)', yieldStrengthMod: 145, tensileStrengthMod: 241, hardnessHv: 65, description: 'Good formability + strength.' },
            { id: 't6', name: 'T6 (Artificially Aged)', yieldStrengthMod: 276, tensileStrengthMod: 310, hardnessHv: 95, description: 'Standard structural temper.' }
        ],
        compatibleCoatings: ['anodize_ii', 'anodize_iii', 'powder_black', 'none']
    },
    {
        id: 'alu_7075',
        name: 'Aluminum 7075',
        category: 'Aluminum',
        density: 2810,
        E: 71700,
        G: 26900,
        nu: 0.33,
        alpha: 23.4e-6,
        baseCost: 2.5,
        yieldStrength: 103, // O-Temper
        ultimateStrength: 228,
        treatments: [
            { id: 't0', name: 'O (Annealed)', yieldStrengthMod: 103, tensileStrengthMod: 228, hardnessHv: 60, description: 'Softest state.' },
            { id: 't6', name: 'T6', yieldStrengthMod: 503, tensileStrengthMod: 572, hardnessHv: 175, description: 'High strength aerospace grade.' }
        ],
        compatibleCoatings: ['anodize_ii', 'anodize_iii', 'powder_black', 'none']
    },
    {
        id: 'alu_2024',
        name: 'Aluminum 2024',
        category: 'Aluminum',
        density: 2780,
        E: 73100,
        G: 28000,
        nu: 0.33,
        alpha: 22.9e-6,
        baseCost: 2.2,
        yieldStrength: 75,
        ultimateStrength: 185,
        treatments: [
            { id: 't0', name: 'O (Annealed)', yieldStrengthMod: 75, tensileStrengthMod: 185, hardnessHv: 47, description: 'Annealed.' },
            { id: 't3', name: 'T3', yieldStrengthMod: 345, tensileStrengthMod: 485, hardnessHv: 140, description: 'Aircraft skin, high fatigue resistance.' }
        ],
        compatibleCoatings: ['anodize_ii', 'anodize_iii', 'none']
    },

    // --- CARBON & ALLOY STEELS ---
    {
        id: 'steel_a36',
        name: 'Structural Steel A36',
        category: 'Steel',
        density: 7850,
        E: 200000,
        G: 79300,
        nu: 0.26,
        alpha: 11.7e-6,
        baseCost: 0.4,
        yieldStrength: 250,
        ultimateStrength: 400,
        treatments: [
            { id: 'hr', name: 'Hot Rolled', yieldStrengthMod: 250, tensileStrengthMod: 400, hardnessHv: 140, description: 'Standard structural state.' }
        ],
        compatibleCoatings: ['galvanized', 'powder_black', 'none']
    },
    {
        id: 'steel_1018',
        name: 'Carbon Steel 1018',
        category: 'Steel',
        density: 7870,
        E: 205000,
        G: 80000,
        nu: 0.29,
        alpha: 11.5e-6,
        baseCost: 0.45,
        yieldStrength: 370,
        ultimateStrength: 440,
        treatments: [
            { id: 'cd', name: 'Cold Drawn', yieldStrengthMod: 370, tensileStrengthMod: 440, hardnessHv: 130, description: 'Cold drawn standard.' },
            { id: 'carburized', name: 'Carburized (Cementation)', yieldStrengthMod: 370, tensileStrengthMod: 440, hardnessHv: 700, description: 'Surface hardened case, soft core.' }
        ],
        compatibleCoatings: ['galvanized', 'powder_black', 'none']
    },
    {
        id: 'steel_1045',
        name: 'Medium Carbon Steel 1045',
        category: 'Steel',
        density: 7870,
        E: 206000,
        G: 80000,
        nu: 0.29,
        alpha: 11.5e-6,
        baseCost: 0.5,
        yieldStrength: 310, // HR
        ultimateStrength: 565,
        treatments: [
            { id: 'hr', name: 'Hot Rolled', yieldStrengthMod: 310, tensileStrengthMod: 565, hardnessHv: 170, description: 'As rolled.' },
            { id: 'qt', name: 'Quenched & Tempered', yieldStrengthMod: 585, tensileStrengthMod: 770, hardnessHv: 240, description: 'Moderate strength and toughness.' },
            { id: 'normalized', name: 'Normalized', yieldStrengthMod: 415, tensileStrengthMod: 650, hardnessHv: 195, description: 'Refined grain.' }
        ],
        compatibleCoatings: ['powder_black', 'none']
    },
    {
        id: 'steel_4140',
        name: 'Chromoly 4140',
        category: 'Steel',
        density: 7850,
        E: 205000,
        G: 80000,
        nu: 0.29,
        alpha: 12.2e-6,
        baseCost: 1.5,
        yieldStrength: 415, // Annealed
        ultimateStrength: 655,
        treatments: [
            { id: 'annealed', name: 'Annealed', yieldStrengthMod: 415, tensileStrengthMod: 655, hardnessHv: 195, description: 'Machinable state.' },
            { id: 'qt_low', name: 'Q&T (Low Temp)', yieldStrengthMod: 1100, tensileStrengthMod: 1300, hardnessHv: 400, description: 'Very high strength.' },
            { id: 'qt_high', name: 'Q&T (High Temp)', yieldStrengthMod: 800, tensileStrengthMod: 950, hardnessHv: 300, description: 'Tougher, lower strength.' },
            { id: 'nitrided', name: 'Nitrided', yieldStrengthMod: 850, tensileStrengthMod: 1000, hardnessHv: 700, description: 'Extreme surface hardness.' },
            { id: 'carburized', name: 'Case Hardened (Cementation)', yieldStrengthMod: 850, tensileStrengthMod: 1000, hardnessHv: 750, description: 'Hard case, tough core.' }
        ],
        compatibleCoatings: ['powder_black', 'none']
    },
    {
        id: 'steel_4340',
        name: 'Alloy Steel 4340',
        category: 'Steel',
        density: 7850,
        E: 205000,
        G: 80000,
        nu: 0.29,
        alpha: 12.2e-6,
        baseCost: 2.0,
        yieldStrength: 470, // Annealed
        ultimateStrength: 745,
        treatments: [
            { id: 'annealed', name: 'Annealed', yieldStrengthMod: 470, tensileStrengthMod: 745, hardnessHv: 220, description: 'Machinable.' },
            { id: 'qt', name: 'Quenched & Tempered', yieldStrengthMod: 1620, tensileStrengthMod: 1860, hardnessHv: 550, description: 'Ultra high strength, deep hardenability.' }
        ],
        compatibleCoatings: ['powder_black', 'none']
    },

    // --- TOOL STEELS ---
    {
        id: 'tool_d2',
        name: 'Tool Steel D2',
        category: 'Tool Steel',
        density: 7700,
        E: 210000,
        G: 81000,
        nu: 0.28,
        alpha: 10.4e-6,
        baseCost: 4.5,
        yieldStrength: 1000,
        ultimateStrength: 1700,
        treatments: [
            { id: 'annealed', name: 'Annealed', yieldStrengthMod: 1000, tensileStrengthMod: 1700, hardnessHv: 250, description: 'Machinable before hardening.' },
            { id: 'hardened', name: 'Hardened & Tempered', yieldStrengthMod: 2200, tensileStrengthMod: 2500, hardnessHv: 700, description: 'Extreme wear resistance.' }
        ],
        compatibleCoatings: ['none']
    },
    {
        id: 'tool_h13',
        name: 'Tool Steel H13 (Hot Work)',
        category: 'Tool Steel',
        density: 7800,
        E: 210000,
        G: 81000,
        nu: 0.28,
        alpha: 11.0e-6,
        baseCost: 5.0,
        yieldStrength: 800,
        ultimateStrength: 1200,
        treatments: [
            { id: 'annealed', name: 'Annealed', yieldStrengthMod: 800, tensileStrengthMod: 1200, hardnessHv: 230, description: 'Machinable.' },
            { id: 'hardened', name: 'Hardened & D. Tempered', yieldStrengthMod: 1500, tensileStrengthMod: 1800, hardnessHv: 550, description: 'High toughness at elevated temps.' }
        ],
        compatibleCoatings: ['nitrided', 'none']
    },

    // --- STAINLESS STEELS ---
    {
        id: 'ss_304',
        name: 'Stainless Steel 304',
        category: 'Stainless Steel',
        density: 8000,
        E: 193000,
        G: 77000,
        nu: 0.29,
        alpha: 17.2e-6,
        baseCost: 1.8,
        yieldStrength: 215, // Annealed
        ultimateStrength: 505,
        treatments: [
            { id: 'annealed', name: 'Annealed', yieldStrengthMod: 215, tensileStrengthMod: 505, hardnessHv: 150, description: 'Most common austenitic SS. Cannot be hardened by heat treatment.' },
            { id: 'cw_half', name: 'Cold Worked (1/2 Hard)', yieldStrengthMod: 760, tensileStrengthMod: 1030, hardnessHv: 320, description: 'Work-hardened.' }
        ],
        compatibleCoatings: ['none']
    },
    {
        id: 'ss_17_4ph',
        name: 'Stainless 17-4 PH',
        category: 'Stainless Steel',
        density: 7800,
        E: 196000,
        G: 77000,
        nu: 0.27,
        alpha: 10.8e-6,
        baseCost: 3.5,
        yieldStrength: 730, // Condition A
        ultimateStrength: 930,
        treatments: [
            { id: 'cond_a', name: 'Condition A (Solution Treated)', yieldStrengthMod: 730, tensileStrengthMod: 930, hardnessHv: 280, description: 'Ready for aging.' },
            { id: 'h900', name: 'H900 (Peak Aged)', yieldStrengthMod: 1170, tensileStrengthMod: 1310, hardnessHv: 420, description: 'Max strength.' },
            { id: 'h1150', name: 'H1150 (Overaged)', yieldStrengthMod: 725, tensileStrengthMod: 930, hardnessHv: 310, description: 'Higher ductility/toughness.' }
        ],
        compatibleCoatings: ['none']
    },

    // --- COPPER ALLOYS ---
    {
        id: 'cu_c11000',
        name: 'Copper C11000 (ETP)',
        category: 'Copper Alloy',
        density: 8890,
        E: 117000,
        G: 44000,
        nu: 0.33,
        alpha: 16.5e-6,
        baseCost: 3.0,
        yieldStrength: 69,
        ultimateStrength: 220,
        treatments: [
            { id: 'annealed', name: 'Annealed (O60)', yieldStrengthMod: 69, tensileStrengthMod: 220, hardnessHv: 50, description: 'High conductivity.' },
            { id: 'hard', name: 'Hard (H04)', yieldStrengthMod: 310, tensileStrengthMod: 345, hardnessHv: 100, description: 'Cold worked.' }
        ],
        compatibleCoatings: ['none']
    },
    {
        id: 'brass_c36000',
        name: 'Free-Machining Brass C360',
        category: 'Copper Alloy',
        density: 8500,
        E: 97000,
        G: 37000,
        nu: 0.31,
        alpha: 20.5e-6,
        baseCost: 2.5,
        yieldStrength: 310,
        ultimateStrength: 400,
        treatments: [
            { id: 'half_hard', name: 'Half Hard', yieldStrengthMod: 310, tensileStrengthMod: 400, hardnessHv: 120, description: 'Standard machinable state.' }
        ],
        compatibleCoatings: ['none']
    },

    // --- TITANIUM ---
    {
        id: 'ti_6al4v',
        name: 'Titanium Grade 5 (6Al-4V)',
        category: 'Titanium',
        density: 4430,
        E: 113800,
        G: 42400,
        nu: 0.34,
        alpha: 8.6e-6,
        baseCost: 8.0,
        yieldStrength: 880,
        ultimateStrength: 950,
        treatments: [
            { id: 'annealed', name: 'Annealed', yieldStrengthMod: 880, tensileStrengthMod: 950, hardnessHv: 349, description: 'Standard aerospace.' },
            { id: 'sta', name: 'STA (Solution Treated & Aged)', yieldStrengthMod: 1100, tensileStrengthMod: 1170, hardnessHv: 390, description: 'Max strength.' }
        ],
        compatibleCoatings: ['none'] // Usually left raw or specialized
    },

    // --- POLYMERS (PLASTICS) ---
    {
        id: 'pom_delrin',
        name: 'Acetal / POM (Delrin)',
        category: 'Polymer (Plastic)',
        density: 1420,
        E: 3100,
        G: 1100,
        nu: 0.35,
        alpha: 110e-6,
        baseCost: 1.2,
        yieldStrength: 65,
        ultimateStrength: 70,
        treatments: [
            { id: 'molded', name: 'Standard Molded/Machined', yieldStrengthMod: 65, tensileStrengthMod: 70, hardnessHv: 15, description: 'Self-lubricating, dimensionally stable.' }
        ],
        compatibleCoatings: ['none']
    },
    {
        id: 'peek',
        name: 'PEEK (Unfilled)',
        category: 'Polymer (Plastic)',
        density: 1320,
        E: 3600,
        G: 1300,
        nu: 0.40,
        alpha: 47e-6,
        baseCost: 15.0,
        yieldStrength: 100,
        ultimateStrength: 100,
        treatments: [
            { id: 'extruded', name: 'Extruded', yieldStrengthMod: 100, tensileStrengthMod: 100, hardnessHv: 20, description: 'High temp engineering plastic.' }
        ],
        compatibleCoatings: ['none']
    },

    // --- CERAMICS ---
    {
        id: 'al2o3_99',
        name: 'Alumina 99% (Al2O3)',
        category: 'Ceramic',
        density: 3900,
        E: 370000,
        G: 150000,
        nu: 0.22,
        alpha: 8.1e-6,
        baseCost: 10.0,
        yieldStrength: 2500, // Compressive strength is huge (2500 MPa), Tensile is ~250. Using Compressive for yielding context in FEA?
        // Let's keep tensile for ultimate to break it easily if pulled.
        ultimateStrength: 300,
        treatments: [
            { id: 'sintered', name: 'Sintered', yieldStrengthMod: 2500, tensileStrengthMod: 300, hardnessHv: 1500, description: 'Extreme hardness, brittle.' }
        ],
        compatibleCoatings: ['none']
    }
];

export const MaterialService = {
    getAll: () => MATERIALS,
    getById: (id: string) => MATERIALS.find(m => m.id === id),
    getCoating: (id: string) => COATINGS[id],

    // Helper to calculate exact props based on selection
    resolveProperties: (matId: string, treatId: string) => {
        const mat = MATERIALS.find(m => m.id === matId);
        if (!mat) return null;
        const treat = mat.treatments.find(t => t.id === treatId) || mat.treatments[0];

        return {
            ...mat,
            ...treat,
            id: matId, // Preserve original mat ID
            name: `${mat.name} - ${treat.name}`,
            yieldStrength: treat.yieldStrengthMod,
            ultimateStrength: treat.tensileStrengthMod,
            displayParams: `${mat.name} - ${treat.name}`
        };
    }
};
