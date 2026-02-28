/**
 * Machinery's Handbook 31st Edition - Structural Framework
 * This file defines the organization of the handbook for future site integration.
 */

export interface HandbookStructure {
    id: string;
    title: string;
    sections: {
        id: string;
        title: string;
        pageReference?: number;
    }[];
}

export const HANDBOOK_31_STRUCTURE: HandbookStructure[] = [
    {
        id: 'mathematics',
        title: 'Mathematics',
        sections: [
            { id: 'symbols', title: 'Mathematical Symbols and Abbreviations' },
            { id: 'fractions', title: 'Fractions and Decimals' },
            { id: 'algebra', title: 'Algebra and Equations' },
            { id: 'geometry', title: 'Geometry and Mensuration' },
            { id: 'trigonometry', title: 'Trigonometry' },
            { id: 'calculus', title: 'Calculus' },
            { id: 'statistics', title: 'Statistics' }
        ]
    },
    {
        id: 'mechanics',
        title: 'Mechanics',
        sections: [
            { id: 'force', title: 'Force and Motion' },
            { id: 'torque', title: 'Torque and Work' },
            { id: 'friction', title: 'Friction' },
            { id: 'pulleys', title: 'Pulleys and Belts' },
            { id: 'levers', title: 'Levers' },
            { id: 'balancing', title: 'Balancing' }
        ]
    },
    {
        id: 'strength-of-materials',
        title: 'Strength of Materials',
        sections: [
            { id: 'stress-strain', title: 'Stress, Strain and Modulus' },
            { id: 'beams', title: 'Beam Theory and Formulas' },
            { id: 'columns', title: 'Columns and Struts' },
            { id: 'shafts', title: 'Shaft Stresses and Deflections' },
            { id: 'springs', title: 'Spring Design' }
        ]
    },
    {
        id: 'properties-of-materials',
        title: 'Properties of Materials',
        sections: [
            { id: 'elements', title: 'Chemical Elements' },
            { id: 'steels', title: 'Steels and Iron' },
            { id: 'nonferrous', title: 'Non-Ferrous Alloys' },
            { id: 'plastics', title: 'Plastics and Ceramics' }
        ]
    },
    {
        id: 'dimensions-and-tolerancing',
        title: 'Dimensioning, Gaging and Tolerancing',
        sections: [
            { id: 'limits-fits', title: 'Limits and Fits' },
            { id: 'gd-t', title: 'Geometric Dimensioning and Tolerancing' },
            { id: 'measurement', title: 'Measuring Instruments' }
        ]
    },
    {
        id: 'machine-elements',
        title: 'Machine Elements',
        sections: [
            { id: 'bearings', title: 'Plain and Rolling Element Bearings' },
            { id: 'gears', title: 'Spur, Helical, and Worm Gears' },
            { id: 'fasteners', title: 'Bolts, Screws and Nuts' },
            { id: 'keys-cotters', title: 'Keys and Cotters' },
            { id: 'clutches-brakes', title: 'Clutches and Brakes' }
        ]
    },
    {
        id: 'manufacturing-processes',
        title: 'Manufacturing Processes',
        sections: [
            { id: 'machining', title: 'Machining Operations and Speeds' },
            { id: 'grinding', title: 'Grinding and Abrasive Processes' },
            { id: 'welding', title: 'Welding and Cutting' },
            { id: 'casting', title: 'Casting and Molding' },
            { id: 'heat-treatment', title: 'Heat Treatment of Metals' }
        ]
    }
];
