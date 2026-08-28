import { AluPackage, AluPackageBody, AluPackageSchema } from './schema';
import { quantizeRecord, toCanonicalDecimal } from './decimal';
import { computePackageChecksum } from './checksum';
import { deflateRaw, toBase64Url, CHANNEL_LIMITS } from './codec';

export interface CreatePackageOptions {
  module: string;
  solver_build?: string;
  standards_pack?: string;
  meta: {
    unit_system: 'metric' | 'imperial';
    name?: string;
  };
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  fp_tol?: number;
  created_at?: string;
}

export interface ExportResult {
  pkg: AluPackage;
  jsonString: string;
  compressed: Uint8Array;
  base64Url: string;
  channels: {
    file: { available: boolean; size: number; filename: string };
    hash: { available: boolean; size: number; hashFragment: string | null };
    qr: { available: boolean; size: number; payload: string | null };
  };
}

export function getCurrentIsoWithOffset(date = new Date()): string {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number, size = 2) => String(Math.floor(Math.abs(num))).padStart(size, '0');

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds()) +
    dif +
    pad(tzo / 60) +
    ':' +
    pad(tzo % 60)
  );
}

export const DEFAULT_SOLVER_BUILD = '1.0.0+20260827';
export const DEFAULT_STANDARDS_PACK = 'ISO-ENGINEERING-2026';

export async function exportPackage(
  options: CreatePackageOptions,
): Promise<ExportResult> {
  const quantizedInputs = quantizeRecord(options.inputs);
  const quantizedOutputs = quantizeRecord(options.outputs);
  const fpTolVal = options.fp_tol !== undefined ? options.fp_tol : 0.00000001;
  const fpTolStr = toCanonicalDecimal(fpTolVal, 8);

  const createdAt = options.created_at || getCurrentIsoWithOffset();
  const solverBuild = options.solver_build || DEFAULT_SOLVER_BUILD;
  const standardsPack = options.standards_pack || DEFAULT_STANDARDS_PACK;

  const body: AluPackageBody = {
    v: 1,
    module: options.module,
    solver_build: solverBuild,
    standards_pack: standardsPack,
    meta: {
      unit_system: options.meta.unit_system,
      name: options.meta.name,
    },
    inputs: quantizedInputs,
    outputs: quantizedOutputs,
    fp_tol: fpTolStr,
    created_at: createdAt,
  };

  const checksum = await computePackageChecksum(body);
  const pkg: AluPackage = {
    ...body,
    checksum,
  };

  // Validate strict schema before packaging
  AluPackageSchema.parse(pkg);

  const jsonString = JSON.stringify(pkg);
  const compressed = deflateRaw(jsonString);
  const base64Url = toBase64Url(compressed);

  const hashAvailable = compressed.byteLength <= CHANNEL_LIMITS.hash.maxCompressed;
  const qrAvailable = compressed.byteLength <= CHANNEL_LIMITS.qr.maxCompressed;

  const safeFilename = options.meta.name
    ? `${options.meta.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.alucalc.json`
    : `${options.module}.alucalc.json`;

  return {
    pkg,
    jsonString,
    compressed,
    base64Url,
    channels: {
      file: {
        available: true,
        size: new TextEncoder().encode(jsonString).byteLength,
        filename: safeFilename,
      },
      hash: {
        available: hashAvailable,
        size: compressed.byteLength,
        hashFragment: hashAvailable ? `#lz=${base64Url}` : null,
      },
      qr: {
        available: qrAvailable,
        size: compressed.byteLength,
        payload: qrAvailable ? base64Url : null,
      },
    },
  };
}
