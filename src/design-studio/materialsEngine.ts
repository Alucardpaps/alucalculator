'use client';

export interface EngineeringMaterial {
  id: string;
  name: string;
  nameTr: string;
  category: 'aluminum' | 'steel' | 'titanium' | 'copper-brass' | 'polymer' | 'composite';
  density: number; // g/cm^3
  yieldStrength: number; // MPa
  ultimateStrength: number; // MPa
  elasticModulus: number; // GPa
  poissonRatio: number;
  thermalConductivity: number; // W/(m·K)
  thermalExpansion: number; // µm/(m·K)
  color: string;
  metalness: number;
  roughness: number;
  description: string;
}

export const ENGINEERING_MATERIALS: EngineeringMaterial[] = [
  {
    id: 'al-6061-t6',
    name: 'Aluminum 6061-T6',
    nameTr: 'Alüminyum 6061-T6 (Genel İmalat)',
    category: 'aluminum',
    density: 2.70,
    yieldStrength: 276,
    ultimateStrength: 310,
    elasticModulus: 68.9,
    poissonRatio: 0.33,
    thermalConductivity: 167,
    thermalExpansion: 23.2,
    color: '#cbd5e1',
    metalness: 0.85,
    roughness: 0.25,
    description: 'Yüksek işlenebilirlik, iyi korozyon direnci ve kaynaklanabilirlik sunan standart havacılık ve makine alüminyumu.',
  },
  {
    id: 'al-7075-t6',
    name: 'Aluminum 7075-T6 (Aerospace)',
    nameTr: 'Alüminyum 7075-T6 (Havacılık & Savunma)',
    category: 'aluminum',
    density: 2.81,
    yieldStrength: 503,
    ultimateStrength: 572,
    elasticModulus: 71.7,
    poissonRatio: 0.33,
    thermalConductivity: 130,
    thermalExpansion: 23.4,
    color: '#94a3b8',
    metalness: 0.9,
    roughness: 0.2,
    description: 'Çelik dayanımına yakın ultra yüksek mukavemetli çinko alaşımlı havacılık alüminyumu.',
  },
  {
    id: 'steel-304',
    name: 'Stainless Steel 304 (1.4301)',
    nameTr: 'Paslanmaz Çelik 304 (Gıda & Kimya)',
    category: 'steel',
    density: 7.93,
    yieldStrength: 215,
    ultimateStrength: 505,
    elasticModulus: 193,
    poissonRatio: 0.29,
    thermalConductivity: 16.2,
    thermalExpansion: 17.2,
    color: '#e2e8f0',
    metalness: 0.95,
    roughness: 0.15,
    description: 'Mükemmel korozyon ve asit direnci, medikal, gıda ve kimya sanayi standardı ostenitik paslanmaz çelik.',
  },
  {
    id: 'steel-s235',
    name: 'Structural Steel S235JR',
    nameTr: 'Yapı Çeliği S235JR (St37)',
    category: 'steel',
    density: 7.85,
    yieldStrength: 235,
    ultimateStrength: 360,
    elasticModulus: 210,
    poissonRatio: 0.30,
    thermalConductivity: 45,
    thermalExpansion: 12.0,
    color: '#64748b',
    metalness: 0.75,
    roughness: 0.45,
    description: 'Genel konstrüksiyon, şasi ve kaynaklı imalatlarda en yaygın kullanılan karbon çeliği.',
  },
  {
    id: 'steel-4140',
    name: 'Alloy Steel 4140 (42CrMo4)',
    nameTr: 'Islah Çeliği 4140 (42CrMo4 - Mil & Dişli)',
    category: 'steel',
    density: 7.85,
    yieldStrength: 655,
    ultimateStrength: 850,
    elasticModulus: 205,
    poissonRatio: 0.29,
    thermalConductivity: 42.6,
    thermalExpansion: 12.3,
    color: '#475569',
    metalness: 0.88,
    roughness: 0.3,
    description: 'Yüksek yorulma ömrü ve tokluk gerektiren miller, dişliler, akslar ve yüksek torklu tahrik elemanları.',
  },
  {
    id: 'brass-c360',
    name: 'Brass CuZn39Pb3 (C36000)',
    nameTr: 'Otomat Pirinci CuZn39Pb3 (Burç & Vana)',
    category: 'copper-brass',
    density: 8.50,
    yieldStrength: 310,
    ultimateStrength: 450,
    elasticModulus: 105,
    poissonRatio: 0.34,
    thermalConductivity: 115,
    thermalExpansion: 20.5,
    color: '#fbbf24',
    metalness: 0.8,
    roughness: 0.25,
    description: '%100 işlenebilirlik referansı, sürtünmesiz kaymalı yataklar, burçlar, fittings ve dekoratif parçalar.',
  },
  {
    id: 'ti-6al-4v',
    name: 'Titanium Grade 5 (Ti-6Al-4V)',
    nameTr: 'Titanyum Grade 5 (Havacılık & Biyomedikal)',
    category: 'titanium',
    density: 4.43,
    yieldStrength: 880,
    ultimateStrength: 950,
    elasticModulus: 113.8,
    poissonRatio: 0.34,
    thermalConductivity: 6.7,
    thermalExpansion: 8.6,
    color: '#a1a1aa',
    metalness: 0.7,
    roughness: 0.3,
    description: 'Ultra hafiflik ve ekstrem mukavemet oranı, biyouyumlu medikal implantlar ve jet motoru bileşenleri.',
  },
  {
    id: 'pom-delrin',
    name: 'Polyacetal POM-C (Delrin)',
    nameTr: 'Kestamid / Delrin (POM-C Mühendislik Plastiği)',
    category: 'polymer',
    density: 1.41,
    yieldStrength: 65,
    ultimateStrength: 70,
    elasticModulus: 2.8,
    poissonRatio: 0.35,
    thermalConductivity: 0.31,
    thermalExpansion: 110,
    color: '#f8fafc',
    metalness: 0.05,
    roughness: 0.5,
    description: 'Sürtünmesiz hassas dişliler, makaralar, yatak burçları ve elektriksel yalıtım parçaları.',
  },
  {
    id: 'carbon-fiber',
    name: 'Carbon Fiber CFRP',
    nameTr: 'Karbon Fiber Kompozit (CFRP)',
    category: 'composite',
    density: 1.55,
    yieldStrength: 800,
    ultimateStrength: 1500,
    elasticModulus: 150,
    poissonRatio: 0.28,
    thermalConductivity: 5.0,
    thermalExpansion: 1.5,
    color: '#18181b',
    metalness: 0.3,
    roughness: 0.4,
    description: 'Motorsporları ve havacılık için maksimum rijitlik ve minimum ağırlık sağlayan örgü karbon lif kompoziti.',
  },
  {
    id: 'pla-3dprint',
    name: 'PLA / PETG (3D Print)',
    nameTr: 'PLA / PETG (Katmanlı Üretim & Prototip)',
    category: 'polymer',
    density: 1.24,
    yieldStrength: 45,
    ultimateStrength: 50,
    elasticModulus: 3.5,
    poissonRatio: 0.36,
    thermalConductivity: 0.13,
    thermalExpansion: 68,
    color: '#38bdf8',
    metalness: 0.1,
    roughness: 0.6,
    description: 'Hızlı prototipleme, fonksiyonel test aparatları ve 3D yazıcı üretimleri için termoplastik.',
  },
];

export interface MassProperties {
  volumeMm3: number;
  volumeCm3: number;
  massGrams: number;
  massKg: number;
  surfaceAreaMm2: number;
  surfaceAreaCm2: number;
  centerOfGravity: { x: number; y: number; z: number };
  boundingBox: {
    width: number;
    height: number;
    depth: number;
  };
  momentOfInertia: {
    ixx: number;
    iyy: number;
    izz: number;
  };
}

/**
 * Calculates physical mass properties (Volume, Mass, Area, CoG, Inertia) of a set of 3D parts.
 */
export function calculateAssemblyMassProperties(
  parts: Array<{
    params: Record<string, number>;
    position: { x: number; y: number; z: number };
    materialId?: string;
    scale?: { x: number; y: number; z: number };
  }>,
  defaultMaterialId = 'al-6061-t6'
): MassProperties {
  let totalVolMm3 = 0;
  let totalMassG = 0;
  let totalAreaMm2 = 0;

  let weightedX = 0;
  let weightedY = 0;
  let weightedZ = 0;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  parts.forEach((part) => {
    const p = part.params || {};
    const sx = part.scale?.x ?? 1;
    const sy = part.scale?.y ?? 1;
    const sz = part.scale?.z ?? 1;

    // Approximate part dimensions in mm
    const w = (p.width || p.length || 40) * sx;
    const h = (p.height || 40) * sy;
    const d = (p.depth || p.radius ? (p.radius || 20) * 2 : 20) * sz;

    // Bounding limits
    const px = part.position.x;
    const py = part.position.y;
    const pz = part.position.z;

    minX = Math.min(minX, px - w / 2);
    maxX = Math.max(maxX, px + w / 2);
    minY = Math.min(minY, py - h / 2);
    maxY = Math.max(maxY, py + h / 2);
    minZ = Math.min(minZ, pz - d / 2);
    maxZ = Math.max(maxZ, pz + d / 2);

    // Approximate Volume & Surface Area
    let vol = w * h * d;
    let area = 2 * (w * h + w * d + h * d);

    if (p.radius && !p.width) {
      // Cylinder / Tube approx
      const r = (p.radius || 20) * sx;
      const len = (p.length || 50) * sy;
      vol = Math.PI * r * r * len;
      area = 2 * Math.PI * r * len + 2 * Math.PI * r * r;
    }

    const mat = ENGINEERING_MATERIALS.find((m) => m.id === (part.materialId || defaultMaterialId)) 
      || ENGINEERING_MATERIALS[0];

    const volCm3 = vol / 1000; // 1 cm^3 = 1000 mm^3
    const massG = volCm3 * mat.density;

    totalVolMm3 += vol;
    totalMassG += massG;
    totalAreaMm2 += area;

    weightedX += px * massG;
    weightedY += py * massG;
    weightedZ += pz * massG;
  });

  const cogX = totalMassG > 0 ? weightedX / totalMassG : 0;
  const cogY = totalMassG > 0 ? weightedY / totalMassG : 0;
  const cogZ = totalMassG > 0 ? weightedZ / totalMassG : 0;

  const width = maxX > minX ? maxX - minX : 0;
  const height = maxY > minY ? maxY - minY : 0;
  const depth = maxZ > minZ ? maxZ - minZ : 0;

  // Moment of Inertia approximations (kg·mm^2)
  const mKg = totalMassG / 1000;
  const ixx = (1 / 12) * mKg * (height * height + depth * depth);
  const iyy = (1 / 12) * mKg * (width * width + depth * depth);
  const izz = (1 / 12) * mKg * (width * width + height * height);

  return {
    volumeMm3: Math.round(totalVolMm3),
    volumeCm3: Number((totalVolMm3 / 1000).toFixed(2)),
    massGrams: Number(totalMassG.toFixed(1)),
    massKg: Number((totalMassG / 1000).toFixed(3)),
    surfaceAreaMm2: Math.round(totalAreaMm2),
    surfaceAreaCm2: Number((totalAreaMm2 / 100).toFixed(2)),
    centerOfGravity: {
      x: Number(cogX.toFixed(2)),
      y: Number(cogY.toFixed(2)),
      z: Number(cogZ.toFixed(2)),
    },
    boundingBox: {
      width: Number(width.toFixed(1)),
      height: Number(height.toFixed(1)),
      depth: Number(depth.toFixed(1)),
    },
    momentOfInertia: {
      ixx: Number(ixx.toFixed(2)),
      iyy: Number(iyy.toFixed(2)),
      izz: Number(izz.toFixed(2)),
    },
  };
}
