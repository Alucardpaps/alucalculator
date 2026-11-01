'use client';
/**
 * Bridges the sketch-based Part Studio into the 3D studio scene: "Send to
 * assembly" adds the bodies as one imported part (designStore world units are
 * mm/10), or updates the part it was sent as before, so edits round-trip.
 */
import React from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PartStudio } from '@/cad/part/PartStudio';
import { usePartStore } from '@/cad/part/partStore';
import { useDesignStore, customCADGeometries } from '@/design-studio/designStore';
import { saveCADGeometry } from '@/design-studio/cadGeometryStorage';

export function PartStudioHost({ onClose }: { onClose: () => void }) {
  return (
    <PartStudio
      onClose={onClose}
      onSendBodies={(bodies, partName) => {
        const geoms = bodies.map((b) => {
          const g = b.geometry.clone();
          for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
          return g.index ? g.toNonIndexed() : g;
        });
        const merged = (geoms.length > 1 ? mergeGeometries(geoms, false) : geoms[0]) as THREE.BufferGeometry;
        merged.computeBoundingBox();
        const size = merged.boundingBox!.getSize(new THREE.Vector3());
        const scene = merged.clone().scale(0.1, 0.1, 0.1);
        scene.computeVertexNormals();
        scene.computeBoundingBox();
        scene.computeBoundingSphere();

        const ds = useDesignStore.getState();
        const linked = usePartStore.getState().linkedPartId;
        const currentDoc = usePartStore.getState().doc;
        const existing = linked ? ds.parts.find((p) => p.id === linked) : null;
        const params = { width: Math.round(size.x * 10) / 10, height: Math.round(size.y * 10) / 10, depth: Math.round(size.z * 10) / 10 };
        if (existing) {
          customCADGeometries.set(existing.id, scene);
          saveCADGeometry(existing.id, scene).catch(() => {});
          ds.updatePart(existing.id, {
            customGeometry: scene,
            name: partName || existing.name,
            partDoc: currentDoc,
            params: { ...existing.params, ...params },
          } as never);
          useDesignStore.setState((s) => ({ customGeometries: { ...s.customGeometries, [existing.id]: scene } } as never));
        } else {
          const id = ds.importCADModel(partName || 'Part', scene, { x: 0, y: 0, z: 0 }, '#9aa8b6', params);
          ds.updatePart(id, { partDoc: currentDoc } as never);
          usePartStore.getState().setLinkedPartId(id);
        }
        ds.setCadMode('assembly');
        ds.setPartStudioOpen(false);
        onClose();
      }}
    />
  );
}

export default PartStudioHost;
