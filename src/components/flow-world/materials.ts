import { EngineeringMaterial } from './types';
import { getCanonicalById } from '@/materials/canonical';

const RAW_ENGINEERING_MATERIALS: Record<string, EngineeringMaterial> = {
  'al-6061-t6': {
    id: 'al-6061-t6',
    name: 'Al 6061-T6 (Havacılık & Konstrüksiyon)',
    category: 'aluminum',
    density: 2.70,
    yieldStrength: 276,
    youngsModulus: 68.9,
    shearModulus: 26.0,
    hardness: '95 HB',
    thermalExpansion: 23.6,
    color: '#00e5ff',
    strokeColor: '#00b4d8'
  },
  'al-7075-t6': {
    id: 'al-7075-t6',
    name: 'Al 7075-T6 (Yüksek Mukavemetli Uçak Alaşımı)',
    category: 'aluminum',
    density: 2.81,
    yieldStrength: 503,
    youngsModulus: 71.7,
    shearModulus: 26.9,
    hardness: '150 HB',
    thermalExpansion: 23.4,
    color: '#38bdf8',
    strokeColor: '#0284c7'
  },
  'al-2024-t3': {
    id: 'al-2024-t3',
    name: 'Al 2024-T3 (Yorulma Dirençli Bakırlı Al)',
    category: 'aluminum',
    density: 2.78,
    yieldStrength: 310,
    youngsModulus: 73.1,
    shearModulus: 28.0,
    hardness: '120 HB',
    thermalExpansion: 22.9,
    color: '#60a5fa',
    strokeColor: '#2563eb'
  },
  'al-5052-h32': {
    id: 'al-5052-h32',
    name: 'Al 5052-H32 (Korozyon Dirençli Denizcilik)',
    category: 'aluminum',
    density: 2.68,
    yieldStrength: 195,
    youngsModulus: 70.3,
    shearModulus: 25.9,
    hardness: '60 HB',
    thermalExpansion: 23.8,
    color: '#34d399',
    strokeColor: '#059669'
  },
  'al-1100-h14': {
    id: 'al-1100-h14',
    name: 'Al 1100 (Saf Alüminyum - Sünek)',
    category: 'aluminum',
    density: 2.71,
    yieldStrength: 35,
    youngsModulus: 69.0,
    shearModulus: 26.0,
    hardness: '23 HB',
    thermalExpansion: 23.6,
    color: '#a7f3d0',
    strokeColor: '#10b981'
  },
  'steel-4140': {
    id: 'steel-4140',
    name: 'Yapı Çeliği (4140 Islah Çeliği)',
    category: 'steel',
    density: 7.85,
    yieldStrength: 655,
    youngsModulus: 205.0,
    shearModulus: 80.0,
    hardness: '280 HB',
    thermalExpansion: 12.2,
    color: '#94a3b8',
    strokeColor: '#475569'
  },
  'ti-6al-4v': {
    id: 'ti-6al-4v',
    name: 'Titanyum Grade 5 (Ti-6Al-4V)',
    category: 'titanium',
    density: 4.43,
    yieldStrength: 880,
    youngsModulus: 113.8,
    shearModulus: 44.0,
    hardness: '330 HB',
    thermalExpansion: 8.6,
    color: '#c084fc',
    strokeColor: '#9333ea'
  },
  'brass-c360': {
    id: 'brass-c360',
    name: 'Otomat Pirinci (C36000)',
    category: 'brass',
    density: 8.50,
    yieldStrength: 310,
    youngsModulus: 97.0,
    shearModulus: 37.0,
    hardness: '130 HB',
    thermalExpansion: 20.5,
    color: '#fbbf24',
    strokeColor: '#d97706'
  },
  'delrin-pom': {
    id: 'delrin-pom',
    name: 'Delrin / Poliasetal (POM Mühendislik Plastiği)',
    category: 'polymer',
    density: 1.41,
    yieldStrength: 65,
    youngsModulus: 2.8,
    shearModulus: 1.1,
    hardness: '85 Shore D',
    thermalExpansion: 110.0,
    color: '#f472b6',
    strokeColor: '#db2777'
  },
  'rubber-tire': {
    id: 'rubber-tire',
    name: 'Vulkanize Kauçuk Lastik (Yüksek Yol Tutuşu)',
    category: 'polymer',
    density: 1.15,
    yieldStrength: 25,
    youngsModulus: 0.05,
    shearModulus: 0.02,
    hardness: '65 Shore A',
    thermalExpansion: 150.0,
    color: '#334155',
    strokeColor: '#0f172a'
  },
  'marine-composite': {
    id: 'marine-composite',
    name: 'Denizcilik Kompoziti (Fiberglas / Hafif Ahşap)',
    category: 'polymer',
    density: 0.45,
    yieldStrength: 120,
    youngsModulus: 14.0,
    shearModulus: 4.5,
    hardness: '80 Shore D',
    thermalExpansion: 18.0,
    color: '#0284c7',
    strokeColor: '#0369a1'
  }
};

export const ENGINEERING_MATERIALS: Record<string, EngineeringMaterial> = Object.fromEntries(
  Object.entries(RAW_ENGINEERING_MATERIALS).map(([id, mat]) => {
    const c = getCanonicalById(id);
    if (!c) return [id, mat];
    return [id, {
      ...mat,
      density: c.density,
      yieldStrength: c.Sy_typical,
      youngsModulus: c.E,
      shearModulus: c.G ?? mat.shearModulus,
    }];
  })
);

export const DEFAULT_MATERIAL = ENGINEERING_MATERIALS['al-6061-t6'];
