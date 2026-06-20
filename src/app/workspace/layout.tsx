import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '3D Engineering Workspace | Assembly Design & BOM — AluCalc OS',
  description: 'Design, assemble, and analyze mechanical systems in a 3D browser workspace. Component palette, real-time BOM generation, and parametric assembly with engineering-grade precision.',
  alternates: {
    canonical: 'https://www.alucalculator.com/workspace',
  },
  openGraph: {
    title: '3D Engineering Workspace | AluCalc OS',
    description: '3D browser-based assembly workspace with component palette, BOM generation, and parametric engineering tools.',
    type: 'website',
    url: 'https://www.alucalculator.com/workspace',
  },
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
