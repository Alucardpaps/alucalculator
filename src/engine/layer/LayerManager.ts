/**
 * engine/layer/LayerManager.ts
 * 
 * Manages the canonical list of CAD layers for a given project.
 * Adheres to the ProjectSchema LayerManifest definition.
 */

import { LayerManifest } from '../project/ProjectSchema';

export class LayerManager {
    private layers: Map<string, LayerManifest> = new Map();

    constructor(initialLayers?: LayerManifest[]) {
        if (initialLayers) {
            initialLayers.forEach(l => this.layers.set(l.id, l));
        } else {
            // Default "0" layer standard in CAD
            this.addLayer({
                id: '0',
                name: '0',
                color: '#FFFFFF',
                lineType: 'Continuous',
                lineWeight: 0.25,
                visible: true,
                locked: false
            });
        }
    }

    addLayer(layer: LayerManifest) {
        if (!this.layers.has(layer.id)) {
            this.layers.set(layer.id, layer);
        }
    }

    updateLayer(id: string, updates: Partial<LayerManifest>) {
        const existing = this.layers.get(id);
        if (existing) {
            this.layers.set(id, { ...existing, ...updates });
        }
    }

    getLayer(id: string): LayerManifest | undefined {
        return this.layers.get(id);
    }

    getAllLayers(): LayerManifest[] {
        return Array.from(this.layers.values());
    }

    removeLayer(id: string) {
        if (id !== '0') { // Cannot delete default layer
            this.layers.delete(id);
        }
    }
}
