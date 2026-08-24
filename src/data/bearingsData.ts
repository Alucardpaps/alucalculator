export interface Bearing {
    code: string;
    d: number; // ID
    D: number; // OD
    B: number; // Width
    C: number; // Dynamic Load (N)
    Co: number; // Static Load (N)
    type: string;
}

export const BEARINGS_DB: Bearing[] = [
    // --- 6000 Series (Deep Groove) ---
    { code: '6000', d: 10, D: 26, B: 8, C: 4620, Co: 1960, type: 'Deep Groove' },
    { code: '6004', d: 20, D: 42, B: 12, C: 9360, Co: 5000, type: 'Deep Groove' },
    { code: '6008', d: 40, D: 68, B: 15, C: 16800, Co: 11500, type: 'Deep Groove' },
    { code: '6012', d: 60, D: 95, B: 18, C: 29600, Co: 23200, type: 'Deep Groove' },

    // --- 6200 Series (Deep Groove) ---
    { code: '6200', d: 10, D: 30, B: 9, C: 5070, Co: 2360, type: 'Deep Groove' },
    { code: '6204', d: 20, D: 47, B: 14, C: 12700, Co: 6550, type: 'Deep Groove' },
    { code: '6208', d: 40, D: 80, B: 18, C: 29100, Co: 17600, type: 'Deep Groove' },
    { code: '6212', d: 60, D: 110, B: 22, C: 52000, Co: 36000, type: 'Deep Groove' },

    // --- 6300 Series (Deep Groove) ---
    { code: '6300', d: 10, D: 35, B: 11, C: 8060, Co: 3450, type: 'Deep Groove' },
    { code: '6304', d: 20, D: 52, B: 15, C: 15900, Co: 7800, type: 'Deep Groove' },
    { code: '6308', d: 40, D: 90, B: 23, C: 40300, Co: 24000, type: 'Deep Groove' },

    // --- 7200 Series (Angular Contact) ---
    { code: '7200', d: 10, D: 30, B: 9, C: 4800, Co: 2500, type: 'Angular Contact' },
    { code: '7204', d: 20, D: 47, B: 14, C: 14000, Co: 8300, type: 'Angular Contact' },
    { code: '7208', d: 40, D: 80, B: 18, C: 34500, Co: 24000, type: 'Angular Contact' },
    { code: '7212', d: 60, D: 110, B: 22, C: 71000, Co: 54000, type: 'Angular Contact' },

    // --- 30200 Series (Tapered Roller) ---
    { code: '30204', d: 20, D: 47, B: 14, C: 28000, Co: 32000, type: 'Tapered Roller' },
    { code: '30208', d: 40, D: 80, B: 18, C: 68000, Co: 83000, type: 'Tapered Roller' },
    { code: '30212', d: 60, D: 110, B: 22, C: 130000, Co: 160000, type: 'Tapered Roller' },

    // --- 32000 Series (Tapered Roller) ---
    { code: '32004', d: 20, D: 42, B: 15, C: 25000, Co: 29000, type: 'Tapered Roller' },
    { code: '32008', d: 40, D: 68, B: 19, C: 54000, Co: 72000, type: 'Tapered Roller' },
    { code: '32012', d: 60, D: 95, B: 23, C: 95000, Co: 130000, type: 'Tapered Roller' },

    // --- NU 200 Series (Cylindrical Roller) ---
    { code: 'NU204', d: 20, D: 47, B: 14, C: 26000, Co: 20000, type: 'Cylindrical' },
    { code: 'NU208', d: 40, D: 80, B: 18, C: 62000, Co: 56000, type: 'Cylindrical' },
    { code: 'NU212', d: 60, D: 110, B: 22, C: 120000, Co: 110000, type: 'Cylindrical' },
];
