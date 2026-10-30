/**
 * AluCalculator OS - Global Bolt Head Standards Database
 * 
 * Comprehensive dimensional standards for 11 industrial bolt types:
 * 1. Hex Head Bolt (DIN 931 / DIN 933 / ISO 4014 / ISO 4017 / ASME B18.2.1)
 * 2. Socket Head Cap Screw (DIN 912 / ISO 4762 / ASME B18.3)
 * 3. Countersunk Socket Screw (DIN 7991 / ISO 10642 / ASME B18.3)
 * 4. Button Head Socket Screw (ISO 7380-1 / ISO 7380-2)
 * 5. Hex Flange Bolt (DIN 6921 / EN 1665 / ISO 4162)
 * 6. Low Head Socket Screw (DIN 7984 / DIN 6912)
 * 7. Heavy Hex Structural Bolt (ASTM A325 / ASTM A490 / ASME B18.2.6)
 * 8. Stud Bolt / Double End Stud (DIN 938 / DIN 939 / DIN 975)
 * 9. Socket Set Screw / Grub Screw (DIN 913 / 914 / 916 / ISO 4026-4029)
 * 10. Carriage Bolt (DIN 603 / ISO 8677)
 * 11. Lifting Eye Bolt (DIN 580 / ISO 3266)
 * 
 * ALL VALUES IN MILLIMETERS (mm)
 */

export type BoltTypeId =
    | 'hex_bolt'
    | 'socket_cap'
    | 'countersunk'
    | 'button_head'
    | 'flange_hex'
    | 'low_head_socket'
    | 'heavy_hex'
    | 'stud_bolt'
    | 'set_screw'
    | 'carriage_bolt'
    | 'eye_bolt';

export interface BoltTypeMeta {
    id: BoltTypeId;
    name: { en: string; tr: string };
    shortName: { en: string; tr: string };
    standard: string;
    standardPartial?: string;
    standardFull?: string;
    description: { en: string; tr: string };
    headCategory: 'hex' | 'socket_cylinder' | 'countersunk_cone' | 'button_dome' | 'flange_hex' | 'low_head' | 'heavy_hex' | 'stud' | 'set_screw' | 'carriage' | 'eye';
    hasSocket: boolean;
    hasNut: boolean;
    lengthIncludesHead: boolean; // true for countersunk DIN 7991
    isConeBearing: boolean; // true for countersunk DIN 7991 (conical friction)
}

export interface BoltHeadDimensions {
    size: string; // 'M3', 'M6', 'M12', '1/2-13', etc.
    d_nom: number; // Nominal diameter (mm)
    k: number; // Head height (mm)
    s?: number; // Across flats (for hex) or hex socket size (for inbus/countersunk)
    e?: number; // Across corners (for hex)
    dk?: number; // Head outer diameter (mm)
    dw?: number; // Washer face / bearing outer diameter (mm)
    dc?: number; // Flange diameter (mm, for DIN 6921)
    c?: number; // Flange thickness or head collar (mm)
    t?: number; // Socket depth (mm)
    r?: number; // Underhead fillet radius (mm)
    coneAngle?: number; // Degrees (90° for DIN 7991)
    v?: number; // Square neck width (for DIN 603)
    f?: number; // Square neck height (for DIN 603)
    bm?: number; // Tap-end engagement length (for DIN 939 stud)
    dp?: number; // Cup/point diameter (for DIN 916 set screw)
    d2_eye?: number; // Collar diameter (for DIN 580 eye bolt)
    d3_eye?: number; // Outer eye diameter (for DIN 580 eye bolt)
    d4_eye?: number; // Inner eye diameter (for DIN 580 eye bolt)
    h_eye?: number; // Total eye bolt height (for DIN 580 eye bolt)
    cbDia?: number; // Counterbore diameter per DIN 974-1 (mm)
    cbDepth?: number; // Counterbore depth per DIN 974-1 (mm)
}

export const BOLT_TYPES_CATALOG: BoltTypeMeta[] = [
    {
        id: 'hex_bolt',
        name: { en: 'Hexagon Head Bolt', tr: 'Altı Köşe Başlı Cıvata' },
        shortName: { en: 'Hex Bolt', tr: 'Altı Köşe' },
        standard: 'ISO 4014 / ISO 4017 / DIN 931 / 933',
        standardPartial: 'ISO 4014 (DIN 931)',
        standardFull: 'ISO 4017 (DIN 933)',
        description: {
            en: 'Standard general-purpose hexagon head fastener with washer face.',
            tr: 'Rondela yüzeyli genel amaçlı standart altı köşe başlı cıvata.',
        },
        headCategory: 'hex',
        hasSocket: false,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'socket_cap',
        name: { en: 'Socket Head Cap Screw (Inbus / Allen)', tr: 'Silindirik Başlı İmbus Cıvata' },
        shortName: { en: 'Socket Cap (DIN 912)', tr: 'İmbus (DIN 912)' },
        standard: 'ISO 4762 / DIN 912 / ASME B18.3',
        standardPartial: 'DIN 912 (Partial)',
        standardFull: 'DIN 912 (Full)',
        description: {
            en: 'High-strength cylindrical head with internal hexagon socket for counterbored holes.',
            tr: 'Kuyu deliklerine ve dar alanlara montaj için yüksek mukavemetli alyan yuvalı silindirik kafa.',
        },
        headCategory: 'socket_cylinder',
        hasSocket: true,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'countersunk',
        name: { en: 'Countersunk Socket Screw (Flat Head)', tr: 'Havşa Başlı İmbus Cıvata' },
        shortName: { en: 'Countersunk (DIN 7991)', tr: 'Havşa Başlı' },
        standard: 'ISO 10642 / DIN 7991 / ASME B18.3',
        standardPartial: 'DIN 7991 (Partial)',
        standardFull: 'DIN 7991 (Full)',
        description: {
            en: '90° conical head designed to sit flush with surface. Length L is overall length including head.',
            tr: 'Yüzeye sıfır gömülen 90° konik kafa. L boyu kafa dahil toplam boydur.',
        },
        headCategory: 'countersunk_cone',
        hasSocket: true,
        hasNut: true,
        lengthIncludesHead: true,
        isConeBearing: true,
    },
    {
        id: 'button_head',
        name: { en: 'Button Head Socket Screw', tr: 'Bombeli Başlı İmbus Cıvata' },
        shortName: { en: 'Button Head (ISO 7380)', tr: 'Bombeli İmbus' },
        standard: 'ISO 7380-1 / ISO 7380-2',
        standardPartial: 'ISO 7380-1',
        standardFull: 'ISO 7380-1 (Full)',
        description: {
            en: 'Low-profile smooth domed head with wide bearing area for guards and aesthetic panels.',
            tr: 'Muhafaza kapakları ve estetik paneller için düşük profilli kubbe başlı alyan cıvata.',
        },
        headCategory: 'button_dome',
        hasSocket: true,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'flange_hex',
        name: { en: 'Hexagon Flange Bolt', tr: 'Flanşlı Altı Köşe Cıvata' },
        shortName: { en: 'Flange Bolt (DIN 6921)', tr: 'Flanşlı Cıvata' },
        standard: 'DIN 6921 / EN 1665 / ISO 4162',
        standardPartial: 'DIN 6921 (Partial)',
        standardFull: 'DIN 6921 (Full)',
        description: {
            en: 'Hexagon head with integral circular skirt. Eliminates washers and reduces surface pressure.',
            tr: 'Geniş entegre flanş eteği sayesinde rondela gereksinimini ortadan kaldıran altı köşe cıvata.',
        },
        headCategory: 'flange_hex',
        hasSocket: false,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'low_head_socket',
        name: { en: 'Low Head Socket Cap Screw', tr: 'Düşük Başlı İmbus Cıvata' },
        shortName: { en: 'Low Head (DIN 7984)', tr: 'Düşük Başlı İmbus' },
        standard: 'DIN 7984 / DIN 6912',
        standardPartial: 'DIN 7984',
        standardFull: 'DIN 7984 (Full)',
        description: {
            en: 'Cylindrical socket head with reduced head height for extremely shallow counterbores.',
            tr: 'Eksik boşluklu ve sığ yuvalı montajlar için kafa yüksekliği düşürülmüş imbus cıvata.',
        },
        headCategory: 'low_head',
        hasSocket: true,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'heavy_hex',
        name: { en: 'Heavy Hex Structural Bolt', tr: 'Ağır Altı Köşe Yapısal Cıvata' },
        shortName: { en: 'Heavy Hex (A325/A490)', tr: 'Ağır Yapısal Cıvata' },
        standard: 'ASTM A325 / ASTM A490 / ASME B18.2.6 / EN 14399',
        standardPartial: 'ASME B18.2.6 Structural',
        standardFull: 'ASTM F3125 / A325',
        description: {
            en: 'Heavy structural bolt with enlarged width across flats for high-load steel framing.',
            tr: 'Çelik konstrüksiyon ve ağır yük bağlantıları için geniş anahtar ağızlı yapısal cıvata.',
        },
        headCategory: 'heavy_hex',
        hasSocket: false,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'stud_bolt',
        name: { en: 'Stud Bolt / Double-End Stud', tr: 'Saplama Cıvata / Tij' },
        shortName: { en: 'Stud (DIN 939 / 975)', tr: 'Saplama (DIN 939)' },
        standard: 'DIN 939 (1.25d) / DIN 938 (1d) / DIN 975',
        standardPartial: 'DIN 939 (Tap End 1.25d)',
        standardFull: 'DIN 975 (All Thread)',
        description: {
            en: 'Headless threaded fastener with tap-end for block/casing and nut-end for clamping.',
            tr: 'Gövdeye vidalanan metal ucu (bm=1.25d) ve somun ucu bulunan kafasız bağlantı saplaması.',
        },
        headCategory: 'stud',
        hasSocket: false,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'set_screw',
        name: { en: 'Socket Set Screw / Grub Screw', tr: 'Alyan Setskur / Uskur' },
        shortName: { en: 'Set Screw (DIN 916)', tr: 'Setskur (DIN 916)' },
        standard: 'DIN 916 (Cup Point) / DIN 913 / ISO 4029',
        standardPartial: 'DIN 916',
        standardFull: 'DIN 916 (Full)',
        description: {
            en: 'Headless threaded screw with internal socket and cup point for locking pulleys/gears onto shafts.',
            tr: 'Kasnak ve dişlileri millere sabitlemek için kupa uçlu ve alyan soketli kafasız setskur.',
        },
        headCategory: 'set_screw',
        hasSocket: true,
        hasNut: false,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'carriage_bolt',
        name: { en: 'Carriage Bolt (Round Head Square Neck)', tr: 'Dibi Dörtköşe Kasa Cıvatası' },
        shortName: { en: 'Carriage (DIN 603)', tr: 'Kasa Cıvatası' },
        standard: 'DIN 603 / ISO 8677',
        standardPartial: 'DIN 603',
        standardFull: 'DIN 603 (Full)',
        description: {
            en: 'Smooth mushroom head with square neck underneath to prevent spinning during tightening.',
            tr: 'Sıkma esnasında dönmeyi önleyen kare boyunlu yuvarlak mantar başlı kasa cıvatası.',
        },
        headCategory: 'carriage',
        hasSocket: false,
        hasNut: true,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
    {
        id: 'eye_bolt',
        name: { en: 'Lifting Eye Bolt', tr: 'Halkalı Cıvata / Mapa' },
        shortName: { en: 'Eye Bolt (DIN 580)', tr: 'Halkalı Mapa' },
        standard: 'DIN 580 / ISO 3266',
        standardPartial: 'DIN 580',
        standardFull: 'DIN 580 (Full)',
        description: {
            en: 'Forged lifting ring on a threaded stud for cranes, lifting rigging and mold transport.',
            tr: 'Kalıp, motor ve ağır makinelerin vinçle kaldırılması için dövme çelik halkalı mapa.',
        },
        headCategory: 'eye',
        hasSocket: false,
        hasNut: false,
        lengthIncludesHead: false,
        isConeBearing: false,
    },
];

// =========================================================================
// DIMENSIONAL TABLES FOR ALL BOLT TYPES
// =========================================================================

// 1. HEX HEAD BOLT (ISO 4014 / ISO 4017; DIN 931 / 933 superseded)
export const HEX_BOLT_DATA: Record<string, BoltHeadDimensions> = {
    // ISO 4014 / ISO 4017 (s, k nominal; e, dw, r minimum; product grade A ≤ M24, B above).
    // DIN 931/933 differ only for M10/M12/M14/M22 (s = 17/19/22/32) — the page labels and
    // the VDI 2230 bearing area use the ISO values.
    M2: { size: 'M2', d_nom: 2, k: 1.4, s: 4, e: 4.32, dw: 2.9, r: 0.1 },
    'M2.5': { size: 'M2.5', d_nom: 2.5, k: 1.7, s: 5, e: 5.45, dw: 3.6, r: 0.1 },
    M3: { size: 'M3', d_nom: 3, k: 2, s: 5.5, e: 6.01, dw: 4.57, r: 0.1 },
    M4: { size: 'M4', d_nom: 4, k: 2.8, s: 7, e: 7.66, dw: 5.88, r: 0.2 },
    M5: { size: 'M5', d_nom: 5, k: 3.5, s: 8, e: 8.79, dw: 6.88, r: 0.2 },
    M6: { size: 'M6', d_nom: 6, k: 4, s: 10, e: 11.05, dw: 8.88, r: 0.25 },
    M8: { size: 'M8', d_nom: 8, k: 5.3, s: 13, e: 14.38, dw: 11.63, r: 0.4 },
    M10: { size: 'M10', d_nom: 10, k: 6.4, s: 16, e: 17.77, dw: 14.63, r: 0.4 },
    M12: { size: 'M12', d_nom: 12, k: 7.5, s: 18, e: 20.03, dw: 16.63, r: 0.6 },
    M14: { size: 'M14', d_nom: 14, k: 8.8, s: 21, e: 23.36, dw: 19.64, r: 0.6 },
    M16: { size: 'M16', d_nom: 16, k: 10, s: 24, e: 26.75, dw: 22.49, r: 0.6 },
    M18: { size: 'M18', d_nom: 18, k: 11.5, s: 27, e: 30.14, dw: 25.34, r: 0.6 },
    M20: { size: 'M20', d_nom: 20, k: 12.5, s: 30, e: 33.53, dw: 28.19, r: 0.8 },
    M22: { size: 'M22', d_nom: 22, k: 14, s: 34, e: 37.72, dw: 31.71, r: 0.8 },
    M24: { size: 'M24', d_nom: 24, k: 15, s: 36, e: 39.98, dw: 33.61, r: 0.8 },
    M27: { size: 'M27', d_nom: 27, k: 17, s: 41, e: 45.2, dw: 38.0, r: 1.0 },
    M30: { size: 'M30', d_nom: 30, k: 18.7, s: 46, e: 50.85, dw: 42.75, r: 1.0 },
    M33: { size: 'M33', d_nom: 33, k: 21, s: 50, e: 55.37, dw: 46.55, r: 1.0 },
    M36: { size: 'M36', d_nom: 36, k: 22.5, s: 55, e: 60.79, dw: 51.11, r: 1.0 },
    M42: { size: 'M42', d_nom: 42, k: 26, s: 65, e: 71.3, dw: 59.95, r: 1.2 },
    M48: { size: 'M48', d_nom: 48, k: 30, s: 75, e: 82.6, dw: 69.45, r: 1.6 },
};

// 2. SOCKET HEAD CAP SCREW (DIN 912 / ISO 4762)
export const SOCKET_CAP_DATA: Record<string, BoltHeadDimensions> = {
    // ISO 4762: dk max, dw min (bearing face), s nominal, t min.
    M2: { size: 'M2', d_nom: 2, k: 2.0, dk: 3.8, dw: 3.8, s: 1.5, t: 1.0, r: 0.15, cbDia: 4.4, cbDepth: 2.4 },
    'M2.5': { size: 'M2.5', d_nom: 2.5, k: 2.5, dk: 4.5, dw: 4.5, s: 2.0, t: 1.1, r: 0.2, cbDia: 5.0, cbDepth: 2.9 },
    M3: { size: 'M3', d_nom: 3, k: 3.0, dk: 5.5, dw: 5.07, s: 2.5, t: 1.3, r: 0.25, cbDia: 6.5, cbDepth: 3.4 },
    M4: { size: 'M4', d_nom: 4, k: 4.0, dk: 7.0, dw: 6.53, s: 3.0, t: 2.0, r: 0.3, cbDia: 8.0, cbDepth: 4.4 },
    M5: { size: 'M5', d_nom: 5, k: 5.0, dk: 8.5, dw: 8.03, s: 4.0, t: 2.5, r: 0.35, cbDia: 10.0, cbDepth: 5.4 },
    M6: { size: 'M6', d_nom: 6, k: 6.0, dk: 10.0, dw: 9.38, s: 5.0, t: 3.0, r: 0.4, cbDia: 11.0, cbDepth: 6.4 },
    M8: { size: 'M8', d_nom: 8, k: 8.0, dk: 13.0, dw: 12.33, s: 6.0, t: 4.0, r: 0.5, cbDia: 15.0, cbDepth: 8.6 },
    M10: { size: 'M10', d_nom: 10, k: 10.0, dk: 16.0, dw: 15.33, s: 8.0, t: 5.0, r: 0.6, cbDia: 18.0, cbDepth: 10.6 },
    M12: { size: 'M12', d_nom: 12, k: 12.0, dk: 18.0, dw: 17.23, s: 10.0, t: 6.0, r: 0.7, cbDia: 20.0, cbDepth: 12.6 },
    M14: { size: 'M14', d_nom: 14, k: 14.0, dk: 21.0, dw: 20.17, s: 12.0, t: 7.0, r: 0.8, cbDia: 24.0, cbDepth: 14.6 },
    M16: { size: 'M16', d_nom: 16, k: 16.0, dk: 24.0, dw: 23.17, s: 14.0, t: 8.0, r: 0.8, cbDia: 26.0, cbDepth: 16.6 },
    M18: { size: 'M18', d_nom: 18, k: 18.0, dk: 27.0, dw: 27.0, s: 14.0, t: 9.0, r: 0.9, cbDia: 30.0, cbDepth: 18.6 },
    M20: { size: 'M20', d_nom: 20, k: 20.0, dk: 30.0, dw: 28.87, s: 17.0, t: 10.0, r: 1.0, cbDia: 33.0, cbDepth: 20.6 },
    M22: { size: 'M22', d_nom: 22, k: 22.0, dk: 33.0, dw: 33.0, s: 17.0, t: 11.0, r: 1.0, cbDia: 36.0, cbDepth: 22.6 },
    M24: { size: 'M24', d_nom: 24, k: 24.0, dk: 36.0, dw: 34.81, s: 19.0, t: 12.0, r: 1.2, cbDia: 40.0, cbDepth: 24.6 },
    M27: { size: 'M27', d_nom: 27, k: 27.0, dk: 40.0, dw: 40.0, s: 19.0, t: 13.5, r: 1.2, cbDia: 44.0, cbDepth: 27.6 },
    M30: { size: 'M30', d_nom: 30, k: 30.0, dk: 45.0, dw: 43.61, s: 22.0, t: 15.0, r: 1.4, cbDia: 48.0, cbDepth: 30.6 },
    M36: { size: 'M36', d_nom: 36, k: 36.0, dk: 54.0, dw: 52.54, s: 27.0, t: 18.0, r: 1.6, cbDia: 58.0, cbDepth: 36.6 },
};

// 3. COUNTERSUNK SOCKET SCREW (DIN 7991 / ISO 10642)
export const COUNTERSUNK_DATA: Record<string, BoltHeadDimensions> = {
    M3: { size: 'M3', d_nom: 3, k: 1.7, dk: 6.0, dw: 6.0, s: 2.0, t: 0.95, coneAngle: 90, r: 0.2 },
    M4: { size: 'M4', d_nom: 4, k: 2.3, dk: 8.0, dw: 8.0, s: 2.5, t: 1.5, coneAngle: 90, r: 0.25 },
    M5: { size: 'M5', d_nom: 5, k: 2.8, dk: 10.0, dw: 10.0, s: 3.0, t: 2.05, coneAngle: 90, r: 0.3 },
    M6: { size: 'M6', d_nom: 6, k: 3.3, dk: 12.0, dw: 12.0, s: 4.0, t: 2.25, coneAngle: 90, r: 0.35 },
    M8: { size: 'M8', d_nom: 8, k: 4.4, dk: 16.0, dw: 16.0, s: 5.0, t: 3.2, coneAngle: 90, r: 0.4 },
    M10: { size: 'M10', d_nom: 10, k: 5.5, dk: 20.0, dw: 20.0, s: 6.0, t: 4.1, coneAngle: 90, r: 0.5 },
    M12: { size: 'M12', d_nom: 12, k: 6.5, dk: 24.0, dw: 24.0, s: 8.0, t: 4.3, coneAngle: 90, r: 0.6 },
    M14: { size: 'M14', d_nom: 14, k: 7.0, dk: 27.0, dw: 27.0, s: 10.0, t: 4.8, coneAngle: 90, r: 0.6 },
    M16: { size: 'M16', d_nom: 16, k: 7.5, dk: 30.0, dw: 30.0, s: 10.0, t: 5.3, coneAngle: 90, r: 0.7 },
    M20: { size: 'M20', d_nom: 20, k: 8.5, dk: 36.0, dw: 36.0, s: 12.0, t: 5.6, coneAngle: 90, r: 0.8 },
};

// 4. BUTTON HEAD SOCKET SCREW (ISO 7380-1)
export const BUTTON_HEAD_DATA: Record<string, BoltHeadDimensions> = {
    M3: { size: 'M3', d_nom: 3, k: 1.65, dk: 5.7, dw: 5.7, s: 2.0, t: 1.04, r: 0.2 },
    M4: { size: 'M4', d_nom: 4, k: 2.20, dk: 7.6, dw: 7.6, s: 2.5, t: 1.30, r: 0.25 },
    M5: { size: 'M5', d_nom: 5, k: 2.75, dk: 9.5, dw: 9.5, s: 3.0, t: 1.56, r: 0.3 },
    M6: { size: 'M6', d_nom: 6, k: 3.30, dk: 10.5, dw: 10.5, s: 4.0, t: 2.08, r: 0.35 },
    M8: { size: 'M8', d_nom: 8, k: 4.40, dk: 14.0, dw: 14.0, s: 5.0, t: 2.60, r: 0.45 },
    M10: { size: 'M10', d_nom: 10, k: 5.50, dk: 17.5, dw: 17.5, s: 6.0, t: 3.12, r: 0.55 },
    M12: { size: 'M12', d_nom: 12, k: 6.60, dk: 21.0, dw: 21.0, s: 8.0, t: 4.16, r: 0.65 },
    M16: { size: 'M16', d_nom: 16, k: 8.80, dk: 28.0, dw: 28.0, s: 10.0, t: 5.20, r: 0.8 },
};

// 5. HEX FLANGE BOLT (DIN 6921 / EN 1665)
export const FLANGE_HEX_DATA: Record<string, BoltHeadDimensions> = {
    M5: { size: 'M5', d_nom: 5, k: 5.4, s: 8.0, dc: 11.8, dw: 11.8, c: 1.2, e: 8.79, r: 0.35 },
    M6: { size: 'M6', d_nom: 6, k: 6.6, s: 10.0, dc: 14.2, dw: 14.2, c: 1.5, e: 11.05, r: 0.4 },
    M8: { size: 'M8', d_nom: 8, k: 8.1, s: 13.0, dc: 17.9, dw: 17.9, c: 1.8, e: 14.38, r: 0.5 },
    M10: { size: 'M10', d_nom: 10, k: 9.2, s: 15.0, dc: 21.8, dw: 21.8, c: 2.1, e: 16.64, r: 0.6 },
    M12: { size: 'M12', d_nom: 12, k: 11.5, s: 16.0, dc: 26.0, dw: 26.0, c: 2.5, e: 17.77, r: 0.7 },
    M14: { size: 'M14', d_nom: 14, k: 12.8, s: 18.0, dc: 29.9, dw: 29.9, c: 2.8, e: 19.98, r: 0.8 },
    M16: { size: 'M16', d_nom: 16, k: 14.4, s: 21.0, dc: 34.5, dw: 34.5, c: 3.2, e: 23.35, r: 0.8 },
    M20: { size: 'M20', d_nom: 20, k: 17.1, s: 27.0, dc: 42.8, dw: 42.8, c: 3.8, e: 29.98, r: 1.0 },
};

// 6. LOW HEAD SOCKET SCREW (DIN 7984)
export const LOW_HEAD_DATA: Record<string, BoltHeadDimensions> = {
    M4: { size: 'M4', d_nom: 4, k: 2.8, dk: 7.0, dw: 7.0, s: 2.5, t: 2.3, r: 0.25 },
    M5: { size: 'M5', d_nom: 5, k: 3.5, dk: 8.5, dw: 8.5, s: 3.0, t: 2.7, r: 0.3 },
    M6: { size: 'M6', d_nom: 6, k: 4.0, dk: 10.0, dw: 10.0, s: 4.0, t: 3.0, r: 0.35 },
    M8: { size: 'M8', d_nom: 8, k: 5.0, dk: 13.0, dw: 13.0, s: 5.0, t: 3.8, r: 0.45 },
    M10: { size: 'M10', d_nom: 10, k: 6.0, dk: 16.0, dw: 16.0, s: 7.0, t: 4.5, r: 0.55 },
    M12: { size: 'M12', d_nom: 12, k: 7.0, dk: 18.0, dw: 18.0, s: 8.0, t: 5.0, r: 0.65 },
    M16: { size: 'M16', d_nom: 16, k: 9.0, dk: 24.0, dw: 24.0, s: 12.0, t: 5.5, r: 0.8 },
    M20: { size: 'M20', d_nom: 20, k: 11.0, dk: 30.0, dw: 30.0, s: 14.0, t: 7.5, r: 1.0 },
};

// 7. HEAVY HEX STRUCTURAL BOLT (ASTM A325 / ASME B18.2.6)
export const HEAVY_HEX_DATA: Record<string, BoltHeadDimensions> = {
    '1/2-13': { size: '1/2-13', d_nom: 12.7, k: 7.94, s: 22.22, e: 25.65, dw: 21.0, r: 0.8 },
    '5/8-11': { size: '5/8-11', d_nom: 15.88, k: 9.92, s: 26.99, e: 31.16, dw: 25.5, r: 1.0 },
    '3/4-10': { size: '3/4-10', d_nom: 19.05, k: 11.91, s: 31.75, e: 36.66, dw: 30.0, r: 1.2 },
    '7/8-9': { size: '7/8-9', d_nom: 22.22, k: 13.89, s: 36.51, e: 42.16, dw: 34.5, r: 1.4 },
    '1-8': { size: '1-8', d_nom: 25.4, k: 15.48, s: 41.28, e: 47.66, dw: 39.0, r: 1.5 },
    '1 1/8-7': { size: '1 1/8-7', d_nom: 28.58, k: 17.86, s: 46.04, e: 53.16, dw: 43.5, r: 1.8 },
    '1 1/4-7': { size: '1 1/4-7', d_nom: 31.75, k: 19.84, s: 50.80, e: 58.66, dw: 48.0, r: 2.0 },
    // Metric equivalents for EN 14399-4
    M16: { size: 'M16', d_nom: 16, k: 10.0, s: 27.0, e: 31.16, dw: 25.5, r: 1.0 },
    M20: { size: 'M20', d_nom: 20, k: 12.5, s: 34.0, e: 39.26, dw: 32.0, r: 1.2 },
    M22: { size: 'M22', d_nom: 22, k: 14.0, s: 36.0, e: 41.57, dw: 34.0, r: 1.4 },
    M24: { size: 'M24', d_nom: 24, k: 15.0, s: 41.0, e: 47.34, dw: 39.0, r: 1.5 },
    M27: { size: 'M27', d_nom: 27, k: 17.0, s: 46.0, e: 53.12, dw: 44.0, r: 1.6 },
    M30: { size: 'M30', d_nom: 30, k: 18.7, s: 50.0, e: 57.74, dw: 48.0, r: 1.8 },
    M36: { size: 'M36', d_nom: 36, k: 22.5, s: 60.0, e: 69.28, dw: 57.5, r: 2.0 },
};

// 8. STUD BOLT / DOUBLE END STUD (DIN 939 bm=1.25d)
export const STUD_BOLT_DATA: Record<string, BoltHeadDimensions> = {
    M6: { size: 'M6', d_nom: 6, k: 0, bm: 7.5, dw: 10.0, r: 0.4 },
    M8: { size: 'M8', d_nom: 8, k: 0, bm: 10.0, dw: 13.0, r: 0.5 },
    M10: { size: 'M10', d_nom: 10, k: 0, bm: 12.0, dw: 17.0, r: 0.6 },
    M12: { size: 'M12', d_nom: 12, k: 0, bm: 15.0, dw: 19.0, r: 0.7 },
    M14: { size: 'M14', d_nom: 14, k: 0, bm: 18.0, dw: 22.0, r: 0.8 },
    M16: { size: 'M16', d_nom: 16, k: 0, bm: 20.0, dw: 24.0, r: 0.8 },
    M18: { size: 'M18', d_nom: 18, k: 0, bm: 22.0, dw: 27.0, r: 0.9 },
    M20: { size: 'M20', d_nom: 20, k: 0, bm: 25.0, dw: 30.0, r: 1.0 },
    M22: { size: 'M22', d_nom: 22, k: 0, bm: 28.0, dw: 32.0, r: 1.0 },
    M24: { size: 'M24', d_nom: 24, k: 0, bm: 30.0, dw: 36.0, r: 1.2 },
    M27: { size: 'M27', d_nom: 27, k: 0, bm: 35.0, dw: 41.0, r: 1.2 },
    M30: { size: 'M30', d_nom: 30, k: 0, bm: 38.0, dw: 46.0, r: 1.4 },
};

// 9. SOCKET SET SCREW (DIN 916 Cup Point)
export const SET_SCREW_DATA: Record<string, BoltHeadDimensions> = {
    M3: { size: 'M3', d_nom: 3, k: 0, s: 1.5, t: 1.2, dp: 1.4 },
    M4: { size: 'M4', d_nom: 4, k: 0, s: 2.0, t: 1.5, dp: 2.0 },
    M5: { size: 'M5', d_nom: 5, k: 0, s: 2.5, t: 2.0, dp: 2.5 },
    M6: { size: 'M6', d_nom: 6, k: 0, s: 3.0, t: 2.0, dp: 3.0 },
    M8: { size: 'M8', d_nom: 8, k: 0, s: 4.0, t: 3.0, dp: 5.0 },
    M10: { size: 'M10', d_nom: 10, k: 0, s: 5.0, t: 4.0, dp: 6.0 },
    M12: { size: 'M12', d_nom: 12, k: 0, s: 6.0, t: 4.8, dp: 8.0 },
    M16: { size: 'M16', d_nom: 16, k: 0, s: 8.0, t: 6.4, dp: 10.0 },
    M20: { size: 'M20', d_nom: 20, k: 0, s: 10.0, t: 8.0, dp: 14.0 },
};

// 10. CARRIAGE BOLT (DIN 603)
export const CARRIAGE_BOLT_DATA: Record<string, BoltHeadDimensions> = {
    M5: { size: 'M5', d_nom: 5, k: 3.30, dk: 13.55, dw: 13.55, v: 5.48, f: 4.10, r: 0.35 },
    M6: { size: 'M6', d_nom: 6, k: 3.88, dk: 16.55, dw: 16.55, v: 6.48, f: 4.60, r: 0.4 },
    M8: { size: 'M8', d_nom: 8, k: 4.88, dk: 20.65, dw: 20.65, v: 8.58, f: 5.60, r: 0.5 },
    M10: { size: 'M10', d_nom: 10, k: 5.38, dk: 24.65, dw: 24.65, v: 10.58, f: 6.60, r: 0.6 },
    M12: { size: 'M12', d_nom: 12, k: 6.95, dk: 30.65, dw: 30.65, v: 12.70, f: 8.75, r: 0.7 },
    M16: { size: 'M16', d_nom: 16, k: 8.95, dk: 38.80, dw: 38.80, v: 16.70, f: 12.90, r: 0.8 },
    M20: { size: 'M20', d_nom: 20, k: 11.05, dk: 46.80, dw: 46.80, v: 20.84, f: 15.90, r: 1.0 },
};

// 11. LIFTING EYE BOLT (DIN 580)
export const EYE_BOLT_DATA: Record<string, BoltHeadDimensions> = {
    M8: { size: 'M8', d_nom: 8, k: 36, dw: 20, d2_eye: 20, d3_eye: 36, d4_eye: 20, h_eye: 36 },
    M10: { size: 'M10', d_nom: 10, k: 45, dw: 25, d2_eye: 25, d3_eye: 45, d4_eye: 25, h_eye: 45 },
    M12: { size: 'M12', d_nom: 12, k: 53, dw: 30, d2_eye: 30, d3_eye: 54, d4_eye: 30, h_eye: 53 },
    M14: { size: 'M14', d_nom: 14, k: 62, dw: 35, d2_eye: 35, d3_eye: 63, d4_eye: 35, h_eye: 62 },
    M16: { size: 'M16', d_nom: 16, k: 62, dw: 35, d2_eye: 35, d3_eye: 63, d4_eye: 35, h_eye: 62 },
    M20: { size: 'M20', d_nom: 20, k: 71, dw: 40, d2_eye: 40, d3_eye: 72, d4_eye: 40, h_eye: 71 },
    M24: { size: 'M24', d_nom: 24, k: 90, dw: 50, d2_eye: 50, d3_eye: 90, d4_eye: 50, h_eye: 90 },
    M30: { size: 'M30', d_nom: 30, k: 109, dw: 65, d2_eye: 65, d3_eye: 108, d4_eye: 60, h_eye: 109 },
    M36: { size: 'M36', d_nom: 36, k: 128, dw: 75, d2_eye: 75, d3_eye: 126, d4_eye: 70, h_eye: 128 },
};

/**
 * Universal lookup function for any bolt type and size
 */
export function getBoltHeadDimensions(
    boltType: BoltTypeId,
    size: string,
    overrideNominalDia?: number,
): BoltHeadDimensions {
    const rawKey = size.replace(/\s+/g, '').toUpperCase();
    const metricMatch = size.match(/^M(\d+(?:\.\d+)?)/i);
    const metricKey = metricMatch ? `M${metricMatch[1]}` : rawKey;

    let table: Record<string, BoltHeadDimensions>;
    switch (boltType) {
        case 'socket_cap':
            table = SOCKET_CAP_DATA;
            break;
        case 'countersunk':
            table = COUNTERSUNK_DATA;
            break;
        case 'button_head':
            table = BUTTON_HEAD_DATA;
            break;
        case 'flange_hex':
            table = FLANGE_HEX_DATA;
            break;
        case 'low_head_socket':
            table = LOW_HEAD_DATA;
            break;
        case 'heavy_hex':
            table = HEAVY_HEX_DATA;
            break;
        case 'stud_bolt':
            table = STUD_BOLT_DATA;
            break;
        case 'set_screw':
            table = SET_SCREW_DATA;
            break;
        case 'carriage_bolt':
            table = CARRIAGE_BOLT_DATA;
            break;
        case 'eye_bolt':
            table = EYE_BOLT_DATA;
            break;
        case 'hex_bolt':
        default:
            table = HEX_BOLT_DATA;
            break;
    }

    const found = table[rawKey] || table[metricKey];
    if (found) return found;

    // Fallback scaling based on nominal diameter d
    const d = overrideNominalDia || (metricMatch ? parseFloat(metricMatch[1]) : 10);

    switch (boltType) {
        case 'socket_cap':
            return {
                size,
                d_nom: d,
                k: d,
                dk: Math.round(d * 1.5 * 10) / 10,
                dw: Math.round(d * 1.5 * 10) / 10,
                s: Math.max(2, Math.round(d * 0.8)),
                t: Math.round(d * 0.5 * 10) / 10,
                r: Math.round(d * 0.05 * 100) / 100,
                cbDia: Math.round((d * 1.5 + 2) * 10) / 10,
                cbDepth: Math.round((d + 0.6) * 10) / 10,
            };
        case 'countersunk':
            return {
                size,
                d_nom: d,
                k: Math.round(d * 0.45 * 10) / 10,
                dk: Math.round(d * 2.0 * 10) / 10,
                dw: Math.round(d * 2.0 * 10) / 10,
                s: Math.max(2, Math.round(d * 0.6)),
                t: Math.round(d * 0.35 * 10) / 10,
                coneAngle: 90,
                r: 0.3,
            };
        case 'button_head':
            return {
                size,
                d_nom: d,
                k: Math.round(d * 0.55 * 10) / 10,
                dk: Math.round(d * 1.75 * 10) / 10,
                dw: Math.round(d * 1.75 * 10) / 10,
                s: Math.max(2, Math.round(d * 0.6)),
                t: Math.round(d * 0.35 * 10) / 10,
                r: 0.3,
            };
        case 'flange_hex':
            return {
                size,
                d_nom: d,
                k: Math.round(d * 0.9 * 10) / 10,
                s: Math.round(d * 1.4 * 10) / 10,
                dc: Math.round(d * 2.15 * 10) / 10,
                dw: Math.round(d * 2.15 * 10) / 10,
                c: Math.round(d * 0.2 * 10) / 10,
                e: Math.round(d * 1.4 * 1.155 * 10) / 10,
                r: 0.5,
            };
        case 'low_head_socket':
            return {
                size,
                d_nom: d,
                k: Math.round(d * 0.6 * 10) / 10,
                dk: Math.round(d * 1.5 * 10) / 10,
                dw: Math.round(d * 1.5 * 10) / 10,
                s: Math.max(2, Math.round(d * 0.6)),
                t: Math.round(d * 0.4 * 10) / 10,
                r: 0.3,
            };
        case 'heavy_hex':
            return {
                size,
                d_nom: d,
                k: Math.round(d * 0.65 * 10) / 10,
                s: Math.round(d * 1.7 * 10) / 10,
                e: Math.round(d * 1.7 * 1.155 * 10) / 10,
                dw: Math.round(d * 1.6 * 10) / 10,
                r: 1.0,
            };
        case 'stud_bolt':
            return {
                size,
                d_nom: d,
                k: 0,
                bm: Math.round(d * 1.25 * 10) / 10,
                dw: Math.round(d * 1.5 * 10) / 10,
                r: 0.5,
            };
        case 'set_screw':
            return {
                size,
                d_nom: d,
                k: 0,
                s: Math.max(1.5, Math.round(d * 0.5)),
                t: Math.round(d * 0.4 * 10) / 10,
                dp: Math.round(d * 0.6 * 10) / 10,
            };
        case 'carriage_bolt':
            return {
                size,
                d_nom: d,
                k: Math.round(d * 0.55 * 10) / 10,
                dk: Math.round(d * 2.4 * 10) / 10,
                dw: Math.round(d * 2.4 * 10) / 10,
                v: Math.round((d + 0.5) * 10) / 10,
                f: Math.round((d * 0.7) * 10) / 10,
                r: 0.5,
            };
        case 'eye_bolt':
            return {
                size,
                d_nom: d,
                k: Math.round(d * 3.5),
                dw: Math.round(d * 2.5),
                d2_eye: Math.round(d * 2.5),
                d3_eye: Math.round(d * 4.5),
                d4_eye: Math.round(d * 2.5),
                h_eye: Math.round(d * 3.5),
            };
        case 'hex_bolt':
        default:
            return {
                size,
                d_nom: d,
                k: Math.round(d * 0.7 * 10) / 10,
                s: Math.round(d * 1.6 * 10) / 10,
                e: Math.round(d * 1.6 * 1.155 * 10) / 10,
                dw: Math.round(d * 1.5 * 10) / 10,
                r: 0.5,
            };
    }
}
