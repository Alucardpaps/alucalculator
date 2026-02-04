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
    yield: number;          // MPa
    tensile: number;        // MPa
    hardness: string;
    weldability: string;
    machinability: string;
    // NEW: Engineering properties
    youngsModulus: number;  // GPa (E)
    poissonsRatio: number;  // ν (dimensionless)
    thermalCond?: number;   // W/(m·K) - thermal conductivity
    thermalExp?: number;    // µm/(m·K) - coefficient of thermal expansion
    specificHeat?: number;  // J/(kg·K)
    elecResist?: number;    // µΩ·cm - electrical resistivity
    meltingPoint?: number;  // °C - melting point or range start
}

export const MATERIALS_DB: MaterialProp[] = [
    // --- Aluminum ---
    { category: 'Aluminum', name: 'Alu 1050 (Pure)', density: 2.705, yield: 105, tensile: 145, hardness: '35 HB', weldability: 'Excellent', machinability: 'Poor', youngsModulus: 69, poissonsRatio: 0.33, thermalCond: 231, thermalExp: 23.6, specificHeat: 900, elecResist: 2.8, meltingPoint: 646 },
    { category: 'Aluminum', name: 'Alu 2024-T3', density: 2.78, yield: 345, tensile: 483, hardness: '120 HB', weldability: 'Poor', machinability: 'Good', youngsModulus: 73, poissonsRatio: 0.33, thermalCond: 121, thermalExp: 23.2, specificHeat: 875, elecResist: 5.8, meltingPoint: 502 },
    { category: 'Aluminum', name: 'Alu 5083-H116', density: 2.66, yield: 228, tensile: 317, hardness: '75 HB', weldability: 'Excellent', machinability: 'Fair', youngsModulus: 71, poissonsRatio: 0.33, thermalCond: 117, thermalExp: 24.2, specificHeat: 900, elecResist: 5.9, meltingPoint: 574 },
    { category: 'Aluminum', name: '6061-T6 (US Standard)', density: 2.70, yield: 240, tensile: 310, hardness: '95 HB', weldability: 'Good', machinability: 'Good', youngsModulus: 69, poissonsRatio: 0.33, thermalCond: 167, thermalExp: 23.6, specificHeat: 896, elecResist: 4.0, meltingPoint: 582 },
    { category: 'Aluminum', name: '6060 (EU) / 6063 (US Standard)', density: 2.70, yield: 215, tensile: 245, hardness: '75 HB', weldability: 'Good', machinability: 'Fair', youngsModulus: 69, poissonsRatio: 0.33, thermalCond: 200, thermalExp: 23.4, specificHeat: 900, elecResist: 3.3, meltingPoint: 615 },
    { category: 'Aluminum', name: 'Alu 6082-T6', density: 2.71, yield: 260, tensile: 310, hardness: '95 HB', weldability: 'Good', machinability: 'Good', youngsModulus: 70, poissonsRatio: 0.33, thermalCond: 180, thermalExp: 24.0, specificHeat: 894, elecResist: 4.0, meltingPoint: 555 },
    { category: 'Aluminum', name: 'Alu 7075-T6', density: 2.81, yield: 503, tensile: 572, hardness: '150 HB', weldability: 'Poor', machinability: 'Excellent', youngsModulus: 72, poissonsRatio: 0.33, thermalCond: 130, thermalExp: 23.4, specificHeat: 860, elecResist: 5.2, meltingPoint: 477 },

    // --- Steel ---
    { category: 'Steel', name: 'AISI 1018 (Mild)', density: 7.87, yield: 370, tensile: 440, hardness: '126 HB', weldability: 'Excellent', machinability: 'Good', youngsModulus: 205, poissonsRatio: 0.29, thermalCond: 51.9, thermalExp: 11.7, specificHeat: 486, elecResist: 15.9, meltingPoint: 1450 },
    { category: 'Steel', name: 'AISI 1045 (Carbon)', density: 7.85, yield: 530, tensile: 625, hardness: '163 HB', weldability: 'Fair', machinability: 'Good', youngsModulus: 206, poissonsRatio: 0.29, thermalCond: 49.8, thermalExp: 11.3, specificHeat: 486, elecResist: 17.1, meltingPoint: 1410 },
    { category: 'Steel', name: 'AISI 4140 (Cr-Mo)', density: 7.85, yield: 655, tensile: 850, hardness: '28-32 HRC', weldability: 'Difficult', machinability: 'Good', youngsModulus: 210, poissonsRatio: 0.29, thermalCond: 42.6, thermalExp: 12.3, specificHeat: 473, elecResist: 22.2, meltingPoint: 1416 },
    { category: 'Steel', name: 'AISI 4340 (High St)', density: 7.85, yield: 710, tensile: 1110, hardness: '260 HB', weldability: 'Difficult', machinability: 'Good', youngsModulus: 205, poissonsRatio: 0.29, thermalCond: 44.5, thermalExp: 12.3, specificHeat: 475, elecResist: 24.8, meltingPoint: 1427 },

    // --- Stainless ---
    { category: 'Stainless', name: 'SS 303 (Free)', density: 8.00, yield: 241, tensile: 621, hardness: '89 HRB', weldability: 'Poor', machinability: 'Excellent', youngsModulus: 193, poissonsRatio: 0.29, thermalCond: 16.2, thermalExp: 17.2, specificHeat: 500, elecResist: 72, meltingPoint: 1400 },
    { category: 'Stainless', name: 'SS 304 (Std)', density: 8.00, yield: 215, tensile: 505, hardness: '70 HRB', weldability: 'Excellent', machinability: 'Fair', youngsModulus: 193, poissonsRatio: 0.29, thermalCond: 16.2, thermalExp: 17.3, specificHeat: 500, elecResist: 72, meltingPoint: 1400 },
    { category: 'Stainless', name: 'SS 316 (Marine)', density: 8.00, yield: 205, tensile: 515, hardness: '79 HRB', weldability: 'Excellent', machinability: 'Fair', youngsModulus: 193, poissonsRatio: 0.29, thermalCond: 16.3, thermalExp: 16.0, specificHeat: 500, elecResist: 74, meltingPoint: 1375 },
    { category: 'Stainless', name: 'SS 416 (Mart.)', density: 7.75, yield: 275, tensile: 517, hardness: '82 HRB', weldability: 'Poor', machinability: 'Good', youngsModulus: 200, poissonsRatio: 0.28, thermalCond: 24.9, thermalExp: 9.9, specificHeat: 460, elecResist: 57, meltingPoint: 1480 },
    { category: 'Stainless', name: '17-4 PH (H900)', density: 7.80, yield: 1170, tensile: 1310, hardness: '44 HRC', weldability: 'Good', machinability: 'Fair', youngsModulus: 197, poissonsRatio: 0.27, thermalCond: 18.4, thermalExp: 10.8, specificHeat: 460, elecResist: 80, meltingPoint: 1400 },

    // --- Non-Ferrous ---
    { category: 'Non-Ferrous', name: 'Brass (C360)', density: 8.50, yield: 310, tensile: 400, hardness: '60 HRB', weldability: 'Fair', machinability: 'Excellent', youngsModulus: 97, poissonsRatio: 0.34, thermalCond: 115, thermalExp: 20.5, specificHeat: 380, elecResist: 6.6, meltingPoint: 885 },
    { category: 'Non-Ferrous', name: 'Bronze (C932)', density: 8.93, yield: 125, tensile: 240, hardness: '65 HB', weldability: 'Good', machinability: 'Good', youngsModulus: 103, poissonsRatio: 0.34, thermalCond: 59, thermalExp: 18.0, specificHeat: 377, elecResist: 10.9, meltingPoint: 880 },
    { category: 'Non-Ferrous', name: 'Copper (C110)', density: 8.94, yield: 69, tensile: 220, hardness: '87 HRB', weldability: 'Good', machinability: 'Poor', youngsModulus: 117, poissonsRatio: 0.34, thermalCond: 388, thermalExp: 17.0, specificHeat: 385, elecResist: 1.7, meltingPoint: 1083 },
    { category: 'Non-Ferrous', name: 'Titanium Gr2', density: 4.51, yield: 275, tensile: 345, hardness: '160 HB', weldability: 'Good', machinability: 'Fair', youngsModulus: 105, poissonsRatio: 0.34, thermalCond: 16.4, thermalExp: 8.6, specificHeat: 523, elecResist: 56, meltingPoint: 1665 },
    { category: 'Non-Ferrous', name: 'Titanium Gr5', density: 4.43, yield: 880, tensile: 950, hardness: '36 HRC', weldability: 'Fair', machinability: 'Poor', youngsModulus: 114, poissonsRatio: 0.34, thermalCond: 6.7, thermalExp: 8.6, specificHeat: 560, elecResist: 171, meltingPoint: 1604 },

    // --- Superalloys ---
    { category: 'Superalloy', name: 'Inconel 625', density: 8.44, yield: 517, tensile: 930, hardness: '180 HB', weldability: 'Good', machinability: 'Difficult', youngsModulus: 208, poissonsRatio: 0.31, thermalCond: 9.8, thermalExp: 12.8, specificHeat: 410, elecResist: 129, meltingPoint: 1290 },
    { category: 'Superalloy', name: 'Inconel 718', density: 8.19, yield: 1034, tensile: 1240, hardness: '36 HRC', weldability: 'Good', machinability: 'Difficult', youngsModulus: 200, poissonsRatio: 0.30, thermalCond: 11.4, thermalExp: 13.0, specificHeat: 435, elecResist: 125, meltingPoint: 1260 },
    { category: 'Superalloy', name: 'Monel 400', density: 8.80, yield: 240, tensile: 550, hardness: '65 HRB', weldability: 'Good', machinability: 'Difficult', youngsModulus: 180, poissonsRatio: 0.32, thermalCond: 21.8, thermalExp: 13.9, specificHeat: 427, elecResist: 54, meltingPoint: 1300 },

    // --- Plastics ---
    { category: 'Plastic', name: 'ABS', density: 1.04, yield: 45, tensile: 45, hardness: 'R105', weldability: 'N/A', machinability: 'Good', youngsModulus: 2.3, poissonsRatio: 0.35, thermalCond: 0.17, thermalExp: 80, specificHeat: 1470, meltingPoint: 105 },
    { category: 'Plastic', name: 'Nylon 6 (PA6)', density: 1.13, yield: 80, tensile: 85, hardness: 'R120', weldability: 'N/A', machinability: 'Good', youngsModulus: 2.9, poissonsRatio: 0.39, thermalCond: 0.25, thermalExp: 80, specificHeat: 1700, meltingPoint: 220 },
    { category: 'Plastic', name: 'Polycarb (PC)', density: 1.20, yield: 60, tensile: 65, hardness: 'R118', weldability: 'N/A', machinability: 'Good', youngsModulus: 2.4, poissonsRatio: 0.37, thermalCond: 0.20, thermalExp: 70, specificHeat: 1200, meltingPoint: 155 },
    { category: 'Plastic', name: 'PEEK (Virgin)', density: 1.32, yield: 100, tensile: 110, hardness: 'M95', weldability: 'N/A', machinability: 'Fair', youngsModulus: 3.6, poissonsRatio: 0.38, thermalCond: 0.25, thermalExp: 47, specificHeat: 1340, meltingPoint: 343 },
    { category: 'Plastic', name: 'POM (Delrin)', density: 1.41, yield: 70, tensile: 75, hardness: 'M90', weldability: 'N/A', machinability: 'Excellent', youngsModulus: 3.1, poissonsRatio: 0.35, thermalCond: 0.31, thermalExp: 110, specificHeat: 1500, meltingPoint: 175 },
    { category: 'Plastic', name: 'PTFE (Teflon)', density: 2.16, yield: 23, tensile: 28, hardness: 'D55', weldability: 'N/A', machinability: 'Poor', youngsModulus: 0.5, poissonsRatio: 0.46, thermalCond: 0.25, thermalExp: 135, specificHeat: 1000, meltingPoint: 327 },
    { category: 'Plastic', name: 'PVC (Rigid)', density: 1.40, yield: 50, tensile: 55, hardness: 'R110', weldability: 'N/A', machinability: 'Good', youngsModulus: 2.9, poissonsRatio: 0.40, thermalCond: 0.16, thermalExp: 80, specificHeat: 900, meltingPoint: 75 },
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

