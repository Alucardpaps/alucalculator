/**
 * Canonical engineering material catalog.
 *
 * Typical values are the calculation default. Minimum allowable (Sy_min)
 * is stored separately and used only when useMinimumAllowable is set.
 */

export type CanonicalCategory = 'aluminum' | 'steel' | 'titanium' | 'plastic' | 'stainless';

export interface CanonicalMaterial {
    id: string;
    name: string;
    aliases: string[];
    category: CanonicalCategory;
    Sy_typical: number;
    Sy_min?: number;
    Su_typical: number;
    E: number;
    G?: number;
    nu: number;
    density: number;
    standard: string;
}

export interface ResolvedMaterial {
    id: string;
    name: string;
    category: CanonicalCategory;
    Sy: number;
    Sy_typical: number;
    Sy_min?: number;
    Su: number;
    E: number;
    G?: number;
    nu: number;
    density: number;
    standard: string;
    usedMinimumAllowable: boolean;
}

export const CANONICAL_MATERIALS: CanonicalMaterial[] = [
    {
        id: 'al-6061-t6',
        name: 'Aluminum 6061-T6',
        aliases: [
            '6061-T6',
            '6061-T6 (US Standard)',
            'Aluminum 6061-T6',
            'Alu 6061-T6',
            'EN AW-6061-T6',
            'alu-6061-t6',
            'alu-6061',
            'al-6061',
        ],
        category: 'aluminum',
        Sy_typical: 276,
        Sy_min: 240,
        Su_typical: 310,
        E: 68.9,
        G: 26,
        nu: 0.33,
        density: 2.70,
        standard: 'ASTM B209 / AMS 4027',
    },
    {
        id: 'al-7075-t6',
        name: 'Aluminum 7075-T6 (Aerospace)',
        aliases: ['7075-T6', 'Alu 7075-T6', 'Aluminum 7075-T6', 'alu-7075', 'al-7075'],
        category: 'aluminum',
        Sy_typical: 503,
        Sy_min: 434,
        Su_typical: 572,
        E: 71.7,
        G: 26.9,
        nu: 0.33,
        density: 2.81,
        standard: 'AMS 4045',
    },
    {
        id: 'steel-s355',
        name: 'Structural Steel S355 / A572',
        aliases: ['S355', 'S355J2 (St52)', 'S355J2', 'A572'],
        category: 'steel',
        Sy_typical: 355,
        Sy_min: 355,
        Su_typical: 510,
        E: 210,
        G: 81,
        nu: 0.30,
        density: 7.85,
        standard: 'EN 10025-2',
    },
    {
        id: 'steel-4140',
        name: 'Alloy Steel 4140 (Chromoly Q&T)',
        aliases: ['AISI 4140', 'AISI 4140 (Cr-Mo)', '4140'],
        category: 'steel',
        Sy_typical: 655,
        Su_typical: 850,
        E: 205,
        G: 79,
        nu: 0.29,
        density: 7.85,
        standard: 'AISI 4140',
    },
    {
        id: 'stainless-316l',
        name: 'Stainless Steel 316L (Marine)',
        aliases: ['316L', 'SS 316L', 'AISI 316L'],
        category: 'stainless',
        Sy_typical: 290,
        Su_typical: 580,
        E: 193,
        G: 77,
        nu: 0.28,
        density: 8.00,
        standard: 'ASTM A240',
    },
    {
        id: 'titanium-gr5',
        name: 'Titanium Ti-6Al-4V (Grade 5)',
        aliases: ['Ti-6Al-4V', 'Grade 5', 'titanium-g5'],
        category: 'titanium',
        Sy_typical: 880,
        Su_typical: 950,
        E: 114,
        G: 44,
        nu: 0.34,
        density: 4.43,
        standard: 'AMS 4911',
    },
    {
        id: 'pom-delrin',
        name: 'POM Acetal / Delrin (Engineering Plastic)',
        aliases: ['Delrin', 'POM', 'Acetal (Delrin)', 'pom-c'],
        category: 'plastic',
        Sy_typical: 65,
        Su_typical: 72,
        E: 3.1,
        nu: 0.35,
        density: 1.42,
        standard: 'ISO 15527',
    },
    {
        id: 'steel-1020',
        name: 'Steel AISI 1020',
        aliases: ['AISI 1020', 'AISI 1020 (Low Carbon)', 'Steel AISI 1020'],
        category: 'steel',
        Sy_typical: 350,
        Su_typical: 420,
        E: 200,
        G: 79,
        nu: 0.29,
        density: 7.85,
        standard: 'AISI 1020',
    },
    {
        id: 'steel-1045',
        name: 'AISI 1045 (Carbon)',
        aliases: ['AISI 1045', 'AISI 1045 Steel', 'AISI 1045 (Carbon)'],
        category: 'steel',
        Sy_typical: 530,
        Su_typical: 625,
        E: 206,
        G: 79,
        nu: 0.29,
        density: 7.85,
        standard: 'AISI 1045',
    },
];

function compact(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getCanonicalById(id: string): CanonicalMaterial | undefined {
    return CANONICAL_MATERIALS.find((m) => m.id === id);
}

function matchCanonical(nameOrId: string): CanonicalMaterial | undefined {
    const raw = (nameOrId || '').trim();
    if (!raw) return undefined;
    const lower = raw.toLowerCase();
    const key = compact(raw);

    const exact = CANONICAL_MATERIALS.find(
        (m) =>
            m.id === lower ||
            compact(m.id) === key ||
            m.name.toLowerCase() === lower ||
            m.aliases.some((a) => a.toLowerCase() === lower || compact(a) === key)
    );
    if (exact) return exact;

    return CANONICAL_MATERIALS.find((m) => {
        const tokens = m.id.split('-');
        const alloy = tokens.find((t) => /^\d{4}$/.test(t));
        const temper = tokens.find((t) => /^t\d/.test(t));
        if (!alloy) return false;
        if (!key.includes(alloy)) return false;
        if (temper && !key.includes(temper)) return false;
        return true;
    });
}

export function resolveMaterial(
    nameOrId: string,
    opts?: { useMinimumAllowable?: boolean }
): ResolvedMaterial | undefined {
    const found = matchCanonical(nameOrId);
    if (!found) return undefined;
    const useMin = Boolean(opts?.useMinimumAllowable) && found.Sy_min !== undefined;
    return {
        id: found.id,
        name: found.name,
        category: found.category,
        Sy: useMin ? (found.Sy_min as number) : found.Sy_typical,
        Sy_typical: found.Sy_typical,
        Sy_min: found.Sy_min,
        Su: found.Su_typical,
        E: found.E,
        G: found.G,
        nu: found.nu,
        density: found.density,
        standard: found.standard,
        usedMinimumAllowable: useMin,
    };
}

export function overlayStrengthMaterials<
    T extends { name: string; Sy: number; Su: number; E: number; G?: number; v?: number },
>(materials: T[]): Array<T & { Sy_min?: number }> {
    return materials.map((m) => {
        const c = resolveMaterial(m.name);
        if (!c) return m;
        return {
            ...m,
            Sy: c.Sy,
            E: c.E,
            G: c.G ?? m.G,
            v: c.nu,
            Sy_min: c.Sy_min,
        };
    });
}

export interface CanonicalFeaMaterial {
    id: string;
    name: string;
    category: 'aluminum' | 'steel' | 'titanium' | 'plastic';
    elasticModulus: number;
    poissonsRatio: number;
    yieldStrength: number;
    ultimateStrength: number;
    density: number;
    colorHex: string;
}

export function toFeaMaterial(id: string, colorHex: string): CanonicalFeaMaterial {
    const c = getCanonicalById(id);
    if (!c) throw new Error(`Canonical material '${id}' is not defined.`);
    const category: CanonicalFeaMaterial['category'] =
        c.category === 'stainless' ? 'steel' : (c.category as CanonicalFeaMaterial['category']);
    return {
        id: c.id,
        name: c.name,
        category,
        elasticModulus: c.E,
        poissonsRatio: c.nu,
        yieldStrength: c.Sy_typical,
        ultimateStrength: c.Su_typical,
        density: c.density,
        colorHex,
    };
}
