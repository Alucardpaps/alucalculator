export interface ElementsComposition {
    [atomicNumber: number]: number; // Atomic Number -> Count
}

export interface ChemicalCompound {
    id: string;
    name: string;
    formula: string;
    category: 'Acid' | 'Base' | 'Salt' | 'Oxide' | 'Organic' | 'Mineral' | 'Alloy' | 'Gas' | 'Other';
    bondType?: 'ionic' | 'covalent' | 'hydrogen' | 'london';
    elements: number[]; // Array of atomic numbers present in the compound
    composition: ElementsComposition;
    description: string;
    synthesis?: string; // Text detailing how it is produced
    applications?: string; // Text detailing common industrial or research uses
    properties: {
        molarMass?: number; // g/mol
        density?: number; // g/cm³
        stateAtSTP?: 'Solid' | 'Liquid' | 'Gas';
        meltPoint?: number; // Kelvin
        boilPoint?: number; // Kelvin
    };
}

export const CHEMICAL_COMPOUNDS: ChemicalCompound[] = [
    // === ACIDS ===
    {
        id: "acid-sulfuric", name: "Sulfuric Acid", formula: "H₂SO₄", category: "Acid", bondType: "covalent",
        elements: [1, 16, 8], composition: { 1: 2, 16: 1, 8: 4 },
        description: "A highly corrosive strong mineral acid. The most produced chemical in the world, vital for industrial synthesis and battery acid.",
        synthesis: "Produced on an immense scale via the Contact Process: oxidation of sulfur dioxide (SO₂) to sulfur trioxide (SO₃) over a vanadium prior catalyst, then dissolved in concentrated sulfuric acid to form oleum, which is diluted.",
        applications: "Fertilizer manufacturing (superphosphates), petroleum refining, wastewater processing, automotive lead-acid batteries, and mineral extraction.",
        properties: { molarMass: 98.079, density: 1.83, stateAtSTP: 'Liquid', meltPoint: 283.46, boilPoint: 610 }
    },
    {
        id: "acid-hydrochloric", name: "Hydrochloric Acid", formula: "HCl", category: "Acid", bondType: "covalent",
        elements: [1, 17], composition: { 1: 1, 17: 1 },
        description: "An aqueous solution of hydrogen chloride gas. A strong, highly corrosive acid, naturally found in gastric acid.",
        properties: { molarMass: 36.46, density: 1.18, stateAtSTP: 'Liquid', meltPoint: 245.8, boilPoint: 381.5 }
    },
    {
        id: "acid-nitric", name: "Nitric Acid", formula: "HNO₃", category: "Acid", bondType: "covalent",
        elements: [1, 7, 8], composition: { 1: 1, 7: 1, 8: 3 },
        description: "A highly corrosive mineral acid. Primary reagent used for nitration, essential for fertilizers and explosives.",
        properties: { molarMass: 63.01, density: 1.51, stateAtSTP: 'Liquid', meltPoint: 231, boilPoint: 356 }
    },
    {
        id: "acid-acetic", name: "Acetic Acid", formula: "CH₃COOH", category: "Acid", bondType: "covalent",
        elements: [6, 1, 8], composition: { 6: 2, 1: 4, 8: 2 },
        description: "A weak organic acid that gives vinegar its sour taste and pungent smell.",
        properties: { molarMass: 60.052, density: 1.049, stateAtSTP: 'Liquid', meltPoint: 289.8, boilPoint: 391.2 }
    },
    {
        id: "acid-phosphoric", name: "Phosphoric Acid", formula: "H₃PO₄", category: "Acid", bondType: "covalent",
        elements: [1, 15, 8], composition: { 1: 3, 15: 1, 8: 4 },
        description: "A weak acid used extensively in fertilizers, rust removal, and as a food additive (cola drinks).",
        properties: { molarMass: 97.994, density: 1.88, stateAtSTP: 'Solid', meltPoint: 315.5, boilPoint: 431 }
    },

    // === BASES ===
    {
        id: "base-naoh", name: "Sodium Hydroxide", formula: "NaOH", category: "Base", bondType: "ionic",
        elements: [11, 8, 1], composition: { 11: 1, 8: 1, 1: 1 },
        description: "Commonly known as lye or caustic soda. A highly caustic metallic base and alkali salt, used in soap making and drain cleaners.",
        synthesis: "Manufactured industrially through the chloralkali process: electrolysis of aqueous sodium chloride (brine) using mercury, diaphragm, or membrane cells, producing chlorine gas and sodium hydroxide solution.",
        applications: "Saponification for soaps and detergents, paper production (Kraft process), water treatment, aluminum refinement (Bayer process), and food preparation.",
        properties: { molarMass: 39.997, density: 2.13, stateAtSTP: 'Solid', meltPoint: 591, boilPoint: 1661 }
    },
    {
        id: "base-koh", name: "Potassium Hydroxide", formula: "KOH", category: "Base", bondType: "ionic",
        elements: [19, 8, 1], composition: { 19: 1, 8: 1, 1: 1 },
        description: "Caustic potash, a strong base similar to NaOH but more soluble. Used in alkaline batteries and soft soaps.",
        properties: { molarMass: 56.105, density: 2.12, stateAtSTP: 'Solid', meltPoint: 633, boilPoint: 1599 }
    },
    {
        id: "base-ammonia", name: "Ammonia", formula: "NH₃", category: "Base", bondType: "hydrogen",
        elements: [7, 1], composition: { 7: 1, 1: 3 },
        description: "A colorless gas with a pungent smell. A weak base when dissolved in water, vital for fertilizers and cleaning products.",
        synthesis: "Almost exclusively synthesized by the Haber-Bosch process: direct reaction of nitrogen (N₂) and hydrogen gas (H₂) at high pressure (150–250 bar) and temperature (400–500 °C) over an iron or ruthenium catalyst.",
        applications: "Precursor to nearly all synthetic nitrogenous fertilizers globally. Used in refrigeration cycles, as a household cleaning agent, and to manufacture nitric acid via the Ostwald process.",
        properties: { molarMass: 17.031, density: 0.73, stateAtSTP: 'Gas', meltPoint: 195.4, boilPoint: 239.8 }
    },
    {
        id: "base-caoh2", name: "Calcium Hydroxide", formula: "Ca(OH)₂", category: "Base", bondType: "ionic",
        elements: [20, 8, 1], composition: { 20: 1, 8: 2, 1: 2 },
        description: "Slaked lime. An inorganic compound used in water treatment, mortar, plasters, and cements.",
        synthesis: "Produced commercially by treating quicklime (calcium oxide, CaO, derived from heating limestone) with water. This highly exothermic hydration reaction is known as slaking.",
        applications: "Flocculant in water and sewage treatment, ingredient in Portland cement, mortar, and plaster, neutralizing acidic soil, and hair relaxers.",
        properties: { molarMass: 74.093, density: 2.211, stateAtSTP: 'Solid', meltPoint: 853, boilPoint: undefined }
    },

    // === SALTS ===
    {
        id: "salt-nacl", name: "Sodium Chloride", formula: "NaCl", category: "Salt", bondType: "ionic",
        elements: [11, 17], composition: { 11: 1, 17: 1 },
        description: "Table salt. An ionic compound crucial for life, widely used as a condiment and food preservative.",
        properties: { molarMass: 58.44, density: 2.16, stateAtSTP: 'Solid', meltPoint: 1074, boilPoint: 1738 }
    },
    {
        id: "salt-kmno4", name: "Potassium Permanganate", formula: "KMnO₄", category: "Salt", bondType: "ionic",
        elements: [19, 25, 8], composition: { 19: 1, 25: 1, 8: 4 },
        description: "A dark purple crystalline salt, a strong oxidizing agent used in medicine and water treatment.",
        properties: { molarMass: 158.034, density: 2.7, stateAtSTP: 'Solid', meltPoint: 513, boilPoint: undefined }
    },
    {
        id: "salt-cuso4", name: "Copper(II) Sulfate", formula: "CuSO₄", category: "Salt", bondType: "ionic",
        elements: [29, 16, 8], composition: { 29: 1, 16: 1, 8: 4 },
        description: "A brilliant blue salt (when hydrated) used as an algaecide, fungicide, and in electroplating.",
        properties: { molarMass: 159.609, density: 3.6, stateAtSTP: 'Solid', meltPoint: 383, boilPoint: undefined }
    },
    {
        id: "salt-caco3", name: "Calcium Carbonate", formula: "CaCO₃", category: "Salt", bondType: "ionic",
        elements: [20, 6, 8], composition: { 20: 1, 6: 1, 8: 3 },
        description: "The main component of shells, pearls, eggshells, and limestone. Used in antacids and chalk.",
        properties: { molarMass: 100.086, density: 2.71, stateAtSTP: 'Solid', meltPoint: 1102, boilPoint: undefined }
    },
    {
        id: "salt-nahco3", name: "Sodium Bicarbonate", formula: "NaHCO₃", category: "Salt", bondType: "ionic",
        elements: [11, 1, 6, 8], composition: { 11: 1, 1: 1, 6: 1, 8: 3 },
        description: "Baking soda. A versatile salt used in baking, cleaning, and as an antacid.",
        properties: { molarMass: 84.006, density: 2.2, stateAtSTP: 'Solid', meltPoint: 323, boilPoint: undefined }
    },

    // === OXIDES ===
    {
        id: "oxide-water", name: "Water", formula: "H₂O", category: "Oxide", bondType: "hydrogen",
        elements: [1, 8], composition: { 1: 2, 8: 1 },
        description: "Dihydrogen monoxide. The most abundant compound on Earth's surface, essential for all known life.",
        properties: { molarMass: 18.015, density: 0.997, stateAtSTP: 'Liquid', meltPoint: 273.15, boilPoint: 373.15 }
    },
    {
        id: "oxide-carbon", name: "Carbon Dioxide", formula: "CO₂", category: "Oxide", bondType: "covalent",
        elements: [6, 8], composition: { 6: 1, 8: 2 },
        description: "A colorless gas vital to plant life. A greenhouse gas produced by respiration and combustion.",
        properties: { molarMass: 44.01, density: 1.977, stateAtSTP: 'Gas', meltPoint: 194.7, boilPoint: 194.7 }
    },
    {
        id: "oxide-iron", name: "Iron(III) Oxide", formula: "Fe₂O₃", category: "Oxide", bondType: "ionic",
        elements: [26, 8], composition: { 26: 2, 8: 3 },
        description: "Common rust. A major iron ore, also used as a pigment (rouge).",
        properties: { molarMass: 159.69, density: 5.24, stateAtSTP: 'Solid', meltPoint: 1838, boilPoint: undefined }
    },
    {
        id: "oxide-alumina", name: "Aluminum Oxide", formula: "Al₂O₃", category: "Oxide", bondType: "ionic",
        elements: [13, 8], composition: { 13: 2, 8: 3 },
        description: "Alumina. Forms ruby and sapphire gems when containing impurities. Used extensively in ceramics and as an abrasive.",
        properties: { molarMass: 101.96, density: 3.95, stateAtSTP: 'Solid', meltPoint: 2345, boilPoint: 3250 }
    },
    {
        id: "oxide-silica", name: "Silicon Dioxide", formula: "SiO₂", category: "Oxide", bondType: "covalent",
        elements: [14, 8], composition: { 14: 1, 8: 2 },
        description: "Silica. The main constituent of sand and glass, naturally found as quartz.",
        properties: { molarMass: 60.08, density: 2.648, stateAtSTP: 'Solid', meltPoint: 1983, boilPoint: 2503 }
    },

    // === ORGANIC ===
    {
        id: "org-methane", name: "Methane", formula: "CH₄", category: "Organic", bondType: "london",
        elements: [6, 1], composition: { 6: 1, 1: 4 },
        description: "The simplest alkane and the primary component of natural gas.",
        properties: { molarMass: 16.04, density: 0.656, stateAtSTP: 'Gas', meltPoint: 90.7, boilPoint: 111.6 }
    },
    {
        id: "org-ethanol", name: "Ethanol", formula: "C₂H₅OH", category: "Organic", bondType: "hydrogen",
        elements: [6, 1, 8], composition: { 6: 2, 1: 6, 8: 1 },
        description: "Drinking alcohol. A volatile, flammable, colorless liquid used as a solvent and fuel.",
        properties: { molarMass: 46.07, density: 0.789, stateAtSTP: 'Liquid', meltPoint: 159, boilPoint: 351.5 }
    },
    {
        id: "org-glucose", name: "Glucose", formula: "C₆H₁₂O₆", category: "Organic", bondType: "covalent",
        elements: [6, 1, 8], composition: { 6: 6, 1: 12, 8: 6 },
        description: "A simple sugar that serves as the primary energy source in biology.",
        properties: { molarMass: 180.156, density: 1.54, stateAtSTP: 'Solid', meltPoint: 419, boilPoint: undefined }
    },
    {
        id: "org-benzene", name: "Benzene", formula: "C₆H₆", category: "Organic", bondType: "london",
        elements: [6, 1], composition: { 6: 6, 1: 6 },
        description: "A highly significant aromatic hydrocarbon, serving as an intermediate to make many other chemicals.",
        properties: { molarMass: 78.11, density: 0.876, stateAtSTP: 'Liquid', meltPoint: 278.6, boilPoint: 353.2 }
    },
    {
        id: "org-caffeine", name: "Caffeine", formula: "C₈H₁₀N₄O₂", category: "Organic", bondType: "london",
        elements: [6, 1, 7, 8], composition: { 6: 8, 1: 10, 7: 4, 8: 2 },
        description: "A central nervous system stimulant, the world's most widely consumed psychoactive drug.",
        properties: { molarMass: 194.19, density: 1.23, stateAtSTP: 'Solid', meltPoint: 510, boilPoint: undefined }
    },

    // === ALLOYS & METALS ===
    {
        id: "alloy-steel", name: "Carbon Steel", formula: "Fe-C", category: "Alloy",
        elements: [26, 6], composition: { 26: 99, 6: 1 },
        description: "An alloy of iron and carbon, wildly used in construction and infrastructure.",
        properties: { density: 7.85, stateAtSTP: 'Solid', meltPoint: 1780 }
    },
    {
        id: "alloy-brass", name: "Brass", formula: "Cu-Zn", category: "Alloy",
        elements: [29, 30], composition: { 29: 60, 30: 40 },
        description: "An alloy of copper and zinc, known for its gold-like appearance and acoustic properties.",
        properties: { density: 8.73, stateAtSTP: 'Solid', meltPoint: 1200 }
    },
    {
        id: "alloy-bronze", name: "Bronze", formula: "Cu-Sn", category: "Alloy",
        elements: [29, 50], composition: { 29: 88, 50: 12 },
        description: "An alloy primarily of copper and tin. Harder and more durable than pure iron.",
        properties: { density: 8.8, stateAtSTP: 'Solid', meltPoint: 1223 }
    },

    // === MINERALS ===
    {
        id: "min-quartz", name: "Quartz", formula: "SiO₂", category: "Mineral", bondType: "covalent",
        elements: [14, 8], composition: { 14: 1, 8: 2 },
        description: "A hard, crystalline mineral composed of silica. The second most abundant mineral in Earth's continental crust.",
        properties: { molarMass: 60.08, density: 2.65, stateAtSTP: 'Solid', meltPoint: 1946, boilPoint: undefined }
    },
    {
        id: "min-corundum", name: "Corundum", formula: "Al₂O₃", category: "Mineral", bondType: "ionic",
        elements: [13, 8], composition: { 13: 2, 8: 3 },
        description: "A crystalline form of aluminum oxide. Transparent varieties include rubies and sapphires.",
        properties: { molarMass: 101.96, density: 4.02, stateAtSTP: 'Solid', meltPoint: 2318, boilPoint: 3253 }
    },

    // === ADDITIONAL TEXTBOOK EXTENSIONS ===
    {
        id: "acid-carbonic", name: "Carbonic Acid", formula: "H₂CO₃", category: "Acid", bondType: "covalent",
        elements: [1, 6, 8], composition: { 1: 2, 6: 1, 8: 3 },
        description: "A weak acid formed in solution when carbon dioxide dissolves in water. Vital for blood buffer systems.",
        properties: { molarMass: 62.03, density: 1.66, stateAtSTP: 'Liquid', meltPoint: 211, boilPoint: undefined }
    },
    {
        id: "acid-hydrocyanic", name: "Hydrocyanic Acid", formula: "HCN", category: "Acid", bondType: "covalent",
        elements: [1, 6, 7], composition: { 1: 1, 6: 1, 7: 1 },
        description: "A highly poisonous, colorless liquid that boils slightly above room temperature.",
        properties: { molarMass: 27.03, density: 0.687, stateAtSTP: 'Liquid', meltPoint: 259.8, boilPoint: 299 }
    },
    {
        id: "base-mgoh2", name: "Magnesium Hydroxide", formula: "Mg(OH)₂", category: "Base", bondType: "ionic",
        elements: [12, 8, 1], composition: { 12: 1, 8: 2, 1: 2 },
        description: "Milk of magnesia. An inorganic compound used as an antacid and laxative.",
        properties: { molarMass: 58.32, density: 2.34, stateAtSTP: 'Solid', meltPoint: 623, boilPoint: undefined }
    },
    {
        id: "salt-kno3", name: "Potassium Nitrate", formula: "KNO₃", category: "Salt", bondType: "ionic",
        elements: [19, 7, 8], composition: { 19: 1, 7: 1, 8: 3 },
        description: "Saltpeter. An alkali metal nitrate used in fertilizers, tree stump removal, rocket propellants.",
        properties: { molarMass: 101.10, density: 2.11, stateAtSTP: 'Solid', meltPoint: 607, boilPoint: 673 }
    },
    {
        id: "salt-agno3", name: "Silver Nitrate", formula: "AgNO₃", category: "Salt", bondType: "ionic",
        elements: [47, 7, 8], composition: { 47: 1, 7: 1, 8: 3 },
        description: "A versatile inorganic compound which serves as a precursor to many other silver compounds.",
        properties: { molarMass: 169.87, density: 4.35, stateAtSTP: 'Solid', meltPoint: 485, boilPoint: 713 }
    },
    {
        id: "salt-nh4cl", name: "Ammonium Chloride", formula: "NH₄Cl", category: "Salt", bondType: "ionic",
        elements: [7, 1, 17], composition: { 7: 1, 1: 4, 17: 1 },
        description: "A white crystalline salt that is highly soluble in water. Solutions are mildly acidic.",
        properties: { molarMass: 53.49, density: 1.53, stateAtSTP: 'Solid', meltPoint: 611, boilPoint: undefined }
    },
    {
        id: "oxide-zno", name: "Zinc Oxide", formula: "ZnO", category: "Oxide", bondType: "ionic",
        elements: [30, 8], composition: { 30: 1, 8: 1 },
        description: "An inorganic compound widely used as an additive in numerous materials and products including plastics.",
        properties: { molarMass: 81.38, density: 5.6, stateAtSTP: 'Solid', meltPoint: 2248, boilPoint: undefined }
    },
    {
        id: "oxide-tio2", name: "Titanium Dioxide", formula: "TiO₂", category: "Oxide", bondType: "ionic",
        elements: [22, 8], composition: { 22: 1, 8: 2 },
        description: "A naturally occurring oxide of titanium, sourced from ilmenite, rutile and anatase. Used universally as a white pigment.",
        properties: { molarMass: 79.87, density: 4.23, stateAtSTP: 'Solid', meltPoint: 2116, boilPoint: 3245 }
    },
    {
        id: "org-propane", name: "Propane", formula: "C₃H₈", category: "Organic", bondType: "london",
        elements: [6, 1], composition: { 6: 3, 1: 8 },
        description: "A three-carbon alkane. Gas at standard temperature and pressure, but compressible to transportable liquid.",
        properties: { molarMass: 44.1, density: 1.88, stateAtSTP: 'Gas', meltPoint: 85.5, boilPoint: 231.1 }
    },
    {
        id: "org-methanol", name: "Methanol", formula: "CH₃OH", category: "Organic", bondType: "hydrogen",
        elements: [6, 1, 8], composition: { 6: 1, 1: 4, 8: 1 },
        description: "Wood alcohol. The simplest alcohol, highly toxic, light, volatile, colorless, and flammable liquid.",
        properties: { molarMass: 32.04, density: 0.792, stateAtSTP: 'Liquid', meltPoint: 175.6, boilPoint: 337.8 }
    },
    {
        id: "gas-n2", name: "Nitrogen Gas", formula: "N₂", category: "Gas", bondType: "covalent",
        elements: [7], composition: { 7: 2 },
        description: "A colorless, odorless diatomic gas that makes up roughly 78% of Earth's atmosphere.",
        properties: { molarMass: 28.01, density: 1.25, stateAtSTP: 'Gas', meltPoint: 63.15, boilPoint: 77.36 }
    },
    {
        id: "gas-o2", name: "Oxygen Gas", formula: "O₂", category: "Gas", bondType: "covalent",
        elements: [8], composition: { 8: 2 },
        description: "A member of the chalcogen group, a highly reactive nonmetal and an oxidizing agent.",
        properties: { molarMass: 32.00, density: 1.43, stateAtSTP: 'Gas', meltPoint: 54.36, boilPoint: 90.18 }
    },
    {
        id: "gas-cl2", name: "Chlorine Gas", formula: "Cl₂", category: "Gas", bondType: "covalent",
        elements: [17], composition: { 17: 2 },
        description: "A yellow-green gas at room temperature, it is an extremely reactive element and strong oxidizing agent.",
        properties: { molarMass: 70.90, density: 3.2, stateAtSTP: 'Gas', meltPoint: 171.6, boilPoint: 239.1 }
    },

    // === INDUSTRIAL SOLVENTS & MONOMERS ===
    {
        id: "org-acetone", name: "Acetone", formula: "CH₃COCH₃", category: "Organic", bondType: "london",
        elements: [6, 1, 8], composition: { 6: 3, 1: 6, 8: 1 },
        description: "The simplest and smallest ketone. It is a colorless, highly volatile and flammable liquid with a pungent odor. Important solvent.",
        properties: { molarMass: 58.08, density: 0.784, stateAtSTP: 'Liquid', meltPoint: 178.5, boilPoint: 329 }
    },
    {
        id: "org-toluene", name: "Toluene", formula: "C₇H₈", category: "Organic", bondType: "london",
        elements: [6, 1], composition: { 6: 7, 1: 8 },
        description: "An aromatic hydrocarbon. Widely used as an industrial feedstock and a solvent.",
        properties: { molarMass: 92.14, density: 0.867, stateAtSTP: 'Liquid', meltPoint: 178, boilPoint: 383.8 }
    },
    {
        id: "org-hexane", name: "Hexane", formula: "C₆H₁₄", category: "Organic", bondType: "london",
        elements: [6, 1], composition: { 6: 6, 1: 14 },
        description: "An alkane with six carbon atoms. Significant constituent of gasoline and heavily used as a specialized solvent.",
        properties: { molarMass: 86.18, density: 0.655, stateAtSTP: 'Liquid', meltPoint: 178, boilPoint: 342 }
    },
    {
        id: "org-ethylene", name: "Ethylene", formula: "C₂H₄", category: "Organic", bondType: "london",
        elements: [6, 1], composition: { 6: 2, 1: 4 },
        description: "The simplest alkene. Extensively used in chemical industry, mostly as a precursor to polyethylene.",
        properties: { molarMass: 28.05, density: 1.178, stateAtSTP: 'Gas', meltPoint: 104, boilPoint: 169.5 }
    },
    {
        id: "org-styrene", name: "Styrene", formula: "C₈H₈", category: "Organic", bondType: "london",
        elements: [6, 1], composition: { 6: 8, 1: 8 },
        description: "A derivative of benzene. Precursor to polystyrene and several copolymers.",
        properties: { molarMass: 104.15, density: 0.909, stateAtSTP: 'Liquid', meltPoint: 242, boilPoint: 418 }
    }
];
