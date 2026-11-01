export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAiAgentKey } from '@/auth/verify-ai-agent-key';

/**
 * AluCAD OS — AI Agent API Route (Static Export Safe)
 * 
 * In production static export, outputs pre-rendered solver metadata.
 * Live authentication is enforced at the edge via .htaccess and PHP /api/ai/agent/index.php.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers ? request.headers.get('Authorization') : null;
  const customHeader = request.headers ? request.headers.get('X-AI-Agent-Key') : null;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const urlKey = request.nextUrl?.searchParams ? 
    (request.nextUrl.searchParams.get('ai_key') || request.nextUrl.searchParams.get('agent_token')) : null;

  const providedKey = customHeader || bearerToken || urlKey;

  // During static export (when request headers/params are not present), export public solver manifest
  const isBuildTime = !customHeader && !bearerToken && !urlKey;

  if (!isBuildTime && !verifyAiAgentKey(providedKey)) {
    return NextResponse.json(
      {
        success: false,
        status: 'UNAUTHORIZED_AI_AGENT',
        error: 'Valid AI Agent Access Key required to inspect AluCAD OS.',
        auth_methods: [
          'Header: X-AI-Agent-Key: ALUCALC-AGENT-2026-X9Q',
          'Header: Authorization: Bearer ALUCALC-AGENT-2026-X9Q',
          'URL query: ?ai_key=ALUCALC-AGENT-2026-X9Q',
        ],
        documentation: 'https://www.alucalculator.com/llms.txt',
      },
      { status: 401 }
    );
  }

  const solver = request?.nextUrl?.searchParams ? request.nextUrl.searchParams.get('solver') : null;
  const format = request?.nextUrl?.searchParams ? request.nextUrl.searchParams.get('format') : null;

  const catalog = {
    'aerospace-dynamics': {
      name: 'Aerospace & Aerodynamics Suite',
      url: 'https://www.alucalculator.com/aerospace-dynamics/',
      standards: ['ICAO Doc 7488', 'NASA SP-367', 'ISA 1976'],
      description: 'Deterministic ISA 1976 flight envelope, 3D wind tunnel aerodynamic drag (6 benchmark bodies), and NACA 4-digit airfoil polar solver.',
      equations: {
        'Dynamic Pressure': 'q = 0.5 * rho * v^2',
        'Aerodynamic Drag': 'F_D = q * C_D * A',
        'Propulsion Power': 'P = F_D * v (P proportional to v^3)',
        'EV Aero Penalty': 'Energy = (F_D * 100) / (3600 * 0.90) [kWh/100km]',
      },
    },
    'bolt-torque': {
      name: 'Bolt Tightening & Preload Solver',
      url: 'https://www.alucalculator.com/bolt-torque/',
      standards: ['VDI 2230 Blatt 1', 'ISO 898-1', 'DIN EN ISO 4014'],
      description: 'Tightening torque, thread friction mu_th, head friction mu_b, yield utilization nu, and clamp load calculation for metric fasteners (M3-M64).',
    },
    'bearings': {
      name: 'Rolling Bearing Rating Life Solver',
      url: 'https://www.alucalculator.com/bearings/',
      standards: ['ISO 281', 'ISO 76', 'DIN 622'],
      description: 'Equivalent dynamic load P, basic rating life L10, modified life L10h with viscosity ratio kappa and contamination factor a_iso.',
    },
    'fluid-dynamics': {
      name: 'Fluid Dynamics & Pipe Friction Solver',
      url: 'https://www.alucalculator.com/fluid-dynamics/',
      standards: ['ISO 5167', 'Crane TP-410', 'Darcy-Weisbach'],
      description: 'Reynolds number, Colebrook-White implicit friction factor f, hydraulic pressure loss, fitting K-factors, and centrifugal pump sizing.',
    },
    'pressure-vessel': {
      name: 'ASME Pressure Vessel Solver',
      url: 'https://www.alucalculator.com/pressure-vessel/',
      standards: ['ASME BPVC Section VIII Div 1 (UG-27, UG-32)'],
      description: 'Cylindrical and spherical shell minimum thickness, 2:1 ellipsoidal and torispherical head sizing, hydrostatic test pressure.',
    },
    'fits-tolerances': {
      name: 'Fits & Tolerances ISO 286',
      url: 'https://www.alucalculator.com/fits/',
      standards: ['ISO 286-1', 'ISO 286-2', 'DIN 7157'],
      description: 'Deterministic limit deviations (ES, EI, es, ei) and clearance/interference boundaries for hole/shaft fits.',
    },
    'handbook': {
      name: 'Standards & Materials Handbook',
      url: 'https://www.alucalculator.com/handbook/',
      standards: ['EN 573-3', 'EN 755-2', 'ISO 209', 'ASTM B221'],
      description: 'Authoritative mechanical properties for aluminum alloys (6060, 6061, 6082, 7075), structural steels, stainless steels, and plastics.',
    },
  };

  if (format === 'markdown') {
    let md = '# AluCAD OS — Authorized AI Agent Knowledge Stream\n\n';
    md += '**Status:** Access Granted (Key Validated)\n';
    md += '**System:** AluCAD OS Industrial Deterministic Solvers\n\n';
    for (const [id, s] of Object.entries(catalog)) {
      md += `### ${s.name} (\`${id}\`)\n- **URL:** ${s.url}\n- **Standards:** ${s.standards.join(', ')}\n- **Description:** ${s.description}\n\n`;
    }
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-AI-Agent-Status': 'Authorized',
      },
    });
  }

  if (solver && (catalog as any)[solver]) {
    return NextResponse.json(
      {
        success: true,
        status: 'AUTHORIZED_AI_AGENT',
        solver_id: solver,
        data: (catalog as any)[solver],
      },
      {
        headers: { 'X-AI-Agent-Status': 'Authorized' },
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      status: 'AUTHORIZED_AI_AGENT',
      access: 'UNRESTRICTED',
      system: 'AluCAD OS Engineering Operating System',
      version: '5.2.0',
      agent_key_status: 'VALIDATED',
      website_url: 'https://www.alucalculator.com',
      total_solvers: Object.keys(catalog).length,
      catalog,
    },
    {
      headers: { 'X-AI-Agent-Status': 'Authorized' },
    }
  );
}

export async function POST(request: NextRequest) {
  return GET(request);
}
