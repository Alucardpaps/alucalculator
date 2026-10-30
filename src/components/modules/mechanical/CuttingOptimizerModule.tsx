import { useState, useCallback, useEffect } from 'react';
import {
    Plus, Trash2, Calculator, Settings, RotateCcw, Copy, Code, Layers, FileCode,
    ChevronDown, Scissors, FileText, Sparkles, Download, CheckSquare, Square, Boxes, Save, RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { calculateNesting, type CutItem, type NestingResult, type NestingOptions } from '@/utils/nestingAlgorithm';
import { NestingVisualization } from '@/components/NestingVisualization';
import { generateGCodeToolpath, type CNCConfig } from './CamToolpathGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { drawApprovalBlock, drawBrandedFooters, drawBrandedHeader, pdfSafe } from '@/lib/report/pdfBranding';
import autoTable from 'jspdf-autotable';

import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { useDesignStore } from '@/design-studio/designStore';
import { useMissionStore } from '@/store/useMissionStore';
import { useCutStore } from '@/store/useCutStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { APP_RELEASE_NAME } from '@/config/app';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface PartRow { id: string; label: string; length: number; qty: number; }
interface RemnantRow { id: string; length: number; qty: number; }

const MATERIALS = [
    { id: 'al', label: 'Aluminum 6061', defaultStock: 6000, defaultKerf: 4, feed: 800, plunge: 300 },
    { id: 'st', label: 'Mild Steel', defaultStock: 6000, defaultKerf: 3, feed: 400, plunge: 150 },
    { id: 'wd', label: 'MDF / Wood', defaultStock: 2440, defaultKerf: 3.2, feed: 2000, plunge: 800 },
    { id: 'pl', label: 'Acrylic', defaultStock: 2000, defaultKerf: 2.5, feed: 1000, plunge: 400 },
];

export function CuttingOptimizerModule({ lang, dict }: { lang?: string, dict?: any }) {
  const precision = useGlobalPrecision();
    const storeLang = useI18nStore((s) => s.language);
    const activeLang = lang || storeLang || 'en';
    const { pendingParts, clearPendingParts } = useCutStore();
    const [parts, setParts] = useState<PartRow[]>([
        { id: generateId(), label: 'Part A', length: 500, qty: 5 },
        { id: generateId(), label: 'Part B', length: 800, qty: 3 },
        { id: generateId(), label: 'Part C', length: 300, qty: 8 },
    ]);
    const [remnants, setRemnants] = useState<RemnantRow[]>([]);
    const [minUsableWaste, setMinUsableWaste] = useState(300);
    const [checkedCuts, setCheckedCuts] = useState<Record<string, boolean>>({});

    // Automatically load cross-module pending cut parts if imported from 3D Assembly, 3D Design Studio, or 2D CAD
    useEffect(() => {
        if (pendingParts && pendingParts.length > 0) {
            setParts(pendingParts.map(p => ({
                id: p.id || generateId(),
                label: p.label || 'Extrusion Part',
                length: p.length,
                qty: p.qty,
            })));
        }
    }, [pendingParts]);
    const [materialId, setMaterialId] = useState('al');
    const [stockLength, setStockLength] = useState(6000);
    const [kerf, setKerf] = useState(4);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [algorithm, setAlgorithm] = useState<'bfd' | 'ffd'>('bfd');
    const [costPerBar, setCostPerBar] = useState(45);
    const [feedRate, setFeedRate] = useState(800);
    const [plungeRate, setPlungeRate] = useState(300);
    const [safeZ, setSafeZ] = useState(10);
    const [cutZ, setCutZ] = useState(-2);
    const [viewMode, setViewMode] = useState<'input' | 'result'>('input');
    const [resultTab, setResultTab] = useState<'nested' | 'checklist' | 'gcode'>('nested');
    const [result, setResult] = useState<NestingResult | null>(null);
    const [gcode, setGcode] = useState<string>('');
    const [expandedSection, setExpandedSection] = useState<string | null>('config');

    const handleMaterialChange = (matId: string) => { setMaterialId(matId); const mat = MATERIALS.find(m => m.id === matId); if (mat) { setStockLength(mat.defaultStock); setKerf(mat.defaultKerf); setFeedRate(mat.feed); setPlungeRate(mat.plunge); } };
    const addRow = useCallback(() => setParts(prev => [...prev, { id: generateId(), label: '', length: 0, qty: 1 }]), []);
    const removeRow = useCallback((id: string) => setParts(prev => prev.filter(p => p.id !== id)), []);
    const updateRow = useCallback((id: string, field: keyof PartRow, value: string | number) => setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p)), []);
    const duplicateRow = useCallback((id: string) => { setParts(prev => { const o = prev.find(p => p.id === id); return o ? [...prev, { ...o, id: generateId(), label: o.label + ' (Copy)' }] : prev; }); }, []);
    
    // Remnants Management
    const addRemnant = useCallback(() => setRemnants(prev => [...prev, { id: generateId(), length: 1500, qty: 1 }]), []);
    const removeRemnant = useCallback((id: string) => setRemnants(prev => prev.filter(r => r.id !== id)), []);
    const updateRemnant = useCallback((id: string, field: 'length' | 'qty', val: number) => setRemnants(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r)), []);

    const toggleCutCheck = (key: string) => {
        setCheckedCuts(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const resetAll = useCallback(() => {
        setParts([{ id: generateId(), label: '', length: 0, qty: 1 }]);
        setRemnants([]);
        setCheckedCuts({});
        setResult(null);
        setGcode('');
        setViewMode('input');
    }, []);

    const importFromAssembly = useCallback(() => {
        const componentsObj = useAssemblyStore.getState().components;
        const assemblyProfiles = Object.values(componentsObj).filter(c => c.type === 'profile');
        
        const designParts = useDesignStore.getState().parts;
        const cadProfiles = designParts.filter(p => 
            p.kind === 'I-beam' || p.kind === 'U-channel' || p.kind === 'L-bracket' || p.kind === 'T-beam' || p.kind === 'box' || (p.kind === 'profile' && p.solidOp === 'extrude')
        );

        if (assemblyProfiles.length === 0 && cadProfiles.length === 0) {
            alert('3D Montaj veya 3D CAD sahnesinde profil bulunamadı.');
            return;
        }

        // Group by length
        const groups: Record<number, number> = {};
        assemblyProfiles.forEach(p => {
            const len = p.metadata?.length || 500;
            groups[len] = (groups[len] || 0) + 1;
        });

        cadProfiles.forEach(p => {
            const len = p.params?.extrudeDepth || p.params?.depth || p.params?.length || (p.params?.height && p.params.height > 100 ? p.params.height : 500);
            groups[len] = (groups[len] || 0) + 1;
        });

        const newRows: PartRow[] = Object.entries(groups).map(([lenStr, qty]) => {
            const len = Number(lenStr);
            return {
                id: `profile-${len}-${generateId()}`,
                label: `Extrusion ${len}mm`,
                length: len,
                qty: qty
            };
        });

        setParts(newRows);
        const valid: CutItem[] = newRows.map(p => ({ id: p.id, label: p.label, length: p.length, qty: p.qty }));
        
        const flatRemnants: number[] = [];
        remnants.forEach(r => {
            for (let i = 0; i < r.qty; i++) flatRemnants.push(r.length);
        });

        const opts: NestingOptions = {
            algorithm,
            bladeWidth: kerf,
            remnants: flatRemnants,
            minUsableWaste,
            trimming: { start: trimStart, end: trimEnd }
        };
        const r = calculateNesting(valid, stockLength, opts);
        setResult(r);
        const cfg: CNCConfig = { feedRate, plungeRate, safeZ, cutZ, material: MATERIALS.find(m => m.id === materialId)?.label || 'Unknown', bladeWidth: kerf };
        setGcode(generateGCodeToolpath(r, cfg));
        setViewMode('result');
        setResultTab('nested');
    }, [algorithm, kerf, trimStart, trimEnd, stockLength, remnants, minUsableWaste, feedRate, plungeRate, safeZ, cutZ, materialId]);

    const calculate = useCallback(() => {
        const valid: CutItem[] = parts.filter(p => p.length > 0 && p.qty > 0).map(p => ({ id: p.id, label: p.label || `Part ${p.id.slice(0, 4)}`, length: p.length, qty: p.qty }));
        if (valid.length === 0) { setResult(null); return; }

        const flatRemnants: number[] = [];
        remnants.forEach(r => {
            for (let i = 0; i < r.qty; i++) flatRemnants.push(r.length);
        });

        const opts: NestingOptions = {
            algorithm,
            bladeWidth: kerf,
            remnants: flatRemnants,
            minUsableWaste,
            trimming: { start: trimStart, end: trimEnd }
        };
        const r = calculateNesting(valid, stockLength, opts);
        setResult(r);
        const cfg: CNCConfig = { feedRate, plungeRate, safeZ, cutZ, material: MATERIALS.find(m => m.id === materialId)?.label || 'Unknown', bladeWidth: kerf };
        const generatedGcode = generateGCodeToolpath(r, cfg);
        setGcode(generatedGcode);
        setViewMode('result');
        setResultTab('nested');

        useMissionStore.getState().reportModuleState('cutting', {
            hasCalculated: true,
            scrapPercent: r.totalWastePct,
            gcodeGenerated: Boolean(generatedGcode),
            barsUsed: r.patterns.length
        });
    }, [parts, remnants, minUsableWaste, stockLength, kerf, trimStart, trimEnd, algorithm, materialId, feedRate, plungeRate, safeZ, cutZ]);

    // Automatically calculate default parts on mount so initial view is populated with active engineering calculations
    useEffect(() => {
        calculate();
    }, [calculate]);

    const exportCSV = () => {
        if (!result) return;
        const rows: string[][] = [
            ['Stock Bar #', 'Stock Type', 'Bar Length (mm)', 'Cut Step', 'Part ID', 'Part Label', 'Length (mm)', 'Blade Kerf (mm)', 'Remaining Offcut (mm)', 'Offcut Classification']
        ];

        result.patterns.forEach((pat, barIdx) => {
            const isRemnant = pat.isRemnant ? 'REUSABLE REMNANT' : 'NEW STANDARD BAR';
            pat.cuts.forEach((cut, cutIdx) => {
                rows.push([
                    `Bar ${barIdx + 1}`,
                    isRemnant,
                    String(pat.stockLength),
                    String(cutIdx + 1),
                    cut.id,
                    cut.label || `Part ${cutIdx + 1}`,
                    String(cut.length),
                    String(kerf),
                    String(formatEngineeringValue(pat.waste, precision, false)),
                    pat.waste >= minUsableWaste ? 'REUSABLE REMNANT' : 'SCRAP'
                ]);
            });
        });

        const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `AluCAD_CutSchedule_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = () => {
        if (!result) return;
        const doc = new jsPDF();
        const mat = MATERIALS.find(m => m.id === materialId)?.label || 'Unknown';
        
        const y0 = drawBrandedHeader(doc, 'Cutting Optimizer Report', `${APP_RELEASE_NAME} | ${new Date().toLocaleString()}`);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('PRODUCTION SUMMARY', 14, y0 + 2);
        
        const summaryData = [
            ['Material', pdfSafe(mat)],
            ['Stock Length', `${stockLength} mm`],
            ['Blade Kerf', `${kerf} mm`],
            ['Efficiency', `${formatEngineeringValue((100 - result.totalWastePct), precision, false)}%`],
            ['Total Bars Used', String(result.totalStockUsed)],
            ['Total Waste', `${formatEngineeringValue(result.totalWaste, precision, false)} mm`],
            ['Total Cuts', String(result.stats.totalCuts)],
            ['Remnants Reused', String(result.patterns.filter(p => p.isRemnant).length)]
        ];

        autoTable(doc, {
            startY: y0 + 6,
            margin: { bottom: 18 },
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fillColor: [60, 64, 72] },
        });

        doc.text('CUTTING PATTERNS (BAR BY BAR)', 14, (doc as any).lastAutoTable.finalY + 12);
        
        const patternData = result.patterns.map((pat, i) => [
            `Bar ${i + 1} (${pat.isRemnant ? 'REMNANT' : 'NEW'})`,
            pat.cuts.map(c => c.length).join(' + '),
            `${formatEngineeringValue(pat.waste, precision, false)} mm`,
            pat.waste >= minUsableWaste ? 'REUSABLE' : 'SCRAP'
        ]);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 16,
            margin: { bottom: 18 },
            head: [['Stock Unit', 'Cuts (mm)', 'Waste (mm)', 'Offcut Type']],
            body: patternData,
            theme: 'grid',
            headStyles: { fillColor: [24, 110, 140] },
        });

        drawApprovalBlock(doc, (doc as any).lastAutoTable.finalY + 8, document.documentElement.lang);
        drawBrandedFooters(doc);
        doc.save(`AluCAD_OS_CutPlan_${new Date().getTime()}.pdf`);
    };

    const effectiveLength = stockLength - trimStart - trimEnd;
    const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[var(--bg-0)] text-white overflow-y-auto lg:overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/80 border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 ">
                                <Scissors size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-gray-100">{t12(activeLang, 'Cut Optimizer', 'Kesim Optimizatörü')}</h2>
                                <p className="text-[10px] text-cyan-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">{t12(activeLang, '1D Nesting & CAM', '1D Yerleşim & CAM')}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={resetAll} className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-gray-500 hover:text-white transition-all"><RotateCcw size={14} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    {/* Config */}
                    <PanelSection id="config" title={t12(activeLang, 'Stock Configuration', 'Profil Yapılandırması')} icon={<Settings size={14} />} isOpen={expandedSection === 'config'} onToggle={() => toggleSection('config')}>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {MATERIALS.map(mat => (
                                    <button key={mat.id} onClick={() => handleMaterialChange(mat.id)}
                                        className={`py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${materialId === mat.id ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'bg-white/[0.02] text-gray-600 border-white/5 hover:bg-white/[0.05]'}`}>
                                        {mat.label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                <button type="button" onClick={() => setAlgorithm('bfd')}
                                    className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${algorithm === 'bfd' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40' : 'bg-white/[0.02] text-gray-600 border-white/5'}`}>
                                    {t12(activeLang, 'BFD (Min Waste)', 'BFD (Min Fire)')}
                                </button>
                                <button type="button" onClick={() => setAlgorithm('ffd')}
                                    className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${algorithm === 'ffd' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40' : 'bg-white/[0.02] text-gray-600 border-white/5'}`}>
                                    {t12(activeLang, 'FFD (Fast)', 'FFD (Hızlı)')}
                                </button>
                            </div>
                            <PanelInput label={t12(activeLang, 'Cost / Bar', 'Profil Fiyatı')} unit="€" value={costPerBar} onChange={setCostPerBar} color="#00e5ff" />
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                <PanelInput label={t12(activeLang, 'Stock Length', 'Profil Boyu')} unit="mm" value={stockLength} onChange={setStockLength} color="#10b981" />
                                <PanelInput label={t12(activeLang, 'Blade Kerf', 'Testere Payı')} unit="mm" value={kerf} onChange={setKerf} color="#10b981" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <PanelInput label={t12(activeLang, 'Trim Start', 'Baş Kesim Payı')} unit="mm" value={trimStart} onChange={setTrimStart} color="#10b981" />
                                <PanelInput label={t12(activeLang, 'Trim End', 'Son Kesim Payı')} unit="mm" value={trimEnd} onChange={setTrimEnd} color="#10b981" />
                            </div>
                            <div className="bg-emerald-900/15 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] flex justify-between">
                                <span className="text-gray-500 font-bold uppercase tracking-widest">{t12(activeLang, 'Effective', 'Net Boy')}</span>
                                <span className="text-emerald-400 font-mono font-black">{effectiveLength} mm</span>
                            </div>
                        </div>
                    </PanelSection>

                    {/* Remnants & Offcuts Inventory */}
                    <PanelSection id="remnants" title={t12(activeLang, 'Remnant / Offcut Stock', 'Artık / Hurda Stok')} icon={<Boxes size={14} />} isOpen={expandedSection === 'remnants'} onToggle={() => toggleSection('remnants')}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                <span>{t12(activeLang, 'Existing Workshop Offcuts', 'Atölyedeki Mevcut Parçalar')}</span>
                                <button
                                    type="button"
                                    onClick={addRemnant}
                                    className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center gap-1 transition-all"
                                >
                                    <Plus size={11} /> {t12(activeLang, 'Add Remnant', 'Artık Parça Ekle')}
                                </button>
                            </div>

                            {remnants.length === 0 ? (
                                <div className="text-[10px] text-gray-600 italic bg-white/[0.01] p-2.5 rounded-lg border border-white/5 text-center">
                                    {t12(activeLang, 'No remnants configured. New standard bars will be used first.', 'Artık parça girilmedi. Yeni standart profiller kullanılacak.')}
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                                    {remnants.map((r) => (
                                        <div key={r.id} className="bg-[var(--bg-2)] border border-amber-500/20 rounded-xl p-2 flex items-center gap-2">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <PanelInput label={t12(activeLang, 'Length', 'Boy')} unit="mm" value={r.length} onChange={(v) => updateRemnant(r.id, 'length', v)} color="#f59e0b" />
                                                <PanelInput label={t12(activeLang, 'Qty', 'Adet')} unit="pcs" value={r.qty} onChange={(v) => updateRemnant(r.id, 'qty', v)} color="#f59e0b" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeRemnant(r.id)}
                                                className="p-1.5 text-gray-600 hover:text-rose-400 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-2 border-t border-white/5">
                                <PanelInput label={t12(activeLang, 'Min Usable Offcut', 'Min Yeniden Kullanılabilir Boy')} unit="mm" value={minUsableWaste} onChange={setMinUsableWaste} color="#00e5ff" />
                            </div>
                        </div>
                    </PanelSection>

                    {/* CAM */}
                    <PanelSection id="cam" title={t12(activeLang, 'CNC / Toolpath', 'CNC / Takım Yolu')} icon={<Code size={14} />} isOpen={expandedSection === 'cam'} onToggle={() => toggleSection('cam')}>
                        <div className="grid grid-cols-2 gap-3">
                            <PanelInput label={t12(activeLang, 'Feed Rate', 'İlerleme Hızı')} unit="mm/min" value={feedRate} onChange={setFeedRate} color="#f59e0b" />
                            <PanelInput label={t12(activeLang, 'Plunge Rate', 'Dalma Hızı')} unit="mm/min" value={plungeRate} onChange={setPlungeRate} color="#f59e0b" />
                            <PanelInput label={t12(activeLang, 'Safe Z', 'Güvenli Z')} unit="mm" value={safeZ} onChange={setSafeZ} color="#f59e0b" />
                            <PanelInput label={t12(activeLang, 'Cut Depth', 'Kesim Derinliği')} unit="mm" value={cutZ} onChange={setCutZ} color="#f59e0b" />
                        </div>
                    </PanelSection>

                    {/* Parts List */}
                    <div className="rounded-xl border border-white/5 bg-[var(--bg-1)]/60 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2.5 text-emerald-400"><Layers size={14} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">{t12(activeLang, 'Parts', 'Parçalar')}</span></div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={importFromAssembly}
                                    title="Import Extrusions from 3D Assembly"
                                    className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-wider transition-all border border-cyan-500/20 flex items-center gap-1 cursor-pointer"
                                >
                                    📥 {t12(activeLang, 'Import 3D', '3D İçe Aktar')}
                                </button>
                                <button onClick={addRow} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 cursor-pointer"><Plus size={14} /></button>
                            </div>
                        </div>
                        <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <AnimatePresence>
                                {parts.map((part, i) => (
                                    <motion.div key={part.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="bg-[var(--bg-2)] border border-white/5 rounded-xl p-3 group">
                                        <div className="flex gap-2 mb-2">
                                            <input type="text" value={part.label} placeholder={`${t12(activeLang, 'Part', 'Parça')} ${i + 1}`} onChange={(e) => updateRow(part.id, 'label', e.target.value)}
                                                className="flex-1 bg-transparent border-b border-white/5 text-xs font-bold text-white px-1 py-0.5 outline-none focus:border-emerald-500/40" />
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => duplicateRow(part.id)} className="p-1 text-gray-700 hover:text-emerald-400"><Copy size={12} /></button>
                                                <button onClick={() => removeRow(part.id)} className="p-1 text-gray-700 hover:text-red-400" disabled={parts.length <= 1}><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <PanelInput label={t12(activeLang, 'Length', 'Boy')} unit="mm" value={part.length} onChange={(v) => updateRow(part.id, 'length', v)} color="#10b981" />
                                            <PanelInput label={t12(activeLang, 'Qty', 'Adet')} unit="pcs" value={part.qty} onChange={(v) => updateRow(part.id, 'qty', v)} color="#10b981" />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Calculate */}
                    <button onClick={calculate} className="w-full py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                        <Calculator size={14} /> {t12(activeLang, 'Generate Plan & Toolpath', 'Plan & Takım Yolu Oluştur')}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 h-auto lg:h-full flex flex-col overflow-hidden min-w-0">
                <AnimatePresence mode="wait">
                    {(!result || viewMode === 'input') ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Scissors size={48} className="text-white/5 mx-auto mb-4" strokeWidth={1} />
                                <div className="text-sm text-gray-600 font-bold">{t12(activeLang, 'Configure parts and click Generate', 'Parçaları tanımlayın ve Oluştur\'a tıklayın')}</div>
                                <div className="text-[10px] text-gray-700 mt-1">{t12(activeLang, 'Results will appear here', 'Sonuçlar burada görüntülenecek')}</div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col overflow-hidden">
                            {/* KPI Header */}
                            <div className="flex-none px-8 pt-8 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 text-emerald-400/60 flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 " />
                                            {t12(activeLang, 'NESTING COMPLETE', 'YERLEŞİM TAMAMLANDI')} — {result.totalStockUsed} {t12(activeLang, 'BARS', 'PROFİL')}
                                        </div>
                                        <div className="flex items-baseline gap-6">
                                            <div className="flex flex-col items-center">
                                                <div className="text-[5rem] font-black tracking-tighter leading-none text-emerald-400" style={{ textShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
                                                    {(100 - result.totalWastePct).toFixed(1)}%
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{t12(activeLang, 'Efficiency', 'Verimlilik')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 text-right pt-2 items-end">
                                        <div className="flex flex-wrap gap-2 mb-4 justify-end">
                                            <button 
                                                onClick={exportCSV}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-400 transition-all shadow-lg "
                                                title={t12(activeLang, 'Export Cut List CSV for Workshop & Machines', 'Atölye ve Makineler için Kesim Listesi CSV İndir')}
                                            >
                                                <Download size={13} /> {t12(activeLang, 'Export CSV', 'CSV İndir')}
                                            </button>
                                            <button 
                                                onClick={generatePDF}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all shadow-lg "
                                            >
                                                <FileText size={13} /> {t12(activeLang, 'Export PDF', 'PDF İndir')}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <SideStat label={t12(activeLang, 'Est. Material Cost', 'Tahmini Profil Maliyeti')} value={`€${formatEngineeringValue((result.totalStockUsed * costPerBar), 2, false)}`} color="#00e5ff" />
                                            <SideStat label={t12(activeLang, 'Rating', 'Değerlendirme')} value={result.stats.efficiencyRating.toUpperCase()} color="#8b5cf6" />
                                            <SideStat label={t12(activeLang, 'Bars Used', 'Kullanılan Profil')} value={String(result.totalStockUsed)} color="#10b981" />
                                            <SideStat label={t12(activeLang, 'Total Waste', 'Toplam Fire')} value={`${formatEngineeringValue(result.totalWaste, precision, true)} mm`} color="#f59e0b" />
                                            <SideStat label={t12(activeLang, 'Total Cuts', 'Toplam Kesim')} value={String(result.stats.totalCuts)} color="#8b5cf6" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Switcher */}
                            <div className="flex-none mx-8 flex gap-4 border-b border-white/5 mb-2">
                                <button onClick={() => setResultTab('nested')} className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${resultTab === 'nested' ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-400'}`}>
                                    <span className="flex items-center gap-2"><Layers size={13} /> {t12(activeLang, 'Layout', 'Yerleşim Düzeni')}</span>
                                    {resultTab === 'nested' && <motion.div layoutId="cutTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400" />}
                                </button>
                                <button onClick={() => setResultTab('checklist')} className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${resultTab === 'checklist' ? 'text-cyan-400' : 'text-gray-600 hover:text-gray-400'}`}>
                                    <span className="flex items-center gap-2"><CheckSquare size={13} /> {t12(activeLang, 'Workshop Checklist', 'Atölye Takip Listesi')}</span>
                                    {resultTab === 'checklist' && <motion.div layoutId="cutTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400" />}
                                </button>
                                <button onClick={() => setResultTab('gcode')} className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${resultTab === 'gcode' ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}>
                                    <span className="flex items-center gap-2"><FileCode size={13} /> G-Code</span>
                                    {resultTab === 'gcode' && <motion.div layoutId="cutTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400" />}
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                                {resultTab === 'nested' && (
                                    <div className="space-y-4">
                                        <div className="rounded-xl overflow-hidden border border-white/5 bg-gradient-to-b from-[var(--bg-1)] to-black p-4 shadow-inner">
                                            <NestingVisualization result={result} compact={false} showLabels={true} bladeWidth={kerf} className="!bg-transparent !border-none !p-0" />
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                            {result.patterns.map((pat, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl border ${pat.isRemnant ? 'bg-[var(--bg-1)]/60 border-amber-500/30' : 'bg-[var(--bg-1)]/60 border-white/5'}`}>
                                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                                        <span className={`text-[10px] font-mono font-black tracking-widest ${pat.isRemnant ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                            {pat.isRemnant ? `${t12(activeLang, 'REMNANT', 'ARTIK')}-${idx + 1}` : `${t12(activeLang, 'STOCK', 'STANDART')}-${idx + 1}`} ({pat.stockLength}mm)
                                                        </span>
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                                            pat.waste >= minUsableWaste
                                                                ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
                                                                : 'text-amber-400 bg-amber-400/10'
                                                        }`}>
                                                            {formatEngineeringValue(pat.waste, precision, true)} mm {pat.waste >= minUsableWaste ? `(${t12(activeLang, 'Reusable', 'Yeniden Kullanılabilir')})` : `(${t12(activeLang, 'Scrap', 'Fire')})`}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {pat.cuts.map((cut, ci) => (
                                                            <span key={ci} className="px-2 py-1 bg-white/[0.03] border border-white/5 text-gray-300 rounded text-[9px] font-mono font-bold">
                                                                {cut.label ? `${cut.label}: ` : ''}{cut.length}mm
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {resultTab === 'checklist' && (
                                    <div className="space-y-3 font-mono text-xs">
                                        <div className="p-3 bg-black/40 border border-cyan-500/20 rounded-2xl flex items-center justify-between text-slate-400 text-xs">
                                            <span>{t12(activeLang, 'Workshop Saw Schedule & Checklist', 'Atölye Kesim Takip Listesi')}</span>
                                            <span className="text-cyan-300 font-bold">
                                                {Object.values(checkedCuts).filter(Boolean).length} / {result.stats.totalCuts} {t12(activeLang, 'Cuts Completed', 'Kesim Tamamlandı')}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {result.patterns.map((pat, pIdx) => (
                                                <div key={pIdx} className="p-4 rounded-2xl bg-[var(--bg-1)] border border-white/10 space-y-2">
                                                    <div className="flex justify-between items-center pb-2 border-b border-white/10 font-bold">
                                                        <span className={pat.isRemnant ? 'text-amber-400' : 'text-emerald-400'}>
                                                            {pat.isRemnant ? `🔧 ${t12(activeLang, 'Remnant Bar', 'Hurda/Artan Çubuk')} #${pIdx + 1}` : `📦 ${t12(activeLang, 'Standard Bar', 'Standart Profil')} #${pIdx + 1}`} ({pat.stockLength} mm)
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {t12(activeLang, 'Remaining Offcut:', 'Artan Kalan:')} <b className="text-white">{formatEngineeringValue(pat.waste, precision, true)} mm</b> {pat.waste >= minUsableWaste ? `♻️ (${t12(activeLang, 'Reusable', 'Yeniden Kullanılabilir')})` : `🗑️ (${t12(activeLang, 'Scrap', 'Fire')})`}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        {pat.cuts.map((cut, cIdx) => {
                                                            const itemKey = `${pIdx}-${cIdx}-${cut.id}`;
                                                            const isChecked = Boolean(checkedCuts[itemKey]);
                                                            return (
                                                                <div
                                                                    key={cIdx}
                                                                    onClick={() => toggleCutCheck(itemKey)}
                                                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                                        isChecked
                                                                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 opacity-60 line-through'
                                                                            : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {isChecked ? <CheckSquare size={16} className="text-emerald-400 shrink-0" /> : <Square size={16} className="text-slate-500 shrink-0" />}
                                                                        <span className="font-bold">
                                                                            {t12(activeLang, 'Step', 'Adım')} {cIdx + 1}: {cut.label || `${t12(activeLang, 'Part', 'Parça')} ${cut.id.slice(0, 5)}`}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                                                        {cut.length} mm
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {resultTab === 'gcode' && (
                                    <div className="rounded-xl overflow-hidden border border-white/5 bg-gradient-to-b from-[var(--bg-1)] to-black shadow-inner flex flex-col h-[500px]">
                                        <div className="flex justify-between items-center px-5 py-3 border-b border-white/5">
                                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2"><FileCode size={13} /> {t12(activeLang, 'Post-Processor Output', 'Post-Processor Çıktısı')}</div>
                                            <button onClick={() => navigator.clipboard.writeText(gcode)} className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg text-[9px] font-bold text-gray-400 hover:text-white transition-all flex items-center gap-1.5"><Copy size={11} /> {t12(activeLang, 'Copy', 'Kopyala')}</button>
                                        </div>
                                        <div className="flex-1 overflow-auto p-4">
                                            <pre className="text-[11px] font-mono leading-relaxed">{gcode.split('\n').map((line, i) => {
                                                let cls = 'text-gray-400';
                                                if (line.startsWith('(')) cls = 'text-gray-700 italic';
                                                else if (line.startsWith('G00')) cls = 'text-blue-400 font-bold';
                                                else if (line.startsWith('G01')) cls = 'text-emerald-400 font-bold';
                                                else if (line.startsWith('M')) cls = 'text-red-400 font-bold';
                                                else if (line.match(/[XYZF]/)) cls = 'text-amber-400';
                                                return <div key={i} className={cls}><span className="text-gray-800 select-none mr-4">{String(i + 1).padStart(4, '0')}</span>{line}</div>;
                                            })}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function SideStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (<div><div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div><div className="text-xl font-mono font-black" style={{ color }}>{value}</div></div>);
}

function PanelSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[var(--bg-1)]/60 overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2.5 text-emerald-400">{icon}<span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span></div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="text-gray-600" /></motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"><div className="px-4 pb-4 pt-1">{children}</div></motion.div>)}
            </AnimatePresence>
        </div>
    );
}

function PanelInput({ label, unit, value, onChange, color }: { label: string; unit: string; value: number; onChange: (v: number) => void; color: string }) {
    return (
        <div className="group">
            <div className="mb-1"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</span></div>
            <div className="relative flex items-center bg-[var(--bg-2)] border border-white/10 rounded-lg overflow-hidden transition-all group-focus-within:border-emerald-500/40 ">
                <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} step="any" className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none appearance-none" />
                {unit && <div className="px-2.5 text-[9px] font-bold text-gray-600 border-l border-white/5 bg-white/[0.02]"><span style={{ color }}>{unit}</span></div>}
            </div>
        </div>
    );
}
