// This file contains standard manufacturing parameters for the live cost and scrap engines

export type CuttingMethod = 'None' | 'Laser' | 'Plasma' | 'Waterjet' | 'Band Saw' | 'Shear';

export interface KerfSpec {
    method: CuttingMethod;
    widthMm: number;
    description: string;
}

export const CUTTING_METHODS: KerfSpec[] = [
    { method: 'None', widthMm: 0, description: 'No cutting loss calculated' },
    { method: 'Laser', widthMm: 0.3, description: 'High precision, minimal kerf' },
    { method: 'Waterjet', widthMm: 1.0, description: 'Cold cutting, standard kerf' },
    { method: 'Band Saw', widthMm: 2.5, description: 'Standard extrusion cutting' },
    { method: 'Plasma', widthMm: 3.0, description: 'Thick plate cutting, wide kerf' },
    { method: 'Shear', widthMm: 0, description: 'Scrap-free shearing' }
];

// Baseline Prices (LME Proxy in USD/kg)
// To be overridden by users if needed.
export const BASELINE_PRICES = {
    'Aluminum': 4.50,
    'Steel': 1.20,
    'Stainless': 6.00,
    'Non-Ferrous': 9.00,
    'Superalloy': 45.00,
    'Plastic': 3.00,
};
