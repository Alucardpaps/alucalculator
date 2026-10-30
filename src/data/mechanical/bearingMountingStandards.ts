/**
 * Bearing Mounting Standards, Abutment Dimensions & Assembly Protocols
 * 
 * Sources:
 * - DIN 5418: Housing and shaft abutment dimensions for radial rolling bearings
 * - ISO 15: Rolling bearings - Radial bearings - Boundary dimensions
 * - ISO 286: ISO system of limits and fits
 * - DIN 981 / DIN 5406: Locknuts and locking washers
 * - DIN 471 / DIN 472: Retaining rings for shafts and bores
 * - SKF Bearing Maintenance Handbook (PUB SR/P7 10001/1 EN): Dismounting & Mounting Protocols
 * 
 * Strictly deterministic and family-differentiated across all 8 bearing families.
 */

import type { BearingType } from '@/data/skfBearings';
import { SKF_MASTER_CATALOG, SKFBearingRecord } from '@/data/mechanical/skfCatalogDatabase';

export type MountingArrangementType =
    | 'locating'
    | 'non-locating'
    | 'back-to-back'
    | 'face-to-face'
    | 'tandem'
    | 'cross-located'
    | 'thrust-axial'
    | 'tapered-sleeve'
    | 'adapter-sleeve';

export interface AbutmentDimensions {
    type: BearingType;
    d: number;               // Bore diameter (mm)
    D: number;               // Outer diameter (mm)
    B: number;               // Width (mm) or total assembly width T or height H
    rMin: number;            // Bearing minimum chamfer dimension (mm)
    daMin: number;           // Min shaft abutment shoulder diameter (mm)
    daMax: number;           // Max shaft abutment shoulder diameter (mm)
    DaMax: number;           // Max housing abutment shoulder diameter (mm)
    DaMin: number;           // Min housing abutment shoulder diameter (mm)
    raMax: number;           // Max shaft/housing fillet radius (mm) - prevents corner jamming
    d1Shoulder: number;      // Inner ring shoulder diameter (mm)
    D1Shoulder: number;      // Outer ring shoulder / counterbore diameter (mm)
    shaftFit: string;        // Recommended ISO shaft fit (e.g. k5, m5, j6)
    housingFit: string;      // Recommended ISO housing fit (e.g. H7, J7)
    axialFloatClearance: number; // Recommended axial expansion clearance for non-locating (mm)
    locknut: {
        designation: string; // DIN 981 (e.g. KM 4)
        thread: string;      // (e.g. M20x1)
        washer: string;      // DIN 5406 (e.g. MB 4)
        outerDia: number;    // Locknut OD (mm)
        tighteningTorqueNm: number; // Recommended mounting torque
    };
    circlip: {
        shaft: string;       // DIN 471 (e.g. 20x1.2)
        housing: string;     // DIN 472 (e.g. 47x1.75)
    };
    replenishmentGreaseGrams: number; // SKF G = 0.005 * D * B (g) - replenishment only!
    initialGreaseFillGrams: number;   // 20-30% housing free volume (g) for open; 0 for pre-greased
    greaseGramsInitial: number;       // Backward compatibility field
    isPreGreasedSealed: boolean;      // True for 2RSH, 2RS1, 2Z (factory greased, no initial grease!)
    inductionHeatingTempC: number;    // Target temperature (°C)
    radialThermalExpansionUm: number; // Expansion at target temperature (µm)

    // Family-specific dimensions
    totalWidthT?: number;              // Tapered roller total width T (mm)
    coneWidthB?: number;               // Tapered roller cone width B (mm)
    cupWidthC?: number;                // Tapered roller cup width C (mm)
    loadCenterDistA?: number;          // Tapered roller effective load center a (mm)
    heightH?: number;                  // Thrust bearing height H (mm)
    racewayDiameterF?: number;         // Cylindrical / needle raceway diameter F (mm)
    shaftHardnessHrc?: string;         // Needle HK shaft raceway requirement
    shaftRoughnessRa?: string;         // Needle HK surface finish
    taperedBoreAvailable?: boolean;    // Spherical / self-aligning K taper
    adapterSleeveDesignation?: string; // e.g. H 305, H 204
    isNonLocating?: boolean;          // True for NU cylindrical
    isSeparable?: boolean;            // True for tapered and cylindrical
    isReusableAfterDismounting?: boolean; // False for HK drawn cup
}

export interface MountingMethodInfo {
    id: MountingArrangementType;
    nameTr: string;
    nameEn: string;
    symbol: string;
    descriptionTr: string;
    descriptionEn: string;
    advantagesTr: string[];
    typicalApplicationsTr: string[];
    rulesTr: string[];
}

export interface SKFToolRecommendation {
    toolCode: string;
    toolNameTr: string;
    toolNameEn: string;
    purpose: 'mounting' | 'dismounting';
    method: 'mechanical' | 'thermal' | 'hydraulic';
    sizeRange: string;
    descriptionTr: string;
    descriptionEn?: string;
    safetyRuleTr: string;
    safetyRuleEn?: string;
}

export interface SKFMaintenanceProtocol {
    recommendedMountingTools: SKFToolRecommendation[];
    recommendedDismountingTools: SKFToolRecommendation[];
    mountingStepsTr: string[];
    mountingStepsEn?: string[];
    dismountingStepsTr: string[];
    dismountingStepsEn?: string[];
    goldenSafetyRulesTr: string[];
    goldenSafetyRulesEn?: string[];
    maxHeatingTempC: number;
    heatingNoteTr: string;
    heatingNoteEn?: string;
    driveUpMethodRecommended?: boolean;
    feelerGaugeApplicable?: boolean;
}

/**
 * Standard Locknut lookup based on shaft diameter d
 */
function getLocknutData(d: number): {
    designation: string;
    thread: string;
    washer: string;
    outerDia: number;
    tighteningTorqueNm: number;
} {
    const kmSizes: Record<number, { km: number; thread: string; d2: number; torque: number }> = {
        10: { km: 0, thread: 'M10x0.75', d2: 18, torque: 8 },
        12: { km: 1, thread: 'M12x1', d2: 22, torque: 12 },
        15: { km: 2, thread: 'M15x1', d2: 25, torque: 18 },
        17: { km: 3, thread: 'M17x1', d2: 28, torque: 25 },
        20: { km: 4, thread: 'M20x1', d2: 32, torque: 35 },
        25: { km: 5, thread: 'M25x1.5', d2: 38, torque: 50 },
        30: { km: 6, thread: 'M30x1.5', d2: 45, torque: 75 },
        35: { km: 7, thread: 'M35x1.5', d2: 52, torque: 100 },
        40: { km: 8, thread: 'M40x1.5', d2: 58, torque: 135 },
        45: { km: 9, thread: 'M45x1.5', d2: 65, torque: 175 },
        50: { km: 10, thread: 'M50x1.5', d2: 70, torque: 220 },
        55: { km: 11, thread: 'M55x2', d2: 75, torque: 270 },
        60: { km: 12, thread: 'M60x2', d2: 80, torque: 330 },
        65: { km: 13, thread: 'M65x2', d2: 85, torque: 400 },
        70: { km: 14, thread: 'M70x2', d2: 92, torque: 470 },
        75: { km: 15, thread: 'M75x2', d2: 98, torque: 550 },
        80: { km: 16, thread: 'M80x2', d2: 105, torque: 650 },
        85: { km: 17, thread: 'M85x2', d2: 110, torque: 750 },
        90: { km: 18, thread: 'M90x2', d2: 120, torque: 860 },
        95: { km: 19, thread: 'M95x2', d2: 125, torque: 980 },
        100: { km: 20, thread: 'M100x2', d2: 130, torque: 1100 },
    };

    const entry = kmSizes[d];
    if (entry) {
        return {
            designation: `DIN 981 KM ${entry.km}`,
            thread: entry.thread,
            washer: `DIN 5406 MB ${entry.km}`,
            outerDia: entry.d2,
            tighteningTorqueNm: entry.torque,
        };
    }

    const approxKm = Math.round(d / 5);
    return {
        designation: `DIN 981 KM ${approxKm}`,
        thread: `M${d}x${d >= 55 ? 2 : 1.5}`,
        washer: `DIN 5406 MB ${approxKm}`,
        outerDia: Math.round(d * 1.35),
        tighteningTorqueNm: Math.round(d * 10),
    };
}

/**
 * Standard Circlip (Segman) lookup
 */
function getCirclipData(d: number, D: number): { shaft: string; housing: string } {
    return {
        shaft: `DIN 471 ${d}x${d <= 25 ? '1.2' : d <= 50 ? '1.5' : '2.0'}`,
        housing: `DIN 472 ${D}x${D <= 35 ? '1.5' : D <= 62 ? '1.75' : '2.5'}`,
    };
}

/**
 * Calculate engineering abutment shoulders and mounting parameters per DIN 5418 / ISO 15
 */
export function calculateAbutmentDimensions(
    type: BearingType,
    d: number,
    D: number,
    B: number,
): AbutmentDimensions {
    // Look up exact authentic SKF catalog record if available
    const skfRecord = SKF_MASTER_CATALOG.find(
        (b) => b.type === type && b.d === d && b.D === D && Math.abs(b.B - B) < 0.6
    );

    const deltaD = D - d;

    // Minimum bearing corner chamfer r_min (mm)
    let rMin = skfRecord ? skfRecord.r12Min : 0.3;
    if (!skfRecord) {
        if (d >= 50 || D >= 90) rMin = 1.5;
        else if (d >= 30 || D >= 62) rMin = 1.1;
        else if (d >= 17 || D >= 42) rMin = 1.0;
        else if (d >= 10 || D >= 30) rMin = 0.6;
    }

    // Fatura pah radyusu: ra_max KESİNLİKLE r_min'den küçük veya eşit olmalıdır!
    const raMax = skfRecord ? skfRecord.raMax : Number((rMin * 0.8).toFixed(1));

    // DIN 5418 Fatura Çapları
    let daMin = skfRecord ? skfRecord.daMin : 0;
    let daMax = skfRecord ? skfRecord.daMax : 0;
    let DaMax = skfRecord ? skfRecord.DaMax : 0;
    let DaMin = 0;

    if (!skfRecord) {
        let daMinFactor = 0.18;
        let daMaxFactor = 0.32;
        let DaMaxFactor = 0.18;
        let DaMinFactor = 0.32;

        if (type === 'tapered-roller') {
            daMinFactor = 0.20;
            daMaxFactor = 0.38;
            DaMaxFactor = 0.15;
        } else if (type === 'thrust-ball' || type === 'thrust-roller') {
            daMinFactor = 0.45;
            DaMaxFactor = 0.45;
        }

        daMin = Number((d + deltaD * daMinFactor).toFixed(1));
        daMax = Number((d + deltaD * daMaxFactor).toFixed(1));
        DaMax = Number((D - deltaD * DaMaxFactor).toFixed(1));
        DaMin = Number((D - deltaD * DaMinFactor).toFixed(1));
    } else {
        DaMin = skfRecord.DaMin || Number((D - deltaD * 0.32).toFixed(1));
    }

    // İç ve dış bilezik omuz / girinti çapları (d2, D2)
    const d1Shoulder = type === 'thrust-ball' || type === 'thrust-roller'
        ? (skfRecord?.shaftWasherOuterD1 || skfRecord?.d2 || D)
        : (skfRecord ? skfRecord.d2 : Number((d + deltaD * 0.33).toFixed(1)));
    const D1Shoulder = type === 'thrust-ball' || type === 'thrust-roller'
        ? (skfRecord?.housingWasherBoreD1 || (d + 1))
        : (skfRecord ? skfRecord.D2 : Number((D - deltaD * 0.33).toFixed(1)));

    // ISO 286 Geçme Toleransları
    let shaftFit = 'k5';
    if (d <= 18) shaftFit = 'j6';
    else if (d <= 50) shaftFit = 'k5';
    else if (d <= 100) shaftFit = 'm5';
    else shaftFit = 'n6';

    let housingFit = 'H7';
    if (type === 'tapered-roller') {
        shaftFit = d <= 50 ? 'm5' : 'n6';
        housingFit = 'K7';
    } else if (type === 'angular-contact-ball') {
        shaftFit = d <= 50 ? 'm5' : 'n6';
        housingFit = 'J7';
    } else if (type === 'thrust-ball' || type === 'thrust-roller') {
        shaftFit = 'j6';
        housingFit = 'H8';
    } else if (type === 'needle-roller') {
        shaftFit = 'h5';
        housingFit = 'K7';
    }

    const axialFloatClearance = Number((1.5 + (D / 100)).toFixed(1));
    const locknut = getLocknutData(d);
    const circlip = getCirclipData(d, D);

    // SKF Lubrication Formulations
    // 1. Replenishment (Yeniden Yağlama): Gp = 0.005 * D * B (g)
    const effectiveWidth = skfRecord?.totalWidthT || skfRecord?.heightH || B;
    const replenishmentGreaseGrams = Math.max(1, Number((0.005 * D * effectiveWidth).toFixed(1)));

    // 2. Initial Fill (İlk Montaj Dolumu): Free volume estimate ~ 25% of V_free (density ~ 0.9 g/cm³)
    const approxBearingVolumeCm3 = (Math.PI * (D * D - d * d) * effectiveWidth / 4) / 1000;
    const isPreGreased = skfRecord ? (skfRecord.capping === '2RSH' || skfRecord.capping === '2Z') : false;
    const initialGreaseFillGrams = isPreGreased 
        ? 0 
        : Math.max(2, Number((approxBearingVolumeCm3 * 0.25 * 0.9).toFixed(1)));

    // Backward compatibility
    const greaseGramsInitial = initialGreaseFillGrams || replenishmentGreaseGrams;

    // Thermal expansion during mounting: Δd = d * α * ΔT
    const inductionHeatingTempC = isPreGreased ? 80 : 110;
    const deltaT = inductionHeatingTempC - 20; // 20°C ambient
    const radialThermalExpansionUm = Math.round(d * 12e-6 * deltaT * 1000);

    return {
        type,
        d,
        D,
        B: effectiveWidth,
        rMin,
        daMin,
        daMax,
        DaMax,
        DaMin,
        raMax,
        d1Shoulder,
        D1Shoulder,
        shaftFit,
        housingFit,
        axialFloatClearance,
        locknut,
        circlip,
        replenishmentGreaseGrams,
        initialGreaseFillGrams,
        greaseGramsInitial,
        isPreGreasedSealed: isPreGreased,
        inductionHeatingTempC,
        radialThermalExpansionUm,

        // Family-specific parameters
        totalWidthT: skfRecord?.totalWidthT,
        coneWidthB: skfRecord?.coneWidthB,
        cupWidthC: skfRecord?.cupWidthC,
        loadCenterDistA: skfRecord?.loadCenterDistA,
        heightH: skfRecord?.heightH,
        racewayDiameterF: skfRecord?.racewayDiameterF,
        shaftHardnessHrc: skfRecord?.shaftHardnessHrc,
        shaftRoughnessRa: skfRecord?.shaftRoughnessRa,
        taperedBoreAvailable: skfRecord?.taperedBoreAvailable,
        adapterSleeveDesignation: skfRecord?.adapterSleeveDesignation,
        isNonLocating: skfRecord?.type === 'cylindrical-roller',
        isSeparable: skfRecord?.type === 'tapered-roller' || skfRecord?.type === 'cylindrical-roller',
        isReusableAfterDismounting: skfRecord?.isReusableAfterDismounting ?? true,
    };
}

/**
 * Detailed Mounting arrangements and engineering rules per bearing type
 */
export function getMountingMethodsForType(type: BearingType): MountingMethodInfo[] {
    switch (type) {
        case 'angular-contact-ball':
            return [
                {
                    id: 'back-to-back',
                    nameTr: 'DB (Sırt Sırta / "O" Düzeni)',
                    nameEn: 'DB (Back-to-Back / "O" Arrangement)',
                    symbol: '< >',
                    descriptionTr: 'Yük temas çizgileri dışarı doğru genişler (açılır). Çok yüksek moment rijitliği ve eğilme direnci sağlar.',
                    descriptionEn: 'Contact lines diverge towards the shaft axis. Provides very high moment stiffness and resistance to tilting moments.',
                    advantagesTr: [
                        'Eğilme ve devrilme momentlerine karşı en rijit montaj şeklidir.',
                        'Şaftın aşırı ısınmasında ön yük değişimi daha kararlıdır.',
                        'CNC iş milleri ve konik dişli pinyon milleri için 1. tercihtir.',
                    ],
                    typicalApplicationsTr: ['CNC Freze ve Torna Fener Milleri', 'Ayna Mahruti Pinyon Yatakları', 'Robotik Redüktör Giriş Milleri'],
                    rulesTr: [
                        'İç bilezikler şaft somunu veya ara kovanla eksenel sıkılarak ön yüklenir.',
                        'Montajda dış bilezikler serbest omuzlardan birbirine bakar.',
                    ],
                },
                {
                    id: 'face-to-face',
                    nameTr: 'DF (Yüz Yüze / "X" Düzeni)',
                    nameEn: 'DF (Face-to-Face / "X" Arrangement)',
                    symbol: '> <',
                    descriptionTr: 'Yük temas çizgileri içe doğru daralır (kesişir). Eksen kaçıklıklarını ve mil sehmini tolere eder, moment rijitliği daha düşüktür.',
                    descriptionEn: 'Contact lines converge towards the shaft axis. Better accommodates shaft deflection and minor angular misalignment.',
                    advantagesTr: [
                        'Şaft esnemesi ve işleme kaçıklıklarına toleranslıdır.',
                        'Gövde kapağı altına konan şimler ile eksenel boşluk dıştan kolayca ayarlanabilir.',
                    ],
                    typicalApplicationsTr: ['Genel Endüstriyel Redüktörler', 'Büyük Açıklıklı Şaft Yataklamaları', 'Pompalar'],
                    rulesTr: [
                        'Gövde kapağı vidaları ile dış bilezikler üzerinden ön yük verilir.',
                    ],
                },
                {
                    id: 'tandem',
                    nameTr: 'DT (Tandem / Aynı Yöne Düzen)',
                    nameEn: 'DT (Tandem Arrangement)',
                    symbol: '> >',
                    descriptionTr: 'Temas çizgileri birbirine paraleldir. Çok büyük tek yönlü eksenel yüklerin iki rulman arasında eşit paylaşılmasını sağlar.',
                    descriptionEn: 'Contact lines are parallel. Distributes very high unidirectional axial thrust loads equally between two bearings.',
                    advantagesTr: [
                        'Tek yöndeki eksenel yük taşıma kapasitesini 1.62 katına çıkarır.',
                    ],
                    typicalApplicationsTr: ['Plastik Ekstrüder Milleri', 'Kuyu Sondaj Başlıkları', 'Vinç Tambur Eksenel Destekleri'],
                    rulesTr: [
                        'Zıt yöndeki eksenel yükleri taşıyamaz; karşı tarafa mutlaka zıt çalışan bir kılavuz rulman konmalıdır.',
                    ],
                },
            ];

        case 'tapered-roller':
            return [
                {
                    id: 'back-to-back',
                    nameTr: 'DB (Sırt Sırta / "O" Düzeni)',
                    nameEn: 'DB (Back-to-Back Arrangement)',
                    symbol: '< >',
                    descriptionTr: 'Konik makaraların yük merkez çizgileri genişler. Pinyon milleri ve yüksek momentli diferansiyel yataklamaları için idealdir.',
                    descriptionEn: 'Wide effective bearing spread. High moment rigidity for pinion shafts.',
                    advantagesTr: [
                        'Maksimum devrilme momenti direnci.',
                        'Ayrılabilir koni (cone) ve fincan (cup) kolay monte edilir.',
                    ],
                    typicalApplicationsTr: ['Ağır Vasıta Diferansiyel Pinyonları', 'Rüzgar Türbini Dişli Kutuları'],
                    rulesTr: [
                        'Eksenel boşluk veya ön yük şaft ucundaki KM kilit somunu ile mikrometrik ayarlanır.',
                    ],
                },
                {
                    id: 'face-to-face',
                    nameTr: 'DF (Yüz Yüze / "X" Düzeni)',
                    nameEn: 'DF (Face-to-Face Arrangement)',
                    symbol: '> <',
                    descriptionTr: 'Kovanlar (cup) dışarı bakar. Gövde kapağı şimleriyle kolay boşluk ayarı.',
                    descriptionEn: 'Converging contact lines. Easy clearance adjustment via housing cover shims.',
                    advantagesTr: [
                        'Şaft esnemelerine karşı daha esnek yataklama.',
                    ],
                    typicalApplicationsTr: ['Konveyör Tamburları', 'Endüstriyel Redüktörler'],
                    rulesTr: [
                        'Gövde kapak cıvataları tork anahtarı ile kademeli sıkılmalıdır.',
                    ],
                },
            ];

        case 'cylindrical-roller':
            return [
                {
                    id: 'non-locating',
                    nameTr: 'Serbest Yataklama (NU Tipi Non-Locating)',
                    nameEn: 'Non-Locating Arrangement (NU Type)',
                    symbol: '[ | ]',
                    descriptionTr: 'İç bilezikte flanş bulunmaz. Milin termal genleşme sonucu uzaması durumunda makaralar iç bilezik üzerinde eksenel olarak serbestçe kayar.',
                    descriptionEn: 'Inner ring has no flanges. Accommodates thermal elongation without induced axial load.',
                    advantagesTr: [
                        'Mil uzamasında bilyalara/makaralara zararlı eksenel kasıntı yükü binmesini %100 önler.',
                        'Ayrılabilir yapı şaft ve gövdenin ayrı ayrı montajını hızlandırır.',
                    ],
                    typicalApplicationsTr: ['Elektrik Motoru Tahrik Edilmeyen (NDE) Tarafı', 'Türbin Şaftları'],
                    rulesTr: [
                        'NU tipi KESİNLİKLE eksenel yük taşıyamaz; şaftta mutlaka ayrıca bir sabit yatak bulunmalıdır.',
                    ],
                },
                {
                    id: 'locating',
                    nameTr: 'Sabit Yataklama (NUP / NJ+HJ Tipi Locating)',
                    nameEn: 'Locating Arrangement (NUP / NJ Type)',
                    symbol: '[ || ]',
                    descriptionTr: 'İki bilezikte de flanş bulunur (NUP veya flanş halkalı NJ). Şaftı her iki eksenel yönde de sabitler.',
                    descriptionEn: 'Flanges on both rings locate the shaft axially in both directions.',
                    advantagesTr: ['Yüksek radyal yük taşırken hafif eksenel sabitleme sağlar.'],
                    typicalApplicationsTr: ['Redüktör Ara Milleri'],
                    rulesTr: ['Eksenel yük kapasitesi flanş yağlamasına bağlıdır; ağır eksenel yük taşınamaz.'],
                },
            ];

        case 'thrust-ball':
            return [
                {
                    id: 'thrust-axial',
                    nameTr: 'Tek Yönlü Eksenel Baskı (Thrust Axial)',
                    nameEn: 'Single Direction Thrust Arrangement',
                    symbol: '| = |',
                    descriptionTr: 'Sadece tek yönde saf eksenel yük taşır. Mil rondelası mile sıkı geçer, gövde rondelası delik çapı d1 mile temas etmez (boşlukludur).',
                    descriptionEn: 'Pure axial load support. Shaft washer is interference fitted, housing washer has clearance.',
                    advantagesTr: [
                        'Yüksek eksenel yük taşıma kapasitesi.',
                        'Düz yüzey faturası ile rijit eksenel oturma.',
                    ],
                    typicalApplicationsTr: ['Döner Tabla Eksenleri', 'Dikey Matkap ve Freze Milleri', 'Kreyn Kancaları'],
                    rulesTr: [
                        'Radyal yük KESİNLİKLE taşınamaz (Fr = 0). Radyal yük varsa yanına radyal rulman konmalıdır.',
                        'Gövde pulu kesinlikle mile temas etmemelidir; mil pulu (d) ve gövde pulu (D1) çap farkına dikkat edilmelidir.',
                        'Santrifüj kuvvetlerin bilyaları yoldan çıkarmasını önlemek için asgari eksenel ön yük (Famin = A*(n/1000)^2) uygulanmalıdır.',
                    ],
                },
            ];

        case 'self-aligning-ball':
            return [
                {
                    id: 'locating',
                    nameTr: 'Sabit Yataklama (Silindirik Delikli)',
                    nameEn: 'Locating Arrangement (Cylindrical Bore)',
                    symbol: '| o |',
                    descriptionTr: 'Rulman eksenel kaçıklıkları tolere eder, iki yönde de eksenel kilitlenir.',
                    descriptionEn: 'Accommodates misalignment and locates shaft.',
                    advantagesTr: ['Şaft eğilme ve esnemelerini tolere eder.'],
                    typicalApplicationsTr: ['Konveyörler', 'Tarımsal Makineler'],
                    rulesTr: ['Aşırı eksenel yük uygulanmamalıdır.'],
                },
                {
                    id: 'adapter-sleeve',
                    nameTr: 'Germe Manşonu ile Montaj (H 200 Serisi)',
                    nameEn: 'Adapter Sleeve Mounting (H 200 Series)',
                    symbol: '/ | /',
                    descriptionTr: 'Konik delikli (K) oynak bilyalı rulman düz transmisyon mili üzerine H serisi germe manşonu ile sabitlenir. Mil faturasına ihtiyaç duymaz.',
                    descriptionEn: 'Mounted on smooth shafts without shoulders using an adapter sleeve.',
                    advantagesTr: ['Düz şaft üzerinde istenilen her noktaya monte edilebilir; mil işleme maliyetini düşürür.'],
                    typicalApplicationsTr: ['Uzun Şaftlar', 'Tekstil Makineleri', 'Fan Yataklamaları'],
                    rulesTr: ['Manşon somununu aşırı sıkıp rulman iç boşluğunu tamamen yok etmeyin; rulman elle rahat dönmelidir.'],
                },
            ];

        default:
            return [
                {
                    id: 'locating',
                    nameTr: 'Sabit Yataklama (Locating Arrangement)',
                    nameEn: 'Locating Arrangement',
                    symbol: '| o |',
                    descriptionTr: 'Rulman hem mil faturasına (da) hem de gövde faturasına (Da) eksenel olarak tam dayatılır ve iki yönde de eksenel kilitlenir.',
                    descriptionEn: 'Bearing is axially located in both directions on both shaft and housing.',
                    advantagesTr: [
                        'Mili her iki yönde kesin eksenel konumda tutar.',
                        'Helisel dişli eksenel itme kuvvetlerini gövdeye iletir.',
                    ],
                    typicalApplicationsTr: ['Dişli Kutusu Giriş/Çıkış Yatakları', 'Standart Elektrik Motoru Tahrik (DE) Tarafı'],
                    rulesTr: [
                        'Bir milde genellikle yalnızca BİR adet sabit yatak bulunmalıdır; diğer yatak serbest olmalıdır.',
                    ],
                },
            ];
    }
}

/**
 * Official SKF Maintenance Handbook Dismounting & Mounting Protocol Selector
 * Source: SKF Bearing Maintenance Handbook (PUB SR/P7 10001/1 EN)
 */
export function getSKFMaintenanceProtocol(
    type: BearingType,
    d: number,
    D: number,
    isCapped: boolean = false
): SKFMaintenanceProtocol {
    const dismountingTools: SKFToolRecommendation[] = [];
    const mountingTools: SKFToolRecommendation[] = [];

    // 1. MOUNTING TOOLS
    if (type === 'needle-roller' && d <= 50) {
        mountingTools.push({
            toolCode: 'SKF Mandrel Pres Aleti',
            toolNameTr: 'Çekme Kovanlı İğne Rulman Çakma Mandreli',
            toolNameEn: 'Needle Roller Fitting Mandrel',
            purpose: 'mounting',
            method: 'mechanical',
            sizeRange: `Fw = ${d} mm, D = ${D} mm`,
            descriptionTr: 'İnce çekme sac kovanın ağzını ezmeden, O-ringli merkezleme pimi ile kovanı yuva içine milimetrik presler.',
            descriptionEn: 'Presses drawn cup into housing bore with an O-ring pilot pin without deforming the thin cup rim.',
            safetyRuleTr: 'Presleme kuvveti doğrudan kovanın işaretli flanş yüzeyine uygulanmalıdır. Asla çekiçle doğrudan vurulmaz!',
            safetyRuleEn: 'Pressing force must be applied directly to the stamped flange face. Never hammer directly!',
        });
    } else if (type === 'thrust-ball' || type === 'thrust-roller') {
        mountingTools.push({
            toolCode: 'SKF TMFT 36 (Eksenel Disk)',
            toolNameTr: 'Eksenel Rondela Baskı Plakası',
            toolNameEn: 'Thrust Washer Fitting Tool',
            purpose: 'mounting',
            method: 'mechanical',
            sizeRange: `d = ${d} mm`,
            descriptionTr: 'Yalnızca mil rondelasına (sıkı geçen rondela) temas ederek kuvveti iletir; bilyalara ve gövde rondelasına kuvvet iletmez.',
            descriptionEn: 'Transmits force solely to the shaft washer (tight-fit washer); does not load balls or housing washer.',
            safetyRuleTr: 'Kuvvet ASLA gevşek olan gövde rondelası üzerinden bilyalara iletilmemelidir!',
            safetyRuleEn: 'Force must NEVER be applied through the loose housing washer onto the balls!',
        });
    } else if (d <= 55) {
        mountingTools.push({
            toolCode: 'SKF TMFT 36',
            toolNameTr: 'Rulman Montaj Alet Takımı (Mekanik Çakma)',
            toolNameEn: 'Bearing Fitting Tool Kit',
            purpose: 'mounting',
            method: 'mechanical',
            sizeRange: 'd = 10 - 55 mm, D = 26 - 120 mm',
            descriptionTr: 'Darbe kuvvetini aynı anda hem iç hem de dış bileziğe güvenle ileten 3 darbe kovanı ve 36 darbe bileziği.',
            descriptionEn: 'Impact rings and sleeves transmitting mounting force to the tight-fit ring or both rings simultaneously.',
            safetyRuleTr: 'Montaj darbe kuvveti KESİNLİKLE yuvarlanma elemanları (bilyalar/makaralar) üzerinden iletilmemelidir!',
            safetyRuleEn: 'Mounting impact force must NEVER be transmitted across the rolling elements!',
        });
    }

    // Induction Heaters
    if (type !== 'needle-roller' || d > 30) {
        if (d <= 100) {
            mountingTools.push({
                toolCode: 'SKF TIH 030m',
                toolNameTr: 'Taşınabilir İndüksiyon Isıtıcı',
                toolNameEn: 'Portable Induction Heater',
                purpose: 'mounting',
                method: 'thermal',
                sizeRange: 'd = 20 - 300 mm (Maks 40 kg)',
                descriptionTr: 'Elektronik güç kontrolü ve manyetik sıcaklık sensörü ile yatağı hızlı ve homojen ısıtır. Çevrim sonunda otomatik manyetik arındırma (demagnetization) yapar.',
                descriptionEn: 'Heats bearings quickly and evenly with electronic power control and magnetic temp probe. Automatically demagnetizes at cycle end.',
                safetyRuleTr: isCapped 
                    ? 'Kapaklı/contalı (2RSH, 2RS1) gresli rulmanlar için ısıtma sıcaklığı 80°C\'yi (175°F) KESİNLİKLE aşmamalıdır!'
                    : 'Standart açık rulmanlar için tavsiye edilen montaj sıcaklığı 110°C\'dir (maks 120°C). Asla açık alev (şaloma) kullanılmamalıdır!',
                safetyRuleEn: isCapped
                    ? 'For sealed/shielded (2RSH, 2RS1) greased bearings, heating temperature must NEVER exceed 80°C (175°F)!'
                    : 'Recommended mounting temperature for open bearings is 110°C (max 120°C). Never use an open flame!',
            });
        } else {
            mountingTools.push({
                toolCode: 'SKF TIH 100m / 220m',
                toolNameTr: 'Büyük İndüksiyon Isıtıcı',
                toolNameEn: 'Medium-to-Large Induction Heater',
                purpose: 'mounting',
                method: 'thermal',
                sizeRange: 'Maks 120 - 300 kg rulmanlar',
                descriptionTr: 'Ağır endüstriyel rulmanların homojen termal genleşme ile mile sıfır kuvvetle geçmesini sağlar.',
                descriptionEn: 'Provides uniform thermal expansion for heavy bearings for zero-force sliding onto shafts.',
                safetyRuleTr: 'Rulmanın mil faturasına tam yaslandığından emin olunmalı ve soğuyana kadar eksenel baskı uygulanmalıdır.',
                safetyRuleEn: 'Ensure bearing is seated against shaft shoulder and hold axial pressure until cool.',
            });
        }
    }

    // Hydraulic Mounting & SKF Drive-Up Method
    const isTaperedBoreFamily = type === 'spherical-roller' || type === 'self-aligning-ball';
    if (isTaperedBoreFamily || d >= 50) {
        mountingTools.push({
            toolCode: 'SKF HMV .. E + Komparatör Saati',
            toolNameTr: 'Hidrolik Somun & SKF Drive-up Yöntemi Takımı',
            toolNameEn: 'Hydraulic Nut with SKF Drive-up Method',
            purpose: 'mounting',
            method: 'hydraulic',
            sizeRange: 'd = 50 - 1000 mm veya konik delikli rulmanlar',
            descriptionTr: 'Konik milli veya germe manşonlu yataklarda eksenel itme mesafesini komparatör saati ve hidrolik basınçla mikron hassasiyetinde ayarlar.',
            descriptionEn: 'Precisely adjusts axial drive-up distance on tapered seatings or sleeves with dial indicator and hydraulic nut.',
            safetyRuleTr: isCapped
                ? 'Contalı küresel makaralı rulmanlarda boşluk sentil ile ÖLÇÜLEMEZ! SKF Drive-up yöntemi zorunludur.'
                : 'Açık yataklarda iç radyal boşluk (Cr) azalması sentil çakısı ile kontrol edilebilir.',
            safetyRuleEn: isCapped
                ? 'Internal clearance in sealed spherical roller bearings cannot be measured with feeler gauges! SKF Drive-up is mandatory.'
                : 'On open bearings, internal radial clearance reduction can be measured with a feeler gauge.',
        });
    }

    // 2. DISMOUNTING TOOLS
    if (type === 'needle-roller' && d <= 30) {
        dismountingTools.push({
            toolCode: 'SKF Tahribatlı Söküm Zımbası',
            toolNameTr: 'İnce Çekme Kovan Söküm Aparatı (Tek Kullanımlık)',
            toolNameEn: 'Destructive Drawn-Cup Puller',
            purpose: 'dismounting',
            method: 'mechanical',
            sizeRange: `d = ${d} mm`,
            descriptionTr: 'Kovan arkadan zımbayla itilerek yuvadan çıkarılır.',
            descriptionEn: 'Thin drawn cup is pushed out of the housing bore from the rear with a punch.',
            safetyRuleTr: 'DİKKAT: Çekme kovanlı iğne rulmanlar (HK serisi) söküldüğünde sac gövde kalıcı deforme olur; KESİNLİKLE TEKRAR MONTE EDİLEMEZ!',
            safetyRuleEn: 'CAUTION: Drawn cup needle roller bearings (HK series) deform permanently upon removal; NEVER REUSE!',
        });
    } else if (type === 'cylindrical-roller') {
        dismountingTools.push({
            toolCode: 'SKF TMBR Serisi',
            toolNameTr: 'Termal Isıtma Halkaları (Silindirik Makaralı İç Bilezik)',
            toolNameEn: 'Heating Rings for Cylindrical Roller Bearing Inner Rings',
            purpose: 'dismounting',
            method: 'thermal',
            sizeRange: 'NU / NJ / NUP serisi iç bilezikler',
            descriptionTr: 'Flanşlı iç bileziği 280°C sıcaklığa kadar hızlıca ısıtarak mili ısıtmadan genleştirir ve çeker.',
            descriptionEn: 'Rapidly heats flanged inner ring up to 280°C to expand and withdraw it without heating the shaft.',
            safetyRuleTr: 'Isıya dayanıklı eldiven kullanılmalı; iç bilezik tekrar kullanılacaksa aşırı ısıtılmamalıdır.',
            safetyRuleEn: 'Wear heat-resistant gloves; avoid overheating if the inner ring is to be reused.',
        });
        dismountingTools.push({
            toolCode: 'SKF TMMA 60',
            toolNameTr: 'EasyPull Mekanik Çeneli Çektirme (60 kN)',
            toolNameEn: 'EasyPull Mechanical Jaw Puller',
            purpose: 'dismounting',
            method: 'mechanical',
            sizeRange: 'Maks uzanma 150 mm, kavrama çapı 36 - 150 mm',
            descriptionTr: 'Çeneler iç bilezik omzuna veya labirent halkasına basarak yatağı milden sıyırır.',
            descriptionEn: 'Jaws pull against inner ring shoulder or labyrinth ring to withdraw bearing from shaft.',
            safetyRuleTr: 'Çeneler daima İÇ BİLEZİĞE oturmalıdır.',
            safetyRuleEn: 'Jaws must always seat against the INNER RING.',
        });
    } else if (d <= 60) {
        dismountingTools.push({
            toolCode: 'SKF TMMA 60',
            toolNameTr: 'EasyPull Mekanik Çeneli Çektirme (60 kN)',
            toolNameEn: 'EasyPull Mechanical Jaw Puller',
            purpose: 'dismounting',
            method: 'mechanical',
            sizeRange: 'Maks uzanma 150 mm, kavrama çapı 36 - 150 mm',
            descriptionTr: 'Patentli yay mekanizması kolları milin arkasına tek hareketle kilitler; çeneler iç bilezik omzuna veya labirent halkasına basar.',
            descriptionEn: 'Patented spring arms lock behind bearing in one touch; jaws pull against inner ring shoulder.',
            safetyRuleTr: 'Çektirme çeneleri daima İÇ BİLEZİĞE veya arkasındaki fatura halkasına temas etmelidir; asla dış bilezikten çekilmez!',
            safetyRuleEn: 'Puller jaws must ALWAYS contact the INNER RING shoulder; never pull through outer ring or rolling elements!',
        });
        dismountingTools.push({
            toolCode: 'SKF TMIP 7-28 / TMIP 30-60',
            toolNameTr: 'Kör Yuva İç Çektirme Kiti (Kayar Çekiçli)',
            toolNameEn: 'Internal Bearing Puller Kit (Blind Housing)',
            purpose: 'dismounting',
            method: 'mechanical',
            sizeRange: 'd = 7 - 60 mm',
            descriptionTr: 'Gövde içinde kalan ve arkasından ulaşılamayan rulmanların delik içinden tırnaklarla kavranarak sökülmesi.',
            descriptionEn: 'Extracts bearings seated in blind housings with internal gripping collets and sliding hammer.',
            safetyRuleTr: 'Genişleyen çeneler iç bilezik omzunun girintisine tam oturmalıdır.',
            safetyRuleEn: 'Expanding collet lips must sit firmly behind the inner ring shoulder.',
        });
        if (type === 'deep-groove-ball') {
            dismountingTools.push({
                toolCode: 'SKF TMBP 20E',
                toolNameTr: 'Sabit Bilyalı Kör Yuva Söküm Kiti',
                toolNameEn: 'Deep Groove Ball Bearing Puller Kit',
                purpose: 'dismounting',
                method: 'mechanical',
                sizeRange: 'd = 30 - 160 mm',
                descriptionTr: 'Kör gövdede mili veya gövdeyi sökmeden, özel adaptör uçları bilyaların arasına kilitlenerek yatağı çeker.',
                descriptionEn: 'Dismounts deep groove ball bearings in blind housings by locking special adapters into the raceway between balls.',
                safetyRuleTr: 'Conta veya kapağın çıkarılması ve bilyaların temizlenmesi gerekir.',
                safetyRuleEn: 'Seal or shield must be removed and balls wiped clean before locking adapters.',
            });
        }
    } else if (d <= 150) {
        dismountingTools.push({
            toolCode: 'SKF TMHP 10E / TMHP 30E',
            toolNameTr: 'Hidrolik Milli Çeneli Çektirme (100 kN)',
            toolNameEn: 'Hydraulically-Assisted Puller',
            purpose: 'dismounting',
            method: 'hydraulic',
            sizeRange: 'Maks span 280 mm, güç 100 kN',
            descriptionTr: 'Zahmetsiz yüksek kuvvet uygulayan hidrolik mil mekanizması ile sıkı geçmiş orta boy rulmanları söker.',
            descriptionEn: 'Generates high pulling forces effortlessly with a hydraulic spindle to remove tight-fitting bearings.',
            safetyRuleTr: 'Yüksek kuvvet altında çalışma esnasında koruma örtüsü (güvenlik battaniyesi TMMX) kullanılmalıdır.',
            safetyRuleEn: 'Always drape a protective blanket (SKF TMMX) over the puller when operating under heavy load.',
        });
    } else {
        dismountingTools.push({
            toolCode: 'SKF 729124 / TMJL 100',
            toolNameTr: 'Yüksek Basınçlı Yağ Enjeksiyon Pompası (300-400 MPa)',
            toolNameEn: 'Oil Injection Method Kit',
            purpose: 'dismounting',
            method: 'hydraulic',
            sizeRange: 'd >= 150 mm veya manşonlu miller',
            descriptionTr: 'Mil üzerindeki yağ kanalı vasıtasıyla iç bilezik ile mil arasına 900 mm²/s viskoziteli yağ basılarak temas yüzeyleri mikro filmle ayrılır.',
            descriptionEn: 'Injects high-viscosity oil between shaft and inner ring via oil ducts, separating contact surfaces on a micro oil film.',
            safetyRuleTr: 'Yağ enjeksiyonu sırasında mil ucundaki KM emniyet somunu 2-3 tur gevşetilmiş olarak milde BIRAKILMALIDIR! Aksi takdirde rulman fırlayarak ağır iş kazasına yol açabilir!',
            safetyRuleEn: 'Shaft locknut must be left threaded loose on the shaft end by 2-3 turns during oil injection! Otherwise bearing can shoot off violently!',
        });
    }

    // Step by step mounting & dismounting instructions
    const mountingStepsTr = type === 'thrust-ball' ? [
        '1. Boyutsal Doğrulama: Mil faturası (da) ve gövde faturası (Da) geçişlerini mikrometre ile kontrol edin.',
        '2. Ayırt Etme: Mil pulu (d) ile gövde pulunu (D1) doğru ayırt edin (d < D1).',
        '3. Temizlik: Parçaları temizleyin ve yuvarlanma yollarına ince bir yağ filmi sürün.',
        '4. Mil Pulu Montajı: Presleme kuvvetini doğrudan ve münhasıran mil puluna uygulayın. Bilyalar üzerinden kuvvet aktarılmasına KESİNLİKLE izin vermeyin.',
        '5. Dönüş Kontrolü: Yatağın serbestçe ve kasmadan döndüğünü elle çevirerek teyit edin.',
    ] : type === 'needle-roller' ? [
        '1. Yuva Kontrolü: Gövde yuvasının pahını ve yüzey temizliğini kontrol edin.',
        '2. Mandrel Aparatı: Rulmanı montaj mandreli (SKF TMFT 36) üzerine oturtun.',
        '3. Pres Montajı: Kovanı gövde yuvasına çekiçle değil, hidrolik veya mekanik presle düzgünce itin.',
        '4. Mil Sertliği Teyidi: Mil yuvarlanma yolunun sertliğinin 58-64 HRC ve Ra <= 0.2 µm olduğunu doğrulayın.',
    ] : [
        '1. Boyutsal Doğrulama: Mil fatura çapını (da), gövde yuvasını (Da) ve fatura köşe radyusunu (ra) mikrometre ile ölçüp standart sınırlar içinde olduğunu teyit edin.',
        '2. Temizlik ve Hazırlık: Mil yüzeyindeki çapak ve pasları giderin; temiz ince mineral yağ sürün.',
        isTaperedBoreFamily
            ? '3. Drive-up Yöntemi (Oynak Makaralı / Konik Delikli): Contalı veya açık oynak makaralı yataklarda SKF Drive-up yöntemi (HMV hidrolik somun + komparatör) ile boşluk azaltma tablosuna göre montajı tamamlayın.'
            : isCapped 
            ? '3. Montaj Yöntemi (Contalı Yatak): Rulman fabrikasyon gres dolgulu olduğundan sıcak montajda azami 80°C sıcaklığı aşmayın (tercihen TMFT 36 ile soğuk pres montajı yapın).'
            : '3. Termal Isıtma (Açık Yatak): SKF İndüksiyon Isıtıcı (TIH 030m/100m) ile 110°C sıcaklığa kadar ısıtın. Isıtıcı çevrim sonu otomatik demanyetizasyon yapacaktır.',
        '4. Konumlandırma: Isınmış yatağı mile hızla sürerek mil faturasına (da) tam yaslayın. Yatak soğuyana kadar eksenel olarak bastırın.',
        '5. Eksenel Kilitleme: Rulman soğuduktan sonra DIN 981 KM somununu tork anahtarı ile sıkın ve DIN 5406 MB emniyet pulunun tırnağını somun yarığına bükün.',
    ];

    const dismountingStepsTr = type === 'needle-roller' ? [
        '1. Güvenlik: Makine enerjisini kesin ve LOTO prosedürünü uygulayın.',
        '2. Tahribatlı Söküm Prosedürü: İnce sac çekme kovanlı rulmanlar arkadan mandrel veya zımba pres aparatı ile itilerek yuvadan çıkarılır.',
        '3. Kalıcı Deformasyon: Sökülen kovan deforme olur ve KESİNLİKLE tekrar kullanılamaz; yuvaya her seferinde yeni rulman preslenmelidir.',
        '4. Gövde Yuva Kontrolü: Gövde yuvası toleransını (N6/R7) mikrometre ile ölçüp hasar olmadığını teyit edin.',
    ] : [
        '1. Güvenlik ve Kilitleme: Makinenin enerjisini kesin ve kilit/etiket (LOTO) prosedürünü uygulayın.',
        '2. Emniyet Kilidini Gevşetme: KM somunun MB pul tırnağını açın. Somunu TAMAMEN ÇIKARMAYIN, 2-3 diş gevşeterek milde bırakın (fırlama önlemi).',
        '3. Çektirme Konumlandırma: Çektirme çenelerini (TMMA) veya plakasını iç bilezik omzuna yerleştirin. Miller eksenel olarak tam hizalanmalıdır.',
        '4. Çekme: Çektirme milini yavaşça çevirerek iç bileziği milden ayırın.',
        '5. Hasar İncelemesi: Sökülen yatağın yuvarlanma yollarını ISO 15243 arıza modlarına (yorulma pul pul dökülme, aşınma, korozyon, elektriksel erozyon) göre muayene edin.',
    ];

    const goldenSafetyRulesTr = [
        'KURAL 1: Montaj ve söküm kuvveti KESİNLİKLE yuvarlanma elemanları üzerinden aktarılmamalıdır (Bilezik ezilmesi ve Brinell kalıcı çöküntü oluşur).',
        'KURAL 2: Rulmanı ısıtmak için ASLA pürmüz, şaloma veya doğrudan açık alev KULLANILMAMALIDIR (Bilezik tavlanır, mikro yapı bozulur).',
        'KURAL 3: Yağ banyosu ile ısıtma yangın ve kirlilik riski nedeniyle önerilmez; indüksiyonlu ısıtma (SKF TIH) tercih edilmelidir.',
        'KURAL 4: İndüksiyonla ısıtılan her rulman montajdan önce MUTLAKA demanyetize edilmelidir (aksi halde metal talaşlarını üzerine çeker).',
        'KURAL 5: Yağ enjeksiyonu ile sökümde mil ucundaki somun gevşetilerek bırakılmalıdır; yatak basınç kalktığında mermi gibi fırlayabilir!',
    ];

    const goldenSafetyRulesEn = [
        'RULE 1: Mounting and dismounting force must NEVER be applied through the rolling elements (causes brinelling and raceway damage).',
        'RULE 2: NEVER use an open flame, blowtorch, or welding torch to heat a bearing (tempers steel and degrades microstructure).',
        'RULE 3: Oil baths are not recommended due to fire and contamination risks; prefer induction heating (SKF TIH series).',
        'RULE 4: Every induction-heated bearing MUST be demagnetized before mounting (to avoid attracting ferrous chips and particles).',
        'RULE 5: When dismounting with oil injection, leave the shaft locknut loose by 2-3 turns; the bearing can eject violently under pressure!',
    ];

    if (type === 'needle-roller') {
        goldenSafetyRulesTr.push('DİKKAT: Sac çekme kovanlı iğneli rulmanlar (HK serisi) demonte edildikten sonra kovan geometrisi kalıcı bozulur; KESİNLİKLE TEKRAR KULLANILAMAZ!');
        goldenSafetyRulesEn.push('CAUTION: Drawn cup needle roller bearings (HK series) suffer permanent plastic deformation upon dismounting; NEVER REUSE!');
    }

    const maxHeatingTempC = isCapped ? 80 : 110;
    const heatingNoteTr = isCapped
        ? 'Rulman fabrikasyon gresli ve 2RSH/2Z contalıdır! Gres viskozitesinin ve conta polimerinin bozulmaması için 80°C\'yi aşmayınız.'
        : 'Standart açık rulman çeliği 125°C\'ye kadar boyutsal kararlıdır. Tavsiye edilen montaj sıcaklığı 110°C, azami limit 120°C\'dir.';
    const heatingNoteEn = isCapped
        ? 'Bearing is factory-greased with 2RSH/2Z seals! Do not exceed 80°C to protect grease viscosity and seal polymers.'
        : 'Standard bearing steel is dimensionally stabilized up to 125°C. Recommended mounting temperature is 110°C (max 120°C).';

    return {
        recommendedDismountingTools: dismountingTools,
        recommendedMountingTools: mountingTools,
        mountingStepsTr,
        dismountingStepsTr,
        goldenSafetyRulesTr,
        goldenSafetyRulesEn,
        maxHeatingTempC,
        heatingNoteTr,
        heatingNoteEn,
        driveUpMethodRecommended: isTaperedBoreFamily || isCapped,
        feelerGaugeApplicable: !isCapped && isTaperedBoreFamily && d <= 120,
    };
}
