import { useState, useMemo, useEffect } from 'react';
import { useCADCanvasStore } from '@/store/CADCanvasStore';
import { ShoppingCart, FileText, Plus, Layers, Scale, Box, CircleDot, ChevronDown, Gauge } from 'lucide-react';
import { MATERIALS_DB, getMaterialCategories, getMaterialsByCategory } from '@/data/materialsData';
import { CUTTING_METHODS, CuttingMethod, BASELINE_PRICES } from '@/data/productionParams';
import { useProjectStore } from '@/store/projectStore';
import { PDFReportEngine, ReportMetadata } from '@/lib/pdfReportEngine';
import { ReportSettingsModal } from '@/components/ui/ReportSettingsModal';
import { motion, AnimatePresence } from 'framer-motion';

type Shape = 'plate' | 'round' | 'tube' | 'hollow-rect' | 'angle' | 'channel' | 'i-beam' | 'hex';

const SHAPES: { id: Shape; label: string; icon: string }[] = [
    { id: 'plate', label: 'Plate', icon: '▬' },
    { id: 'round', label: 'Round', icon: '●' },
    { id: 'tube', label: 'Tube', icon: '◎' },
    { id: 'hollow-rect', label: 'Box', icon: '▢' },
    { id: 'angle', label: 'Angle', icon: '∟' },
    { id: 'channel', label: 'Channel', icon: '⊓' },
    { id: 'i-beam', label: 'I-Beam', icon: 'Ⅱ' },
    { id: 'hex', label: 'Hex', icon: '⬡' },
];

export default function ProfileWeightModule() {
    const { addShape } = useCADCanvasStore();
    const { addItem } = useProjectStore();

    const [shape, setShape] = useState<Shape>('plate');
    const [category, setCategory] = useState('Aluminum');
    const [material, setMaterial] = useState('6061-T6 (US Standard)');
    const [quantity, setQuantity] = useState(1);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>('dims');

    const [length, setLength] = useState(1000);
    const [width, setWidth] = useState(100);
    const [thickness, setThickness] = useState(10);
    const [diameter, setDiameter] = useState(50);
    const [wallThickness, setWallThickness] = useState(5);
    const [height, setHeight] = useState(100);
    const [flangeW, setFlangeW] = useState(50);
    const [webH, setWebH] = useState(100);
    const [flangeT, setFlangeT] = useState(8);
    const [webT, setWebT] = useState(6);

    const [cuttingMethod, setCuttingMethod] = useState<CuttingMethod>('Laser');
    const [nestingEfficiency, setNestingEfficiency] = useState(85);
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
    const density = materialData?.density || 2.7;

    const result = useMemo(() => {
        let netVolume = 0;
        switch (shape) {
            case 'plate': netVolume = length * width * thickness; break;
            case 'round': netVolume = Math.PI * Math.pow(diameter / 2, 2) * length; break;
            case 'tube': { const oR = diameter / 2; const iR = oR - wallThickness; netVolume = Math.PI * (oR * oR - iR * iR) * length; break; }
            case 'hollow-rect': netVolume = (width * height - (width - 2 * wallThickness) * (height - 2 * wallThickness)) * length; break;
            case 'angle': netVolume = (width * thickness + (height - thickness) * thickness) * length; break;
            case 'channel': netVolume = (width * thickness * 2 + (height - 2 * thickness) * thickness) * length; break;
            case 'i-beam': netVolume = (2 * flangeW * flangeT + (webH - 2 * flangeT) * webT) * length; break;
            case 'hex': netVolume = (3 * Math.sqrt(3) / 2) * Math.pow(diameter / 2, 2) * length; break;
        }

        const kerfSpec = CUTTING_METHODS.find(c => c.method === cuttingMethod);
        const kerfWidth = kerfSpec ? kerfSpec.widthMm : 0;
        let grossVolume = 0;
        if (shape === 'plate') {
            grossVolume = (length + kerfWidth) * (width + kerfWidth) * thickness;
        } else {
            grossVolume = (netVolume / length) * (length + kerfWidth);
        }

        const netWeightKg = (netVolume / 1000 * density) / 1000;
        const grossWeightKg = (grossVolume / 1000 * density) / 1000;
        const eff = Math.min(Math.max(nestingEfficiency, 10), 100) / 100;
        const materialConsumedKg = grossWeightKg / eff;
        const totalWeight = materialConsumedKg * quantity;
        const totalCost = totalWeight * pricePerKg;

        return {
            netWeightKg,
            totalWeightKg: materialConsumedKg,
            totalCost,
            display: {
                netWeight: (netWeightKg * quantity).toFixed(3),
                totalWeight: totalWeight.toFixed(3),
                totalCost: totalCost.toFixed(2),
                scrapWeight: ((materialConsumedKg - netWeightKg) * quantity).toFixed(3),
                scrapCost: ((materialConsumedKg - netWeightKg) * quantity * pricePerKg).toFixed(2),
                partCost: (netWeightKg * quantity * pricePerKg).toFixed(2)
            }
        };
    }, [shape, length, width, thickness, diameter, wallThickness, height, flangeW, webH, flangeT, webT, density, quantity, cuttingMethod, nestingEfficiency, pricePerKg]);

    const addToProject = () => {
        addItem({
            name: `${SHAPES.find(s => s.id === shape)?.label} ${width || diameter}x${height || thickness} L${length}`,
            category, material, quantity,
            weightPerUnit: result.totalWeightKg,
            costPerUnit: result.totalWeightKg * pricePerKg
        });
    };

    const exportToCAD = () => {
        const shapes: any[] = [];
        const createPolyline = (points: { x: number; y: number }[]) => ({
            type: 'polyline', points, style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' }, locked: false, visible: true, layer: 'profile'
        });
        switch (shape) {
            case 'plate': shapes.push({ type: 'rectangle', points: [{ x: -width / 2, y: -thickness / 2 }, { x: width / 2, y: thickness / 2 }], style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' }, visible: true, layer: 'profile' }); break;
            case 'round': shapes.push({ type: 'circle', points: [{ x: 0, y: 0 }, { x: diameter / 2, y: 0 }], style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' }, locked: false, visible: true, layer: 'profile' }); break;
            case 'angle': shapes.push(createPolyline([{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: thickness }, { x: thickness, y: thickness }, { x: thickness, y: height }, { x: 0, y: height }, { x: 0, y: 0 }])); break;
            default: break;
        }
        shapes.forEach(s => addShape(s));
    };

    const generateEnterpriseReport = async (metadata: ReportMetadata) => {
        const engine = new PDFReportEngine(metadata);
        let yPos = engine.addMetadataSection();
        yPos = engine.addKPIs([
            { label: "Material", value: material },
            { label: "Quantity", value: quantity.toString() },
            { label: "Total Cost", value: `$${result.totalCost.toFixed(2)}` }
        ], yPos);
        yPos = engine.addSectionTitle("Profile Parameters", yPos);
        engine.addTable({
            head: [["Parameter", "Value"]],
            body: [
                ["Shape", SHAPES.find(s => s.id === shape)?.label || shape],
                ["Length", `${length} mm`],
                ["Net Weight (ea)", `${result.netWeightKg.toFixed(3)} kg`],
                ["Gross Weight (ea)", `${result.totalWeightKg.toFixed(3)} kg`],
            ],
            startY: yPos
        });
        engine.save(`Profile_DataSheet_${metadata.referenceNo}.pdf`);
    };

    const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

    return (
        <div className="flex h-full bg-[#03060a] text-white overflow-hidden">
            {/* ═══ LEFT PANEL — Controls (38%) ═══ */}
            <div className="w-[38%] h-full flex flex-col bg-[#080d14]/80 border-r border-white/5 overflow-hidden">
                {/* Header */}
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                            <Scale size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-gray-100">Profile Weight</h2>
                            <p className="text-[10px] text-cyan-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">Mass & Cost Calculator</p>
                        </div>
                    </div>
                </div>

                {/* Shape Selector */}
                <div className="flex-none px-5 py-4 border-b border-white/5">
                    <div className="grid grid-cols-4 gap-2">
                        {SHAPES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setShape(s.id)}
                                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[9px] font-black uppercase transition-all duration-200
                                    ${shape === s.id
                                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                        : 'bg-white/[0.02] text-gray-600 border-white/5 hover:bg-white/[0.05] hover:text-gray-400'
                                    }`}
                            >
                                <span className="text-lg leading-none">{s.icon}</span>
                                <span className="tracking-widest">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Sections */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    {/* Material */}
                    <PanelSection id="material" title="Material" icon={<Layers size={14} />} isOpen={expandedSection === 'material'} onToggle={() => toggleSection('material')}>
                        <div className="space-y-3">
                            <PanelSelect label="Category" value={category} onChange={setCategory} options={categories.map(c => ({ value: c, label: c }))} />
                            <PanelSelect label="Alloy / Grade" value={material} onChange={setMaterial} options={availableMaterials.map(m => ({ value: m.name, label: m.name }))} />
                            <div className="flex items-center justify-between bg-cyan-900/15 border border-cyan-500/20 px-4 py-2.5 rounded-xl">
                                <span className="text-[10px] font-black tracking-widest uppercase text-cyan-300/70">Density</span>
                                <span className="text-lg font-black text-cyan-400 font-mono">{density.toFixed(3)} <span className="text-[10px] text-cyan-400/50">g/cm³</span></span>
                            </div>
                        </div>
                    </PanelSection>

                    {/* Dimensions */}
                    <PanelSection id="dims" title="Dimensions" icon={<Box size={14} />} isOpen={expandedSection === 'dims'} onToggle={() => toggleSection('dims')}>
                        <div className="space-y-3">
                            <PanelInput label="Length" unit="mm" value={length} onChange={setLength} color="#06b6d4" />
                            {shape === 'plate' && <>
                                <div className="grid grid-cols-2 gap-3">
                                    <PanelInput label="Width" unit="mm" value={width} onChange={setWidth} color="#06b6d4" />
                                    <PanelInput label="Thickness" unit="mm" value={thickness} onChange={setThickness} color="#06b6d4" />
                                </div>
                            </>}
                            {(shape === 'round' || shape === 'hex') && <PanelInput label="Diameter" unit="mm" value={diameter} onChange={setDiameter} color="#06b6d4" />}
                            {shape === 'tube' && <div className="grid grid-cols-2 gap-3">
                                <PanelInput label="Outer Ø" unit="mm" value={diameter} onChange={setDiameter} color="#06b6d4" />
                                <PanelInput label="Wall" unit="mm" value={wallThickness} onChange={setWallThickness} color="#06b6d4" />
                            </div>}
                            {shape === 'hollow-rect' && <>
                                <div className="grid grid-cols-2 gap-3">
                                    <PanelInput label="Width" unit="mm" value={width} onChange={setWidth} color="#06b6d4" />
                                    <PanelInput label="Height" unit="mm" value={height} onChange={setHeight} color="#06b6d4" />
                                </div>
                                <PanelInput label="Wall" unit="mm" value={wallThickness} onChange={setWallThickness} color="#06b6d4" />
                            </>}
                            {(shape === 'angle' || shape === 'channel') && <>
                                <div className="grid grid-cols-2 gap-3">
                                    <PanelInput label="Width" unit="mm" value={width} onChange={setWidth} color="#06b6d4" />
                                    <PanelInput label="Height" unit="mm" value={height} onChange={setHeight} color="#06b6d4" />
                                </div>
                                <PanelInput label="Thickness" unit="mm" value={thickness} onChange={setThickness} color="#06b6d4" />
                            </>}
                            {shape === 'i-beam' && <>
                                <div className="grid grid-cols-2 gap-3">
                                    <PanelInput label="Flange W" unit="mm" value={flangeW} onChange={setFlangeW} color="#06b6d4" />
                                    <PanelInput label="Web H" unit="mm" value={webH} onChange={setWebH} color="#06b6d4" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <PanelInput label="Flange T" unit="mm" value={flangeT} onChange={setFlangeT} color="#06b6d4" />
                                    <PanelInput label="Web T" unit="mm" value={webT} onChange={setWebT} color="#06b6d4" />
                                </div>
                            </>}
                            <PanelInput label="Quantity" unit="pcs" value={quantity} onChange={setQuantity} color="#f59e0b" />
                        </div>
                    </PanelSection>

                    {/* Production */}
                    <PanelSection id="production" title="Production" icon={<Gauge size={14} />} isOpen={expandedSection === 'production'} onToggle={() => toggleSection('production')}>
                        <div className="space-y-3">
                            <PanelSelect label="Cutting Method" value={cuttingMethod} onChange={(v) => setCuttingMethod(v as CuttingMethod)} options={CUTTING_METHODS.map(c => ({ value: c.method, label: `${c.method} (kerf ${c.widthMm}mm)` }))} />
                            <PanelInput label="Nesting Eff." unit="%" value={nestingEfficiency} onChange={setNestingEfficiency} color="#10b981" />
                            <PanelInput label="Price / kg" unit="$" value={pricePerKg} onChange={setPricePerKg} color="#f59e0b" />
                        </div>
                    </PanelSection>
                </div>
            </div>

            {/* ═══ RIGHT PANEL — Visualization & Results (62%) ═══ */}
            <div className="w-[62%] h-full flex flex-col overflow-hidden">
                {/* Giant KPI Header */}
                <div className="flex-none px-8 pt-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 text-cyan-400/60 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
                                {SHAPES.find(s => s.id === shape)?.label?.toUpperCase()} — {material}
                            </div>
                            <div className="flex items-baseline gap-8">
                                <div className="flex flex-col">
                                    <motion.div
                                        key={result.display.netWeight}
                                        initial={{ opacity: 0.5, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-[5.5rem] font-black italic tracking-tighter leading-none text-white"
                                        style={{ textShadow: '0 0 40px rgba(6,182,212,0.2)' }}
                                    >
                                        {result.display.netWeight}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Net Weight (kg)</span>
                                </div>
                            </div>
                        </div>

                        {/* Side Stats */}
                        <div className="flex flex-col gap-3 text-right pt-2">
                            <SideStat label="Total Material" value={`${result.display.totalWeight} kg`} color="#06b6d4" />
                            <SideStat label="Scrap Loss" value={`${result.display.scrapWeight} kg`} color="#ef4444" />
                            <SideStat label="Total Cost" value={`$${result.display.totalCost}`} color="#10b981" />
                            <SideStat label="Density" value={`${density.toFixed(3)} g/cm³`} color="#8b5cf6" />
                        </div>
                    </div>
                </div>

                {/* Cross-Section Visualization */}
                <div className="flex-1 relative mx-6 my-4 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-b from-[#0a1018] to-black shadow-inner">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    
                    <div className="absolute top-5 left-5 z-20 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                        <CircleDot size={14} className="text-cyan-500/30" /> CROSS-SECTION PREVIEW
                    </div>

                    <div className="w-full h-full flex items-center justify-center relative z-10 p-8">
                        <PremiumShapePreview shape={shape} w={width} h={height} t={thickness} d={diameter} wt={wallThickness} fW={flangeW} wH={webH} fT={flangeT} wT={webT} />
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex-none mx-6 mb-6 flex gap-3">
                    <button onClick={addToProject} className="flex-1 py-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                        <ShoppingCart size={14} /> Add to BOM
                    </button>
                    <button onClick={() => setIsReportModalOpen(true)} className="px-5 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-white/5 hover:border-white/10 font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all">
                        <FileText size={14} /> PDF
                    </button>
                    <button onClick={exportToCAD} className="px-5 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-white/5 hover:border-white/10 font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all">
                        <Plus size={14} /> CAD
                    </button>
                </div>
            </div>

            <ReportSettingsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={generateEnterpriseReport}
                defaultTitle="Material Profile Datasheet"
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SideStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div>
            <div className="text-xl font-mono font-black" style={{ color }}>{value}</div>
        </div>
    );
}

function PanelSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2.5 text-cyan-400">
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="text-gray-600" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PanelInput({ label, unit, value, onChange, color }: { label: string; unit: string; value: number; onChange: (v: number) => void; color: string }) {
    return (
        <div className="group">
            <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-white transition-colors">{label}</span>
            </div>
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-lg overflow-hidden transition-all duration-300 group-focus-within:border-cyan-500/40 group-focus-within:shadow-[0_0_15px_rgba(6,182,212,0.08)]">
                <input
                    type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} step="any"
                    className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none appearance-none"
                />
                {unit && (
                    <div className="px-3 text-[9px] font-bold text-gray-600 border-l border-white/5 bg-white/[0.02]">
                        <span style={{ color }}>{unit}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function PanelSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div className="group">
            <div className="mb-1.5"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</span></div>
            <select
                className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.08)] appearance-none cursor-pointer"
                value={value} onChange={(e) => onChange(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
                {options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0a1018]">{opt.label}</option>)}
            </select>
        </div>
    );
}

function PremiumShapePreview({ shape, w, h, t, d, wt, fW, wH, fT, wT }: any) {
    const stroke = '#06b6d4';
    const fill = 'rgba(6,182,212,0.08)';
    const dimLine = 'rgba(255,255,255,0.12)';
    const dimText = 'rgba(6,182,212,0.6)';

    return (
        <svg viewBox="0 0 300 200" className="w-full h-full max-w-[500px] max-h-[300px] profile-preview-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g transform="translate(150, 100)" filter="url(#glow)">
                {shape === 'plate' && <>
                    <rect x={-60} y={-8} width={120} height={16} fill={fill} stroke={stroke} strokeWidth="2" rx="1" />
                    <line x1={-60} y1={18} x2={60} y2={18} stroke={dimLine} strokeWidth="0.5" />
                    <text x={0} y={28} textAnchor="middle" fill={dimText} fontSize="9" fontFamily="monospace">{w} mm</text>
                    <line x1={68} y1={-8} x2={68} y2={8} stroke={dimLine} strokeWidth="0.5" />
                    <text x={78} y={4} fill={dimText} fontSize="9" fontFamily="monospace">{t}</text>
                </>}
                {shape === 'round' && <>
                    <circle r={40} fill={fill} stroke={stroke} strokeWidth="2" />
                    <line x1={0} y1={0} x2={40} y2={0} stroke={dimLine} strokeWidth="0.5" />
                    <text x={20} y={-6} textAnchor="middle" fill={dimText} fontSize="9" fontFamily="monospace">Ø{d}</text>
                    <circle r={2} fill={stroke} opacity="0.6" />
                </>}
                {shape === 'tube' && <>
                    <circle r={45} fill="none" stroke={stroke} strokeWidth="2" />
                    <circle r={35} fill="none" stroke={stroke} strokeWidth="1" opacity="0.4" />
                    <path d={`M 0 0 L 45 0`} stroke={dimLine} strokeWidth="0.5" />
                    <text x={22} y={-6} textAnchor="middle" fill={dimText} fontSize="9" fontFamily="monospace">Ø{d}</text>
                    <text x={40} y={14} textAnchor="middle" fill="rgba(239,68,68,0.5)" fontSize="8" fontFamily="monospace">t={wt}</text>
                    {/* Fill between circles to show wall */}
                    <circle r={45} fill={fill} />
                    <circle r={35} fill="#03060a" />
                </>}
                {shape === 'hollow-rect' && <>
                    <rect x={-50} y={-30} width={100} height={60} fill={fill} stroke={stroke} strokeWidth="2" rx="1" />
                    <rect x={-42} y={-22} width={84} height={44} fill="#03060a" stroke={stroke} strokeWidth="1" opacity="0.4" rx="1" />
                    <text x={0} y={44} textAnchor="middle" fill={dimText} fontSize="9" fontFamily="monospace">{w}×{h}</text>
                </>}
                {shape === 'angle' && <path d="M -40,-30 L -40,30 L 40,30 L 40,22 L -32,22 L -32,-30 Z" fill={fill} stroke={stroke} strokeWidth="2" />}
                {shape === 'channel' && <path d="M -40,-30 L 40,-30 L 40,-22 L -32,-22 L -32,22 L 40,22 L 40,30 L -40,30 Z" fill={fill} stroke={stroke} strokeWidth="2" />}
                {shape === 'i-beam' && <>
                    <rect x={-40} y={-40} width={80} height={10} fill={fill} stroke={stroke} strokeWidth="2" />
                    <rect x={-6} y={-30} width={12} height={60} fill={fill} stroke={stroke} strokeWidth="2" />
                    <rect x={-40} y={30} width={80} height={10} fill={fill} stroke={stroke} strokeWidth="2" />
                </>}
                {shape === 'hex' && <polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" fill={fill} stroke={stroke} strokeWidth="2" />}
            </g>
        </svg>
    );
}
