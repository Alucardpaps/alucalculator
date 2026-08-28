import { SCALE_REGISTRY } from './scale-registry';

export function toCanonicalDecimal(value: number, scale: number): string {
  if (!Number.isFinite(value)) {
    throw new Error('NaN/Infinity paketlenemez');
  }
  if (Object.is(value, -0)) {
    value = 0;
  }
  return value.toFixed(scale);
}

export function quantizeRecord(
  rec: Record<string, number>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec)) {
    const scale = SCALE_REGISTRY[k];
    if (scale === undefined) {
      throw new Error(`SCALE_REGISTRY eksik: ${k}`);
    }
    out[k] = toCanonicalDecimal(v, scale);
  }
  return out;
}
