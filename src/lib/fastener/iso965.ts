/** ISO 965-1 medium class 6g (external) / 6H (internal). Values in millimetres. */

type Band = { pMax: number; es: number; Td: number; Td2: number; TD1: number; TD2: number };

/** Pitch bands: es, Td (major 6g), Td2 (pitch 6g), TD1 (minor 6H), TD2 (pitch 6H). */
const BANDS: Band[] = [
  { pMax: 0.5, es: 0.020, Td: 0.090, Td2: 0.056, TD1: 0.125, TD2: 0.085 },
  { pMax: 0.8, es: 0.024, Td: 0.125, Td2: 0.071, TD1: 0.160, TD2: 0.112 },
  { pMax: 1.0, es: 0.026, Td: 0.150, Td2: 0.080, TD1: 0.190, TD2: 0.125 },
  { pMax: 1.25, es: 0.028, Td: 0.170, Td2: 0.090, TD1: 0.212, TD2: 0.140 },
  { pMax: 1.5, es: 0.032, Td: 0.190, Td2: 0.100, TD1: 0.236, TD2: 0.150 },
  { pMax: 1.75, es: 0.034, Td: 0.212, Td2: 0.112, TD1: 0.265, TD2: 0.170 },
  { pMax: 2.0, es: 0.038, Td: 0.236, Td2: 0.118, TD1: 0.300, TD2: 0.180 },
  { pMax: 2.5, es: 0.042, Td: 0.280, Td2: 0.132, TD1: 0.355, TD2: 0.200 },
  { pMax: 3.0, es: 0.048, Td: 0.335, Td2: 0.150, TD1: 0.425, TD2: 0.224 },
  { pMax: 3.5, es: 0.053, Td: 0.375, Td2: 0.170, TD1: 0.475, TD2: 0.250 },
  { pMax: 4.0, es: 0.060, Td: 0.425, Td2: 0.190, TD1: 0.530, TD2: 0.280 },
  { pMax: 5.0, es: 0.071, Td: 0.530, Td2: 0.236, TD1: 0.670, TD2: 0.355 },
  { pMax: 99, es: 0.080, Td: 0.600, Td2: 0.265, TD1: 0.750, TD2: 0.400 },
];

function band(p: number): Band {
  return BANDS.find((b) => p <= b.pMax) ?? BANDS[BANDS.length - 1];
}

export type ThreadLimits = {
  es: number;
  dMax: number;
  dMin: number;
  d2Max: number;
  d2Min: number;
  d3Max: number;
  D1Min: number;
  D1Max: number;
  D2Min: number;
  D2Max: number;
};

export function iso965Limits(d: number, d2: number, d3: number, d1: number, p: number): ThreadLimits {
  const b = band(p);
  const dMax = d - b.es;
  const d2Max = d2 - b.es;
  return {
    es: b.es,
    dMax,
    dMin: dMax - b.Td,
    d2Max,
    d2Min: d2Max - b.Td2,
    d3Max: d3 - b.es,
    D1Min: d1,
    D1Max: d1 + b.TD1,
    D2Min: d2,
    D2Max: d2 + b.TD2,
  };
}
