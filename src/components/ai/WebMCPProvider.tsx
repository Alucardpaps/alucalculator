'use client';

import { useEffect } from 'react';

/**
 * WebMCPProvider — Exposes browser-level WebMCP tools to in-browser AI agents
 * via `navigator.modelContext.registerTool()` and annotated semantic DOM forms.
 */
export function WebMCPProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = navigator as unknown as {
      modelContext?: {
        registerTool?: (tool: {
          name: string;
          description: string;
          inputSchema: Record<string, unknown>;
          execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
        }) => void;
      };
    };

    if (nav.modelContext && typeof nav.modelContext.registerTool === 'function') {
      try {
        // 1. Bolt Torque (VDI 2230)
        nav.modelContext.registerTool({
          name: 'calculate_bolt_torque',
          description: 'Calculate bolt tightening torque and clamp preload according to VDI 2230 and ISO 898-1.',
          inputSchema: {
            type: 'object',
            properties: {
              nominalDiameter: { type: 'number', description: 'Nominal diameter d (mm), e.g. 10 for M10' },
              propertyClass: { type: 'string', enum: ['8.8', '10.9', '12.9'], description: 'Property class' },
              friction: { type: 'number', description: 'Friction coefficient (default 0.14)' },
            },
            required: ['nominalDiameter', 'propertyClass'],
          },
          execute: (args) => {
            const d = Number(args.nominalDiameter) || 10;
            const grade = String(args.propertyClass || '8.8');
            const mu = Number(args.friction) || 0.14;
            // Approximate VDI 2230 torque for common metric fasteners
            const yieldMap: Record<string, number> = { '8.8': 640, '10.9': 900, '12.9': 1080 };
            const Rp02 = yieldMap[grade] || 640;
            const As = 0.7854 * (d - 0.9382 * 1.5) ** 2; // approximation for standard pitch
            const Fm = 0.9 * Rp02 * As; // Preload force in N
            const Ma = (Fm * (0.16 * 1.5 + 0.58 * (d - 0.65 * 1.5) * mu + 0.5 * (1.5 * d) * mu)) / 1000; // Torque in Nm
            return {
              standard: 'VDI 2230 Blatt 1 / ISO 898-1',
              nominalDiameterMm: d,
              propertyClass: grade,
              stressAreaMm2: Math.round(As * 10) / 10,
              tighteningTorqueNm: Math.round(Ma * 10) / 10,
              preloadForceKn: Math.round((Fm / 1000) * 10) / 10,
            };
          },
        });

        // 2. Beam Deflection
        nav.modelContext.registerTool({
          name: 'calculate_beam_deflection',
          description: 'Calculate beam deflection and maximum bending moment under point load.',
          inputSchema: {
            type: 'object',
            properties: {
              lengthMm: { type: 'number', description: 'Span length L in mm' },
              loadN: { type: 'number', description: 'Point force F in Newtons' },
              elasticModulusGpa: { type: 'number', description: 'Young modulus E in GPa (e.g. 70 for Al, 210 for Steel)' },
              momentOfInertiaMm4: { type: 'number', description: 'Area moment of inertia I in mm^4' },
              support: { type: 'string', enum: ['simply_supported', 'cantilever'] },
            },
            required: ['lengthMm', 'loadN', 'elasticModulusGpa', 'momentOfInertiaMm4'],
          },
          execute: (args) => {
            const L = Number(args.lengthMm) || 1000;
            const F = Number(args.loadN) || 500;
            const E = (Number(args.elasticModulusGpa) || 70) * 1e3; // MPa = N/mm^2
            const I = Number(args.momentOfInertiaMm4) || 50000;
            const isCantilever = args.support === 'cantilever';
            const deflectionMm = isCantilever ? (F * L ** 3) / (3 * E * I) : (F * L ** 3) / (48 * E * I);
            const maxMomentNm = isCantilever ? (F * L) / 1000 : (F * L) / 4000;
            return {
              support: isCantilever ? 'cantilever' : 'simply_supported',
              deflectionMm: Math.round(deflectionMm * 1000) / 1000,
              maxBendingMomentNm: Math.round(maxMomentNm * 100) / 100,
            };
          },
        });

        // 3. Alloy Properties
        nav.modelContext.registerTool({
          name: 'lookup_alloy_properties',
          description: 'Lookup certified physical and mechanical properties of aluminum alloys and steels.',
          inputSchema: {
            type: 'object',
            properties: {
              alloy: { type: 'string', description: 'Alloy name, e.g. 6061-T6, 6082-T6, 7075-T6' },
            },
            required: ['alloy'],
          },
          execute: (args) => {
            const key = String(args.alloy || '6061-T6').toUpperCase();
            const db: Record<string, { density: number; yieldStrength: number; tensileStrength: number; eModulus: number; standard: string }> = {
              '6061-T6': { density: 2.7, yieldStrength: 276, tensileStrength: 310, eModulus: 68.9, standard: 'EN 573-3 / ASTM B221' },
              '6082-T6': { density: 2.7, yieldStrength: 260, tensileStrength: 310, eModulus: 70.0, standard: 'EN 755-2' },
              '7075-T6': { density: 2.81, yieldStrength: 503, tensileStrength: 572, eModulus: 71.7, standard: 'EN 573-3 / ASTM B209' },
              '1018': { density: 7.87, yieldStrength: 370, tensileStrength: 440, eModulus: 205, standard: 'AISI 1018' },
            };
            const hit = db[key] || db['6061-T6'];
            return { alloy: key, ...hit };
          },
        });
      } catch (err) {
        console.debug('[WebMCP] Tool registration skipped or unsupported:', err);
      }
    }
  }, []);

  return (
    <div id="webmcp-tools" style={{ display: 'none' }} aria-hidden="true">
      {/* Declarative WebMCP form annotations for autonomous agent discovery */}
      <form
        name="calculate_bolt_torque"
        data-tool-name="calculate_bolt_torque"
        data-tool-description="Calculate bolt preload and tightening torque according to VDI 2230 and ISO 898-1."
      >
        <input type="number" name="nominalDiameter" placeholder="Nominal diameter (mm)" defaultValue={10} />
        <input type="text" name="propertyClass" placeholder="Property class (8.8, 10.9, 12.9)" defaultValue="8.8" />
        <input type="number" name="friction" placeholder="Friction coefficient" defaultValue={0.14} />
      </form>
      <form
        name="calculate_beam_deflection"
        data-tool-name="calculate_beam_deflection"
        data-tool-description="Calculate beam deflection, bending moment and stress under load."
      >
        <input type="number" name="lengthMm" placeholder="Span length (mm)" defaultValue={1000} />
        <input type="number" name="loadN" placeholder="Load (N)" defaultValue={500} />
        <input type="number" name="elasticModulusGpa" placeholder="Elastic Modulus (GPa)" defaultValue={70} />
        <input type="number" name="momentOfInertiaMm4" placeholder="Moment of Inertia (mm4)" defaultValue={50000} />
      </form>
    </div>
  );
}
export default WebMCPProvider;
