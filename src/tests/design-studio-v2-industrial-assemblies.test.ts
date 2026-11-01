import { describe, it, expect } from 'vitest';
import {
  STUDIO_ASSEMBLY_TEMPLATES,
  buildEnclosedGearboxAssembly,
  buildCncLinearActuatorAssembly,
  buildHydraulicCylinderAssembly,
  buildPillowBlockDrivetrainAssembly,
  buildFlangedPipelineStationAssembly,
  buildRoboticWristAssembly,
  buildAerospaceIsogridRibAssembly,
} from '@/design-studio/v2/QuickDesignStudioTemplates';
import { useDesignStore } from '@/design-studio/designStore';

describe('Design Studio V2 — Industrial Engineering Assemblies', () => {
  it('registers all 7 industrial assembly templates with standards and metadata', () => {
    expect(STUDIO_ASSEMBLY_TEMPLATES.length).toBe(7);

    for (const tpl of STUDIO_ASSEMBLY_TEMPLATES) {
      expect(tpl.id).toBeDefined();
      expect(tpl.nameTr).toBeTruthy();
      expect(tpl.nameEn).toBeTruthy();
      expect(tpl.standard).toBeTruthy();
      expect(tpl.badge).toBeTruthy();
      expect(typeof tpl.build).toBe('function');
    }
  });

  it('builds Enclosed Gearbox Assembly with complete housing, shafts, bearings and gears', () => {
    buildEnclosedGearboxAssembly();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(15);

    const names = parts.map((p) => p.name);
    expect(names.some((n) => n.includes('Gövde Taban Kaidesi'))).toBe(true);
    expect(names.some((n) => n.includes('Pinyon Dişli'))).toBe(true);
    expect(names.some((n) => n.includes('Kademe Çark Dişlisi'))).toBe(true);
    expect(names.some((n) => n.includes('Transmisyon Mili'))).toBe(true);
    expect(names.some((n) => n.includes('Rulman'))).toBe(true);
    expect(names.some((n) => n.includes('Flanş'))).toBe(true);
  });

  it('builds CNC Linear Actuator Assembly with T-slot, dual rails, ball screw and stepper', () => {
    buildCncLinearActuatorAssembly();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(15);

    const names = parts.map((p) => p.name);
    expect(names.some((n) => n.includes('Profil Kaide'))).toBe(true);
    expect(names.some((n) => n.includes('MGN15'))).toBe(true);
    expect(names.some((n) => n.includes('SFU1605'))).toBe(true);
    expect(names.some((n) => n.includes('NEMA 23'))).toBe(true);
    expect(names.some((n) => n.includes('D19L25'))).toBe(true);
  });

  it('builds Hydraulic Cylinder Assembly with honed barrel, chrome rod, clevis and tie rods', () => {
    buildHydraulicCylinderAssembly();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(14);

    const names = parts.map((p) => p.name);
    expect(names.some((n) => n.includes('Silindir Kovanı'))).toBe(true);
    expect(names.some((n) => n.includes('Piston Mili'))).toBe(true);
    expect(names.some((n) => n.includes('Mafsal'))).toBe(true);
    expect(names.some((n) => n.includes('Germe Saplaması'))).toBe(true);
  });

  it('builds Pillow Block Drivetrain Assembly with UCP 205 housings, pulley and coupling', () => {
    buildPillowBlockDrivetrainAssembly();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(12);

    const names = parts.map((p) => p.name);
    expect(names.some((n) => n.includes('UCP 205'))).toBe(true);
    expect(names.some((n) => n.includes('Transmisyon Şaftı'))).toBe(true);
    expect(names.some((n) => n.includes('Kasnağı'))).toBe(true);
    expect(names.some((n) => n.includes('Kaplin'))).toBe(true);
  });

  it('builds Flanged Pipeline Station Assembly with EN 1092-1 flanges, ball valve and studs', () => {
    buildFlangedPipelineStationAssembly();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(18);

    const names = parts.map((p) => p.name);
    expect(names.some((n) => n.includes('Boru'))).toBe(true);
    expect(names.some((n) => n.includes('Flanş'))).toBe(true);
    expect(names.some((n) => n.includes('Vana'))).toBe(true);
    expect(names.some((n) => n.includes('Kol'))).toBe(true);
  });

  it('builds Robotic Wrist Assembly with harmonic drive and ISO 9409-1 flange', () => {
    buildRoboticWristAssembly();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(8);

    const names = parts.map((p) => p.name);
    expect(names.some((n) => n.includes('Harmonik'))).toBe(true);
    expect(names.some((n) => n.includes('Bilek'))).toBe(true);
    expect(names.some((n) => n.includes('ISO 9409-1'))).toBe(true);
  });

  it('builds Aerospace Isogrid Rib Assembly with titanium cleat and flush fasteners', () => {
    buildAerospaceIsogridRibAssembly();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(6);

    const names = parts.map((p) => p.name);
    expect(names.some((n) => n.includes('Isogrid'))).toBe(true);
    expect(names.some((n) => n.includes('Titanyum'))).toBe(true);
    expect(names.some((n) => n.includes('NAS1100'))).toBe(true);
  });
});
