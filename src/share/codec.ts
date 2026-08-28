import { deflate, Inflate } from 'pako';

export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  const len = bytes.length;
  // Use chunked conversion if large to avoid stack limits
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    bin += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const b64 = typeof btoa !== 'undefined'
    ? btoa(bin)
    : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  if (typeof atob !== 'undefined') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  } else {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
}

export const CHANNEL_LIMITS = {
  qr:   { maxCompressed: 400,        maxDecompressed: 4 * 1024 },
  hash: { maxCompressed: 2 * 1024,   maxDecompressed: 16 * 1024 },
  file: { maxCompressed: 256 * 1024, maxDecompressed: 512 * 1024 },
} as const;

export type Channel = keyof typeof CHANNEL_LIMITS;

export function deflateRaw(utf8Json: string): Uint8Array {
  return deflate(utf8Json, { raw: true, level: 9 });
}

export function safeInflateRaw(
  compressed: Uint8Array,
  channel: Channel,
): string {
  const lim = CHANNEL_LIMITS[channel];
  if (compressed.byteLength > lim.maxCompressed) {
    throw new Error(`sıkışık sınır aşıldı: ${channel}`);
  }

  let total = 0;
  let aborted = false;
  const chunks: Uint8Array[] = [];
  const inflator = new Inflate({ raw: true });

  inflator.onData = (chunk: Uint8Array) => {
    total += chunk.byteLength;
    if (total > lim.maxDecompressed) {
      aborted = true;
      return;
    }
    chunks.push(chunk);
  };

  inflator.push(compressed, true);
  if (aborted) {
    throw new Error('açılma tavanı aşıldı');
  }
  if (inflator.err) {
    throw new Error(String(inflator.msg || inflator.err));
  }

  const combined = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    combined.set(c, off);
    off += c.byteLength;
  }

  const text = new TextDecoder('utf-8', { fatal: true }).decode(combined);
  if (!text.startsWith('{')) {
    throw new Error('JSON nesnesi değil');
  }
  return text;
}
