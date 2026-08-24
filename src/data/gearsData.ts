export interface GearModuleStandard {
    series: 1 | 2; // 1 = Preferred, 2 = Secondary
    modules: number[];
}

export const GEAR_MODULES_ISO: GearModuleStandard[] = [
    {
        series: 1, // Preferred
        modules: [0.5, 0.8, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10, 12, 16, 20, 25, 32, 40, 50]
    },
    {
        series: 2, // Secondary
        modules: [0.6, 0.7, 0.9, 1.125, 1.375, 1.75, 2.25, 2.75, 3.5, 4.5, 5.5, 7.0, 9.0, 11, 14, 18, 22, 28, 36, 45]
    }
];

// Material Strength Values (Approximate for ISO 6336)
// sigma_Hlim: Pitting Resistance (N/mm2)
// sigma_Flim: Bending Strength (N/mm2)
export interface GearMaterial {
    name: string;
    sigma_Hlim: number;
    sigma_Flim: number;
    hardness: string;
}

export const GEAR_MATERIALS: GearMaterial[] = [
    { name: '16MnCr5 (Case Hardened)', sigma_Hlim: 1500, sigma_Flim: 430, hardness: '60 HRC' },
    { name: '20MnCr5 (Case Hardened)', sigma_Hlim: 1470, sigma_Flim: 410, hardness: '59 HRC' },
    { name: '18CrNiMo7-6 (Case Hardened)', sigma_Hlim: 1590, sigma_Flim: 480, hardness: '61 HRC' },
    { name: '42CrMo4 (Quenched & Tempered)', sigma_Hlim: 550, sigma_Flim: 300, hardness: '220 HB' },
    { name: 'C45 (Normalized)', sigma_Hlim: 450, sigma_Flim: 190, hardness: '180 HB' },
    { name: 'GG25 (Grey Cast Iron)', sigma_Hlim: 390, sigma_Flim: 140, hardness: '190 HB' },
    { name: 'GGG40 (Nodular Iron)', sigma_Hlim: 500, sigma_Flim: 250, hardness: '160 HB' },
    { name: 'POM / Nylon (Plastic)', sigma_Hlim: 50, sigma_Flim: 40, hardness: '80 Shore D' }
];

export interface ApplicationFactor {
    name: string;
    Ka: number; // Service Factor
    desc: string;
}

export const APPLICATION_FACTORS: ApplicationFactor[] = [
    { name: 'Uniform (Generator, Fan)', Ka: 1.00, desc: 'Continuous, no shock' },
    { name: 'Light Shock (Conveyor, Pump)', Ka: 1.25, desc: 'Frequent starts, minor variations' },
    { name: 'Moderate Shock (Piston Pump, Hoist)', Ka: 1.50, desc: 'Variable loads, specific shocks' },
    { name: 'Heavy Shock (Crusher, Punch Press)', Ka: 1.75, desc: 'Heavy impacts, reversals' },
    { name: 'Extreme Shock (Hammer Mill)', Ka: 2.25, desc: 'Violent impacts' }
];
