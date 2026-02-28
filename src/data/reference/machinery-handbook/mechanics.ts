/**
 * Machinery's Handbook - Mechanics Section
 */

export const HANDBOOK_MECHANICS = {
    statics: [
        { name: 'Force', formula: 'F = m * a', unit: 'N (Newton)' },
        { name: 'Torque', formula: 'T = F * d', unit: 'N*m' },
        { name: 'Work', formula: 'W = F * d * cos(theta)', unit: 'J (Joule)' },
        { name: 'Power', formula: 'P = W / t = F * v', unit: 'W (Watt)' }
    ],
    friction: {
        static: 'Fs = mu_s * N',
        kinetic: 'Fk = mu_k * N'
    },
    beams: [
        {
            type: 'Cantilever, End Load',
            max_deflection: 'delta = (P * L^3) / (3 * E * I)',
            max_moment: 'M = P * L'
        },
        {
            type: 'Simple Support, Center Load',
            max_deflection: 'delta = (P * L^3) / (48 * E * I)',
            max_moment: 'M = (P * L) / 4'
        }
    ]
};
