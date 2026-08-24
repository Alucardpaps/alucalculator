export interface BearingStandard {
    id: string;
    series: string;
    code: string;
    d: number; // Inner diameter
    D: number; // Outer diameter
    B: number; // Width
    C: number; // Dynamic load rating (kN)
    C0: number; // Static load rating (kN) -- optional, good for future
    limitSpeed: number; // rpm (Grease)
}

export const BEARING_DATABASE: BearingStandard[] = [
    // 6000 Series (Extra Light Deep Groove)
    { id: '6000', series: '60', code: '6000', d: 10, D: 26, B: 8, C: 4.62, C0: 1.96, limitSpeed: 30000 },
    { id: '6001', series: '60', code: '6001', d: 12, D: 28, B: 8, C: 5.1, C0: 2.39, limitSpeed: 28000 },
    { id: '6002', series: '60', code: '6002', d: 15, D: 32, B: 9, C: 5.6, C0: 2.85, limitSpeed: 24000 },
    { id: '6003', series: '60', code: '6003', d: 17, D: 35, B: 10, C: 6, C0: 3.25, limitSpeed: 22000 },
    { id: '6004', series: '60', code: '6004', d: 20, D: 42, B: 12, C: 9.4, C0: 5.0, limitSpeed: 19000 },
    { id: '6005', series: '60', code: '6005', d: 25, D: 47, B: 12, C: 10.1, C0: 5.85, limitSpeed: 16000 },
    { id: '6006', series: '60', code: '6006', d: 30, D: 55, B: 13, C: 13.3, C0: 8.3, limitSpeed: 14000 },
    { id: '6007', series: '60', code: '6007', d: 35, D: 62, B: 14, C: 15.9, C0: 10.3, limitSpeed: 12000 },
    { id: '6008', series: '60', code: '6008', d: 40, D: 68, B: 15, C: 16.8, C0: 11.5, limitSpeed: 11000 },

    // 6200 Series (Light Deep Groove)
    { id: '6200', series: '62', code: '6200', d: 10, D: 30, B: 9, C: 5.1, C0: 2.39, limitSpeed: 26000 },
    { id: '6201', series: '62', code: '6201', d: 12, D: 32, B: 10, C: 6.89, C0: 3.1, limitSpeed: 24000 },
    { id: '6202', series: '62', code: '6202', d: 15, D: 35, B: 11, C: 7.8, C0: 3.75, limitSpeed: 20000 },
    { id: '6203', series: '62', code: '6203', d: 17, D: 40, B: 12, C: 9.6, C0: 4.8, limitSpeed: 18000 },
    { id: '6204', series: '62', code: '6204', d: 20, D: 47, B: 14, C: 12.8, C0: 6.6, limitSpeed: 16000 },
    { id: '6205', series: '62', code: '6205', d: 25, D: 52, B: 15, C: 14, C0: 7.85, limitSpeed: 14000 },
    { id: '6206', series: '62', code: '6206', d: 30, D: 62, B: 16, C: 19.5, C0: 11.3, limitSpeed: 12000 },
    { id: '6207', series: '62', code: '6207', d: 35, D: 72, B: 17, C: 25.7, C0: 15.3, limitSpeed: 10000 },
    { id: '6208', series: '62', code: '6208', d: 40, D: 80, B: 18, C: 29.1, C0: 17.9, limitSpeed: 9000 },

    // 6300 Series (Medium Deep Groove)
    { id: '6300', series: '63', code: '6300', d: 10, D: 35, B: 11, C: 8.1, C0: 3.45, limitSpeed: 24000 },
    { id: '6301', series: '63', code: '6301', d: 12, D: 37, B: 12, C: 9.7, C0: 4.2, limitSpeed: 22000 },
    { id: '6302', series: '63', code: '6302', d: 15, D: 42, B: 13, C: 11.4, C0: 5.45, limitSpeed: 19000 },
    { id: '6303', series: '63', code: '6303', d: 17, D: 47, B: 14, C: 13.6, C0: 6.55, limitSpeed: 17000 },
    { id: '6304', series: '63', code: '6304', d: 20, D: 52, B: 15, C: 15.9, C0: 7.9, limitSpeed: 15000 },
    { id: '6305', series: '63', code: '6305', d: 25, D: 62, B: 17, C: 20.6, C0: 11.5, limitSpeed: 12000 },
    { id: '6306', series: '63', code: '6306', d: 30, D: 72, B: 19, C: 26.7, C0: 15, limitSpeed: 11000 },
    { id: '6307', series: '63', code: '6307', d: 35, D: 80, B: 21, C: 33.4, C0: 19.3, limitSpeed: 9500 },
    { id: '6308', series: '63', code: '6308', d: 40, D: 90, B: 23, C: 40.7, C0: 24, limitSpeed: 8500 },

    // NU 200 Series (Cylindrical Roller Bearings - Light)
    { id: 'NU204', series: 'NU2', code: 'NU204', d: 20, D: 47, B: 14, C: 28.5, C0: 25.0, limitSpeed: 18000 },
    { id: 'NU205', series: 'NU2', code: 'NU205', d: 25, D: 52, B: 15, C: 31.0, C0: 27.5, limitSpeed: 15000 },
    { id: 'NU206', series: 'NU2', code: 'NU206', d: 30, D: 62, B: 16, C: 43.0, C0: 38.0, limitSpeed: 13000 },
    { id: 'NU207', series: 'NU2', code: 'NU207', d: 35, D: 72, B: 17, C: 56.0, C0: 50.0, limitSpeed: 11000 },
    { id: 'NU208', series: 'NU2', code: 'NU208', d: 40, D: 80, B: 18, C: 66.0, C0: 58.5, limitSpeed: 9500 },

    // 30200 Series (Tapered Roller Bearings)
    { id: '30204', series: '302', code: '30204', d: 20, D: 47, B: 15.25, C: 29.5, C0: 31.5, limitSpeed: 14000 },
    { id: '30205', series: '302', code: '30205', d: 25, D: 52, B: 16.25, C: 35.0, C0: 38.0, limitSpeed: 12000 },
    { id: '30206', series: '302', code: '30206', d: 30, D: 62, B: 17.25, C: 45.0, C0: 48.0, limitSpeed: 10000 },
    { id: '30207', series: '302', code: '30207', d: 35, D: 72, B: 18.25, C: 57.0, C0: 63.0, limitSpeed: 8500 },
    { id: '30208', series: '302', code: '30208', d: 40, D: 80, B: 19.75, C: 68.0, C0: 76.5, limitSpeed: 7500 },

    // 22200 E Series (Spherical Roller Bearings)
    { id: '22205E', series: '222', code: '22205E', d: 25, D: 52, B: 18, C: 49.0, C0: 48.0, limitSpeed: 11000 },
    { id: '22206E', series: '222', code: '22206E', d: 30, D: 62, B: 20, C: 65.0, C0: 64.0, limitSpeed: 9500 },
    { id: '22207E', series: '222', code: '22207E', d: 35, D: 72, B: 23, C: 88.0, C0: 90.0, limitSpeed: 8500 },
    { id: '22208E', series: '222', code: '22208E', d: 40, D: 80, B: 23, C: 98.0, C0: 98.0, limitSpeed: 7500 }
];

export function getBearing(code: string): BearingStandard | undefined {
    return BEARING_DATABASE.find(b => b.code === code);
}
