'use client';
import { t12 } from '@/locales/t12';

import * as THREE from 'three';
import { DesignPart, customCADGeometries } from './designStore';
import { MassProperties } from './materialsEngine';
import { createCustomGeometry } from './geometryFactory';

import { ISO_METRIC_HOLES, type HoleItem, type SurfaceCutItem, type SurfaceFace } from './holeStandards';
import { Language } from '../store/i18nStore';

export type DrawingTemplateStyle = 'iso7200' | 'din' | 'blueprint' | 'minimal' | 'modern';
export type DrawingColorTheme = 'classic' | 'blueprint' | 'dark';

export interface DrawingSheetConfig {
  sheetSize: 'A4' | 'A3' | 'A2';
  scale: number; // e.g. 1 = 1:1, 0.5 = 1:2
  projection: 'first-angle' | 'third-angle';
  projectName: string;
  partName: string;
  materialName: string;
  massKg: number;
  author: string;
  approver?: string;
  date: string;
  companyName?: string;
  companySubtext?: string;
  drawingNumber?: string;
  revision?: string;
  tolerance?: string;
  surfaceFinish?: string;
  notes?: string[];
  templateStyle?: DrawingTemplateStyle;
  colorTheme?: DrawingColorTheme;
  lang?: Language | string;
  showBomTable?: boolean;
  showBalloons?: boolean;
  showExplodedView?: boolean;
  showSectionView?: boolean;
  showMeshWireframe?: boolean;
  explodeFactor?: number;
}

export interface DrawingBomRow {
  poz: number;
  partId: string;
  name: string;
  kind: string;
  qty: number;
  material: string;
  dimensions: string;
  unitMassKg: number;
  totalMassKg: number;
  part: DesignPart;
}

/**
 * Normalizes CAD part names by stripping instance suffixes like <1>, (1), [1], :1, #1, _1, -1, .1
 * and file extensions so identical components can be cleanly grouped in the BOM.
 */
export function normalizeBomPartName(rawName: string): string {
  if (!rawName) return 'Component';
  let s = rawName.trim();
  // Strip common CAD file extensions (.step, .stp, .sldprt, .sldasm, .ipt, .iam, .prt, .sat, .iges, .igs)
  s = s.replace(/\.(step|stp|sldprt|sldasm|ipt|iam|prt|sat|iges|igs)$/i, '').trim();
  // Strip CAD instance patterns like <1>, (1), [1]
  s = s.replace(/\s*[<(\[]\s*\d+\s*[>)\]]\s*$/, '').trim();
  // Strip CAD instance prefixes like :1, #1
  s = s.replace(/[:#]\s*\d+\s*$/, '').trim();
  // Strip generic part index suffixes like _part_1, -part-1
  s = s.replace(/[_-]part[_-]\d+$/i, ' Part').trim();
  // Strip trailing instance numbers like _1, _01, -1, -02 (1-4 digits preceded by _ or -)
  s = s.replace(/[_-]\s*\d{1,4}\s*$/, '').trim();
  // Re-strip extension if it was placed before instance bracket (e.g. part.step<1>)
  s = s.replace(/\.(step|stp|sldprt|sldasm|ipt|iam|prt|sat|iges|igs)$/i, '').trim();
  return s || rawName;
}

/**
 * Extracts bounding dimensions and estimated mass for parametric or imported CAD parts
 */
export function getPartDimensionsAndMass(part: DesignPart): {
  dimStr: string;
  unitMassKg: number;
  sortedDims: [number, number, number];
} {
  const p = part.params || {};

  // 1. Parametric shapes with explicit params
  if (part.kind === 'box' || part.kind === 'plate') {
    const w = Math.round(p.width || 40);
    const h = Math.round(p.height || 20);
    const d = Math.round(p.depth || 40);
    const sorted: [number, number, number] = [w, h, d].sort((a, b) => b - a) as [number, number, number];
    let mass = 0.15;
    if (p.width && p.height && p.depth) {
      mass = Number(((p.width * p.height * p.depth * 2.7) / 1000000).toFixed(3));
    }
    return { dimStr: `${w}×${h}×${d}`, unitMassKg: Math.max(0.01, mass), sortedDims: sorted };
  } else if (part.kind === 'cylinder' || part.kind === 'tube' || part.kind === 'pulley') {
    const dia = Math.round(p.radius ? p.radius * 2 : p.diameter || 50);
    const h = Math.round(p.height || p.length || 30);
    const sorted: [number, number, number] = [dia, dia, h].sort((a, b) => b - a) as [number, number, number];
    let mass = 0.15;
    if (dia && h) {
      mass = Number(((Math.PI * (dia / 2) * (dia / 2) * h * 2.7) / 1000000).toFixed(3));
    }
    return { dimStr: `Ø${dia}×${h}`, unitMassKg: Math.max(0.01, mass), sortedDims: sorted };
  } else if (part.kind === 'sphere') {
    const dia = Math.round((p.radius || 25) * 2);
    const mass = Number((((4 / 3) * Math.PI * Math.pow(dia / 2, 3) * 2.7) / 1000000).toFixed(3));
    return { dimStr: `Ø${dia}`, unitMassKg: Math.max(0.01, mass), sortedDims: [dia, dia, dia] };
  } else if (part.kind === 't-slot') {
    const s = p.series || 20;
    const l = Math.round(p.length || 500);
    const sorted: [number, number, number] = [s, s, l].sort((a, b) => b - a) as [number, number, number];
    return { dimStr: `${s}×${s}×${l}`, unitMassKg: 0.15, sortedDims: sorted };
  }

  // 2. Geometry Bounding Box (e.g. imported STEP/mesh or custom geometry)
  try {
    const geom = customCADGeometries.get(part.id) || part.customGeometry;
    if (geom && geom.attributes && geom.attributes.position) {
      if (!geom.boundingBox) geom.computeBoundingBox();
      if (geom.boundingBox) {
        const size = new THREE.Vector3();
        geom.boundingBox.getSize(size);
        const sx = Math.abs(part.scale?.x ?? 1);
        const sy = Math.abs(part.scale?.y ?? 1);
        const sz = Math.abs(part.scale?.z ?? 1);
        // CAD coordinates: 1 unit = 10mm
        const w = Math.round(size.x * 10 * sx * 10) / 10;
        const h = Math.round(size.y * 10 * sy * 10) / 10;
        const d = Math.round(size.z * 10 * sz * 10) / 10;
        const sorted: [number, number, number] = [w, h, d].sort((a, b) => b - a) as [number, number, number];
        const approxVolCm3 = (sorted[0] * sorted[1] * sorted[2]) / 1000;
        const mass = Number(((approxVolCm3 * 2.7 * 0.45) / 1000).toFixed(3));
        return {
          dimStr: `${Math.round(sorted[0])}×${Math.round(sorted[1])}×${Math.round(sorted[2])}`,
          unitMassKg: Math.max(0.005, mass),
          sortedDims: sorted,
        };
      }
    }
  } catch {
    // fallback
  }

  return { dimStr: '—', unitMassKg: 0.15, sortedDims: [0, 0, 0] };
}

export function extractAssemblyBom(parts: DesignPart[], defaultMaterial = 'Aluminum 6061-T6'): DrawingBomRow[] {
  const visibleParts = parts.filter(p => p.visible !== false);
  const groups = new Map<string, { count: number; part: DesignPart; dimStr: string; unitMassKg: number }>();

  for (const part of visibleParts) {
    const cleanName = normalizeBomPartName(part.name || part.kind);
    const { dimStr, unitMassKg, sortedDims } = getPartDimensionsAndMass(part);
    // Dim signature rounded to nearest 0.5mm so slight numerical tolerance differences in mesh bounding boxes group together
    const dKey = sortedDims.map(v => Math.round(v * 2) / 2).join('_');
    const groupKey = `${cleanName}__${part.kind}__${dKey}`;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(groupKey, { count: 1, part, dimStr, unitMassKg });
    }
  }

  const rows: DrawingBomRow[] = [];
  let poz = 1;

  for (const [, { count, part, dimStr, unitMassKg }] of groups) {
    const cleanName = normalizeBomPartName(part.name || part.kind);
    rows.push({
      poz: poz++,
      partId: part.id,
      name: cleanName || `Component ${poz}`,
      kind: part.kind,
      qty: count,
      material: (part as any).material || defaultMaterial,
      dimensions: dimStr,
      unitMassKg,
      totalMassKg: Number((unitMassKg * count).toFixed(3)),
      part,
    });
  }

  return rows;
}

export interface FeatureScheduleItem {
  tag: string; // "H1", "H2", "C1", etc.
  partName: string;
  kind: 'hole' | 'cut' | 'bore';
  face: SurfaceFace;
  x: number; // mm
  y: number; // mm
  size: string; // "M6", "Ø12", "25x35"
  type: string; // "Clearance Hole", "Tap (Threaded)", "Counterbore"
  spec: string; // "ISO 4762 · Ø6.6 / C-Bore Ø10x6mm"
  depth: string; // "Through All" or "15.0 mm (Blind)"
  diameter?: number; // mm
  radius?: number; // mm
}

export interface ExtractedFormulaItem {
  partName: string;
  label: string;
  formula: string;
  result: string;
  unit?: string;
  standard?: string;
}

export function getDrawingI18n(lang: string = 'en') {
  const isTr = lang === 'tr';
  const isDe = lang === 'de';

  return {
    isTr,
    lang,
    views: {
      front: t12(lang, 'FRONT VIEW', 'ÖN GÖRÜNÜŞ'),
      top: t12(lang, 'TOP VIEW', 'ÜST GÖRÜNÜŞ'),
      side: t12(lang, 'RIGHT SIDE VIEW', 'YAN GÖRÜNÜŞ (SAĞ)'),
      isometric: t12(lang, '3D ISOMETRIC PROJECTION', '3D İZOMETRİK PROJEKSİYON'),
    },
    notes: {
      title: t12(lang, 'GENERAL DRAWING NOTES:', 'GENEL ÇİZİM NOTLARI:'),
      default: [
        t12(lang, '1. All dimensions are in millimeters (mm) unless noted.', '1. Tüm ölçüler milimetre (mm) cinsindendir.'),
        t12(lang, '2. General tolerances according to ISO 2768-m (Medium).', '2. Genel toleranslar ISO 2768-m standardına uygundur.'),
        t12(lang, '3. Deburr and break all sharp edges 0.5x45°, fillet radii R1.0 mm.', '3. Çapakları temizleyiniz, keskin kenarları kırınız (0.5x45°).'),
      ]
    },
    titleBlock: {
      project: t12(lang, 'PROJECT', 'PROJE'),
      assembly: t12(lang, 'Assembly', 'Montaj'),
      partsSuffix: t12(lang, 'Parts', 'Parça'),
      partDetail: t12(lang, 'Part Drawing', 'Parça Çizimi'),
      material: t12(lang, 'MATERIAL', 'MALZEME'),
      weight: t12(lang, 'WEIGHT', 'AĞIRLIK'),
      scale: t12(lang, 'SCALE', 'ÖLÇEK'),
      size: t12(lang, 'SIZE', 'BOYUT'),
      tolerance: t12(lang, 'TOLERANCE', 'TOLERANS'),
      surface: t12(lang, 'SURFACE', 'YÜZEY'),
      date: t12(lang, 'DATE', 'TARİH'),
      rev: t12(lang, 'REV', 'REV'),
      author: t12(lang, 'DRAWN BY', 'ÇİZEN'),
      approver: t12(lang, 'CHECKED BY', 'ONAY'),
      drawingNumber: t12(lang, 'DRAWING NO', 'RESİM NO'),
    },
    holeSchedule: {
      title: (count: number) => t12(lang, `🕳️ HOLE & CUT SCHEDULE (${count} Features / ISO 7200)`, `🕳️ DELİK & KESİM ÇİZELGESİ (${count} Özellik / ISO 7200)`),
      no: t12(lang, 'NO', 'NO'),
      face: t12(lang, 'FACE', 'YÜZEY'),
      x: t12(lang, 'X (mm)', 'X (mm)'),
      y: t12(lang, 'Y (mm)', 'Y (mm)'),
      spec: t12(lang, 'FEATURE SPECIFICATION', 'DELİK / KESİM ÖZELLİĞİ'),
      depth: t12(lang, 'DEPTH', 'DERİNLİK'),
      throughAll: t12(lang, 'Through All', 'Boydan Boya'),
      blind: t12(lang, 'Blind Hole', 'Kör Delik'),
      faces: {
        top: t12(lang, 'Top (+Y)', 'Üst (+Y)'),
        bottom: t12(lang, 'Bottom (-Y)', 'Alt (-Y)'),
        front: t12(lang, 'Front (+Z)', 'Ön (+Z)'),
        back: t12(lang, 'Back (-Z)', 'Arka (-Z)'),
        right: t12(lang, 'Right (+X)', 'Sağ (+X)'),
        left: t12(lang, 'Left (-X)', 'Sol (-X)'),
      }
    },
    mfgTable: {
      title: (count: number) => t12(lang, `📐 ENGINEERING & MANUFACTURING SUMMARY`, `📐 İMALAT VE MÜHENDİSLİK HESAP ÖZETİ`),
      param: t12(lang, 'PARAMETER', 'PARAMETRE'),
      formula: t12(lang, 'EQUATION', 'FORMÜL'),
      value: t12(lang, 'VALUE', 'DEĞER'),
      standard: t12(lang, 'STANDARD', 'STANDART'),
      appendixTitle: t12(lang, 'ENGINEERING CALCULATIONS & MANUFACTURING PASSPORT', 'MÜHENDİSLİK HESAPLARI VE İMALAT PASAPORTU'),
      appendixSubtitle: t12(lang, 'AluCAD OS Automated Engineering Design & Analysis Report', 'AluCAD OS Mühendislik ve İmalat Analiz Motoru Raporu'),
      partTitle: t12(lang, 'Part & Manufacturing Specifications', 'Parça ve İmalat Detayları'),
      notesTitle: t12(lang, 'Manufacturing & Quality Notes', 'İmalat ve Kalite Notları'),
    },
    pdf: {
      toolbarTitle: (count: number) => t12(lang, `📑 Technical Drawing Portfolio (${count} Sheets)`, `📑 Teknik Resim Portföyü (${count} Sayfa)`),
      printButton: t12(lang, '🖨️ Print / Save Multi-Sheet PDF', '🖨️ Tümünü PDF Olarak Kaydet / Yazdır'),
      page: t12(lang, 'Sheet', 'Sayfa'),
    }
  };
}

export function extractManufacturingFormulas(parts: DesignPart[], lang: string = 'en'): ExtractedFormulaItem[] {
  const isTr = lang === 'tr';
  const list: ExtractedFormulaItem[] = [];

  for (const part of parts) {
    if (!part.visible) continue;
    if (part.manufacturingFormulas && part.manufacturingFormulas.length > 0) {
      for (const f of part.manufacturingFormulas) {
        let label = f.label;
        let formula = f.formula;
        let result = f.result;

        if (!isTr) {
          if (label.includes('Hatve')) label = 'Pitch Diameter (d)';
          else if (label.includes('Diş Üstü')) label = 'Tip Diameter (da)';
          else if (label.includes('Taban')) label = 'Root Diameter (df)';
          else if (label.includes('Helis')) label = 'Helix Angle (β)';
          else if (label.includes('Genişli')) label = 'Face Width (b)';
          else if (label.includes('Kavrama Oranı')) label = 'Contact Ratio (εα)';
          else if (label.includes('Lewis') || label.includes('Diş Dibi')) label = 'Tooth Bending Stress (σF)';
          else if (label.includes('Kutup Atalet')) label = 'Polar Moment (J)';
          else if (label.includes('Burulma Direnç')) label = 'Torsion Modulus (Wp)';
          else if (label.includes('Kama')) label = 'Keyway Pressure (p)';
          else if (label.includes('Eşdeğer Gerilme')) label = 'Equivalent Stress (σvM)';
          else if (label.includes('Dinamik Yük')) label = 'Dynamic Load (P)';
          else if (label.includes('L10 Anma')) label = 'Rating Life (L10)';
          else if (label.includes('Çalışma Saati')) label = 'Operating Life (L10h)';
          else if (label.includes('Statik Emniyet')) label = 'Static Safety (s0)';
          else if (label.includes('Gerilme Alanı')) label = 'Stress Area (As)';
          else if (label.includes('Ön Yük')) label = 'Preload (FM)';
          else if (label.includes('Sıkma Torku')) label = 'Tightening Torque (MA)';
          else if (label.includes('Emniyet Faktörü')) label = 'Safety Factor (SF)';
          else if (label.includes('Eğilme Mukavemet')) label = 'Section Modulus (Wx)';
          else if (label.includes('Maksimum Eğilme')) label = 'Max Bending Stress (σmax)';
          else if (label.includes('Sehim')) label = 'Max Deflection (fmax)';
          else if (label.includes('Burkulma')) label = 'Euler Buckling (Fcrit)';
          else if (label.includes('Kesit Alanı')) label = 'Cross-Section Area (A)';
          else if (label.includes('Hacmi')) label = 'Extrusion Volume (V)';
          else if (label.includes('Kütlesi')) label = 'Estimated Mass (m)';

          if (result.includes('Sağ Helis')) result = result.replace('Sağ Helis / RH', 'Right Hand (RH)').replace('Sağ Helis', 'Right Hand (RH)');
          if (result.includes('Sol Helis')) result = result.replace('Sol Helis / LH', 'Left Hand (LH)').replace('Sol Helis', 'Left Hand (LH)');
          if (result.includes('devir')) result = result.replace('devir', 'revs');
          if (result.includes('saat')) result = result.replace('saat', 'hours');
        } else {
          if (label.includes('Hatve Çapı')) label = 'Hatve Çapı (d)';
          else if (label.includes('Diş Üstü Çapı')) label = 'Diş Üstü Çapı (da)';
          else if (label.includes('Taban Dairesi')) label = 'Taban Çapı (df)';
          else if (label.includes('Helis Açısı')) label = 'Helis Açısı (β)';
          else if (label.includes('Diş Genişliği')) label = 'Diş Genişliği (b)';
          else if (label.includes('Kavrama Oranı')) label = 'Kavrama Oranı (εα)';
          else if (label.includes('Lewis')) label = 'Diş Dibi Gerilmesi (σF)';
        }

        if (formula.includes('√(ra1²-rb1²)')) {
          formula = 'εα = Contact Ratio';
        } else if (formula.includes('Ft / (b · m · Y_F)')) {
          formula = 'σF = Ft / (b · m · YF)';
        }

        list.push({
          partName: part.name || (t12(lang, 'Component', 'Bileşen')),
          label,
          formula,
          result,
          unit: f.unit,
          standard: f.standard || part.designStandard || 'ISO/DIN'
        });
      }
    }
  }
  return list;
}

export function extractFeatureSchedule(parts: DesignPart[], lang: string = 'en'): FeatureScheduleItem[] {
  const items: FeatureScheduleItem[] = [];
  let holeIdx = 1;
  let cutIdx = 1;

  for (const part of parts) {
    if (!part.visible) continue;
    const p = part.params || {};

    // 1. User-defined Holes (part.holes)
    if (part.holes && part.holes.length > 0) {
      for (const h of part.holes) {
        const std = ISO_METRIC_HOLES.find((s) => s.size === h.size);
        const nomDia = std ? std.nominalDiameter : (parseFloat(h.size.replace(/[^\d.]/g, '')) || 6);
        const pitch = std ? std.coarsePitch : 1.0;
        const tapDia = std ? std.tapDrillDiameter : (nomDia - pitch);
        const cbDia = std ? std.counterboreDiameter : (nomDia * 1.8);
        const cbDepth = std ? std.counterboreDepth : (nomDia);
        const csDia = std ? std.countersinkDiameter : (nomDia * 2.0);

        let typeLabel = t12(lang, 'Clearance Hole (H11)', 'Düz Geçme (Clearance)');
        let specStr = `Ø${std ? std.clearanceMedium : nomDia} mm (H11)`;

        if (h.type === 'counterbore') {
          typeLabel = t12(lang, 'Counterbore (DIN 912)', 'İmbus Havşa (DIN 912)');
          specStr = `Ø${std ? std.clearanceMedium : (nomDia + 0.6)} / C-Bore Ø${cbDia}x${cbDepth}mm`;
        } else if (h.type === 'tap') {
          typeLabel = t12(lang, 'Threaded Hole (Tap)', 'Dişli / Kılavuz (Tap)');
          specStr = `M${nomDia}x${pitch} (Drill Ø${tapDia}mm)`;
        } else if (h.type === 'countersink') {
          typeLabel = t12(lang, 'Countersink (DIN 7991)', '90° Konik Havşa (DIN 7991)');
          specStr = `Ø${std ? std.clearanceMedium : nomDia} / C-Sink Ø${csDia}x90°`;
        }

        const depthStr = h.isThroughAll !== false
          ? (t12(lang, 'Through All', 'Boydan Boya'))
          : `${h.depth || 15} mm (${t12(lang, 'Blind', 'Kör Delik')})`;

        items.push({
          tag: `H${holeIdx++}`,
          partName: part.name,
          kind: 'hole',
          face: h.face || 'top',
          x: Math.round(h.x * 10) / 10,
          y: Math.round(h.y * 10) / 10,
          size: h.size,
          type: typeLabel,
          spec: specStr,
          depth: depthStr,
          diameter: nomDia,
          radius: Math.sqrt(h.x * h.x + h.y * h.y),
        });
      }
    }

    // 2. User-defined Surface Cuts / Pockets (part.cuts)
    if (part.cuts && part.cuts.length > 0) {
      for (const c of part.cuts) {
        let typeLabel = t12(lang, 'Rectangular Pocket', 'Dikdörtgen Havuz');
        let sizeStr = `${c.width || 30}x${c.length || 40} mm`;
        let specStr = t12(lang, `Milling Pocket (${c.width || 30}x${c.length || 40}mm)`, `Freze Havuzu (${c.width || 30}x${c.length || 40}mm)`);

        if (c.type === 'circle') {
          typeLabel = t12(lang, 'Circular Pocket', 'Dairesel Havuz');
          sizeStr = `Ø${c.diameter || 25} mm`;
          specStr = t12(lang, `Bore Pocket (Ø${c.diameter || 25}mm)`, `Silindirik Havuz (Ø${c.diameter || 25}mm)`);
        } else if (c.type === 'slot') {
          typeLabel = t12(lang, 'Milling Slot', 'Freze Slot Kanalı');
          sizeStr = `${c.width || 10}x${c.length || 30} mm`;
          specStr = t12(lang, `Radius Slot (${c.width || 10}x${c.length || 30}mm)`, `Radyuslu Slot (${c.width || 10}x${c.length || 30}mm)`);
        }

        const depthStr = c.isThroughAll
          ? (t12(lang, 'Through All', 'Boydan Boya'))
          : `${c.depth || 8} mm (${t12(lang, 'Depth', 'Derinlik')})`;

        items.push({
          tag: `C${cutIdx++}`,
          partName: part.name,
          kind: 'cut',
          face: c.face || 'top',
          x: Math.round(c.x * 10) / 10,
          y: Math.round(c.y * 10) / 10,
          size: sizeStr,
          type: typeLabel,
          spec: specStr,
          depth: depthStr,
          radius: Math.sqrt(c.x * c.x + c.y * c.y),
        });
      }
    }

    // 3. Built-in bores and center holes from library shapes
    if (part.kind === 'tube') {
      const innerD = p.innerDiameter || 20;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${innerD}`,
        type: t12(lang, 'Tube Center Bore', 'İç Çap Deliği (Bore)'),
        spec: `Ø${innerD} mm ${t12(lang, 'Through Inner Bore', 'Boydan Boya İç Delik')}`,
        depth: t12(lang, 'Through All', 'Boydan Boya'),
        diameter: innerD,
        radius: 0,
      });
    } else if (part.kind === 'gear-blank') {
      const boreD = p.bore || p.boreDiameter || 12;
      const hasKey = p.hasKeyway !== false;
      const hasClampex = Boolean(p.conicalLock);
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${boreD}`,
        type: hasClampex
          ? t12(lang, 'KTR CLAMPEX® Conical Clamping Bore (H7)', 'KTR CLAMPEX® Konik Kilit Yuvası (H7)')
          : hasKey
            ? t12(lang, 'Shaft Bore with DIN 6885-1 Keyway (H7)', 'DIN 6885-1 Kamalı Mil Deliği (H7)')
            : t12(lang, 'Center Shaft Bore (H7)', 'Mil Göbek Deliği (H7)'),
        spec: hasClampex
          ? `Ø${boreD} mm ${t12(lang, `KTR CLAMPEX® ${p.conicalLock.model} (d=${p.conicalLock.d}mm, TA=${p.conicalLock.TA}Nm)`, `KTR CLAMPEX® ${p.conicalLock.model} (Mil=${p.conicalLock.d}mm, TA=${p.conicalLock.TA}Nm)`)}`
          : `Ø${boreD} mm ${t12(lang, hasKey ? 'Shaft Fit Bore with DIN 6885 Keyway' : 'Shaft Fit Bore (H7)', hasKey ? 'DIN 6885 Kamalı Mil Geçme Deliği' : 'Mil Geçme Deliği (H7)')}`,
        depth: t12(lang, 'Through All', 'Boydan Boya'),
        diameter: boreD,
        radius: 0,
      });
    } else if (part.kind === 'pulley') {
      const boreD = p.innerDiameter || p.bore || 12;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${boreD}`,
        type: t12(lang, 'Pulley Shaft Bore (H7)', 'Kasnak Göbek Deliği'),
        spec: `Ø${boreD} mm ${t12(lang, 'Shaft Bore (H7)', 'Kasnak Mil Deliği (H7)')}`,
        depth: t12(lang, 'Through All', 'Boydan Boya'),
        diameter: boreD,
        radius: 0,
      });
    } else if (part.kind === 'bearing-race') {
      const innerD = p.innerDiameter || 20;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${innerD}`,
        type: t12(lang, 'Bearing Inner Bore (H6)', 'Rulman İç Bilezik Deliği'),
        spec: `Ø${innerD} mm ${t12(lang, 'Shaft Seat (H6)', 'Rulman Mil Yuvası (H6)')}`,
        depth: t12(lang, 'Through All', 'Boydan Boya'),
        diameter: innerD,
        radius: 0,
      });
    }
  }

  return items;
}

function getGeometryForPart(part: DesignPart): THREE.BufferGeometry {
  return createCustomGeometry(part);
}



/**
 * Generates an ISO Standard 2D Technical Drawing Sheet in SVG format containing:
 * - True 3D Polygon Projections for Front, Top, Right Side, and Isometric Views
 * - CAD Cel-Shaded Surfaces with Crisp Technical Linework
 * - Automatic Dimension Lines with Extension Witness Lines & Arrowheads
 * - Centerlines & Hole Markers
 * - Standard ISO 7200 Title Block (Antet)
 */
export function generateTechnicalDrawingSVG(
  target: DesignPart | DesignPart[],
  massProps: MassProperties,
  config: Partial<DrawingSheetConfig> = {}
): string {
  const partsToDraw: DesignPart[] = Array.isArray(target) ? target : [target];
  const isAssembly = partsToDraw.length > 1;

  // Extract all 3D triangles from all parts in world / assembly coordinates
  interface Triangle3D {
    p0: [number, number, number];
    p1: [number, number, number];
    p2: [number, number, number];
    normal: [number, number, number];
    color: string;
    partId: string;
  }

  const triangles: Triangle3D[] = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  const totalParts = partsToDraw.length;
  // Adaptive triangle & CPU budgeting per part for massive assemblies (up to 10,000 parts)
  const maxTrisPerPart = totalParts > 2000
    ? 8
    : totalParts > 500
      ? 16
      : totalParts > 150
        ? 40
        : totalParts > 50
          ? 100
          : totalParts > 15
            ? 300
            : 3000;
  const MAX_GLOBAL_TRIANGLES = totalParts > 2000 ? 12000 : totalParts > 150 ? 14000 : 35000;

  for (const part of partsToDraw) {
    if (!part.visible) continue;
    if (triangles.length >= MAX_GLOBAL_TRIANGLES) break;

    const geom = getGeometryForPart(part);
    const posAttr = geom.attributes.position;
    if (!posAttr) continue;

    const index = geom.index;
    const totalPartTris = index ? Math.floor(index.count / 3) : Math.floor(posAttr.count / 3);
    const triStep = totalPartTris > maxTrisPerPart
      ? Math.ceil(totalPartTris / maxTrisPerPart)
      : 1;

    const partPos = [part.position.x / 10, part.position.y / 10, part.position.z / 10];
    const partRot = [
      (part.rotation.x * Math.PI) / 180,
      (part.rotation.y * Math.PI) / 180,
      (part.rotation.z * Math.PI) / 180,
    ];
    const sx = part.scale?.x ?? 1;
    const sy = part.scale?.y ?? 1;
    const sz = part.scale?.z ?? 1;
    const euler = new THREE.Euler(partRot[0], partRot[1], partRot[2], 'XYZ');
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(partPos[0], partPos[1], partPos[2]),
      new THREE.Quaternion().setFromEuler(euler),
      new THREE.Vector3(sx, sy, sz)
    );

    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();

    const getVertex = (idx: number, dest: THREE.Vector3) => {
      dest.fromBufferAttribute(posAttr, idx);
      dest.applyMatrix4(matrix);
      // Viewport units to mm (1 unit = 10mm)
      dest.multiplyScalar(10);

      if (dest.x < minX) minX = dest.x;
      if (dest.x > maxX) maxX = dest.x;
      if (dest.y < minY) minY = dest.y;
      if (dest.y > maxY) maxY = dest.y;
      if (dest.z < minZ) minZ = dest.z;
      if (dest.z > maxZ) maxZ = dest.z;
    };

    const count = index ? index.count : posAttr.count;
    for (let i = 0; i < count; i += 3 * triStep) {
      if (triangles.length >= MAX_GLOBAL_TRIANGLES) break;
      const i0 = index ? index.getX(i) : i;
      const i1 = index ? index.getX(i + 1) : i + 1;
      const i2 = index ? index.getX(i + 2) : i + 2;

      getVertex(i0, v0);
      getVertex(i1, v1);
      getVertex(i2, v2);

      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      triangles.push({
        p0: [v0.x, v0.y, v0.z],
        p1: [v1.x, v1.y, v1.z],
        p2: [v2.x, v2.y, v2.z],
        normal: [normal.x, normal.y, normal.z],
        color: part.color || '#94a3b8',
        partId: part.id,
      });
    }
  }

  // Handle fallback if no vertices found
  if (minX === Infinity) {
    minX = -30; maxX = 30;
    minY = -20; maxY = 20;
    minZ = -15; maxZ = 15;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const dimW = Math.round(Math.max(0.1, maxX - minX) * 10) / 10;
  const dimH = Math.round(Math.max(0.1, maxY - minY) * 10) / 10;
  const dimD = Math.round(Math.max(0.1, maxZ - minZ) * 10) / 10;
  const lang = config.lang || 'en';
  const i18n = getDrawingI18n(lang);

  const defaultPartName = isAssembly
    ? `${i18n.titleBlock.assembly}: ${partsToDraw.length} ${i18n.titleBlock.partsSuffix}`
    : partsToDraw[0]?.name || i18n.titleBlock.partDetail;

  const cfg: DrawingSheetConfig = {
    sheetSize: config.sheetSize || 'A3',
    scale: config.scale || 1,
    projection: config.projection || 'first-angle',
    projectName: config.projectName || 'ALU-CAD PROJECT',
    partName: config.partName || defaultPartName,
    materialName: config.materialName || t12(i18n.lang, 'Aluminum 6061-T6', 'Alüminyum 6061-T6'),
    massKg: massProps.massKg,
    author: config.author || 'Design Engineer',
    approver: config.approver || 'Lead QA',
    date: config.date || new Date().toISOString().split('T')[0],
    companyName: config.companyName || 'ALUCALCULATOR CAD SYSTEMS',
    companySubtext: config.companySubtext || 'Precision Engineering & Manufacturing',
    drawingNumber: config.drawingNumber || `DWG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    revision: config.revision || '01',
    tolerance: config.tolerance || 'ISO 2768-m',
    surfaceFinish: config.surfaceFinish || 'Ra 1.6 μm',
    notes: config.notes && config.notes.length > 0 ? config.notes : i18n.notes.default,
    templateStyle: config.templateStyle || 'iso7200',
    colorTheme: config.colorTheme || 'classic',
    lang,
  };

  const isA3 = cfg.sheetSize === 'A3';
  const isA2 = cfg.sheetSize === 'A2';
  const sheetW = isA2 ? 1680 : isA3 ? 1188 : 840;
  const sheetH = isA2 ? 1188 : isA3 ? 840 : 594;
  const margin = 20;

  const isThemeBlueprint = cfg.colorTheme === 'blueprint';
  const isThemeDark = cfg.colorTheme === 'dark';

  const bgColor = isThemeBlueprint ? '#091833' : isThemeDark ? '#080c14' : '#ffffff';
  const primaryStroke = isThemeBlueprint ? '#38bdf8' : isThemeDark ? '#38bdf8' : '#0f172a';
  const secondaryStroke = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#1e293b' : '#cbd5e1';
  const textPrimary = isThemeBlueprint ? '#f0f9ff' : isThemeDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isThemeBlueprint ? '#7dd3fc' : isThemeDark ? '#94a3b8' : '#64748b';
  const antetBg = isThemeBlueprint ? '#040d1a' : isThemeDark ? '#020617' : '#ffffff';
  const centerlineColor = isThemeBlueprint ? '#f43f5e' : isThemeDark ? '#f43f5e' : '#e11d48';

  const maxDim = Math.max(dimW, dimH, dimD);
  const userScale = config.scale && config.scale > 0 ? config.scale : 1.0;
  const baseScaleFactor = isA2 ? 0.16 : 0.22;
  const viewScale = ((sheetW * baseScaleFactor) / (maxDim || 50)) * userScale;

  const showSectionView = cfg.showSectionView ?? (isAssembly || isA2);
  const showExplodedView = cfg.showExplodedView ?? (isAssembly && (isA2 || (config.explodeFactor && config.explodeFactor > 0)));
  const showBomTable = cfg.showBomTable ?? (isAssembly || isA2);
  const showBalloons = cfg.showBalloons ?? isAssembly;
  const explodeFactor = config.explodeFactor ?? 45;

  const frontX = isA2 ? sheetW * 0.20 : sheetW * 0.22;
  const frontY = isA2 ? sheetH * 0.65 : sheetH * 0.58;
  const topX = frontX;
  const topY = isA2 ? sheetH * 0.24 : sheetH * 0.24;
  const rightX = isA2 ? sheetW * 0.44 : sheetW * 0.44;
  const rightY = frontY;
  const secX = rightX;
  const secY = topY;
  const isoX = isA2
    ? sheetW * 0.72
    : (showBomTable ? sheetW * 0.73 : sheetW * 0.76);
  const isoY = isA2
    ? (showBomTable ? sheetH * 0.62 : sheetH * 0.60)
    : (showBomTable ? sheetH * 0.58 : sheetH * 0.26);

  // Build Exploded Triangles for Exploded Assembly View (only when exploded view is active)
  const explodedTriangles: Triangle3D[] = [];
  const partExplodedOffsets = new Map<string, THREE.Vector3>();

  if (isAssembly && showExplodedView) {
    const f = explodeFactor / 100;
    partsToDraw.forEach((part, idx) => {
      if (!part.visible) return;
      const basePos = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
      const dir = new THREE.Vector3(basePos.x - centerX, basePos.y - centerY, basePos.z - centerZ);
      let offset = new THREE.Vector3();
      if (dir.length() > 0.5) {
        offset = dir.normalize().multiplyScalar(Math.max(25, dir.length() * 1.8) * f);
      } else {
        offset = new THREE.Vector3(0, ((idx / Math.max(1, partsToDraw.length)) - 0.5) * 80 * f, 0);
      }
      partExplodedOffsets.set(part.id, offset);
    });

    for (const t of triangles) {
      const off = partExplodedOffsets.get(t.partId) || new THREE.Vector3(0, 0, 0);
      explodedTriangles.push({
        p0: [t.p0[0] + off.x, t.p0[1] + off.y, t.p0[2] + off.z],
        p1: [t.p1[0] + off.x, t.p1[1] + off.y, t.p1[2] + off.z],
        p2: [t.p2[0] + off.x, t.p2[1] + off.y, t.p2[2] + off.z],
        normal: t.normal,
        color: t.color,
        partId: t.partId,
      });
    }
  }

  const bomRows = extractAssemblyBom(partsToDraw, cfg.materialName);

  const isoRotX = 35.264 * (Math.PI / 180);
  const isoRotY = 45 * (Math.PI / 180);
  const cosX = Math.cos(isoRotX), sinX = Math.sin(isoRotX);
  const cosY = Math.cos(isoRotY), sinY = Math.sin(isoRotY);

  function projectView(
    viewType: 'front' | 'top' | 'right' | 'iso' | 'exploded' | 'section-a',
    sunLightDir: THREE.Vector3,
    trisSource: Triangle3D[] = (viewType === 'exploded' ? explodedTriangles : triangles)
  ): string {
    const polys: Array<{ pts: string; fill: string; depth: number }> = [];
    const edgeMap = new Map<string, {
      x0: number; y0: number;
      x1: number; y1: number;
      norm1: THREE.Vector3;
      norm2?: THREE.Vector3;
      count: number;
      isCutEdge?: boolean;
    }>();

    const scaleFactor = (viewType === 'iso' || viewType === 'exploded') ? (isA2 ? 0.72 : 0.85) : 1.0;

    const projectVertex = (p: [number, number, number]): [number, number, number] => {
      if (viewType === 'front') {
        return [(p[0] - centerX) * viewScale, -(p[1] - centerY) * viewScale, p[2]];
      } else if (viewType === 'top') {
        return [(p[0] - centerX) * viewScale, (p[2] - centerZ) * viewScale, p[1]];
      } else if (viewType === 'right') {
        return [(p[2] - centerZ) * viewScale, -(p[1] - centerY) * viewScale, p[0]];
      } else if (viewType === 'section-a') {
        return [(p[2] - centerZ) * viewScale, -(p[1] - centerY) * viewScale, p[0]];
      } else {
        // iso or exploded
        const rx = p[0] - centerX;
        const ry = p[1] - centerY;
        const rz = p[2] - centerZ;
        const x_y = rx * cosY + rz * sinY;
        const z_y = -rx * sinY + rz * cosY;
        const y_x = ry * cosX - z_y * sinX;
        const z_x = ry * sinX + z_y * cosX;
        return [x_y * viewScale * scaleFactor, -y_x * viewScale * scaleFactor, z_x];
      }
    };

    const cutSegments: Array<[number, number, number, number]> = [];
    const polyBudget = 3200;
    const polyStride = trisSource.length > polyBudget ? Math.ceil(trisSource.length / polyBudget) : 1;
    let triIndex = 0;

    for (const tri of trisSource) {
      triIndex++;
      const norm = new THREE.Vector3(tri.normal[0], tri.normal[1], tri.normal[2]);

      if (viewType === 'front' && norm.z < -0.05) continue;
      if (viewType === 'top' && norm.y < -0.05) continue;
      if (viewType === 'right' && norm.x < -0.05) continue;
      if (viewType === 'section-a') {
        const d0 = tri.p0[0] - centerX;
        const d1 = tri.p1[0] - centerX;
        const d2 = tri.p2[0] - centerX;
        if (d0 < 0 && d1 < 0 && d2 < 0) continue;

        // Collect planar intersection segments on cutting plane X = centerX (capped at 1200)
        if (cutSegments.length < 1200 && (d0 > 0.001 || d1 > 0.001 || d2 > 0.001) && (d0 < -0.001 || d1 < -0.001 || d2 < -0.001)) {
          const cutPts: [number, number, number][] = [];
          const triEdges: [[number, number, number], [number, number, number]][] = [
            [tri.p0, tri.p1],
            [tri.p1, tri.p2],
            [tri.p2, tri.p0],
          ];
          for (const [pa, pb] of triEdges) {
            const da = pa[0] - centerX;
            const db = pb[0] - centerX;
            if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
              const t = (centerX - pa[0]) / (pb[0] - pa[0]);
              cutPts.push([
                centerX,
                pa[1] + t * (pb[1] - pa[1]),
                pa[2] + t * (pb[2] - pa[2]),
              ]);
            }
          }
          if (cutPts.length >= 2) {
            const vA = projectVertex(cutPts[0]);
            const vB = projectVertex(cutPts[1]);
            cutSegments.push([vA[0], vA[1], vB[0], vB[1]]);
          }
        }
      }

      const v0 = projectVertex(tri.p0);
      const v1 = projectVertex(tri.p1);
      const v2 = projectVertex(tri.p2);

      const isCutFace = viewType === 'section-a' && Math.abs(tri.p0[0] - centerX) < 2.5 && Math.abs(tri.p1[0] - centerX) < 2.5 && Math.abs(tri.p2[0] - centerX) < 2.5;

      // 2D screen-space triangle area
      const area2D = 0.5 * Math.abs((v1[0] - v0[0]) * (v2[1] - v0[1]) - (v2[0] - v0[0]) * (v1[1] - v0[1]));
      const isSubpixel = area2D < 0.4 && !isCutFace;

      if (!isSubpixel && polys.length < polyBudget) {
        if (isCutFace || (triIndex % polyStride === 0) || area2D > 20) {
          const lightDot = Math.max(0.15, norm.dot(sunLightDir));
          let fillColor = '#f1f5f9';

          if (isCutFace) {
            fillColor = 'url(#isoHatch45)';
          } else if (isThemeBlueprint) {
            fillColor = `rgba(56, 189, 248, ${0.15 + lightDot * 0.45})`;
          } else if (isThemeDark) {
            fillColor = `rgba(56, 189, 248, ${0.1 + lightDot * 0.4})`;
          } else {
            const shade = Math.round(245 - (1 - lightDot) * 45);
            fillColor = `rgb(${shade}, ${shade}, ${shade + 4})`;
          }

          polys.push({
            pts: `${v0[0].toFixed(1)},${v0[1].toFixed(1)} ${v1[0].toFixed(1)},${v1[1].toFixed(1)} ${v2[0].toFixed(1)},${v2[1].toFixed(1)}`,
            fill: fillColor,
            depth: (v0[2] + v1[2] + v2[2]) / 3,
          });
        }
      }

      // Edge collector
      const addEdge = (pA: [number, number, number], pB: [number, number, number], va: [number, number, number], vb: [number, number, number]) => {
        const prec = 5;
        const x0 = Math.round(pA[0] * prec), y0 = Math.round(pA[1] * prec), z0 = Math.round(pA[2] * prec);
        const x1 = Math.round(pB[0] * prec), y1 = Math.round(pB[1] * prec), z1 = Math.round(pB[2] * prec);
        const isSmaller = x0 < x1 || (x0 === x1 && (y0 < y1 || (y0 === y1 && z0 < z1)));
        const edgeKey = isSmaller
          ? `${x0},${y0},${z0}_${x1},${y1},${z1}`
          : `${x1},${y1},${z1}_${x0},${y0},${z0}`;

        const existing = edgeMap.get(edgeKey);
        if (existing) {
          existing.count += 1;
          existing.norm2 = norm;
        } else {
          edgeMap.set(edgeKey, {
            x0: va[0], y0: va[1],
            x1: vb[0], y1: vb[1],
            norm1: norm,
            count: 1,
            isCutEdge: viewType === 'section-a' && Math.abs(pA[0] - centerX) < 2.5 && Math.abs(pB[0] - centerX) < 2.5
          });
        }
      };

      if (!isSubpixel) {
        addEdge(tri.p0, tri.p1, v0, v1);
        addEdge(tri.p1, tri.p2, v1, v2);
        addEdge(tri.p2, tri.p0, v2, v0);
      }
    }

    polys.sort((a, b) => a.depth - b.depth);

    // Clean shaded polygons (stroke matches fill to eliminate internal triangle seams)
    const polysSvg = polys.map(p => `
      <polygon points="${p.pts}" fill="${p.fill}" stroke="${p.fill}" stroke-width="0.3" stroke-linejoin="round" />
    `).join('\n');

    // Section A-A Hatching & Cut Contours (O(N) Spatial Hash Grid)
    let cutHatchSvg = '';
    if (viewType === 'section-a' && cutSegments.length > 0) {
      const remaining = cutSegments.map(s => ({
        p0: [s[0], s[1]] as [number, number],
        p1: [s[2], s[3]] as [number, number],
        used: false,
      }));

      const cellSize = 5.0;
      const getCellKey = (x: number, y: number) => `${Math.floor(x / cellSize)}_${Math.floor(y / cellSize)}`;
      const grid = new Map<string, number[]>();

      remaining.forEach((seg, idx) => {
        const k0 = getCellKey(seg.p0[0], seg.p0[1]);
        const k1 = getCellKey(seg.p1[0], seg.p1[1]);
        if (!grid.has(k0)) grid.set(k0, []);
        grid.get(k0)!.push(idx);
        if (k0 !== k1) {
          if (!grid.has(k1)) grid.set(k1, []);
          grid.get(k1)!.push(idx);
        }
      });

      const findNearestSegment = (currPt: [number, number]): { index: number; endpoint: 'p0' | 'p1' } | null => {
        const cx = Math.floor(currPt[0] / cellSize);
        const cy = Math.floor(currPt[1] / cellSize);
        let bestDist = 5.0;
        let bestCandidate: { index: number; endpoint: 'p0' | 'p1' } | null = null;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const bucketKey = `${cx + dx}_${cy + dy}`;
            const candidates = grid.get(bucketKey);
            if (!candidates) continue;

            for (const candIdx of candidates) {
              const cand = remaining[candIdx];
              if (cand.used) continue;

              const d0 = Math.hypot(cand.p0[0] - currPt[0], cand.p0[1] - currPt[1]);
              if (d0 < bestDist) {
                bestDist = d0;
                bestCandidate = { index: candIdx, endpoint: 'p0' };
              }
              const d1 = Math.hypot(cand.p1[0] - currPt[0], cand.p1[1] - currPt[1]);
              if (d1 < bestDist) {
                bestDist = d1;
                bestCandidate = { index: candIdx, endpoint: 'p1' };
              }
            }
          }
        }
        return bestCandidate;
      };

      const loops: Array<Array<[number, number]>> = [];
      const MAX_LOOPS = 50;

      for (let i = 0; i < remaining.length && loops.length < MAX_LOOPS; i++) {
        if (remaining[i].used) continue;
        remaining[i].used = true;
        const loop: Array<[number, number]> = [remaining[i].p0, remaining[i].p1];
        let curr = remaining[i].p1;
        let steps = 0;
        const MAX_STEPS = 250;

        while (steps < MAX_STEPS) {
          steps++;
          const match = findNearestSegment(curr);
          if (!match) break;

          const s = remaining[match.index];
          s.used = true;
          if (match.endpoint === 'p0') {
            loop.push(s.p1);
            curr = s.p1;
          } else {
            loop.push(s.p0);
            curr = s.p0;
          }

          if (loop.length >= 3 && Math.hypot(curr[0] - loop[0][0], curr[1] - loop[0][1]) < 5.0) {
            break;
          }
        }

        if (loop.length >= 3) {
          loops.push(loop);
        }
      }

      for (const loop of loops) {
        const pts = loop.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
        cutHatchSvg += `<polygon points="${pts}" fill="url(#isoHatch45)" stroke="${primaryStroke}" stroke-width="1.8" stroke-linejoin="round" />\n`;
      }

      const renderSegs = cutSegments.slice(0, 300);
      for (const seg of renderSegs) {
        cutHatchSvg += `<line x1="${seg[0].toFixed(1)}" y1="${seg[1].toFixed(1)}" x2="${seg[2].toFixed(1)}" y2="${seg[3].toFixed(1)}" stroke="${primaryStroke}" stroke-width="1.8" stroke-linecap="round" />\n`;
      }
    }

    // Silhouette & Sharp Mechanical Feature Edge Linework with adaptive budget
    const cutEdgeLines: string[] = [];
    const silhouetteLines: string[] = [];
    const featureLines: string[] = [];
    const wireLines: string[] = [];
    const showWire = cfg.showMeshWireframe === true;

    const viewDir = viewType === 'front'
      ? new THREE.Vector3(0, 0, 1)
      : viewType === 'top'
        ? new THREE.Vector3(0, 1, 0)
        : viewType === 'right' || viewType === 'section-a'
          ? new THREE.Vector3(1, 0, 0)
          : new THREE.Vector3(sinY * cosX, sinX, cosY * cosX).normalize();

    for (const [, edge] of edgeMap) {
      if (edge.isCutEdge) {
        cutEdgeLines.push(`<line x1="${edge.x0.toFixed(1)}" y1="${edge.y0.toFixed(1)}" x2="${edge.x1.toFixed(1)}" y2="${edge.y1.toFixed(1)}" stroke="${primaryStroke}" stroke-width="1.6" stroke-linecap="round" />`);
        continue;
      }

      if (edge.count === 1) {
        // Silhouette contour:
        // Filter out coplanar interior tessellation chords on planar faces looking directly at the camera
        const isPlanarFacing = Math.abs(edge.norm1.dot(viewDir)) > 0.82;
        if (!isPlanarFacing || showWire) {
          silhouetteLines.push(`<line x1="${edge.x0.toFixed(1)}" y1="${edge.y0.toFixed(1)}" x2="${edge.x1.toFixed(1)}" y2="${edge.y1.toFixed(1)}" stroke="${primaryStroke}" stroke-width="${(viewType === 'iso' || viewType === 'exploded') ? 0.9 : 1.1}" stroke-linecap="round" />`);
        }
      } else if (edge.norm2) {
        const dot = edge.norm1.dot(edge.norm2);
        if (dot < 0.85) {
          // Sharp dihedral feature edge (dihedral angle >= 32 deg)
          featureLines.push(`<line x1="${edge.x0.toFixed(1)}" y1="${edge.y0.toFixed(1)}" x2="${edge.x1.toFixed(1)}" y2="${edge.y1.toFixed(1)}" stroke="${primaryStroke}" stroke-width="${(viewType === 'iso' || viewType === 'exploded') ? 0.6 : 0.75}" stroke-linecap="round" />`);
        } else if (showWire) {
          // Optional wireframe mesh lines
          wireLines.push(`<line x1="${edge.x0.toFixed(1)}" y1="${edge.y0.toFixed(1)}" x2="${edge.x1.toFixed(1)}" y2="${edge.y1.toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.35" stroke-opacity="0.35" />`);
        }
      }
    }

    const MAX_EDGE_LINES = 4000;
    const finalEdgeLines: string[] = [
      ...cutEdgeLines,
      ...silhouetteLines.slice(0, 2500),
      ...featureLines.slice(0, Math.max(0, MAX_EDGE_LINES - cutEdgeLines.length - Math.min(2500, silhouetteLines.length))),
    ];
    if (showWire) {
      const remainingWireBudget = Math.max(0, MAX_EDGE_LINES - finalEdgeLines.length);
      finalEdgeLines.push(...wireLines.slice(0, remainingWireBudget));
    }

    // Exploded View Assembly Trail Lines
    let trailsSvg = '';
    if (viewType === 'exploded' && isAssembly) {
      const trailLines: string[] = [];
      partsToDraw.forEach(part => {
        const off = partExplodedOffsets.get(part.id);
        if (off && off.length() > 5) {
          const vAssembled = projectVertex([part.position.x, part.position.y, part.position.z]);
          const vExploded = projectVertex([part.position.x + off.x, part.position.y + off.y, part.position.z + off.z]);
          trailLines.push(`<line x1="${vAssembled[0].toFixed(1)}" y1="${vAssembled[1].toFixed(1)}" x2="${vExploded[0].toFixed(1)}" y2="${vExploded[1].toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.8" stroke-dasharray="4,4" />`);
        }
      });
      trailsSvg = trailLines.join('\n');
    }

    return polysSvg + '\n' + cutHatchSvg + '\n' + trailsSvg + '\n' + finalEdgeLines.join('\n');
  }

  const sunDirFront = new THREE.Vector3(0.3, 0.5, 0.8).normalize();
  const sunDirTop = new THREE.Vector3(0.4, 0.8, 0.3).normalize();
  const sunDirRight = new THREE.Vector3(0.8, 0.4, 0.3).normalize();
  const sunDirIso = new THREE.Vector3(0.6, 0.7, 0.5).normalize();

  const frontSvg = projectView('front', sunDirFront);
  const topSvg = projectView('top', sunDirTop);
  const rightSvg = projectView('right', sunDirRight);
  const isoSvg = projectView(showExplodedView ? 'exploded' : 'iso', sunDirIso);
  const secSvg = showSectionView ? projectView('section-a', sunDirRight) : '';

  const sw = dimW * viewScale;
  const sh = dimH * viewScale;
  const sd = dimD * viewScale;

  // Title Block (Antet)
  const renderTitleBlock = (): string => {
    const bw = 380;
    const bh = 110;
    const bx = sheetW - margin - bw;
    const by = sheetH - margin - bh;

    return `
    <!-- ISO 7200 TITLE BLOCK -->
    <g transform="translate(${bx}, ${by})">
      <rect x="0" y="0" width="${bw}" height="${bh}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.8" rx="3" />
      <line x1="0" y1="28" x2="${bw}" y2="28" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="0" y1="56" x2="${bw}" y2="56" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="0" y1="84" x2="${bw}" y2="84" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="190" y1="28" x2="190" y2="${bh}" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="285" y1="56" x2="285" y2="${bh}" stroke="${primaryStroke}" stroke-width="1" />

      <!-- Company & Project -->
      <text x="12" y="18" font-size="10.5" font-weight="900" fill="${textPrimary}">${cfg.companyName}</text>
      <text x="${bw - 12}" y="18" text-anchor="end" font-size="8.5" font-weight="700" fill="${textSecondary}">${cfg.drawingNumber}</text>

      <!-- Project & Part Name -->
      <text x="12" y="35" font-size="7.5" font-weight="700" fill="${textSecondary}">PROJ: ${cfg.projectName}</text>
      <text x="12" y="48" font-size="10" font-weight="700" fill="${textPrimary}">${cfg.partName}</text>
      <text x="12" y="72" font-size="8" fill="${textSecondary}">${i18n.titleBlock.material}: <tspan font-weight="700" fill="${textPrimary}">${cfg.materialName}</tspan></text>
      <text x="12" y="98" font-size="8" fill="${textSecondary}">${i18n.titleBlock.weight}: <tspan font-weight="700" fill="${textPrimary}">${cfg.massKg} kg (${massProps.massGrams} g)</tspan></text>

      <!-- Standards & Meta -->
      <text x="198" y="46" font-size="8" fill="${textSecondary}">${i18n.titleBlock.tolerance}: <tspan font-weight="700" fill="${textPrimary}">${cfg.tolerance}</tspan></text>
      <text x="198" y="72" font-size="8" fill="${textSecondary}">${i18n.titleBlock.scale}: <tspan font-weight="700" fill="${textPrimary}">${cfg.scale === 1 ? '1:1' : cfg.scale < 1 ? `1:${Math.round(1 / cfg.scale)}` : `${cfg.scale}:1`}</tspan></text>
      <text x="292" y="72" font-size="8" fill="${textSecondary}">${i18n.titleBlock.size}: ${cfg.sheetSize}</text>
      <text x="198" y="98" font-size="8" fill="${textSecondary}">${i18n.titleBlock.date}: ${cfg.date}</text>
      <text x="292" y="98" font-size="8" fill="${textSecondary}">${i18n.titleBlock.rev}: ${cfg.revision}</text>
    </g>`;
  };

  const featureSchedule = extractFeatureSchedule(partsToDraw, lang);

  function generateViewHoleAnnotations(viewType: 'top' | 'front' | 'right'): string {
    const svgElements: string[] = [];
    const relevantFeatures = featureSchedule.filter((f) => {
      if (viewType === 'top') return f.face === 'top' || f.face === 'bottom';
      if (viewType === 'front') return f.face === 'front' || f.face === 'back';
      if (viewType === 'right') return f.face === 'right' || f.face === 'left';
      return false;
    });

    if (relevantFeatures.length === 0) return '';

    for (const f of relevantFeatures) {
      let px = 0, py = 0;
      if (viewType === 'top') {
        px = f.x * viewScale; py = f.y * viewScale;
      } else if (viewType === 'front') {
        px = f.x * viewScale; py = -f.y * viewScale;
      } else if (viewType === 'right') {
        px = f.x * viewScale; py = -f.y * viewScale;
      }

      const nomDia = f.diameter || 6;
      const rPx = Math.max(2.5, (nomDia / 2) * viewScale);
      const tagColor = f.kind === 'cut' ? '#fb7185' : '#38bdf8';

      svgElements.push(`
        <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)})">
          <line x1="${(-rPx - 3).toFixed(1)}" y1="0" x2="${(rPx + 3).toFixed(1)}" y2="0" stroke="${centerlineColor}" stroke-width="0.7" />
          <line x1="0" y1="${(-rPx - 3).toFixed(1)}" x2="0" y2="${(rPx + 3).toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.7" />
          <circle cx="0" cy="0" r="${rPx.toFixed(1)}" fill="none" stroke="${tagColor}" stroke-width="1.1" />
          <line x1="${(rPx * 0.7).toFixed(1)}" y1="${(-rPx * 0.7).toFixed(1)}" x2="${(rPx + 10).toFixed(1)}" y2="${(-rPx - 10).toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.7" />
          <rect x="${(rPx + 10).toFixed(1)}" y="${(-rPx - 17).toFixed(1)}" width="18" height="12" rx="3" fill="${antetBg}" stroke="${tagColor}" stroke-width="0.9" />
          <text x="${(rPx + 19).toFixed(1)}" y="${(-rPx - 8).toFixed(1)}" text-anchor="middle" font-size="7.5" font-weight="900" fill="${tagColor}">${f.tag}</text>
        </g>
      `);
    }

    return svgElements.join('\n');
  }

  function generateViewGearAnnotations(viewType: 'top' | 'front' | 'right' | 'section-a'): string {
    const gearParts = partsToDraw.filter(p => p.visible && p.kind === 'gear-blank');
    if (gearParts.length === 0) return '';

    const svgElements: string[] = [];

    for (const part of gearParts) {
      const p = part.params || {};
      const m = Number(p.module) || 2;
      const z = Number(p.teeth) || 20;
      const beta = Number(p.helixAngle) || 0;
      const x = Number(p.profileShift) || 0;
      const bore = Number(p.bore || p.boreDiameter || 0);
      const faceW = Number(p.depth) || 40;
      const cosBeta = Math.max(0.01, Math.cos((beta * Math.PI) / 180));
      const mt = m / cosBeta;
      const d = z * mt;
      const da = Number(p.tipDiameter) || (d + 2 * m * (1 + x));
      const df = Number(p.rootDiameter) || (d - 2 * m * (1.25 - x));
      const hasKeyway = p.hasKeyway !== false;
      const conicalLock = p.conicalLock;

      const px = part.position.x;
      const py = part.position.y;
      const pz = part.position.z;
      const rx = part.rotation?.x || 0;

      // When rx === 90, axial normal is Y. Top view is Face View, Front/Right/Section are Elevation Views.
      // When rx === 0, axial normal is Z. Front view is Face View, Top/Right/Section are Elevation Views.
      const isAxialFaceView = (rx === 90 && viewType === 'top') || (rx === 0 && viewType === 'front');
      const isSideElevationView = (rx === 90 && (viewType === 'front' || viewType === 'right' || viewType === 'section-a')) ||
                                  (rx === 0 && (viewType === 'top' || viewType === 'right' || viewType === 'section-a'));

      if (isAxialFaceView) {
        let cx = 0, cy = 0;
        if (rx === 90 && viewType === 'top') {
          cx = (px - centerX) * viewScale;
          cy = (pz - centerZ) * viewScale;
        } else if (rx === 0 && viewType === 'front') {
          cx = (px - centerX) * viewScale;
          cy = -(py - centerY) * viewScale;
        }

        const rp = (d / 2) * viewScale;
        const rf = (df / 2) * viewScale;
        const ra = (da / 2) * viewScale;

        // 1. ISO 2203 Pitch Circle (Dash-dot centerline style)
        svgElements.push(`
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rp.toFixed(1)}" fill="none" stroke="${centerlineColor}" stroke-width="0.95" stroke-dasharray="10,3,2,3" />
        `);

        // 2. ISO 2203 Root Circle (Thin reference circle)
        svgElements.push(`
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rf.toFixed(1)}" fill="none" stroke="${secondaryStroke}" stroke-width="0.6" stroke-dasharray="4,4" />
        `);

        // 3. Center Cross-hairs extending beyond tip circle
        const cExt = ra + 14;
        svgElements.push(`
          <line x1="${(cx - cExt).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + cExt).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="12,3,2,3" />
          <line x1="${cx.toFixed(1)}" y1="${(cy - cExt).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + cExt).toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="12,3,2,3" />
        `);

        // 4. Conical Lock detail if present
        if (conicalLock) {
          const rShaft = (conicalLock.d / 2) * viewScale;
          const rBore = (conicalLock.D / 2) * viewScale;
          const rScrewCircle = ((conicalLock.d + conicalLock.D) / 4) * viewScale;
          svgElements.push(`
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rShaft.toFixed(1)}" fill="none" stroke="${secondaryStroke}" stroke-width="1.0" />
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rBore.toFixed(1)}" fill="none" stroke="${primaryStroke}" stroke-width="1.2" />
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rScrewCircle.toFixed(1)}" fill="none" stroke="${centerlineColor}" stroke-width="0.65" stroke-dasharray="6,2,1,2" />
          `);
        }

        // 5. ISO 2203 Gear Callout
        svgElements.push(`
          <text x="${cx.toFixed(1)}" y="${(cy - ra - 7).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="900" fill="${primaryStroke}">
            mn=${m} z=${z} d=Ø${d.toFixed(1)} da=Ø${da.toFixed(1)}${conicalLock ? ` [KTR CLAMPEX® ${conicalLock.model}]` : (hasKeyway ? ' [DIN 6885-1]' : '')}
          </text>
        `);
      } else if (isSideElevationView) {
        // Elevation view: draw ISO 2203 pitch cylinder lines (two dash-dot lines)
        let cx = 0, cy = 0;
        let axisIsHorizontal = true;

        if (rx === 90 && (viewType === 'front' || viewType === 'right' || viewType === 'section-a')) {
          cx = (px - centerX) * viewScale;
          cy = -(py - centerY) * viewScale;
          axisIsHorizontal = false;
        } else {
          cx = (px - centerX) * viewScale;
          cy = (pz - centerZ) * viewScale;
          axisIsHorizontal = true;
        }

        const rp = (d / 2) * viewScale;
        const rf = (df / 2) * viewScale;
        const halfW = (faceW / 2) * viewScale;

        if (axisIsHorizontal) {
          svgElements.push(`
            <line x1="${(cx - halfW - 4).toFixed(1)}" y1="${(cy - rp).toFixed(1)}" x2="${(cx + halfW + 4).toFixed(1)}" y2="${(cy - rp).toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
            <line x1="${(cx - halfW - 4).toFixed(1)}" y1="${(cy + rp).toFixed(1)}" x2="${(cx + halfW + 4).toFixed(1)}" y2="${(cy + rp).toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
            <line x1="${(cx - halfW - 4).toFixed(1)}" y1="${(cy - rf).toFixed(1)}" x2="${(cx + halfW + 4).toFixed(1)}" y2="${(cy - rf).toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.6" stroke-dasharray="4,4" />
            <line x1="${(cx - halfW - 4).toFixed(1)}" y1="${(cy + rf).toFixed(1)}" x2="${(cx + halfW + 4).toFixed(1)}" y2="${(cy + rf).toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.6" stroke-dasharray="4,4" />
          `);
        } else {
          svgElements.push(`
            <line x1="${(cx - rp).toFixed(1)}" y1="${(cy - halfW - 4).toFixed(1)}" x2="${(cx - rp).toFixed(1)}" y2="${(cy - halfW - 4).toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
            <line x1="${(cx + rp).toFixed(1)}" y1="${(cy - halfW - 4).toFixed(1)}" x2="${(cx + rp).toFixed(1)}" y2="${(cy - halfW - 4).toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
            <line x1="${(cx - rf).toFixed(1)}" y1="${(cy - halfW - 4).toFixed(1)}" x2="${(cx - rf).toFixed(1)}" y2="${(cy - halfW - 4).toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.6" stroke-dasharray="4,4" />
            <line x1="${(cx + rf).toFixed(1)}" y1="${(cy - halfW - 4).toFixed(1)}" x2="${(cx + rf).toFixed(1)}" y2="${(cy - halfW - 4).toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.6" stroke-dasharray="4,4" />
          `);
        }
      }
    }

    return svgElements.join('\n');
  }

  const topViewHolesSvg = generateViewHoleAnnotations('top');
  const frontViewHolesSvg = generateViewHoleAnnotations('front');
  const rightViewHolesSvg = generateViewHoleAnnotations('right');

  const topViewGearsSvg = generateViewGearAnnotations('top');
  const frontViewGearsSvg = generateViewGearAnnotations('front');
  const rightViewGearsSvg = generateViewGearAnnotations('right');
  const secViewGearsSvg = generateViewGearAnnotations('section-a');

  function renderHoleScheduleTableSvg(): string {
    if (featureSchedule.length === 0) return '';

    const tblW = 460;
    const rowH = 15;
    const headerH = 20;
    const totalRows = Math.min(featureSchedule.length, 5);
    const tblH = headerH + totalRows * rowH;
    const tblX = sheetW - margin - tblW;
    const tblY = sheetH - margin - 110 - tblH - 12;

    const colX = [0, 32, 86, 136, 186, 350, tblW];
    const headerBg = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#1e293b' : '#0f172a';
    const rowBgEven = isThemeBlueprint ? 'rgba(11, 33, 68, 0.95)' : isThemeDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
    const rowBgOdd = isThemeBlueprint ? 'rgba(14, 43, 85, 0.85)' : isThemeDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc';

    let rowsSvg = '';
    for (let i = 0; i < totalRows; i++) {
      const f = featureSchedule[i];
      const ry = headerH + i * rowH;
      const bg = i % 2 === 0 ? rowBgEven : rowBgOdd;
      const tagColor = f.kind === 'cut' ? '#fb7185' : '#38bdf8';
      const faceLabel = i18n.holeSchedule.faces[f.face] || f.face;

      rowsSvg += `
        <rect x="0" y="${ry}" width="${tblW}" height="${rowH}" fill="${bg}" />
        <line x1="0" y1="${ry + rowH}" x2="${tblW}" y2="${ry + rowH}" stroke="${secondaryStroke}" stroke-width="0.5" />
        
        <rect x="3" y="${ry + 2}" width="25" height="${rowH - 4}" rx="3" fill="${tagColor}" fill-opacity="0.18" stroke="${tagColor}" stroke-width="0.7" />
        <text x="15.5" y="${ry + 10.5}" text-anchor="middle" font-size="7.5" font-weight="900" fill="${tagColor}">${f.tag}</text>

        <text x="${colX[1] + 4}" y="${ry + 10.5}" font-size="7.5" font-weight="700" fill="${textSecondary}">${faceLabel}</text>
        <text x="${colX[2] + 24}" y="${ry + 10.5}" text-anchor="middle" font-size="8" font-family="monospace" font-weight="700" fill="${textPrimary}">${f.x > 0 ? '+' + f.x : f.x}</text>
        <text x="${colX[3] + 24}" y="${ry + 10.5}" text-anchor="middle" font-size="8" font-family="monospace" font-weight="700" fill="${textPrimary}">${f.y > 0 ? '+' + f.y : f.y}</text>
        <text x="${colX[4] + 4}" y="${ry + 10.5}" font-size="7.5" font-weight="600" fill="${textPrimary}">${f.spec}</text>
        <text x="${colX[5] + 4}" y="${ry + 10.5}" font-size="7.5" font-weight="700" fill="${textSecondary}">${f.depth}</text>
      `;
    }

    let colLines = '';
    for (let c = 1; c < colX.length - 1; c++) {
      colLines += `<line x1="${colX[c]}" y1="0" x2="${colX[c]}" y2="${tblH}" stroke="${secondaryStroke}" stroke-width="0.6" />`;
    }

    return `
      <g transform="translate(${tblX}, ${tblY})">
        <rect x="0" y="0" width="${tblW}" height="${tblH}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.2" rx="3" />
        <rect x="0" y="0" width="${tblW}" height="${headerH}" fill="${headerBg}" />
        <text x="15.5" y="13" text-anchor="middle" font-size="7.5" font-weight="900" fill="#ffffff">${i18n.holeSchedule.no}</text>
        <text x="${colX[1] + 4}" y="13" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.holeSchedule.face}</text>
        <text x="${colX[2] + 24}" y="13" text-anchor="middle" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.holeSchedule.x}</text>
        <text x="${colX[3] + 24}" y="13" text-anchor="middle" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.holeSchedule.y}</text>
        <text x="${colX[4] + 4}" y="13" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.holeSchedule.spec}</text>
        <text x="${colX[5] + 4}" y="13" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.holeSchedule.depth}</text>

        ${rowsSvg}
        ${colLines}

        <text x="0" y="-5" font-size="8.5" font-weight="900" fill="${primaryStroke}" letter-spacing="0.5">
          ${i18n.holeSchedule.title(featureSchedule.length)}
        </text>
      </g>
    `;
  }

  function renderManufacturingFormulasTableSvg(): string {
    const rawFormulas = extractManufacturingFormulas(partsToDraw, lang);
    if (rawFormulas.length === 0) return '';

    const uniqueFormulas: ExtractedFormulaItem[] = [];
    const seen = new Set<string>();
    for (const f of rawFormulas) {
      const key = `${f.partName}-${f.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFormulas.push(f);
      }
      if (uniqueFormulas.length >= 6) break;
    }

    const tblW = 460;
    const rowH = 15;
    const headerH = 20;
    const tblH = headerH + uniqueFormulas.length * rowH;

    const hasHoles = featureSchedule.length > 0;
    const holeTblHeight = hasHoles ? (20 + Math.min(featureSchedule.length, 5) * 15 + 16) : 0;
    const tblX = sheetW - margin - tblW;
    const tblY = sheetH - margin - 110 - holeTblHeight - tblH - 12;

    const colX = [0, 140, 270, 375, tblW];
    const headerBg = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#1e293b' : '#0f172a';
    const rowBgEven = isThemeBlueprint ? 'rgba(11, 33, 68, 0.95)' : isThemeDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
    const rowBgOdd = isThemeBlueprint ? 'rgba(14, 43, 85, 0.85)' : isThemeDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc';

    let rowsSvg = '';
    for (let i = 0; i < uniqueFormulas.length; i++) {
      const item = uniqueFormulas[i];
      const ry = headerH + i * rowH;
      const bg = i % 2 === 0 ? rowBgEven : rowBgOdd;
      const cleanFormula = item.formula.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const cleanLabel = item.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const cleanResult = item.result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      rowsSvg += `
        <rect x="0" y="${ry}" width="${tblW}" height="${rowH}" fill="${bg}" />
        <line x1="0" y1="${ry + rowH}" x2="${tblW}" y2="${ry + rowH}" stroke="${secondaryStroke}" stroke-width="0.5" />
        
        <text x="6" y="${ry + 10.5}" font-size="7.5" font-weight="700" fill="${textPrimary}">${cleanLabel}</text>
        <text x="${colX[1] + 6}" y="${ry + 10.5}" font-size="7.5" font-family="monospace" font-weight="600" fill="${textSecondary}">${cleanFormula}</text>
        <text x="${colX[2] + 6}" y="${ry + 10.5}" font-size="7.5" font-family="monospace" font-weight="800" fill="${isThemeBlueprint ? '#38bdf8' : '#0284c7'}">${cleanResult}</text>
        <text x="${colX[3] + 6}" y="${ry + 10.5}" font-size="7" font-weight="700" fill="${textSecondary}">${item.standard || 'ISO'}</text>
      `;
    }

    let colLines = '';
    for (let c = 1; c < colX.length - 1; c++) {
      colLines += `<line x1="${colX[c]}" y1="0" x2="${colX[c]}" y2="${tblH}" stroke="${secondaryStroke}" stroke-width="0.6" />`;
    }

    return `
      <g transform="translate(${tblX}, ${tblY})">
        <rect x="0" y="0" width="${tblW}" height="${tblH}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.2" rx="3" />
        <rect x="0" y="0" width="${tblW}" height="${headerH}" fill="${headerBg}" />
        <text x="6" y="13" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.mfgTable.param}</text>
        <text x="${colX[1] + 6}" y="13" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.mfgTable.formula}</text>
        <text x="${colX[2] + 6}" y="13" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.mfgTable.value}</text>
        <text x="${colX[3] + 6}" y="13" font-size="7.5" font-weight="800" fill="#ffffff">${i18n.mfgTable.standard}</text>

        ${rowsSvg}
        ${colLines}

        <text x="0" y="-5" font-size="8.5" font-weight="900" fill="${primaryStroke}" letter-spacing="0.5">
          ${i18n.mfgTable.title(uniqueFormulas.length)}
        </text>
      </g>
    `;
  }

  function renderBomTableSvg(): string {
    if (!showBomTable || bomRows.length === 0) return '';

    const tblW = isA2 ? 580 : 490;
    const rowH = 17;
    const headerH = 22;
    const maxDisplayRows = isA2 ? 24 : isA3 ? 16 : 10;
    const hasMore = bomRows.length > maxDisplayRows;
    const totalRows = hasMore ? maxDisplayRows - 1 : Math.min(bomRows.length, maxDisplayRows);
    const tblH = headerH + (hasMore ? totalRows + 1 : totalRows) * rowH;

    // Top right position on sheet
    const tblX = sheetW - margin - tblW;
    const tblY = margin + 14;

    const colX = isA2
      ? [0, 42, 200, 246, 376, 496, tblW]
      : [0, 36, 160, 200, 310, 418, tblW];

    const headerBg = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#1e293b' : '#0f172a';
    const rowBgEven = isThemeBlueprint ? 'rgba(11, 33, 68, 0.95)' : isThemeDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
    const rowBgOdd = isThemeBlueprint ? 'rgba(14, 43, 85, 0.85)' : isThemeDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc';

    let rowsSvg = '';
    for (let idx = 0; idx < totalRows; idx++) {
      const row = bomRows[idx];
      const ry = headerH + idx * rowH;
      const bg = idx % 2 === 0 ? rowBgEven : rowBgOdd;
      const cleanName = (row.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const cleanMat = (row.material || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const cleanDim = (row.dimensions || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      rowsSvg += `
        <rect x="0" y="${ry}" width="${tblW}" height="${rowH}" fill="${bg}" />
        <line x1="0" y1="${ry + rowH}" x2="${tblW}" y2="${ry + rowH}" stroke="${secondaryStroke}" stroke-width="0.5" />
        
        <!-- Poz badge -->
        <circle cx="${colX[0] + (colX[1] - colX[0]) / 2}" cy="${ry + rowH / 2}" r="7" fill="${isThemeBlueprint ? '#38bdf8' : '#0284c7'}" fill-opacity="0.2" stroke="${isThemeBlueprint ? '#38bdf8' : '#0284c7'}" stroke-width="0.8" />
        <text x="${colX[0] + (colX[1] - colX[0]) / 2}" y="${ry + rowH / 2 + 3}" text-anchor="middle" font-size="8" font-weight="900" fill="${isThemeBlueprint ? '#38bdf8' : '#0284c7'}">${row.poz}</text>

        <!-- Description / Name -->
        <text x="${colX[1] + 6}" y="${ry + rowH / 2 + 3}" font-size="8" font-weight="700" fill="${textPrimary}">${cleanName}</text>

        <!-- Qty -->
        <text x="${colX[2] + (colX[3] - colX[2]) / 2}" y="${ry + rowH / 2 + 3}" text-anchor="middle" font-size="8" font-weight="800" fill="${textPrimary}">${row.qty}</text>

        <!-- Material -->
        <text x="${colX[3] + 6}" y="${ry + rowH / 2 + 3}" font-size="7.5" font-weight="600" fill="${textSecondary}">${cleanMat}</text>

        <!-- Dimensions -->
        <text x="${colX[4] + 6}" y="${ry + rowH / 2 + 3}" font-size="7.5" font-family="monospace" font-weight="600" fill="${textSecondary}">${cleanDim}</text>

        <!-- Mass -->
        <text x="${colX[5] + 6}" y="${ry + rowH / 2 + 3}" font-size="7.5" font-family="monospace" font-weight="700" fill="${textPrimary}">${row.totalMassKg} kg</text>
      `;
    }

    if (hasMore) {
      const ry = headerH + totalRows * rowH;
      const bg = totalRows % 2 === 0 ? rowBgEven : rowBgOdd;
      const remainingCount = bomRows.length - totalRows;
      const moreMsg = t12(
        i18n.lang,
        `+ ${remainingCount} more items (see Engineering Passport)`,
        `+ ${remainingCount} diğer parça (Mühendislik Pasaportuna bakınız)`
      );
      rowsSvg += `
        <rect x="0" y="${ry}" width="${tblW}" height="${rowH}" fill="${bg}" />
        <line x1="0" y1="${ry + rowH}" x2="${tblW}" y2="${ry + rowH}" stroke="${secondaryStroke}" stroke-width="0.5" />
        <text x="${colX[1] + 6}" y="${ry + rowH / 2 + 3}" font-size="7.5" font-style="italic" font-weight="600" fill="${textSecondary}">${moreMsg}</text>
      `;
    }

    let colLines = '';
    for (let c = 1; c < colX.length - 1; c++) {
      colLines += `<line x1="${colX[c]}" y1="0" x2="${colX[c]}" y2="${tblH}" stroke="${secondaryStroke}" stroke-width="0.6" />`;
    }

    const titleStr = t12(
      i18n.lang,
      '📋 BILL OF MATERIALS (BOM / ISO 7573)',
      '📋 MALZEME LİSTESİ / PARÇA ÇİZELGESİ (BOM - ISO 7573)'
    );

    return `
      <!-- BOM TABLE -->
      <g transform="translate(${tblX}, ${tblY})">
        <rect x="0" y="0" width="${tblW}" height="${tblH}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.3" rx="3" />
        <rect x="0" y="0" width="${tblW}" height="${headerH}" fill="${headerBg}" />

        <text x="${colX[0] + (colX[1] - colX[0]) / 2}" y="14" text-anchor="middle" font-size="7.5" font-weight="900" fill="#ffffff">${t12(i18n.lang, 'ITEM', 'POZ')}</text>
        <text x="${colX[1] + 6}" y="14" font-size="7.5" font-weight="800" fill="#ffffff">${t12(i18n.lang, 'DESCRIPTION', 'PARÇA TANIMI')}</text>
        <text x="${colX[2] + (colX[3] - colX[2]) / 2}" y="14" text-anchor="middle" font-size="7.5" font-weight="800" fill="#ffffff">${t12(i18n.lang, 'QTY', 'ADET')}</text>
        <text x="${colX[3] + 6}" y="14" font-size="7.5" font-weight="800" fill="#ffffff">${t12(i18n.lang, 'MATERIAL', 'MALZEME')}</text>
        <text x="${colX[4] + 6}" y="14" font-size="7.5" font-weight="800" fill="#ffffff">${t12(i18n.lang, 'DIMENSIONS (mm)', 'BOYUT (mm)')}</text>
        <text x="${colX[5] + 6}" y="14" font-size="7.5" font-weight="800" fill="#ffffff">${t12(i18n.lang, 'MASS', 'KÜTLE')}</text>

        ${rowsSvg}
        ${colLines}

        <text x="0" y="-6" font-size="9" font-weight="900" fill="${primaryStroke}" letter-spacing="0.5">
          ${titleStr}
        </text>
      </g>
    `;
  }

  function renderBalloonsSvg(): string {
    if (!showBalloons || !isAssembly || bomRows.length === 0) return '';

    const balloonElements: string[] = [];
    const scaleFactor = isA2 ? 0.72 : 0.85;
    const maxBalloons = isA2 ? 30 : 22;
    const rowsToAnnotate = bomRows.slice(0, maxBalloons);

    // 1. Gather representative visible parts and their 2D projected coordinates
    interface BalloonCandidate {
      row: DrawingBomRow;
      vX: number;
      vY: number;
      vZ: number;
      angle: number;
    }

    const candidates: BalloonCandidate[] = [];

    for (const row of rowsToAnnotate) {
      // Find all parts belonging to this BOM item
      const matchingParts = partsToDraw.filter(p => {
        if (!p.visible) return false;
        if (p.id === row.partId) return true;
        const cleanName = normalizeBomPartName(p.name || p.kind);
        return cleanName === row.name;
      });

      if (matchingParts.length === 0) continue;

      // Select the part instance that is most visible / furthest from center
      let bestScore = -Infinity;
      let bestVX = 0, bestVY = 0, bestVZ = 0;

      for (const part of matchingParts) {
        const off = (showExplodedView && partExplodedOffsets.get(part.id)) || new THREE.Vector3(0, 0, 0);
        const px = part.position.x + off.x;
        const py = part.position.y + off.y;
        const pz = part.position.z + off.z;

        const rx = px - centerX;
        const ry = py - centerY;
        const rz = pz - centerZ;
        const x_y = rx * cosY + rz * sinY;
        const z_y = -rx * sinY + rz * cosY;
        const y_x = ry * cosX - z_y * sinX;
        const z_x = ry * sinX + z_y * cosX;

        const vX = x_y * viewScale * scaleFactor;
        const vY = -y_x * viewScale * scaleFactor;
        const vZ = z_x;

        // Favor parts further from assembly center and in foreground (higher vZ)
        const distFromCenter = Math.hypot(vX, vY);
        const score = distFromCenter + vZ * 0.15;

        if (score > bestScore) {
          bestScore = score;
          bestVX = vX;
          bestVY = vY;
          bestVZ = vZ;
        }
      }

      const angle = Math.atan2(bestVY, bestVX);
      candidates.push({
        row,
        vX: bestVX,
        vY: bestVY,
        vZ: bestVZ,
        angle,
      });
    }

    if (candidates.length === 0) return '';

    // 2. Sort candidates by angle around view center to guarantee non-crossing leaders
    candidates.sort((a, b) => a.angle - b.angle);

    // 3. Compute bounding radius for perimeter orbit
    let maxProjectedRadius = 60;
    for (const c of candidates) {
      const r = Math.hypot(c.vX, c.vY);
      if (r > maxProjectedRadius) maxProjectedRadius = r;
    }

    const orbitRadius = Math.max(maxProjectedRadius + (isA2 ? 55 : 45), isA2 ? 160 : 120);
    const Rx = orbitRadius * 1.22; // Aspect ratio wider than tall for drawing sheets
    const Ry = orbitRadius * 0.92;
    const totalCount = candidates.length;

    // 4. Distribute balloon positions monotonically along the elliptical perimeter
    candidates.forEach((cand, idx) => {
      // Blend candidate's actual angle with uniform angular slot around the ellipse
      const uniformAngle = -Math.PI + (idx + 0.5) * ((2 * Math.PI) / totalCount);
      // Angular interpolation: preserves topological order (no crossing!) while keeping close to part
      const blendedAngle = cand.angle * 0.4 + uniformAngle * 0.6;

      const bx = Math.cos(blendedAngle) * Rx;
      const by = Math.sin(blendedAngle) * Ry;

      // Horizontal leader dogleg landing shelf (14px)
      const isRight = bx >= cand.vX;
      const kneeX = isRight ? bx - 14 : bx + 14;
      const kneeY = by;
      const balloonRadius = 11;

      balloonElements.push(`
        <!-- Balloon Item ${cand.row.poz} -->
        <g class="cad-balloon" data-poz="${cand.row.poz}">
          <!-- Origin dot on visible part surface -->
          <circle cx="${cand.vX.toFixed(1)}" cy="${cand.vY.toFixed(1)}" r="2.5" fill="${primaryStroke}" />
          <!-- Non-crossing dogleg leader line -->
          <polyline points="${cand.vX.toFixed(1)},${cand.vY.toFixed(1)} ${kneeX.toFixed(1)},${kneeY.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}" fill="none" stroke="${primaryStroke}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Circular Item Find Badge -->
          <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${balloonRadius}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.6" />
          <!-- Poz Number (Item ID) -->
          <text x="${bx.toFixed(1)}" y="${(by + 3.8).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="900" fill="${textPrimary}">${cand.row.poz}</text>
        </g>
      `);
    });

    return balloonElements.join('\n');
  }

  const holeScheduleTableSvg = renderHoleScheduleTableSvg();
  const formulasTableSvg = renderManufacturingFormulasTableSvg();
  const bomTableSvg = renderBomTableSvg();

  const notesSvg = cfg.notes && cfg.notes.length > 0 ? `
    <g transform="translate(${margin + 15}, ${sheetH - margin - 75})">
      <text x="0" y="0" font-size="8.5" font-weight="800" fill="${textPrimary}">${i18n.notes.title}</text>
      ${cfg.notes.map((n, idx) => `<text x="5" y="${13 + idx * 11}" font-size="7.5" fill="${textSecondary}">${n}</text>`).join('\n')}
    </g>` : '';

  const gridCoordsSvg = `
    <g fill="${secondaryStroke}" font-size="7.5" font-weight="700">
      <text x="${sheetW / 4}" y="${margin - 5}" text-anchor="middle">1</text>
      <text x="${sheetW / 2}" y="${margin - 5}" text-anchor="middle">2</text>
      <text x="${(sheetW * 3) / 4}" y="${margin - 5}" text-anchor="middle">3</text>
      <text x="${margin - 8}" y="${sheetH / 3}" text-anchor="middle">A</text>
      <text x="${margin - 8}" y="${(sheetH * 2) / 3}" text-anchor="middle">B</text>
    </g>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetW} ${sheetH}" width="100%" height="100%" style="background:${bgColor}; font-family:'Segoe UI', -apple-system, monospace;">
  <rect x="0" y="0" width="${sheetW}" height="${sheetH}" fill="${bgColor}" />

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="${primaryStroke}" />
    </marker>
    <!-- ISO 128 standard 45° section hatching pattern -->
    <pattern id="isoHatch45" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="${primaryStroke}" stroke-width="0.75" />
    </pattern>
  </defs>

  <rect x="${margin}" y="${margin}" width="${sheetW - margin * 2}" height="${sheetH - margin * 2}" fill="none" stroke="${primaryStroke}" stroke-width="2" />
  <rect x="${margin + 4}" y="${margin + 4}" width="${sheetW - margin * 2 - 8}" height="${sheetH - margin * 2 - 8}" fill="none" stroke="${secondaryStroke}" stroke-width="0.7" />

  ${gridCoordsSvg}
  ${renderTitleBlock()}
  ${bomTableSvg}
  ${formulasTableSvg}
  ${holeScheduleTableSvg}
  ${notesSvg}

  <!-- 1. FRONT VIEW -->
  <g transform="translate(${frontX}, ${frontY})">
    <text x="0" y="${sh / 2 + 38}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${textPrimary}">${i18n.views.front}</text>
    ${frontSvg}
    ${frontViewGearsSvg}

    <!-- Cutting Line A-A on Front View -->
    ${showSectionView ? `
    <g>
      <line x1="0" y1="${-sh / 2 - 14}" x2="0" y2="${sh / 2 + 14}" stroke="${primaryStroke}" stroke-width="0.8" stroke-dasharray="14,3,3,3" />
      <line x1="0" y1="${-sh / 2 - 24}" x2="0" y2="${-sh / 2 - 10}" stroke="${primaryStroke}" stroke-width="2.2" />
      <line x1="0" y1="${sh / 2 + 10}" x2="0" y2="${sh / 2 + 24}" stroke="${primaryStroke}" stroke-width="2.2" />
      <line x1="0" y1="${-sh / 2 - 24}" x2="16" y2="${-sh / 2 - 24}" stroke="${primaryStroke}" stroke-width="1.6" marker-end="url(#arrow)" />
      <line x1="0" y1="${sh / 2 + 24}" x2="16" y2="${sh / 2 + 24}" stroke="${primaryStroke}" stroke-width="1.6" marker-end="url(#arrow)" />
      <text x="22" y="${-sh / 2 - 20}" font-size="12" font-weight="900" fill="${primaryStroke}">A</text>
      <text x="22" y="${sh / 2 + 28}" font-size="12" font-weight="900" fill="${primaryStroke}">A</text>
    </g>
    ` : ''}

    <!-- Centerlines -->
    <line x1="${-sw / 2 - 12}" y1="0" x2="${sw / 2 + 12}" y2="0" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
    <line x1="0" y1="${-sh / 2 - 12}" x2="0" y2="${sh / 2 + 12}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />

    ${frontViewHolesSvg}

    <!-- Width Dimension -->
    <line x1="${-sw / 2}" y1="${sh / 2 + 16}" x2="${sw / 2}" y2="${sh / 2 + 16}" stroke="${primaryStroke}" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="${-sw / 2}" y1="${sh / 2 + 4}" x2="${-sw / 2}" y2="${sh / 2 + 22}" stroke="${primaryStroke}" stroke-width="0.8" />
    <line x1="${sw / 2}" y1="${sh / 2 + 4}" x2="${sw / 2}" y2="${sh / 2 + 22}" stroke="${primaryStroke}" stroke-width="0.8" />
    <text x="0" y="${sh / 2 + 13}" text-anchor="middle" font-size="11" font-weight="800" fill="${textPrimary}">${dimW} mm</text>

    <!-- Height Dimension -->
    <line x1="${-sw / 2 - 16}" y1="${-sh / 2}" x2="${-sw / 2 - 16}" y2="${sh / 2}" stroke="${primaryStroke}" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="${-sw / 2 - 22}" y1="${-sh / 2}" x2="${-sw / 2 - 4}" y2="${-sh / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <line x1="${-sw / 2 - 22}" y1="${sh / 2}" x2="${-sw / 2 - 4}" y2="${sh / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <text x="${-sw / 2 - 20}" y="3" text-anchor="middle" transform="rotate(-90 ${-sw / 2 - 20} 0)" font-size="11" font-weight="800" fill="${textPrimary}">${dimH} mm</text>
  </g>

  <!-- 2. TOP VIEW -->
  <g transform="translate(${topX}, ${topY})">
    <text x="0" y="${-sd / 2 - 22}" text-anchor="middle" font-size="11.5" font-weight="900" fill="${textPrimary}">${i18n.views.top}</text>
    ${topSvg}
    ${topViewGearsSvg}

    <line x1="${-sw / 2 - 12}" y1="0" x2="${sw / 2 + 12}" y2="0" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
    <line x1="0" y1="${-sd / 2 - 12}" x2="0" y2="${sd / 2 + 12}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />

    ${topViewHolesSvg}

    <!-- Depth Dimension -->
    <line x1="${sw / 2 + 16}" y1="${-sd / 2}" x2="${sw / 2 + 16}" y2="${sd / 2}" stroke="${primaryStroke}" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="${sw / 2 + 4}" y1="${-sd / 2}" x2="${sw / 2 + 22}" y2="${-sd / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <line x1="${sw / 2 + 4}" y1="${sd / 2}" x2="${sw / 2 + 22}" y2="${sd / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <text x="${sw / 2 + 24}" y="3" text-anchor="middle" transform="rotate(90 ${sw / 2 + 24} 0)" font-size="11" font-weight="800" fill="${textPrimary}">${dimD} mm</text>
  </g>

  <!-- 3. RIGHT SIDE VIEW -->
  <g transform="translate(${rightX}, ${rightY})">
    <text x="0" y="${sh / 2 + 38}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${textPrimary}">${i18n.views.side}</text>
    ${rightSvg}
    ${rightViewGearsSvg}

    <line x1="${-sd / 2 - 12}" y1="0" x2="${sd / 2 + 12}" y2="0" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
    <line x1="0" y1="${-sh / 2 - 12}" x2="0" y2="${sh / 2 + 12}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />

    ${rightViewHolesSvg}
  </g>

  <!-- 4. SECTION VIEW A-A -->
  ${showSectionView ? `
  <g transform="translate(${secX}, ${secY})">
    <text x="0" y="${sh / 2 + 38}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${primaryStroke}">
      ${t12(i18n.lang, 'SECTION VIEW A-A (1:1)', 'A-A KESİT GÖRÜNÜŞÜ (1:1)')}
    </text>
    ${secSvg}
    ${secViewGearsSvg}

    <line x1="${-sd / 2 - 12}" y1="0" x2="${sd / 2 + 12}" y2="0" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
    <line x1="0" y1="${-sh / 2 - 12}" x2="0" y2="${sh / 2 + 12}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
  </g>
  ` : ''}

  <!-- 5. 3D ISOMETRIC / EXPLODED PROJECTION WITH BALLOONS -->
  <g transform="translate(${isoX}, ${isoY})">
    <text x="0" y="${-Math.min(220, Math.max(70, sh * 0.55 + 24))}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${textPrimary}">
      ${showExplodedView
        ? t12(i18n.lang, 'EXPLODED ASSEMBLY VIEW & ITEM BALLOONS', 'PATLATILMIŞ MONTAJ GÖRÜNÜMÜ & PARÇA POZLARI')
        : i18n.views.isometric}
    </text>
    ${isoSvg}
    ${renderBalloonsSvg()}
  </g>
</svg>
  `.trim();
}

/**
 * Generates an appendix sheet with full engineering calculation matrix and manufacturing passport
 */
export function generateEngineeringPassportSVG(
  target: DesignPart | DesignPart[],
  massProps: MassProperties,
  config: Partial<DrawingSheetConfig> = {}
): string {
  const partsToDraw: DesignPart[] = Array.isArray(target) ? target : [target];
  const lang = config.lang || 'en';
  const i18n = getDrawingI18n(lang);

  const sheetW = config.sheetSize === 'A4' ? 842 : config.sheetSize === 'A2' ? 1684 : 1188;
  const sheetH = config.sheetSize === 'A4' ? 595 : config.sheetSize === 'A2' ? 1188 : 842;
  const margin = 20;

  const isThemeBlueprint = config.colorTheme === 'blueprint';
  const isThemeDark = config.colorTheme === 'dark';

  const bgColor = isThemeBlueprint ? '#091833' : isThemeDark ? '#080c14' : '#ffffff';
  const primaryStroke = isThemeBlueprint ? '#38bdf8' : isThemeDark ? '#38bdf8' : '#0f172a';
  const secondaryStroke = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#1e293b' : '#cbd5e1';
  const textPrimary = isThemeBlueprint ? '#f0f9ff' : isThemeDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isThemeBlueprint ? '#7dd3fc' : isThemeDark ? '#94a3b8' : '#64748b';
  const antetBg = isThemeBlueprint ? '#040d1a' : isThemeDark ? '#020617' : '#ffffff';
  const headerBg = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#1e293b' : '#0f172a';

  const formulas = extractManufacturingFormulas(partsToDraw, lang);

  const tblW = sheetW - margin * 2 - 40;
  const colX = [0, 240, 520, 740, tblW];
  const rowH = 22;
  const headerH = 28;

  let formulaRowsSvg = '';
  formulas.forEach((item, idx) => {
    const ry = headerH + idx * rowH;
    const bg = idx % 2 === 0
      ? (isThemeBlueprint ? 'rgba(11, 33, 68, 0.95)' : isThemeDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff')
      : (isThemeBlueprint ? 'rgba(14, 43, 85, 0.85)' : isThemeDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc');

    const cleanFormula = item.formula.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanLabel = item.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanResult = item.result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    formulaRowsSvg += `
      <rect x="0" y="${ry}" width="${tblW}" height="${rowH}" fill="${bg}" />
      <line x1="0" y1="${ry + rowH}" x2="${tblW}" y2="${ry + rowH}" stroke="${secondaryStroke}" stroke-width="0.5" />
      <text x="12" y="${ry + 15}" font-size="9" font-weight="700" fill="${textPrimary}">${item.partName} · ${cleanLabel}</text>
      <text x="${colX[1] + 12}" y="${ry + 15}" font-size="9" font-family="monospace" font-weight="600" fill="${textSecondary}">${cleanFormula}</text>
      <text x="${colX[2] + 12}" y="${ry + 15}" font-size="9.5" font-family="monospace" font-weight="800" fill="${isThemeBlueprint ? '#38bdf8' : '#0284c7'}">${cleanResult}</text>
      <text x="${colX[3] + 12}" y="${ry + 15}" font-size="8.5" font-weight="700" fill="${textSecondary}">${item.standard || 'ISO / DIN'}</text>
    `;
  });

  const tblH = headerH + formulas.length * rowH;

  const allNotes: string[] = [];
  partsToDraw.forEach(p => {
    if (p.manufacturingNotes) {
      p.manufacturingNotes.forEach(n => {
        let cleanNote = n;
        if (lang !== 'tr') {
          if (cleanNote.includes('Standart:')) cleanNote = cleanNote.replace('Standart:', 'Standard:').replace('Kalite Sınıfı:', 'Quality Class:');
          if (cleanNote.includes('Profil:')) cleanNote = cleanNote.replace('Profil:', 'Profile:').replace('Kavrama Açısı', 'Pressure Angle').replace('Helis Açısı', 'Helix Angle');
          if (cleanNote.includes('Malzeme & Isıl İşlem:')) cleanNote = cleanNote.replace('Malzeme & Isıl İşlem:', 'Material & Heat Treatment:').replace('Sementasyon Çeliği', 'Case Hardening Steel').replace('Sertlik:', 'Hardness:');
        }
        if (!allNotes.includes(cleanNote)) allNotes.push(cleanNote);
      });
    }
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetW} ${sheetH}" width="100%" height="100%" style="background:${bgColor}; font-family:'Segoe UI', -apple-system, monospace;">
  <rect x="0" y="0" width="${sheetW}" height="${sheetH}" fill="${bgColor}" />

  <rect x="${margin}" y="${margin}" width="${sheetW - margin * 2}" height="${sheetH - margin * 2}" fill="none" stroke="${primaryStroke}" stroke-width="2" />
  <rect x="${margin + 4}" y="${margin + 4}" width="${sheetW - margin * 2 - 8}" height="${sheetH - margin * 2 - 8}" fill="none" stroke="${secondaryStroke}" stroke-width="0.7" />

  <!-- Header Banner -->
  <g transform="translate(${margin + 20}, ${margin + 40})">
    <text x="0" y="0" font-size="16" font-weight="900" fill="${primaryStroke}" letter-spacing="0.5">
      📐 ${i18n.mfgTable.appendixTitle}
    </text>
    <text x="0" y="20" font-size="9.5" font-weight="600" fill="${textSecondary}">
      ${i18n.mfgTable.appendixSubtitle} · ${config.projectName || 'ALU-CAD'} · ${config.date || new Date().toISOString().split('T')[0]}
    </text>
  </g>

  <!-- Formula Matrix Table -->
  <g transform="translate(${margin + 20}, ${margin + 80})">
    <rect x="0" y="0" width="${tblW}" height="${tblH}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.4" rx="4" />
    <rect x="0" y="0" width="${tblW}" height="${headerH}" fill="${headerBg}" />

    <text x="12" y="18" font-size="9" font-weight="800" fill="#ffffff">${i18n.mfgTable.param}</text>
    <text x="${colX[1] + 12}" y="18" font-size="9" font-weight="800" fill="#ffffff">${i18n.mfgTable.formula}</text>
    <text x="${colX[2] + 12}" y="18" font-size="9" font-weight="800" fill="#ffffff">${i18n.mfgTable.value}</text>
    <text x="${colX[3] + 12}" y="18" font-size="9" font-weight="800" fill="#ffffff">${i18n.mfgTable.standard}</text>

    ${formulaRowsSvg}
  </g>

  <!-- Notes & Quality Directives -->
  ${allNotes.length > 0 ? `
  <g transform="translate(${margin + 20}, ${margin + 100 + tblH})">
    <text x="0" y="0" font-size="11" font-weight="800" fill="${textPrimary}">🛡️ ${i18n.mfgTable.notesTitle}:</text>
    ${allNotes.map((n, i) => `<text x="12" y="${20 + i * 16}" font-size="9" fill="${textSecondary}">• ${n}</text>`).join('\n')}
  </g>` : ''}
</svg>
  `.trim();
}

/**
 * Generates a clean, multi-page printable HTML document containing technical drawings
 */
export function generateBatchDrawingsHTML(
  sheets: Array<{ target: DesignPart | DesignPart[]; massProps: MassProperties; config: Partial<DrawingSheetConfig> }>,
  globalTitle: string = 'ALUCALCULATOR CAD Portfolio'
): string {
  const firstSheetConfig = sheets[0]?.config || {};
  const lang = firstSheetConfig.lang || 'en';
  const i18n = getDrawingI18n(lang);

  const theme = firstSheetConfig.colorTheme || 'classic';
  const isThemeBlueprint = theme === 'blueprint';
  const isThemeDark = theme === 'dark';
  const pageBg = isThemeBlueprint ? '#091833' : isThemeDark ? '#080c14' : '#ffffff';
  const bodyBg = isThemeBlueprint ? '#040b17' : isThemeDark ? '#030712' : '#0f172a';
  const textColor = isThemeBlueprint ? '#f0f9ff' : isThemeDark ? '#f8fafc' : '#f8fafc';

  const htmlPages: string[] = [];

  sheets.forEach((item, idx) => {
    const itemConfig = { ...item.config, lang };
    const svg = generateTechnicalDrawingSVG(item.target, item.massProps, itemConfig);
    htmlPages.push(`
    <div class="drawing-page" id="page-${htmlPages.length + 1}">
      ${svg}
    </div>`);

    const targetParts = Array.isArray(item.target) ? item.target : [item.target];
    const formulas = extractManufacturingFormulas(targetParts, lang);
    if (formulas.length > 0) {
      const passportSvg = generateEngineeringPassportSVG(item.target, item.massProps, itemConfig);
      htmlPages.push(`
      <div class="drawing-page" id="page-${htmlPages.length + 1}">
        ${passportSvg}
      </div>`);
    }
  });

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${globalTitle}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      background: ${bodyBg};
      -webkit-print-color-adjust: exact !important;
    }
    body {
      background: ${bodyBg};
      color: ${textColor};
      font-family: 'Segoe UI', -apple-system, sans-serif;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }
    .toolbar {
      position: sticky;
      top: 12px;
      z-index: 100;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .toolbar button {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #040812;
      border: none;
      font-weight: 800;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .toolbar button:hover {
      filter: brightness(1.15);
      transform: translateY(-1px);
    }
    .toolbar span {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 600;
    }
    .drawing-page {
      width: 100%;
      max-width: 1188px;
      background: ${pageBg} !important;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .drawing-page svg {
      width: 100%;
      height: auto;
      display: block;
      background: ${pageBg} !important;
    }

    @media print {
      @page {
        size: A3 landscape;
        margin: 0;
      }
      html, body {
        background: ${pageBg} !important;
        padding: 0 !important;
        margin: 0 !important;
        gap: 0 !important;
      }
      .toolbar {
        display: none !important;
      }
      .drawing-page {
        border-radius: 0 !important;
        box-shadow: none !important;
        max-width: none !important;
        width: 100vw !important;
        height: 100vh !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
      }
      .drawing-page svg {
        width: 100vw !important;
        height: 100vh !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>${i18n.pdf.toolbarTitle(htmlPages.length)}</span>
    <button onclick="window.print()">${i18n.pdf.printButton}</button>
  </div>
  ${htmlPages.join('\n')}
</body>
</html>`;
}


