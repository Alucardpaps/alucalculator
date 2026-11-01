/**
 * AluCAD — layer state and linetypes.
 *
 * Layer flags follow AutoCAD: a layer that is off (`visible = false`) or frozen is neither
 * drawn nor snapped to; a locked layer is drawn and snappable but its objects cannot be
 * selected or edited. Objects on a layer that no longer exists behave as on an open layer.
 *
 * The store publishes its layer table here (`publishLayers`), so picking, snapping and the
 * renderer can respect the flags without threading the layer list through every call.
 */

import type { CadEntity, Layer } from './types';

let byId = new Map<string, Layer>();

/** Called by the CAD store whenever its layer table changes. */
export function publishLayers(layers: Layer[]) {
    byId = new Map(layers.map((l) => [l.id, l]));
}

export const layerOf = (layerId: string): Layer | undefined => byId.get(layerId);

export function isLayerShown(layer: Layer | undefined): boolean {
    return !layer || (layer.visible !== false && !layer.frozen);
}

export function isLayerEditable(layer: Layer | undefined): boolean {
    return isLayerShown(layer) && !layer?.locked;
}

/** Drawn and snappable. */
export const isEntityShown = (e: Pick<CadEntity, 'layerId' | 'isVisible'>) => e.isVisible !== false && isLayerShown(byId.get(e.layerId));

/** Selectable and editable. */
export const isEntityEditable = (e: Pick<CadEntity, 'layerId' | 'isVisible'>) => e.isVisible !== false && isLayerEditable(byId.get(e.layerId));

// ─── linetypes ──────────────────────────────────────────────────────────────

export type LinetypeName = 'CONTINUOUS' | 'DASHED' | 'HIDDEN' | 'CENTER' | 'PHANTOM';

export interface LinetypeDef {
    name: LinetypeName;
    /** AutoCAD description shown in the LTYPE table */
    description: string;
    /** dash lengths in mm: + pen down, − pen up (DXF / .lin convention) */
    pattern: number[];
}

export const LINETYPES: Readonly<Record<LinetypeName, LinetypeDef>> = {
    CONTINUOUS: { name: 'CONTINUOUS', description: 'Solid line', pattern: [] },
    DASHED: { name: 'DASHED', description: 'Dashed __ __ __ __', pattern: [6, -3] },
    HIDDEN: { name: 'HIDDEN', description: 'Hidden _ _ _ _ _', pattern: [3, -1.5] },
    CENTER: { name: 'CENTER', description: 'Center ____ _ ____ _', pattern: [10, -2, 2, -2] },
    PHANTOM: { name: 'PHANTOM', description: 'Phantom ____ _ _ ____', pattern: [12, -2, 2, -2, 2, -2] },
};

export const LINETYPE_NAMES = Object.keys(LINETYPES) as LinetypeName[];

export function linetypeName(name?: string): LinetypeName {
    const n = String(name ?? '').toUpperCase();
    return (LINETYPE_NAMES as string[]).includes(n) ? (n as LinetypeName) : 'CONTINUOUS';
}

/**
 * Canvas dash array (pixels) for a linetype at the current zoom. The pattern keeps its
 * drawing scale but never shrinks below a readable period on screen.
 */
export function screenDash(name: string | undefined, zoom: number, minPeriodPx = 12): number[] {
    const def = LINETYPES[linetypeName(name)];
    if (def.pattern.length === 0) return [];
    const period = def.pattern.reduce((s, d) => s + Math.abs(d), 0);
    const k = Math.max(zoom, minPeriodPx / period);
    // a zero-length dash is a dot: draw it as a short visible mark
    return def.pattern.map((d) => Math.max(1, Math.abs(d) * k));
}
