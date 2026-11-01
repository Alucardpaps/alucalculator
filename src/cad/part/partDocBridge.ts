'use client';

/**
 * 🌉 PART DOC BRIDGE
 * Connects AluCAD DesignStudio assembly parts with Part Studio.
 * Allows any part in the assembly (whether created via Part Studio or primitive)
 * to be edited with full parametric sketch & solid modeling in Part Studio.
 */

import {
  type PartDoc,
  type SketchFeature,
  type ExtrudeFeature,
  ORIGIN_PLANES,
  featureId,
} from './features';
import { type Sketch, emptySketch, skId } from './sketch';
import { usePartStore } from './partStore';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';

/**
 * Ensures a DesignPart has a valid PartDoc. If part already has a saved PartDoc,
 * returns it. Otherwise, synthesizes an initial parametric sketch + extrude feature
 * corresponding to the part's current dimensions or profile.
 */
export function createOrGetPartDoc(part: DesignPart): PartDoc {
  if (part.partDoc && Array.isArray(part.partDoc.features) && part.partDoc.features.length > 0) {
    try {
      return JSON.parse(JSON.stringify(part.partDoc));
    } catch {
      // fallback
    }
  }

  const p = part.params || {};
  const width = Number(p.width) || 50;
  const height = Number(p.height) || Number(p.extrudeDepth) || 30;
  const depth = Number(p.depth) || 40;
  const radius = Number(p.radius) || Math.min(width, depth) / 2 || 20;

  const doc: PartDoc = {
    name: part.name || 'Part',
    features: [],
  };

  if (part.kind === 'cylinder') {
    // Top Plane (XZ) circle sketch + extrude
    const sId = skId('sk');
    const sketch: Sketch = emptySketch(sId, 'Sketch 1');
    const cId = skId('c');
    sketch.points[cId] = { id: cId, x: 0, y: 0, fixed: true };
    const entId = skId('circ');
    sketch.entities.push({
      id: entId,
      type: 'circle',
      c: cId,
      r: radius,
    });
    sketch.constraints.push({
      id: skId('cn'),
      type: 'diameter',
      entity: entId,
      value: radius * 2,
    });
    const skFeature: SketchFeature = {
      id: featureId('sk'),
      type: 'sketch',
      name: 'Sketch 1',
      plane: ORIGIN_PLANES.XZ,
      planeLabel: ORIGIN_PLANES.XZ.label.en,
      sketch,
      visible: false,
    };
    const exFeature: ExtrudeFeature = {
      id: featureId('ex'),
      type: 'extrude',
      name: 'Boss-Extrude 1',
      sketchId: skFeature.id,
      regionKeys: [],
      distance: height,
      direction: 'normal',
      operation: 'new',
    };
    doc.features.push(skFeature, exFeature);
  } else if (part.outer && part.outer.length >= 3) {
    // Polygon sketch on Top plane (XZ)
    const sId = skId('sk');
    const sketch: Sketch = emptySketch(sId, 'Sketch 1');
    const ptIds: string[] = [];
    part.outer.forEach((pt) => {
      const id = skId('pt');
      sketch.points[id] = { id, x: pt.x, y: pt.y };
      ptIds.push(id);
    });
    for (let i = 0; i < ptIds.length; i++) {
      const nextIdx = (i + 1) % ptIds.length;
      sketch.entities.push({
        id: skId('ln'),
        type: 'line',
        p1: ptIds[i],
        p2: ptIds[nextIdx],
      });
    }
    const skFeature: SketchFeature = {
      id: featureId('sk'),
      type: 'sketch',
      name: 'Sketch 1',
      plane: ORIGIN_PLANES.XZ,
      planeLabel: ORIGIN_PLANES.XZ.label.en,
      sketch,
      visible: false,
    };
    const exFeature: ExtrudeFeature = {
      id: featureId('ex'),
      type: 'extrude',
      name: 'Boss-Extrude 1',
      sketchId: skFeature.id,
      regionKeys: [],
      distance: height,
      direction: 'normal',
      operation: 'new',
    };
    doc.features.push(skFeature, exFeature);
  } else {
    // Centered rectangle sketch on Top plane (XZ) + extrude
    const sId = skId('sk');
    const sketch: Sketch = emptySketch(sId, 'Sketch 1');
    const hw = Math.round((width / 2) * 10) / 10;
    const hd = Math.round((depth / 2) * 10) / 10;
    const p1 = skId('pt'), p2 = skId('pt'), p3 = skId('pt'), p4 = skId('pt');
    sketch.points[p1] = { id: p1, x: -hw, y: -hd };
    sketch.points[p2] = { id: p2, x: hw, y: -hd };
    sketch.points[p3] = { id: p3, x: hw, y: hd };
    sketch.points[p4] = { id: p4, x: -hw, y: hd };
    const l1 = skId('ln'), l2 = skId('ln'), l3 = skId('ln'), l4 = skId('ln');
    sketch.entities.push(
      { id: l1, type: 'line', p1, p2 },
      { id: l2, type: 'line', p1: p2, p2: p3 },
      { id: l3, type: 'line', p1: p3, p2: p4 },
      { id: l4, type: 'line', p1: p4, p2: p1 },
    );
    sketch.constraints.push(
      { id: skId('cn'), type: 'horizontal', line: l1 },
      { id: skId('cn'), type: 'vertical', line: l2 },
      { id: skId('cn'), type: 'horizontal', line: l3 },
      { id: skId('cn'), type: 'vertical', line: l4 },
      { id: skId('cn'), type: 'length', line: l1, value: width },
      { id: skId('cn'), type: 'length', line: l2, value: depth },
    );
    const skFeature: SketchFeature = {
      id: featureId('sk'),
      type: 'sketch',
      name: 'Sketch 1',
      plane: ORIGIN_PLANES.XZ,
      planeLabel: ORIGIN_PLANES.XZ.label.en,
      sketch,
      visible: false,
    };
    const exFeature: ExtrudeFeature = {
      id: featureId('ex'),
      type: 'extrude',
      name: 'Boss-Extrude 1',
      sketchId: skFeature.id,
      regionKeys: [],
      distance: height,
      direction: 'normal',
      operation: 'new',
    };
    doc.features.push(skFeature, exFeature);
  }

  return doc;
}

/**
 * Opens a given assembly part directly inside Part Studio.
 */
export function openPartInPartStudio(
  partOrId: DesignPart | string,
  opts?: {
    featureId?: string;
    featureSubtype?: 'sketch' | 'feature';
  }
): PartDoc | null {
  const ds = useDesignStore.getState();
  const part = typeof partOrId === 'string'
    ? ds.parts.find((p) => p.id === partOrId)
    : partOrId;

  if (!part) return null;

  const partDoc = createOrGetPartDoc(part);
  const partStore = usePartStore.getState();

  partStore.setDoc(partDoc);
  partStore.setLinkedPartId(part.id);

  if (opts?.featureId) {
    if (opts.featureSubtype === 'sketch') {
      partStore.editSketch(opts.featureId);
    } else {
      partStore.editFeature(opts.featureId);
    }
  } else if (opts?.featureSubtype === 'sketch') {
    const lastSketch = partDoc.features.filter((f) => f.type === 'sketch').pop();
    if (lastSketch) partStore.editSketch(lastSketch.id);
  } else if (opts?.featureSubtype === 'feature') {
    const lastSolid = partDoc.features.filter((f) => f.type !== 'sketch').pop();
    if (lastSolid) partStore.editFeature(lastSolid.id);
  }

  // Open Part Studio in DesignStore
  ds.setPartStudioOpen(true);
  ds.setWeldStudioOpen(false);

  return partDoc;
}
