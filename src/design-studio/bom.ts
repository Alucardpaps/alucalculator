/**
 * Assembly bill of materials for Design Studio, with T-slot linear-mass grouping.
 */

import type { DesignPart } from './designStore';
import { ENGINEERING_MATERIALS } from './materialsEngine';
import { getTSlotSpec, tSlotMassKg } from '@/cad/catalog/tSlotProfiles';
import { computeSectionProperties } from '@/cad/geometry/sectionProperties';

export interface BomLine {
  id: string;
  itemNo: number;
  name: string;
  kind: string;
  qty: number;
  lengthMm?: number;
  section?: string;
  material: string;
  massKg: number;
  unitMassKgPerM?: number;
  notes?: string;
}

function materialName(id?: string): string {
  const mat = ENGINEERING_MATERIALS.find((m) => m.id === (id || 'al-6061-t6'));
  return mat?.name || 'Aluminum 6061-T6';
}

function partMassKg(part: DesignPart, defaultMaterialId: string): number {
  const mat = ENGINEERING_MATERIALS.find((m) => m.id === (part.materialId || defaultMaterialId))
    || ENGINEERING_MATERIALS[0];
  const p = part.params || {};
  const length = p.length || p.extrudeDepth || p.depth || 0;

  if (part.kind === 't-slot') {
    const spec = getTSlotSpec(p.specId || p.series || p.width || 40);
    return tSlotMassKg(spec, length || 500);
  }

  if ((part.kind === 'profile' || part.solidOp === 'extrude') && (p.sectionAreaMm2 || (part.outer && part.outer.length >= 3))) {
    const area = p.sectionAreaMm2 || computeSectionProperties(part.outer || [], part.inner || []).area;
    const volCm3 = (area * (length || p.extrudeDepth || 20)) / 1000;
    return (volCm3 * mat.density) / 1000;
  }

  const w = p.width || p.diameter || 40;
  const h = p.height || p.diameter || 40;
  const d = p.depth || p.length || 20;
  const volCm3 = (w * h * d) / 1000;
  return (volCm3 * mat.density) / 1000;
}

function groupKey(part: DesignPart): string {
  const p = part.params || {};
  const length = Math.round(p.length || p.extrudeDepth || p.depth || 0);
  if (part.kind === 't-slot') {
    return `t-slot|${p.specId || p.series || p.width}|${length}|${part.materialId || ''}`;
  }
  return `${part.kind}|${part.name}|${length}|${part.materialId || ''}`;
}

export function buildAssemblyBom(
  parts: DesignPart[],
  defaultMaterialId = 'al-6061-t6'
): { lines: BomLine[]; totalMassKg: number; tSlotMeters: number } {
  const groups = new Map<string, { sample: DesignPart; qty: number; mass: number }>();

  for (const part of parts) {
    if (!part.visible) continue;
    const key = groupKey(part);
    const mass = partMassKg(part, defaultMaterialId);
    const existing = groups.get(key);
    if (existing) {
      existing.qty += 1;
      existing.mass += mass;
    } else {
      groups.set(key, { sample: part, qty: 1, mass });
    }
  }

  const lines: BomLine[] = [];
  let itemNo = 1;
  let tSlotMeters = 0;

  for (const g of groups.values()) {
    const p = g.sample.params || {};
    const length = p.length || p.extrudeDepth || p.depth;
    const isTSlot = g.sample.kind === 't-slot';
    if (isTSlot && length) tSlotMeters += (length / 1000) * g.qty;
    const spec = isTSlot ? getTSlotSpec(p.specId || p.series || p.width || 40) : null;
    lines.push({
      id: g.sample.id,
      itemNo: itemNo++,
      name: isTSlot ? (spec?.name || g.sample.name) : g.sample.name,
      kind: g.sample.kind,
      qty: g.qty,
      lengthMm: length,
      section: isTSlot ? `${spec?.width}×${spec?.height} (Slot ${spec?.slot})` : undefined,
      material: isTSlot ? (spec?.alloy || materialName(g.sample.materialId)) : materialName(g.sample.materialId || defaultMaterialId),
      massKg: Number(g.mass.toFixed(4)),
      unitMassKgPerM: spec?.massKgPerM,
      notes: isTSlot ? `${spec?.standard}` : g.sample.designStandard,
    });
  }

  const totalMassKg = Number(lines.reduce((a, l) => a + l.massKg, 0).toFixed(4));
  return { lines, totalMassKg, tSlotMeters };
}
