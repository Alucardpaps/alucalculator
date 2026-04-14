export interface FitsData {
    grade: string;
    desc: string;
    application: string;
}

export const FITS_DB: FitsData[] = [
    { grade: 'H7/g6', desc: 'Sliding Fit', application: 'Precision sliding parts, guided shafts.' },
    { grade: 'H7/h6', desc: 'Clearance Fit', application: 'Gears, pulleys, couplings on shafts.' },
    { grade: 'H7/k6', desc: 'Transition Fit', application: 'Keyways, bearings requiring light press.' },
    { grade: 'H7/p6', desc: 'Interference Fit', application: 'Pressed bearings, bushes requiring force.' },
    { grade: 'H11/c11', desc: 'Loose Fit', application: 'Agricultural machinery, pivot pins.' },
];

export interface MaterialProp {
    category: string;
    name: string;
    density: number;        // g/cm³
    yield: number;          // MPa (Sy)
    tensile: number;        // MPa (Su)
    hardness: string;
    weldability: string;
    machinability: string;
    // Engineering properties
    youngsModulus: number;  // GPa (E)
    poissonsRatio: number;  // ν (dimensionless)
    shearModulus?: number;  // GPa (G)
    enduranceLimit?: number; // MPa (Se)
    thermalCond?: number;   // W/(m·K)
    thermalExp?: number;    // μm/(m·K) (α)
    specificHeat?: number;  // J/(kg·K)
    elecResist?: number;    // µΩ·cm
    meltingPoint?: number;  // °C
    carbonContent?: number; // %
    // Economic Data
    basePrice: number;      // USD/kg
}

export const MATERIALS_DB: MaterialProp[] = [
    // --- Aluminum ---
    { category: 'Aluminum', name: 'Alu 1050 (Pure)', density: 2.705, yield: 105, tensile: 145, hardness: '35 HB', weldability: 'Excellent', machinability: 'Poor', youngsModulus: 69, poissonsRatio: 0.33, shearModulus: 26, enduranceLimit: 40, thermalCond: 231, thermalExp: 23.6, specificHeat: 900, elecResist: 2.8, meltingPoint: 646, basePrice: 4.50 },
    { category: 'Aluminum', name: 'Alu 2024-T3', density: 2.78, yield: 345, tensile: 483, hardness: '120 HB', weldability: 'Poor', machinability: 'Good', youngsModulus: 73, poissonsRatio: 0.33, shearModulus: 28, enduranceLimit: 138, thermalCond: 121, thermalExp: 23.2, specificHeat: 875, elecResist: 5.8, meltingPoint: 502, basePrice: 4.80 },
    { category: 'Aluminum', name: 'Alu 5083-H116', density: 2.66, yield: 228, tensile: 317, hardness: '75 HB', weldability: 'Excellent', machinability: 'Fair', youngsModulus: 71, poissonsRatio: 0.33, shearModulus: 26, enduranceLimit: 160, thermalCond: 117, thermalExp: 24.2, specificHeat: 900, elecResist: 5.9, meltingPoint: 574, basePrice: 4.60 },
    { category: 'Aluminum', name: '6061-T6 (US Standard)', density: 2.70, yield: 240, tensile: 310, hardness: '95 HB', weldability: 'Good', machinability: 'Good', youngsModulus: 69, poissonsRatio: 0.33, shearModulus: 26, enduranceLimit: 95, thermalCond: 167, thermalExp: 23.6, specificHeat: 896, elecResist: 4.0, meltingPoint: 582, basePrice: 4.50 },
    { category: 'Aluminum', name: '6060 (EU) / 6063 (US Standard)', density: 2.70, yield: 215, tensile: 245, hardness: '75 HB', weldability: 'Good', machinability: 'Fair', youngsModulus: 69, poissonsRatio: 0.33, shearModulus: 26, enduranceLimit: 70, thermalCond: 200, thermalExp: 23.4, specificHeat: 900, elecResist: 3.3, meltingPoint: 615, basePrice: 4.40 },
    { category: 'Aluminum', name: 'Alu 6082-T6', density: 2.71, yield: 260, tensile: 310, hardness: '95 HB', weldability: 'Good', machinability: 'Good', youngsModulus: 70, poissonsRatio: 0.33, shearModulus: 26, enduranceLimit: 95, thermalCond: 180, thermalExp: 24.0, specificHeat: 894, elecResist: 4.0, meltingPoint: 555, basePrice: 4.60 },
    { category: 'Aluminum', name: 'Alu 7075-T6', density: 2.81, yield: 503, tensile: 572, hardness: '150 HB', weldability: 'Poor', machinability: 'Excellent', youngsModulus: 72, poissonsRatio: 0.33, shearModulus: 27, enduranceLimit: 160, thermalCond: 130, thermalExp: 23.4, specificHeat: 860, elecResist: 5.2, meltingPoint: 477, basePrice: 8.50 },

    // --- Steel ---
    { category: 'Steel', name: 'AISI 1018 (Mild)', density: 7.87, yield: 370, tensile: 440, hardness: '126 HB', weldability: 'Excellent', machinability: 'Good', youngsModulus: 205, poissonsRatio: 0.29, shearModulus: 80, enduranceLimit: 220, thermalCond: 51.9, thermalExp: 11.7, specificHeat: 486, elecResist: 15.9, meltingPoint: 1450, carbonContent: 0.18, basePrice: 1.20 },
    { category: 'Steel', name: 'AISI 1020 (Low Carbon)', density: 7.85, yield: 350, tensile: 420, hardness: '120 HB', weldability: 'Excellent', machinability: 'Good', youngsModulus: 200, poissonsRatio: 0.29, shearModulus: 79, enduranceLimit: 225, thermalCond: 50, thermalExp: 12.0, specificHeat: 480, elecResist: 15, meltingPoint: 1420, carbonContent: 0.20, basePrice: 1.20 },
    { category: 'Steel', name: 'AISI 1045 (Carbon)', density: 7.85, yield: 530, tensile: 625, hardness: '163 HB', weldability: 'Fair', machinability: 'Good', youngsModulus: 206, poissonsRatio: 0.29, shearModulus: 79, enduranceLimit: 312, thermalCond: 49.8, thermalExp: 11.3, specificHeat: 486, elecResist: 17.1, meltingPoint: 1410, carbonContent: 0.45, basePrice: 1.40 },
    { category: 'Steel', name: 'AISI 4140 (Cr-Mo)', density: 7.85, yield: 655, tensile: 1020, hardness: '28-32 HRC', weldability: 'Difficult', machinability: 'Good', youngsModulus: 210, poissonsRatio: 0.29, shearModulus: 79, enduranceLimit: 410, thermalCond: 42.6, thermalExp: 12.3, specificHeat: 473, elecResist: 22.2, meltingPoint: 1416, carbonContent: 0.40, basePrice: 2.20 },
    { category: 'Steel', name: 'S235JR (St37)', density: 7.85, yield: 235, tensile: 360, hardness: '120 HB', weldability: 'Excellent', machinability: 'Good', youngsModulus: 210, poissonsRatio: 0.30, shearModulus: 81, enduranceLimit: 180, thermalCond: 50, thermalExp: 12.0, specificHeat: 480, elecResist: 15, meltingPoint: 1420, carbonContent: 0.17, basePrice: 1.10 },
    { category: 'Steel', name: 'S355J2 (St52)', density: 7.85, yield: 355, tensile: 510, hardness: '160 HB', weldability: 'Excellent', machinability: 'Good', youngsModulus: 210, poissonsRatio: 0.30, shearModulus: 81, enduranceLimit: 250, thermalCond: 50, thermalExp: 12.0, specificHeat: 480, elecResist: 15, meltingPoint: 1420, carbonContent: 0.22, basePrice: 1.30 },

    // --- Stainless ---
    { category: 'Stainless', name: 'SS 303 (Free)', density: 8.00, yield: 241, tensile: 621, hardness: '89 HRB', weldability: 'Poor', machinability: 'Excellent', youngsModulus: 193, poissonsRatio: 0.29, shearModulus: 77, enduranceLimit: 170, thermalCond: 16.2, thermalExp: 17.2, specificHeat: 500, elecResist: 72, meltingPoint: 1400, carbonContent: 0.15, basePrice: 6.50 },
    { category: 'Stainless', name: 'SS 304 (Std)', density: 8.00, yield: 215, tensile: 505, hardness: '70 HRB', weldability: 'Excellent', machinability: 'Fair', youngsModulus: 193, poissonsRatio: 0.29, shearModulus: 77, enduranceLimit: 170, thermalCond: 16.2, thermalExp: 17.3, specificHeat: 500, elecResist: 72, meltingPoint: 1400, carbonContent: 0.08, basePrice: 6.00 },
    { category: 'Stainless', name: 'SS 316 (Marine)', density: 8.00, yield: 205, tensile: 515, hardness: '79 HRB', weldability: 'Excellent', machinability: 'Fair', youngsModulus: 193, poissonsRatio: 0.29, shearModulus: 77, enduranceLimit: 200, thermalCond: 16.3, thermalExp: 16.0, specificHeat: 500, elecResist: 74, meltingPoint: 1375, carbonContent: 0.08, basePrice: 7.20 },

    // --- Non-Ferrous ---
    { category: 'Non-Ferrous', name: 'Brass (C360)', density: 8.50, yield: 310, tensile: 400, hardness: '60 HRB', weldability: 'Fair', machinability: 'Excellent', youngsModulus: 97, poissonsRatio: 0.34, shearModulus: 37, enduranceLimit: 100, thermalCond: 115, thermalExp: 20.5, specificHeat: 380, elecResist: 6.6, meltingPoint: 885, basePrice: 9.50 },
    { category: 'Non-Ferrous', name: 'Bronze (C932)', density: 8.93, yield: 125, tensile: 240, hardness: '65 HB', weldability: 'Good', machinability: 'Good', youngsModulus: 103, poissonsRatio: 0.34, shearModulus: 38, enduranceLimit: 80, thermalCond: 59, thermalExp: 18.0, specificHeat: 377, elecResist: 10.9, meltingPoint: 880, basePrice: 12.00 },
    { category: 'Non-Ferrous', name: 'Titanium Gr5', density: 4.43, yield: 880, tensile: 950, hardness: '36 HRC', weldability: 'Fair', machinability: 'Poor', youngsModulus: 114, poissonsRatio: 0.34, shearModulus: 44, enduranceLimit: 350, thermalCond: 6.7, thermalExp: 8.6, specificHeat: 560, elecResist: 171, meltingPoint: 1604, basePrice: 45.00 },

    // --- Superalloys ---
    { category: 'Superalloy', name: 'Inconel 718', density: 8.19, yield: 1034, tensile: 1240, hardness: '36 HRC', weldability: 'Good', machinability: 'Difficult', youngsModulus: 200, poissonsRatio: 0.30, shearModulus: 77, enduranceLimit: 400, thermalCond: 11.4, thermalExp: 13.0, specificHeat: 435, elecResist: 125, meltingPoint: 1260, basePrice: 55.00 },

    // --- Plastics ---
    { category: 'Plastic', name: 'POM (Delrin)', density: 1.41, yield: 70, tensile: 75, hardness: 'M90', weldability: 'N/A', machinability: 'Excellent', youngsModulus: 3.1, poissonsRatio: 0.35, shearModulus: 1.1, enduranceLimit: 25, thermalCond: 0.31, thermalExp: 110, specificHeat: 1500, meltingPoint: 175, basePrice: 4.20 },
    { category: 'Plastic', name: 'PEEK (Virgin)', density: 1.32, yield: 100, tensile: 110, hardness: 'M95', weldability: 'N/A', machinability: 'Fair', youngsModulus: 3.6, poissonsRatio: 0.38, shearModulus: 1.3, enduranceLimit: 35, thermalCond: 0.25, thermalExp: 47, specificHeat: 1340, meltingPoint: 343, basePrice: 15.00 },
];

// Helper to get material by name
export const getMaterial = (name: string): MaterialProp | undefined =>
    MATERIALS_DB.find(m => m.name === name);

// Helper to get materials by category
export const getMaterialsByCategory = (category: string): MaterialProp[] =>
    MATERIALS_DB.filter(m => m.category === category);

// Get all unique categories
export const getMaterialCategories = (): string[] =>
    [...new Set(MATERIALS_DB.map(m => m.category))];
