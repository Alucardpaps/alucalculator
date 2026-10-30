import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NodeVisualizerPreview } from '@/components/flow/NodeVisualizerPreview';
import { getSchema } from '@/flow/nodes/Registry';

function renderClean(element: React.ReactElement): string {
  return renderToString(element).replace(/<!--.*?-->/g, '');
}

describe('Flow Node Visualizer Previews & QoL Enhancements', () => {
  it('renders SVG preview for I-Beam Profile (geom-i-beam)', () => {
    const schema = getSchema('geom-i-beam');
    expect(schema).toBeDefined();
    const res = schema!.compute({ h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12 });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'geom-i-beam',
        inputs: { h: 200, b: 100, tw: 5.6, tf: 8.5 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('100 × 200 mm');
    expect(html).toContain('A =');
    expect(html).toContain('Ix =');
  });

  it('renders SVG preview for RHS Hollow Tube (geom-rhs-tube)', () => {
    const schema = getSchema('geom-rhs-tube');
    expect(schema).toBeDefined();
    const res = schema!.compute({ h: 120, b: 80, t: 5 });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'geom-rhs-tube',
        inputs: { H: 120, B: 80, t: 5 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('80 × 120 mm');
    expect(html).toContain('A =');
  });

  it('renders SVG preview for CHS Circular Pipe (geom-chs-pipe)', () => {
    const schema = getSchema('geom-chs-pipe');
    expect(schema).toBeDefined();
    const res = schema!.compute({ d_ext: 114.3, t: 6.3 });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'geom-chs-pipe',
        inputs: { d_ext: 114.3, t: 6.3 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('114 × 114 mm');
  });

  it('renders SVG preview for L-Angle Profile (geom-l-angle)', () => {
    const schema = getSchema('geom-l-angle');
    expect(schema).toBeDefined();
    const res = schema!.compute({ a: 100, b: 100, t: 10 });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'geom-l-angle',
        inputs: { a: 100, b: 100, t: 10 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('100 × 100 mm');
  });

  it('renders SVG preview for Heat Treatment & Hardness Dial (mat-heat-treatment)', () => {
    const schema = getSchema('mat-heat-treatment');
    expect(schema).toBeDefined();
    const res = schema!.compute({
      base_yield: 450,
      base_tensile: 650,
      carbon_pct: 0.45,
      process_type: 0,
      treatment_temp_c: 500,
      soak_time_hours: 2,
    });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'mat-heat-treatment',
        inputs: { treatment_temp_c: 500, process_type: 0 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('HRC');
    expect(html).toContain('Islah (Q&amp;T)');
    expect(html).toContain('Sy =');
  });

  it('renders SVG preview for SDOF Harmonic Vibration (phys-vibration-sdof)', () => {
    const schema = getSchema('phys-vibration-sdof');
    expect(schema).toBeDefined();
    const res = schema!.compute({
      mass: 50,
      stiffness_k: 120000,
      damping_c: 150,
    });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'phys-vibration-sdof',
        inputs: { mass: 50, stiffness_k: 120000 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('Rezonans');
    expect(html).toContain('fn =');
  });

  it('renders Periodic Element Tile (chem-element)', () => {
    const schema = getSchema('chem-element');
    expect(schema).toBeDefined();
    const res = schema!.compute({ element: 'Fe' });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'chem-element',
        inputs: { element: 'Fe' },
        outputs: res,
      })
    );

    expect(html).toContain('Fe');
    expect(html).toContain('Demir');
    expect(html).toContain('26');
    expect(html).toContain('IUPAC Element');
  });

  it('renders Real Gas Compressibility Gauge (chem-gas-laws)', () => {
    const schema = getSchema('chem-gas-laws');
    expect(schema).toBeDefined();
    const res = schema!.compute({
      gas_type: 'N2',
      pressure_kpa: 5000,
      temp_c: 25,
      volume_l: 10,
    });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'chem-gas-laws',
        inputs: {},
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('Z =');
    expect(html).toContain('P_ideal');
  });

  it('renders Solution pH Spectrum Meter (chem-concentration-ph)', () => {
    const schema = getSchema('chem-concentration-ph');
    expect(schema).toBeDefined();
    const res = schema!.compute({
      mode: 0,
      c1_molar: 0.001,
      v1_ml: 100,
      v2_ml: 100,
    });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'chem-concentration-ph',
        inputs: { ph: 3.0 },
        outputs: { ph: 3.0, poh: 11.0, h_conc_molar: 0.001 },
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('pH = 3.00');
    expect(html).toContain('Asidik Çözelti');
  });

  it('renders Kinematics Trajectory Parabola (phys-kinematics)', () => {
    const schema = getSchema('phys-kinematics');
    expect(schema).toBeDefined();
    const res = schema!.compute({
      v0: 30,
      angle_deg: 45,
      time: 2,
    });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'phys-kinematics',
        inputs: { v0: 30, angle_deg: 45 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('v₀=30m/s');
    expect(html).toContain('Menzil R =');
  });

  it('renders Dynamics on Incline with Friction (phys-dynamics-friction)', () => {
    const schema = getSchema('phys-dynamics-friction');
    expect(schema).toBeDefined();
    const res = schema!.compute({
      mass: 60,
      angle_deg: 20,
      force_applied: 400,
      mu_s: 0.4,
      mu_k: 0.3,
    });

    const html = renderClean(
      React.createElement(NodeVisualizerPreview, {
        schemaId: 'phys-dynamics-friction',
        inputs: { mass: 60, angle_deg: 20, force_applied: 400 },
        outputs: res,
      })
    );

    expect(html).toContain('svg');
    expect(html).toContain('60kg');
    expect(html).toContain('Normal Kuvvet N =');
  });
});
