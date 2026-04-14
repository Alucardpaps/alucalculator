import { NextRequest, NextResponse } from 'next/server';
import { CalculatorRegistry } from '../../../calculator-system/registry';
import { SchemaLoader } from '../../../calculator-system/schema-loader';
import path from 'path';

export const dynamic = 'force-static';

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

export async function GET(req: NextRequest) {
  try {
    ensureInit();
    
    const calculators = CalculatorRegistry.listCalculators();
    
    // Return sanitized metadata mapping (stripping raw internal expressions usually for public APIs, but returning full for OS here)
    return NextResponse.json({ success: true, calculators }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
