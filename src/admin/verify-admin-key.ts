export function verifyAdminKey(providedKey: string | null | undefined): boolean {
  const secret = process.env.ADMIN_KEY;
  if (!secret || !providedKey) return false;
  if (typeof secret !== 'string' || typeof providedKey !== 'string') return false;

  // Constant-time character comparison (Edge Runtime + Node.js safe, timing-safe & length-safe)
  const a = String(providedKey);
  const b = String(secret);
  let mismatch = a.length ^ b.length;
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}
