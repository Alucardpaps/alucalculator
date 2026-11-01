import { describe, it, expect, vi } from 'vitest';
import { MODULE_LINK_REGISTRY, getModuleLinkInfo } from '@/flow/core/moduleLinks';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { useDesignStore } from '@/design-studio/designStore';
import { useCutStore } from '@/store/useCutStore';

describe('Flow Module Links & Cross-Module Bridge', () => {
  it('registers all core engineering nodes with valid routes and metadata', () => {
    const expectedSchemas = [
      'mech-gear-spur',
      'mech-gear-helical',
      'mech-bearing-life',
      'mech-belt-drive',
      'mech-chain-drive',
      'mech-column-buckling',
      'mech-beam-deflection',
      'mech-hydraulic-cylinder',
      'mech-weld-joint',
      'mech-bolt-stress',
      'mech-spring',
      'mech-shaft',
      'mech-torsion',
      'mech-sheet-metal',
      'mech-fit',
      'mech-pressure-vessel',
      'export-cad-dxf',
    ];

    for (const schemaId of expectedSchemas) {
      const link = MODULE_LINK_REGISTRY[schemaId];
      expect(link, `Missing link for ${schemaId}`).toBeDefined();
      expect(link.moduleRoute).toMatch(/^\//);
      expect(link.moduleTitleTr).toBeTruthy();
    }
  });

  it('serializes input parameters into query params for spur gear deep link', () => {
    const info = getModuleLinkInfo(
      'mech-gear-spur',
      { module: 4, teethPinion: 18, teethGear: 54, faceWidth: 40, pressureAngle: 20 },
      { pitchDiaPinion: 72, pitchDiaGear: 216, centerDistance: 144 }
    );

    expect(info).not.toBeNull();
    expect(info?.href).toContain('/gears?');
    expect(info?.href).toContain('m=4');
    expect(info?.href).toContain('z1=18');
    expect(info?.href).toContain('z2=54');
    expect(info?.href).toContain('b=40');
  });

  it('serializes input parameters for bearing life deep link', () => {
    const info = getModuleLinkInfo(
      'mech-bearing-life',
      { innerDia: 35, outerDia: 72, width: 17, speedRpm: 1500, radialLoad: 8000, axialLoad: 2000 },
      { lifeHoursL10h: 24500 }
    );

    expect(info).not.toBeNull();
    expect(info?.href).toContain('/bearings?');
    expect(info?.href).toContain('d=35');
    expect(info?.href).toContain('D=72');
    expect(info?.href).toContain('B=17');
    expect(info?.href).toContain('rpm=1500');
  });

  it('serializes input parameters for beam deflection deep link', () => {
    const info = getModuleLinkInfo(
      'mech-beam-deflection',
      { length: 2500, force: 7500, elasticModulus: 210000, momentOfInertia: 2000000 },
      { deflection: 3.8 }
    );

    expect(info).not.toBeNull();
    expect(info?.href).toContain('/beam-deflection?');
    expect(info?.href).toContain('L=2500');
    expect(info?.href).toContain('F=7500');
  });

  it('exports calculated spur gear pair directly into 3D Design Studio via CrossModuleBridge', () => {
    const spurLink = MODULE_LINK_REGISTRY['mech-gear-spur'];
    expect(spurLink.supports3DStudio).toBe(true);
    expect(typeof spurLink.executeExport3D).toBe('function');

    const res = spurLink.executeExport3D!(
      { module: 3, teethPinion: 20, teethGear: 40, faceWidth: 30, pressureAngle: 20 },
      { centerDistance: 90 }
    );

    expect(res.success).toBe(true);
    expect(res.message).toContain('3D Tasarım Stüdyosu');

    // Verify useDesignStore received the parts
    const parts = useDesignStore.getState().parts;
    const gearParts = parts.filter((p) => p.kind === 'gear-blank');
    expect(gearParts.length).toBeGreaterThanOrEqual(2);

    // Verify useAssemblyStore received the components
    const assemblyComponents = Object.values(useAssemblyStore.getState().components);
    const assemblyGears = assemblyComponents.filter((c) => c.type === 'gear');
    expect(assemblyGears.length).toBeGreaterThanOrEqual(2);
  });

  it('exports calculated bearing race directly into 3D Design Studio', () => {
    const bearingLink = MODULE_LINK_REGISTRY['mech-bearing-life'];
    expect(bearingLink.supports3DStudio).toBe(true);

    const res = bearingLink.executeExport3D!(
      { innerDia: 25, outerDia: 52, width: 15 },
      {}
    );

    expect(res.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const bearingPart = parts.find((p) => p.kind === 'bearing-race');
    expect(bearingPart).toBeDefined();
    expect(bearingPart?.params.innerDiameter).toBe(25);
    expect(bearingPart?.params.diameter).toBe(52);
  });

  it('exports stepped shaft into 3D Design Studio', () => {
    const shaftLink = MODULE_LINK_REGISTRY['mech-shaft'];
    expect(shaftLink.supports3DStudio).toBe(true);

    const res = shaftLink.executeExport3D!(
      { diameter: 45, length: 700, torque: 400 },
      {}
    );

    expect(res.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const shaftPart = parts.find((p) => p.kind === 'keyway-shaft');
    expect(shaftPart).toBeDefined();
    expect(shaftPart?.params.diameter).toBe(45);
    expect(shaftPart?.params.length).toBe(700);
  });

  it('exports bolt fastener pair into 3D Design Studio', () => {
    const boltLink = MODULE_LINK_REGISTRY['mech-bolt-stress'];
    expect(boltLink.supports3DStudio).toBe(true);

    const res = boltLink.executeExport3D!(
      { diameter: 16, clampingForce: 50000 },
      {}
    );

    expect(res.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const boltPart = parts.find((p) => p.kind === 'hex-bolt');
    const nutPart = parts.find((p) => p.kind === 'hex-nut');
    expect(boltPart).toBeDefined();
    expect(nutPart).toBeDefined();
  });

  it('exports CAD cut parts to 1D Cutting Optimizer store', () => {
    const cadLink = MODULE_LINK_REGISTRY['export-cad-dxf'];
    expect(cadLink.supportsCuttingOptimizer).toBe(true);

    const res = cadLink.executeExportCutting!({}, {});
    expect(res.success).toBe(true);

    const pending = useCutStore.getState().pendingParts;
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].length).toBe(1200);
  });
});

import { renderToString } from 'react-dom/server';
import React from 'react';
import { NodeVisualizerPreview } from '@/components/flow/NodeVisualizerPreview';

describe('NodeVisualizerPreview SVG Blueprint Rendering', () => {
  const cleanHtml = (component: React.ReactElement) => renderToString(component).replace(/<!-- -->/g, '');

  it('renders live SVG for spur gear pair', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-gear-spur',
        inputs: { module: 3, teethPinion: 20, teethGear: 40 },
        outputs: { pitchDiaPinion: 60, pitchDiaGear: 120, centerDistance: 90 },
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('z₁=20 / z₂=40');
    expect(html).toContain('a = 90.0 mm');
  });

  it('renders live SVG for column buckling with Euler sine mode shape', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-column-buckling',
        inputs: { lengthMm: 1500, axialLoadN: 20000 },
        outputs: { criticalLoadN: 54000, safetyFactor: 2.7, regime: 'Euler' },
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('polyline');
    expect(html).toContain('Euler Rejimi');
    expect(html).toContain('SF = 2.70');
  });

  it('renders live SVG for beam deflection curve with point load F', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-beam-deflection',
        inputs: { length: 2000, force: 6000 },
        outputs: { deflection: 3.45, maxBendingMoment: 3000 },
        mode: 'full',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('polyline');
    expect(html).toContain('F = 6.0 kN');
    expect(html).toContain('f_max = 3.45 mm');
  });

  it('renders hydraulic cylinder cross-section with push and pull telemetry', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-hydraulic-cylinder',
        inputs: { boreDiameter: 100, rodDiameter: 50, pressureBar: 200 },
        outputs: { pushForceKn: 157.1, pullForceKn: 117.8 },
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('Ø100 mm');
    expect(html).toContain('İtme: 157.1 kN');
    expect(html).toContain('Çekme: 117.8 kN');
  });

  it('renders weld joint fillet throat with EN 1993-1-8 safety factor', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-weld-joint',
        inputs: { throatThickness: 6, weldLength: 120, forceN: 45000 },
        outputs: { safetyFactor: 1.62 },
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('a=6mm');
    expect(html).toContain('SF = 1.62');
  });

  it('renders bolt joint with preload torque and thread lines', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-bolt-stress',
        inputs: { diameter: 14, pitch: 2.0, clampingForce: 35000 },
        outputs: { tighteningTorque: 120 },
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('M14x2');
    expect(html).toContain('M_A = 120.0 N·m');
  });

  it('renders compression spring helical coil with spring rate', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-spring',
        inputs: { wireDiameter: 5, outerDiameter: 40, activeCoils: 10, freeLength: 100 },
        outputs: { springRate: 24.5 },
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('k = 24.50 N/mm');
    expect(html).toContain('L₀ = 100 mm');
  });

  it('renders cylindrical pressure vessel with hoop stress', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-pressure-vessel-code',
        inputs: { innerDiameter: 1200, designPressureMpa: 2.0 },
        outputs: { minWallThickness: 10.5, hoopStress: 114.3 },
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('P = 2 MPa');
    expect(html).toContain('σ_θ = 114.3 MPa');
  });

  it('exports belt drive directly into 3D Design Studio via moduleLinks', () => {
    const beltLink = MODULE_LINK_REGISTRY['mech-belt-drive'];
    expect(beltLink.supports3DStudio).toBe(true);
    expect(typeof beltLink.executeExport3D).toBe('function');

    const res = beltLink.executeExport3D!(
      { d1: 120, d2: 240, C: 480, belt_type: 'v' },
      {}
    );
    expect(res.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const pulleys = parts.filter((p) => p.kind === 'pulley');
    expect(pulleys.length).toBeGreaterThanOrEqual(2);
    expect(parts.some((p) => p.params?.form === 'drive-loop')).toBe(true);
  });

  it('exports chain drive directly into 3D Design Studio via moduleLinks', () => {
    const chainLink = MODULE_LINK_REGISTRY['mech-chain-drive'];
    expect(chainLink.supports3DStudio).toBe(true);
    expect(typeof chainLink.executeExport3D).toBe('function');

    const res = chainLink.executeExport3D!(
      { z1: 17, z2: 51, p: 15.875, C: 420 },
      {}
    );
    expect(res.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const sprockets = parts.filter((p) => p.params?.form === 'sprocket');
    expect(sprockets.length).toBeGreaterThanOrEqual(2);
    expect(parts.some((p) => p.params?.form === 'drive-loop')).toBe(true);
  });

  it('exports planetary gearbox directly into 3D Design Studio via moduleLinks', () => {
    const planetaryLink = MODULE_LINK_REGISTRY['mech-planetary-gear'];
    expect(planetaryLink.supports3DStudio).toBe(true);
    expect(typeof planetaryLink.executeExport3D).toBe('function');

    const res = planetaryLink.executeExport3D!(
      { sun_teeth: 16, planet_teeth: 16, ring_teeth: 48, planet_count: 3, module_mm: 2.5 },
      {}
    );
    expect(res.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBe(5); // 1 sun + 3 planets + 1 ring
    expect(parts[0].name).toContain('Sun');
    expect(parts[4].params?.isInternal).toBe(true);
  });

  it('renders planetary gearbox preview with sun, planets and internal ring gear', () => {
    const html = cleanHtml(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mech-planetary-gear',
        inputs: { sun_teeth: 18, planet_teeth: 18, ring_teeth: 54, planet_count: 3, module_mm: 3 },
        outputs: {},
        mode: 'compact',
      })
    );

    expect(html).toContain('<svg');
    expect(html).toContain('zs=18');
    expect(html).toContain('zp=18');
    expect(html).toContain('zr=54');
    expect(html).toContain('fill-rule="evenodd"');
  });
});

