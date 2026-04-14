import { NextRequest, NextResponse } from 'next/server';
import { BulkProcessorFSM, BulkPayload } from '@/engine/fsm/BulkProcessorFSM';

/**
 * AluCalc OS v4 - Enterprise Bulk Calculation API
 * Powered by Finite State Machine (BulkProcessorFSM) and the Headless Engine.
 */
export async function POST(req: NextRequest) {
  const resHeaders = {
    'X-AluCalc-RateLimit-Limit': '100',
    'X-AluCalc-RateLimit-Remaining': '99',
    'X-AluCalc-API-Version': 'v4.1.0-PRO'
  };

  try {
    const body: BulkPayload = await req.json();
    if (!body) throw new Error('Request body is required');
    
    // Boot the Finite State Machine to orchestrate this batch
    const fsm = new BulkProcessorFSM(body);
    const result = await fsm.execute();

    if (!result.success) {
         return NextResponse.json({ success: false, error: result.error }, { status: 400, headers: resHeaders });
    }

    return NextResponse.json(result, { status: 200, headers: resHeaders });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: resHeaders });
  }
}

