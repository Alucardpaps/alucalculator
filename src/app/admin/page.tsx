export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { AdminDashboard } from '@/admin/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal — AluCalc',
  description: 'AluCalc Admin Portalı ve Operasyonel Durum Paneli',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
