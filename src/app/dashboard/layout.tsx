import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Command Center | Project Intelligence Dashboard — AluCalc OS',
  description: 'Multi-module engineering dashboard for project management, dependency graphs, execution metrics, and truth ledger verification across AluCalc OS workstations.',
  alternates: {
    canonical: 'https://www.alucalculator.com/dashboard',
  },
  openGraph: {
    title: 'Command Center Dashboard | AluCalc OS',
    description: 'Engineering project intelligence dashboard with dependency graphs, execution metrics, and multi-module management.',
    type: 'website',
    url: 'https://www.alucalculator.com/dashboard',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
