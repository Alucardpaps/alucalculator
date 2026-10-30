import { describe, it, expect } from 'vitest';
import { calculateFit } from '@/lib/engine/iso286';
import fs from 'fs';
import path from 'path';

describe('Field Tools & Android Widget Verification', () => {
  it('should verify ISO 286 calculations for standard fits', () => {
    // Sliding fit H7/g6 at Ø50 mm
    const fitSliding = calculateFit(50, 'H', 7, 'g', 6);
    expect(fitSliding.fitType).toBe('Clearance');
    expect(fitSliding.holeES).toBe(25);
    expect(fitSliding.holeEI).toBe(0);
    expect(fitSliding.holeMax).toBe(50.025);
    expect(fitSliding.holeMin).toBe(50.000);
    expect(fitSliding.maxClearanceUm).toBeGreaterThan(fitSliding.minClearanceUm);
    expect(fitSliding.minClearanceUm).toBeGreaterThan(0);

    // Light press fit H7/p6 at Ø30 mm
    const fitPress = calculateFit(30, 'H', 7, 'p', 6);
    expect(fitPress.fitType).toBe('Interference');
    expect(fitPress.shaft_ei).toBeGreaterThan(0);
  });

  it('should verify CNC Speeds and Feeds formulation (ISO 3002)', () => {
    const Vc = 300; // m/min (Aluminum)
    const D = 10; // mm
    const z = 3; // flutes
    const fz = 0.08; // mm/tooth
    const ap = 3; // mm
    const ae = 5; // mm
    const kc = 800; // MPa

    // Spindle RPM: n = (1000 * Vc) / (pi * D)
    const rpm = (1000 * Vc) / (Math.PI * D);
    expect(Math.round(rpm)).toBe(9549);

    // Feed rate: vf = n * z * fz
    const vf = rpm * z * fz;
    expect(Math.round(vf)).toBe(2292);

    // MRR: Q = (ap * ae * vf) / 1000 cm3/min
    const mrr = (ap * ae * vf) / 1000;
    expect(Number(mrr.toFixed(1))).toBe(34.4);

    // Cutting power Pc = (Q * kc) / (60000 * 0.8)
    const powerKw = (mrr * kc) / (60000 * 0.8);
    expect(powerKw).toBeGreaterThan(0.5);
    expect(powerKw).toBeLessThan(1.0);
  });

  it('should verify EN 1011-2 welding heat input formula', () => {
    const eta = 0.8; // MIG/MAG
    const U = 24; // V
    const I = 180; // A
    const vCmMin = 25; // cm/min
    const vMmMin = vCmMin * 10; // 250 mm/min

    // Q = eta * (U * I * 60) / (v * 1000)
    const Q = (eta * U * I * 60) / (vMmMin * 1000);
    expect(Number(Q.toFixed(2))).toBe(0.83); // 0.83 kJ/mm
  });

  it('should verify W3C Web App Manifest widgets declaration', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    expect(manifest.widgets).toBeDefined();
    expect(Array.isArray(manifest.widgets)).toBe(true);
    expect(manifest.widgets.length).toBeGreaterThan(0);
    expect(manifest.widgets[0].tag).toBe('alucalc-field-widget');
    expect(manifest.widgets[0].ms_ac_template).toBe('/widgets/field-adaptive-card.json');
  });

  it('should verify field adaptive card template exists', () => {
    const cardPath = path.join(process.cwd(), 'public', 'widgets', 'field-adaptive-card.json');
    expect(fs.existsSync(cardPath)).toBe(true);
    const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
    expect(card.type).toBe('AdaptiveCard');
  });
});
