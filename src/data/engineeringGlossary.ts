/**
 * AluCAD OS — Central Engineering Terminology Glossary (TR / EN / DE)
 * 
 * Standardizes technical engineering terminology, symbols, governing standards,
 * and units across all calculation engines, UI labels, and PDF report exports.
 * 
 * Reference Standards:
 * - VDI 2230 Blatt 1: Systematic calculation of high duty bolted joints
 * - ISO 281: Rolling bearings — Dynamic load ratings and rating life
 * - DIN 6885-1: Drive Type Fastenings without Taper Action — Parallel Keys
 * - ISO 6336: Calculation of load capacity of spur and helical gears
 * - ISO 898-1: Mechanical properties of fasteners made of carbon steel
 */

export interface GlossaryEntry {
    id: string;
    symbol: string;
    unit: string;
    standard: string;
    en: {
        label: string;
        description: string;
    };
    tr: {
        label: string;
        description: string;
    };
    de: {
        label: string;
        description: string;
    };
}

export const ENGINEERING_GLOSSARY: Record<string, GlossaryEntry> = {
    // ═══════════════ FASTENERS & BOLTED JOINTS (VDI 2230 / ISO 898) ═══════════════
    tightening_torque: {
        id: 'tightening_torque',
        symbol: 'M_A',
        unit: 'N·m',
        standard: 'VDI 2230 §5.4.2',
        en: {
            label: 'Tightening Torque',
            description: 'Total torque applied to the fastener to achieve the target assembly preload force.',
        },
        tr: {
            label: 'Sıkma Torku',
            description: 'Hedef montaj ön yükünü elde etmek için cıvataya uygulanan toplam tork.',
        },
        de: {
            label: 'Anziehdrehmoment',
            description: 'Gesamtes zum Aufbringen der Montagevorspannkraft erforderliches Drehmoment.',
        },
    },
    preload_force: {
        id: 'preload_force',
        symbol: 'F_M',
        unit: 'kN',
        standard: 'VDI 2230 §5.1',
        en: {
            label: 'Assembly Preload Force',
            description: 'Axial tensile clamp force generated in the bolt during tightening at assembly.',
        },
        tr: {
            label: 'Montaj Ön Yükü',
            description: 'Montaj esnasında sıkma ile cıvata gövdesinde oluşturulan eksenel çekme kuvveti.',
        },
        de: {
            label: 'Montagevorspannkraft',
            description: 'Beim Anziehen im Schraubenbolzen erzeugte axiale Klemmkraft.',
        },
    },
    pitch_stretch_torque: {
        id: 'pitch_stretch_torque',
        symbol: 'M_1',
        unit: 'N·m',
        standard: 'VDI 2230 §5.4.2',
        en: {
            label: 'Pitch Stretch Torque',
            description: 'Useful torque component converted into axial elastic elongation along the thread helix.',
        },
        tr: {
            label: 'Hatve Uzama Torku',
            description: 'Diş helisi boyunca eksenel elastik uzamaya dönüştürülen faydalı tork bileşeni.',
        },
        de: {
            label: 'Gewindesteigungsmoment',
            description: 'Nutzanteil des Drehmoments zur elastischen Längung der Schraube.',
        },
    },
    thread_friction_torque: {
        id: 'thread_friction_torque',
        symbol: 'M_2',
        unit: 'N·m',
        standard: 'VDI 2230 §5.4.2',
        en: {
            label: 'Thread Friction Torque',
            description: 'Torque component lost to friction between mating bolt and nut/tapped threads.',
        },
        tr: {
            label: 'Diş Sürtünme Torku',
            description: 'Cıvata ve somun/gövde dişleri arasındaki temas sürtünmesinde harcanan tork.',
        },
        de: {
            label: 'Gewindereibungsmoment',
            description: 'Momentenanteil zur Überwindung der Reibung im Gewinde.',
        },
    },
    underhead_friction_torque: {
        id: 'underhead_friction_torque',
        symbol: 'M_3 (M_K)',
        unit: 'N·m',
        standard: 'VDI 2230 §5.4.2',
        en: {
            label: 'Underhead Bearing Friction Torque',
            description: 'Torque component dissipated by friction between bolt head (or nut face) and clamped part.',
        },
        tr: {
            label: 'Kafa Altı Sürtünme Torku',
            description: 'Cıvata kafası (veya somun oturma yüzeyi) ile bağlanan parça arasındaki sürtünme torku.',
        },
        de: {
            label: 'Kopfreibungsmoment',
            description: 'Drehmomentanteil zur Überwindung der Reibung unter dem Schraubenkopf.',
        },
    },
    total_thread_torque: {
        id: 'total_thread_torque',
        symbol: 'M_G',
        unit: 'N·m',
        standard: 'VDI 2230 §5.4.2',
        en: {
            label: 'Total Thread Torque (M₁ + M₂)',
            description: 'Combined torque acting in the thread shank (pitch lead torque plus thread flank friction).',
        },
        tr: {
            label: 'Toplam Diş Bölgesi Torku (M₁ + M₂)',
            description: 'Diş gövdesinde etkiyen toplam tork (hatve uzama torku artı diş yanı sürtünme torku).',
        },
        de: {
            label: 'Gewindemoment (M₁ + M₂)',
            description: 'Gesamtes im Gewindebereich wirkendes Moment (Steigung plus Flankenreibung).',
        },
    },
    surface_pressure: {
        id: 'surface_pressure',
        symbol: 'p_M',
        unit: 'MPa',
        standard: 'VDI 2230 §5.5.3',
        en: {
            label: 'Underhead Surface Pressure',
            description: 'Compressive contact stress exerted by the bolt head or washer on the clamped workpiece.',
        },
        tr: {
            label: 'Kafa Altı Yüzey Basıncı',
            description: 'Cıvata kafası veya pulun bağlanan parça yüzeyine uyguladığı basma temas gerilmesi.',
        },
        de: {
            label: 'Flächenpressung',
            description: 'Druckspannung unter der Schraubenkopf- oder Mutternauflagefläche.',
        },
    },
    permissible_surface_pressure: {
        id: 'permissible_surface_pressure',
        symbol: 'p_G,zul',
        unit: 'MPa',
        standard: 'VDI 2230 Table A10',
        en: {
            label: 'Permissible Surface Pressure',
            description: 'Maximum allowable compressive bearing stress of the clamped material without plastic indentation.',
        },
        tr: {
            label: 'İzin Verilen Yüzey Basıncı',
            description: 'Bağlanan malzemenin kalıcı ezilme olmadan taşıyabileceği azami basma gerilmesi sınırı.',
        },
        de: {
            label: 'Grenzflächenpressung',
            description: 'Zulässige Flächenpressung des verspannten Werkstoffs gegen bleibende Verformung.',
        },
    },
    equivalent_stress: {
        id: 'equivalent_stress',
        symbol: 'σ_eq',
        unit: 'MPa',
        standard: 'von Mises / VDI 2230',
        en: {
            label: 'Equivalent von Mises Stress',
            description: 'Combined octahedral shear stress state from simultaneous axial tension and torsional shear.',
        },
        tr: {
            label: 'Eşdeğer von Mises Gerilmesi',
            description: 'Eş zamanlı eksenel çekme ve burulma kayma gerilmelerinin birleşik akma eşdeğeri.',
        },
        de: {
            label: 'Vergleichsspannung',
            description: 'Kombinierte Vergleichsspannung aus Zug- und Torsionsspannung nach der Gestaltänderungsenergiehypothese.',
        },
    },

    // ═══════════════ ROLLING BEARINGS (ISO 281 / ISO 76) ═══════════════
    nominal_bearing_life: {
        id: 'nominal_bearing_life',
        symbol: 'L_10h',
        unit: 'hours',
        standard: 'ISO 281:2007',
        en: {
            label: 'Basic Rating Life',
            description: 'Operating life in hours achieved or exceeded by 90% of an apparently identical bearing group.',
        },
        tr: {
            label: 'Temel Nominal Rulman Ömrü',
            description: 'Özdeş rulman grubunun %90\'ı tarafından arızasız ulaşılan veya aşılan çalışma saati.',
        },
        de: {
            label: 'Nominelle Lebensdauer',
            description: 'Betriebslebensdauer in Stunden, die von 90% einer Lagergesamtheit erreicht oder überschritten wird.',
        },
    },
    equivalent_dynamic_load: {
        id: 'equivalent_dynamic_load',
        symbol: 'P',
        unit: 'kN',
        standard: 'ISO 281:2007 §5.2',
        en: {
            label: 'Dynamic Equivalent Radial Load',
            description: 'Hypothetical constant radial load producing the same rating life as the actual combined radial and axial loads.',
        },
        tr: {
            label: 'Dinamik Eşdeğer Radyal Yük',
            description: 'Mevcut birleşik radyal ve eksenel yüklerle aynı ömrü veren varsayımsal sabit radyal yük.',
        },
        de: {
            label: 'Dynamisch äquivalente Radialbelastung',
            description: 'Konstante radiale Belastung, die zur gleichen Lebensdauer führt wie die tatsächlich wirkende kombinierte Belastung.',
        },
    },
    radial_load: {
        id: 'radial_load',
        symbol: 'F_r',
        unit: 'kN',
        standard: 'ISO 281',
        en: {
            label: 'Radial Load',
            description: 'Component of applied load acting perpendicular to the bearing rotational axis.',
        },
        tr: {
            label: 'Radyal Yük',
            description: 'Rulman dönme eksenine dik doğrultuda etkiyen yük bileşeni.',
        },
        de: {
            label: 'Radiallast',
            description: 'Rechtwinklig zur Drehachse des Lagers wirkende Lastkomponente.',
        },
    },
    axial_load: {
        id: 'axial_load',
        symbol: 'F_a',
        unit: 'kN',
        standard: 'ISO 281',
        en: {
            label: 'Axial Load (Thrust)',
            description: 'Component of applied load acting parallel to the bearing rotational axis.',
        },
        tr: {
            label: 'Eksenel Yük',
            description: 'Rulman dönme eksenine paralel doğrultuda etkiyen eksenel itme yükü bileşeni.',
        },
        de: {
            label: 'Axiallast',
            description: 'Parallel zur Drehachse des Lagers wirkende Lastkomponente.',
        },
    },
    dynamic_load_rating: {
        id: 'dynamic_load_rating',
        symbol: 'C',
        unit: 'kN',
        standard: 'ISO 281:2007',
        en: {
            label: 'Basic Dynamic Load Rating',
            description: 'Constant radial load that gives a basic rating life of one million revolutions (10^6 rev).',
        },
        tr: {
            label: 'Temel Dinamik Yük Sayısı',
            description: 'Rulmana 1 milyon devirlik (10^6 devir) temel nominal ömür sağlayan sabit radyal yük kapasitesi.',
        },
        de: {
            label: 'Dynamische Tragzahl',
            description: 'Konstante radiale Belastung für eine nominelle Lebensdauer von einer Million Umdrehungen.',
        },
    },

    // ═══════════════ SHAFT CONNECTIONS & KEYWAYS (DIN 6885) ═══════════════
    keyway_flank_pressure: {
        id: 'keyway_flank_pressure',
        symbol: 'p',
        unit: 'MPa',
        standard: 'DIN 6885-1',
        en: {
            label: 'Keyway Flank Surface Pressure',
            description: 'Effective contact compressive stress on the key flank transferred between shaft and hub.',
        },
        tr: {
            label: 'Kama Yan Yüzey Basıncı',
            description: 'Mil ile göbek arasında tork iletimi esnasında kama yan yüzeyinde oluşan basma gerilmesi.',
        },
        de: {
            label: 'Passfeder-Flankenpressung',
            description: 'Wirksame Flächenpressung an den tragenden Flanken der Passfederverbindung.',
        },
    },
    keyway_permissible_pressure: {
        id: 'keyway_permissible_pressure',
        symbol: 'p_zul',
        unit: 'MPa',
        standard: 'DIN 6885-1 / DIN 743',
        en: {
            label: 'Permissible Keyway Pressure',
            description: 'Allowable flank surface pressure of the hub or shaft material under static or pulsating torque.',
        },
        tr: {
            label: 'İzin Verilen Kama Basıncı',
            description: 'Statik veya titreşimli tork altında göbek veya mil malzemesinin izin verilen basma sınırı.',
        },
        de: {
            label: 'Zulässige Flankenpressung',
            description: 'Maximal zulässige Flankenpressung für den Naben- bzw. Wellenwerkstoff.',
        },
    },
    safety_factor: {
        id: 'safety_factor',
        symbol: 'S_F',
        unit: '—',
        standard: 'ISO / DIN General',
        en: {
            label: 'Safety Factor',
            description: 'Ratio of permissible material resistance to the calculated operational demand stress.',
        },
        tr: {
            label: 'Emniyet Katsayısı',
            description: 'İzin verilen malzeme dayanım sınırının hesaplanan işletme gerilmesine oranı.',
        },
        de: {
            label: 'Sicherheitsfaktor',
            description: 'Verhältnis der zulässigen Werkstoffbeanspruchung zur berechneten Betriebsspannung.',
        },
    },

    // ═══════════════ GEAR TRANSMISSIONS (ISO 6336) ═══════════════
    tooth_bending_stress: {
        id: 'tooth_bending_stress',
        symbol: 'σ_F',
        unit: 'MPa',
        standard: 'ISO 6336-3',
        en: {
            label: 'Tooth Root Bending Stress',
            description: 'Calculated tensile fillet bending stress at the tooth root section under operating torque.',
        },
        tr: {
            label: 'Diş Dibi Eğilme Gerilmesi',
            description: 'İşletme torku altında diş dibi kavisinde oluşan hesaplanmış çekme gerilmesi.',
        },
        de: {
            label: 'Zahnfußspannung',
            description: 'Berechnete Biegespannung in der Zahnfußausrundung unter Nennlast.',
        },
    },
    tooth_contact_stress: {
        id: 'tooth_contact_stress',
        symbol: 'σ_H',
        unit: 'MPa',
        standard: 'ISO 6336-2',
        en: {
            label: 'Tooth Flank Contact Stress (Hertzian)',
            description: 'Compressive Hertzian contact pressure on the active tooth flank to evaluate pitting risk.',
        },
        tr: {
            label: 'Diş Yan Yüzey Temas Gerilmesi (Hertz)',
            description: 'Çukurlaşma (pitting) riskini denetlemek için aktif diş profilinde oluşan Hertz temas basıncı.',
        },
        de: {
            label: 'Flankenpressung (Hertzsche Pressung)',
            description: 'Hertzsche Pressung an den Zahnflanken zur Vermeidung von Grübchenbildung.',
        },
    },
};

/**
 * Retrieves localized metadata for a standardized engineering term.
 */
export function getEngineeringTerm(
    termId: keyof typeof ENGINEERING_GLOSSARY | string,
    lang: 'tr' | 'en' | 'de' | string = 'en',
): { id: string; symbol: string; unit: string; standard: string; label: string; description: string } | null {
    const entry = ENGINEERING_GLOSSARY[termId];
    if (!entry) return null;

    const loc = lang === 'tr' ? entry.tr : lang === 'de' ? entry.de : entry.en;
    return {
        id: entry.id,
        symbol: entry.symbol,
        unit: entry.unit,
        standard: entry.standard,
        label: loc?.label ?? entry.en.label,
        description: loc?.description ?? entry.en.description,
    };
}

/**
 * Lists all registered engineering glossary terms.
 */
export function getAllGlossaryTerms(): GlossaryEntry[] {
    return Object.values(ENGINEERING_GLOSSARY);
}
