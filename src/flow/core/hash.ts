/**
 * Deterministic value hashing for node result cache.
 * Layer: flow/core (no UI).
 */

function sortKeys(value: unknown): unknown {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(sortKeys);
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
        const v = obj[key];
        if (v === undefined) continue;
        out[key] = sortKeys(v);
    }
    return out;
}

export function stableHash(value: unknown): string {
    return JSON.stringify(sortKeys(value));
}
