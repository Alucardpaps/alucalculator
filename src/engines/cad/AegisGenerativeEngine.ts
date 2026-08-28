'use client';

/**
 * ⚡ AEGIS GENERATIVE CAD & MECHANICAL NLP ENGINE
 * Parses natural language descriptions into exact 3D parametric solids,
 * standard hole patterns (PCD, Matrix), cuts, and engineering materials.
 */

import { type DesignKind, type DesignPart } from '@/design-studio/designStore';
import { type HoleItem, ISO_METRIC_HOLES } from '@/design-studio/holeStandards';

export interface GeneratedCadSolid {
  name: string;
  kind: DesignKind;
  params: Record<string, number>;
  holes: HoleItem[];
  color: string;
  materialId: string;
  explanation: {
    tr: string;
    en: string;
  };
  features: string[];
}

/**
 * Extracts numbers from text like "100x50x20", "50 x 30", "ø80", "R25", "M12", "4 delikli"
 */
function extractDimensions(text: string) {
  const lower = text.toLowerCase();

  // 1. Triple dimensions: WxLxH or WxHxD (e.g. 100x50x20 or 100*50*20)
  const tripleMatch = lower.match(/(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
  if (tripleMatch) {
    return {
      dim1: parseFloat(tripleMatch[1]),
      dim2: parseFloat(tripleMatch[2]),
      dim3: parseFloat(tripleMatch[3]),
    };
  }

  // 2. Double dimensions: WxL or WxH (e.g. 50x50 or 80x40)
  const doubleMatch = lower.match(/(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
  if (doubleMatch) {
    return {
      dim1: parseFloat(doubleMatch[1]),
      dim2: parseFloat(doubleMatch[2]),
    };
  }

  return {};
}

/**
 * Extracts Hole/Fastener information from prompt (e.g. "4xM8", "6 delikli M12", "M6 imbus", "PCD 120")
 */
function extractHoles(text: string, partW = 100, partH = 100): HoleItem[] {
  const lower = text.toLowerCase();
  const holes: HoleItem[] = [];

  // Metric size extraction (M1 to M100)
  const metricMatch = lower.match(/m(\d+)/);
  const metricSize = metricMatch ? `M${metricMatch[1]}` : 'M8';

  // Hole count extraction (e.g. "4 delikli", "4x", "6 adet", "8 hole")
  const countMatch = lower.match(/(\d+)\s*(?:x|delik|hole|adet|holes)/);
  const holeCount = countMatch ? parseInt(countMatch[1], 10) : 4;

  // Fit type
  const isCounterbore = lower.includes('imbus') || lower.includes('counterbore') || lower.includes('din 912');
  const isTap = lower.includes('diş') || lower.includes('kılavuz') || lower.includes('tap') || lower.includes('thread');
  const isCountersink = lower.includes('havşa') || lower.includes('countersink') || lower.includes('din 7991');

  const holeType: 'tap' | 'clearance' | 'counterbore' | 'countersink' = isCounterbore
    ? 'counterbore'
    : isTap
    ? 'tap'
    : isCountersink
    ? 'countersink'
    : 'clearance';

  // PCD (Bolt Circle) extraction
  const pcdMatch = lower.match(/pcd\s*(\d+(?:\.\d+)?)/);
  const isFlangeOrCircle = lower.includes('flan') || lower.includes('flange') || lower.includes('kasnak') || lower.includes('pcd') || lower.includes('daire');

  if (isFlangeOrCircle) {
    const pcdDia = pcdMatch ? parseFloat(pcdMatch[1]) : Math.min(partW, partH) * 0.7;
    const r = pcdDia / 2;
    const step = (Math.PI * 2) / Math.max(1, holeCount);

    for (let i = 0; i < holeCount; i++) {
      const angle = i * step;
      holes.push({
        id: `gen-hole-${Date.now()}-${i + 1}`,
        size: metricSize,
        x: Number((r * Math.cos(angle)).toFixed(1)),
        y: Number((r * Math.sin(angle)).toFixed(1)),
        type: holeType,
      });
    }
  } else {
    // Rectangular 4-corner or grid layout
    const offsetW = (partW / 2) * 0.65;
    const offsetH = (partH / 2) * 0.65;

    if (holeCount === 2) {
      holes.push(
        { id: `gen-hole-1`, size: metricSize, x: -offsetW, y: 0, type: holeType },
        { id: `gen-hole-2`, size: metricSize, x: offsetW, y: 0, type: holeType }
      );
    } else if (holeCount === 4 || holeCount > 2) {
      holes.push(
        { id: `gen-hole-1`, size: metricSize, x: -offsetW, y: -offsetH, type: holeType },
        { id: `gen-hole-2`, size: metricSize, x: offsetW, y: -offsetH, type: holeType },
        { id: `gen-hole-3`, size: metricSize, x: offsetW, y: offsetH, type: holeType },
        { id: `gen-hole-4`, size: metricSize, x: -offsetW, y: offsetH, type: holeType }
      );
    }
  }

  return holes;
}

/**
 * Master Mechanical NLP Prompt Synthesizer
 */
export function generateSolidFromPrompt(prompt: string): GeneratedCadSolid {
  const text = prompt.trim();
  const lower = text.toLowerCase();
  const dims = extractDimensions(text);

  // ─────────────────────────────────────────────────────────
  // 1. FLANGE / FLANŞ / BORU FLANŞI / PCD DAİRESEL PARÇA
  // ─────────────────────────────────────────────────────────
  if (
    lower.includes('flan') ||
    lower.includes('flange') ||
    lower.includes('pcd') ||
    lower.includes('flans')
  ) {
    const dia = dims.dim1 || (lower.match(/(?:ø|çap|dia)\s*(\d+)/)?.[1] ? parseFloat(lower.match(/(?:ø|çap|dia)\s*(\d+)/)![1]) : 120);
    const thick = dims.dim3 || dims.dim2 || 15;
    const bore = dia * 0.35;
    const holes = extractHoles(text, dia, dia);

    return {
      name: `Flanş (Ø${dia}x${thick}mm)`,
      kind: 'pulley', // Pulley/flange cylinder with central bore
      params: {
        diameter: dia,
        height: thick,
        depth: thick,
        innerDiameter: bore,
        bore: bore,
        grooveDepth: 0,
      },
      holes: holes.length > 0 ? holes : extractHoles('4xM10 flanş', dia, dia),
      color: '#00e5ff',
      materialId: 's355-steel',
      explanation: {
        tr: `Ø${dia}mm dış çap, Ø${bore.toFixed(1)}mm merkez geçiş deliği ve ${holes.length || 4} adet metrik cıvata montaj deliğine sahip standart endüstriyel flanş üretildi.`,
        en: `Industrial flange generated with Ø${dia}mm OD, Ø${bore.toFixed(1)}mm center bore, and ${holes.length || 4}x metric fastener holes.`,
      },
      features: ['Merkez Geçiş Boşaltması', 'PCD Dairesel Delik Dizilimi', 'ISO 7005 Standart Flanş'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // 2. L-BRACKET / KÖŞEBENT / MONTAJ AYAĞI
  // ─────────────────────────────────────────────────────────
  if (
    lower.includes('braket') ||
    lower.includes('bracket') ||
    lower.includes('köşebent') ||
    lower.includes('ayak') ||
    lower.includes('l-profil') ||
    lower.includes('l profil')
  ) {
    const w = dims.dim1 || 60;
    const h = dims.dim2 || 60;
    const d = dims.dim3 || 40;
    const t = 6;
    const holes = extractHoles(text, w, d);

    return {
      name: `L-Braket (${w}x${h}x${d}mm)`,
      kind: 'L-bracket',
      params: {
        flangeW: w,
        webH: h,
        flangeT: t,
        webT: t,
        length: d,
        depth: d,
        thickness: t,
      },
      holes: holes.length > 0 ? holes : [
        { id: 'h1', size: 'M8', x: -w * 0.2, y: 0, type: 'counterbore' },
        { id: 'h2', size: 'M8', x: w * 0.2, y: 0, type: 'counterbore' },
      ],
      color: '#f59e0b',
      materialId: 'al-6061-t6',
      explanation: {
        tr: `${w}x${h} mm gövde ve ${d} mm derinlikte, 6 mm et kalınlığına sahip yüksek mukavemetli L-Braket montaj parçası üretildi.`,
        en: `High-strength ${w}x${h}x${d}mm structural L-bracket generated with 6mm wall thickness.`,
      },
      features: ['90° Rijit Gövde', 'Cıvata Montaj Yuvaları', 'Hafif Al 6061-T6 Alaşım'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // 3. SHAFT / MİL / TRANSMİSYON MİLİ / D-SHAFT / KADEMELİ MİL
  // ─────────────────────────────────────────────────────────
  if (
    lower.includes('mil') ||
    lower.includes('shaft') ||
    lower.includes('şaft') ||
    lower.includes('aks') ||
    lower.includes('kademeli')
  ) {
    const dia = dims.dim1 || (lower.match(/(?:ø|çap|dia)\s*(\d+)/)?.[1] ? parseFloat(lower.match(/(?:ø|çap|dia)\s*(\d+)/)![1]) : 25);
    const len = dims.dim2 || dims.dim3 || 120;
    const hasKeyway = lower.includes('kama') || lower.includes('keyway') || lower.includes('kamalı');

    return {
      name: `${hasKeyway ? 'Kamalı' : 'Hassas'} Mil (Ø${dia}x${len}mm)`,
      kind: hasKeyway ? 'keyway-shaft' : 'cylinder',
      params: {
        diameter: dia,
        length: len,
        depth: len,
        height: len,
        keyWidth: dia * 0.25,
        keyDepth: dia * 0.15,
        keyLength: len * 0.4,
      },
      holes: [],
      color: '#38bdf8',
      materialId: '4140-steel',
      explanation: {
        tr: `Ø${dia} mm çapında ve ${len} mm boyunda, DIN 6885 standardına uygun ${hasKeyway ? 'kamalı' : 'taşlanmış'} transmisyon mili tasarlandı.`,
        en: `Precision shaft designed with Ø${dia}mm diameter and ${len}mm length according to DIN 6885.`,
      },
      features: ['Hassas h6 Tolerans', hasKeyway ? 'DIN 6885 Kama Kanalı' : 'Silindirik Yataklama', 'AISI 4140 Islah Çeliği'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // 4. GEAR / DİŞLİ / DÜZ DİŞLİ / ÇARK
  // ─────────────────────────────────────────────────────────
  if (
    lower.includes('dişli') ||
    lower.includes('gear') ||
    lower.includes('çark') ||
    lower.includes('pinyon')
  ) {
    const teeth = lower.match(/(\d+)\s*(?:diş|teeth|z)/)?.[1] ? parseInt(lower.match(/(\d+)\s*(?:diş|teeth|z)/)![1], 10) : 24;
    const mod = lower.match(/(?:modül|mod|m)\s*(\d+(?:\.\d+)?)/)?.[1] ? parseFloat(lower.match(/(?:modül|mod|m)\s*(\d+(?:\.\d+)?)/)![1]) : 2.0;
    const depth = dims.dim2 || 20;
    const bore = teeth * mod * 0.25;

    return {
      name: `Düz Dişli (Z${teeth} M${mod})`,
      kind: 'gear-blank',
      params: {
        teeth,
        module: mod,
        depth,
        bore,
      },
      holes: [],
      color: '#a855f7',
      materialId: '4140-steel',
      explanation: {
        tr: `${teeth} dişli, ${mod} modül ve Ø${bore.toFixed(1)} mm kama/mil merkez delikli standart evolvent profilli düz dişli çark üretildi.`,
        en: `Standard spur gear generated with ${teeth} teeth, module ${mod}, and Ø${bore.toFixed(1)}mm shaft bore.`,
      },
      features: ['20° Standart Kavrama Açısı', 'Evolvent Diş Geometrisi', 'Mil Göbek Boşaltması'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // 5. PULLEY / KASNAK / V-KASNAK / TRİGER
  // ─────────────────────────────────────────────────────────
  if (
    lower.includes('kasnak') ||
    lower.includes('pulley') ||
    lower.includes('kayış') ||
    lower.includes('triger')
  ) {
    const dia = dims.dim1 || 80;
    const width = dims.dim2 || 25;
    const bore = dia * 0.2;

    return {
      name: `V-Kasnak (Ø${dia}x${width}mm)`,
      kind: 'pulley',
      params: {
        diameter: dia,
        height: width,
        depth: width,
        innerDiameter: bore,
        bore,
        grooveDepth: 6,
      },
      holes: [],
      color: '#eab308',
      materialId: 'al-6061-t6',
      explanation: {
        tr: `Ø${dia} mm dış çaplı, ${width} mm genişlikte ve DIN 2211 standart V-kayış kanal profiline sahip tahrik kasnağı oluşturuldu.`,
        en: `Drive pulley created with Ø${dia}mm outer diameter, ${width}mm width, and DIN 2211 V-groove.`,
      },
      features: ['DIN 2211 V-Kanal', 'Mil Montaj Göbeği', 'Dinamik Balanslı Tasarım'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // 6. TUBE / BORU / KUTU PROFİL / ŞASE
  // ─────────────────────────────────────────────────────────
  if (
    lower.includes('kutu profil') ||
    lower.includes('boru') ||
    lower.includes('tüp') ||
    lower.includes('tube') ||
    lower.includes('pipe') ||
    lower.includes('profil')
  ) {
    const isRound = lower.includes('yuvarlak') || lower.includes('boru') || lower.includes('pipe');
    const diaOrW = dims.dim1 || 50;
    const h = dims.dim2 || 50;
    const len = dims.dim3 || 100;
    const wall = 3;

    return {
      name: `${isRound ? 'Boru Profil' : 'Kutu Profil'} (${diaOrW}x${h}x${len}mm)`,
      kind: isRound ? 'tube' : 'box',
      params: {
        width: diaOrW,
        height: h,
        depth: len,
        length: len,
        diameter: diaOrW,
        wall,
      },
      holes: extractHoles(text, diaOrW, h),
      color: '#22c55e',
      materialId: 's355-steel',
      explanation: {
        tr: `${diaOrW}x${h} mm kesitinde, ${len} mm boyunda ve ${wall} mm et kalınlığına sahip yapısal çelik profil üretildi.`,
        en: `Structural steel profile generated with ${diaOrW}x${h}mm section, ${len}mm length, and ${wall}mm wall thickness.`,
      },
      features: ['Yapısal Mukavemet', 'Hafif Boşaltılmış Kesit', 'Kaynak ve Montaja Uygun'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // 7. NUT / BOLT / CIVATA / SOMUN
  // ─────────────────────────────────────────────────────────
  if (
    lower.includes('cıvata') ||
    lower.includes('civata') ||
    lower.includes('bolt') ||
    lower.includes('somun') ||
    lower.includes('nut')
  ) {
    const isNut = lower.includes('somun') || lower.includes('nut');
    const metricMatch = lower.match(/m(\d+)/);
    const metricSize = metricMatch ? parseInt(metricMatch[1], 10) : 10;
    const length = dims.dim2 || dims.dim1 || 40;

    return {
      name: isNut ? `Altıköşe Somun (M${metricSize})` : `Altıköşe Cıvata (M${metricSize}x${length}mm)`,
      kind: isNut ? 'hex-nut' : 'hex-bolt',
      params: {
        diameter: metricSize * 1.8,
        height: isNut ? metricSize * 0.8 : length,
        length: isNut ? metricSize * 0.8 : length,
        depth: isNut ? metricSize * 0.8 : length,
        bore: metricSize,
        innerDiameter: metricSize,
      },
      holes: [],
      color: '#f59e0b',
      materialId: '4140-steel',
      explanation: {
        tr: `DIN 933 / DIN 934 standartlarına uygun metrik M${metricSize} altıköşe bağlantı elemanı katı modeli üretildi.`,
        en: `Metric M${metricSize} hexagonal fastener solid model generated according to DIN 933 / DIN 934.`,
      },
      features: ['DIN 933 / 934 Standart Ölçüler', '8.8 / 10.9 Kalite Çelik', 'Altıköşe Anahtar Ağzı'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // 8. DEFAULT FALLBACK: PARAMETRIC PLATE / BLOK / PARÇA
  // ─────────────────────────────────────────────────────────
  const w = dims.dim1 || 80;
  const h = dims.dim2 || 60;
  const d = dims.dim3 || 15;
  const holes = extractHoles(text, w, h);

  return {
    name: `Parametrik Plaka (${w}x${h}x${d}mm)`,
    kind: 'plate',
    params: {
      width: w,
      height: h,
      depth: d,
      length: d,
    },
    holes: holes.length > 0 ? holes : [
      { id: 'h1', size: 'M6', x: -w * 0.3, y: -h * 0.3, type: 'counterbore' },
      { id: 'h2', size: 'M6', x: w * 0.3, y: -h * 0.3, type: 'counterbore' },
      { id: 'h3', size: 'M6', x: w * 0.3, y: h * 0.3, type: 'counterbore' },
      { id: 'h4', size: 'M6', x: -w * 0.3, y: h * 0.3, type: 'counterbore' },
    ],
    color: '#00e5ff',
    materialId: 'al-6061-t6',
    explanation: {
      tr: `İsteğinize uygun ${w}x${h} mm alanında ve ${d} mm kalınlığında, ${holes.length || 4} adet metrik montaj delikli rijit katı parça başarıyla üretildi.`,
      en: `Rigid solid part with ${w}x${h}x${d}mm dimensions and ${holes.length || 4}x metric mounting holes generated successfully.`,
    },
    features: ['Hassas CNC İşleme Geometrisi', 'Metrik Delik Deseni', 'Alüminyum 6061-T6 Gövde'],
  };
}
