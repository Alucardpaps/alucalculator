import { NextRequest, NextResponse } from 'next/server';
import { HeadlessEngine } from '../../../headless-engine/engine';
import { SchemaLoader } from '../../../calculator-system/schema-loader';
import path from 'path';

// No longer forced dynamic as hostinger strictly requires standard SSG compilation.
// POST requests on strictly static domains will theoretically fail without a Node runtime, 
// but this allows the build to succeed.

// Initialize loader globally on the server if not already
let initialized = false;
function ensureInit() {
  if (!initialized) {
    const schemasPath = path.resolve(process.cwd(), 'src/schemas');
    try {
       SchemaLoader.loadSchemas(schemasPath);
       initialized = true;
    } catch(e) {
       console.error("Schema init error", e);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureInit();
    
    // Parse request body
    const body = await req.json();
    const { calculator, payload } = body;
    
    if (!calculator || !payload) {
      return NextResponse.json({ success: false, error: 'Missing calculator ID or payload parameters' }, { status: 400 });
    }

    const engine = new HeadlessEngine();
    const result = engine.execute(calculator, payload);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
