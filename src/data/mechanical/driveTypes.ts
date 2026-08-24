export type BeltDriveKind =
    | 'flat'
    | 'classical-v'
    | 'narrow-v'
    | 'cogged-v'
    | 'poly-v'
    | 'timing';

export type ChainDriveKind =
    | 'roller-simplex'
    | 'roller-duplex'
    | 'roller-triplex'
    | 'silent'
    | 'leaf';

export const BELT_DRIVE_TYPES: Record<BeltDriveKind, {
    label: string;
    shortLabel: string;
    positiveDrive: boolean;
    grooveHalfAngleDeg: number | null;
    velocityLimit: number;
    baseFriction: number;
    pretensionFactor: number;
    note: string;
}> = {
    flat: {
        label: 'Flat Belt',
        shortLabel: 'FLAT',
        positiveDrive: false,
        grooveHalfAngleDeg: null,
        velocityLimit: 35,
        baseFriction: 0.30,
        pretensionFactor: 1.35,
        note: 'Friction belt; wrap angle and surface friction govern slip.',
    },
    'classical-v': {
        label: 'Classical V-Belt',
        shortLabel: 'V',
        positiveDrive: false,
        grooveHalfAngleDeg: 19,
        velocityLimit: 30,
        baseFriction: 0.30,
        pretensionFactor: 1.20,
        note: 'Wedge action increases effective friction.',
    },
    'narrow-v': {
        label: 'Narrow V-Belt',
        shortLabel: 'NARROW V',
        positiveDrive: false,
        grooveHalfAngleDeg: 18,
        velocityLimit: 40,
        baseFriction: 0.32,
        pretensionFactor: 1.15,
        note: 'Higher power density than classical V-belts.',
    },
    'cogged-v': {
        label: 'Cogged / Raw Edge V-Belt',
        shortLabel: 'COGGED V',
        positiveDrive: false,
        grooveHalfAngleDeg: 18,
        velocityLimit: 45,
        baseFriction: 0.34,
        pretensionFactor: 1.12,
        note: 'Improved flexibility and heat dissipation.',
    },
    'poly-v': {
        label: 'Poly-V / Ribbed Belt',
        shortLabel: 'POLY-V',
        positiveDrive: false,
        grooveHalfAngleDeg: 20,
        velocityLimit: 55,
        baseFriction: 0.35,
        pretensionFactor: 1.10,
        note: 'Multi-rib friction belt for compact high-speed drives.',
    },
    timing: {
        label: 'Timing / Synchronous Belt',
        shortLabel: 'TIMING',
        positiveDrive: true,
        grooveHalfAngleDeg: null,
        velocityLimit: 50,
        baseFriction: 0.00,
        pretensionFactor: 1.05,
        note: 'Positive tooth engagement; friction ratio is not the limiting model.',
    },
};

export const CHAIN_DRIVE_TYPES: Record<ChainDriveKind, {
    label: string;
    shortLabel: string;
    strandCount: number;
    velocityLimit: number;
    minimumTeeth: number;
    loadShare: number;
    note: string;
}> = {
    'roller-simplex': {
        label: 'Roller Chain - Simplex',
        shortLabel: 'SIMPLEX',
        strandCount: 1,
        velocityLimit: 18,
        minimumTeeth: 17,
        loadShare: 1,
        note: 'General power transmission chain; validate exact size from ISO/ANSI tables.',
    },
    'roller-duplex': {
        label: 'Roller Chain - Duplex',
        shortLabel: 'DUPLEX',
        strandCount: 2,
        velocityLimit: 18,
        minimumTeeth: 17,
        loadShare: 1.7,
        note: 'Two strands share load, with non-ideal distribution.',
    },
    'roller-triplex': {
        label: 'Roller Chain - Triplex',
        shortLabel: 'TRIPLEX',
        strandCount: 3,
        velocityLimit: 18,
        minimumTeeth: 17,
        loadShare: 2.5,
        note: 'Three strands for higher power; exact rating depends on chain table.',
    },
    silent: {
        label: 'Silent / Inverted Tooth Chain',
        shortLabel: 'SILENT',
        strandCount: 1,
        velocityLimit: 30,
        minimumTeeth: 21,
        loadShare: 1.35,
        note: 'Lower noise and smoother meshing than roller chain.',
    },
    leaf: {
        label: 'Leaf Chain (lifting only)',
        shortLabel: 'LEAF',
        strandCount: 1,
        velocityLimit: 3,
        minimumTeeth: 0,
        loadShare: 1,
        note: 'For lifting/tension applications, not normal sprocket power transmission.',
    },
};

export type BeltProfileShape =
    | 'trapezoidal'
    | 'curvilinear'
    | 'modified-round'
    | 'reinforced-trapezoidal'
    | 'double-sided';

export type TimingProfileGroupKey =
    | 'inch-classic'
    | 'htd'
    | 'std'
    | 't-series'
    | 'at-series'
    | 'double-sided';

export const TIMING_PROFILE_GROUP_LABELS: Record<TimingProfileGroupKey, string> = {
    'inch-classic': 'İnç Esaslı Standartlar (Klasik Güç İletimi)',
    htd: 'Metrik HTD',
    std: 'STD (S2M–S14M)',
    't-series': 'T Serisi (PU Trapezoidal)',
    'at-series': 'AT Serisi (Takviyeli Trapezoidal)',
    'double-sided': 'Çift Taraflı',
};

export const PROFILE_SHAPE_LABELS: Record<BeltProfileShape, string> = {
    trapezoidal: 'Trapezoidal',
    curvilinear: 'Yuvarlak (curvilinear)',
    'modified-round': 'Düz tepe (modified round)',
    'reinforced-trapezoidal': 'Takviyeli trapezoidal',
    'double-sided': 'Çift yüz dişli',
};

export type BeltProfile = {
    id: string;
    family: BeltDriveKind;
    label: string;
    pitchMm?: number;
    topWidthMm?: number;
    heightMm?: number;
    /** Minimum driver teeth (timing belts, Megadyne tables). */
    minTeeth?: number;
    minSmallPulleyMm: number;
    maxSpeedMs: number;
    /** Reference catalog width for nominalKwAt10Ms (mm). */
    referenceWidthMm?: number;
    nominalKwAt10Ms: number;
    elementLabel: string;
    profileShape?: BeltProfileShape;
    usageNote?: string;
    standardGroup?: TimingProfileGroupKey;
    /** Use Megadyne GOLD2 14M interpolated kW table in belt-drive calc. */
    catalogRating?: 'gold2-14m';
    /** Pitch Line Differential 2a (mm): Do = dp − PLD per ISO 13050 / Megadyne. */
    pldMm?: number;
};

function timingPitchDiameterMm(pitchMm: number, teeth: number) {
    return (teeth * pitchMm) / Math.PI;
}

/** Pitch diameter from tooth count: d = z · p / π */
export function pitchDiameterFromTeeth(pitchMm: number, teeth: number): number {
    return timingPitchDiameterMm(pitchMm, teeth);
}

/** ISO 13050 / Megadyne PLD (2a) for metric curvilinear pitches. */
export const TIMING_BELT_PLD_MM: Record<string, number> = {
    '3M': 0.76,
    '5M': 1.14,
    '8M': 1.37,
    '14M': 2.79,
};

/** Resolve PLD (2a) for timing pulley outside diameter: Do = dp − PLD. */
export function timingPldForProfile(profile: BeltProfile): number {
    if (profile.pldMm != null) return profile.pldMm;
    const pitch = profile.pitchMm ?? 14;
    if (Math.abs(pitch - 3) < 0.05) return TIMING_BELT_PLD_MM['3M'];
    if (Math.abs(pitch - 5) < 0.05) return TIMING_BELT_PLD_MM['5M'];
    if (Math.abs(pitch - 8) < 0.05) return TIMING_BELT_PLD_MM['8M'];
    if (Math.abs(pitch - 14) < 0.05) return TIMING_BELT_PLD_MM['14M'];
    if (Math.abs(pitch - 2) < 0.05) return 0.51;
    if (Math.abs(pitch - 2.5) < 0.05) return 0.64;
    if (Math.abs(pitch - 10) < 0.05) return 1.98;
    // Inch trapezoidal fallback (approximate PLD from pitch)
    return pitch * 0.25;
}

/** Hobbing outside diameter: Do = dp − PLD (2a). */
export function timingOutsideDiameterMm(pitchMm: number, teeth: number, pldMm: number): number {
    return pitchDiameterFromTeeth(pitchMm, teeth) - pldMm;
}

/** @deprecated Use timingPldForProfile */
export function timingOdDeductionForProfile(profile: BeltProfile): number {
    return timingPldForProfile(profile);
}

/** Roller sprocket pitch diameter (ISO 606 / Shigley). */
export function sprocketPitchDiameterMm(pitchMm: number, teeth: number): number {
    const z = Math.max(11, teeth);
    return pitchMm / Math.sin(Math.PI / z);
}

/** Sprocket tooth-tip diameter for hobbing (ANSI B29.1 approximation). */
export function sprocketOutsideDiameterMm(pitchMm: number, teeth: number): number {
    const z = Math.max(11, teeth);
    return pitchMm * (0.6 + 1 / Math.tan(Math.PI / z));
}

export function profilesForFamily(family: BeltDriveKind): BeltProfile[] {
    return BELT_PROFILES.filter((p) => p.family === family);
}

const TIMING_GROUP_ORDER: TimingProfileGroupKey[] = [
    'inch-classic',
    'htd',
    'std',
    't-series',
    'at-series',
    'double-sided',
];

/** Timing belt profiles grouped for UI optgroups (standard catalog order). */
export function timingProfileGroups(): {
    groupKey: TimingProfileGroupKey;
    label: string;
    profiles: BeltProfile[];
}[] {
    return TIMING_GROUP_ORDER.map((groupKey) => ({
        groupKey,
        label: TIMING_PROFILE_GROUP_LABELS[groupKey],
        profiles: BELT_PROFILES.filter(
            (p) => p.family === 'timing' && p.standardGroup === groupKey,
        ),
    })).filter((g) => g.profiles.length > 0);
}

function timingProfile(
    id: string,
    label: string,
    pitchMm: number,
    minTeeth: number,
    standardGroup: TimingProfileGroupKey,
    profileShape: BeltProfileShape,
    usageNote: string,
    nominalKwAt10Ms: number,
    referenceWidthMm: number,
    opts?: { maxSpeedMs?: number; catalogRating?: 'gold2-14m'; pldMm?: number },
): BeltProfile {
    return {
        id,
        family: 'timing',
        label,
        pitchMm,
        minTeeth,
        minSmallPulleyMm: timingPitchDiameterMm(pitchMm, minTeeth),
        maxSpeedMs: opts?.maxSpeedMs ?? 50,
        referenceWidthMm,
        nominalKwAt10Ms,
        elementLabel: `${referenceWidthMm} mm width`,
        standardGroup,
        profileShape,
        usageNote,
        catalogRating: opts?.catalogRating,
        pldMm: opts?.pldMm,
    };
}

export function defaultProfileForFamily(family: BeltDriveKind): BeltProfile {
    if (family === 'timing') {
        return resolveBeltProfile('htd-8m', 'timing');
    }
    return profilesForFamily(family)[0] ?? BELT_PROFILES[0];
}

export type ProfileOption = { label: string; value: string; group?: string };

export function profileOptionsForFamily(family: BeltDriveKind): ProfileOption[] {
    const profiles = profilesForFamily(family);
    if (family !== 'timing') {
        return profiles.map((p) => ({ label: p.label, value: p.id }));
    }
    return timingProfileGroups().flatMap((g) =>
        g.profiles.map((p) => ({
            label: p.label,
            value: p.id,
            group: g.label,
        })),
    );
}

export function resolveBeltProfile(profileId: string, family: BeltDriveKind): BeltProfile {
    const match = BELT_PROFILES.find((p) => p.id === profileId && p.family === family);
    if (match) return match;
    return defaultProfileForFamily(family);
}

export function pulleyTeethFromPitchDiameter(dMm: number, pitchMm: number): number {
    if (pitchMm <= 0) return 0;
    return Math.round((Math.PI * dMm) / pitchMm);
}

/** Megadyne MEGASYNC GOLD2 14M — kW per 40 mm belt width (catalog table). */
export const GOLD2_14M_40MM_KW: { rpm: number; z: number; kw: number }[] = [
    { rpm: 10, z: 28, kw: 0.75 }, { rpm: 10, z: 40, kw: 1.07 }, { rpm: 10, z: 56, kw: 1.50 }, { rpm: 10, z: 80, kw: 2.15 },
    { rpm: 50, z: 28, kw: 3.65 }, { rpm: 50, z: 40, kw: 5.37 }, { rpm: 50, z: 56, kw: 7.51 }, { rpm: 50, z: 80, kw: 10.73 },
    { rpm: 100, z: 28, kw: 6.84 }, { rpm: 100, z: 40, kw: 10.21 }, { rpm: 100, z: 56, kw: 14.91 }, { rpm: 100, z: 80, kw: 21.46 },
    { rpm: 500, z: 28, kw: 29.33 }, { rpm: 500, z: 40, kw: 43.79 }, { rpm: 500, z: 56, kw: 63.90 }, { rpm: 500, z: 80, kw: 95.31 },
    { rpm: 1000, z: 28, kw: 54.85 }, { rpm: 1000, z: 40, kw: 81.79 }, { rpm: 1000, z: 56, kw: 119.07 }, { rpm: 1000, z: 80, kw: 176.78 },
    { rpm: 1200, z: 28, kw: 64.64 }, { rpm: 1200, z: 40, kw: 96.31 }, { rpm: 1200, z: 56, kw: 140.02 }, { rpm: 1200, z: 80, kw: 207.28 },
];

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

/** Interpolate Megadyne GOLD2 14M kW rating for driver pulley teeth and rpm. */
export function gold2_14mCatalogKw(rpm: number, driverTeeth: number): number | null {
    const rows = [...new Set(GOLD2_14M_40MM_KW.map((r) => r.rpm))].sort((a, b) => a - b);
    const cols = [...new Set(GOLD2_14M_40MM_KW.map((r) => r.z))].sort((a, b) => a - b);
    if (rows.length === 0 || cols.length === 0) return null;

    const z = Math.max(cols[0], Math.min(cols[cols.length - 1], driverTeeth));
    const r = Math.max(rows[0], Math.min(rows[rows.length - 1], rpm));

    const r0 = rows.reduce((best, row) => (row <= r ? row : best), rows[0]);
    const r1 = rows.reduce((best, row) => (row >= r ? row : best), rows[rows.length - 1]);
    const z0 = cols.reduce((best, col) => (col <= z ? col : best), cols[0]);
    const z1 = cols.reduce((best, col) => (col >= z ? col : best), cols[cols.length - 1]);

    const q = (rr: number, zz: number) => GOLD2_14M_40MM_KW.find((x) => x.rpm === rr && x.z === zz)?.kw ?? 0;
    const tr = r1 === r0 ? 0 : (r - r0) / (r1 - r0);
    const tz = z1 === z0 ? 0 : (z - z0) / (z1 - z0);
    const k00 = q(r0, z0);
    const k10 = q(r1, z0);
    const k01 = q(r0, z1);
    const k11 = q(r1, z1);
    return lerp(lerp(k00, k10, tr), lerp(k01, k11, tr), tz);
}

export const BELT_PROFILES: BeltProfile[] = [
    { id: 'flat-50', family: 'flat', label: 'Flat 50 mm fabric/rubber', topWidthMm: 50, minSmallPulleyMm: 80, maxSpeedMs: 35, nominalKwAt10Ms: 2.5, elementLabel: '50 mm belt' },
    { id: 'flat-100', family: 'flat', label: 'Flat 100 mm fabric/rubber', topWidthMm: 100, minSmallPulleyMm: 125, maxSpeedMs: 35, nominalKwAt10Ms: 5.5, elementLabel: '100 mm belt' },
    { id: 'a', family: 'classical-v', label: 'Classical A / 13x8', topWidthMm: 13, heightMm: 8, minSmallPulleyMm: 75, maxSpeedMs: 30, nominalKwAt10Ms: 1.4, elementLabel: 'A belt' },
    { id: 'b', family: 'classical-v', label: 'Classical B / 17x11', topWidthMm: 17, heightMm: 11, minSmallPulleyMm: 125, maxSpeedMs: 30, nominalKwAt10Ms: 3.2, elementLabel: 'B belt' },
    { id: 'c', family: 'classical-v', label: 'Classical C / 22x14', topWidthMm: 22, heightMm: 14, minSmallPulleyMm: 200, maxSpeedMs: 30, nominalKwAt10Ms: 7.0, elementLabel: 'C belt' },
    { id: 'spz', family: 'narrow-v', label: 'SPZ / 10x8 narrow V', topWidthMm: 10, heightMm: 8, minSmallPulleyMm: 63, maxSpeedMs: 40, nominalKwAt10Ms: 2.0, elementLabel: 'SPZ belt' },
    { id: 'spa', family: 'narrow-v', label: 'SPA / 13x10 narrow V', topWidthMm: 13, heightMm: 10, minSmallPulleyMm: 90, maxSpeedMs: 40, nominalKwAt10Ms: 4.0, elementLabel: 'SPA belt' },
    { id: 'spb', family: 'narrow-v', label: 'SPB / 16x13 narrow V', topWidthMm: 16, heightMm: 13, minSmallPulleyMm: 140, maxSpeedMs: 40, nominalKwAt10Ms: 8.0, elementLabel: 'SPB belt' },
    { id: 'spc', family: 'narrow-v', label: 'SPC / 22x18 narrow V', topWidthMm: 22, heightMm: 18, minSmallPulleyMm: 224, maxSpeedMs: 40, nominalKwAt10Ms: 15.0, elementLabel: 'SPC belt' },
    { id: 'xpa', family: 'cogged-v', label: 'XPA cogged V', topWidthMm: 13, heightMm: 10, minSmallPulleyMm: 71, maxSpeedMs: 45, nominalKwAt10Ms: 5.0, elementLabel: 'XPA belt' },
    { id: 'xpb', family: 'cogged-v', label: 'XPB cogged V', topWidthMm: 16, heightMm: 13, minSmallPulleyMm: 112, maxSpeedMs: 45, nominalKwAt10Ms: 10.0, elementLabel: 'XPB belt' },
    { id: 'pj', family: 'poly-v', label: 'PJ ribbed belt', pitchMm: 2.34, minSmallPulleyMm: 20, maxSpeedMs: 55, nominalKwAt10Ms: 0.22, elementLabel: 'rib' },
    { id: 'pk', family: 'poly-v', label: 'PK ribbed belt', pitchMm: 3.56, minSmallPulleyMm: 45, maxSpeedMs: 55, nominalKwAt10Ms: 0.55, elementLabel: 'rib' },
    { id: 'pl', family: 'poly-v', label: 'PL ribbed belt', pitchMm: 4.70, minSmallPulleyMm: 75, maxSpeedMs: 55, nominalKwAt10Ms: 0.95, elementLabel: 'rib' },
    // —— Timing: İnç Esaslı Standartlar (Klasik Güç İletimi) ——
    timingProfile('mxl', 'MXL (2.032 mm)', 2.032, 15, 'inch-classic', 'trapezoidal', 'Hassas cihazlar, 3D yazıcılar, tıbbi cihazlar', 0.08, 6),
    timingProfile('xl', 'XL (5.08 mm)', 5.08, 15, 'inch-classic', 'trapezoidal', 'Küçük ev aletleri, otomasyon, hafif tork', 0.15, 10),
    timingProfile('l', 'L (9.525 mm)', 9.525, 18, 'inch-classic', 'trapezoidal', 'Orta yük konveyörleri, genel endüstriyel', 0.4, 19),
    timingProfile('h', 'H (12.7 mm)', 12.7, 18, 'inch-classic', 'trapezoidal', 'Ağır iş makineleri, yüksek güç aktarım', 0.8, 25),
    timingProfile('xh', 'XH (22.225 mm)', 22.225, 18, 'inch-classic', 'trapezoidal', 'Ağır sanayi, büyük pompalar', 2.5, 38),
    timingProfile('xxh', 'XXH (31.75 mm)', 31.75, 18, 'inch-classic', 'trapezoidal', 'Ağır sanayi, yüksek yük binen şaftlar', 5.0, 50),
    // —— Timing: Metrik HTD ——
    timingProfile('htd-3m', 'HTD 3M (3 mm)', 3, 22, 'htd', 'curvilinear', 'Küçük el aletleri, skuterler, kompakt motor', 0.35, 15, { pldMm: 0.76 }),
    timingProfile('htd-5m', 'HTD 5M (5 mm)', 5, 14, 'htd', 'curvilinear', 'Küçük el aletleri, skuterler, kompakt motor', 1.0, 25, { pldMm: 1.14 }),
    timingProfile('htd-8m', 'HTD 8M (8 mm)', 8, 22, 'htd', 'curvilinear', 'Endüstriyel otomasyon, otomobil zamanlama', 3.8, 30, { pldMm: 1.37 }),
    timingProfile('htd-14m-std', 'HTD 14M (14 mm)', 14, 28, 'htd', 'curvilinear', 'Endüstriyel otomasyon, ağır tork', 5.0, 40, { pldMm: 2.79 }),
    timingProfile('htd-14m', 'GOLD2 14M — 40 mm (Megadyne catalog)', 14, 28, 'htd', 'curvilinear', 'Endüstriyel otomasyon, ağır tork', 6.84, 40, { catalogRating: 'gold2-14m', pldMm: 2.79 }),
    timingProfile('gold2-14m-55', 'GOLD2 14M — 55 mm (Megadyne catalog)', 14, 28, 'htd', 'curvilinear', 'Endüstriyel otomasyon, ağır tork', 9.4, 55, { catalogRating: 'gold2-14m', pldMm: 2.79 }),
    // —— Timing: STD (S2M–S14M) ——
    timingProfile('s2m', 'S2M (2 mm)', 2, 22, 'std', 'modified-round', 'CNC, robotik, sessiz hassas konumlandırma', 0.25, 9, { pldMm: 0.51 }),
    timingProfile('s3m', 'S3M (3 mm)', 3, 22, 'std', 'modified-round', 'CNC, robotik, sessiz hassas konumlandırma', 0.5, 15, { pldMm: 0.76 }),
    timingProfile('s5m', 'S5M (5 mm)', 5, 14, 'std', 'modified-round', 'CNC, robotik, sessiz hassas konumlandırma', 1.0, 25, { pldMm: 1.14 }),
    timingProfile('s8m', 'S8M (8 mm)', 8, 22, 'std', 'modified-round', 'CNC, robotik, sessiz hassas konumlandırma', 3.5, 30, { pldMm: 1.37 }),
    timingProfile('s14m', 'S14M (14 mm)', 14, 28, 'std', 'modified-round', 'CNC, robotik, sessiz hassas konumlandırma', 6.5, 40, { pldMm: 2.79 }),
    // —— Timing: T Serisi ——
    timingProfile('t2.5', 'T2.5 (2.5 mm)', 2.5, 15, 't-series', 'trapezoidal', 'Gıda paketleme, PU + çelik kord', 0.12, 10),
    timingProfile('t5', 'T5 (5 mm)', 5, 14, 't-series', 'trapezoidal', 'Gıda paketleme, PU + çelik kord', 0.9, 25),
    timingProfile('t10', 'T10 (10 mm)', 10, 18, 't-series', 'trapezoidal', 'Gıda paketleme, PU + çelik kord', 2.5, 32),
    // —— Timing: AT Serisi ——
    timingProfile('at5', 'AT5 (5 mm)', 5, 14, 'at-series', 'reinforced-trapezoidal', 'Zero-backlash hassas hareket', 1.2, 25),
    timingProfile('at10', 'AT10 (10 mm)', 10, 18, 'at-series', 'reinforced-trapezoidal', 'Zero-backlash hassas hareket', 3.0, 32),
    // —— Timing: Çift Taraflı ——
    timingProfile('d-xl', 'D-XL (5.08 mm)', 5.08, 15, 'double-sided', 'double-sided', 'Çift yüz dişli, matbaa / tekstil', 0.2, 10, { pldMm: 1.14 }),
    timingProfile('d-8m', 'D-8M (8 mm)', 8, 22, 'double-sided', 'double-sided', 'Çift yüz dişli, matbaa / tekstil', 3.0, 30, { pldMm: 1.37 }),
];

export type ChainSize = {
    id: string;
    label: string;
    pitchMm: number;
    rollerDiaMm: number;
    widthMm: number;
    minSprocketTeeth: number;
    breakingLoadN: number;
    recommendedWorkingLoadN: number;
    maxSpeedMs: number;
};

export const ROLLER_CHAIN_SIZES: ChainSize[] = [
    { id: '06b', label: 'ISO 06B / ANSI 35', pitchMm: 9.525, rollerDiaMm: 6.35, widthMm: 5.72, minSprocketTeeth: 17, breakingLoadN: 8900, recommendedWorkingLoadN: 1100, maxSpeedMs: 12 },
    { id: '08b', label: 'ISO 08B / ANSI 40', pitchMm: 12.7, rollerDiaMm: 8.51, widthMm: 7.75, minSprocketTeeth: 17, breakingLoadN: 17800, recommendedWorkingLoadN: 2200, maxSpeedMs: 15 },
    { id: '10b', label: 'ISO 10B / ANSI 50', pitchMm: 15.875, rollerDiaMm: 10.16, widthMm: 9.65, minSprocketTeeth: 17, breakingLoadN: 22200, recommendedWorkingLoadN: 2800, maxSpeedMs: 18 },
    { id: '12b', label: 'ISO 12B / ANSI 60', pitchMm: 19.05, rollerDiaMm: 12.07, widthMm: 11.68, minSprocketTeeth: 17, breakingLoadN: 31800, recommendedWorkingLoadN: 4000, maxSpeedMs: 18 },
    { id: '16b', label: 'ISO 16B / ANSI 80', pitchMm: 25.4, rollerDiaMm: 15.88, widthMm: 17.02, minSprocketTeeth: 17, breakingLoadN: 56700, recommendedWorkingLoadN: 7000, maxSpeedMs: 16 },
    { id: '20b', label: 'ISO 20B / ANSI 100', pitchMm: 31.75, rollerDiaMm: 19.05, widthMm: 19.56, minSprocketTeeth: 19, breakingLoadN: 88500, recommendedWorkingLoadN: 11000, maxSpeedMs: 14 },
    { id: '24b', label: 'ISO 24B / ANSI 120', pitchMm: 38.1, rollerDiaMm: 25.4, widthMm: 25.4, minSprocketTeeth: 19, breakingLoadN: 127000, recommendedWorkingLoadN: 16000, maxSpeedMs: 12 },
];
