import { createHash, timingSafeEqual } from 'crypto';

export function verifyAdminKey(providedKey: string | null | undefined): boolean {
  const secret = process.env.ADMIN_KEY;
  if (!secret || !providedKey) return false;
  const a = createHash('sha256').update(providedKey).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}
