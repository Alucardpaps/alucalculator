/**
 * AluCAD OS — Flow to Dedicated Calculator & Cross-Module Bridge Registry
 * 
 * Maps every Flow schemaId to its dedicated interactive calculator module route,
 * serializes input/output parameters into URL query params for seamless 1-click transfer,
 * and integrates direct CrossModuleBridge actions (3D Design Studio, Assembly, FEA, 1D Cutting).
 */

import { CrossModuleBridge } from '@/system/crossModuleBridge';

export interface ModuleLinkMetadata {
  schemaId: string;
  moduleRoute: string;
  moduleTitleTr: string;
  moduleTitleEn: string;
  category: 'mechanical' | 'structural' | 'fasteners' | 'fluid' | 'manufacturing' | 'cad' | 'materials';
  standard?: string;
  supports3DStudio?: boolean;
  supportsCuttingOptimizer?: boolean;
  supportsFea?: boolean;
  supportsCadDynamicBlock?: boolean;
  dynamicBlockId?: string;
  /** Serializes node inputs & outputs to query parameters */
  buildQueryParams?: (inputs: Record<string, any>, outputs: Record<string, any>) => Record<string, string | number>;
  /** Executes CrossModuleBridge action to 3D Design Studio or Assembly Store */
  executeExport3D?: (inputs: Record<string, any>, outputs: Record<string, any>) => { success: boolean; message: string };
  /** Executes CrossModuleBridge action to 1D Cutting Optimizer */
  executeExportCutting?: (inputs: Record<string, any>, outputs: Record<string, any>) => { success: boolean; message: string };
  /** Executes CrossModuleBridge action to Structural FEA */
  executeExportFea?: (inputs: Record<string, any>, outputs: Record<string, any>) => { success: boolean; message: string };
  /** Executes CrossModuleBridge action to 2D CAD Dynamic Block */
  executeExportCadDynamicBlock?: (inputs: Record<string, any>, outputs: Record<string, any>) => { success: boolean; message: string };
}

export const MODULE_LINK_REGISTRY: Record<string, ModuleLinkMetadata> = {
  // 1. Spur Gear
  'mech-gear-spur': {
    schemaId: 'mech-gear-spur',
    moduleRoute: '/gears',
    moduleTitleTr: 'Evolvent Düz Dişli Çark Hesabı',
    moduleTitleEn: 'Involute Spur Gear Design',
    category: 'mechanical',
    standard: 'ISO 6336:2019 / DIN 3962',
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_involute_gear',
    buildQueryParams: (inputs, _outputs) => ({
      m: inputs.module_mm ?? inputs.module ?? 3,
      z1: inputs.pinion_teeth ?? inputs.teethPinion ?? 20,
      z2: inputs.gear_teeth ?? inputs.teethGear ?? 40,
      b: inputs.face_width_mm ?? inputs.faceWidth ?? 30,
      alpha: inputs.pressure_angle_deg ?? inputs.pressureAngle ?? 20,
    }),
    executeExport3D: (inputs, _outputs) => {
      const m = Number(inputs.module_mm ?? inputs.module) || 3;
      const z1 = Number(inputs.pinion_teeth ?? inputs.teethPinion) || 20;
      const z2 = Number(inputs.gear_teeth ?? inputs.teethGear) || 40;
      const b = Number(inputs.face_width_mm ?? inputs.faceWidth) || 30;
      const alpha = Number(inputs.pressure_angle_deg ?? inputs.pressureAngle) || 20;

      CrossModuleBridge.exportGearsTo3D([
        { name: `Pinyon Dişli z=${z1}`, teeth: z1, module: m, faceWidth: b, pressureAngle: alpha },
        { name: `Çark Dişli z=${z2}`, teeth: z2, module: m, faceWidth: b, pressureAngle: alpha },
      ], { switchWindow: true });

      return { success: true, message: `${z1}x${z2} dişli çifti 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const m = Number(inputs.module_mm ?? inputs.module) || 3;
      const z1 = Number(inputs.pinion_teeth ?? inputs.teethPinion) || 20;
      const z2 = Number(inputs.gear_teeth ?? inputs.teethGear) || 40;
      const b = Number(inputs.face_width_mm ?? inputs.faceWidth) || 30;
      const alpha = Number(inputs.pressure_angle_deg ?? inputs.pressureAngle) || 20;

      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_involute_gear', {
        module: m,
        teeth: z1,
        teeth2: z2,
        faceWidth: b,
        pressureAngle: alpha,
        helixAngle: 0,
      }, { switchWindow: true });
    },
  },

  // 2. Helical Gear
  'mech-gear-helical': {
    schemaId: 'mech-gear-helical',
    moduleRoute: '/gears',
    moduleTitleTr: 'Helis Dişli Çark Mekanizması',
    moduleTitleEn: 'Helical Gear Transmission',
    category: 'mechanical',
    standard: 'ISO 6336:2019 / DIN 3960',
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_involute_gear',
    buildQueryParams: (inputs, _outputs) => ({
      m: inputs.module_mm ?? inputs.normalModule ?? inputs.module ?? 3,
      z1: inputs.pinion_teeth ?? inputs.teethPinion ?? 21,
      z2: inputs.gear_teeth ?? inputs.teethGear ?? 45,
      beta: inputs.helix_angle_deg ?? inputs.helixAngle ?? 15,
      b: inputs.face_width_mm ?? inputs.faceWidth ?? 35,
    }),
    executeExport3D: (inputs, _outputs) => {
      const mn = Number(inputs.module_mm ?? inputs.normalModule ?? inputs.module) || 3;
      const z1 = Number(inputs.pinion_teeth ?? inputs.teethPinion) || 21;
      const z2 = Number(inputs.gear_teeth ?? inputs.teethGear) || 45;
      const beta = Number(inputs.helix_angle_deg ?? inputs.helixAngle) || 15;
      const b = Number(inputs.face_width_mm ?? inputs.faceWidth) || 35;

      CrossModuleBridge.exportGearsTo3D([
        { name: `Helis Pinyon z=${z1}`, teeth: z1, module: mn, faceWidth: b, helixAngle: beta },
        { name: `Helis Çark z=${z2}`, teeth: z2, module: mn, faceWidth: b, helixAngle: -beta },
      ], { switchWindow: true });

      return { success: true, message: `Helis dişli çifti (β=${beta}°) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const mn = Number(inputs.module_mm ?? inputs.normalModule ?? inputs.module) || 3;
      const z1 = Number(inputs.pinion_teeth ?? inputs.teethPinion) || 21;
      const z2 = Number(inputs.gear_teeth ?? inputs.teethGear) || 45;
      const beta = Number(inputs.helix_angle_deg ?? inputs.helixAngle) || 15;
      const b = Number(inputs.face_width_mm ?? inputs.faceWidth) || 35;

      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_involute_gear', {
        module: mn,
        teeth: z1,
        teeth2: z2,
        faceWidth: b,
        helixAngle: beta,
      }, { switchWindow: true });
    },
  },

  // 3. Bearing Life ISO 281
  'mech-bearing-life': {
    schemaId: 'mech-bearing-life',
    moduleRoute: '/bearings',
    moduleTitleTr: 'Rulman Ömür ve Güvenilirlik Analizi',
    moduleTitleEn: 'Rolling Bearing Rating Life',
    category: 'mechanical',
    standard: 'ISO 281:2007 / DIN ISO 281',
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_skf_bearing',
    buildQueryParams: (inputs, _outputs) => ({
      d: inputs.innerDia || 30,
      D: inputs.outerDia || 62,
      B: inputs.width || 16,
      C: inputs.dynCapacity || 19500,
      C0: inputs.statCapacity || 11200,
      fr: inputs.radialLoad || 5000,
      fa: inputs.axialLoad || 1500,
      rpm: inputs.speedRpm || 1450,
    }),
    executeExport3D: (inputs, _outputs) => {
      const d = Number(inputs.innerDia) || 30;
      const D = Number(inputs.outerDia) || 62;
      const B = Number(inputs.width) || 16;

      CrossModuleBridge.exportBearingTo3D({
        innerDiameter: d,
        outerDiameter: D,
        depth: B,
        bearingType: inputs.bearingType || inputs.type || 'deep-groove-ball',
        needleType: inputs.needleType,
        name: `Rulman Ø${d}xØ${D} B=${B}`,
        switchWindow: true,
      });

      return { success: true, message: `ISO 281 Rulman bileziği (Ø${d}/Ø${D}) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const d = Number(inputs.innerDia) || 30;
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_skf_bearing', {
        designation: d === 30 ? '6206' : d === 25 ? '6205' : '6205',
        bore: d,
      }, { switchWindow: true });
    },
  },

  // 4. Belt Drive ISO 4184
  'mech-belt-drive': {
    schemaId: 'mech-belt-drive',
    moduleRoute: '/belt-drive',
    moduleTitleTr: 'V-Kayış Tahrik Sistemi Boyutlandırma',
    moduleTitleEn: 'V-Belt Drive Transmission',
    category: 'mechanical',
    standard: 'ISO 4184 / DIN 2215',
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_v_belt_pulley',
    buildQueryParams: (inputs, _outputs) => ({
      d1: inputs.d1 ?? inputs.driverDia ?? 100,
      d2: inputs.d2 ?? inputs.drivenDia ?? 250,
      C: inputs.C ?? inputs.centerDistance ?? 500,
      rpm1: inputs.rpm ?? inputs.driverSpeed ?? 1450,
      power: inputs.power_kw ?? inputs.powerKw ?? 7.5,
    }),
    executeExport3D: (inputs, _outputs) => {
      const d1 = Number(inputs.d1 ?? inputs.driverDia) || 100;
      const d2 = Number(inputs.d2 ?? inputs.drivenDia) || 250;
      const C = Number(inputs.C ?? inputs.centerDistance) || 500;
      const beltType = String(inputs.belt_type || inputs.beltType || 'v');
      CrossModuleBridge.exportBeltDriveTo3D(d1, d2, C, 20, {
        beltType: beltType === 'timing' ? 'timing' : 'classical-v',
        switchWindow: true,
      });
      return { success: true, message: `Kayış-kasnak tahrik sistemi (Ø${d1} / Ø${d2}, C=${C}mm) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const d1 = Number(inputs.d1 ?? inputs.driverDia) || 140;
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_v_belt_pulley', {
        pitchDiameter: d1,
        grooves: 2,
        profile: 'SPA',
      }, { switchWindow: true });
    },
  },

  // 5. Chain Drive ISO 606
  'mech-chain-drive': {
    schemaId: 'mech-chain-drive',
    moduleRoute: '/chain-drive',
    moduleTitleTr: 'Rulolu Zincir Mekanizması ve Dişli Hesabı',
    moduleTitleEn: 'Roller Chain Drive System',
    category: 'mechanical',
    standard: 'ISO 606 / DIN 8187',
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_roller_sprocket',
    buildQueryParams: (inputs, _outputs) => ({
      z1: inputs.z1 ?? inputs.teethDriver ?? 19,
      z2: inputs.z2 ?? inputs.teethDriven ?? 38,
      p: inputs.p ?? inputs.chainPitch ?? 15.875,
      C: inputs.C ?? inputs.centerDistance ?? 450,
      rpm1: inputs.rpm ?? inputs.speedDriver ?? 1450,
      power: inputs.power_kw ?? inputs.powerKw ?? 5.5,
    }),
    executeExport3D: (inputs, _outputs) => {
      const z1 = Number(inputs.z1 ?? inputs.teethDriver) || 19;
      const z2 = Number(inputs.z2 ?? inputs.teethDriven) || 38;
      const p = Number(inputs.p ?? inputs.chainPitch) || 15.875;
      const C = Number(inputs.C ?? inputs.centerDistance) || 450;
      CrossModuleBridge.exportChainDriveTo3D(z1, z2, p, C, {
        chainSize: inputs.chain_no ? String(inputs.chain_no) : undefined,
        switchWindow: true,
      });
      return { success: true, message: `Zincir dişli mekanizması (z₁=${z1}, z₂=${z2}, p=${p}mm) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const z1 = Number(inputs.z1 ?? inputs.teethDriver) || 19;
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_roller_sprocket', {
        teeth: z1,
        chainSize: inputs.chain_no ? String(inputs.chain_no) : '08B',
      }, { switchWindow: true });
    },
  },

  // 5b. Planetary Gearbox
  'mech-planetary-gear': {
    schemaId: 'mech-planetary-gear',
    moduleRoute: '/planetary-gearbox',
    moduleTitleTr: 'Episiklik / Planet Dişli Mekanizması',
    moduleTitleEn: 'Epicyclic Planetary Gearbox',
    category: 'mechanical',
    standard: 'ISO 6336 / DIN 3960 / Müller',
    supports3DStudio: true,
    buildQueryParams: (inputs, _outputs) => ({
      zs: inputs.sun_teeth ?? inputs.sunTeeth ?? inputs.zs ?? 18,
      zp: inputs.planet_teeth ?? inputs.planetTeeth ?? inputs.zp ?? 18,
      zr: inputs.ring_teeth ?? inputs.ringTeeth ?? inputs.zr ?? 54,
      N: inputs.planet_count ?? inputs.planetCount ?? inputs.N ?? 3,
      m: inputs.module_mm ?? inputs.module ?? inputs.m ?? 3,
    }),
    executeExport3D: (inputs, _outputs) => {
      const zs = Number(inputs.sun_teeth ?? inputs.sunTeeth ?? inputs.zs) || 18;
      const zp = Number(inputs.planet_teeth ?? inputs.planetTeeth ?? inputs.zp) || 18;
      const zr = Number(inputs.ring_teeth ?? inputs.ringTeeth ?? inputs.zr) || (zs + 2 * zp);
      const N = Number(inputs.planet_count ?? inputs.planetCount ?? inputs.N) || 3;
      const m = Number(inputs.module_mm ?? inputs.module ?? inputs.m) || 3;
      CrossModuleBridge.exportPlanetaryTo3D({
        sunTeeth: zs,
        planetTeeth: zp,
        ringTeeth: zr,
        planetCount: N,
        module: m,
        switchWindow: true,
      });
      return { success: true, message: `Planet dişli takımı (zs=${zs}, zp=${zp}, zr=${zr}, N=${N}) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
  },

  'planetary-gearbox': {
    schemaId: 'planetary-gearbox',
    moduleRoute: '/planetary-gearbox',
    moduleTitleTr: 'Episiklik / Planet Dişli Mekanizması',
    moduleTitleEn: 'Epicyclic Planetary Gearbox',
    category: 'mechanical',
    standard: 'ISO 6336 / DIN 3960 / Müller',
    supports3DStudio: true,
    buildQueryParams: (inputs, _outputs) => ({
      zs: inputs.sun_teeth ?? inputs.sunTeeth ?? inputs.zs ?? 18,
      zp: inputs.planet_teeth ?? inputs.planetTeeth ?? inputs.zp ?? 18,
      zr: inputs.ring_teeth ?? inputs.ringTeeth ?? inputs.zr ?? 54,
      N: inputs.planet_count ?? inputs.planetCount ?? inputs.N ?? 3,
      m: inputs.module_mm ?? inputs.module ?? inputs.m ?? 3,
    }),
    executeExport3D: (inputs, _outputs) => {
      const zs = Number(inputs.sun_teeth ?? inputs.sunTeeth ?? inputs.zs) || 18;
      const zp = Number(inputs.planet_teeth ?? inputs.planetTeeth ?? inputs.zp) || 18;
      const zr = Number(inputs.ring_teeth ?? inputs.ringTeeth ?? inputs.zr) || (zs + 2 * zp);
      const N = Number(inputs.planet_count ?? inputs.planetCount ?? inputs.N) || 3;
      const m = Number(inputs.module_mm ?? inputs.module ?? inputs.m) || 3;
      CrossModuleBridge.exportPlanetaryTo3D({
        sunTeeth: zs,
        planetTeeth: zp,
        ringTeeth: zr,
        planetCount: N,
        module: m,
        switchWindow: true,
      });
      return { success: true, message: `Planet dişli takımı (zs=${zs}, zp=${zp}, zr=${zr}, N=${N}) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
  },

  // 6. Column Buckling
  'mech-column-buckling': {
    schemaId: 'mech-column-buckling',
    moduleRoute: '/column-buckling',
    moduleTitleTr: 'Kolon Burkulma ve Kritik Yük Analizi',
    moduleTitleEn: 'Column Buckling & Critical Load',
    category: 'structural',
    standard: 'Euler / Tetmajer / EN 1993-1-1',
    supportsFea: true,
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_foundation_column',
    buildQueryParams: (inputs, _outputs) => ({
      L: inputs.lengthMm || 1500,
      P: inputs.axialLoadN || 25000,
      E: inputs.elasticModulusMpa || 210000,
      I: inputs.momentOfInertiaMm4 || 800000,
      A: inputs.areaMm2 || 1200,
      K: inputs.endConditionK || 1.0,
    }),
    executeExportFea: (_inputs, _outputs) => {
      CrossModuleBridge.extractAssemblyStructuralAnalysis();
      if (typeof window !== 'undefined') window.location.href = '/fea/';
      return { success: true, message: 'Kolon verisi FEA Çözümleyicisine aktarıldı.' };
    },
    executeExport3D: (inputs, _outputs) => {
      const L = Number(inputs.lengthMm) || 1500;
      const A = Number(inputs.areaMm2) || 1200;
      const side = Math.max(20, Math.round(Math.sqrt(A)));
      CrossModuleBridge.exportBeamTo3D({
        sectionType: 'box',
        width: side,
        height: side,
        length: L,
        name: `Burkulma Kolonu ${side}x${side} L=${L}mm`,
        switchWindow: true,
      });
      return { success: true, message: `Kolon profili (${side}x${side}x${L}mm) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const L = Number(inputs.lengthMm) || 3500;
      const A = Number(inputs.areaMm2) || 160000;
      const side = Math.max(100, Math.round(Math.sqrt(A)));
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_foundation_column', {
        width: side,
        depth: side,
        height: L,
      }, { switchWindow: true });
    },
  },

  // 7. Beam Deflection
  'mech-beam-deflection': {
    schemaId: 'mech-beam-deflection',
    moduleRoute: '/beam-deflection',
    moduleTitleTr: 'Kiriş Sehim ve Eğilme Gerilmesi Analizi',
    moduleTitleEn: 'Beam Deflection & Bending Stress',
    category: 'structural',
    standard: 'Euler-Bernoulli / Eurocode 3',
    supportsFea: true,
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_steel_beam',
    buildQueryParams: (inputs, _outputs) => ({
      L: inputs.length || 2000,
      F: inputs.force || 5000,
      E: inputs.elasticModulus || 210000,
      I: inputs.momentOfInertia || 1500000,
      support: inputs.supportType || 'pinned-roller',
    }),
    executeExportFea: (_inputs, _outputs) => {
      CrossModuleBridge.extractAssemblyStructuralAnalysis();
      if (typeof window !== 'undefined') window.location.href = '/fea/';
      return { success: true, message: 'Kiriş yükleme durumu FEA modülüne aktarıldı.' };
    },
    executeExport3D: (inputs, _outputs) => {
      const L = Number(inputs.length) || 2000;
      CrossModuleBridge.exportBeamTo3D({
        sectionType: 'I-beam',
        width: 80,
        height: 120,
        length: L,
        name: `Yapısal Kiriş I-120 L=${L}mm`,
        switchWindow: true,
      });
      return { success: true, message: `I-Kiriş profili (120x80x${L}mm) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const L = Number(inputs.length) || 3000;
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_steel_beam', {
        designation: 'IPE200',
        length: L,
      }, { switchWindow: true });
    },
  },

  // 8. Hydraulic Cylinder
  'mech-hydraulic-cylinder': {
    schemaId: 'mech-hydraulic-cylinder',
    moduleRoute: '/fluid-dynamics',
    moduleTitleTr: 'Hidrolik Silindir ve İtme/Çekme Kuvveti',
    moduleTitleEn: 'Hydraulic Cylinder Sizing',
    category: 'fluid',
    standard: 'ISO 6020 / DIN 24554',
    supports3DStudio: false,
    buildQueryParams: (inputs, _outputs) => ({
      D: inputs.boreDiameter || 80,
      d: inputs.rodDiameter || 45,
      p: inputs.pressureBar || 160,
      L: inputs.strokeMm || 500,
    }),
  },

  // 9. Weld Joint EN 1993-1-8
  'mech-weld-joint': {
    schemaId: 'mech-weld-joint',
    moduleRoute: '/welding',
    moduleTitleTr: 'Kaynaklı Birleşim Hesabı (Yönsel Metot)',
    moduleTitleEn: 'Welded Joint Strength (EN 1993-1-8)',
    category: 'mechanical',
    standard: 'EN 1993-1-8 §4.5.3.2',
    supports3DStudio: false,
    buildQueryParams: (inputs, _outputs) => ({
      a: inputs.throatThickness || 5,
      L: inputs.weldLength || 100,
      F: inputs.forceN || 30000,
      fu: inputs.steelUltimateStrength || 430,
    }),
  },

  // 10. Bolt Stress VDI 2230
  'mech-bolt-stress': {
    schemaId: 'mech-bolt-stress',
    moduleRoute: '/bolt-torque',
    moduleTitleTr: 'Metrik Cıvata Ön Yük ve Sıkma Torku',
    moduleTitleEn: 'High-Strength Bolt Preload & Torque',
    category: 'fasteners',
    standard: 'VDI 2230 / ISO 898-1',
    supports3DStudio: true,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_fastener',
    buildQueryParams: (inputs, _outputs) => ({
      dia: inputs.diameter || 12,
      pitch: inputs.pitch || 1.75,
      force: inputs.clampingForce || 25000,
      mu: inputs.frictionCoeff || 0.14,
    }),
    executeExport3D: (inputs, _outputs) => {
      const d = Number(inputs.diameter) || 12;
      const sizeStr = `M${Math.round(d)}`;
      CrossModuleBridge.exportBoltsTo3D({
        size: sizeStr,
        length: 50,
        propertyClass: '8.8',
        switchWindow: true,
      });
      return { success: true, message: `${sizeStr} Altıköşe Cıvata-Somun 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const d = Number(inputs.diameter) || 12;
      const sizeStr = `M${Math.round(d)}`;
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_fastener', {
        size: sizeStr,
        length: 60,
        headType: 'hex',
      }, { switchWindow: true });
    },
  },

  // 11. Spring Design
  'mech-spring': {
    schemaId: 'mech-spring',
    moduleRoute: '/advanced-spring',
    moduleTitleTr: 'Helisel Bası Yayı Tasarımı',
    moduleTitleEn: 'Helical Compression Spring Design',
    category: 'mechanical',
    standard: 'DIN EN 13906-1',
    supports3DStudio: false,
    buildQueryParams: (inputs, _outputs) => ({
      d: inputs.wireDiameter || 4,
      D: inputs.outerDiameter || 32,
      n: inputs.activeCoils || 8,
      L0: inputs.freeLength || 80,
      F1: inputs.loadForce || 350,
    }),
  },

  // 12. Power & Torque
  'mech-power-torque': {
    schemaId: 'mech-power-torque',
    moduleRoute: '/motor-selection',
    moduleTitleTr: 'Güç, Tork ve Devir Bağıntıları',
    moduleTitleEn: 'Electric Motor Power, Torque & Speed',
    category: 'mechanical',
    standard: 'IEC 60034-1 / DIN',
    supports3DStudio: false,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_electric_motor',
    buildQueryParams: (inputs, _outputs) => ({
      P: inputs.powerKw || 7.5,
      rpm: inputs.speedRpm || 1450,
    }),
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const p = Number(inputs.powerKw) || 7.5;
      const frame = p >= 11 ? '160M' : p >= 7.5 ? '132M' : p >= 4 ? '112M' : p >= 2.2 ? '90L' : '80M';
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_electric_motor', {
        frameSize: frame,
        mounting: 'B3',
      }, { switchWindow: true });
    },
  },

  // 13. Pressure Vessel
  'mech-pressure-vessel-code': {
    schemaId: 'mech-pressure-vessel-code',
    moduleRoute: '/pressure-vessel',
    moduleTitleTr: 'Silindirik Basınçlı Kap Et Kalınlığı',
    moduleTitleEn: 'Cylindrical Pressure Vessel Shell',
    category: 'fluid',
    standard: 'EN 13445-3 / ASME Section VIII',
    supports3DStudio: false,
    supportsCadDynamicBlock: true,
    dynamicBlockId: 'dyn_pipe_flange',
    buildQueryParams: (inputs, _outputs) => ({
      D: inputs.innerDiameter || 1000,
      P: inputs.designPressureMpa || 1.6,
      f: inputs.allowableStressMpa || 140,
    }),
    executeExportCadDynamicBlock: (inputs, _outputs) => {
      const d = Number(inputs.innerDiameter) || 100;
      const dn = d >= 200 ? 'DN200' : d >= 150 ? 'DN150' : d >= 100 ? 'DN100' : 'DN80';
      return CrossModuleBridge.exportSolverToDynamicBlock('dyn_pipe_flange', {
        nominalDiameter: dn,
        pressureRating: 'PN16',
      }, { switchWindow: true });
    },
  },
  'mech-pressure-vessel': {
    schemaId: 'mech-pressure-vessel',
    moduleRoute: '/pressure-vessel',
    moduleTitleTr: 'İnce Cidarlı Basınçlı Kap Gerilmeleri',
    moduleTitleEn: 'Thin-Walled Pressure Vessel',
    category: 'fluid',
    standard: 'ASME Section VIII Div 1',
    supports3DStudio: false,
    buildQueryParams: (inputs, _outputs) => ({
      D: inputs.innerDiameter || 800,
      P: inputs.internalPressure || 1.2,
      t: inputs.wallThickness || 8,
    }),
  },

  // 14. Shaft Design & Torsion
  'mech-shaft': {
    schemaId: 'mech-shaft',
    moduleRoute: '/shafts',
    moduleTitleTr: 'Transmisyon Mili Mukavemeti ve Kama Hesabı',
    moduleTitleEn: 'Transmission Shaft & Keyway (DIN 743)',
    category: 'mechanical',
    standard: 'DIN 743 / DIN 6885',
    supports3DStudio: true,
    buildQueryParams: (inputs, _outputs) => ({
      d: inputs.diameter || 40,
      T: inputs.torque || 350,
      L: inputs.length || 600,
    }),
    executeExport3D: (inputs, _outputs) => {
      const d = Number(inputs.diameter) || 40;
      const L = Number(inputs.length) || 600;
      CrossModuleBridge.exportShaftTo3D({
        diameter: d,
        length: L,
        name: `Transmisyon Mili Ø${d} L=${L}mm`,
        switchWindow: true,
      });
      return { success: true, message: `Kademeli kamalı mil (Ø${d}x${L}mm) 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
  },
  'mech-torsion': {
    schemaId: 'mech-torsion',
    moduleRoute: '/shafts',
    moduleTitleTr: 'Mil Burulma Gerilmesi ve Dönme Açısı',
    moduleTitleEn: 'Circular Shaft Torsion & Shear',
    category: 'mechanical',
    standard: 'DIN 743',
    supports3DStudio: true,
    buildQueryParams: (inputs, _outputs) => ({
      d: inputs.diameter || 35,
      T: inputs.torque || 280,
      L: inputs.length || 500,
    }),
    executeExport3D: (inputs, _outputs) => {
      const d = Number(inputs.diameter) || 35;
      const L = Number(inputs.length) || 500;
      CrossModuleBridge.exportShaftTo3D({
        diameter: d,
        length: L,
        name: `Burulma Mili Ø${d} L=${L}mm`,
        switchWindow: true,
      });
      return { success: true, message: `Mil modeli 3D Tasarım Stüdyosu'na aktarıldı.` };
    },
  },

  // 15. Sheet Metal Bending
  'mech-sheet-metal': {
    schemaId: 'mech-sheet-metal',
    moduleRoute: '/sheet-metal',
    moduleTitleTr: 'Sac Metal Büküm Payı ve K-Faktörü',
    moduleTitleEn: 'Sheet Metal Bend Allowance & K-Factor',
    category: 'manufacturing',
    standard: 'DIN 6935 / ISO 7438',
    supports3DStudio: false,
    buildQueryParams: (inputs, _outputs) => ({
      t: inputs.thickness || 2.5,
      r: inputs.innerRadius || 3.0,
      angle: inputs.bendAngle || 90,
      k: inputs.kFactor || 0.33,
    }),
  },

  // 16. Fits & Tolerances ISO 286
  'mech-fit': {
    schemaId: 'mech-fit',
    moduleRoute: '/fits-tolerances',
    moduleTitleTr: 'ISO Tolerans ve Geçme Hesabı',
    moduleTitleEn: 'Fits & Tolerances (ISO 286)',
    category: 'manufacturing',
    standard: 'ISO 286-1 / DIN 7154',
    supports3DStudio: false,
    buildQueryParams: (inputs, _outputs) => ({
      d: inputs.nominalDiameter || 40,
      hole: inputs.holeGrade || 'H7',
      shaft: inputs.shaftGrade || 'h6',
    }),
  },

  // 17. Combined Stress & Mohr Circle
  'mech-combined-stress': {
    schemaId: 'mech-combined-stress',
    moduleRoute: '/strength-analysis',
    moduleTitleTr: 'Bileşik Gerilme & von Mises Kriteri',
    moduleTitleEn: 'Combined Stress & von Mises Equivalent',
    category: 'structural',
    standard: 'von Mises / Tresca',
    supportsFea: true,
    buildQueryParams: (inputs, _outputs) => ({
      sx: inputs.sigmaX || 80,
      sy: inputs.sigmaY || 20,
      txy: inputs.tauXY || 45,
    }),
  },
  'mech-mohr-3d': {
    schemaId: 'mech-mohr-3d',
    moduleRoute: '/strength-analysis',
    moduleTitleTr: '3 Boyutlu Mohr Çemberi ve Asal Gerilmeler',
    moduleTitleEn: '3D Mohr Circle & Principal Stresses',
    category: 'structural',
    standard: 'Rankine / Tresca / von Mises',
    supportsFea: true,
    buildQueryParams: (inputs, _outputs) => ({
      s1: inputs.sigma1 || 120,
      s2: inputs.sigma2 || 40,
      s3: inputs.sigma3 || -30,
    }),
  },

  // 18. CAD DXF Export & Profile
  'export-cad-dxf': {
    schemaId: 'export-cad-dxf',
    moduleRoute: '/cad-editor',
    moduleTitleTr: 'AutoCAD DXF R12 Vektör Çizimi',
    moduleTitleEn: 'AutoCAD DXF R12 Vector Blueprint',
    category: 'cad',
    standard: 'AutoCAD R12 (AC1009)',
    supportsCuttingOptimizer: true,
    supports3DStudio: true,
    executeExportCutting: (_inputs, _outputs) => {
      CrossModuleBridge.exportProfilesToCuttingOptimizer([
        {
          id: `cut-flow-${Date.now()}`,
          label: 'Flow CAD Çıktı Profili',
          length: 1200,
          qty: 4,
          material: 'Alüminyum 6061-T6',
          crossSection: '40x40 T-Kanal',
        },
      ], true);
      return { success: true, message: 'CAD profil parçaları 1D Kesim Optimizasyonu modülüne gönderildi.' };
    },
  },
};

/**
 * Resolves module deep-link info for a given Flow schemaId and node state.
 */
export function getModuleLinkInfo(
  schemaId: string,
  inputs: Record<string, any> = {},
  outputs: Record<string, any> = {}
): {
  info: ModuleLinkMetadata;
  href: string;
} | null {
  const meta = MODULE_LINK_REGISTRY[schemaId];
  if (!meta) return null;

  const params = meta.buildQueryParams ? meta.buildQueryParams(inputs, outputs) : {};
  const queryParts = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);

  const queryStr = queryParts.join('&');
  const href = queryStr ? `${meta.moduleRoute}?${queryStr}` : meta.moduleRoute;

  return { info: meta, href };
}
