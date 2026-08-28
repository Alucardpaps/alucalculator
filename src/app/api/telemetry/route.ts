export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminInboxStore } from '@/admin/inbox-store';
import { TelemetryEvent } from '@/telemetry/events';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: TelemetryEvent[] = body.events || [];

    if (!Array.isArray(events)) {
      return NextResponse.json({ success: false, error: 'Geçersiz veri biçimi.' }, { status: 400 });
    }

    for (const evt of events) {
      if (evt.feature && typeof evt.feature === 'string') {
        adminInboxStore.incrementFeature(evt.feature);
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: events.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Sunucu hatası';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  const counters = adminInboxStore.getFeatureCounters();
  return NextResponse.json({
    success: true,
    counters,
  });
}
