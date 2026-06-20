"use client";
import { useState, useMemo, useEffect } from 'react';
import {
    BEARING_CATALOG,
    BearingData,
    BearingType,
    getBearingTypeInfo,
    calculateBearingLife,
    findBearing
} from "@/data/skfBearings";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { calculateFit } from "@/lib/engine/iso286";
import { 
    Search, Info, CheckCircle, AlertTriangle, Plus, FileText, 
    Clock, Zap, Activity, Shield, RotateCw, Settings 
} from 'lucide-react';
import { useProjectStore } from "@/store/projectStore";
import { PDFReportEngine, ReportMetadata } from "@/lib/pdfReportEngine";
import { ReportSettingsModal } from "@/components/ui/ReportSettingsModal";
import { SaveButton } from "@/components/calculation/SaveButton";
import { useI18nStore } from '@/store/i18nStore';

// ════════════════════════════════════════════
// CONSTANTS & THEME
// ════════════════════════════════════════════

const COLORS = {
  bg: '#020408',
  panel: '#0a1018',
  text: '#C5C6C7',
  accent: '#00e5ff',
  accentDim: 'rgba(0, 229, 255, 0.15)',
  glow: 'rgba(0, 229, 255, 0.3)',
  danger: '#FF4D4D',
  success: '#10B981',
  warning: '#F59E0B',
};

const BEARING_TYPE_FILTERS: { id: BearingType | 'all'; label: string }[] = [
    { id: 'all', label: 'All Bearings' },
    { id: 'deep-groove-ball', label: 'Deep Groove Ball (DGB)' },
    { id: 'angular-contact-ball', label: 'Angular Contact (ACB)' },
    { id: 'tapered-roller', label: 'Tapered Roller (TRB)' },
    { id: 'cylindrical-roller', label: 'Cylindrical Roller (CRB)' },
    { id: 'needle-roller', label: 'Needle Roller (NRB)' },
    { id: 'thrust-ball', label: 'Thrust Ball (Thrust)' },
];

// Helper to determine standard shaft fit class based on bore diameter d
const getShaftFitClass = (d: number) => {
    if (d <= 10) return { class: 'js', grade: 5, label: 'js5' };
    if (d <= 17) return { class: 'js', grade: 6, label: 'js6' };
    if (d <= 100) return { class: 'k', grade: 6, label: 'k6' };
    return { class: 'm', grade: 6, label: 'm6' };
};

// ════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════

const DataDisplay = ({ label, value, unit, icon: Icon, color = COLORS.accent }: any) => (
  <div className="relative group overflow-hidden bg-[#0a1018]/60 border border-white/5 rounded-2xl p-4 transition-all hover:border-[#00e5ff]/30 hover:scale-[1.02] duration-300">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-xl bg-black/40 text-slate-300 group-hover:text-[#00e5ff] transition-colors">
        <Icon size={24} className="group-hover:rotate-[60deg] transition-all duration-700" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-mono text-slate-300">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black font-mono tabular-nums tracking-tighter" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] font-mono text-slate-400 uppercase">{unit}</span>
    </div>
    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: color }} />
  </div>
);

const ControlSlider = ({ label, value, min, max, step = 1, onChange, unit }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-baseline">
      <label className="text-[10px] uppercase tracking-widest font-mono text-white/30">{label}</label>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-mono font-bold text-[#00e5ff]">{value}</span>
        <span className="text-[9px] font-mono text-white/20">{unit}</span>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00e5ff] hover:accent-white transition-all"
    />
  </div>
);

const LOCAL_DICTS: Record<string, any> = {
    en: {
        title: "Bearing Life & Fits",
        subtitle: "Dynamic Load Ratings, Rating Life & Machining Fits • ISO 281 / ISO 286",
        addToProject: "ADD TO PROJECT",
        report: "REPORT",
        searchPlaceholder: "Search SKF Code (e.g. 6204)...",
        allBearings: "All Bearings",
        catalogDb: "Catalog Database",
        appliedConditions: "Applied Conditions",
        radialLoad: "Radial Load (Fr)",
        axialLoad: "Axial Load (Fa)",
        speed: "Speed",
        reliability: "Reliability",
        fineTuneFr: "Fine-tune Fr",
        fineTuneFa: "Fine-tune Fa",
        operatingSpeed: "Operating Speed",
        l10hLife: "L10h Rated Life",
        equivLoadP: "Equivalent Load P",
        equivStaticP0: "Equivalent Static P0",
        staticSafetyS0: "Static Safety S0",
        refCapacity: "Bearing Reference & Dynamic Capacity",
        safetyMet: "SAFETY COEFFICIENT MET",
        belowDesign: "BELOW DESIGN LIFE (5000h)",
        dynRating: "Dynamic Rating (C)",
        staticRating: "Static Rating (C0)",
        boreDia: "Bore Diameter (d)",
        outerDia: "Outer Diameter (D)",
        width: "Width (B)",
        machiningRec: "Machining & Tolerance Recommendations (ISO 286 / ISO 1132)",
        shaftSeat: "Shaft Seat Fit",
        housingSeat: "Housing Seat Fit",
        nominalDia: "Nominal Diameter",
        upperDev: "Upper Deviation",
        lowerDev: "Lower Deviation",
        limits: "Machining Limits",
        normalRotation: "Normal Rotation (H7)",
        easyAssembly: "Easy Assembly (JS7)",
        limitDia: "Diameter Limits",
        shaftLogic: "Shaft Fit Logic",
        shaftLogicDesc: "Since the bearing inner ring rotates with the shaft, an interference or transition fit (e.g. {fit}) is selected to prevent creep/slipping on the shaft seat.",
        housingLogic: "Housing Fit Logic",
        housingLogicDesc: "Since the bearing outer ring is usually stationary, a clearance or light transition fit (e.g. H7 or JS7) is selected to allow thermal expansion and ease of assembly.",
        hours: "hours",
        noBearings: "No bearings found"
    },
    tr: {
        title: "Rulman Ömrü ve Toleranslar",
        subtitle: "Dinamik Yük Değerleri, Ömür ve İşleme Toleransları • ISO 281 / ISO 286",
        addToProject: "PROJEYE EKLE",
        report: "TEKLİF / RAPOR",
        searchPlaceholder: "Rulman Kodunu Arayın (örn. 6204)...",
        allBearings: "Tüm Rulmanlar",
        catalogDb: "Katalog Veritabanı",
        appliedConditions: "Uygulanan Şartlar",
        radialLoad: "Radyal Yük (Fr)",
        axialLoad: "Eksenel Yük (Fa)",
        speed: "Hız",
        reliability: "Güvenilirlik",
        fineTuneFr: "Radyal Yük Fr Ayarı",
        fineTuneFa: "Eksenel Yük Fa Ayarı",
        operatingSpeed: "Çalışma Devri",
        l10hLife: "L10h Nominal Ömür",
        equivLoadP: "Dinamik Eşdeğer Yük P",
        equivStaticP0: "Statik Eşdeğer Yük P0",
        staticSafetyS0: "Statik Emniyet Katsayısı S0",
        refCapacity: "Rulman Kapasite Değerleri",
        safetyMet: "GÜVENLİK KATSAYISI KARŞILANDI",
        belowDesign: "TASARIM ÖMRÜNÜN ALTINDA (5000h)",
        dynRating: "Dinamik Yük Değeri (C)",
        staticRating: "Statik Yük Değeri (C0)",
        boreDia: "İç Çap (d)",
        outerDia: "Dış Çap (D)",
        width: "Genişlik (B)",
        machiningRec: "İşleme Tolerans Önerileri (ISO 286 / ISO 1132)",
        shaftSeat: "Mil Yuvası Toleransı",
        housingSeat: "Gövde Yuvası Toleransı",
        nominalDia: "Nominal Çap",
        upperDev: "Üst Sapma",
        lowerDev: "Alt Sapma",
        limits: "İşleme Tolerans Sınırları",
        normalRotation: "Normal Dönüş (H7)",
        easyAssembly: "Kolay Montaj (JS7)",
        limitDia: "Çap Limitleri",
        shaftLogic: "Mil Tolerans Mantığı",
        shaftLogicDesc: "Rulman iç bileziği mil ile birlikte döndüğü için mil yuvasında kayma (creep) oluşmaması istenir. Bu sebeple nominal mil çapına göre sıkı veya geçişli mil toleransları (örn. {fit}) seçilir.",
        housingLogic: "Gövde Tolerans Mantığı",
        housingLogicDesc: "Rulman dış bileziği gövde içerisinde genellikle sabittir. Millerin ısı altında uzayabilmesi ve montaj kolaylığı için boşluklu veya hafif geçişli gövde yuvası toleransları (örn. H7 veya JS7) tercih edilir.",
        hours: "saat",
        noBearings: "Rulman bulunamadı"
    },
    de: {
        title: "Lagerlebensdauer & Passungen",
        subtitle: "Dynamische Tragzahlen, Lebensdauer & Fertigungspassungen • ISO 281 / ISO 286",
        addToProject: "ZUM PROJEKT HINZUFÜGEN",
        report: "BERICHT",
        searchPlaceholder: "SKF-Code suchen (z. B. 6204)...",
        allBearings: "Alle Lager",
        catalogDb: "Katalog-Datenbank",
        appliedConditions: "Betriebsbedingungen",
        radialLoad: "Radialkraft (Fr)",
        axialLoad: "Axialkraft (Fa)",
        speed: "Drehzahl",
        reliability: "Zuverlässigkeit",
        fineTuneFr: "Feineinstellung Fr",
        fineTuneFa: "Feineinstellung Fa",
        operatingSpeed: "Betriebsdrehzahl",
        l10hLife: "Nennlebensdauer L10h",
        equivLoadP: "Äquivalente Belastung P",
        equivStaticP0: "Statische Äquivalentlast P0",
        staticSafetyS0: "Statische Kennzahl S0",
        refCapacity: "Tragzahlen & Abmessungen",
        safetyMet: "SICHERHEITSKOEFFIZIENT ERFÜLLT",
        belowDesign: "UNTER DESIGNLEBENSDAUER (5000h)",
        dynRating: "Dynamische Tragzahl (C)",
        staticRating: "Statische Tragzahl (C0)",
        boreDia: "Bohrungsdurchmesser (d)",
        outerDia: "Außendurchmesser (D)",
        width: "Breite (B)",
        machiningRec: "Fertigungs- & Toleranzempfehlungen (ISO 286 / ISO 1132)",
        shaftSeat: "Wellensitz-Passung",
        housingSeat: "Gehäusesitz-Passung",
        nominalDia: "Nennmaß",
        upperDev: "Obere Abweichung",
        lowerDev: "Untere Abweichung",
        limits: "Grenzmaße",
        normalRotation: "Normale Drehung (H7)",
        easyAssembly: "Leichte Montage (JS7)",
        limitDia: "Durchmessergrenzen",
        shaftLogic: "Wellenpassungs-Logik",
        shaftLogicDesc: "Da der Innenring mit der Welle rotiert, ist eine feste oder Übergangspassung (z. B. {fit}) erforderlich, um ein Rutschen (Kriechen) auf der Welle zu verhindern.",
        housingLogic: "Gehäusepassungs-Logik",
        housingLogicDesc: "Da der Außenring meist stillsteht, wird eine Spiel- oder leichte Übergangspassung (z. B. H7 oder JS7) gewählt, um thermische Dehnungen zu erlauben und die Montage zu erleichtern.",
        hours: "Stunden",
        noBearings: "Keine Lager gefunden"
    },
    ja: {
        title: "軸受寿命とはめあい公差",
        subtitle: "動定格荷重、定格寿命および加工公差算出 • ISO 281 / ISO 286",
        addToProject: "プロジェクトに追加",
        report: "レポート出力",
        searchPlaceholder: "型番検索 (例: 6204)...",
        allBearings: "すべての軸受",
        catalogDb: "カタログデータベース",
        appliedConditions: "負荷・運転条件",
        radialLoad: "ラジアル荷重 (Fr)",
        axialLoad: "アキシアル荷重 (Fa)",
        speed: "回転速度",
        reliability: "信頼度",
        fineTuneFr: "ラジアル荷重微調整",
        fineTuneFa: "アキシアル荷重微調整",
        operatingSpeed: "運転回転速度",
        l10hLife: "基本定格寿命 L10h",
        equivLoadP: "動等価荷重 P",
        equivStaticP0: "静等価荷重 P0",
        staticSafetyS0: "静安全係数 S0",
        refCapacity: "基本定格荷重・許容仕様",
        safetyMet: "設計寿命に適合",
        belowDesign: "目標寿命以下 (5000時間未満)",
        dynRating: "動定格荷重 (C)",
        staticRating: "静定格荷重 (C0)",
        boreDia: "内径 (d)",
        outerDia: "外径 (D)",
        width: "幅 (B)",
        machiningRec: "推奨加工公差・はめあい規格 (ISO 286 / ISO 1132)",
        shaftSeat: "軸のはめあい公差",
        housingSeat: "ハウジングのはめあい公差",
        nominalDia: "基準寸法",
        upperDev: "上の寸法許容差",
        lowerDev: "下の寸法許容差",
        limits: "許容寸法範囲",
        normalRotation: "通常回転支持 (H7)",
        easyAssembly: "容易組み立て用 (JS7)",
        limitDia: "限界寸法値",
        shaftLogic: "軸公差の選定基準",
        shaftLogicDesc: "内輪は軸と共に回転するため、軸との間での「クリープ」（共回り）を防止すべく、基準内径に対し移行またはしまりはめあい（例: {fit}）を選定します。",
        housingLogic: "ハウジング公差の選定基準",
        housingLogicDesc: "外輪は通常静止するため、軸の熱膨張の吸収や組立性向上のため、すきままたは軽い移行はめあい（例: H7またはJS7）を選定します。",
        hours: "時間",
        noBearings: "見つかりません"
    }
};

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════

export function BearingsModule({ lang, dict }: { lang: string, dict: any }) {
    const { language } = useI18nStore();
    const t = LOCAL_DICTS[language] || LOCAL_DICTS.en;
    const { addItem } = useProjectStore();

    const bearingTypeFilters = useMemo(() => [
        { id: 'all' as BearingType | 'all', label: t.allBearings },
        { id: 'deep-groove-ball' as BearingType | 'all', label: language === 'tr' ? 'Sabit Bilyalı (DGB)' : language === 'de' ? 'Rillenkugellager (DGB)' : language === 'ja' ? '深溝玉軸受 (DGB)' : 'Deep Groove Ball (DGB)' },
        { id: 'angular-contact-ball' as BearingType | 'all', label: language === 'tr' ? 'Eğik Bilyalı (ACB)' : language === 'de' ? 'Schrägkugellager (ACB)' : language === 'ja' ? 'アンギュラ玉軸受 (ACB)' : 'Angular Contact (ACB)' },
        { id: 'tapered-roller' as BearingType | 'all', label: language === 'tr' ? 'Konik Makaralı (TRB)' : language === 'de' ? 'Kegelrollenlager (TRB)' : language === 'ja' ? '円すいころ軸受 (TRB)' : 'Tapered Roller (TRB)' },
        { id: 'cylindrical-roller' as BearingType | 'all', label: language === 'tr' ? 'Silindirik Makaralı (CRB)' : language === 'de' ? 'Zylinderrollenlager (CRB)' : language === 'ja' ? '円筒ころ軸受 (CRB)' : 'Cylindrical Roller (CRB)' },
        { id: 'needle-roller' as BearingType | 'all', label: language === 'tr' ? 'İğneli Makaralı (NRB)' : language === 'de' ? 'Nadelkranz (NRB)' : language === 'ja' ? '針状ころ軸受 (NRB)' : 'Needle Roller (NRB)' },
        { id: 'thrust-ball' as BearingType | 'all', label: language === 'tr' ? 'Aksiyal Bilyalı (Thrust)' : language === 'de' ? 'Axial-Kugellager (Thrust)' : language === 'ja' ? 'スラスト玉軸受 (Thrust)' : 'Thrust Ball (Thrust)' },
    ], [language, t]);

    // Search & Filter State
    const [searchCode, setSearchCode] = useState('');
    const [typeFilter, setTypeFilter] = useState<BearingType | 'all'>('all');
    const [boreFilter, setBoreFilter] = useState<number | 'all'>('all');
    const [selectedBearing, setSelectedBearing] = useState<BearingData>(BEARING_CATALOG[14]); // 6204
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Inputs
    const [fr, setFr] = useState(5000);  // Radial Load (N)
    const [fa, setFa] = useState(1000);  // Axial Load (N)
    const [rpm, setRpm] = useState(3000);
    const [reliability, setReliability] = useState(90);

    // Get all unique bore sizes
    const uniqueBores = useMemo(() => {
        const bores = new Set<number>();
        BEARING_CATALOG.forEach(b => bores.add(b.d));
        return Array.from(bores).sort((a, b) => a - b);
    }, []);

    // Filter Logic
    const filteredBearings = useMemo(() => {
        let list = BEARING_CATALOG;
        if (typeFilter !== 'all') {
            list = list.filter(b => b.type === typeFilter);
        }
        if (boreFilter !== 'all') {
            list = list.filter(b => b.d === boreFilter);
        }
        
        const trimmed = searchCode.trim();
        if (trimmed) {
            const search = trimmed.toUpperCase().replace(/\s|-/g, '');
            let filtered = list.filter(b => b.code.toUpperCase().replace(/\s|-/g, '').includes(search));
            
            // Try to find a dynamic parsed bearing matching the search code
            const parsed = findBearing(trimmed);
            if (parsed) {
                const alreadyExists = filtered.some(b => b.code.toUpperCase().replace(/\s|-/g, '') === parsed.code.toUpperCase().replace(/\s|-/g, ''));
                if (!alreadyExists) {
                    filtered = [parsed, ...filtered];
                }
            }
            return filtered;
        }
        return list;
    }, [typeFilter, boreFilter, searchCode]);

    // Auto-select bearing if it matches exactly or is parsed dynamically
    useEffect(() => {
        const trimmed = searchCode.trim();
        if (trimmed.length >= 3) {
            const match = findBearing(trimmed);
            if (match) {
                setSelectedBearing(match);
            }
        }
    }, [searchCode]);

    // Derived Data
    const results = useMemo(() => {
        return calculateBearingLife(selectedBearing, fr / 1000, fa / 1000, rpm, reliability);
    }, [selectedBearing, fr, fa, rpm, reliability]);

    // Calculate dynamic machining tolerances using ISO 286 engine
    const machiningTolerances = useMemo(() => {
        const d = selectedBearing.d;
        const D = selectedBearing.D;
        const shaftFitInfo = getShaftFitClass(d);
        
        // Shaft Seat Fit: Hole = H7 (bearing bore standard deviation is treated as negative/h-like), Shaft = dynamic selection (js5/js6/k6/m6)
        const shaftFit = calculateFit(d, 'H', 7, shaftFitInfo.class, shaftFitInfo.grade);
        
        // Housing Seat Fit: Hole = H7 or JS7 (housing bore), Shaft = h7 (bearing outer ring standard outer diameter deviation)
        const housingFitH7 = calculateFit(D, 'H', 7, 'h', 7);
        const housingFitJS7 = calculateFit(D, 'JS', 7, 'h', 7);

        return {
            shaftLabel: shaftFitInfo.label,
            shaftFit,
            housingH7: housingFitH7,
            housingJS7: housingFitJS7
        };
    }, [selectedBearing]);

    const typeInfo = getBearingTypeInfo(selectedBearing.type);
    const lifeStatus = results.L10h > 50000 ? 'excellent' : results.L10h > 5000 ? 'good' : 'low';
    const status = lifeStatus === 'low' ? 'warning' : 'valid';

    const addToProject = () => {
        const volMm3 = (Math.pow(selectedBearing.D, 2) - Math.pow(selectedBearing.d, 2)) * selectedBearing.B * 0.6;
        const weight = (volMm3 / 1e9) * 7850;

        addItem({
            type: 'part',
            name: `Bearing ${selectedBearing.code}`,
            category: 'Bearings',
            material: 'Chrome Steel (GCr15)',
            weightPerUnit: weight,
            costPerUnit: weight * 18.5,
            quantity: 1
        });
    };

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "ISO 281:2007",
        standardTitle: "Rolling bearings \u2014 Dynamic load ratings and rating life",
        version: "2.0",
        assumptions: [
            "Lubrication condition assumed ideal (kappa > 1)",
            "Cleanliness: Normal clean",
            `Reliability: ${reliability}%`
        ]
    };

    const generateEnterpriseReport = async (meta: ReportMetadata) => {
        const engine = new PDFReportEngine(meta);
        let yPos = engine.addMetadataSection();

        yPos = engine.addKPIs([
            { label: "SKF Code", value: selectedBearing.code },
            { label: "Type", value: typeInfo.name.split(' ')[0] },
            { label: "L10h Life", value: `${results.L10h > 100000 ? '>100k' : results.L10h.toFixed(0)} hrs` }
        ], yPos);

        yPos = engine.addSectionTitle("Operating Conditions & Ratings", yPos);
        engine.addTable({
            head: [["Parameter", "Value", "Notes"]],
            body: [
                ["Radial Load (Fr)", `${fr} N`, "User Input"],
                ["Axial Load (Fa)", `${fa} N`, "User Input"],
                ["Operating Speed", `${rpm} RPM`, "User Input"],
                ["Target Reliability", `${reliability}%`, "ISO 281 L10 adjustment"],
                ["Dynamic Rating (C)", `${selectedBearing.C} kN`, "Catalog Data"],
                ["Static Rating (C0)", `${selectedBearing.C0} kN`, "Catalog Data"]
            ],
            startY: yPos
        });

        yPos = engine.addSectionTitle("Dimensions & Machining Fits", yPos);
        engine.addTable({
            head: [["Inner Dia (d)", "Outer Dia (D)", "Width (B)", "Shaft Fit Selection", "Housing Fit (H7)"]],
            body: [
                [
                    `${selectedBearing.d} mm`,
                    `${selectedBearing.D} mm`,
                    `${selectedBearing.B} mm`,
                    `${machiningTolerances.shaftLabel} (${(machiningTolerances.shaftFit.shaft_ei).toFixed(0)} / ${(machiningTolerances.shaftFit.shaft_es).toFixed(0)} µm)`,
                    `H7 (0 / +${(machiningTolerances.housingH7.holeES).toFixed(0)} µm)`
                ]
            ],
            startY: yPos
        });

        engine.save(`Bearing_Datasheet_${meta.referenceNo}.pdf`);
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-[#C5C6C7] select-none p-6 overflow-y-auto">

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Selector & Parameters */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Catalog Selection Panel */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/30 backdrop-blur-xl space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#00e5ff]">{t.catalogDb}</h3>
                            <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-mono text-white/30">SKF Standard</span>
                        </div>

                        {/* Search & Filters */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00e5ff]" />
                                <input
                                    className="w-full bg-[#0a1018] border border-white/5 focus:border-[#00e5ff]/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                                    placeholder={t.searchPlaceholder}
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value)}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="w-full bg-[#0a1018] border border-white/5 focus:border-[#00e5ff]/50 rounded-xl px-3 py-2.5 text-xs text-gray-300 font-medium focus:outline-none cursor-pointer"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value as any)}
                                >
                                    {bearingTypeFilters.map(f => (
                                        <option key={f.id} value={f.id} className="bg-[#020408] text-[#C5C6C7]">{f.label}</option>
                                    ))}
                                </select>

                                <select
                                    className="w-full bg-[#0a1018] border border-white/5 focus:border-[#00e5ff]/50 rounded-xl px-3 py-2.5 text-xs text-gray-300 font-medium focus:outline-none cursor-pointer"
                                    value={boreFilter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setBoreFilter(val === 'all' ? 'all' : Number(val));
                                    }}
                                >
                                    <option value="all" className="bg-[#020408] text-[#C5C6C7]">
                                        {language === 'tr' ? 'İç Çap: Tümü' : 'Bore: All'}
                                    </option>
                                    {uniqueBores.map(bore => (
                                        <option key={bore} value={bore} className="bg-[#020408] text-[#C5C6C7]">
                                            d = {bore} mm
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Scrolling list */}
                        <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {filteredBearings.slice(0, 45).map(b => (
                                <button
                                    key={b.code}
                                    onClick={() => setSelectedBearing(b)}
                                    className={`text-[10px] font-bold font-mono py-2 px-1.5 rounded-lg border transition-all ${
                                        selectedBearing.code === b.code
                                            ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] font-extrabold shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                                             : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {b.code}
                                </button>
                            ))}
                            {filteredBearings.length === 0 && (
                                <div className="col-span-3 text-center py-6 text-xs text-gray-500 font-mono">
                                    {t.noBearings}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inputs panel */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/30 backdrop-blur-xl space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#00e5ff]">{t.appliedConditions}</h3>
                            <Zap size={14} className="text-[#00e5ff]" />
                        </div>

                        <div className="space-y-4">
                            <CalculatorInput label={t.radialLoad} unit="N" value={fr} onChange={(e) => setFr(Number(e.target.value))} />
                            <ControlSlider label={t.fineTuneFr} value={fr} min={100} max={25000} step={100} unit="N" onChange={setFr} />
                            
                            <hr className="border-white/5" />
                            
                            <CalculatorInput label={t.axialLoad} unit="N" value={fa} onChange={(e) => setFa(Number(e.target.value))} />
                            <ControlSlider label={t.fineTuneFa} value={fa} min={0} max={15000} step={100} unit="N" onChange={setFa} />
                            
                            <hr className="border-white/5" />

                            <div className="grid grid-cols-2 gap-4">
                                <CalculatorInput label={t.speed} unit="RPM" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
                                <CalculatorInput label={t.reliability} unit="%" value={reliability} onChange={(e) => setReliability(Number(e.target.value))} />
                            </div>
                            <ControlSlider label={t.operatingSpeed} value={rpm} min={100} max={8000} step={50} unit="RPM" onChange={setRpm} />
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="p-4 rounded-xl bg-[#0a1018]/20 border border-white/5">
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
                        >
                            <FileText size={14} />
                            PDF SPEC
                        </button>
                    </div>
                </div>

                {/* Right Column: Visualization & Results */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Viewport Panel (Engineering Visualization) */}
                    <div className="p-4 bg-[#0a1018]/10 border border-[#00e5ff]/20 rounded-2xl shadow-2xl">
                        <EngineeringVisualization status={status} label={t.refCapacity.toUpperCase()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                                {/* Left side: Rotating 2D SVG */}
                                {(() => {
                                    const od = selectedBearing.D;
                                    const id = selectedBearing.d;
                                    const R_out = 90; // Fixed max outer radius in viewBox
                                    const R_in = R_out * (id / od);
                                    const H = R_out - R_in;
                                    const ringTh = H * 0.25;
                                    const R_pitch = (R_out + R_in) / 2;
                                    const R_roll = H * 0.25;

                                    // Dynamic quantity of rolling elements based on type
                                    const numElements = selectedBearing.type.includes('needle') ? 22 
                                        : (selectedBearing.type.includes('roller') || selectedBearing.type.includes('tapered') || selectedBearing.type.includes('cylindrical')) ? 14 
                                        : 9;

                                    // Real physics spin speeds
                                    const cageSpeedRatio = 0.5 * (1 - id / od);
                                    const orbitRpm = rpm * cageSpeedRatio;
                                    const spinRpm = id > 0 ? rpm * (od / (2 * id)) * (1 - Math.pow(id / od, 2)) : 0;

                                    // Scale down for visual comfort (so they don't spin like a complete blur)
                                    const visualSpeedFactor = 40;
                                    const orbitDuration = rpm > 0 ? 60 / (orbitRpm / visualSpeedFactor) : 0;
                                    const spinDuration = rpm > 0 ? 60 / (spinRpm / visualSpeedFactor) : 0;
                                    const innerDuration = rpm > 0 ? 60 / (rpm / visualSpeedFactor) : 0;

                                    return (
                                        <div className="bg-[#0a0c10] border border-[#00e5ff]/10 rounded-xl flex flex-col items-center justify-center p-6 min-h-[300px] relative">
                                            <svg viewBox="0 0 200 200" className="w-[180px] h-[180px] overflow-visible">
                                                <defs>
                                                    <radialGradient id="ringShine" cx="35%" cy="35%" r="65%">
                                                        <stop offset="0%" stopColor="#FFFFFF" />
                                                        <stop offset="30%" stopColor="#CBD5E1" />
                                                        <stop offset="70%" stopColor="#475569" />
                                                        <stop offset="100%" stopColor="#0F172A" />
                                                    </radialGradient>
                                                    <radialGradient id="ballShine" cx="30%" cy="30%" r="70%">
                                                        <stop offset="0%" stopColor="#FFFFFF" />
                                                        <stop offset="40%" stopColor="#E2E8F0" />
                                                        <stop offset="85%" stopColor="#475569" />
                                                        <stop offset="100%" stopColor="#1E293B" />
                                                    </radialGradient>
                                                    <radialGradient id="shaftShine" cx="40%" cy="40%" r="60%">
                                                        <stop offset="0%" stopColor="#64748B" />
                                                        <stop offset="65%" stopColor="#334155" />
                                                        <stop offset="100%" stopColor="#1E293B" />
                                                    </radialGradient>
                                                </defs>

                                                {/* Shaft Center Crosshairs (Engineering background) */}
                                                <g stroke="rgba(0, 229, 255, 0.15)" strokeWidth="0.5" pointerEvents="none">
                                                    <line x1="100" y1="5" x2="100" y2="195" strokeDasharray="10 3 2 3" />
                                                    <line x1="5" y1="100" x2="195" y2="100" strokeDasharray="10 3 2 3" />
                                                </g>

                                                {/* Outer Ring (Stationary) */}
                                                <circle cx="100" cy="100" r={R_out - ringTh / 2} fill="none" stroke="url(#ringShine)" strokeWidth={ringTh} />
                                                <circle cx="100" cy="100" r={R_out} fill="none" stroke="#1E293B" strokeWidth="0.5" />
                                                <circle cx="100" cy="100" r={R_out - ringTh} fill="none" stroke="#0F172A" strokeWidth="1" />
                                                {/* Outer Ring Raceway groove path */}
                                                <circle cx="100" cy="100" r={R_pitch + R_roll * 0.98} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />

                                                {/* Concentric centerline for rolling element orbit */}
                                                <circle cx="100" cy="100" r={R_pitch} fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="0.75" strokeDasharray="8 3 1 3" pointerEvents="none" />

                                                {/* Rotating Balls & Cage Group */}
                                                <g 
                                                    style={{ 
                                                        transformOrigin: '100px 100px',
                                                        animation: rpm > 0 ? `spin ${orbitDuration}s linear infinite` : 'none',
                                                    }}
                                                    className="transition-transform duration-300"
                                                >
                                                    {/* Cage Ring */}
                                                    <circle cx="100" cy="100" r={R_pitch} fill="none" stroke="#64748B" strokeWidth={R_roll * 0.9} opacity="0.2" />
                                                    <circle cx="100" cy="100" r={R_pitch + R_roll * 0.45} fill="none" stroke="#64748B" strokeWidth="0.5" opacity="0.4" />
                                                    <circle cx="100" cy="100" r={R_pitch - R_roll * 0.45} fill="none" stroke="#64748B" strokeWidth="0.5" opacity="0.4" />
                                                    
                                                    {/* Rolling Elements */}
                                                    {[...Array(numElements)].map((_, idx) => {
                                                        const angle = (idx * 360) / numElements;
                                                        const rad = (angle * Math.PI) / 180;
                                                        const bx = 100 + Math.cos(rad) * R_pitch;
                                                        const by = 100 + Math.sin(rad) * R_pitch;

                                                        return (
                                                            <g 
                                                                key={idx}
                                                                style={{
                                                                    transformOrigin: `${bx}px ${by}px`,
                                                                    animation: rpm > 0 ? `spin-reverse ${spinDuration}s linear infinite` : 'none'
                                                                }}
                                                            >
                                                                {selectedBearing.type.includes('roller') || selectedBearing.type.includes('tapered') || selectedBearing.type.includes('cylindrical') ? (
                                                                    // Cylindrical/Tapered Roller in front view
                                                                    <g>
                                                                        <circle
                                                                            cx={bx}
                                                                            cy={by}
                                                                            r={R_roll * 0.95}
                                                                            fill="url(#ringShine)"
                                                                            stroke="#334155"
                                                                            strokeWidth="0.8"
                                                                        />
                                                                        <circle
                                                                            cx={bx}
                                                                            cy={by}
                                                                            r={R_roll * 0.7}
                                                                            fill="none"
                                                                            stroke="#475569"
                                                                            strokeWidth="0.5"
                                                                        />
                                                                        {/* Rotation indicator mark */}
                                                                        <circle cx={bx} cy={by - R_roll * 0.5} r="1" fill="#00e5ff" opacity="0.9" />
                                                                    </g>
                                                                ) : selectedBearing.type.includes('needle') ? (
                                                                    // Needle roller in front view
                                                                    <g>
                                                                        <circle
                                                                            cx={bx}
                                                                            cy={by}
                                                                            r={R_roll * 0.9}
                                                                            fill="url(#ringShine)"
                                                                            stroke="#334155"
                                                                            strokeWidth="0.5"
                                                                        />
                                                                        <circle
                                                                            cx={bx}
                                                                            cy={by}
                                                                            r={R_roll * 0.4}
                                                                            fill="#0f172a"
                                                                            stroke="#475569"
                                                                            strokeWidth="0.3"
                                                                        />
                                                                    </g>
                                                                ) : (
                                                                    // Ball bearing in front view
                                                                    <g>
                                                                        <circle
                                                                            cx={bx}
                                                                            cy={by}
                                                                            r={R_roll * 0.95}
                                                                            fill="url(#ballShine)"
                                                                            stroke="#334155"
                                                                            strokeWidth="1"
                                                                        />
                                                                        {/* Rotation indicator mark */}
                                                                        <circle cx={bx} cy={by - R_roll * 0.55} r="1" fill="#00e5ff" opacity="0.9" />
                                                                    </g>
                                                                )}
                                                            </g>
                                                        );
                                                    })}
                                                </g>

                                                {/* Rotating Inner Ring & Shaft Assembly */}
                                                <g 
                                                    style={{ 
                                                        transformOrigin: '100px 100px',
                                                        animation: rpm > 0 ? `spin ${innerDuration}s linear infinite` : 'none',
                                                    }}
                                                >
                                                    {/* Inner Ring Body */}
                                                    <circle cx="100" cy="100" r={R_in + ringTh / 2} fill="none" stroke="url(#ringShine)" strokeWidth={ringTh} />
                                                    <circle cx="100" cy="100" r={R_in + ringTh} fill="none" stroke="#0F172A" strokeWidth="1" />
                                                    <circle cx="100" cy="100" r={R_in} fill="none" stroke="#1E293B" strokeWidth="0.5" />
                                                    
                                                    {/* Shaft Solid Steel body */}
                                                    <circle cx="100" cy="100" r={R_in - 0.5} fill="url(#shaftShine)" />
                                                    
                                                    {/* Shaft Center drilling hole */}
                                                    <circle cx="100" cy="100" r={Math.max(4, R_in * 0.25)} fill="#020408" stroke="#334155" strokeWidth="0.5" />
                                                    
                                                    {/* Crosshair markers on shaft center */}
                                                    <line x1="100" y1={100 - R_in * 0.35} x2="100" y2={100 + R_in * 0.35} stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />
                                                    <line x1={100 - R_in * 0.35} y1="100" x2={100 + R_in * 0.35} y2="100" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />

                                                    {/* Keyway slot details */}
                                                    <path d={`M 97,${100 - R_in + 1} L 97,${100 - R_in - 3} L 103,${100 - R_in - 3} L 103,${100 - R_in + 1} Z`} fill="#020408" stroke="#334155" strokeWidth="0.5" />
                                                    
                                                    {/* Keyway key (steel square bar) */}
                                                    <rect x="97.5" y={100 - R_in - 2.5} width="5" height="4.5" fill="url(#ringShine)" stroke="#475569" strokeWidth="0.5" />
                                                </g>
                                            </svg>

                                            <div className="absolute bottom-4 flex items-center gap-1.5 text-[9px] bg-black/60 px-2 py-0.5 rounded-lg border border-white/5 font-mono text-white font-bold">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#00e5ff] animate-pulse"></span>
                                                <span>{rpm} RPM</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Right side: Blueprint */}
                                <div className="bg-[#0a0c10] border border-[#00e5ff]/10 rounded-xl flex flex-col items-center justify-center p-6 min-h-[300px] relative">
                                    <TechnicalDrawing
                                        mode="bearing"
                                        activeField={null}
                                        data={{
                                            od: selectedBearing.D,
                                            id: selectedBearing.d,
                                            width: selectedBearing.B,
                                            type: selectedBearing.type.includes('ball') ? 'ball' :
                                                selectedBearing.type.includes('tapered') ? 'tapered' :
                                                    selectedBearing.type.includes('needle') ? 'needle' : 'roller'
                                        }}
                                    />
                                    <div className="absolute bottom-4 flex items-center gap-1 text-[9px] bg-black/60 px-2 py-0.5 rounded-lg border border-white/5 font-mono text-white font-bold">
                                        <span style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                                        <span>{selectedBearing.code}</span>
                                    </div>
                                </div>
                            </div>
                            <style>{`
                                @keyframes spin {
                                    100% { transform: rotate(360deg); }
                                }
                                @keyframes spin-reverse {
                                    100% { transform: rotate(-360deg); }
                                }
                            `}</style>
                        </EngineeringVisualization>
                    </div>

                            
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DataDisplay 
                                label={t.l10hLife} 
                                value={results.L10h > 100000 ? '>100k' : results.L10h.toFixed(0)} 
                                unit={t.hours} 
                                icon={Clock} 
                                color={status === 'valid' ? COLORS.accent : COLORS.danger}
                            />
                            <DataDisplay 
                                label={t.equivLoadP} 
                                value={results.P.toFixed(2)} 
                                unit="kN" 
                                icon={Zap} 
                            />
                            <DataDisplay 
                                label={t.equivStaticP0} 
                                value={results.P0.toFixed(2)} 
                                unit="kN" 
                                icon={Activity} 
                            />
                            <DataDisplay 
                                label={t.staticSafetyS0} 
                                value={results.staticSafety.toFixed(2)} 
                                unit="" 
                                icon={Shield} 
                                color={results.staticSafety > 1.0 ? COLORS.success : COLORS.danger}
                            />
                        </div>

                        {/* Extended Details Panel */}
                        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/20 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00e5ff]/5 blur-[80px] rounded-full pointer-events-none" />
                            
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                                <span className="text-[10px] font-bold tracking-[0.2em] text-[#00e5ff] uppercase flex items-center gap-1.5">
                                    <RotateCw size={12} className="animate-spin-slow" />
                                    {t.refCapacity}
                                </span>
                                {status === 'valid' ? (
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#10B981] font-mono">
                                        <CheckCircle size={12} />
                                        <span>{t.safetyMet}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#FF4D4D] font-mono animate-pulse">
                                        <AlertTriangle size={12} />
                                        <span>{t.belowDesign}</span>
                                    </div>
                                )}
                            </div>

                             <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs font-mono">
                                <div className="space-y-1">
                                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">{t.dynRating}</div>
                                    <div className="text-white font-bold">{selectedBearing.C} kN</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">{t.staticRating}</div>
                                    <div className="text-white font-bold">{selectedBearing.C0} kN</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">{t.boreDia}</div>
                                    <div className="text-white font-bold">{selectedBearing.d} mm</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">{t.outerDia}</div>
                                    <div className="text-white font-bold">{selectedBearing.D} mm</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">{t.width}</div>
                                    <div className="text-white font-bold">{selectedBearing.B} mm</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">{language === 'tr' ? 'Kütle' : 'Mass'}</div>
                                    <div className="text-white font-bold">{selectedBearing.mass ? `${selectedBearing.mass.toFixed(3)} kg` : 'N/A'}</div>
                                </div>
                            </div>

                            {results.warnings && results.warnings.length > 0 && (
                                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono space-y-1">
                                    {results.warnings.map((warning, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <span className="shrink-0 text-red-500">⚠️</span>
                                            <span>{warning}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Machining & Tolerances Panel */}
                        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/20 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-48 h-48 bg-[#00e5ff]/5 blur-[80px] rounded-full pointer-events-none" />
                            
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                                <span className="text-[10px] font-bold tracking-[0.2em] text-[#00e5ff] uppercase flex items-center gap-1.5">
                                    <Settings size={12} className="text-[#00e5ff]" />
                                    {t.machiningRec}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
                                {/* Shaft Tolerance Seat */}
                                <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-white/5">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="text-[#00e5ff] font-bold">{t.shaftSeat}</span>
                                        <span className="bg-[#00e5ff]/20 text-[#00e5ff] px-2 py-0.5 rounded text-[10px] font-extrabold">{machiningTolerances.shaftLabel}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-white/40">{t.nominalDia}:</span>
                                            <span className="text-white font-bold">{selectedBearing.d} mm</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/40">{t.upperDev}:</span>
                                            <span className="text-white font-bold">{(machiningTolerances.shaftFit.shaft_es >= 0 ? '+' : '')}{(machiningTolerances.shaftFit.shaft_es).toFixed(1)} µm</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/40">{t.lowerDev}:</span>
                                            <span className="text-white font-bold">{(machiningTolerances.shaftFit.shaft_ei >= 0 ? '+' : '')}{(machiningTolerances.shaftFit.shaft_ei).toFixed(1)} µm</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1 text-[11px]">
                                            <span className="text-white/50">{t.limits}:</span>
                                            <span className="text-emerald-400 font-bold">
                                                {(selectedBearing.d + machiningTolerances.shaftFit.shaft_ei / 1000).toFixed(4)} ... {(selectedBearing.d + machiningTolerances.shaftFit.shaft_es / 1000).toFixed(4)} mm
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Housing Tolerance Seat */}
                                <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-white/5">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="text-[#00e5ff] font-bold">{t.housingSeat}</span>
                                        <span className="bg-[#00e5ff]/20 text-[#00e5ff] px-2 py-0.5 rounded text-[10px] font-extrabold">H7 / JS7</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[11px] text-white/60">
                                                <span>{t.normalRotation}:</span>
                                                <span className="text-white">0 / +{(machiningTolerances.housingH7.holeES).toFixed(0)} µm</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] pl-2 text-white/40">
                                                <span>{t.limitDia}:</span>
                                                <span>{(selectedBearing.D + machiningTolerances.housingH7.holeEI / 1000).toFixed(4)} ... {(selectedBearing.D + machiningTolerances.housingH7.holeES / 1000).toFixed(4)} mm</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1 border-t border-white/5 pt-1.5">
                                            <div className="flex justify-between text-[11px] text-white/60">
                                                <span>{t.easyAssembly}:</span>
                                                <span className="text-white">{(machiningTolerances.housingJS7.holeEI >= 0 ? '+' : '')}{(machiningTolerances.housingJS7.holeEI).toFixed(1)} / +{(machiningTolerances.housingJS7.holeES).toFixed(1)} µm</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] pl-2 text-white/40">
                                                <span>{t.limitDia}:</span>
                                                <span>{(selectedBearing.D + machiningTolerances.housingJS7.holeEI / 1000).toFixed(4)} ... {(selectedBearing.D + machiningTolerances.housingJS7.holeES / 1000).toFixed(4)} mm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fit Deviation Zones Chart */}
                                {(() => {
                                    const holeES = machiningTolerances.shaftFit.holeES;
                                    const holeEI = machiningTolerances.shaftFit.holeEI;
                                    const shaft_es = machiningTolerances.shaftFit.shaft_es;
                                    const shaft_ei = machiningTolerances.shaftFit.shaft_ei;

                                    const maxVal = Math.max(holeES, shaft_es, 0) + 4;
                                    const minVal = Math.min(holeEI, shaft_ei, 0) - 4;
                                    const range = maxVal - minVal || 1;

                                    const getPct = (val: number) => ((val - minVal) / range) * 100;

                                    const zeroLinePct = getPct(0);
                                    const holeBottom = getPct(holeEI);
                                    const holeTop = getPct(holeES);
                                    const shaftBottom = getPct(shaft_ei);
                                    const shaftTop = getPct(shaft_es);

                                    return (
                                        <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between min-h-[140px]">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                                <span className="text-[#00e5ff] font-bold">{language === 'tr' ? 'Sapma Bölgeleri (µm)' : 'Deviation Zones (µm)'}</span>
                                                <span className="text-[9px] text-white/40 font-mono">ISO 286</span>
                                            </div>
                                            
                                            <div className="relative h-[85px] w-full bg-slate-950/40 border border-white/5 rounded-lg overflow-hidden flex items-end">
                                                {/* Zero Line (Nominal) */}
                                                <div 
                                                    className="absolute left-0 right-0 border-t border-dashed border-white/20 z-10 flex items-center justify-end pr-1"
                                                    style={{ bottom: `${zeroLinePct}%` }}
                                                >
                                                    <span className="text-[7px] text-white/30 font-mono">0</span>
                                                </div>

                                                {/* Hole Zone (H7) */}
                                                <div 
                                                    className="absolute w-[24%] left-[18%] bg-blue-500/20 border border-blue-400/50 rounded flex items-center justify-center text-[8px] text-blue-300 font-bold"
                                                    style={{ 
                                                        bottom: `${holeBottom}%`, 
                                                        height: `${Math.max(4, holeTop - holeBottom)}%` 
                                                    }}
                                                    title={`Hole: +${holeES} / ${holeEI} µm`}
                                                >
                                                    H7
                                                </div>

                                                {/* Shaft Zone */}
                                                <div 
                                                    className="absolute w-[24%] right-[18%] bg-cyan-500/30 border border-cyan-400/50 rounded flex items-center justify-center text-[8px] text-cyan-200 font-bold"
                                                    style={{ 
                                                        bottom: `${shaftBottom}%`, 
                                                        height: `${Math.max(4, shaftTop - shaftBottom)}%` 
                                                    }}
                                                    title={`Shaft: ${shaft_es >= 0 ? '+' : ''}${shaft_es.toFixed(1)} / ${shaft_ei >= 0 ? '+' : ''}${shaft_ei.toFixed(1)} µm`}
                                                >
                                                    {machiningTolerances.shaftLabel}
                                                </div>
                                            </div>

                                            <div className="flex justify-around text-[8px] text-white/40 uppercase font-mono tracking-wider">
                                                <span>{language === 'tr' ? 'Bilezik' : 'Bore'}</span>
                                                <span>{language === 'tr' ? 'Mil' : 'Shaft'}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] space-y-2 text-white/60 leading-relaxed font-mono">
                                <p>
                                    <strong className="text-[#00e5ff]">{t.shaftLogic}:</strong> {t.shaftLogicDesc.replace('{fit}', machiningTolerances.shaftLabel)}
                                </p>
                                <p>
                                    <strong className="text-[#00e5ff]">{t.housingLogic}:</strong> {t.housingLogicDesc}
                                </p>
                            </div>
                        </div>
                    </div>

                    <AssumptionPanel metadata={metadata} status={status} />
                </div>
            </div>

            <ReportSettingsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={generateEnterpriseReport}
                defaultTitle="ISO 281 Bearing Life Analysis"
            />
        </div>
    );
}
