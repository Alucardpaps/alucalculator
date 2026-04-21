export interface EngineeringConstant {
    keywords: string[];
    value: string;
    unit: string;
    description: string;
    category: 'mechanical' | 'material' | 'electrical' | 'standards';
}

export const ENGINEERING_CONSTANTS: EngineeringConstant[] = [
    {
        keywords: ['m10', 'bolt torque', 'torque m10', '10.9'],
        value: '72',
        unit: 'Nm',
        description: 'Standard tightening torque for M10 socket head cap screw (Class 10.9, dry).',
        category: 'standards'
    },
    {
        keywords: ['aluminum density', 'density alu', '6061', '7075'],
        value: '2.7',
        unit: 'g/cm³',
        description: 'Average density for 6000 and 7000 series aluminum extrusions.',
        category: 'material'
    },
    {
        keywords: ['steel youngs modulus', 'modulus', 'elasticity'],
        value: '210',
        unit: 'GPa',
        description: 'Typical Young\'s Modulus for structural steels.',
        category: 'material'
    },
    {
        keywords: ['speed of sound', 'sound air'],
        value: '343',
        unit: 'm/s',
        description: 'Speed of sound in dry air at 20°C (68°F).',
        category: 'science' as any
    },
    {
        keywords: ['gravity', 'acceleration'],
        value: '9.80665',
        unit: 'm/s²',
        description: 'Standard gravity on Earth.',
        category: 'science' as any
    },
    {
        keywords: ['3-phase phase voltage', '400v', 'phase voltage'],
        value: '230.9',
        unit: 'V',
        description: 'Phase voltage for a 400V RMS Wye (Star) connection.',
        category: 'electrical'
    }
];
