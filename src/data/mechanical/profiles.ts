/**
 * 🏭 UNIVERSAL PROFILE DATABASE
 * Standard Aluminum Sigma Profiles
 */

export interface AluminumProfile {
    id: string;
    name: string;
    series: '20' | '30' | '40' | '45' | '50' | 'Custom';
    w: number; // Width (mm)
    h: number; // Height (mm)
    weight: number; // kg/m
    ix: number; // Moment of Inertia X (cm4)
    iy: number; // Moment of Inertia Y (cm4)
    slot: number; // Slot width (mm) (6, 8, 10)
}

export const SIGMA_PROFILES: AluminumProfile[] = [
    // 20 Series (Slot 6)
    { id: '2020', name: '20x20 Sigma', series: '20', w: 20, h: 20, weight: 0.45, ix: 0.72, iy: 0.72, slot: 6 },
    { id: '2040', name: '20x40 Sigma', series: '20', w: 20, h: 40, weight: 0.85, ix: 4.8, iy: 1.1, slot: 6 },

    // 30 Series (Slot 8)
    { id: '3030', name: '30x30 Sigma', series: '30', w: 30, h: 30, weight: 1.05, ix: 2.9, iy: 2.9, slot: 8 },
    { id: '3060', name: '30x60 Sigma', series: '30', w: 30, h: 60, weight: 1.95, ix: 19.8, iy: 5.1, slot: 8 },
    { id: '3030R', name: '30x30 Radius', series: '30', w: 30, h: 30, weight: 0.95, ix: 2.5, iy: 2.5, slot: 8 },

    // 40 Series (Slot 8/10)
    { id: '4040', name: '40x40 Sigma (L)', series: '40', w: 40, h: 40, weight: 1.75, ix: 9.7, iy: 9.7, slot: 8 },
    { id: '4040H', name: '40x40 Heavy', series: '40', w: 40, h: 40, weight: 2.1, ix: 11.5, iy: 11.5, slot: 10 },
    { id: '4080', name: '40x80 Sigma', series: '40', w: 40, h: 80, weight: 3.2, ix: 70.5, iy: 18.2, slot: 8 },
    { id: '8080', name: '80x80 Sigma', series: '40', w: 80, h: 80, weight: 5.5, ix: 135, iy: 135, slot: 10 },

    // 45 Series (Slot 10)
    { id: '4545', name: '45x45 Sigma', series: '45', w: 45, h: 45, weight: 2.2, ix: 13.5, iy: 13.5, slot: 10 },
    { id: '4590', name: '45x90 Sigma', series: '45', w: 45, h: 90, weight: 4.1, ix: 98, iy: 24, slot: 10 },

    // 90 Series
    { id: '9090', name: '90x90 Heavy', series: '45', w: 90, h: 90, weight: 7.8, ix: 210, iy: 210, slot: 10 },
];

export const getProfile = (id: string) => SIGMA_PROFILES.find(p => p.id === id);
