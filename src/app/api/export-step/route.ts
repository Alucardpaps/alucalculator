import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: 'STEP export is reserved for AluCalc v5.2 B-Rep kernel. Please use high-resolution binary STL or 1:1 DXF export.',
      version: 'v5.1'
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({
    status: 'v5.2 B-Rep (Roadmap)',
    availableExporters: ['stl-binary', 'stl-ascii', 'dxf-layered']
  });
}
