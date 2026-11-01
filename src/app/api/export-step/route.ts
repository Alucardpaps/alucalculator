import { NextResponse } from 'next/server';
import { APP_MAJOR_MINOR } from '@/config/app';

export const dynamic = 'force-static';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: `STEP export is reserved for AluCalc v${APP_MAJOR_MINOR} B-Rep kernel. Please use high-resolution binary STL or 1:1 DXF export.`,
      version: `v${APP_MAJOR_MINOR}`
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({
    status: `v${APP_MAJOR_MINOR} B-Rep (Roadmap)`,
    availableExporters: ['stl-binary', 'stl-ascii', 'dxf-layered']
  });
}
