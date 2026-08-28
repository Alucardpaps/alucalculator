import { AluPackage, AluPackageBody, AluPackageSchema, parseUntrusted } from './schema';
import { SCALE_REGISTRY } from './scale-registry';
import { computePackageChecksum } from './checksum';
import { Channel, safeInflateRaw, fromBase64Url, CHANNEL_LIMITS } from './codec';
import { DEFAULT_SOLVER_BUILD, DEFAULT_STANDARDS_PACK } from './export-package';

export type ImportState =
  | { status: 'idle' }
  | { status: 'ready_static'; pkg: AluPackage; warning?: string }
  | { status: 'ready_recalculated'; pkg: AluPackage; drift: Record<string, number>; hasSignificantDrift: boolean }
  | { status: 'failed'; reason: string };

export interface ImportOptions {
  channel: Channel;
  currentSolverBuild?: string;
  currentStandardsPack?: string;
}

export async function importPackage(
  data: string | Uint8Array,
  options: ImportOptions,
): Promise<{ success: true; pkg: AluPackage; warning?: string } | { success: false; reason: string }> {
  try {
    let jsonText = '';

    if (options.channel === 'hash' || options.channel === 'qr') {
      const base64Str = typeof data === 'string' ? data.replace(/^#lz=/, '').trim() : '';
      if (!base64Str) {
        return { success: false, reason: 'Geçersiz veya boş paket verisi.' };
      }
      const bytes = fromBase64Url(base64Str);
      jsonText = safeInflateRaw(bytes, options.channel);
    } else if (options.channel === 'file') {
      if (typeof data === 'string') {
        const text = data.trim();
        if (text.startsWith('{')) {
          if (new TextEncoder().encode(text).byteLength > CHANNEL_LIMITS.file.maxDecompressed) {
            return { success: false, reason: 'Dosya boyutu tavanını aştı (max 512KB).' };
          }
          jsonText = text;
        } else {
          // Might be base64url or compressed bytes
          const bytes = fromBase64Url(text);
          jsonText = safeInflateRaw(bytes, 'file');
        }
      } else {
        // Uint8Array
        if (data.byteLength > CHANNEL_LIMITS.file.maxDecompressed) {
          return { success: false, reason: 'Dosya boyutu tavanını aştı (max 512KB).' };
        }
        // Try UTF-8 string first
        try {
          const str = new TextDecoder('utf-8', { fatal: true }).decode(data).trim();
          if (str.startsWith('{')) {
            jsonText = str;
          } else {
            jsonText = safeInflateRaw(data, 'file');
          }
        } catch {
          jsonText = safeInflateRaw(data, 'file');
        }
      }
    }

    if (!jsonText || !jsonText.startsWith('{')) {
      return { success: false, reason: 'JSON formatı geçersiz: nesne ile başlamalı.' };
    }

    // Step 3: parseUntrusted (drops __proto__, constructor, prototype)
    const rawParsed = parseUntrusted(jsonText);
    if (!rawParsed || typeof rawParsed !== 'object') {
      return { success: false, reason: 'Paket ayrıştırma başarısız.' };
    }

    // Step 4: Strict Zod validation
    const parsed = AluPackageSchema.safeParse(rawParsed);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return {
        success: false,
        reason: `Şema uyumsuzluğu: ${firstIssue?.path.join('.') || 'kök'} - ${firstIssue?.message || 'Geçersiz veri'}`,
      };
    }

    const pkg = parsed.data;

    // Step 5: Check every key in inputs and outputs against SCALE_REGISTRY
    for (const key of Object.keys(pkg.inputs)) {
      if (SCALE_REGISTRY[key] === undefined) {
        return {
          success: false,
          reason: `SCALE_REGISTRY'de tanımlanmamış girdi anahtarı: ${key}`,
        };
      }
    }

    for (const key of Object.keys(pkg.outputs)) {
      if (SCALE_REGISTRY[key] === undefined) {
        return {
          success: false,
          reason: `SCALE_REGISTRY'de tanımlanmamış çıktı anahtarı: ${key}`,
        };
      }
    }

    // Step 6: Verify Checksum equality
    const { checksum, ...body } = pkg;
    const computedChecksum = await computePackageChecksum(body as AluPackageBody);
    if (computedChecksum !== checksum) {
      return {
        success: false,
        reason: `Paket bütünlük hatası: Checksum uyuşmuyor (${checksum} !== ${computedChecksum})`,
      };
    }

    // Step 7: Compare solver_build and standards_pack (Warning if different, fail-open on versions)
    const currentBuild = options.currentSolverBuild || DEFAULT_SOLVER_BUILD;
    const currentStandards = options.currentStandardsPack || DEFAULT_STANDARDS_PACK;
    let warning: string | undefined;

    if (pkg.solver_build !== currentBuild || pkg.standards_pack !== currentStandards) {
      warning = `Farklı solver sürümüyle oluşturulmuş paket (Paket: ${pkg.solver_build} / ${pkg.standards_pack}, Mevcut: ${currentBuild} / ${currentStandards}). Sonuçlar statik olarak doğrulanmıştır.`;
    }

    return {
      success: true,
      pkg,
      warning,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      reason: errorMsg,
    };
  }
}

export function checkRecalculationDrift(
  pkg: AluPackage,
  freshOutputs: Record<string, number>,
): {
  drift: Record<string, number>;
  hasSignificantDrift: boolean;
} {
  const drift: Record<string, number> = {};
  const fpTol = Number(pkg.fp_tol) || 0.00000001;
  let hasSignificantDrift = false;

  for (const [key, recordedStr] of Object.entries(pkg.outputs)) {
    const recordedVal = Number(recordedStr);
    const freshVal = freshOutputs[key];

    if (freshVal !== undefined && Number.isFinite(freshVal)) {
      const diff = Math.abs(freshVal - recordedVal);
      drift[key] = diff;
      if (diff > fpTol) {
        hasSignificantDrift = true;
      }
    }
  }

  return {
    drift,
    hasSignificantDrift,
  };
}
