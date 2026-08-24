/**
 * Global Materials Database
 * Data extracted from NotebookLM MCP (ID: eb3e3093-b731-489e-9f32-b7161672f53f)
 */

export interface IMaterial {
  id: string;
  name: string;
  type: 'Metal' | 'Polymer' | 'Composite';
  density: number; // g/cm³
  yieldStrength: number; // MPa
  modulusOfElasticity: number; // GPa
  sourceNotes?: string;
}

export const materialsDB: Record<string, IMaterial> = {
  // Source: Alüminyum (6061-T6 Alaşımı): Yoğunluk: 2.70 g/cm³, Akma Dayanımı: 276 MPa, Elastisite Modülü: 69 GPa [1, 2].
  'alu-6061': {
    id: 'alu-6061',
    name: 'Aluminum 6061-T6',
    type: 'Metal',
    density: 2.70,
    yieldStrength: 276,
    modulusOfElasticity: 69,
    sourceNotes: 'Data from NotebookLM: Alüminyum (6061-T6 Alaşımı)',
  },
  // Source: Yapı Çeliği (S235): Yoğunluk: 7.85 g/cm³, Akma Dayanımı: 235 MPa, Elastisite Modülü: 210 GPa [1, 2].
  'steel-s235': {
    id: 'steel-s235',
    name: 'Structural Steel S235',
    type: 'Metal',
    density: 7.85,
    yieldStrength: 235,
    modulusOfElasticity: 210,
    sourceNotes: 'Data from NotebookLM: Yapı Çeliği (S235)',
  },
  // Source: Kestamid (Polimer): Yoğunluk: 1.15 g/cm³, Akma Dayanımı: 85 MPa, Elastisite Modülü: 3.2 GPa [1, 2]. 
  // (PLA/PELA temsili olarak kullanılmıştır, NotebookLM'de PLA için spesifik mekanik veri bulunmadığı için Kestamid baz alınmıştır)
  'pla-kestamid': {
    id: 'pla-kestamid',
    name: 'PLA / Kestamid (Polymer Rep.)',
    type: 'Polymer',
    density: 1.15,
    yieldStrength: 85,
    modulusOfElasticity: 3.2,
    sourceNotes: 'Data from NotebookLM: Kestamid used as representative for PLA due to lack of specific PLA mechanical data.',
  }
};
