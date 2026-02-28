/**
 * Machinery's Handbook - Materials Properties Section
 */

export const HANDBOOK_MATERIALS = {
    metals: [
        {
            group: 'Carbon Steels',
            grades: [
                { name: 'AISI 1018', yield_strength: '370 MPa', tensile_strength: '440 MPa', hardness: '126 HB' },
                { name: 'AISI 1045', yield_strength: '530 MPa', tensile_strength: '625 MPa', hardness: '163 HB' }
            ]
        },
        {
            group: 'Stainless Steels',
            grades: [
                { name: 'AISI 304', yield_strength: '215 MPa', tensile_strength: '505 MPa', elongation: '70 %' },
                { name: 'AISI 316', yield_strength: '290 MPa', tensile_strength: '580 MPa', elongation: '50 %' }
            ]
        }
    ],
    aluminum_alloys: [
        { name: '6061-T6', yield_strength: '276 MPa', tensile_strength: '310 MPa', modulus: '68.9 GPa' },
        { name: '7075-T6', yield_strength: '503 MPa', tensile_strength: '572 MPa', modulus: '71.7 GPa' }
    ]
};
