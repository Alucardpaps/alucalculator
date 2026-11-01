import { AdminDashboard } from '@/admin/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404: Sayfa Bulunamadı — AluCalc',
  description: 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
