import { describe, it, expect, beforeEach } from 'vitest';
import { EngineeringCopilot } from '@/engine/copilot/copilot';

describe('AeGiS Autonomous Engineering Copilot', () => {
  let copilot: EngineeringCopilot;

  beforeEach(() => {
    copilot = new EngineeringCopilot();
  });

  it('solves VDI 2230 Bolt Tightening Torque in Turkish and English', () => {
    const trResult = copilot.parseAndAssume('M12 8.8 cıvata torku hesapla', '/workspace', 'tr');
    expect(trResult.replyOverride).toContain('VDI 2230');
    expect(trResult.replyOverride).toContain('M12');
    expect(trResult.replyOverride).toContain('N·m');
    expect(trResult.actionUrl).toBe('/bolt-torque/');

    const enResult = copilot.parseAndAssume('calculate bolt torque for M10 class 10.9', '/workspace', 'en');
    expect(enResult.replyOverride).toContain('VDI 2230');
    expect(enResult.replyOverride).toContain('M10');
    expect(enResult.replyOverride).toContain('N·m');
    expect(enResult.actionUrl).toBe('/bolt-torque/');
  });

  it('solves ISO 281 Bearing Life calculation', () => {
    const res = copilot.parseAndAssume('6205 rulman ömrü hesapla 5kn 1500 rpm', '/workspace', 'tr');
    expect(res.replyOverride).toContain('ISO 281');
    expect(res.replyOverride).toContain('L_{10h}');
    expect(res.actionUrl).toBe('/bearings/');
  });

  it('solves Spur Gear geometry and ratio', () => {
    const res = copilot.parseAndAssume('dişli oranı hesapla z1=20 z2=60 modül 3', '/workspace', 'tr');
    expect(res.replyOverride).toContain('ISO 6336');
    expect(res.replyOverride).toContain('3.00 : 1');
    expect(res.actionUrl).toBe('/gears/');
  });

  it('solves ISO 286 Limits and Fits', () => {
    const res = copilot.parseAndAssume('H7/p6 geçme toleransı', '/workspace', 'tr');
    expect(res.replyOverride).toContain('ISO 286');
    expect(res.replyOverride).toContain('Sıkı Geçme');
    expect(res.actionUrl).toBe('/fits/');
  });

  it('solves Structural Beam Deflection and Safety Factor', () => {
    const res = copilot.parseAndAssume('çelik kiriş sehim hesapla 3000 mm açıklık 10000 N yük', '/workspace', 'tr');
    expect(res.replyOverride).toContain('Yapısal Kiriş Mukavemet Analizi');
    expect(res.replyOverride).toContain('Atalet Momenti');
    expect(res.replyOverride).toContain('Maksimum Sehim');
    expect(res.actionUrl).toBe('/beam-deflection/');
  });
});
