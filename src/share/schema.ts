import { z } from 'zod';

export const AluPackageSchema = z.object({
  v: z.literal(1),
  module: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  solver_build: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+\+[0-9]{8}$/),
  standards_pack: z.string().min(1).max(64),
  meta: z.object({
    unit_system: z.enum(['metric', 'imperial']),
    name: z.string().max(100).optional(),
  }).strict(),
  inputs: z.record(z.string().max(50), z.string().max(30)),
  outputs: z.record(z.string().max(50), z.string().max(30)),
  fp_tol: z.string().regex(/^[0-9]+(\.[0-9]+)?$/),
  checksum: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  created_at: z.string().datetime({ offset: true }),
}).strict();

export type AluPackage = z.infer<typeof AluPackageSchema>;
export type AluPackageBody = Omit<AluPackage, 'checksum'>;

export function parseUntrusted(jsonStr: string): unknown {
  return JSON.parse(jsonStr, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
}
