import { Metadata } from 'next';
import { CadEditorClient } from './CadEditorClient';

export const metadata: Metadata = {
  title: '2D AluCAD Parametric Drafting Engine | AluCalc OS',
  description:
    'Browser-based 2D CAD drafting workbench with DXF import/export, parametric snap grid, layered drafting, and engineering geometry tools.',
  alternates: {
    canonical: 'https://www.alucalculator.com/cad-editor/',
  },
  openGraph: {
    title: '2D AluCAD Parametric Drafting Engine | AluCalc OS',
    description:
      'Browser-based 2D CAD drafting workbench with DXF import/export, parametric snap grid, and layered drafting.',
    url: 'https://www.alucalculator.com/cad-editor/',
    type: 'website',
  },
};

export default function CadEditorPage() {
  return <CadEditorClient />;
}
