export type LoadClass = 'U' | 'M' | 'H'; // Uniform, Moderate, Heavy

export interface ServiceFactorParams {
    dailyHours: number;
    startsPerHour: number;
    loadClass: LoadClass;
    primeMover: 'electric' | 'combustion_multi' | 'combustion_single';
}

/**
 * Yılmaz Redüktör Service Factor (fs) Table
 * Based on Operating Duration and Load Class
 */
export const SERVICE_FACTOR_MATRIX = {
    // Duration: <3h, 3-10h, >10h
    'U': [0.8, 1.0, 1.25],
    'M': [1.0, 1.25, 1.5],
    'H': [1.25, 1.5, 1.75]
};

/**
 * Start/Stop Frequency Factor (Start Factor)
 * Effect on Service Factor
 */
export const getStartFrequencyFactor = (startsPerHour: number): number => {
    if (startsPerHour <= 5) return 1.0;
    if (startsPerHour <= 50) return 1.1;
    if (startsPerHour <= 100) return 1.2;
    return 1.3; // >100
    // Note: YR catalogs might use additive or multiplicative. 
    // Standard practice: Often integrated into selection tables. 
    // We will use a multiplier for safety.
};

/**
 * Prime Mover Factor (k1)
 */
export const PRIME_MOVER_FACTOR = {
    'electric': 1.0,
    'combustion_multi': 1.25,
    'combustion_single': 1.5
};

/**
 * Output Connection Factor (fz) for Radial Load
 */
export const CONNECTION_FACTOR = {
    'coupling': 0,    // No radial load ideally
    'gear': 1.0,      // Zr <= 17
    'sprocket': 1.25, // Zr < 20
    'v_belt': 1.5,
    'flat_belt': 2.5
};

export const LOAD_DESCRIPTIONS = {
    'U': "Uniform Load (Conveyors, Lifts, Fans)",
    'M': "Moderate Shock (Screens, Mixers, Cranes)",
    'H': "Heavy Shock (Crushers, Mills, Vibrators)"
};
