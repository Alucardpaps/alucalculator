import type { LucideIcon } from 'lucide-react';
import {
    Database,
    Settings,
    Shapes,
    Atom,
    FlaskConical,
    Layers,
    Hash,
    Activity,
    Eye,
    FileText,
    Box,
    Circle,
    Grid3X3,
    Book,
    Zap,
} from 'lucide-react';
import { listNodes } from '@/flow/nodes/Registry';
import type { NodeCategory } from '@/flow/types/core';
import { useFlowStore } from '@/store/flowStore';

export interface FlowCategoryMeta {
    id: string;
    labelTr: string;
    labelEn: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
    descriptionTr: string;
    descriptionEn: string;
}

export const FLOW_CATEGORIES: FlowCategoryMeta[] = [
    {
        id: 'input',
        labelTr: 'Girdiler & Sabitler',
        labelEn: 'Inputs & Constants',
        icon: Database,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.35)',
        descriptionTr: 'Mühendislik sabitleri, tork, güç, hız, basınç ve ISO malzeme seçicileri',
        descriptionEn: 'Engineering constants, torque, power, rpm, pressure and ISO material selectors',
    },
    {
        id: 'mechanical',
        labelTr: 'Mekanik Çekirdek',
        labelEn: 'Mechanical Core',
        icon: Settings,
        color: '#00e5ff',
        bg: 'rgba(0, 229, 255, 0.12)',
        border: 'rgba(0, 229, 255, 0.35)',
        descriptionTr: 'Dişliler (ISO 6336), miller, cıvatalar (VDI 2230), yataklar, kaynak ve basınçlı kaplar',
        descriptionEn: 'Gears (ISO 6336), shafts, bolts (VDI 2230), bearings, welds and pressure vessels',
    },
    {
        id: 'geometry',
        labelTr: 'Geometri & Kesitler',
        labelEn: 'Geometry & Profiles',
        icon: Shapes,
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        border: 'rgba(56, 189, 248, 0.35)',
        descriptionTr: 'EN/DIN/ISO Kiriş profilleri (I-Kiriş, RHS, CHS, L, U) ve CAD Geometri Aktarım Köprüsü',
        descriptionEn: 'EN/DIN/ISO beam cross-sections (I-Beam, RHS, CHS, L, C) & CAD Geometry Transfer Bridge',
    },
    {
        id: 'physics',
        labelTr: 'Fizik & Dinamik',
        labelEn: 'Physics & Dynamics',
        icon: Atom,
        color: '#eab308',
        bg: 'rgba(234, 179, 8, 0.12)',
        border: 'rgba(234, 179, 8, 0.35)',
        descriptionTr: 'Kinematik, eğik düzlem sürtünmesi, SDOF titreşim & rezonans, ısı transferi ve RLC',
        descriptionEn: 'Kinematics, incline friction dynamics, SDOF harmonic vibration, heat transfer & RLC circuits',
    },
    {
        id: 'chemical',
        labelTr: 'Kimya & Termo',
        labelEn: 'Chemistry & Thermo',
        icon: FlaskConical,
        color: '#14b8a6',
        bg: 'rgba(20, 184, 166, 0.12)',
        border: 'rgba(20, 184, 166, 0.35)',
        descriptionTr: '118 IUPAC elementi, Van der Waals gerçek gaz, Gibbs termodinamiği, stokiyometri ve pH',
        descriptionEn: '118 IUPAC elements, Van der Waals real gas, Gibbs free energy, stoichiometry & pH',
    },
    {
        id: 'material',
        labelTr: 'Malzeme & Isıl İşlem',
        labelEn: 'Materials & Heat Treat',
        icon: Layers,
        color: '#fb923c',
        bg: 'rgba(251, 146, 60, 0.12)',
        border: 'rgba(251, 146, 60, 0.35)',
        descriptionTr: '40+ Sertifikalı mühendislik alaşımı ve Hollomon-Jaffe ıslah / sementasyon motoru',
        descriptionEn: '40+ Certified alloys and Hollomon-Jaffe quenching & tempering / case hardening engine',
    },
    {
        id: 'utility',
        labelTr: 'Matematik & Mantık',
        labelEn: 'Math & Logic',
        icon: Hash,
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.12)',
        border: 'rgba(148, 163, 184, 0.35)',
        descriptionTr: '3D Vektör analizi, 3x3 matris, sayısal türev/integral, polinom kökleri, mantık kapıları',
        descriptionEn: '3D vector algebra, 3x3 matrices, numerical calculus, polynomial roots, logic gates',
    },
    {
        id: 'validation',
        labelTr: 'Doğrulama & Standart',
        labelEn: 'Validation & ISO',
        icon: Activity,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.35)',
        descriptionTr: 'Emniyet katsayısı denetimi, dişli profil alt kesilme kontrolü ve ISO 6336 ön doğrulama',
        descriptionEn: 'Safety factor validation, gear undercut detection and ISO 6336 preliminary checks',
    },
    {
        id: 'visual',
        labelTr: 'Görselleştiriciler',
        labelEn: 'Visualizers & Notes',
        icon: Eye,
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: 'rgba(168, 85, 247, 0.35)',
        descriptionTr: '2D Yerleşim (Nesting), 3D Kutu görüntüleyici, SVG teknik çizim ve mühendislik notları',
        descriptionEn: '2D nesting visualizer, 3D box builder, SVG technical drawing viewer & engineering notes',
    },
    {
        id: 'export',
        labelTr: 'Dışa Aktarım & Rapor',
        labelEn: 'Export & Reports',
        icon: FileText,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.35)',
        descriptionTr: 'AutoCAD DXF R12 çıktıları, ISO 7200 Teknik Rapor PDF ve üretim veri paketleri',
        descriptionEn: 'AutoCAD DXF R12 export, ISO 7200 Technical PDF Reports and production data bundles',
    },
    {
        id: 'legacy',
        labelTr: 'Klasik Araçlar',
        labelEn: 'Legacy Tools',
        icon: Box,
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.12)',
        border: 'rgba(100, 116, 139, 0.35)',
        descriptionTr: 'Sac büküm, kiriş sehim, rulman ömrü ve profil ağırlık klasik hesaplayıcıları',
        descriptionEn: 'Sheet metal bending, beam deflection, bearing life & profile weight legacy solvers',
    },
];

export interface FlowCatalogItem {
    id: string;
    type: 'engineering' | 'calculator' | 'visualizer' | 'note';
    label: string;
    title: string;
    description: string;
    category: string;
    categoryTitle: string;
    color: string;
    icon: LucideIcon;
    iso?: string;
    payload?: {
        schemaId?: string;
        vizType?: string;
        content?: string;
    };
}

const CATEGORY_MAP: Record<NodeCategory, string> = {
    input: 'input',
    mechanical: 'mechanical',
    geometry: 'geometry',
    physics: 'physics',
    chemical: 'chemical',
    material: 'material',
    validation: 'validation',
    export: 'export',
    visualizer: 'visual',
    utility: 'utility',
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    input: Database,
    mechanical: Settings,
    geometry: Shapes,
    physics: Atom,
    chemical: FlaskConical,
    material: Layers,
    validation: Activity,
    export: FileText,
    visual: Eye,
    utility: Hash,
    legacy: Box,
};

const LEGACY_ITEMS: FlowCatalogItem[] = [
    {
        id: 'legacy-sheet',
        type: 'calculator',
        label: 'Sac Büküm (Sheet Metal Bending)',
        title: 'Sac Büküm (Sheet Metal Bending)',
        description: 'DIN 6935 K-Faktörü ve açınım boyu (flat pattern) hesabı',
        category: 'legacy',
        categoryTitle: 'Klasik Araçlar',
        color: '#64748b',
        icon: Settings,
        iso: 'DIN 6935',
        payload: { schemaId: 'sheet-metal' },
    },
    {
        id: 'legacy-beam',
        type: 'calculator',
        label: 'Kiriş Sehimi (Beam Deflection)',
        title: 'Kiriş Sehimi (Beam Deflection)',
        description: 'Basit mesnetli ve ankastre kiriş eğilme ve gerilme analizi',
        category: 'legacy',
        categoryTitle: 'Klasik Araçlar',
        color: '#64748b',
        icon: Settings,
        iso: 'DIN 1052',
        payload: { schemaId: 'beam-deflection' },
    },
    {
        id: 'legacy-bearing',
        type: 'calculator',
        label: 'Rulman Ömrü (Bearing Life L10h)',
        title: 'Rulman Ömrü (Bearing Life L10h)',
        description: 'ISO 281 dinamik eşdeğer yük ve temel anma ömrü hesabı',
        category: 'legacy',
        categoryTitle: 'Klasik Araçlar',
        color: '#64748b',
        icon: Circle,
        iso: 'ISO 281',
        payload: { schemaId: 'bearings' },
    },
    {
        id: 'legacy-profile',
        type: 'calculator',
        label: 'Profil Ağırlık Hesabı',
        title: 'Profil Ağırlık Hesabı',
        description: 'Standart çelik ve alüminyum profillerin metre ağırlığı ve hacmi',
        category: 'legacy',
        categoryTitle: 'Klasik Araçlar',
        color: '#64748b',
        icon: Box,
        iso: 'EN 755',
        payload: { schemaId: 'profile-weight' },
    },
    {
        id: 'util-nesting',
        type: 'visualizer',
        label: '2D Sac Yerleşim (Nesting)',
        title: '2D Sac Yerleşim (Nesting)',
        description: 'Parçaların tabaka üzerine optimal yerleşimi ve fire minimizasyonu',
        category: 'visual',
        categoryTitle: 'Görselleştiriciler',
        color: '#a855f7',
        icon: Grid3X3,
        iso: 'CNC / CAM',
        payload: { vizType: 'nesting' },
    },
    {
        id: 'util-3dbox',
        type: 'visualizer',
        label: '3D Kutu & Hacim Önizleme',
        title: '3D Kutu & Hacim Önizleme',
        description: 'Parametrik 3D katı prizma ve montaj hacmi görselleştirmesi',
        category: 'visual',
        categoryTitle: 'Görselleştiriciler',
        color: '#a855f7',
        icon: Box,
        iso: '3D CAD',
        payload: { vizType: '3d-box' },
    },
    {
        id: 'util-note',
        type: 'note',
        label: 'Mühendislik Notu (Design Note)',
        title: 'Mühendislik Notu (Design Note)',
        description: 'Akış tuvali üzerine serbest mühendislik açıklamaları ve hesap notları ekleme',
        category: 'visual',
        categoryTitle: 'Görselleştiriciler',
        color: '#a855f7',
        icon: Book,
        payload: { content: 'Mühendislik Tasarım Notu...' },
    },
];

let cachedCatalog: FlowCatalogItem[] | null = null;

export function getFlowCatalog(): FlowCatalogItem[] {
    if (cachedCatalog) return cachedCatalog;

    const registrySchemas = listNodes();
    const items: FlowCatalogItem[] = registrySchemas.map((schema) => {
        const catId = CATEGORY_MAP[schema.category] || 'utility';
        const catMeta = FLOW_CATEGORIES.find((c) => c.id === catId);

        return {
            id: schema.id,
            type: 'engineering',
            label: schema.title,
            title: schema.title,
            description: schema.description || `${schema.title} hesaplama motoru`,
            category: catId,
            categoryTitle: catMeta?.labelTr || catId,
            color: catMeta?.color || '#00e5ff',
            icon: CATEGORY_ICONS[catId] || Zap,
            iso: schema.isoStandard,
            payload: { schemaId: schema.id },
        };
    });

    cachedCatalog = [...items, ...LEGACY_ITEMS];
    return cachedCatalog;
}

export function getFlowItemsByCategory(categoryId: string): FlowCatalogItem[] {
    const catalog = getFlowCatalog();
    if (categoryId === 'all') return catalog;
    return catalog.filter((item) => item.category === categoryId);
}

export function spawnCatalogItem(item: FlowCatalogItem, position: { x: number; y: number }): string | null {
    const store = useFlowStore.getState();

    if (item.type === 'engineering' && item.payload?.schemaId) {
        return store.addEngineeringNode(item.payload.schemaId, position);
    } else if (item.type === 'calculator' && item.payload?.schemaId) {
        return store.addCalculatorNode(item.payload.schemaId, position);
    } else if (item.type === 'visualizer' && item.payload?.vizType) {
        return store.addVisualizerNode(item.payload.vizType as any, position);
    } else if (item.type === 'note') {
        return store.addNoteNode(item.payload?.content || 'Yeni Mühendislik Notu', position);
    }
    return null;
}
