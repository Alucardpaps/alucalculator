'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCADCanvasStore } from '@/store/CADCanvasStore';
import {
    ShoppingCart,
    FileText,
    Plus,
    Layers,
    Scale,
    Box,
    CircleDot,
    ChevronDown,
    Gauge,
    Copy,
    Check,
    Eye,
    Maximize2,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
} from 'lucide-react';
import { MATERIALS_DB, getMaterialCategories, getMaterialsByCategory } from '@/data/materialsData';
import { CUTTING_METHODS, CuttingMethod, BASELINE_PRICES } from '@/data/productionParams';
import { SIGMA_PROFILES } from '@/data/mechanical/profiles';
import { useProjectStore } from '@/store/projectStore';
import { PDFReportEngine, ReportMetadata } from '@/lib/pdfReportEngine';
import { ReportSettingsModal } from '@/components/ui/ReportSettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileCADCanvas, ShapeType } from './ProfileCADCanvas';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

const SHAPES: { id: ShapeType; labelEn: string; labelTr: string; descEn: string; descTr: string; icon: string }[] = [
    { id: 'plate', labelEn: 'Flat Bar / Plate', labelTr: 'Lama / Plaka', descEn: 'Solid Rectangular Section', descTr: 'Dolu Dörtgen Kesit', icon: '▬' },
    { id: 'round', labelEn: 'Solid Round Bar', labelTr: 'Dolu Mil', descEn: 'Round Bar', descTr: 'Yuvarlak Çubuk', icon: '●' },
    { id: 'tube', labelEn: 'Tube', labelTr: 'Boru', descEn: 'Circular Hollow Section', descTr: 'Dairesel İçi Boş', icon: '◎' },
    { id: 'hollow-rect', labelEn: 'Box Profile', labelTr: 'Kutu Profil', descEn: 'Square / Rectangular Hollow', descTr: 'Kare / Dikdörtgen Profil', icon: '▢' },
    { id: 'angle', labelEn: 'Angle Bar', labelTr: 'Köşebent', descEn: 'L-Profile (Equal / Unequal)', descTr: 'L-Profil (Eşit / Çeşit)', icon: '∟' },
    { id: 'channel', labelEn: 'U-Channel', labelTr: 'U-Kanal', descEn: 'NPU / UPE Profile', descTr: 'NPU / UPE Profil', icon: '⊓' },
    { id: 'i-beam', labelEn: 'I / H Beam', labelTr: 'I / H Kiriş', descEn: 'IPE / HEA / HEB Steel', descTr: 'IPE / HEA / HEB Çelik', icon: '工' },
    { id: 'hex', labelEn: 'Hexagonal', labelTr: 'Altıköşe', descEn: 'Hexagonal Solid Bar', descTr: 'Altıgen Dolu Çubuk', icon: '⬡' },
    { id: 't-profile', labelEn: 'T-Profile', labelTr: 'T-Profil', descEn: 'T-Bar / T-Beam', descTr: 'T-Demiri / T-Beam', icon: '⊤' },
    { id: 'sigma', labelEn: 'Sigma Profile', labelTr: 'Sigma Profil', descEn: 'Aluminum T-Slot Modular', descTr: 'Alüminyum T-Kanal Modüler', icon: '⧉' },
];

const QUICK_MATERIALS = [
    { labelEn: 'Alu 6061-T6', labelTr: 'Alu 6061-T6', category: 'Aluminum', name: '6061-T6 (US Standard)', density: 2.70 },
    { labelEn: 'Alu 7075-T6', labelTr: 'Alu 7075-T6', category: 'Aluminum', name: 'Alu 7075-T6', density: 2.81 },
    { labelEn: 'Steel S235', labelTr: 'Çelik S235', category: 'Steel', name: 'S235JR (St37)', density: 7.85 },
    { labelEn: 'Steel 4140', labelTr: 'Çelik 4140', category: 'Steel', name: 'AISI 4140 (Cr-Mo)', density: 7.85 },
    { labelEn: 'Stainless 304', labelTr: 'Paslanmaz 304', category: 'Stainless', name: 'SS 304 (Std)', density: 8.00 },
    { labelEn: 'Brass CuZn39', labelTr: 'Pirinç CuZn39', category: 'Copper', name: 'Cu-ETP (Electrolytic)', density: 8.94 },
    { labelEn: 'Titanium Gr5', labelTr: 'Titanyum Gr5', category: 'Titanium', name: 'Titanium Gr.5 (Ti6Al4V)', density: 4.43 },
];

export default function ProfileWeightModule() {
  const precision = useGlobalPrecision();
    const { addShape } = useCADCanvasStore();
    const { addItem } = useProjectStore();
    const { language } = useI18nStore();

    const [shape, setShape] = useState<ShapeType>('plate');
    const [category, setCategory] = useState('Aluminum');
    const [material, setMaterial] = useState('6061-T6 (US Standard)');
    const [quantity, setQuantity] = useState(1);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // View Options
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [showDimensions, setShowDimensions] = useState(true);
    const [showAxes, setShowAxes] = useState(true);

    // Dimensions
    const [length, setLength] = useState(1000);
    const [width, setWidth] = useState(100);
    const [thickness, setThickness] = useState(10);
    const [diameter, setDiameter] = useState(50);
    const [wallThickness, setWallThickness] = useState(5);
    const [height, setHeight] = useState(100);
    const [flangeW, setFlangeW] = useState(60);
    const [webH, setWebH] = useState(120);
    const [flangeT, setFlangeT] = useState(8);
    const [webT, setWebT] = useState(5);
    const [sigmaId, setSigmaId] = useState('4040');

    // Production Parameters
    const [cuttingMethod, setCuttingMethod] = useState<CuttingMethod>('Laser');
    const [nestingEfficiency, setNestingEfficiency] = useState(90);
    const [pricePerKg, setPricePerKg] = useState<number>(4.50);

    const categories = getMaterialCategories();
    const availableMaterials = getMaterialsByCategory(category);

    useEffect(() => {
        if (availableMaterials.length > 0 && !availableMaterials.find(m => m.name === material)) {
            setMaterial(availableMaterials[0].name);
        }
        const matData = availableMaterials.find(m => m.name === material) || availableMaterials[0];
        if (matData?.basePrice) {
            setPricePerKg(matData.basePrice);
        } else {
            const defaultPrice = (BASELINE_PRICES as Record<string, number>)[category] || 5.00;
            setPricePerKg(defaultPrice);
        }
    }, [category, material]);

    const materialData = useMemo(() => MATERIALS_DB.find(m => m.name === material), [material]);
    const density = materialData?.density || 2.70;

    // Engineering & Weight Computations
    const result = useMemo(() => {
        let areaMm2 = 0;
        let perimeterMm = 0;
        let Ix_cm4 = 0;
        let Iy_cm4 = 0;

        switch (shape) {
            case 'plate': {
                areaMm2 = width * thickness;
                perimeterMm = 2 * (width + thickness);
                Ix_cm4 = (width * Math.pow(thickness, 3)) / 12 / 10000;
                Iy_cm4 = (thickness * Math.pow(width, 3)) / 12 / 10000;
                break;
            }
            case 'round': {
                const r = diameter / 2;
                areaMm2 = Math.PI * r * r;
                perimeterMm = Math.PI * diameter;
                Ix_cm4 = (Math.PI * Math.pow(diameter, 4)) / 64 / 10000;
                Iy_cm4 = Ix_cm4;
                break;
            }
            case 'tube': {
                const ro = diameter / 2;
                const ri = Math.max(ro - wallThickness, 0);
                areaMm2 = Math.PI * (ro * ro - ri * ri);
                perimeterMm = Math.PI * (diameter + 2 * ri);
                Ix_cm4 = (Math.PI * (Math.pow(diameter, 4) - Math.pow(2 * ri, 4))) / 64 / 10000;
                Iy_cm4 = Ix_cm4;
                break;
            }
            case 'hollow-rect': {
                const innerW = Math.max(width - 2 * wallThickness, 0);
                const innerH = Math.max(height - 2 * wallThickness, 0);
                areaMm2 = width * height - innerW * innerH;
                perimeterMm = 2 * (width + height + innerW + innerH);
                Ix_cm4 = (width * Math.pow(height, 3) - innerW * Math.pow(innerH, 3)) / 12 / 10000;
                Iy_cm4 = (height * Math.pow(width, 3) - innerH * Math.pow(innerW, 3)) / 12 / 10000;
                break;
            }
            case 'angle': {
                areaMm2 = width * thickness + (height - thickness) * thickness;
                perimeterMm = 2 * (width + height);
                Ix_cm4 = (thickness * Math.pow(height, 3) + width * Math.pow(thickness, 3)) / 36 / 10000;
                Iy_cm4 = (thickness * Math.pow(width, 3) + height * Math.pow(thickness, 3)) / 36 / 10000;
                break;
            }
            case 'channel': {
                areaMm2 = width * thickness * 2 + (height - 2 * thickness) * thickness;
                perimeterMm = 2 * (2 * width + height);
                Ix_cm4 = (width * Math.pow(height, 3) - (width - thickness) * Math.pow(height - 2 * thickness, 3)) / 12 / 10000;
                Iy_cm4 = (2 * thickness * Math.pow(width, 3) + (height - 2 * thickness) * Math.pow(thickness, 3)) / 12 / 10000;
                break;
            }
            case 'i-beam': {
                areaMm2 = 2 * flangeW * flangeT + (webH - 2 * flangeT) * webT;
                perimeterMm = 2 * (2 * flangeW + webH);
                Ix_cm4 = (flangeW * Math.pow(webH, 3) - (flangeW - webT) * Math.pow(webH - 2 * flangeT, 3)) / 12 / 10000;
                Iy_cm4 = (2 * flangeT * Math.pow(flangeW, 3) + (webH - 2 * flangeT) * Math.pow(webT, 3)) / 12 / 10000;
                break;
            }
            case 'hex': {
                areaMm2 = (Math.sqrt(3) / 2) * Math.pow(diameter, 2);
                perimeterMm = 6 * (diameter / Math.sqrt(3));
                Ix_cm4 = (5 * Math.sqrt(3) * Math.pow(diameter, 4)) / 96 / 10000;
                Iy_cm4 = Ix_cm4;
                break;
            }
            case 't-profile': {
                areaMm2 = width * flangeT + (height - flangeT) * webT;
                perimeterMm = 2 * (width + height);
                Ix_cm4 = (width * Math.pow(height, 3)) / 36 / 10000;
                Iy_cm4 = (flangeT * Math.pow(width, 3) + (height - flangeT) * Math.pow(webT, 3)) / 12 / 10000;
                break;
            }
            case 'sigma': {
                const sigmaProf = SIGMA_PROFILES.find(p => p.id === sigmaId) || SIGMA_PROFILES[0];
                areaMm2 = (sigmaProf.weight / (2.7 / 1000)) || (sigmaProf.w * sigmaProf.h * 0.45);
                perimeterMm = (sigmaProf.w + sigmaProf.h) * 3.2;
                Ix_cm4 = sigmaProf.ix;
                Iy_cm4 = sigmaProf.iy;
                break;
            }
        }

        // Mass per meter in kg/m: Area (mm2) * density (g/cm3) / 1000
        const massPerMeterKg = (areaMm2 * density) / 1000;
        const netPieceVolumeMm3 = areaMm2 * length;
        const netPieceWeightKg = (netPieceVolumeMm3 * density) / 1e6;

        const kerfSpec = CUTTING_METHODS.find(c => c.method === cuttingMethod);
        const kerfWidth = kerfSpec ? kerfSpec.widthMm : 1.5;
        const grossPieceVolumeMm3 = areaMm2 * (length + kerfWidth);
        const grossPieceWeightKg = (grossPieceVolumeMm3 * density) / 1e6;

        const eff = Math.min(Math.max(nestingEfficiency, 10), 100) / 100;
        const materialConsumedKg = grossPieceWeightKg / eff;
        const totalNetWeight = netPieceWeightKg * quantity;
        const totalOrderWeight = materialConsumedKg * quantity;
        const totalCost = totalOrderWeight * pricePerKg;
        const scrapWeight = totalOrderWeight - totalNetWeight;
        const scrapCost = scrapWeight * pricePerKg;

        // Surface Area in m2
        const surfaceAreaM2 = (perimeterMm * length) / 1e6;

        return {
            areaMm2,
            massPerMeterKg,
            netPieceWeightKg,
            grossPieceWeightKg,
            totalNetWeight,
            totalOrderWeight,
            totalCost,
            scrapWeight,
            scrapCost,
            surfaceAreaM2,
            Ix_cm4,
            Iy_cm4,
            display: {
                massPerMeter:formatEngineeringValue(massPerMeterKg, precision, false),
                netWeight:formatEngineeringValue(totalNetWeight, precision, false),
                totalWeight:formatEngineeringValue(totalOrderWeight, precision, false),
                totalCost:formatEngineeringValue(totalCost, precision, false),
                scrapWeight: formatEngineeringValue(Math.max(0, scrapWeight), precision, false),
                scrapCost: formatEngineeringValue(Math.max(0, scrapCost), precision, false),
                surfaceArea:formatEngineeringValue((surfaceAreaM2 * quantity), precision, false),
                areaMm2:formatEngineeringValue(areaMm2, precision, false),
            },
        };
    }, [
        shape,
        length,
        width,
        thickness,
        diameter,
        wallThickness,
        height,
        flangeW,
        webH,
        flangeT,
        webT,
        sigmaId,
        density,
        quantity,
        cuttingMethod,
        nestingEfficiency,
        pricePerKg,
    ]);

    const addToProject = () => {
        addItem({
            type: 'part',
            name: `${t12(language, SHAPES.find(s => s.id === shape)?.labelEn || shape, SHAPES.find(s => s.id === shape)?.labelTr || shape)} ${width || diameter}x${height || thickness} L${length}`,
            category,
            material,
            quantity,
            weightPerUnit: result.grossPieceWeightKg,
            costPerUnit: result.grossPieceWeightKg * pricePerKg,
        });
    };

    const exportToCAD = () => {
        const shapes: any[] = [];
        const createPolyline = (points: { x: number; y: number }[]) => ({
            type: 'polyline',
            points,
            style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
            locked: false,
            visible: true,
            layer: 'profile',
        });

        switch (shape) {
            case 'plate':
                shapes.push({
                    type: 'rectangle',
                    points: [{ x: -width / 2, y: -thickness / 2 }, { x: width / 2, y: thickness / 2 }],
                    style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
                    visible: true,
                    layer: 'profile',
                });
                break;
            case 'round':
                shapes.push({
                    type: 'circle',
                    points: [{ x: 0, y: 0 }, { x: diameter / 2, y: 0 }],
                    style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
                    locked: false,
                    visible: true,
                    layer: 'profile',
                });
                break;
            case 'angle':
                shapes.push(createPolyline([
                    { x: 0, y: 0 },
                    { x: width, y: 0 },
                    { x: width, y: thickness },
                    { x: thickness, y: thickness },
                    { x: thickness, y: height },
                    { x: 0, y: height },
                    { x: 0, y: 0 },
                ]));
                break;
            default:
                break;
        }
        shapes.forEach(s => addShape(s));
    };

    const copySummary = () => {
        const shapeItem = SHAPES.find(s => s.id === shape);
        const text = [
            t12(language, 'PROFILE WEIGHT & MATERIAL REPORT', 'PROFİL AĞIRLIK & MALZEME RAPORU'),
            `---------------------------------`,
            `${t12(language, 'Profile Type:', 'Profil Tipi:')} ${t12(language, shapeItem?.labelEn || shape, shapeItem?.labelTr || shape)}`,
            `${t12(language, 'Material:', 'Malzeme:')} ${material} (${density} g/cm³)`,
            `${t12(language, 'Length (L):', 'Boy (L):')} ${length} mm`,
            `${t12(language, 'Cross Section Area:', 'Kesit Alanı:')} ${result.display.areaMm2} mm²`,
            `${t12(language, 'Unit Weight:', 'Birim Ağırlık:')} ${result.display.massPerMeter} kg/m`,
            `${t12(language, `Net Weight (${quantity} pcs):`, `Net Ağırlık (${quantity} adet):`)} ${result.display.netWeight} kg`,
            `${t12(language, 'Total Order Weight:', 'Toplam Sipariş Ağırlığı:')} ${result.display.totalWeight} kg`,
            `${t12(language, 'Total Estimated Cost:', 'Toplam Tahmini Maliyet:')} $${result.display.totalCost}`,
            `${t12(language, 'Outer Surface Area:', 'Dış Yüzey Alanı:')} ${result.display.surfaceArea} m²`,
        ].join('\n');

        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateEnterpriseReport = async (metadata: ReportMetadata) => {
        const engine = new PDFReportEngine(metadata);
        let yPos = engine.addMetadataSection();
        yPos = engine.addKPIs([
            { label: 'Material', value: material },
            { label: 'Quantity', value: quantity.toString() },
            { label: 'Total Cost', value: `$${formatEngineeringValue(result.totalCost, precision, false)}` },
        ], yPos);
        yPos = engine.addSectionTitle('Profile Parameters', yPos);
        engine.addTable({
            head: [['Parameter', 'Value']],
            body: [
                ['Shape', SHAPES.find(s => s.id === shape)?.labelEn || shape],
                ['Length', `${length} mm`],
                ['Weight per meter', `${result.display.massPerMeter} kg/m`],
                ['Net Weight (ea)', `${formatEngineeringValue(result.netPieceWeightKg, precision, false)} kg`],
                ['Gross Weight (ea)', `${formatEngineeringValue(result.grossPieceWeightKg, precision, false)} kg`],
                ['Total Weight', `${result.display.totalWeight} kg`],
            ],
            startY: yPos,
        });
        engine.save(`Profile_DataSheet_${metadata.referenceNo}.pdf`);
    };

    return (
        <div className="flex flex-col xl:flex-row h-full w-full bg-[var(--bg-0)] text-white overflow-y-auto xl:overflow-hidden font-sans select-none">
            {/* ═══ LEFT PANEL — CONTROLS (420px) ═══ */}
            <div className="w-full xl:w-[440px] shrink-0 flex flex-col h-auto xl:h-full bg-[var(--bg-0)] border-b xl:border-b-0 xl:border-r border-white/10 overflow-hidden">
                {/* Module Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/30 text-cyan-400 shadow-md ">
                            <Scale size={22} strokeWidth={2.2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-black uppercase tracking-tight text-white">
                                    {t12(language, 'Profile Weight & Cost', 'Profil Ağırlık & Maliyet')}
                                </h1>
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-mono text-cyan-400 font-bold">
                                    ISO CAD
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                                {t12(language, 'Volume, Weight per Meter, Area & Cutting Calc', 'Hacim, Metretül, Alan & Kesim Hesabı')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Shape Selector Carousel/Grid */}
                <div className="p-4 border-b border-white/10 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                        {t12(language, 'Profile Geometry Selection', 'Profil Geometrisi Seçimi')}
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                        {SHAPES.map(s => {
                            const isSelected = shape === s.id;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setShape(s.id)}
                                    title={t12(language, s.descEn, s.descTr)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md '
                                            : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span className="text-base leading-none mb-1 text-cyan-400">{s.icon}</span>
                                    <span className="truncate w-full text-center text-[8.5px]">{t12(language, s.labelEn, s.labelTr).split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Scrollable Dimension & Material Controls */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                    {/* Material & Density */}
                    <div className="space-y-3 bg-[var(--bg-1)] border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                                <Layers size={13} /> {t12(language, 'Material & Alloy', 'Malzeme & Alaşım')}
                            </span>
                            <span className="text-xs font-mono font-bold text-cyan-300">
                                {formatEngineeringValue(density, precision, false)} g/cm³
                            </span>
                        </div>

                        {/* Quick Material Presets */}
                        <div className="flex flex-wrap gap-1">
                            {QUICK_MATERIALS.map(m => (
                                <button
                                    key={m.labelEn}
                                    type="button"
                                    onClick={() => {
                                        setCategory(m.category);
                                        setMaterial(m.name);
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                                        material === m.name
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {t12(language, m.labelEn, m.labelTr)}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t12(language, 'Category', 'Kategori')}</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-[var(--bg-0)] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t12(language, 'Alloy', 'Alaşım')}</label>
                                <select
                                    value={material}
                                    onChange={e => setMaterial(e.target.value)}
                                    className="w-full bg-[var(--bg-0)] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                                >
                                    {availableMaterials.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Shape Specific Dimensions Input */}
                    <div className="space-y-3 bg-[var(--bg-1)] border border-white/5 rounded-2xl p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                            <Box size={13} /> {t12(language, 'Geometric Dimensions (mm)', 'Geometrik Ölçüler (mm)')}
                        </span>

                        <div className="space-y-3">
                            <InputRow label={t12(language, 'Length (L)', 'Boy / Uzunluk (L)')} unit="mm" value={length} onChange={setLength} color="#00e5ff" />

                            {shape === 'plate' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <InputRow label={t12(language, 'Width (W)', 'Genişlik (W)')} unit="mm" value={width} onChange={setWidth} color="#00e5ff" />
                                    <InputRow label={t12(language, 'Thickness (t)', 'Kalınlık (t)')} unit="mm" value={thickness} onChange={setThickness} color="#f59e0b" />
                                </div>
                            )}

                            {(shape === 'round' || shape === 'hex') && (
                                <InputRow
                                    label={shape === 'hex' ? t12(language, 'Wrench Size (S)', 'Anahtar Ağzı (S)') : t12(language, 'Diameter (ØD)', 'Çap (ØD)')}
                                    unit="mm"
                                    value={diameter}
                                    onChange={setDiameter}
                                    color="#00e5ff"
                                />
                            )}

                            {shape === 'tube' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <InputRow label={t12(language, 'Outer Diameter (ØD)', 'Dış Çap (ØD)')} unit="mm" value={diameter} onChange={setDiameter} color="#00e5ff" />
                                    <InputRow label={t12(language, 'Wall Thickness (t)', 'Et Kalınlığı (t)')} unit="mm" value={wallThickness} onChange={setWallThickness} color="#f59e0b" />
                                </div>
                            )}

                            {shape === 'hollow-rect' && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputRow label={t12(language, 'Width (W)', 'Genişlik (W)')} unit="mm" value={width} onChange={setWidth} color="#00e5ff" />
                                        <InputRow label={t12(language, 'Height (H)', 'Yükseklik (H)')} unit="mm" value={height} onChange={setHeight} color="#00e5ff" />
                                    </div>
                                    <InputRow label={t12(language, 'Wall Thickness (t)', 'Et Kalınlığı (t)')} unit="mm" value={wallThickness} onChange={setWallThickness} color="#f59e0b" />
                                </>
                            )}

                            {(shape === 'angle' || shape === 'channel') && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputRow label={t12(language, 'Width (W)', 'Genişlik (W)')} unit="mm" value={width} onChange={setWidth} color="#00e5ff" />
                                        <InputRow label={t12(language, 'Height (H)', 'Yükseklik (H)')} unit="mm" value={height} onChange={setHeight} color="#00e5ff" />
                                    </div>
                                    <InputRow label={t12(language, 'Thickness (t)', 'Kalınlık (t)')} unit="mm" value={thickness} onChange={setThickness} color="#f59e0b" />
                                </>
                            )}

                            {shape === 'i-beam' && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputRow label={t12(language, 'Flange Width (b)', 'Flanş Genişliği (b)')} unit="mm" value={flangeW} onChange={setFlangeW} color="#00e5ff" />
                                        <InputRow label={t12(language, 'Web Height (h)', 'Gövde Boyu (h)')} unit="mm" value={webH} onChange={setWebH} color="#00e5ff" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputRow label={t12(language, 'Flange Thickness (tf)', 'Flanş Kalınlığı (tf)')} unit="mm" value={flangeT} onChange={setFlangeT} color="#f59e0b" />
                                        <InputRow label={t12(language, 'Web Thickness (tw)', 'Gövde Kalınlığı (tw)')} unit="mm" value={webT} onChange={setWebT} color="#f59e0b" />
                                    </div>
                                </>
                            )}

                            {shape === 't-profile' && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputRow label={t12(language, 'Flange Width (B)', 'Flanş Genişliği (B)')} unit="mm" value={width} onChange={setWidth} color="#00e5ff" />
                                        <InputRow label={t12(language, 'Total Height (H)', 'Toplam Yükseklik (H)')} unit="mm" value={height} onChange={setHeight} color="#00e5ff" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputRow label={t12(language, 'Flange Thickness (tf)', 'Flanş Kalınlığı (tf)')} unit="mm" value={flangeT} onChange={setFlangeT} color="#f59e0b" />
                                        <InputRow label={t12(language, 'Web Thickness (tw)', 'Gövde Kalınlığı (tw)')} unit="mm" value={webT} onChange={setWebT} color="#f59e0b" />
                                    </div>
                                </>
                            )}

                            {shape === 'sigma' && (
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                        {t12(language, 'Standard Sigma Series', 'Standart Sigma Serisi')}
                                    </label>
                                    <select
                                        value={sigmaId}
                                        onChange={e => setSigmaId(e.target.value)}
                                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold outline-none"
                                    >
                                        {SIGMA_PROFILES.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.w}x{p.h} mm, {p.weight} kg/m)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <InputRow label={t12(language, 'Quantity / Order Amount', 'Adet / Sipariş Miktarı')} unit={t12(language, 'pcs', 'adet')} value={quantity} onChange={setQuantity} color="#10b981" />
                        </div>
                    </div>

                    {/* Production, Cost & Kerf */}
                    <div className="space-y-3 bg-[var(--bg-1)] border border-white/5 rounded-2xl p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                            <Gauge size={13} /> {t12(language, 'Production, Scrap & Pricing', 'İmalat, Fire & Fiyatlandırma')}
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t12(language, 'Cutting Method', 'Kesim Yöntemi')}</label>
                                <select
                                    value={cuttingMethod}
                                    onChange={e => setCuttingMethod(e.target.value as CuttingMethod)}
                                    className="w-full bg-[var(--bg-0)] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                                >
                                    {CUTTING_METHODS.map(c => (
                                        <option key={c.method} value={c.method}>
                                            {c.method} (Kerf {c.widthMm}mm)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <InputRow label={t12(language, 'Unit Price', 'Birim Fiyat')} unit="$/kg" value={pricePerKg} onChange={setPricePerKg} color="#10b981" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ RIGHT PANEL — CAD BLUEPRINT & STATS ═══ */}
            <div className="flex-1 flex flex-col h-auto xl:h-full overflow-hidden bg-[var(--bg-0)]">
                {/* Top Control Toolbar & KPI Cards */}
                        <div className="p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-0)]">
                            {/* View Switcher Controls */}
                            <div className="flex items-center gap-2">
                                <div className="flex bg-[var(--bg-1)] p-1 rounded-xl border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('2d')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                            viewMode === '2d'
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        2D CAD {t12(language, 'Section', 'Kesit')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('3d')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                            viewMode === '3d'
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        3D {t12(language, 'Isometric', 'İzometrik')}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowDimensions(!showDimensions)}
                                    className={`p-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                                        showDimensions
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                            : 'bg-white/5 text-slate-500 border-transparent'
                                    }`}
                                    title={t12(language, 'Show/Hide Dimensions', 'Ölçülendirmeleri Göster/Gizle')}
                                >
                                    <Eye size={15} />
                                </button>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={copySummary}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                                        copied
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy', 'Kopyala')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={addToProject}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <ShoppingCart size={14} /> {t12(language, 'Add to BOM', 'BOM Ekle')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <FileText size={14} /> PDF
                                </button>
                            </div>
                        </div>

                        {/* Center CAD Drawing Canvas */}
                        <div className="flex-1 min-h-[360px] max-h-[520px] relative p-3 border-b border-white/10 flex items-center justify-center">
                            <ProfileCADCanvas
                                shape={shape}
                                dimensions={{
                                    length,
                                    width,
                                    height,
                                    thickness,
                                    diameter,
                                    wallThickness,
                                    flangeW,
                                    webH,
                                    flangeT,
                                    webT,
                                    sigmaId,
                                }}
                                material={{
                                    category,
                                    name: material,
                                    density,
                                    basePrice: pricePerKg,
                                }}
                                viewMode={viewMode}
                                showDimensions={showDimensions}
                                showAxes={showAxes}
                            />
                        </div>

                        {/* Bottom Engineering KPIs & Result Cards */}
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 bg-[var(--bg-0)]">
                            <KpiCard label={t12(language, 'Weight per Meter', 'Metretül Ağırlığı')} val={`${result.display.massPerMeter} kg/m`} highlight color="#00e5ff" />
                            <KpiCard label={t12(language, `Net Weight (${quantity} pcs)`, `Net Ağırlık (${quantity} ad.)`)} val={`${result.display.netWeight} kg`} highlight color="#38bdf8" />
                            <KpiCard label={t12(language, 'Gross Order Weight', 'Brüt Sipariş Ağırlığı')} val={`${result.display.totalWeight} kg`} color="#f59e0b" />
                            <KpiCard label={t12(language, 'Estimated Total Cost', 'Tahmini Toplam Tutar')} val={`$${result.display.totalCost}`} highlight color="#10b981" />
                            <KpiCard label={t12(language, 'Cross Section Area (A)', 'Kesit Alanı (A)')} val={`${result.display.areaMm2} mm²`} color="#94a3b8" />
                            <KpiCard label={t12(language, 'Outer Surface Area', 'Dış Yüzey Alanı')} val={`${result.display.surfaceArea} m²`} color="#a855f7" />
                        </div>
            </div>

            <ReportSettingsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={generateEnterpriseReport}
                defaultTitle={t12(language, 'Profile Weight & Production Report', 'Profil Ağırlık & İmalat Raporu')}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function InputRow({
    label,
    unit,
    value,
    onChange,
    color,
}: {
    label: string;
    unit: string;
    value: number;
    onChange: (v: number) => void;
    color: string;
}) {
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-[9.5px] font-sans font-medium text-slate-400">{label}</span>
            </div>
            <div className="relative flex items-center bg-[var(--bg-0)] border border-white/10 rounded-lg overflow-hidden focus-within:border-cyan-500/50">
                <input
                    type="number"
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    step="any"
                    className="w-full bg-transparent text-xs font-mono font-bold px-2.5 py-1.5 text-white outline-none"
                />
                {unit && (
                    <div className="px-2.5 py-1 text-[9px] font-mono font-bold border-l border-white/5 bg-white/[0.02]">
                        <span style={{ color }}>{unit}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function KpiCard({
    label,
    val,
    highlight = false,
    color = '#f8fafc',
}: {
    label: string;
    val: string;
    highlight?: boolean;
    color?: string;
}) {
    return (
        <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
                highlight ? 'bg-cyan-500/5 border-cyan-500/25' : 'bg-[var(--bg-1)] border-white/5'
            }`}
        >
            <span className="text-[9px] font-sans font-medium text-slate-400">{label}</span>
            <span className="text-sm font-mono font-black mt-1" style={{ color }}>
                {val}
            </span>
        </div>
    );
}

