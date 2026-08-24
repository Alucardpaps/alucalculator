
export interface StandardProfile {
    name: string;
    h: number; // Height
    b: number; // Width
    tw: number; // Web Thickness
    tf: number; // Flange Thickness
    r: number; // Root Radius
}

export const STANDARD_PROFILES: Record<string, StandardProfile[]> = {
    IPE: [
        { name: 'IPE 80', h: 80, b: 46, tw: 3.8, tf: 5.2, r: 5 },
        { name: 'IPE 100', h: 100, b: 55, tw: 4.1, tf: 5.7, r: 7 },
        { name: 'IPE 120', h: 120, b: 64, tw: 4.4, tf: 6.3, r: 7 },
        { name: 'IPE 140', h: 140, b: 73, tw: 4.7, tf: 6.9, r: 7 },
        { name: 'IPE 160', h: 160, b: 82, tw: 5.0, tf: 7.4, r: 9 },
        { name: 'IPE 180', h: 180, b: 91, tw: 5.3, tf: 8.0, r: 9 },
        { name: 'IPE 200', h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12 },
        { name: 'IPE 220', h: 220, b: 110, tw: 5.9, tf: 9.2, r: 12 },
        { name: 'IPE 240', h: 240, b: 120, tw: 6.2, tf: 9.8, r: 15 },
        { name: 'IPE 270', h: 270, b: 135, tw: 6.6, tf: 10.2, r: 15 },
        { name: 'IPE 300', h: 300, b: 150, tw: 7.1, tf: 10.7, r: 15 },
    ],
    HEA: [
        { name: 'HEA 100', h: 96, b: 100, tw: 5, tf: 8, r: 12 },
        { name: 'HEA 120', h: 114, b: 120, tw: 5, tf: 8, r: 12 },
        { name: 'HEA 140', h: 133, b: 140, tw: 5.5, tf: 8.5, r: 12 },
        { name: 'HEA 160', h: 152, b: 160, tw: 6, tf: 9, r: 15 },
        { name: 'HEA 180', h: 171, b: 180, tw: 6, tf: 9.5, r: 15 },
        { name: 'HEA 200', h: 190, b: 200, tw: 6.5, tf: 10, r: 18 },
        { name: 'HEA 220', h: 210, b: 220, tw: 7, tf: 11, r: 18 },
        { name: 'HEA 240', h: 230, b: 240, tw: 7.5, tf: 12, r: 21 },
    ],
    UPN: [
        { name: 'UPN 80', h: 80, b: 45, tw: 6, tf: 8, r: 8 },
        { name: 'UPN 100', h: 100, b: 50, tw: 6, tf: 8.5, r: 8.5 },
        { name: 'UPN 120', h: 120, b: 55, tw: 7, tf: 9, r: 9 },
        { name: 'UPN 140', h: 140, b: 60, tw: 7, tf: 10, r: 10 },
        { name: 'UPN 160', h: 160, b: 65, tw: 7.5, tf: 10.5, r: 10.5 },
        { name: 'UPN 180', h: 180, b: 70, tw: 8, tf: 11, r: 11 },
        { name: 'UPN 200', h: 200, b: 75, tw: 8.5, tf: 11.5, r: 11.5 },
    ]
};
