export const dynamic = 'force-static';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    updatedAt: new Date().toISOString(),
    instruments: [
      { id: 'spirit-level', name: 'Digital Spirit Level', status: 'ready', url: '/field?tool=spirit-level' },
      { id: 'bolt-torque', name: 'VDI 2230 Bolt Torque', status: 'ready', url: '/field?tool=bolt-torque-screening' },
      { id: 'tap-drill', name: 'ISO Tap Chart', status: 'ready', url: '/field?tool=tap-drill' },
      { id: 'unit-converter', name: 'Unit Converter', status: 'ready', url: '/field?tool=unit-converter' },
      { id: 'limits-fits', name: 'ISO 286 Limits & Fits', status: 'ready', url: '/field?tool=limits-fits' },
      { id: 'cnc-feeds', name: 'CNC Feeds & Speeds', status: 'ready', url: '/field?tool=cnc-feeds' }
    ],
    quickValues: {
      m8_torque_88_nm: 24.6,
      m10_torque_88_nm: 48.0,
      m12_torque_88_nm: 84.0,
      m16_torque_88_nm: 206.0,
      m8_tap_drill_mm: 6.8,
      m10_tap_drill_mm: 8.5,
      m12_tap_drill_mm: 10.2,
      m16_tap_drill_mm: 14.0
    }
  });
}
