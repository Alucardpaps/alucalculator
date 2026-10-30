/**
 * 🧱 Dynamic Block Bridge for 3D Part Studio
 * 
 * Bridges 2D AutoCAD-grade dynamic blocks (DynamicBlockRegistry) and
 * parametric sketch stamps (SKETCH_DYNAMIC_BLOCKS) directly into 3D Part Studio's
 * native Sketch graph (points, lines, circles, arcs).
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - Deterministic geometry
 * - Normative & Scientific Tier standards
 */

import { SKETCH_DYNAMIC_BLOCKS } from '@/design-studio/sketchDynamicBlocks';
import { DynamicBlockRegistry } from '@/cad/blocks/dynamic/registry';
import { type Sketch, addPoint, addLine, addCircle } from './sketch';

export interface DynamicBlockItem {
  id: string;
  nameTr: string;
  nameEn: string;
  category: 'mechanical' | 'structural' | 'architectural' | 'automotive_mould';
  descriptionTr: string;
  descriptionEn: string;
  icon: string;
  source: 'sketch_blocks' | 'cad_registry';
  params?: Record<string, { labelTr: string; labelEn: string; default: number; min: number; max: number; step?: number }>;
}

/** Get list of all available dynamic blocks for 3D Part Studio */
export function getAvailableDynamicBlocks(): DynamicBlockItem[] {
  const list: DynamicBlockItem[] = [];

  // 1. Parametric sketch dynamic blocks (PCD bolt circle, slot, NEMA, keyway, T-slot, etc.)
  for (const b of SKETCH_DYNAMIC_BLOCKS) {
    list.push({
      id: b.id,
      nameTr: b.nameTr,
      nameEn: b.nameEn,
      category: b.category === 'automotive_mould' ? 'automotive_mould' : 'mechanical',
      descriptionTr: b.descriptionTr,
      descriptionEn: b.descriptionEn,
      icon: b.icon,
      source: 'sketch_blocks',
      params: b.params,
    });
  }

  // 2. High-value 2D CAD dynamic blocks
  const cadBlocks = DynamicBlockRegistry.getAll();
  for (const b of cadBlocks) {
    if (list.some((x) => x.id === b.id)) continue;
    const cat: DynamicBlockItem['category'] =
      b.category === 'Structural' ? 'structural' :
      b.category === 'Architectural' ? 'architectural' : 'mechanical';
    list.push({
      id: b.id,
      nameTr: b.nameTr,
      nameEn: b.name,
      category: cat,
      descriptionTr: b.descriptionTr,
      descriptionEn: b.description,
      icon: '📐',
      source: 'cad_registry',
    });
  }

  return list;
}

/**
 * Stamps any dynamic block (from SKETCH_DYNAMIC_BLOCKS or DynamicBlockRegistry)
 * into a Part Studio Sketch as native closed loops (points, lines, circles).
 */
export function stampDynamicBlockToSketch(
  sk: Sketch,
  blockId: string,
  center: { x: number; y: number } = { x: 0, y: 0 },
  params: Record<string, any> = {}
): Sketch {
  const blockInstanceId = `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const stampedPointIds = new Set<string>();
  const stampedEntityIds = new Set<string>();

  // 1. Check SKETCH_DYNAMIC_BLOCKS
  const skBlock = SKETCH_DYNAMIC_BLOCKS.find((b) => b.id === blockId);
  if (skBlock) {
    const merged: Record<string, number> = {};
    if (skBlock.params) {
      for (const [k, v] of Object.entries(skBlock.params)) {
        merged[k] = typeof params[k] === 'number' ? params[k] : v.default;
      }
    }
    const { solidLoops, constructionLoops } = skBlock.generate(center, merged);
    let curSk = sk;

    // Stamp solid closed loops
    for (const loop of solidLoops) {
      if (loop.length < 2) continue;
      const pids: string[] = [];
      for (const p of loop) {
        const r = addPoint(curSk, p.x, p.y, 1e-4);
        curSk = r.sketch;
        pids.push(r.id);
        stampedPointIds.add(r.id);
      }
      for (let i = 0; i < pids.length; i++) {
        const next = (i + 1) % pids.length;
        if (pids[i] !== pids[next]) {
          const l = addLine(curSk, pids[i], pids[next], false);
          curSk = l.sketch;
          for (const id of l.ids) stampedEntityIds.add(id);
        }
      }
    }

    // Stamp construction loops
    if (constructionLoops) {
      for (const loop of constructionLoops) {
        if (loop.length < 2) continue;
        const pids: string[] = [];
        for (const p of loop) {
          const r = addPoint(curSk, p.x, p.y, 1e-4);
          curSk = r.sketch;
          pids.push(r.id);
          stampedPointIds.add(r.id);
        }
        for (let i = 0; i < pids.length; i++) {
          const next = (i + 1) % pids.length;
          if (pids[i] !== pids[next]) {
            const l = addLine(curSk, pids[i], pids[next], true);
            curSk = l.sketch;
            for (const id of l.ids) stampedEntityIds.add(id);
          }
        }
      }
    }

    const points = { ...curSk.points };
    for (const pid of stampedPointIds) {
      if (points[pid]) points[pid] = { ...points[pid], blockInstanceId };
    }
    const entities = curSk.entities.map((e) =>
      stampedEntityIds.has(e.id) ? { ...e, blockInstanceId, blockId } : e
    );
    const blockInstances = {
      ...(curSk.blockInstances || {}),
      [blockInstanceId]: {
        id: blockInstanceId,
        blockId,
        name: skBlock.nameTr || blockId,
      },
    };
    return { ...curSk, points, entities, blockInstances };
  }

  // 2. Check DynamicBlockRegistry
  const cadBlock = DynamicBlockRegistry.getById(blockId);
  if (cadBlock) {
    const merged = { ...cadBlock.defaultValues, ...params };
    const rawEntities = cadBlock.generate2D(merged, center);
    let curSk = sk;

    for (const ent of rawEntities) {
      const g = ent.geometry;
      if (!g) continue;
      if (g.type === 'LINE') {
        const p1 = addPoint(curSk, g.start.x, g.start.y, 1e-4);
        curSk = p1.sketch;
        stampedPointIds.add(p1.id);
        const p2 = addPoint(curSk, g.end.x, g.end.y, 1e-4);
        curSk = p2.sketch;
        stampedPointIds.add(p2.id);
        if (p1.id !== p2.id) {
          const l = addLine(curSk, p1.id, p2.id, false);
          curSk = l.sketch;
          for (const id of l.ids) stampedEntityIds.add(id);
        }
      } else if (g.type === 'CIRCLE') {
        const c = addCircle(curSk, { x: g.center.x, y: g.center.y }, g.radius, false);
        curSk = c.sketch;
        for (const id of c.ids) stampedEntityIds.add(id);
      } else if (g.type === 'ARC') {
        const segs = 16;
        const span = (g.endAngle - g.startAngle + Math.PI * 2) % (Math.PI * 2) || Math.PI * 2;
        const pids: string[] = [];
        for (let s = 0; s <= segs; s++) {
          const a = g.startAngle + (s / segs) * span;
          const px = g.center.x + Math.cos(a) * g.radius;
          const py = g.center.y + Math.sin(a) * g.radius;
          const pt = addPoint(curSk, px, py, 1e-4);
          curSk = pt.sketch;
          pids.push(pt.id);
          stampedPointIds.add(pt.id);
        }
        for (let i = 0; i < pids.length - 1; i++) {
          if (pids[i] !== pids[i + 1]) {
            const l = addLine(curSk, pids[i], pids[i + 1], false);
            curSk = l.sketch;
            for (const id of l.ids) stampedEntityIds.add(id);
          }
        }
      } else if (g.type === 'POLYLINE') {
        const pids: string[] = [];
        for (const pt of g.vertices) {
          const p = addPoint(curSk, pt.x, pt.y, 1e-4);
          curSk = p.sketch;
          pids.push(p.id);
          stampedPointIds.add(p.id);
        }
        const count = g.closed ? pids.length : pids.length - 1;
        for (let i = 0; i < count; i++) {
          const next = (i + 1) % pids.length;
          if (pids[i] !== pids[next]) {
            const l = addLine(curSk, pids[i], pids[next], false);
            curSk = l.sketch;
            for (const id of l.ids) stampedEntityIds.add(id);
          }
        }
      } else if (g.type === 'RECTANGLE') {
        const hw = g.width / 2;
        const hh = g.height / 2;
        const corners = [
          { x: g.center.x - hw, y: g.center.y - hh },
          { x: g.center.x + hw, y: g.center.y - hh },
          { x: g.center.x + hw, y: g.center.y + hh },
          { x: g.center.x - hw, y: g.center.y + hh },
        ];
        const pids: string[] = [];
        for (const pt of corners) {
          const p = addPoint(curSk, pt.x, pt.y, 1e-4);
          curSk = p.sketch;
          pids.push(p.id);
          stampedPointIds.add(p.id);
        }
        for (let i = 0; i < 4; i++) {
          const next = (i + 1) % 4;
          if (pids[i] !== pids[next]) {
            const l = addLine(curSk, pids[i], pids[next], false);
            curSk = l.sketch;
            for (const id of l.ids) stampedEntityIds.add(id);
          }
        }
      } else if (g.type === 'SPLINE') {
        const pts = g.controlPoints || [];
        const pids: string[] = [];
        for (const pt of pts) {
          const p = addPoint(curSk, pt.x, pt.y, 1e-4);
          curSk = p.sketch;
          pids.push(p.id);
          stampedPointIds.add(p.id);
        }
        for (let i = 0; i < pids.length - 1; i++) {
          if (pids[i] !== pids[i + 1]) {
            const l = addLine(curSk, pids[i], pids[i + 1], false);
            curSk = l.sketch;
            for (const id of l.ids) stampedEntityIds.add(id);
          }
        }
      }
    }

    const points = { ...curSk.points };
    for (const pid of stampedPointIds) {
      if (points[pid]) points[pid] = { ...points[pid], blockInstanceId };
    }
    const entities = curSk.entities.map((e) =>
      stampedEntityIds.has(e.id) ? { ...e, blockInstanceId, blockId } : e
    );
    const blockInstances = {
      ...(curSk.blockInstances || {}),
      [blockInstanceId]: {
        id: blockInstanceId,
        blockId,
        name: cadBlock.nameTr || blockId,
      },
    };
    return { ...curSk, points, entities, blockInstances };
  }

  return sk;
}
