/** ASME B1.20.1 NPT and ISO 228 / ISO 7-1 pipe-thread station geometry. */

export const NPT_TAPER = 1 / 16; // Δdiameter / Δaxial (1:16)

export type NptSpec = {
  tpi: number;
  pitch: number;
  od: number;
  e0: number;
  e1: number;
  e2: number;
  L1: number;
  L2: number;
  L4: number;
  tapDrill: number;
  handTurns: number;
  wrenchTurns: number;
};

export type BsppSpec = {
  tpi: number;
  pitch: number;
  majorDia: number;
  pitchDia: number;
  minorDia: number;
  threadLength: number;
  undercutDia: number;
  undercutWidth: number;
  spotfaceDia: number;
  tapDrill: number;
};

export type NpsmSpec = {
  tpi: number;
  pitch: number;
  majorDia: number;
  majorMin: number;
  pitchDia: number;
  pitchMin: number;
  minorDia: number;
  threadLength: number;
  tapDrill: number;
  hex: number;
};

export const NPSM_SPECS: Record<string, NpsmSpec> = {
  '1/8 NPSM': { tpi: 27, pitch: 0.941, majorDia: 10.084, majorMin: 9.906, pitchDia: 9.462, pitchMin: 9.370, minorDia: 8.84, threadLength: 10.5, tapDrill: 9.1, hex: 12 },
  '1/4 NPSM': { tpi: 18, pitch: 1.411, majorDia: 13.360, majorMin: 13.132, pitchDia: 12.454, pitchMin: 12.342, minorDia: 11.53, threadLength: 14.0, tapDrill: 11.9, hex: 16 },
  '3/8 NPSM': { tpi: 18, pitch: 1.411, majorDia: 16.815, majorMin: 16.586, pitchDia: 15.890, pitchMin: 15.778, minorDia: 14.98, threadLength: 15.0, tapDrill: 15.3, hex: 19 },
  '1/2 NPSM': { tpi: 14, pitch: 1.814, majorDia: 20.904, majorMin: 20.625, pitchDia: 19.733, pitchMin: 19.596, minorDia: 18.57, threadLength: 19.0, tapDrill: 19.0, hex: 24 },
  '3/4 NPSM': { tpi: 14, pitch: 1.814, majorDia: 26.264, majorMin: 25.984, pitchDia: 25.077, pitchMin: 24.940, minorDia: 23.93, threadLength: 20.0, tapDrill: 24.3, hex: 30 },
  '1 NPSM': { tpi: 11.5, pitch: 2.209, majorDia: 32.842, majorMin: 32.512, pitchDia: 31.417, pitchMin: 31.257, minorDia: 29.97, threadLength: 25.0, tapDrill: 30.5, hex: 36 },
  '1-1/4 NPSM': { tpi: 11.5, pitch: 2.209, majorDia: 41.605, majorMin: 41.275, pitchDia: 40.173, pitchMin: 40.013, minorDia: 38.74, threadLength: 26.0, tapDrill: 39.3, hex: 46 },
  '1-1/2 NPSM': { tpi: 11.5, pitch: 2.209, majorDia: 47.676, majorMin: 47.346, pitchDia: 46.241, pitchMin: 46.081, minorDia: 44.81, threadLength: 27.0, tapDrill: 45.0, hex: 50 },
  '2 NPSM': { tpi: 11.5, pitch: 2.209, majorDia: 59.715, majorMin: 59.385, pitchDia: 58.278, pitchMin: 58.118, minorDia: 56.85, threadLength: 28.0, tapDrill: 57.4, hex: 65 },
  '2-1/2 NPSM': { tpi: 8, pitch: 3.175, majorDia: 72.161, majorMin: 71.679, pitchDia: 70.104, pitchMin: 69.875, minorDia: 68.05, threadLength: 38.0, tapDrill: 68.8, hex: 80 },
  '3 NPSM': { tpi: 8, pitch: 3.175, majorDia: 88.062, majorMin: 87.579, pitchDia: 86.009, pitchMin: 85.781, minorDia: 83.95, threadLength: 40.0, tapDrill: 84.7, hex: 95 },
  '4 NPSM': { tpi: 8, pitch: 3.175, majorDia: 113.436, majorMin: 112.954, pitchDia: 111.374, pitchMin: 111.145, minorDia: 109.32, threadLength: 44.0, tapDrill: 110.1, hex: 120 },
};

export function lookupNpsm(size: string): NpsmSpec {
  const n = size.replace(/\s+/g, ' ').trim();
  if (NPSM_SPECS[n]) return NPSM_SPECS[n];
  const bare = n.replace(/NPSM/gi, '').trim();
  if (NPSM_SPECS[`${bare} NPSM`]) return NPSM_SPECS[`${bare} NPSM`];
  const frac = n.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+)/);
  if (frac && NPSM_SPECS[`${frac[1]} NPSM`]) return NPSM_SPECS[`${frac[1]} NPSM`];
  return NPSM_SPECS['1/2 NPSM'];
}

export type ThreadStation = {
  i: number;
  x: number;
  turn: number;
  label: string;
  plane: 'E0' | 'L1' | 'L2' | 'L4' | 'face' | 'undercut' | 'spotface' | 'end' | 'turn';
  major: number;
  pitchDia: number;
  minor: number;
};

export function nptProfile(pitch: number) {
  const H = 0.866025404 * pitch;
  const trunc = 0.033 * pitch;
  const h = 0.8 * pitch;
  return {
    angle: 60,
    H,
    trunc,
    h,
    halfH: h / 2,
    crestFlat: trunc / Math.tan(Math.PI / 6),
  };
}

export function whitworthProfile(pitch: number) {
  const r = 0.137329 * pitch;
  const h = 0.640327 * pitch;
  return { angle: 55, r, h, halfH: h / 2 };
}

export function diamsFromPitch(E: number, halfH: number) {
  return { major: E + 2 * halfH, pitchDia: E, minor: E - 2 * halfH };
}

function named(plane: ThreadStation['plane'], x: number, E: number, halfH: number, turn: number): ThreadStation {
  const d = diamsFromPitch(E, halfH);
  return { i: -1, x, turn, label: plane, plane, ...d };
}

/** Male NPT: x = 0 at small end. Diameter grows +x/16. One row per turn plus L1/L2/L4. */
export function nptMaleStations(spec: NptSpec): ThreadStation[] {
  const { halfH } = nptProfile(spec.pitch);
  const P = spec.pitch;
  const n = Math.max(1, Math.ceil(spec.L4 / P));
  const rows: ThreadStation[] = [];
  const seen = new Set<string>();

  const push = (row: ThreadStation) => {
    const key = `${row.plane}:${row.x.toFixed(3)}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  push(named('E0', 0, spec.e0, halfH, 0));
  for (let i = 0; i <= n; i++) {
    const x = Math.min(i * P, spec.L4);
    const E = spec.e0 + x * NPT_TAPER;
    const d = diamsFromPitch(E, halfH);
    push({ i, x, turn: i, label: `n=${i}`, plane: 'turn', ...d });
  }
  push(named('L1', spec.L1, spec.e1, halfH, spec.L1 / P));
  push(named('L2', spec.L2, spec.e2, halfH, spec.L2 / P));
  const E4 = spec.e0 + spec.L4 * NPT_TAPER;
  push(named('L4', spec.L4, E4, halfH, spec.L4 / P));

  return rows.sort((a, b) => a.x - b.x || (a.plane === 'turn' ? 1 : -1));
}

/**
 * Female NPT port: x = 0 at the face (mouth). Taper closes inward (−x/16).
 * At the face, pitch diameter = E1 (mates the male gauge plane at hand-tight).
 */
export function nptFemaleStations(spec: NptSpec): ThreadStation[] {
  const { halfH } = nptProfile(spec.pitch);
  const P = spec.pitch;
  const depth = spec.L2;
  const n = Math.max(1, Math.ceil(depth / P));
  const rows: ThreadStation[] = [];
  const seen = new Set<string>();
  const push = (row: ThreadStation) => {
    const key = `${row.plane}:${row.x.toFixed(3)}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  push(named('face', 0, spec.e1, halfH, 0));
  for (let i = 0; i <= n; i++) {
    const x = Math.min(i * P, depth);
    const E = spec.e1 - x * NPT_TAPER;
    const d = diamsFromPitch(E, halfH);
    push({ i, x, turn: i, label: `n=${i}`, plane: 'turn', ...d });
  }
  push(named('L1', spec.L1, spec.e1 - spec.L1 * NPT_TAPER, halfH, spec.L1 / P));
  push(named('L2', spec.L2, spec.e1 - spec.L2 * NPT_TAPER, halfH, spec.L2 / P));
  return rows.sort((a, b) => a.x - b.x || (a.plane === 'turn' ? 1 : -1));
}

/** Parallel BSPP G: diameters constant; stations are axial only. */
export function bsppMaleStations(spec: BsppSpec): ThreadStation[] {
  const P = spec.pitch;
  const n = Math.max(1, Math.ceil(spec.threadLength / P));
  const rows: ThreadStation[] = [
    {
      i: -1, x: -spec.undercutWidth, turn: 0, label: 'undercut', plane: 'undercut',
      major: spec.undercutDia, pitchDia: spec.undercutDia, minor: spec.undercutDia,
    },
  ];
  for (let i = 0; i <= n; i++) {
    const x = Math.min(i * P, spec.threadLength);
    rows.push({
      i, x, turn: i, label: i === 0 ? 'start' : i === n ? 'end' : `n=${i}`,
      plane: i === n ? 'end' : 'turn',
      major: spec.majorDia, pitchDia: spec.pitchDia, minor: spec.minorDia,
    });
  }
  return rows;
}

export function bsppFemaleStations(spec: BsppSpec): ThreadStation[] {
  const P = spec.pitch;
  const n = Math.max(1, Math.ceil(spec.threadLength / P));
  const rows: ThreadStation[] = [
    {
      i: -2, x: -1.5, turn: 0, label: 'spotface', plane: 'spotface',
      major: spec.spotfaceDia, pitchDia: spec.spotfaceDia, minor: spec.spotfaceDia,
    },
  ];
  for (let i = 0; i <= n; i++) {
    const x = Math.min(i * P, spec.threadLength);
    rows.push({
      i, x, turn: i, label: i === 0 ? 'face' : `n=${i}`,
      plane: i === 0 ? 'face' : i === n ? 'end' : 'turn',
      major: spec.majorDia, pitchDia: spec.pitchDia, minor: spec.minorDia,
    });
  }
  return rows;
}

/** Parallel NPSM (ASME B1.20.1): Straight mechanical thread with 30° swivel seat. */
export function npsmMaleStations(spec: NpsmSpec): ThreadStation[] {
  const P = spec.pitch;
  const n = Math.max(1, Math.ceil(spec.threadLength / P));
  const rows: ThreadStation[] = [];
  for (let i = 0; i <= n; i++) {
    const x = Math.min(i * P, spec.threadLength);
    rows.push({
      i, x, turn: i, label: i === 0 ? 'seat' : i === n ? 'shoulder' : `n=${i}`,
      plane: i === n ? 'end' : 'turn',
      major: spec.majorDia, pitchDia: spec.pitchDia, minor: spec.minorDia,
    });
  }
  return rows;
}

/** Parallel NPSM (ASME B1.20.1): Straight internal mechanical thread with 30° swivel seat. */
export function npsmFemaleStations(spec: NpsmSpec): ThreadStation[] {
  const P = spec.pitch;
  const n = Math.max(1, Math.ceil(spec.threadLength / P));
  const rows: ThreadStation[] = [
    {
      i: -1, x: 0, turn: 0, label: '30° seat', plane: 'face',
      major: spec.majorDia, pitchDia: spec.pitchDia, minor: spec.minorDia,
    },
  ];
  for (let i = 0; i <= n; i++) {
    const x = Math.min(i * P, spec.threadLength);
    rows.push({
      i, x, turn: i, label: i === 0 ? 'face' : `n=${i}`,
      plane: i === 0 ? 'face' : i === n ? 'end' : 'turn',
      major: spec.majorDia, pitchDia: spec.pitchDia, minor: spec.tapDrill,
    });
  }
  return rows;
}

export function resolveNptKey(size: string): string | null {
  const raw = size.trim();
  const candidates = [
    raw,
    raw.replace(/^NPT\s+/i, '') + ' NPT',
    'NPT ' + raw.replace(/NPT/gi, '').trim(),
  ];
  const frac = raw.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+)/);
  if (frac) {
    candidates.push(`${frac[1]} NPT`, `NPT ${frac[1]}`);
  }
  return candidates.find(Boolean) ?? null;
}
