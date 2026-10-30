'use client';

/**
 * ⚡ INDUSTRIAL DESIGN STUDIO ASSEMBLY TEMPLATES & PATTERN CLONERS
 *
 * Professional, fully realized multi-part engineering assemblies citing ISO/DIN/VDI standards:
 * 1. Industrial Enclosed Gearbox & Transmission Unit (ISO 6336 / DIN 6885)
 * 2. CNC Ball Screw & MGN15 Linear Rail Actuator Axis (ISO 13041)
 * 3. Heavy-Duty Industrial Hydraulic Cylinder & Clevis (ISO 6022)
 * 4. Dual UCP 205 Pillow Blocks & V-Belt Transmission Line (ISO 15 / DIN 2211)
 * 5. High-Pressure Flanged Pipeline Spool & Ball Valve Station (EN 1092-1 / ANSI B16.5)
 * 6. 6-Axis Industrial Robotic Wrist & ISO 9409-1 Tool Flange
 * 7. Aerospace 7075-T6 Isogrid Rib & Ti-6Al-4V Titanium Cleat (VDI 2230)
 */

import { useDesignStore, type DesignPart, type DesignKind } from '@/design-studio/designStore';
import {
  applyCornerBoltPattern,
  applyCenterBore,
  applyLightweightIsogrid,
} from '@/design-studio/directModelingEngine';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';

export interface StudioAssemblyTemplate {
  id: string;
  nameEn: string;
  nameTr: string;
  standard: string;
  badge: string;
  descEn: string;
  descTr: string;
  build: () => void;
}

let partSeq = 0;
function createPart(
  kind: DesignKind,
  name: string,
  color: string,
  params: Record<string, any>,
  position: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  options: Partial<DesignPart> = {}
): DesignPart {
  partSeq++;
  return {
    id: `${kind}-${Date.now().toString(36)}-${partSeq}`,
    kind,
    name,
    color,
    position,
    rotation,
    scale: { x: 1, y: 1, z: 1 },
    params,
    visible: true,
    locked: false,
    parentId: null,
    subAssemblyId: null,
    ...options,
  };
}

/**
 * 1. ⚙️ Endüstriyel İki Kademeli Döküm Redüktör & Şanzıman Ünitesi (ISO 6336 & DIN 6885)
 * Komple döküm gövde, yatak kapakları, pinyon/çark dişli çifti, kamalı miller, rulmanlar ve şeffaf üst kapak.
 */
export function buildEnclosedGearboxAssembly() {
  const store = useDesignStore.getState();
  store.pushHistory();
  store.clearScene();

  const parts: DesignPart[] = [];

  // 1. Döküm Alt Taban Karter Kaidesi (EN-GJL-250) - 210x18x230mm
  const basePart = createPart(
    'box',
    'Gövde Taban Kaidesi 210x18x230 (EN-GJL-250)',
    '#334155',
    { width: 210, height: 18, depth: 230 },
    { x: 0, y: -74, z: 0 }
  );
  const foundationBolts = applyCornerBoltPattern(basePart, 'top', 'M12');
  basePart.holes = foundationBolts;
  parts.push(basePart);

  // 2. Sol ve Sağ Döküm Yatak Duvarları (18x130x210mm)
  parts.push(
    createPart(
      'box',
      'Sol Yatak Kulesi Duvarı 18x130x210 (Döküm)',
      '#334155',
      { width: 18, height: 130, depth: 210 },
      { x: -81, y: 0, z: 0 }
    ),
    createPart(
      'box',
      'Sağ Yatak Kulesi Duvarı 18x130x210 (Döküm)',
      '#334155',
      { width: 18, height: 130, depth: 210 },
      { x: 81, y: 0, z: 0 }
    )
  );

  // 3. Ön ve Arka Gövde Karter Muhafaza Plakaları (144x130x16mm)
  parts.push(
    createPart(
      'box',
      'Ön Gövde Karter Plakası 144x130x16',
      '#475569',
      { width: 144, height: 130, depth: 16 },
      { x: 0, y: 0, z: 102 }
    ),
    createPart(
      'box',
      'Arka Gövde Karter Plakası 144x130x16',
      '#475569',
      { width: 144, height: 130, depth: 16 },
      { x: 0, y: 0, z: -102 }
    )
  );

  // 4. Giriş Pinyon Transmisyon Mili (42CrMo4 - DIN 6885)
  // keyway-shaft: length is along Z default. Rotated around Y by 90deg -> lies along X.
  parts.push(
    createPart(
      'keyway-shaft',
      'Pinyon Giriş Transmisyon Mili Ø20x220 (42CrMo4 - DIN 6885)',
      '#cbd5e1',
      { diameter: 20, length: 220, keyWidth: 6, keyDepth: 3.5 },
      { x: 10, y: 0, z: -35 },
      { x: 0, y: 90, z: 0 }
    )
  );

  // 5. Giriş Pinyon Dişlisi (m=2.5, Z=16, d=40mm, da=45mm)
  // gear-blank: axis is along Y default. Rotated around Z by 90deg -> axis lies along X.
  parts.push(
    createPart(
      'gear-blank',
      'Pinyon Dişli m=2.5 Z=16 d=40mm (ISO 6336)',
      '#38bdf8',
      { module: 2.5, teeth: 16, depth: 30, faceWidth: 30, bore: 20, pressureAngle: 20 },
      { x: 0, y: 0, z: -35 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 6. Çıkış Transmisyon Mili (C45E - DIN 6885)
  // keyway-shaft: lies along X.
  parts.push(
    createPart(
      'keyway-shaft',
      'Çıkış Transmisyon Mili Ø30x230 (C45E - DIN 6885)',
      '#94a3b8',
      { diameter: 30, length: 230, keyWidth: 8, keyDepth: 4 },
      { x: -10, y: 0, z: 35 },
      { x: 0, y: 90, z: 0 }
    )
  );

  // 7. Çıkış Çark Dişlisi (m=2.5, Z=40, d=100mm, da=105mm)
  // Center distance a = (40 + 100)/2 = 70mm. Exactly meshes with pinion at z=0!
  parts.push(
    createPart(
      'gear-blank',
      'Kademe Çark Dişlisi m=2.5 Z=40 d=100mm (ISO 6336)',
      '#22d3ee',
      { module: 2.5, teeth: 40, depth: 26, faceWidth: 26, bore: 30, pressureAngle: 20 },
      { x: 0, y: 0, z: 35 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 8. 4x SKF Rulman Yatakları (Giriş: 6204, Çıkış: 6206)
  // bearing-race: axis is along Y default. Rotated around Z by 90deg -> axis lies along X!
  parts.push(
    createPart(
      'bearing-race',
      'SKF 6204 Rulman Yatağı Sol (ISO 15)',
      '#fbbf24',
      { innerDiameter: 20, outerDiameter: 47, width: 14 },
      { x: -81, y: 0, z: -35 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'bearing-race',
      'SKF 6204 Rulman Yatağı Sağ (ISO 15)',
      '#fbbf24',
      { innerDiameter: 20, outerDiameter: 47, width: 14 },
      { x: 81, y: 0, z: -35 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'bearing-race',
      'SKF 6206 Rulman Yatağı Sol (ISO 15)',
      '#fbbf24',
      { innerDiameter: 30, outerDiameter: 62, width: 16 },
      { x: -81, y: 0, z: 35 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'bearing-race',
      'SKF 6206 Rulman Yatağı Sağ (ISO 15)',
      '#fbbf24',
      { innerDiameter: 30, outerDiameter: 62, width: 16 },
      { x: 81, y: 0, z: 35 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 9. Döküm Rulman Flanş Kapakları
  // cylinder: axis is along Y default. Rotated around Z by 90deg -> axis lies along X.
  parts.push(
    createPart(
      'cylinder',
      'Flanşlı Rulman Kapağı Giriş Sol Ø56x10',
      '#64748b',
      { diameter: 56, length: 10 },
      { x: -94, y: 0, z: -35 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Flanşlı Rulman Kapağı Giriş Sağ Ø56x10',
      '#64748b',
      { diameter: 56, length: 10 },
      { x: 94, y: 0, z: -35 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Flanşlı Rulman Kapağı Çıkış Sol Ø68x10',
      '#64748b',
      { diameter: 68, length: 10 },
      { x: -94, y: 0, z: 35 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Flanşlı Rulman Kapağı Çıkış Sağ Ø68x10',
      '#64748b',
      { diameter: 68, length: 10 },
      { x: 94, y: 0, z: 35 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 10. Şeffaf İnceleme Üst Kapağı (Saydam Açık Mavi) - 210x16x230mm
  parts.push(
    createPart(
      'box',
      'Şeffaf İnceleme Kapağı 210x16x230 (Pleksi / Gözetleme)',
      '#38bdf8',
      { width: 210, height: 16, depth: 230 },
      { x: 0, y: 73, z: 0 },
      { x: 0, y: 0, z: 0 },
      { opacity: 0.35 }
    )
  );

  // 11. Yağ Seviye Göstergesi & Havalık
  parts.push(
    createPart(
      'cylinder',
      'Yağ Seviye Gözetleme Camı & Tapası (G 1/2")',
      '#f59e0b',
      { diameter: 24, length: 14 },
      { x: 40, y: -25, z: 111 },
      { x: 90, y: 0, z: 0 } // Rotated around X -> points forward along Z
    ),
    createPart(
      'cylinder',
      'Şanzıman Havalandırma Tapası (Breather Plug)',
      '#f59e0b',
      { diameter: 18, length: 18 },
      { x: -45, y: 88, z: 0 },
      { x: 0, y: 0, z: 0 } // Points up along Y
    )
  );

  // 12. 4x Kapak Sabitleme Cıvataları (DIN 912 M8x30)
  // hex-bolt: default points down along -Y. Head sits at top of cover!
  const boltPositions = [
    { x: -85, z: -95 },
    { x: 85, z: -95 },
    { x: -85, z: 95 },
    { x: 85, z: 95 },
  ];
  boltPositions.forEach((bp, idx) => {
    parts.push(
      createPart(
        'hex-bolt',
        `Kapak İmbus Cıvatası M8x30 #${idx + 1} (DIN 912)`,
        '#cbd5e1',
        { diameter: 8, length: 30, headDiameter: 13, headHeight: 8 },
        { x: bp.x, y: 81, z: bp.z },
        { x: 0, y: 0, z: 0 }
      )
    );
  });

  useDesignStore.setState({ parts, selectedId: parts[5].id });
  setTimeout(() => triggerCameraView('fit'), 80);
}

/**
 * 2. 🤖 CNC 3-Eksen Vidalı Mil & MGN15 Lineer Kızak Modülü (ISO 13041)
 * 40x80 ağır seri profil yatak, çift MGN15 ray, 4 araba bloğu, SFU1605 vidalı mil, BK12/BF12 yataklar, NEMA 23 motor ve takım tablası.
 */
export function buildCncLinearActuatorAssembly() {
  const store = useDesignStore.getState();
  store.pushHistory();
  store.clearScene();

  const parts: DesignPart[] = [];

  // 1. Ana Taşıyıcı Kaide (40x80 Ağır Alüminyum Profil L=380mm)
  // t-slot: length along Y default. Rotating by 90deg around Z puts length along X, with 80mm face on top!
  parts.push(
    createPart(
      't-slot',
      'Ana Taşıyıcı Profil Kaide 40x80 L=380mm (DIN EN 755-9)',
      '#64748b',
      { specId: '40x80', series: 40, length: 380 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 2. Çift MGN15 Taşlanmış Lineer Ray (L=360mm)
  // Bed top is at y = +20mm. Rails sit on bed from y = 20 to y = 30 (height 10mm, center y = 25).
  parts.push(
    createPart(
      'box',
      'MGN15 Hassas Lineer Kılavuz Rayı Sol L=360mm (HRC 60)',
      '#e2e8f0',
      { width: 360, height: 10, depth: 15 },
      { x: 0, y: 25, z: -25 }
    ),
    createPart(
      'box',
      'MGN15 Hassas Lineer Kılavuz Rayı Sağ L=360mm (HRC 60)',
      '#e2e8f0',
      { width: 360, height: 10, depth: 15 },
      { x: 0, y: 25, z: 25 }
    )
  );

  // 3. 4x MGN15C Bilyalı Lineer Araba Blokları & Toz Keçeleri
  // Sits on top of rails (rails end at y = 30). Block height 14mm -> center at y = 37mm.
  const carriageCoords = [
    { x: -55, z: -25 },
    { x: 55, z: -25 },
    { x: -55, z: 25 },
    { x: 55, z: 25 },
  ];
  carriageCoords.forEach((cc, idx) => {
    parts.push(
      createPart(
        'box',
        `MGN15C Bilyalı Araba Bloğu #${idx + 1}`,
        '#0f172a',
        { width: 44, height: 14, depth: 32 },
        { x: cc.x, y: 37, z: cc.z }
      ),
      createPart(
        'box',
        `Toz Keçesi Ön/Arka #${idx + 1}`,
        '#ef4444',
        { width: 5, height: 14, depth: 32 },
        { x: cc.x > 0 ? cc.x + 24.5 : cc.x - 24.5, y: 37, z: cc.z }
      )
    );
  });

  // 4. CNC İşlenmiş Takım Tablası (170x16x120mm Alüminyum 7075-T6)
  // Sits flush on top of carriage blocks (which top out at y = 44mm). Center at y = 44 + 8 = 52mm!
  const saddle = createPart(
    'box',
    'CNC Takım & Fikstür Tablası 170x16x120 (7075-T6)',
    '#0284c7',
    { width: 170, height: 16, depth: 120 },
    { x: 0, y: 52, z: 0 }
  );
  saddle.holes = [
    { id: 'h1', face: 'top', type: 'clearance', size: 'M6', x: -50, y: -35, depth: 16 },
    { id: 'h2', face: 'top', type: 'clearance', size: 'M6', x: 0, y: -35, depth: 16 },
    { id: 'h3', face: 'top', type: 'clearance', size: 'M6', x: 50, y: -35, depth: 16 },
    { id: 'h4', face: 'top', type: 'clearance', size: 'M6', x: -50, y: 35, depth: 16 },
    { id: 'h5', face: 'top', type: 'clearance', size: 'M6', x: 0, y: 35, depth: 16 },
    { id: 'h6', face: 'top', type: 'clearance', size: 'M6', x: 50, y: 35, depth: 16 },
  ];
  parts.push(saddle);

  // 5. SFU1605 Taşlanmış Vidalı Mil (Ø16x340mm)
  // Centerline height is at y = 35mm (clearance to bed is 15mm, clearance to saddle is 9mm).
  // cylinder: default axis along Y. Rotated around Z by 90deg -> lies along X!
  parts.push(
    createPart(
      'cylinder',
      'SFU1605 Vidalı Mil Ø16x340mm (C7 Taşlanmış)',
      '#f8fafc',
      { diameter: 16, length: 340 },
      { x: 0, y: 35, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 6. Vidalı Mil Bilyalı Somunu & Bağlantı Flanşı
  // Fits snugly under saddle plate (y=44) down to y=26 (height 18mm, center y=35).
  parts.push(
    createPart(
      'box',
      'SFU1605 Bilyalı Somun Gövdesi & Somun Braketi',
      '#475569',
      { width: 44, height: 18, depth: 32 },
      { x: 0, y: 35, z: 0 }
    )
  );

  // 7. BK12 Sabit ve BF12 Serbest Rulman Destek Blokları
  // Mounted on bed ends (bed top y=20, shaft centerline y=35). Block height 34mm (center y = 20 + 17 = 37mm).
  parts.push(
    createPart(
      'box',
      'BK12 Sabit Yatak Bloğu (Çift Eğik Bilyalı)',
      '#1e293b',
      { width: 25, height: 34, depth: 54 },
      { x: -160, y: 37, z: 0 }
    ),
    createPart(
      'box',
      'BF12 Destek Yatak Bloğu (Sabit Bilyalı)',
      '#1e293b',
      { width: 25, height: 34, depth: 54 },
      { x: 160, y: 37, z: 0 }
    )
  );

  // 8. NEMA 23 Yüksek Torklu Step Motor & Montaj Flanşı
  parts.push(
    createPart(
      'box',
      'NEMA 23 Yüksek Torklu Hibrit Step Motor (3.0 Nm)',
      '#090d16',
      { width: 68, height: 57, depth: 57 },
      { x: -225, y: 35, z: 0 }
    ),
    createPart(
      'box',
      'Alüminyum Motor Flanş Braketi (Bellhousing)',
      '#334155',
      { width: 10, height: 58, depth: 58 },
      { x: -186, y: 35, z: 0 }
    )
  );

  // 9. D19L25 Esnek Çeneli Yıldız Kaplin
  parts.push(
    createPart(
      'cylinder',
      'D19L25 Esnek Çeneli Yıldız Kaplin (Boşluksuz)',
      '#38bdf8',
      { diameter: 25, length: 28 },
      { x: -172, y: 35, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  useDesignStore.setState({ parts, selectedId: saddle.id });
  setTimeout(() => triggerCameraView('fit'), 80);
}

/**
 * 3. 🚜 Ağır Hizmet ISO 6022 Hidrolik Silindir & Çatal Mafsal Montajı
 * Honlanmış dikişsiz çelik kovan, ön boğaz yatağı, arka mafsal kulağı, krom piston mili, rot başı ve 4 germe saplaması.
 */
export function buildHydraulicCylinderAssembly() {
  const store = useDesignStore.getState();
  store.pushHistory();
  store.clearScene();

  const parts: DesignPart[] = [];

  // 1. Honlanmış Silindir Kovanı (Ø85/Ø70 L=240mm, Makine Mavisi)
  // tube: default axis along Z. Rotated around Y by 90deg -> lies along X!
  // Front window opens to front (-Z), top stays solid for ports!
  parts.push(
    createPart(
      'tube',
      'Honlanmış Çelik Silindir Kovanı Ø85x240 (St52 BK+S)',
      '#1d4ed8',
      { diameter: 85, wall: 8, length: 240 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 90, z: 0 }
    )
  );

  // 2. Ön Silindir Boğaz Kapağı (95x95x28mm)
  // Barrel ends at x = +120. Front cap sits flush from x = 120 to x = 148 (center x = 134).
  parts.push(
    createPart(
      'box',
      'Ön Silindir Boğaz Kapağı 95x95x28 (Döküm Çelik)',
      '#334155',
      { width: 28, height: 95, depth: 95 },
      { x: 134, y: 0, z: 0 }
    )
  );

  // 3. Arka Silindir Taban Kapağı (95x95x28mm) & Mafsal Kulağı
  // Barrel starts at x = -120. Rear cap sits flush from x = -120 to x = -148 (center x = -134).
  parts.push(
    createPart(
      'box',
      'Arka Silindir Taban Kapağı 95x95x28',
      '#334155',
      { width: 28, height: 95, depth: 95 },
      { x: -134, y: 0, z: 0 }
    ),
    createPart(
      'box',
      'Arka Mafsal Bağlantı Kulağı 44x50x46 (ISO 8132)',
      '#475569',
      { width: 44, height: 50, depth: 46 },
      { x: -170, y: 0, z: 0 }
    ),
    createPart(
      'cylinder',
      'Arka Mafsal Pimi Ø25x56mm (42CrMo4)',
      '#94a3b8',
      { diameter: 25, length: 56 },
      { x: -170, y: 0, z: 0 },
      { x: 90, y: 0, z: 0 } // Rotated around X -> axis along Z!
    )
  );

  // 4. Sert Krom Kaplı Piston Mili (Ø36x260mm)
  // Extends from inside cylinder (x=20) through front cap (x=148) to x=280. Center at x=150.
  // cylinder: default axis along Y. Rotated around Z by 90deg -> lies along X!
  parts.push(
    createPart(
      'cylinder',
      'Sert Krom Kaplı Piston Mili Ø36x260 (20MnV6)',
      '#f8fafc',
      { diameter: 36, length: 260 },
      { x: 150, y: 0, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 5. Rot Başı Çatal Mafsal (ISO 8133 Clevis Rod End) & Pim
  // Sits flush at rod end (x = 280). Box width 55 -> center at x = 280 + 27.5 = 307.5mm.
  parts.push(
    createPart(
      'box',
      'Rot Başı Çatal Mafsal 55x50x46 (ISO 8133)',
      '#64748b',
      { width: 55, height: 50, depth: 46 },
      { x: 307.5, y: 0, z: 0 }
    ),
    createPart(
      'cylinder',
      'Ön Çatal Bağlantı Pimi Ø20x56mm',
      '#94a3b8',
      { diameter: 20, length: 56 },
      { x: 317, y: 0, z: 0 },
      { x: 90, y: 0, z: 0 } // Rotated around X -> axis along Z!
    )
  );

  // 6. 4x Yüksek Mukavemetli Germe Saplamaları (Tie Rods M12x330) & Ağır Somunlar
  // Caps are from x = -148 to x = +148 (span = 296mm). Tie rod length = 330mm.
  const tieCoords = [
    { y: -36, z: -36 },
    { y: 36, z: -36 },
    { y: -36, z: 36 },
    { y: 36, z: 36 },
  ];
  tieCoords.forEach((tc, idx) => {
    parts.push(
      createPart(
        'cylinder',
        `Germe Saplaması M12x330 #${idx + 1} (10.9 Çelik)`,
        '#cbd5e1',
        { diameter: 12, length: 330 },
        { x: 0, y: tc.y, z: tc.z },
        { x: 0, y: 0, z: 90 }
      ),
      createPart(
        'hex-nut',
        `Ağır Saplama Somunu Ön #${idx + 1} (DIN 934)`,
        '#94a3b8',
        { diameter: 12, height: 10, innerDiameter: 12, widthAcrossFlats: 19 },
        { x: 153, y: tc.y, z: tc.z },
        { x: 0, y: 0, z: 90 } // Bore along X
      ),
      createPart(
        'hex-nut',
        `Ağır Saplama Somunu Arka #${idx + 1} (DIN 934)`,
        '#94a3b8',
        { diameter: 12, height: 10, innerDiameter: 12, widthAcrossFlats: 19 },
        { x: -153, y: tc.y, z: tc.z },
        { x: 0, y: 0, z: 90 } // Bore along X
      )
    );
  });

  // 7. Hidrolik Rekor Bağlantı Portları (G 3/8")
  // Sitting cleanly on top of barrel (r=42.5mm -> top face y = 42.5 + 10 = 52.5mm).
  parts.push(
    createPart(
      'box',
      'Hidrolik Giriş Port Bloğu G 3/8" (Ön Frenleme)',
      '#f59e0b',
      { width: 22, height: 20, depth: 22 },
      { x: 75, y: 52.5, z: 0 }
    ),
    createPart(
      'box',
      'Hidrolik Çıkış Port Bloğu G 3/8" (Arka Frenleme)',
      '#f59e0b',
      { width: 22, height: 20, depth: 22 },
      { x: -75, y: 52.5, z: 0 }
    )
  );

  useDesignStore.setState({ parts, selectedId: parts[0].id });
  setTimeout(() => triggerCameraView('fit'), 80);
}

/**
 * 4. ⚡ UCP 205 Kaideli Rulman & Transmisyon Şaft Hattı (ISO 15 / DIN 2211)
 * Ağır çelik şasi, 2x döküm UCP 205 kaideli rulman yatağı, gresörlükler, kademeli transmisyon mili, çift kanallı V-kasnak ve elastik kaplin.
 */
export function buildPillowBlockDrivetrainAssembly() {
  const store = useDesignStore.getState();
  store.pushHistory();
  store.clearScene();

  const parts: DesignPart[] = [];

  // 1. Ağır Çelik Şasi Kaidesi (380x16x140mm)
  // Top face is at y = -34mm.
  const baseSkid = createPart(
    'box',
    'Ağır Çelik Şasi Kaidesi 380x16x140 (S355JR)',
    '#334155',
    { width: 380, height: 16, depth: 140 },
    { x: 0, y: -42, z: 0 }
  );
  baseSkid.holes = [
    { id: 'b1', face: 'top', type: 'clearance', size: 'M14', x: -160, y: -45, depth: 16 },
    { id: 'b2', face: 'top', type: 'clearance', size: 'M14', x: 160, y: -45, depth: 16 },
    { id: 'b3', face: 'top', type: 'clearance', size: 'M14', x: -160, y: 45, depth: 16 },
    { id: 'b4', face: 'top', type: 'clearance', size: 'M14', x: 160, y: 45, depth: 16 },
  ];
  parts.push(baseSkid);

  // 2. 2x Döküm UCP 205 Rulman Yatağı (Makine Yeşili)
  // Standard UCP 205 shaft center height is h=36.5mm above skid surface (-34 + 36.5 = +2.5mm).
  const bearingPositions = [-75, 75];
  bearingPositions.forEach((bx, idx) => {
    parts.push(
      createPart(
        'box',
        `UCP 205 Döküm Rulman Kaidesi #${idx + 1} (EN-GJL-200)`,
        '#059669', // Machinery Green
        { width: 38, height: 68, depth: 130 },
        { x: bx, y: 0, z: 0 }
      ),
      createPart(
        'bearing-race',
        `UC 205 Küresel İç Rulman Bileziği #${idx + 1} (Ø25x52)`,
        '#fbbf24',
        { innerDiameter: 25, outerDiameter: 52, width: 22 },
        { x: bx, y: 2.5, z: 0 },
        { x: 0, y: 0, z: 90 } // Bore along X!
      ),
      createPart(
        'cylinder',
        `Gresörlük Yağlama Memesi (Grease Zerk M6)`,
        '#f59e0b',
        { diameter: 8, length: 14 },
        { x: bx, y: 41, z: 0 },
        { x: 0, y: 0, z: 0 } // Points up along Y
      ),
      createPart(
        'hex-bolt',
        `Yatak Tespit Cıvatası M12x45 Sol #${idx + 1}`,
        '#cbd5e1',
        { diameter: 12, length: 45, headDiameter: 19, headHeight: 9 },
        { x: bx, y: -10, z: -45 },
        { x: 0, y: 0, z: 0 }
      ),
      createPart(
        'hex-bolt',
        `Yatak Tespit Cıvatası M12x45 Sağ #${idx + 1}`,
        '#cbd5e1',
        { diameter: 12, length: 45, headDiameter: 19, headHeight: 9 },
        { x: bx, y: -10, z: 45 },
        { x: 0, y: 0, z: 0 }
      )
    );
  });

  // 3. Kademeli Transmisyon Şaftı (Ø25x340mm)
  // Lies along X at y = +2.5mm.
  parts.push(
    createPart(
      'keyway-shaft',
      'Kademeli Transmisyon Şaftı Ø25x340mm (C45E - DIN 6885)',
      '#e2e8f0',
      { diameter: 25, length: 340, keyWidth: 8, keyDepth: 4 },
      { x: 0, y: 2.5, z: 0 },
      { x: 0, y: 90, z: 0 }
    )
  );

  // 4. Çift Kanallı V-Kayış Kasnağı (Ø125x36mm DIN 2211)
  // pulley: lathe axis is along Y default. Rotated around Z by 90deg -> axis lies along X!
  parts.push(
    createPart(
      'pulley',
      'Çift Kanallı V-Kayış Kasnağı Ø125x36mm (DIN 2211 SPA)',
      '#64748b',
      { diameter: 125, rimWidth: 36, bore: 25, grooveWidth: 13 },
      { x: -135, y: 2.5, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 5. Flanşlı Elastik Kaplin (DIN 740) - 2 Gövde + 1 Poliüretan Yıldız
  parts.push(
    createPart(
      'cylinder',
      'Flanşlı Esnek Kaplin Sol Gövde Ø75x32 (DIN 740)',
      '#475569',
      { diameter: 75, length: 32 },
      { x: 120, y: 2.5, z: 0 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Kaplin Poliüretan Yıldız Boşluksuz Ara Eleman',
      '#f59e0b',
      { diameter: 55, length: 12 },
      { x: 142, y: 2.5, z: 0 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Flanşlı Esnek Kaplin Sağ Gövde Ø75x32 (DIN 740)',
      '#475569',
      { diameter: 75, length: 32 },
      { x: 164, y: 2.5, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  useDesignStore.setState({ parts, selectedId: parts[0].id });
  setTimeout(() => triggerCameraView('fit'), 80);
}

/**
 * 5. 🏭 EN 1092-1 Yüksek Basınçlı Boru Hattı & Flanşlı Küresel Vana İstasyonu
 * DN50 PN40 kaynak boyunlu flanşlar, küresel vana gövdesi, kırmızı emniyet kolu, 8'li cıvata çemberi ve contalar.
 */
export function buildFlangedPipelineStationAssembly() {
  const store = useDesignStore.getState();
  store.pushHistory();
  store.clearScene();

  const parts: DesignPart[] = [];

  // 1. Merkezi Döküm Küresel Vana Gövdesi (DN50 PN40) & Boğaz
  // cylinder: default axis along Y. Rotated around Z by 90deg -> axis lies along pipeline axis X!
  parts.push(
    createPart(
      'cylinder',
      'Döküm Küresel Vana Gövdesi DN50 PN40 (EN 1982)',
      '#1e293b',
      { diameter: 96, length: 72 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Vana Boğazı & Mil Kovanı (Stem Bonnet)',
      '#334155',
      { diameter: 40, length: 36 },
      { x: 0, y: 54, z: 0 },
      { x: 0, y: 0, z: 0 } // Points up along Y
    )
  );

  // 2. Kırmızı Emniyet Kolu (Quarter-Turn Actuating Lever)
  parts.push(
    createPart(
      'box',
      'Vana Açma/Kapama Kolu 150x8x25 (Epoksi Kırmızı)',
      '#dc2626',
      { width: 150, height: 8, depth: 25 },
      { x: 50, y: 76, z: 0 }
    ),
    createPart(
      'hex-nut',
      'Mil Emniyet Somunu M16 (Paslanmaz A4-70)',
      '#f8fafc',
      { diameter: 16, height: 12, innerDiameter: 16, widthAcrossFlats: 24 },
      { x: 0, y: 84, z: 0 },
      { x: 0, y: 0, z: 0 } // Bore along Y
    )
  );

  // 3. Giriş ve Çıkış Boru Hatları (DN50 / 2" Sch 40, Ø60x120mm)
  // tube: default axis along Z. Rotated around Y by 90deg -> pipe bore is along X!
  parts.push(
    createPart(
      'tube',
      'Giriş Boru Spool Hattı DN50 Sch 40 (P235GH)',
      '#334155',
      { diameter: 60, wall: 5, length: 120 },
      { x: -120, y: 0, z: 0 },
      { x: 0, y: 90, z: 0 }
    ),
    createPart(
      'tube',
      'Çıkış Boru Spool Hattı DN50 Sch 40 (P235GH)',
      '#334155',
      { diameter: 60, wall: 5, length: 120 },
      { x: 120, y: 0, z: 0 },
      { x: 0, y: 90, z: 0 }
    )
  );

  // 4. 2x EN 1092-1 Tip 11 Kaynak Boyunlu Flanş (DN50 PN40, Ø165x20mm)
  // Sits flush at pipe ends (x = -60 to -40 and x = +40 to +60).
  parts.push(
    createPart(
      'cylinder',
      'Kaynak Boyunlu Flanş Giriş DN50 PN40 (EN 1092-1)',
      '#475569',
      { diameter: 165, length: 20 },
      { x: -50, y: 0, z: 0 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Kaynak Boyunlu Flanş Çıkış DN50 PN40 (EN 1092-1)',
      '#475569',
      { diameter: 165, length: 20 },
      { x: 50, y: 0, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 5. 2x Spiral Sarımlı Grafit Conta (Ø115x4mm)
  // Sandwiched between pipe flange and valve body (x = -38 and x = +38).
  parts.push(
    createPart(
      'cylinder',
      'Spiral Sarımlı Conta Giriş (EN 1514-2 / Grafit)',
      '#f59e0b',
      { diameter: 115, length: 4 },
      { x: -38, y: 0, z: 0 },
      { x: 0, y: 0, z: 90 }
    ),
    createPart(
      'cylinder',
      'Spiral Sarımlı Conta Çıkış (EN 1514-2 / Grafit)',
      '#f59e0b',
      { diameter: 115, length: 4 },
      { x: 38, y: 0, z: 0 },
      { x: 0, y: 0, z: 90 }
    )
  );

  // 6. 8'li PCD Cıvata Çemberi (Ø125mm Çember Üzerinde 8x M16 Cıvatalar ve Çift Somunlar)
  const pcdRadius = 62.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * 2 * Math.PI) / 8;
    const py = Math.cos(angle) * pcdRadius;
    const pz = Math.sin(angle) * pcdRadius;

    // Left flange joint studs and nuts (passes through pipe flange x=-50 and valve face x=-36)
    parts.push(
      createPart(
        'cylinder',
        `Flanş Saplaması M16x65 Sol #${i + 1} (8.8 Çelik)`,
        '#cbd5e1',
        { diameter: 16, length: 65 },
        { x: -44, y: py, z: pz },
        { x: 0, y: 0, z: 90 }
      ),
      createPart(
        'hex-nut',
        `Flanş Somunu Sol M16 #${i + 1}`,
        '#94a3b8',
        { diameter: 16, height: 13, innerDiameter: 16, widthAcrossFlats: 24 },
        { x: -64, y: py, z: pz },
        { x: 0, y: 0, z: 90 } // Bore along X
      )
    );

    // Right flange joint studs and nuts (passes through valve face x=+36 and pipe flange x=+50)
    parts.push(
      createPart(
        'cylinder',
        `Flanş Saplaması M16x65 Sağ #${i + 1} (8.8 Çelik)`,
        '#cbd5e1',
        { diameter: 16, length: 65 },
        { x: 44, y: py, z: pz },
        { x: 0, y: 0, z: 90 }
      ),
      createPart(
        'hex-nut',
        `Flanş Somunu Sağ M16 #${i + 1}`,
        '#94a3b8',
        { diameter: 16, height: 13, innerDiameter: 16, widthAcrossFlats: 24 },
        { x: 64, y: py, z: pz },
        { x: 0, y: 0, z: 90 } // Bore along X
      )
    );
  }

  useDesignStore.setState({ parts, selectedId: parts[0].id });
  setTimeout(() => triggerCameraView('fit'), 80);
}

/**
 * 6. 🦾 6-Eksen Endüstriyel Robot Bilek & Takım Flanşı (ISO 9409-1)
 * Robotik ön kol döküm gövde, harmonik sürücü aktüatör, çift çatallı mafsal, çapraz makaralı rulman ve takım flanşı.
 */
export function buildRoboticWristAssembly() {
  const store = useDesignStore.getState();
  store.pushHistory();
  store.clearScene();

  const parts: DesignPart[] = [];

  // 1. Robot Ön Kol Döküm Alüminyum Gövde (85x95x160mm)
  // Centered along Z axis, facing forward (+Z).
  parts.push(
    createPart(
      'box',
      'Robotik Kol Gövdesi (AlSi10Mg Döküm)',
      '#0284c7', // Industrial Robot Blue
      { width: 85, height: 95, depth: 160 },
      { x: 0, y: 0, z: -120 }
    )
  );

  // 2. Harmonik Redüktör Kovanı & Motor Sürücüsü (Ø96x48mm)
  // cylinder: default axis along Y. Rotated around X by 90deg -> axis along Z!
  parts.push(
    createPart(
      'cylinder',
      'Harmonik Sürücü Aktüatör Kovanı (Harmonic Drive CSG)',
      '#0f172a',
      { diameter: 96, length: 48 },
      { x: 0, y: 0, z: -16 },
      { x: 90, y: 0, z: 0 }
    )
  );

  // 3. Çift Çatallı Mafsal Braketi (7075-T6 CNC) - 110x70x70mm
  parts.push(
    createPart(
      'box',
      'Mafsallı Bilek Çatalı (7075-T6 Havacılık Alüminyumu)',
      '#38bdf8',
      { width: 110, height: 70, depth: 70 },
      { x: 0, y: 0, z: 43 }
    )
  );

  // 4. Çapraz Makaralı Rulman Halkası (Cross-Roller Ring RB 8016)
  // bearing-race: default axis along Y. Rotated around X by 90deg -> axis along Z!
  parts.push(
    createPart(
      'bearing-race',
      'Çapraz Makaralı Döner Tabla Rulmanı (RB 8016)',
      '#fbbf24',
      { innerDiameter: 68, outerDiameter: 92, width: 16 },
      { x: 0, y: 0, z: 86 },
      { x: 90, y: 0, z: 0 }
    )
  );

  // 5. ISO 9409-1 Standart Robot Takım Flanşı (Ø80x18mm)
  const toolFlange = createPart(
    'cylinder',
    'ISO 9409-1 Standart Takım Flanşı Ø80 (A50)',
    '#94a3b8',
    { diameter: 80, length: 18 },
    { x: 0, y: 0, z: 103 },
    { x: 90, y: 0, z: 0 }
  );
  toolFlange.holes = [
    { id: 'tf1', face: 'top', type: 'clearance', size: 'M6', x: -25, y: 0, depth: 14 },
    { id: 'tf2', face: 'top', type: 'clearance', size: 'M6', x: 25, y: 0, depth: 14 },
    { id: 'tf3', face: 'top', type: 'clearance', size: 'M6', x: 0, y: -25, depth: 14 },
    { id: 'tf4', face: 'top', type: 'clearance', size: 'M6', x: 0, y: 25, depth: 14 },
  ];
  parts.push(toolFlange);

  // 6. Pnömatik Hızlı Değiştirici Takım Arayüz Bloğu (65x36x30mm)
  parts.push(
    createPart(
      'box',
      'Pnömatik Takım Arayüz Bloğu (Gripper Mount)',
      '#475569',
      { width: 65, height: 36, depth: 30 },
      { x: 0, y: 0, z: 127 }
    ),
    createPart(
      'cylinder',
      'Pnömatik Hava Rekoru Port 1 (G 1/8")',
      '#f59e0b',
      { diameter: 10, length: 14 },
      { x: -18, y: 25, z: 127 },
      { x: 0, y: 0, z: 0 } // Points up along Y
    ),
    createPart(
      'cylinder',
      'Pnömatik Hava Rekoru Port 2 (G 1/8")',
      '#f59e0b',
      { diameter: 10, length: 14 },
      { x: 18, y: 25, z: 127 },
      { x: 0, y: 0, z: 0 } // Points up along Y
    )
  );

  useDesignStore.setState({ parts, selectedId: toolFlange.id });
  setTimeout(() => triggerCameraView('fit'), 80);
}

/**
 * 7. 🔲 7075-T6 Havacılık Kanat İçi Isogrid Hafifletme Paneli & Titanyum Çatal Mesnet
 * 8 cepli isogrid yapı, merkez boşaltma deliği, Ti-6Al-4V titanyum çatal mesnet ve NAS bağlantıları.
 */
export function buildAerospaceIsogridRibAssembly() {
  const store = useDesignStore.getState();
  store.pushHistory();
  store.clearScene();

  const parts: DesignPart[] = [];

  // 1. Ana Isogrid Panel Gövdesi (240x18x140mm)
  const rib = createPart(
    'box',
    '7075-T6 Havacılık Isogrid Kanat Konsolu 240x18x140',
    '#06b6d4',
    { width: 240, height: 18, depth: 140 },
    { x: 0, y: 0, z: 0 }
  );

  const cornerBolts = applyCornerBoltPattern(rib, 'top', 'M8');
  const centerBore = applyCenterBore(rib, 'top', 42, 'clearance');
  const isogridPockets = applyLightweightIsogrid(rib, 'top', 6, 8);

  rib.holes = [...cornerBolts, centerBore];
  rib.cuts = isogridPockets;
  parts.push(rib);

  // 2. Ti-6Al-4V Titanyum Yük Aktarma Çatal Mesneti (60x46x65mm) & Pim
  // Sits flush at wing rib right edge (x = 120 + 30 = 150mm).
  parts.push(
    createPart(
      'box',
      'Ti-6Al-4V Titanyum Yük Aktarma Mesneti (AMS 4911)',
      '#a855f7',
      { width: 60, height: 46, depth: 65 },
      { x: 150, y: 0, z: 0 }
    ),
    createPart(
      'cylinder',
      'Titanyum Mafsal Pimi Ø22x60mm (Ti Grade 5)',
      '#c084fc',
      { diameter: 22, length: 60 },
      { x: 160, y: 0, z: 0 },
      { x: 90, y: 0, z: 0 } // Rotated around X -> axis along Z!
    )
  );

  // 3. 3x NAS1100 Havşalı Havacılık Cıvataları
  // Points down along -Y through the bracket into the rib.
  const nasCoords = [
    { x: 130, z: -20 },
    { x: 130, z: 0 },
    { x: 130, z: 20 },
  ];
  nasCoords.forEach((nc, idx) => {
    parts.push(
      createPart(
        'hex-bolt',
        `NAS1100 Havşa Başlı Havacılık Cıvatası #${idx + 1}`,
        '#cbd5e1',
        { diameter: 8, length: 24, headDiameter: 14, headHeight: 6 },
        { x: nc.x, y: 23, z: nc.z },
        { x: 0, y: 0, z: 0 } // Points down along -Y
      )
    );
  });

  useDesignStore.setState({ parts, selectedId: rib.id });
  setTimeout(() => triggerCameraView('fit'), 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN GENERATORS & CLONING UTILITIES (USED IN INSPECTOR / ARRAY TOOLS)
// ─────────────────────────────────────────────────────────────────────────────

export function createLinearPartArray(
  part: DesignPart,
  axis: 'x' | 'y' | 'z',
  count: number,
  stepMm: number
): number {
  const store = useDesignStore.getState();
  if (!part || count < 2) return 0;

  store.pushHistory();
  const newParts: DesignPart[] = [];
  const baseTime = Date.now().toString(36);

  for (let i = 1; i < count; i++) {
    const pos = { ...part.position };
    pos[axis] = Math.round((pos[axis] + i * stepMm) * 10) / 10;

    newParts.push({
      ...structuredClone(part),
      id: `${part.kind}-arr-${baseTime}-${i}`,
      name: `${part.name} [${axis.toUpperCase()}+${i * stepMm}mm]`,
      position: pos,
    });
  }

  useDesignStore.setState((s) => ({
    parts: [...s.parts, ...newParts],
  }));
  setTimeout(() => triggerCameraView('fit'), 60);
  return newParts.length;
}

export function createCircularPartArray(
  part: DesignPart,
  totalCount: number,
  radiusMm: number
): number {
  const store = useDesignStore.getState();
  if (!part || totalCount < 2) return 0;

  store.pushHistory();
  const newParts: DesignPart[] = [];
  const baseTime = Date.now().toString(36);

  store.updatePart(part.id, {
    position: {
      x: radiusMm,
      y: part.position.y,
      z: 0,
    },
  });

  for (let i = 1; i < totalCount; i++) {
    const angleRad = (i * 2 * Math.PI) / totalCount;
    const angleDeg = Math.round((i * 360) / totalCount);
    const px = Math.round(Math.cos(angleRad) * radiusMm * 10) / 10;
    const pz = Math.round(Math.sin(angleRad) * radiusMm * 10) / 10;

    newParts.push({
      ...structuredClone(part),
      id: `${part.kind}-polar-${baseTime}-${i}`,
      name: `${part.name} [${angleDeg}°]`,
      position: {
        x: px,
        y: part.position.y,
        z: pz,
      },
      rotation: {
        ...part.rotation,
        y: (part.rotation.y + angleDeg) % 360,
      },
    });
  }

  useDesignStore.setState((s) => ({
    parts: [...s.parts, ...newParts],
  }));
  setTimeout(() => triggerCameraView('fit'), 60);
  return newParts.length;
}

export function mirrorSelectedPart(part: DesignPart, axis: 'x' | 'z'): string | null {
  const store = useDesignStore.getState();
  if (!part) return null;

  store.pushHistory();
  const mirroredPos = { ...part.position };
  if (axis === 'x') {
    mirroredPos.x = mirroredPos.x === 0 ? -60 : -mirroredPos.x;
  } else {
    mirroredPos.z = mirroredPos.z === 0 ? -60 : -mirroredPos.z;
  }

  const mirroredRot = { ...part.rotation };
  mirroredRot.y = (mirroredRot.y + 180) % 360;

  const newId = `${part.kind}-mir-${Date.now().toString(36)}`;
  const mirroredPart: DesignPart = {
    ...structuredClone(part),
    id: newId,
    name: `${part.name} [Mirror ${axis.toUpperCase()}]`,
    position: mirroredPos,
    rotation: mirroredRot,
  };

  useDesignStore.setState((s) => ({
    parts: [...s.parts, mirroredPart],
    selectedId: newId,
  }));
  setTimeout(() => triggerCameraView('fit'), 60);
  return newId;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL INDUSTRIAL ASSEMBLY TEMPLATES CATALOG
// ─────────────────────────────────────────────────────────────────────────────

export const STUDIO_ASSEMBLY_TEMPLATES: StudioAssemblyTemplate[] = [
  {
    id: 'gearbox-enclosed',
    nameEn: 'Industrial Enclosed Gearbox Unit',
    nameTr: 'Komple Döküm Redüktör & Şanzıman Grubu',
    standard: 'ISO 6336 / DIN 6885 / ISO 15',
    badge: '19 Parça',
    descEn: 'Heavy cast-iron lower casing, input pinion shaft Ø20, output shaft Ø30, 4x SKF bearings, end-caps, fasteners & clear observation top.',
    descTr: 'Ağır döküm alt gövde, m=2.5 pinyon ve çark dişli çifti, Ø20 ve Ø30 kamalı transmisyon milleri, 4x SKF rulman, flanş kapakları ve şeffaf üst muhafaza.',
    build: buildEnclosedGearboxAssembly,
  },
  {
    id: 'cnc-linear-actuator',
    nameEn: 'CNC Ball Screw & MGN15 Rail Axis',
    nameTr: 'CNC Vidalı Mil & MGN15 Lineer Kızak Ekseni',
    standard: 'ISO 13041 / DIN 69051',
    badge: '18 Parça',
    descEn: '40x80 aluminum bed, dual MGN15 guide rails, 4x carriage blocks, SFU1605 ground ball screw, BK12/BF12 supports, tooling saddle & NEMA 23 motor.',
    descTr: '40x80 sigma profil kaide, çift MGN15 taşlanmış ray, 4 bilyalı araba bloğu, SFU1605 vidalı mil, BK12/BF12 yataklar, M6 delikli takım tablası ve NEMA 23 step motor.',
    build: buildCncLinearActuatorAssembly,
  },
  {
    id: 'hydraulic-cylinder-actuator',
    nameEn: 'Heavy-Duty Hydraulic Cylinder & Clevis',
    nameTr: 'Ağır Hizmet Hidrolik Silindir & Çatal Mafsal',
    standard: 'ISO 6022 / ISO 8132',
    badge: '16 Parça',
    descEn: 'Honed steel cylinder barrel Ø85x240, front gland head, rear clevis lug, hard-chrome rod Ø36, clevis rod end, tie-rods & fluid ports.',
    descTr: 'Honlanmış dikişsiz çelik boru Ø85x240, ön boğaz yatağı, arka mafsal kulağı, sert krom piston mili Ø36, çatal mafsal rot başı ve 4x boydan boya germe saplaması.',
    build: buildHydraulicCylinderAssembly,
  },
  {
    id: 'pillow-block-drivetrain',
    nameEn: 'Dual Pillow Blocks & V-Belt Drivetrain',
    nameTr: 'UCP 205 Kaideli Rulman & Kayış Kasnak Hattı',
    standard: 'ISO 15 / DIN 2211 / DIN 740',
    badge: '14 Parça',
    descEn: 'Heavy steel skid, 2x cast-iron UCP 205 pillow blocks with grease zerks, stepped shaft Ø25x340, 2-groove V-pulley Ø125 & flanged disc coupling.',
    descTr: 'Ağır çelik şasi kaidesi, 2x döküm UCP 205 kaideli rulman yatağı, gresörlükler, kademeli transmisyon şaftı Ø25x340, çift kanallı V-kayış kasnağı ve elastik kaplin.',
    build: buildPillowBlockDrivetrainAssembly,
  },
  {
    id: 'flanged-pipeline-station',
    nameEn: 'Flanged Pipeline Spool & Ball Valve Station',
    nameTr: 'Yüksek Basınçlı Flanşlı Boru Hattı & Vana İstasyonu',
    standard: 'EN 1092-1 / ANSI B16.5 / EN 1982',
    badge: '22 Parça',
    descEn: 'DN50 PN40 pipe spools, raised-face weld neck flanges, industrial ball valve body, red safety lever, graphite gaskets & full 8-bolt circle studs.',
    descTr: 'DN50 PN40 çelik boru hatları, kaynak boyunlu flanşlar, küresel vana gövdesi, kırmızı emniyet kolu, sızdırmazlık contaları ve 8x M16 saplama cıvata çemberi.',
    build: buildFlangedPipelineStationAssembly,
  },
  {
    id: 'robotic-wrist-actuator',
    nameEn: '6-Axis Robot Wrist & ISO 9409-1 Tool Flange',
    nameTr: '6-Eksen Robot Bilek & ISO 9409-1 Takım Flanşı',
    standard: 'ISO 9409-1 / ISO 9283',
    badge: '11 Parça',
    descEn: 'Cast aluminum forearm housing, harmonic drive actuator, 7075-T6 swivel yoke, cross-roller bearing, tool mounting flange & pneumatic ports.',
    descTr: 'Döküm alüminyum robotik kol kovanı, harmonik sürücü aktüatör, 7075-T6 döner mafsal çatalı, çapraz makaralı döner yatak, takım flanşı ve pnömatik adaptör.',
    build: buildRoboticWristAssembly,
  },
  {
    id: 'aerospace-isogrid-rib',
    nameEn: '7075-T6 Aerospace Isogrid Rib & Titanium Lug',
    nameTr: '7075-T6 Havacılık Isogrid Panel & Titanyum Mesnet',
    standard: 'VDI 2230 / AMS 4911 / NAS1100',
    badge: '12 Parça',
    descEn: 'Aerospace wing rib 240x18x140 with 8x CNC isogrid pockets, central Ø42 lightening bore, Ti-6Al-4V cleat fitting & flush fasteners.',
    descTr: '8 adet CNC hafifletme cepli 7075-T6 havacılık kanat konsolu, Ø42mm merkez hafifletme deliği, Ti-6Al-4V titanyum yük aktarma mesneti ve havşalı cıvatalar.',
    build: buildAerospaceIsogridRibAssembly,
  },
];
