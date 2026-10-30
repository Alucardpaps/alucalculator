/**
 * Deterministic ZIP (PKZIP) writer.
 * Timestamps are zeroed. Uses raw DEFLATE via pako — no wall-clock, no extra fields.
 * Layer: export (packages existing payloads, does not recompute math).
 */

import { deflate } from 'pako';

export interface ZipEntry {
    name: string;
    data: string | Uint8Array;
}

function crc32(buf: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let b = 0; b < 8; b++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
    const a = new Uint8Array(2);
    a[0] = n & 0xff;
    a[1] = (n >>> 8) & 0xff;
    return a;
}

function u32(n: number): Uint8Array {
    const a = new Uint8Array(4);
    a[0] = n & 0xff;
    a[1] = (n >>> 8) & 0xff;
    a[2] = (n >>> 16) & 0xff;
    a[3] = (n >>> 24) & 0xff;
    return a;
}

function concat(parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of parts) {
        out.set(p, o);
        o += p.length;
    }
    return out;
}

function encodeName(name: string): Uint8Array {
    const safe = name.replace(/\\/g, '/').replace(/^\/+/, '');
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(safe);
    const out = new Uint8Array(safe.length);
    for (let i = 0; i < safe.length; i++) out[i] = safe.charCodeAt(i) & 0x7f;
    return out;
}

function toBytes(data: string | Uint8Array): Uint8Array {
    if (data instanceof Uint8Array) return data;
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(data);
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) out[i] = data.charCodeAt(i) & 0xff;
    return out;
}

export function buildZip(entries: ZipEntry[]): Uint8Array {
    const locals: Uint8Array[] = [];
    const centrals: Uint8Array[] = [];
    let offset = 0;

    for (const entry of entries) {
        const name = encodeName(entry.name);
        const raw = toBytes(entry.data);
        const compressed = deflate(raw, { raw: true, level: 6 }) as Uint8Array;
        const crc = crc32(raw);
        const local = concat([
            new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
            u16(20),
            u16(0),
            u16(8),
            u16(0),
            u16(0),
            u32(crc),
            u32(compressed.length),
            u32(raw.length),
            u16(name.length),
            u16(0),
            name,
            compressed,
        ]);
        const central = concat([
            new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
            u16(20),
            u16(20),
            u16(0),
            u16(8),
            u16(0),
            u16(0),
            u32(crc),
            u32(compressed.length),
            u32(raw.length),
            u16(name.length),
            u16(0),
            u16(0),
            u16(0),
            u16(0),
            u32(0),
            u32(offset),
            name,
        ]);
        locals.push(local);
        centrals.push(central);
        offset += local.length;
    }

    const centralBlob = concat(centrals);
    const eocd = concat([
        new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
        u16(0),
        u16(0),
        u16(entries.length),
        u16(entries.length),
        u32(centralBlob.length),
        u32(offset),
        u16(0),
    ]);

    return concat([...locals, centralBlob, eocd]);
}

export function zipToBlob(entries: ZipEntry[]): Blob {
    const bytes = buildZip(entries);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy.buffer], { type: 'application/zip' });
}
