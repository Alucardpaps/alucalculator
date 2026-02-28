/**
 * Machinery's Handbook - Mathematics Section
 * Extracted core formulas and constants.
 */

export const HANDBOOK_MATH = {
    constants: {
        pi: 3.1415926535,
        e: 2.718281828,
        conversion_factors: [
            { from: 'inches', to: 'mm', factor: 25.4 },
            { from: 'feet', to: 'meters', factor: 0.3048 },
            { from: 'lb', to: 'kg', factor: 0.453592 },
            { from: 'psi', to: 'kPa', factor: 6.89476 }
        ]
    },
    geometry: [
        {
            name: 'Circle',
            area: 'A = pi * r^2',
            circumference: 'C = 2 * pi * r'
        },
        {
            name: 'Sphere',
            surface_area: 'A = 4 * pi * r^2',
            volume: 'V = (4/3) * pi * r^3'
        },
        {
            name: 'Cone',
            volume: 'V = (1/3) * pi * r^2 * h',
            lateral_area: 'A = pi * r * sqrt(r^2 + h^2)'
        }
    ],
    trigonometry: [
        { id: 'sine-rule', formula: 'a/sin(A) = b/sin(B) = c/sin(C)' },
        { id: 'cosine-rule', formula: 'a^2 = b^2 + c^2 - 2bc*cos(A)' }
    ]
};
