import type { FlowNode, FlowEdge } from '@/store/flowStore';

export type FlowTemplateCategory =
    | 'powertrain'
    | 'gears'
    | 'structural'
    | 'fasteners'
    | 'pressure_vessels'
    | 'manufacturing'
    | 'physics_dynamics'
    | 'chemistry_thermo'
    | 'metallurgy_materials';

export interface FlowTemplate {
    id: string;
    title: string;
    titleTr?: string;
    category: FlowTemplateCategory;
    standard: string;
    description: string;
    descriptionTr?: string;
    tags: string[];
    featured?: boolean;
    nodes: FlowNode[];
    edges: FlowEdge[];
}

export const TEMPLATE_CATEGORY_META: Record<FlowTemplateCategory | 'all', { labelTr: string; labelEn: string }> = {
    all: { labelTr: 'Tümü', labelEn: 'All' },
    powertrain: { labelTr: 'Güç Aktarımı', labelEn: 'Power Transmission' },
    gears: { labelTr: 'Dişliler', labelEn: 'Gears' },
    structural: { labelTr: 'Yapısal', labelEn: 'Structural' },
    fasteners: { labelTr: 'Bağlantı', labelEn: 'Fasteners' },
    pressure_vessels: { labelTr: 'Basınçlı Kaplar', labelEn: 'Pressure Vessels' },
    manufacturing: { labelTr: 'İmalat', labelEn: 'Manufacturing' },
    physics_dynamics: { labelTr: 'Fizik & Dinamik', labelEn: 'Physics & Dynamics' },
    chemistry_thermo: { labelTr: 'Kimya & Termo', labelEn: 'Chemistry & Thermo' },
    metallurgy_materials: { labelTr: 'Metalurji & Isıl İşlem', labelEn: 'Metallurgy & Materials' },
};
