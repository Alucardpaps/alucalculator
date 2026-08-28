import canonicalize from 'canonicalize';
import type { AluPackageBody } from './schema';

export async function computePackageChecksum(
  body: AluPackageBody,
): Promise<string> {
  const canonicalJson = canonicalize(body);
  if (!canonicalJson) {
    throw new Error('JCS başarısız');
  }
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : crypto);
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API kullanılamıyor');
  }
  const buf = await cryptoObj.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalJson),
  );
  const hex = [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}
