export interface Bearing {
    code: string;
    d: number; // Inner Diameter (mm)
    D: number; // Outer Diameter (mm)
    B: number; // Width (mm)
    C: number; // Dynamic Load Rating (N)
    C0: number; // Static Load Rating (N)
    nRef: number; // Reference Speed (rpm)
    nLimit: number; // Limiting Speed (rpm)
    mass: number; // kg
}

// Helper to generate bearing data algorithmically
const generateBearings = (series: number, startBore: number, endBore: number): Bearing[] => {
    const bearings: Bearing[] = [];
    const steps = [10, 12, 15, 17, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 120];

    steps.forEach(d => {
        if (d < startBore || d > endBore) return;

        // Approximate formulas based on SKF catalog trends
        // These are ESTIMATES for calculation demo, not critical aerospace data
        let D, B, C, C0, nLimit, mass;

        // Suffix mapping
        let suffix = '';
        if (d < 10) suffix = `0${d}`; // Not handled here
        else if (d === 10) suffix = '00';
        else if (d === 12) suffix = '01';
        else if (d === 15) suffix = '02';
        else if (d === 17) suffix = '03';
        else suffix = (d / 5).toString().padStart(2, '0');

        // Remove last digits from series to get the prefix (e.g. 6000 -> 60, 16000 -> 160)
        // 4 digit series -> first 2 digits
        // 5 digit series -> first 3 digits
        const seriesStr = series.toString();
        const prefix = seriesStr.substring(0, seriesStr.length - 2);
        const code = `${prefix}${suffix}`;

        if (series === 6000) {
            D = d + (16 + (d / 5));
            B = 8 + (d / 10);
            C = 4000 + (d * 300);
            C0 = 2000 + (d * 200);
            nLimit = 36000 - (d * 200);
            mass = 0.02 + (d * 0.005);
        } else if (series === 6200) {
            D = d + (20 + (d / 2.5));
            B = 9 + (d / 5);
            C = 5000 + (d * 600);
            C0 = 2500 + (d * 400);
            nLimit = 32000 - (d * 220);
            mass = 0.03 + (d * 0.01);
        } else if (series === 6300) {
            D = d + (25 + (d / 1.5));
            B = 11 + (d / 4);
            C = 8000 + (d * 900);
            C0 = 3500 + (d * 600);
            nLimit = 28000 - (d * 250);
            mass = 0.05 + (d * 0.02);
        } else if (series === 6800) {
            D = d + (7 + (d / 10));
            B = 5 + (d / 20);
            C = 1500 + (d * 100);
            C0 = 800 + (d * 80);
            nLimit = 40000 - (d * 150);
            mass = 0.005 + (d * 0.001);
        } else if (series === 6900) {
            D = d + (11 + (d / 8));
            B = 6 + (d / 15);
            C = 2500 + (d * 150);
            C0 = 1200 + (d * 120);
            nLimit = 38000 - (d * 180);
            mass = 0.01 + (d * 0.002);
        } else if (series === 16000) {
            D = d + (14 + (d / 10)); // Narrower than 6000
            B = 7 + (d / 30);
            C = 4500 + (d * 200);
            C0 = 2200 + (d * 150);
            nLimit = 34000 - (d * 180);
            mass = 0.02 + (d * 0.003);
        } else {
            // Fallback for types not fully mapped
            D = d * 1.5; B = d * 0.3; C = d * 500; C0 = d * 500; nLimit = 10000; mass = 0.1;
        }

        bearings.push({
            code,
            d,
            D: Math.round(D),
            B: Math.round(B),
            C: Math.round(C),
            C0: Math.round(C0),
            nRef: Math.round(nLimit * 0.8),
            nLimit: Math.round(nLimit),
            mass: Number(mass.toFixed(3))
        });
    });
    return bearings;
};

export const bearing6000 = generateBearings(6000, 10, 120);
export const bearing6200 = generateBearings(6200, 10, 120);
export const bearing6300 = generateBearings(6300, 10, 120);
export const bearing6800 = generateBearings(6800, 10, 120);
export const bearing6900 = generateBearings(6900, 10, 120);
export const bearing16000 = generateBearings(16000, 10, 120);

// Keep 7200 and 30200 manual for now as they are complex
export const bearing7200: Bearing[] = [
    { code: '7200', d: 10, D: 30, B: 9, C: 4800, C0: 2500, nRef: 24000, nLimit: 32000, mass: 0.032 },
    { code: '7201', d: 12, D: 32, B: 10, C: 5300, C0: 2800, nRef: 22000, nLimit: 29000, mass: 0.036 },
    { code: '7202', d: 15, D: 35, B: 11, C: 6100, C0: 3400, nRef: 20000, nLimit: 26000, mass: 0.045 },
    { code: '7203', d: 17, D: 40, B: 12, C: 7800, C0: 4400, nRef: 18000, nLimit: 24000, mass: 0.065 },
    { code: '7204', d: 20, D: 47, B: 14, C: 13300, C0: 8300, nRef: 16000, nLimit: 22000, mass: 0.110 },
    { code: '7205', d: 25, D: 52, B: 15, C: 14800, C0: 10200, nRef: 14000, nLimit: 19000, mass: 0.130 },
    { code: '7206', d: 30, D: 62, B: 16, C: 21600, C0: 15000, nRef: 12000, nLimit: 16000, mass: 0.200 },
    { code: '7208', d: 40, D: 80, B: 18, C: 32000, C0: 24000, nRef: 9000, nLimit: 12000, mass: 0.380 },
    { code: '7210', d: 50, D: 90, B: 20, C: 37500, C0: 29000, nRef: 8000, nLimit: 11000, mass: 0.460 },
];

export const bearing30200: Bearing[] = [
    { code: '30202', d: 15, D: 35, B: 11.75, C: 16800, C0: 17600, nRef: 14000, nLimit: 20000, mass: 0.054 },
    { code: '30203', d: 17, D: 40, B: 13.25, C: 21600, C0: 23200, nRef: 12000, nLimit: 17000, mass: 0.083 },
    { code: '30204', d: 20, D: 47, B: 15.25, C: 28000, C0: 32000, nRef: 11000, nLimit: 16000, mass: 0.130 },
    { code: '30205', d: 25, D: 52, B: 16.25, C: 34500, C0: 40500, nRef: 9000, nLimit: 13000, mass: 0.160 },
    { code: '30206', d: 30, D: 62, B: 17.25, C: 47500, C0: 56000, nRef: 7500, nLimit: 11000, mass: 0.250 },
    { code: '30208', d: 40, D: 80, B: 19.75, C: 68000, C0: 83000, nRef: 6000, nLimit: 9000, mass: 0.430 },
];

export const bearingCatalog = {
    '6000': { name: 'Deep Groove 6000', data: bearing6000 },
    '6200': { name: 'Deep Groove 6200', data: bearing6200 },
    '6300': { name: 'Deep Groove 6300', data: bearing6300 },
    '6800': { name: 'Thin Section 6800', data: bearing6800 },
    '6900': { name: 'Thin Section 6900', data: bearing6900 },
    '16000': { name: 'Thin Section 16000', data: bearing16000 },
    '7200': { name: 'Ang. Contact 7200', data: bearing7200 },
    '30200': { name: 'Tapered 30200', data: bearing30200 },
};
