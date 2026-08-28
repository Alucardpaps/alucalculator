export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { verifyAdminKey } from '@/admin/verify-admin-key';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const adminKeyCookie =
    cookieStore.get('ADMIN_KEY')?.value || cookieStore.get('alu_admin_key')?.value;
  const authHeader = headerStore.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const providedKey = adminKeyCookie || bearerToken;

  if (!verifyAdminKey(providedKey)) {
    notFound();
  }

  return <>{children}</>;
}
