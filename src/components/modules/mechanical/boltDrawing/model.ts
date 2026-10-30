/**
 * Maps the production-drawing "shop" data (built from computeBoltAssembly results) to the
 * drawing model. No engineering values are computed here.
 */
import { getBoltHeadDimensions, type BoltTypeId } from '@/data/boltHeadStandards';
import type { ShopLike } from '../boltMmSvg';
import type { BoltDrawingModel } from './BoltDrawingSvg';

export type BoltDrawingShop = ShopLike & { pM?: number; pG?: number; FM_kN?: number; dh?: number };

export function toBoltDrawingModel(shop: BoltDrawingShop, boltType: BoltTypeId): BoltDrawingModel {
  const hd = shop.headDim || getBoltHeadDimensions(boltType, shop.metricKey || `M${shop.d}`);
  const d = shop.d, P = shop.p;
  const d3 = shop.d3 > 0 && shop.d3 < d ? Math.min(shop.d3, d - 1.2 * P) : d - 1.226869 * P;
  const isHex = boltType === 'hex_bolt' || boltType === 'heavy_hex' || boltType === 'flange_hex';
  const std = shop.spec?.boltCurrent ?? '';
  const grade = shop.grade;
  const designation = boltType === 'stud_bolt'
    ? `${std ? std + ' – ' : ''}${shop.metricKey ?? `M${d}`}×${shop.L}${grade ? ` – ${grade}` : ''}`
    : `${std ? std + ' – ' : ''}${shop.metricKey ?? `M${d}`}×${shop.L}${grade ? ` – ${grade}` : ''}`;
  const As = (Math.PI / 4) * (((shop.d2 + d3) / 2) ** 2);
  const showDw = shop.dw && boltType !== 'set_screw' && boltType !== 'stud_bolt' && boltType !== 'eye_bolt';
  const notes = `d2 ${shop.d2.toFixed(3)} · d3 ${d3.toFixed(3)} · As ${As.toFixed(1)} mm²${showDw ? ` · dw ${parseFloat(shop.dw!.toFixed(2))}` : ''}`;
  return {
    boltType,
    d, P,
    d2: shop.d2,
    d3,
    L: shop.L,
    b: Math.min(shop.b, shop.L),
    head: {
      k: hd?.k ?? shop.k,
      s: hd?.s ?? (isHex ? shop.s : undefined),
      e: hd?.e ?? (isHex ? shop.e : undefined),
      dw: hd?.dw ?? shop.dw,
      dk: hd?.dk,
      t: hd?.t,
      r: hd?.r ?? shop.r,
      c: hd?.c,
      dc: hd?.dc,
      bm: hd?.bm,
      dp: hd?.dp,
      v: hd?.v,
      f: hd?.f,
      eyeD2: hd?.d2_eye,
      eyeD3: hd?.d3_eye,
      eyeD4: hd?.d4_eye,
      eyeH: hd?.h_eye,
    },
    nut: { m: shop.m, s: shop.s, e: shop.e },
    dh: shop.dh ?? d * 1.1,
    grade,
    threadCallout: shop.threadCallout.replace(/\s+/g, ''),
    designation,
    notes,
    FM_kN: shop.FM_kN,
    pM: shop.pM,
    pG: shop.pG,
  };
}

